// supabase/functions/notify-assignment/index.ts
//
// Called by the `status_event_notify` Postgres trigger (via pg_net) the
// instant a dispatcher assigns a request - not polled, pushed from the DB
// itself. Marks the corresponding notifications row dispatched and sends the
// rider a message.
//
// SMS is stubbed here: it logs what would be sent and marks the row
// dispatched. Wiring a real provider is a few lines - Africa's Talking is the
// common choice for Kenyan SMS delivery and is left as the documented
// extension point below, since it needs a paid account this build can't
// provision. Swap the sendSms() body for a real fetch() call to go live.
//
// Configure the trigger to reach this function by setting, once per project:
//   alter database postgres set app.settings.edge_function_url =
//     'https://<project-ref>.supabase.co/functions/v1';

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders, handleOptions } from '../_shared/cors.ts';

interface AssignmentPayload {
  request_id: string;
  rider_id: string;
  event_id: string;
}

async function sendSms(phone: string | null, message: string) {
  // --- Extension point -----------------------------------------------------
  // const res = await fetch('https://api.africastalking.com/version1/messaging', {
  //   method: 'POST',
  //   headers: {
  //     apiKey: Deno.env.get('AFRICASTALKING_API_KEY') ?? '',
  //     'Content-Type': 'application/x-www-form-urlencoded',
  //   },
  //   body: new URLSearchParams({
  //     username: Deno.env.get('AFRICASTALKING_USERNAME') ?? '',
  //     to: phone ?? '',
  //     message,
  //   }),
  // });
  // return res.ok;
  // ---------------------------------------------------------------------------
  console.log(`[stub sms] to=${phone ?? 'unknown'} :: ${message}`);
  return true;
}

serve(async (req) => {
  const preflight = handleOptions(req);
  if (preflight) return preflight;

  try {
    // This function is invoked server-to-server by the Postgres trigger, so
    // it uses the service role key (never shipped to the browser) rather
    // than a user JWT.
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    const payload = (await req.json()) as AssignmentPayload;

    // notify-assignment is invoked server-to-server by pg_net (no user JWT to
    // verify), so it's exposed with verify_jwt = false in config.toml. Guard
    // it with a shared secret instead so it can't be triggered by anyone who
    // finds the URL. Set with: supabase secrets set EDGE_FUNCTION_SECRET=...
    // and: alter database postgres set app.settings.edge_function_secret = '...';
    // then have the trigger send it as an X-Edge-Secret header.
    const expectedSecret = Deno.env.get('EDGE_FUNCTION_SECRET');
    if (expectedSecret && req.headers.get('X-Edge-Secret') !== expectedSecret) {
      return new Response(JSON.stringify({ ok: false, error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const [{ data: request }, { data: rider }] = await Promise.all([
      supabase.from('delivery_requests').select('customer_name, address, item').eq('id', payload.request_id).single(),
      supabase.from('profiles').select('full_name, phone').eq('id', payload.rider_id).single(),
    ]);

    const message = request
      ? `New job: ${request.item} to ${request.customer_name} at ${request.address}. Open Reflex to accept.`
      : 'New job assigned. Open Reflex for details.';

    await sendSms(rider?.phone ?? null, message);

    await supabase
      .from('notifications')
      .update({ dispatched: true })
      .eq('request_id', payload.request_id)
      .eq('kind', 'assignment')
      .eq('payload->>event_id', payload.event_id);

    return new Response(JSON.stringify({ ok: true, notified: rider?.full_name ?? payload.rider_id }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ ok: false, error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
