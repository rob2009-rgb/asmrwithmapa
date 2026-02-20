import React, { useRef, useEffect } from 'react';
import { SpatialAudioService } from '../../services/SpatialAudioService';

interface VisualizerSpectrumProps {
    isActive: boolean;
    mode?: 'bar' | 'wave' | 'circle';
    isEmbedded?: boolean;
}

export const VisualizerSpectrum: React.FC<VisualizerSpectrumProps> = ({
    isActive,
    mode = 'bar',
    isEmbedded = false
}) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const animationRef = useRef<number>();

    useEffect(() => {
        if (!isActive) {
            if (animationRef.current) cancelAnimationFrame(animationRef.current);
            return;
        }

        const analyser = SpatialAudioService.getAnalyser();
        const canvas = canvasRef.current;

        if (!analyser || !canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const resize = () => {
            const parent = canvas.parentElement;
            if (isEmbedded && parent) {
                canvas.width = parent.clientWidth;
                canvas.height = parent.clientHeight;
            } else {
                canvas.width = window.innerWidth;
                canvas.height = window.innerHeight;
            }
        };

        window.addEventListener('resize', resize);
        resize();

        const bufferLength = analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);

        const draw = () => {
            animationRef.current = requestAnimationFrame(draw);
            analyser.getByteFrequencyData(dataArray);

            // Clear with semi-transparent background for trails
            // If embedded, use deeper black for better contrast with controls
            ctx.fillStyle = isEmbedded ? 'rgba(0, 0, 0, 0.2)' : 'rgba(0, 0, 0, 0.15)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            if (mode === 'bar') {
                const barWidth = (canvas.width / bufferLength) * 2.5;
                let barHeight;
                let x = 0;

                for (let i = 0; i < bufferLength; i++) {
                    barHeight = dataArray[i] * (isEmbedded ? 0.6 : 1.5);

                    // Neon pink to purple gradient
                    const hue = 320 + (i / bufferLength) * 40;
                    ctx.fillStyle = `hsla(${hue}, 80%, 60%, ${isEmbedded ? 0.6 : 0.8})`;

                    if (isEmbedded) {
                        // In embedded mode, draw bars in the vertical center or bottom
                        ctx.fillRect(x, canvas.height - barHeight, barWidth, barHeight);
                    } else {
                        ctx.fillRect(x, canvas.height - barHeight, barWidth, barHeight);
                    }

                    x += barWidth + 1;
                }
            } else if (mode === 'wave') {
                ctx.lineWidth = isEmbedded ? 2 : 3;
                ctx.strokeStyle = '#ec4899';
                ctx.shadowBlur = isEmbedded ? 5 : 10;
                ctx.shadowColor = '#ec4899';
                ctx.beginPath();

                const sliceWidth = canvas.width * 1.0 / bufferLength;
                let x = 0;

                for (let i = 0; i < bufferLength; i++) {
                    const v = dataArray[i] / 128.0;
                    const y = (v * canvas.height / 2);

                    if (i === 0) {
                        ctx.moveTo(x, y);
                    } else {
                        ctx.lineTo(x, y);
                    }

                    x += sliceWidth;
                }

                ctx.lineTo(canvas.width, canvas.height / 2);
                ctx.stroke();
            }
        };

        draw();

        return () => {
            if (animationRef.current) cancelAnimationFrame(animationRef.current);
            window.removeEventListener('resize', resize);
        };
    }, [isActive, mode, isEmbedded]);

    if (!isActive) return null;

    return (
        <canvas
            ref={canvasRef}
            className={`pointer-events-none ${isEmbedded
                ? 'absolute inset-0 z-0'
                : 'fixed inset-0 z-[100] opacity-80'}`}
        />
    );
};
