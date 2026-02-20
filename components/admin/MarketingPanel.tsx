import React, { useState, useEffect } from 'react';
import { Mail, Users, FileEdit, Send, Plus, Trash2, Save, Loader2, RefreshCw, Settings, Megaphone, Zap, ChevronRight } from 'lucide-react';
import { supabase } from '../../src/supabaseClient';
import { Database } from '../../src/db_types';

type Subscriber = Database['public']['Tables']['subscribers']['Row'];
type Campaign = Database['public']['Tables']['campaigns']['Row'];
type Template = Database['public']['Tables']['email_templates']['Row'];

const NAV_TABS = [
    { id: 'campaigns', label: 'Campaigns', icon: <Megaphone size={15} /> },
    { id: 'subscribers', label: 'Subscribers', icon: <Users size={15} /> },
    { id: 'templates', label: 'Templates', icon: <Mail size={15} /> },
    { id: 'flows', label: 'Automated Flows', icon: <Zap size={15} /> },
] as const;

type MarketingTab = typeof NAV_TABS[number]['id'];

// Shared input / textarea style
const inputCls = 'w-full bg-slate-900 border border-slate-700 text-white rounded-xl px-4 py-2.5 text-sm outline-none focus:border-pink-500 transition-colors placeholder:text-slate-600';
const selectCls = 'w-full bg-slate-900 border border-slate-700 text-white rounded-xl px-4 py-2.5 text-sm outline-none focus:border-pink-500 transition-colors';

