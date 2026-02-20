import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

/**
 * Edge Function to handle unsubscriptions.
 * Expects a GET request with a token.
 * GET /landing-unsubscribe?token=abc-123
 */
serve(async (req: Request) => {
    if (req.method === "OPTIONS") {
        return new Response("ok", { headers: corsHeaders });
    }

    const url = new URL(req.url);
    const token = url.searchParams.get("token");

    if (!token) {
        return new Response(
            JSON.stringify({ error: "Missing token" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    }

    const supabaseAdmin = createClient(
        Deno.env.get("SUPABASE_URL")!,
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Find the subscriber with this token
    const { data: subscriber, error: fetchError } = await supabaseAdmin
        .from("subscribers")
        .select("id, email")
        .eq("unsubscribe_token", token)
        .single();

    if (fetchError || !subscriber) {
        return new Response(
            JSON.stringify({ error: "Invalid or expired token" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    }

    // Set is_active to false
    const { error: updateError } = await supabaseAdmin
        .from("subscribers")
        .update({ is_active: false, unsubscribe_token: null }) // clear token once used
        .eq("id", subscriber.id);

    if (updateError) {
        return new Response(
            JSON.stringify({ error: "Failed to unsubscribe" }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    }

    return new Response(
        JSON.stringify({ success: true, email: subscriber.email }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
});
