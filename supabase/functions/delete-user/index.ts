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
        // 1. Get user identity from the request token
        const authHeader = req.headers.get('Authorization');
        if (!authHeader) {
            return new Response(JSON.stringify({ error: 'No authorization header' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        }

        const supabase = createClient(
            Deno.env.get('SUPABASE_URL')!,
            Deno.env.get('SUPABASE_ANON_KEY')!,
            { global: { headers: { Authorization: authHeader } } }
        );

        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            return new Response(JSON.stringify({ error: 'Unauthorized', details: authError?.message }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        }

        // 2. Initialize admin client with service role
        const supabaseAdmin = createClient(
            Deno.env.get('SUPABASE_URL')!,
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
        );

        console.log(`Starting account deletion for user: ${user.id}`);

        // 3. Purge user data using the security definer RPC
        const { error: rpcError } = await supabaseAdmin.rpc('delete_own_account', { target_id: user.id });
        if (rpcError) {
            console.error('Data purge error:', rpcError);
            return new Response(JSON.stringify({ error: 'Failed to purge user data', detail: rpcError.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        }

        // 4. Delete the user from auth.users (requires service role)
        const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(user.id);
        if (deleteError) {
            console.error('Auth deletion error:', deleteError);
            return new Response(JSON.stringify({ error: 'Failed to delete authentication record', detail: deleteError.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        }

        console.log(`Successfully deleted account for user: ${user.id}`);

        return new Response(
            JSON.stringify({ success: true, message: 'Account permanently deleted' }),
            { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );

    } catch (err) {
        console.error('delete-user error:', err);
        return new Response(
            JSON.stringify({ error: 'Internal server error', detail: String(err) }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }
});
