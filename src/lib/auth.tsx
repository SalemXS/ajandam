'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session, AuthError } from '@supabase/supabase-js';
import { supabase } from './supabase';

interface AuthContextType {
    user: User | null;
    session: Session | null;
    loading: boolean;
    signUp: (email: string, password: string, fullName: string) => Promise<{ error: AuthError | null }>;
    signIn: (email: string, password: string) => Promise<{ error: AuthError | null }>;
    signOut: () => Promise<void>;
    updateProfile: (data: { full_name?: string }) => Promise<{ error: AuthError | null }>;
    updateEmail: (newEmail: string) => Promise<{ error: AuthError | null }>;
    updatePassword: (newPassword: string) => Promise<{ error: AuthError | null }>;
    uploadAvatar: (file: File) => Promise<{ url: string | null; error: string | null }>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [session, setSession] = useState<Session | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let mounted = true;

        const clearCorruptAuthStorage = () => {
            if (typeof window === 'undefined') return;
            try {
                const keys = Object.keys(window.localStorage);
                keys
                    .filter(k =>
                        (k.startsWith('sb-') && k.endsWith('-auth-token')) ||
                        (k.startsWith('sb-') && k.includes('auth')) ||
                        k.includes('supabase')
                    )
                    .forEach(k => window.localStorage.removeItem(k));
            } catch {
                // ignore storage access errors
            }
        };

        supabase.auth.getSession()
            .then(({ data: { session } }) => {
                if (!mounted) return;
                setSession(session);
                setUser(session?.user ?? null);
                setLoading(false);
            })
            .catch((err) => {
                console.error('Failed to read Supabase session:', err);
                clearCorruptAuthStorage();
                if (!mounted) return;
                setSession(null);
                setUser(null);
                setLoading(false);
            });

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            if (!mounted) return;
            setSession(session);
            setUser(session?.user ?? null);
            setLoading(false);
        });

        return () => {
            mounted = false;
            subscription.unsubscribe();
        };
    }, []);

    const signUp = async (email: string, password: string, fullName: string) => {
        const { error } = await supabase.auth.signUp({
            email,
            password,
            options: { data: { full_name: fullName } },
        });
        return { error };
    };

    const signIn = async (email: string, password: string) => {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        return { error };
    };

    const signOut = async () => {
        await supabase.auth.signOut();
    };

    const updateProfile = async (data: { full_name?: string }) => {
        const { error } = await supabase.auth.updateUser({ data });
        if (!error) {
            // Refresh user state
            const { data: { user: updatedUser } } = await supabase.auth.getUser();
            setUser(updatedUser);
        }
        return { error };
    };

    const updateEmail = async (newEmail: string) => {
        const { error } = await supabase.auth.updateUser({ email: newEmail });
        return { error };
    };

    const updatePassword = async (newPassword: string) => {
        const { error } = await supabase.auth.updateUser({ password: newPassword });
        return { error };
    };

    const uploadAvatar = async (file: File): Promise<{ url: string | null; error: string | null }> => {
        if (!user) return { url: null, error: 'Giriş yapılmamış' };

        const fileExt = file.name.split('.').pop();
        const filePath = `${user.id}/avatar.${fileExt}`;

        // Upload to Supabase Storage
        const { error: uploadError } = await supabase.storage
            .from('avatars')
            .upload(filePath, file, { upsert: true });

        if (uploadError) {
            return { url: null, error: uploadError.message };
        }

        // Get public URL
        const { data } = supabase.storage.from('avatars').getPublicUrl(filePath);
        const avatarUrl = data.publicUrl + '?t=' + Date.now(); // cache bust

        // Save URL to user metadata
        const { error: updateError } = await supabase.auth.updateUser({
            data: { avatar_url: avatarUrl },
        });

        if (updateError) {
            return { url: null, error: updateError.message };
        }

        // Refresh user state
        const { data: { user: updatedUser } } = await supabase.auth.getUser();
        setUser(updatedUser);

        return { url: avatarUrl, error: null };
    };

    return (
        <AuthContext.Provider value={{
            user, session, loading,
            signUp, signIn, signOut,
            updateProfile, updateEmail, updatePassword, uploadAvatar,
        }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
