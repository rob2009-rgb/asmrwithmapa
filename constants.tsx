
import { SoundCategory, MerchItem, SoundItem } from './types';

/**
 * ASMR with MAPA - Premium Audio Library (v5)
 * STABILITY RELEASE.
 * 
 * Replaced OGG files with MP3s to fix Safari/iOS "Format Error".
 * Replaced unstable dynamic links with permanent static CDN links.
 */

// --- TAPPING (Source: SoundJay/SoundBible MP3s) ---
const TAPPING_SOUNDS: SoundItem[] = [
  { id: 'tap-wood', name: 'Deep Tapping', url: 'https://archive.org/download/ASMRTapping/Tapping.mp3' },
  { id: 'tap-glass', name: 'Glass Taps', url: 'https://soundbible.com/mp3/Switch-SoundBible.com-350629907.mp3' }, // Placeholder fallback
  { id: 'tap-fast', name: 'Fast Tapping', url: 'https://soundbible.com/mp3/Click2-Sebastian-759472264.mp3' }
];

// --- WATER (Source: SoundBible MP3s) ---
const WATER_SOUNDS: SoundItem[] = [
  { id: 'water-stream', name: 'Heavy Rain', url: 'https://archive.org/download/heavy_rain_sound/heavy_rain_sound.mp3' },
  { id: 'water-ocean', name: 'Ocean Waves', url: 'https://soundbible.com/mp3/Big_Waves-Mike_Koenig-168108428.mp3' },
  { id: 'water-splash', name: 'Gentle Splash', url: 'https://soundbible.com/mp3/Water Splash-SoundBible.com-200543685.mp3' }
];

// --- TYPING (Source: SoundBible MP3s) ---
const TYPING_SOUNDS: SoundItem[] = [
  { id: 'type-mech', name: 'Mechanical Keyboard', url: 'https://soundbible.com/mp3/Typing_on_keyboard-Mike_Koenig-37125348.mp3' },
  { id: 'type-writer', name: 'Vintage Typewriter', url: 'https://soundbible.com/mp3/Typewriter-SoundBible.com-1378393356.mp3' },
  { id: 'type-click', name: 'Mouse Clicks', url: 'https://soundbible.com/mp3/Click-SoundBible.com-1387633738.mp3' }
];

// --- CRINKLING (Source: SoundJay/SoundBible MP3s) ---
const CRINKLING_SOUNDS: SoundItem[] = [
  { id: 'crinkle-paper', name: 'Paper Crinkle', url: 'https://soundbible.com/mp3/Crumbling Paper-SoundBible.com-1971166649.mp3' },
  { id: 'crinkle-plastic', name: 'Plastic Texture', url: 'https://www.soundjay.com/misc/sounds/crumpling-paper-1.mp3' },
  { id: 'crinkle-bag', name: 'Bag Sound', url: 'https://www.soundjay.com/misc/sounds/plastic-bag-rustle-1.mp3' }
];

// --- PAGE TURNING (Source: SoundBible MP3s) ---
const PAGE_SOUNDS: SoundItem[] = [
  { id: 'page-turn-1', name: 'Page Turn A', url: 'https://soundbible.com/mp3/Page_Turn-Mark_DiAngelo-1304638748.mp3' },
  { id: 'page-flip', name: 'Book Flipping', url: 'https://www.soundjay.com/misc/sounds/page-flip-01a.mp3' },
  { id: 'page-read', name: 'Paper Slide', url: 'https://www.soundjay.com/misc/sounds/page-flip-4.mp3' }
];

// --- SCRATCHING (Source: SoundBible MP3s) ---
const SCRATCH_SOUNDS: SoundItem[] = [
  { id: 'scratch-pencil', name: 'Pencil on Paper', url: 'https://soundbible.com/mp3/Pencil_Writing_on_Paper-SoundBible.com-488950663.mp3' },
  { id: 'scratch-marker', name: 'Marker Drawing', url: 'https://www.soundjay.com/misc/sounds/writing-01.mp3' },
  { id: 'scratch-chalk', name: 'Chalkboard', url: 'https://soundbible.com/mp3/Writing-SoundBible.com-104990264.mp3' }
];

// --- MOUTH SOUNDS (Source: SoundBible MP3s) ---
const MOUTH_SOUNDS: SoundItem[] = [
  { id: 'mouth-bite', name: 'Apple Bite', url: 'https://soundbible.com/mp3/Apple_Bite-Mike_Koenig-491703211.mp3' },
  { id: 'mouth-sip', name: 'Sip & Ahh', url: 'https://soundbible.com/mp3/Sip And Ahh-SoundBible.com-193792348.mp3' },
  { id: 'mouth-crunch', name: 'Crunchy Bite', url: 'https://soundbible.com/mp3/Apple Bite-SoundBible.com-1596307654.mp3' }
];

// --- ATTENTION (Source: SoundBible MP3s) ---
const ATTENTION_SOUNDS: SoundItem[] = [
  { id: 'attn-clock', name: 'Ticking Clock', url: 'https://soundbible.com/mp3/Tick Tock-SoundBible.com-116586069.mp3' },
  { id: 'attn-heart', name: 'Heartbeat', url: 'https://soundbible.com/mp3/Heart Beat-SoundBible.com-1941620299.mp3' },
  { id: 'attn-metro', name: 'Metronome', url: 'https://soundbible.com/mp3/Metronome-SoundBible.com-2035876610.mp3' }
];

