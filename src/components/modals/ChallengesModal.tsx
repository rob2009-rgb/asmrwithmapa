import React from 'react';
import { useScrollLock } from '../../hooks/useScrollLock';
import { X, Trophy, CheckCircle } from 'lucide-react';
import { useChallenges } from '../../hooks/useChallenges';

interface ChallengesModalProps {
    isOpen: boolean;
    onClose: () => void;
    userId: string | undefined;
}

export const ChallengesModal: React.FC<ChallengesModalProps> = ({ isOpen, onClose, userId }) => {
    useScrollLock(isOpen);
    const { challenges, myParticipations, joinChallenge } = useChallenges(userId);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-md" onClick={onClose} />
            <div className="relative w-full max-w-4xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col h-[80vh] animate-in zoom-in-95">

                {/* Header */}
                <div className="p-8 pb-4 border-b border-slate-800 flex justify-between items-center">
                    <div>
                        <h2 className="text-3xl font-black text-white tracking-tight mb-2">Weekly Challenges</h2>
                        <p className="text-slate-400">Participate in community challenges and earn badges.</p>
                    </div>
                    <button onClick={onClose} className="p-2 rounded-full bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition-all">
                        <X size={24} />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {challenges.map(challenge => {
                            const isJoined = myParticipations.some(p => p.challenge_id === challenge.id);
                            const participation = myParticipations.find(p => p.challenge_id === challenge.id);
                            return (
                                <div key={challenge.id} className="bg-slate-950 border border-slate-800 rounded-2xl p-6 relative overflow-hidden group hover:border-slate-700 transition-all">
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="w-12 h-12 bg-slate-900 rounded-xl flex items-center justify-center text-2xl border border-slate-800">
                                            {challenge.icon || '🏆'}
                                        </div>
                                        {isJoined && (
                                            <span className="px-3 py-1 bg-emerald-500/10 text-emerald-400 text-xs font-bold rounded-full border border-emerald-500/20 flex items-center gap-1">
                                                <CheckCircle size={12} /> Active
                                            </span>
                                        )}
                                    </div>
                                    <h3 className="text-xl font-bold text-white mb-2">{challenge.title}</h3>
                                    <p className="text-slate-400 text-sm mb-6 line-clamp-2">{challenge.description}</p>

                                    {isJoined ? (
                                        <div className="space-y-2">
                                            <div className="flex justify-between text-xs font-bold text-slate-500">
                                                <span>Progress</span>
                                                <span>{participation?.progress || 0} / {challenge.goal_value}</span>
                                            </div>
                                            <div className="h-2 bg-slate-900 rounded-full overflow-hidden">
                                                <div
                                                    className="h-full bg-gradient-to-r from-pink-500 to-rose-500"
                                                    style={{ width: `${Math.min(100, ((participation?.progress || 0) / challenge.goal_value) * 100)}%` }}
                                                ></div>
                                            </div>
                                        </div>
                                    ) : (
                                        <button
                                            onClick={() => joinChallenge(challenge.id)}
                                            className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl transition-colors text-sm"
                                        >
                                            Join Challenge
                                        </button>
                                    )}
                                </div>
                            );
                        })}
                        {challenges.length === 0 && (
                            <div className="col-span-full py-12 text-center text-slate-500 italic bg-slate-950/50 rounded-2xl border border-slate-800 border-dashed">
                                No active challenges at the moment. Check back soon!
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
