import React, { useState, useEffect, useRef } from 'react';
import { Send, MessageSquare, User } from 'lucide-react';
import { ChatMessage } from '../../services/ListenPartyService';

interface ListenPartyChatProps {
    messages: ChatMessage[];
    onSendMessage: (text: string) => void;
    currentUserId: string;
}

export const ListenPartyChat: React.FC<ListenPartyChatProps> = ({ messages, onSendMessage, currentUserId }) => {
    const [text, setText] = useState('');
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    const handleSend = (e?: React.FormEvent) => {
        e?.preventDefault();
        if (!text.trim()) return;
        onSendMessage(text);
        setText('');
    };

    return (
        <div className="flex flex-col h-64 bg-slate-900/50 rounded-xl border border-slate-700/50 overflow-hidden mt-4">
            <div className="flex items-center px-4 py-2 bg-slate-800/50 border-b border-slate-700/50">
                <MessageSquare size={14} className="text-pink-400 mr-2" />
                <span className="text-xs font-bold text-slate-300 uppercase tracking-widest">Live Chat</span>
            </div>

            <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3">
                {messages.length === 0 && (
                    <div className="text-center text-slate-500 text-xs italic mt-4">
                        No messages yet. Say hello!
                    </div>
                )}
                {messages.map((msg) => {
                    const isMe = msg.senderId === currentUserId;
                    return (
                        <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-[85%] rounded-xl px-3 py-2 text-xs ${isMe
                                    ? 'bg-pink-500 text-white rounded-br-none'
                                    : 'bg-slate-700 text-slate-200 rounded-bl-none'
                                }`}>
                                {!isMe && <div className="text-[9px] text-slate-400 mb-0.5 max-w-[100px] truncate">{msg.senderId.slice(0, 6)}</div>}
                                {msg.text}
                            </div>
                        </div>
                    );
                })}
            </div>

            <form onSubmit={handleSend} className="p-2 bg-slate-800/50 flex gap-2">
                <input
                    type="text"
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    placeholder="Type a message..."
                    className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-pink-500 transition-colors"
                />
                <button
                    type="submit"
                    disabled={!text.trim()}
                    className="p-1.5 bg-pink-500 text-white rounded-lg hover:bg-pink-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                    <Send size={14} />
                </button>
            </form>
        </div>
    );
};
