-- ============================================================
-- Help Articles Seed Data
-- Run this AFTER the migration: 20260219223000_create_help_articles.sql
-- ============================================================

INSERT INTO public.help_articles (title, slug, content, category, is_published, tags) VALUES

-- ============================
-- CATEGORY: Audio & Playback
-- ============================
(
    'No Sound Playing – How to Fix',
    'no-sound-playing',
    'If you are not hearing any audio, try the following steps in order:

1. **Check your volume** – Make sure your device volume is turned up and not muted.
2. **Check the in-app volume slider** – The app has its own volume control. Look for the slider in the player at the bottom of the screen.
3. **Check your browser audio permissions** – Some browsers block auto-play audio. Click the lock icon in your browser address bar and allow audio for this site.
4. **Try a different browser** – Chrome and Firefox tend to have the best audio support.
5. **Disable browser extensions** – Ad blockers or audio modifiers can sometimes interfere. Try disabling them temporarily.
6. **Reload the page** – A simple refresh (Ctrl+R / Cmd+R) can resolve temporary glitches.
7. **Clear cache** – Go to your browser settings and clear cached data, then reload the app.

If none of these steps work, please open a support ticket and include your browser name, version, and operating system.',
    'Audio & Playback',
    true,
    ARRAY['sound', 'audio', 'no sound', 'muted', 'silence', 'playback']
),

(
    'Audio is Choppy or Keeps Buffering',
    'audio-choppy-buffering',
    'Choppy or buffered audio is typically caused by a slow or unstable internet connection. Here is how to fix it:

**Quick Fixes:**
- Move closer to your Wi-Fi router.
- Pause the audio, wait 10 seconds, then resume to allow buffering.
- Close other browser tabs or apps that may be using bandwidth (e.g. video streaming, large downloads).

**If the issue persists:**
- Switch from Wi-Fi to a wired (Ethernet) connection.
- Restart your router by unplugging it for 30 seconds.
- Try listening at a later time – the issue may be temporary server load.

**On mobile:**
- Ensure you have a strong cellular signal (4G/5G) or are connected to a reliable Wi-Fi network.
- Force-close the app and re-open it.

If buffering is consistent and happens across devices, please submit a support ticket so our team can investigate server-side issues in your region.',
    'Audio & Playback',
    true,
    ARRAY['buffering', 'choppy', 'lag', 'slow', 'loading', 'audio']
),

(
    'Sound is Playing Through Wrong Device (e.g. speakers instead of headphones)',
    'sound-wrong-output-device',
    'If audio is coming out of the wrong device, this is usually a system-level setting rather than an app issue.

**Windows:**
1. Right-click the speaker icon in the taskbar.
2. Select "Open Sound settings".
3. Under "Output", choose your preferred device (e.g. headphones).

**Mac:**
1. Open System Settings → Sound.
2. Under "Output", select your headphones or desired device.

**Mobile (iOS/Android):**
- Plug in headphones before opening the app; the OS should automatically switch.
- If using Bluetooth headphones, ensure they are connected in your settings before starting playback.

**In-Browser:**
- Chrome allows per-tab audio device selection. Right-click the tab and look for "Mute site" or use the system output selector.

This setting is managed by your operating system and cannot be changed within the app itself.',
    'Audio & Playback',
    true,
    ARRAY['headphones', 'speakers', 'output', 'audio device', 'bluetooth']
),

-- ============================
-- CATEGORY: Account & Login
-- ============================
(
    'I Can''t Log In to My Account',
    'cant-log-in',
    'If you are having trouble logging in, follow these steps:

**Step 1: Check your credentials**
- Make sure Caps Lock is not on.
- Double-check you are using the correct email address.
- Passwords are case-sensitive.

**Step 2: Reset your password**
1. Click "Forgot Password" on the login screen.
2. Enter your email address.
3. Check your inbox (and spam folder) for a reset link.
4. Click the link and set a new password.

**Step 3: Check for account issues**
- Your account may have been deactivated. Check your email for any communications from us.
- If you signed up using Google or another provider, try using that login method instead.

**Still locked out?**
Submit a support ticket with your email address and we will help you regain access. Do NOT share your password with us – we will never ask for it.',
    'Account & Login',
    true,
    ARRAY['login', 'sign in', 'password', 'access', 'locked out', 'forgot password']
),

