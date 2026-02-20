import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { useNotification } from '../contexts/NotificationContext';

export const useStreaks = (userId: string | undefined) => {
    const [streak, setStreak] = useState(0);
    const [badges, setBadges] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);
    const { showNotification } = useNotification();

    useEffect(() => {
        if (userId) {
            updateStreak();
        }
    }, [userId]);

    const updateStreak = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('user_preferences')
                .select('streak_count, last_active, badges')
                .eq('user_id', userId)
                .single();

            if (error) throw error;

            const now = new Date();
            const lastActive = data.last_active ? new Date(data.last_active) : null;
            let currentStreak = data.streak_count || 0;
            let currentBadges = data.badges || [];

            if (!lastActive) {
                // First time
                currentStreak = 1;
            } else {
                // Normalize dates to midnight to compare calendar days NOT 24h periods
                const today = new Date();
                today.setHours(0, 0, 0, 0);

                const lastActiveDate = new Date(lastActive);
                lastActiveDate.setHours(0, 0, 0, 0);

                const diffTime = today.getTime() - lastActiveDate.getTime();
                const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

                if (diffDays === 1) {
                    // Consecutive day
                    currentStreak += 1;
                    showNotification('success', `🔥 ${currentStreak} Day Streak! Keep it up!`);
                } else if (diffDays > 1) {
                    // Broke streak
                    currentStreak = 1;
                    showNotification('info', 'Streak reset. Let\'s start a new one!');
                }
                // If diffDays === 0, already active today, no change
            }

            // Award Badges
            const newBadges = [...currentBadges];
            if (currentStreak >= 7 && !newBadges.includes('Week Warrior')) {
                newBadges.push('Week Warrior');
                showNotification('info', '🏅 Earned Badge: Week Warrior');
            }
            if (currentStreak >= 30 && !newBadges.includes('Monthly Master')) {
                newBadges.push('Monthly Master');
                showNotification('info', '🏆 Earned Badge: Monthly Master');
            }

            const { error: updateError } = await supabase
                .from('user_preferences')
                .update({
                    streak_count: currentStreak,
                    last_active: now.toISOString(),
                    badges: newBadges
                })
                .eq('user_id', userId);

            if (updateError) throw updateError;

            setStreak(currentStreak);
            setBadges(newBadges);

            // --- SYNC WITH COMMUNITY CHALLENGES ---
            if (userId) {
                const { data: activeStreakChallenges, error: challengeError } = await supabase
                    .from('challenge_participants')
                    .select('id, challenge_id, progress, challenges!inner(*)')
                    .eq('user_id', userId)
                    .eq('challenges.challenge_type', 'streak')
                    .eq('completed', false);

                if (!challengeError && activeStreakChallenges) {
                    for (const participation of activeStreakChallenges) {
                        const challenge = (participation as any).challenges;
                        const newProgress = Math.max(participation.progress, currentStreak);
                        const isNowCompleted = newProgress >= challenge.goal_value;

                        await supabase
                            .from('challenge_participants')
                            .update({
                                progress: newProgress,
                                completed: isNowCompleted,
                                completed_at: isNowCompleted ? now.toISOString() : null
                            })
                            .eq('id', participation.id);

                        if (isNowCompleted) {
                            showNotification('success', `✨ Challenge Completed: ${challenge.title}!`);
                        }
                    }
                }
            }

        } catch (err) {
            console.error('Streak update failed:', err);
        } finally {
            setLoading(false);
        }
    };

    return { streak, badges, loading };
};