// --- WHISPERING (Source: SoundBible MP3s - Nature Proxy) ---
const WHISPER_SOUNDS: SoundItem[] = [
  { id: 'wisp-wind', name: 'Forest Birds', url: 'https://archive.org/download/NatureSounds-Birds/NatureSoundsBirds.mp3' },
  { id: 'wisp-breeze', name: 'Soft Breeze', url: 'https://soundbible.com/mp3/Wind_Blowing-Mike_Koenig-616016200.mp3' },
  { id: 'wisp-night', name: 'Night Ambience', url: 'https://soundbible.com/mp3/Crickets-SoundBible.com-2009841804.mp3' }
];

// --- BRUSHING (Source: SoundBible MP3s) ---
const BRUSH_SOUNDS: SoundItem[] = [
  { id: 'brush-sweep', name: 'Sweeping Sound', url: 'https://soundbible.com/mp3/Sweep-SoundBible.com-582527217.mp3' },
  { id: 'brush-shave', name: 'Texture Brushing', url: 'https://www.soundjay.com/misc/sounds/shaving-1.mp3' },
  { id: 'brush-sand', name: 'Sand Texture', url: 'https://www.soundjay.com/misc/sounds/sandpaper-1.mp3' }
];


export const ASMR_CATEGORIES: SoundCategory[] = [
  {
    id: 'tapping',
    name: 'Tapping',
    description: 'Crisp tapping on wood, glass, and plastic surfaces.',
    icon: '💅',
    color: 'bg-rose-100',
    isPremium: false,
    sounds: TAPPING_SOUNDS
  },
  {
    id: 'water',
    name: 'Water Sounds',
    description: 'Immersive rivers, ocean waves, and pouring.',
    icon: '💧',
    color: 'bg-blue-50',
    isPremium: false,
    sounds: WATER_SOUNDS
  },
  {
    id: 'typing',
    name: 'Keyboard Typing',
    description: 'Clicky mechanical switches and laptop keys.',
    icon: '⌨️',
    color: 'bg-slate-100',
    isPremium: false,
    sounds: TYPING_SOUNDS
  },
  {
    id: 'crinkling',
    name: 'Crinkling',
    description: 'Textured sounds of plastic and foil.',
    icon: '🍬',
    color: 'bg-pink-50',
    isPremium: false,
    sounds: CRINKLING_SOUNDS
  },
  {
    id: 'page-turning',
    name: 'Page Turning',
    description: 'Relaxing book pages and paper shuffling.',
    icon: '📖',
    color: 'bg-lavender-100',
    isPremium: false,
    sounds: PAGE_SOUNDS
  },
  {
    id: 'scratching',
    name: 'Scratching',
    description: 'Pencil on paper and fabric scratching.',
    icon: '✏️',
    color: 'bg-yellow-50',
    isPremium: true,
    sounds: SCRATCH_SOUNDS
  },
  {
    id: 'mouth-sounds',
    name: 'Mouth Sounds',
    description: 'Eating, crunching, and drinking sounds.',
    icon: '👄',
    color: 'bg-red-100',
    isPremium: true,
    sounds: MOUTH_SOUNDS
  },
  {
    id: 'attention',
    name: 'Deep Focus',
    description: 'Rhythmic clocks and heartbeats.',
    icon: '🧠',
    color: 'bg-orange-50',
    isPremium: true,
    sounds: ATTENTION_SOUNDS
  },
  {
    id: 'whispering',
    name: 'Nature Whispers',
    description: 'Gentle wind and forest ambience.',
    icon: '🍃',
    color: 'bg-emerald-50',
    isPremium: true,
    sounds: WHISPER_SOUNDS
  },
  {
    id: 'brushing',
    name: 'Mic Brushing',
    description: 'Soft makeup brushes and sweeping.',
    icon: '🖌️',
    color: 'bg-purple-100',
    isPremium: true,
    sounds: BRUSH_SOUNDS
  }
];

export const MERCH_ITEMS: MerchItem[] = [
  { id: 'hoodie-1', name: 'Bubblegum Pink Hoodie', price: 45.00, image: 'https://picsum.photos/seed/hoodie/400/500', description: 'Ultra-soft cotton hoodie.' },
  { id: 'mug-1', name: 'MAPA Mug', price: 18.00, image: 'https://picsum.photos/seed/mug/400/500', description: 'The perfect companion for your nightly routine.' },
  { id: 'sticker-pack', name: 'Exclusive Stickers', price: 12.00, image: 'https://picsum.photos/seed/sticker/400/500', description: 'Glossy trigger stickers.' },
  { id: 'tshirt-1', name: 'Mapa Signature Tee', price: 28.00, image: 'https://picsum.photos/seed/tshirt/400/500', description: 'Breathable and stylish.' }
];

// Heavy Rain Ambience (Replaced OGG with MP3)
export const RAIN_SOUND_URL = 'https://soundbible.com/mp3/Rain_Background-Mike_Koenig-1681389445.mp3';
