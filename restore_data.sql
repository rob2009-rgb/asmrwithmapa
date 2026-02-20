-- 1. Reset Schema (Drop tables to allow changing ID type to TEXT)
drop table if exists public.sounds;
drop table if exists public.categories;

-- 2. Re-create Tables with TEXT IDs (to match original 'tapping', 'water' IDs)
create table public.categories (
  id text not null,
  name text not null,
  icon text not null,
  color text not null,
  description text null,
  is_premium boolean null default false,
  created_at timestamp with time zone not null default now(),
  order_index numeric null,
  constraint categories_pkey primary key (id)
);

create table public.sounds (
  id text not null,
  category_id text not null,
  name text not null,
  url text not null,
  created_at timestamp with time zone not null default now(),
  is_premium boolean null default false,
  constraint sounds_pkey primary key (id),
  constraint sounds_category_id_fkey foreign key (category_id) references categories (id)
);

-- 3. Re-Enable RLS and Policies
alter table public.categories enable row level security;
alter table public.sounds enable row level security;

-- Allow public read/write for demo purposes
create policy "Public categories are viewable by everyone" on public.categories for select using (true);
create policy "Everyone can insert categories" on public.categories for insert with check (true);
create policy "Everyone can update categories" on public.categories for update using (true);

create policy "Public sounds are viewable by everyone" on public.sounds for select using (true);
create policy "Everyone can insert sounds" on public.sounds for insert with check (true);
create policy "Everyone can update sounds" on public.sounds for update using (true);

-- 4. Restore Full Data from Constants
insert into public.categories (id, name, icon, color, description, is_premium, order_index) values
('tapping', 'Tapping', '💅', 'bg-rose-100', 'Crisp tapping on wood, glass, and plastic surfaces.', false, 0),
('water', 'Water Sounds', '💧', 'bg-blue-50', 'Immersive rivers, ocean waves, and pouring.', false, 1),
('typing', 'Keyboard Typing', '⌨️', 'bg-slate-100', 'Clicky mechanical switches and laptop keys.', false, 2),
('crinkling', 'Crinkling', '🍬', 'bg-pink-50', 'Textured sounds of plastic and foil.', false, 3),
('page-turning', 'Page Turning', '📖', 'bg-lavender-100', 'Relaxing book pages and paper shuffling.', false, 4),
('scratching', 'Scratching', '✏️', 'bg-yellow-50', 'Pencil on paper and fabric scratching.', true, 5),
('mouth-sounds', 'Mouth Sounds', '👄', 'bg-red-100', 'Eating, crunching, and drinking sounds.', true, 6),
('attention', 'Deep Focus', '🧠', 'bg-orange-50', 'Rhythmic clocks and heartbeats.', true, 7),
('whispering', 'Nature Whispers', '🍃', 'bg-emerald-50', 'Gentle wind and forest ambience.', true, 8),
('brushing', 'Mic Brushing', '🖌️', 'bg-purple-100', 'Soft makeup brushes and sweeping.', true, 9);

insert into public.sounds (id, category_id, name, url) values
-- Tapping
('tap-wood', 'tapping', 'Wood Tapping', 'https://soundbible.com/mp3/Click-SoundBible.com-1387633738.mp3'),
('tap-glass', 'tapping', 'Glass Taps', 'https://soundbible.com/mp3/Switch-SoundBible.com-350629907.mp3'),
('tap-fast', 'tapping', 'Fast Tapping', 'https://soundbible.com/mp3/Click2-Sebastian-759472264.mp3'),

-- Water
('water-stream', 'water', 'Flowing Stream', 'https://soundbible.com/mp3/Stream Noise-SoundBible.com-415560887.mp3'),
('water-ocean', 'water', 'Ocean Waves', 'https://soundbible.com/mp3/Big_Waves-Mike_Koenig-168108428.mp3'),
('water-splash', 'water', 'Gentle Splash', 'https://soundbible.com/mp3/Water Splash-SoundBible.com-200543685.mp3'),

