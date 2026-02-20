
import React from 'react';
import { Lock, Play } from 'lucide-react';
import { SoundCategory } from '../types';

interface SoundCardProps {
  sound: SoundCategory;
  isActive: boolean;
  isNightMode: boolean;
  isPremiumUser: boolean;
  onSelect: (sound: SoundCategory) => void;
}

const SoundCard: React.FC<SoundCardProps> = ({
  sound,
  isActive,
  isNightMode,
  isPremiumUser,
  onSelect
}) => {
  const isLocked = sound.isPremium && !isPremiumUser;

  return (
    <div
      onClick={() => !isLocked && onSelect(sound)}
      className={`group relative overflow-hidden rounded-3xl p-6 transition-all duration-300 cursor-pointer transform hover:-translate-y-2 hover:shadow-2xl ${isActive
          ? 'ring-4 ring-pink-500 scale-105'
          : 'ring-1 ring-white/20'
        } ${isNightMode
          ? 'bg-slate-800/50 backdrop-blur-sm'
          : 'bg-white/40 shadow-xl shadow-pink-100/50'
        } ${isLocked ? 'opacity-70 grayscale-[0.5]' : ''}`}
    >
      <div className={`w-16 h-16 rounded-2xl mb-4 flex items-center justify-center text-4xl shadow-lg transition-transform group-hover:rotate-12 ${sound.color}`}>
        {sound.icon}
      </div>

      <div className="space-y-1">
        <h3 className={`text-xl font-black tracking-tight ${isNightMode ? 'text-white' : 'text-slate-800'}`}>
          {sound.name}
        </h3>
        <p className={`text-xs font-medium leading-relaxed ${isNightMode ? 'text-slate-400' : 'text-slate-600'}`}>
          {sound.description}
        </p>
      </div>

      {isLocked && (
        <div className="absolute top-4 right-4 bg-gradient-to-br from-amber-400 to-orange-600 text-white p-2 rounded-xl shadow-lg shadow-orange-900/20">
          <Lock size={14} />
        </div>
      )}

      {isActive && !isLocked && (
        <div className="absolute bottom-4 right-4 bg-pink-500 text-white p-2 rounded-xl shadow-lg">
          <Play size={20} fill="white" />
        </div>
      )}

      {!isLocked && !isActive && (
        <div className="absolute inset-0 bg-pink-500/10 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <Play size={40} className="text-pink-500" />
        </div>
      )}
    </div>
  );
};

export default SoundCard;
