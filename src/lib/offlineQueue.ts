import type { QueuedUpdate } from './types';

/**
 * The offline queue is the one piece of state that stays entirely local -
 * Supabase has no concept of "this browser is offline," so the client is
 * responsible for capturing the update durably (survives a reload) and
 * flushing it once connectivity returns.
 *
 * Each item's occurredAt is captured at tap-time. Correctness of the final
 * state does NOT depend on the order this queue is flushed in - Postgres
 * derives current status by occurred_at (see current_status view) - this
 * queue just guarantees the update isn't lost.
 */
const KEY = 'reflex_offline_queue';

function read(): QueuedUpdate[] {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as QueuedUpdate[]) : [];
  } catch {
    return [];
  }
}

function write(items: QueuedUpdate[]) {
  localStorage.setItem(KEY, JSON.stringify(items));
}

export const offlineQueue = {
  all(): QueuedUpdate[] {
    return read();
  },
  forRider(riderId: string): QueuedUpdate[] {
    return read().filter((q) => q.riderId === riderId);
  },
  add(item: QueuedUpdate) {
    write([...read(), item]);
  },
  remove(clientEventId: string) {
    write(read().filter((q) => q.clientEventId !== clientEventId));
  },
  removeMany(clientEventIds: string[]) {
    const set = new Set(clientEventIds);
    write(read().filter((q) => !set.has(q.clientEventId)));
  },
};
