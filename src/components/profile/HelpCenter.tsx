import React, { useState, useEffect } from 'react';
import { Search, Book, ChevronRight, ThumbsUp, ThumbsDown, ArrowLeft, Loader, HelpCircle } from 'lucide-react';
import { supabase } from '../../supabaseClient';
import { Database } from '../../db_types';

type HelpArticle = Database['public']['Tables']['help_articles']['Row'];

const HelpCenter: React.FC<{ onContactSupport: () => void }> = ({ onContactSupport }) => {
    const [view, setView] = useState<'home' | 'article'>('home');
    const [articles, setArticles] = useState<HelpArticle[]>([]);
    const [filteredArticles, setFilteredArticles] = useState<HelpArticle[]>([]);
    const [selectedArticle, setSelectedArticle] = useState<HelpArticle | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(false);
    const [categories, setCategories] = useState<string[]>([]);
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
    const [hasVoted, setHasVoted] = useState(false);

    useEffect(() => {
        loadArticles();
    }, []);

    useEffect(() => {
        filterArticles();
    }, [searchQuery, selectedCategory, articles]);

    const loadArticles = async () => {
        setLoading(true);
        const { data } = await supabase
            .from('help_articles')
            .select('*')
            .eq('is_published', true)
            .order('view_count', { ascending: false });

        if (data) {
            setArticles((data as any) || []);
            // Extract unique categories
            const cats = Array.from(new Set(data.map((a: any) => a.category)));
            setCategories(cats as string[]);
        }
        setLoading(false);
    };

    const filterArticles = () => {
        let filtered = articles;

        if (selectedCategory) {
            filtered = filtered.filter(a => a.category === selectedCategory);
        }

        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            filtered = filtered.filter(a =>
                a.title.toLowerCase().includes(query) ||
                a.content.toLowerCase().includes(query) ||
                a.tags?.some(tag => tag.toLowerCase().includes(query))
            );
        }

        setFilteredArticles(filtered);
    };

    const handleArticleClick = async (article: HelpArticle) => {
        setSelectedArticle(article);
        setView('article');
        setHasVoted(false);
        // Increment view count
        const { data } = await supabase.from('help_articles').select('view_count').eq('id', article.id).single();
        if (data) {
            await supabase.from('help_articles').update({ view_count: (data.view_count || 0) + 1 }).eq('id', article.id);
        }
    };

    const handleVote = async (isHelpful: boolean) => {
        if (!selectedArticle || hasVoted) return;
        setHasVoted(true);

        const { data } = await supabase.from('help_articles').select('helpful_count, not_helpful_count').eq('id', selectedArticle.id).single();
        if (!data) return;

        if (isHelpful) {
            await supabase.from('help_articles').update({ helpful_count: (data.helpful_count || 0) + 1 }).eq('id', selectedArticle.id);
        } else {
            await supabase.from('help_articles').update({ not_helpful_count: (data.not_helpful_count || 0) + 1 }).eq('id', selectedArticle.id);
        }
    };

    return (
        <div className="h-full flex flex-col bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl">
            {/* Header */}
            <div className="p-6 border-b border-slate-800 bg-slate-950">
                <div className="flex items-center gap-3 mb-4">
                    {view === 'article' && (
                        <button onClick={() => setView('home')} className="p-2 hover:bg-slate-800 rounded-lg text-slate-400">
                            <ArrowLeft size={20} />
                        </button>
                    )}
                    <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                        <Book className="text-purple-500" /> Help Center
                    </h2>
                </div>

                {view === 'home' && (
                    <div className="relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={20} />
                        <input
                            type="text"
                            placeholder="Search for answers..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-slate-800 text-white pl-12 pr-4 py-3 rounded-xl outline-none border border-transparent focus:border-purple-500 transition-all font-bold"
                        />
                    </div>
                )}
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto">
                {view === 'home' ? (
                    <div className="p-6 space-y-8">
                        {/* Categories */}
                        {!searchQuery && (
                            <div>
                                <h3 className="text-xs font-bold text-slate-500 uppercase mb-3">Browse by Category</h3>
                                <div className="flex flex-wrap gap-2">
                                    <button
                                        onClick={() => setSelectedCategory(null)}
                                        className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${!selectedCategory ? 'bg-purple-600 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                                            }`}
                                    >
                                        All
                                    </button>
                                    {categories.map(cat => (
                                        <button
                                            key={cat}
                                            onClick={() => setSelectedCategory(cat)}
                                            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${selectedCategory === cat ? 'bg-purple-600 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                                                }`}
                                        >
                                            {cat}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Articles List */}
                        <div>
                            <h3 className="text-xs font-bold text-slate-500 uppercase mb-3">
                                {searchQuery ? 'Search Results' : 'Popular Articles'}
                            </h3>
                            {loading ? (
                                <div className="text-center py-8 text-slate-500"><Loader className="animate-spin inline mr-2" /> Loading...</div>
                            ) : (
                                <div className="space-y-2">
                                    {filteredArticles.length > 0 ? (
                                        filteredArticles.map(article => (
                                            <button
                                                key={article.id}
                                                onClick={() => handleArticleClick(article)}
                                                className="w-full text-left p-4 bg-slate-800/50 hover:bg-slate-800 rounded-xl border border-slate-700/50 hover:border-slate-600 transition-all flex justify-between items-center group"
                                            >
                                                <div>
                                                    <h4 className="font-bold text-white mb-1 group-hover:text-purple-400 transition-colors">{article.title}</h4>
                                                    <p className="text-xs text-slate-400">{article.category} • {article.view_count} views</p>
                                                </div>
                                                <ChevronRight className="text-slate-600 group-hover:text-white transition-colors" size={20} />
                                            </button>
                                        ))
                                    ) : (
                                        <div className="text-center py-12 bg-slate-800/20 rounded-2xl border border-dashed border-slate-800">
                                            <HelpCircle size={48} className="text-slate-700 mx-auto mb-4" />
                                            <p className="text-slate-400 font-bold mb-4">No articles found.</p>
                                            <button
                                                onClick={onContactSupport}
                                                className="px-6 py-2 bg-pink-600 hover:bg-pink-700 text-white font-bold rounded-lg transition-colors"
                                            >
                                                Contact Support
                                            </button>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                ) : (
                    selectedArticle && (
                        <div className="p-6">
                            <div className="max-w-2xl mx-auto">
                                <span className="inline-block px-3 py-1 bg-slate-800 text-slate-400 rounded-full text-xs font-bold mb-4">
                                    {selectedArticle.category}
                                </span>
                                <h1 className="text-3xl font-bold text-white mb-8">{selectedArticle.title}</h1>

                                <div className="prose prose-invert prose-slate max-w-none mb-12">
                                    <div className="whitespace-pre-wrap text-slate-300 leading-relaxed font-medium">
                                        {selectedArticle.content}
                                    </div>
                                </div>

                                {/* Feedback */}
                                <div className="bg-slate-800/50 rounded-2xl p-6 border border-slate-700 text-center">
                                    <h4 className="font-bold text-white mb-4">Was this article helpful?</h4>
                                    <div className="flex justify-center gap-4">
                                        <button
                                            onClick={() => handleVote(true)}
                                            disabled={hasVoted}
                                            className={`px-6 py-3 rounded-xl font-bold flex items-center gap-2 transition-all ${hasVoted ? 'opacity-50 cursor-not-allowed bg-slate-700' : 'bg-slate-700 hover:bg-green-600/20 hover:text-green-400 text-slate-300'
                                                }`}
                                        >
                                            <ThumbsUp size={18} /> Yes
                                        </button>
                                        <button
                                            onClick={() => handleVote(false)}
                                            disabled={hasVoted}
                                            className={`px-6 py-3 rounded-xl font-bold flex items-center gap-2 transition-all ${hasVoted ? 'opacity-50 cursor-not-allowed bg-slate-700' : 'bg-slate-700 hover:bg-red-600/20 hover:text-red-400 text-slate-300'
                                                }`}
                                        >
                                            <ThumbsDown size={18} /> No
                                        </button>
                                    </div>
                                </div>

                                <div className="mt-12 text-center pt-8 border-t border-slate-800">
                                    <p className="text-slate-400 mb-4">Still need help?</p>
                                    <button
                                        onClick={onContactSupport}
                                        className="px-8 py-3 bg-pink-600 hover:bg-pink-700 text-white font-bold rounded-xl transition-colors shadow-lg shadow-pink-900/20"
                                    >
                                        Contact Support
                                    </button>
                                </div>
                            </div>
                        </div>
                    )
                )}
            </div>
        </div>
    );
};

export default HelpCenter;
