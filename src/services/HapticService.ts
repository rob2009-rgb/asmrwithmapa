import { SpatialAudioService } from './SpatialAudioService';

export class HapticService {
    private static isActive = false;
    private static animationFrame: number | null = null;
    private static lastVibration = 0;
    private static THRESHOLD = 200; // Byte frequency data (0-255)
    private static COOLDOWN = 100; // ms between vibrations

    static start() {
        if (this.isActive) return;
        this.isActive = true;
        this.loop();
    }

    static stop() {
        this.isActive = false;
        if (this.animationFrame) {
            cancelAnimationFrame(this.animationFrame);
            this.animationFrame = null;
        }
    }

    private static loop() {
        if (!this.isActive) return;

        this.animationFrame = requestAnimationFrame(() => this.loop());

        const analyser = SpatialAudioService.getAnalyser();
        if (!analyser) return;

        const bufferLength = analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        analyser.getByteFrequencyData(dataArray);

        // Check low frequencies (bass) for beat - typically first few bins
        // FFT Size 256 -> ~128 bins. 44.1kHz / 256 ~= 172Hz per bin width? No, FFT size 256 means window size. 
        // Bin width = sampleRate / fftSize. 44100 / 256 = ~172 Hz.
        // So bin 0 is 0-172Hz (Bass).

        let bassEnergy = 0;
        // Check first 3 bins (~0-500Hz)
        for (let i = 0; i < 3; i++) {
            bassEnergy += dataArray[i];
        }
        bassEnergy /= 3;

        const now = Date.now();
        if (bassEnergy > this.THRESHOLD && now - this.lastVibration > this.COOLDOWN) {
            if (navigator.vibrate) {
                // Short vibration for beat
                navigator.vibrate(15);
                this.lastVibration = now;
            }
        }
    }
}
