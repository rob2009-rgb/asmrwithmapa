-- Social Accounts Table
CREATE TABLE IF NOT EXISTS public.social_accounts (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    platform TEXT NOT NULL CHECK (platform IN ('instagram', 'twitter', 'youtube', 'twitch', 'tiktok', 'website')),
    username TEXT NOT NULL,
    profile_url TEXT,
    is_public BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(user_id, platform) -- Prevent multiple links for same platform per user
);

-- RLS for Social Accounts
ALTER TABLE public.social_accounts ENABLE ROW LEVEL SECURITY;

-- 1. Everyone can view public social accounts
CREATE POLICY "Public social accounts are viewable by everyone" 
ON public.social_accounts FOR SELECT 
USING (is_public = true);

-- 2. Users can view all their own accounts (even private ones)
CREATE POLICY "Users can view own social accounts" 
ON public.social_accounts FOR SELECT 
USING (auth.uid() = user_id);

-- 3. Users can insert their own accounts
CREATE POLICY "Users can insert own social accounts" 
ON public.social_accounts FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- 4. Users can update their own accounts
CREATE POLICY "Users can update own social accounts" 
ON public.social_accounts FOR UPDATE 
USING (auth.uid() = user_id);

-- 5. Users can delete their own accounts
CREATE POLICY "Users can delete own social accounts" 
ON public.social_accounts FOR DELETE 
USING (auth.uid() = user_id);
