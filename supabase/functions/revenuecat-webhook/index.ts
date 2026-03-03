// @ts-nocheck
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req: Request) => {
    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        const body = await req.json();

        // RevenueCat sends the event data inside a top-level 'event' field
        const event = body.event;
        if (!event) {
            return new Response(JSON.stringify({ error: 'No event data found' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        }

        const userId = event.app_user_id;
        const type = event.type;

        console.log(`RevenueCat Webhook: ${type} for user ${userId}`);

        if (!userId) {
            return new Response(JSON.stringify({ error: 'No app_user_id found' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        }

        const supabaseAdmin = createClient(
            Deno.env.get('SUPABASE_URL')!,
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
        );

        // Determine the subscription tier based on the event type
        let tier: 'free' | 'premium' | null = null;

        const premiumEvents = [
            'INITIAL_PURCHASE',
            'RENEWAL',
            'UNCANCELLATION',
            'NON_RENEWING_PURCHASE',
            'SUBSCRIPTION_EXTENDED'
        ];

        const downgradeEvents = [
            'EXPIRATION',
            'CANCELLATION',
            'BILLING_ISSUE'
        ];

        if (premiumEvents.includes(type)) {
            tier = 'premium';
        } else if (downgradeEvents.includes(type)) {
            tier = 'free';
        }

        // If it's an event we care about, update the profile
        if (tier) {
            const { error: updateError } = await supabaseAdmin
                .from('profiles')
                .update({
                    subscription_tier: tier,
                    updated_at: new Date().toISOString()
                })
                .eq('id', userId);

            if (updateError) {
                console.error('Webhook database error:', updateError);
                return new Response(JSON.stringify({ error: 'Failed to update user profile' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
            }

            console.log(`Successfully updated user ${userId} to ${tier}`);
        } else {
            console.log(`Ignored event type: ${type}`);
        }

        return new Response(
            JSON.stringify({ success: true, event_type: type }),
            { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );

    } catch (err) {
        console.error('revenuecat-webhook error:', err);
        return new Response(
            JSON.stringify({ error: 'Internal server error', detail: String(err) }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }
});
