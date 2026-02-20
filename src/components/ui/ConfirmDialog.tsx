import React from 'react';
import { AlertTriangle, X } from 'lucide-react';

interface ConfirmDialogProps {
    isOpen: boolean;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    isDangerous?: boolean;
    onConfirm: () => void;
    onCancel: () => void;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
    isOpen,
    title,
    message,
    confirmText = 'Confirm',
    cancelText = 'Cancel',
    isDangerous = false,
    onConfirm,
    onCancel
}) => {
    if (!isOpen) return null;

    return (
        <div className="absolute inset-0 z-[150] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl max-w-sm w-full p-6 animate-in zoom-in-95 duration-200 relative">
                <button
                    onClick={onCancel}
                    className="absolute top-4 right-4 text-slate-500 hover:text-white transition-colors"
                >
                    <X size={20} />
                </button>

                <div className="flex flex-col items-center text-center space-y-4">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${isDangerous ? 'bg-red-500/10 text-red-500' : 'bg-pink-500/10 text-pink-500'}`}>
                        <AlertTriangle size={24} />
                    </div>

                    <div>
                        <h3 className="text-lg font-bold text-white">{title}</h3>
                        <p className="text-sm text-slate-400 mt-2 leading-relaxed">
                            {message}
                        </p>
                    </div>

                    <div className="flex gap-3 w-full pt-2">
                        <button
                            onClick={onCancel}
                            className="flex-1 py-3 rounded-xl font-bold text-slate-400 hover:bg-slate-800 hover:text-white transition-colors text-xs uppercase tracking-wider"
                        >
                            {cancelText}
                        </button>
                        <button
                            onClick={onConfirm}
                            className={`flex-1 py-3 rounded-xl font-bold text-white transition-all text-xs uppercase tracking-wider shadow-lg
                                ${isDangerous
                                    ? 'bg-red-500 hover:bg-red-600 shadow-red-900/20'
                                    : 'bg-emerald-500 hover:bg-emerald-600 shadow-emerald-900/20'}
                            `}
                        >
                            {confirmText}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
