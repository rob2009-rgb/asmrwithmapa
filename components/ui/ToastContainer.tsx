import React from 'react';
import { useNotification, Notification } from '../../src/contexts/NotificationContext';
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';

const ToastItem: React.FC<{ notification: Notification; onDismiss: (id: string) => void }> = ({ notification, onDismiss }) => {
    const icons = {
        success: <CheckCircle size={20} className="text-emerald-400" />,
        error: <AlertCircle size={20} className="text-red-400" />,
        warning: <AlertTriangle size={20} className="text-amber-400" />,
        info: <Info size={20} className="text-blue-400" />
    };

    const bgColors = {
        success: 'bg-slate-900/95 border-emerald-500/30',
        error: 'bg-slate-900/95 border-red-500/30',
        warning: 'bg-slate-900/95 border-amber-500/30',
        info: 'bg-slate-900/95 border-blue-500/30'
    };

    return (
        <div className={`
      flex items-start gap-3 p-4 rounded-xl border shadow-2xl backdrop-blur-md
      ${bgColors[notification.type]}
      animate-in slide-in-from-bottom-5 fade-in duration-300
      max-w-md w-full pointer-events-auto
    `}>
            <div className="mt-0.5 shrink-0">{icons[notification.type]}</div>
            <div className="flex-1 text-sm font-medium text-slate-200 leading-relaxed">
                {notification.message}
            </div>
            <button
                onClick={() => onDismiss(notification.id)}
                className="text-slate-500 hover:text-white transition-colors"
            >
                <X size={16} />
            </button>
        </div>
    );
};

export const ToastContainer: React.FC = () => {
    const { notifications, removeNotification } = useNotification();

    return (
        <div className="fixed bottom-6 right-6 z-[200] flex flex-col gap-3 pointer-events-none p-4 w-full max-w-sm items-end">
            {notifications.map(n => (
                <ToastItem key={n.id} notification={n} onDismiss={removeNotification} />
            ))}
        </div>
    );
};
