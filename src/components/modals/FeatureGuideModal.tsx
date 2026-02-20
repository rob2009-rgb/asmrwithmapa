import React, { useState } from 'react';
import { useScrollLock } from '../../hooks/useScrollLock';
import { X, Smartphone, Clock, Sparkles, Flame, Play, Trophy, Heart, Headset, Users, Mic, CheckCircle2, Music, Lock, ChevronRight, Zap, ShoppingBag } from 'lucide-react';

interface FeatureDetail {
    id: string;
    icon: React.ReactNode;
    title: string;
    shortDesc: string;
    fullDesc: string;
    benefit: string;
    pro?: boolean;
    customBadge?: string;
}

const FEATURES: FeatureDetail[] = [
    {
        id: 'dreamscape',
        icon: <Smartphone size={24} />,
        title: "AI Dreamscape",
        shortDesc: "Turn text into reality.",
        fullDesc: "Harness the power of Generative AI to conjure custom soundscapes from your imagination. Type 'Cyberpunk Rain' or 'Forest Library' and listen as the world builds around you.",
        benefit: "Manifest your perfect sanctuary instantly.",
        pro: true
    },
    {
        id: 'biosync',
        icon: <Heart size={24} />,
        title: "Bio-Sync Playback",
        shortDesc: "Heart-rate adaptive audio.",
        fullDesc: "Connect your wearable device to synchronize audio tempo with your heartbeat. As you relax, the music slows down physically, guiding your body into deep rest.",
        benefit: "Scientifically proven entrainment for rapid stress reduction.",
        pro: true
    },
    {
        id: 'vault',
        icon: <Lock size={24} />,
        title: "Privacy Vault",
        shortDesc: "Encrypted worry journal.",
        fullDesc: "A secure, local-only digital vault to 'dump' your racing thoughts before sleep. Write them down, then digitally 'burn' them to clear your mind.",
        benefit: "Unburden your mind without leaving a trace.",
        pro: true
    },
    {
        id: 'mood',
        icon: <Sparkles size={24} />,
        title: "AI Mood Alchemist",
        shortDesc: "Emotional state targeting.",
        fullDesc: "Don't scroll aimlessly. Tell our AI exactly how you feel, and let it prescribe the precise audio cocktail to shift your state.",
        benefit: "Personalized relief, tailored to your current emotion.",
        pro: true
    },
    {
        id: 'spatial',
        icon: <Headset size={24} />,
        title: "Spatial 8D Audio",
        shortDesc: "Immersive 360° sound.",
        fullDesc: "Transform any track into a 3D experience. Sounds orbit around your head, creating a tingling, deeply immersive sensation that triggers ASMR.",
        benefit: "Feel the sound move through you for deeper immersion.",
        pro: true
    },
    {
        id: 'streaks',
        icon: <Flame size={24} />,
        title: "Daily Streaks",
        shortDesc: "Gamified consistency.",
        fullDesc: "Build a life-changing habit of relaxation. Track your daily sessions, earn badges, and watch your mental resilience grow.",
        benefit: "Motivation to prioritize your mental health every day.",
        pro: false
    },
    {
        id: 'parties',
        icon: <Users size={24} />,
        title: "Listen Parties",
        shortDesc: "Join friends or host your own.",
        fullDesc: "Sync your audio stream with friends in real-time. Joining a room is always free. Upgrade to Pro to host your own private parties and control the vibe.",
        benefit: "Shared relaxation, even when apart.",
        pro: false,
        customBadge: "Free / Pro"
    },
    {
        id: 'zen',
        icon: <CheckCircle2 size={24} />,
        title: "Zen Workspace",
        shortDesc: "Distraction-free focus.",
        fullDesc: "A minimalist mode designed for deep work. visualizers, timers, and intention settings to keep you in the flow state.",
        benefit: "Rocket fuel for your productivity.",
        pro: true
    },
    {
        id: 'shop',
        icon: <ShoppingBag size={24} />,
        title: "Community & Shop",
        shortDesc: "Support creators & get merch.",
        fullDesc: "Browse exclusive creator merchandise, mix packs, and support your favorite ASMRtists directly. Join a thriving ecosystem of relaxation enthusiasts.",
        benefit: "Wear your calm and support the art you love.",
        pro: false
    },
    {
        id: 'journey',
        icon: <Trophy size={24} />,
        title: "Trigger Journey",
        shortDesc: "Discover your perfect sound.",
        fullDesc: "New to ASMR? Our gamified wizard guides you through a series of sounds to identify your unique 'tingle' triggers.",
        benefit: "Skip the searching and find what works for you.",
        pro: false
    },
    {
        id: 'timer',
        icon: <Clock size={24} />,
        title: "Smart Sleep Timer",
        shortDesc: "Fade out into dreams.",
        fullDesc: "Set a timer and drift off. The audio doesn't just stop—it gently fades out over time, ensuring you stay asleep once you've drifted off.",
        benefit: "Seamless transition from waking to sleeping.",
        pro: false
    },
    {
        id: 'voice',
        icon: <Mic size={24} />,
        title: "Voice Control",
        shortDesc: "Hands-free relaxation.",
        fullDesc: "Don't open your eyes or touch your phone. Just say 'Hey Mapa, play rain' or 'Next trigger' to control your environment.",
        benefit: "Total immersion without screen distractions.",
        pro: false
    },
    {
        id: 'challenges',
        icon: <Trophy size={24} />,
        title: "Relaxation Challenges",
        shortDesc: "Level up your calm.",
        fullDesc: "Participate in community challenges like '7 Days of Sleep' or 'Focus Week'. Earn exclusive badges and rewards for prioritizing your mental health.",
        benefit: "Gamified motivation for better habits.",
        pro: false
    },
];

