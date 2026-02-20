import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { authenticator } from '@otplib/preset-default';
import QRCode from 'qrcode';

export const useTwoFactor = (userId: string | undefined) => {
    const [loading, setLoading] = useState(true);
    const [isEnabled, setIsEnabled] = useState(false);
    const [secret, setSecret] = useState<string>('');
    const [qrCodeUrl, setQrCodeUrl] = useState<string>('');

    useEffect(() => {
        if (userId) {
            checkStatus();
        }
    }, [userId]);

    const checkStatus = async () => {
        try {
            const { data, error } = await supabase
                .from('user_secrets')
                .select('mfa_enabled')
                .eq('id', userId)
                .single();

            if (data) {
                setIsEnabled(data.mfa_enabled);
            }
        } catch (error) {
            console.error('Error checking 2FA status:', error);
        } finally {
            setLoading(false);
        }
    };

    const generateSecret = async () => {
        const newSecret = authenticator.generateSecret();
        setSecret(newSecret);
        const otpauth = authenticator.keyuri(userId || 'user', 'ASMR with Mapa', newSecret);
        const url = await QRCode.toDataURL(otpauth);
        setQrCodeUrl(url);
        return { secret: newSecret, qrCodeUrl: url };
    };

    const verifyAndEnable = async (token: string) => {
        if (!authenticator.check(token, secret)) {
            return { error: 'Invalid code. Please try again.' };
        }

        try {
            // Save to DB
            const { error } = await supabase
                .from('user_secrets')
                .upsert({
                    id: userId,
                    mfa_secret: secret,
                    mfa_enabled: true,
                    updated_at: new Date().toISOString()
                });

            if (error) throw error;
            setIsEnabled(true);
            return { success: true };
        } catch (error: any) {
            return { error: error.message };
        }
    };

    const disable2FA = async () => {
        try {
            const { error } = await supabase
                .from('user_secrets')
                .update({
                    mfa_enabled: false,
                    mfa_secret: null,
                    updated_at: new Date().toISOString()
                })
                .eq('id', userId);

            if (error) throw error;
            setIsEnabled(false);
            setSecret('');
            setQrCodeUrl('');
            return { success: true };
        } catch (error: any) {
            return { error: error.message };
        }
    };

    return {
        loading,
        isEnabled,
        qrCodeUrl,
        secret,
        generateSecret,
        verifyAndEnable,
        disable2FA
    };
};
