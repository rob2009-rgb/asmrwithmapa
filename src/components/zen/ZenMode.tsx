import React, { useState, useEffect } from 'react';
import { useScrollLock } from '../../hooks/useScrollLock';
import { X, Play, Pause, RotateCcw, Focus, Wind, Coffee, BrainCircuit, ChevronUp, ChevronDown, SkipBack, SkipForward, Headphones } from 'lucide-react';
import { useNotification } from '../../contexts/NotificationContext';
import { PlayerState, SoundCategory } from '../../../types';

interface ZenModeProps {
    isActive: boolean;
    onExit: () => void;
    currentSoundName?: string;
    playerState?: PlayerState;
    onTogglePlay?: () => void;
    onNext?: () => void;
    onPrev?: () => void;
    categories?: SoundCategory[];
    onSelectCategory?: (category: SoundCategory) => void;
    currentCategoryId?: string;
}

export const ZenMode: React.FC<ZenModeProps> = ({
    isActive,
    onExit,
    currentSoundName,
    playerState = PlayerState.STOPPED,
    onTogglePlay,
    onNext,
    onPrev,
    categories = [],
    onSelectCategory,
    currentCategoryId
}) => {
    useScrollLock(isActive);
    const [task, setTask] = useState('');
    const [isTimerRunning, setIsTimerRunning] = useState(false);
    const [timeLeft, setTimeLeft] = useState(25 * 60); // 25 minutes default
    const [timerMode, setTimerMode] = useState<'focus' | 'break'>('focus');
    const { showNotification } = useNotification();

    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (isActive && isTimerRunning && timeLeft > 0) {
            interval = setInterval(() => {
                setTimeLeft((prev) => prev - 1);
            }, 1000);
        } else if (timeLeft === 0) {
            setIsTimerRunning(false);
            showNotification('success', timerMode === 'focus' ? 'Focus session complete!' : 'Break over!');
        }
        return () => clearInterval(interval);
    }, [isActive, isTimerRunning, timeLeft, timerMode, showNotification]);

    const togglePlayAndTimer = () => {
        const nextState = !isTimerRunning;
        setIsTimerRunning(nextState);
        // Sync audio if it's not already in sync
        const isAudioPlaying = playerState === PlayerState.PLAYING;
        if (nextState !== isAudioPlaying) {
            onTogglePlay?.();
        }
    };

    const resetTimer = () => {
        setIsTimerRunning(false);
        if (playerState === PlayerState.PLAYING) {
            onTogglePlay?.();
        }
        setTimeLeft(timerMode === 'focus' ? 25 * 60 : 5 * 60);
    };

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    if (!isActive) return null;

    return (
        <div className="fixed inset-0 z-[100] bg-slate-950 text-white flex flex-col items-center justify-start overflow-y-auto animate-in fade-in duration-1000 no-scrollbar">
            {/* Cinematic Multilayered Background */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden">
                <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[1000px] rounded-full blur-[160px] transition-all duration-1000 ease-in-out ${playerState === PlayerState.PLAYING ? 'bg-blue-600/10 scale-125 opacity-40 animate-pulse-slow' : 'bg-slate-800/10 scale-100 opacity-20'
                    }`}></div>
                <div className="absolute top-[20%] left-[20%] w-[600px] h-[600px] bg-indigo-600/5 rounded-full blur-[120px] animate-pulse-slower"></div>
                <div className="absolute bottom-[20%] right-[20%] w-[500px] h-[500px] bg-fuchsia-600/5 rounded-full blur-[100px] animate-pulse-slow" style={{ animationDelay: '2s' }}></div>
            </div>

            <div className="relative z-10 w-full max-w-5xl px-8 flex flex-col items-center text-center space-y-10 py-12 min-h-full">

                {/* Objective Tracking - Premium Overhaul */}
                <div className="w-full space-y-6 max-w-3xl">
                    <div className="flex flex-col items-center gap-3">
                        <div className="flex items-center gap-4 mb-1">
                            <div className="h-[1px] w-12 bg-gradient-to-r from-transparent via-blue-500/30 to-blue-500/50"></div>
                            <h2 className="text-[10px] font-black uppercase tracking-[0.6em] text-blue-400 opacity-80">Zen Intention</h2>
                            <div className="h-[1px] w-12 bg-gradient-to-l from-transparent via-blue-500/30 to-blue-500/50"></div>
                        </div>
                        <div className="relative w-full group">
                            <input
                                type="text"
                                value={task}
                                onChange={(e) => setTask(e.target.value)}
                                placeholder="I intend to..."
                                className="w-full bg-transparent text-4xl md:text-6xl font-brand italic text-center placeholder:text-slate-900 text-white border-none outline-none transition-all focus:scale-[1.02] relative z-10"
                            />
                            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-3/4 h-[1px] bg-gradient-to-r from-transparent via-slate-800 to-transparent"></div>
                            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-[1px] bg-gradient-to-r from-transparent via-blue-500 to-transparent group-focus-within:w-full transition-all duration-1000"></div>
                        </div>
                    </div>
                </div>

                {/* World-Class Timer Section - Optimized Scale */}
                <div className="flex flex-col items-center space-y-8 w-full">
                    <div className="relative flex items-center gap-4 md:gap-8 lg:gap-16">
                        <button
                            onClick={() => setTimeLeft(Math.max(60, timeLeft - 60))}
                            className="p-2 md:p-3 rounded-full text-slate-700 hover:text-blue-400 transition-all hover:bg-white/5 active:scale-90"
                        >
                            <ChevronDown size={48} strokeWidth={0.5} />
                        </button>

                        <div className="relative">
                            <div className="text-[6rem] md:text-[10rem] lg:text-[14rem] font-brand font-thin leading-none tracking-[-0.04em] tabular-nums select-none text-transparent bg-clip-text bg-gradient-to-b from-white via-slate-200 to-slate-900 filter drop-shadow-[0_0_60px_rgba(255,255,255,0.05)] px-2 md:px-4">
                                {formatTime(timeLeft)}
                            </div>
                            <div className="absolute -inset-6 bg-blue-500/5 blur-[80px] -z-10 rounded-full"></div>
                        </div>

                        <button
                            onClick={() => setTimeLeft(timeLeft + 60)}
                            className="p-2 md:p-3 rounded-full text-slate-700 hover:text-blue-400 transition-all hover:bg-white/5 active:scale-90"
                        >
                            <ChevronUp size={48} strokeWidth={0.5} />
                        </button>
                    </div>

                    {/* Integrated Control Center - Cinematic Consolidation */}
                    <div className="flex flex-col items-center gap-8 w-full">
                        {/* Primary Controls Row */}
                        <div className="flex items-center gap-10">
                            <button
                                onClick={resetTimer}
                                className="p-4 rounded-[1.5rem] bg-white/5 text-slate-600 hover:text-white transition-all border border-white/5 hover:border-white/10 hover:bg-white/10 group"
                            >
                                <RotateCcw size={24} className="group-hover:-rotate-180 transition-transform duration-1000" strokeWidth={1.5} />
                            </button>

                            <button
                                onClick={togglePlayAndTimer}
                                className={`w-24 h-24 rounded-[2.5rem] flex items-center justify-center transition-all duration-700 shadow-[0_20px_80px_rgba(0,0,0,0.8)] active:scale-90 relative group overflow-hidden ${isTimerRunning
                                    ? 'bg-slate-900 border border-white/20 text-white'
                                    : 'bg-white text-slate-950 scale-105'
                                    }`}
                            >
                                <div className={`absolute inset-0 bg-gradient-to-tr from-blue-500/20 to-transparent transition-opacity duration-700 ${isTimerRunning ? 'opacity-100' : 'opacity-0'}`}></div>
                                {isTimerRunning ? <Pause size={42} fill="currentColor" strokeWidth={0} /> : <Play size={42} fill="currentColor" className="ml-2" strokeWidth={0} />}
                            </button>

                            <div className="p-4 opacity-0 pointer-events-none">
                                <RotateCcw size={24} />
                            </div>
                        </div>

                        {/* Integrated Selector Bar */}
                        <div className="w-full max-w-4xl bg-slate-900/40 backdrop-blur-3xl p-4 md:p-6 rounded-[2rem] md:rounded-[3rem] border border-white/10 flex flex-col md:flex-row items-center justify-between gap-6 md:gap-8 shadow-2xl transition-all hover:bg-slate-900/50 overflow-hidden">

                            {/* Status & Navigation */}
                            <div className="flex items-center gap-4 md:gap-6 px-2 md:px-4 flex-shrink-0 w-full justify-center md:w-auto md:justify-start">
                                <button onClick={onPrev} className="p-2 text-slate-600 hover:text-blue-400 transition-all hover:scale-110 active:scale-95"><SkipBack size={22} fill="currentColor" strokeWidth={0} /></button>

                                <div className="flex flex-col items-center min-w-[120px] md:min-w-[140px] text-center">
                                    <span className="text-[9px] font-black uppercase tracking-[0.3em] text-blue-400/80 mb-1">
                                        {playerState === PlayerState.PLAYING ? 'Immersed' : 'Silent'}
                                    </span>
                                    <span className="text-[11px] font-medium text-slate-200 italic tracking-[0.05em] truncate max-w-[120px] md:max-w-[150px]">
                                        {currentSoundName}
                                    </span>
                                </div>

                                <button onClick={onNext} className="p-2 text-slate-600 hover:text-blue-400 transition-all hover:scale-110 active:scale-95"><SkipForward size={22} fill="currentColor" strokeWidth={0} /></button>
                            </div>

                            <div className="w-full h-[1px] md:h-8 md:w-[1px] bg-white/5 block flex-shrink-0 my-2 md:my-0"></div>

                            {/* Condensed Path Selector */}
                            <div className="flex flex-col items-center md:items-start gap-1 px-4 min-w-0 flex-1 w-full pb-14 md:pb-0">
                                <span className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-500/80 mb-1 whitespace-nowrap">
                                    Choose Path
                                </span>
                                <div className="w-full flex gap-4 overflow-x-auto no-scrollbar py-3 px-1 scroll-smooth">
                                    {categories.map((cat) => (
                                        <button
                                            key={cat.id}
                                            onClick={() => onSelectCategory?.(cat)}
                                            className={`flex-shrink-0 w-11 h-11 rounded-[1.2rem] flex items-center justify-center text-xl transition-all duration-500 active:scale-95 relative group/icon ${currentCategoryId === cat.id
                                                ? 'bg-gradient-to-br from-blue-500 to-indigo-700 text-white shadow-lg scale-110 shadow-blue-500/30'
                                                : 'bg-white/5 text-slate-500 hover:text-slate-200 hover:bg-white/10'
                                                }`}
                                        >
                                            <span className="relative z-10">{cat.icon}</span>
                                            {currentCategoryId === cat.id && (
                                                <div className="absolute -inset-1 rounded-[1.4rem] bg-blue-500/30 blur-sm animate-pulse"></div>
                                            )}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>


                    {/* Cinematic Exit & Quick Selects - Optimized */}
                    <div className="w-full flex flex-col items-center gap-10 pt-6">
                        <div className="flex flex-col items-center gap-6">
                            <div className="h-[1px] w-20 bg-gradient-to-r from-transparent via-slate-800 to-transparent"></div>

                            <div className="flex gap-4 flex-wrap justify-center">
                                {[15, 25, 45, 60].map(mins => (
                                    <button
                                        key={mins}
                                        onClick={() => { setTimerMode('focus'); setTimeLeft(mins * 60); }}
                                        className={`px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-[0.4em] transition-all duration-700 border ${timeLeft === mins * 60
                                            ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20 border-blue-500 scale-105'
                                            : 'bg-white/5 text-slate-500 hover:bg-white/10 hover:text-slate-200 border-white/5 hover:border-white/10'
                                            }`}
                                    >
                                        {mins}m
                                    </button>
                                ))}
                            </div>
                        </div>

                        <button
                            onClick={onExit}
                            className="group flex flex-col items-center gap-4 transition-all duration-1000 mb-6"
                        >
                            <span className="text-[11px] font-black uppercase tracking-[0.8em] text-slate-700 group-hover:text-blue-400 group-hover:tracking-[1em] transition-all duration-1000">
                                Return to Sanctuary
                            </span>
                            <div className="relative w-32 h-[1px]">
                                <div className="absolute inset-0 bg-slate-900"></div>
                                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-blue-500 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-1000"></div>
                            </div>
                        </button>
                    </div>

                </div>
            </div>
        </div>
    );
};
