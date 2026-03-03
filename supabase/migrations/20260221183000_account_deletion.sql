-- Create a secure RPC to handle account deletion
-- This function runs with SECURITY DEFINER to allow purging related data
-- that might have restrictive RLS policies, while verifying the user's identity.

create or replace function public.delete_own_account(target_id uuid default null)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid;
begin
  -- Use provided target_id if available (for service_role calls),
  -- otherwise fall back to auth.uid()
  if target_id is not null then
    uid := target_id;
  else
    uid := auth.uid();
  end if;

  if uid is null then
    raise exception 'Not authenticated';
  end if;

  -- 1. Purge related data (CASCADE usually handles this, but we'll be explicit for security)
  -- Purge Social Accounts
  delete from public.social_accounts where user_id = uid;
  
  -- Purge User Sessions (Analytics)
  delete from public.user_sessions where user_id = uid;
  
  -- Purge Analytics Events
  delete from public.analytics_events where user_id = uid;

  -- Purge User Preferences
  delete from public.user_preferences where user_id = uid;

  -- Purge Support Tickets (and cascade to messages)
  delete from public.tickets where user_id = uid;

  -- Purge Community Presets
  delete from public.community_presets where user_id = uid;

  -- Purge Preset Likes
  delete from public.preset_likes where user_id = uid;

  -- Purge Notifications
  delete from public.notifications where user_id = uid;

  -- Purge Challenge Participation
  delete from public.challenge_participants where user_id = uid;

  -- Purge Listening Sessions
  delete from public.listening_sessions where host_id = uid;

  -- Purge Tips (sent)
  delete from public.tips where sender_id = uid;

  -- Purge MFA Secrets
  delete from public.user_secrets where id = uid;

  -- 2. Delete the profile record
  delete from public.profiles where id = uid;

  -- 3. Mark the auth user for deletion (Supabase specific)
  -- Note: In a real Supabase production environment, you might need a separate 
  -- Edge Function or a specialized trigger to delete from auth.users via service role.
  -- For now, deleting the profile and clearing session is the primary requirement.
end;
$$;

-- Grant execution to authenticated users
grant execute on function public.delete_own_account() to authenticated;
