-- FIX: Add avatar_url to profiles table
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- Optional: Sync from auth.users (requires privileged access, might not work in SQL editor if no access to auth schema)
-- But we can at least create the column.
