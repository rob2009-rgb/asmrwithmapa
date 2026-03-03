import React, { useState, useEffect } from 'react';
import { X, User, Shield, LogOut, Loader, MessageSquare, Plus, ChevronRight, LayoutDashboard, Crown, Send, Lock, Image as ImageIcon, Paperclip, Sparkles, Trash2, AlertTriangle } from 'lucide-react';
import { supabase } from '../../supabaseClient';
import { PrivacyVault } from '../features/PrivacyVault';
import { useNotification } from '../../contexts/NotificationContext';
// import { usePreferences } from '../../hooks/usePreferences'; // Unused
import { useSocialAccounts } from '../../hooks/useSocialAccounts';
import { useTwoFactor } from '../../hooks/useTwoFactor';
// import { useStreaks } from '../../hooks/useStreaks'; // Unused
import { useSupport, Ticket } from '../../hooks/useSupport';
import { useScrollLock } from '../../hooks/useScrollLock';
import { useEmail } from '../../hooks/useEmail';
import HelpCenter from './HelpCenter';
import ContextualHelp from '../help/ContextualHelp';
import CSATPrompt from '../support/CSATPrompt';
import { SoundCategory } from '../../../types';

interface ProfileHubProps {
    isOpen: boolean;
    onClose: () => void;
    user: any;
    categories: SoundCategory[];
    onSetCurrentSound: (sound: SoundCategory) => void;
    onOpenAdmin: () => void;
}

