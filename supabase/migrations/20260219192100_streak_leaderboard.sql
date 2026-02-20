-- Create a secure view for the leaderboard
-- This avoids exposing the entire profiles or preferences tables
CREATE OR REPLACE VIEW public.active_streak_leaderboard AS
SELECT 
    p.id as user_id,
    p.full_name,
    p.avatar_url,
    up.streak_count,
    up.badges
FROM 
    public.profiles p
JOIN 
    public.user_preferences up ON p.id = up.user_id
WHERE 
    up.streak_count > 0
ORDER BY 
    up.streak_count DESC
LIMIT 50;

-- Grant permission to authenticated users (so they can read the leaderboard)
GRANT SELECT ON public.active_streak_leaderboard TO authenticated;
