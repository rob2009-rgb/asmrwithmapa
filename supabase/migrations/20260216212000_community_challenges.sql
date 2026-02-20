-- Create challenges table for global events
CREATE TABLE IF NOT EXISTS public.challenges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    icon TEXT DEFAULT '🏆',
    challenge_type TEXT NOT NULL, -- 'streak', 'listening_time', 'daily_login'
    goal_value INTEGER NOT NULL,
    start_date TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    end_date TIMESTAMP WITH TIME ZONE,
    points_reward INTEGER DEFAULT 100,
    badge_reward TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    is_active BOOLEAN DEFAULT true
);

-- Create challenge participants table
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

-- Enable RLS
ALTER TABLE public.challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.challenge_participants ENABLE ROW LEVEL SECURITY;

-- Policies for Challenges
CREATE POLICY "Public can view active challenges"
    ON public.challenges FOR SELECT
    USING (is_active = true);

-- Policies for Challenge Participants
CREATE POLICY "Users can view their own participations"
    ON public.challenge_participants FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can join challenges"
    ON public.challenge_participants FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own progress"
    ON public.challenge_participants FOR UPDATE
    USING (auth.uid() = user_id);

-- Insert a default challenge
INSERT INTO public.challenges (title, description, icon, challenge_type, goal_value, badge_reward)
VALUES ('7 Days of Sleep', 'Build a 7-day streak to earn the Sleep Master badge.', '🌙', 'streak', 7, 'Sleep Master');
