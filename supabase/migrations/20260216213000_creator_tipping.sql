-- 1. Create Creators Table
CREATE TABLE IF NOT EXISTS public.creators (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    bio TEXT,
    avatar_url TEXT,
    support_link TEXT, -- External links like Ko-fi, Patreon, etc.
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Link Categories to Creators
ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS creator_id UUID REFERENCES public.creators(id) ON DELETE SET NULL;

-- 3. Create Tips Table
CREATE TABLE IF NOT EXISTS public.tips (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sender_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    creator_id UUID NOT NULL REFERENCES public.creators(id) ON DELETE CASCADE,
    amount NUMERIC NOT NULL,
    message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Enable RLS
ALTER TABLE public.creators ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tips ENABLE ROW LEVEL SECURITY;

-- 5. Policies
CREATE POLICY "Public creators are viewable by everyone" 
ON public.creators FOR SELECT USING (true);

CREATE POLICY "Admins can manage creators" 
ON public.creators FOR ALL USING ( public.is_admin() );

CREATE POLICY "Users can view their own sent tips" 
ON public.tips FOR SELECT USING (auth.uid() = sender_id);

CREATE POLICY "Users can send tips" 
ON public.tips FOR INSERT WITH CHECK (auth.uid() = sender_id);

-- 6. Seed an example creator
DO $$
DECLARE
    creator_uuid UUID := gen_random_uuid();
BEGIN
    INSERT INTO public.creators (id, name, bio, support_link)
    VALUES (creator_uuid, 'Whispering Willow', 'Top-tier ASMR artist specializing in nature sounds.', 'https://ko-fi.com/willow');

    -- Link existing categories to this creator for demo purposes
    UPDATE public.categories SET creator_id = creator_uuid WHERE name = 'Water';
END $$;
