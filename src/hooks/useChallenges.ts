import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { useNotification } from '../contexts/NotificationContext';

export interface Challenge {
    id: string;
    title: string;
    description: string;
    icon: string;
    challenge_type: string;
    goal_value: number;
    points_reward: number;
    badge_reward: string;
    is_active: boolean;
}

export interface Participant {
    challenge_id: string;
    progress: number;
    completed: boolean;
}

export const useChallenges = (userId: string | undefined) => {
    const [challenges, setChallenges] = useState<Challenge[]>([]);
    const [myParticipations, setMyParticipations] = useState<Participant[]>([]);
    const [loading, setLoading] = useState(true);
    const { showNotification } = useNotification();

    const fetchChallenges = async () => {
        try {
            setLoading(true);
            const { data: challengesData, error: challengesError } = await supabase
                .from('challenges')
                .select('*')
                .eq('is_active', true);

            if (challengesError) throw challengesError;
            setChallenges(challengesData || []);

            if (userId) {
                const { data: participationsData, error: participationsError } = await supabase
                    .from('challenge_participants')
                    .select('challenge_id, progress, completed')
                    .eq('user_id', userId);

                if (participationsError) throw participationsError;

                if (participationsError) throw participationsError;
                setMyParticipations(participationsData || []);
            }
        } catch (err) {
            console.error('Error fetching challenges:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchChallenges();
    }, [userId]);

    const joinChallenge = async (challengeId: string) => {
        if (!userId) return;
        try {
            const { error } = await supabase
                .from('challenge_participants')
                .insert({ user_id: userId, challenge_id: challengeId });

            if (error) throw error;

            showNotification('success', 'Joined challenge! Good luck! 🚀');
            fetchChallenges();
        } catch (err) {
            console.error('Error joining challenge:', err);
            showNotification('error', 'Failed to join challenge.');
        }
    };

    return { challenges, myParticipations, loading, joinChallenge, refresh: fetchChallenges };
};
