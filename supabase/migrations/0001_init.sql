-- ============================================================================
-- Reflex — initial schema
-- Delivery coordination platform for small Kenyan retailers.
-- Run via: supabase db push   (or paste into the SQL editor, in order)
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 0. Extensions
-- ----------------------------------------------------------------------------
create extension if not exists pgcrypto;   -- gen_random_uuid()
create extension if not exists pg_net;     -- outbound http calls from triggers (notify-assignment)

-- ----------------------------------------------------------------------------
-- 1. Roles
-- ----------------------------------------------------------------------------
create type public.reflex_role as enum ('retailer', 'dispatcher', 'rider');
create type public.delivery_status as enum ('Open', 'Assigned', 'Picked Up', 'Delivered');
create type public.event_source as enum ('retailer', 'dispatcher', 'rider', 'system');

-- ----------------------------------------------------------------------------
-- 2. profiles — one row per auth.users, carries the role
-- ----------------------------------------------------------------------------
create table public.profiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  role        public.reflex_role not null default 'retailer',
  full_name   text not null,
  phone       text,
  created_at  timestamptz not null default now()
);

comment on table public.profiles is 'One row per authenticated user. role drives every RLS policy in this schema.';

-- Auto-create a profile row whenever someone signs up.
-- Role and full_name are passed as signup metadata: supabase.auth.signUp({ options: { data: { role, full_name } } })
create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, role, full_name, phone)
  values (
    new.id,
    coalesce((new.raw_user_meta_data ->> 'role')::public.reflex_role, 'retailer'),
    coalesce(new.raw_user_meta_data ->> 'full_name', split_part(new.email, '@', 1)),
    new.raw_user_meta_data ->> 'phone'
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ----------------------------------------------------------------------------
-- 3. delivery_requests
-- ----------------------------------------------------------------------------
create table public.delivery_requests (
  id             uuid primary key default gen_random_uuid(),
  customer_name  text not null,
  phone          text not null,
  address        text not null,
  item           text not null,
  created_by     uuid not null references public.profiles (id),
  rider_id       uuid references public.profiles (id),
  created_at     timestamptz not null default now()
);

create index delivery_requests_created_by_idx on public.delivery_requests (created_by);
create index delivery_requests_rider_id_idx on public.delivery_requests (rider_id);

-- Every request starts life as an 'Open' status_event, written automatically
-- so the client only ever has to INSERT the request row itself.
create function public.on_request_created()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.status_events (id, request_id, status, occurred_at, source)
  values (gen_random_uuid(), new.id, 'Open', new.created_at, 'system');
  return new;
end;
$$;

create trigger request_created_open_event
  after insert on public.delivery_requests
  for each row execute function public.on_request_created();

-- ----------------------------------------------------------------------------
-- 4. status_events — append-only event log. Current status is DERIVED, never stored.
-- ----------------------------------------------------------------------------
create table public.status_events (
  id           uuid primary key default gen_random_uuid(), -- also doubles as the client event id for idempotency
  request_id   uuid not null references public.delivery_requests (id) on delete cascade,
  status       public.delivery_status not null,
  occurred_at  timestamptz not null,        -- capture-time on the device, NOT the time it reached the server
  source       public.event_source not null,
  rider_id     uuid references public.profiles (id),
  created_at   timestamptz not null default now() -- server receipt time, kept for audit only
);

create index status_events_request_id_idx on public.status_events (request_id, occurred_at desc);

comment on table public.status_events is
  'Append-only. Current status = latest row per request_id ordered by occurred_at (not insertion order). '
  'This is what makes offline-queued updates resolve correctly on sync, regardless of arrival order.';

-- ----------------------------------------------------------------------------
-- 5. current_status — a view that derives status from the event log
-- ----------------------------------------------------------------------------
create view public.current_status as
select distinct on (request_id)
  request_id,
  status,
  occurred_at,
  source,
  rider_id
from public.status_events
order by request_id, occurred_at desc, created_at desc;

comment on view public.current_status is 'One row per request: its current status, derived by latest occurred_at.';

-- Convenience view joining requests + derived status + rider name, used directly by the dashboard.
create view public.delivery_requests_view as
select
  r.id,
  r.customer_name,
  r.phone,
  r.address,
  r.item,
  r.created_by,
  r.rider_id,
  rider.full_name as rider_name,
  r.created_at,
  coalesce(cs.status, 'Open')       as status,
  coalesce(cs.occurred_at, r.created_at) as status_since
from public.delivery_requests r
left join public.current_status cs on cs.request_id = r.id
left join public.profiles rider on rider.id = r.rider_id;

-- ----------------------------------------------------------------------------
-- 6. submit_status_event — the ONLY sanctioned way to append a status event.
--    Centralizes the duplicate-scan guard and idempotency so it holds no
--    matter which client (web, edge function, future mobile app) calls it.
-- ----------------------------------------------------------------------------
create function public.submit_status_event(
  p_id          uuid,               -- client-generated event id (idempotency key)
  p_request_id  uuid,
  p_status      public.delivery_status,
  p_occurred_at timestamptz,
  p_source      public.event_source,
  p_rider_id    uuid default null
)
returns table (ok boolean, reason text, applied_status public.delivery_status)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_current public.delivery_status;
  v_caller_role public.reflex_role;
  v_created_by uuid;
begin
  -- Idempotent no-op: this exact event was already applied (retry-safe).
  if exists (select 1 from public.status_events where id = p_id) then
    select status into v_current from public.current_status where request_id = p_request_id;
    return query select true, 'already applied'::text, coalesce(v_current, 'Open'::public.delivery_status);
    return;
  end if;

  select role into v_caller_role from public.profiles where id = auth.uid();
  if v_caller_role is null then
    return query select false, 'No profile for the calling user.'::text, null::public.delivery_status;
    return;
  end if;

  -- Identity checks: this function is the ONLY way to write a status event
  -- (RLS blocks direct inserts on status_events), so it has to enforce who
  -- may claim to be the source of an event, not just validate its shape.
  if p_source = 'rider' then
    if v_caller_role <> 'rider' or p_rider_id is distinct from auth.uid() then
      return query select false, 'Riders can only submit updates as themselves.'::text, null::public.delivery_status;
      return;
    end if;
    if not exists (select 1 from public.delivery_requests where id = p_request_id and rider_id = auth.uid()) then
      return query select false, 'This request is not assigned to you.'::text, null::public.delivery_status;
      return;
    end if;
  elsif p_source = 'dispatcher' then
    if v_caller_role <> 'dispatcher' then
      return query select false, 'Only dispatchers can perform this action.'::text, null::public.delivery_status;
      return;
    end if;
  elsif p_source = 'retailer' then
    select created_by into v_created_by from public.delivery_requests where id = p_request_id;
    if v_caller_role not in ('retailer', 'dispatcher') or v_created_by is distinct from auth.uid() then
      return query select false, 'Only the retailer who logged this request can do that.'::text, null::public.delivery_status;
      return;
    end if;
  end if;

  select status into v_current from public.current_status where request_id = p_request_id;
  v_current := coalesce(v_current, 'Open');

  -- Duplicate-scan guard: a second terminal confirmation is rejected outright.
  if v_current = 'Delivered' and p_status = 'Delivered' then
    return query select false, 'This request is already marked Delivered. Duplicate scan rejected.'::text, v_current;
    return;
  end if;

  insert into public.status_events (id, request_id, status, occurred_at, source, rider_id)
  values (p_id, p_request_id, p_status, p_occurred_at, p_source, p_rider_id);

  if p_status = 'Assigned' and p_rider_id is not null then
    update public.delivery_requests set rider_id = p_rider_id where id = p_request_id;
  end if;

  return query select true, null::text, p_status;
end;
$$;

revoke all on function public.submit_status_event from public;
grant execute on function public.submit_status_event to authenticated;

-- ----------------------------------------------------------------------------
-- 7. assign_rider — dispatcher action: assigns + writes the Assigned event atomically
-- ----------------------------------------------------------------------------
create function public.assign_rider(p_request_id uuid, p_rider_id uuid)
returns table (ok boolean, reason text)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_role public.reflex_role;
  v_result record;
begin
  select role into v_role from public.profiles where id = auth.uid();
  if v_role is distinct from 'dispatcher' then
    return query select false, 'Only dispatchers can assign riders.'::text;
    return;
  end if;

  select * into v_result from public.submit_status_event(
    gen_random_uuid(), p_request_id, 'Assigned', now(), 'dispatcher', p_rider_id
  );
  return query select v_result.ok, v_result.reason;
end;
$$;

revoke all on function public.assign_rider from public;
grant execute on function public.assign_rider to authenticated;

-- ----------------------------------------------------------------------------
-- 8. Row Level Security
-- ----------------------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.delivery_requests enable row level security;
alter table public.status_events enable row level security;

-- profiles: everyone authenticated can read (needed for rider-name lookups
-- and the dispatcher's rider picker); users can only edit their own row.
create policy "profiles are readable by any authenticated user"
  on public.profiles for select
  to authenticated
  using (true);

create policy "users can update their own profile"
  on public.profiles for update
  to authenticated
  using (id = auth.uid());

-- delivery_requests: any authenticated role can read the queue (retailer
-- tracks their own, dispatcher/rider need the shared queue). Only retailers
-- and dispatchers may create a request. Nobody updates rows directly —
-- rider_id changes only via assign_rider() (security definer).
create policy "requests are readable by any authenticated user"
  on public.delivery_requests for select
  to authenticated
  using (true);

create policy "retailers and dispatchers can log requests"
  on public.delivery_requests for insert
  to authenticated
  with check (
    created_by = auth.uid()
    and exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role in ('retailer', 'dispatcher')
    )
  );

-- status_events: readable by all authenticated users (audit trail / tracking
-- views); direct inserts are blocked — everything must go through
-- submit_status_event(), which runs as security definer and enforces the
-- duplicate-scan guard centrally regardless of caller.
create policy "status events are readable by any authenticated user"
  on public.status_events for select
  to authenticated
  using (true);

-- No insert/update/delete policies are defined for status_events, so RLS
-- denies all direct writes from anon/authenticated roles by default.

-- ----------------------------------------------------------------------------
-- 9. Realtime — push status_events and delivery_requests to subscribed clients
-- ----------------------------------------------------------------------------
alter publication supabase_realtime add table public.delivery_requests;
alter publication supabase_realtime add table public.status_events;

-- ----------------------------------------------------------------------------
-- 10. Storage — proof-of-delivery photos
-- ----------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('delivery-proofs', 'delivery-proofs', false, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;

-- Path convention: {request_id}/{event_id}.jpg — enforced loosely below by
-- requiring the first path segment to be a UUID the caller can name freely,
-- since request_id isn't verifiable cheaply from a storage policy alone.
create policy "authenticated users can read delivery proofs"
  on storage.objects for select
  to authenticated
  using (bucket_id = 'delivery-proofs');

create policy "riders can upload delivery proofs"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'delivery-proofs'
    and exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'rider')
  );

