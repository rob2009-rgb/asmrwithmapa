import React, { useRef, useState, useEffect } from 'react';
import { useScrollLock } from '../../hooks/useScrollLock';
import { X, User, RefreshCw, AudioWaveform } from 'lucide-react';
import { SpatialAudioService } from '../../services/SpatialAudioService';

interface SpatialAudioEngineProps {
    onClose: () => void;
    isOpen: boolean;
}

export const SpatialAudioEngine: React.FC<SpatialAudioEngineProps> = ({ onClose, isOpen }) => {
    useScrollLock(isOpen);
    const [position, setPosition] = useState({ x: 0, z: 0 });
    const containerRef = useRef<HTMLDivElement>(null);
    const isDragging = useRef(false);

    // Stop auto-orbit when opened
    useEffect(() => {
        if (isOpen) {
            SpatialAudioService.stopAnimation();
        }
    }, [isOpen]);

    const handlePointerDown = (e: React.PointerEvent) => {
        isDragging.current = true;
        updatePosition(e);
        e.currentTarget.setPointerCapture(e.pointerId);
    };

    const handlePointerMove = (e: React.PointerEvent) => {
        if (!isDragging.current) return;
        updatePosition(e);
    };

    const handlePointerUp = (e: React.PointerEvent) => {
        isDragging.current = false;
        e.currentTarget.releasePointerCapture(e.pointerId);
    };

    const updatePosition = (e: React.PointerEvent) => {
        if (!containerRef.current) return;
        const rect = containerRef.current.getBoundingClientRect();
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;

        // Calculate relative position (-1 to 1)
        let x = (e.clientX - rect.left - centerX) / (rect.width / 2);
        let y = (e.clientY - rect.top - centerY) / (rect.height / 2);

        // Limit to circle radius
        const distance = Math.sqrt(x * x + y * y);
        if (distance > 0.95) { // Keep slightly inside border
            x = x / distance * 0.95;
            y = y / distance * 0.95;
        }

        // Map to audio coordinates (Scale up for effect, e.g. 10 meters max)
        const scale = 6;
        const audioX = x * scale;
        const audioZ = y * scale; // Screen Y corresponds to Audio Z (depth/front-back)

        setPosition({ x, z: y });
        SpatialAudioService.setPosition(audioX, 0, audioZ);
    };

    const handleReset = () => {
        setPosition({ x: 0, z: 0 });
        SpatialAudioService.reset();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/80 backdrop-blur-md animate-in fade-in duration-300">
            <div className="relative w-full max-w-md mx-4 bg-slate-900 border border-slate-700/50 rounded-3xl p-6 shadow-2xl overflow-hidden">

                {/* Header */}
                <div className="flex justify-between items-center mb-6">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-gradient-to-br from-amber-400 to-orange-600 rounded-xl text-white shadow-lg shadow-amber-500/20">
                            <AudioWaveform size={20} />
                        </div>
                        <div>
                            <h3 className="text-xl font-black text-white tracking-tight">Spatial Engine</h3>
                            <p className="text-xs text-amber-500 font-bold uppercase tracking-widest">3D Audio Positioning</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full text-slate-400 hover:text-white transition-colors">
                        <X size={24} />
                    </button>
                </div>

                {/* 3D Visualizer Area */}
                <div className="relative aspect-square w-full mb-6 group">
                    {/* Background Rings */}
                    <div className="absolute inset-0 rounded-full border border-slate-700/30" />
                    <div className="absolute inset-[15%] rounded-full border border-slate-700/30" />
                    <div className="absolute inset-[30%] rounded-full border border-slate-700/30" />
                    <div className="absolute inset-[45%] rounded-full border border-slate-700/30" />

                    {/* Axis Lines */}
                    <div className="absolute top-0 bottom-0 left-1/2 w-px bg-slate-800" />
                    <div className="absolute left-0 right-0 top-1/2 h-px bg-slate-800" />

                    {/* Interaction Area */}
                    <div
                        ref={containerRef}
                        className="absolute inset-0 rounded-full cursor-grab active:cursor-grabbing touch-none z-10"
                        onPointerDown={handlePointerDown}
                        onPointerMove={handlePointerMove}
                        onPointerUp={handlePointerUp}
                        onPointerLeave={handlePointerUp}
                    >
                        {/* Listener (Head) */}
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center border-2 border-slate-600 shadow-xl z-0">
                            <User size={24} className="text-slate-400" />
                        </div>

                        {/* Sound Source (Draggable) */}
                        <div
                            className="absolute w-12 h-12 bg-gradient-to-br from-amber-400 to-orange-500 rounded-full shadow-[0_0_30px_rgba(251,191,36,0.5)] border-2 border-white/50 flex items-center justify-center z-20 transition-transform duration-75 will-change-transform"
                            style={{
                                left: '50%',
                                top: '50%',
                                transform: `translate(calc(-50% + ${position.x * 50 * 2}%), calc(-50% + ${position.z * 50 * 2}%))`
                            }}
                        >
                            <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                        </div>
                    </div>
                </div>

                {/* Controls */}
                <div className="flex justify-between items-center text-xs text-slate-500 font-mono uppercase">
                    <div>
                        <div>Pos X: {position.x.toFixed(2)}</div>
                        <div>Pos Z: {position.z.toFixed(2)}</div>
                    </div>
                    <button
                        onClick={handleReset}
                        className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl transition-colors"
                    >
                        <RefreshCw size={14} /> Reset Center
                    </button>
                </div>

                <div className="mt-6 text-[10px] text-center text-slate-600">
                    For best experience, use headphones. Drag the orb to move sound around you.
                </div>
            </div>
        </div>
    );
};
