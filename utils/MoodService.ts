import { GoogleGenerativeAI } from '@google/generative-ai';
import { SoundCategory } from '../types';

const FALLBACK_MAP: Record<string, string> = {
    'stressed': 'Rain',
    'anxious': 'Water',
    'tired': 'Brown Noise',
    'cant sleep': 'Waves',
    'focus': 'Coffee Shop',
    'relaxing': 'Forest',
    'study': 'Fireplace'
};

interface Recommendation {
    categoryName: string;
    reason: string;
}

export class MoodService {
    private genAI: GoogleGenerativeAI | null = null;
    private model: any = null;

    constructor() {
        const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
        if (apiKey) {
            this.genAI = new GoogleGenerativeAI(apiKey);
            this.model = this.genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        }
    }

    async getRecommendation(mood: string, availableCategories: SoundCategory[]): Promise<Recommendation> {
        if (this.model) {
            try {
                const categoryNames = availableCategories.map(c => c.name).join(', ');
                const prompt = `
                    User Mood: "${mood}"
                    Available Sound Categories: [${categoryNames}]
                    
                    Task: Select the ONE best sound category for this mood.
                    Output JSON only: { "categoryName": "ExactNameFromList", "reason": "Short explanation" }
                `;

                const result = await this.model.generateContent(prompt);
                const response = await result.response;
                const text = response.text();
                const cleanJson = text.replace(/```json/g, '').replace(/```/g, '').trim();
                const data = JSON.parse(cleanJson);

                return {
                    categoryName: data.categoryName,
                    reason: data.reason
                };
            } catch (error) {
                console.error("AI Recommendation failed, using fallback:", error);
            }
        }

        const lowerMood = mood.toLowerCase();
        let bestMatch = 'Rain';

        for (const [key, val] of Object.entries(FALLBACK_MAP)) {
            if (lowerMood.includes(key)) {
                bestMatch = val;
                break;
            }
        }

        const found = availableCategories.find(c => c.name.toLowerCase() === bestMatch.toLowerCase())
            || availableCategories[0];

        return {
            categoryName: found.name,
            reason: "Based on common relaxation patterns."
        };
    }
}

export const moodService = new MoodService();