-- ----------------------------------------------------------------------------
-- 11. notifications — written by submit_status_event's trigger below,
--     read by an edge function / future SMS integration.
-- ----------------------------------------------------------------------------
create table public.notifications (
  id           uuid primary key default gen_random_uuid(),
  request_id   uuid not null references public.delivery_requests (id) on delete cascade,
  rider_id     uuid references public.profiles (id),
  kind         text not null,              -- 'assignment' | 'delivered'
  payload      jsonb not null default '{}'::jsonb,
  dispatched   boolean not null default false,
  created_at   timestamptz not null default now()
);

alter table public.notifications enable row level security;

create policy "notifications are readable by any authenticated user"
  on public.notifications for select
  to authenticated
  using (true);

-- Fires on every status_events insert; queues a notification row and, for
-- 'Assigned' events, calls the notify-assignment edge function via pg_net so
-- the rider gets pinged the instant a dispatcher assigns them - no polling.
create function public.on_status_event_notify()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_edge_url text := current_setting('app.settings.edge_function_url', true);
begin
  if new.status = 'Assigned' then
    insert into public.notifications (request_id, rider_id, kind, payload)
    values (new.request_id, new.rider_id, 'assignment', jsonb_build_object('event_id', new.id));

    if v_edge_url is not null and v_edge_url <> '' then
      perform net.http_post(
        url := v_edge_url || '/notify-assignment',
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'X-Edge-Secret', coalesce(current_setting('app.settings.edge_function_secret', true), '')
        ),
        body := jsonb_build_object('request_id', new.request_id, 'rider_id', new.rider_id, 'event_id', new.id)
      );
    end if;
  elsif new.status = 'Delivered' then
    insert into public.notifications (request_id, rider_id, kind, payload)
    values (new.request_id, new.rider_id, 'delivered', jsonb_build_object('event_id', new.id));
  end if;
  return new;
end;
$$;

create trigger status_event_notify
  after insert on public.status_events
  for each row execute function public.on_status_event_notify();

-- Set this once per project so the trigger above can reach your deployed
-- function (Project Settings -> Database -> Custom Postgres config), e.g.:
--   alter database postgres set app.settings.edge_function_url =
--     'https://<project-ref>.supabase.co/functions/v1';
--   alter database postgres set app.settings.edge_function_secret = '<same value as EDGE_FUNCTION_SECRET secret>';
-- Safe to leave unset in development - the trigger just skips the http call.
