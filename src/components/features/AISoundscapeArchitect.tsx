import React, { useState } from 'react';
import { useScrollLock } from '../../hooks/useScrollLock';
import { Sparkles, X, Play, Wand2, Loader2, Music2 } from 'lucide-react';
import { GeminiMixService, MixSuggestion } from '../../services/GeminiMixService';
import { SoundCategory } from '../../../types';

interface AISoundscapeArchitectProps {
    isOpen: boolean;
    onClose: () => void;
    categories: SoundCategory[];
    onApply: (categoryId: string, rainVolume: number, rainActive: boolean) => void;
}

export const AISoundscapeArchitect: React.FC<AISoundscapeArchitectProps> = ({ isOpen, onClose, categories, onApply }) => {
    useScrollLock(isOpen);
    const [prompt, setPrompt] = useState('');
    const [suggestion, setSuggestion] = useState<MixSuggestion | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleGenerate = async () => {
        if (!prompt.trim()) return;
        setLoading(true);
        setError(null);
        setSuggestion(null);

        try {
            const result = await GeminiMixService.generateMix(prompt, categories);
            setSuggestion(result);
        } catch (err) {
            setError("Failed to generate mix. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const handleApply = () => {
        if (!suggestion) return;

        // Logic to translate multi-layer suggestion to current app limitations (Single Track + Rain)
        // 1. Find the non-rain layer with highest volume as the main track
        const mainTrack = suggestion.layers
            .filter(l => !categories.find(c => c.id === l.categoryId)?.name.toLowerCase().includes('rain'))
            .sort((a, b) => b.volume - a.volume)[0];

        // 2. Specify rain settings if a rain layer exists
        const rainLayer = suggestion.layers.find(l => categories.find(c => c.id === l.categoryId)?.name.toLowerCase().includes('rain'));

        // Fallback if only rain is suggested, make rain the main track? Or just enable rain layer?
        // Current app: Main track is mandatory. Rain is optional overlay.
        // If suggestion is PURE RAIN, we might need to pick a silent track or "Rain" category as main.

        let targetCategory = mainTrack ? mainTrack.categoryId : (rainLayer ? rainLayer.categoryId : categories[0].id);
        let targetRainVol = rainLayer ? rainLayer.volume : 0;
        let targetRainActive = !!rainLayer;

        onApply(targetCategory, targetRainVol, targetRainActive);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/80 backdrop-blur-md animate-in fade-in duration-300">
            <div className="relative w-full max-w-lg mx-4 bg-slate-900 border border-slate-700/50 rounded-3xl p-6 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">

                {/* Header */}
                <div className="flex justify-between items-center mb-6 shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl text-white shadow-lg shadow-indigo-500/20">
                            <Sparkles size={20} />
                        </div>
                        <div>
                            <h3 className="text-xl font-black text-white tracking-tight">Soundscape Architect</h3>
                            <p className="text-xs text-indigo-400 font-bold uppercase tracking-widest">Powered by Gemini AI</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full text-slate-400 hover:text-white transition-colors">
                        <X size={24} />
                    </button>
                </div>

                {/* Content */}
                {!suggestion ? (
                    <div className="flex-1 flex flex-col justify-center space-y-6">
                        <div className="text-center space-y-2">
                            <p className="text-slate-300 text-sm">Describe your desired atmosphere, mood, or activity.</p>
                        </div>
                        <textarea
                            className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 text-white focus:border-indigo-500 outline-none resize-none h-32 transition-colors"
                            placeholder="e.g., 'Walking through a cyberpunk city in the rain', 'Deep focus for coding', 'Sleepy cabin in the woods'"
                            value={prompt}
                            onChange={e => setPrompt(e.target.value)}
                            disabled={loading}
                        />
                        <button
                            onClick={handleGenerate}
                            disabled={loading || !prompt.trim()}
                            className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-bold uppercase tracking-widest transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-indigo-900/20"
                        >
                            {loading ? <Loader2 size={20} className="animate-spin" /> : <Wand2 size={20} />}
                            {loading ? 'Designing Soundscape...' : 'Generate Mix'}
                        </button>
                        {/* AI Animation Placeholder during loading could go here */}
                    </div>
                ) : (
                    <div className="flex-1 flex flex-col space-y-6 animate-in slide-in-from-bottom-4">
                        <div className={`p-6 rounded-2xl ${suggestion.themeColor} text-white shadow-xl relative overflow-hidden`}>
                            <div className="relative z-10">
                                <h4 className="text-2xl font-black mb-2">{suggestion.name}</h4>
                                <p className="text-white/80 text-sm">{suggestion.description}</p>
                            </div>
                        </div>

                        <div className="bg-slate-950/50 rounded-2xl p-4 border border-slate-800 flex-1 overflow-y-auto">
                            <h5 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4">Suggested Layers</h5>
                            <div className="space-y-3">
                                {suggestion.layers.map((layer, i) => {
                                    const cat = categories.find(c => c.id === layer.categoryId);
                                    return (
                                        <div key={i} className="flex items-center justify-between p-3 bg-slate-900 rounded-xl border border-slate-800">
                                            <div className="flex items-center gap-3">
                                                <div className="text-2xl">{cat?.icon || '🎵'}</div>
                                                <div>
                                                    <div className="font-bold text-white text-sm">{cat?.name || 'Unknown Sound'}</div>
                                                    <div className="text-xs text-slate-500">Volume: {Math.round(layer.volume * 100)}%</div>
                                                </div>
                                            </div>
                                            {layer.active && <div className="text-indigo-400"><Music2 size={16} /></div>}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={() => setSuggestion(null)}
                                className="flex-1 py-3 bg-slate-800 text-white rounded-xl font-bold uppercase tracking-widest hover:bg-slate-700 transition-colors"
                            >
                                Try Again
                            </button>
                            <button
                                onClick={handleApply}
                                className="flex-[2] py-3 bg-indigo-600 text-white rounded-xl font-bold uppercase tracking-widest hover:bg-indigo-500 transition-colors flex items-center justify-center gap-2 shadow-lg"
                            >
                                <Play size={18} fill="currentColor" /> Play Mix
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
