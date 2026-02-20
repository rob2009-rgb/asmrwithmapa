-- 1. BACKFILL PROFILES
-- Insert a profile for any user in auth.users that doesn't have one in public.profiles
INSERT INTO public.profiles (id, email, role)
SELECT id, email, 'user'
FROM auth.users
WHERE id NOT IN (SELECT id FROM public.profiles);

-- 2. RESET RLS POLICIES (Aggressive Fix)
-- Drop existing policies to ensure a clean slate
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update any profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can delete profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

-- 3. RE-CREATE POLICIES
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Allow EVERYONE to view profiles (needed for admin list & referencing)
CREATE POLICY "Public profiles are viewable by everyone" 
ON public.profiles FOR SELECT 
USING (true);

-- Allow Admins to UPDATE any profile
CREATE POLICY "Admins can update any profile" 
ON public.profiles FOR UPDATE 
USING (
  exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
);

-- Allow Admins to DELETE any profile
CREATE POLICY "Admins can delete profiles" 
ON public.profiles FOR DELETE 
USING (
  exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
);

-- Allow Users to INSERT their own profile (for signup trigger)
CREATE POLICY "Users can insert their own profile" 
ON public.profiles FOR INSERT 
WITH CHECK (auth.uid() = id);

-- Allow Users to UPDATE their own profile
CREATE POLICY "Users can update own profile" 
ON public.profiles FOR UPDATE 
USING (auth.uid() = id);
