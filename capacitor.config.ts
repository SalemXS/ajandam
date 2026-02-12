import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
    appId: 'com.salem.kisiselAjanda',
    appName: 'Kişisel Ajanda',
    webDir: 'out',
    server: {
        // For development: point to your local Next.js dev server
        // For production: deploy your Next.js app and use the URL here
        // url: 'http://10.0.2.2:3000', // Android emulator localhost
        // url: 'http://192.168.x.x:3000', // Physical device (use your PC's IP)

        // Allow loading from Supabase
        allowNavigation: ['*.supabase.co'],

        // Clear text traffic allowed for development
        androidScheme: 'https',
    },
    // Android-specific configuration
    android: {
        allowMixedContent: true,
    },
};

export default config;
