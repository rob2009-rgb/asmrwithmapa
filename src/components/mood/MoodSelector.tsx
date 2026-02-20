import React, { useState } from 'react';
import { Sparkles, Loader2, Info, Lock } from 'lucide-react';
import { moodService } from '../../../utils/MoodService';
import { SoundCategory } from '../../../types';

interface MoodSelectorProps {
    categories: SoundCategory[];
    onSelectCategory: (category: SoundCategory) => void;
    isNightMode: boolean;
    isPremium?: boolean;
    onOpenPremium?: () => void;
}

export const MoodSelector: React.FC<MoodSelectorProps> = ({ categories, onSelectCategory, isNightMode, isPremium = false, onOpenPremium }) => {
    const [mood, setMood] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [recommendation, setRecommendation] = useState<{ categoryName: string; reason: string } | null>(null);

    const handleGetRecommendation = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!isPremium) {
            onOpenPremium?.();
            return;
        }
        if (!mood.trim()) return;

        // Launch the global Ask Mapa chat from App.tsx via a custom event or callback
        // For simplicity, we'll use a custom event that App.tsx listens to
        window.dispatchEvent(new CustomEvent('open-ask-mapa', { detail: { message: mood } }));
        setMood('');
    };

    return (
        <div className={`p-6 rounded-3xl border transition-all duration-500 overflow-hidden relative group
            ${isNightMode
                ? 'bg-slate-900/40 border-slate-800 hover:border-pink-500/30'
                : 'bg-white/40 border-pink-100 hover:border-pink-300'}
        `}>
            {/* Animated background glow */}
            <div className="absolute -top-24 -right-24 w-48 h-48 bg-pink-500/10 rounded-full blur-3xl group-hover:bg-pink-500/20 transition-all duration-700" />

            <div className="relative z-10">
                <div className="flex items-center space-x-3 mb-4">
                    <div className="p-2.5 bg-gradient-to-br from-pink-500 to-rose-600 rounded-xl text-white shadow-lg shadow-pink-900/20">
                        <Sparkles size={18} />
                    </div>
                    <div className="flex items-center gap-3">
                        <h3 className={`font-black uppercase tracking-widest text-sm ${isNightMode ? 'text-white' : 'text-slate-800'}`}>
                            Mood-Based AI
                        </h3>
                        {!isPremium && (
                            <div className="flex items-center gap-1.5 px-2 py-1 bg-gradient-to-r from-amber-500 to-orange-600 rounded-lg shadow-lg shadow-amber-500/20">
                                <Lock size={10} className="text-white" />
                                <span className="text-[10px] font-black text-white uppercase tracking-widest">PRO</span>
                            </div>
                        )}
                    </div>
                </div>

                <p className={`text-sm mb-4 ${isNightMode ? 'text-slate-400' : 'text-slate-500'}`}>
                    Tell MAPA how you feel, and our AI will find the perfect trigger for you.
                </p>

                <form onSubmit={handleGetRecommendation} className="flex gap-2">
                    <input
                        type="text"
                        value={mood}
                        onChange={(e) => setMood(e.target.value)}
                        placeholder="e.g. Stressed after work..."
                        className={`flex-1 px-4 py-3 rounded-xl text-sm transition-all outline-none border
                            ${isNightMode
                                ? 'bg-slate-950/50 border-slate-800 text-white focus:border-pink-500 focus:bg-slate-950'
                                : 'bg-white border-pink-50 text-slate-800 focus:border-pink-400'}`}
                    />
                    <button
                        type="submit"
                        disabled={isLoading || !mood.trim()}
                        className={`px-4 py-3 rounded-xl font-black text-xs uppercase tracking-widest transition-all active:scale-95 disabled:opacity-50 flex items-center gap-2
                            ${isLoading ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                                : isPremium
                                    ? 'bg-pink-500 text-white hover:bg-pink-600 shadow-lg shadow-pink-500/20'
                                    : 'bg-slate-800 text-white hover:bg-slate-700 shadow-lg'}`}
                    >
                        {isLoading ? <Loader2 size={18} className="animate-spin" /> : (
                            isPremium ? <>Ask AI <Sparkles size={14} /></> : <><Lock size={14} /> Unlock Insight</>
                        )}
                    </button>
                </form>

                {recommendation && (
                    <div className="mt-4 p-4 rounded-2xl bg-pink-500/10 border border-pink-500/20 animate-in fade-in slide-in-from-top-2">
                        <div className="flex items-start gap-3">
                            <Info size={16} className="text-pink-500 mt-0.5 shrink-0" />
                            <div>
                                <p className="text-xs font-bold text-pink-600 mb-0.5">Recommendation:</p>
                                <p className={`text-sm font-medium ${isNightMode ? 'text-white' : 'text-slate-800'}`}>
                                    Playing <span className="text-pink-500 font-bold">{recommendation.categoryName}</span> trigger
                                </p>
                                <p className={`text-xs mt-1 ${isNightMode ? 'text-slate-400' : 'text-slate-500'}`}>
                                    {recommendation.reason}
                                </p>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
