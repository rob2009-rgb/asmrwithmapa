import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import { useNotification } from '../../contexts/NotificationContext';
import { Mail, Lock, User, Check, X } from 'lucide-react';

export const SignupForm: React.FC<{ onClose: () => void }> = ({ onClose }) => {
    const { showNotification } = useNotification();
    const [email, setEmail] = useState('');
    const [fullName, setFullName] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);

    // Password Strength
    const [strength, setStrength] = useState(0);

    useEffect(() => {
        let s = 0;
        if (password.length > 6) s++;
        if (password.length > 10) s++;
        if (/[A-Z]/.test(password)) s++;
        if (/[0-9]/.test(password)) s++;
        if (/[^A-Za-z0-9]/.test(password)) s++;
        setStrength(s);
    }, [password]);

    const handleSignup = async (e: React.FormEvent) => {
        e.preventDefault();
        if (strength < 2) return showNotification('warning', 'Please choose a stronger password.');

        setLoading(true);
        try {
            const { data, error } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    data: {
                        full_name: fullName,
                    }
                }
            });

            if (error) throw error;

            showNotification('success', 'Account created! Please check your email to verify.');
            onClose();
        } catch (error: any) {
            showNotification('error', error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSignup} className="space-y-4">
            <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Full Name</label>
                <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                    <input
                        type="text"
                        required
                        value={fullName}
                        onChange={e => setFullName(e.target.value)}
                        className="w-full bg-slate-800 border border-slate-700 text-white pl-10 pr-4 py-3 rounded-xl outline-none focus:border-pink-500 transition-colors"
                        placeholder="Jane Doe"
                    />
                </div>
            </div>

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

            <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Password</label>
                <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                    <input
                        type="password"
                        required
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        className="w-full bg-slate-800 border border-slate-700 text-white pl-10 pr-4 py-3 rounded-xl outline-none focus:border-pink-500 transition-colors"
                        placeholder="Create a strong password"
                    />
                </div>

                {/* Strength Meter */}
                {password && (
                    <div className="mt-2 flex gap-1 h-1">
                        {[1, 2, 3, 4, 5].map(i => (
                            <div
                                key={i}
                                className={`flex-1 rounded-full transition-colors ${i <= strength ? (strength < 3 ? 'bg-amber-500' : 'bg-emerald-500') : 'bg-slate-800'}`}
                            />
                        ))}
                    </div>
                )}
                {password && strength < 2 && <p className="text-[10px] text-amber-500 mt-1">Make it stronger (add numbers, symbols)</p>}
            </div>

            <button
                type="submit"
                disabled={loading}
                className="w-full bg-slate-800 hover:bg-slate-700 text-white font-bold py-3 rounded-xl border border-slate-700 hover:border-slate-600 transition-all active:scale-95"
            >
                {loading ? 'Creating Account...' : 'Create Free Account'}
            </button>

            <p className="text-[10px] text-slate-500 text-center px-4">
                By joining, you agree to our Terms of Service and Privacy Policy.
            </p>
        </form>
    );
};
