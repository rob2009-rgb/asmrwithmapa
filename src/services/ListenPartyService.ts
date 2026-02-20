import { supabase } from '../supabaseClient';
import { RealtimeChannel } from '@supabase/supabase-js';

export interface SessionState {
    id: string;
    host_id: string;
    current_sound_id: string;
    variation_index: number;
    is_playing: boolean;
    playback_position: number;
}

export type SessionCallback = (state: SessionState) => void;

export interface ChatMessage {
    id: string;
    senderId: string;
    text: string;
    timestamp: number;
}

export class ListenPartyService {
    private static channel: RealtimeChannel | null = null;
    private static sessionId: string | null = null;

    static async createSession(userId: string, soundId: string, variationIndex: number): Promise<string | null> {
        try {
            const { data, error } = await supabase
                .from('listening_sessions')
                .insert({
                    host_id: userId,
                    current_sound_id: soundId,
                    variation_index: variationIndex,
                    is_playing: true,
                    playback_position: 0
                })
                .select()
                .single();

            if (error) throw error;
            return data.id;
        } catch (error) {
            console.error('Error creating session:', error);
            return null;
        }
    }

    static async joinSession(sessionId: string, onUpdate: SessionCallback, onMessage?: (msg: ChatMessage) => void): Promise<boolean> {
        this.leaveSession();

        const { data, error } = await supabase
            .from('listening_sessions')
            .select('*')
            .eq('id', sessionId)
            .single();

        if (error || !data) return false;

        this.sessionId = sessionId;
        this.channel = supabase.channel(`session:${sessionId}`)
            .on('postgres_changes', {
                event: 'UPDATE',
                schema: 'public',
                table: 'listening_sessions',
                filter: `id=eq.${sessionId}`
            }, (payload) => {
                onUpdate(payload.new as SessionState);
            })
            .on('broadcast', { event: 'chat_message' }, (payload) => {
                if (onMessage) onMessage(payload.payload as ChatMessage);
            })
            .subscribe();

        onUpdate(data as SessionState);
        return true;
    }

    static async sendMessage(msg: Omit<ChatMessage, 'timestamp'>) {
        if (!this.channel) return;
        await this.channel.send({
            type: 'broadcast',
            event: 'chat_message',
            payload: { ...msg, timestamp: Date.now() }
        });
    }

    static async updateSession(userId: string, sessionId: string, updates: Partial<SessionState>) {
        try {
            const { error } = await supabase
                .from('listening_sessions')
                .update(updates)
                .eq('id', sessionId)
                .eq('host_id', userId);

            if (error) console.warn('Update session failed (likely not host):', error);
        } catch (error) {
            console.error('Update session error:', error);
        }
    }

    static leaveSession() {
        if (this.channel) {
            this.channel.unsubscribe();
            this.channel = null;
        }
        this.sessionId = null;
    }
}
