import React from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';
import { X, RefreshCw } from 'lucide-react';

export const UpdatePrompt: React.FC = () => {
    const {
        offlineReady: [offlineReady, setOfflineReady],
        needRefresh: [needRefresh, setNeedRefresh],
        updateServiceWorker,
    } = useRegisterSW({
        onRegistered(r) {
            // eslint-disable-next-line no-console
            console.log('SW Registered: ' + r);
        },
        onRegisterError(error) {
            // eslint-disable-next-line no-console
            console.log('SW registration error', error);
        },
    });

    const close = () => {
        setOfflineReady(false);
        setNeedRefresh(false);
    };

    if (!offlineReady && !needRefresh) return null;

    return (
        <div className="fixed bottom-4 right-4 z-50 animate-in slide-in-from-bottom-4 fade-in">
            <div className="bg-slate-900 border border-slate-700 text-white p-4 rounded-xl shadow-2xl flex flex-col gap-3 max-w-sm">
                <div className="flex items-start justify-between">
                    <div>
                        <h3 className="font-bold text-sm">
                            {offlineReady ? 'App ready to work offline' : 'New content available'}
                        </h3>
                        <p className="text-xs text-slate-400 mt-1">
                            {offlineReady
                                ? 'You can now use this app without internet.'
                                : 'Click reload to update to the latest version.'}
                        </p>
                    </div>
                    <button onClick={close} className="text-slate-500 hover:text-white">
                        <X size={16} />
                    </button>
                </div>

                {needRefresh && (
                    <button
                        onClick={() => updateServiceWorker(true)}
                        className="flex items-center justify-center gap-2 bg-pink-600 hover:bg-pink-500 text-white px-3 py-2 rounded-lg text-xs font-bold transition-colors"
                    >
                        <RefreshCw size={14} />
                        Reload & Update
                    </button>
                )}
            </div>
        </div>
    );
};
