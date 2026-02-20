export class SpatialAudioService {
    private static audioContext: AudioContext | null = null;
    private static source: MediaElementAudioSourceNode | null = null;
    private static panner: PannerNode | null = null;
    private static gainNode: GainNode | null = null;
    private static animationFrame: number | null = null;
    private static angle = 0;
    private static analyser: AnalyserNode | null = null;
    private static isInitialized = false;

    static init(audioElement: HTMLAudioElement) {
        if (this.isInitialized) return;

        try {
            const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
            this.audioContext = new AudioContextClass();

            // Resume context on first creation
            if (this.audioContext.state === 'suspended') {
                this.audioContext.resume();
            }

            this.source = this.audioContext.createMediaElementSource(audioElement);
            this.panner = this.audioContext.createPanner();
            this.gainNode = this.audioContext.createGain();
            this.analyser = this.audioContext.createAnalyser();

            // Analyser settings
            this.analyser.fftSize = 256;

            // Panner settings for HRTF (Head-Related Transfer Function) - best for headphones
            this.panner.panningModel = 'HRTF';
            this.panner.distanceModel = 'inverse';
            this.panner.refDistance = 1;
            this.panner.maxDistance = 10000;
            this.panner.rolloffFactor = 1;
            this.panner.coneInnerAngle = 360;
            this.panner.coneOuterAngle = 0;
            this.panner.coneOuterGain = 0;

            this.source.connect(this.gainNode);
            this.gainNode.connect(this.panner);
            this.panner.connect(this.analyser);
            this.analyser.connect(this.audioContext.destination);

            this.isInitialized = true;
        } catch (e) {
            console.error("Spatial Audio Init Failed:", e);
        }
    }

    static isInit(): boolean {
        return this.isInitialized;
    }

    static async resume(): Promise<void> {
        if (this.audioContext && this.audioContext.state === 'suspended') {
            await this.audioContext.resume();
        }
    }

    static getAnalyser(): AnalyserNode | null {
        if (this.audioContext && this.audioContext.state === 'suspended') {
            this.audioContext.resume();
        }
        return this.analyser;
    }

    static setPosition(x: number, y: number, z: number) {
        if (!this.panner || !this.audioContext) return;
        if (this.audioContext.state === 'suspended') this.audioContext.resume();

        // Use setPosition if available (deprecated but widely supported) or positionX/Y/Z (new)
        if (this.panner.positionX) {
            this.panner.positionX.value = x;
            this.panner.positionY.value = y;
            this.panner.positionZ.value = z;
        } else {
            this.panner.setPosition(x, y, z);
        }
    }

    static startOrbitAnimation() {
        if (!this.panner || !this.audioContext) return;
        this.stopAnimation();

        if (this.audioContext.state === 'suspended') this.audioContext.resume();

        const animate = () => {
            if (!this.panner) return;
            this.angle += 0.01; // Slower rotation
            const x = Math.sin(this.angle) * 3; // Radius 3
            const z = Math.cos(this.angle) * 3;
            // Y is usually up/down. We want horizontal circle around head.
            // X = left/right, Z = front/back, Y = up/down
            this.setPosition(x, 0, z);
            this.animationFrame = requestAnimationFrame(animate);
        };
        this.animationFrame = requestAnimationFrame(animate);
    }

    static stopAnimation() {
        if (this.animationFrame) {
            cancelAnimationFrame(this.animationFrame);
            this.animationFrame = null;
        }
    }

    static reset() {
        this.stopAnimation();
        this.setPosition(0, 0, 0); // Center
    }
}
