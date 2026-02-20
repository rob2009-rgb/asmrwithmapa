import React, { useState, useEffect } from 'react';
import { MessageSquare, CheckCircle, Clock, AlertCircle, Send, Loader, ChevronRight, FileText, XCircle, AlertTriangle, Activity, Sparkles, Meh, Frown, Smile, Image as ImageIcon, Paperclip, X } from 'lucide-react';
import { supabase } from '../../src/supabaseClient';
import { Database } from '../../src/db_types';
import { getCurrentProfile } from '../../src/utils/authManager';
import { useEmail } from '../../src/hooks/useEmail';

type Ticket = Database['public']['Tables']['tickets']['Row'] & {
    profiles: { email: string } | null;
    ticket_messages: { message: string, attachments?: string[] }[];
};
type TicketMessage = Database['public']['Tables']['ticket_messages']['Row'] & { attachments?: string[] };

const SupportPanel: React.FC = () => {
    // Ticket State
    const [tickets, setTickets] = useState<Ticket[]>([]);
    const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
    const [messages, setMessages] = useState<TicketMessage[]>([]);
    const [replyText, setReplyText] = useState('');
    const [sending, setSending] = useState(false);
    const [drafting, setDrafting] = useState(false);
    const [files, setFiles] = useState<File[]>([]);
    const fileInputRef = React.useRef<HTMLInputElement>(null);

    const { notifyTicketReply, notifyTicketClosed } = useEmail();

    const [loading, setLoading] = useState(false);

    useEffect(() => {
        loadTickets();
    }, []);

    useEffect(() => {
        if (selectedTicket) {
            loadMessages(selectedTicket.id);
        }
    }, [selectedTicket]);

    const loadTickets = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('tickets')
                .select('*, profiles(email), ticket_messages(message)')
                .order('updated_at', { ascending: false });

            if (error) throw error;
            setTickets((data as any) || []);
        } catch (error) {
            console.error('Error loading tickets:', error);
        } finally {
            setLoading(false);
        }
    };

    const loadMessages = async (ticketId: string) => {
        const { data } = await supabase
            .from('ticket_messages')
            .select('*')
            .eq('ticket_id', ticketId)
            .order('created_at', { ascending: true });
        setMessages(data || []);
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

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            setFiles(prev => [...prev, ...Array.from(e.target.files!)]);
        }
    };

    const removeFile = (index: number) => {
        setFiles(prev => prev.filter((_, i) => i !== index));
    };

    const sendReply = async () => {
        if (!replyText.trim() || !selectedTicket) return;
        setSending(true);
        try {
            const user = await supabase.auth.getUser();
            if (!user.data.user) return;

            let attachmentUrls: string[] = [];
            if (files.length > 0) {
                attachmentUrls = await uploadFiles(files, selectedTicket.id);
            }

            const { error } = await supabase.from('ticket_messages').insert([{
                ticket_id: selectedTicket.id,
                sender_id: user.data.user.id,
                message: replyText,
                is_staff_reply: true,
                attachments: attachmentUrls
            }]);

            if (error) throw error;

            await supabase.from('tickets').update({
                updated_at: new Date().toISOString(),
                status: selectedTicket.status === 'open' ? 'in_progress' : selectedTicket.status
            }).eq('id', selectedTicket.id);

            // Trigger 'email_flow_ticket_reply'
            if (selectedTicket.profiles?.email) {
                notifyTicketReply(selectedTicket.profiles.email, 'User', selectedTicket.id, selectedTicket.subject, replyText);
            }
            console.info("Trigger email: email_flow_ticket_reply");

            setReplyText('');
            setFiles([]);
            loadMessages(selectedTicket.id);
            loadTickets();
        } catch (error) {
            console.error('Error sending reply:', error);
        } finally {
            setSending(false);
        }
    };

    const draftWithAI = async () => {
        if (!selectedTicket) return;
        setDrafting(true);

        try {
            const apiKey = (import.meta as any).env?.VITE_GEMINI_API_KEY;

            // Build conversation context from the last 5 messages
            const recentMessages = messages
                .slice(-5)
                .map(m => `${m.is_staff_reply ? '[Support Agent]' : '[User]'}: ${m.message}`)
                .join('\n');

            const prompt = `You are a friendly, professional customer support agent for MAPA ASMR, a premium ASMR streaming app.

Ticket subject: "${selectedTicket.subject}"
Category: ${selectedTicket.category || 'General'}
Priority: ${selectedTicket.priority || 'normal'}

Recent conversation:
${recentMessages || '(No messages yet — this is the first reply)'}

Write a helpful, empathetic, and concise reply to this support ticket. Be warm but professional. Address the issue directly. Do not use placeholders like [Name]. End with "– The MAPA Support Team".`;

            if (apiKey) {
                const response = await fetch(
                    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
                    {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            contents: [{ parts: [{ text: prompt }] }],
                            generationConfig: { maxOutputTokens: 300, temperature: 0.7 }
                        })
                    }
                );
                const data = await response.json();
                const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
                if (text) {
                    setReplyText(text.trim());
                    setDrafting(false);
                    return;
                }
            }

            // Fallback if no API key configured
            setReplyText(
                `Hi,\n\nThank you for reaching out regarding "${selectedTicket.subject}". We're looking into this for you and will follow up shortly.\n\nCould you provide any additional details that might help us resolve this faster?\n\n– The MAPA Support Team\n\n⚠️ (AI draft: add VITE_GEMINI_API_KEY to .env.local for real AI suggestions)`
            );
        } catch (err) {
            console.error('AI draft error:', err);
            setReplyText('(AI drafting failed — please type your reply manually)');
        } finally {
            setDrafting(false);
        }
    };

    const updateStatus = async (status: 'open' | 'in_progress' | 'resolved' | 'closed') => {
        if (!selectedTicket) return;
        await supabase.from('tickets').update({ status }).eq('id', selectedTicket.id);

        if (status === 'resolved' || status === 'closed') {
            if (selectedTicket.profiles?.email) {
                notifyTicketClosed(selectedTicket.profiles.email, 'User', selectedTicket.id, selectedTicket.subject);
            }
            console.info("Trigger email: email_flow_ticket_closed");
        }

        setSelectedTicket({ ...selectedTicket, status });
        loadTickets();
    };

    // --- Helpers for UI Features ---

    const getSentiment = (text: string) => {
        const lower = text.toLowerCase();
        // Negative keywords and phrases
        if (lower.match(/urgent|broken|fail|error|hate|worst|angry|hell|crazy|bad|not working|scam|money|refund|terrible|horrible|useless|disappointed|not happy|issue|problem|bug|slow/)) {
            return { icon: <Frown size={14} />, color: 'bg-red-100 text-red-600', label: 'Frustrated' };
        }
        // Positive keywords
        else if (lower.match(/thanks|love|great|good|help|best|wonderful|amazing|awesome|perfect|appreciated|solved|fixed/)) {
            return { icon: <Smile size={14} />, color: 'bg-green-100 text-green-600', label: 'Happy' };
        }
        return { icon: <Meh size={14} />, color: 'bg-gray-100 text-gray-600', label: 'Neutral' };
    };

    const getSLAStatus = (ticket: Ticket) => {
        if (ticket.status === 'resolved' || ticket.status === 'closed') return null;

        const created = new Date(ticket.created_at).getTime();
        const now = Date.now();
        const hoursDiff = (now - created) / (1000 * 60 * 60);

        // SLA Hours per priority
        const slaHours: Record<string, number> = { urgent: 4, high: 12, normal: 24, low: 48 };
        const allowed = slaHours[ticket.priority] || 24;
        const remaining = allowed - hoursDiff;

        if (remaining < 0) {
            return { text: `Overdue by ${Math.abs(Math.round(remaining))}h`, color: 'text-red-600 font-bold bg-red-50' };
        } else if (remaining < 4) {
            return { text: `Due in ${Math.round(remaining)}h`, color: 'text-orange-600 font-bold bg-orange-50' };
        }
        return { text: `Due in ${Math.round(remaining)}h`, color: 'text-gray-500 bg-gray-50' };
    };

    const StatusBadge = ({ status }: { status: string }) => {
        const colors: Record<string, string> = {
            open: 'bg-blue-100 text-blue-800',
            in_progress: 'bg-yellow-100 text-yellow-800',
            resolved: 'bg-green-100 text-green-800',
            closed: 'bg-gray-100 text-gray-800'
        };
        return (
            <span className={`px-2 py-1 rounded-full text-xs font-bold uppercase ${colors[status] || colors.open}`}>
                {status.replace('_', ' ')}
            </span>
        );
    };

    return (
        <div className="flex flex-col h-[600px] bg-white dark:bg-slate-900 rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700 shadow-xl">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center gap-2">
                <MessageSquare className="text-pink-500" />
                <h2 className="font-bold text-lg dark:text-white">Support Tickets</h2>
            </div>

            <div className="flex flex-1 overflow-hidden">
                {/* LIST COLUMN */}
                <div className={`w-1/3 border-r border-gray-200 dark:border-gray-700 overflow-y-auto ${selectedTicket ? 'hidden md:block' : 'block'}`}>
                    {loading ? <div className="p-4 text-center text-gray-500"><Loader className="animate-spin inline mr-2" /> Loading...</div> : (
                        <div className="divide-y divide-gray-100 dark:divide-gray-800">
                            {/* TICKETS LIST */}
                            {tickets.map(t => {
                                const firstMsg = t.ticket_messages?.[0]?.message || "";
                                const sentiment = getSentiment(t.subject + " " + firstMsg);
                                const sla = getSLAStatus(t);
                                return (
                                    <div
                                        key={t.id}
                                        onClick={() => setSelectedTicket(t)}
                                        className={`p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors ${selectedTicket?.id === t.id ? 'bg-blue-50 dark:bg-slate-800 border-l-4 border-blue-500' : ''}`}
                                    >
                                        <div className="flex justify-between mb-2">
                                            <div className="flex gap-2 items-center">
                                                <span className={`text-xs font-bold px-2 py-0.5 rounded ${t.priority === 'urgent' ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-500'}`}>{t.priority}</span>
                                                {sla && <span className={`text-[10px] px-1.5 py-0.5 rounded flex items-center gap-1 ${sla.color}`}><Clock size={10} /> {sla.text}</span>}
                                            </div>
                                            <span className="text-xs text-gray-400">{new Date(t.created_at).toLocaleDateString()}</span>
                                        </div>
                                        <h4 className="font-bold text-sm truncate mb-1">{t.subject}</h4>
                                        <div className="flex justify-between items-center mt-2">
                                            <div className={`flex items-center gap-1 text-xs px-2 py-0.5 rounded-full ${sentiment.color}`}>
                                                {sentiment.icon} {sentiment.label}
                                            </div>
                                            <div className="flex items-center gap-2">
                                                {(t as any).csat_score && (
                                                    <span className="text-amber-400 text-xs font-bold" title={`CSAT: ${(t as any).csat_score}/5`}>
                                                        {'★'.repeat((t as any).csat_score)}{'☆'.repeat(5 - (t as any).csat_score)}
                                                    </span>
                                                )}
                                                <StatusBadge status={t.status} />
                                            </div>
                                        </div>
                                    </div>
                                )
                            })}

                            {tickets.length === 0 && (
                                <div className="p-8 text-center text-gray-400 italic">No tickets found.</div>
                            )}
                        </div>
                    )}
                </div>

                {/* DETAIL COLUMN */}
                <div className={`flex-1 flex flex-col ${!selectedTicket ? 'hidden md:flex' : 'flex'}`}>

                    {/* TICKET DETAIL */}
                    {selectedTicket ? (
                        <>
                            <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-start bg-gray-50 dark:bg-slate-800">
                                <div className="flex items-start gap-3">
                                    <button onClick={() => setSelectedTicket(null)} className="md:hidden p-1 mr-2"><ChevronRight className="rotate-180" /></button>
                                    <div>
                                        <div className="flex items-center gap-2 mb-1">
                                            <h3 className="font-bold text-lg">{selectedTicket.subject}</h3>
                                            <span className={`text-xs px-2 py-0.5 rounded-full flex items-center gap-1 ${getSentiment(selectedTicket.subject + " " + (messages[0]?.message || "")).color}`}>
                                                {getSentiment(selectedTicket.subject + " " + (messages[0]?.message || "")).icon} {getSentiment(selectedTicket.subject + " " + (messages[0]?.message || "")).label} Sentiment
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-4 text-xs text-gray-500">
                                            <span>Start: {new Date(selectedTicket.created_at).toLocaleString()}</span>
                                            {getSLAStatus(selectedTicket) && (
                                                <span className={`px-2 py-0.5 rounded flex items-center gap-1 ${getSLAStatus(selectedTicket)?.color}`}>
                                                    <Clock size={12} /> SLA: {getSLAStatus(selectedTicket)?.text}
                                                </span>
                                            )}
                                            {(selectedTicket as any).csat_score && (
                                                <span className="flex items-center gap-1 text-amber-500 font-bold">
                                                    {'★'.repeat((selectedTicket as any).csat_score)}{'☆'.repeat(5 - (selectedTicket as any).csat_score)}
                                                    <span className="text-gray-400 font-normal">({(selectedTicket as any).csat_score}/5</span>
                                                    {(selectedTicket as any).csat_comment && (
                                                        <span className="text-gray-400 font-normal italic">— &ldquo;{(selectedTicket as any).csat_comment}&rdquo;</span>
                                                    )}
                                                    <span className="text-gray-400 font-normal">)</span>
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                <select
                                    className="text-sm border rounded p-1 dark:bg-slate-700"
                                    value={selectedTicket.status}
                                    onChange={(e) => updateStatus(e.target.value as any)}
                                >
                                    <option value="open">Open</option>
                                    <option value="in_progress">In Progress</option>
                                    <option value="resolved">Resolved</option>
                                    <option value="closed">Closed</option>
                                </select>
                            </div>

                            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50/50 dark:bg-slate-900/50">
                                {messages.map(m => (
                                    <div key={m.id} className={`flex ${m.is_staff_reply ? 'justify-end' : 'justify-start'}`}>
                                        <div className={`max-w-[80%] rounded-2xl p-4 ${m.is_staff_reply ? 'bg-blue-500 text-white rounded-br-none' : 'bg-white dark:bg-slate-800 shadow-sm rounded-bl-none'}`}>
                                            <p className="text-sm whitespace-pre-wrap">{m.message}</p>
                                            {m.attachments && m.attachments.length > 0 && (
                                                <div className="flex flex-wrap gap-2 mt-2">
                                                    {m.attachments.map((url, i) => (
                                                        <a key={i} href={url} target="_blank" rel="noopener noreferrer" className="block w-20 h-20 rounded-lg overflow-hidden border border-white/20 bg-black/10 hover:opacity-80 transition-opacity">
                                                            <img src={url} alt="attachment" className="w-full h-full object-cover" />
                                                        </a>
                                                    ))}
                                                </div>
                                            )}
                                            <span className={`text-[10px] block mt-1 opacity-70 ${m.is_staff_reply ? 'text-blue-100' : 'text-gray-400'}`}>
                                                {new Date(m.created_at).toLocaleTimeString()} {m.is_staff_reply && '(Staff)'}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-slate-900">
                                <div className="flex justify-between items-center mb-2">
                                    <span className="text-xs text-gray-400 font-bold uppercase">Reply to User</span>
                                    <button
                                        onClick={draftWithAI}
                                        disabled={drafting || sending}
                                        className="text-xs bg-purple-100 hover:bg-purple-200 text-purple-700 px-3 py-1.5 rounded-lg flex items-center gap-1 transition-colors disabled:opacity-50"
                                    >
                                        {drafting ? <Loader size={12} className="animate-spin" /> : <Sparkles size={12} />}
                                        {drafting ? 'Drafting...' : 'Draft with AI'}
                                    </button>
                                </div>
                                <div className="flex space-x-2">
                                    <textarea
                                        className="flex-1 p-3 border rounded-xl resize-none focus:ring-2 focus:ring-blue-500 focus:outline-none dark:bg-slate-800 dark:border-slate-700"
                                        rows={3}
                                        placeholder="Type your reply..."
                                        value={replyText}
                                        onChange={e => setReplyText(e.target.value)}
                                        onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendReply(); } }}
                                    />
                                    <button
                                        onClick={sendReply}
                                        disabled={sending || !replyText.trim()}
                                        className="px-4 bg-blue-500 hover:bg-blue-600 text-white rounded-xl shadow-lg disabled:opacity-50 flex items-center justify-center transition-all"
                                    >
                                        {sending ? <Loader className="animate-spin" /> : <Send />}
                                    </button>
                                </div>
                                <div className="flex justify-between items-center mt-2">
                                    <div className="flex gap-2">
                                        <input
                                            type="file"
                                            multiple
                                            accept="image/*"
                                            className="hidden"
                                            ref={fileInputRef}
                                            onChange={handleFileSelect}
                                        />
                                        <button
                                            onClick={() => fileInputRef.current?.click()}
                                            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-white transition-colors p-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg flex items-center gap-2 text-xs font-bold"
                                        >
                                            <Paperclip size={16} /> Attach Image
                                        </button>
                                        {files.length > 0 && <span className="text-xs text-gray-400 flex items-center">{files.length} selected</span>}
                                    </div>
                                    {files.length > 0 && (
                                        <div className="flex flex-wrap gap-2">
                                            {files.map((file, i) => (
                                                <div key={i} className="relative group">
                                                    <div className="w-8 h-8 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-slate-800">
                                                        <img src={URL.createObjectURL(file)} alt="preview" className="w-full h-full object-cover" />
                                                    </div>
                                                    <button
                                                        onClick={() => removeFile(i)}
                                                        className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                                                    >
                                                        <X size={8} />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center text-gray-400 space-y-4">
                            <MessageSquare size={48} className="opacity-20" />
                            <p>Select a ticket to view details</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default SupportPanel;
