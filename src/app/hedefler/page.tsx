'use client';

import React, { useState } from 'react';
import { useStore } from '@/lib/store';
import { Card, Badge, Button, ProgressBar, EmptyState } from '@/components/ui/SharedUI';
import Modal from '@/components/ui/SharedUI';
import {
    Plus, Target, TrendingUp, Clock, AlertTriangle, Edit2, Trash2, ArrowUpRight, ArrowDownRight
} from 'lucide-react';
import { formatCurrency, getGoalProgress, getGoalRemaining, getGoalETA, formatDate, cn } from '@/lib/utils';
import { Goal, GoalPriority } from '@/lib/types';
import { format } from 'date-fns';

export default function HedeflerPage() {
    const { goals, transactions, goalTransactions, addGoal, updateGoal, deleteGoal, addGoalTransaction } = useStore();
    const [showForm, setShowForm] = useState(false);
    const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
    const [selectedGoal, setSelectedGoal] = useState<Goal | null>(null);
    const [fundAmount, setFundAmount] = useState('');
    const [fundType, setFundType] = useState<'deposit' | 'withdraw'>('deposit');

    const totalSaved = goals.reduce((s, g) => s + g.currentSaved, 0);
    const totalTarget = goals.reduce((s, g) => s + g.targetAmount, 0);

    return (
        <div className="space-y-4 md:space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between gap-3">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold">Hedefler</h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-0.5 text-sm">Birikim hedeflerini takip et</p>
                </div>
                <Button size="sm" onClick={() => setShowForm(true)}><Plus size={16} /> Yeni Hedef</Button>
            </div>

            {/* Overview */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
                <Card className="p-4">
                    <p className="text-xs text-gray-500 mb-1">Toplam Birikim</p>
                    <p className="text-xl font-bold text-emerald-400">{formatCurrency(totalSaved)}</p>
                </Card>
                <Card className="p-4">
                    <p className="text-xs text-gray-500 mb-1">Toplam Hedef</p>
                    <p className="text-xl font-bold">{formatCurrency(totalTarget)}</p>
                </Card>
                <Card className="p-4 col-span-2 md:col-span-1">
                    <p className="text-xs text-gray-500 mb-1">Genel İlerleme</p>
                    <p className="text-xl font-bold text-[rgb(var(--accent-400))]">%{totalTarget > 0 ? Math.round(totalSaved / totalTarget * 100) : 0}</p>
                    <ProgressBar value={totalTarget > 0 ? (totalSaved / totalTarget) * 100 : 0} size="xs" />
                </Card>
            </div>

            {/* Goal Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {goals.length === 0 && (
                    <div className="col-span-full">
                        <EmptyState
                            icon={<Target size={32} className="text-gray-400" />}
                            title="Henüz hedef yok"
                            description="Birikim hedefi ekleyerek finansal hedeflerinizi takip edin"
                            action={<Button onClick={() => setShowForm(true)}><Plus size={14} /> Hedef Ekle</Button>}
                        />
                    </div>
                )}
                {goals.map(goal => {
                    const progress = getGoalProgress(goal);
                    const remaining = getGoalRemaining(goal);
                    const eta = getGoalETA(goal, transactions);

                    return (
                        <Card key={goal.id} className="p-5 hover:border-[rgb(var(--accent-500)/0.3)]">
                            <div className="flex items-start justify-between mb-3">
                                <div>
                                    <h3 className="font-semibold">{goal.name}</h3>
                                    <Badge variant={goal.priority === 'high' ? 'danger' : goal.priority === 'medium' ? 'warning' : 'default'}>
                                        {goal.priority === 'high' ? 'Yüksek' : goal.priority === 'medium' ? 'Orta' : 'Düşük'}
                                    </Badge>
                                </div>
                                <div className="flex gap-1">
                                    <button onClick={() => setEditingGoal(goal)} className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"><Edit2 size={14} /></button>
                                    <button onClick={() => deleteGoal(goal.id)} className="p-1.5 hover:bg-red-500/10 rounded-lg"><Trash2 size={14} className="text-red-400" /></button>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <div>
                                    <div className="flex justify-between text-sm mb-1">
                                        <span className="text-gray-500">İlerleme</span>
                                        <span className="font-bold">%{progress}</span>
                                    </div>
                                    <ProgressBar value={progress} size="md" color={progress >= 75 ? 'bg-gradient-to-r from-emerald-500 to-green-400' : progress >= 50 ? 'bg-gradient-to-r from-blue-500 to-cyan-400' : undefined} />
                                </div>

                                <div className="grid grid-cols-2 gap-2 text-sm">
                                    <div className="p-2 rounded-lg bg-gray-50 dark:bg-gray-800/50">
                                        <p className="text-[10px] text-gray-400">Biriken</p>
                                        <p className="font-semibold text-emerald-400">{formatCurrency(goal.currentSaved)}</p>
                                    </div>
                                    <div className="p-2 rounded-lg bg-gray-50 dark:bg-gray-800/50">
                                        <p className="text-[10px] text-gray-400">Kalan</p>
                                        <p className="font-semibold text-amber-400">{formatCurrency(remaining)}</p>
                                    </div>
                                </div>

                                <div className="text-xs text-gray-400 space-y-1">
                                    {goal.targetDate && <p>Hedef tarihi: {formatDate(goal.targetDate)}</p>}
                                    {goal.monthlyPlanAmount && <p>Aylık plan: {formatCurrency(goal.monthlyPlanAmount)}</p>}
                                    {eta.possible && eta.months > 0 && (
                                        <p className="flex items-center gap-1">
                                            <Clock size={12} /> Tahmini: ~{eta.months} ay
                                        </p>
                                    )}
                                    {!eta.possible && (
                                        <p className="flex items-center gap-1 text-amber-400">
                                            <AlertTriangle size={12} /> Tasarruf oranı yetersiz
                                        </p>
                                    )}
                                </div>

                                {/* Quick fund buttons */}
                                <div className="flex gap-2 pt-1">
                                    <button
                                        onClick={() => { setSelectedGoal(goal); setFundType('deposit'); }}
                                        className="flex-1 py-2 rounded-xl bg-emerald-500/15 text-emerald-400 text-xs font-medium hover:bg-emerald-500/25 transition-colors flex items-center justify-center gap-1"
                                    >
                                        <ArrowUpRight size={12} /> Para Ekle
                                    </button>
                                    <button
                                        onClick={() => { setSelectedGoal(goal); setFundType('withdraw'); }}
                                        className="flex-1 py-2 rounded-xl bg-red-500/15 text-red-400 text-xs font-medium hover:bg-red-500/25 transition-colors flex items-center justify-center gap-1"
                                    >
                                        <ArrowDownRight size={12} /> Para Çek
                                    </button>
                                </div>
                            </div>
                        </Card>
                    );
                })}
            </div>

            {/* Goal Form Modal */}
            {(showForm || editingGoal) && (
                <GoalFormModal
                    editGoal={editingGoal}
                    onClose={() => { setShowForm(false); setEditingGoal(null); }}
                    onSave={(data) => {
                        if (editingGoal) {
                            updateGoal(editingGoal.id, data);
                        } else {
                            addGoal(data);
                        }
                    }}
                />
            )}

            {/* Fund Modal */}
            {selectedGoal && (
                <Modal isOpen={true} onClose={() => { setSelectedGoal(null); setFundAmount(''); }} title={fundType === 'deposit' ? 'Hedefe Para Ekle' : 'Hedeften Para Çek'} size="sm">
                    <div className="space-y-4">
                        <div>
                            <p className="text-sm text-gray-400 mb-2">{selectedGoal.name}</p>
                            <p className="text-sm">Mevcut: <strong>{formatCurrency(selectedGoal.currentSaved)}</strong></p>
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1.5 text-gray-600 dark:text-gray-400">Tutar (₺)</label>
                            <input
                                type="number"
                                min="0"
                                value={fundAmount}
                                onChange={e => setFundAmount(e.target.value)}
                                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 focus:ring-2 focus:ring-[rgb(var(--accent-500))] outline-none text-lg font-bold"
                                placeholder="0"
                                autoFocus
                            />
                        </div>
                        <div className="flex gap-3">
                            <Button variant="secondary" onClick={() => { setSelectedGoal(null); setFundAmount(''); }} className="flex-1">İptal</Button>
                            <Button
                                onClick={() => {
                                    if (fundAmount && parseFloat(fundAmount) > 0) {
                                        addGoalTransaction({
                                            goalId: selectedGoal.id,
                                            amount: parseFloat(fundAmount),
                                            type: fundType,
                                            date: format(new Date(), 'yyyy-MM-dd'),
                                            note: fundType === 'deposit' ? 'Para eklendi' : 'Para çekildi',
                                        });
                                        setSelectedGoal(null);
                                        setFundAmount('');
                                    }
                                }}
                                className="flex-1"
                            >
                                {fundType === 'deposit' ? 'Ekle' : 'Çek'}
                            </Button>
                        </div>
                    </div>
                </Modal>
            )}
        </div>
    );
}

