
export interface SoundItem {
  id: string;
  name: string;
  url: string;
}

export interface SoundCategory {
  id: string;
  name: string;
  description: string;
  icon: string;
  sounds: SoundItem[];
  isPremium: boolean;
  color: string;
  creator?: {
    id: string;
    name: string;
    supportLink?: string;
  };
}

export interface MerchItem {
  id: string;
  name: string;
  price: number;
  image: string;
  description: string;
}

export enum PlayerState {
  PLAYING = 'playing',
  PAUSED = 'paused',
  STOPPED = 'stopped'
}

export interface UserPreferences {
  isNightMode: boolean;
  isPremiumUser: boolean;
  rainLayerVolume: number;
  isRainActive: boolean;
  isAdmin?: boolean; // New: Tracks admin session
}

export interface PlayerHandle {
  play: () => void;
  pause: () => void;
  toggle: () => void;
}
