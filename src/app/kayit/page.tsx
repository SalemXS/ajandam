'use client';

import React, { useState } from 'react';
import { useAuth } from '@/lib/auth';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Mail, Lock, User, UserPlus, AlertCircle, Eye, EyeOff, CheckCircle2 } from 'lucide-react';

export default function KayitPage() {
    const { signUp } = useAuth();
    const router = useRouter();
    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (password !== confirmPassword) {
            setError('Şifreler eşleşmiyor');
            return;
        }

        if (password.length < 6) {
            setError('Şifre en az 6 karakter olmalı');
            return;
        }

        setLoading(true);

        const { error } = await signUp(email, password, fullName);

        if (error) {
            setError(
                error.message === 'User already registered'
                    ? 'Bu e-posta adresi zaten kayıtlı'
                    : error.message
            );
            setLoading(false);
        } else {
            setSuccess(true);
            setLoading(false);
            // Auto-redirect after signup (Supabase may auto-confirm or require email confirmation)
            setTimeout(() => router.push('/'), 1500);
        }
    };

    // Password strength indicators
    const hasLength = password.length >= 6;
    const hasUpper = /[A-Z]/.test(password);
    const hasNumber = /[0-9]/.test(password);

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950 p-4">
            <div className="w-full max-w-md">
                {/* Logo / Header */}
                <div className="text-center mb-8">
                    <div
                        className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 text-white text-2xl font-bold shadow-lg"
                        style={{ background: 'linear-gradient(135deg, rgb(var(--accent-500)), rgb(var(--accent-700)))' }}
                    >
                        📋
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Hesap Oluştur</h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1 text-sm">Kişisel Ajanda'ya kayıt ol</p>
                </div>

                {/* Form Card */}
                <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-xl p-6 md:p-8">
                    {success ? (
                        <div className="text-center py-8">
                            <div className="w-16 h-16 rounded-full bg-emerald-500/15 flex items-center justify-center mx-auto mb-4">
                                <CheckCircle2 size={32} className="text-emerald-400" />
                            </div>
                            <h2 className="text-lg font-bold mb-2">Kayıt Başarılı! 🎉</h2>
                            <p className="text-sm text-gray-400">Yönlendiriliyorsunuz...</p>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-4">
                            {/* Error Alert */}
                            {error && (
                                <div className="flex items-center gap-2 p-3 rounded-xl bg-red-500/10 text-red-500 text-sm">
                                    <AlertCircle size={16} className="flex-shrink-0" />
                                    {error}
                                </div>
                            )}

                            {/* Full Name */}
                            <div>
                                <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1.5">Ad Soyad</label>
                                <div className="relative">
                                    <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                                    <input
                                        type="text"
                                        value={fullName}
                                        onChange={(e) => setFullName(e.target.value)}
                                        className="w-full pl-11 pr-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 text-sm outline-none focus:ring-2 focus:ring-[rgb(var(--accent-500))] focus:border-transparent transition-all"
                                        placeholder="Ahmet Yılmaz"
                                        required
                                    />
                                </div>
                            </div>

                            {/* Email */}
                            <div>
                                <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1.5">E-posta</label>
                                <div className="relative">
                                    <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                                    <input
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="w-full pl-11 pr-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 text-sm outline-none focus:ring-2 focus:ring-[rgb(var(--accent-500))] focus:border-transparent transition-all"
                                        placeholder="ornek@email.com"
                                        required
                                        autoComplete="email"
                                    />
                                </div>
                            </div>

                            {/* Password */}
                            <div>
                                <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1.5">Şifre</label>
                                <div className="relative">
                                    <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="w-full pl-11 pr-11 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 text-sm outline-none focus:ring-2 focus:ring-[rgb(var(--accent-500))] focus:border-transparent transition-all"
                                        placeholder="••••••••"
                                        required
                                        autoComplete="new-password"
                                        minLength={6}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                                    >
                                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                    </button>
                                </div>
                                {/* Password strength */}
                                {password && (
                                    <div className="flex gap-3 mt-2 text-[10px]">
                                        <span className={hasLength ? 'text-emerald-400' : 'text-gray-500'}>✓ 6+ karakter</span>
                                        <span className={hasUpper ? 'text-emerald-400' : 'text-gray-500'}>✓ Büyük harf</span>
                                        <span className={hasNumber ? 'text-emerald-400' : 'text-gray-500'}>✓ Rakam</span>
                                    </div>
                                )}
                            </div>

                            {/* Confirm Password */}
                            <div>
                                <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1.5">Şifre Tekrar</label>
                                <div className="relative">
                                    <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        className="w-full pl-11 pr-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 text-sm outline-none focus:ring-2 focus:ring-[rgb(var(--accent-500))] focus:border-transparent transition-all"
                                        placeholder="••••••••"
                                        required
                                        autoComplete="new-password"
                                        minLength={6}
                                    />
                                </div>
                                {confirmPassword && password !== confirmPassword && (
                                    <p className="text-[10px] text-red-400 mt-1">Şifreler eşleşmiyor</p>
                                )}
                            </div>

                            {/* Submit */}
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full py-3 rounded-xl text-white font-medium text-sm flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl hover:scale-[1.01] active:scale-[0.99]"
                                style={{
                                    background: 'linear-gradient(135deg, rgb(var(--accent-500)), rgb(var(--accent-600)))',
                                    boxShadow: '0 4px 12px rgb(var(--accent-500) / 0.3)',
                                }}
                            >
                                {loading ? (
                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                ) : (
                                    <>
                                        <UserPlus size={16} /> Kayıt Ol
                                    </>
                                )}
                            </button>
                        </form>
                    )}

                    {/* Login Link */}
                    {!success && (
                        <div className="mt-6 text-center">
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                Zaten hesabınız var mı?{' '}
                                <Link
                                    href="/giris"
                                    className="font-medium hover:underline"
                                    style={{ color: 'rgb(var(--accent-400))' }}
                                >
                                    Giriş Yap
                                </Link>
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