export const ProfileHub: React.FC<ProfileHubProps> = ({ isOpen, onClose, user, categories, onSetCurrentSound, onOpenAdmin }) => {
    const { showNotification } = useNotification();
    useScrollLock(isOpen);
    const { accounts: socialAccounts, addAccount, removeAccount } = useSocialAccounts(user?.id);
    const { isEnabled: is2FAEnabled, generateSecret, verifyAndEnable, disable2FA } = useTwoFactor(user?.id);
    const { tickets, messages: ticketMessages, loading: supportLoading, createTicket, sendMessage, loadMessages, subscribeToMessages } = useSupport(user?.id);

    // Simplified Tab Structure
    const [activeTab, setActiveTab] = useState<'account' | 'support' | 'vault'>('account');
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(true);

    // Social Links State
    const [loading, setLoading] = useState(false);
    const [profile, setProfile] = useState<any>(null);
    const [name, setName] = useState('');
    const [updating, setUpdating] = useState(false);

    // Support State
    const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
    const [newTicketSubject, setNewTicketSubject] = useState('');
    const [newTicketMessage, setNewTicketMessage] = useState('');
    const [isCreatingTicket, setIsCreatingTicket] = useState(false);
    const [replyMessage, setReplyMessage] = useState('');
    const [files, setFiles] = useState<File[]>([]);
    const [supportView, setSupportView] = useState<'help' | 'tickets'>('help');
    const [dismissedCSAT, setDismissedCSAT] = useState<Set<string>>(new Set());
    const fileInputRef = React.useRef<HTMLInputElement>(null);

    // Realtime subscription: auto-update chat when a ticket is open
    useEffect(() => {
        if (!selectedTicket) return;
        loadMessages(selectedTicket.id);
        const unsubscribe = subscribeToMessages(selectedTicket.id);
        return unsubscribe;
    }, [selectedTicket?.id]);

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            setFiles(prev => [...prev, ...Array.from(e.target.files!)]);
        }
    };

    const removeFile = (index: number) => {
        setFiles(prev => prev.filter((_, i) => i !== index));
    };

    // Password Reset
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isResettingPassword, setIsResettingPassword] = useState(false);

    // Account Deletion
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [deleteStep, setDeleteStep] = useState(1);

    useEffect(() => {
        if (user && isOpen) {
            loadProfile();
        }
    }, [user, isOpen]);

    useEffect(() => {
        if (selectedTicket) {
            loadMessages(selectedTicket.id);
        }
    }, [selectedTicket]);

    const loadProfile = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single();

        if (!error) {
            setProfile(data);
            setName(data.full_name || '');
        }
        setLoading(false);
    };

    const handleUpdateProfile = async () => {
        setUpdating(true);
        try {
            const { error } = await supabase
                .from('profiles')
                .update({ full_name: name })
                .eq('id', user.id);

            if (error) throw error;

            showNotification('success', 'Profile updated successfully.');
            loadProfile(); // Refresh
        } catch (error: any) {
            showNotification('error', 'Failed to update profile.');
        } finally {
            setUpdating(false);
        }
    };

    const handlePasswordReset = async () => {
        if (!currentPassword) {
            showNotification('error', 'Please enter your current password.');
            return;
        }
        if (newPassword !== confirmPassword) {
            showNotification('error', 'New passwords do not match');
            return;
        }
        if (newPassword.length < 6) {
            showNotification('error', 'Password must be at least 6 characters');
            return;
        }

        setIsResettingPassword(true);

        // Verify current password first
        const { error: signInError } = await supabase.auth.signInWithPassword({
            email: user.email,
            password: currentPassword,
        });

        if (signInError) {
            showNotification('error', 'Incorrect current password.');
            setIsResettingPassword(false);
            return;
        }

        const { error } = await supabase.auth.updateUser({ password: newPassword });
        if (error) {
            showNotification('error', error.message);
        } else {
            showNotification('success', 'Password updated successfully');
            setNewPassword('');
            setConfirmPassword('');
            setCurrentPassword('');
        }
        setIsResettingPassword(false);
    };

    const handleDeleteAccount = async () => {
        setIsDeleting(true);
        try {
            // Call the Edge Function which handles data purging AND auth deletion
            const { data, error } = await supabase.functions.invoke('delete-user');

            if (error) throw error;
            if (data?.error) throw new Error(data.error);

            // Sign out the user globally (session should be gone anyway, but this cleans local state)
            await supabase.auth.signOut();

            showNotification('success', 'Your account and all associated data have been permanently deleted.');
            onClose();
        } catch (error: any) {
            console.error('Deletion error:', error);
            showNotification('error', 'Critical failure: Could not delete account. Please contact support.');
        } finally {
            setIsDeleting(false);
            setShowDeleteConfirm(false);
        }
    };

    const handleSignOut = async () => {
        await supabase.auth.signOut();
        onClose();
        showNotification('success', 'Signed out successfully.');
    };

    const handleConnectAccount = (provider: string) => {
        const username = window.prompt(`Enter your ${provider} username:`);
        if (username) {
            addAccount(provider as any, username);
        }
    };

    // Support Handlers
    const { notifyTicketCreated } = useEmail();

    // ...

    const handleCreateTicket = async () => {
        if (!newTicketSubject || !newTicketMessage) return;
        setIsCreatingTicket(true);
        // Corrected argument order: subject, category, message, priority, files
        const newTicket = await createTicket(newTicketSubject, 'general', newTicketMessage, 'normal', files);

        if (newTicket && profile?.email) {
            notifyTicketCreated(profile.email, profile.full_name || 'User', newTicket.id, newTicketSubject);
        }

        setNewTicketSubject('');
        setNewTicketMessage('');
        setFiles([]);
        setIsCreatingTicket(false);
        showNotification('success', 'Ticket created successfully.');
    };

    const handleSendReply = async () => {
        if (!selectedTicket || !replyMessage) return;
        await sendMessage(selectedTicket.id, replyMessage);
        setReplyMessage('');
    };

    const handleOpenPremium = React.useCallback(() => {
        showNotification('info', 'This feature requires a Premium membership.');
    }, [showNotification]);

    if (!isOpen) return null;

    // Determine Status from Profile
    const role = profile?.role || user?.role;
    const tier = (profile?.subscription_tier || user?.subscription_tier || 'free').toLowerCase();

    // Special Tier Logic
    const isMapa = tier === 'mapa';
    const isStaff = tier === 'staff';
    const isPremium = tier === 'premium' || tier === 'paid' || role === 'admin' || isMapa || isStaff;

    const statusLabel =
        isMapa ? 'MAPA (The Star)' :
            isStaff ? 'Staff Member' :
                role === 'admin' ? 'Administrator' :
                    isPremium ? 'Premium Member' : 'Free Member';

    const statusColor =
        isMapa ? 'bg-pink-500/10 text-pink-400 border-pink-500/20 shadow-lg shadow-pink-500/10' :
            isStaff ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' :
                role === 'admin' ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                    (isPremium ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' : 'bg-slate-800 text-slate-400 border-slate-700');

    const statusIcon =
        isMapa ? <Sparkles size={12} className="animate-pulse" /> :
            isStaff ? <Shield size={12} /> :
                role === 'admin' ? <Shield size={12} /> :
                    (isPremium ? <Crown size={12} /> : <User size={12} />);

    // Privacy Masking for MAPA/Staff
    const maskEmail = (email: string) => {
        if (!email) return '';
        if (!isMapa && !isStaff) return email;
        const [name, domain] = email.split('@');
        if (!domain) return email;
        return `${name[0]}***@${domain[0]}***.${domain.split('.').pop()}`;
    };


    return (
        <div className="fixed inset-0 z-[120] flex items-center justify-center md:p-4">
            {/* Backdrop */}
            <div className="hidden md:block absolute inset-0 bg-slate-950/90 backdrop-blur-sm" onClick={onClose} />

            <div className="fixed inset-0 md:relative w-full max-w-5xl bg-slate-900 md:border border-slate-800 md:rounded-3xl shadow-2xl overflow-hidden flex flex-col md:flex-row h-full md:h-[85vh] animate-in zoom-in-95">

                {/* Sidebar */}
                <div className={`w-full md:w-64 bg-slate-950 border-b md:border-b-0 md:border-r border-slate-800 p-4 md:p-6 flex-col gap-2 shrink-0 md:shrink-1 overflow-y-auto ${isMobileMenuOpen ? 'flex' : 'hidden md:flex'}`}>

                    {/* Mobile Close Button in Sidebar */}
                    <div className="absolute top-4 right-4 md:hidden z-10">
                        <button onClick={onClose} className="p-2 rounded-full bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition-all shadow-lg">
                            <X size={20} />
                        </button>
                    </div>

                    <div className="mb-4 md:mb-6 px-2 flex items-center gap-3 mt-8 md:mt-0">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-pink-500 to-rose-600 flex items-center justify-center text-white font-black text-xl shadow-lg shrink-0">
                            {(user?.email?.[0] || 'U').toUpperCase()}
                        </div>
                        <div className="overflow-hidden">
                            <div className="text-sm font-bold text-white truncate">{profile?.full_name || 'My Profile'}</div>
                            <div className="text-[10px] text-slate-500 truncate">{maskEmail(user?.email)}</div>
                        </div>
                    </div>

                    {/* Status Badge in Sidebar */}
                    <div className={`mx-2 mb-6 flex items-center gap-2 px-3 py-1.5 rounded-lg border text-[10px] font-bold uppercase tracking-wider ${statusColor}`}>
                        {statusIcon}
                        {statusLabel}
                    </div>

                    <nav className="flex flex-col gap-2 w-full custom-scrollbar">
                        {[
                            { id: 'account', icon: User, label: 'My Account' },
                            { id: 'vault', icon: Lock, label: 'Mind Vault' },
                            { id: 'support', icon: MessageSquare, label: 'Support' }
                        ].map(item => (
                            <button
                                key={item.id}
                                onClick={() => {
                                    setActiveTab(item.id as any);
                                    setIsMobileMenuOpen(false);
                                }}
                                className={`w-full flex items-center justify-start gap-3 px-4 py-4 md:py-3 rounded-xl transition-all font-bold text-base md:text-sm text-left
                                    ${activeTab === item.id ? 'bg-pink-600 text-white shadow-lg shadow-pink-900/20' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}
                            >
                                <item.icon size={20} className="shrink-0" />
                                {item.label}
                                <ChevronRight size={18} className="ml-auto md:hidden opacity-50" />
                            </button>
                        ))}
                    </nav>

                    <div className="mt-8 md:mt-auto pt-4 flex flex-col gap-2 border-t border-slate-800 w-full shrink-0">
                        {role === 'admin' && (
                            <button
                                onClick={onOpenAdmin}
                                className="w-full flex items-center justify-start gap-3 px-4 py-4 md:py-3 rounded-xl transition-all font-bold text-base md:text-sm text-left text-red-400 hover:bg-red-500/10 hover:text-red-300"
                            >
                                <LayoutDashboard size={20} className="shrink-0" />
                                <span className="inline">Admin Portal</span>
                            </button>
                        )}
                        <button
                            onClick={handleSignOut}
                            className="w-full flex items-center justify-start gap-3 px-4 py-4 md:py-3 rounded-xl transition-all font-bold text-base md:text-sm text-left text-slate-400 hover:text-white hover:bg-slate-800"
                        >
                            <LogOut size={20} className="shrink-0" />
                            Sign Out
                        </button>
                    </div>
                </div>

                {/* Main Content */}
                <div className={`flex-1 flex flex-col bg-slate-900 relative overflow-hidden ${!isMobileMenuOpen ? 'flex' : 'hidden md:flex'}`}>
                    {/* Top Right Close Button Only */}
                    <div className="absolute top-4 right-4 md:top-6 md:right-6 z-10">
                        <button onClick={onClose} className="p-2 rounded-full bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition-all shadow-lg">
                            <X size={20} />
                        </button>
                    </div>

                    <div className="p-6 md:p-8 pb-4 border-b border-slate-800/50 shrink-0 flex items-center gap-4">
                        <button
                            className="md:hidden p-2 -ml-2 rounded-full hover:bg-slate-800 text-slate-400 transition-colors"
                            onClick={() => setIsMobileMenuOpen(true)}
                        >
                            <ChevronRight size={24} className="rotate-180" />
                        </button>
                        <div>
                            <h2 className="text-2xl md:text-3xl font-black text-white tracking-tight mb-1 pr-10">
                                {activeTab === 'account' && 'Account Settings'}
                                {activeTab === 'vault' && 'Mind Vault'}
                                {activeTab === 'support' && 'Help & Support'}
                            </h2>
                            <p className="text-sm md:text-base text-slate-400">
                                {activeTab === 'account' && 'Manage your personal details, membership, and security here.'}
                                {activeTab === 'vault' && 'Securely journal your thoughts in an encrypted local vault.'}
                                {activeTab === 'support' && 'Get help or submit feedback to our team.'}
                            </p>
                        </div>
                    </div>

                    {activeTab === 'vault' ? (
                        <div className="flex-1 p-8 overflow-hidden flex flex-col">
                            <PrivacyVault
                                isPremium={isPremium || user?.role === 'admin'}
                                onOpenPremium={handleOpenPremium}
                                isNightMode={true}
                            />
                        </div>
                    ) : (
                        <div className="flex-1 overflow-y-auto p-4 md:p-8 custom-scrollbar relative">
                            {/* MY ACCOUNT TAB (Consolidated) */}
                            {activeTab === 'account' && (
                                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 max-w-3xl pb-20">
                                    {/* ... content for account ... */}
                                    {/* 1. Personal Details */}
                                    <section className="space-y-4">
                                        <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500 flex items-center gap-2 border-b border-slate-800 pb-2">
                                            Personal Details
                                        </h3>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <label className="text-xs font-bold text-slate-400">Display Name</label>
                                                <input
                                                    type="text"
                                                    value={name}
                                                    onChange={(e) => setName(e.target.value)}
                                                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:border-pink-500 outline-none transition-colors"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-xs font-bold text-slate-400">Email</label>
                                                <input
                                                    type="text"
                                                    value={maskEmail(user?.email)}
                                                    disabled
                                                    className="w-full bg-slate-950/50 border border-slate-800 rounded-xl px-4 py-3 text-slate-500 cursor-not-allowed"
                                                />
                                            </div>
                                        </div>
                                        <div className="flex justify-end">
                                            <button
                                                onClick={handleUpdateProfile}
                                                disabled={updating}
                                                className="px-6 py-2 bg-pink-600 hover:bg-pink-700 text-white rounded-xl font-bold transition-colors disabled:opacity-50"
                                            >
                                                Save Changes
                                            </button>
                                        </div>
                                    </section>

                                    {/* 2. Membership Status */}
                                    <section className="space-y-4">
                                        <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500 flex items-center gap-2 border-b border-slate-800 pb-2">
                                            Membership Status
                                        </h3>
                                        <div className="bg-gradient-to-br from-slate-900 to-slate-800 border border-slate-700 rounded-2xl p-6 flex flex-col md:flex-row items-center justify-between gap-6">
                                            <div className="flex items-center gap-4">
                                                <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white text-xl shadow-lg ${isPremium ? 'bg-amber-500' : 'bg-slate-600'}`}>
                                                    {isPremium ? <Crown /> : <User />}
                                                </div>
                                                <div>
                                                    <div className="text-lg font-bold text-white">{isPremium ? 'Premium Plan' : 'Free Plan'}</div>
                                                    <div className="text-sm text-slate-400">{isPremium ? 'You have access to all premium features.' : 'Upgrade to unlock distinct sounds and features.'}</div>
                                                </div>
                                            </div>
                                            {!isPremium && (
                                                <button className="px-6 py-3 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl shadow-lg shadow-amber-900/20 transition-transform hover:scale-105">
                                                    Upgrade to Pro
                                                </button>
                                            )}
                                            {isPremium && (
                                                <button className="px-4 py-2 border border-slate-600 text-slate-300 hover:text-white hover:bg-slate-700 rounded-lg text-sm font-bold">
                                                    Manage Subscription
                                                </button>
                                            )}
                                        </div>
                                    </section>

                                    {/* 3. Connected Accounts */}
                                    <section className="space-y-4">
                                        <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500 flex items-center gap-2 border-b border-slate-800 pb-2">
                                            Connected Accounts
                                        </h3>
                                        <div className="bg-slate-950 rounded-2xl p-4 border border-slate-800 space-y-3">
                                            {socialAccounts.map(account => (
                                                <div key={account.id} className="flex items-center justify-between p-3 bg-slate-900 rounded-xl border border-slate-800">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center font-bold text-slate-400 capitalize text-xs">
                                                            {account.platform[0]}
                                                        </div>
                                                        <div className="font-bold text-white text-sm capitalize">{account.platform}</div>
                                                        <div className="text-xs text-slate-500">{account.username}</div>
                                                    </div>
                                                    <button onClick={() => removeAccount(account.id)} className="text-red-400 text-[10px] font-bold hover:text-red-300 uppercase">Disconnect</button>
                                                </div>
                                            ))}
                                            {socialAccounts.length === 0 && <p className="text-slate-500 text-sm italic px-2">No social accounts connected.</p>}

                                            <div className="pt-2 flex flex-wrap gap-2">
                                                {['google', 'spotify', 'twitch', 'discord'].map(provider => (
                                                    <button
                                                        key={provider}
                                                        onClick={() => handleConnectAccount(provider)}
                                                        className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-lg border border-slate-700 capitalize transition-colors flex items-center gap-2"
                                                    >
                                                        <Plus size={12} /> Connect {provider}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    </section>

                                    {/* 4. Security */}
                                    <section className="space-y-4">
                                        <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500 flex items-center gap-2 border-b border-slate-800 pb-2">
                                            Security Settings
                                        </h3>

                                        {/* 2FA */}
                                        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 flex items-center justify-between">
                                            <div>
                                                <h4 className="font-bold text-white text-sm">Two-Factor Authentication</h4>
                                                <p className="text-slate-400 text-xs mt-1">Add an extra layer of security to your account.</p>
                                            </div>
                                            {is2FAEnabled ? (
                                                <div className="flex items-center gap-4">
                                                    <span className="text-emerald-400 text-xs font-bold bg-emerald-500/10 px-2 py-1 rounded uppercase border border-emerald-500/20">Enabled</span>
                                                    <button onClick={disable2FA} className="text-slate-500 hover:text-white text-xs underline">Disable</button>
                                                </div>
                                            ) : (
                                                <button onClick={generateSecret} className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-lg text-xs border border-slate-700">Setup 2FA</button>
                                            )}
                                        </div>

                                        {/* Password Reset */}
                                        <div className="p-4 md:p-6 bg-slate-950 border border-slate-800 rounded-2xl space-y-4">
                                            <div className="font-bold text-white text-sm">Update Password</div>
                                            <div className="space-y-3">
                                                <input
                                                    type="password"
                                                    placeholder="Current Password"
                                                    value={currentPassword}
                                                    onChange={e => setCurrentPassword(e.target.value)}
                                                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder:text-slate-500 focus:border-pink-500 outline-none transition-colors text-sm"
                                                />
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                                                    <input
                                                        type="password"
                                                        placeholder="New Password"
                                                        value={newPassword}
                                                        onChange={e => setNewPassword(e.target.value)}
                                                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder:text-slate-500 focus:border-pink-500 outline-none transition-colors text-sm"
                                                    />
                                                    <input
                                                        type="password"
                                                        placeholder="Confirm Password"
                                                        value={confirmPassword}
                                                        onChange={e => setConfirmPassword(e.target.value)}
                                                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder:text-slate-500 focus:border-pink-500 outline-none transition-colors text-sm"
                                                    />
                                                </div>
                                            </div>
                                            <button
                                                onClick={handlePasswordReset}
                                                disabled={isResettingPassword || !newPassword || !currentPassword}
                                                className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-bold transition-colors flex items-center justify-center gap-2 disabled:opacity-50 mt-2 text-sm"
                                            >
                                                {isResettingPassword ? <Loader size={16} className="animate-spin" /> : <Lock size={16} />}
                                                Update Password
                                            </button>
                                        </div>
                                    </section>

                                    {/* 5. Danger Zone (Compliant Account Deletion) */}
                                    <section className="space-y-4 pt-4">
                                        <h3 className="text-xs font-bold uppercase tracking-widest text-red-500/50 flex items-center gap-2 border-b border-red-900/20 pb-2">
                                            Danger Zone
                                        </h3>
                                        <div className="p-6 bg-red-950/20 border border-red-900/20 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-4">
                                            <div>
                                                <h4 className="font-bold text-white text-sm">Delete Account</h4>
                                                <p className="text-slate-500 text-xs mt-1">Permanently remove your account and all associated data. This cannot be undone.</p>
                                            </div>
                                            <button
                                                onClick={() => { setShowDeleteConfirm(true); setDeleteStep(1); }}
                                                className="px-6 py-3 bg-red-900/20 hover:bg-red-600 text-red-400 hover:text-white border border-red-900/30 rounded-xl font-bold transition-all flex items-center gap-2 text-sm"
                                            >
                                                <Trash2 size={16} />
                                                Delete My Account
                                            </button>
                                        </div>
                                    </section>
                                </div>
                            )}

                            {/* DELETE CONFIRMATION MODAL OVERLAY */}
                            {showDeleteConfirm && (
                                <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md animate-in fade-in">
                                    <div className="w-full max-w-md bg-slate-900 border border-red-900/30 rounded-3xl p-8 shadow-2xl space-y-6">
                                        <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center text-red-500 mx-auto">
                                            <AlertTriangle size={32} />
                                        </div>

                                        <div className="text-center space-y-2">
                                            <h2 className="text-2xl font-black text-white">
                                                {deleteStep === 1 ? 'Are you absolutely sure?' : 'Final Confirmation'}
                                            </h2>
                                            <p className="text-slate-400 text-sm">
                                                {deleteStep === 1
                                                    ? 'This will permanently delete your profile, social links, and all saved sanctuary data.'
                                                    : 'Type "DELETE" below to confirm permanent account destruction.'}
                                            </p>
                                        </div>

                                        {deleteStep === 2 && (
                                            <input
                                                type="text"
                                                placeholder="Type DELETE here"
                                                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-4 text-center font-black tracking-widest text-white focus:border-red-500 outline-none transition-all"
                                                onChange={(e) => {
                                                    if (e.target.value === 'DELETE') {
                                                        // Auto-trigger? No, keep it intentional
                                                    }
                                                }}
                                                id="delete-confirm-input"
                                            />
                                        )}

                                        <div className="flex flex-col gap-3">
                                            {deleteStep === 1 ? (
                                                <button
                                                    onClick={() => setDeleteStep(2)}
                                                    className="w-full py-4 bg-red-600 hover:bg-red-700 text-white font-black rounded-2xl shadow-lg shadow-red-900/20 transition-all active:scale-95"
                                                >
                                                    I Understand, Continue
                                                </button>
                                            ) : (
                                                <button
                                                    onClick={() => {
                                                        const el = document.getElementById('delete-confirm-input') as HTMLInputElement;
                                                        if (el?.value === 'DELETE') {
                                                            handleDeleteAccount();
                                                        } else {
                                                            showNotification('error', 'Please type DELETE exactly to confirm.');
                                                        }
                                                    }}
                                                    disabled={isDeleting}
                                                    className="w-full py-4 bg-red-600 hover:bg-red-700 text-white font-black rounded-2xl shadow-lg shadow-red-900/20 transition-all active:scale-95 flex items-center justify-center gap-2"
                                                >
                                                    {isDeleting ? <Loader className="animate-spin" /> : <Trash2 size={18} />}
                                                    Permanently Delete My Account
                                                </button>
                                            )}

                                            <button
                                                onClick={() => setShowDeleteConfirm(false)}
                                                disabled={isDeleting}
                                                className="w-full py-4 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-2xl transition-all"
                                            >
                                                Cancel
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* SUPPORT TAB */}
                            {activeTab === 'support' && (
                                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 h-full flex flex-col pb-20">
                                    {/* Support sub-tab switcher */}
                                    <div className="flex gap-1 p-1 bg-slate-900 rounded-xl border border-slate-800 shrink-0">
                                        <button
                                            onClick={() => setSupportView('help')}
                                            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${supportView === 'help' ? 'bg-pink-600 text-white shadow-lg shadow-pink-900/30' : 'text-slate-400 hover:text-white'}`}
                                        >
                                            Help Center
                                        </button>
                                        <button
                                            onClick={() => { setSupportView('tickets'); setSelectedTicket(null); }}
                                            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${supportView === 'tickets' ? 'bg-pink-600 text-white shadow-lg shadow-pink-900/30' : 'text-slate-400 hover:text-white'}`}
                                        >
                                            My Tickets
                                            {tickets.length > 0 && (
                                                <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-full ${supportView === 'tickets' ? 'bg-white/20' : 'bg-slate-700'}`}>
                                                    {tickets.length}
                                                </span>
                                            )}
                                        </button>
                                    </div>

                                    {supportView === 'help' ? (
                                        <HelpCenter onContactSupport={() => setSupportView('tickets')} />
                                    ) : (
                                        <>
                                            <button
                                                onClick={() => setSupportView('help')}
                                                className="self-start flex items-center gap-2 text-slate-400 hover:text-white text-sm font-bold transition-colors mb-2"
                                            >
                                                <ChevronRight size={16} className="rotate-180" /> Back to Help Center
                                            </button>

                                            {!selectedTicket ? (
                                                <>
                                                    {/* New Ticket */}
                                                    <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 space-y-4">
                                                        <h3 className="font-bold text-white flex items-center gap-2">
                                                            <Plus size={18} className="text-pink-500" /> Create New Ticket
                                                        </h3>
                                                        <input
                                                            className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-white outline-none focus:border-pink-500 text-sm"
                                                            placeholder="Subject"
                                                            value={newTicketSubject}
                                                            onChange={e => setNewTicketSubject(e.target.value)}
                                                        />
                                                        <textarea
                                                            className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-white outline-none focus:border-pink-500 text-sm h-24 resize-none"
                                                            placeholder="Describe your issue..."
                                                            value={newTicketMessage}
                                                            onChange={e => setNewTicketMessage(e.target.value)}
                                                        />
                                                        <div className="flex justify-between items-center mt-2">
                                                            <div className="flex gap-2">
                                                                <input
                                                                    type="file"
                                                                    multiple
                                                                    accept="image/*"
                                                                    className="hidden"
                                                                    ref={fileInputRef}
                                                                    onChange={handleFileSelect}
                                                                />
                                                                <button
                                                                    onClick={() => fileInputRef.current?.click()}
                                                                    className="text-slate-400 hover:text-white transition-colors p-2 hover:bg-slate-800 rounded-lg flex items-center gap-2 text-xs font-bold"
                                                                >
                                                                    <Paperclip size={16} /> Attach Image
                                                                </button>
                                                            </div>
                                                            <button
                                                                onClick={handleCreateTicket}
                                                                disabled={isCreatingTicket || !newTicketSubject || !newTicketMessage}
                                                                className="px-6 py-2 bg-pink-600 hover:bg-pink-700 text-white font-bold rounded-xl text-sm transition-colors disabled:opacity-50"
                                                            >
                                                                {isCreatingTicket ? <Loader className="animate-spin" size={16} /> : 'Submit Ticket'}
                                                            </button>
                                                        </div>

                                                        {/* File Previews */}
                                                        {files.length > 0 && (
                                                            <div className="flex flex-wrap gap-2 pt-2">
                                                                {files.map((file, i) => (
                                                                    <div key={i} className="relative group">
                                                                        <div className="w-16 h-16 rounded-lg overflow-hidden border border-slate-700 bg-slate-900">
                                                                            <img src={URL.createObjectURL(file)} alt="preview" className="w-full h-full object-cover opacity-70 group-hover:opacity-100 transition-opacity" />
                                                                        </div>
                                                                        <button
                                                                            onClick={() => removeFile(i)}
                                                                            className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                                                                        >
                                                                            <X size={10} />
                                                                        </button>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </div>

                                                    {/* Ticket List — open first, then closed */}
                                                    <div className="space-y-3 flex-1 overflow-y-auto pr-2">
                                                        {/* Open / In-Progress Tickets */}
                                                        {tickets.filter(t => t.status === 'open' || t.status === 'in_progress').length > 0 && (
                                                            <>
                                                                <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500 pb-1">Active Tickets</h3>
                                                                {tickets.filter(t => t.status === 'open' || t.status === 'in_progress').map(ticket => (
                                                                    <div
                                                                        key={ticket.id}
                                                                        onClick={() => setSelectedTicket(ticket)}
                                                                        className="p-4 bg-slate-950 border border-slate-800 rounded-xl hover:border-slate-600 cursor-pointer transition-colors group"
                                                                    >
                                                                        <div className="flex justify-between items-start mb-1">
                                                                            <h4 className="font-bold text-white group-hover:text-pink-400 transition-colors">{ticket.subject}</h4>
                                                                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${ticket.status === 'open' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'}`}>
                                                                                {ticket.status.replace('_', ' ')}
                                                                            </span>
                                                                        </div>
                                                                        <div className="flex justify-between items-center text-xs text-slate-500">
                                                                            <span>{new Date(ticket.created_at).toLocaleDateString()}</span>
                                                                            <ChevronRight size={14} />
                                                                        </div>
                                                                    </div>
                                                                ))}
                                                            </>
                                                        )}

                                                        {/* Resolved / Closed Tickets */}
                                                        {tickets.filter(t => t.status === 'resolved' || t.status === 'closed').length > 0 && (
                                                            <>
                                                                <h3 className="text-xs font-bold uppercase tracking-widest text-slate-600 pb-1 mt-4">Closed Tickets</h3>
                                                                {tickets.filter(t => t.status === 'resolved' || t.status === 'closed').map(ticket => (
                                                                    <div
                                                                        key={ticket.id}
                                                                        onClick={() => setSelectedTicket(ticket)}
                                                                        className="p-4 bg-slate-950/50 border border-slate-800/50 rounded-xl hover:border-slate-700 cursor-pointer transition-colors group opacity-60 hover:opacity-100"
                                                                    >
                                                                        <div className="flex justify-between items-start mb-1">
                                                                            <h4 className="font-bold text-slate-400 group-hover:text-white transition-colors line-through decoration-slate-600">{ticket.subject}</h4>
                                                                            <div className="flex items-center gap-2">
                                                                                {(ticket as any).csat_score && (
                                                                                    <span className="text-amber-400 text-[10px] font-bold">{'★'.repeat((ticket as any).csat_score)}</span>
                                                                                )}
                                                                                <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-slate-800 text-slate-500">{ticket.status}</span>
                                                                            </div>
                                                                        </div>
                                                                        <div className="flex justify-between items-center text-xs text-slate-600">
                                                                            <span>{new Date(ticket.created_at).toLocaleDateString()}</span>
                                                                            <ChevronRight size={14} />
                                                                        </div>
                                                                    </div>
                                                                ))}
                                                            </>
                                                        )}

                                                        {tickets.length === 0 && (
                                                            <p className="text-slate-500 text-sm italic text-center py-8">No support tickets found.</p>
                                                        )}
                                                    </div>
                                                </>
                                            ) : (
                                                <div className="flex-1 flex flex-col h-full">
                                                    <button onClick={() => setSelectedTicket(null)} className="flex items-center gap-2 text-slate-400 hover:text-white text-sm font-bold mb-4">
                                                        <ChevronRight size={16} className="rotate-180" /> Back to Tickets
                                                    </button>

                                                    <div className="bg-slate-950 border border-slate-800 rounded-2xl flex-1 flex flex-col overflow-hidden">
                                                        <div className="p-4 border-b border-slate-800 bg-slate-900/50">
                                                            <h3 className="font-bold text-white">{selectedTicket.subject}</h3>
                                                            <div className="text-xs text-slate-500 mt-1">Ticket ID: {selectedTicket.id.slice(0, 8)}</div>
                                                        </div>

                                                        <div className="flex-1 overflow-y-auto p-4 space-y-4">
                                                            {(ticketMessages[selectedTicket.id] || []).map(msg => (
                                                                <div key={msg.id} className={`flex ${msg.is_staff_reply ? 'justify-start' : 'justify-end'}`}>
                                                                    <div className={`max-w-[80%] p-3 rounded-xl text-sm ${msg.is_staff_reply ? 'bg-slate-800 text-slate-300 rounded-tl-none' : 'bg-pink-600 text-white rounded-tr-none'
                                                                        }`}>
                                                                        {msg.message}
                                                                    </div>
                                                                </div>
                                                            ))}

                                                            {/* CSAT Prompt for resolved/closed tickets */}
                                                            {(selectedTicket.status === 'resolved' || selectedTicket.status === 'closed') &&
                                                                !(selectedTicket as any).csat_score &&
                                                                !dismissedCSAT.has(selectedTicket.id) && (
                                                                    <CSATPrompt
                                                                        ticketId={selectedTicket.id}
                                                                        ticketSubject={selectedTicket.subject}
                                                                        onDismiss={() => setDismissedCSAT(prev => new Set(prev).add(selectedTicket.id))}
                                                                    />
                                                                )}
                                                        </div>

                                                        <div className="p-4 bg-slate-900 border-t border-slate-800 flex gap-2">
                                                            {selectedTicket.status === 'closed' || selectedTicket.status === 'resolved' ? (
                                                                <p className="flex-1 text-center text-xs text-slate-500 italic py-1">This ticket is closed. Open a new ticket if you need further help.</p>
                                                            ) : (
                                                                <>
                                                                    <input
                                                                        className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-white outline-none focus:border-pink-500 text-sm"
                                                                        placeholder="Type a reply..."
                                                                        value={replyMessage}
                                                                        onChange={e => setReplyMessage(e.target.value)}
                                                                        onKeyDown={e => e.key === 'Enter' && handleSendReply()}
                                                                    />
                                                                    <button
                                                                        onClick={handleSendReply}
                                                                        className="p-2 bg-pink-600 hover:bg-pink-700 text-white rounded-xl transition-colors"
                                                                    >
                                                                        <Send size={18} />
                                                                    </button>
                                                                </>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </>
                                    )}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Contextual Help — changes suggestions based on active tab */}
            <ContextualHelp
                context={
                    activeTab === 'account' ? 'account'
                        : activeTab === 'support' ? 'general'
                            : 'features'
                }
                position="bottom-right"
                isNightMode={true}
                onContactSupport={() => {
                    setSupportView('tickets');
                    setActiveTab('support');
                }}
                onOpenHelpCenter={() => {
                    setSupportView('help');
                    setActiveTab('support');
                }}
            />
        </div>
    );
};
