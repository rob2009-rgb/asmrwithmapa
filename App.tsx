import React, { useState, useEffect } from 'react';
import { supabase } from './src/supabaseClient';
import Header from './components/Header';
import Player from './components/Player';
import SoundCard from './components/SoundCard';
import MerchShop from './components/MerchShop';
import AdminDashboard from './components/AdminDashboard';
import { loadSoundLibrary } from './utils/soundManager';
import { SoundCategory, UserPreferences, PlayerState } from './types';
import { Lock, Sparkles, Youtube, Instagram, Music, Heart } from 'lucide-react';
import { NotificationProvider } from './src/contexts/NotificationContext';
import { ToastContainer } from './components/ui/ToastContainer';
import { AuthModal } from './src/components/auth/AuthModal';
import { ProfileHub } from './src/components/profile/ProfileHub';
import { UpdatePrompt } from './src/components/pwa/UpdatePrompt';
import { MoodSelector } from './src/components/mood/MoodSelector';
import { useStreaks } from './src/hooks/useStreaks';
import { FeatureGuideModal } from './src/components/modals/FeatureGuideModal';
import { CommunityMarketplace } from './src/components/community/CommunityMarketplace';
import { VoiceControlManager } from './src/components/voice/VoiceControlManager';
import { ZenMode } from './src/components/zen/ZenMode';
import { PlayerHandle } from './types';
import { DiscoveryModal } from './src/components/modals/DiscoveryModal';
import { ChallengesModal } from './src/components/modals/ChallengesModal';
import { TriggerJourney } from './src/components/onboarding/TriggerJourney';
import { AskMapaChat } from './src/components/features/AskMapaChat';
import SystemStatusBanner from './src/components/ui/SystemStatusBanner';
import { LandingPage } from './components/LandingPage';

