import React, { useState } from 'react';
import { Star, Send, X } from 'lucide-react';
import { supabase } from '../../supabaseClient';

interface CSATPromptProps {
    ticketId: string;
    ticketSubject: string;
    onDismiss: () => void;
}

const CSATPrompt: React.FC<CSATPromptProps> = ({ ticketId, ticketSubject, onDismiss }) => {
    const [score, setScore] = useState<number | null>(null);
    const [hovered, setHovered] = useState<number | null>(null);
    const [comment, setComment] = useState('');
    const [submitted, setSubmitted] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    const labels: Record<number, string> = {
        1: 'Very Unsatisfied',
        2: 'Unsatisfied',
        3: 'Neutral',
        4: 'Satisfied',
        5: 'Very Satisfied',
    };

    const handleSubmit = async () => {
        if (!score) return;
        setSubmitting(true);
        await supabase
            .from('tickets')
            .update({ csat_score: score, csat_comment: comment || null } as any)
            .eq('id', ticketId);
        setSubmitted(true);
        setSubmitting(false);
        setTimeout(onDismiss, 2000);
    };

    if (submitted) {
        return (
            <div className="rounded-2xl bg-green-900/30 border border-green-700/40 p-5 text-center space-y-2 animate-in fade-in duration-300">
                <span className="text-2xl">🎉</span>
                <p className="text-green-400 font-bold text-sm">Thank you for your feedback!</p>
                <p className="text-slate-400 text-xs">Your rating helps us improve our support.</p>
            </div>
        );
    }

    return (
        <div className="rounded-2xl bg-slate-800/60 border border-slate-700 p-5 space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="flex items-start justify-between gap-2">
                <div>
                    <p className="text-white font-bold text-sm">How was your support experience?</p>
                    <p className="text-slate-400 text-xs mt-0.5 line-clamp-1">Re: {ticketSubject}</p>
                </div>
                <button
                    onClick={onDismiss}
                    className="text-slate-500 hover:text-white transition-colors shrink-0"
                >
                    <X size={16} />
                </button>
            </div>

            {/* Star Rating */}
            <div className="flex items-center gap-1.5 justify-center">
                {[1, 2, 3, 4, 5].map(n => (
                    <button
                        key={n}
                        onMouseEnter={() => setHovered(n)}
                        onMouseLeave={() => setHovered(null)}
                        onClick={() => setScore(n)}
                        className="transition-transform hover:scale-125"
                    >
                        <Star
                            size={28}
                            className={`transition-colors ${n <= (hovered ?? score ?? 0)
                                    ? 'fill-amber-400 text-amber-400'
                                    : 'text-slate-600'
                                }`}
                        />
                    </button>
                ))}
            </div>

            {score && (
                <p className="text-center text-xs font-semibold text-amber-400">
                    {labels[score]}
                </p>
            )}

            {/* Optional Comment */}
            {score && (
                <textarea
                    value={comment}
                    onChange={e => setComment(e.target.value)}
                    placeholder="Any additional comments? (optional)"
                    rows={2}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder:text-slate-500 resize-none outline-none focus:border-pink-500 transition-colors"
                />
            )}

            {score && (
                <button
                    onClick={handleSubmit}
                    disabled={submitting}
                    className="w-full py-2.5 bg-pink-600 hover:bg-pink-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-2 transition-colors"
                >
                    <Send size={14} />
                    {submitting ? 'Submitting…' : 'Submit Feedback'}
                </button>
            )}
        </div>
    );
};

export default CSATPrompt;
