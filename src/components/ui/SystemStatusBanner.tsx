import React, { useState, useEffect } from 'react';
import { AlertTriangle, AlertCircle, Info, X, Megaphone } from 'lucide-react';
import { supabase } from '../../supabaseClient';

interface SystemStatus {
    id: number;
    is_active: boolean;
    severity: 'info' | 'warning' | 'critical';
    message: string;
    updated_at: string;
}

const SEVERITY_CONFIG = {
    info: {
        bg: 'bg-blue-600',
        border: 'border-blue-500',
        icon: <Info size={16} className="shrink-0" />,
        text: 'text-blue-50',
    },
    warning: {
        bg: 'bg-amber-500',
        border: 'border-amber-400',
        icon: <AlertTriangle size={16} className="shrink-0" />,
        text: 'text-amber-950',
    },
    critical: {
        bg: 'bg-red-600',
        border: 'border-red-500',
        icon: <AlertCircle size={16} className="shrink-0" />,
        text: 'text-red-50',
    },
};

const SESSION_KEY = 'system_status_dismissed';

const SystemStatusBanner: React.FC = () => {
    const [status, setStatus] = useState<SystemStatus | null>(null);
    const [dismissed, setDismissed] = useState(false);

    useEffect(() => {
        // Check if user already dismissed this session
        if (sessionStorage.getItem(SESSION_KEY) === 'true') {
            setDismissed(true);
        }
        fetchStatus();

        // Poll every 60 seconds to pick up admin changes
        const interval = setInterval(fetchStatus, 60_000);
        return () => clearInterval(interval);
    }, []);

    const fetchStatus = async () => {
        const { data } = await supabase
            .from('system_status')
            .select('*')
            .eq('id', 1)
            .single();

        if (data) {
            setStatus(data as SystemStatus);
            // If status changed (newly active), re-show banner
            if (data.is_active) {
                const storedTs = sessionStorage.getItem(SESSION_KEY + '_ts');
                if (storedTs !== data.updated_at) {
                    setDismissed(false);
                    sessionStorage.removeItem(SESSION_KEY);
                }
            }
        }
    };

    const handleDismiss = () => {
        setDismissed(true);
        sessionStorage.setItem(SESSION_KEY, 'true');
        if (status) sessionStorage.setItem(SESSION_KEY + '_ts', status.updated_at);
    };

    if (!status?.is_active || dismissed) return null;

    const cfg = SEVERITY_CONFIG[status.severity] || SEVERITY_CONFIG.info;

    return (
        <div className={`w-full ${cfg.bg} border-b ${cfg.border} z-[200] animate-in slide-in-from-top-2 duration-300`}>
            <div className="max-w-7xl mx-auto px-4 py-2.5 flex items-center gap-3">
                <Megaphone size={16} className={`shrink-0 ${cfg.text} opacity-80`} />
                <span className={`${cfg.icon.props.className ?? ''} ${cfg.text}`}>
                    {cfg.icon}
                </span>
                <p className={`flex-1 text-sm font-semibold ${cfg.text}`}>
                    {status.message}
                </p>
                <button
                    onClick={handleDismiss}
                    className={`${cfg.text} opacity-70 hover:opacity-100 transition-opacity`}
                    title="Dismiss"
                >
                    <X size={16} />
                </button>
            </div>
        </div>
    );
};

export default SystemStatusBanner;
