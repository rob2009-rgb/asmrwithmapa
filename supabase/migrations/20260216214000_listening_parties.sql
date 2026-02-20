-- Create listening sessions table
CREATE TABLE IF NOT EXISTS public.listening_sessions (
    id TEXT PRIMARY KEY DEFAULT substring(md5(random()::text), 1, 6), -- Short 6-char room code
    host_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    current_sound_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
    variation_index INTEGER DEFAULT 0,
    is_playing BOOLEAN DEFAULT false,
    playback_position NUMERIC DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT (timezone('utc'::text, now()) + interval '4 hours') -- Auto-expire sessions
);

-- Enable RLS
ALTER TABLE public.listening_sessions ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Public can view active sessions"
    ON public.listening_sessions FOR SELECT
    USING (expires_at > now());

CREATE POLICY "Users can create sessions"
    ON public.listening_sessions FOR INSERT
    WITH CHECK (auth.uid() = host_id);

CREATE POLICY "Hosts can update their own sessions"
    ON public.listening_sessions FOR UPDATE
    USING (auth.uid() = host_id);

-- Enable Realtime for this table
ALTER PUBLICATION supabase_realtime ADD TABLE public.listening_sessions;
