
import React from 'react';
import { Sun, Moon, Sparkles, User, ShoppingBag } from 'lucide-react';

interface HeaderProps {
  user?: any;
  isNightMode: boolean;
  isPremium: boolean;
  streak?: number;
  onToggleNightMode: () => void;
  onOpenShop: () => void;
  onOpenPremium: () => void;
  onOpenAuth: () => void;
  onOpenGuide: () => void;
  onOpenCommunity: () => void;
  onOpenZen: () => void;
  onOpenDiscovery: () => void;
  onOpenChallenges: () => void;
}

const Header: React.FC<HeaderProps> = ({
  user,
  isNightMode,
  isPremium,
  streak,
  onToggleNightMode,
  onOpenShop,
  onOpenPremium,
  onOpenAuth,
  onOpenGuide,
  onOpenCommunity,
  onOpenZen,
  onOpenDiscovery,
  onOpenChallenges
}) => {
  return (
    <header className={`sticky top-0 z-50 transition-colors duration-500 ${isNightMode ? 'bg-slate-900/90' : 'bg-white/80'} backdrop-blur-md px-4 py-3 md:px-8 border-b ${isNightMode ? 'border-slate-800' : 'border-pink-200'}`}>
      <div className="max-w-7xl mx-auto flex items-center justify-between">

        {/* Left: Logo */}
        <div className="flex items-center gap-5">
          <div className="relative group cursor-pointer" onClick={onOpenAuth}>
            <div className="absolute -inset-1 bg-gradient-to-r from-pink-500 via-fuchsia-500 to-rose-600 rounded-full blur opacity-30 group-hover:opacity-60 transition duration-1000"></div>
            <div className="relative w-11 h-11 rounded-full overflow-hidden border-2 border-white shadow-xl bg-pink-100">
              <img
                src="/logo.jpg"
                alt="MAPA Logo"
                className="w-full h-full object-cover transform duration-700 group-hover:scale-110"
                onError={(e) => {
                  e.currentTarget.src = "https://ui-avatars.com/api/?name=Mapa+ASMR&background=db2777&color=fff&size=128&font-size=0.4";
                }}
              />
            </div>
          </div>
          <div className="hidden md:flex flex-col">
            <h1 className="text-2xl font-brand tracking-tight font-bold leading-none flex items-baseline gap-1">
              <span className="text-pink-600 drop-shadow-sm">ASMR</span>
              <span className="font-brand italic font-normal text-pink-400 lowercase text-lg">with</span>
              <span className="text-pink-600 drop-shadow-sm">MAPA</span>
            </h1>
            <span className={`text-[9px] font-black uppercase tracking-[0.3em] ${isNightMode ? 'text-slate-500' : 'text-slate-400'} mt-1`}>The Sanctuary</span>
          </div>
        </div>

        {/* Center: Navigation */}
        <nav className="hidden lg:flex items-center gap-10">
          <button onClick={onOpenDiscovery} className={`text-sm font-black uppercase tracking-widest transition-all hover:text-pink-500 active:scale-95 ${isNightMode ? 'text-slate-300' : 'text-slate-600'}`}>
            Discovery
          </button>
          <button onClick={onOpenGuide} className={`text-sm font-black uppercase tracking-widest transition-all hover:text-pink-500 active:scale-95 ${isNightMode ? 'text-slate-300' : 'text-slate-600'}`}>
            Guide
          </button>
          <button onClick={onOpenChallenges} className={`text-sm font-black uppercase tracking-widest transition-all hover:text-pink-500 active:scale-95 ${isNightMode ? 'text-slate-300' : 'text-slate-600'}`}>
            Challenges
          </button>
          <button onClick={onOpenCommunity} className={`text-sm font-black uppercase tracking-widest transition-all hover:text-pink-500 active:scale-95 ${isNightMode ? 'text-slate-300' : 'text-slate-600'}`}>
            Community
          </button>
          <button onClick={onOpenZen} className={`flex items-center gap-2 text-sm font-black uppercase tracking-widest transition-all hover:text-pink-500 active:scale-95 ${isNightMode ? 'text-slate-300' : 'text-slate-600'}`}>
            Focus
            {!isPremium && (
              <span className="relative flex h-5 w-8 items-center justify-center">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-20"></span>
                <span className="relative inline-flex items-center justify-center px-1.5 py-0.5 bg-gradient-to-r from-amber-400 via-yellow-500 to-amber-600 text-[8px] text-white rounded-md shadow-lg shadow-amber-900/20 font-black">PRO</span>
              </span>
            )}
          </button>
        </nav>

        {/* Right: Actions */}
        <div className="flex items-center gap-3 md:gap-5">

          <button
            onClick={onToggleNightMode}
            className={`p-2.5 rounded-full transition-all active:scale-90 shadow-sm border ${isNightMode
              ? 'bg-slate-800 border-slate-700 text-pink-400 hover:bg-slate-700'
              : 'bg-white border-pink-100 text-pink-500 hover:bg-pink-50'}`}
          >
            {isNightMode ? <Sun size={18} /> : <Moon size={18} />}
          </button>

          {user && streak !== undefined && (
            <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border shadow-sm transition-all
              ${isNightMode ? 'bg-slate-800 border-slate-700 text-pink-400' : 'bg-white border-pink-100 text-pink-500'}`}>
              <span className="text-base">🔥</span>
              <span className="text-[10px] font-black">{streak}</span>
            </div>
          )}

          <button
            onClick={onOpenShop}
            className={`flex items-center gap-2.5 px-5 py-2.5 rounded-full transition-all active:scale-95 shadow-lg border border-transparent
              ${isNightMode
                ? 'bg-pink-600/10 border-pink-500/20 text-pink-400 hover:bg-pink-600/20'
                : 'bg-pink-600 text-white hover:bg-pink-700 hover:shadow-pink-200'}`}
          >
            <ShoppingBag size={18} />
            <span className="hidden md:inline text-[10px] font-black uppercase tracking-[0.2em]">Merch</span>
          </button>

          {/* Login / Avatar Button */}
          {user ? (
            <div className="flex items-center gap-3 pl-2 border-l border-slate-200/50 dark:border-slate-800/50">
              <button
                onClick={onOpenAuth}
                className="w-10 h-10 rounded-2xl bg-slate-200 overflow-hidden border-2 border-white shadow-xl relative transition-all hover:scale-105 active:scale-95 group"
              >
                {user.user_metadata?.avatar_url ? (
                  <img src={user.user_metadata.avatar_url} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-slate-900 text-white flex items-center justify-center font-bold text-sm">
                    {(user.email?.[0] || 'U').toUpperCase()}
                  </div>
                )}
                <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity" />
              </button>
            </div>
          ) : (
            <button
              onClick={onOpenAuth}
              className={`px-6 py-2.5 rounded-2xl font-black text-[10px] uppercase tracking-[0.3em] transition-all shadow-xl active:scale-95
                ${isNightMode
                  ? 'bg-white text-slate-900 hover:bg-slate-100'
                  : 'bg-slate-900 text-white hover:bg-slate-800'
                }`}
            >
              Sign In
            </button>
          )}

          {/* Mobile Menu Button (Hamburger) - Could be added here if needed for mobile nav */}
        </div>
      </div>
    </header>
  );
};

export default Header;
