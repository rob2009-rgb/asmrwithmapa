import React, { useState, useEffect } from 'react';
import { Book, Plus, Search, Edit, Eye, Trash2, CheckCircle, XCircle, Save, Loader, ArrowLeft, Clock } from 'lucide-react';
import { supabase } from '../../src/supabaseClient';
import { Database } from '../../src/db_types';

type Article = Database['public']['Tables']['help_articles']['Row']; // We need to add this to db_types later, but we can infer for now if needed or just use any/interface

// Temporary Interface until db_types is updated (or we can update db_types now)
interface HelpArticle {
    id: string;
    title: string;
    slug: string;
    content: string;
    category: string;
    is_published: boolean;
    view_count: number;
    helpful_count: number;
    updated_at: string;
}

const KnowledgeBasePanel: React.FC = () => {
    const [articles, setArticles] = useState<HelpArticle[]>([]);
    const [loading, setLoading] = useState(false);
    const [view, setView] = useState<'list' | 'editor'>('list');
    const [editingId, setEditingId] = useState<string | null>(null);

    // Editor State
    const [formData, setFormData] = useState({
        title: '',
        slug: '',
        category: 'General',
        content: '',
        is_published: false
    });

    useEffect(() => {
        loadArticles();
    }, []);

    const loadArticles = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('help_articles')
            .select('*')
            .order('updated_at', { ascending: false });

        if (!error) setArticles((data as any) || []);
        setLoading(false);
    };

    const handleEdit = (article: HelpArticle) => {
        setEditingId(article.id);
        setFormData({
            title: article.title,
            slug: article.slug,
            category: article.category,
            content: article.content,
            is_published: article.is_published
        });
        setView('editor');
    };

    const handleCreate = () => {
        setEditingId(null);
        setFormData({
            title: '',
            slug: '',
            category: 'General',
            content: '',
            is_published: false
        });
        setView('editor');
    };

    const handleSave = async () => {
        // Auto-generate slug if empty
        let slugToSave = formData.slug;
        if (!slugToSave) {
            slugToSave = formData.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
        }

        const payload = {
            title: formData.title,
            slug: slugToSave,
            category: formData.category,
            content: formData.content,
            is_published: formData.is_published,
            updated_at: new Date().toISOString()
        };

        let error;
        if (editingId) {
            const { error: updateError } = await supabase
                .from('help_articles')
                .update(payload)
                .eq('id', editingId);
            error = updateError;
        } else {
            const { error: insertError } = await supabase
                .from('help_articles')
                .insert([payload]);
            error = insertError;
        }

        if (error) {
            alert('Error saving article: ' + error.message);
        } else {
            setView('list');
            loadArticles();
        }
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm('Are you sure you want to delete this article?')) return;

        const { error } = await supabase
            .from('help_articles')
            .delete()
            .eq('id', id);

        if (!error) loadArticles();
    };

    return (
        <div className="flex flex-col h-[600px] bg-white dark:bg-slate-900 rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700 shadow-xl">
            {/* Header */}
            <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-slate-800">
                <div className="flex items-center gap-2">
                    <Book className="text-purple-500" />
                    <h2 className="font-bold text-lg dark:text-white">Knowledge Base</h2>
                </div>
                {view === 'list' && (
                    <button
                        onClick={handleCreate}
                        className="flex items-center gap-2 px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm font-bold transition-colors"
                    >
                        <Plus size={16} /> New Article
                    </button>
                )}
                {view === 'editor' && (
                    <button
                        onClick={() => setView('list')}
                        className="text-gray-500 hover:text-gray-700 dark:text-gray-400"
                    >
                        <XCircle />
                    </button>
                )}
            </div>

            <div className="flex-1 overflow-hidden p-0">
                {view === 'list' ? (
                    <div className="h-full overflow-y-auto p-4">
                        {loading ? (
                            <div className="text-center py-8 text-gray-500"><Loader className="animate-spin inline mr-2" /> Loading...</div>
                        ) : (
                            <table className="w-full text-left text-sm">
                                <thead className="text-gray-500 border-b border-gray-200 dark:border-gray-700">
                                    <tr>
                                        <th className="pb-2 pl-2">Title</th>
                                        <th className="pb-2">Category</th>
                                        <th className="pb-2">Status</th>
                                        <th className="pb-2">Views</th>
                                        <th className="pb-2 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                                    {articles.map(article => (
                                        <tr key={article.id} className="hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors">
                                            <td className="py-3 pl-2 font-medium">{article.title}</td>
                                            <td className="py-3 text-gray-500">{article.category}</td>
                                            <td className="py-3">
                                                {article.is_published ? (
                                                    <span className="px-2 py-0.5 rounded-full bg-green-100 text-green-700 text-xs font-bold flex items-center gap-1 w-fit">
                                                        <CheckCircle size={10} /> Published
                                                    </span>
                                                ) : (
                                                    <span className="px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-700 text-xs font-bold flex items-center gap-1 w-fit">
                                                        <Clock size={10} /> Draft
                                                    </span>
                                                )}
                                            </td>
                                            <td className="py-3 text-gray-500">{article.view_count}</td>
                                            <td className="py-3 text-right">
                                                <div className="flex justify-end gap-2">
                                                    <button onClick={() => handleEdit(article)} className="p-1.5 text-blue-500 hover:bg-blue-50 rounded"><Edit size={16} /></button>
                                                    <button onClick={() => handleDelete(article.id)} className="p-1.5 text-red-500 hover:bg-red-50 rounded"><Trash2 size={16} /></button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                    {articles.length === 0 && (
                                        <tr>
                                            <td colSpan={5} className="py-8 text-center text-gray-400 italic">No articles found. Create one to get started.</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        )}
                    </div>
                ) : (
                    <div className="h-full flex flex-col md:flex-row overflow-hidden">
                        {/* Editor Column */}
                        <div className="flex-1 flex flex-col p-6 overflow-y-auto border-r border-gray-200 dark:border-gray-700">
                            <h3 className="font-bold text-lg mb-4">{editingId ? 'Edit Article' : 'New Article'}</h3>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Title</label>
                                    <input
                                        className="w-full p-2 border rounded-lg dark:bg-slate-800 dark:border-slate-700"
                                        value={formData.title}
                                        onChange={e => setFormData({ ...formData, title: e.target.value })}
                                        placeholder="How to reset password"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Category</label>
                                        <select
                                            className="w-full p-2 border rounded-lg dark:bg-slate-800 dark:border-slate-700"
                                            value={formData.category}
                                            onChange={e => setFormData({ ...formData, category: e.target.value })}
                                        >
                                            <option>General</option>
                                            <option>Billing</option>
                                            <option>Account</option>
                                            <option>Technical</option>
                                            <option>Mobile App</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Slug (Optional)</label>
                                        <input
                                            className="w-full p-2 border rounded-lg dark:bg-slate-800 dark:border-slate-700 text-gray-500"
                                            value={formData.slug}
                                            onChange={e => setFormData({ ...formData, slug: e.target.value })}
                                            placeholder="how-to-reset-password"
                                        />
                                    </div>
                                </div>

                                <div className="flex-1 flex flex-col">
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Content (Markdown)</label>
                                    <textarea
                                        className="flex-1 min-h-[300px] p-4 border rounded-lg font-mono text-sm dark:bg-slate-800 dark:border-slate-700 focus:ring-2 focus:ring-purple-500 outline-none resize-none"
                                        value={formData.content}
                                        onChange={e => setFormData({ ...formData, content: e.target.value })}
                                        placeholder="# Heading\n\nWrite your article here..."
                                    />
                                </div>

                                <div className="flex items-center justify-between pt-4 border-t border-gray-100 dark:border-gray-800">
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={formData.is_published}
                                            onChange={e => setFormData({ ...formData, is_published: e.target.checked })}
                                            className="w-4 h-4 rounded text-purple-600"
                                        />
                                        <span className="text-sm font-bold">Publish immediately</span>
                                    </label>

                                    <div className="flex gap-2">
                                        <button onClick={() => setView('list')} className="px-4 py-2 text-gray-500 hover:text-gray-700 font-bold text-sm">Cancel</button>
                                        <button
                                            onClick={handleSave}
                                            disabled={!formData.title || !formData.content}
                                            className="px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-bold text-sm flex items-center gap-2 disabled:opacity-50"
                                        >
                                            <Save size={16} /> Save Article
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Preview Column */}
                        <div className="w-1/3 bg-gray-50 dark:bg-slate-900/50 border-l border-gray-200 dark:border-gray-700 p-6 overflow-y-auto hidden md:block">
                            <h3 className="text-xs font-bold text-gray-400 uppercase mb-4 flex items-center gap-2"><Eye size={14} /> Live Preview</h3>
                            <article className="prose prose-sm dark:prose-invert max-w-none">
                                <h1 className="text-2xl font-bold mb-4">{formData.title || 'Article Title'}</h1>
                                <div className="whitespace-pre-wrap">{formData.content || 'Start writing to see preview...'}</div>
                            </article>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default KnowledgeBasePanel;
