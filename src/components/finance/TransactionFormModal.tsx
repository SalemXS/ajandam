'use client';

import React, { useState } from 'react';
import Modal, { Button } from '@/components/ui/SharedUI';
import { useStore } from '@/lib/store';
import { TransactionType, PaymentMethod, EXPENSE_CATEGORIES, INCOME_CATEGORIES } from '@/lib/types';
import { format } from 'date-fns';

interface TransactionFormModalProps {
    onClose: () => void;
    editTransaction?: { id: string; date: string; type: TransactionType; category: string; amount: number; note: string; paymentMethod: PaymentMethod; repeatRule: string };
}

export default function TransactionFormModal({ onClose, editTransaction }: TransactionFormModalProps) {
    const { addTransaction, updateTransaction } = useStore();
    const [form, setForm] = useState({
        type: editTransaction?.type || 'expense' as TransactionType,
        category: editTransaction?.category || '',
        amount: editTransaction?.amount?.toString() || '',
        date: editTransaction?.date || format(new Date(), 'yyyy-MM-dd'),
        note: editTransaction?.note || '',
        paymentMethod: editTransaction?.paymentMethod || 'card' as PaymentMethod,
        repeatRule: editTransaction?.repeatRule || 'none',
    });

    const categories = form.type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.category || !form.amount) return;

        const data = {
            type: form.type,
            category: form.category,
            amount: parseFloat(form.amount),
            date: form.date,
            note: form.note,
            paymentMethod: form.paymentMethod,
            repeatRule: form.repeatRule as 'none' | 'daily' | 'weekly' | 'monthly',
        };

        if (editTransaction) {
            updateTransaction(editTransaction.id, data);
        } else {
            addTransaction(data);
        }
        onClose();
    };

    return (
        <Modal isOpen={true} onClose={onClose} title={editTransaction ? 'İşlemi Düzenle' : 'Yeni İşlem'}>
            <form onSubmit={handleSubmit} className="space-y-4">
                {/* Type Toggle */}
                <div className="flex gap-2 p-1 bg-gray-100 dark:bg-gray-800 rounded-xl">
                    <button
                        type="button"
                        onClick={() => setForm(f => ({ ...f, type: 'expense', category: '' }))}
                        className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all ${form.type === 'expense' ? 'bg-red-500/20 text-red-400 shadow' : 'text-gray-500'
                            }`}
                    >
                        Gider
                    </button>
                    <button
                        type="button"
                        onClick={() => setForm(f => ({ ...f, type: 'income', category: '' }))}
                        className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all ${form.type === 'income' ? 'bg-emerald-500/20 text-emerald-400 shadow' : 'text-gray-500'
                            }`}
                    >
                        Gelir
                    </button>
                </div>

                {/* Amount */}
                <div>
                    <label className="block text-sm font-medium mb-1.5 text-gray-600 dark:text-gray-400">Tutar (₺)</label>
                    <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={form.amount}
                        onChange={e => setForm(f => ({ ...f, amount: e.target.value }))}
                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 focus:ring-2 focus:ring-[rgb(var(--accent-500))] outline-none text-sm text-2xl font-bold"
                        placeholder="0"
                        autoFocus
                    />
                </div>

                {/* Category */}
                <div>
                    <label className="block text-sm font-medium mb-1.5 text-gray-600 dark:text-gray-400">Kategori</label>
                    <div className="flex flex-wrap gap-2">
                        {categories.map(cat => (
                            <button
                                key={cat}
                                type="button"
                                onClick={() => setForm(f => ({ ...f, category: cat }))}
                                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${form.category === cat
                                        ? 'bg-[rgb(var(--accent-500)/0.2)] text-[rgb(var(--accent-400))] ring-1 ring-[rgb(var(--accent-500))]/40'
                                        : 'bg-gray-100 dark:bg-gray-800 text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-700'
                                    }`}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Date */}
                <div>
                    <label className="block text-sm font-medium mb-1.5 text-gray-600 dark:text-gray-400">Tarih</label>
                    <input
                        type="date"
                        value={form.date}
                        onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 focus:ring-2 focus:ring-[rgb(var(--accent-500))] outline-none text-sm"
                    />
                </div>

                {/* Payment Method */}
                <div>
                    <label className="block text-sm font-medium mb-1.5 text-gray-600 dark:text-gray-400">Ödeme Yöntemi</label>
                    <select
                        value={form.paymentMethod}
                        onChange={e => setForm(f => ({ ...f, paymentMethod: e.target.value as PaymentMethod }))}
                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 focus:ring-2 focus:ring-[rgb(var(--accent-500))] outline-none text-sm"
                    >
                        <option value="cash">Nakit</option>
                        <option value="card">Kart</option>
                        <option value="transfer">Havale/EFT</option>
                    </select>
                </div>

                {/* Note */}
                <div>
                    <label className="block text-sm font-medium mb-1.5 text-gray-600 dark:text-gray-400">Not</label>
                    <input
                        type="text"
                        value={form.note}
                        onChange={e => setForm(f => ({ ...f, note: e.target.value }))}
                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 focus:ring-2 focus:ring-[rgb(var(--accent-500))] outline-none text-sm"
                        placeholder="Açıklama ekleyin..."
                    />
                </div>

                {/* Actions */}
                <div className="flex gap-3 pt-2">
                    <Button variant="secondary" onClick={onClose} className="flex-1">İptal</Button>
                    <Button type="submit" className="flex-1">{editTransaction ? 'Güncelle' : 'Ekle'}</Button>
                </div>
            </form>
        </Modal>
    );
}
