-- FIX: Missing columns for Streaks/Badges
ALTER TABLE public.user_preferences ADD COLUMN IF NOT EXISTS streak_count INTEGER DEFAULT 0;
ALTER TABLE public.user_preferences ADD COLUMN IF NOT EXISTS last_active TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.user_preferences ADD COLUMN IF NOT EXISTS badges TEXT[] DEFAULT '{}';

-- FIX: Missing Creators and Tips tables
CREATE TABLE IF NOT EXISTS public.creators (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    bio TEXT,
    avatar_url TEXT,
    support_link TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS creator_id UUID REFERENCES public.creators(id) ON DELETE SET NULL;

CREATE TABLE IF NOT EXISTS public.tips (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sender_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    creator_id UUID NOT NULL REFERENCES public.creators(id) ON DELETE CASCADE,
    amount NUMERIC NOT NULL,
    message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- RLS
ALTER TABLE public.creators ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tips ENABLE ROW LEVEL SECURITY;

-- Basic Policies (Safe to re-run with simple logic)
DROP POLICY IF EXISTS "Public creators are viewable by everyone" ON public.creators;
CREATE POLICY "Public creators are viewable by everyone" ON public.creators FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins can manage creators" ON public.creators;
CREATE POLICY "Admins can manage creators" ON public.creators FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
);

DROP POLICY IF EXISTS "Users can view their own sent tips" ON public.tips;
CREATE POLICY "Users can view their own sent tips" ON public.tips FOR SELECT USING (auth.uid() = sender_id);

DROP POLICY IF EXISTS "Users can send tips" ON public.tips;
CREATE POLICY "Users can send tips" ON public.tips FOR INSERT WITH CHECK (auth.uid() = sender_id);

-- Seed demo creator if none exists
DO $$
DECLARE
    creator_uuid UUID;
BEGIN
    IF NOT EXISTS (SELECT 1 FROM public.creators WHERE name = 'Whispering Willow') THEN
        creator_uuid := gen_random_uuid();
        INSERT INTO public.creators (id, name, bio, support_link)
        VALUES (creator_uuid, 'Whispering Willow', 'Top-tier ASMR artist specializing in nature sounds.', 'https://ko-fi.com/willow');
        
        UPDATE public.categories SET creator_id = creator_uuid WHERE name = 'Water';
    END IF;
END $$;

-- FIX: Missing Community Challenges
CREATE TABLE IF NOT EXISTS public.challenges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    icon TEXT DEFAULT '🏆',
    challenge_type TEXT NOT NULL,
    goal_value INTEGER NOT NULL,
    start_date TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    end_date TIMESTAMP WITH TIME ZONE,
    points_reward INTEGER DEFAULT 100,
    badge_reward TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    is_active BOOLEAN DEFAULT true
);

CREATE TABLE IF NOT EXISTS public.challenge_participants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    challenge_id UUID NOT NULL REFERENCES public.challenges(id) ON DELETE CASCADE,
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    progress INTEGER DEFAULT 0,
    completed BOOLEAN DEFAULT false,
    completed_at TIMESTAMP WITH TIME ZONE,
    UNIQUE(user_id, challenge_id)
);

ALTER TABLE public.challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.challenge_participants ENABLE ROW LEVEL SECURITY;

-- Polices for Challenges
DROP POLICY IF EXISTS "Public can view active challenges" ON public.challenges;
CREATE POLICY "Public can view active challenges" ON public.challenges FOR SELECT USING (is_active = true);

-- Policies for Challenge Participants
DROP POLICY IF EXISTS "Users can view their own participations" ON public.challenge_participants;
CREATE POLICY "Users can view their own participations" ON public.challenge_participants FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can join challenges" ON public.challenge_participants;
CREATE POLICY "Users can join challenges" ON public.challenge_participants FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own progress" ON public.challenge_participants;
CREATE POLICY "Users can update their own progress" ON public.challenge_participants FOR UPDATE USING (auth.uid() = user_id);

-- Seed a default challenge if none exists
INSERT INTO public.challenges (title, description, icon, challenge_type, goal_value, badge_reward)
SELECT '7 Days of Sleep', 'Build a 7-day streak to earn the Sleep Master badge.', '🌙', 'streak', 7, 'Sleep Master'
WHERE NOT EXISTS (SELECT 1 FROM public.challenges WHERE title = '7 Days of Sleep');

-- FIX: Ensure sounds table has a default ID generator
ALTER TABLE public.sounds ALTER COLUMN id SET DEFAULT gen_random_uuid();

-- FIX: Seed some working sounds if none exist
DO $$
DECLARE
    water_cat_id TEXT;
    tapping_cat_id TEXT;
    nature_cat_id TEXT;
BEGIN
    SELECT id INTO water_cat_id FROM public.categories WHERE name = 'Water' LIMIT 1;
    SELECT id INTO tapping_cat_id FROM public.categories WHERE name = 'Tapping' LIMIT 1;
    SELECT id INTO nature_cat_id FROM public.categories WHERE name = 'Nature Whispers' LIMIT 1;

    -- Water Sounds
    IF water_cat_id IS NOT NULL THEN
        INSERT INTO public.sounds (category_id, name, url)
        SELECT water_cat_id, 'Heavy Rain', 'https://archive.org/download/heavy_rain_sound/heavy_rain_sound.mp3'
        WHERE NOT EXISTS (SELECT 1 FROM public.sounds WHERE url = 'https://archive.org/download/heavy_rain_sound/heavy_rain_sound.mp3');
    END IF;

    -- Tapping Sounds
    IF tapping_cat_id IS NOT NULL THEN
        INSERT INTO public.sounds (category_id, name, url)
        SELECT tapping_cat_id, 'Deep Tapping', 'https://archive.org/download/ASMRTapping/Tapping.mp3'
        WHERE NOT EXISTS (SELECT 1 FROM public.sounds WHERE url = 'https://archive.org/download/ASMRTapping/Tapping.mp3');
    END IF;

    -- Nature Sounds
    IF nature_cat_id IS NOT NULL THEN
        INSERT INTO public.sounds (category_id, name, url)
        SELECT nature_cat_id, 'Forest Birds', 'https://archive.org/download/NatureSounds-Birds/NatureSoundsBirds.mp3'
        WHERE NOT EXISTS (SELECT 1 FROM public.sounds WHERE url = 'https://archive.org/download/NatureSounds-Birds/NatureSoundsBirds.mp3');
    END IF;
END $$;
