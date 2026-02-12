'use client';

import React, { useState, useRef } from 'react';
import { useStore } from '@/lib/store';
import { Card, Button } from '@/components/ui/SharedUI';
import { useTheme, PRESET_PALETTES } from '@/components/layout/ThemeProvider';
import { useAuth } from '@/lib/auth';
import { Sun, Moon, Database, Trash2, RefreshCw, Palette, Plus, X, Check, Edit2, Camera, User, Mail, Lock, Eye, EyeOff, Save, Loader2 } from 'lucide-react';
import { cn, formatCurrency } from '@/lib/utils';
import { AccentColors, CustomPalette } from '@/lib/types';

function hexToRgb(hex: string): string {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `${r} ${g} ${b}`;
}

function rgbToHex(rgb: string): string {
    const [r, g, b] = rgb.split(' ').map(Number);
    return '#' + [r, g, b].map(c => c.toString(16).padStart(2, '0')).join('');
}

function generatePaletteFromHex(hex: string): AccentColors {
    const [r, g, b] = [parseInt(hex.slice(1, 3), 16), parseInt(hex.slice(3, 5), 16), parseInt(hex.slice(5, 7), 16)];

    const lighten = (c: number, factor: number) => Math.round(c + (255 - c) * factor);
    const darken = (c: number, factor: number) => Math.round(c * (1 - factor));
    const toRgb = (r2: number, g2: number, b2: number) => `${r2} ${g2} ${b2}`;

    return {
        50: toRgb(lighten(r, 0.92), lighten(g, 0.92), lighten(b, 0.92)),
        100: toRgb(lighten(r, 0.82), lighten(g, 0.82), lighten(b, 0.82)),
        200: toRgb(lighten(r, 0.65), lighten(g, 0.65), lighten(b, 0.65)),
        300: toRgb(lighten(r, 0.45), lighten(g, 0.45), lighten(b, 0.45)),
        400: toRgb(lighten(r, 0.2), lighten(g, 0.2), lighten(b, 0.2)),
        500: toRgb(r, g, b),
        600: toRgb(darken(r, 0.15), darken(g, 0.15), darken(b, 0.15)),
        700: toRgb(darken(r, 0.3), darken(g, 0.3), darken(b, 0.3)),
    };
}

