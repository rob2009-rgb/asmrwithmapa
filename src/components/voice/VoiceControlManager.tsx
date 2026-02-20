import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff } from 'lucide-react';
import { useNotification } from '../../contexts/NotificationContext';

interface VoiceControlProps {
    onPlay: () => void;
    onPause: () => void;
    onNext: () => void;
    onPrev: () => void;
    onVolumeUp: () => void;
    onVolumeDown: () => void;
    onToggleRain: () => void;
    isNightMode: boolean;
    isActive: boolean;
    onToggleActive: (active: boolean) => void;
}

export const VoiceControlManager: React.FC<VoiceControlProps> = ({
    onPlay,
    onPause,
    onNext,
    onPrev,
    onVolumeUp,
    onVolumeDown,
    onToggleRain,
    isNightMode,
    isActive,
    onToggleActive
}) => {
    const [transcript, setTranscript] = useState('');
    const { showNotification } = useNotification();
    const recognitionRef = useRef<any>(null);

    // Use a ref to store handlers so we don't have to restart recognition when props change
    const handlersRef = useRef({ onPlay, onPause, onNext, onPrev, onVolumeUp, onVolumeDown, onToggleRain, showNotification });

    useEffect(() => {
        handlersRef.current = { onPlay, onPause, onNext, onPrev, onVolumeUp, onVolumeDown, onToggleRain, showNotification };
    }, [onPlay, onPause, onNext, onPrev, onVolumeUp, onVolumeDown, onToggleRain, showNotification]);

    useEffect(() => {
        // Check for browser support
        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

        if (SpeechRecognition && !recognitionRef.current) {
            const recognition = new SpeechRecognition();
            recognition.continuous = true;
            recognition.interimResults = false;
            recognition.lang = 'en-US';

            recognition.onstart = () => {
                console.log('Voice recognition started');
            };

            recognition.onend = () => {
                console.log('Voice recognition ended');
                // If it was supposed to be active, we might want to restart?
                // But typically isActive state change will trigger the other effect.
            };

            recognition.onerror = (event: any) => {
                if (event.error === 'aborted') return;
                console.error('Speech recognition error', event.error);
                if (event.error === 'not-allowed') {
                    showNotification('error', 'Microphone access denied');
                    onToggleActive(false);
                }
            };

            recognition.onresult = (event: any) => {
                const last = event.results.length - 1;
                const command = event.results[last][0].transcript.trim().toLowerCase();
                setTranscript(command);

                // Show visual feedback for 3 seconds
                setTimeout(() => setTranscript(''), 3000);

                const { onPlay, onPause, onNext, onPrev, onVolumeUp, onVolumeDown, onToggleRain, showNotification } = handlersRef.current;

                // Process Command
                if (command.includes('play') || command.includes('start') || command.includes('resume')) {
                    onPlay();
                    showNotification('success', 'Playing...');
                } else if (command.includes('stop') || command.includes('pause') || command.includes('halt')) {
                    onPause();
                    showNotification('info', 'Paused');
                } else if (command.includes('next') || command.includes('skip')) {
                    onNext();
                    showNotification('info', 'Next Track');
                } else if (command.includes('back') || command.includes('previous')) {
                    onPrev();
                    showNotification('info', 'Previous Track');
                } else if (command.includes('louder') || command.includes('volume up')) {
                    onVolumeUp();
                    showNotification('info', 'Volume Up');
                } else if (command.includes('softer') || command.includes('quiet') || command.includes('volume down')) {
                    onVolumeDown();
                    showNotification('info', 'Volume Down');
                } else if (command.includes('rain') || command.includes('storm')) {
                    onToggleRain();
                    showNotification('info', 'Toggled Rain');
                }
            };

            recognitionRef.current = recognition;
        }

        // Cleanup: Definitely stop and abort recognition on unmount to release mic
        return () => {
            if (recognitionRef.current) {
                recognitionRef.current.abort();
                recognitionRef.current = null;
            }
        };
    }, []); // Run only once on mount

    useEffect(() => {
        if (!recognitionRef.current) return;

        if (isActive) {
            try {
                recognitionRef.current.start();
            } catch (e) {
                // Ignore "already started" errors
            }
        } else {
            try {
                // abort() is more forceful than stop() and usually releases the mic faster/more reliably
                recognitionRef.current.abort();
            } catch (e) {
                console.error('Error stopping recognition', e);
            }
        }
    }, [isActive]);

    if (!transcript) return null;

    return (
        <div className="fixed bottom-32 right-8 z-[60] flex flex-col items-end pointer-events-none gap-2">
            <div className={`px-4 py-2 rounded-xl backdrop-blur-md shadow-lg animate-in fade-in slide-in-from-right-4 transition-all
                ${isNightMode ? 'bg-slate-800/90 text-white border border-slate-700' : 'bg-white/90 text-pink-600 border border-pink-100'}
            `}>
                <span className="text-sm font-medium">"{transcript}"</span>
            </div>
        </div>
    );
};
