-- User Preferences Table
CREATE TABLE IF NOT EXISTS public.user_preferences (
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE PRIMARY KEY,
    email_marketing BOOLEAN DEFAULT true,
    email_security BOOLEAN DEFAULT true,
    push_new_content BOOLEAN DEFAULT true,
    push_mentions BOOLEAN DEFAULT true,
    push_app_updates BOOLEAN DEFAULT true,
    theme_preference TEXT DEFAULT 'system',
    content_preferences TEXT[] DEFAULT '{}', -- Array of tags e.g. ['taping', 'whispering']
    streak_count INTEGER DEFAULT 0,
    last_active TIMESTAMP WITH TIME ZONE,
    badges TEXT[] DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- RLS for Preferences
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can view their own preferences') THEN
        CREATE POLICY "Users can view their own preferences" ON public.user_preferences FOR SELECT USING (auth.uid() = user_id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can update their own preferences') THEN
        CREATE POLICY "Users can update their own preferences" ON public.user_preferences FOR UPDATE USING (auth.uid() = user_id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can insert their own preferences') THEN
        CREATE POLICY "Users can insert their own preferences" ON public.user_preferences FOR INSERT WITH CHECK (auth.uid() = user_id);
    END IF;
END $$;

-- Email Templates Table (Admin Only)
-- DROP to ensure schema match if it exists with old columns
DROP TABLE IF EXISTS public.email_templates;

CREATE TABLE public.email_templates (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    key TEXT UNIQUE NOT NULL, -- e.g. 'welcome', 'reset_password'
    subject TEXT NOT NULL,
    body_html TEXT NOT NULL,
    variables JSONB DEFAULT '[]'::jsonb, -- Description of variables available
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_by UUID REFERENCES public.profiles(id)
);

-- RLS for Email Templates
ALTER TABLE public.email_templates ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Admins can do everything with email templates') THEN
        CREATE POLICY "Admins can do everything with email templates" 
            ON public.email_templates 
            USING (
                EXISTS (
                    SELECT 1 FROM public.profiles 
                    WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
                )
            );
    END IF;
END $$;

-- Insert Default Templates
INSERT INTO public.email_templates (key, subject, body_html, variables)
VALUES 
(
    'welcome', 
    'Welcome to MAPA ASMR! 🎧', 
    '<h1>Welcome, {{name}}!</h1><p>We are thrilled to have you join our community.</p>',
    '["name", "email"]'::jsonb
),
(
    'reset_password', 
    'Reset Your Password', 
    '<p>Click the link below to reset your password:</p><a href="{{link}}">Reset Password</a>',
    '["name", "link"]'::jsonb
)
ON CONFLICT (key) DO NOTHING;

-- Trigger Function
CREATE OR REPLACE FUNCTION public.handle_new_user_preferences()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_preferences (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger
DROP TRIGGER IF EXISTS on_profile_created_preferences ON public.profiles;
CREATE TRIGGER on_profile_created_preferences
  AFTER INSERT ON public.profiles
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user_preferences();

-- Backfill existing users
INSERT INTO public.user_preferences (user_id)
SELECT id FROM public.profiles
ON CONFLICT (user_id) DO NOTHING;
