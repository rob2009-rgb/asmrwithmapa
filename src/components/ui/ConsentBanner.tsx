import React, { useState, useEffect } from 'react';
import { Settings, Shield, X } from 'lucide-react';
import { AnalyticsService } from '../../services/AnalyticsService';

export const ConsentBanner: React.FC = () => {
    const [isVisible, setIsVisible] = useState(false);
    const [showOptions, setShowOptions] = useState(false);

    useEffect(() => {
        // Check if user has already made a choice about analytics
        // If 'analytics_consent' is completely missing in localStorage, show the banner.
        const consent = localStorage.getItem('analytics_consent');
        if (consent === null) {
            setIsVisible(true);
        }
    }, []);

    const handleAcceptAll = () => {
        AnalyticsService.setConsent(true);
        AnalyticsService.trackEvent('consent', 'granted');
        setIsVisible(false);
        // Dispatch event so other components know consent changed
        window.dispatchEvent(new Event('consent-changed'));
    };

    const handleDecline = () => {
        AnalyticsService.setConsent(false);
        setIsVisible(false);
        window.dispatchEvent(new Event('consent-changed'));
    };

    if (!isVisible) return null;

    return (
        <div className="fixed bottom-6 inset-x-4 md:inset-x-auto md:right-6 md:w-[28rem] z-[9999]">
            <div className="bg-slate-900/95 backdrop-blur-xl border border-white/10 rounded-3xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom-8 duration-500">
                <div className="p-6">
                    <div className="flex items-start gap-4">
                        <div className="w-10 h-10 rounded-2xl bg-pink-500/10 flex items-center justify-center shrink-0">
                            <Shield size={20} className="text-pink-400" />
                        </div>
                        <div className="flex-1">
                            <h3 className="text-white font-bold mb-1">Your Privacy</h3>
                            <p className="text-sm text-slate-400 leading-relaxed">
                                We use first-party, pseudonymized cookies to measure feature usage and improve your experience.
                                We <strong>never</strong> sell data to third parties.
                            </p>
                        </div>
                    </div>

                    {showOptions && (
                        <div className="mt-4 p-4 bg-black/20 rounded-2xl border border-white/5 space-y-3">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-white font-medium">Essential</p>
                                    <p className="text-xs text-slate-500">Required for the app to function.</p>
                                </div>
                                <div className="text-xs font-bold text-slate-500 bg-slate-800 px-2 py-1 rounded">Always Active</div>
                            </div>
                            <div className="flex items-center justify-between pt-2 border-t border-white/5">
                                <div>
                                    <p className="text-sm text-white font-medium">Analytics</p>
                                    <p className="text-xs text-slate-500">Feature usage & crash reporting.</p>
                                </div>
                                <div className="text-xs font-bold text-pink-400 bg-pink-500/10 px-2 py-1 rounded border border-pink-500/20">Optional</div>
                            </div>
                        </div>
                    )}

                    <div className="mt-5 flex flex-col sm:flex-row gap-3">
                        <button
                            onClick={handleAcceptAll}
                            className="flex-1 px-4 py-2.5 bg-pink-600 hover:bg-pink-500 text-white text-sm font-bold rounded-xl transition-all shadow-lg active:scale-95 text-center"
                        >
                            Accept All
                        </button>
                        <div className="flex gap-3 flex-1">
                            <button
                                onClick={handleDecline}
                                className="flex-1 px-4 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 text-white/80 hover:text-white text-sm font-bold rounded-xl transition-all active:scale-95 text-center"
                            >
                                Decline
                            </button>
                            {!showOptions && (
                                <button
                                    onClick={() => setShowOptions(true)}
                                    className="px-3 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 text-white/50 hover:text-white rounded-xl transition-all"
                                    title="Manage Preferences"
                                >
                                    <Settings size={18} />
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
