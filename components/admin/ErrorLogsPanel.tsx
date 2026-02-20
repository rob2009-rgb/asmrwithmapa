import React, { useState, useEffect } from 'react';
import { Loader, ChevronRight, CheckCircle, XCircle, AlertTriangle, Activity } from 'lucide-react';
import { supabase } from '../../src/supabaseClient';

type ErrorLog = {
    id: string;
    error_message: string;
    stack_trace: string;
    severity: 'info' | 'warning' | 'error' | 'critical';
    context: any;
    resolved: boolean;
    created_at: string;
    user_id: string | null;
};

const ErrorLogsPanel: React.FC = () => {
    const [errorLogs, setErrorLogs] = useState<ErrorLog[]>([]);
    const [selectedError, setSelectedError] = useState<ErrorLog | null>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        loadErrorLogs();
    }, []);

    const loadErrorLogs = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('error_logs')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            setErrorLogs(data || []);
        } catch (error) {
            console.error('Error loading logs:', error);
        } finally {
            setLoading(false);
        }
    };

    const resolveError = async (logId: string) => {
        if (!confirm('Mark this error as resolved?')) return;
        try {
            await supabase.from('error_logs').update({ resolved: true }).eq('id', logId);
            loadErrorLogs();
            if (selectedError?.id === logId) setSelectedError(null);
        } catch (e) {
            console.error(e);
        }
    };

    return (
        <div className="flex flex-col h-[600px] bg-white dark:bg-slate-900 rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700 shadow-xl">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center gap-2">
                <Activity className="text-red-500" />
                <h2 className="font-bold text-lg dark:text-white">System Error Logs</h2>
            </div>

            <div className="flex flex-1 overflow-hidden">
                {/* LIST COLUMN */}
                <div className={`w-1/3 border-r border-gray-200 dark:border-gray-700 overflow-y-auto ${selectedError ? 'hidden md:block' : 'block'}`}>
                    {loading ? <div className="p-4 text-center text-gray-500"><Loader className="animate-spin inline mr-2" /> Loading...</div> : (
                        <div className="divide-y divide-gray-100 dark:divide-gray-800">
                            {errorLogs.map(e => (
                                <div
                                    key={e.id}
                                    onClick={() => setSelectedError(e)}
                                    className={`p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors ${selectedError?.id === e.id ? 'bg-red-50 dark:bg-slate-800 border-l-4 border-red-500' : ''}`}
                                >
                                    <div className="flex justify-between mb-1">
                                        <span className={`text-xs font-bold px-2 py-0.5 rounded uppercase ${e.severity === 'critical' ? 'bg-red-600 text-white' : e.severity === 'error' ? 'bg-red-100 text-red-600' : 'bg-yellow-100 text-yellow-600'}`}>{e.severity}</span>
                                        <span className="text-xs text-gray-400">{new Date(e.created_at).toLocaleString()}</span>
                                    </div>
                                    <h4 className="font-bold text-sm truncate text-red-700 dark:text-red-400">{e.error_message}</h4>
                                    <div className="flex justify-between items-center mt-2">
                                        <span className="text-xs text-gray-500">ID: {e.id.slice(0, 8)}...</span>
                                        {e.resolved ? <span className="text-green-600 text-xs flex items-center"><CheckCircle size={12} className="mr-1" /> Resolved</span> : <span className="text-red-500 text-xs flex items-center"><XCircle size={12} className="mr-1" /> Open</span>}
                                    </div>
                                </div>
                            ))}

                            {errorLogs.length === 0 && (
                                <div className="p-8 text-center text-gray-400 italic">No error logs found.</div>
                            )}
                        </div>
                    )}
                </div>

                {/* DETAIL COLUMN */}
                <div className={`flex-1 flex flex-col ${!selectedError ? 'hidden md:flex' : 'flex'}`}>
                    {selectedError ? (
                        <div className="flex-1 flex flex-col p-6 overflow-y-auto">
                            <div className="flex justify-between items-start mb-6">
                                <div>
                                    <button onClick={() => setSelectedError(null)} className="md:hidden p-1 mr-2 mb-2 text-gray-500"><ChevronRight className="rotate-180 inline" /> Back</button>
                                    <div className="flex items-center gap-2 mb-2">
                                        <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${selectedError.severity === 'critical' ? 'bg-red-600 text-white' : selectedError.severity === 'error' ? 'bg-red-100 text-red-600' : 'bg-yellow-100 text-yellow-600'}`}>{selectedError.severity}</span>
                                        <span className="text-sm text-gray-400">{new Date(selectedError.created_at).toLocaleString()}</span>
                                    </div>
                                    <h2 className="text-xl font-bold text-red-700 dark:text-red-400">{selectedError.error_message}</h2>
                                    <p className="text-sm text-gray-500 mt-1">User ID: {selectedError.user_id || 'Anonymous'}</p>
                                </div>
                                {!selectedError.resolved && (
                                    <button
                                        onClick={() => resolveError(selectedError.id)}
                                        className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center gap-2"
                                    >
                                        <CheckCircle size={18} /> Mark Resolved
                                    </button>
                                )}
                            </div>

                            <div className="space-y-6">
                                <div className="bg-gray-50 dark:bg-slate-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700 font-mono text-sm overflow-x-auto whitespace-pre-wrap">
                                    <h4 className="text-xs font-bold text-gray-500 uppercase mb-2">Stack Trace</h4>
                                    {selectedError.stack_trace || 'No stack trace available.'}
                                </div>

                                {selectedError.context && Object.keys(selectedError.context).length > 0 && (
                                    <div className="bg-gray-50 dark:bg-slate-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700 font-mono text-sm overflow-x-auto whitespace-pre-wrap">
                                        <h4 className="text-xs font-bold text-gray-500 uppercase mb-2">Context Data</h4>
                                        {JSON.stringify(selectedError.context, null, 2)}
                                    </div>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center text-gray-400 space-y-4">
                            <Activity size={48} className="opacity-20" />
                            <p>Select an error log to investigate</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ErrorLogsPanel;
