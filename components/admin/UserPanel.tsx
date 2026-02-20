import React, { useState, useEffect } from 'react';
import { Users, Shield, UserCheck, Trash2, Search, Loader, ShieldAlert, Plus, X, Lock, AlertTriangle, FileText, CheckSquare, Square, RotateCcw, Ban, Key, CreditCard, Activity, MoreVertical, LogOut, Clock } from 'lucide-react';
import { supabase } from '../../src/supabaseClient';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Database } from '../../src/db_types';
import { getCurrentProfile } from '../../src/utils/authManager';

import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { useNotification } from '../../src/contexts/NotificationContext';

type Profile = Database['public']['Tables']['profiles']['Row'];

const UserPanel: React.FC = () => {
    const { showNotification } = useNotification();
    const [users, setUsers] = useState<Profile[]>([]);
    const [loading, setLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const [filter, setFilter] = useState<'all' | 'admin' | 'support' | 'user' | 'deleted'>('all');
    const [search, setSearch] = useState('');

    // Permissions
    const [permissions, setPermissions] = useState<Set<string>>(new Set());
    const [currentUserRole, setCurrentUserRole] = useState<string>('');

    // Bulk Actions
    const [selectedUserIds, setSelectedUserIds] = useState<Set<string>>(new Set());
    const [isBulkActionProcessing, setIsBulkActionProcessing] = useState(false);

    // Advanced Mgmt State
    const [viewLogsUser, setViewLogsUser] = useState<Profile | null>(null);
    const [userLogs, setUserLogs] = useState<any[]>([]);
    const [isLogsLoading, setIsLogsLoading] = useState(false);

    const [isTierModalOpen, setIsTierModalOpen] = useState(false);
    const [tierUser, setTierUser] = useState<Profile | null>(null);
    const [newTier, setNewTier] = useState('');

    const [activeActionId, setActiveActionId] = useState<string | null>(null); // For dropdown

    // Confirm Dialog State
    const [confirmDialog, setConfirmDialog] = useState<{
        isOpen: boolean;
        title: string;
        message: string;
        isDestructive?: boolean;
        onConfirm: () => void;
    }>({
        isOpen: false,
        title: '',
        message: '',
        onConfirm: () => { }
    });

    const closeConfirm = () => setConfirmDialog(prev => ({ ...prev, isOpen: false }));

    // Modals
    const [isAddUserOpen, setIsAddUserOpen] = useState(false);
    const [newUserEmail, setNewUserEmail] = useState('');
    const [newUserPassword, setNewUserPassword] = useState('');
    const [newUserRole, setNewUserRole] = useState<'user' | 'support' | 'admin'>('user');
    const [isAddingUser, setIsAddingUser] = useState(false);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        setErrorMsg(null);
        try {
            // 1. Get Current User & Permissions
            const profile = await getCurrentProfile();
            if (profile) {
                setCurrentUserRole(profile.role);
                // Fetch permissions for this role
                // Note: The role_permissions table might not have an RLS policy that lets us read if we are not admin, 
                // but usually public read is fine for permissions or we rely on the profile role constant map in frontend.
                // However, following the plan, we fetch from DB.
                const { data: permData } = await supabase
                    .from('role_permissions')
                    .select('permission_code')
                    .eq('role', profile.role);

                if (permData) {
                    const codes = (permData as any[]).map(p => p.permission_code as string);
                    setPermissions(new Set(codes));
                }
            }

            // 2. Load All Users (including deleted)
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            setUsers(data || []);
        } catch (error: any) {
            console.error('Error loading data:', error);
            setErrorMsg(error.message || 'Failed to load data');
        } finally {
            setLoading(false);
        }
    };

    const hasPermission = (code: string) => permissions.has(code) || currentUserRole === 'admin'; // Admin override as fallback

    const logAction = async (action: string, resource: string, details: any) => {
        try {
            await supabase.from('audit_logs').insert({
                action,
                resource,
                details,
                user_id: ((await supabase.auth.getUser()).data.user?.id) || null
            } as Database['public']['Tables']['audit_logs']['Insert']);
        } catch (e) {
            console.error("Failed to log action:", e);
        }
    };

    const getAdminClient = async (): Promise<SupabaseClient> => {
        const { data: setting } = await supabase
            .from('system_settings')
            .select('value')
            .eq('key', 'supabase_service_role_key')
            .single();

        const serviceKey = (setting as any)?.value;
        if (!serviceKey) throw new Error("Missing 'supabase_service_role_key'");

        return createClient<Database>(import.meta.env.VITE_SUPABASE_URL, serviceKey, {
            auth: { autoRefreshToken: false, persistSession: false }
        });
    };

    const handlePasswordReset = (email: string) => {
        setConfirmDialog({
            isOpen: true,
            title: 'Reset Password',
            message: `Send password reset email to ${email}?`,
            onConfirm: async () => {
                try {
                    const { error } = await supabase.auth.resetPasswordForEmail(email);
                    if (error) throw error;
                    await logAction('RESET_PASSWORD_EMAIL', 'user', { email });
                    showNotification('success', `Reset email sent to ${email}`);
                    closeConfirm();
                } catch (e: any) {
                    showNotification('error', 'Error: ' + e.message);
                    closeConfirm();
                }
            }
        });
    };

    const handleForceLogout = (userId: string) => {
        setConfirmDialog({
            isOpen: true,
            title: 'Force Logout',
            message: 'Force logout this user? They will be signed out of all devices.',
            isDestructive: true,
            onConfirm: async () => {
                try {
                    const admin = await getAdminClient();
                    const { error } = await admin.auth.admin.signOut(userId);
                    if (error) throw error;
                    await logAction('FORCE_LOGOUT', 'user', { userId });
                    showNotification('success', 'User signed out.');
                    closeConfirm();
                } catch (e: any) {
                    showNotification('error', 'Failed: ' + e.message);
                    closeConfirm();
                }
            }
        });
    };

    const handleViewLogs = async (user: Profile) => {
        setViewLogsUser(user);
        setIsLogsLoading(true);
        setActiveActionId(null); // Close dropdown
        try {
            // Fetch logs for this user, assume we can filter by details->user_id or if we added user_id column to logs
            // I added user_id column to audit_logs in db_types, so use that.
            const { data, error } = await supabase
                .from('audit_logs')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false })
                .limit(50);

            if (error) throw error;
            setUserLogs(data || []);
        } catch (e) {
            console.error(e);
            setUserLogs([]);
        } finally {
            setIsLogsLoading(false);
        }
    };

    const openTierModal = (user: Profile) => {
        setTierUser(user);
        setNewTier(user.subscription_tier || 'free');
        setIsTierModalOpen(true);
        setActiveActionId(null);
    };

    const updateTier = async () => {
        if (!tierUser) return;
        try {
            const { error } = await supabase
                .from('profiles')
                .update({ subscription_tier: newTier } as Database['public']['Tables']['profiles']['Update'])
                .eq('id', tierUser.id);

            if (error) throw error;

            await logAction('UPDATE_TIER', 'user', { userId: tierUser.id, old: tierUser.subscription_tier, new: newTier });
            setUsers(prev => prev.map(u => u.id === tierUser.id ? { ...u, subscription_tier: newTier } : u));
            setIsTierModalOpen(false);
            showNotification('success', 'Subscription updated.');
        } catch (e: any) {
            showNotification('error', 'Failed: ' + e.message);
        }
    };

    const toggleSelectUser = (id: string) => {
        const newSelected = new Set(selectedUserIds);
        if (newSelected.has(id)) newSelected.delete(id);
        else newSelected.add(id);
        setSelectedUserIds(newSelected);
    };

    const toggleSelectAll = () => {
        if (selectedUserIds.size === filteredUsers.length) setSelectedUserIds(new Set());
        else setSelectedUserIds(new Set(filteredUsers.map(u => u.id)));
    };

    const handleAddUser = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsAddingUser(true);
        try {
            // 1. Fetch Service Key
            const { data: setting } = await supabase
                .from('system_settings')
                .select('value')
                .eq('key', 'supabase_service_role_key')
                .single();

            const serviceKey = (setting as any)?.value;
            if (!serviceKey) throw new Error("Missing 'supabase_service_role_key'. Please go to System Settings and configure it.");

            // 2. Initialize Admin Client
            const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
            const adminClient = createClient<Database>(supabaseUrl, serviceKey, {
                auth: {
                    autoRefreshToken: false,
                    persistSession: false
                }
            });

            let authUserId = '';
            let isNewUser = false;

            // 3. Create or Find User in Auth
            try {
                if (newUserPassword && newUserPassword.length >= 6) {
                    const { data, error } = await adminClient.auth.admin.createUser({
                        email: newUserEmail,
                        password: newUserPassword,
                        email_confirm: true
                    });
                    if (error) throw error;
                    authUserId = data.user.id;
                    isNewUser = true;
                } else {
                    const { data, error } = await adminClient.auth.admin.inviteUserByEmail(newUserEmail);
                    if (error) throw error;
                    authUserId = data.user.id;
                    isNewUser = true;
                }
            } catch (authError: any) {
                // If user already exists, try to find them to link profile
                if (authError.message?.includes('already been created') || authError.status === 422) {
                    console.log("User exists, trying to find ID...");
                    const { data: listData, error: listError } = await adminClient.auth.admin.listUsers();
                    if (listError) throw listError;

                    const existingUser = (listData.users as any[]).find(u => u.email?.toLowerCase() === newUserEmail.toLowerCase());
                    if (existingUser) {
                        authUserId = existingUser.id;
                        isNewUser = false; // It's an existing user, so don't rollback if profile fails
                        isNewUser = false; // It's an existing user, so don't rollback if profile fails
                        showNotification('info', "User already exists in Auth. Updating/Creating profile...");
                    } else {
                        throw new Error("User exists but could not be found in list. Please check Supabase dashboard.");
                    }
                } else {
                    throw authError;
                }
            }

            // 4. Upsert Profile (Using Admin Client to bypass RLS definitely)
            // We use the admin client's rest interface which also has admin privileges
            const { error: profileError } = await adminClient
                .from('profiles')
                .upsert({
                    id: authUserId,
                    email: newUserEmail,
                    role: newUserRole,
                    updated_at: new Date().toISOString()
                } as Database['public']['Tables']['profiles']['Insert'], { onConflict: 'id' });

            if (profileError) {
                // ROLLBACK: If we just created the user but profile failed, delete the user to clean up
                if (isNewUser) {
                    console.error("Profile creation failed. Rolling back Auth User...");
                    await adminClient.auth.admin.deleteUser(authUserId);
                }
                throw new Error('Profile Creation Failed: ' + profileError.message);
            }

            await logAction('CREATE_USER', 'user', { email: newUserEmail, role: newUserRole, auth_id: authUserId, is_new: isNewUser });

            setUsers(prev => {
                // Remove existing if present (to avoid dupe in list)
                const filtered = prev.filter(u => u.id !== authUserId);
                return [{ id: authUserId, email: newUserEmail, role: newUserRole, created_at: new Date().toISOString(), deleted_at: null }, ...filtered];
            });

            setIsAddUserOpen(false);
            setNewUserEmail('');
            setNewUserPassword('');
            setNewUserRole('user');
            showNotification('success', isNewUser ? "User created successfully!" : "User profile updated successfully!");

        } catch (error: any) {
            console.error(error);
            showNotification('error', 'Failed: ' + (error.message || error.error_description || 'Unknown Error'));
        } finally {
            setIsAddingUser(false);
        }
    };

    const updateUserRole = (userId: string, newRole: 'admin' | 'support' | 'user') => {
        if (!hasPermission('USER_UPDATE')) return showNotification('error', "Permission Denied");

        setConfirmDialog({
            isOpen: true,
            title: 'Change Role',
            message: `Are you sure you want to change this user's role to ${newRole}?`,
            onConfirm: async () => {
                try {
                    const { error } = await supabase.from('profiles').update({ role: newRole } as Database['public']['Tables']['profiles']['Update']).eq('id', userId);
                    if (error) throw error;

                    await logAction('UPDATE_ROLE', 'user', { userId, newRole });
                    setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: newRole } : u));
                    showNotification('success', 'Role updated successfully.');
                    closeConfirm();
                } catch (error) {
                    showNotification('error', 'Failed to update role.');
                    closeConfirm();
                }
            }
        });
    };

    const softDeleteUser = (userId: string) => {
        if (!hasPermission('USER_DELETE')) return showNotification('error', "Permission Denied");

        setConfirmDialog({
            isOpen: true,
            title: 'Move to Bin',
            message: 'Are you sure you want to move this user to the Bin? They will lose access immediately.',
            isDestructive: true,
            onConfirm: async () => {
                try {
                    const { error } = await supabase
                        .from('profiles')
                        .update({ deleted_at: new Date().toISOString() } as Database['public']['Tables']['profiles']['Update'])
                        .eq('id', userId);

                    if (error) throw error;

                    await logAction('SOFT_DELETE_USER', 'user', { userId });
                    setUsers(prev => prev.map(u => u.id === userId ? { ...u, deleted_at: new Date().toISOString() } : u));
                    showNotification('success', 'User moved to Bin.');
                    closeConfirm();
                } catch (error) {
                    showNotification('error', 'Failed to delete user.');
                    closeConfirm();
                }
            }
        });
    };

    const restoreUser = (userId: string) => {
        if (!hasPermission('USER_RESTORE')) return showNotification('error', "Permission Denied");

        setConfirmDialog({
            isOpen: true,
            title: 'Restore User',
            message: 'Restore this user from the Bin? They will regain access.',
            onConfirm: async () => {
                try {
                    const { error } = await supabase
                        .from('profiles')
                        .update({ deleted_at: null } as Database['public']['Tables']['profiles']['Update'])
                        .eq('id', userId);

                    if (error) throw error;

                    await logAction('RESTORE_USER', 'user', { userId });
                    setUsers(prev => prev.map(u => u.id === userId ? { ...u, deleted_at: null } : u));
                    showNotification('success', 'User restored.');
                    closeConfirm();
                } catch (error) {
                    showNotification('error', 'Failed to restore user.');
                    closeConfirm();
                }
            }
        });
    };

    const permanentDeleteUser = (userId: string) => {
        if (!hasPermission('USER_PERMANENT_DELETE')) return showNotification('error', "Permission Denied: Only Admins can permanently delete.");

        setConfirmDialog({
            isOpen: true,
            title: 'Permanent Delete',
            message: 'WARNING: This will permanently delete the user and is irreversible. Are you absolutely sure?',
            isDestructive: true,
            onConfirm: async () => {
                try {
                    const { error } = await supabase.from('profiles').delete().eq('id', userId);
                    if (error) throw error;

                    await logAction('PERMANENT_DELETE_USER', 'user', { userId });
                    setUsers(prev => prev.filter(u => u.id !== userId));
                    showNotification('success', 'User permanently deleted.');
                    closeConfirm();
                } catch (error) {
                    showNotification('error', 'Failed to permanently delete.');
                    closeConfirm();
                }
            }
        });
    };

    const handleBulkDelete = () => {
        if (selectedUserIds.size === 0) return;
        if (!hasPermission('USER_DELETE')) return showNotification('error', "Permission Denied");

        const executeDelete = async () => {
            setIsBulkActionProcessing(true);
            try {
                const idsToDelete = Array.from(selectedUserIds) as string[];
                const { error } = await supabase
                    .from('profiles')
                    .update({ deleted_at: new Date().toISOString() } as Database['public']['Tables']['profiles']['Update'])
                    .in('id', idsToDelete);

                if (error) throw error;

                await logAction('BULK_SOFT_DELETE', 'users', { count: idsToDelete.length, ids: idsToDelete });
                setUsers(prev => prev.map(u => selectedUserIds.has(u.id) ? { ...u, deleted_at: new Date().toISOString() } : u));
                setSelectedUserIds(new Set());
                showNotification('success', `Moved ${idsToDelete.length} users to Bin.`);
                closeConfirm();
            } catch (error: any) {
                showNotification('error', 'Bulk action failed: ' + error.message);
                closeConfirm();
            } finally {
                setIsBulkActionProcessing(false);
            }
        };

        // Safety Circuit Breaker
        if (selectedUserIds.size > 1) {
            const confirmCode = Math.floor(1000 + Math.random() * 9000);
            const input = prompt(`SUPER ADMIN SAFETY LOCK:\n\nSoft Deleting ${selectedUserIds.size} users.\nTo confirm, type: ${confirmCode}`);
            if (input !== String(confirmCode)) {
                showNotification('warning', "Incorrect code. Bulk action cancelled.");
                return;
            }
            // Code matched, proceed to execute directly or show final confirm? 
            // The prompt acts as confirm.
            executeDelete();
        } else {
            setConfirmDialog({
                isOpen: true,
                title: 'Bulk Action',
                message: `Soft delete ${selectedUserIds.size} user?`,
                isDestructive: true,
                onConfirm: executeDelete
            });
        }
    };

    // Filter Logic
    const filteredUsers = users.filter(user => {
        const isDeleted = !!user.deleted_at;

        // Tab Filtering
        if (filter === 'deleted') {
            if (!isDeleted) return false; // Show ONLY deleted
        } else {
            if (isDeleted) return false; // Hide deleted in other tabs
            if (filter !== 'all' && user.role !== filter) return false; // Role filtering
        }

        // Search Filtering
        const matchesSearch = (user.email || '').toLowerCase().includes(search.toLowerCase()) || user.id.includes(search);
        return matchesSearch;
    });

    const staffUsers = users.filter(u => !u.deleted_at && (u.role === 'admin' || u.role === 'support'));
    const deletedCount = users.filter(u => u.deleted_at).length;

    return (
        <div className="space-y-8 text-slate-200">
            {/* Header / Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 shadow-sm relative overflow-hidden">
                    <div className="absolute right-0 top-0 p-4 opacity-10"><Users size={64} /></div>
                    <h3 className="text-slate-400 text-sm font-bold uppercase">Active Users</h3>
                    <p className="text-3xl font-bold text-white mt-2">{users.filter(u => !u.deleted_at).length}</p>
                </div>
                <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 shadow-sm relative overflow-hidden">
                    <div className="absolute right-0 top-0 p-4 opacity-10"><Shield size={64} /></div>
                    <h3 className="text-slate-400 text-sm font-bold uppercase">Staff</h3>
                    <p className="text-3xl font-bold text-pink-500 mt-2">{staffUsers.length}</p>
                </div>
                <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 shadow-sm relative overflow-hidden">
                    <div className="absolute right-0 top-0 p-4 opacity-10"><Trash2 size={64} /></div>
                    <h3 className="text-slate-400 text-sm font-bold uppercase">Deleted (Bin)</h3>
                    <p className="text-3xl font-bold text-red-400 mt-2">{deletedCount}</p>
                </div>
                <button
                    onClick={() => setIsAddUserOpen(true)}
                    className="bg-pink-600 hover:bg-pink-700 p-6 rounded-xl border border-pink-500 shadow-lg relative overflow-hidden flex flex-col items-center justify-center transition-all active:scale-95 group">
                    <Plus size={32} className="text-white mb-2 group-hover:scale-110 transition-transform" />
                    <span className="font-bold text-white">Add New User</span>
                </button>
            </div>

            {/* Main Interface */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden min-h-[500px] flex flex-col">
                {/* Toolbar */}
                <div className="p-4 border-b border-slate-800 flex flex-col md:flex-row gap-4 justify-between items-center bg-slate-800/50">
                    <div className="flex space-x-2 w-full md:w-auto overflow-x-auto">
                        <button onClick={() => setFilter('all')} className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors ${filter === 'all' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:bg-slate-800'}`}>All</button>
                        <button onClick={() => setFilter('user')} className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors ${filter === 'user' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:bg-slate-800'}`}>Users</button>
                        <button onClick={() => setFilter('support')} className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors ${filter === 'support' ? 'bg-blue-900/50 text-blue-400' : 'text-slate-400 hover:bg-slate-800'}`}>Support</button>
                        <button onClick={() => setFilter('admin')} className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors ${filter === 'admin' ? 'bg-pink-900/50 text-pink-400' : 'text-slate-400 hover:bg-slate-800'}`}>Admins</button>
                        {deletedCount > 0 && (
                            <button onClick={() => setFilter('deleted')} className={`ml-4 px-4 py-2 rounded-lg text-sm font-bold transition-colors border border-dashed border-slate-700 ${filter === 'deleted' ? 'bg-red-900/20 text-red-400 border-red-900' : 'text-slate-400 hover:bg-slate-800'}`}>
                                <Trash2 size={14} className="inline mr-2" /> Bin ({deletedCount})
                            </button>
                        )}
                    </div>

                    {/* Bulk Actions Toolbar */}
                    {selectedUserIds.size > 0 && filter !== 'deleted' && (
                        <div className="flex items-center space-x-4 animate-in slide-in-from-top-2 fade-in">
                            <span className="text-sm font-bold text-slate-400">{selectedUserIds.size} Selected</span>
                            <button
                                onClick={handleBulkDelete}
                                disabled={isBulkActionProcessing}
                                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2">
                                <Trash2 size={16} /> Move to Bin
                            </button>
                        </div>
                    )}

                    <div className="relative w-full md:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                        <input
                            className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-700 bg-slate-800 text-white focus:ring-2 focus:ring-pink-500 outline-none"
                            placeholder="Search email or ID..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                </div>

                {/* Table */}
                <div className="overflow-x-auto flex-1">
                    <table className="w-full text-left">
                        <thead className="bg-slate-950 text-slate-500 uppercase text-xs font-bold sticky top-0">
                            <tr>
                                <th className="p-4 w-12 text-center">
                                    <button onClick={toggleSelectAll} className="text-slate-500 hover:text-white">
                                        {selectedUserIds.size > 0 && selectedUserIds.size === filteredUsers.length ? <CheckSquare size={16} /> : <Square size={16} />}
                                    </button>
                                </th>
                                <th className="p-4">User</th>
                                <th className="p-4">Role</th>
                                <th className="p-4">Tier</th>
                                <th className="p-4">Last Active</th>
                                <th className="p-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800">
                            {loading ? (
                                <tr><td colSpan={6} className="p-8 text-center text-slate-500">Loading user data...</td></tr>
                            ) : errorMsg ? (
                                <tr><td colSpan={6} className="p-8 text-center text-red-400 font-bold bg-red-900/20">Error: {errorMsg}</td></tr>
                            ) : filteredUsers.length === 0 ? (
                                <tr><td colSpan={6} className="p-8 text-center text-slate-500">
                                    No users found matching filters.<br />
                                    <span className="text-xs opacity-50">Total loaded: {users.length}</span>
                                </td></tr>
                            ) : filteredUsers.map(user => (
                                <tr key={user.id} className={`transition-colors ${selectedUserIds.has(user.id) ? 'bg-pink-900/10' : 'hover:bg-slate-800/50'} ${user.deleted_at ? 'opacity-60 bg-red-900/5' : ''}`}>
                                    <td className="p-4 text-center">
                                        <button onClick={() => toggleSelectUser(user.id)} className={`${selectedUserIds.has(user.id) ? 'text-pink-500' : 'text-slate-600 hover:text-slate-400'}`}>
                                            {selectedUserIds.has(user.id) ? <CheckSquare size={16} /> : <Square size={16} />}
                                        </button>
                                    </td>
                                    <td className="p-4">
                                        <div className="flex items-center space-x-3">
                                            <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-xs font-bold text-slate-400 relative">
                                                {(user.email || 'U')[0].toUpperCase()}
                                                {user.deleted_at && <div className="absolute -bottom-1 -right-1 bg-red-500 rounded-full p-0.5"><Trash2 size={8} className="text-white" /></div>}
                                            </div>
                                            <div>
                                                <div className="font-bold text-slate-200 flex items-center gap-2">
                                                    {user.full_name || user.email || '<No Email>'}
                                                    {user.deleted_at && <span className="text-[10px] bg-red-500/20 text-red-400 px-1 py-0.5 rounded border border-red-500/30">DELETED</span>}
                                                </div>
                                                <div className="text-xs text-slate-500 font-mono">{user.email}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="p-4">
                                        <div className="flex items-center space-x-2">
                                            {user.role === 'admin' && <ShieldAlert size={14} className="text-pink-500" />}
                                            {user.role === 'support' && <Shield size={14} className="text-blue-500" />}
                                            <select
                                                className={`px-2 py-1 rounded text-xs font-bold uppercase outline-none bg-transparent ${user.role === 'admin' ? 'text-pink-400' : user.role === 'support' ? 'text-blue-400' : 'text-slate-400'} focus:bg-slate-800`}
                                                value={user.role}
                                                disabled={!hasPermission('USER_UPDATE') || !!user.deleted_at}
                                                onChange={(e) => updateUserRole(user.id, e.target.value as any)}
                                            >
                                                <option value="user">USER</option>
                                                <option value="support">SUPPORT</option>
                                                <option value="admin">ADMIN</option>
                                            </select>
                                        </div>
                                    </td>
                                    <td className="p-4">
                                        <span className={`px-2 py-1 rounded text-xs font-bold capitalize ${(user.subscription_tier === 'paid' || user.subscription_tier === 'premium') ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' : 'bg-slate-800 text-slate-500'
                                            }`}>
                                            {user.subscription_tier || 'Free'}
                                        </span>
                                    </td>
                                    <td className="p-4 text-xs text-slate-500">
                                        {user.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleDateString() : 'Never'}
                                    </td>
                                    <td className="p-4 text-right relative">
                                        {filter === 'deleted' ? (
                                            <div className="flex justify-end gap-2">
                                                <button onClick={() => restoreUser(user.id)} className="p-2 bg-emerald-900/30 text-emerald-400 rounded hover:bg-emerald-900/50"><RotateCcw size={14} /></button>
                                                {hasPermission('USER_PERMANENT_DELETE') && (
                                                    <button onClick={() => permanentDeleteUser(user.id)} className="p-2 bg-red-900/30 text-red-400 rounded hover:bg-red-900/50"><Trash2 size={14} /></button>
                                                )}
                                            </div>
                                        ) : (
                                            <div className="flex justify-end">
                                                <button
                                                    onClick={() => setActiveActionId(activeActionId === user.id ? null : user.id)}
                                                    className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white"
                                                >
                                                    <MoreVertical size={16} />
                                                </button>

                                                {/* Actions Dropdown */}
                                                {activeActionId === user.id && (
                                                    <div className="absolute right-8 top-8 z-50 w-48 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl overflow-hidden animate-in slide-in-from-top-2 fade-in">
                                                        <div className="py-1">
                                                            <button onClick={() => handlePasswordReset(user.email || '')} className="flex items-center gap-2 px-4 py-2 text-xs w-full hover:bg-slate-800 text-slate-300">
                                                                <Key size={14} /> Send Password Reset
                                                            </button>
                                                            <button onClick={() => openTierModal(user)} className="flex items-center gap-2 px-4 py-2 text-xs w-full hover:bg-slate-800 text-slate-300">
                                                                <CreditCard size={14} /> Manage Subscription
                                                            </button>
                                                            <button onClick={() => handleViewLogs(user)} className="flex items-center gap-2 px-4 py-2 text-xs w-full hover:bg-slate-800 text-slate-300">
                                                                <Activity size={14} /> View Activity Logs
                                                            </button>
                                                            <div className="border-t border-slate-800 my-1"></div>
                                                            <button onClick={() => handleForceLogout(user.id)} className="flex items-center gap-2 px-4 py-2 text-xs w-full hover:bg-red-900/20 text-red-400">
                                                                <LogOut size={14} /> Force Logout
                                                            </button>
                                                            <button onClick={() => softDeleteUser(user.id)} className="flex items-center gap-2 px-4 py-2 text-xs w-full hover:bg-red-900/20 text-red-400">
                                                                <Trash2 size={14} /> Soft Delete
                                                            </button>
                                                        </div>
                                                    </div>
                                                )}
                                                {/* Click outside closer could be added, but manual toggle is fine for MVP */}
                                            </div>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Debug Footer */}
            <div className="text-xs text-slate-600 font-mono text-center">
                DEBUG: Loaded {users.length} users ({deletedCount} deleted).
                {loading ? ' (Loading...)' : ' (Idle)'}
                {errorMsg ? ` [ERROR: ${errorMsg}]` : ' [OK]'}
                <button onClick={loadData} className="ml-2 underline hover:text-pink-500">Reload</button>
            </div>

            {/* Activity Logs Modal */}
            {viewLogsUser && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
                    <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl max-h-[80vh] flex flex-col shadow-2xl">
                        <div className="p-6 border-b border-slate-800 flex justify-between items-center">
                            <h3 className="text-lg font-bold flex items-center gap-2"><Activity size={20} className="text-pink-500" /> Activity Log: {viewLogsUser.email}</h3>
                            <button onClick={() => setViewLogsUser(null)} className="text-slate-500 hover:text-white"><X size={20} /></button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-4">
                            {isLogsLoading ? (
                                <div className="text-center p-8 text-slate-500">Loading logs...</div>
                            ) : userLogs.length === 0 ? (
                                <div className="text-center p-8 text-slate-500">No activity recorded for this user.</div>
                            ) : (
                                <table className="w-full text-left text-sm">
                                    <thead className="text-slate-500 text-xs uppercase bg-slate-950/50">
                                        <tr>
                                            <th className="p-3">Time</th>
                                            <th className="p-3">Action</th>
                                            <th className="p-3">Details</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-800">
                                        {userLogs.map(log => (
                                            <tr key={log.id}>
                                                <td className="p-3 text-slate-400 font-mono text-xs">{new Date(log.created_at).toLocaleString()}</td>
                                                <td className="p-3"><span className="bg-slate-800 border border-slate-700 px-2 py-1 rounded text-xs font-bold">{log.action}</span></td>
                                                <td className="p-3 text-slate-500 text-xs font-mono">{JSON.stringify(log.details)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Tier Modal */}
            {isTierModalOpen && tierUser && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
                    <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-sm p-6 shadow-2xl">
                        <h3 className="text-lg font-bold mb-4 flex items-center gap-2"><CreditCard size={20} className="text-pink-500" /> Manage Subscription</h3>
                        <p className="text-slate-400 text-sm mb-4">Set subscription tier for <b>{tierUser.email}</b>.</p>

                        <div className="space-y-4">
                            <select className="w-full bg-slate-800 border border-slate-700 text-white p-3 rounded-xl outline-none" value={newTier} onChange={e => setNewTier(e.target.value)}>
                                <option value="free">Free</option>
                                <option value="paid">Paid (Standard)</option>
                                <option value="premium">Premium (VIP)</option>
                            </select>

                            <div className="flex gap-3">
                                <button onClick={() => setIsTierModalOpen(false)} className="flex-1 py-3 text-slate-400 hover:bg-slate-800 rounded-xl font-bold">Cancel</button>
                                <button onClick={updateTier} className="flex-1 py-3 bg-pink-600 hover:bg-pink-700 text-white rounded-xl font-bold">Save</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Add User Modal */}
            {isAddUserOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
                    <div className="bg-slate-900 border border-slate-800 p-8 rounded-2xl w-full max-w-md shadow-2xl animate-in zoom-in-95">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-bold text-white flex items-center gap-2"><Plus className="text-pink-500" /> Add User</h3>
                            <button onClick={() => setIsAddUserOpen(false)} className="text-slate-500 hover:text-white"><X size={20} /></button>
                        </div>
                        <form onSubmit={handleAddUser} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Email Address</label>
                                <input
                                    type="email"
                                    required
                                    className="w-full bg-slate-800 border border-slate-700 text-white p-3 rounded-lg outline-none focus:border-pink-500"
                                    value={newUserEmail}
                                    onChange={e => setNewUserEmail(e.target.value)}
                                    placeholder="user@example.com"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Password</label>
                                <input
                                    type="text" // Visible text for admin convenience, or password if preferred. usually admin sets temp password so visible is fine or toggle. Let's use text for simplicity as per "Set Password" request.
                                    className="w-full bg-slate-800 border border-slate-700 text-white p-3 rounded-lg outline-none focus:border-pink-500"
                                    value={newUserPassword}
                                    onChange={e => setNewUserPassword(e.target.value)}
                                    placeholder="Leave empty to send invite link"
                                />
                                <p className="text-[10px] text-slate-500 mt-1">
                                    {newUserPassword ? 'User will be created with this password.' : '* User will receive an email invite link.'}
                                </p>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Role</label>
                                <select
                                    className="w-full bg-slate-800 border border-slate-700 text-white p-3 rounded-lg outline-none focus:border-pink-500"
                                    value={newUserRole}
                                    // @ts-ignore
                                    onChange={e => setNewUserRole(e.target.value)}
                                >
                                    <option value="user">User</option>
                                    <option value="support">Support</option>
                                    <option value="admin">Admin</option>
                                </select>
                            </div>
                            <div className="bg-amber-900/20 border border-amber-900/50 p-3 rounded-lg flex items-start gap-2">
                                <AlertTriangle size={16} className="text-amber-500 mt-0.5 shrink-0" />
                                <p className="text-xs text-amber-200/70">Adding an admin grants full access to the system, including deleting other users and accessing logs.</p>
                            </div>
                            <div className="pt-4 flex gap-3">
                                <button type="button" onClick={() => setIsAddUserOpen(false)} className="flex-1 py-3 text-slate-400 hover:bg-slate-800 rounded-xl font-bold">Cancel</button>
                                <button type="submit" disabled={isAddingUser} className="flex-1 py-3 bg-pink-600 hover:bg-pink-700 text-white rounded-xl font-bold shadow-lg disabled:opacity-50">
                                    {isAddingUser ? 'Creating...' : 'Create User'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <ConfirmDialog
                isOpen={confirmDialog.isOpen}
                title={confirmDialog.title}
                message={confirmDialog.message}
                isDestructive={confirmDialog.isDestructive}
                onConfirm={confirmDialog.onConfirm}
                onCancel={closeConfirm}
            />
        </div>
    );
};

export default UserPanel;
