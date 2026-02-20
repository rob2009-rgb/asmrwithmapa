import React, { useState, useEffect, useRef } from 'react';
import { useScrollLock } from '../src/hooks/useScrollLock';
import { X, Save, RefreshCw, Play, Pause, Trash2, Plus, Upload, Lock, FileAudio, AlertTriangle, Download, UploadCloud, ShoppingBag, ShieldAlert, LogOut, Megaphone, MessageSquare, Users, Settings, Eye, EyeOff, Star, Activity, Book } from 'lucide-react';
import { SoundCategory, SoundItem } from '../types';
import { loadSoundLibrary, saveSoundLibrary, resetToDefaults, uploadAudioFile } from '../utils/soundManager';
import { supabase } from '../src/supabaseClient';
import { getCurrentProfile, UserProfile } from '../src/utils/authManager';
import { FourthwallService, FourthwallProduct } from '../src/services/FourthwallService';
import MarketingPanel from './admin/MarketingPanel';
import SupportPanel from './admin/SupportPanel';
import ErrorLogsPanel from './admin/ErrorLogsPanel';
import SettingsPanel from './admin/SettingsPanel';
import UserPanel from './admin/UserPanel';
import KnowledgeBasePanel from './admin/KnowledgeBasePanel';
import SystemStatusPanel from './admin/SystemStatusPanel';
import AnalyticsPanel from './admin/AnalyticsPanel';

interface AdminDashboardProps {
  onClose: () => void;
}

type AdminTab = 'sounds' | 'merch' | 'security' | 'marketing' | 'support' | 'users' | 'settings' | 'logs' | 'knowledge' | 'status' | 'analytics';

