-- Seed Email Templates
-- Run this to reset or initialize default system templates.

-- 1. Welcome Email
INSERT INTO public.email_templates (name, category, subject_template, body_template, description, is_active, updated_at)
VALUES (
  'Welcome Email',
  'automation',
  'Welcome to ASMR with MAPA! ✨',
  '<h1>Welcome, {{name}}!</h1><p>We are thrilled to have you join our community of relaxation.</p><p>Start your journey by exploring our <a href="{{app_url}}/library">Sound Library</a>.</p><p>Relax and unwind,</p><p>The MAPA Team</p>',
  'Sent to new users upon registration.',
  true,
  now()
) ON CONFLICT (name) DO NOTHING;

-- 2. Streak Achievement
INSERT INTO public.email_templates (name, category, subject_template, body_template, description, is_active, updated_at)
VALUES (
  'Streak Achievement',
  'automation',
  'You reached a {{streak_days}}-day streak! 🔥',
  '<h1>Keep it up, {{name}}!</h1><p>You''ve listened for <strong>{{streak_days}} days</strong> in a row.</p><p>Consistency is key to mindfulness. Come back today to keep the flame alive!</p>',
  'Sent when a user maintains a listening streak.',
  true,
  now()
) ON CONFLICT (name) DO NOTHING;

-- 3. Upgrade Confirmation
INSERT INTO public.email_templates (name, category, subject_template, body_template, description, is_active, updated_at)
VALUES (
  'Upgrade Confirmation',
  'automation',
  'Welcome to Premium! 🌟',
  '<h1>Thank you for upgrading!</h1><p>You now have access to:</p><ul><li>Exclusive High-Fidelity Triggers</li><li>Background Play & Offline Mode</li><li>Priority Support</li></ul><p>Enjoy your ad-free sanctuary.</p>',
  'Sent after successful subscription upgrade.',
  true,
  now()
) ON CONFLICT (name) DO NOTHING;

-- 4. Newsletter
INSERT INTO public.email_templates (name, category, subject_template, body_template, description, is_active, updated_at)
VALUES (
  'Newsletter',
  'standard',
  'This Week in ASMR: New Triggers & Tips',
  '<h1>Hello {{name}},</h1><p>Here''s what''s new in the app this week:</p><h2>New Sounds</h2><p>{{new_sounds_list}}</p><h2>Community Highlight</h2><p>{{community_news}}</p><p>Relax well.</p>',
  'Weekly general update template.',
  true,
  now()
) ON CONFLICT (name) DO NOTHING;

-- 5. Feature Announcement
INSERT INTO public.email_templates (name, category, subject_template, body_template, description, is_active, updated_at)
VALUES (
  'Feature Announcement',
  'standard',
  'New Feature: {{feature_name}} 🚀',
  '<h1>Introducing {{feature_name}}</h1><p>We''ve just released a new way to experience ASMR.</p><p>{{feature_description}}</p><p><a href="{{action_url}}">Try it now</a></p>',
  'Template for announcing app updates.',
  true,
  now()
) ON CONFLICT (name) DO NOTHING;

-- 6. Ticket Received
INSERT INTO public.email_templates (name, category, subject_template, body_template, description, is_active, updated_at)
VALUES (
  'Ticket Received',
  'automation',
  'Ticket #{{ticket_id}}: We received your request',
  '<h1>Ticket Received</h1><p>Hi {{name}},</p><p>We have received your support request: <strong>{{subject}}</strong>.</p><p>A member of our team will review it shortly.</p><p>You can view your ticket status in the <a href="{{app_url}}/support">Support Center</a>.</p>',
  'Sent when a user creates a new support ticket.',
  true,
  now()
) ON CONFLICT (name) DO NOTHING;

-- 7. New Support Reply
INSERT INTO public.email_templates (name, category, subject_template, body_template, description, is_active, updated_at)
VALUES (
  'New Support Reply',
  'automation',
  'Update on Ticket #{{ticket_id}}',
  '<h1>New Reply</h1><p>Hi {{name}},</p><p>Our support team has replied to your ticket: <strong>{{subject}}</strong>.</p><blockquote>{{latest_reply}}</blockquote><p>Please visit the <a href="{{app_url}}/support">Support Center</a> to respond.</p>',
  'Sent when a staff member replies to a ticket.',
  true,
  now()
) ON CONFLICT (name) DO NOTHING;

-- 8. Ticket Closed
INSERT INTO public.email_templates (name, category, subject_template, body_template, description, is_active, updated_at)
VALUES (
  'Ticket Closed',
  'automation',
  'Ticket #{{ticket_id}} has been closed',
  '<h1>Ticket Closed</h1><p>Hi {{name}},</p><p>Your support ticket <strong>{{subject}}</strong> has been marked as resolved/closed.</p><p>If you have further questions, please open a new ticket.</p><p>Thank you for being part of our community.</p>',
  'Sent when a ticket status is set to resolved or closed.',
  true,
  now()
) ON CONFLICT (name) DO NOTHING;
