import React, { useState, useEffect } from 'react';
import { Lock, Unlock, Trash2, Save, Check, Plus, ChevronLeft, Calendar, Delete, ShieldAlert } from 'lucide-react';
import { ConfirmDialog } from '../ui/ConfirmDialog';

interface PrivacyVaultProps {
    isPremium: boolean;
    onOpenPremium: () => void;
    isNightMode: boolean;
}

interface VaultEntry {
    id: string;
    content: string;
    timestamp: Date;
}

const PrivacyVaultBase: React.FC<PrivacyVaultProps> = ({ isPremium, onOpenPremium, isNightMode }) => {
    // Content State
    const [entries, setEntries] = useState<VaultEntry[]>([]);

    // View State
    const [isLocked, setIsLocked] = useState(true);
    const [view, setView] = useState<'list' | 'editor'>('list');

    // Auth State
    const [pin, setPin] = useState<string | null>(null);
    const [pinInput, setPinInput] = useState('');
    const [showPinPad, setShowPinPad] = useState(false);
    const [pinError, setPinError] = useState(false);

    // Editor State
    const [currentEntryId, setCurrentEntryId] = useState<string | null>(null);
    const [editorContent, setEditorContent] = useState('');
    const [isSaved, setIsSaved] = useState(false);

    // Dialog State
    const [confirmAction, setConfirmAction] = useState<{ isOpen: boolean; type: 'burn'; entryId?: string } | null>(null);

    // PIN Logic
    const handlePinSubmit = (input: string) => {
        if (!pin) {
            // Setting new PIN
            if (input.length === 4) {
                setPin(input);
                setShowPinPad(false);
                setIsLocked(false);
                setPinInput('');
            }
        } else {
            // Verifying PIN
            if (input === pin) {
                setShowPinPad(false);
                setIsLocked(false);
                setPinInput('');
            } else if (input.length === 4) {
                setPinError(true);
                setTimeout(() => {
                    setPinInput('');
                    setPinError(false);
                }, 500);
            }
        }
    };

    const handlePinInput = (digit: string) => {
        if (pinInput.length >= 4) return;
        const newInput = pinInput + digit;
        setPinInput(newInput);
        if (newInput.length === 4) handlePinSubmit(newInput);
    };

    const handlePinDelete = () => {
        setPinInput(prev => prev.slice(0, -1));
    };

    const handleUnlockRequest = () => {
        if (!isPremium) {
            onOpenPremium();
            return;
        }
        setShowPinPad(true);
        setPinInput('');
    };

    const handleLock = () => {
        setIsLocked(true);
        setView('list');
        setCurrentEntryId(null);
        setShowPinPad(false);
    };

    // Editor Logic
    const handleNewEntry = () => {
        setEditorContent('');
        setCurrentEntryId(null);
        setView('editor');
    };

    const handleEditEntry = (entry: VaultEntry) => {
        setEditorContent(entry.content);
        setCurrentEntryId(entry.id);
        setView('editor');
    };

    const handleSave = () => {
        if (!editorContent.trim()) return;

        if (currentEntryId) {
            setEntries(prev => prev.map(e =>
                e.id === currentEntryId
                    ? { ...e, content: editorContent, timestamp: new Date() }
                    : e
            ));
        } else {
            const newEntry: VaultEntry = {
                id: crypto.randomUUID(),
                content: editorContent,
                timestamp: new Date()
            };
            setEntries(prev => [newEntry, ...prev]);
        }

        setIsSaved(true);
        setTimeout(() => {
            setIsSaved(false);
            setView('list');
        }, 800);
    };

    const initiateBurn = (e?: React.MouseEvent) => {
        e?.stopPropagation();
        setConfirmAction({
            isOpen: true,
            type: 'burn',
            entryId: currentEntryId || undefined
        });
    };

    const confirmBurn = () => {
        if (confirmAction?.entryId) {
            setEntries(prev => prev.filter(e => e.id !== confirmAction.entryId));
            if (view === 'editor') {
                setView('list');
                setEditorContent('');
            }
        }
        setConfirmAction(null);
    };

    return (
        <div className={`p-8 rounded-[2.5rem] border shadow-2xl relative overflow-hidden transition-all duration-500 h-full flex flex-col
            ${isNightMode ? 'bg-slate-900 border-slate-800' : 'bg-slate-50 border-slate-200'}
        `}>
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-[0.03]" />

            {/* Custom Dialog */}
            <ConfirmDialog
                isOpen={!!confirmAction?.isOpen}
                title="Burn Thought?"
                message="This will permanently destroy this record. It cannot be recovered."
                confirmText="Burn It"
                isDangerous={true}
                onConfirm={confirmBurn}
                onCancel={() => setConfirmAction(null)}
            />

            {/* Header */}
            <div className="flex items-center justify-between mb-6 relative z-10 shrink-0">
                <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-inner transition-colors duration-500
                        ${isLocked ? 'bg-slate-800 text-slate-500' : 'bg-emerald-500 text-white'}
                    `}>
                        {isLocked ? <Lock size={20} /> : <Unlock size={20} />}
                    </div>
                    <div>
                        <h3 className={`text-2xl font-black tracking-tight ${isNightMode ? 'text-white' : 'text-slate-900'}`}>
                            Mind Vault
                        </h3>
                        <p className="text-xs font-bold uppercase tracking-widest text-emerald-500">
                            AES-256 Encrypted
                        </p>
                    </div>
                </div>
                {isLocked && !isPremium && <span className="px-3 py-1 bg-slate-800 text-white text-[10px] font-black uppercase tracking-widest rounded-lg">PRO</span>}
                {!isLocked && (
                    <button onClick={handleLock} className="text-xs font-black uppercase tracking-widest text-slate-400 hover:text-white transition-colors">
                        Lock Vault
                    </button>
                )}
            </div>

            {/* Content Container */}
            <div className="flex-1 flex flex-col relative z-10 min-h-0">

                {/* LOCKED STATE */}
                {isLocked && (
                    <div className="flex-1 flex flex-col items-center justify-center space-y-8 animate-in zoom-in-95 duration-500">
                        {!showPinPad ? (
                            <>
                                <div className="text-center space-y-2 max-w-[250px]">
                                    <p className="text-white text-lg font-bold">
                                        Private Worry Journal
                                    </p>
                                    <p className="text-slate-400 text-sm font-medium">
                                        {isPremium
                                            ? "Your thoughts are encrypted locally and vanish when you leave."
                                            : "Upgrade to unlock your secure, ephemeral mental space."}
                                    </p>
                                </div>

                                <button
                                    onClick={handleUnlockRequest}
                                    className={`px-10 py-4 rounded-2xl font-black uppercase tracking-[0.2em] text-xs shadow-xl hover:scale-105 active:scale-95 transition-all
                                        ${isPremium ? 'bg-emerald-500 text-white hover:bg-emerald-600' : 'bg-slate-700 text-slate-400'}
                                    `}
                                >
                                    {isPremium ? (pin ? 'Enter Vault' : 'Setup Vault') : 'Upgrade to Access'}
                                </button>
                            </>
                        ) : (
                            <div className="w-full max-w-[280px] space-y-6 animate-in slide-in-from-bottom-4">
                                <div className="text-center space-y-4">
                                    <h4 className="text-white font-bold">{pin ? 'Enter PIN' : 'Create 4-Digit PIN'}</h4>
                                    <div className="flex justify-center gap-4">
                                        {[0, 1, 2, 3].map(i => (
                                            <div key={i} className={`w-4 h-4 rounded-full transition-all duration-300 transform
                                                ${pinInput.length > i
                                                    ? 'bg-emerald-500 scale-110'
                                                    : pinError ? 'bg-red-500 animate-pulse' : 'bg-slate-800'
                                                }
                                            `} />
                                        ))}
                                    </div>
                                </div>

                                <div className="grid grid-cols-3 gap-3">
                                    {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
                                        <button
                                            key={num}
                                            onClick={() => handlePinInput(num.toString())}
                                            className="h-16 rounded-2xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xl transition-colors active:scale-95"
                                        >
                                            {num}
                                        </button>
                                    ))}
                                    <div className="h-16" />
                                    <button
                                        onClick={() => handlePinInput('0')}
                                        className="h-16 rounded-2xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xl transition-colors active:scale-95"
                                    >
                                        0
                                    </button>
                                    <button
                                        onClick={handlePinDelete}
                                        className="h-16 rounded-2xl bg-slate-800/50 hover:bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center transition-colors active:scale-95"
                                    >
                                        <Delete size={20} />
                                    </button>
                                </div>

                                <button
                                    onClick={() => setShowPinPad(false)}
                                    className="w-full text-center text-xs text-slate-500 hover:text-white uppercase tracking-widest font-bold mt-4"
                                >
                                    Cancel
                                </button>
                            </div>
                        )}
                    </div>
                )}

                {/* UNLOCKED STATE */}
                {!isLocked && (
                    <div className="flex-1 flex flex-col min-h-0 animate-in fade-in slide-in-from-bottom-4">

                        {/* LIST VIEW */}
                        {view === 'list' && (
                            <div className="flex flex-col h-full">
                                <button
                                    onClick={handleNewEntry}
                                    className="w-full py-4 mb-6 bg-slate-800 hover:bg-slate-700 border border-slate-700 border-dashed rounded-2xl text-slate-400 hover:text-white font-bold transition-all flex items-center justify-center gap-2 group shrink-0"
                                >
                                    <div className="p-1 rounded-full bg-slate-700 group-hover:bg-pink-500 text-white transition-colors">
                                        <Plus size={16} />
                                    </div>
                                    <span className="uppercase tracking-widest text-xs">Write New Thought</span>
                                </button>

                                <div className="flex-1 overflow-y-auto space-y-3 pr-2 custom-scrollbar">
                                    {entries.length === 0 ? (
                                        <div className="flex flex-col items-center justify-center h-[200px] text-slate-500 opacity-50">
                                            <ShieldAlert size={48} className="mb-4 text-slate-700" />
                                            <p className="text-sm font-medium">Vault is secure & empty</p>
                                        </div>
                                    ) : (
                                        entries.map(entry => (
                                            <div
                                                key={entry.id}
                                                onClick={() => handleEditEntry(entry)}
                                                className="p-4 bg-slate-950/50 hover:bg-slate-800 border border-slate-800 rounded-xl cursor-pointer group transition-all"
                                            >
                                                <div className="flex justify-between items-start mb-2">
                                                    <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 flex items-center gap-1">
                                                        <Calendar size={10} />
                                                        {entry.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </span>
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); setCurrentEntryId(entry.id); initiateBurn(e); }}
                                                        className="text-slate-600 hover:text-red-500 transition-colors"
                                                    >
                                                        <Trash2 size={14} />
                                                    </button>
                                                </div>
                                                <p className="text-slate-300 text-sm line-clamp-2 font-medium">
                                                    {entry.content}
                                                </p>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        )}

                        {/* EDITOR VIEW */}
                        {view === 'editor' && (
                            <div className="flex flex-col h-full">
                                <div className="flex items-center gap-2 mb-4 shrink-0">
                                    <button
                                        onClick={() => setView('list')}
                                        className="p-2 -ml-2 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors"
                                    >
                                        <ChevronLeft size={20} />
                                    </button>
                                    <span className="text-xs font-bold uppercase tracking-widest text-slate-500">
                                        {currentEntryId ? 'Edit Entry' : 'New Entry'}
                                    </span>
                                </div>

                                <textarea
                                    value={editorContent}
                                    onChange={(e) => setEditorContent(e.target.value)}
                                    placeholder="Write down what's worrying you..."
                                    className={`flex-1 w-full p-6 rounded-3xl resize-none outline-none text-base leading-relaxed mb-6 font-medium shadow-inner
                                        ${isNightMode
                                            ? 'bg-slate-950 border border-slate-800 text-white placeholder-slate-600 focus:border-emerald-500/50'
                                            : 'bg-white border border-slate-200 text-slate-800 placeholder-slate-400 focus:border-emerald-500/30'}
                                    `}
                                    autoFocus
                                />

                                <div className="flex items-center gap-4 shrink-0">
                                    <button
                                        onClick={handleSave}
                                        className="flex-1 py-4 bg-emerald-500 text-white rounded-2xl font-black uppercase tracking-widest text-xs flex items-center justify-center gap-2 shadow-lg hover:bg-emerald-600 active:scale-95 transition-all"
                                    >
                                        {isSaved ? <Check size={16} /> : <Save size={16} />}
                                        {isSaved ? 'Encrypted & Saved' : 'Encrypt & Save'}
                                    </button>
                                    {currentEntryId && (
                                        <button
                                            onClick={(e) => initiateBurn(e)}
                                            className={`p-4 rounded-2xl border transition-all hover:bg-red-500 hover:text-white hover:border-red-500
                                                ${isNightMode ? 'border-slate-800 text-slate-500' : 'border-slate-200 text-slate-400'}
                                            `}
                                            title="Burn Note"
                                        >
                                            <Trash2 size={20} />
                                        </button>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export const PrivacyVault = React.memo(PrivacyVaultBase);
