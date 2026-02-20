
export interface MixSuggestion {
    name: string;
    description: string;
    layers: { categoryId: string; volume: number; active: boolean }[];
    themeColor: string;
}

export class GeminiMixService {
    // In a real implementation, this would call Supabase Edge Function -> Google Gemini API
    // passing the prompt and the list of available sounds.
    static async generateMix(prompt: string, availableCategories: any[]): Promise<MixSuggestion> {
        // Simulate network latency for "Thinking..."
        await new Promise(resolve => setTimeout(resolve, 2500));

        const p = prompt.toLowerCase();

        // Mock Logic: Select categories based on keywords
        // This effectively simulates what the LLM would return (JSON of sound settings)

        const layers = availableCategories.map(cat => {
            let volume = 0;
            let active = false;
            const name = cat.name.toLowerCase();

            if (p.includes('rain') && name.includes('rain')) { volume = 0.8; active = true; }
            if (p.includes('storm') && (name.includes('rain') || name.includes('thunder'))) { volume = 0.7; active = true; }
            if (p.includes('forest') && (name.includes('nature') || name.includes('bird'))) { volume = 0.6; active = true; }
            if (p.includes('sleep') && (name.includes('rain') || name.includes('brown') || name.includes('white'))) { volume = 0.7; active = true; }
            if (p.includes('focus') && (name.includes('cafe') || name.includes('keyboard') || name.includes('brown'))) { volume = 0.6; active = true; }

            return { categoryId: cat.id, volume, active };
        }).filter(l => l.active);

        // Fallback if no keywords matched
        if (layers.length === 0 && availableCategories.length > 0) {
            // Pick random 2
            const random = availableCategories.slice(0, 2);
            random.forEach(r => layers.push({ categoryId: r.id, volume: 0.5, active: true }));
        }

        return {
            name: "AI Generated Sanctuary",
            description: `A custom soundscape curated for "${prompt.length > 20 ? prompt.slice(0, 20) + '...' : prompt}"`,
            layers,
            themeColor: layers.length > 0 ? 'bg-gradient-to-br from-indigo-500 to-purple-600' : 'bg-gray-500'
        };
    }
}