const MarketingPanel: React.FC = () => {
    const [activeTab, setActiveTab] = useState<MarketingTab>('campaigns');
    const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
    const [campaigns, setCampaigns] = useState<Campaign[]>([]);
    const [templates, setTemplates] = useState<Template[]>([]);
    const [flowSettings, setFlowSettings] = useState<Record<string, string>>({});
    const [loading, setLoading] = useState(false);

    const [editingCampaign, setEditingCampaign] = useState<Partial<Campaign> | null>(null);
    const [editingTemplate, setEditingTemplate] = useState<Partial<Template> | null>(null);

    useEffect(() => { loadData(); }, [activeTab]);

    const loadData = async () => {
        setLoading(true);
        try {
            if (activeTab === 'subscribers') {
                const { data } = await supabase.from('subscribers').select('*').order('created_at', { ascending: false });
                setSubscribers(data || []);
            } else if (activeTab === 'campaigns') {
                const { data } = await supabase.from('campaigns').select('*').order('created_at', { ascending: false });
                setCampaigns(data || []);
            } else if (activeTab === 'templates' || activeTab === 'flows') {
                const { data } = await supabase.from('email_templates').select('*').order('name');
                setTemplates(data || []);
                if (activeTab === 'flows') {
                    const { data: settings } = await supabase.from('system_settings').select('*').like('key', 'email_flow_%');
                    const mapping: Record<string, string> = {};
                    settings?.forEach(s => mapping[s.key] = s.value || '');
                    setFlowSettings(mapping);
                }
            }
        } finally {
            setLoading(false);
        }
    };

    const saveCampaign = async () => {
        if (!editingCampaign?.subject || !editingCampaign?.content) return;
        if (editingCampaign.id) {
            await supabase.from('campaigns').update(editingCampaign as any).eq('id', editingCampaign.id);
        } else {
            await supabase.from('campaigns').insert([{ ...editingCampaign, status: 'draft' } as any]);
        }
        setEditingCampaign(null);
        loadData();
    };

    const saveTemplate = async () => {
        if (!editingTemplate?.name || !editingTemplate?.body_template) return;
        const payload = {
            name: editingTemplate.name,
            subject_template: editingTemplate.subject_template || '',
            body_template: editingTemplate.body_template,
            description: editingTemplate.description,
            is_active: editingTemplate.is_active ?? true,
            category: editingTemplate.category || 'standard',
            updated_at: new Date().toISOString(),
        } as any;
        if (editingTemplate.id) {
            await supabase.from('email_templates').update(payload).eq('id', editingTemplate.id);
        } else {
            await supabase.from('email_templates').insert([payload]);
        }
        setEditingTemplate(null);
        loadData();
    };

    const DEFAULT_TEMPLATES = [
        { name: 'Welcome Email', category: 'automation', subject_template: 'Welcome to ASMR with MAPA! ✨', description: 'Sent to new users upon registration.', body_template: `<h1>Welcome, {{name}}!</h1><p>We are thrilled to have you join our community of relaxation.</p>` },
        { name: 'Streak Achievement', category: 'automation', subject_template: 'You reached a {{streak_days}}-day streak! 🔥', description: 'Sent when a user maintains a listening streak.', body_template: `<h1>Keep it up, {{name}}!</h1><p>You've listened for <strong>{{streak_days}} days</strong> in a row.</p>` },
        { name: 'Upgrade Confirmation', category: 'automation', subject_template: 'Welcome to Premium! 🌟', description: 'Sent after successful subscription upgrade.', body_template: `<h1>Thank you for upgrading!</h1><p>You now have access to exclusive features.</p>` },
        { name: 'Newsletter', category: 'standard', subject_template: 'This Week in ASMR: New Triggers & Tips', description: 'Weekly general update template.', body_template: `<h1>Hello {{name}},</h1><p>Here's what's new this week:</p>` },
        { name: 'Feature Announcement', category: 'standard', subject_template: 'New Feature: {{feature_name}} 🚀', description: 'Template for announcing app updates.', body_template: `<h1>Introducing {{feature_name}}</h1><p>{{feature_description}}</p>` },
    ];

    const restoreDefaults = async () => {
        if (!confirm('Restore default templates? Existing ones will be updated.')) return;
        setLoading(true);
        for (const t of DEFAULT_TEMPLATES) {
            const { data } = await supabase.from('email_templates').select('id').eq('name', t.name).single();
            if (!data) { await supabase.from('email_templates').insert([t]); }
            else { await supabase.from('email_templates').update({ category: t.category, subject_template: t.subject_template, body_template: t.body_template, description: t.description }).eq('id', data.id); }
        }
        await loadData();
        setLoading(false);
    };

    const saveFlowSetting = async (key: string, value: string) => {
        await supabase.from('system_settings').upsert({ key, value, description: 'Automated Email Flow Mapping', updated_at: new Date().toISOString() });
        setFlowSettings(prev => ({ ...prev, [key]: value }));
    };

    const deleteItem = async (table: 'campaigns' | 'email_templates', id: string) => {
        if (!confirm('Delete this item?')) return;
        await supabase.from(table).delete().eq('id', id);
        loadData();
    };

    const SYSTEM_FLOWS = [
        { key: 'email_flow_welcome', label: 'Welcome Series', description: 'Sent immediately after user registration.' },
        { key: 'email_flow_upgrade', label: 'Upgrade Confirmation', description: 'Sent when user upgrades to Premium.' },
        { key: 'email_flow_cancellation', label: 'Cancellation Feedback', description: 'Sent when user cancels subscription.' },
        { key: 'email_flow_inactivity_7d', label: 'Inactivity Reminder (7d)', description: 'Sent if user hasn\'t logged in for 7 days.' },
        { key: 'email_flow_streak_7d', label: '7-Day Streak Achievement', description: 'Sent when user hits a 7-day streak.' },
        { key: 'email_flow_ticket_received', label: 'Support Ticket Received', description: 'Sent when user opens a new ticket.' },
        { key: 'email_flow_ticket_reply', label: 'New Support Reply', description: 'Sent when staff replies to a ticket.' },
        { key: 'email_flow_ticket_closed', label: 'Ticket Closed', description: 'Sent when a ticket is resolved.' },
    ];

    const automationTemplates = templates.filter(t => t.category === 'automation');
    const standardTemplates = templates.filter(t => t.category !== 'automation');

    return (
        <div className="flex flex-col h-full space-y-0">

            {/* Header */}
            <div className="mb-6">
                <h2 className="text-2xl font-black text-white tracking-tight">Marketing</h2>
                <p className="text-slate-500 text-sm mt-1">Manage campaigns, subscribers and automated email flows.</p>
            </div>

            {/* Sub-nav pill tabs */}
            <div className="flex gap-1 bg-slate-900 p-1 rounded-2xl border border-slate-800 w-fit mb-6">
                {NAV_TABS.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all duration-200 ${activeTab === tab.id ? 'bg-pink-600 text-white shadow-lg shadow-pink-900/30' : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800'}`}
                    >
                        {tab.icon} {tab.label}
                    </button>
                ))}
            </div>

            {loading && (
                <div className="flex items-center justify-center py-16">
                    <Loader2 className="animate-spin text-pink-500" size={32} />
                </div>
            )}

            {/* ── CAMPAIGNS ── */}
            {!loading && activeTab === 'campaigns' && (
                <div className="space-y-4">
                    {!editingCampaign ? (
                        <>
                            <div className="flex justify-between items-center">
                                <h3 className="text-lg font-bold text-white">Email Campaigns</h3>
                                <button
                                    onClick={() => setEditingCampaign({ subject: '', content: '', target_audience: 'all' })}
                                    className="flex items-center gap-2 bg-pink-600 hover:bg-pink-500 text-white px-4 py-2 rounded-xl text-sm font-bold transition-colors"
                                >
                                    <Plus size={16} /> New Campaign
                                </button>
                            </div>

                            {campaigns.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-16 text-slate-600 border-2 border-dashed border-slate-800 rounded-2xl">
                                    <Megaphone size={36} className="mb-3 opacity-30" />
                                    <p className="text-sm font-bold uppercase tracking-widest">No campaigns yet</p>
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    {campaigns.map(c => (
                                        <div key={c.id} className="bg-slate-900 border border-slate-800 p-4 rounded-2xl flex justify-between items-center hover:border-slate-700 transition-colors">
                                            <div>
                                                <h4 className="font-bold text-white">{c.subject}</h4>
                                                <p className="text-xs text-slate-500 mt-0.5 uppercase tracking-wider">
                                                    <span className={`inline-block px-2 py-0.5 rounded-full mr-2 font-bold ${c.status === 'sent' ? 'bg-green-500/20 text-green-400' : 'bg-slate-700 text-slate-400'}`}>{c.status}</span>
                                                    {c.target_audience}
                                                </p>
                                            </div>
                                            <div className="flex gap-1">
                                                <button onClick={() => setEditingCampaign(c)} className="p-2 hover:bg-slate-800 rounded-xl text-blue-400 transition-colors"><FileEdit size={16} /></button>
                                                <button onClick={() => deleteItem('campaigns', c.id)} className="p-2 hover:bg-slate-800 rounded-xl text-red-400 transition-colors"><Trash2 size={16} /></button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </>
                    ) : (
                        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-4">
                            <h3 className="text-xl font-black text-white">{editingCampaign.id ? 'Edit Campaign' : 'New Campaign'}</h3>
                            <input className={inputCls} placeholder="Subject Line" value={editingCampaign.subject || ''} onChange={e => setEditingCampaign({ ...editingCampaign, subject: e.target.value })} />
                            <textarea className={`${inputCls} h-40 resize-none`} placeholder="Email Content" value={editingCampaign.content || ''} onChange={e => setEditingCampaign({ ...editingCampaign, content: e.target.value })} />
                            <select className={selectCls} value={editingCampaign.target_audience || 'all'} onChange={e => setEditingCampaign({ ...editingCampaign, target_audience: e.target.value as any })}>
                                <option value="all">All Subscribers</option>
                                <option value="premium">Premium Only</option>
                                <option value="free">Free Only</option>
                            </select>
                            <div className="flex justify-end gap-2 pt-2">
                                <button onClick={() => setEditingCampaign(null)} className="px-4 py-2 text-slate-400 hover:text-white rounded-xl transition-colors text-sm font-bold">Cancel</button>
                                <button onClick={saveCampaign} className="flex items-center gap-2 px-4 py-2 bg-pink-600 hover:bg-pink-500 text-white rounded-xl text-sm font-bold transition-colors">
                                    <Save size={16} /> Save Draft
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* ── TEMPLATES ── */}
            {!loading && activeTab === 'templates' && (
                <div className="space-y-4">
                    {!editingTemplate ? (
                        <>
                            <div className="flex justify-between items-center">
                                <h3 className="text-lg font-bold text-white">Standard Templates</h3>
                                <div className="flex gap-2">
                                    <button onClick={restoreDefaults} className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-300 px-3 py-2 rounded-xl text-sm font-bold transition-colors">
                                        <RefreshCw size={14} /> Restore Defaults
                                    </button>
                                    <button onClick={() => setEditingTemplate({ name: '', subject_template: '', body_template: '', category: 'standard' })} className="flex items-center gap-2 bg-pink-600 hover:bg-pink-500 text-white px-4 py-2 rounded-xl text-sm font-bold transition-colors">
                                        <Plus size={16} /> New Template
                                    </button>
                                </div>
                            </div>

                            {standardTemplates.length === 0 ? (
                                <p className="text-slate-500 italic text-sm px-1">No standard templates. Click "Restore Defaults" to load samples.</p>
                            ) : (
                                <div className="space-y-2">
                                    {standardTemplates.map(t => (
                                        <div key={t.id} className="bg-slate-900 border border-slate-800 p-4 rounded-2xl hover:border-slate-700 transition-colors">
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <h4 className="font-bold text-white">{t.name}</h4>
                                                    <p className="text-xs text-slate-500 mt-0.5">{t.description || 'No description'}</p>
                                                </div>
                                                <div className="flex items-center gap-1">
                                                    <button onClick={async () => { if (confirm('Promote to automation email?')) { await supabase.from('email_templates').update({ category: 'automation' }).eq('id', t.id); loadData(); } }} className="px-2 py-1 bg-indigo-500/20 text-indigo-400 hover:bg-indigo-500/30 rounded-lg text-xs font-bold transition-colors">Promote</button>
                                                    <button onClick={() => setEditingTemplate(t)} className="p-1.5 hover:bg-slate-800 rounded-xl text-blue-400 transition-colors"><FileEdit size={14} /></button>
                                                    <button onClick={() => deleteItem('email_templates', t.id)} className="p-1.5 hover:bg-slate-800 rounded-xl text-red-400 transition-colors"><Trash2 size={14} /></button>
                                                </div>
                                            </div>
                                            <div className="mt-2 bg-slate-950 rounded-lg px-3 py-1.5 text-xs text-slate-500 font-mono truncate">{t.subject_template}</div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </>
                    ) : (
                        <TemplateEditor
                            template={editingTemplate}
                            templates={templates}
                            onSave={saveTemplate}
                            onCancel={() => setEditingTemplate(null)}
                            onChange={setEditingTemplate}
                            showCategoryField
                        />
                    )}
                </div>
            )}

            {/* ── SUBSCRIBERS ── */}
            {!loading && activeTab === 'subscribers' && (
                <div className="space-y-4">
                    <div className="flex justify-between items-center">
                        <h3 className="text-lg font-bold text-white">Subscribers <span className="text-slate-500 font-normal text-base">({subscribers.length})</span></h3>
                        <button className="text-sm text-pink-400 font-bold hover:text-pink-300 transition-colors">Export CSV</button>
                    </div>
                    <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
                        <table className="min-w-full divide-y divide-slate-800">
                            <thead className="bg-slate-950/60">
                                <tr>
                                    {['Email', 'Source', 'Joined', 'Status'].map(h => (
                                        <th key={h} className="px-5 py-3 text-left text-[10px] font-black text-slate-500 uppercase tracking-widest">{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800">
                                {subscribers.map(s => (
                                    <tr key={s.id} className="hover:bg-slate-800/50 transition-colors">
                                        <td className="px-5 py-3 text-sm font-medium text-white">{s.email}</td>
                                        <td className="px-5 py-3 text-sm text-slate-400">{s.source}</td>
                                        <td className="px-5 py-3 text-sm text-slate-400">{new Date(s.created_at).toLocaleDateString()}</td>
                                        <td className="px-5 py-3">
                                            <span className={`px-2.5 py-0.5 text-xs font-bold rounded-full ${s.is_active ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                                                {s.is_active ? 'Active' : 'Unsubscribed'}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {subscribers.length === 0 && (
                            <div className="py-12 text-center text-slate-600 text-sm">No subscribers yet.</div>
                        )}
                    </div>
                </div>
            )}

            {/* ── FLOWS ── */}
            {!loading && activeTab === 'flows' && (
                <div className="space-y-6">
                    {editingTemplate ? (
                        <TemplateEditor
                            template={editingTemplate}
                            templates={templates}
                            onSave={saveTemplate}
                            onCancel={() => setEditingTemplate(null)}
                            onChange={setEditingTemplate}
                            isAutomation
                        />
                    ) : (
                        <>
                            <div>
                                <h3 className="text-lg font-bold text-white mb-1">Automated Email Flows</h3>
                                <p className="text-sm text-slate-500">Map system events to email templates. Changes take effect immediately.</p>
                            </div>

                            <div className="space-y-2">
                                {SYSTEM_FLOWS.map(flow => (
                                    <div key={flow.key} className="bg-slate-900 border border-slate-800 p-4 rounded-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-3 hover:border-slate-700 transition-colors">
                                        <div className="flex-1">
                                            <h4 className="font-bold text-white text-sm">{flow.label}</h4>
                                            <p className="text-xs text-slate-500 mt-0.5">{flow.description}</p>
                                            <code className="text-[10px] bg-slate-950 px-2 py-0.5 rounded mt-1 inline-block text-slate-600 font-mono">{flow.key}</code>
                                        </div>
                                        <select
                                            className="w-full md:w-56 bg-slate-950 border border-slate-700 text-white rounded-xl px-3 py-2 text-xs outline-none focus:border-pink-500 transition-colors"
                                            value={flowSettings[flow.key] || ''}
                                            onChange={e => saveFlowSetting(flow.key, e.target.value)}
                                        >
                                            <option value="">— Select Template —</option>
                                            <option value="disabled">Disable Flow</option>
                                            {templates.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                                        </select>
                                    </div>
                                ))}
                            </div>

                            {/* Automation Templates */}
                            <div className="pt-4 border-t border-slate-800">
                                <div className="flex justify-between items-center mb-3">
                                    <h4 className="font-bold text-white text-sm">Automation Templates</h4>
                                    <button onClick={() => setEditingTemplate({ name: '', subject_template: '', body_template: '', category: 'automation' })} className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-white px-3 py-1.5 rounded-xl text-xs font-bold transition-colors">
                                        <Plus size={13} /> New
                                    </button>
                                </div>
                                <div className="space-y-2">
                                    {automationTemplates.map(t => (
                                        <div key={t.id} className="bg-slate-900 border border-slate-800 p-3 rounded-xl flex justify-between items-center hover:border-slate-700 transition-colors">
                                            <div className="flex items-center gap-2.5">
                                                <Settings size={14} className="text-pink-500 shrink-0" />
                                                <div>
                                                    <div className="font-bold text-sm text-white">{t.name}</div>
                                                    <div className="text-xs text-slate-500 font-mono truncate max-w-xs">{t.subject_template}</div>
                                                </div>
                                            </div>
                                            <div className="flex gap-1">
                                                <button onClick={() => setEditingTemplate(t)} className="px-2.5 py-1 bg-slate-800 hover:bg-pink-600 text-white rounded-lg text-xs font-bold transition-colors">Edit</button>
                                                <button onClick={() => deleteItem('email_templates', t.id)} className="p-1.5 hover:bg-slate-800 rounded-lg text-red-400 transition-colors"><Trash2 size={13} /></button>
                                            </div>
                                        </div>
                                    ))}
                                    {automationTemplates.length === 0 && <p className="text-slate-600 text-xs italic px-1">No automation templates. Click "New" to create one.</p>}
                                </div>
                            </div>
                        </>
                    )}
                </div>
            )}
        </div>
    );
};

/* ── Shared editor component ── */
interface TemplateEditorProps {
    template: Partial<Template>;
    templates: Template[];
    onSave: () => void;
    onCancel: () => void;
    onChange: (t: Partial<Template>) => void;
    showCategoryField?: boolean;
    isAutomation?: boolean;
}

const inputClsLocal = 'w-full bg-slate-900 border border-slate-700 text-white rounded-xl px-4 py-2.5 text-sm outline-none focus:border-pink-500 transition-colors placeholder:text-slate-600';

const TemplateEditor: React.FC<TemplateEditorProps> = ({ template, templates, onSave, onCancel, onChange, showCategoryField, isAutomation }) => (
    <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-4">
        <h3 className="text-xl font-black text-white">{template.id ? `Edit: ${template.name}` : 'New Template'}</h3>

        {isAutomation && (
            <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-3 text-amber-400 text-xs font-medium">
                ⚠️ This is a system email. Changes affect all future automated sends.
            </div>
        )}

        <div className="flex justify-end">
            <select
                className="bg-slate-950 border border-slate-700 text-slate-400 rounded-xl px-3 py-1.5 text-xs outline-none focus:border-pink-500 transition-colors"
                onChange={e => { const t = templates.find(t => t.id === e.target.value); if (t && confirm('Overwrite content from selected template?')) onChange({ ...template, subject_template: t.subject_template, body_template: t.body_template }); }}
                value=""
            >
                <option value="">Load content from…</option>
                {templates.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
        </div>

        <div>
            <label className="block text-xs font-bold text-slate-400 mb-1.5 uppercase tracking-wider">Template Name</label>
            <input className={inputClsLocal} placeholder="e.g. Welcome Email" value={template.name || ''} onChange={e => onChange({ ...template, name: e.target.value })} />
        </div>

        {showCategoryField && (
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-xs font-bold text-slate-400 mb-1.5 uppercase tracking-wider">Category</label>
                    <select className={inputClsLocal} value={template.category || 'standard'} onChange={e => onChange({ ...template, category: e.target.value })}>
                        <option value="standard">Standard Template</option>
                        <option value="automation">Automation (System)</option>
                    </select>
                </div>
                <div>
                    <label className="block text-xs font-bold text-slate-400 mb-1.5 uppercase tracking-wider">Description</label>
                    <input className={inputClsLocal} placeholder="When is this sent?" value={template.description || ''} onChange={e => onChange({ ...template, description: e.target.value })} />
                </div>
            </div>
        )}

        <div>
            <label className="block text-xs font-bold text-slate-400 mb-1.5 uppercase tracking-wider">Subject Line</label>
            <input className={inputClsLocal} placeholder="Subject (supports {{variables}})" value={template.subject_template || ''} onChange={e => onChange({ ...template, subject_template: e.target.value })} />
        </div>

        <div>
            <label className="block text-xs font-bold text-slate-400 mb-1.5 uppercase tracking-wider">Body (HTML supported)</label>
            <textarea className={`${inputClsLocal} h-52 resize-none font-mono text-xs`} placeholder="<h1>Hi {{name}},</h1> ..." value={template.body_template || ''} onChange={e => onChange({ ...template, body_template: e.target.value })} />
        </div>

        <div className="flex justify-end gap-2 pt-1">
            <button onClick={onCancel} className="px-4 py-2 text-slate-400 hover:text-white rounded-xl text-sm font-bold transition-colors">Cancel</button>
            <button onClick={onSave} className="flex items-center gap-2 px-4 py-2 bg-pink-600 hover:bg-pink-500 text-white rounded-xl text-sm font-bold transition-colors">
                <Save size={15} /> Save Template
            </button>
        </div>
    </div>
);

export default MarketingPanel;