-- Typing
('type-mech', 'typing', 'Mechanical Keyboard', 'https://soundbible.com/mp3/Typing_on_keyboard-Mike_Koenig-37125348.mp3'),
('type-writer', 'typing', 'Vintage Typewriter', 'https://soundbible.com/mp3/Typewriter-SoundBible.com-1378393356.mp3'),
('type-click', 'typing', 'Mouse Clicks', 'https://soundbible.com/mp3/Click-SoundBible.com-1387633738.mp3'),

-- Crinkling
('crinkle-paper', 'crinkling', 'Paper Crinkle', 'https://soundbible.com/mp3/Crumbling Paper-SoundBible.com-1971166649.mp3'),
('crinkle-plastic', 'crinkling', 'Plastic Texture', 'https://www.soundjay.com/misc/sounds/crumpling-paper-1.mp3'),
('crinkle-bag', 'crinkling', 'Bag Sound', 'https://www.soundjay.com/misc/sounds/plastic-bag-rustle-1.mp3'),

-- Page Turning
('page-turn-1', 'page-turning', 'Page Turn A', 'https://soundbible.com/mp3/Page_Turn-Mark_DiAngelo-1304638748.mp3'),
('page-flip', 'page-turning', 'Book Flipping', 'https://www.soundjay.com/misc/sounds/page-flip-01a.mp3'),
('page-read', 'page-turning', 'Paper Slide', 'https://www.soundjay.com/misc/sounds/page-flip-4.mp3'),

-- Scratching
('scratch-pencil', 'scratching', 'Pencil on Paper', 'https://soundbible.com/mp3/Pencil_Writing_on_Paper-SoundBible.com-488950663.mp3'),
('scratch-marker', 'scratching', 'Marker Drawing', 'https://www.soundjay.com/misc/sounds/writing-01.mp3'),
('scratch-chalk', 'scratching', 'Chalkboard', 'https://soundbible.com/mp3/Writing-SoundBible.com-104990264.mp3'),

-- Mouth Sounds
('mouth-bite', 'mouth-sounds', 'Apple Bite', 'https://soundbible.com/mp3/Apple_Bite-Mike_Koenig-491703211.mp3'),
('mouth-sip', 'mouth-sounds', 'Sip & Ahh', 'https://soundbible.com/mp3/Sip And Ahh-SoundBible.com-193792348.mp3'),
('mouth-crunch', 'mouth-sounds', 'Crunchy Bite', 'https://soundbible.com/mp3/Apple Bite-SoundBible.com-1596307654.mp3'),

-- Attention
('attn-clock', 'attention', 'Ticking Clock', 'https://soundbible.com/mp3/Tick Tock-SoundBible.com-116586069.mp3'),
('attn-heart', 'attention', 'Heartbeat', 'https://soundbible.com/mp3/Heart Beat-SoundBible.com-1941620299.mp3'),
('attn-metro', 'attention', 'Metronome', 'https://soundbible.com/mp3/Metronome-SoundBible.com-2035876610.mp3'),

-- Whispering
('wisp-wind', 'whispering', 'Gentle Wind', 'https://soundbible.com/mp3/Wind-Mark_DiAngelo-1121339864.mp3'),
('wisp-breeze', 'whispering', 'Soft Breeze', 'https://soundbible.com/mp3/Wind_Blowing-Mike_Koenig-616016200.mp3'),
('wisp-night', 'whispering', 'Night Ambience', 'https://soundbible.com/mp3/Crickets-SoundBible.com-2009841804.mp3'),

-- Brushing
('brush-sweep', 'brushing', 'Sweeping Sound', 'https://soundbible.com/mp3/Sweep-SoundBible.com-582527217.mp3'),
('brush-shave', 'brushing', 'Texture Brushing', 'https://www.soundjay.com/misc/sounds/shaving-1.mp3'),
('brush-sand', 'brushing', 'Sand Texture', 'https://www.soundjay.com/misc/sounds/sandpaper-1.mp3');
