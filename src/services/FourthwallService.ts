import { supabase } from '../supabaseClient';

export interface FourthwallProduct {
    id: string;
    name: string;
    description: string; // This is the HTML description from Fourthwall
    images: { url: string }[];
    variants: {
        id: string;
        unitPrice: { value: number; currency: string };
        name: string;
    }[];
    slug: string;
}

const FOURTHWALL_API_URL = 'https://storefront-api.fourthwall.com/v1';

export const FourthwallService = {
    async getProducts(): Promise<FourthwallProduct[]> {
        try {
            const token = await this._getToken();
            if (!token) return [];

            const response = await fetch(`${FOURTHWALL_API_URL}/collections/all/products?storefront_token=${token}`);
            if (!response.ok) throw new Error(`Fourthwall API Error: ${response.statusText}`);

            const data = await response.json();
            return data.results || [];
        } catch (error) {
            console.error("Fourthwall Service Error:", error);
            return [];
        }
    },

    async createCart(items: { variantId: string; quantity: number }[]): Promise<{ checkoutUrl: string } | null> {
        try {
            const token = await this._getToken();
            if (!token) return null;

            const response = await fetch(`${FOURTHWALL_API_URL}/carts?storefront_token=${token}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    items: items.map(item => ({
                        variantId: item.variantId,
                        quantity: item.quantity
                    }))
                })
            });

            if (!response.ok) throw new Error(`Fourthwall Cart Error: ${response.statusText}`);

            const data = await response.json();
            return { checkoutUrl: data.checkoutUrl };
        } catch (error) {
            console.error("Fourthwall Cart Creation Error:", error);
            return null;
        }
    },

    async _getToken(): Promise<string | null> {
        const { data: setting } = await supabase
            .from('system_settings')
            .select('value')
            .eq('key', 'fourthwall_token')
            .single();
        return setting?.value || null;
    }
};
