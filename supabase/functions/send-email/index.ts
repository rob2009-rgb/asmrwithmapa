import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        // Parse request body
        const { to, subject, body } = await req.json();
        if (!to || !subject || !body) {
            return new Response(
                JSON.stringify({ error: 'Missing required fields: to, subject, body' }),
                { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        // ── Fetch Resend API key from system_settings ───────────────────────
        // Uses the service role key auto-injected by Supabase into Edge Functions.
        const supabaseAdmin = createClient(
            Deno.env.get('SUPABASE_URL')!,
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
        );

        // First priority: env secret (set via `supabase secrets set RESEND_API_KEY=...`)
        let resendKey = Deno.env.get('RESEND_API_KEY');

        // Second priority: system_settings table (saved from Admin panel)
        if (!resendKey) {
            const { data, error } = await supabaseAdmin
                .from('system_settings')
                .select('value')
                .eq('key', 'resend_api_key')
                .single();

            if (error || !data?.value) {
                return new Response(
                    JSON.stringify({ error: 'Resend API key not configured. Add it in Admin → Settings or via supabase secrets set RESEND_API_KEY.' }),
                    { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
                );
            }
            resendKey = data.value;
        }

        // ── Send email via Resend API ────────────────────────────────────────
        const resendRes = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${resendKey}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                from: 'ASMR with MAPA <noreply@asmrwithmapa.com>',
                to: [to],
                subject,
                html: body,
            }),
        });

        const resendData = await resendRes.json();

        if (!resendRes.ok) {
            console.error('Resend error:', resendData);
            return new Response(
                JSON.stringify({ error: 'Failed to send email', detail: resendData }),
                { status: resendRes.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        return new Response(
            JSON.stringify({ success: true, id: resendData.id }),
            { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );

    } catch (err) {
        console.error('send-email error:', err);
        return new Response(
            JSON.stringify({ error: 'Internal server error', detail: String(err) }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }
});
