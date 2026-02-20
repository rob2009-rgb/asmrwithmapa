/**
 * Landing page subscriber submission.
 *
 * Calls the `landing-subscribe` Supabase Edge Function via plain fetch().
 * This avoids importing the Supabase client into the landing bundle
 * (which would throw "Missing Supabase URL or Anon Key" when those
 *  env vars aren't present).
 *
 * Required Cloudflare Pages env vars:
 *   VITE_SUPABASE_URL      — your Supabase project URL
 *   VITE_SUPABASE_ANON_KEY — your Supabase anon/public key
 */

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

// Not used in signing up — kept for backwards compat with in-app preview
export const landingDb = null;

/**
 * Submit a subscriber email.
 *  - In the standalone landing build: calls the Edge Function (DB insert + Resend welcome email)
 *  - Falls back to a direct DB insert if called from the in-app preview (db param provided)
 */
export async function submitSubscriber(
    email: string,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    db?: any | null,
    source = 'landing_page'
): Promise<void> {
    // In-app preview fallback: use the provided Supabase client directly
    if (db) {
        const { error } = await db.from('subscribers').upsert(
            { email, source, is_active: true },
            { onConflict: 'email' }
        );
        if (error) throw error;
        return;
    }

    // Standalone landing build: call the Edge Function
    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
        throw new Error('VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY must be set in Cloudflare Pages environment variables.');
    }

    const res = await fetch(`${SUPABASE_URL}/functions/v1/landing-subscribe`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'apikey': SUPABASE_ANON_KEY,
            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({ email, source }),
    });

    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error ?? `Subscription failed (${res.status})`);
    }
}
