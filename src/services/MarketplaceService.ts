import { supabase } from '../supabaseClient';
import { Database } from '../db_types';

export type CommunityPreset = Database['public']['Tables']['community_presets']['Row'];
export type PresetLike = Database['public']['Tables']['preset_likes']['Row'];

export interface PresetWithCreator extends CommunityPreset {
    creator: {
        full_name: string;
        avatar_url?: string;
    };
    isLibked?: boolean; // Optimistic UI
}

export class MarketplaceService {
    static async getPresets(orderBy: 'popular' | 'new' = 'popular', page = 0, limit = 20) {
        let query = supabase
            .from('community_presets')
            .select(`
                *,
                creator:profiles(full_name, avatar_url)
            `);

        if (orderBy === 'popular') {
            query = query.order('likes_count', { ascending: false });
        } else {
            query = query.order('created_at', { ascending: false });
        }

        const { data, error } = await query.range(page * limit, (page + 1) * limit - 1);

        if (error) {
            console.error('Error fetching presets:', error);
            return [];
        }
        return data as unknown as PresetWithCreator[];
    }

    static async getUserPresets(userId: string) {
        const { data, error } = await supabase
            .from('community_presets')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching user presets:', error);
            return [];
        }
        return data as CommunityPreset[];
    }

    static async publishPreset(preset: { name: string; description: string; layers: any; is_premium: boolean }, userId: string) {
        const { data, error } = await supabase
            .from('community_presets')
            .insert([{ ...preset, user_id: userId }])
            .select()
            .single();

        if (error) throw error;
        return data;
    }

    static async deletePreset(presetId: string) {
        const { error } = await supabase
            .from('community_presets')
            .delete()
            .eq('id', presetId);

        if (error) throw error;
    }

    static async toggleLike(presetId: string, userId: string, isLiked: boolean) {
        if (isLiked) {
            // Unlike
            const { error } = await supabase
                .from('preset_likes')
                .delete()
                .match({ preset_id: presetId, user_id: userId });
            if (error) throw error;
        } else {
            // Like
            const { error } = await supabase
                .from('preset_likes')
                .insert([{ preset_id: presetId, user_id: userId }]);
            if (error) throw error;
        }
    }

    static async incrementDownloads(presetId: string) {
        // RPC call would be atomic, but for now simple update
        // Ideally: call a database function
        // We'll just assume atomic updates aren't critical for MVP or add an RPC
        // Let's add an RPC for it later or use a raw query if needed.
        // For now, simpler approach:
        const { error } = await supabase.rpc('increment_downloads', { row_id: presetId });
        if (error) console.error('Error incrementing downloads:', error);
    }
}
