import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.mapa.asmr',
  appName: 'ASMR with MAPA',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
    iosScheme: 'https',
    // Restrict WebView from navigating to external URLs (prevents open-redirect attacks)
    allowNavigation: [],
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: "#0f172a", // Dark slate matches night mode
      spinnerColor: "#ec4899",
      showSpinner: false,
    },
    // Edge-to-edge / safe area support for iOS notch/Dynamic Island
    StatusBar: {
      style: 'Dark',
      backgroundColor: '#0f172a',
      overlaysWebView: true,
    },
  },
};

export default config;
