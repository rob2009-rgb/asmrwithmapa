-- FIX: Missing Community Marketplace Tables and Functions

-- 1. Create Community Presets Table
CREATE TABLE IF NOT EXISTS public.community_presets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    layers JSONB NOT NULL, -- Stores array of { soundId, volume, active }
    likes_count INTEGER DEFAULT 0,
    downloads_count INTEGER DEFAULT 0,
    is_premium BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Create Preset Likes Table (for tracking user likes)
CREATE TABLE IF NOT EXISTS public.preset_likes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    preset_id UUID NOT NULL REFERENCES public.community_presets(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(user_id, preset_id)
);

-- 3. Enable RLS
ALTER TABLE public.community_presets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.preset_likes ENABLE ROW LEVEL SECURITY;

-- 4. Policies for Presets

-- Everyone can view presets
DROP POLICY IF EXISTS "Public presets are viewable by everyone" ON public.community_presets;
CREATE POLICY "Public presets are viewable by everyone" 
ON public.community_presets FOR SELECT USING (true);

-- Authenticated users can create presets
DROP POLICY IF EXISTS "Users can create presets" ON public.community_presets;
CREATE POLICY "Users can create presets" 
ON public.community_presets FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own presets
DROP POLICY IF EXISTS "Users can update own presets" ON public.community_presets;
CREATE POLICY "Users can update own presets" 
ON public.community_presets FOR UPDATE USING (auth.uid() = user_id);

-- Users can delete their own presets
DROP POLICY IF EXISTS "Users can delete own presets" ON public.community_presets;
CREATE POLICY "Users can delete own presets" 
ON public.community_presets FOR DELETE USING (auth.uid() = user_id);

-- 5. Policies for Likes

-- Users can view their own likes
DROP POLICY IF EXISTS "Users can view own likes" ON public.preset_likes;
CREATE POLICY "Users can view own likes" 
ON public.preset_likes FOR SELECT USING (auth.uid() = user_id);

-- Users can like presets
DROP POLICY IF EXISTS "Users can like presets" ON public.preset_likes;
CREATE POLICY "Users can like presets" 
ON public.preset_likes FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can unlike presets
DROP POLICY IF EXISTS "Users can unlike presets" ON public.preset_likes;
CREATE POLICY "Users can unlike presets" 
ON public.preset_likes FOR DELETE USING (auth.uid() = user_id);

-- 6. Functions for counters

-- Function to increment likes
CREATE OR REPLACE FUNCTION increment_likes()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.community_presets
  SET likes_count = likes_count + 1
  WHERE id = NEW.preset_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to decrement likes
CREATE OR REPLACE FUNCTION decrement_likes()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.community_presets
  SET likes_count = likes_count - 1
  WHERE id = OLD.preset_id;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Triggers for likes
DROP TRIGGER IF EXISTS on_like_added ON public.preset_likes;
CREATE TRIGGER on_like_added
  AFTER INSERT ON public.preset_likes
  FOR EACH ROW EXECUTE FUNCTION increment_likes();

DROP TRIGGER IF EXISTS on_like_removed ON public.preset_likes;
CREATE TRIGGER on_like_removed
  AFTER DELETE ON public.preset_likes
  FOR EACH ROW EXECUTE FUNCTION decrement_likes();

-- 7. RPC for downloads
CREATE OR REPLACE FUNCTION public.increment_downloads(row_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE public.community_presets
  SET downloads_count = downloads_count + 1
  WHERE id = row_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
