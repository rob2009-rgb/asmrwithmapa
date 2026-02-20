/**
 * LandingPage — public waitlist/coming-soon page for asmrwithmapa.com
 *
 * Standalone (Cloudflare Pages): isOpen={true}  isPreview={false}  — shows nav + website button
 * In-app preview:                isOpen={...}   isPreview={true}   — shows close button
 *
 * Website CTA links to: https://app.asmrwithmapa.com (existing IONOS site)
 * After email signup: 3-second countdown then auto-redirect to the website
 */
import React, { useState, useEffect, useRef } from 'react';
import {
    X, Sparkles, Moon, Users, Mic, Headphones, Wind,
    Check, ChevronDown, Instagram, Youtube, Mail,
    ArrowRight, Music, Brain,
} from 'lucide-react';
import { submitSubscriber } from '../landing/landingDb';

// submitSubscriber handles the DB/Edge-Function routing internally

/** URL of the existing IONOS-hosted website */
const APP_URL = 'https://asmrwithmapa.co.uk';

// ── Feature cards ──────────────────────────────────────────────────────────
const FEATURES = [
    { icon: <Brain size={28} className="text-pink-400" />, title: 'AI Soundscapes', description: 'Tell our AI how you feel — it curates a personalised layered soundscape in seconds.', badge: 'Pro', gradient: 'from-pink-600/20 to-purple-600/20', border: 'border-pink-500/20' },
    { icon: <Moon size={28} className="text-indigo-400" />, title: 'Zen Mode', description: 'Full-screen immersion with ambient visuals, custom breathing timers, and sleep countdowns.', badge: 'Pro', gradient: 'from-indigo-600/20 to-blue-600/20', border: 'border-indigo-500/20' },
    { icon: <Users size={28} className="text-cyan-400" />, title: 'Listen Parties', description: 'Invite friends into a shared soundscape session — relax together from anywhere in the world.', badge: 'Pro', gradient: 'from-cyan-600/20 to-teal-600/20', border: 'border-cyan-500/20' },
    { icon: <Mic size={28} className="text-emerald-400" />, title: 'Voice Control', description: '"Hey MAPA, play rain" — hands-free control so you never break your flow.', badge: 'Free', gradient: 'from-emerald-600/20 to-green-600/20', border: 'border-emerald-500/20' },
    { icon: <Headphones size={28} className="text-amber-400" />, title: 'Spatial Audio', description: 'Drag our 3D audio head to precisely position sounds in your personal soundscape.', badge: 'Pro', gradient: 'from-amber-600/20 to-orange-600/20', border: 'border-amber-500/20' },
    { icon: <Wind size={28} className="text-rose-400" />, title: 'Layered Rain Engine', description: 'Independently blend rain intensity over any trigger — from gentle drizzle to thunderstorm.', badge: 'Free', gradient: 'from-rose-600/20 to-pink-600/20', border: 'border-rose-500/20' },
];

