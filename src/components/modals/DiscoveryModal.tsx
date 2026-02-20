import React from 'react';
import { useScrollLock } from '../../hooks/useScrollLock';
import { X, Send, Sparkles, Map } from 'lucide-react';
import { DreamscapeGenerator } from '../features/DreamscapeGenerator';

interface DiscoveryModalProps {
    isOpen: boolean;
    onClose: () => void;
    onStartJourney: () => void;
    isPremium: boolean;
    onOpenPremium: () => void;
    isNightMode: boolean;
}

export const DiscoveryModal: React.FC<DiscoveryModalProps> = ({ isOpen, onClose, onStartJourney, isPremium, onOpenPremium, isNightMode }) => {
    useScrollLock(isOpen);
    const [activeTab, setActiveTab] = React.useState<'journey' | 'dreamscape'>('journey');

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-md" onClick={onClose} />
            <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95">

                <div className="relative h-48 bg-slate-950 overflow-hidden shrink-0">
                    <div className="absolute inset-0 bg-gradient-to-b from-indigo-900/50 to-slate-900 z-10" />
                    <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/20 rounded-full blur-3xl" />
                    <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-500/20 rounded-full blur-3xl" />

                    <button onClick={onClose} className="absolute top-6 right-6 z-50 p-2 rounded-full bg-slate-800/50 text-white hover:bg-slate-700 transition-all backdrop-blur-sm">
                        <X size={20} />
                    </button>

                    <div className="absolute inset-0 flex flex-col items-center justify-center z-20 text-center p-8">
                        <div className="flex bg-slate-800/50 p-1 rounded-xl backdrop-blur-md border border-white/10 mb-4">
                            <button
                                onClick={() => setActiveTab('journey')}
                                className={`px-4 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all flex items-center gap-2
                                    ${activeTab === 'journey' ? 'bg-white text-indigo-900 shadow-lg' : 'text-slate-400 hover:text-white'}
                                `}
                            >
                                <Map size={14} /> Journey
                            </button>
                            <button
                                onClick={() => setActiveTab('dreamscape')}
                                className={`px-4 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all flex items-center gap-2
                                    ${activeTab === 'dreamscape' ? 'bg-purple-500 text-white shadow-lg' : 'text-slate-400 hover:text-white'}
                                `}
                            >
                                <Sparkles size={14} /> Dreamscape
                            </button>
                        </div>
                        <h2 className="text-2xl font-black text-white tracking-tight">
                            {activeTab === 'journey' ? 'Discover Your Sound' : 'AI Dreamscape'}
                        </h2>
                    </div>
                </div>

                {activeTab === 'journey' ? (
                    <div className="p-8 text-center space-y-8 animate-in fade-in slide-in-from-right-4">
                        <p className="text-slate-400 leading-relaxed max-w-md mx-auto">
                            Not sure what to listen to? Take our interactive journey to find the perfect soundscape for your current state of mind.
                        </p>

                        <button
                            onClick={() => {
                                onStartJourney();
                                onClose();
                            }}
                            className="px-8 py-4 bg-white text-indigo-950 font-black rounded-xl shadow-xl shadow-indigo-900/20 hover:scale-105 transition-transform flex items-center gap-2 mx-auto"
                        >
                            <Send size={20} />
                            Start Journey
                        </button>
                    </div>
                ) : (
                    <div className="p-4 animate-in fade-in slide-in-from-left-4">
                        <DreamscapeGenerator
                            onPlayDreamscape={() => { onClose(); /* Handle play */ }}
                            isPremium={isPremium}
                            onOpenPremium={onOpenPremium}
                            isNightMode={true} // Forces dark mode style inside modal
                        />
                    </div>
                )}
            </div>
        </div>
    );
};
