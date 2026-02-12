'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTheme } from './ThemeProvider';
import { useAuth } from '@/lib/auth';
import { useStore } from '@/lib/store';
import {
    LayoutDashboard, CheckSquare, Wallet, Target, StickyNote,
    Settings, CalendarDays, LogOut, Bell, Sparkles, Focus, Moon
} from 'lucide-react';
import { cn, getOverdueTasks, getUpcomingReminders } from '@/lib/utils';
import SplitText from '../reactbits/SplitText';

interface NavItem {
    href: string;
    label: string;
    icon: React.ComponentType<{ size?: number; className?: string }>;
}

interface NavGroup {
    label: string;
    items: NavItem[];
}

const navGroups: NavGroup[] = [
    {
        label: 'GENEL',
        items: [
            { href: '/', label: 'Ana Panel', icon: LayoutDashboard },
            { href: '/gorevler', label: 'Görevler', icon: CheckSquare },
            { href: '/takvim', label: 'Takvim', icon: CalendarDays },
        ],
    },
    {
        label: 'FİNANS',
        items: [
            { href: '/finans', label: 'Finans', icon: Wallet },
            { href: '/hedefler', label: 'Hedefler', icon: Target },
        ],
    },
    {
        label: 'DİĞER',
        items: [
            { href: '/notlar', label: 'Notlar', icon: StickyNote },
            { href: '/notlar?tab=hatirlatmalar', label: 'Hatırlatmalar', icon: Bell },
        ],
    },
];

