-- CREATE/UPDATE SUPER ADMIN USER via SQL (FIXED)
-- This script creates the user directly in Supabase Auth if they don't exist.
-- WARNING: This requires the 'pgcrypto' extension for password hashing.

create extension if not exists pgcrypto;

DO $$
DECLARE
  target_email text := 'robfryer@pm.me';
  target_password text := '1234';
  target_uid uuid;
  found_id uuid;
BEGIN
  -- 1. Check if user exists in auth.users
  select id into found_id from auth.users where email = target_email;

  IF found_id IS NULL THEN
    -- User does not exist, create new
    target_uid := gen_random_uuid();
    
    insert into auth.users (
      instance_id,
      id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      recovery_sent_at,
      last_sign_in_at,
      raw_app_meta_data,
      raw_user_meta_data,
      created_at,
      updated_at,
      confirmation_token,
      email_change,
      email_change_token_new,
      recovery_token
    ) values (
      '00000000-0000-0000-0000-000000000000',
      target_uid,
      'authenticated',
      'authenticated',
      target_email,
      crypt(target_password, gen_salt('bf')), -- Hashed password
      now(), -- Confirmed
      now(),
      now(),
      '{"provider":"email","providers":["email"]}',
      '{}',
      now(),
      now(),
      '',
      '',
      '',
      ''
    );
    
    raise notice 'Created new auth user: % with ID: %', target_email, target_uid;
    
    -- Insert into identities for completeness (Supabase requires this for login sometimes)
    -- FIXED: Added provider_id
    insert into auth.identities (
      id,
      user_id,
      identity_data,
      provider,
      provider_id,
      last_sign_in_at,
      created_at,
      updated_at
    ) values (
      gen_random_uuid(), -- Identity needs its own unique ID, not user_id
      target_uid,
      format('{"sub":"%s","email":"%s"}', target_uid, target_email)::jsonb,
      'email',
      target_email, -- provider_id is the email for email provider
      now(),
      now(),
      now()
    );

  ELSE
    -- User exists, update password
    target_uid := found_id;
    update auth.users 
    set encrypted_password = crypt(target_password, gen_salt('bf')),
        email_confirmed_at = now() -- Ensure confirmed
    where id = target_uid;
    
    raise notice 'Updated password for existing user: %', target_email;
  END IF;

  -- 2. Ensure Profile exists and is Admin
  insert into public.profiles (id, email, role, created_at)
  values (target_uid, target_email, 'admin', now())
  on conflict (id) do update
  set role = 'admin'; -- Force Admin role

  raise notice 'Successfully set Super Admin role for %', target_email;

END $$;
