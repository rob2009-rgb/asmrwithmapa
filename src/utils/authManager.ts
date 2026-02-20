import { supabase } from '../supabaseClient';

export type UserRole = 'admin' | 'support' | 'user';

export interface UserProfile {
    id: string;
    email: string;
    role: UserRole;
    full_name?: string | null;
    subscription_tier?: string;
    created_at: string;
}

export const getCurrentProfile = async (): Promise<UserProfile | null> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

    if (error || !data) return null;
    return data as UserProfile;
};

export const hasRole = async (requiredRole: UserRole): Promise<boolean> => {
    const profile = await getCurrentProfile();
    if (!profile) return false;
    if (profile.role === 'admin') return true; // Admin has all permissions
    return profile.role === requiredRole;
};

export const logAudit = async (action: string, resource: string, details: any = {}) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return; // Anonymous actions not logged strictly, or could be logged as 'system'

    await supabase.from('audit_logs').insert({
        user_id: user.id,
        action,
        resource,
        details
    });
};
