import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/** Beautiful HTML welcome email for landing page waitlist signups */
function buildWelcomeEmail(email: string): string {
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>You're on the list! ✨</title>
</head>
<body style="margin:0;padding:0;background:#020617;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">

  <!-- Wrapper -->
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#020617;padding:40px 16px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">

        <!-- Header gradient bar -->
        <tr>
          <td style="background:linear-gradient(135deg,#be185d 0%,#9333ea 100%);border-radius:20px 20px 0 0;padding:40px 40px 36px;text-align:center;">
            <!-- Logo mark -->
            <div style="width:52px;height:52px;background:rgba(255,255,255,0.15);border-radius:14px;display:inline-flex;align-items:center;justify-content:center;margin-bottom:20px;">
              <span style="font-size:24px;">🎧</span>
            </div>
            <div style="font-size:12px;font-weight:800;letter-spacing:4px;text-transform:uppercase;color:rgba(255,255,255,0.6);margin-bottom:10px;">ASMR with MAPA</div>
            <h1 style="margin:0;font-size:32px;font-weight:900;color:#ffffff;line-height:1.2;letter-spacing:-1px;">
              You're on the list! ✨
            </h1>
            <p style="margin:14px 0 0;color:rgba(255,255,255,0.75);font-size:16px;line-height:1.6;">
              Thank you for joining the waitlist, lovely! We can't wait to share something truly special with you.
            </p>
          </td>
        </tr>

        <!-- Main card -->
        <tr>
          <td style="background:#0f172a;padding:40px;border:1px solid #1e293b;border-top:none;">

            <!-- Warm intro -->
            <p style="margin:0 0 28px;font-size:16px;color:#94a3b8;line-height:1.7;">
              ASMR with MAPA is a sanctuary for your mind — AI-powered soundscapes, layered ASMR triggers, and immersive audio experiences crafted to help you sleep, focus, and find deep calm.
            </p>

            <!-- What's coming divider -->
            <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
              <tr>
                <td style="border-top:1px solid #1e293b;padding-top:28px;">
                  <div style="font-size:11px;font-weight:800;letter-spacing:3px;text-transform:uppercase;color:#db2777;margin-bottom:18px;">
                    What's waiting for you
                  </div>
                  <!-- Feature list -->
                  <table width="100%" cellpadding="0" cellspacing="0">
                    ${[
            ['🧠', 'AI Soundscapes', 'Tell MAPA how you feel — she curates a perfect layered soundscape in seconds.'],
            ['🌙', 'Zen Mode', 'Full-screen immersion with breathing timers, ambient visuals & sleep countdowns.'],
            ['👥', 'Listen Parties', 'Relax together with friends in a shared soundscape session, from anywhere.'],
            ['🏆', 'Exclusive Early Access', 'Waitlist members get first access and a free Pro trial on launch day.'],
        ].map(([icon, title, desc]) => `
                    <tr>
                      <td style="padding:10px 0;vertical-align:top;">
                        <table cellpadding="0" cellspacing="0"><tr>
                          <td style="width:40px;vertical-align:top;padding-top:2px;">
                            <span style="font-size:20px;">${icon}</span>
                          </td>
                          <td style="vertical-align:top;">
                            <div style="font-size:14px;font-weight:700;color:#f1f5f9;margin-bottom:3px;">${title}</div>
                            <div style="font-size:13px;color:#64748b;line-height:1.5;">${desc}</div>
                          </td>
                        </tr></table>
                      </td>
                    </tr>`).join('')}
                  </table>
                </td>
              </tr>
            </table>

            <!-- CTA button -->
            <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:32px;">
              <tr>
                <td align="center">
                  <a href="https://www.youtube.com/@asmrwithmapa/videos"
                     style="display:inline-block;background:linear-gradient(135deg,#ec4899,#a855f7);color:#ffffff;text-decoration:none;font-size:15px;font-weight:800;padding:14px 36px;border-radius:14px;letter-spacing:0.3px;">
                    Watch MAPA on YouTube 🎬
                  </a>
                </td>
              </tr>
            </table>

            <!-- Social links -->
            <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
              <tr>
                <td align="center" style="padding:20px;background:#020617;border-radius:14px;border:1px solid #1e293b;">
                  <div style="font-size:12px;color:#475569;margin-bottom:10px;font-weight:600;">Follow along for BTS &amp; early sneak peeks</div>
                  <a href="https://www.youtube.com/@asmrwithmapa" style="display:inline-block;margin:0 8px;background:#ef4444;color:#fff;text-decoration:none;font-size:12px;font-weight:700;padding:8px 18px;border-radius:8px;">▶ YouTube</a>
                  <a href="https://www.instagram.com/asmrwithmapa" style="display:inline-block;margin:0 8px;background:linear-gradient(135deg,#f43f5e,#ec4899,#a855f7);color:#fff;text-decoration:none;font-size:12px;font-weight:700;padding:8px 18px;border-radius:8px;">📷 Instagram</a>
                </td>
              </tr>
            </table>

            <!-- Closing note -->
            <p style="margin:0;font-size:14px;color:#64748b;line-height:1.7;text-align:center;">
              We'll be in touch soon with launch news — and maybe a little preview. 🌸<br/>
              Until then, rest well, breathe easy, and know that your sanctuary is almost ready.
            </p>

          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="background:#020617;border:1px solid #1e293b;border-top:none;border-radius:0 0 20px 20px;padding:24px 40px;text-align:center;">
            <p style="margin:0 0 6px;font-size:11px;color:#334155;line-height:1.6;">
              You received this because you joined the waitlist at <strong style="color:#475569;">asmrwithmapa.com</strong>
            </p>
            <p style="margin:0;font-size:11px;color:#1e293b;">
              © ${new Date().getFullYear()} ASMR with MAPA. Made with 💜
            </p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>

</body>
</html>`;
}

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        const { email } = await req.json();
        if (!email || typeof email !== 'string' || !email.includes('@')) {
            return new Response(
                JSON.stringify({ error: 'Valid email is required' }),
                { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        const supabaseAdmin = createClient(
            Deno.env.get('SUPABASE_URL')!,
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
        );

        // 1️⃣ Upsert subscriber
        const { error: subError } = await supabaseAdmin
            .from('subscribers')
            .upsert(
                { email: email.toLowerCase().trim(), source: 'landing_page', is_active: true },
                { onConflict: 'email' }
            );

        if (subError) {
            console.error('Subscriber upsert error:', subError);
            return new Response(
                JSON.stringify({ error: 'Failed to save subscriber', detail: subError.message }),
                { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        // 2️⃣ Fetch Resend API key
        let resendKey = Deno.env.get('RESEND_API_KEY');
        if (!resendKey) {
            const { data } = await supabaseAdmin
                .from('system_settings')
                .select('value')
                .eq('key', 'resend_api_key')
                .single();
            resendKey = data?.value ?? null;
        }

        // 3️⃣ Send welcome email (best-effort — don't fail the signup if email fails)
        if (resendKey) {
            const resendRes = await fetch('https://api.resend.com/emails', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${resendKey}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    from: 'MAPA ✨ <noreply@asmrwithmapa.com>',
                    to: [email],
                    subject: "You're on the list, lovely! ✨ — ASMR with MAPA",
                    html: buildWelcomeEmail(email),
                }),
            });

            if (!resendRes.ok) {
                const err = await resendRes.json();
                console.error('Resend error (non-fatal):', err);
            } else {
                const data = await resendRes.json();
                console.log('✅ Welcome email sent:', data.id);
            }
        } else {
            console.warn('No RESEND_API_KEY found — subscriber saved but welcome email skipped.');
        }

        return new Response(
            JSON.stringify({ success: true }),
            { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );

    } catch (err) {
        console.error('landing-subscribe error:', err);
        return new Response(
            JSON.stringify({ error: 'Internal server error', detail: String(err) }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }
});
