'use client';

import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    children: React.ReactNode;
    size?: 'sm' | 'md' | 'lg' | 'xl';
}

export default function Modal({ isOpen, onClose, title, children, size = 'md' }: ModalProps) {
    useEffect(() => {
        if (isOpen) document.body.style.overflow = 'hidden';
        return () => { document.body.style.overflow = ''; };
    }, [isOpen]);

    if (!isOpen) return null;

    const sizeClasses = {
        sm: 'max-w-sm',
        md: 'max-w-lg',
        lg: 'max-w-2xl',
        xl: 'max-w-4xl',
    };

    return (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center" onClick={onClose}>
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-overlay" />
            <div
                className={cn(
                    'relative w-full bg-white dark:bg-gray-900 rounded-t-3xl md:rounded-2xl shadow-2xl max-h-[90vh] overflow-hidden flex flex-col',
                    'border border-gray-200 dark:border-gray-800',
                    'animate-modal',
                    sizeClasses[size]
                )}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-800">
                    <h2 className="text-lg font-semibold">{title}</h2>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors press-effect"
                    >
                        <X size={20} />
                    </button>
                </div>
                {/* Body */}
                <div className="flex-1 overflow-y-auto p-6">
                    {children}
                </div>
            </div>
        </div>
    );
}

// === Reusable Card ===
export function Card({ children, className, onClick }: { children: React.ReactNode; className?: string; onClick?: () => void }) {
    return (
        <div
            className={cn(
                'bg-white dark:bg-gray-900/70 rounded-2xl border border-gray-200/80 dark:border-gray-800/60 shadow-sm',
                'transition-all duration-300',
                onClick && 'cursor-pointer hover-lift',
                className
            )}
            onClick={onClick}
        >
            {children}
        </div>
    );
}

// === Stat Card ===
export function StatCard({ label, value, icon, color, subValue }: {
    label: string;
    value: string | number;
    icon: React.ReactNode;
    color: string;
    subValue?: string;
}) {
    return (
        <Card className="p-4 md:p-5 hover-lift">
            <div className="flex items-start justify-between">
                <div className="flex-1">
                    <p className="text-xs md:text-sm text-gray-500 dark:text-gray-400 font-medium">{label}</p>
                    <p className="text-xl md:text-2xl font-bold mt-1">{value}</p>
                    {subValue && <p className="text-xs text-gray-400 mt-1">{subValue}</p>}
                </div>
                <div className={cn('p-2.5 rounded-xl', color)}>
                    {icon}
                </div>
            </div>
        </Card>
    );
}

// === Badge ===
export function Badge({ children, variant = 'default', className }: {
    children: React.ReactNode;
    variant?: 'default' | 'success' | 'warning' | 'danger' | 'info' | 'purple';
    className?: string;
}) {
    const variants = {
        default: 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400',
        success: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400',
        warning: 'bg-amber-500/15 text-amber-600 dark:text-amber-400',
        danger: 'bg-red-500/15 text-red-600 dark:text-red-400',
        info: 'bg-blue-500/15 text-blue-600 dark:text-blue-400',
        purple: 'accent-badge',
    };
    return (
        <span className={cn('inline-flex items-center px-2 py-0.5 rounded-lg text-xs font-medium', variants[variant], className)}
            style={variant === 'purple' ? { backgroundColor: 'rgb(var(--accent-500) / 0.15)', color: 'rgb(var(--accent-400))' } : undefined}
        >
            {children}
        </span>
    );
}

// === Progress Bar ===
export function ProgressBar({ value, size = 'sm', color }: {
    value: number;
    size?: 'xs' | 'sm' | 'md';
    color?: string;
}) {
    const heights = { xs: 'h-1', sm: 'h-1.5', md: 'h-2.5' };
    return (
        <div className={cn('w-full bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden', heights[size])}>
            <div
                className={cn('h-full rounded-full animate-progress', color || 'accent-progress-bar')}
                style={!color ? {
                    background: `linear-gradient(to right, rgb(var(--accent-500)), rgb(var(--accent-400)))`,
                    width: `${Math.min(100, Math.max(0, value))}%`
                } : { width: `${Math.min(100, Math.max(0, value))}%` }}
            />
        </div>
    );
}

// === Empty State ===
export function EmptyState({ icon, title, description, action }: {
    icon: React.ReactNode;
    title: string;
    description: string;
    action?: React.ReactNode;
}) {
    return (
        <div className="flex flex-col items-center justify-center py-16 text-center animate-fade-up">
            <div className="p-4 rounded-2xl bg-gray-100 dark:bg-gray-800/50 mb-4 animate-float">
                {icon}
            </div>
            <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">{title}</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 max-w-sm mb-4">{description}</p>
            {action}
        </div>
    );
}

// === Button ===
export function Button({ children, variant = 'primary', size = 'md', onClick, className, disabled, type = 'button' }: {
    children: React.ReactNode;
    variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
    size?: 'sm' | 'md' | 'lg';
    onClick?: () => void;
    className?: string;
    disabled?: boolean;
    type?: 'button' | 'submit';
}) {
    const variants = {
        primary: '',
        secondary: 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700',
        ghost: 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800',
        danger: 'bg-red-500/15 text-red-600 dark:text-red-400 hover:bg-red-500/25',
    };
    const sizes = {
        sm: 'px-3 py-1.5 text-xs',
        md: 'px-4 py-2 text-sm',
        lg: 'px-6 py-3 text-base',
    };

    return (
        <button
            type={type}
            onClick={onClick}
            disabled={disabled}
            className={cn(
                'inline-flex items-center justify-center gap-2 rounded-xl font-medium transition-all duration-200 disabled:opacity-50 press-effect',
                variants[variant],
                sizes[size],
                className
            )}
            style={variant === 'primary' ? {
                background: `linear-gradient(135deg, rgb(var(--accent-500)), rgb(var(--accent-600)))`,
                color: 'white',
                boxShadow: '0 4px 12px -2px rgb(var(--accent-500) / 0.4)',
            } : undefined}
            onMouseEnter={variant === 'primary' ? (e) => {
                e.currentTarget.style.background = `linear-gradient(135deg, rgb(var(--accent-400)), rgb(var(--accent-600)))`;
                e.currentTarget.style.boxShadow = '0 6px 20px -2px rgb(var(--accent-500) / 0.5)';
            } : undefined}
            onMouseLeave={variant === 'primary' ? (e) => {
                e.currentTarget.style.background = `linear-gradient(135deg, rgb(var(--accent-500)), rgb(var(--accent-600)))`;
                e.currentTarget.style.boxShadow = '0 4px 12px -2px rgb(var(--accent-500) / 0.4)';
            } : undefined}
        >
            {children}
        </button>
    );
}
