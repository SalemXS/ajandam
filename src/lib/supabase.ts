import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// Create a real client only if proper env vars are set
const isConfigured = supabaseUrl.startsWith('http') && supabaseAnonKey.length > 20;

const safeStorage = () => {
    if (typeof window === 'undefined') return undefined;
    try {
        // Proactively clear corrupt Supabase auth payloads
        try {
            const keys = Object.keys(window.localStorage);
            keys
                .filter(k =>
                    (k.startsWith('sb-') && k.endsWith('-auth-token')) ||
                    (k.startsWith('sb-') && k.includes('auth')) ||
                    k.includes('supabase')
                )
                .forEach(k => {
                    const value = window.localStorage.getItem(k);
                    if (!value) return;
                    try {
                        JSON.parse(value);
                    } catch {
                        window.localStorage.removeItem(k);
                    }
                });
        } catch {
            // ignore storage read errors
        }

        return {
            getItem: (key: string) => {
                try {
                    const value = window.localStorage.getItem(key);
                    if (!value) return null;
                    // Validate JSON to avoid crash in auth parsing
                    JSON.parse(value);
                    return value;
                } catch {
                    try { window.localStorage.removeItem(key); } catch { }
                    return null;
                }
            },
            setItem: (key: string, value: string) => {
                window.localStorage.setItem(key, value);
            },
            removeItem: (key: string) => {
                window.localStorage.removeItem(key);
            },
        };
    } catch {
        return undefined;
    }
};

export const supabase: SupabaseClient = isConfigured
    ? createClient(supabaseUrl, supabaseAnonKey, {
        auth: {
            storage: safeStorage(),
        },
    })
    : createClient('https://placeholder.supabase.co', 'placeholder-key-for-build');

export const isSupabaseConfigured = isConfigured;
