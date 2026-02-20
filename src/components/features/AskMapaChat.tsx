import React, { useState, useEffect, useRef } from 'react';
import { Sparkles, X, Send, Loader2, Minimize2 } from 'lucide-react';
import { moodService } from '../../services/MoodService';
import { SoundCategory } from '../../../types';

interface Message {
    id: string;
    role: 'user' | 'model';
    text: string;
    timestamp: Date;
}

interface AskMapaChatProps {
    isOpen: boolean;
    onClose: () => void;
    categories: SoundCategory[];
    onSelectCategory: (category: SoundCategory) => void;
    isNightMode: boolean;
    initialMessage?: string;
}

export const AskMapaChat: React.FC<AskMapaChatProps> = ({
    isOpen,
    onClose,
    categories,
    onSelectCategory,
    isNightMode,
    initialMessage
}) => {
    const [messages, setMessages] = useState<Message[]>([
        {
            id: '1',
            role: 'model',
            text: "Hello, I'm Mapa. I'm here to help you find the perfect trigger for your mood. How are you feeling right now?",
            timestamp: new Date()
        }
    ]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isMinimized, setIsMinimized] = useState(false);
    const [lastAction, setLastAction] = useState<{ type: 'play', categoryId: string } | null>(null);
    const [bubblePos, setBubblePos] = useState({
        x: typeof window !== 'undefined' ? window.innerWidth - 88 : 0,
        y: typeof window !== 'undefined' ? window.innerHeight - 180 : 0
    });
    const [isDragging, setIsDragging] = useState(false);
    const dragOffset = useRef({ x: 0, y: 0 });
    const scrollRef = useRef<HTMLDivElement>(null);

    const handlePointerDown = (e: React.PointerEvent) => {
        if (!isMinimized) return;
        setIsDragging(true);
        dragOffset.current = {
            x: e.clientX - bubblePos.x,
            y: e.clientY - bubblePos.y
        };
        (e.target as HTMLElement).setPointerCapture(e.pointerId);
        e.stopPropagation();
    };

    const handlePointerMove = (e: React.PointerEvent) => {
        if (!isDragging) return;

        // Boundaries check
        const newX = Math.min(Math.max(20, e.clientX - dragOffset.current.x), window.innerWidth - 80);
        const newY = Math.min(Math.max(20, e.clientY - dragOffset.current.y), window.innerHeight - 80);

        setBubblePos({ x: newX, y: newY });
    };

    const handlePointerUp = (e: React.PointerEvent) => {
        if (!isDragging) return;
        setIsDragging(false);
        (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    };

    useEffect(() => {
        if (initialMessage && isOpen && messages.length === 1) {
            handleSendMessage(initialMessage);
        }
    }, [initialMessage, isOpen]);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages, isLoading]);

    const handleSendMessage = async (text: string) => {
        if (!text.trim() || isLoading) return;

        const userMsg: Message = {
            id: Date.now().toString(),
            role: 'user' as const,
            text: text.trim(),
            timestamp: new Date()
        };

        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setIsLoading(true);
        setLastAction(null);

        try {
            const chatHistory = messages
                .filter((m, i) => !(i === 0 && m.role === 'model'))
                .slice(-10) // Limit to last 10 messages for stability
                .map(m => ({
                    role: m.role,
                    parts: m.text
                }));

            const response = await moodService.getChatResponse(text, chatHistory as any, categories);

            const mapaMsg: Message = {
                id: (Date.now() + 1).toString(),
                role: 'model',
                text: response.text,
                timestamp: new Date()
            };

            setMessages(prev => [...prev, mapaMsg]);

            if (response.action?.type === 'play') {
                const category = categories.find(c => c.id === response.action?.categoryId);
                if (category) {
                    onSelectCategory(category);
                    setLastAction(response.action);
                }
            }
        } catch (error) {
            console.error("Chat error:", error);
        } finally {
            setIsLoading(false);
        }
    };

    if (!isOpen) return null;

    if (isMinimized) {
        return (
            <div
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                onClick={() => !isDragging && setIsMinimized(false)}
                style={{
                    left: bubblePos.x,
                    top: bubblePos.y,
                    touchAction: 'none'
                }}
                className={`fixed w-20 h-20 rounded-full cursor-grab active:cursor-grabbing z-[300] shadow-2xl border backdrop-blur-3xl flex items-center justify-center transition-transform hover:scale-105 active:scale-95 group animate-in zoom-in-50 fade-in
                ${isNightMode ? 'bg-slate-900/40 border-pink-500/30 ring-1 ring-pink-500/20' : 'bg-white/40 border-pink-200 ring-1 ring-pink-100'}`}
            >
                {/* Ethereal Glow Layers */}
                <div className="absolute inset-0 bg-gradient-to-br from-pink-500/20 via-rose-500/10 to-transparent rounded-full animate-pulse" />
                <div className="absolute -inset-2 bg-pink-500/5 blur-2xl rounded-full animate-pulse delay-700" />

                {/* AI Mapa "Avatar" Representation */}
                <div className="relative w-14 h-14 rounded-full overflow-hidden border border-white/20 shadow-inner flex items-center justify-center bg-gradient-to-tr from-pink-600/40 to-rose-400/40 backdrop-blur-md">
                    <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=200&auto=format&fit=crop')] bg-cover bg-center opacity-40 mix-blend-overlay" />
                    <Sparkles size={24} className="text-white relative z-10 animate-float drop-shadow-[0_0_8px_rgba(255,255,255,0.8)]" />

                    {/* Breathing Aura Rings */}
                    <div className="absolute inset-0 border-2 border-pink-400/20 rounded-full animate-ping-slow" />
                </div>

                <div className="absolute right-full mr-4 px-4 py-2 bg-slate-900/90 backdrop-blur-md text-white text-[10px] font-black uppercase tracking-widest rounded-xl opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none shadow-xl border border-white/10">
                    Ask Mapa
                </div>

                <style>{`
                    @keyframes ping-slow {
                        0% { transform: scale(1); opacity: 0.5; }
                        100% { transform: scale(1.5); opacity: 0; }
                    }
                    .animate-ping-slow {
                        animation: ping-slow 3s cubic-bezier(0, 0, 0.2, 1) infinite;
                    }
                    @keyframes float {
                        0%, 100% { transform: translateY(0) rotate(0); }
                        50% { transform: translateY(-4px) rotate(5deg); }
                    }
                    .animate-float {
                        animation: float 4s ease-in-out infinite;
                    }
                `}</style>
            </div>
        );
    }

    return (
        <div className="fixed bottom-24 right-6 w-[90vw] md:w-[400px] h-[500px] z-[200] animate-in slide-in-from-bottom-10 fade-in duration-300">
            <div className={`w-full h-full flex flex-col rounded-[2.5rem] shadow-2xl border backdrop-blur-2xl overflow-hidden
                ${isNightMode ? 'bg-slate-900/90 border-slate-800' : 'bg-white/90 border-pink-100'}`}>

                {/* Header */}
                <div className="p-6 bg-gradient-to-r from-pink-500 to-rose-600 flex items-center justify-between text-white shadow-lg">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-md border border-white/30">
                            <Sparkles size={20} className="animate-pulse" />
                        </div>
                        <div>
                            <h3 className="font-black uppercase tracking-widest text-sm">Ask Mapa</h3>
                            <div className="flex items-center gap-1.5">
                                <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
                                <span className="text-[10px] font-bold opacity-80 uppercase tracking-tighter">Your AI Guide</span>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-1">
                        <button
                            onClick={() => setIsMinimized(true)}
                            className="p-2 hover:bg-white/10 rounded-full transition-colors"
                            title="Minimize"
                        >
                            <Minimize2 size={20} />
                        </button>
                        <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                            <X size={20} />
                        </button>
                    </div>
                </div>

                {/* Messages Area */}
                <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-4 no-scrollbar">
                    {messages.map((msg, index) => (
                        <React.Fragment key={msg.id}>
                            <div className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-[85%] p-4 rounded-3xl text-sm leading-relaxed shadow-sm
                                    ${msg.role === 'user'
                                        ? 'bg-pink-500 text-white rounded-tr-none'
                                        : (isNightMode ? 'bg-slate-800 text-slate-200 rounded-tl-none' : 'bg-pink-50 text-slate-800 rounded-tl-none border border-pink-100')}`}>
                                    {msg.text}
                                </div>
                            </div>
                            {msg.role === 'model' && index === messages.length - 1 && lastAction && (
                                <div className="flex justify-start ml-2 mt-2 animate-in slide-in-from-left-4 fade-in duration-500">
                                    <button
                                        onClick={() => {
                                            const category = categories.find(c => c.id === lastAction.categoryId);
                                            if (category) onSelectCategory(category);
                                        }}
                                        className="flex items-center gap-3 px-6 py-3 bg-white/10 backdrop-blur-md border border-pink-500/30 rounded-2xl text-pink-400 font-bold text-xs uppercase tracking-widest hover:bg-pink-500 hover:text-white transition-all shadow-lg active:scale-95 group"
                                    >
                                        <Sparkles size={16} className="group-hover:rotate-12 transition-transform" />
                                        Play {categories.find(c => c.id === lastAction.categoryId)?.name}
                                    </button>
                                </div>
                            )}
                        </React.Fragment>
                    ))}
                    {isLoading && (
                        <div className="flex justify-start">
                            <div className={`p-4 rounded-3xl rounded-tl-none flex items-center gap-2
                                    ${isNightMode ? 'bg-slate-800 text-slate-400' : 'bg-pink-50 text-pink-400'}`}>
                                <Loader2 size={16} className="animate-spin" />
                                <span className="text-xs font-bold uppercase tracking-widest">Mapa is thinking...</span>
                            </div>
                        </div>
                    )}
                </div>

                {/* Input Area */}
                <form
                    onSubmit={(e) => { e.preventDefault(); handleSendMessage(input); }}
                    className={`p-4 border-t ${isNightMode ? 'border-slate-800 bg-slate-950/50' : 'border-pink-50 bg-white/50'}`}>
                    <div className="relative flex items-center">
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder="Tell Mapa how you feel..."
                            className={`w-full pl-5 pr-14 py-4 rounded-2xl text-sm outline-none transition-all border
                                    ${isNightMode
                                    ? 'bg-slate-900 border-slate-800 text-white focus:border-pink-500'
                                    : 'bg-white border-pink-100 text-slate-800 focus:border-pink-400'}`}
                        />
                        <button
                            type="submit"
                            disabled={!input.trim() || isLoading}
                            className="absolute right-2 p-3 bg-pink-500 text-white rounded-xl shadow-lg hover:bg-pink-600 disabled:opacity-50 disabled:grayscale transition-all active:scale-90"
                        >
                            <Send size={18} />
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
