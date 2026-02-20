
import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { Database } from '../db_types';

export type Ticket = Database['public']['Tables']['tickets']['Row'];
export type TicketMessage = Database['public']['Tables']['ticket_messages']['Row'];

export const useSupport = (userId?: string) => {
    const [tickets, setTickets] = useState<Ticket[]>([]);
    const [messages, setMessages] = useState<Record<string, TicketMessage[]>>({});
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (userId) {
            loadTickets();
        }
    }, [userId]);

    const loadTickets = async () => {
        if (!userId) return;
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('tickets')
                .select('*')
                .eq('user_id', userId)
                .order('updated_at', { ascending: false });

            if (error) throw error;
            setTickets(data || []);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const loadMessages = async (ticketId: string) => {
        try {
            const { data, error } = await supabase
                .from('ticket_messages')
                .select('*')
                .eq('ticket_id', ticketId)
                .order('created_at', { ascending: true });

            if (error) throw error;
            setMessages(prev => ({ ...prev, [ticketId]: data || [] }));
        } catch (err: any) {
            console.error('Error loading messages:', err);
        }
    };

    /**
     * Subscribe to realtime INSERT events on ticket_messages for a given ticket.
     * Returns a cleanup function — call it in a useEffect return to unsubscribe.
     */
    const subscribeToMessages = (ticketId: string) => {
        const channel = supabase
            .channel(`ticket_messages:${ticketId}`)
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'ticket_messages',
                    filter: `ticket_id=eq.${ticketId}`,
                },
                (payload) => {
                    const newMessage = payload.new as TicketMessage;
                    setMessages(prev => ({
                        ...prev,
                        [ticketId]: [...(prev[ticketId] || []), newMessage],
                    }));
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    };

    const uploadFiles = async (files: File[], ticketId: string): Promise<string[]> => {
        const uploadedUrls: string[] = [];
        for (const file of files) {
            try {
                const fileExt = file.name.split('.').pop();
                const fileName = `${ticketId}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
                const { error: uploadError } = await supabase.storage
                    .from('support-attachments')
                    .upload(fileName, file);

                if (uploadError) throw uploadError;

                const { data } = supabase.storage
                    .from('support-attachments')
                    .getPublicUrl(fileName);

                if (data) uploadedUrls.push(data.publicUrl);
            } catch (error) {
                console.error('Error uploading file:', error);
            }
        }
        return uploadedUrls;
    };

    const createTicket = async (subject: string, category: string, message: string, priority: 'low' | 'normal' | 'high' | 'urgent' = 'normal', files: File[] = []) => {
        if (!userId) return null;
        setLoading(true);
        try {
            const { data: ticketData, error: ticketError } = await supabase
                .from('tickets')
                .insert([{
                    user_id: userId,
                    subject,
                    category,
                    priority,
                    status: 'open',
                    updated_at: new Date().toISOString()
                } as Database['public']['Tables']['tickets']['Insert']])
                .select()
                .single();

            if (ticketError) throw ticketError;

            let attachmentUrls: string[] = [];
            if (files.length > 0) {
                attachmentUrls = await uploadFiles(files, ticketData.id);
            }

            const { error: msgError } = await supabase
                .from('ticket_messages')
                .insert([{
                    ticket_id: ticketData.id,
                    sender_id: userId,
                    message,
                    is_staff_reply: false,
                    attachments: attachmentUrls
                } as any]);

            if (msgError) throw msgError;

            await loadTickets();
            return ticketData;
        } catch (err: any) {
            setError(err.message);
            return null;
        } finally {
            setLoading(false);
        }
    };

    const sendMessage = async (ticketId: string, message: string, files: File[] = []) => {
        if (!userId) return;
        try {
            let attachmentUrls: string[] = [];
            if (files.length > 0) {
                attachmentUrls = await uploadFiles(files, ticketId);
            }

            const { error } = await supabase
                .from('ticket_messages')
                .insert([{
                    ticket_id: ticketId,
                    sender_id: userId,
                    message,
                    is_staff_reply: false,
                    attachments: attachmentUrls
                } as any]);

            if (error) throw error;

            await supabase
                .from('tickets')
                .update({ updated_at: new Date().toISOString() } as Database['public']['Tables']['tickets']['Update'])
                .eq('id', ticketId);

            await loadMessages(ticketId);
        } catch (err: any) {
            setError(err.message);
        }
    };

    return {
        tickets,
        messages,
        loading,
        error,
        loadTickets,
        loadMessages,
        subscribeToMessages,
        createTicket,
        sendMessage
    };
};
