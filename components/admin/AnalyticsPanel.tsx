import React, { useState, useEffect } from 'react';
import { supabase } from '../../src/supabaseClient';
import { BarChart3, Users, Clock, MonitorSmartphone, TrendingUp, Activity, Globe } from 'lucide-react';

export default function AnalyticsPanel() {
    const [stats, setStats] = useState({
        totalSessions: 0,
        avgDurationSec: 0,
        mobilePercent: 0,
        totalEvents: 0
    });

    const [recentEvents, setRecentEvents] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadAnalytics();
    }, []);

    const loadAnalytics = async () => {
        setLoading(true);
        try {
            // Load sessions stats
            const { data: sessions, error: sessionErr } = await (supabase as any)
                .from('analytics_sessions')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(1000);

            if (sessions && !sessionErr) {
                const total = sessions.length;
                const totalDuration = sessions.reduce((acc: number, s: any) => acc + (s.duration_seconds || 0), 0);
                const mobileCount = sessions.filter((s: any) => s.device_type === 'mobile').length;

                setStats({
                    totalSessions: total,
                    avgDurationSec: total > 0 ? Math.round(totalDuration / total) : 0,
                    mobilePercent: total > 0 ? Math.round((mobileCount / total) * 100) : 0,
                    totalEvents: 0 // Will load below
                });
            }

            // Load recent events
            const { data: events, error: eventErr } = await (supabase as any)
                .from('analytics_events')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(100);

            if (events && !eventErr) {
                setRecentEvents(events);
                setStats(prev => ({ ...prev, totalEvents: events.length })); // Just showing sample size for now
            }

        } catch (err) {
            console.error('Failed to load analytics', err);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-full text-slate-500">
                <Activity className="animate-pulse mr-2" /> Loading analytics data...
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex justify-between items-end">
                <div>
                    <h2 className="text-3xl font-bold flex items-center gap-3">
                        <BarChart3 className="text-pink-500" /> Metrics & Analytics
                    </h2>
                    <p className="text-slate-500 mt-2">Privacy-first product usage and performance data.</p>
                </div>
                <button
                    onClick={loadAnalytics}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg font-bold text-sm transition-colors"
                >
                    Refresh Data
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                    icon={<Users size={20} className="text-blue-400" />}
                    label="Total Sessions (Sample)"
                    value={stats.totalSessions.toString()}
                />
                <StatCard
                    icon={<Clock size={20} className="text-emerald-400" />}
                    label="Avg Duration"
                    value={`${Math.floor(stats.avgDurationSec / 60)}m ${stats.avgDurationSec % 60}s`}
                />
                <StatCard
                    icon={<MonitorSmartphone size={20} className="text-purple-400" />}
                    label="Mobile Usage"
                    value={`${stats.mobilePercent}%`}
                />
                <StatCard
                    icon={<TrendingUp size={20} className="text-pink-400" />}
                    label="Tracked Events"
                    value={stats.totalEvents.toString()}
                />
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6">
                <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                    <Globe className="text-slate-400" /> Recent Activity Stream
                </h3>

                <div className="space-y-4">
                    {recentEvents.length === 0 ? (
                        <p className="text-slate-500 text-center py-8">No recent events tracked.</p>
                    ) : (
                        recentEvents.map((evt) => (
                            <div key={evt.id} className="flex gap-4 items-center p-4 bg-slate-950 rounded-xl border border-slate-800/50 hover:border-slate-700 transition-colors">
                                <div className="w-24 text-xs font-mono text-slate-500 shrink-0">
                                    {new Date(evt.created_at).toLocaleTimeString()}
                                </div>
                                <div className="shrink-0">
                                    <EventTypeBadge type={evt.event_type} />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-bold text-white truncate">
                                        {evt.feature_name || 'System'}
                                    </p>
                                    <p className="text-xs text-slate-500 truncate">
                                        ID: {evt.session_id?.substring(0, 8)}... | Path: {evt.metadata?.path || 'N/A'}
                                    </p>
                                </div>
                                {evt.metadata?.active_experiments && evt.metadata.active_experiments !== 'none' && (
                                    <div className="shrink-0 px-2 py-1 bg-purple-500/10 border border-purple-500/20 text-purple-400 text-[10px] rounded uppercase font-bold">
                                        A/B: {evt.metadata.active_experiments}
                                    </div>
                                )}
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}

function StatCard({ icon, label, value }: { icon: React.ReactNode, label: string, value: string }) {
    return (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-slate-950 flex items-center justify-center">
                    {icon}
                </div>
                <span className="text-sm font-bold text-slate-400 uppercase tracking-wider">{label}</span>
            </div>
            <div className="text-3xl font-black text-white">{value}</div>
        </div>
    );
}

function EventTypeBadge({ type }: { type: string }) {
    switch (type) {
        case 'error':
            return <span className="bg-red-500/10 text-red-400 border border-red-500/20 px-2 py-1 rounded text-xs font-bold uppercase">Error</span>;
        case 'conversion':
            return <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-1 rounded text-xs font-bold uppercase">Goal</span>;
        case 'consent':
            return <span className="bg-blue-500/10 text-blue-400 border border-blue-500/20 px-2 py-1 rounded text-xs font-bold uppercase">Consent</span>;
        case 'click':
            return <span className="bg-slate-800 text-slate-300 border border-slate-700 px-2 py-1 rounded text-xs font-bold uppercase">Click</span>;
        default:
            return <span className="bg-slate-800 text-slate-400 border border-slate-700 px-2 py-1 rounded text-xs font-bold uppercase">{type}</span>;
    }
}
