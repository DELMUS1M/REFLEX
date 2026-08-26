import { useEffect, useState, useCallback } from 'react';
import { supabase } from './supabaseClient';
import { fetchRequests, fetchRiders } from './api';
import type { DeliveryRequestRow, Profile } from './types';

/**
 * Loads the request queue once, then subscribes to Postgres changes on
 * delivery_requests and status_events. Any insert/update on either table
 * triggers a refetch of the derived view - simpler and more robust than
 * hand-patching client-side state, and still push-based: no polling interval
 * anywhere in this hook.
 */
export function useLiveRequests() {
  const [requests, setRequests] = useState<DeliveryRequestRow[]>([]);
  const [riders, setRiders] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    try {
      const [reqs, riderList] = await Promise.all([fetchRequests(), fetchRiders()]);
      setRequests(reqs);
      setRiders(riderList);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load requests.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    reload();

    const channel = supabase
      .channel('reflex-requests')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'delivery_requests' }, () => reload())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'status_events' }, () => reload())
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [reload]);

  return { requests, riders, loading, error, reload };
}
