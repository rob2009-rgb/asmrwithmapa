import React, { useState } from 'react';
import { useScrollLock } from '../../hooks/useScrollLock';
import { X, Mail, Lock } from 'lucide-react';
import { LoginForm } from './LoginForm';
import { SignupForm } from './SignupForm';

interface AuthModalProps {
    isOpen: boolean;
    onClose: () => void;
    defaultView?: 'login' | 'signup';
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, defaultView = 'login' }) => {
    const [view, setView] = useState<'login' | 'signup'>(defaultView);

    useScrollLock(isOpen);
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm" onClick={onClose} />

            <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">

                {/* Header / Tabs */}
                <div className="flex border-b border-slate-800">
                    <button
                        onClick={() => setView('login')}
                        className={`flex-1 py-4 text-sm font-bold uppercase tracking-widest transition-colors ${view === 'login' ? 'bg-slate-800 text-white' : 'text-slate-500 hover:text-slate-300'}`}
                    >
                        Sign In
                    </button>
                    <button
                        onClick={() => setView('signup')}
                        className={`flex-1 py-4 text-sm font-bold uppercase tracking-widest transition-colors ${view === 'signup' ? 'bg-slate-800 text-pink-500' : 'text-slate-500 hover:text-slate-300'}`}
                    >
                        Create Account
                    </button>
                </div>

                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 z-10 p-2 text-slate-500 hover:text-white transition-colors bg-slate-900/50 rounded-full"
                >
                    <X size={20} />
                </button>

                {/* Content */}
                <div className="p-8">
                    <div className="mb-6 text-center">
                        <h2 className="text-2xl font-bold text-white mb-2">
                            {view === 'login' ? 'Welcome Back' : 'Join MAPA'}
                        </h2>
                        <p className="text-slate-400 text-sm">
                            {view === 'login'
                                ? 'Sign in to access your premium content.'
                                : 'Create an account to unlock exclusive ASMR experiences.'}
                        </p>
                    </div>

                    {view === 'login' ? <LoginForm onClose={onClose} /> : <SignupForm onClose={onClose} />}
                </div>
            </div>
        </div>
    );
};
