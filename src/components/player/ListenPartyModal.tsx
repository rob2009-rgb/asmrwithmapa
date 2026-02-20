import React, { useState } from 'react';
import { useScrollLock } from '../../hooks/useScrollLock';
import { X, Users, Link as LinkIcon, LogOut, Loader2, PlayCircle, Lock } from 'lucide-react';
import { ListenPartyService, ChatMessage } from '../../services/ListenPartyService';
import { useNotification } from '../../contexts/NotificationContext';
import { ListenPartyChat } from './ListenPartyChat';

interface ListenPartyModalProps {
    isOpen: boolean;
    onClose: () => void;
    userId: string | undefined;
    activeSessionId: string | null;
    onCreateSession: () => void;
    onJoinSession: (sessionId: string) => void;
    onLeaveSession: () => void;
    messages: ChatMessage[];
    onSendMessage: (text: string) => void;
    isPremium: boolean;
    onOpenPremium: () => void;
}

export const ListenPartyModal: React.FC<ListenPartyModalProps> = ({
    isOpen,
    onClose,
    userId,
    activeSessionId,
    onCreateSession,
    onJoinSession,
    onLeaveSession,
    messages,
    onSendMessage,
    isPremium,
    onOpenPremium
}) => {
    useScrollLock(isOpen);
    const [joinCode, setJoinCode] = useState('');
    const [isJoining, setIsJoining] = useState(false);
    const { showNotification } = useNotification();

    const handleJoin = async () => {
        if (!joinCode || joinCode.length < 6) {
            showNotification('error', 'Please enter a valid 6-character room code.');
            return;
        }
        setIsJoining(true);
        onJoinSession(joinCode.toLowerCase());
        setJoinCode('');
        setIsJoining(false);
    };

    const copyCode = () => {
        if (activeSessionId) {
            navigator.clipboard.writeText(activeSessionId);
            showNotification('success', 'Room code copied to clipboard!');
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-md" onClick={onClose} />
            <div className="relative w-full max-w-sm bg-slate-900 border border-slate-800 rounded-[2.5rem] p-8 shadow-2xl animate-in zoom-in-95 duration-300 max-h-[90vh] overflow-y-auto">
                <button onClick={onClose} className="absolute top-6 right-6 text-slate-500 hover:text-white"><X size={20} /></button>

                <div className="text-center mb-6">
                    <div className="w-16 h-16 mx-auto rounded-3xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center text-3xl mb-4 border border-indigo-500/30">
                        <Users size={32} />
                    </div>
                    <h3 className="text-2xl font-bold text-white">Listening Party</h3>
                    <p className="text-xs text-slate-500 mt-1 uppercase tracking-widest font-bold">Synchronized Playback</p>
                </div>

                {activeSessionId ? (
                    <div className="space-y-4">
                        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 text-center space-y-2">
                            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Active Room Code</p>
                            <div className="flex items-center justify-center gap-3">
                                <span className="text-3xl font-black text-indigo-400 tracking-widest uppercase">{activeSessionId}</span>
                                <button onClick={copyCode} className="p-2 text-slate-500 hover:text-white transition-colors">
                                    <LinkIcon size={18} />
                                </button>
                            </div>
                        </div>

                        <div className="text-center">
                            <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-500/20 text-emerald-400 text-[10px] font-black uppercase tracking-widest rounded-full border border-emerald-500/30">
                                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" /> Live & Synced
                            </div>
                        </div>

                        <ListenPartyChat
                            messages={messages}
                            onSendMessage={onSendMessage}
                            currentUserId={userId || ''}
                        />

                        <button
                            onClick={onLeaveSession}
                            className="w-full py-4 bg-red-900/20 text-red-400 border border-red-900/50 hover:bg-red-900/40 font-bold rounded-2xl transition-all flex items-center justify-center gap-2 mt-4"
                        >
                            <LogOut size={18} /> Leave Session
                        </button>
                    </div>
                ) : (
                    <div className="space-y-6">
                        <div className="space-y-3">
                            <button
                                onClick={() => isPremium ? onCreateSession() : onOpenPremium()}
                                className={`w-full py-4 font-bold rounded-2xl shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2 ${isPremium
                                    ? 'bg-indigo-600 hover:bg-indigo-500 text-white'
                                    : 'bg-slate-800 text-slate-400 border border-slate-700 hover:bg-slate-750'
                                    }`}
                            >
                                {isPremium ? <PlayCircle size={18} /> : <Lock size={18} className="text-amber-500" />}
                                {isPremium ? 'Create New Room' : 'Unlock Room Creation'}
                            </button>
                            <p className="text-[10px] text-slate-600 text-center uppercase font-bold tracking-widest">— or join existing —</p>
                        </div>

                        <div className="space-y-3">
                            <input
                                type="text"
                                placeholder="Enter 6-digit code"
                                className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 text-white text-center font-mono text-xl tracking-widest focus:border-indigo-500 outline-none transition-colors uppercase"
                                value={joinCode}
                                onChange={(e) => setJoinCode(e.target.value.slice(0, 6))}
                                onKeyDown={(e) => e.key === 'Enter' && handleJoin()}
                            />
                            <button
                                onClick={handleJoin}
                                disabled={isJoining || joinCode.length < 6}
                                className="w-full py-4 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-white font-bold rounded-2xl transition-all flex items-center justify-center gap-2"
                            >
                                {isJoining ? <Loader2 size={18} className="animate-spin" /> : 'Join Session'}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
