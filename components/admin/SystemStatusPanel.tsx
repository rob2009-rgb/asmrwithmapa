import React, { useState, useEffect } from 'react';
import { Save, Radio, CheckCircle, AlertTriangle, AlertCircle, Info } from 'lucide-react';
import { supabase } from '../../src/supabaseClient';

type Severity = 'info' | 'warning' | 'critical';

interface SystemStatus {
    id: number;
    is_active: boolean;
    severity: Severity;
    message: string;
    updated_at: string;
}

const SEVERITIES: { value: Severity; label: string; icon: React.ReactNode; color: string }[] = [
    { value: 'info', label: 'Info', icon: <Info size={14} />, color: 'border-blue-500 bg-blue-500/10 text-blue-400' },
    { value: 'warning', label: 'Warning', icon: <AlertTriangle size={14} />, color: 'border-amber-500 bg-amber-500/10 text-amber-400' },
    { value: 'critical', label: 'Critical', icon: <AlertCircle size={14} />, color: 'border-red-500 bg-red-500/10 text-red-400' },
];

const SystemStatusPanel: React.FC = () => {
    const [status, setStatus] = useState<SystemStatus | null>(null);
    const [message, setMessage] = useState('');
    const [severity, setSeverity] = useState<Severity>('info');
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);

    useEffect(() => {
        fetchStatus();
    }, []);

    const fetchStatus = async () => {
        const { data } = await supabase
            .from('system_status')
            .select('*')
            .eq('id', 1)
            .single();
        if (data) {
            const s = data as SystemStatus;
            setStatus(s);
            setMessage(s.message || '');
            setSeverity(s.severity as Severity || 'info');
        }
    };

    const handleSave = async (isActive: boolean) => {
        setSaving(true);
        setSaved(false);
        await supabase
            .from('system_status')
            .update({
                is_active: isActive,
                severity,
                message: isActive ? message : '',
                updated_at: new Date().toISOString(),
            } as any)
            .eq('id', 1);
        await fetchStatus();
        setSaving(false);
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
    };

    return (
        <div className="p-6 space-y-6 max-w-2xl">
            <div>
                <h2 className="text-xl font-bold text-white mb-1">System Status</h2>
                <p className="text-slate-400 text-sm">Publish a global banner to inform users of known issues.</p>
            </div>

            {/* Current Status */}
            <div className={`p-4 rounded-2xl border flex items-center gap-3 ${status?.is_active ? 'border-amber-500/40 bg-amber-500/10' : 'border-slate-700 bg-slate-800/50'}`}>
                <Radio size={16} className={status?.is_active ? 'text-amber-400 animate-pulse' : 'text-slate-500'} />
                <div className="flex-1">
                    <p className={`text-sm font-bold ${status?.is_active ? 'text-amber-400' : 'text-slate-400'}`}>
                        {status?.is_active ? `ACTIVE — ${status.severity.toUpperCase()} BANNER` : 'No active banner'}
                    </p>
                    {status?.is_active && (
                        <p className="text-xs text-slate-400 mt-0.5 line-clamp-1">{status.message}</p>
                    )}
                </div>
                {status?.is_active && (
                    <button
                        onClick={() => handleSave(false)}
                        disabled={saving}
                        className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-white text-xs font-bold rounded-lg transition-colors"
                    >
                        Clear Banner
                    </button>
                )}
            </div>

            <div className="space-y-4">
                {/* Severity Selector */}
                <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Severity</label>
                    <div className="flex gap-2">
                        {SEVERITIES.map(s => (
                            <button
                                key={s.value}
                                onClick={() => setSeverity(s.value)}
                                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-bold transition-all ${severity === s.value ? s.color + ' border-2' : 'border-slate-700 text-slate-500 bg-slate-800 hover:border-slate-500'}`}
                            >
                                {s.icon} {s.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Message */}
                <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Banner Message</label>
                    <textarea
                        value={message}
                        onChange={e => setMessage(e.target.value)}
                        placeholder="e.g. We are aware of issues affecting audio playback and are working on a fix."
                        rows={3}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white text-sm placeholder:text-slate-600 resize-none outline-none focus:border-pink-500 transition-colors"
                    />
                </div>

                {/* Preview */}
                {message && (
                    <div className={`p-3 rounded-xl border flex items-center gap-2 text-sm font-semibold ${severity === 'info' ? 'bg-blue-600 border-blue-500 text-white' :
                            severity === 'warning' ? 'bg-amber-500 border-amber-400 text-amber-950' :
                                'bg-red-600 border-red-500 text-white'
                        }`}>
                        {SEVERITIES.find(s => s.value === severity)?.icon}
                        <span className="flex-1">{message}</span>
                    </div>
                )}

                <button
                    onClick={() => handleSave(true)}
                    disabled={saving || !message.trim()}
                    className="flex items-center gap-2 px-6 py-3 bg-pink-600 hover:bg-pink-700 disabled:opacity-40 text-white text-sm font-bold rounded-xl transition-colors"
                >
                    {saved ? <CheckCircle size={16} /> : <Save size={16} />}
                    {saving ? 'Publishing…' : saved ? 'Published!' : 'Publish Banner'}
                </button>
            </div>
        </div>
    );
};

export default SystemStatusPanel;
