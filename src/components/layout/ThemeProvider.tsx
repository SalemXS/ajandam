'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useStore } from '@/lib/store';
import { AccentColors } from '@/lib/types';

type Theme = 'light' | 'dark';

// Preset palettes with RGB values
export const PRESET_PALETTES: Record<string, { name: string; colors: AccentColors }> = {
    violet: {
        name: 'Mor',
        colors: { 50: '245 243 255', 100: '237 233 254', 200: '221 214 254', 300: '196 181 253', 400: '167 139 250', 500: '139 92 246', 600: '124 58 237', 700: '109 40 217' },
    },
    blue: {
        name: 'Mavi',
        colors: { 50: '239 246 255', 100: '219 234 254', 200: '191 219 254', 300: '147 197 253', 400: '96 165 250', 500: '59 130 246', 600: '37 99 235', 700: '29 78 216' },
    },
    emerald: {
        name: 'Zümrüt',
        colors: { 50: '236 253 245', 100: '209 250 229', 200: '167 243 208', 300: '110 231 183', 400: '52 211 153', 500: '16 185 129', 600: '5 150 105', 700: '4 120 87' },
    },
    rose: {
        name: 'Gül',
        colors: { 50: '255 241 242', 100: '255 228 230', 200: '254 205 211', 300: '253 164 175', 400: '251 113 133', 500: '244 63 94', 600: '225 29 72', 700: '190 18 60' },
    },
    amber: {
        name: 'Kehribar',
        colors: { 50: '255 251 235', 100: '254 243 199', 200: '253 230 138', 300: '252 211 77', 400: '251 191 36', 500: '245 158 11', 600: '217 119 6', 700: '180 83 9' },
    },
    cyan: {
        name: 'Camgöbeği',
        colors: { 50: '236 254 255', 100: '207 250 254', 200: '165 243 252', 300: '103 232 249', 400: '34 211 238', 500: '6 182 212', 600: '8 145 178', 700: '14 116 144' },
    },
    pink: {
        name: 'Pembe',
        colors: { 50: '253 242 248', 100: '252 231 243', 200: '251 207 232', 300: '249 168 212', 400: '244 114 182', 500: '236 72 153', 600: '219 39 119', 700: '190 24 93' },
    },
    teal: {
        name: 'Deniz Yeşili',
        colors: { 50: '240 253 250', 100: '204 251 241', 200: '153 246 228', 300: '94 234 212', 400: '45 212 191', 500: '20 184 166', 600: '13 148 136', 700: '15 118 110' },
    },
};

interface ThemeContextType {
    theme: Theme;
    toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType>({ theme: 'dark', toggleTheme: () => { } });

export function useTheme() {
    return useContext(ThemeContext);
}

function applyPalette(colors: AccentColors) {
    const root = document.documentElement;
    root.style.setProperty('--accent-50', colors[50]);
    root.style.setProperty('--accent-100', colors[100]);
    root.style.setProperty('--accent-200', colors[200]);
    root.style.setProperty('--accent-300', colors[300]);
    root.style.setProperty('--accent-400', colors[400]);
    root.style.setProperty('--accent-500', colors[500]);
    root.style.setProperty('--accent-600', colors[600]);
    root.style.setProperty('--accent-700', colors[700]);
}

export default function ThemeProvider({ children }: { children: React.ReactNode }) {
    const settings = useStore((s) => s.settings);
    const updateSettings = useStore((s) => s.updateSettings);
    const [theme, setTheme] = useState<Theme>('dark');
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        if (settings.theme === 'system') {
            const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
            setTheme(isDark ? 'dark' : 'light');
        } else {
            setTheme(settings.theme as Theme);
        }
    }, [settings.theme]);

    // Apply theme class
    useEffect(() => {
        if (mounted) {
            if (theme === 'dark') {
                document.documentElement.classList.add('dark');
            } else {
                document.documentElement.classList.remove('dark');
            }
        }
    }, [theme, mounted]);

    // Apply accent palette
    useEffect(() => {
        if (!mounted) return;
        const paletteId = settings.accentPalette || 'violet';

        // Check preset first
        if (PRESET_PALETTES[paletteId]) {
            applyPalette(PRESET_PALETTES[paletteId].colors);
        } else {
            // Check custom palettes
            const custom = settings.customPalettes?.find(p => p.id === paletteId);
            if (custom) {
                applyPalette(custom.colors);
            } else {
                applyPalette(PRESET_PALETTES.violet.colors);
            }
        }
    }, [mounted, settings.accentPalette, settings.customPalettes]);

    const toggleTheme = () => {
        const newTheme = theme === 'dark' ? 'light' : 'dark';
        setTheme(newTheme);
        updateSettings({ theme: newTheme });
    };

    if (!mounted) {
        return <div className="min-h-screen bg-gray-950" />;
    }

    return (
        <ThemeContext.Provider value={{ theme, toggleTheme }}>
            {children}
        </ThemeContext.Provider>
    );
}
