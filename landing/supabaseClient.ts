/**
 * Standalone Supabase client for the landing page ONLY.
 *
 * This points to a SEPARATE Supabase project dedicated to waitlist/email capture.
 * It is intentionally independent from the main app's Supabase project so that:
 *  - Subscriber data stays clean and isolated
 *  - The landing site can go live before the main app is ready
 *  - When the app launches, we export subscribers as CSV and import into the main DB
 *
 * Environment variables (set in IONOS Deploy Now → Environment Variables):
 *   VITE_LANDING_SUPABASE_URL      — the URL of the landing-page Supabase project
 *   VITE_LANDING_SUPABASE_ANON_KEY — the anon/public key of that project
 */
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_LANDING_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_LANDING_SUPABASE_ANON_KEY as string;

if (!supabaseUrl || !supabaseAnonKey) {
    console.error(
        '[Landing] Missing Supabase env vars. ' +
        'Set VITE_LANDING_SUPABASE_URL and VITE_LANDING_SUPABASE_ANON_KEY.'
    );
}

export const landingSupabase = createClient(supabaseUrl, supabaseAnonKey);