export default function Sidebar() {
    const pathname = usePathname();
    const { theme, toggleTheme } = useTheme();
    const { user, signOut } = useAuth();
    const { tasks, reminders } = useStore();
    const [focusMode, setFocusMode] = useState(false);

    const overdueTasks = getOverdueTasks(tasks);
    const upcomingReminders = getUpcomingReminders(reminders);
    const overdueCount = overdueTasks.length;
    const activeTasks = tasks.filter(t => !t.archived && t.status !== 'done');

    const avatarUrl = user?.user_metadata?.avatar_url;
    const userInitials = user?.user_metadata?.full_name
        ? user.user_metadata.full_name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)
        : user?.email?.slice(0, 2).toUpperCase() || '??';

    const displayName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Kullanıcı';

    const getBadge = (href: string) => {
        if (href === '/gorevler') return activeTasks.length > 0 ? activeTasks.length : null;
        return null;
    };

    const isItemActive = (href: string) => {
        if (href.includes('?tab=hatirlatmalar')) {
            return pathname === '/notlar' && (typeof window !== 'undefined' && window.location.search.includes('tab=hatirlatmalar'));
        }
        if (href === '/notlar') {
            return pathname === '/notlar' && !(typeof window !== 'undefined' && window.location.search.includes('tab=hatirlatmalar'));
        }
        return pathname === href || (href !== '/' && pathname.startsWith(href));
    };

    return (
        <aside
            className={cn(
                'hidden md:flex flex-col h-screen sticky top-0 border-r z-40 w-[260px] transition-colors duration-300',
                'bg-white dark:bg-gray-950 border-gray-200 dark:border-gray-800/60'
            )}
        >
            {/* Logo */}
            <div className="flex items-center gap-3 px-5 py-5">
                <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg"
                    style={{
                        background: `linear-gradient(135deg, rgb(var(--accent-400)), rgb(var(--accent-600)))`,
                        boxShadow: `0 4px 15px rgb(var(--accent-500) / 0.35)`
                    }}
                >
                    <Sparkles className="text-white" size={20} />
                </div>
                <div>
                    <span
                        className="font-bold text-base block leading-tight"
                        style={{ color: `rgb(var(--accent-400))` }}
                    >
                        Kişisel
                    </span>
                    <span
                        className="font-bold text-base block leading-tight"
                        style={{ color: `rgb(var(--accent-400))` }}
                    >
                        Ajanda
                    </span>
                </div>
            </div>

            {/* Divider */}
            <div className="mx-4 border-t border-gray-200 dark:border-gray-800/60" />


            {/* Navigation Groups */}
            <nav className="flex-1 py-3 px-3 space-y-5 overflow-y-auto">
                {navGroups.map((group) => (
                    <div key={group.label}>
                        <p className="px-3 mb-2 text-[11px] font-semibold tracking-widest text-gray-400 dark:text-gray-500 uppercase">
                            {group.label}
                        </p>
                        <div className="space-y-0.5">
                            {group.items.map((item) => {
                                const isActive = isItemActive(item.href);
                                const badge = getBadge(item.href);

                                return (
                                    <Link
                                        key={item.href}
                                        href={item.href}
                                        className={cn(
                                            'group flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200',
                                            isActive
                                                ? 'text-white shadow-md'
                                                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-white/5'
                                        )}
                                        style={isActive ? {
                                            background: `linear-gradient(135deg, rgb(var(--accent-500)), rgb(var(--accent-600)))`,
                                            boxShadow: `0 4px 12px rgb(var(--accent-500) / 0.3)`
                                        } : undefined}
                                    >
                                        <item.icon
                                            size={20}
                                            className={cn(
                                                'flex-shrink-0 transition-transform duration-200',
                                                !isActive && 'group-hover:scale-110'
                                            )}
                                        />
                                        <span className="flex-1">{item.label}</span>
                                        {badge && (
                                            <span
                                                className={cn(
                                                    'min-w-[22px] h-[22px] flex items-center justify-center rounded-full text-[11px] font-bold px-1.5',
                                                    isActive
                                                        ? 'bg-white/25 text-white'
                                                        : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
                                                )}
                                            >
                                                {badge}
                                            </span>
                                        )}
                                    </Link>
                                );
                            })}
                        </div>
                    </div>
                ))}

                {/* SİSTEM Group */}
                <div>
                    <p className="px-3 mb-2 text-[11px] font-semibold tracking-widest text-gray-400 dark:text-gray-500 uppercase">
                        SİSTEM
                    </p>
                    <div className="space-y-0.5">
                        {/* Ayarlar */}
                        <Link
                            href="/ayarlar"
                            className={cn(
                                'group flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200',
                                pathname === '/ayarlar'
                                    ? 'text-white shadow-md'
                                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-white/5'
                            )}
                            style={pathname === '/ayarlar' ? {
                                background: `linear-gradient(135deg, rgb(var(--accent-500)), rgb(var(--accent-600)))`,
                                boxShadow: `0 4px 12px rgb(var(--accent-500) / 0.3)`
                            } : undefined}
                        >
                            <Settings size={20} className={cn('flex-shrink-0 transition-transform duration-200', pathname !== '/ayarlar' && 'group-hover:scale-110')} />
                            <span className="flex-1">Ayarlar</span>
                        </Link>

                        {/* Odak Modu */}
                        <button
                            onClick={() => setFocusMode(!focusMode)}
                            className={cn(
                                'group flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 w-full',
                                focusMode
                                    ? 'text-white shadow-md'
                                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-white/5'
                            )}
                            style={focusMode ? {
                                background: `linear-gradient(135deg, rgb(var(--accent-500)), rgb(var(--accent-600)))`,
                                boxShadow: `0 4px 12px rgb(var(--accent-500) / 0.3)`
                            } : undefined}
                        >
                            <Focus size={20} className="flex-shrink-0" />
                            <span className="flex-1 text-left">Odak Modu</span>
                        </button>

                        {/* Karanlık Mod — Toggle Switch */}
                        <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-600 dark:text-gray-400">
                            <Moon size={20} className="flex-shrink-0" />
                            <span className="flex-1">Karanlık Mod</span>
                            <button
                                onClick={toggleTheme}
                                className={cn(
                                    'relative w-11 h-6 rounded-full transition-colors duration-300 flex-shrink-0',
                                    theme === 'dark' ? 'bg-[rgb(var(--accent-500))]' : 'bg-gray-300'
                                )}
                            >
                                <span
                                    className={cn(
                                        'absolute top-0.5 w-5 h-5 bg-white rounded-full shadow-md transition-transform duration-300',
                                        theme === 'dark' ? 'translate-x-[22px]' : 'translate-x-0.5'
                                    )}
                                />
                            </button>
                        </div>
                    </div>
                </div>
            </nav>

            {/* Bottom User Section */}
            <div className="border-t border-gray-200 dark:border-gray-800/60 p-3">
                {user && (
                    <div className="flex items-center gap-3 px-2">
                        <div className="relative flex-shrink-0">
                            {avatarUrl ? (
                                <img
                                    src={avatarUrl}
                                    alt="Profil"
                                    className="w-9 h-9 rounded-lg object-cover"
                                />
                            ) : (
                                <div
                                    className="w-9 h-9 rounded-lg flex items-center justify-center text-white text-sm font-bold"
                                    style={{ background: 'linear-gradient(135deg, rgb(var(--accent-500)), rgb(var(--accent-600)))' }}
                                >
                                    {userInitials}
                                </div>
                            )}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-gray-800 dark:text-gray-200 truncate">{displayName}</p>
                            <p className="text-[11px] text-gray-400 dark:text-gray-500 truncate">{user.email}</p>
                        </div>
                        <button
                            onClick={signOut}
                            className="p-2 rounded-lg text-gray-400 dark:text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                            title="Çıkış Yap"
                        >
                            <LogOut size={16} />
                        </button>
                    </div>
                )}
            </div>
        </aside>
    );
}
