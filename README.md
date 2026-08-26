# Reflex

Real-time delivery coordination for small Kenyan retailers — electronics shops,
pharmacies, hardware stores — who currently run deliveries over WhatsApp and
phone calls with no record of who's assigned, no status visibility, and no
proof of delivery.

Three roles, one shared truth:

- **Retailer staff** logs a delivery request (customer, phone, address, item).
- **Dispatcher** watches the live queue and assigns a rider.
- **Rider** works the job queue and confirms handoff by scan, even offline.

Backend is **Supabase**: Postgres + Auth + Realtime + Storage + Edge Functions.

## Setup

### 1. Create the Supabase project and run the migration

```bash
npm install -g supabase
supabase login
supabase link --project-ref <your-project-ref>
supabase db push          # applies supabase/migrations/0001_init.sql
```

The migration creates the schema, roles, RLS policies, the derived-status
view, the `submit_status_event` / `assign_rider` RPCs, enables Realtime on
`delivery_requests` and `status_events`, and creates the `delivery-proofs`
storage bucket.

### 2. Deploy the edge functions

```bash
supabase functions deploy sync-status-updates
supabase functions deploy notify-assignment --no-verify-jwt
```

`notify-assignment` is invoked server-to-server by a Postgres trigger (via
`pg_net`), not by a signed-in user, so it's deployed without JWT verification
and instead checks a shared secret header. Wire the two together once:

```sql
alter database postgres set app.settings.edge_function_url =
  'https://<project-ref>.supabase.co/functions/v1';
alter database postgres set app.settings.edge_function_secret = '<a random string>';
```

```bash
supabase secrets set EDGE_FUNCTION_SECRET=<the same random string>
```

(Optional, real SMS: set `AFRICASTALKING_API_KEY` / `AFRICASTALKING_USERNAME`
as secrets and uncomment the fetch call in
`supabase/functions/notify-assignment/index.ts` — Africa's Talking is the
common SMS gateway for Kenyan numbers.)

### 3. Configure the frontend

```bash
cp .env.example .env.local
# fill in VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY from
# Project Settings -> API in the Supabase dashboard
npm install
npm run dev
```

Sign up once as a dispatcher, once as a rider, and once as a retailer (three
different emails), then use the top nav to move between the flows the role
you're signed in as can reach.

## Data model

```
profiles            one row per auth user; role drives every RLS policy
delivery_requests    the request itself (customer, address, item, rider_id)
status_events        append-only log: every status change is its own row
current_status (view) latest status_events row per request, by occurred_at
delivery_requests_view (view) requests joined with derived status + rider name
notifications        queued for delivery by notify-assignment
```

**Status is derived, never stored as a column that gets overwritten.**
`current_status` picks the row with the latest `occurred_at` per request —
not the latest `created_at` (server receipt time). That distinction is what
makes an offline-queued update resolve correctly even if it reaches the
server after a screen has already seen a newer one: correctness follows when
the update happened on the rider's phone, not when it happened to arrive.

## Write path: `submit_status_event`

There are no client-side `insert`s into `status_events` — RLS denies them
outright. The only way to write one is the `submit_status_event(...)`
Postgres function (`security definer`), which in one place:

- checks the caller's `auth.uid()` against their claimed role and the
  request's assignment (a rider can only update jobs assigned to them; a
  dispatcher action requires the dispatcher role; etc.)
- rejects a second `Delivered` event for an already-delivered request instead
  of silently accepting it (the duplicate-scan guard)
- is idempotent on `p_id` (the client-generated event id), so a retried call
  never double-applies

Both the web app's direct RPC call (online path) and the
`sync-status-updates` edge function (offline-queue flush) go through this
same function, so the guard holds regardless of which path a rider was on.

## Realtime

The dashboard and tracking views don't poll. `useLiveRequests` subscribes to
Postgres changes on `delivery_requests` and `status_events` via Supabase
Realtime and refetches the derived view on any change — a dispatcher sees a
new request or a rider's status update within the same second it happens, on
every open tab.

## Offline rider queue

`src/lib/offlineQueue.ts` is the one piece of state that stays local — the
browser is what knows whether it's offline, not Supabase. A status update is
timestamped the moment the rider taps it; if offline, it's stored in
`localStorage` (survives a reload) instead of sent. On reconnect, the queue is
flushed in one round trip via the `sync-status-updates` edge function, which
replays each item through `submit_status_event` and reports back per-item
success. A retry-safe design throughout: the client-generated event id makes
re-flushing safe, and the guard/derivation logic lives in Postgres, not in
whichever client happens to sync first.

Use the **"Go offline"** control at the bottom of the Rider page to demo the
queue-and-sync flow without touching your real network.

## Storage: proof of delivery

Riders can optionally attach a photo when confirming a delivery scan. It
uploads to the private `delivery-proofs` bucket at
`{request_id}/{event_id}.jpg`, readable by any authenticated user and
writable only by riders (see the storage policies in the migration). Signed
URLs (`getDeliveryProofUrl`) are used for display rather than making the
bucket public.

**Known trade-off:** the photo can't be captured while offline — there's no
durable local file queue for it (only the status update itself is queued).
An offline "Delivered" scan applies the status without a photo.

## Stack

- Vite + React 19 + TypeScript, Tailwind CSS v4, React Router
- `@supabase/supabase-js` — auth, database queries, RPC calls, realtime
  channels, storage
- GSAP for the one reveal pattern used on the home page
- `lucide-react` for icons (SVG only, no emoji)

## Deploying

**Vercel:** import this repo directly — `vercel.json` handles SPA rewrites.
Add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` as environment
variables in the Vercel project settings (same values as `.env.local`).

```bash
npm run build   # outputs to dist/
```

## Project structure

```
supabase/
  migrations/0001_init.sql   schema, RLS, RPCs, realtime, storage bucket
  functions/
    sync-status-updates/     batch-flush a rider's offline queue
    notify-assignment/       DB-triggered rider notification (SMS stub)
src/
  lib/
    supabaseClient.ts         browser client
    api.ts                    typed query/RPC/storage/function wrappers
    auth.tsx                  session + profile context
    types.ts                  data model
    useLiveRequests.ts        fetch + realtime subscription hook
    offlineQueue.ts           durable local queue for rider updates
    connection.ts / useConnection.ts   online status + demo override
  components/
    StatusBadge.tsx           the one status badge, used everywhere
    ProtectedRoute.tsx
    Header.tsx
  pages/
    HomePage.tsx, LoginPage.tsx, SignupPage.tsx
    RetailerPage.tsx, DispatcherPage.tsx, RiderPage.tsx
```

## Accessibility

Checked against WCAG-aligned targets throughout: 4.5:1 text contrast, visible
focus rings (never removed), 44×44px minimum touch targets, `role="status"` +
`aria-atomic="true"` status badges with reserved layout width, and full
`prefers-reduced-motion` support.

## Other known trade-offs

- **Rider identity comes from auth**, not a picker — a rider only ever sees
  and updates jobs where `delivery_requests.rider_id` is their own
  `auth.uid()`. Simpler and more correct than the old mock's dropdown, but it
  means a dispatcher can't act "as" a rider for testing without a second
  login.
- **`delivery_requests` SELECT is open to any authenticated user** rather
  than scoped per-retailer, so the dispatcher/rider queues can read
  everything without a join through an "organization" table. Fine for a
  single-retailer pilot; a multi-tenant version would add an `org_id` and
  tighten this policy.
