import React, { useEffect, useState } from 'react';
import { supabase } from '../../supabaseClient';
import { Trophy, Flame, Medal, Crown } from 'lucide-react';

interface LeaderboardEntry {
    user_id: string;
    full_name: string;
    avatar_url: string;
    streak_count: number;
    badges: string[];
}

interface StreakLeaderboardProps {
    currentUserId: string;
}

export const StreakLeaderboard: React.FC<StreakLeaderboardProps> = ({ currentUserId }) => {
    const [leaders, setLeaders] = useState<LeaderboardEntry[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchLeaderboard();
    }, []);

    const fetchLeaderboard = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('active_streak_leaderboard' as any)
                .select('*')
                .order('streak_count', { ascending: false });

            if (error) throw error;
            setLeaders(data || []);
        } catch (error) {
            console.error('Error fetching leaderboard:', error);
        } finally {
            setLoading(false);
        }
    };

    const getRankIcon = (index: number) => {
        switch (index) {
            case 0: return <Crown size={20} className="text-yellow-400 fill-yellow-400" />;
            case 1: return <Medal size={20} className="text-slate-300 fill-slate-300" />;
            case 2: return <Medal size={20} className="text-amber-600 fill-amber-600" />;
            default: return <span className="text-slate-500 font-black text-sm w-5 text-center">{index + 1}</span>;
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-20">
                <Flame size={40} className="text-orange-500 animate-pulse mb-4" />
                <p className="text-slate-400 text-sm">Loading champions...</p>
            </div>
        );
    }

    return (
        <div className="h-full flex flex-col">
            <div className="mb-6">
                <h2 className="text-2xl font-black text-white flex items-center gap-2">
                    <Trophy className="text-yellow-500" />
                    Streak Champions
                </h2>
                <p className="text-slate-400 text-sm">
                    Top dedicated members keeping their relaxation habit alive.
                </p>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-3">
                {leaders.length === 0 ? (
                    <div className="text-center py-10 text-slate-500">
                        No active streaks yet. Be the first!
                    </div>
                ) : (
                    leaders.map((leader, index) => (
                        <div
                            key={leader.user_id}
                            className={`flex items-center gap-4 p-4 rounded-2xl border transition-all
                                ${leader.user_id === currentUserId
                                    ? 'bg-pink-500/10 border-pink-500/50 shadow-lg shadow-pink-500/10'
                                    : 'bg-slate-950/50 border-slate-800 hover:bg-slate-900'}
                            `}
                        >
                            <div className="flex items-center justify-center w-8 shrink-0">
                                {getRankIcon(index)}
                            </div>

                            <div className="w-10 h-10 rounded-full border-2 border-slate-700 overflow-hidden bg-slate-800 shrink-0">
                                {leader.avatar_url ? (
                                    <img src={leader.avatar_url} alt={leader.full_name} className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-[10px] font-bold text-slate-400">
                                        {leader.full_name?.[0] || '?'}
                                    </div>
                                )}
                            </div>

                            <div className="flex-1 min-w-0">
                                <h4 className={`font-bold text-sm truncate ${leader.user_id === currentUserId ? 'text-pink-400' : 'text-white'}`}>
                                    {leader.full_name || 'Anonymous'} {leader.user_id === currentUserId && '(You)'}
                                </h4>
                                {leader.badges && leader.badges.length > 0 && (
                                    <div className="flex gap-1 mt-1">
                                        {leader.badges.slice(0, 3).map((b, i) => (
                                            <span key={i} className="text-[9px] bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded border border-slate-700">
                                                {b}
                                            </span>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <div className="flex items-center gap-1.5 px-3 py-1 bg-orange-500/10 rounded-full border border-orange-500/20 text-orange-500 font-black text-sm">
                                <Flame size={12} className="fill-orange-500" />
                                {leader.streak_count}
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};
