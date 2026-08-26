export type Status = 'Open' | 'Assigned' | 'Picked Up' | 'Delivered';
export type ReflexRole = 'retailer' | 'dispatcher' | 'rider';

export const STATUS_ORDER: Status[] = ['Open', 'Assigned', 'Picked Up', 'Delivered'];

export interface Profile {
  id: string;
  role: ReflexRole;
  full_name: string;
  phone: string | null;
}

/** Mirrors public.delivery_requests_view - the derived-status view the app reads from. */
export interface DeliveryRequestRow {
  id: string;
  customer_name: string;
  phone: string;
  address: string;
  item: string;
  created_by: string;
  rider_id: string | null;
  rider_name: string | null;
  created_at: string;
  status: Status;
  status_since: string;
}

/** A status update captured on-device, queued locally until connectivity returns. */
export interface QueuedUpdate {
  clientEventId: string;
  requestId: string;
  status: Status;
  occurredAt: string; // ISO - captured at tap-time, not sync-time
  riderId: string;
  proofPath?: string; // storage path, set once the proof photo upload completes
}