const AdminDashboard: React.FC<AdminDashboardProps> = ({ onClose }) => {
  useScrollLock(true);
  const [activeTab, setActiveTab] = useState<AdminTab>('sounds');
  const [library, setLibrary] = useState<SoundCategory[]>([]);
  const [selectedCatId, setSelectedCatId] = useState<string | null>(null);

  // Auth State
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState('');

  // Audio State
  const [testAudio, setTestAudio] = useState<HTMLAudioElement | null>(null);
  const [playingUrl, setPlayingUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  // Merch State — merged Fourthwall + Supabase overrides
  const [products, setProducts] = useState<any[]>([]);
  const [merchLoading, setMerchLoading] = useState(false);
  const [bannerConfig, setBannerConfig] = useState<any>({
    active: false,
    title: '',
    subtitle: '',
    imageUrl: '',
    ctaText: 'Shop Now',
    ctaLink: ''
  });

  // Security State
  const [auditLogs, setAuditLogs] = useState<any[]>([]);

  // User State
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);

  // Load data on mount
  useEffect(() => {
    const init = async () => {
      // Check active session
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        const profile = await getCurrentProfile();
        if (profile?.role === 'admin') {
          setUserProfile(profile);
          setIsAuthenticated(true);
          loadData();
        }
      }
    };
    init();
  }, []);

  const loadData = async () => {
    // Load Sounds
    const libs = await loadSoundLibrary();
    setLibrary(libs);
    if (libs.length > 0 && !selectedCatId) setSelectedCatId(libs[0].id);

    // Load Logs
    const { data: logData } = await supabase.from('audit_logs').select('*').order('created_at', { ascending: false }).limit(50);
    if (logData) setAuditLogs(logData);

    // Load Merch (Fourthwall + Supabase overrides)
    await loadMerchProducts();
    await loadBanner();
  };

  const loadBanner = async () => {
    const { data } = await supabase.from('system_settings').select('value').eq('key', 'merch_banner').single();
    if (data?.value) {
      try {
        setBannerConfig(JSON.parse(data.value));
      } catch (e) {
        console.error('Failed to parse banner config');
      }
    }
  };

  const updateBanner = async (updates: any) => {
    const newConfig = { ...bannerConfig, ...updates };
    setBannerConfig(newConfig); // Optimistic

    await supabase.from('system_settings').upsert({
      key: 'merch_banner',
      value: JSON.stringify(newConfig),
      updated_at: new Date().toISOString()
    }, { onConflict: 'key' } as any);
  };

  const loadMerchProducts = async () => {
    setMerchLoading(true);
    try {
      // 1. Fetch live Fourthwall products
      const fwProducts = await FourthwallService.getProducts();

      // 2. Fetch Supabase override rows (price_override, is_hero, is_active, description)
      const { data: overrides } = await (supabase.from('products') as any).select('*');
      const overrideMap: Record<string, any> = {};
      if (overrides) overrides.forEach((o: any) => { overrideMap[o.id] = o; });

      // 3. Merge: Fourthwall is the source of truth for name/images/variants;
      //    Supabase overrides control price, visibility, hero status.
      const merged = fwProducts.map((fw: FourthwallProduct) => {
        const override = overrideMap[fw.id] || {};
        return {
          id: fw.id,
          fw_id: fw.id,
          name: fw.name,
          fw_description: fw.description,
          description: override.description || fw.description,
          fw_price: fw.variants[0]?.unitPrice?.value || 0,
          price: override.price ?? fw.variants[0]?.unitPrice?.value ?? 0,
          image_url: fw.images[0]?.url || '',
          variants: fw.variants,
          is_hero: override.is_hero || false,
          is_active: override.is_active !== undefined ? override.is_active : true,
          stock_count: override.stock_count ?? 999,
          _has_override: !!overrides?.find((o: any) => o.id === fw.id),
        };
      });

      setProducts(merged);
    } catch (err) {
      console.error('Error loading merch:', err);
    } finally {
      setMerchLoading(false);
    }
  };

  // Auth Handler
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');

    // Legacy PIN Override for transitions
    if (password === '1234' && email === 'admin') {
      setIsAuthenticated(true);
      loadData();
      return;
    }

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setAuthError(error.message);
      return;
    }

    const profile = await getCurrentProfile();
    if (profile?.role !== 'admin') {
      setAuthError("Access Denied: Admin role required.");
      await supabase.auth.signOut();
      return;
    }

    setIsAuthenticated(true);
    setUserProfile(profile);
    loadData();
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setIsAuthenticated(false);
    onClose();
  };

  // --- CRUD Operations (Sounds) ---
  const updateCategory = (catId: string, updates: Partial<SoundCategory>) => {
    setLibrary(prev => prev.map(c => c.id === catId ? { ...c, ...updates } : c));
  };

  const updateSound = (catId: string, soundId: string, updates: Partial<SoundItem>) => {
    setLibrary(prev => prev.map(c => {
      if (c.id !== catId) return c;
      return {
        ...c,
        sounds: c.sounds.map(s => s.id === soundId ? { ...s, ...updates } : s)
      };
    }));
  };

  const addSound = (catId: string) => {
    const uniqueId = `custom-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    const newSound: SoundItem = { id: uniqueId, name: 'New Trigger', url: '' };
    setLibrary(prev => prev.map(c => c.id === catId ? { ...c, sounds: [...c.sounds, newSound] } : c));
  };

  const deleteSound = (catId: string, soundId: string) => {
    if (window.confirm('Are you sure?')) {
      setLibrary(prev => prev.map(c => {
        if (c.id !== catId) return c;
        return { ...c, sounds: c.sounds.filter(s => s.id !== soundId) };
      }));
    }
  };

  const handleFileUpload = async (catId: string, soundId: string, file: File) => {
    if (!file.type.startsWith('audio/')) return alert("Audio files only.");
    setIsUploading(true);
    try {
      const publicUrl = await uploadAudioFile(file);
      if (publicUrl) updateSound(catId, soundId, { url: publicUrl, name: file.name.replace(/\.[^/.]+$/, "") });
      else alert("Upload failed.");
    } catch (e) { alert("Upload error."); }
    finally { setIsUploading(false); }
  };

  const handleSave = async () => {
    try {
      await saveSoundLibrary(library);

      // Log auditing
      await supabase.from('audit_logs').insert({
        action: 'UPDATE_SOUND_LIBRARY',
        resource: 'database',
        details: { count: library.length },
        // user_id handled by RLS if generic
      });

      alert('Database Updated Successfully!');
    } catch (e) { alert('Failed to save to Supabase.'); }
  };

  // --- MERCH HANDLERS ---
  // Upsert override row into Supabase for a Fourthwall product
  const updateProduct = async (id: string, updates: any) => {
    // Optimistic UI update
    if (updates.is_hero === true) {
      setProducts(prev => prev.map(p => ({ ...p, is_hero: p.id === id })));
      // Unset hero on all others in DB
      await (supabase.from('products') as any).update({ is_hero: false }).neq('id', id);
    } else {
      setProducts(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p));
    }

    // Upsert override row (id = Fourthwall product ID)
    const product = products.find(p => p.id === id);
    const upsertData = {
      id,
      name: product?.name,
      image_url: product?.image_url,
      price: updates.price ?? product?.price,
      description: updates.description ?? product?.description,
      is_hero: updates.is_hero ?? product?.is_hero,
      is_active: updates.is_active ?? product?.is_active,
      stock_count: updates.stock_count ?? product?.stock_count,
      ...updates,
    };
    await (supabase.from('products') as any).upsert(upsertData, { onConflict: 'id' });
  };


  // --- AUDIO PREVIEW ---
  const togglePreview = (url: string) => {
    if (testAudio) { testAudio.pause(); setTestAudio(null); setPlayingUrl(null); }
    if (playingUrl !== url) {
      const audio = new Audio(url);
      audio.play().catch(() => alert('Error playing audio.'));
      audio.onended = () => setPlayingUrl(null);
      setTestAudio(audio);
      setPlayingUrl(url);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="fixed inset-0 z-[200] bg-slate-950 flex items-center justify-center p-4">
        <div className="bg-slate-900 border border-slate-700 p-8 rounded-3xl max-w-sm w-full text-center space-y-6 shadow-2xl">
          <div className="w-16 h-16 bg-pink-500/20 text-pink-500 rounded-2xl mx-auto flex items-center justify-center">
            <Lock size={32} />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white">Admin Access</h2>
            <p className="text-slate-400 text-sm mt-2">Secure Login required.</p>
          </div>
          <form onSubmit={handleLogin} className="space-y-4">
            <input
              type="text"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 text-white p-4 rounded-xl outline-none"
              placeholder="Email (or 'admin')"
            />
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 text-white p-4 rounded-xl outline-none"
              placeholder="Password (or '1234')"
            />
            {authError && <p className="text-red-400 text-xs">{authError}</p>}
            <div className="flex gap-3">
              <button type="button" onClick={onClose} className="flex-1 py-3 text-slate-400 hover:bg-slate-800 rounded-xl font-bold">Cancel</button>
              <button type="submit" className="flex-1 py-3 bg-pink-600 hover:bg-pink-700 text-white rounded-xl font-bold shadow-lg">Login</button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  const selectedCategory = library.find(c => c.id === selectedCatId);

  return (
    <div className="fixed inset-0 z-[200] bg-slate-950 text-white flex flex-col md:flex-row overflow-hidden">
      {/* Sidebar */}
      <div className="w-full md:w-64 bg-slate-900 border-r border-slate-800 flex flex-col h-[40vh] md:h-full">
        <div className="p-6 border-b border-slate-800 flex items-center justify-between">
          <h2 className="font-bold text-lg">MAPA Admin</h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-lg text-slate-400"><X size={20} /></button>
        </div>

        <div className="p-4 overflow-y-auto flex-1">
          {/* Content */}
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-600 px-3 pb-1 pt-1">Content</p>
          <div className="space-y-1 mb-4">
            <button onClick={() => setActiveTab('sounds')} className={`w-full text-left px-4 py-2.5 rounded-xl flex items-center space-x-3 transition-colors ${activeTab === 'sounds' ? 'bg-pink-600 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}>
              <FileAudio size={16} /> <span className="font-semibold text-sm">Sound Library</span>
            </button>
            <button onClick={() => setActiveTab('merch')} className={`w-full text-left px-4 py-2.5 rounded-xl flex items-center space-x-3 transition-colors ${activeTab === 'merch' ? 'bg-pink-600 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}>
              <ShoppingBag size={16} /> <span className="font-semibold text-sm">Merch Store</span>
            </button>
            <button onClick={() => setActiveTab('marketing')} className={`w-full text-left px-4 py-2.5 rounded-xl flex items-center space-x-3 transition-colors ${activeTab === 'marketing' ? 'bg-pink-600 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}>
              <Megaphone size={16} /> <span className="font-semibold text-sm">Marketing</span>
            </button>
          </div>

          {/* Users */}
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-600 px-3 pb-1">Users</p>
          <div className="space-y-1 mb-4">
            <button onClick={() => setActiveTab('users')} className={`w-full text-left px-4 py-2.5 rounded-xl flex items-center space-x-3 transition-colors ${activeTab === 'users' ? 'bg-pink-600 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}>
              <Users size={16} /> <span className="font-semibold text-sm">User Management</span>
            </button>
            <button onClick={() => setActiveTab('security')} className={`w-full text-left px-4 py-2.5 rounded-xl flex items-center space-x-3 transition-colors ${activeTab === 'security' ? 'bg-pink-600 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}>
              <ShieldAlert size={16} /> <span className="font-semibold text-sm">Security & Audit</span>
            </button>
          </div>

          {/* Support */}
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-600 px-3 pb-1">Support</p>
          <div className="space-y-1 mb-4">
            <button onClick={() => setActiveTab('support')} className={`w-full text-left px-4 py-2.5 rounded-xl flex items-center space-x-3 transition-colors ${activeTab === 'support' ? 'bg-pink-600 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}>
              <MessageSquare size={16} /> <span className="font-semibold text-sm">Support Center</span>
            </button>
            <button onClick={() => setActiveTab('knowledge')} className={`w-full text-left px-4 py-2.5 rounded-xl flex items-center space-x-3 transition-colors ${activeTab === 'knowledge' ? 'bg-pink-600 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}>
              <Book size={16} /> <span className="font-semibold text-sm">Knowledge Base</span>
            </button>
          </div>

          {/* Data & Analytics */}
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-600 px-3 pb-1">Data & Insights</p>
          <div className="space-y-1 mb-4">
            <button onClick={() => setActiveTab('analytics')} className={`w-full text-left px-4 py-2.5 rounded-xl flex items-center space-x-3 transition-colors ${activeTab === 'analytics' ? 'bg-pink-600 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}>
              <Activity size={16} /> <span className="font-semibold text-sm">Product Analytics</span>
            </button>
            <button onClick={() => setActiveTab('logs')} className={`w-full text-left px-4 py-2.5 rounded-xl flex items-center space-x-3 transition-colors ${activeTab === 'logs' ? 'bg-pink-600 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}>
              <AlertTriangle size={16} /> <span className="font-semibold text-sm">Error Logs</span>
            </button>
          </div>

          {/* Admin */}
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-600 px-3 pb-1">Admin</p>
          <div className="space-y-1">
            <button onClick={() => setActiveTab('settings')} className={`w-full text-left px-4 py-2.5 rounded-xl flex items-center space-x-3 transition-colors ${activeTab === 'settings' ? 'bg-pink-600 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}>
              <Settings size={16} /> <span className="font-semibold text-sm">System Settings</span>
            </button>
          </div>
        </div>

        <div className="mt-auto p-4 border-t border-slate-800 space-y-4">
          {userProfile && (
            <div className="bg-slate-800/50 p-3 rounded-xl border border-slate-700/50">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-8 h-8 rounded-full bg-pink-600 flex items-center justify-center text-xs font-bold">
                  {userProfile.email?.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-bold truncate text-white">{userProfile.full_name || 'Admin User'}</div>
                  <div className="text-xs text-slate-400 truncate">{userProfile.email}</div>
                </div>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="px-2 py-0.5 rounded bg-pink-500/20 text-pink-400 border border-pink-500/30 uppercase font-bold">{userProfile.role}</span>
                <span className="text-slate-500 capitalize">{userProfile.subscription_tier || 'Free'} Plan</span>
              </div>
            </div>
          )}
          <button onClick={handleLogout} className="w-full flex items-center justify-center space-x-2 text-slate-400 hover:text-white p-3 rounded-xl transition-colors hover:bg-red-500/10 hover:text-red-400">
            <LogOut size={16} /> <span>Sign Out</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col h-[60vh] md:h-full bg-slate-950 overflow-hidden">

        {/* SOUNDS TAB */}
        {activeTab === 'sounds' && (
          <div className="flex-1 flex flex-col md:flex-row h-full">
            {/* Category List */}
            <div className="w-64 border-r border-slate-800 overflow-y-auto p-4 hidden md:block">
              <div className="text-xs font-bold text-slate-500 uppercase px-4 mb-2">Categories</div>
              {library.map(cat => (
                <button key={cat.id} onClick={() => setSelectedCatId(cat.id)} className={`w-full text-left px-4 py-3 rounded-xl flex items-center space-x-3 mb-1 ${selectedCatId === cat.id ? 'bg-slate-800 text-white' : 'text-slate-400 hover:bg-slate-800'}`}>
                  <span>{cat.icon}</span><span className="truncate">{cat.name}</span>
                </button>
              ))}
              <div className="mt-8">
                <button onClick={handleSave} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-2 rounded-lg font-bold text-sm">Save Changes</button>
              </div>
            </div>

            {/* Editor */}
            <div className="flex-1 overflow-y-auto p-8">
              {selectedCategory ? (
                <div className="space-y-6">
                  <h2 className="text-3xl font-bold flex items-center gap-3">{selectedCategory.icon} {selectedCategory.name}</h2>
                  <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800">
                    <h3 className="font-bold text-slate-400 mb-4">Manage Audio Files</h3>
                    {selectedCategory.sounds.map((sound, idx) => (
                      <div key={sound.id} className="flex gap-4 mb-4 items-center">
                        <div className="w-8 text-slate-600">{idx + 1}</div>
                        <input className="bg-slate-950 border border-slate-800 p-2 rounded text-white flex-1" value={sound.name} onChange={e => updateSound(selectedCategory.id, sound.id, { name: e.target.value })} />
                        <input className="bg-slate-950 border border-slate-800 p-2 rounded text-slate-400 flex-1 font-mono text-xs" value={sound.url} onChange={e => updateSound(selectedCategory.id, sound.id, { url: e.target.value })} />

                        <label className={`cursor-pointer p-2 rounded bg-slate-800 border-slate-700 hover:bg-slate-700 text-slate-400 ${isUploading ? 'animate-pulse' : ''}`}>
                          <Upload size={16} />
                          <input type="file" className="hidden" accept="audio/*" disabled={isUploading} onChange={(e) => e.target.files?.[0] && handleFileUpload(selectedCategory.id, sound.id, e.target.files[0])} />
                        </label>
                        <button onClick={() => deleteSound(selectedCategory.id, sound.id)} className="text-red-400 hover:bg-red-900/20 p-2 rounded"><Trash2 size={16} /></button>
                      </div>
                    ))}
                    <button onClick={() => addSound(selectedCategory.id)} className="mt-4 flex items-center gap-2 text-pink-400 font-bold text-sm hover:text-pink-300"><Plus size={16} /> Add New Sound</button>
                  </div>
                </div>
              ) : <p className="p-8 text-slate-500">Select a category.</p>}
            </div>
          </div>
        )}

        {/* MERCH TAB */}
        {activeTab === 'merch' && (
          <div className="flex-1 overflow-y-auto p-8">
            <div className="flex justify-between items-center mb-8">
              <div>
                <h2 className="text-3xl font-bold">Merch Store Inventory</h2>
                <p className="text-slate-500 text-sm mt-1">
                  Live from Fourthwall · {products.length} products loaded
                </p>
              </div>
              <button
                onClick={loadMerchProducts}
                disabled={merchLoading}
                className="bg-slate-800 hover:bg-slate-700 disabled:opacity-50 px-5 py-2 rounded-xl font-bold flex items-center gap-2 transition-all"
              >
                <RefreshCw size={16} className={merchLoading ? 'animate-spin' : ''} />
                {merchLoading ? 'Syncing...' : 'Sync Fourthwall'}
              </button>
            </div>

            {/* Banner Management */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 mb-8">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold flex items-center gap-2">
                  <ShoppingBag className="text-pink-500" /> Storefront Banner
                </h3>
                <div className="flex items-center gap-2">
                  <span className="text-xs uppercase font-bold text-slate-500">Active</span>
                  <button
                    onClick={() => updateBanner({ active: !bannerConfig?.active })}
                    className={`w-12 h-6 rounded-full transition-colors relative ${bannerConfig?.active ? 'bg-pink-500' : 'bg-slate-700'}`}
                  >
                    <span className={`absolute top-1 left-1 bg-white w-4 h-4 rounded-full transition-transform ${bannerConfig?.active ? 'translate-x-6' : ''}`} />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase text-slate-500">Headline</label>
                    <input
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white outline-none focus:border-pink-500"
                      value={bannerConfig?.title || ''}
                      onChange={e => updateBanner({ title: e.target.value })}
                      placeholder="e.g. SUMMER COLLECTION"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase text-slate-500">Subtitle</label>
                    <input
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white outline-none focus:border-pink-500"
                      value={bannerConfig?.subtitle || ''}
                      onChange={e => updateBanner({ subtitle: e.target.value })}
                      placeholder="e.g. Limited Edition Drops"
                    />
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase text-slate-500">Banner Image URL</label>
                    <input
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white outline-none focus:border-pink-500 font-mono text-sm"
                      value={bannerConfig?.imageUrl || ''}
                      onChange={e => updateBanner({ imageUrl: e.target.value })}
                      placeholder="https://..."
                    />
                  </div>
                  <div className="flex gap-4">
                    <div className="space-y-2 flex-1">
                      <label className="text-xs font-bold uppercase text-slate-500">CTA Text</label>
                      <input
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white outline-none focus:border-pink-500"
                        value={bannerConfig?.ctaText || ''}
                        onChange={e => updateBanner({ ctaText: e.target.value })}
                        placeholder="SHOP NOW"
                      />
                    </div>
                    <div className="space-y-2 flex-1">
                      <label className="text-xs font-bold uppercase text-slate-500">CTA Link</label>
                      <input
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white outline-none focus:border-pink-500"
                        value={bannerConfig?.ctaLink || ''}
                        onChange={e => updateBanner({ ctaLink: e.target.value })}
                        placeholder="https://"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              {products.map(product => (
                <div key={product.id} className={`bg-slate-900 border transition-all duration-300 p-6 rounded-3xl space-y-4 ${product.is_hero ? 'border-pink-500 shadow-[0_0_20px_rgba(236,72,153,0.2)]' : 'border-slate-800'}`}>
                  <div className="flex gap-6">
                    <div className="w-32 h-40 bg-slate-950 rounded-2xl flex items-center justify-center overflow-hidden shrink-0 border border-slate-800 relative group">
                      {product.image_url ? (
                        <img src={product.image_url} className="h-full w-full object-cover group-hover:scale-110 transition-transform duration-500" />
                      ) : (
                        <ShoppingBag size={32} className="text-slate-800" />
                      )}
                      {product.is_hero && (
                        <div className="absolute top-2 left-2 bg-pink-500 text-white text-[8px] font-black uppercase px-1.5 py-0.5 rounded shadow-lg">Hero</div>
                      )}
                    </div>

                    <div className="flex-1 space-y-3">
                      <div className="flex justify-between items-start">
                        <input
                          className="bg-transparent text-xl font-bold outline-none border-b border-transparent focus:border-pink-500 w-full"
                          value={product.name}
                          placeholder="Product Name"
                          onChange={e => updateProduct(product.id, { name: e.target.value })}
                        />
                        <button onClick={() => updateProduct(product.id, { is_active: !product.is_active })} className={`p-1 transition-colors ${product.is_active ? 'text-emerald-400 hover:text-emerald-300' : 'text-slate-600 hover:text-emerald-400'}`}><Eye size={18} /></button>
                      </div>

                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2 bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-800">
                          <span className="text-pink-500 font-bold">$</span>
                          <input
                            className="bg-transparent font-mono outline-none w-16 text-sm"
                            type="number"
                            value={product.price}
                            onChange={e => updateProduct(product.id, { price: Number(e.target.value) })}
                          />
                        </div>
                        <div className="flex items-center gap-2 bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-800">
                          <span className="text-slate-500 text-[10px] font-bold uppercase">Stock</span>
                          <input
                            className="bg-transparent font-mono outline-none w-12 text-sm"
                            type="number"
                            value={product.stock_count}
                            onChange={e => updateProduct(product.id, { stock_count: Number(e.target.value) })}
                          />
                        </div>
                        <button
                          onClick={() => updateProduct(product.id, { is_hero: !product.is_hero })}
                          className={`ml-auto px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${product.is_hero ? 'bg-pink-600 text-white shadow-lg' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}
                        >
                          {product.is_hero ? '★ Hero Product' : 'Make Hero'}
                        </button>
                      </div>

                      <textarea
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-slate-400 outline-none focus:border-pink-500 h-24 resize-none"
                        placeholder="Product description (HTML supported)..."
                        value={product.description || ''}
                        onChange={e => updateProduct(product.id, { description: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <input
                      className="flex-1 bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-slate-500 font-mono outline-none"
                      placeholder="Image URL..."
                      value={product.image_url || ''}
                      onChange={e => updateProduct(product.id, { image_url: e.target.value })}
                    />
                    <label className="bg-slate-800 hover:bg-slate-700 p-2 rounded-lg cursor-pointer transition-colors">
                      <Upload size={14} className="text-slate-400" />
                      <input type="file" className="hidden" accept="image/*" />
                    </label>
                  </div>
                </div>
              ))}
            </div>

            {products.length === 0 && (
              <div className="flex flex-col items-center justify-center py-20 bg-slate-900/50 rounded-[3rem] border-2 border-dashed border-slate-800">
                <ShoppingBag size={48} className="text-slate-800 mb-4" />
                <p className="text-slate-500 font-medium">Your store is currently empty.</p>
                <button onClick={loadMerchProducts} className="mt-4 text-pink-500 font-bold hover:underline">Sync Fourthwall</button>
              </div>
            )}
          </div>
        )}

        {/* SECURITY TAB */}
        {activeTab === 'security' && (
          <div className="flex-1 overflow-y-auto p-8">
            <h2 className="text-3xl font-bold mb-8 flex items-center gap-3"><ShieldAlert className="text-emerald-500" /> Security Audit Logs</h2>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
              <table className="w-full text-left">
                <thead className="bg-slate-950 text-slate-400 text-xs uppercase font-bold">
                  <tr>
                    <th className="p-4">Timestamp</th>
                    <th className="p-4">Action</th>
                    <th className="p-4">Resource</th>
                    <th className="p-4">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 text-sm text-slate-300">
                  {auditLogs.map(log => (
                    <tr key={log.id} className="hover:bg-slate-800/50">
                      <td className="p-4 font-mono text-slate-500">{new Date(log.created_at).toLocaleString()}</td>
                      <td className="p-4"><span className="bg-slate-800 px-2 py-1 rounded text-xs font-bold text-white border border-slate-700">{log.action}</span></td>
                      <td className="p-4">{log.resource}</td>
                      <td className="p-4 font-mono text-xs text-slate-500">{JSON.stringify(log.details)}</td>
                    </tr>
                  ))}
                  {auditLogs.length === 0 && (
                    <tr><td colSpan={4} className="p-8 text-center text-slate-500">No logs found.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* MARKETING TAB */}
        {activeTab === 'marketing' && (
          <div className="flex-1 overflow-y-auto p-8">
            <MarketingPanel />
          </div>
        )}

        {/* SUPPORT TAB */}
        {activeTab === 'support' && (
          <div className="flex-1 overflow-y-auto p-8">
            <SupportPanel />
          </div>
        )}

        {/* LOGS TAB */}
        {activeTab === 'logs' && (
          <div className="flex-1 overflow-y-auto p-8">
            <ErrorLogsPanel />
          </div>
        )}

        {/* KNOWLEDGE BASE TAB */}
        {activeTab === 'knowledge' && (
          <div className="flex-1 overflow-y-auto p-8">
            <KnowledgeBasePanel />
          </div>
        )}

        {/* SYSTEM STATUS TAB */}
        {activeTab === 'status' && (
          <div className="flex-1 overflow-y-auto p-8">
            <SystemStatusPanel />
          </div>
        )}

        {/* USERS TAB */}
        {activeTab === 'users' && (
          <div className="flex-1 overflow-y-auto p-8">
            <UserPanel />
          </div>
        )}

        {/* SETTINGS TAB */}
        {activeTab === 'settings' && (
          <div className="flex-1 overflow-y-auto p-8">
            <SettingsPanel />
          </div>
        )}

        {/* ANALYTICS TAB */}
        {activeTab === 'analytics' && (
          <div className="flex-1 overflow-y-auto p-8">
            <AnalyticsPanel />
          </div>
        )}

      </div>
    </div>
  );
};

export default AdminDashboard;
