import { supabase } from './supabaseClient';
import type { DeliveryRequestRow, Profile, Status } from './types';

export async function fetchRequests(): Promise<DeliveryRequestRow[]> {
  const { data, error } = await supabase
    .from('delivery_requests_view')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data as DeliveryRequestRow[];
}

export async function fetchRiders(): Promise<Profile[]> {
  const { data, error } = await supabase.from('profiles').select('id, role, full_name, phone').eq('role', 'rider');
  if (error) throw error;
  return data as Profile[];
}

export interface NewRequestInput {
  customer_name: string;
  phone: string;
  address: string;
  item: string;
}

/** Inserting the row is all the client does - a Postgres trigger writes the
 *  opening 'Open' status_event automatically (see 0001_init.sql). */
export async function createRequest(input: NewRequestInput, createdBy: string) {
  const { data, error } = await supabase
    .from('delivery_requests')
    .insert({ ...input, created_by: createdBy })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function assignRider(requestId: string, riderId: string) {
  const { data, error } = await supabase.rpc('assign_rider', { p_request_id: requestId, p_rider_id: riderId });
  if (error) return { ok: false, reason: error.message };
  const row = data?.[0];
  return { ok: !!row?.ok, reason: row?.reason ?? null };
}

export interface SubmitStatusUpdateArgs {
  clientEventId: string;
  requestId: string;
  status: Status;
  occurredAt: string;
  riderId: string;
}

/** The online path - used directly when connected, and by the offline-queue
 *  flush's per-item fallback if the batch edge function is unreachable. */
export async function submitStatusEvent(args: SubmitStatusUpdateArgs) {
  const { data, error } = await supabase.rpc('submit_status_event', {
    p_id: args.clientEventId,
    p_request_id: args.requestId,
    p_status: args.status,
    p_occurred_at: args.occurredAt,
    p_source: 'rider',
    p_rider_id: args.riderId,
  });
  if (error) return { ok: false, reason: error.message };
  const row = data?.[0];
  return { ok: !!row?.ok, reason: row?.reason ?? null };
}

/** Batch flush via the sync-status-updates edge function - one round trip
 *  for the whole offline queue instead of one per item. */
export async function syncStatusUpdates(updates: SubmitStatusUpdateArgs[]) {
  const { data, error } = await supabase.functions.invoke<{
    results: { clientEventId: string; ok: boolean; reason: string | null }[];
  }>('sync-status-updates', {
    body: {
      updates: updates.map((u) => ({
        clientEventId: u.clientEventId,
        requestId: u.requestId,
        status: u.status,
        occurredAt: u.occurredAt,
        riderId: u.riderId,
      })),
    },
  });
  if (error) throw error;
  return data?.results ?? [];
}

export async function uploadDeliveryProof(requestId: string, eventId: string, file: File | Blob) {
  const path = `${requestId}/${eventId}.jpg`;
  const { error } = await supabase.storage.from('delivery-proofs').upload(path, file, {
    contentType: 'image/jpeg',
    upsert: false,
  });
  if (error) throw error;
  return path;
}

export async function getDeliveryProofUrl(path: string) {
  const { data, error } = await supabase.storage.from('delivery-proofs').createSignedUrl(path, 60 * 10);
  if (error) throw error;
  return data.signedUrl;
}
