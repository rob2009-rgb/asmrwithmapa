import { ASMR_CATEGORIES } from '../constants';
import { SoundCategory, SoundItem } from '../types';
import { supabase } from '../src/supabaseClient';

/**
 * Loads the sound library from Supabase.
 * Fallback: Constants (Default)
 */
export const loadSoundLibrary = async (): Promise<SoundCategory[]> => {
  try {
    // 1. Fetch Categories
    const { data: categories, error: catError } = await supabase
      .from('categories')
      .select('*')
      .order('order_index', { ascending: true });

    if (catError) throw catError;

    if (!categories || categories.length === 0) {
      console.log('No categories found in Supabase. Returning defaults.');
      return ASMR_CATEGORIES;
    }

    // 2. Fetch Sounds
    const { data: sounds, error: soundError } = await supabase
      .from('sounds')
      .select('*');

    if (soundError) throw soundError;

    // 3. Reconstruct nested structure
    const fullLibrary: SoundCategory[] = categories.map(cat => ({
      id: cat.id,
      name: cat.name,
      description: cat.description || '',
      icon: cat.icon,
      color: cat.color,
      isPremium: cat.is_premium || false,
      sounds: sounds
        .filter(s => s.category_id === cat.id)
        .map(s => ({
          id: s.id,
          name: s.name,
          url: s.url
        }))
    }));

    return fullLibrary;

  } catch (e) {
    console.error("Failed to load from Supabase:", e);
    return ASMR_CATEGORIES;
  }
};

/**
 * Saves the current library to Supabase.
 * NOTE: This is complex because we need to sync the nested state to flat tables.
 * For simplicity in this Admin UI, we'll upsert categories and sounds.
 */
export const saveSoundLibrary = async (library: SoundCategory[]) => {
  try {
    for (const [index, cat] of library.entries()) {
      // Upsert Category
      const { error: catErr } = await supabase
        .from('categories')
        .upsert({
          id: cat.id,
          name: cat.name,
          icon: cat.icon,
          color: cat.color,
          description: cat.description,
          is_premium: cat.isPremium,
          order_index: index
        });

      if (catErr) console.error('Error saving category:', catErr);

      // Upsert Sounds
      for (const sound of cat.sounds) {
        const { error: soundErr } = await supabase
          .from('sounds')
          .upsert({
            id: sound.id,
            category_id: cat.id,
            name: sound.name,
            url: sound.url
          });

        if (soundErr) console.error('Error saving sound:', soundErr);
      }
    }

    // Dispatch event to notify app of updates
    window.dispatchEvent(new Event('sound-library-updated'));

  } catch (e) {
    console.error("Failed to save to Supabase:", e);
    alert("Error saving changes to cloud.");
  }
};

/**
 * Resets the library is not really applicable to Cloud, 
 * but we could delete everything. For now, do nothing or warn.
 */
export const resetToDefaults = async () => {
  alert("Resetting to defaults on the cloud is dangerous and currently disabled.");
};

export const uploadAudioFile = async (file: File): Promise<string | null> => {
  const fileName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.]/g, '')}`;
  const { data, error } = await supabase.storage
    .from('sounds')
    .upload(fileName, file);

  if (error) {
    console.error('Upload failed:', error);
    return null;
  }

  const { data: { publicUrl } } = supabase.storage
    .from('sounds')
    .getPublicUrl(fileName);

  return publicUrl;
};