(
    'How to Reset Your Password',
    'reset-password',
    'You can reset your password from both the login screen and within your account settings.

**From the Login Screen:**
1. Click "Forgot Password?" below the login button.
2. Enter the email address associated with your account.
3. Click "Send Reset Link".
4. Check your email inbox (and spam/junk folder).
5. Click the reset link in the email – it expires after 1 hour.
6. Enter and confirm your new password.

**From Account Settings (if already logged in):**
1. Open your Profile (top right avatar).
2. Go to "My Account" → "Security Settings".
3. Enter your current password, then your new password twice.
4. Click "Update Password".

**Password Requirements:**
- Minimum 8 characters
- At least one uppercase letter
- At least one number or special character

If you do not receive the reset email within 5 minutes, check your spam folder or try again. Ensure you are using the correct email address.',
    'Account & Login',
    true,
    ARRAY['password', 'reset', 'forgot', 'change password', 'security']
),

(
    'How to Delete Your Account',
    'delete-account',
    'We are sorry to see you go! If you would like to delete your account, please follow these steps:

**Important:** Account deletion is permanent. All your data, saved preferences, and subscription will be removed and cannot be recovered.

**To request account deletion:**
1. Open your Profile → "My Account".
2. Scroll to the bottom of the page.
3. Click "Delete Account".
4. Confirm via the email we will send you.

**If you can''t find the option:**
Submit a support ticket with the subject "Account Deletion Request" and include the email address on your account. We will process this within 5 business days.

**Note:** If you have an active subscription, please cancel it first to avoid further charges. Deleting your account does NOT automatically cancel a subscription billing through a third party (e.g. Stripe).',
    'Account & Login',
    true,
    ARRAY['delete account', 'close account', 'remove account', 'GDPR', 'data removal']
),

-- ============================
-- CATEGORY: Billing & Subscriptions
-- ============================
(
    'Why Was I Charged Twice?',
    'charged-twice',
    'Seeing a duplicate charge can be alarming. Here is what may have happened and how to resolve it:

**Common Reasons:**
- **Trial to Paid Transition:** If you had a free trial, the first charge occurs when the trial ends. If you also manually upgraded, this can result in two charges.
- **Currency Conversion Hold:** Your bank may show a temporary authorization hold alongside the actual charge. These typically disappear within 3–5 business days.
- **Multiple Accounts:** You may have subscribed on two separate accounts using different emails.

**What to Do:**
1. Check both charges – look at the transaction dates and amounts. Are they identical?
2. Log in and go to Profile → Billing to review your subscription history.
3. If you believe it is a genuine duplicate, submit a support ticket with:
   - The last 4 digits of the card charged
   - The transaction dates and amounts
   - Your account email

We will investigate and issue a refund if a duplicate charge is confirmed. Refunds typically appear within 5–10 business days.',
    'Billing & Subscriptions',
    true,
    ARRAY['charge', 'billing', 'duplicate', 'refund', 'payment', 'twice']
),

(
    'How to Cancel Your Subscription',
    'cancel-subscription',
    'You can cancel your subscription at any time. Cancellation takes effect at the end of your current billing period.

**To Cancel:**
1. Open your Profile → "My Account" → "Membership Status".
2. Click "Manage Subscription".
3. Follow the prompts to cancel.

**What Happens After Cancellation:**
- You will retain Premium access until the end of the current billing period.
- You will NOT be charged again after that date.
- Your account will revert to the Free plan automatically.
- Your data and saved content remain in your account.

**Annual Plans:**
If you are on an annual plan, cancellation stops auto-renewal but you will not receive a prorated refund for unused months (unless cancelling within 14 days of purchase).

**If you subscribed via App Store (iOS/Google Play):**
You must cancel directly through the App Store settings – we cannot cancel it on your behalf.

For any billing questions, submit a support ticket and our team will assist you.',
    'Billing & Subscriptions',
    true,
    ARRAY['cancel', 'subscription', 'unsubscribe', 'stop billing', 'refund']
),

