import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { Database } from '../db_types';

type UserPreferences = Database['public']['Tables']['user_preferences']['Row'];

export const usePreferences = (userId: string | undefined) => {
    const [preferences, setPreferences] = useState<UserPreferences | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!userId) return;
        loadPreferences();
    }, [userId]);

    const loadPreferences = async () => {
        try {
            const { data, error } = await supabase
                .from('user_preferences')
                .select('*')
                .eq('user_id', userId)
                .single();

            if (data) {
                setPreferences(data);
            } else if (error && error.code === 'PGRST116') {
                // No rows found, try to create default? 
                // The trigger should have handled this, but just in case or for old users if script failed
                console.log('No preferences found, using defaults until update.');
            }
        } catch (err) {
            console.error('Error loading preferences:', err);
        } finally {
            setLoading(false);
        }
    };

    const updatePreference = async (key: keyof UserPreferences, value: any) => {
        if (!userId) return;

        // Optimistic update
        setPreferences(prev => prev ? { ...prev, [key]: value } : null);

        try {
            const { error } = await supabase
                .from('user_preferences')
                .upsert({
                    user_id: userId,
                    [key]: value,
                    updated_at: new Date().toISOString()
                })
                .eq('user_id', userId);

            if (error) throw error;
        } catch (err) {
            console.error('Error updating preference:', err);
            // Revert on error could be implemented here
            loadPreferences();
        }
    };

    return {
        preferences,
        loading,
        updatePreference
    };
};
