import React, { useState, useEffect } from 'react';
import { useScrollLock } from '../../hooks/useScrollLock';
import { X, Heart, Download, Share2, Music, Search, Filter, Loader2, PlayCircle, StopCircle, UploadCloud, Trophy } from 'lucide-react';
import { MarketplaceService, PresetWithCreator } from '../../services/MarketplaceService';
import { useNotification } from '../../contexts/NotificationContext';
import { StreakLeaderboard } from './StreakLeaderboard';

interface CommunityMarketplaceProps {
    isOpen: boolean;
    onClose: () => void;
    user: any;
    onLoadPreset: (layers: any) => void;
    currentLayers?: any; // To allow publishing current mix
    isPremium?: boolean;
}

export const CommunityMarketplace: React.FC<CommunityMarketplaceProps> = ({ isOpen, onClose, user, onLoadPreset, currentLayers, isPremium = false }) => {
    useScrollLock(isOpen);
    const { showNotification } = useNotification();
    const [activeTab, setActiveTab] = useState<'browse' | 'my-mixes' | 'leaderboard'>('browse');
    const [presets, setPresets] = useState<PresetWithCreator[]>([]);
    const [loading, setLoading] = useState(false);
    const [filter, setFilter] = useState<'popular' | 'new'>('popular');
    const [previewId, setPreviewId] = useState<string | null>(null);

    // Publishing State
    const [isPublishing, setIsPublishing] = useState(false);
    const [pubName, setPubName] = useState('');
    const [pubDesc, setPubDesc] = useState('');

    useEffect(() => {
        if (isOpen && activeTab !== 'leaderboard') loadPresets();
    }, [isOpen, filter, activeTab]);

    const loadPresets = async () => {
        setLoading(true);
        try {
            if (activeTab === 'browse') {
                const data = await MarketplaceService.getPresets(filter);
                setPresets(data);
            } else {
                const data = await MarketplaceService.getUserPresets(user?.id);
                setPresets(data as any); // Type assertion for now since getUserPresets returns basic type
            }
        } catch (error) {
            console.error(error);
            showNotification('error', 'Failed to load presets');
        } finally {
            setLoading(false);
        }
    };

    const handlePublish = async () => {
        if (!isPremium) return showNotification('error', 'Publishing is a Premium feature.');
        if (!pubName) return showNotification('error', 'Please name your mix');
        if (!currentLayers) return showNotification('error', 'No active mix to publish');

        try {
            setIsPublishing(true);
            await MarketplaceService.publishPreset({
                name: pubName,
                description: pubDesc,
                layers: currentLayers,
                is_premium: false // Default to free for now
            }, user.id);

            showNotification('success', 'Mix published to community!');
            setPubName('');
            setPubDesc('');
            setActiveTab('my-mixes');
        } catch (error) {
            console.error(error);
            showNotification('error', 'Failed to publish mix');
        } finally {
            setIsPublishing(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-md" onClick={onClose} />

            <div className="relative w-full max-w-5xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col md:flex-row h-[90vh] md:h-[85vh] animate-in zoom-in-95">

                {/* Sidebar / Navigation */}
                <div className="w-full md:w-64 bg-slate-950 border-b md:border-b-0 md:border-r border-slate-800 p-4 md:p-6 flex flex-col md:flex-col gap-2 shrink-0 max-h-[40vh] md:max-h-full overflow-y-auto custom-scrollbar md:overflow-visible">
                    <h2 className="text-xl font-black text-white mb-4 md:mb-6 flex items-center gap-2">
                        <Music className="text-pink-500" /> Community
                    </h2>

                    <div className="flex md:flex-col gap-2 overflow-x-auto md:overflow-visible pb-2 md:pb-0 mb-4 md:mb-0 shrink-0 border-b border-slate-800 md:border-none">
                        <button
                            onClick={() => setActiveTab('browse')}
                            className={`text-center md:text-left px-4 py-3 rounded-xl font-bold text-sm transition-all whitespace-nowrap ${activeTab === 'browse' ? 'bg-pink-600 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}
                        >
                            Browse
                        </button>
                        <button
                            onClick={() => setActiveTab('my-mixes')}
                            className={`text-center md:text-left px-4 py-3 rounded-xl font-bold text-sm transition-all whitespace-nowrap ${activeTab === 'my-mixes' ? 'bg-pink-600 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}
                        >
                            My Collection
                        </button>

                        <button
                            onClick={() => setActiveTab('leaderboard')}
                            className={`text-center md:text-left px-4 py-3 rounded-xl font-bold text-sm transition-all flex items-center justify-center md:justify-start gap-2 whitespace-nowrap ${activeTab === 'leaderboard' ? 'bg-pink-600 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}
                        >
                            <Trophy size={16} /> Leaderboard
                        </button>
                    </div>

                    <div className="hidden md:block">
                        <h4 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-2 mt-4">Publish Mix</h4>
                        <p className="text-xs text-slate-400 mb-3">Share your current soundscape with the world.</p>
                        <input
                            className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-white mb-2 outline-none focus:border-pink-500"
                            placeholder="Mix Name"
                            value={pubName}
                            onChange={e => setPubName(e.target.value)}
                        />
                        <textarea
                            className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-white mb-2 outline-none focus:border-pink-500 h-16 resize-none"
                            placeholder="Description (optional)"
                            value={pubDesc}
                            onChange={e => setPubDesc(e.target.value)}
                        />
                        <button
                            onClick={handlePublish}
                            disabled={isPublishing || !currentLayers}
                            className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2"
                        >
                            {isPublishing ? <Loader2 className="animate-spin" size={12} /> : <UploadCloud size={12} />}
                            Publish
                        </button>
                    </div>
                </div>


                {/* Main Content */}
                <div className="flex-1 flex flex-col bg-slate-900 relative overflow-hidden">
                    <button onClick={onClose} className="absolute top-4 right-4 text-slate-500 hover:text-white z-20 bg-slate-800 md:bg-transparent rounded-full p-2 md:p-0 shadow-lg md:shadow-none">
                        <X size={20} className="md:w-6 md:h-6" />
                    </button>

                    <div className="p-6 md:p-8 pb-0 shrink-0">
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-4 md:mb-6 gap-4">
                            <div className="pr-10">
                                <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight">
                                    {activeTab === 'browse' ? 'Discover Soundscapes' : 'My Mixes'}
                                </h1>
                                <p className="text-slate-400 mt-1">
                                    {activeTab === 'browse' ? 'Explore creations from the community.' : 'Manage your published mixes.'}
                                </p>
                            </div>

                            {activeTab === 'browse' && (
                                <div className="flex bg-slate-950 rounded-xl p-1 border border-slate-800">
                                    <button
                                        onClick={() => setFilter('popular')}
                                        className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${filter === 'popular' ? 'bg-slate-800 text-white' : 'text-slate-500 hover:text-slate-300'}`}
                                    >
                                        Popular
                                    </button>
                                    <button
                                        onClick={() => setFilter('new')}
                                        className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${filter === 'new' ? 'bg-slate-800 text-white' : 'text-slate-500 hover:text-slate-300'}`}
                                    >
                                        Newest
                                    </button>
                                </div>
                            )}
                        </div>

                        <div className="relative mb-4 md:mb-6">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                            <input
                                className="w-full bg-slate-950 border border-slate-800 rounded-2xl py-3 md:py-4 pl-12 pr-4 text-sm md:text-base text-white focus:border-pink-500 outline-none transition-all"
                                placeholder="Search specifically for..."
                            />
                        </div>
                    </div>

                    {
                        activeTab !== 'leaderboard' && (
                            <div className="flex-1 overflow-y-auto p-4 md:p-8 pt-0 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 align-start content-start pb-24 md:pb-8">
                                {loading ? (
                                    <div className="col-span-full flex justify-center py-20">
                                        <Loader2 className="animate-spin text-pink-500" size={40} />
                                    </div>
                                ) : presets.length === 0 ? (
                                    <div className="col-span-full text-center py-20 text-slate-500 italic">
                                        No mixes found. Be the first to publish one!
                                    </div>
                                ) : (
                                    presets.map(preset => (
                                        <div key={preset.id} className="bg-slate-950/50 border border-slate-800 hover:border-pink-500/50 rounded-3xl p-6 group transition-all hover:bg-slate-900 flex flex-col">
                                            <div className="flex justify-between items-start mb-4">
                                                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-lg">
                                                    <Music size={20} />
                                                </div>
                                                {preset.is_premium && (
                                                    <span className="bg-gradient-to-r from-amber-200 to-yellow-400 text-amber-900 text-[10px] font-black px-2 py-1 rounded-full uppercase tracking-widest">
                                                        Premium
                                                    </span>
                                                )}
                                            </div>

                                            <div className="mb-4 flex-1">
                                                <h3 className="font-bold text-white text-lg leading-tight mb-1 group-hover:text-pink-400 transition-colors">{preset.name}</h3>
                                                <p className="text-xs text-slate-500 line-clamp-2">{preset.description || 'No description provided.'}</p>
                                            </div>

                                            <div className="flex items-center gap-2 mb-6">
                                                <div className="w-6 h-6 rounded-full bg-slate-800 border border-slate-700 overflow-hidden">
                                                    {preset.creator?.avatar_url ? (
                                                        <img src={preset.creator.avatar_url} className="w-full h-full object-cover" />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center text-[10px] font-bold text-slate-400">
                                                            {preset.creator?.full_name?.[0] || '?'}
                                                        </div>
                                                    )}
                                                </div>
                                                <span className="text-xs font-medium text-slate-400">{preset.creator?.full_name || 'Unknown User'}</span>
                                            </div>

                                            <div className="flex items-center justify-between pt-4 border-t border-slate-800">
                                                <div className="flex gap-4 text-xs font-bold text-slate-500">
                                                    <button className="flex items-center gap-1 hover:text-pink-500 transition-colors">
                                                        <Heart size={14} /> {preset.likes_count}
                                                    </button>
                                                    <button className="flex items-center gap-1 hover:text-indigo-400 transition-colors">
                                                        <Download size={14} /> {preset.downloads_count}
                                                    </button>
                                                </div>

                                                <button
                                                    onClick={() => {
                                                        onLoadPreset(preset.layers);
                                                        showNotification('success', `Loaded "${preset.name}"`);
                                                    }}
                                                    className="w-10 h-10 rounded-xl bg-slate-800 hover:bg-pink-600 text-white flex items-center justify-center transition-all shadow-lg"
                                                    title="Load Mix"
                                                >
                                                    <PlayCircle size={20} />
                                                </button>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        )
                    }

                    {
                        activeTab === 'leaderboard' && (
                            <div className="flex-1 overflow-hidden p-0 md:p-8 pb-20 md:pb-8">
                                <StreakLeaderboard currentUserId={user?.id} />
                            </div>
                        )
                    }
                </div>
            </div>
        </div >
    );
};
