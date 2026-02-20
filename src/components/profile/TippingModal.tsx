import React, { useState } from 'react';
import { useScrollLock } from '../../hooks/useScrollLock';
import { X, Heart, ExternalLink, Loader } from 'lucide-react';
import { Creator, CreatorService } from '../../services/CreatorService';

interface TippingModalProps {
    isOpen: boolean;
    onClose: () => void;
    creator: Creator;
    userId?: string;
}

export const TippingModal: React.FC<TippingModalProps> = ({ isOpen, onClose, creator, userId }) => {
    useScrollLock(isOpen);
    const [amount, setAmount] = useState<number>(5);
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);

    const handleTip = async () => {
        setLoading(true);
        const res = await CreatorService.sendTip(userId, creator.id, amount, message);
        if (res.success) {
            setSuccess(true);
            setTimeout(() => {
                onClose();
                setSuccess(false);
            }, 3000);
        }
        setLoading(false);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-md" onClick={onClose} />
            <div className="relative w-full max-w-sm bg-slate-900 border border-slate-800 rounded-[2.5rem] p-8 shadow-2xl animate-in zoom-in-95 duration-300">
                <button onClick={onClose} className="absolute top-6 right-6 text-slate-500 hover:text-white"><X size={20} /></button>

                {success ? (
                    <div className="text-center py-8 space-y-4 animate-in fade-in zoom-in-95">
                        <div className="w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto text-emerald-500 text-4xl">❤️</div>
                        <h3 className="text-2xl font-bold text-white">Thank You!</h3>
                        <p className="text-slate-400">Your support means the world to {creator.name}.</p>
                    </div>
                ) : (
                    <div className="space-y-6">
                        <div className="text-center">
                            <div className="w-20 h-20 mx-auto rounded-3xl bg-pink-100 flex items-center justify-center text-4xl mb-4 shadow-inner border border-pink-200">
                                {creator.avatar_url ? <img src={creator.avatar_url} className="w-full h-full object-cover rounded-3xl" /> : '🎨'}
                            </div>
                            <h3 className="text-2xl font-bold text-white">Support {creator.name}</h3>
                            <p className="text-xs text-slate-500 mt-1 uppercase tracking-widest font-bold">ASMR Creator</p>
                        </div>

                        <div className="flex justify-between gap-2">
                            {[1, 5, 10, 20].map(val => (
                                <button
                                    key={val}
                                    onClick={() => setAmount(val)}
                                    className={`flex-1 py-3 rounded-2xl font-bold text-sm transition-all ${amount === val ? 'bg-pink-600 text-white shadow-lg' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}
                                >
                                    ${val}
                                </button>
                            ))}
                        </div>

                        <textarea
                            placeholder="Add a message of appreciation..."
                            className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 text-white text-sm focus:border-pink-500 outline-none h-24 resize-none transition-colors"
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                        />

                        <button
                            onClick={handleTip}
                            disabled={loading}
                            className="w-full py-4 bg-pink-600 hover:bg-pink-500 text-white font-bold rounded-2xl shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2"
                        >
                            {loading ? <Loader className="animate-spin" size={18} /> : <><Heart size={18} fill="white" /> Tip ${amount}</>}
                        </button>

                        {creator.support_link && (
                            <a
                                href={creator.support_link}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center justify-center gap-2 text-xs text-slate-500 hover:text-pink-400 transition-colors pt-2 uppercase font-bold tracking-widest"
                            >
                                <ExternalLink size={12} /> Visit Creator Shop
                            </a>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};