// ── Reusable email form ────────────────────────────────────────────────────
const EmailForm: React.FC<{ size?: 'hero' | 'normal' }> = ({ size = 'normal' }) => {
    const [email, setEmail] = useState('');
    const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
    const [msg, setMsg] = useState('');
    const [countdown, setCountdown] = useState(3);
    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const trimmed = email.toLowerCase().trim();
        if (!trimmed) return;
        setStatus('loading');
        try {
            await submitSubscriber(trimmed);
            setStatus('success');
            setMsg("You're on the list! 🎉");
            setEmail('');
        } catch {
            setStatus('error');
            setMsg('Something went wrong. Please try again.');
        }
    };

    useEffect(() => {
        if (status === 'success') {
            setCountdown(3);
            timerRef.current = setInterval(() => {
                setCountdown(prev => {
                    if (prev <= 1) {
                        clearInterval(timerRef.current!);
                        window.location.href = APP_URL;
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
        }
        return () => { if (timerRef.current) clearInterval(timerRef.current); };
    }, [status]);

    if (status === 'success') {
        return (
            <div className="space-y-4">
                <div className="flex items-center justify-center gap-3 p-5 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl text-emerald-400 font-bold text-lg">
                    <Check size={24} /> {msg} Taking you to the website in {countdown}s…
                </div>
                <a
                    href={APP_URL}
                    className="block text-center text-sm text-slate-400 hover:text-pink-400 transition-colors underline underline-offset-4"
                >
                    visit our website lovelies! →
                </a>
            </div>
        );
    }

    const isHero = size === 'hero';
    return (
        <div>
            <form onSubmit={handleSubmit} className={`flex flex-col sm:flex-row gap-3 ${isHero ? 'max-w-xl mx-auto' : ''}`}>
                <input
                    type="email" required
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="your@email.com"
                    className={`flex-1 px-5 bg-white/5 border border-white/10 text-white rounded-2xl outline-none focus:border-pink-500 transition-colors placeholder:text-slate-500 ${isHero ? 'py-4 text-base' : 'py-3.5 text-sm'}`}
                />
                <button
                    type="submit"
                    disabled={status === 'loading'}
                    className={`flex items-center justify-center gap-2 bg-gradient-to-r from-pink-500 to-fuchsia-600 text-white font-bold rounded-2xl shadow-[0_8px_30px_rgba(236,72,153,0.3)] hover:shadow-[0_12px_40px_rgba(236,72,153,0.45)] hover:scale-105 active:scale-95 transition-all disabled:opacity-60 whitespace-nowrap ${isHero ? 'px-8 py-4' : 'px-6 py-3.5'}`}
                >
                    {status === 'loading'
                        ? <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        : <><span>Keep Me Informed</span><ArrowRight size={16} /></>
                    }
                </button>
            </form>
            {status === 'error' && <p className="text-red-400 text-sm mt-2 text-center">{msg}</p>}
            <p className="text-slate-600 text-xs mt-3 text-center">No spam. Unsubscribe any time.</p>
        </div>
    );
};

// ── Main component ─────────────────────────────────────────────────────────
interface LandingPageProps {
    isOpen: boolean;
    onClose: () => void;
    /** Shows "Close Preview" button — only set true in the in-app modal */
    isPreview?: boolean;
}

export const LandingPage: React.FC<LandingPageProps> = ({ isOpen, onClose, isPreview = false }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[500] bg-slate-950 text-white overflow-y-auto">

            {/* In-app preview close button only */}
            {isPreview && (
                <button onClick={onClose} className="fixed top-5 right-5 z-[600] flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-md rounded-full text-white/70 hover:text-white hover:bg-white/20 transition-all text-sm font-bold border border-white/10">
                    <X size={16} /> Close Preview
                </button>
            )}

            {/* Standalone nav bar — only shown on the deployed landing page */}
            {!isPreview && (
                <nav className="fixed top-0 inset-x-0 z-[600] flex items-center justify-between px-6 py-4 backdrop-blur-md bg-slate-950/70 border-b border-white/5">
                    <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-pink-500 to-fuchsia-600 flex items-center justify-center">
                            <Music size={14} className="text-white" />
                        </div>
                        <span className="font-black text-white text-sm tracking-tight">ASMR with MAPA</span>
                    </div>
                    <a
                        href={APP_URL}
                        className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-white/70 hover:text-white hover:bg-white/10 hover:border-pink-500/40 transition-all text-xs font-bold"
                    >
                        visit our website lovelies! <ArrowRight size={12} />
                    </a>
                </nav>
            )}

            {/* ── HERO ── */}
            {/* pt-20 gives space below the fixed nav when in standalone mode */}
            <section className={`relative min-h-screen flex flex-col items-center justify-center text-center px-6 overflow-hidden${!isPreview ? ' pt-20' : ''}`}>
                <div className="absolute inset-0 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950" />
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-pink-600/10 rounded-full blur-[120px]" />
                    <div className="absolute bottom-0 left-1/4 w-[400px] h-[400px] bg-purple-600/10 rounded-full blur-[80px]" />
                    {[...Array(6)].map((_, i) => (
                        <div key={i} className="absolute w-1 h-1 bg-pink-400/40 rounded-full animate-pulse"
                            style={{ top: `${15 + i * 14}%`, left: `${10 + i * 15}%`, animationDelay: `${i * 0.8}s`, animationDuration: `${3 + i}s` }} />
                    ))}
                </div>

                <div className="relative z-10 max-w-4xl mx-auto space-y-8 py-24">
                    <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-pink-500/10 border border-pink-500/20 text-pink-400 text-xs font-black uppercase tracking-widest">
                        <Sparkles size={12} className="animate-pulse" /> Coming Soon
                    </div>
                    <h1 className="text-6xl md:text-[7rem] lg:text-[9rem] font-black tracking-tighter leading-[0.88] text-white">
                        Your Personal
                        <span className="block bg-gradient-to-r from-pink-400 via-fuchsia-400 to-rose-400 bg-clip-text text-transparent italic font-normal">Sanctuary</span>
                    </h1>
                    <p className="text-xl md:text-2xl text-slate-400 max-w-2xl mx-auto font-medium leading-relaxed">
                        ASMR triggers, AI soundscapes, and immersive audio experiences — crafted for sleep, focus, and deep calm.
                    </p>
                    <div className="pt-4">
                        <p className="text-slate-400 text-sm mb-5 font-medium flex items-center justify-center gap-2">
                            <Mail size={14} className="text-pink-400" />
                            Be the first to know when we go live
                        </p>
                        <EmailForm size="hero" />
                        <div className="mt-5 text-center">
                            <a
                                href={APP_URL}
                                className="inline-flex items-center gap-2 text-slate-400 hover:text-white text-sm transition-colors group"
                            >
                                <span className="group-hover:text-pink-400 transition-colors">visit our website lovelies!</span>
                                <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform group-hover:text-pink-400" />
                            </a>
                        </div>
                    </div>
                </div>
                <div className="absolute bottom-10 left-1/2 -translate-x-1/2 animate-bounce opacity-40">
                    <ChevronDown size={20} className="text-white" />
                </div>
            </section>

            {/* ── FEATURES ── */}
            <section className="py-24 bg-slate-900 px-6">
                <div className="max-w-6xl mx-auto">
                    <div className="text-center mb-16 space-y-4">
                        <p className="text-pink-400 font-black uppercase tracking-widest text-xs">What's Inside</p>
                        <h2 className="text-4xl md:text-6xl font-black text-white tracking-tight">
                            Everything you need to
                            <span className="block bg-gradient-to-r from-pink-400 to-fuchsia-400 bg-clip-text text-transparent"> unwind</span>
                        </h2>
                        <p className="text-slate-400 text-lg max-w-2xl mx-auto">
                            From AI-curated mixes to real-time Listen Parties — every feature is designed around one goal: your peace.
                        </p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                        {FEATURES.map((f, i) => (
                            <div key={i} className={`relative p-6 rounded-3xl bg-gradient-to-br ${f.gradient} border ${f.border} hover:scale-[1.02] transition-transform duration-300 group overflow-hidden`}>
                                <div className="absolute inset-0 bg-slate-900/60 group-hover:bg-slate-900/40 transition-colors rounded-3xl" />
                                <div className="relative z-10">
                                    <div className="flex items-start justify-between mb-4">
                                        <div className="p-3 bg-slate-800/80 rounded-2xl">{f.icon}</div>
                                        <span className={`px-2.5 py-1 text-[10px] font-black uppercase tracking-widest rounded-full ${f.badge === 'Pro' ? 'bg-pink-500/20 text-pink-400 border border-pink-500/30' : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'}`}>{f.badge}</span>
                                    </div>
                                    <h3 className="text-xl font-black text-white mb-2">{f.title}</h3>
                                    <p className="text-slate-400 text-sm leading-relaxed">{f.description}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── YOUTUBE ── */}
            <section className="py-24 bg-slate-950 px-6">
                <div className="max-w-5xl mx-auto text-center space-y-8">
                    <p className="text-pink-400 font-black uppercase tracking-widest text-xs">See It In Action</p>
                    <h2 className="text-4xl md:text-5xl font-black text-white tracking-tight">Catch MAPA on YouTube</h2>
                    <p className="text-slate-400 text-lg max-w-xl mx-auto">Full-length roleplays, mic licking, and deep relaxation videos — new releases every week.</p>
                    <div className="w-full aspect-video rounded-3xl overflow-hidden border border-slate-800 shadow-2xl">
                        <iframe width="100%" height="100%"
                            src="https://www.youtube.com/embed/drs2YjPTht4"
                            title="ASMR with MAPA" frameBorder="0"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen />
                    </div>
                    <a href="https://www.youtube.com/@asmrwithmapa/videos" target="_blank" rel="noopener noreferrer"
                        className="inline-flex items-center gap-3 px-8 py-4 bg-red-600 hover:bg-red-700 text-white font-bold rounded-2xl transition-all shadow-xl hover:scale-105 active:scale-95">
                        <Youtube size={20} /> Subscribe on YouTube
                    </a>
                </div>
            </section>

            {/* ── WHAT'S PLANNED ── */}
            <section className="py-24 bg-slate-900 px-6">
                <div className="max-w-3xl mx-auto text-center space-y-6">
                    <p className="text-pink-400 font-black uppercase tracking-widest text-xs">Launching Soon</p>
                    <h2 className="text-4xl md:text-5xl font-black text-white tracking-tight">
                        Free to start.<br />
                        <span className="text-pink-400">Pro for the deepest experience.</span>
                    </h2>
                    <p className="text-slate-400 text-lg">
                        A free tier with all the core ASMR triggers, plus a Pro upgrade unlocking AI soundscapes, Zen Mode, spatial audio, and more. Waitlist members get first access and launch pricing.
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-left pt-4">
                        <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-6">
                            <p className="text-slate-400 font-bold uppercase tracking-widest text-xs mb-4">Free tier</p>
                            <ul className="space-y-2.5">
                                {['All ASMR trigger sounds', 'Mood-based discovery', 'Rain layer overlay', 'Voice commands', 'Community marketplace', 'Challenges & streaks'].map((item, i) => (
                                    <li key={i} className="flex items-center gap-2.5 text-slate-300 text-sm"><Check size={14} className="text-emerald-400 shrink-0" /> {item}</li>
                                ))}
                            </ul>
                        </div>
                        <div className="bg-pink-950/30 border border-pink-500/30 rounded-2xl p-6">
                            <p className="text-pink-400 font-bold uppercase tracking-widest text-xs mb-4">Pro tier</p>
                            <ul className="space-y-2.5">
                                {['Everything in Free', 'AI personalised soundscapes', 'Zen Mode + sleep timer', 'Live Listen Parties', 'Spatial Audio Engine', '3D positional audio', 'Exclusive premium triggers', 'Priority support'].map((item, i) => (
                                    <li key={i} className="flex items-center gap-2.5 text-slate-200 text-sm"><Check size={14} className="text-pink-400 shrink-0" /> {item}</li>
                                ))}
                            </ul>
                        </div>
                    </div>
                </div>
            </section>

            {/* ── SECOND EMAIL CTA ── */}
            <section className="py-24 bg-slate-950 px-6 relative overflow-hidden">
                <div className="absolute inset-0 pointer-events-none">
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-pink-600/8 blur-[80px]" />
                </div>
                <div className="max-w-2xl mx-auto text-center relative z-10 space-y-8">
                    <div className="w-16 h-16 rounded-3xl bg-pink-500/10 border border-pink-500/20 flex items-center justify-center mx-auto">
                        <Mail size={28} className="text-pink-400" />
                    </div>
                    <h2 className="text-4xl md:text-5xl font-black text-white tracking-tight">
                        Be the first to know
                        <span className="block text-pink-400">when we launch</span>
                    </h2>
                    <p className="text-slate-400 text-lg">
                        Join the waitlist and get exclusive early-access pricing, plus a free Pro trial on release day.
                    </p>
                    <EmailForm />
                </div>
            </section>

            {/* ── FOOTER ── */}
            <footer className="py-12 bg-slate-950 border-t border-slate-900 px-6">
                <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-pink-500 to-fuchsia-600 flex items-center justify-center">
                            <Music size={18} className="text-white" />
                        </div>
                        <div>
                            <p className="font-black text-white text-sm">ASMR with MAPA</p>
                            <p className="text-slate-500 text-xs">Your Sanctuary</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-6 text-slate-500 text-sm">
                        <a href="https://www.youtube.com/@asmrwithmapa/videos" target="_blank" rel="noopener noreferrer" className="hover:text-red-400 transition-colors flex items-center gap-1.5">
                            <Youtube size={16} /> YouTube
                        </a>
                        <a href="https://www.instagram.com/asmrwithmapa" target="_blank" rel="noopener noreferrer" className="hover:text-pink-400 transition-colors flex items-center gap-1.5">
                            <Instagram size={16} /> Instagram
                        </a>
                    </div>
                    <div className="text-slate-700 text-xs text-center">
                        © {new Date().getFullYear()} ASMR with MAPA. All rights reserved.
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default LandingPage;