(
    'My Premium Features Are Not Unlocking After Payment',
    'premium-not-unlocking',
    'If you have paid but Premium features still appear locked, try the following:

**Step 1: Sign Out and Back In**
Sometimes the subscription status needs to be refreshed. Sign out and back in to your account.

**Step 2: Wait a Few Minutes**
Payment processing can occasionally take 2–5 minutes to reflect in our system.

**Step 3: Check Your Email**
- Confirm you received a payment confirmation email.
- Ensure you are logged into the same account that was used for payment.

**Step 4: Hard Refresh**
Press Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac) to force a full page reload.

**If the issue persists:**
Submit a support ticket and include:
- Your account email
- The date and amount of the charge
- A screenshot of the payment confirmation (from your bank or our email)

We will manually verify and activate your subscription within 1 business day.',
    'Billing & Subscriptions',
    true,
    ARRAY['premium', 'unlock', 'subscription', 'features', 'payment', 'pro']
),

-- ============================
-- CATEGORY: App Features
-- ============================
(
    'What Is the Mind Vault?',
    'what-is-mind-vault',
    'The **Mind Vault** is your private, encrypted journaling space within the app. Think of it as a personal diary that lives right alongside your ASMR listening experience.

**Key Features:**
- 🔒 **Private & Encrypted** – Entries are stored locally and are only accessible to you.
- 📝 **Rich Text Notes** – Write freely formatted journal entries.
- 🏷️ **Tagging** – Organise entries by mood, session, or topic.
- 🔍 **Search** – Quickly find past entries.

**How to Access:**
1. Open your Profile (top-right avatar).
2. Select the "Mind Vault" tab in the sidebar.

**Premium Feature:**
The Mind Vault is available to **Premium members**. Free users can preview the feature but cannot save entries. [Upgrade to Premium](#) to unlock unlimited journaling.

**Data Privacy:**
Vault data is encrypted and never shared. Even our team cannot read your entries. Clearing your browser cache or local storage will delete local vault data – please export regularly if needed.',
    'App Features',
    true,
    ARRAY['mind vault', 'journal', 'notes', 'privacy', 'encrypted', 'premium']
),

(
    'How Do Listen Parties Work?',
    'how-listen-parties-work',
    'Listen Parties let you sync your ASMR session with friends and listen together in real-time, even if you are miles apart.

**How to Start a Listen Party:**
1. Select a sound from the library.
2. Click the **Listen Party** icon (headphones with a + icon) in the player.
3. A unique party link will be generated – share this with friends.
4. When they click the link, they will join your session automatically.

**How It Works:**
- All participants hear the same sound, perfectly synchronized.
- The host controls playback (play, pause, switch sounds).
- Participants can see who else is in the party via the live listener count.

**Requirements:**
- Listen Parties require a **Premium membership** for the host.
- Guests can join with a free account.
- All participants need a stable internet connection for best sync.

**Troubleshooting Sync Issues:**
If participants are out of sync, the host should pause and resume playback. This re-syncs all listeners.',
    'App Features',
    true,
    ARRAY['listen party', 'group listen', 'sync', 'friends', 'share', 'multiplayer']
),

-- ============================
-- CATEGORY: Technical Issues
-- ============================
(
    'App is Showing a Blank White Screen',
    'blank-white-screen',
    'A blank white screen usually indicates a JavaScript error or a failed resource load. Here is how to fix it:

**Quick Fixes (try in order):**
1. **Hard Refresh:** Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac).
2. **Clear Browser Cache:** Go to browser settings → Privacy → Clear browsing data. Select "Cached images and files".
3. **Disable Extensions:** Try opening the app in an Incognito/Private window. If it works, a browser extension is the cause. Disable extensions one by one to find the culprit.
4. **Try a Different Browser:** We recommend Chrome or Firefox.
5. **Check Network:** Ensure you are online and your connection is stable.

**Check the Browser Console:**
1. Press F12 to open DevTools.
2. Click the "Console" tab.
3. Look for red error messages.
4. If you see errors, please include them in your support ticket – they help us diagnose the issue quickly.

**Report the Issue:**
If none of the above works, submit a support ticket with:
- Your browser name and version
- Your operating system
- Any console errors you noticed',
    'Technical Issues',
    true,
    ARRAY['blank screen', 'white screen', 'loading', 'crash', 'broken', 'not loading']
),

