export type VoiceCommand = 'stop' | 'play' | 'pause' | 'next' | 'previous' | '8d_on' | '8d_off';

export class VoiceControlService {
    private static recognition: any = null;
    private static isRunning = false;
    private static onCommand: ((command: VoiceCommand) => void) | null = null;

    static init(callback: (command: VoiceCommand) => void) {
        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

        if (!SpeechRecognition) {
            console.warn('Speech Recognition not supported in this browser.');
            return false;
        }

        if (!this.recognition) {
            this.recognition = new SpeechRecognition();
            this.recognition.continuous = true;
            this.recognition.interimResults = false;
            this.recognition.lang = 'en-US';

            this.recognition.onresult = (event: any) => {
                const transcript = event.results[event.results.length - 1][0].transcript.toLowerCase().trim();
                console.log('Voice transcript:', transcript);
                this.parseCommand(transcript);
            };

            this.recognition.onend = () => {
                if (this.isRunning) {
                    this.recognition.start(); // Keep listening if not stopped manually
                }
            };

            this.recognition.onerror = (event: any) => {
                console.error('Speech recognition error:', event.error);
                if (event.error === 'not-allowed') {
                    this.isRunning = false;
                }
            };
        }

        this.onCommand = callback;
        return true;
    }

    private static parseCommand(transcript: string) {
        if (!this.onCommand) return;

        if (transcript.includes('stop') || transcript.includes('halt')) {
            this.onCommand('stop');
        } else if (transcript.includes('play') || transcript.includes('start')) {
            this.onCommand('play');
        } else if (transcript.includes('pause') || transcript.includes('wait')) {
            this.onCommand('pause');
        } else if (transcript.includes('next') || transcript.includes('skip')) {
            this.onCommand('next');
        } else if (transcript.includes('previous') || transcript.includes('back')) {
            this.onCommand('previous');
        } else if (transcript.includes('8d on') || transcript.includes('spatial on')) {
            this.onCommand('8d_on');
        } else if (transcript.includes('8d off') || transcript.includes('spatial off')) {
            this.onCommand('8d_off');
        }
    }

    static start() {
        if (this.recognition && !this.isRunning) {
            try {
                this.recognition.start();
                this.isRunning = true;
            } catch (e) {
                console.error('Failed to start recognition:', e);
            }
        }
    }

    static stop() {
        this.isRunning = false;
        if (this.recognition) {
            this.recognition.stop();
        }
    }

    static get isActive() {
        return this.isRunning;
    }
}
