'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
    LayoutDashboard, CheckSquare, Wallet, Target, StickyNote,
    Plus, X, ListTodo, Receipt, Bell, FileText
} from 'lucide-react';
import { cn } from '@/lib/utils';

const tabs = [
    { href: '/', label: 'Panel', icon: LayoutDashboard },
    { href: '/gorevler', label: 'Görevler', icon: CheckSquare },
    { href: '/finans', label: 'Finans', icon: Wallet },
    { href: '/hedefler', label: 'Hedefler', icon: Target },
    { href: '/notlar', label: 'Notlar', icon: StickyNote },
];

interface MobileNavProps {
    onQuickAdd?: (type: 'task' | 'transaction' | 'note' | 'reminder') => void;
}

export default function MobileNav({ onQuickAdd }: MobileNavProps) {
    const pathname = usePathname();
    const [fabOpen, setFabOpen] = useState(false);

    const quickActions = [
        { type: 'task' as const, label: 'Görev', icon: ListTodo, color: 'bg-blue-500' },
        { type: 'transaction' as const, label: 'İşlem', icon: Receipt, color: 'bg-emerald-500' },
        { type: 'note' as const, label: 'Not', icon: FileText, color: 'bg-amber-500' },
        { type: 'reminder' as const, label: 'Hatırlatma', icon: Bell, color: 'bg-purple-500' },
    ];

    return (
        <>
            {/* FAB Overlay */}
            {fabOpen && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 md:hidden animate-overlay" onClick={() => setFabOpen(false)} />
            )}

            {/* FAB Menu */}
            {fabOpen && (
                <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 flex flex-col items-center gap-3 md:hidden">
                    {quickActions.map((action, i) => (
                        <button
                            key={action.type}
                            onClick={() => {
                                onQuickAdd?.(action.type);
                                setFabOpen(false);
                            }}
                            className={cn(
                                'flex items-center gap-3 px-5 py-3 rounded-2xl shadow-xl text-white font-medium text-sm press-effect animate-fade-up',
                                action.color,
                            )}
                            style={{ animationDelay: `${i * 60}ms` }}
                        >
                            <action.icon size={18} />
                            {action.label}
                        </button>
                    ))}
                </div>
            )}

            {/* Bottom Tab Bar */}
            <nav className="fixed bottom-0 left-0 right-0 z-40 md:hidden">
                <div className="bg-white/95 dark:bg-gray-950/95 backdrop-blur-xl border-t border-gray-200/80 dark:border-gray-800/80 safe-area-bottom">
                    <div className="flex items-center justify-around px-2 h-16 max-w-lg mx-auto relative">
                        {tabs.map((tab) => {
                            const isActive = pathname === tab.href || (tab.href !== '/' && pathname.startsWith(tab.href));

                            return (
                                <Link
                                    key={tab.href}
                                    href={tab.href}
                                    className={cn(
                                        'relative flex flex-col items-center justify-center w-14 h-14 rounded-2xl transition-all press-effect',
                                        isActive ? 'tab-active-dot' : 'text-gray-400 dark:text-gray-500'
                                    )}
                                    style={isActive ? { color: `rgb(var(--accent-500))` } : undefined}
                                >
                                    <tab.icon size={20} className={cn(
                                        'transition-transform duration-200',
                                        isActive && 'scale-110'
                                    )} />
                                    <span className={cn(
                                        'text-[10px] mt-1 font-medium transition-all',
                                        isActive && 'font-semibold'
                                    )}>{tab.label}</span>
                                </Link>
                            );
                        })}
                    </div>
                </div>

                {/* FAB Button */}
                <button
                    onClick={() => setFabOpen(!fabOpen)}
                    className={cn(
                        'absolute -top-6 left-1/2 -translate-x-1/2 w-14 h-14 rounded-full shadow-xl flex items-center justify-center transition-all duration-300 z-50 press-effect',
                        fabOpen && 'bg-gray-600 rotate-45'
                    )}
                    style={!fabOpen ? {
                        background: `linear-gradient(135deg, rgb(var(--accent-400)), rgb(var(--accent-600)))`,
                        boxShadow: `0 4px 20px rgb(var(--accent-500) / 0.4)`,
                    } : undefined}
                >
                    {fabOpen ? <X size={24} className="text-white" /> : <Plus size={24} className="text-white" />}
                </button>
            </nav>
        </>
    );
}
