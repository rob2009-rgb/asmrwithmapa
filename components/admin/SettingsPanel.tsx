import React, { useState, useEffect } from 'react';
import { Save, Lock, Database, Globe, Key, RefreshCw, CheckCircle, AlertCircle } from 'lucide-react';
import { supabase } from '../../src/supabaseClient';
import { Database as DBTypes } from '../../src/db_types';

type Setting = DBTypes['public']['Tables']['system_settings']['Row'];

const DEFAULT_SETTINGS = [
    { key: 'fourthwall_token', description: 'Storefront Token for Fourthwall Integration' },
    { key: 'supabase_service_role_key', description: 'Supabase Service Role Key (Required for User Creation)' },
    { key: 'resend_api_key', description: 'Resend API Key (For Transactional Emails)' }
];

const SettingsPanel: React.FC = () => {
    const [settingsMap, setSettingsMap] = useState<Record<string, Setting>>({});
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState<string | null>(null);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    useEffect(() => {
        loadSettings();
    }, []);

    const loadSettings = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('system_settings')
                .select('*');

            if (error) throw error;

            const map: Record<string, Setting> = {};
            data?.forEach(s => map[(s as any).key] = s as Setting);
            setSettingsMap(map);
        } catch (error: any) {
            console.error('Error loading settings:', error);
            setMessage({ type: 'error', text: 'Failed to load settings.' });
        } finally {
            setLoading(false);
        }
    };

    const handleUpdate = async (key: string, newValue: string, description?: string) => {
        setSaving(key);
        setMessage(null);
        try {
            // Upsert (Insert or Update)
            const { error } = await supabase
                .from('system_settings')
                .upsert({
                    key,
                    value: newValue,
                    description: description || settingsMap[key]?.description,
                    updated_at: new Date().toISOString()
                } as any);

            if (error) throw error;

            setSettingsMap(prev => ({
                ...prev,
                [key]: {
                    key,
                    value: newValue,
                    description: description || null,
                    updated_at: new Date().toISOString(),
                    updated_by: null
                } as Setting
            }));

            setMessage({ type: 'success', text: `Saved ${key} successfully.` });

            // Log action
            await supabase.from('audit_logs').insert({
                action: 'UPDATE_SETTING',
                resource: 'system_settings',
                details: { key },
                user_id: ((await supabase.auth.getUser()).data.user?.id) || null
            } as any);

        } catch (error: any) {
            console.error('Error updating setting:', error);
            setMessage({ type: 'error', text: `Failed to save ${key}.` });
        } finally {
            setSaving(null);
        }
    };

    return (
        <div className="space-y-8 text-slate-200">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Header Card */}
                <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 shadow-sm col-span-1 md:col-span-2 flex justify-between items-center">
                    <div>
                        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                            <Database className="text-pink-500" /> System Configuration
                        </h2>
                        <p className="text-slate-400 mt-1">Manage API keys and global application settings.</p>
                    </div>
                    <button onClick={loadSettings} className="p-2 hover:bg-slate-700 rounded-full transition-colors">
                        <RefreshCw size={20} className={loading ? "animate-spin text-pink-500" : "text-slate-400"} />
                    </button>
                </div>

                {/* Settings Form */}
                <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden col-span-1 md:col-span-2">
                    <div className="p-6 space-y-6">
                        {message && (
                            <div className={`p-4 rounded-lg flex items-center gap-2 text-sm font-bold ${message.type === 'success' ? 'bg-emerald-900/20 text-emerald-400 border border-emerald-900' : 'bg-red-900/20 text-red-400 border border-red-900'}`}>
                                {message.type === 'success' ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
                                {message.text}
                            </div>
                        )}

                        {loading ? (
                            <div className="text-center p-8 text-slate-500">Loading configuration...</div>
                        ) : (
                            // Iterate over DEFAULT_SETTINGS to ensure they always appear, merging with actual DB data
                            DEFAULT_SETTINGS.map(def => {
                                const dbSetting = settingsMap[def.key];
                                const currentValue = dbSetting?.value || '';
                                const lastUpdated = dbSetting?.updated_at ? new Date(dbSetting.updated_at).toLocaleString() : 'Never';

                                return (
                                    <div key={def.key} className="bg-slate-800/50 p-6 rounded-lg border border-slate-700/50 hover:border-pink-500/30 transition-colors">
                                        <div className="flex flex-col md:flex-row gap-4 justify-between md:items-start">
                                            <div className="flex-1">
                                                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                                    {def.key === 'fourthwall_token' ? <Globe size={18} className="text-purple-400" /> : <Key size={18} className="text-amber-400" />}
                                                    {def.key.replace(/_/g, ' ').toUpperCase()}
                                                </h3>
                                                <p className="text-sm text-slate-400 mt-1">{def.description}</p>
                                                <div className="mt-2 text-xs text-slate-600 font-mono">Last updated: {lastUpdated}</div>
                                            </div>

                                            <div className="flex-1 w-full md:max-w-md flex gap-2">
                                                <div className="relative flex-1">
                                                    <input
                                                        type="password"
                                                        className="w-full bg-slate-950 border border-slate-800 text-white p-3 pl-10 rounded-lg outline-none focus:border-pink-500 font-mono text-sm"
                                                        defaultValue={currentValue}
                                                        placeholder="Enter value..."
                                                        id={`input-${def.key}`}
                                                    />
                                                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600" size={14} />
                                                </div>
                                                <button
                                                    onClick={() => {
                                                        const input = document.getElementById(`input-${def.key}`) as HTMLInputElement;
                                                        handleUpdate(def.key, input.value, def.description);
                                                    }}
                                                    disabled={saving === def.key}
                                                    className="bg-pink-600 hover:bg-pink-700 text-white p-3 rounded-lg font-bold shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center min-w-[100px]"
                                                >
                                                    {saving === def.key ? <RefreshCw size={18} className="animate-spin" /> : <><Save size={18} className="mr-2" /> Save</>}
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SettingsPanel;