interface FeatureGuideModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const FeatureGuideModal: React.FC<FeatureGuideModalProps> = ({ isOpen, onClose }) => {
    useScrollLock(isOpen);
    const [selectedId, setSelectedId] = useState<string>(FEATURES[0].id);

    if (!isOpen) return null;

    const selectedFeature = FEATURES.find(f => f.id === selectedId) || FEATURES[0];

    return (
        <div className="fixed inset-0 z-[250] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-xl" onClick={onClose} />

            <div className="relative w-full max-w-5xl h-[90vh] md:h-[80vh] bg-slate-900 border border-slate-800 rounded-[2rem] shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-300 flex flex-col md:flex-row pb-16 md:pb-0">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-pink-500 via-indigo-500 to-emerald-500 z-20" />

                {/* Mobile Close / Header */}
                <div className="md:hidden p-4 border-b border-slate-800 flex justify-between items-center bg-slate-900/50 backdrop-blur-md z-10">
                    <h2 className="font-black text-white px-2">Sanctuary Guide</h2>
                    <button onClick={onClose} className="p-2 rounded-full bg-slate-800 text-slate-400">
                        <X size={20} />
                    </button>
                </div>

                {/* Sidebar (List) */}
                <div className="w-full md:w-1/3 bg-slate-950/50 border-b md:border-b-0 md:border-r border-slate-800 flex overflow-x-auto md:overflow-y-auto md:flex-col custom-scrollbar p-2 md:p-4 gap-2 md:space-y-2 shrink-0 md:shrink-1">
                    <div className="hidden md:flex justify-between items-center mb-6 pl-2 pt-2">
                        <h2 className="text-xl font-black text-white tracking-tight">Features</h2>
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 bg-slate-900 px-2 py-1 rounded-lg border border-slate-800">{FEATURES.length} Modules</span>
                    </div>

                    {FEATURES.map((feature) => (
                        <button
                            key={feature.id}
                            onClick={() => setSelectedId(feature.id)}
                            className={`flex flex-col md:flex-row md:w-full items-center md:items-start text-center md:text-left p-3 md:p-4 rounded-xl md:rounded-2xl border transition-all duration-300 group relative overflow-hidden shrink-0 md:shrink-1 min-w-[100px] md:min-w-0
                                ${selectedId === feature.id
                                    ? 'bg-slate-800 border-pink-500/50 ring-1 ring-pink-500/20'
                                    : 'bg-transparent border-transparent hover:bg-slate-900 hover:border-slate-800'}
                            `}
                        >
                            <div className="flex flex-col md:flex-row items-center gap-3 md:gap-4 relative z-10 w-full">
                                <div className={`w-10 h-10 shrink-0 rounded-xl flex items-center justify-center transition-colors
                                    ${selectedId === feature.id ? 'bg-pink-500 text-white shadow-lg shadow-pink-900/20' : 'bg-slate-900 text-slate-500 group-hover:text-pink-400'}
                                `}>
                                    {feature.icon}
                                </div>
                                <div className="flex-1 min-w-0 w-full flex flex-col items-center md:items-start">
                                    <div className="flex flex-col md:flex-row items-center md:justify-between w-full gap-1 md:gap-0">
                                        <span className={`font-bold text-xs md:text-sm truncate w-full ${selectedId === feature.id ? 'text-white' : 'text-slate-400 group-hover:text-slate-200'}`}>
                                            {feature.title}
                                        </span>
                                        {feature.customBadge ? (
                                            <span className={`text-[9px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded
                                                ${selectedId === feature.id ? 'bg-indigo-500 text-white' : 'bg-slate-800 text-indigo-400'}
                                            `}>{feature.customBadge}</span>
                                        ) : feature.pro && (
                                            <span className={`text-[9px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded
                                                ${selectedId === feature.id ? 'bg-amber-500 text-white' : 'bg-slate-800 text-slate-600'}
                                            `}>PRO</span>
                                        )}
                                    </div>
                                    <p className="hidden md:block text-xs text-slate-500 truncate mt-0.5 opacity-80">{feature.shortDesc}</p>
                                </div>
                            </div>

                            {/* Active Glow */}
                            {selectedId === feature.id && (
                                <div className="absolute inset-0 bg-gradient-to-r from-pink-500/5 to-transparent pointer-events-none" />
                            )}
                        </button>
                    ))}
                </div>

                {/* Main Content (Detail) */}
                <div className="flex-1 bg-slate-900 relative flex flex-col">
                    {/* Desktop Close */}
                    <button onClick={onClose} className="absolute top-6 right-6 hidden md:flex items-center gap-2 px-4 py-2 rounded-full bg-slate-950/50 border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-900 hover:border-slate-700 transition-all z-20">
                        <X size={16} /> <span className="text-xs font-bold uppercase tracking-widest">Close Guide</span>
                    </button>

                    <div className="flex-1 overflow-y-auto p-6 md:p-16 flex flex-col justify-start md:justify-center animate-in fade-in slide-in-from-right-8 duration-500 key={selectedFeature.id}">

                        <div className="mb-8">
                            {selectedFeature.customBadge ? (
                                <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-500/10 text-indigo-500 text-[10px] font-black uppercase tracking-[0.2em] rounded-full border border-indigo-500/20 mb-6">
                                    <Users size={10} /> {selectedFeature.customBadge}
                                </div>
                            ) : selectedFeature.pro ? (
                                <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-500/10 text-amber-500 text-[10px] font-black uppercase tracking-[0.2em] rounded-full border border-amber-500/20 mb-6 shadow-lg shadow-amber-900/10">
                                    <Lock size={10} /> Premium Feature
                                </div>
                            ) : (
                                <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-500/10 text-emerald-500 text-[10px] font-black uppercase tracking-[0.2em] rounded-full border border-emerald-500/20 mb-6">
                                    <Zap size={10} /> Free for Everyone
                                </div>
                            )}

                            <h1 className="text-4xl md:text-6xl font-black text-white tracking-tight leading-tight mb-6">
                                {selectedFeature.title}
                            </h1>
                            <p className="text-xl md:text-2xl text-slate-400 font-medium leading-relaxed max-w-2xl">
                                {selectedFeature.fullDesc}
                            </p>
                        </div>

                        <div className="p-5 md:p-8 rounded-2xl md:rounded-3xl bg-slate-950/50 border border-slate-800 max-w-2xl backdrop-blur-sm mb-4">
                            <h3 className="text-pink-500 text-xs md:text-sm font-black uppercase tracking-widest mb-2 flex items-center gap-2">
                                <Sparkles size={14} /> The Benefit
                            </h3>
                            <p className="text-base md:text-xl text-white font-bold">
                                "{selectedFeature.benefit}"
                            </p>
                        </div>
                    </div>

                    <div className="p-6 md:p-8 border-t border-slate-800 bg-slate-950/30 flex flex-col md:flex-row justify-between items-center gap-4 shrink-0">
                        <span className="text-slate-500 text-xs font-medium text-center md:text-left">
                            Tip: Look for the <span className="text-pink-500">PRO</span> badge to unlock full potential.
                        </span>
                        <div className="flex gap-4 w-full md:w-auto">
                            <button
                                onClick={onClose}
                                className="flex-1 md:flex-none px-8 py-4 bg-white text-slate-900 font-black text-sm uppercase tracking-widest rounded-xl hover:bg-slate-200 transition-colors shadow-xl"
                            >
                                Try {selectedFeature.title}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
