-- SECURITY AUDIT FIXES
-- 1. Profiles: Allow Public Read (Essential for Social Features and Comments)
-- We strictly limit what columns are returned via the API select, but RLS needs to allow the row access.
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
CREATE POLICY "Public profiles are viewable by everyone" 
ON public.profiles FOR SELECT 
USING (true);

-- 2. Categories: Verify RLS and Policies
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public categories are viewable by everyone" ON public.categories;
CREATE POLICY "Public categories are viewable by everyone" 
ON public.categories FOR SELECT 
USING (true);

DROP POLICY IF EXISTS "Admins can manage categories" ON public.categories;
CREATE POLICY "Admins can manage categories" 
ON public.categories FOR ALL 
USING ( public.is_admin() );

-- Clean up any old unlimited policies if they exist (from setup.sql demo days)
DROP POLICY IF EXISTS "Everyone can insert categories (Demo)" ON public.categories;
DROP POLICY IF EXISTS "Everyone can update categories (Demo)" ON public.categories;

-- 3. Sounds: Verify RLS and Policies
ALTER TABLE public.sounds ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public sounds are viewable by everyone" ON public.sounds;
CREATE POLICY "Public sounds are viewable by everyone" 
ON public.sounds FOR SELECT 
USING (true);

DROP POLICY IF EXISTS "Admins can manage sounds" ON public.sounds;
CREATE POLICY "Admins can manage sounds" 
ON public.sounds FOR ALL 
USING ( public.is_admin() );

-- Clean up old demo policies
DROP POLICY IF EXISTS "Everyone can insert sounds (Demo)" ON public.sounds;
DROP POLICY IF EXISTS "Everyone can update sounds (Demo)" ON public.sounds;

-- 4. Storage: Secure the 'sounds' bucket
-- Note: Storage policies are often on storage.objects

-- Allow Public Read for 'sounds', 'avatars'
DROP POLICY IF EXISTS "Public Access Sounds" ON storage.objects;
CREATE POLICY "Public Access Sounds"
ON storage.objects FOR SELECT
USING ( bucket_id IN ('sounds', 'avatars', 'images') );

-- Verify Admin Uploads Only for 'sounds'
DROP POLICY IF EXISTS "Admin Upload Sounds" ON storage.objects;
CREATE POLICY "Admin Upload Sounds"
ON storage.objects FOR INSERT
WITH CHECK ( 
    bucket_id = 'sounds' 
    AND public.is_admin() 
);

DROP POLICY IF EXISTS "Admin Update Sounds" ON storage.objects;
CREATE POLICY "Admin Update Sounds"
ON storage.objects FOR UPDATE
USING ( 
    bucket_id = 'sounds' 
    AND public.is_admin() 
);

DROP POLICY IF EXISTS "Admin Delete Sounds" ON storage.objects;
CREATE POLICY "Admin Delete Sounds"
ON storage.objects FOR DELETE
USING ( 
    bucket_id = 'sounds' 
    AND public.is_admin() 
);

-- Users can upload their own avatars (bucket_id = 'avatars')
DROP POLICY IF EXISTS "Users upload avatars" ON storage.objects;
CREATE POLICY "Users upload avatars"
ON storage.objects FOR INSERT
WITH CHECK (
    bucket_id = 'avatars'
    AND auth.uid()::text = (storage.foldername(name))[1] 
);
-- Note: Avatar update/delete usually handled by overwriting or UUID match. 
-- For simplicity in this audit, we prioritize locking down 'sounds'.
