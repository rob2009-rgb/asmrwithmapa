/**
 * Shared email submission utility for the landing page.
 *
 * At build time, Vite replaces `import.meta.env.*` with actual values.
 * - In the standalone landing build (IONOS), VITE_LANDING_SUPABASE_URL is set
 *   → uses the dedicated landing Supabase project
 * - In the main app (no VITE_LANDING_SUPABASE_URL), falls back to a stub
 *   that the in-app LandingPage overrides via props.
 */
import { createClient, SupabaseClient } from '@supabase/supabase-js';

const LANDING_URL = import.meta.env.VITE_LANDING_SUPABASE_URL as string | undefined;
const LANDING_KEY = import.meta.env.VITE_LANDING_SUPABASE_ANON_KEY as string | undefined;

// Create a dedicated client only when the env vars are present (landing build)
export const landingDb = LANDING_URL && LANDING_KEY
    ? createClient(LANDING_URL, LANDING_KEY)
    : null;

/** Insert/upsert a subscriber email. Throws on failure. */
export async function submitSubscriber(
    email: string,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    db: SupabaseClient<any>,
    source = 'landing_page'
): Promise<void> {
    const { error } = await db.from('subscribers').upsert(
        { email, source, is_active: true },
        { onConflict: 'email' }
    );
    if (error) throw error;
}
