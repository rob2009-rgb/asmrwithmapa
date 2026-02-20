import React, { useState } from 'react';
import { supabase } from '../../supabaseClient';
import { useNotification } from '../../contexts/NotificationContext';
import { Mail, Lock, ArrowRight, Loader } from 'lucide-react';

export const LoginForm: React.FC<{ onClose: () => void }> = ({ onClose }) => {
    const { showNotification } = useNotification();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [isMagicLink, setIsMagicLink] = useState(false);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            if (isMagicLink) {
                const { error } = await supabase.auth.signInWithOtp({ email });
                if (error) throw error;
                showNotification('success', 'Magic link sent! Check your email.');
            } else {
                const { error } = await supabase.auth.signInWithPassword({ email, password });
                if (error) throw error;
                showNotification('success', 'Signed in successfully!');
                onClose();
            }
        } catch (error: any) {
            showNotification('error', error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleForgotPassword = async () => {
        if (!email) return showNotification('info', 'Please enter your email first.');
        setLoading(true);
        try {
            const { error } = await supabase.auth.resetPasswordForEmail(email, {
                redirectTo: window.location.origin + '/reset-password',
            });
            if (error) throw error;
            showNotification('success', 'Password reset link sent to your email.');
        } catch (error: any) {
            showNotification('error', error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleLogin} className="space-y-4">
            <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Email Address</label>
                <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                    <input
                        type="email"
                        required
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        className="w-full bg-slate-800 border border-slate-700 text-white pl-10 pr-4 py-3 rounded-xl outline-none focus:border-pink-500 transition-colors"
                        placeholder="you@example.com"
                    />
                </div>
            </div>

            {!isMagicLink && (
                <div>
                    <div className="flex justify-between mb-1">
                        <label className="block text-xs font-bold text-slate-500 uppercase">Password</label>
                        <button type="button" onClick={handleForgotPassword} className="text-xs text-pink-500 hover:text-pink-400">First time or Forgot?</button>
                    </div>
                    <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                        <input
                            type="password"
                            required
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            className="w-full bg-slate-800 border border-slate-700 text-white pl-10 pr-4 py-3 rounded-xl outline-none focus:border-pink-500 transition-colors"
                            placeholder="••••••••"
                        />
                    </div>
                </div>
            )}

            <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-pink-600 to-pink-500 hover:from-pink-500 hover:to-pink-400 text-white font-bold py-3 rounded-xl shadow-lg shadow-pink-900/20 transform transition-all active:scale-95 flex items-center justify-center gap-2"
            >
                {loading ? <Loader className="animate-spin" size={20} /> : (
                    <>
                        {isMagicLink ? 'Send Magic Link' : 'Sign In'}
                        <ArrowRight size={18} />
                    </>
                )}
            </button>

            <div className="text-center">
                <button
                    type="button"
                    onClick={() => setIsMagicLink(!isMagicLink)}
                    className="text-xs text-slate-500 hover:text-white transition-colors"
                >
                    {isMagicLink ? 'Back to password login' : 'Or sign in with a Magic Link'}
                </button>
            </div>
        </form>
    );
};
