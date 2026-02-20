import React, { useState } from 'react';
import { Sparkles, CloudRain, Wind, Zap, Loader2, Play } from 'lucide-react';
import { SoundCategory } from '../../../types';

interface DreamscapeGeneratorProps {
    onPlayDreamscape: (layers: any[]) => void;
    isPremium: boolean;
    onOpenPremium: () => void;
    isNightMode: boolean;
}

export const DreamscapeGenerator: React.FC<DreamscapeGeneratorProps> = ({
    onPlayDreamscape,
    isPremium,
    onOpenPremium,
    isNightMode
}) => {
    const [prompt, setPrompt] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const [generatedScenario, setGeneratedScenario] = useState<{ title: string, description: string } | null>(null);

    const handleGenerate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!isPremium) {
            onOpenPremium();
            return;
        }
        if (!prompt.trim()) return;

        setIsGenerating(true);
        // Simulate AI processing time
        await new Promise(resolve => setTimeout(resolve, 2500));

        // Mock result for now - in real app, call Gemini API here
        setGeneratedScenario({
            title: "Neon Rain City",
            description: "A cyberpunk noodle shop in infinite rain. Distant sirens mix with the hiss of steam and heavy droplets on neon signs."
        });
        setIsGenerating(false);
    };

    return (
        <div className={`p-8 rounded-[2.5rem] relative overflow-hidden transition-all duration-500 border
            ${isNightMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-pink-100'}
        `}>
            {/* Background Effects */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

            <div className="relative z-10">
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-white shadow-lg">
                        <Sparkles size={20} />
                    </div>
                    <div>
                        <h3 className={`text-xl font-black tracking-tight ${isNightMode ? 'text-white' : 'text-slate-900'}`}>
                            AI Dreamscape
                        </h3>
                        <p className="text-xs font-bold uppercase tracking-widest text-purple-500">Generative Audio Engine</p>
                    </div>
                    {!isPremium && (
                        <span className="ml-auto px-2 py-1 bg-slate-800 text-white text-[10px] font-black uppercase tracking-widest rounded-lg">PRO</span>
                    )}
                </div>

                {!generatedScenario ? (
                    <form onSubmit={handleGenerate} className="space-y-4">
                        <div className="relative">
                            <textarea
                                value={prompt}
                                onChange={(e) => setPrompt(e.target.value)}
                                placeholder="Describe a place that doesn't exist..."
                                className={`w-full h-32 p-5 rounded-2xl resize-none outline-none transition-all text-sm font-medium border
                                    ${isNightMode
                                        ? 'bg-slate-950/50 border-slate-800 text-white placeholder-slate-500 focus:border-purple-500'
                                        : 'bg-slate-50 border-slate-200 text-slate-800 placeholder-slate-400 focus:border-purple-500'}
                                `}
                            />
                            <div className="absolute bottom-4 right-4 flex gap-2">
                                <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-full border
                                    ${isNightMode ? 'bg-slate-900 border-slate-700 text-slate-400' : 'bg-white border-slate-200 text-slate-500'}
                                `}>Gemini 1.5 Pro</span>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={isGenerating || !prompt.trim()}
                            className={`w-full py-4 rounded-2xl font-black uppercase tracking-[0.2em] text-xs transition-all flex items-center justify-center gap-2
                                ${isGenerating
                                    ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                                    : 'bg-purple-600 hover:bg-purple-500 text-white shadow-lg shadow-purple-500/20 active:scale-95'}
                            `}
                        >
                            {isGenerating ? (
                                <>
                                    <Loader2 size={16} className="animate-spin" /> Dreaming...
                                </>
                            ) : (
                                <>
                                    <Zap size={16} /> Generate Soundscape
                                </>
                            )}
                        </button>
                    </form>
                ) : (
                    <div className="animate-in fade-in slide-in-from-bottom-4 space-y-6">
                        <div className={`p-6 rounded-2xl border ${isNightMode ? 'bg-slate-950/50 border-slate-800' : 'bg-purple-50 border-purple-100'}`}>
                            <h4 className="text-lg font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400 mb-2">
                                {generatedScenario.title}
                            </h4>
                            <p className={`text-sm leading-relaxed ${isNightMode ? 'text-slate-400' : 'text-slate-600'}`}>
                                {generatedScenario.description}
                            </p>
                        </div>

                        <div className="grid grid-cols-3 gap-2">
                            {['Rain (Heavy)', 'Neon Hum', 'Distant Traffic'].map((layer, i) => (
                                <div key={i} className={`p-3 rounded-xl flex flex-col items-center justify-center gap-2 border text-center
                                    ${isNightMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}
                                `}>
                                    <CloudRain size={16} className="text-purple-500" />
                                    <span className={`text-[10px] font-bold ${isNightMode ? 'text-slate-300' : 'text-slate-600'}`}>
                                        {layer}
                                    </span>
                                </div>
                            ))}
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={() => setGeneratedScenario(null)}
                                className={`flex-1 py-4 rounded-2xl font-bold text-xs uppercase tracking-widest border transition-colors
                                    ${isNightMode ? 'border-slate-700 text-slate-400 hover:bg-slate-800' : 'border-slate-200 text-slate-500 hover:bg-slate-100'}
                                `}
                            >
                                Back
                            </button>
                            <button className="flex-[2] py-4 bg-white text-purple-900 rounded-2xl font-black uppercase tracking-[0.2em] text-xs shadow-xl flex items-center justify-center gap-2 hover:bg-purple-50 transition-all active:scale-95">
                                <Play size={16} fill="currentColor" /> Play Dreamscape
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
