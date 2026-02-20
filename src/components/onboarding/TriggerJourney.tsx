import React, { useState } from 'react';
import { useScrollLock } from '../../hooks/useScrollLock';
import { ArrowRight, Check, Sparkles, Brain, Ear, Eye, Coffee, Moon } from 'lucide-react';
import { SoundCategory } from '../../../types';

interface TriggerJourneyProps {
    isOpen: boolean;
    onClose: () => void;
    categories: SoundCategory[];
    onComplete: (recommendedCategoryId: string) => void;
}

const QUESTIONS = [
    {
        id: 'mood',
        question: "How are you feeling right now?",
        options: [
            { id: 'stressed', text: "Stressed / Anxious", icon: <Brain size={20} /> },
            { id: 'tired', text: "Tired / Can't Sleep", icon: <Moon size={20} /> },
            { id: 'focus', text: "Need Focus", icon: <Coffee size={20} /> },
        ]
    },
    {
        id: 'preference',
        question: "What kind of sounds do you usually like?",
        options: [
            { id: 'nature', text: "Nature (Rain, Forest)", icon: <Ear size={20} /> },
            { id: 'mechanical', text: "Mechanical (Typing, Fans)", icon: <Ear size={20} /> },
            { id: 'abstract', text: "Abstract (White Noise)", icon: <Ear size={20} /> },
        ]
    },
    {
        id: 'visual',
        question: "Do you prefer visual triggers?",
        options: [
            { id: 'yes', text: "Yes, I like to watch", icon: <Eye size={20} /> },
            { id: 'no', text: "No, audio only", icon: <Ear size={20} /> },
        ]
    }
];

export const TriggerJourney: React.FC<TriggerJourneyProps> = ({ isOpen, onClose, categories, onComplete }) => {
    useScrollLock(isOpen);
    const [step, setStep] = useState(0);
    const [answers, setAnswers] = useState<Record<string, string>>({});
    const [result, setResult] = useState<SoundCategory | null>(null);

    const handleAnswer = (optionId: string) => {
        const currentQ = QUESTIONS[step];
        const newAnswers = { ...answers, [currentQ.id]: optionId };
        setAnswers(newAnswers);

        if (step < QUESTIONS.length - 1) {
            setStep(step + 1);
        } else {
            calculateResult(newAnswers);
        }
    };

    const calculateResult = (finalAnswers: Record<string, string>) => {
        // Simple recommendation logic
        let keyword = '';
        if (finalAnswers.mood === 'tired') keyword = 'rain';
        else if (finalAnswers.mood === 'focus') keyword = 'keyboard';
        else if (finalAnswers.preference === 'nature') keyword = 'forest';
        else if (finalAnswers.preference === 'mechanical') keyword = 'typing';
        else keyword = 'noise';

        // Find best match in categories
        // Fallback to random if no match
        let match = categories.find(c => c.name.toLowerCase().includes(keyword))
            || categories.find(c => c.name.toLowerCase().includes('rain'))
            || categories[0];

        setResult(match || null);
    };

    const finish = () => {
        if (result) onComplete(result.id);
        onClose();
        // Reset for next time
        setTimeout(() => {
            setStep(0);
            setAnswers({});
            setResult(null);
        }, 500);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/90 backdrop-blur-xl animate-in fade-in duration-500">
            <div className="w-full max-w-2xl px-6">

                {/* Progress */}
                <div className="flex justify-center mb-8 gap-2">
                    {QUESTIONS.map((_, i) => (
                        <div key={i} className={`h-1.5 rounded-full transition-all duration-500 ${i <= step ? 'w-12 bg-pink-500' : 'w-4 bg-slate-700'}`} />
                    ))}
                </div>

                {!result ? (
                    <div className="text-center space-y-12 animate-in slide-in-from-bottom-8 duration-500">
                        <h2 className="text-4xl md:text-5xl font-black text-white tracking-tight leading-tight">
                            {QUESTIONS[step].question}
                        </h2>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {QUESTIONS[step].options.map(opt => (
                                <button
                                    key={opt.id}
                                    onClick={() => handleAnswer(opt.id)}
                                    className="group relative p-8 rounded-3xl bg-slate-800/50 border border-slate-700 hover:border-pink-500/50 hover:bg-slate-800 transition-all duration-300 flex flex-col items-center gap-4"
                                >
                                    <div className="p-4 rounded-2xl bg-slate-900 group-hover:bg-pink-500 text-pink-400 group-hover:text-white transition-colors shadow-lg">
                                        {opt.icon}
                                    </div>
                                    <span className="font-bold text-lg text-slate-300 group-hover:text-white">{opt.text}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                ) : (
                    <div className="text-center space-y-8 animate-in zoom-in-90 duration-500">
                        <div className="inline-block p-4 rounded-full bg-pink-500 text-white shadow-[0_0_50px_rgba(236,72,153,0.5)] mb-4">
                            <Sparkles size={48} className="animate-pulse" />
                        </div>

                        <h2 className="text-4xl font-black text-white">Match Found!</h2>

                        <div className="bg-slate-800/50 border border-slate-700 rounded-3xl p-8 max-w-md mx-auto transform hover:scale-105 transition-transform duration-300">
                            <div className="text-6xl mb-4">{result.icon}</div>
                            <h3 className="text-2xl font-bold text-white mb-2">{result.name}</h3>
                            <p className="text-slate-400">{result.description}</p>
                        </div>

                        <div className="flex flex-col gap-3 max-w-xs mx-auto">
                            <button
                                onClick={() => {
                                    if (result) onComplete(result.id);
                                    // Don't close immediately, let them enjoy the finding? 
                                    // User said: "play the discovered trigger and send you back to the main screen"
                                    // So we should just DO it.
                                    onClose();
                                }}
                                className="w-full px-8 py-4 bg-white text-black font-black text-lg rounded-2xl hover:scale-105 transition-transform shadow-xl flex items-center justify-center gap-2"
                            >
                                <ArrowRight size={20} /> Go to Sanctuary
                            </button>
                            <button onClick={() => { setStep(0); setResult(null); }} className="text-xs text-slate-500 hover:text-white underline">
                                Restart Journey
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
