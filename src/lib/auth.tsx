'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { generateId } from './utils';

// Redefine basic types that were coming from Supabase
export interface User {
    id: string;
    email: string;
    user_metadata: {
        full_name?: string;
        avatar_url?: string;
        [key: string]: any;
    };
}

export interface Session {
    access_token: string;
    user: User;
}

export interface AuthError {
    message: string;
}

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

// Safe storage wrapping to avoid errors on SSR
const safeStorage = {
    getItem: (key: string): string | null => {
        if (typeof window === 'undefined') return null;
        try { return window.localStorage.getItem(key); } catch { return null; }
    },
    setItem: (key: string, value: string) => {
        if (typeof window === 'undefined') return;
        try { window.localStorage.setItem(key, value); } catch { }
    },
    removeItem: (key: string) => {
        if (typeof window === 'undefined') return;
        try { window.localStorage.removeItem(key); } catch { }
    }
};

const USERS_KEY = 'ajanda_users';
const SESSION_KEY = 'ajanda_current_session';

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [session, setSession] = useState<Session | null>(null);
    const [loading, setLoading] = useState(true);

    // Initialize session from localStorage
    useEffect(() => {
        const storedSession = safeStorage.getItem(SESSION_KEY);
        if (storedSession) {
            try {
                const parsedSession = JSON.parse(storedSession) as Session;
                // Verify user still exists
                const usersJson = safeStorage.getItem(USERS_KEY);
                const users = usersJson ? JSON.parse(usersJson) : [];
                const foundUser = users.find((u: any) => u.id === parsedSession.user.id);

                if (foundUser) {
                    setSession(parsedSession);
                    setUser(parsedSession.user);
                } else {
                    safeStorage.removeItem(SESSION_KEY);
                }
            } catch (e) {
                console.error("Failed to parse local session", e);
                safeStorage.removeItem(SESSION_KEY);
            }
        }
        setLoading(false);
    }, []);

    const signUp = async (email: string, password: string, fullName: string) => {
        const usersJson = safeStorage.getItem(USERS_KEY);
        const users = usersJson ? JSON.parse(usersJson) : [];

        if (users.some((u: any) => u.email === email)) {
            return { error: { message: "Bu e-posta adresi zaten kullanılıyor." } };
        }

        const newUser = {
            id: generateId(),
            email,
            password, // NOTE: In a real app this should be hashed. Fine for local-only mock.
            user_metadata: { full_name: fullName }
        };

        const updatedUsers = [...users, newUser];
        safeStorage.setItem(USERS_KEY, JSON.stringify(updatedUsers));

        // Auto sign-in
        const newSession = {
            access_token: `mock-token-${Date.now()}`,
            user: {
                id: newUser.id,
                email: newUser.email,
                user_metadata: newUser.user_metadata
            }
        };

        safeStorage.setItem(SESSION_KEY, JSON.stringify(newSession));
        setSession(newSession);
        setUser(newSession.user);

        return { error: null };
    };

    const signIn = async (email: string, password: string) => {
        const usersJson = safeStorage.getItem(USERS_KEY);
        const users = usersJson ? JSON.parse(usersJson) : [];

        const foundUser = users.find((u: any) => u.email === email && u.password === password);

        if (!foundUser) {
            return { error: { message: "Invalid login credentials" } };
        }

        const newSession = {
            access_token: `mock-token-${Date.now()}`,
            user: {
                id: foundUser.id,
                email: foundUser.email,
                user_metadata: foundUser.user_metadata
            }
        };

        safeStorage.setItem(SESSION_KEY, JSON.stringify(newSession));
        setSession(newSession);
        setUser(newSession.user);

        return { error: null };
    };

    const signOut = async () => {
        safeStorage.removeItem(SESSION_KEY);
        setSession(null);
        setUser(null);
    };

    const updateProfile = async (data: { full_name?: string }) => {
        if (!user) return { error: { message: "Giriş yapılmamış" } };

        try {
            // Update users list
            const usersJson = safeStorage.getItem(USERS_KEY);
            let users = usersJson ? JSON.parse(usersJson) : [];

            const userIndex = users.findIndex((u: any) => u.id === user.id);
            if (userIndex === -1) return { error: { message: "Kullanıcı bulunamadı" } };

            users[userIndex].user_metadata = { ...users[userIndex].user_metadata, ...data };
            safeStorage.setItem(USERS_KEY, JSON.stringify(users));

            // Update local state 
            const updatedUser = { ...user, user_metadata: { ...user.user_metadata, ...data } };
            const updatedSession = { ...session!, user: updatedUser };

            safeStorage.setItem(SESSION_KEY, JSON.stringify(updatedSession));
            setUser(updatedUser);
            setSession(updatedSession);

            return { error: null };
        } catch (e: any) {
            return { error: { message: e.message } };
        }
    };

    const updateEmail = async (newEmail: string) => {
        if (!user) return { error: { message: "Giriş yapılmamış" } };

        // Update users list
        const usersJson = safeStorage.getItem(USERS_KEY);
        let users = usersJson ? JSON.parse(usersJson) : [];

        if (users.some((u: any) => u.email === newEmail && u.id !== user.id)) {
            return { error: { message: "Bu e-posta adresi zaten kullanılıyor." } };
        }

        const userIndex = users.findIndex((u: any) => u.id === user.id);
        if (userIndex === -1) return { error: { message: "Kullanıcı bulunamadı" } };

        users[userIndex].email = newEmail;
        safeStorage.setItem(USERS_KEY, JSON.stringify(users));

        // Update local state
        const updatedUser = { ...user, email: newEmail };
        const updatedSession = { ...session!, user: updatedUser };

        safeStorage.setItem(SESSION_KEY, JSON.stringify(updatedSession));
        setUser(updatedUser);
        setSession(updatedSession);

        return { error: null };
    };

    const updatePassword = async (newPassword: string) => {
        if (!user) return { error: { message: "Giriş yapılmamış" } };

        // Update users list
        const usersJson = safeStorage.getItem(USERS_KEY);
        let users = usersJson ? JSON.parse(usersJson) : [];

        const userIndex = users.findIndex((u: any) => u.id === user.id);
        if (userIndex === -1) return { error: { message: "Kullanıcı bulunamadı" } };

        users[userIndex].password = newPassword;
        safeStorage.setItem(USERS_KEY, JSON.stringify(users));

        return { error: null };
    };

    const uploadAvatar = async (file: File): Promise<{ url: string | null; error: string | null }> => {
        if (!user) return { url: null, error: 'Giriş yapılmamış' };

        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.onloadend = async () => {
                const base64String = reader.result as string;

                // localStorage warning!
                if (base64String.length > 2000000) {
                    resolve({ url: null, error: 'Görsel boyutu çok büyük (Local Storage sınırı)' });
                    return;
                }

                const { error } = await updateProfile({ avatar_url: base64String });

                if (error) {
                    resolve({ url: null, error: error.message });
                } else {
                    resolve({ url: base64String, error: null });
                }
            };
            reader.onerror = () => {
                resolve({ url: null, error: 'Dosya okuma hatası' });
            };

            reader.readAsDataURL(file);
        });
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
