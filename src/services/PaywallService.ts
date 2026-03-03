import { Purchases, PurchasesOffering } from '@revenuecat/purchases-capacitor';
import { Device } from '@capacitor/device';
import { AnalyticsService } from './AnalyticsService';
import { supabase } from '../supabaseClient';

/**
 * PaywallService handles native In-App Purchases via RevenueCat.
 * It abstracts the complexity of store-specific logic and receipt validation.
 */
export class PaywallService {
    private static isInitialized = false;

    /**
     * Initialize the Purchases SDK with the appropriate API key.
     * Should be called early in the app lifecycle (e.g., in App.tsx).
     */
    public static async initialize(userId: string) {
        if (this.isInitialized) return;

        try {
            const info = await Device.getInfo();

            // On web, we skip native initialization
            if (info.platform === 'web') {
                console.log('PaywallService: Skipping native initialization on web');
                return;
            }

            const keyName = info.platform === 'ios' ? 'revenuecat_apple_key' : 'revenuecat_android_key';

            // Fetch key from System Settings in Supabase
            const { data } = await supabase
                .from('system_settings')
                .select('value')
                .eq('key', keyName)
                .single();

            const apiKey = data?.value;

            if (!apiKey) {
                console.warn(`PaywallService: No API key found for ${info.platform}. Purchases disabled.`);
                return;
            }

            await Purchases.configure({
                apiKey,
                appUserID: userId // Link to Supabase UID
            });

            this.isInitialized = true;
            console.log('PaywallService: Initialized successfully with dynamic key');
        } catch (error) {
            console.error('PaywallService: Initialization failed', error);
        }
    }

    /**
     * Fetch current subscription offerings (e.g., Monthly/Yearly Pro).
     */
    public static async getOfferings(): Promise<PurchasesOffering[]> {
        try {
            const offerings = await Purchases.getOfferings();
            return offerings.current ? [offerings.current] : [];
        } catch (error) {
            console.error('PaywallService: Failed to fetch offerings', error);
            return [];
        }
    }

    /**
     * Trigger a native purchase flow for a specific package.
     */
    public static async purchase(packageToBuy: any): Promise<boolean> {
        AnalyticsService.trackClick('iap_purchase_attempt', { package: packageToBuy.identifier });

        try {
            const { customerInfo } = await Purchases.purchasePackage({ aPackage: packageToBuy });

            // Recheck if the 'premium' entitlement is now active
            if (customerInfo.entitlements.active['premium']) {
                AnalyticsService.trackEvent('conversion', 'premium_upgrade');
                return true;
            }
            return false;
        } catch (error: any) {
            if (error.userCancelled) {
                console.log('User cancelled the purchase');
            } else {
                console.error('Purchase failed', error);
            }
            return false;
        }
    }

    /**
     * Restore previous purchases (useful if user reinstalls app).
     */
    public static async restore() {
        try {
            const customerInfo = await Purchases.restorePurchases();
            return customerInfo.entitlements.active['premium'];
        } catch (error) {
            console.error('Restore failed', error);
            return false;
        }
    }
}
