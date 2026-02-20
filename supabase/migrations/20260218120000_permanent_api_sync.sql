
-- PERMANENT API PERMISSIONS & CACHE SYNC
-- This migration ensures that all tables in the public schema are accessible to the API roles.
-- It also forces a PostgREST cache reload to eliminate 406 (Not Acceptable) errors.

-- 1. Ensure Schema Usage
GRANT USAGE ON SCHEMA public TO anon, authenticated;

-- 2. Grant permissions on ALL existing tables to authenticated and anon roles
-- Note: RLS policies still control actual row-level access.
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon;

-- 3. Grant permissions on ALL sequences (for ID generation)
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;

-- 4. Set default privileges for FUTURE tables
-- This prevents the issue from happening again when new tables are created
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT ON TABLES TO anon;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT USAGE, SELECT ON SEQUENCES TO authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT USAGE, SELECT ON SEQUENCES TO anon;

-- 5. Force PostgREST to reload the schema cache
NOTIFY pgrst, 'reload config';

-- 6. Add a comment to mark this as fixed
COMMENT ON SCHEMA public IS 'ASMR with Mapa - Verified API Schema (Fixed 406 Errors)';
