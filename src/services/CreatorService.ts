import { supabase } from '../supabaseClient';

export interface Creator {
    id: string;
    name: string;
    bio: string;
    avatar_url: string;
    support_link: string;
}

export class CreatorService {
    static async getCreatorByCategoryId(categoryId: string): Promise<Creator | null> {
        try {
            const { data, error } = await supabase
                .from('categories')
                .select('creator:creators(*)')
                .eq('id', categoryId)
                .single();

            if (error) throw error;
            return (data as any).creator;
        } catch (error) {
            console.error('Error fetching creator:', error);
            return null;
        }
    }

    static async sendTip(senderId: string | undefined, creatorId: string, amount: number, message: string) {
        try {
            const { error } = await supabase
                .from('tips')
                .insert({
                    sender_id: senderId,
                    creator_id: creatorId,
                    amount,
                    message
                });

            if (error) throw error;
            return { success: true };
        } catch (error: any) {
            console.error('Error sending tip:', error);
            return { success: false, error: error.message };
        }
    }
}
