import React, { useState, useEffect } from 'react';
import { Heart, Activity, Bluetooth, RefreshCw } from 'lucide-react';

interface BioSyncControlProps {
    isPremium: boolean;
    onOpenPremium: () => void;
    isNightMode: boolean;
}

export const BioSyncControl: React.FC<BioSyncControlProps> = ({ isPremium, onOpenPremium, isNightMode }) => {
    const [isConnected, setIsConnected] = useState(false);
    const [isScanning, setIsScanning] = useState(false);
    const [bpm, setBpm] = useState(72);
    const [history, setHistory] = useState<number[]>(new Array(20).fill(40));

    // Simulate Heart Rate Data
    useEffect(() => {
        if (!isConnected) return;

        const interval = setInterval(() => {
            setBpm(prev => {
                const change = Math.random() > 0.5 ? 1 : -1;
                const next = prev + change;
                // keep between 60 and 90 for demo
                return Math.max(60, Math.min(90, next));
            });

            setHistory(prev => {
                const newHist = [...prev.slice(1), 20 + Math.random() * 40]; // simplified graph data
                return newHist;
            });

        }, 1000);

        return () => clearInterval(interval);
    }, [isConnected]);

    const handleConnect = () => {
        if (!isPremium) {
            onOpenPremium();
            return;
        }
        setIsScanning(true);
        setTimeout(() => {
            setIsScanning(false);
            setIsConnected(true);
        }, 2000);
    };

    return (
        <div className={`p-6 rounded-[2rem] border relative overflow-hidden transition-all duration-500 group
             ${isNightMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-red-100'}
        `}>
            <div className="absolute top-0 right-0 p-4 opacity-5">
                <Heart size={120} />
            </div>

            <div className="flex items-center justify-between mb-6 relative z-10">
                <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-lg
                        ${isConnected ? 'bg-red-500 text-white' : 'bg-slate-200 text-slate-400'}
                     `}>
                        <Activity size={20} className={isConnected ? "animate-pulse" : ""} />
                    </div>
                    <div>
                        <h3 className={`text-lg font-black tracking-tight ${isNightMode ? 'text-white' : 'text-slate-900'}`}>
                            Bio-Sync
                        </h3>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                            {isConnected ? 'Monitoring Active' : 'Adaptive Playback'}
                        </p>
                    </div>
                </div>
                {!isPremium && <span className="px-2 py-1 bg-slate-800 text-white text-[10px] font-black uppercase tracking-widest rounded-lg">PRO</span>}
                {isConnected && (
                    <button
                        onClick={() => setIsConnected(false)}
                        className="text-xs text-red-500 font-bold hover:underline"
                    >
                        Disconnect
                    </button>
                )}
            </div>

            {isConnected ? (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
                    <div className="flex items-end justify-between px-4">
                        <div>
                            <span className="text-6xl font-black text-red-500 tracking-tighter">{bpm}</span>
                            <span className="text-sm font-bold text-slate-400 ml-2">BPM</span>
                        </div>
                        <div className="text-right">
                            <p className="text-xs font-bold text-slate-500 mb-1">Status</p>
                            <div className="inline-flex items-center gap-2 px-3 py-1 bg-green-500/10 text-green-500 rounded-full text-[10px] font-black uppercase tracking-widest">
                                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" /> Synced
                            </div>
                        </div>
                    </div>

                    {/* Graph Visualization */}
                    <div className="h-16 flex items-end gap-1 px-1">
                        {history.map((h, i) => (
                            <div
                                key={i}
                                className="flex-1 bg-red-500/20 rounded-t-sm transition-all duration-300"
                                style={{ height: `${h}%` }}
                            />
                        ))}
                    </div>

                    <p className={`text-xs text-center border-t pt-4 ${isNightMode ? 'border-slate-800 text-slate-500' : 'border-red-50 text-slate-400'}`}>
                        Audio tempo will automatically slow down as your heart rate lowers.
                    </p>
                </div>
            ) : (
                <div className="text-center py-4">
                    <button
                        onClick={handleConnect}
                        disabled={isScanning}
                        className={`w-full py-4 rounded-2xl border-2 border-dashed font-bold text-sm transition-all flex items-center justify-center gap-2
                            ${isNightMode
                                ? 'border-slate-700 text-slate-400 hover:border-red-500 hover:text-red-500 hover:bg-red-500/10'
                                : 'border-slate-200 text-slate-500 hover:border-red-400 hover:text-red-500 hover:bg-red-50'}
                        `}
                    >
                        {isScanning ? (
                            <RefreshCw size={18} className="animate-spin" />
                        ) : (
                            <Bluetooth size={18} />
                        )}
                        {isScanning ? 'Scanning Devices...' : 'Connect Health Device'}
                    </button>
                    {!isPremium && <p className="mt-4 text-[10px] text-slate-400 max-w-[200px] mx-auto">Upgrade to sync with Apple Watch, Fitbit, or Oura Ring.</p>}
                </div>
            )}
        </div>
    );
};
