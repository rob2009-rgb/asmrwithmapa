import React, { useState, useEffect, useRef } from 'react';
import { HelpCircle, X, ChevronRight, Search, BookOpen, Loader } from 'lucide-react';
import { supabase } from '../../supabaseClient';

// Map of context keys → search tags/terms used to fetch relevant articles
const CONTEXT_TAGS: Record<string, string[]> = {
    audio: ['audio', 'sound', 'playback', 'buffering', 'headphones'],
    account: ['login', 'password', 'account', 'sign in', 'access'],
    billing: ['billing', 'payment', 'subscription', 'charge', 'cancel', 'premium'],
    features: ['premium', 'mind vault', 'listen party', 'journal', 'features'],
    general: ['error', 'slow', 'crash', 'broken', 'not working'],
};

interface HelpArticle {
    id: string;
    title: string;
    slug: string;
    content: string;
    category: string;
    tags: string[] | null;
    view_count: number;
}

interface ContextualHelpProps {
    /** One of the keys in CONTEXT_TAGS, or 'general' as fallback */
    context?: keyof typeof CONTEXT_TAGS;
    /** Position on screen — only used in floating-bubble (uncontrolled) mode */
    position?: 'bottom-right' | 'bottom-left';
    /** Called when user clicks "Contact Support" */
    onContactSupport?: () => void;
    /** Called when user wants to open the full Help Center */
    onOpenHelpCenter?: () => void;
    isNightMode?: boolean;
    /**
     * CONTROLLED MODE — when provided the component renders only the
     * expanded panel (no floating trigger button). Ideal for embedding
     * inside an existing surface like the player toolbar.
     */
    isOpen?: boolean;
    onClose?: () => void;
}