const App: React.FC = () => {
  const playerRef = React.useRef<PlayerHandle>(null);
  const [categories, setCategories] = useState<SoundCategory[]>([]);
  const [currentSound, setCurrentSound] = useState<SoundCategory | null>(null);
  const [user, setUser] = useState<any>(null);
  const [activeVariationIndex, setActiveVariationIndex] = useState(0);
  const { streak } = useStreaks(user?.id);

  const [isAskMapaOpen, setIsAskMapaOpen] = useState(false);
  const [askMapaInitialMessage, setAskMapaInitialMessage] = useState('');

  const [prefs, setPrefs] = useState<UserPreferences>({
    isNightMode: false,
    isPremiumUser: false,
    rainLayerVolume: 0.3,
    isRainActive: false
  });
  const [isShopOpen, setIsShopOpen] = useState(false);
  const [isPremiumModalOpen, setIsPremiumModalOpen] = useState(false);
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isGuideOpen, setIsGuideOpen] = useState(false);
  const [isMarketplaceOpen, setIsMarketplaceOpen] = useState(false);
  const [isLandingOpen, setIsLandingOpen] = useState(false);
  const [isZenMode, setIsZenMode] = useState(false);
  const [isDiscoveryOpen, setIsDiscoveryOpen] = useState(false);
  const [isChallengesOpen, setIsChallengesOpen] = useState(false);
  const [isTriggerJourneyOpen, setIsTriggerJourneyOpen] = useState(false);
  const [isVoiceControlActive, setIsVoiceControlActive] = useState(false);
  const [playerState, setPlayerState] = useState<PlayerState>(PlayerState.STOPPED);

  const refreshLibrary = async (isInitial = false) => {
    const loaded = await loadSoundLibrary();
    setCategories(loaded);

    // If we already have a sound selected, try to find it in the new library
    if (currentSound) {
      const match = loaded.find(c => c.id === currentSound.id);
      if (match) setCurrentSound(match);
    }
    // Otherwise, do nothing and keep it null for the initial "Select a trigger" state
  };

  useEffect(() => {
    refreshLibrary(true);
    supabase.auth.getSession().then(({ data: { session } }) => {
      handleSession(session);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      handleSession(session);
    });

    function handleSession(session: any) {
      setUser(session?.user ?? null);
      if (session?.user) {
        supabase.from('profiles').select('subscription_tier, role').eq('id', session.user.id).single()
          .then(({ data }) => {
            if (data) {
              const profile = data as { subscription_tier: string, role?: string };
              const isPremium = profile.subscription_tier === 'premium' || profile.subscription_tier === 'paid';
              setPrefs(prev => ({ ...prev, isPremiumUser: isPremium }));

              // Merge role into user object for Header check
              setUser((current: any) => ({ ...current, ...session.user, role: profile.role }));
            }
          });
      } else {
        setPrefs(prev => ({ ...prev, isPremiumUser: false }));
      }
    }

    const handleUpdate = () => refreshLibrary(false);
    window.addEventListener('sound-library-updated', handleUpdate);
    const handleAdminRequest = () => {
      setIsProfileOpen(false);
      setIsAdminOpen(true);
    };
    window.addEventListener('open-admin-dashboard', handleAdminRequest);

    const handleOpenAskMapa = (e: any) => {
      setAskMapaInitialMessage(e.detail?.message || '');
      setIsAskMapaOpen(true);
    };
    window.addEventListener('open-ask-mapa', handleOpenAskMapa);

    return () => {
      window.removeEventListener('sound-library-updated', handleUpdate);
      window.removeEventListener('open-admin-dashboard', handleAdminRequest);
      window.removeEventListener('open-ask-mapa', handleOpenAskMapa);
      subscription.unsubscribe();
    };
  }, []);

  const toggleNightMode = () => setPrefs(prev => ({ ...prev, isNightMode: !prev.isNightMode }));
  const toggleRain = () => setPrefs(prev => ({ ...prev, isRainActive: !prev.isRainActive }));
  const setRainVolume = (val: number) => setPrefs(prev => ({ ...prev, rainLayerVolume: val }));
  // NOTE: Premium status is read-only — set server-side by handleSession from Supabase profile.
  // The client MUST NOT toggle it locally (would be trivially exploitable).

  const handleNext = () => {
    if (!categories.length) return;
    const currentIndex = categories.findIndex(c => c.id === currentSound?.id);
    const nextIndex = (currentIndex + 1) % categories.length;
    setCurrentSound(categories[nextIndex]);
  };

  const handlePrev = () => {
    if (!categories.length) return;
    const currentIndex = categories.findIndex(c => c.id === currentSound?.id);
    const prevIndex = (currentIndex - 1 + categories.length) % categories.length;
    setCurrentSound(categories[prevIndex]);
  };

  return (
    <div className={`min-h-screen transition-all duration-700 flex flex-col ${prefs.isNightMode
      ? 'bg-slate-950 text-white'
      : 'bg-gradient-to-br from-pink-300 via-rose-300 to-pink-200 text-slate-900'
      }`}>
      <ToastContainer />
      <UpdatePrompt />
      <SystemStatusBanner />

      <Header
        user={user}
        isNightMode={prefs.isNightMode}
        isPremium={prefs.isPremiumUser}
        streak={streak}
        onToggleNightMode={toggleNightMode}
        onOpenShop={() => setIsShopOpen(true)}
        onOpenPremium={() => setIsPremiumModalOpen(true)}
        onOpenGuide={() => setIsGuideOpen(true)}
        onOpenAuth={() => {
          if (user) {
            setIsProfileOpen(true);
          } else {
            setIsAuthOpen(true);
          }
        }}
        onOpenCommunity={() => setIsMarketplaceOpen(true)}
        onOpenDiscovery={() => setIsDiscoveryOpen(true)}
        onOpenChallenges={() => setIsChallengesOpen(true)}
        onOpenZen={() => {
          if (prefs.isPremiumUser) {
            setIsZenMode(true);
          } else {
            setIsPremiumModalOpen(true);
          }
        }}
      />

      <VoiceControlManager
        onPlay={() => playerRef.current?.play()}
        onPause={() => playerRef.current?.pause()}
        onToggleRain={toggleRain}
        onNext={handleNext}
        onPrev={handlePrev}
        onVolumeUp={() => { }} // TODO: Implement if possible, or leave as no-op
        onVolumeDown={() => { }}
        isNightMode={prefs.isNightMode}
        isActive={isVoiceControlActive}
        onToggleActive={setIsVoiceControlActive}
      />

      <ZenMode
        isActive={isZenMode}
        onExit={() => setIsZenMode(false)}
        currentSoundName={currentSound?.name}
        playerState={playerState}
        onTogglePlay={() => playerRef.current?.toggle()}
        onNext={handleNext}
        onPrev={handlePrev}
        categories={categories}
        onSelectCategory={setCurrentSound}
        currentCategoryId={currentSound?.id}
      />

      <main className="flex-1 max-w-7xl mx-auto px-4 py-8 md:py-16 w-full pb-48">
        <section className="text-center mb-20 space-y-10 animate-in fade-in slide-in-from-top-4 duration-1000 relative">
          {/* Ambient Background Glow for Hero */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-4xl h-64 bg-pink-500/10 blur-[120px] pointer-events-none -z-10" />

          <div className="space-y-6">
            <div className={`inline-flex items-center gap-2.5 px-6 py-2 rounded-full border text-[11px] font-black uppercase tracking-[0.4em] mb-4 shadow-xl backdrop-blur-md transition-all duration-500
              ${prefs.isNightMode
                ? 'bg-slate-900/60 border-pink-500/30 text-pink-400 shadow-pink-900/20'
                : 'bg-white/70 border-pink-200 text-pink-600 shadow-pink-200/50'}`}>
              <Sparkles size={14} className="animate-pulse" /> Pure Relaxation
            </div>

            <h2 className={`text-6xl md:text-[10rem] font-brand font-black tracking-tighter leading-[0.85] transition-all duration-700
              ${prefs.isNightMode ? 'text-white' : 'text-slate-900'}`}>
              The <span className="block md:inline bg-gradient-to-r from-pink-500 via-fuchsia-600 to-rose-500 bg-clip-text text-transparent italic font-normal drop-shadow-sm px-2">Sanctuary</span>
            </h2>
          </div>

          <p className={`text-xl md:text-3xl max-w-3xl mx-auto font-medium leading-relaxed drop-shadow-sm transition-colors duration-500
            ${prefs.isNightMode ? 'text-slate-400' : 'text-pink-900/60'}`}>
            Experience high-fidelity sensory immersion crafted for your ultimate peace.
          </p>

          <div className="flex items-center justify-center space-x-4 pt-6">
            <span className="w-24 h-px bg-gradient-to-r from-transparent via-pink-500/50 to-transparent"></span>
            <div className={`w-3 h-3 rounded-full animate-pulse blur-[2px] ${prefs.isNightMode ? 'bg-pink-500' : 'bg-rose-500'}`}></div>
            <span className="w-24 h-px bg-gradient-to-r from-transparent via-pink-500/50 to-transparent"></span>
          </div>
        </section>

        <div className="max-w-4xl mx-auto space-y-6 mb-12">
          <MoodSelector
            categories={categories}
            onSelectCategory={setCurrentSound}
            isNightMode={prefs.isNightMode}
            isPremium={prefs.isPremiumUser}
            onOpenPremium={() => setIsPremiumModalOpen(true)}
          />

          <div className={`p-6 rounded-[2.5rem] border border-dashed transition-all duration-500 flex flex-col md:flex-row items-center gap-6 text-center md:text-left
               ${prefs.isNightMode ? 'border-slate-800 bg-slate-900/40' : 'border-pink-200 bg-white/50 backdrop-blur-sm'}`}>
            <div className="flex flex-col items-center md:items-start shrink-0">
              <div className="flex items-center gap-2 mb-1 text-pink-500">
                <Lock size={14} className="animate-pulse" />
                <span className="text-[10px] font-black uppercase tracking-[0.2em]">Pro Feature Preview</span>
              </div>
              <h4 className={`text-xl font-bold ${prefs.isNightMode ? 'text-white' : 'text-slate-800'}`}>Offline Sanctuary</h4>
            </div>
            <p className={`text-sm leading-relaxed flex-1 ${prefs.isNightMode ? 'text-slate-400' : 'text-slate-600'}`}>
              Take your relaxation anywhere without internet. Premium members will soon be able to download any trigger for offline peace.
            </p>
            <button
              onClick={() => setIsPremiumModalOpen(true)}
              className="px-6 py-3 bg-pink-500 text-white text-xs font-black uppercase tracking-widest rounded-full shadow-lg hover:scale-105 active:scale-95 transition-all whitespace-nowrap"
            >
              Get Notified
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {categories.map((sound) => (
            <SoundCard
              key={sound.id}
              sound={sound}
              isActive={currentSound?.id === sound.id}
              isNightMode={prefs.isNightMode}
              isPremiumUser={prefs.isPremiumUser}
              onSelect={setCurrentSound}
            />
          ))}
        </div>

        <section id="explore-section" className={`mt-24 p-8 md:p-12 rounded-[3.5rem] overflow-hidden relative shadow-2xl transition-all duration-500
          ${prefs.isNightMode
            ? 'bg-slate-900 border border-slate-800'
            : 'bg-black/10 border border-black/5 backdrop-blur-sm'
          }`}>
          <div className="absolute top-0 right-0 p-8 opacity-20 pointer-events-none">
            <div className="w-64 h-64 bg-pink-500 rounded-full blur-[100px]" />
          </div>

          <div className="relative z-10 flex flex-col md:flex-row items-center gap-12">
            <div className="md:w-1/2">
              <h3 className={`text-4xl font-bold mb-6 ${prefs.isNightMode ? 'text-pink-400' : 'text-pink-700'}`}>
                Explore MAPA ASMR
              </h3>
              <p className={`text-lg mb-10 font-medium ${prefs.isNightMode ? 'text-slate-300' : 'text-slate-800'}`}>
                Follow the journey for roleplays, relaxation, and exclusive content updates.
              </p>
              <div className="flex flex-wrap gap-4">
                <a
                  href="https://www.youtube.com/@asmrwithmapa/videos"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 min-w-[160px] inline-flex items-center justify-center space-x-3 px-6 py-4 bg-red-600 text-white rounded-2xl font-bold hover:bg-red-700 transition-all shadow-xl hover:scale-105 active:scale-95"
                >
                  <Youtube size={20} />
                  <span>YouTube</span>
                </a>
                <a
                  href="https://www.instagram.com/asmr.withmapa"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 min-w-[160px] inline-flex items-center justify-center space-x-3 px-6 py-4 bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-600 text-white rounded-2xl font-bold hover:shadow-pink-500/20 transition-all shadow-xl hover:scale-105 active:scale-95"
                >
                  <Instagram size={20} />
                  <span>Instagram</span>
                </a>
                <a
                  href="https://www.tiktok.com/@asmr.with.mapa"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 min-w-[160px] inline-flex items-center justify-center space-x-3 px-6 py-4 bg-slate-800 text-white rounded-2xl font-bold hover:bg-slate-700 transition-all shadow-xl hover:scale-105 active:scale-95 border border-white/5"
                >
                  <Music size={20} />
                  <span>TikTok</span>
                </a>
                <a
                  href="https://www.patreon.com/ASMRwithMAPA"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full inline-flex items-center justify-center space-x-3 px-6 py-4 bg-pink-600 text-white rounded-2xl font-bold hover:bg-pink-700 transition-all shadow-xl hover:scale-105 active:scale-95"
                >
                  <Heart size={20} />
                  <span>Support on Patreon</span>
                </a>
              </div>
            </div>

            <div className="md:w-1/2 aspect-video bg-black rounded-[2.5rem] overflow-hidden shadow-2xl border-4 border-white/20 relative z-20">
              <iframe
                width="100%"
                height="100%"
                src={`https://www.youtube.com/embed?listType=user_uploads&list=ASMRwithMAPA`}
                title="ASMR with MAPA Latest Video"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="w-full h-full"
              ></iframe>
            </div>
          </div>
        </section>

        <div className="mt-20 pt-10 border-t border-white/10 text-center pb-10 space-y-3">
          <p className={`text-[10px] opacity-30 ${prefs.isNightMode ? 'text-white' : 'text-slate-900'}`}>
            &copy; {new Date().getFullYear()} ASMR with MAPA. All rights reserved.
          </p>
          <button
            onClick={() => setIsLandingOpen(true)}
            className={`text-[10px] font-bold underline underline-offset-2 opacity-40 hover:opacity-80 transition-opacity ${prefs.isNightMode ? 'text-pink-400' : 'text-pink-600'
              }`}
          >
            ✦ Preview Launch Page
          </button>
        </div>
      </main>

      <Player
        ref={playerRef}
        currentSound={currentSound}
        onNext={handleNext}
        onPrev={handlePrev}
        isPremium={prefs.isPremiumUser}
        onOpenPremium={() => setIsPremiumModalOpen(true)}
        isNightMode={prefs.isNightMode}
        rainLayerActive={prefs.isRainActive}
        onToggleRain={toggleRain}
        rainVolume={prefs.rainLayerVolume}
        onRainVolumeChange={setRainVolume}
        userId={user?.id}
        categories={categories}
        setCurrentSound={setCurrentSound}
        activeVariationIndex={activeVariationIndex}
        onVariationChange={setActiveVariationIndex}
        onPlayerStateChange={setPlayerState}
        isVoiceActive={isVoiceControlActive}
        onToggleVoice={() => setIsVoiceControlActive(!isVoiceControlActive)}
        onOpenAskMapa={() => setIsAskMapaOpen(true)}
      />

      {isShopOpen && <MerchShop isNightMode={prefs.isNightMode} onClose={() => setIsShopOpen(false)} />}
      {isAdminOpen && <AdminDashboard onClose={() => setIsAdminOpen(false)} />}
      <AuthModal isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} />
      {user && <ProfileHub
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
        user={user}
        categories={categories}
        onSetCurrentSound={setCurrentSound}
        onOpenAdmin={() => {
          setIsProfileOpen(false);
          setIsAdminOpen(true);
        }}
      />}

      {isPremiumModalOpen && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm" onClick={() => setIsPremiumModalOpen(false)} />
          <div className="relative w-full max-w-md bg-white rounded-[3rem] p-10 text-center space-y-8 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="absolute top-0 left-0 w-full h-3 bg-gradient-to-r from-pink-500 via-purple-500 to-orange-500" />
            <div className="w-24 h-24 bg-pink-100 rounded-[2rem] mx-auto flex items-center justify-center text-5xl shadow-inner border border-pink-200">✨</div>
            <div>
              <h3 className="text-4xl font-bold text-slate-800 tracking-tight">Upgrade to PRO</h3>
              <p className="text-slate-600 mt-3 text-lg">Support the channel and unlock exclusive triggers.</p>
            </div>
            <ul className="text-left space-y-4 bg-pink-50 p-8 rounded-[2rem] border border-pink-100">
              {['Unlock Premium Sounds', 'High-Fidelity Audio', 'Ad-Free Playback', 'Exclusive Merch Access'].map((benefit, i) => (
                <li key={i} className="flex items-center space-x-4 text-base font-bold text-pink-700">
                  <div className="w-6 h-6 bg-pink-500 rounded-full flex items-center justify-center text-[10px] text-white shadow-md">✓</div>
                  <span>{benefit}</span>
                </li>
              ))}
            </ul>
            <button
              onClick={() => {
                // TODO: integrate Stripe/payment link here.
                // Premium is server-side only — do NOT toggle locally.
                setIsPremiumModalOpen(false);
                window.open('mailto:support@asmrwithmapa.com?subject=Premium%20Subscription', '_blank');
              }}
              className="w-full py-5 bg-gradient-to-r from-pink-500 to-fuchsia-600 text-white font-bold text-xl rounded-[1.5rem] shadow-[0_10px_30px_rgba(236,72,153,0.3)] hover:shadow-pink-200 transition-all active:scale-95"
            >
              {prefs.isPremiumUser ? '✓ Premium Active' : 'Get Premium — $4.99/mo'}
            </button>
            <button onClick={() => setIsPremiumModalOpen(false)} className="text-slate-400 text-sm font-bold hover:text-pink-500 transition-colors uppercase tracking-widest">Maybe Later</button>
          </div>
        </div>
      )}

      <CommunityMarketplace
        isOpen={isMarketplaceOpen}
        onClose={() => setIsMarketplaceOpen(false)}
        user={user}
        onLoadPreset={(layers) => {
          // Load preset logic
          if (layers.soundId) {
            const sound = categories.find(c => c.id === layers.soundId);
            if (sound) setCurrentSound(sound);
          }
          if (layers.variationIndex !== undefined) setActiveVariationIndex(layers.variationIndex);
          if (layers.rainActive !== undefined) setPrefs(p => ({ ...p, isRainActive: layers.rainActive }));
          if (layers.rainVolume !== undefined) setPrefs(p => ({ ...p, rainLayerVolume: layers.rainVolume }));
          setIsMarketplaceOpen(false);
        }}
        currentLayers={{
          soundId: currentSound?.id,
          variationIndex: activeVariationIndex,
          rainActive: prefs.isRainActive,
          rainVolume: prefs.rainLayerVolume
        }}
      />
      <FeatureGuideModal isOpen={isGuideOpen} onClose={() => setIsGuideOpen(false)} />

      <DiscoveryModal
        isOpen={isDiscoveryOpen}
        onClose={() => setIsDiscoveryOpen(false)}
        isPremium={prefs.isPremiumUser}
        onOpenPremium={() => setIsPremiumModalOpen(true)}
        isNightMode={prefs.isNightMode}
        onStartJourney={() => {
          // Logic to start trigger journey is handled inside the modal for now or we can open separate journey modal
          // For this impl, I'll pass a handler if needed or let the modal handle it
          // Actually, looks like TriggerJourney was inside ProfileHub. 
          // I should probably move TriggerJourney to App level too or inside DiscoveryModal.
          // Let's assume DiscoveryModal handles the "Start" by opening the visual journey.
          // Wait, I need to instantiate TriggerJourney here too if I want it accessible globally?
          // "onStartJourney" in the modal just calls a callback. 
          // I'll add isTriggerJourneyOpen state here too.
          setIsTriggerJourneyOpen(true);
        }}
      />

      <ChallengesModal
        isOpen={isChallengesOpen}
        onClose={() => setIsChallengesOpen(false)}
        userId={user?.id}
      />

      <TriggerJourney
        isOpen={isTriggerJourneyOpen}
        onClose={() => setIsTriggerJourneyOpen(false)}
        categories={categories}
        onComplete={(catId) => {
          const category = categories.find(c => c.id === catId);
          if (category) setCurrentSound(category);
          setIsTriggerJourneyOpen(false);
        }}
      />

      <AskMapaChat
        isOpen={isAskMapaOpen}
        onClose={() => setIsAskMapaOpen(false)}
        categories={categories}
        onSelectCategory={setCurrentSound}
        isNightMode={prefs.isNightMode}
        initialMessage={askMapaInitialMessage}
      />


      <LandingPage
        isOpen={isLandingOpen}
        onClose={() => setIsLandingOpen(false)}
        isPreview={true}
      />

    </div>
  );
};

export default App;
