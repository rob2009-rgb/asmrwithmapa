import React from 'react';
import { useScrollLock } from '../../src/hooks/useScrollLock';
import { AlertTriangle, HelpCircle } from 'lucide-react';

interface ConfirmDialogProps {
    isOpen: boolean;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    isDestructive?: boolean;
    onConfirm: () => void;
    onCancel: () => void;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
    isOpen,
    title,
    message,
    confirmText = 'Confirm',
    cancelText = 'Cancel',
    isDestructive = false,
    onConfirm,
    onCancel
}) => {
    useScrollLock(isOpen);
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-sm p-6 shadow-2xl animate-in zoom-in-95 duration-200">
                <div className="flex items-center gap-3 mb-4">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${isDestructive ? 'bg-red-500/20 text-red-500' : 'bg-slate-700 text-slate-300'}`}>
                        {isDestructive ? <AlertTriangle size={20} /> : <HelpCircle size={20} />}
                    </div>
                    <h3 className="text-lg font-bold text-white leading-tight">{title}</h3>
                </div>

                <p className="text-slate-400 text-sm mb-6 leading-relaxed">
                    {message}
                </p>

                <div className="flex gap-3">
                    <button
                        onClick={onCancel}
                        className="flex-1 py-3 text-slate-400 hover:bg-slate-800 rounded-xl font-bold transition-colors"
                    >
                        {cancelText}
                    </button>
                    <button
                        onClick={onConfirm}
                        className={`flex-1 py-3 text-white rounded-xl font-bold shadow-lg transition-all active:scale-95 ${isDestructive
                            ? 'bg-red-600 hover:bg-red-700 shadow-red-900/20'
                            : 'bg-pink-600 hover:bg-pink-700 shadow-pink-900/20'
                            }`}
                    >
                        {confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
};