const ContextualHelp: React.FC<ContextualHelpProps> = ({
    context = 'general',
    position = 'bottom-right',
    onContactSupport,
    onOpenHelpCenter,
    isNightMode = true,
    isOpen: controlledIsOpen,
    onClose: controlledOnClose,
}) => {
    // Whether we are in controlled mode (parent drives open/close)
    const isControlled = controlledIsOpen !== undefined;

    // Internal state for uncontrolled (floating) mode
    const [internalOpen, setInternalOpen] = useState(false);

    const isOpen = isControlled ? controlledIsOpen! : internalOpen;

    const handleClose = () => {
        setSelectedArticle(null);
        setSearchQuery('');
        if (isControlled) {
            controlledOnClose?.();
        } else {
            setInternalOpen(false);
        }
    };

    const [articles, setArticles] = useState<HelpArticle[]>([]);
    const [selectedArticle, setSelectedArticle] = useState<HelpArticle | null>(null);
    const [loading, setLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<HelpArticle[] | null>(null);
    const [searching, setSearching] = useState(false);
    const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Load articles relevant to context when widget opens
    useEffect(() => {
        if (isOpen && articles.length === 0) {
            loadContextArticles();
        }
    }, [isOpen]);

    // Live search debounce
    useEffect(() => {
        if (searchTimeout.current) clearTimeout(searchTimeout.current);
        if (!searchQuery.trim()) {
            setSearchResults(null);
            return;
        }
        setSearching(true);
        searchTimeout.current = setTimeout(() => {
            handleSearch(searchQuery);
        }, 350);
        return () => {
            if (searchTimeout.current) clearTimeout(searchTimeout.current);
        };
    }, [searchQuery]);

    const loadContextArticles = async () => {
        setLoading(true);
        const tags = CONTEXT_TAGS[context] || CONTEXT_TAGS.general;

        const { data } = await supabase
            .from('help_articles')
            .select('id, title, slug, content, category, tags, view_count')
            .eq('is_published', true)
            .overlaps('tags', tags)
            .order('view_count', { ascending: false })
            .limit(4);

        if (data && data.length > 0) {
            setArticles(data as HelpArticle[]);
        } else {
            const { data: fallback } = await supabase
                .from('help_articles')
                .select('id, title, slug, content, category, tags, view_count')
                .eq('is_published', true)
                .order('view_count', { ascending: false })
                .limit(4);
            setArticles((fallback as HelpArticle[]) || []);
        }
        setLoading(false);
    };

    const handleSearch = async (query: string) => {
        const { data } = await supabase
            .from('help_articles')
            .select('id, title, slug, content, category, tags, view_count')
            .eq('is_published', true)
            .or(`title.ilike.%${query}%,content.ilike.%${query}%`)
            .limit(5);
        setSearchResults((data as HelpArticle[]) || []);
        setSearching(false);
    };

    const handleArticleClick = async (article: HelpArticle) => {
        setSelectedArticle(article);
        setSearchQuery('');
        setSearchResults(null);
        const { data } = await supabase
            .from('help_articles')
            .select('view_count')
            .eq('id', article.id)
            .single();
        if (data) {
            await supabase
                .from('help_articles')
                .update({ view_count: (data.view_count || 0) + 1 })
                .eq('id', article.id);
        }
    };

    const displayedArticles = searchResults ?? articles;

    // ── Shared panel body ──────────────────────────────────────────────────────
    const PanelBody = () => (
        <>
            {/* Header */}
            <div className={`p-4 border-b flex items-center justify-between ${isNightMode ? 'border-slate-800 bg-slate-950' : 'border-slate-100 bg-slate-50'}`}>
                {selectedArticle ? (
                    <button
                        onClick={() => setSelectedArticle(null)}
                        className={`flex items-center gap-1.5 text-xs font-bold transition-colors ${isNightMode ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-slate-800'}`}
                    >
                        <ChevronRight size={14} className="rotate-180" /> Back
                    </button>
                ) : (
                    <div className="flex items-center gap-2">
                        <BookOpen size={16} className="text-purple-400" />
                        <span className={`font-bold text-sm ${isNightMode ? 'text-white' : 'text-slate-800'}`}>
                            Help &amp; Support
                        </span>
                    </div>
                )}
                <button
                    onClick={handleClose}
                    className={`p-1 rounded-lg transition-colors ${isNightMode ? 'text-slate-500 hover:text-white hover:bg-slate-800' : 'text-slate-400 hover:text-slate-700 hover:bg-slate-100'}`}
                >
                    <X size={16} />
                </button>
            </div>

            {/* Content */}
            {selectedArticle ? (
                <div className="flex-1 overflow-y-auto p-4">
                    <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded ${isNightMode ? 'bg-slate-800 text-slate-400' : 'bg-slate-100 text-slate-500'}`}>
                        {selectedArticle.category}
                    </span>
                    <h3 className={`font-bold mt-2 mb-3 text-sm leading-snug ${isNightMode ? 'text-white' : 'text-slate-800'}`}>
                        {selectedArticle.title}
                    </h3>
                    <div
                        className={`text-xs leading-relaxed whitespace-pre-wrap ${isNightMode ? 'text-slate-300' : 'text-slate-600'}`}
                        style={{ maxHeight: '200px', overflowY: 'auto' }}
                    >
                        {selectedArticle.content}
                    </div>
                    <div className={`mt-4 pt-4 border-t flex flex-col gap-2 ${isNightMode ? 'border-slate-800' : 'border-slate-100'}`}>
                        <p className={`text-[11px] ${isNightMode ? 'text-slate-500' : 'text-slate-400'}`}>Still need help?</p>
                        <div className="flex gap-2">
                            {onContactSupport && (
                                <button onClick={() => { handleClose(); onContactSupport(); }} className="flex-1 py-2 bg-pink-600 hover:bg-pink-700 text-white text-xs font-bold rounded-lg transition-colors">
                                    Contact Support
                                </button>
                            )}
                            {onOpenHelpCenter && (
                                <button onClick={() => { handleClose(); onOpenHelpCenter(); }} className={`flex-1 py-2 text-xs font-bold rounded-lg border transition-colors ${isNightMode ? 'border-slate-700 text-slate-300 hover:bg-slate-800' : 'border-slate-200 text-slate-600 hover:bg-slate-50'}`}>
                                    Full Help Center
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            ) : (
                <>
                    {/* Search */}
                    <div className={`p-3 border-b ${isNightMode ? 'border-slate-800' : 'border-slate-100'}`}>
                        <div className="relative">
                            <Search className={`absolute left-3 top-1/2 -translate-y-1/2 ${isNightMode ? 'text-slate-500' : 'text-slate-400'}`} size={14} />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                                placeholder="Search for help..."
                                className={`w-full text-xs pl-8 pr-3 py-2 rounded-lg outline-none border transition-all ${isNightMode
                                    ? 'bg-slate-800 border-slate-700 text-white placeholder:text-slate-500 focus:border-purple-500'
                                    : 'bg-slate-100 border-transparent text-slate-800 placeholder:text-slate-400 focus:border-purple-400'
                                    }`}
                            />
                            {searching && <Loader size={12} className="absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-slate-500" />}
                        </div>
                    </div>

                    {/* Article list */}
                    <div className="flex-1 overflow-y-auto">
                        {loading ? (
                            <div className={`p-6 text-center text-xs ${isNightMode ? 'text-slate-500' : 'text-slate-400'}`}>
                                <Loader size={16} className="animate-spin inline mr-2" />Loading…
                            </div>
                        ) : displayedArticles.length > 0 ? (
                            <div className="p-2 space-y-1">
                                {!searchQuery && (
                                    <p className={`text-[10px] font-bold uppercase tracking-widest px-2 py-1 ${isNightMode ? 'text-slate-600' : 'text-slate-400'}`}>
                                        Suggested for you
                                    </p>
                                )}
                                {displayedArticles.map(article => (
                                    <button
                                        key={article.id}
                                        onClick={() => handleArticleClick(article)}
                                        className={`w-full text-left px-3 py-2.5 rounded-xl flex items-center gap-2 group transition-all ${isNightMode
                                            ? 'hover:bg-slate-800 text-slate-300 hover:text-white'
                                            : 'hover:bg-slate-50 text-slate-700 hover:text-slate-900'
                                            }`}
                                    >
                                        <span className="flex-1 text-xs font-semibold line-clamp-2 leading-snug">{article.title}</span>
                                        <ChevronRight size={14} className={`shrink-0 transition-transform group-hover:translate-x-0.5 ${isNightMode ? 'text-slate-600' : 'text-slate-300'}`} />
                                    </button>
                                ))}
                            </div>
                        ) : searchResults !== null ? (
                            <div className={`p-6 text-center text-xs ${isNightMode ? 'text-slate-500' : 'text-slate-400'}`}>
                                No articles found for "{searchQuery}".
                            </div>
                        ) : null}
                    </div>

                    {/* Footer */}
                    <div className={`p-3 border-t flex gap-2 ${isNightMode ? 'border-slate-800' : 'border-slate-100'}`}>
                        {onContactSupport && (
                            <button onClick={() => { handleClose(); onContactSupport(); }} className="flex-1 py-2 bg-pink-600 hover:bg-pink-700 text-white text-xs font-bold rounded-lg transition-colors">
                                Contact Support
                            </button>
                        )}
                        {onOpenHelpCenter && (
                            <button onClick={() => { handleClose(); onOpenHelpCenter(); }} className={`flex-1 py-2 text-xs font-bold rounded-lg border transition-colors ${isNightMode ? 'border-slate-700 text-slate-300 hover:bg-slate-800' : 'border-slate-200 text-slate-600 hover:bg-slate-50'}`}>
                                Help Center
                            </button>
                        )}
                    </div>
                </>
            )}
        </>
    );

    // ── CONTROLLED MODE: render the panel inline (no fixed positioning) ────────
    if (isControlled) {
        if (!isOpen) return null;
        return (
            <div
                className={`w-80 rounded-2xl shadow-2xl border flex flex-col overflow-hidden animate-in slide-in-from-bottom-4 fade-in duration-200 ${isNightMode ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-200'}`}
                style={{ maxHeight: '420px' }}
            >
                <PanelBody />
            </div>
        );
    }

    // ── UNCONTROLLED (FLOATING BUBBLE) MODE ───────────────────────────────────
    const positionClass = position === 'bottom-left' ? 'left-6' : 'right-6';

    return (
        <div className={`fixed bottom-6 ${positionClass} z-[90]`}>
            {/* Trigger button */}
            {!isOpen && (
                <button
                    onClick={() => setInternalOpen(true)}
                    title="Get Help"
                    className={`w-12 h-12 rounded-full flex items-center justify-center shadow-2xl transition-all duration-300 hover:scale-110 active:scale-95 ${isNightMode
                        ? 'bg-purple-600 hover:bg-purple-500 text-white shadow-purple-900/50'
                        : 'bg-purple-500 hover:bg-purple-600 text-white shadow-purple-400/40'
                        }`}
                >
                    <HelpCircle size={22} />
                </button>
            )}

            {/* Expanded panel */}
            {isOpen && (
                <div
                    className={`w-80 rounded-2xl shadow-2xl border flex flex-col overflow-hidden animate-in slide-in-from-bottom-4 fade-in duration-200 ${isNightMode ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-200'}`}
                    style={{ maxHeight: '480px' }}
                >
                    <PanelBody />
                </div>
            )}
        </div>
    );
};

export default ContextualHelp;