// ===== GOAL FORM MODAL =====
function GoalFormModal({ editGoal, onClose, onSave }: {
    editGoal: Goal | null;
    onClose: () => void;
    onSave: (data: Omit<Goal, 'id' | 'createdAt' | 'updatedAt'>) => void;
}) {
    const [form, setForm] = useState({
        name: editGoal?.name || '',
        targetAmount: editGoal?.targetAmount?.toString() || '',
        currentSaved: editGoal?.currentSaved?.toString() || '0',
        targetDate: editGoal?.targetDate || '',
        monthlyPlanAmount: editGoal?.monthlyPlanAmount?.toString() || '',
        priority: editGoal?.priority || 'medium' as GoalPriority,
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.name.trim() || !form.targetAmount) return;
        onSave({
            name: form.name.trim(),
            targetAmount: parseFloat(form.targetAmount),
            currentSaved: parseFloat(form.currentSaved) || 0,
            targetDate: form.targetDate || null,
            monthlyPlanAmount: form.monthlyPlanAmount ? parseFloat(form.monthlyPlanAmount) : null,
            priority: form.priority,
        });
        onClose();
    };

    return (
        <Modal isOpen={true} onClose={onClose} title={editGoal ? 'Hedefi Düzenle' : 'Yeni Hedef'}>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium mb-1.5 text-gray-600 dark:text-gray-400">Hedef Adı *</label>
                    <input type="text" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 focus:ring-2 focus:ring-[rgb(var(--accent-500))] outline-none text-sm" placeholder="ör: MacBook Pro" autoFocus />
                </div>
                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <label className="block text-sm font-medium mb-1.5 text-gray-600 dark:text-gray-400">Hedef Tutar (₺) *</label>
                        <input type="number" min="0" value={form.targetAmount} onChange={e => setForm(f => ({ ...f, targetAmount: e.target.value }))} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 focus:ring-2 focus:ring-[rgb(var(--accent-500))] outline-none text-sm" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1.5 text-gray-600 dark:text-gray-400">Aylık Plan (₺)</label>
                        <input type="number" min="0" value={form.monthlyPlanAmount} onChange={e => setForm(f => ({ ...f, monthlyPlanAmount: e.target.value }))} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 focus:ring-2 focus:ring-[rgb(var(--accent-500))] outline-none text-sm" />
                    </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <label className="block text-sm font-medium mb-1.5 text-gray-600 dark:text-gray-400">Hedef Tarihi</label>
                        <input type="date" value={form.targetDate} onChange={e => setForm(f => ({ ...f, targetDate: e.target.value }))} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 focus:ring-2 focus:ring-[rgb(var(--accent-500))] outline-none text-sm" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1.5 text-gray-600 dark:text-gray-400">Öncelik</label>
                        <select value={form.priority} onChange={e => setForm(f => ({ ...f, priority: e.target.value as GoalPriority }))} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 focus:ring-2 focus:ring-[rgb(var(--accent-500))] outline-none text-sm">
                            <option value="low">Düşük</option>
                            <option value="medium">Orta</option>
                            <option value="high">Yüksek</option>
                        </select>
                    </div>
                </div>
                <div className="flex gap-3 pt-2">
                    <Button variant="secondary" onClick={onClose} className="flex-1">İptal</Button>
                    <Button type="submit" className="flex-1">{editGoal ? 'Güncelle' : 'Oluştur'}</Button>
                </div>
            </form>
        </Modal>
    );
}
