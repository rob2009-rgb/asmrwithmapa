-- PERMANENT SECURITY FIX
-- The issue: "Recursion" or "Privilege" errors when checking policies.
-- The Solution: A "Security Definer" function that safely checks if you are an admin.

-- 1. Create is_admin() function
-- This function runs with "superuser" privileges (Security Definer), 
-- allowing it to read the profiles table even if RLS would normally block it.
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER 
SET search_path = public -- Good practice for security definers
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = auth.uid()
    AND role = 'admin'
  );
END;
$$;

-- 2. Re-Enable RLS and Apply Robust Policies
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

-- Drop old policies to be clean
DROP POLICY IF EXISTS "Admins can manage system settings" ON public.system_settings;
DROP POLICY IF EXISTS "Admins can view system settings" ON public.system_settings;
DROP POLICY IF EXISTS "Admins can insert system settings" ON public.system_settings;
DROP POLICY IF EXISTS "Admins can update system settings" ON public.system_settings;
DROP POLICY IF EXISTS "Admins can delete system settings" ON public.system_settings;

-- Create New Policies using is_admin()
CREATE POLICY "Admins can view system settings"
  ON public.system_settings FOR SELECT
  USING ( is_admin() );

CREATE POLICY "Admins can insert system settings"
  ON public.system_settings FOR INSERT
  WITH CHECK ( is_admin() );

CREATE POLICY "Admins can update system settings"
  ON public.system_settings FOR UPDATE
  USING ( is_admin() );

CREATE POLICY "Admins can delete system settings"
  ON public.system_settings FOR DELETE
  USING ( is_admin() );

-- 3. Fix Profiles Policies as well (Use the same robust check)
DROP POLICY IF EXISTS "Admins can insert profiles" ON public.profiles;
CREATE POLICY "Admins can insert profiles" 
  ON public.profiles FOR INSERT
  WITH CHECK ( is_admin() );

DROP POLICY IF EXISTS "Admins can update any profile" ON public.profiles;
CREATE POLICY "Admins can update any profile" 
  ON public.profiles FOR UPDATE 
  USING ( is_admin() );

DROP POLICY IF EXISTS "Admins can delete profiles" ON public.profiles;
CREATE POLICY "Admins can delete profiles" 
  ON public.profiles FOR DELETE 
  USING ( is_admin() );