export default function AyarlarPage() {
    const { settings, updateSettings, seedData, clearData, tasks, transactions, goals, notes, reminders } = useStore();
    const { theme, toggleTheme } = useTheme();
    const { user, updateProfile, updateEmail, updatePassword, uploadAvatar } = useAuth();

    // Profile state
    const [profileName, setProfileName] = useState(user?.user_metadata?.full_name || '');
    const [profileEmail, setProfileEmail] = useState(user?.email || '');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [profileSaving, setProfileSaving] = useState<string | null>(null); // 'name' | 'email' | 'password' | 'avatar'
    const [seeding, setSeeding] = useState(false);
    const [profileMsg, setProfileMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
    const avatarInputRef = useRef<HTMLInputElement>(null);

    const avatarUrl = user?.user_metadata?.avatar_url;
    const userInitials = user?.user_metadata?.full_name
        ? user.user_metadata.full_name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)
        : user?.email?.slice(0, 2).toUpperCase() || '??';

    const showMsg = (type: 'success' | 'error', text: string) => {
        setProfileMsg({ type, text });
        setTimeout(() => setProfileMsg(null), 4000);
    };

    const handleSaveName = async () => {
        if (!profileName.trim()) return;
        setProfileSaving('name');
        const { error } = await updateProfile({ full_name: profileName.trim() });
        setProfileSaving(null);
        if (error) showMsg('error', error.message);
        else showMsg('success', 'Ad soyad güncellendi');
    };

    const handleSaveEmail = async () => {
        if (!profileEmail.trim() || profileEmail === user?.email) return;
        setProfileSaving('email');
        const { error } = await updateEmail(profileEmail.trim());
        setProfileSaving(null);
        if (error) showMsg('error', error.message);
        else showMsg('success', 'E-posta değiştirme linki gönderildi');
    };

    const handleSavePassword = async () => {
        if (newPassword.length < 6) { showMsg('error', 'Şifre en az 6 karakter olmalıdır'); return; }
        if (newPassword !== confirmPassword) { showMsg('error', 'Şifreler eşleşmiyor'); return; }
        setProfileSaving('password');
        const { error } = await updatePassword(newPassword);
        setProfileSaving(null);
        if (error) showMsg('error', error.message);
        else { showMsg('success', 'Şifre güncellendi'); setNewPassword(''); setConfirmPassword(''); }
    };

    const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (file.size > 2 * 1024 * 1024) { showMsg('error', 'Dosya 2MB\'dan küçük olmalıdır'); return; }
        if (!file.type.startsWith('image/')) { showMsg('error', 'Sadece resim dosyaları yüklenebilir'); return; }
        setProfileSaving('avatar');
        const { error } = await uploadAvatar(file);
        setProfileSaving(null);
        if (error) showMsg('error', error);
        else showMsg('success', 'Profil fotoğrafı güncellendi');
    };

    // Palette state
    const [showCustomCreate, setShowCustomCreate] = useState(false);
    const [customName, setCustomName] = useState('');
    const [customBaseColor, setCustomBaseColor] = useState('#8b5cf6');
    const [editingPalette, setEditingPalette] = useState<CustomPalette | null>(null);
    const [editColors, setEditColors] = useState<AccentColors | null>(null);

    const handleSelectPalette = (paletteId: string) => {
        updateSettings({ accentPalette: paletteId });
    };

    const handleCreateCustomPalette = () => {
        if (!customName.trim()) return;
        const newPalette: CustomPalette = {
            id: crypto.randomUUID(),
            name: customName.trim(),
            colors: generatePaletteFromHex(customBaseColor),
        };
        updateSettings({
            customPalettes: [...(settings.customPalettes || []), newPalette],
            accentPalette: newPalette.id,
        });
        setCustomName('');
        setShowCustomCreate(false);
    };

    const handleDeleteCustomPalette = (id: string) => {
        const updated = (settings.customPalettes || []).filter(p => p.id !== id);
        updateSettings({
            customPalettes: updated,
            accentPalette: settings.accentPalette === id ? 'violet' : settings.accentPalette,
        });
    };

    const handleStartEditPalette = (palette: CustomPalette) => {
        setEditingPalette(palette);
        setEditColors({ ...palette.colors });
    };

    const handleSaveEditPalette = () => {
        if (!editingPalette || !editColors) return;
        const updated = (settings.customPalettes || []).map(p =>
            p.id === editingPalette.id ? { ...p, colors: editColors } : p
        );
        updateSettings({ customPalettes: updated });
        setEditingPalette(null);
        setEditColors(null);
    };

    const activePalette = settings.accentPalette || 'violet';

    return (
        <div className="space-y-4 md:space-y-6 max-w-3xl">
            <div>
                <h1 className="text-2xl md:text-3xl font-bold">Ayarlar</h1>
                <p className="text-gray-500 dark:text-gray-400 mt-0.5 text-sm">Uygulama tercihlerini yönet</p>
            </div>

            {/* Profile Section */}
            <Card className="p-5">
                <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
                    <User size={16} /> Profil Bilgileri
                </h3>

                {/* Status Message */}
                {profileMsg && (
                    <div className={cn(
                        'mb-4 px-4 py-2.5 rounded-xl text-sm font-medium animate-in',
                        profileMsg.type === 'success'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : 'bg-red-500/10 text-red-400 border border-red-500/20'
                    )}>
                        {profileMsg.text}
                    </div>
                )}

                <div className="flex flex-col sm:flex-row gap-6">
                    {/* Avatar */}
                    <div className="flex flex-col items-center gap-2">
                        <div className="relative group">
                            {avatarUrl ? (
                                <img
                                    src={avatarUrl}
                                    alt="Profil fotoğrafı"
                                    className="w-24 h-24 rounded-2xl object-cover border-2 border-gray-200 dark:border-gray-700"
                                />
                            ) : (
                                <div
                                    className="w-24 h-24 rounded-2xl flex items-center justify-center text-white text-2xl font-bold"
                                    style={{ background: 'linear-gradient(135deg, rgb(var(--accent-500)), rgb(var(--accent-700)))' }}
                                >
                                    {userInitials}
                                </div>
                            )}
                            <button
                                onClick={() => avatarInputRef.current?.click()}
                                className="absolute inset-0 rounded-2xl bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                                disabled={profileSaving === 'avatar'}
                            >
                                {profileSaving === 'avatar' ? (
                                    <Loader2 size={24} className="text-white animate-spin" />
                                ) : (
                                    <Camera size={24} className="text-white" />
                                )}
                            </button>
                            <input
                                ref={avatarInputRef}
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={handleAvatarChange}
                            />
                        </div>
                        <p className="text-[10px] text-gray-400">Max 2MB</p>
                    </div>

                    {/* Profile Fields */}
                    <div className="flex-1 space-y-4">
                        {/* Name */}
                        <div>
                            <label className="text-xs text-gray-400 block mb-1.5 flex items-center gap-1.5">
                                <User size={12} /> Ad Soyad
                            </label>
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={profileName}
                                    onChange={e => setProfileName(e.target.value)}
                                    className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 text-sm outline-none focus:ring-2 focus:ring-[rgb(var(--accent-500))]"
                                    placeholder="Ad Soyad"
                                />
                                <Button
                                    size="sm"
                                    onClick={handleSaveName}
                                    disabled={profileSaving === 'name' || profileName === (user?.user_metadata?.full_name || '')}
                                >
                                    {profileSaving === 'name' ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                                </Button>
                            </div>
                        </div>

                        {/* Email */}
                        <div>
                            <label className="text-xs text-gray-400 block mb-1.5 flex items-center gap-1.5">
                                <Mail size={12} /> E-posta
                            </label>
                            <div className="flex gap-2">
                                <input
                                    type="email"
                                    value={profileEmail}
                                    onChange={e => setProfileEmail(e.target.value)}
                                    className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 text-sm outline-none focus:ring-2 focus:ring-[rgb(var(--accent-500))]"
                                    placeholder="email@örnek.com"
                                />
                                <Button
                                    size="sm"
                                    onClick={handleSaveEmail}
                                    disabled={profileSaving === 'email' || profileEmail === user?.email}
                                >
                                    {profileSaving === 'email' ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                                </Button>
                            </div>
                            <p className="text-[10px] text-gray-400 mt-1">Değiştirmek için doğrulama e-postası gönderilir</p>
                        </div>

                        {/* Password */}
                        <div>
                            <label className="text-xs text-gray-400 block mb-1.5 flex items-center gap-1.5">
                                <Lock size={12} /> Şifre Değiştir
                            </label>
                            <div className="space-y-2">
                                <div className="relative">
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        value={newPassword}
                                        onChange={e => setNewPassword(e.target.value)}
                                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 text-sm outline-none focus:ring-2 focus:ring-[rgb(var(--accent-500))] pr-10"
                                        placeholder="Yeni şifre (min 6 karakter)"
                                    />
                                    <button
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-300"
                                    >
                                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                    </button>
                                </div>
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    value={confirmPassword}
                                    onChange={e => setConfirmPassword(e.target.value)}
                                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 text-sm outline-none focus:ring-2 focus:ring-[rgb(var(--accent-500))]"
                                    placeholder="Yeni şifreyi tekrar girin"
                                />
                                {newPassword && confirmPassword && newPassword !== confirmPassword && (
                                    <p className="text-[10px] text-red-400">Şifreler eşleşmiyor</p>
                                )}
                                <Button
                                    size="sm"
                                    onClick={handleSavePassword}
                                    disabled={profileSaving === 'password' || !newPassword || newPassword !== confirmPassword}
                                    className="w-full"
                                >
                                    {profileSaving === 'password' ? <Loader2 size={14} className="animate-spin" /> : <Lock size={14} />}
                                    Şifreyi Güncelle
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            </Card>

            {/* Theme */}
            <Card className="p-5">
                <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                    {theme === 'dark' ? <Moon size={16} /> : <Sun size={16} />} Tema
                </h3>
                <div className="flex gap-3">
                    <button onClick={() => { if (theme !== 'light') toggleTheme(); }}
                        className={cn('flex-1 p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-2',
                            theme === 'light' ? 'border-[rgb(var(--accent-500))] bg-[rgb(var(--accent-500)/0.1)]' : 'border-gray-200 dark:border-gray-700'
                        )}>
                        <div className="w-12 h-12 rounded-xl bg-white border border-gray-200 flex items-center justify-center">
                            <Sun size={24} className={theme === 'light' ? 'text-amber-500' : 'text-gray-400'} />
                        </div>
                        <span className="text-sm font-medium">Açık</span>
                    </button>
                    <button onClick={() => { if (theme !== 'dark') toggleTheme(); }}
                        className={cn('flex-1 p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-2',
                            theme === 'dark' ? 'border-[rgb(var(--accent-500))] bg-[rgb(var(--accent-500)/0.1)]' : 'border-gray-200 dark:border-gray-700'
                        )}>
                        <div className="w-12 h-12 rounded-xl bg-gray-900 border border-gray-700 flex items-center justify-center">
                            <Moon size={24} className={theme === 'dark' ? 'text-blue-400' : 'text-gray-400'} />
                        </div>
                        <span className="text-sm font-medium">Koyu</span>
                    </button>
                </div>
            </Card>

            {/* Accent Color Palette */}
            <Card className="p-5">
                <h3 className="text-sm font-semibold mb-1 flex items-center gap-2">
                    <Palette size={16} /> Renk Paleti
                </h3>
                <p className="text-xs text-gray-400 mb-4">Uygulamanın vurgu rengini seçin</p>

                {/* Preset Palettes */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mb-4">
                    {Object.entries(PRESET_PALETTES).map(([id, preset]) => {
                        const isActive = activePalette === id;
                        const mainColor = `rgb(${preset.colors[500]})`;
                        const lightColor = `rgb(${preset.colors[300]})`;
                        const darkColor = `rgb(${preset.colors[700]})`;
                        return (
                            <button
                                key={id}
                                onClick={() => handleSelectPalette(id)}
                                className={cn(
                                    'relative p-3 rounded-xl border-2 transition-all flex flex-col items-center gap-2',
                                    isActive ? 'border-current shadow-lg scale-[1.02]' : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                                )}
                                style={isActive ? { borderColor: mainColor } : undefined}
                            >
                                <div className="flex gap-1">
                                    <div className="w-6 h-6 rounded-full" style={{ backgroundColor: lightColor }} />
                                    <div className="w-6 h-6 rounded-full" style={{ backgroundColor: mainColor }} />
                                    <div className="w-6 h-6 rounded-full" style={{ backgroundColor: darkColor }} />
                                </div>
                                <span className="text-xs font-medium">{preset.name}</span>
                                {isActive && (
                                    <div className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full flex items-center justify-center" style={{ backgroundColor: mainColor }}>
                                        <Check size={12} className="text-white" />
                                    </div>
                                )}
                            </button>
                        );
                    })}
                </div>

                {/* Custom Palettes */}
                {(settings.customPalettes || []).length > 0 && (
                    <>
                        <p className="text-xs font-medium text-gray-400 mb-2 mt-4">Özel Paletler</p>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mb-4">
                            {(settings.customPalettes || []).map(palette => {
                                const isActive = activePalette === palette.id;
                                const mainColor = `rgb(${palette.colors[500]})`;
                                const lightColor = `rgb(${palette.colors[300]})`;
                                const darkColor = `rgb(${palette.colors[700]})`;
                                return (
                                    <div key={palette.id} className="relative group">
                                        <button
                                            onClick={() => handleSelectPalette(palette.id)}
                                            className={cn(
                                                'w-full p-3 rounded-xl border-2 transition-all flex flex-col items-center gap-2',
                                                isActive ? 'shadow-lg scale-[1.02]' : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                                            )}
                                            style={isActive ? { borderColor: mainColor } : undefined}
                                        >
                                            <div className="flex gap-1">
                                                <div className="w-6 h-6 rounded-full" style={{ backgroundColor: lightColor }} />
                                                <div className="w-6 h-6 rounded-full" style={{ backgroundColor: mainColor }} />
                                                <div className="w-6 h-6 rounded-full" style={{ backgroundColor: darkColor }} />
                                            </div>
                                            <span className="text-xs font-medium">{palette.name}</span>
                                            {isActive && (
                                                <div className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full flex items-center justify-center" style={{ backgroundColor: mainColor }}>
                                                    <Check size={12} className="text-white" />
                                                </div>
                                            )}
                                        </button>
                                        {/* Hover actions */}
                                        <div className="absolute top-1 right-1 flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button
                                                onClick={() => handleStartEditPalette(palette)}
                                                className="p-1 rounded bg-white/80 dark:bg-gray-800/80 hover:bg-white dark:hover:bg-gray-700"
                                            >
                                                <Edit2 size={10} />
                                            </button>
                                            <button
                                                onClick={() => handleDeleteCustomPalette(palette.id)}
                                                className="p-1 rounded bg-white/80 dark:bg-gray-800/80 hover:bg-red-100 dark:hover:bg-red-900/30"
                                            >
                                                <X size={10} className="text-red-500" />
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </>
                )}

                {/* Create Custom Palette */}
                {!showCustomCreate ? (
                    <button
                        onClick={() => setShowCustomCreate(true)}
                        className="w-full p-3 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-700 hover:border-gray-400 dark:hover:border-gray-600 transition-colors flex items-center justify-center gap-2 text-sm text-gray-400 hover:text-gray-300"
                    >
                        <Plus size={16} /> Özel Palet Oluştur
                    </button>
                ) : (
                    <div className="p-4 rounded-xl border-2 border-gray-200 dark:border-gray-700 space-y-3 animate-in">
                        <h4 className="text-sm font-semibold">Yeni Palet Oluştur</h4>
                        <div>
                            <label className="text-xs text-gray-400 block mb-1">Palet Adı</label>
                            <input
                                type="text"
                                value={customName}
                                onChange={e => setCustomName(e.target.value)}
                                className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 text-sm outline-none focus:ring-2 focus:ring-[rgb(var(--accent-500))]"
                                placeholder="Örn: Gece Mavisi"
                            />
                        </div>
                        <div>
                            <label className="text-xs text-gray-400 block mb-1">Ana Renk</label>
                            <div className="flex items-center gap-3">
                                <input
                                    type="color"
                                    value={customBaseColor}
                                    onChange={e => setCustomBaseColor(e.target.value)}
                                    className="w-12 h-12 rounded-xl cursor-pointer border-0 p-0"
                                />
                                <input
                                    type="text"
                                    value={customBaseColor}
                                    onChange={e => setCustomBaseColor(e.target.value)}
                                    className="w-28 px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 text-sm font-mono outline-none"
                                />
                                {/* Preview */}
                                <div className="flex gap-1 ml-auto">
                                    {(() => {
                                        const preview = generatePaletteFromHex(customBaseColor);
                                        return [preview[300], preview[500], preview[700]].map((rgb, i) => (
                                            <div key={i} className="w-8 h-8 rounded-lg" style={{ backgroundColor: `rgb(${rgb})` }} />
                                        ));
                                    })()}
                                </div>
                            </div>
                        </div>
                        <div className="flex gap-2 justify-end">
                            <Button variant="ghost" size="sm" onClick={() => setShowCustomCreate(false)}>İptal</Button>
                            <Button size="sm" onClick={handleCreateCustomPalette} disabled={!customName.trim()}>
                                <Check size={14} /> Oluştur
                            </Button>
                        </div>
                    </div>
                )}
            </Card>

            {/* Edit Palette Modal */}
            {editingPalette && editColors && (
                <Card className="p-5 animate-in">
                    <h3 className="text-sm font-semibold mb-3">"{editingPalette.name}" Paletini Düzenle</h3>
                    <p className="text-xs text-gray-400 mb-3">Her bir renk tonunu ayrı ayrı ayarlayabilirsiniz.</p>
                    <div className="grid grid-cols-4 sm:grid-cols-8 gap-2 mb-4">
                        {([50, 100, 200, 300, 400, 500, 600, 700] as const).map(shade => (
                            <div key={shade} className="flex flex-col items-center gap-1">
                                <input
                                    type="color"
                                    value={rgbToHex(editColors[shade])}
                                    onChange={e => setEditColors({ ...editColors, [shade]: hexToRgb(e.target.value) })}
                                    className="w-10 h-10 rounded-xl cursor-pointer border-0 p-0"
                                />
                                <span className="text-[9px] text-gray-400">{shade}</span>
                            </div>
                        ))}
                    </div>
                    <div className="flex gap-2 justify-end">
                        <Button variant="ghost" size="sm" onClick={() => { setEditingPalette(null); setEditColors(null); }}>İptal</Button>
                        <Button size="sm" onClick={handleSaveEditPalette}>
                            <Check size={14} /> Kaydet
                        </Button>
                    </div>
                </Card>
            )}

            {/* Monthly Income Estimate */}
            <Card className="p-5">
                <h3 className="text-sm font-semibold mb-3">Aylık Gelir Tahmini</h3>
                <input
                    type="number" min="0"
                    value={settings.monthlyIncomeEstimate}
                    onChange={e => updateSettings({ monthlyIncomeEstimate: parseFloat(e.target.value) || 0 })}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 focus:ring-2 focus:ring-[rgb(var(--accent-500))] outline-none text-sm"
                />
                <p className="text-xs text-gray-400 mt-1.5">Hedef hesaplamalarında kullanılır</p>
            </Card>

            {/* Data Stats */}
            <Card className="p-5">
                <h3 className="text-sm font-semibold mb-3 flex items-center gap-2"><Database size={16} /> Veri Durumu</h3>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-4">
                    {[
                        { label: 'Görev', count: tasks.length },
                        { label: 'İşlem', count: transactions.length },
                        { label: 'Hedef', count: goals.length },
                        { label: 'Not', count: notes.length },
                        { label: 'Hatırlatma', count: reminders.length },
                    ].map(s => (
                        <div key={s.label} className="text-center p-3 rounded-xl bg-gray-50 dark:bg-gray-800/50">
                            <p className="text-lg font-bold">{s.count}</p>
                            <p className="text-[10px] text-gray-400">{s.label}</p>
                        </div>
                    ))}
                </div>
                <div className="flex gap-3">
                    <Button variant="secondary" onClick={async () => { setSeeding(true); await seedData(); setSeeding(false); }} disabled={seeding} className="flex-1">{seeding ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />} {seeding ? 'Yükleniyor...' : 'Örnek Veri Yükle'}</Button>
                    <Button variant="danger" onClick={() => { if (confirm('Tüm verileri silmek istediğinize emin misiniz?')) clearData(); }} className="flex-1"><Trash2 size={14} /> Tümünü Sil</Button>
                </div>
            </Card>

            {/* About */}
            <Card className="p-5">
                <h3 className="text-sm font-semibold mb-2">Hakkında</h3>
                <p className="text-xs text-gray-400">Kişisel Ajanda v1.0 - Görev takibi, finans yönetimi ve kişisel organizasyon uygulaması.</p>
                <p className="text-xs text-gray-400 mt-1">Veriler güvenli bir şekilde Supabase bulut veritabanında saklanır.</p>
            </Card>
        </div>
    );
}
