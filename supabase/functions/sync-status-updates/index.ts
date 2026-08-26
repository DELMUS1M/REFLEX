// supabase/functions/sync-status-updates/index.ts
//
// Batch-flushes a rider's offline update queue on reconnect.
//
// Each queued update was captured with its real occurred_at timestamp on the
// device the moment the rider tapped it, before signal was lost. This
// function replays them through submit_status_event() one at a time, in the
// order the rider tapped them - but the DUPLICATE-SCAN GUARD and CURRENT
// STATUS are still resolved by occurred_at inside Postgres, not by the order
// these calls land here. That's what keeps a rider's queue correct even if
// another screen already saw a newer event before this flush runs.
//
// Every item is applied through the same security-definer RPC the online
// path uses, so identity checks and the duplicate guard apply identically
// whether a rider is online or replaying a queue.

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders, handleOptions } from '../_shared/cors.ts';

interface QueuedUpdate {
  clientEventId: string;
  requestId: string;
  status: 'Open' | 'Assigned' | 'Picked Up' | 'Delivered';
  occurredAt: string; // ISO timestamp, captured at tap-time
  riderId: string;
}

interface SyncResult {
  clientEventId: string;
  ok: boolean;
  reason: string | null;
}

serve(async (req) => {
  const preflight = handleOptions(req);
  if (preflight) return preflight;

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing Authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } },
    );

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { updates } = (await req.json()) as { updates: QueuedUpdate[] };
    if (!Array.isArray(updates)) {
      return new Response(JSON.stringify({ error: '"updates" must be an array' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Sorting by occurred_at before replay is a belt-and-braces move -
    // correctness doesn't depend on it (Postgres re-derives status by
    // occurred_at regardless), but it keeps the applied order intuitive.
    const ordered = [...updates].sort(
      (a, b) => new Date(a.occurredAt).getTime() - new Date(b.occurredAt).getTime(),
    );

    const results: SyncResult[] = [];
    for (const item of ordered) {
      const { data, error } = await supabase.rpc('submit_status_event', {
        p_id: item.clientEventId,
        p_request_id: item.requestId,
        p_status: item.status,
        p_occurred_at: item.occurredAt,
        p_source: 'rider',
        p_rider_id: item.riderId,
      });

      if (error) {
        results.push({ clientEventId: item.clientEventId, ok: false, reason: error.message });
        continue;
      }
      const row = data?.[0];
      results.push({ clientEventId: item.clientEventId, ok: !!row?.ok, reason: row?.reason ?? null });
    }

    return new Response(JSON.stringify({ results }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
