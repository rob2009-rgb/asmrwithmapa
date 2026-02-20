import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { Database } from '../db_types';

type SocialAccount = Database['public']['Tables']['social_accounts']['Row'];
type SocialPlatform = Database['public']['Tables']['social_accounts']['Row']['platform'];

export const useSocialAccounts = (userId: string | undefined) => {
    const [accounts, setAccounts] = useState<SocialAccount[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!userId) return;
        loadAccounts();
    }, [userId]);

    const loadAccounts = async () => {
        try {
            const { data, error } = await supabase
                .from('social_accounts')
                .select('*')
                .eq('user_id', userId)
                .order('created_at', { ascending: true });

            if (data) {
                setAccounts(data);
            }
        } catch (err) {
            console.error('Error loading social accounts:', err);
        } finally {
            setLoading(false);
        }
    };

    const addAccount = async (platform: SocialPlatform, username: string, profileUrl?: string) => {
        if (!userId) return { error: 'User not logged in' };

        try {
            const { data, error } = await supabase
                .from('social_accounts')
                .insert({
                    user_id: userId,
                    platform,
                    username,
                    profile_url: profileUrl,
                    is_public: true
                })
                .select()
                .single();

            if (error) throw error;
            setAccounts(prev => [...prev, data]);
            return { data };
        } catch (err: any) {
            return { error: err.message };
        }
    };

    const removeAccount = async (id: string) => {
        try {
            const { error } = await supabase
                .from('social_accounts')
                .delete()
                .eq('id', id);

            if (error) throw error;
            setAccounts(prev => prev.filter(a => a.id !== id));
            return { success: true };
        } catch (err: any) {
            return { error: err.message };
        }
    };

    return {
        accounts,
        loading,
        addAccount,
        removeAccount
    };
};
