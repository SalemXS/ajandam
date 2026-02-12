import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
    appId: 'com.salem.kisiselAjanda',
    appName: 'Kişisel Ajanda',
    webDir: 'out',
    server: {
        // Production: load from Vercel deployment
        url: 'https://ajandam.vercel.app',

        // Allow loading from Supabase
        allowNavigation: ['*.supabase.co', 'ajandam.vercel.app'],

        // Clear text traffic allowed for development
        androidScheme: 'https',
    },
    // Android-specific configuration
    android: {
        allowMixedContent: true,
    },
};

export default config;

