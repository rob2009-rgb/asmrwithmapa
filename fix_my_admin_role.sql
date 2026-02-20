-- FIX ADMIN PERMISSIONS BY EMAIL
-- Replace 'YOUR_EMAIL_HERE' with your actual login email.

DO $$
DECLARE
  target_email text := 'robfryer@pm.me'; -- <--- CHANGE THIS
  target_user_id uuid;
BEGIN
  -- 1. Find the Auth User ID
  select id into target_user_id from auth.users where email = target_email;

  if target_user_id is null then
    raise notice 'User not found with email: %', target_email;
  else
    -- 2. Upsert Profile as Admin
    insert into public.profiles (id, email, role, created_at)
    values (target_user_id, target_email, 'admin', now())
    on conflict (id) do update
    set role = 'admin';
    
    raise notice 'Successfully promoted % to admin.', target_email;
  end if;
END $$;
