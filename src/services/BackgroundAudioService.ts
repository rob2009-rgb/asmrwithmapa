import { SoundCategory } from '../../types';

/**
 * BackgroundAudioService handles OS-level media controls (Lock Screen, Notification Center).
 * This works in PWAs and Capacitor WebViews to provide a native background audio experience.
 */
export class BackgroundAudioService {
    static updateMetadata(
        sound: SoundCategory | null,
        handlers: {
            onPlay: () => void;
            onPause: () => void;
            onNext: () => void;
            onPrev: () => void;
        }
    ) {
        if (!('mediaSession' in navigator)) return;

        if (!sound) {
            navigator.mediaSession.playbackState = 'none';
            return;
        }

        // Set Metadata for the Lock Screen
        navigator.mediaSession.metadata = new MediaMetadata({
            title: sound.name,
            artist: 'ASMR with MAPA',
            album: 'Pure Relaxation',
            artwork: [
                { src: '/logo.jpg', sizes: '96x96', type: 'image/jpeg' },
                { src: '/logo.jpg', sizes: '128x128', type: 'image/jpeg' },
                { src: '/logo.jpg', sizes: '192x192', type: 'image/jpeg' },
                { src: '/logo.jpg', sizes: '256x256', type: 'image/jpeg' },
                { src: '/logo.jpg', sizes: '384x384', type: 'image/jpeg' },
                { src: '/logo.jpg', sizes: '512x512', type: 'image/jpeg' },
            ]
        });

        // Register Handlers (allows controlling the app from the lock screen)
        navigator.mediaSession.setActionHandler('play', handlers.onPlay);
        navigator.mediaSession.setActionHandler('pause', handlers.onPause);
        navigator.mediaSession.setActionHandler('previoustrack', handlers.onPrev);
        navigator.mediaSession.setActionHandler('nexttrack', handlers.onNext);

        navigator.mediaSession.playbackState = 'playing';
    }

    static updatePlaybackState(state: 'playing' | 'paused' | 'none') {
        if ('mediaSession' in navigator) {
            navigator.mediaSession.playbackState = state;
        }
    }

    /**
     * Updates the current playback position in the OS media center
     */
    static updatePosition(duration: number, playbackRate: number, position: number) {
        if ('mediaSession' in navigator && 'setPositionState' in navigator.mediaSession) {
            try {
                navigator.mediaSession.setPositionState({
                    duration: duration || 0,
                    playbackRate: playbackRate || 1,
                    position: position || 0
                });
            } catch (e) {
                // Ignore position errors (can happen if values are invalid)
            }
        }
    }
}
