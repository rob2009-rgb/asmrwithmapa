
import React, { useState, useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import { Play, Pause, Square, SkipBack, SkipForward, Repeat, Shuffle, CloudRain, AlertCircle, Loader2, ChevronUp, ChevronDown, Minimize2, Maximize2, Clock, Heart, Users, Mic, MicOff, Crosshair, Sparkles, Waves, Zap, Lock, Headset, X, Activity, HelpCircle } from 'lucide-react';
import { SoundCategory, PlayerState, SoundItem, PlayerHandle } from '../types';
import { RAIN_SOUND_URL } from '../constants';
import { BackgroundAudioService } from '../src/services/BackgroundAudioService';
import { Creator, CreatorService } from '../src/services/CreatorService';
import { TippingModal } from '../src/components/profile/TippingModal';
import { SpatialAudioService } from '../src/services/SpatialAudioService';
import { SpatialAudioEngine } from '../src/components/player/SpatialAudioEngine';
import { AISoundscapeArchitect } from '../src/components/features/AISoundscapeArchitect';
import { VisualizerSpectrum } from '../src/components/features/VisualizerSpectrum';
import { HapticService } from '../src/services/HapticService';
import { ListenPartyService, SessionState, ChatMessage } from '../src/services/ListenPartyService';
import { ListenPartyModal } from '../src/components/player/ListenPartyModal';
import { BioSyncControl } from '../src/components/features/BioSyncControl';
import ContextualHelp from '../src/components/help/ContextualHelp';

interface PlayerProps {
  currentSound: SoundCategory | null;
  onNext: () => void;
  onPrev: () => void;
  isNightMode: boolean;
  rainLayerActive: boolean;
  onToggleRain: () => void;
  rainVolume: number;
  onRainVolumeChange: (val: number) => void;
  userId?: string;
  categories: SoundCategory[];
  setCurrentSound: (sound: SoundCategory) => void;
  activeVariationIndex: number;
  onVariationChange: (index: number) => void;
  isPremium?: boolean;
  onOpenPremium?: () => void;
  onPlayerStateChange?: (state: PlayerState) => void;
  isVoiceActive?: boolean;
  onToggleVoice?: () => void;
  onOpenAskMapa?: () => void;
}

const Player = forwardRef<PlayerHandle, PlayerProps>(({
  currentSound,
  onNext,
  onPrev,
  isNightMode,
  rainLayerActive,
  onToggleRain,
  rainVolume,
  onRainVolumeChange,
  userId,
  categories,
  setCurrentSound,
  activeVariationIndex,
  onVariationChange,
  isPremium = false,
  onOpenPremium,
  onPlayerStateChange,
  isVoiceActive = false,
  onToggleVoice,
  onOpenAskMapa
}, ref) => {
  // Expose Player Controls
  useImperativeHandle(ref, () => ({
    play: () => {
      if (audioRef.current && playerState !== PlayerState.PLAYING) {
        audioRef.current.play().catch(console.error);
        setPlayerState(PlayerState.PLAYING);
      }
    },
    pause: () => {
      if (audioRef.current && playerState === PlayerState.PLAYING) {
        audioRef.current.pause();
        setPlayerState(PlayerState.PAUSED);
      }
    },
    toggle: () => {
      if (playerState === PlayerState.PLAYING) {
        audioRef.current?.pause();
        setPlayerState(PlayerState.PAUSED);
      } else {
        audioRef.current?.play().catch(console.error);
        setPlayerState(PlayerState.PLAYING);
      }
    }
  }));
  // Player State
  const [playerState, setPlayerState] = useState<PlayerState>(PlayerState.STOPPED);

  useEffect(() => {
    onPlayerStateChange?.(playerState);
  }, [playerState, onPlayerStateChange]);
  // Removed local activeVariationIndex state
  const [progress, setProgress] = useState(0);
  const [isLooping, setIsLooping] = useState(true);
  const [isShuffled, setIsShuffled] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [creator, setCreator] = useState<Creator | null>(null);
  const [isTipModalOpen, setIsTipModalOpen] = useState(false);
  const [isAIArchitectOpen, setIsAIArchitectOpen] = useState(false);
  const [isVisualizerActive, setIsVisualizerActive] = useState(false);
  const [isHapticActive, setIsHapticActive] = useState(false);
  const [isSpatial, setIsSpatial] = useState(false);
  const [isSpatialEngineOpen, setIsSpatialEngineOpen] = useState(false);
  const [isBioSyncOpen, setIsBioSyncOpen] = useState(false);

  // Listen Party State
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isListenPartyModalOpen, setIsListenPartyModalOpen] = useState(false);
  const [isRemoteUpdate, setIsRemoteUpdate] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [openToolsMenu, setOpenToolsMenu] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);

  // Sleep Timer State
  const [sleepTimer, setSleepTimer] = useState<0 | 15 | 30 | 45 | 60 | 90>(0);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);

  // Interaction / Inactivity State
  const [lastInteraction, setLastInteraction] = useState(Date.now());

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const rainRef = useRef<HTMLAudioElement | null>(null);
  const inactivityTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const activeSoundItem: SoundItem | null = currentSound ? currentSound.sounds[activeVariationIndex] : null;

  // --- INTERACTION HANDLER ---
  const registerInteraction = () => {
    setLastInteraction(Date.now());
  };

  // --- AUTO-MINIMIZE EFFECT (SCROLL & INACTIVITY) ---
  useEffect(() => {
    // 1. Inactivity Timer
    if (playerState === PlayerState.PLAYING && !isMinimized) {
      if (inactivityTimeoutRef.current) clearTimeout(inactivityTimeoutRef.current);
      inactivityTimeoutRef.current = setTimeout(() => {
        setIsMinimized(true);
      }, 10000);
    }

    // 2. Scroll Detection (Minimize at bottom, Maximize on scroll up)
    const handleScroll = () => {
      const exploreSection = document.getElementById('explore-section');
      const bottomThreshold = 100; // px from bottom
      const isAtBottom = (window.innerHeight + window.scrollY) >= document.body.offsetHeight - bottomThreshold;

      if (isAtBottom && !isMinimized) {
        setIsMinimized(true);
      } else if (isMinimized && exploreSection) {
        const rect = exploreSection.getBoundingClientRect();
        // If the top of the explore section is below the middle of the screen, maximize
        if (rect.top > window.innerHeight * 0.4) {
          setIsMinimized(false);
        }
      }
    };

    window.addEventListener('scroll', handleScroll);

    return () => {
      if (inactivityTimeoutRef.current) clearTimeout(inactivityTimeoutRef.current);
      window.removeEventListener('scroll', handleScroll);
    };
  }, [playerState, isMinimized, lastInteraction]);

  // --- SLEEP TIMER EFFECT ---
  const FADE_DURATION = 30; // Increased to 30 seconds for smoother transition

  useEffect(() => {
    if (sleepTimer > 0) {
      setTimeLeft(sleepTimer * 60);
    } else {
      setTimeLeft(null);
      // Reset volume if timer is cancelled manually
      if (audioRef.current) audioRef.current.volume = 1;
      if (rainRef.current) rainRef.current.volume = rainVolume;
    }
  }, [sleepTimer]);

  useEffect(() => {
    if (timeLeft === null) return;

    if (timeLeft <= 0) {
      stopPlayback();
      setSleepTimer(0);
      setTimeLeft(null);
      return;
    }

    // Smart Logarithmic Fade Out Logic
    if (timeLeft <= FADE_DURATION) {
      const x = timeLeft / FADE_DURATION;
      const vol = x * x; // Quadratic fade for natural perception

      if (audioRef.current) audioRef.current.volume = Math.max(0, vol);
      if (rainRef.current) rainRef.current.volume = Math.max(0, rainVolume * vol);
    }

    const interval = setInterval(() => {
      setTimeLeft(prev => (prev !== null ? prev - 1 : null));
    }, 1000);

    return () => clearInterval(interval);
  }, [timeLeft]);


  // --- AUDIO LOGIC ---
  // Rain Layer Effect
  useEffect(() => {
    const rain = rainRef.current;
    if (rain) {
      // Apply fade if timer is active and in fade window
      if (!timeLeft || timeLeft > FADE_DURATION) {
        rain.volume = rainVolume;
      }

      if (rainLayerActive) {
        if (rain.paused) {
          rain.play().catch(e => console.warn("Rain play failed:", e));
        }
      } else {
        if (!rain.paused) rain.pause();
      }
    }
  }, [rainLayerActive, rainVolume, timeLeft]);

  // --- SPATIAL AUDIO EFFECT ---
  useEffect(() => {
    if (audioRef.current && !SpatialAudioService.isInit()) {
      SpatialAudioService.init(audioRef.current);
    }
  }, [audioRef.current]);

  useEffect(() => {
    if (isSpatial) {
      SpatialAudioService.startOrbitAnimation();
    } else {
      SpatialAudioService.reset();
    }
  }, [isSpatial]);

  useEffect(() => {
    if (isHapticActive) {
      HapticService.start();
    } else {
      HapticService.stop();
    }
  }, [isHapticActive]);

  // --- BACKGROUND & MEDIA SESSION EFFECT ---
  useEffect(() => {
    if (activeSoundItem && currentSound) {
      BackgroundAudioService.updateMetadata(currentSound, {
        onPlay: togglePlay,
        onPause: togglePlay,
        onNext: onNext,
        onPrev: onPrev
      });
    }
  }, [activeSoundItem, currentSound?.id]);

  useEffect(() => {
    BackgroundAudioService.updatePlaybackState(
      playerState === PlayerState.PLAYING ? 'playing' :
        playerState === PlayerState.PAUSED ? 'paused' : 'none'
    );
  }, [playerState]);

  // --- WATCH PARTY SYNC EFFECT ---
  const handleSessionUpdate = (state: SessionState) => {
    if (state.host_id === userId) return; // Don't sync with ourselves

    setIsRemoteUpdate(true);

    // 1. Sync Sound
    if (state.current_sound_id !== currentSound?.id) {
      const sound = categories.find(c => c.id === state.current_sound_id);
      if (sound) setCurrentSound(sound);
    }

    // 2. Sync Variation
    if (state.variation_index !== activeVariationIndex) {
      onVariationChange(state.variation_index);
    }

    // 3. Sync Playback State
    if (state.is_playing && playerState !== PlayerState.PLAYING) {
      audioRef.current?.play();
      setPlayerState(PlayerState.PLAYING);
    } else if (!state.is_playing && playerState === PlayerState.PLAYING) {
      audioRef.current?.pause();
      setPlayerState(PlayerState.PAUSED);
    }

    // 4. Sync Position (if far apart)
    if (audioRef.current && Math.abs(state.playback_position - progress) > 5) {
      const time = (state.playback_position / 100) * audioRef.current.duration;
      audioRef.current.currentTime = time;
      setProgress(state.playback_position);
    }

    // Reset remote update flag after processing (might need a timeout if state changes are async)
    setTimeout(() => setIsRemoteUpdate(false), 500);
  };

  useEffect(() => {
    if (sessionId && userId && playerState !== PlayerState.STOPPED) {
      const updateSession = async () => {
        if (isRemoteUpdate) return;

        await ListenPartyService.updateSession(userId, sessionId, {
          current_sound_id: currentSound?.id,
          variation_index: activeVariationIndex,
          is_playing: playerState === PlayerState.PLAYING,
          playback_position: progress
        });
      };

      updateSession();
    }
  }, [playerState, activeVariationIndex, currentSound?.id, sessionId]);

  const handleCreateSession = async () => {
    if (!userId || !currentSound) return;
    const id = await ListenPartyService.createSession(userId, currentSound.id, activeVariationIndex);
    if (id) {
      setSessionId(id);
      setChatMessages([]);
      ListenPartyService.joinSession(id, handleSessionUpdate, (msg) => {
        setChatMessages(prev => [...prev, msg]);
      });
    }
  };

  const handleJoinSession = async (code: string) => {
    const success = await ListenPartyService.joinSession(code, handleSessionUpdate, (msg) => {
      setChatMessages(prev => [...prev, msg]);
    });
    if (success) {
      setSessionId(code);
      setChatMessages([]);
      setIsListenPartyModalOpen(false);
    }
  };

  const handleSendMessage = async (text: string) => {
    if (!userId) return;
    await ListenPartyService.sendMessage({
      id: crypto.randomUUID(),
      senderId: userId,
      text
    });
  };

  const handleSendMessageWithParam = async (text: string) => {
    if (!userId) return;
    await ListenPartyService.sendMessage({
      id: crypto.randomUUID(),
      senderId: userId,
      text
    });
  };

  const handleLeaveSession = () => {
    ListenPartyService.leaveSession();
    setSessionId(null);
  };



  useEffect(() => {
    if (playerState === PlayerState.PLAYING && audioRef.current) {
      const audio = audioRef.current;
      const interval = setInterval(() => {
        BackgroundAudioService.updatePosition(audio.duration, audio.playbackRate, audio.currentTime);
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [playerState]);

  // Main Audio Effect
  useEffect(() => {
    if (activeSoundItem && audioRef.current) {
      setError(null);
      setIsLoading(true);

      const audio = audioRef.current;

      // Prevent redundant loads
      if (audio.src !== activeSoundItem.url) {
        audio.src = activeSoundItem.url;
        audio.load();

        const handleCanPlay = () => {
          setIsLoading(false);
          if (playerState === PlayerState.PLAYING) {
            audio.play().catch(e => {
              if (e.name !== 'AbortError') console.warn("Autoplay prevent:", e);
            });
          }
        };

        audio.addEventListener('canplay', handleCanPlay, { once: true });
        return () => audio.removeEventListener('canplay', handleCanPlay);
      } else {
        setIsLoading(false);
      }
    }
  }, [activeSoundItem, playerState]);

  // Reset variation and fetch creator when category changes
  useEffect(() => {
    onVariationChange(0);
    if (playerState === PlayerState.STOPPED) {
      setProgress(0);
    }

    if (currentSound) {
      CreatorService.getCreatorByCategoryId(currentSound.id).then(setCreator);
    }
  }, [currentSound?.id]);

  const togglePlay = async () => {
    registerInteraction();
    if (!audioRef.current) return;

    // Browser gesture requirement: Resume AudioContext on every interaction
    await SpatialAudioService.resume();

    if (playerState === PlayerState.PLAYING) {
      audioRef.current.pause();
      setPlayerState(PlayerState.PAUSED);
    } else {
      setError(null);

      // Ensure source is set correctly before playing
      const currentSrc = audioRef.current.src;
      const targetSrc = activeSoundItem?.url;

      if (targetSrc && (!currentSrc || currentSrc === window.location.href || !currentSrc.includes(targetSrc))) {
        audioRef.current.src = targetSrc;
        audioRef.current.load();
      }

      setIsLoading(true);
      try {
        await audioRef.current.play();
        setPlayerState(PlayerState.PLAYING);
      } catch (err: any) {
        if (err.name !== 'AbortError') {
          console.error("Playback failed:", err);
          setError('Audio unavailable.');
          setPlayerState(PlayerState.STOPPED);
        }
      } finally {
        setIsLoading(false);
      }
    }
  };

  const stopPlayback = () => {
    registerInteraction();
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current.volume = 1; // Reset volume
      setPlayerState(PlayerState.STOPPED);
      setProgress(0);
      setIsLoading(false);
      BackgroundAudioService.updatePlaybackState('none');
    }
  };

  const handleTimeUpdate = () => {
    // Only update progress if user is NOT dragging the slider
    if (audioRef.current && !isDragging) {
      const p = (audioRef.current.currentTime / (audioRef.current.duration || 1)) * 100;
      setProgress(p || 0);
    }
  };

  const handleSeekStart = () => {
    setIsDragging(true);
    registerInteraction();
  };

  const handleSeekEnd = (e: React.MouseEvent<HTMLInputElement> | React.TouchEvent<HTMLInputElement>) => {
    setIsDragging(false);
    if (audioRef.current && audioRef.current.duration) {
      // Force update logic if needed on release
      const val = parseFloat((e.target as HTMLInputElement).value);
      const time = (val / 100) * audioRef.current.duration;
      audioRef.current.currentTime = time;
      BackgroundAudioService.updatePosition(audioRef.current.duration, audioRef.current.playbackRate, time);
    }
  };

  const handleProgressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    registerInteraction();
    const val = parseFloat(e.target.value);
    setProgress(val);

    // Optional: Real-time seeking while dragging (can be resource intensive)
    if (audioRef.current && audioRef.current.duration) {
      const time = (val / 100) * audioRef.current.duration;
      // Check if value is valid number
      if (isFinite(time)) {
        audioRef.current.currentTime = time;
      }
    }
  };

  const nextVariation = () => {
    registerInteraction();
    if (currentSound) {
      onVariationChange((activeVariationIndex + 1) % currentSound.sounds.length);
    }
  };

  const prevVariation = () => {
    registerInteraction();
    if (currentSound) {
      onVariationChange((activeVariationIndex - 1 + currentSound.sounds.length) % currentSound.sounds.length);
    }
  };

  const toggleSleep = () => {
    registerInteraction();
    const modes: (0 | 15 | 30 | 45 | 60 | 90)[] = [0, 15, 30, 45, 60, 90];
    const nextIndex = (modes.indexOf(sleepTimer) + 1) % modes.length;
    setSleepTimer(modes[nextIndex]);
  };

  if (!currentSound) return null;

  return (
    <>
      {/* ALWAYS RENDERED AUDIO ELEMENTS */}
      {/* Removed crossOrigin="anonymous" to fix compatibility with SoundBible/older servers that don't send CORS headers */}
      <audio
        ref={audioRef}
        crossOrigin="anonymous"
        playsInline
        preload="auto"
        loop={isLooping}
        onCanPlay={() => {
          setIsLoading(false);
          setError(null);
        }}
        onError={(e) => {
          const errMsg = (e.target as HTMLAudioElement).error?.message || 'Source failed';
          console.error("Audio Load Error:", errMsg);
          setIsLoading(false);
          // Only show error if we are supposed to be playing/loading
          if (activeSoundItem && (playerState === PlayerState.PLAYING || isLoading)) {
            setError('Audio unavailable.');
          }
          if (playerState === PlayerState.PLAYING) setPlayerState(PlayerState.STOPPED);
        }}
        onTimeUpdate={handleTimeUpdate}
        onEnded={() => {
          if (!isLooping) {
            if (isShuffled) {
              onNext();
            } else {
              nextVariation();
            }
          }
        }}
      />

      <audio
        ref={rainRef}
        src={RAIN_SOUND_URL}
        loop
        preload="auto"
      />

      {/* RENDER UI BASED ON STATE */}
      {isMinimized ? (
        // MINIMIZED VIEW
        <div
          onMouseEnter={registerInteraction}
          onClick={() => setIsMinimized(false)}
          className={`fixed bottom-6 right-4 md:right-8 z-[60] cursor-pointer transition-all duration-500 animate-in slide-in-from-bottom-10 fade-in zoom-in-95 group`}
        >
          <div className={`relative flex items-center p-2 pr-4 rounded-full shadow-2xl backdrop-blur-xl border border-white/10 overflow-hidden ${isNightMode ? 'bg-slate-900/90 text-white shadow-black/50' : 'bg-white/90 text-slate-800 shadow-pink-200/50'
            }`}>
            {/* Progress Bar Background for Minimized View */}
            <div className="absolute bottom-0 left-0 h-[2px] bg-pink-500 z-0 transition-all duration-300" style={{ width: `${progress}%` }} />

            {/* Icon / Spinner */}
            <div className={`relative w-10 h-10 rounded-full flex items-center justify-center text-lg z-10 shrink-0 ${currentSound ? currentSound.color : 'bg-slate-200 text-slate-400'} ${playerState === PlayerState.PLAYING ? 'animate-spin-slow' : ''}`}>
              {isLoading ? <Loader2 size={16} className="animate-spin text-pink-600" /> : (currentSound ? currentSound.icon : <Sparkles size={20} />)}
            </div>

            {/* Text Info */}
            <div className="flex flex-col mx-3 z-10 min-w-[100px] max-w-[140px]">
              <span className="text-xs font-bold truncate">{activeSoundItem?.name || "Select a trigger"}</span>
              <span className="text-[10px] opacity-70 truncate">{currentSound ? currentSound.name : "ASMR with MAPA"}</span>
            </div>

            {/* Mini Controls */}
            <div className="flex items-center space-x-2 z-10">
              <button
                onClick={(e) => { e.stopPropagation(); togglePlay(); }}
                className="w-8 h-8 rounded-full bg-pink-500 text-white flex items-center justify-center hover:bg-pink-600 transition-colors shadow-lg"
              >
                {playerState === PlayerState.PLAYING ? <Pause size={12} fill="white" /> : <Play size={12} fill="white" className="ml-0.5" />}
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); setIsMinimized(false); }}
                className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors hover:bg-black/5 dark:hover:bg-white/10`}
              >
                <Maximize2 size={14} />
              </button>
            </div>
          </div>
        </div>
      ) : (
        // EXPANDED VIEW
        <div
          onMouseEnter={registerInteraction}
          onMouseMove={registerInteraction}
          onTouchStart={registerInteraction}
          className={`fixed bottom-0 left-0 right-0 z-50 transition-all duration-500 animate-in slide-in-from-bottom-full`}
        >
          {/* Container with "Breathing" Glow when Playing */}
          <div className={`relative p-4 md:p-6 backdrop-blur-xl border-t transition-all duration-700 rounded-t-[3rem]
            ${isVisualizerActive ? 'bg-slate-950/90 border-pink-500/50 min-h-[140px]' : isNightMode ? 'bg-slate-900/95 border-slate-700' : 'bg-white/95 border-pink-200'}
            ${playerState === PlayerState.PLAYING ? 'shadow-[0_-5px_30px_-5px_rgba(236,72,153,0.3)]' : 'shadow-[0_-10px_40px_rgba(0,0,0,0.1)]'}
          `}>
            <div className="absolute inset-0 overflow-hidden pointer-events-none rounded-t-[3rem]">
              <VisualizerSpectrum isActive={isVisualizerActive} isEmbedded={true} />
            </div>
            {/* Minimize Handle */}
            <button
              onClick={() => setIsMinimized(true)}
              className="absolute -top-10 right-4 bg-pink-500 text-white px-4 py-2 rounded-t-xl font-bold text-xs flex items-center space-x-2 shadow-lg hover:bg-pink-600 transition-colors"
            >
              <Minimize2 size={14} />
              <span className="hidden sm:inline">Minimize</span>
            </button>

            {error && (
              <div className="absolute -top-14 left-1/2 -translate-x-1/2 bg-rose-600 text-white px-6 py-2 rounded-full text-xs font-bold flex items-center space-x-2 animate-bounce shadow-xl z-50">
                <AlertCircle size={14} />
                <span>{error}</span>
              </div>
            )}

            {isVisualizerActive && (
              <button
                onClick={() => setIsVisualizerActive(false)}
                className="absolute -top-10 left-4 bg-slate-900 text-white px-4 py-2 rounded-t-xl font-bold text-xs flex items-center space-x-2 shadow-lg border-t border-x border-pink-500/50 hover:bg-slate-800 transition-colors z-[60]"
              >
                <X size={14} className="text-pink-500" />
                <span>Exit Visualizer</span>
              </button>
            )}

            <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6 relative z-10">

              {/* LEFT: Track Info */}
              <div className="flex items-center space-x-5 w-full md:w-1/3">
                {!currentSound ? (
                  <>
                    <div className="relative w-16 h-16 md:w-20 md:h-20 rounded-2xl flex items-center justify-center text-3xl shadow-lg border-2 border-dashed border-pink-200 bg-pink-50 text-pink-300">
                      <Sparkles size={32} />
                    </div>
                    <div className="space-y-1">
                      <h3 className={`font-black text-[10px] uppercase tracking-[0.2em] ${isNightMode ? 'text-slate-500' : 'text-slate-400'}`}>
                        Welcome to the sanctuary
                      </h3>
                      <h2 className={`font-black text-xl md:text-2xl tracking-tighter ${isNightMode ? 'text-white' : 'text-slate-900'}`}>
                        Select a trigger
                      </h2>
                      <p className="text-[10px] font-medium text-pink-500/60 uppercase tracking-widest leading-relaxed">
                        Choose a sound to start relaxation
                      </p>
                    </div>
                  </>
                ) : (
                  <>
                    <div className={`relative w-16 h-16 md:w-20 md:h-20 rounded-2xl flex items-center justify-center text-3xl shadow-lg border-2 border-white/40 ${currentSound.color}`}>
                      {currentSound.icon}
                      {isLoading && (
                        <div className="absolute inset-0 bg-white/60 rounded-2xl flex items-center justify-center">
                          <Loader2 size={32} className="text-pink-500 animate-spin" />
                        </div>
                      )}
                    </div>
                    <div className="overflow-hidden space-y-1">
                      <h3 className={`font-black text-[10px] uppercase tracking-[0.2em] ${isNightMode ? 'text-slate-500' : 'text-slate-400'}`}>
                        {currentSound.name}
                      </h3>
                      <h2 className={`font-black text-xl md:text-2xl tracking-tighter truncate ${isNightMode ? 'text-white' : 'text-slate-900'}`}>
                        {activeSoundItem?.name || "Loading..."}
                      </h2>
                      <div className="flex items-center space-x-2">
                        <button onClick={prevVariation} className="p-1.5 rounded-lg bg-pink-100 text-pink-600 hover:bg-pink-200 transition-colors"><ChevronDown size={14} /></button>
                        <span className="text-xs font-black text-pink-600 bg-pink-50 px-3 py-1 rounded-full border border-pink-100 whitespace-nowrap">
                          {activeVariationIndex + 1} / {currentSound.sounds.length}
                        </span>
                        <button onClick={nextVariation} className="p-1.5 rounded-lg bg-pink-100 text-pink-600 hover:bg-pink-200 transition-colors"><ChevronUp size={14} /></button>
                      </div>
                      {creator && (
                        <button
                          onClick={() => setIsTipModalOpen(true)}
                          className="mt-2 flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-pink-50 text-pink-500 border border-pink-100 hover:bg-pink-100 transition-all text-[10px] font-black uppercase tracking-widest group"
                        >
                          <Heart size={10} className="group-hover:scale-125 transition-transform" fill={isNightMode ? "none" : "currentColor"} /> Support {creator.name}
                        </button>
                      )}
                    </div>
                  </>
                )}
              </div>

              {/* CENTER: Controls & Progress */}
              <div className={`flex flex-col items-center w-full md:w-1/3 space-y-4 transition-opacity duration-300 ${!currentSound ? 'opacity-30 pointer-events-none' : 'opacity-100'}`}>
                <div className="flex items-center space-x-6">
                  <button
                    onClick={() => setIsShuffled(!isShuffled)}
                    className={`transition-colors p-2 hover:bg-black/5 rounded-full ${isShuffled ? 'text-pink-500' : isNightMode ? 'text-slate-500' : 'text-slate-400'}`}
                  ><Shuffle size={18} /></button>

                  <button onClick={onPrev} className={`hover:text-pink-500 transition-colors ${isNightMode ? 'text-white' : 'text-slate-800'}`}><SkipBack size={24} fill="currentColor" /></button>

                  <div className="flex items-center space-x-4">
                    <button
                      onClick={togglePlay}
                      className={`w-14 h-14 md:w-16 md:h-16 rounded-full flex items-center justify-center text-white transition-all shadow-xl active:scale-95 bg-gradient-to-br from-pink-500 to-fuchsia-600 hover:scale-110 shadow-pink-200 group relative overflow-hidden`}
                    >
                      {/* Subtle shine effect */}
                      <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 rounded-full" />
                      {playerState === PlayerState.PLAYING ? <Pause size={28} fill="white" /> : <Play size={28} className="ml-1" fill="white" />}
                    </button>

                    <button
                      onClick={stopPlayback}
                      title="Stop"
                      className="w-10 h-10 rounded-full flex items-center justify-center bg-slate-100 text-slate-500 hover:bg-slate-200 transition-all active:scale-90"
                    >
                      <Square size={16} fill="currentColor" />
                    </button>
                  </div>

                  <button onClick={onNext} className={`hover:text-pink-500 transition-colors ${isNightMode ? 'text-white' : 'text-slate-800'}`}><SkipForward size={24} fill="currentColor" /></button>

                  <button
                    onClick={() => setIsLooping(!isLooping)}
                    className={`transition-colors p-2 hover:bg-black/5 rounded-full ${isLooping ? 'text-pink-500' : isNightMode ? 'text-slate-500' : 'text-slate-400'}`}
                  ><Repeat size={18} /></button>
                </div>

                <div className="w-full flex items-center space-x-3">
                  <span className="text-[10px] font-mono text-slate-400 w-10 text-right">
                    {audioRef.current ? Math.floor(audioRef.current.currentTime / 60) + ':' + (Math.floor(audioRef.current.currentTime % 60)).toString().padStart(2, '0') : '0:00'}
                  </span>
                  <input
                    type="range"
                    className="flex-1 accent-pink-500 h-1.5 rounded-lg appearance-none cursor-pointer bg-pink-100"
                    value={progress}
                    onMouseDown={handleSeekStart}
                    onTouchStart={handleSeekStart}
                    onChange={handleProgressChange}
                    onMouseUp={handleSeekEnd}
                    onTouchEnd={handleSeekEnd}
                    max="100"
                  />
                  <span className="text-[10px] font-mono text-slate-400 w-10">
                    {audioRef.current && isFinite(audioRef.current.duration) ? Math.floor(audioRef.current.duration / 60) + ':' + (Math.floor(audioRef.current.duration % 60)).toString().padStart(2, '0') : '0:00'}
                  </span>
                </div>
              </div>

              {/* RIGHT: Essential Tools & Pro Menu */}
              <div className="flex items-center justify-center md:justify-end gap-3 w-full md:w-1/3 mt-4 md:mt-0 relative">

                {/* Rain Toggle */}
                <button
                  onClick={onToggleRain}
                  className={`flex items-center justify-center w-12 h-12 rounded-2xl transition-all duration-300 group
                    ${rainLayerActive
                      ? 'bg-gradient-to-br from-blue-400 to-indigo-600 text-white shadow-lg shadow-blue-500/20'
                      : isNightMode ? 'bg-slate-800/50 text-slate-500 hover:text-blue-400' : 'bg-white/50 text-slate-400 hover:text-blue-400'
                    }`}
                  title="Rain Layer"
                >
                  <CloudRain size={20} className={rainLayerActive ? 'animate-bounce-subtle' : 'group-hover:scale-110 transition-transform'} />
                </button>

                {/* Bio-Sync Toggle */}
                <button
                  onClick={() => setIsBioSyncOpen(!isBioSyncOpen)}
                  className={`flex items-center justify-center w-12 h-12 rounded-2xl transition-all duration-300 group
                    ${isBioSyncOpen
                      ? 'bg-gradient-to-br from-red-400 to-rose-600 text-white shadow-lg shadow-red-500/20'
                      : isNightMode ? 'bg-slate-800/50 text-slate-500 hover:text-red-400' : 'bg-white/50 text-slate-400 hover:text-red-400'
                    }`}
                  title="Bio-Sync"
                >
                  <Activity size={20} className={isBioSyncOpen ? 'animate-pulse' : 'group-hover:scale-110 transition-transform'} />
                </button>

                {/* BioSync Popover */}
                {isBioSyncOpen && (
                  <div className="absolute bottom-16 right-0 z-20 w-[300px] animate-in slide-in-from-bottom-2">
                    <BioSyncControl
                      isPremium={isPremium}
                      onOpenPremium={onOpenPremium || (() => { })}
                      isNightMode={isNightMode}
                    />
                  </div>
                )}

                {/* Rain Volume Slider Popover (Only when active) */}
                {rainLayerActive && (
                  <div className="absolute bottom-16 right-12 z-20 px-4 py-3 bg-slate-900/90 backdrop-blur-xl rounded-2xl border border-slate-700 shadow-xl animate-in slide-in-from-bottom-2">
                    <div className="flex items-center gap-3">
                      <CloudRain size={14} className="text-blue-400" />
                      <input
                        type="range" min="0" max="1" step="0.01"
                        className="w-32 accent-blue-500 h-1 bg-slate-700 rounded-full appearance-none cursor-pointer"
                        value={rainVolume}
                        onChange={(e) => onRainVolumeChange(parseFloat(e.target.value))}
                      />
                    </div>
                  </div>
                )}

                {/* Sleep Timer */}
                <button
                  onClick={toggleSleep}
                  className={`flex items-center justify-center w-12 h-12 rounded-2xl transition-all duration-300 group
                    ${sleepTimer > 0
                      ? 'bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-lg shadow-indigo-500/20'
                      : isNightMode ? 'bg-slate-800/50 text-slate-500 hover:text-indigo-400' : 'bg-white/50 text-slate-400 hover:text-indigo-400'
                    }`}
                  title="Sleep Timer"
                >
                  <Clock size={20} className={sleepTimer > 0 ? '' : 'group-hover:scale-110 transition-transform'} />
                  {sleepTimer > 0 && (
                    <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[8px] font-bold text-white border-2 border-slate-900">
                      {timeLeft ? Math.ceil(timeLeft / 60) : sleepTimer}
                    </span>
                  )}
                </button>

                <button
                  onClick={onToggleVoice}
                  className={`relative p-3 rounded-full transition-all duration-300 transform active:scale-90 flex items-center justify-center border-2 group
                    ${isVoiceActive
                      ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40 shadow-[0_0_15px_rgba(16,185,129,0.3)]'
                      : isNightMode ? 'bg-slate-800 text-slate-400 border-slate-700' : 'bg-slate-100 text-slate-400 border-slate-200'
                    }`}
                  title={isVoiceActive ? "Stop Voice Control" : "Start Voice Control"}
                >
                  <div className="absolute inset-0 bg-emerald-500/10 rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
                  {isVoiceActive ? <Mic size={20} className="animate-pulse" /> : <MicOff size={20} />}
                  {isVoiceActive && (
                    <span className="absolute -top-1 -right-1 flex h-3 w-3 items-center justify-center">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                    </span>
                  )}
                </button>

                <div className="w-px h-8 bg-slate-500/20 mx-1" />

                {/* Help button */}
                <div className="relative">
                  <button
                    onClick={() => { setIsHelpOpen(!isHelpOpen); setOpenToolsMenu(false); }}
                    title="Help & Support"
                    className={`flex items-center justify-center w-12 h-12 rounded-2xl transition-all duration-300 group
                      ${isHelpOpen
                        ? 'bg-purple-600 text-white shadow-lg shadow-purple-700/30'
                        : isNightMode ? 'bg-slate-800/50 text-slate-500 hover:text-purple-400' : 'bg-white/50 text-slate-400 hover:text-purple-500'
                      }`}
                  >
                    <HelpCircle size={20} className="group-hover:scale-110 transition-transform" />
                  </button>

                  {/* Help popover */}
                  {isHelpOpen && (
                    <>
                      {/* Backdrop to close on outside click */}
                      <div className="fixed inset-0 z-30" onClick={() => setIsHelpOpen(false)} />
                      <div className="absolute bottom-full right-0 mb-3 z-40 animate-in slide-in-from-bottom-2 duration-200 origin-bottom-right">
                        <ContextualHelp
                          isOpen={isHelpOpen}
                          onClose={() => setIsHelpOpen(false)}
                          context="audio"
                          isNightMode={isNightMode}
                        />
                      </div>
                    </>
                  )}
                </div>

                {/* PRO TOOLS MENU BUTTON */}
                <div className="relative">
                  <button
                    onClick={() => setOpenToolsMenu(!openToolsMenu)}
                    className={`flex items-center gap-2 px-5 py-3 rounded-2xl font-bold transition-all duration-300 shadow-lg active:scale-95
                      ${openToolsMenu
                        ? 'bg-slate-900 text-white ring-2 ring-pink-500 ring-offset-2 ring-offset-slate-900'
                        : 'bg-gradient-to-r from-pink-500 to-rose-500 text-white hover:brightness-110 shadow-pink-500/20'
                      }`}
                  >
                    <Sparkles size={18} className={openToolsMenu ? 'rotate-12' : ''} />
                    <span>Tools</span>
                  </button>

                  {/* PRO MENU DROPDOWN */}
                  {openToolsMenu && (
                    <>
                      <div className="fixed inset-0 z-30" onClick={() => setOpenToolsMenu(false)} />
                      <div className="absolute bottom-full right-0 mb-4 w-64 bg-slate-900/95 backdrop-blur-2xl border border-slate-700/50 rounded-3xl p-2 shadow-2xl z-40 animate-in slide-in-from-bottom-2 duration-200 origin-bottom-right">
                        <div className="text-[10px] font-black uppercase tracking-widest text-slate-500 px-4 py-2">Pro Suite</div>

                        <div className="space-y-1">
                          {/* Ask Mapa */}
                          <button
                            onClick={() => {
                              isPremium ? onOpenAskMapa?.() : onOpenPremium?.();
                              setOpenToolsMenu(false);
                            }}
                            className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 transition-colors group text-left"
                          >
                            <div className="p-2 bg-pink-500/20 text-pink-400 rounded-lg group-hover:bg-pink-500 group-hover:text-white transition-colors">
                              <Sparkles size={16} />
                            </div>
                            <div className="flex-1">
                              <div className="font-bold text-white text-xs">Ask Mapa</div>
                              <div className="text-[10px] text-slate-400">Your AI Guide</div>
                            </div>
                            {!isPremium && <Lock size={12} className="text-amber-500" />}
                          </button>

                          {/* 8D Audio */}
                          <button
                            onClick={() => {
                              isPremium ? setIsSpatial(!isSpatial) : onOpenPremium?.();

                            }}
                            className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 transition-colors group text-left"
                          >
                            <div className={`p-2 rounded-lg transition-colors ${isSpatial ? 'bg-amber-500 text-slate-900' : 'bg-amber-500/10 text-amber-500 group-hover:bg-amber-500 group-hover:text-slate-900'}`}>
                              <Headset size={16} />
                            </div>
                            <div className="flex-1">
                              <div className="font-bold text-white text-xs">8D Spatial Audio</div>
                              <div className="text-[10px] text-slate-400">{isSpatial ? 'Active' : 'Off'}</div>
                            </div>
                            {!isPremium && <Lock size={12} className="text-amber-500" />}
                          </button>

                          {/* Visualizer */}
                          <button
                            onClick={() => {
                              setIsVisualizerActive(!isVisualizerActive);

                            }}
                            className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 transition-colors group text-left"
                          >
                            <div className={`p-2 rounded-lg transition-colors ${isVisualizerActive ? 'bg-cyan-500 text-slate-900' : 'bg-cyan-500/10 text-cyan-500 group-hover:bg-cyan-500 group-hover:text-slate-900'}`}>
                              <Waves size={16} />
                            </div>
                            <div className="flex-1">
                              <div className="font-bold text-white text-xs">Audio Visualizer</div>
                              <div className="text-[10px] text-slate-400">{isVisualizerActive ? 'Active' : 'Off'}</div>
                            </div>
                          </button>

                          {/* Haptic */}
                          <button
                            onClick={() => {
                              setIsHapticActive(!isHapticActive);

                            }}
                            className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 transition-colors group text-left"
                          >
                            <div className={`p-2 rounded-lg transition-colors ${isHapticActive ? 'bg-orange-500 text-slate-900' : 'bg-orange-500/10 text-orange-500 group-hover:bg-orange-500 group-hover:text-slate-900'}`}>
                              <Zap size={16} />
                            </div>
                            <div className="flex-1">
                              <div className="font-bold text-white text-xs">Haptic Rhythm</div>
                              <div className="text-[10px] text-slate-400">{isHapticActive ? 'Active' : 'Off'}</div>
                            </div>
                          </button>

                          {/* Listen Party */}
                          <button
                            onClick={() => {
                              setIsListenPartyModalOpen(true);
                              setOpenToolsMenu(false);
                            }}
                            className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 transition-colors group text-left"
                          >
                            <div className={`p-2 rounded-lg transition-colors ${sessionId ? 'bg-pink-500 text-white' : 'bg-pink-500/10 text-pink-500 group-hover:bg-pink-500 group-hover:text-white'}`}>
                              <Users size={16} />
                            </div>
                            <div className="flex-1">
                              <div className="font-bold text-white text-xs">Listen Party</div>
                              <div className="text-[10px] text-slate-400">{sessionId ? 'Session Active' : 'Start/Join'}</div>
                            </div>
                          </button>

                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div >
      )}

      {
        creator && (
          <TippingModal
            isOpen={isTipModalOpen}
            onClose={() => setIsTipModalOpen(false)}
            creator={creator}
            userId={userId}
          />
        )
      }

      <ListenPartyModal
        isOpen={isListenPartyModalOpen}
        onClose={() => setIsListenPartyModalOpen(false)}
        userId={userId}
        activeSessionId={sessionId}
        onCreateSession={handleCreateSession}
        onJoinSession={handleJoinSession}
        onLeaveSession={handleLeaveSession}
        messages={chatMessages}
        onSendMessage={handleSendMessage}
        isPremium={isPremium}
        onOpenPremium={onOpenPremium || (() => { })}
      />

      <SpatialAudioEngine
        isOpen={isSpatialEngineOpen}
        onClose={() => setIsSpatialEngineOpen(false)}
      />

      <AISoundscapeArchitect
        isOpen={isAIArchitectOpen}
        onClose={() => setIsAIArchitectOpen(false)}
        categories={categories}
        onApply={(categoryId, rainVol, rainActive) => {
          const sound = categories.find(c => c.id === categoryId);
          if (sound) setCurrentSound(sound);

          if (rainActive !== rainLayerActive) onToggleRain();
          if (rainActive) onRainVolumeChange(rainVol);
        }}
      />
    </>
  );
});

export default Player;