(
    'I''m Getting a "Something Went Wrong" Error',
    'something-went-wrong-error',
    'This generic error message typically means the app encountered an unexpected problem communicating with our servers.

**What to Try First:**
1. **Wait and Reload** – The issue may be temporary. Wait 30 seconds and refresh the page.
2. **Check Our Status** – We may be experiencing a service interruption. Check our status page or social media for announcements.
3. **Sign Out and Back In** – Your session may have expired.
4. **Clear Cookies and Cache** – Browser settings → Privacy → Clear browsing data (select cookies and cache).

**Common Triggers:**
- *During login:* Incorrect credentials or an expired session.
- *When creating a ticket:* Missing required fields (subject or message).
- *During payment:* Invalid card details or a declined transaction.
- *When loading sounds:* A temporary CDN or content delivery issue.

**Still Seeing the Error?**
Submit a support ticket describing:
- What you were doing when the error appeared
- The exact error message (if different from "Something Went Wrong")
- The time it occurred (we can check server logs)',
    'Technical Issues',
    true,
    ARRAY['error', 'something went wrong', 'crash', '500', 'server error', 'unexpected']
),

(
    'App is Very Slow or Unresponsive',
    'app-slow-unresponsive',
    'If the app is feeling sluggish, here are some common causes and solutions:

**Browser Performance:**
- **Too many open tabs:** Close unused tabs to free up memory.
- **Outdated browser:** Update your browser to the latest version.
- **Low device memory:** Restart your device to clear RAM.

**Network Performance:**
- Run a speed test (speedtest.net) – you need at least 5 Mbps for smooth streaming.
- If on Wi-Fi, try moving closer to the router.

**App-Specific Fixes:**
1. Hard-refresh the page (Ctrl+Shift+R).
2. Clear the cache (browser settings → clear cached data).
3. Try Incognito mode – this disables extensions that may slow down the page.

**High CPU Usage:**
Some ASMR visualizations are GPU/CPU intensive. If your device is older:
- Disable visual effects in the app settings (if available).
- Close background applications.

If the app feels consistently slow regardless of these steps, please submit a support ticket and mention your device specs (approximate) and browser version.',
    'Technical Issues',
    true,
    ARRAY['slow', 'unresponsive', 'lag', 'performance', 'freeze', 'loading']
),

-- ============================
-- CATEGORY: Privacy & Security
-- ============================
(
    'How Is My Data Kept Safe?',
    'data-privacy-security',
    'Your privacy and security are our top priorities. Here is an overview of how we protect your data:

**Data Storage:**
- All user data is stored in encrypted databases (AES-256).
- Passwords are never stored in plain text – we use industry-standard hashing (bcrypt).
- Mind Vault entries are encrypted at rest.

**Authentication:**
- We use Supabase Auth with JWT tokens for secure session management.
- Sessions expire automatically after a period of inactivity.
- **Two-Factor Authentication (2FA)** is available for additional account security (Profile → Security Settings).

**Data We Collect:**
- Email address (for account & notifications)
- Basic profile information (name, preferences)
- Usage data (sound play counts, session durations – anonymized)
- Support ticket content

**Data We Do NOT Collect:**
- Payment card numbers (handled by Stripe, our PCI-compliant payment processor)
- Mind Vault content (encrypted, inaccessible to us)

**Your Rights:**
- You can request a copy of your data at any time.
- You can request account deletion (see "How to Delete Your Account").
- We comply with GDPR and CCPA regulations.

For any privacy concerns, contact us via support ticket or email privacy@example.com.',
    'Privacy & Security',
    true,
    ARRAY['privacy', 'security', 'data', 'GDPR', 'encryption', 'safe', '2FA']
);
