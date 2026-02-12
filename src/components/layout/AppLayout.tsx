'use client';

import React, { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import Sidebar from './Sidebar';
import MobileNav from './MobileNav';
import { useAuth } from '@/lib/auth';
import { useStore } from '@/lib/store';
import TaskFormModal from '@/components/tasks/TaskFormModal';
import TransactionFormModal from '@/components/finance/TransactionFormModal';
import NoteFormModal from '@/components/notes/NoteFormModal';
import ReminderFormModal from '@/components/notes/ReminderFormModal';

const AUTH_ROUTES = ['/giris', '/kayit'];

export default function AppLayout({ children }: { children: React.ReactNode }) {
    const { user, loading } = useAuth();
    const pathname = usePathname();
    const [quickAddType, setQuickAddType] = useState<'task' | 'transaction' | 'note' | 'reminder' | null>(null);
    const { initialized, initializeData } = useStore();

    // Initialize data when user is authenticated
    useEffect(() => {
        if (user && !initialized) {
            initializeData();
        }
    }, [user, initialized, initializeData]);

    const isAuthRoute = AUTH_ROUTES.includes(pathname);

    // Show loading spinner while checking auth
    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-950">
                <div className="flex flex-col items-center gap-4">
                    <div
                        className="w-12 h-12 rounded-2xl flex items-center justify-center text-white font-bold shadow-lg animate-pulse"
                        style={{ background: 'linear-gradient(135deg, rgb(var(--accent-500)), rgb(var(--accent-700)))' }}
                    >
                        KA
                    </div>
                    <div className="w-6 h-6 border-2 border-gray-300 dark:border-gray-600 border-t-[rgb(var(--accent-500))] rounded-full animate-spin" />
                </div>
            </div>
        );
    }

    // Auth pages: no sidebar, no nav
    if (isAuthRoute) {
        return <>{children}</>;
    }

    // Not authenticated and not on auth page → redirect to login
    if (!user && !isAuthRoute) {
        // Use a client-side redirect
        if (typeof window !== 'undefined') {
            window.location.href = '/giris';
        }
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-950">
                <div className="w-6 h-6 border-2 border-gray-300 dark:border-gray-600 border-t-[rgb(var(--accent-500))] rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="flex min-h-screen bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100">
            <Sidebar />
            <main className="flex-1 min-h-screen pb-20 md:pb-0">
                <div className="max-w-7xl mx-auto p-4 md:p-6 lg:p-8">
                    {children}
                </div>
            </main>
            <MobileNav onQuickAdd={setQuickAddType} />

            {/* Quick Add Modals */}
            {quickAddType === 'task' && <TaskFormModal onClose={() => setQuickAddType(null)} />}
            {quickAddType === 'transaction' && <TransactionFormModal onClose={() => setQuickAddType(null)} />}
            {quickAddType === 'note' && <NoteFormModal onClose={() => setQuickAddType(null)} />}
            {quickAddType === 'reminder' && <ReminderFormModal onClose={() => setQuickAddType(null)} />}
        </div>
    );
}
