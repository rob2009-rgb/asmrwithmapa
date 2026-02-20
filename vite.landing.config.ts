import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

/**
 * Vite config for the standalone public landing page.
 * Run: npx vite build --config vite.landing.config.ts
 * Output: dist-landing/  ← deployed via Cloudflare Pages
 */
export default defineConfig({
    root: 'landing',
    plugins: [react()],
    resolve: {
        alias: {
            '@': path.resolve(__dirname, './landing'),
        },
    },
    build: {
        outDir: '../dist-landing',
        emptyOutDir: true,
        sourcemap: false,
        rollupOptions: {
            input: {
                main: path.resolve(__dirname, 'landing/index.html'),
                privacy: path.resolve(__dirname, 'landing/privacy.html'),
                unsubscribe: path.resolve(__dirname, 'landing/unsubscribe.html'),
            },
            output: {
                // Chunk splitting for better caching
                manualChunks: {
                    vendor: ['react', 'react-dom'],
                    supabase: ['@supabase/supabase-js'],
                },
            },
        },
    },
});
