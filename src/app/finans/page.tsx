'use client';

import React, { useState, useMemo } from 'react';
import { useStore } from '@/lib/store';
import { Card, Badge, Button, EmptyState, StatCard } from '@/components/ui/SharedUI';
import TransactionFormModal from '@/components/finance/TransactionFormModal';
import {
    Plus, Search, ArrowUpRight, ArrowDownRight, Wallet, TrendingUp,
    Receipt, Trash2, Edit2, Filter
} from 'lucide-react';
import {
    formatCurrency, getMonthlyIncome, getMonthlyExpense, getMonthlyNet,
    getLast6MonthsData, getCategoryBreakdown, cn, CATEGORY_COLORS
} from '@/lib/utils';
import { Transaction, EXPENSE_CATEGORIES, INCOME_CATEGORIES } from '@/lib/types';
import { format, parseISO } from 'date-fns';
import { tr } from 'date-fns/locale';

export default function FinansPage() {
    const { transactions, deleteTransaction } = useStore();
    const [showForm, setShowForm] = useState(false);
    const [editingTx, setEditingTx] = useState<Transaction | null>(null);
    const [filterType, setFilterType] = useState<'all' | 'income' | 'expense'>('all');
    const [filterCategory, setFilterCategory] = useState('');
    const [searchQuery, setSearchQuery] = useState('');

    const monthlyIncome = getMonthlyIncome(transactions);
    const monthlyExpense = getMonthlyExpense(transactions);
    const monthlyNet = getMonthlyNet(transactions);
    const monthlyData = getLast6MonthsData(transactions);
    const expenseBreakdown = getCategoryBreakdown(transactions, 'expense');
    const incomeBreakdown = getCategoryBreakdown(transactions, 'income');

    const filtered = useMemo(() => {
        let result = [...transactions].sort((a, b) => parseISO(b.date).getTime() - parseISO(a.date).getTime());
        if (filterType !== 'all') result = result.filter(t => t.type === filterType);
        if (filterCategory) result = result.filter(t => t.category === filterCategory);
        if (searchQuery) {
            const q = searchQuery.toLowerCase();
            result = result.filter(t => t.note.toLowerCase().includes(q) || t.category.toLowerCase().includes(q));
        }
        return result;
    }, [transactions, filterType, filterCategory, searchQuery]);

    // Pie chart data
    const pieData = expenseBreakdown.slice(0, 8);
    const totalPie = pieData.reduce((s, d) => s + d.amount, 0);

    return (
        <div className="space-y-4 md:space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between gap-3">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold">Finans</h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-0.5 text-sm">Gelir, gider ve birikim takibi</p>
                </div>
                <Button size="sm" onClick={() => setShowForm(true)}><Plus size={16} /> Yeni İşlem</Button>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
                <StatCard label="Bu Ay Gelir" value={formatCurrency(monthlyIncome)} icon={<ArrowUpRight size={20} className="text-emerald-400" />} color="bg-emerald-500/15" />
                <StatCard label="Bu Ay Gider" value={formatCurrency(monthlyExpense)} icon={<ArrowDownRight size={20} className="text-red-400" />} color="bg-red-500/15" />
                <StatCard label="Net Durum" value={formatCurrency(monthlyNet)} icon={<TrendingUp size={20} className={monthlyNet >= 0 ? 'text-emerald-400' : 'text-red-400'} />} color={monthlyNet >= 0 ? 'bg-emerald-500/15' : 'bg-red-500/15'} />
                <StatCard label="Toplam İşlem" value={transactions.length} icon={<Receipt size={20} className="text-blue-400" />} color="bg-blue-500/15" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
                {/* Charts - 2 col */}
                <div className="lg:col-span-2 space-y-4 md:space-y-6">
                    {/* Monthly Bar Chart */}
                    <Card className="p-4 md:p-5">
                        <h3 className="text-sm font-semibold mb-4">Aylık Gelir / Gider</h3>
                        <div className="h-48 flex items-end gap-3">
                            {monthlyData.map((d, i) => {
                                const maxVal = Math.max(...monthlyData.map(m => Math.max(m.income, m.expense)), 1);
                                return (
                                    <div key={i} className="flex-1 flex flex-col items-center gap-1">
                                        <div className="w-full flex gap-1 items-end h-36">
                                            <div className="flex-1 bg-gradient-to-t from-emerald-600 to-emerald-400 rounded-t-md transition-all duration-700" style={{ height: `${(d.income / maxVal) * 100}%` }} title={`Gelir: ${formatCurrency(d.income)}`} />
                                            <div className="flex-1 bg-gradient-to-t from-red-600 to-red-400 rounded-t-md transition-all duration-700" style={{ height: `${(d.expense / maxVal) * 100}%` }} title={`Gider: ${formatCurrency(d.expense)}`} />
                                        </div>
                                        <span className="text-[10px] text-gray-500">{d.month}</span>
                                    </div>
                                );
                            })}
                        </div>
                        <div className="flex justify-center gap-6 mt-3 text-xs text-gray-500">
                            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 bg-emerald-500 rounded" /> Gelir</span>
                            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 bg-red-400 rounded" /> Gider</span>
                        </div>
                    </Card>

                    {/* Expense Pie visual */}
                    <Card className="p-4 md:p-5">
                        <h3 className="text-sm font-semibold mb-4">Gider Dağılımı</h3>
                        <div className="flex flex-col md:flex-row items-center gap-6">
                            {/* Simple visual pie using conic-gradient */}
                            <div className="relative w-40 h-40 flex-shrink-0">
                                <div
                                    className="w-full h-full rounded-full"
                                    style={{
                                        background: totalPie > 0
                                            ? `conic-gradient(${pieData.map((d, i) => {
                                                const startPct = pieData.slice(0, i).reduce((s, x) => s + x.amount, 0) / totalPie * 100;
                                                const endPct = startPct + (d.amount / totalPie) * 100;
                                                return `${CATEGORY_COLORS[d.category] || '#64748b'} ${startPct}% ${endPct}%`;
                                            }).join(', ')})`
                                            : '#374151'
                                    }}
                                />
                                <div className="absolute inset-4 bg-white dark:bg-gray-900 rounded-full flex items-center justify-center">
                                    <span className="text-sm font-bold">{formatCurrency(monthlyExpense)}</span>
                                </div>
                            </div>
                            <div className="flex-1 space-y-2 w-full">
                                {pieData.map(d => (
                                    <div key={d.category} className="flex items-center gap-2">
                                        <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: CATEGORY_COLORS[d.category] || '#64748b' }} />
                                        <span className="text-sm flex-1">{d.category}</span>
                                        <span className="text-sm font-medium">{formatCurrency(d.amount)}</span>
                                        <span className="text-xs text-gray-400 w-10 text-right">%{totalPie > 0 ? Math.round(d.amount / totalPie * 100) : 0}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </Card>
                </div>

                {/* Transaction List */}
                <div className="space-y-4">
                    {/* Filters */}
                    <div className="flex gap-2">
                        <div className="flex gap-1 p-1 bg-gray-100 dark:bg-gray-800/80 rounded-xl flex-1">
                            {(['all', 'income', 'expense'] as const).map(type => (
                                <button
                                    key={type}
                                    onClick={() => setFilterType(type)}
                                    className={cn('flex-1 py-2 rounded-lg text-xs font-medium transition-all',
                                        filterType === type ? 'bg-white dark:bg-gray-700 shadow-sm' : 'text-gray-500'
                                    )}
                                >
                                    {type === 'all' ? 'Tümü' : type === 'income' ? 'Gelir' : 'Gider'}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="relative">
                        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            className="w-full pl-9 pr-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 text-sm outline-none focus:ring-2 focus:ring-[rgb(var(--accent-500))]"
                            placeholder="Ara..."
                        />
                    </div>

                    {/* List */}
                    <div className="space-y-2 max-h-[600px] overflow-y-auto">
                        {filtered.length === 0 && (
                            <EmptyState icon={<Wallet size={32} className="text-gray-400" />} title="İşlem yok" description="Yeni bir işlem ekleyerek başlayın" />
                        )}
                        {filtered.map(tx => (
                            <Card key={tx.id} className="p-3 group" onClick={() => setEditingTx(tx)}>
                                <div className="flex items-center gap-3">
                                    <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0',
                                        tx.type === 'income' ? 'bg-emerald-500/15' : 'bg-red-500/15'
                                    )}>
                                        {tx.type === 'income'
                                            ? <ArrowUpRight size={16} className="text-emerald-400" />
                                            : <ArrowDownRight size={16} className="text-red-400" />
                                        }
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium truncate">{tx.category}</p>
                                        <p className="text-[10px] text-gray-400 truncate">{tx.note || 'Açıklama yok'} · {format(parseISO(tx.date), 'd MMM', { locale: tr })}</p>
                                    </div>
                                    <span className={cn('text-sm font-bold', tx.type === 'income' ? 'text-emerald-400' : 'text-red-400')}>
                                        {tx.type === 'income' ? '+' : '-'}{formatCurrency(tx.amount)}
                                    </span>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); deleteTransaction(tx.id); }}
                                        className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-red-500/10 rounded-lg transition-all"
                                    >
                                        <Trash2 size={12} className="text-red-400" />
                                    </button>
                                </div>
                            </Card>
                        ))}
                    </div>
                </div>
            </div>

            {/* Modals */}
            {showForm && <TransactionFormModal onClose={() => setShowForm(false)} />}
            {editingTx && <TransactionFormModal editTransaction={editingTx} onClose={() => setEditingTx(null)} />}
        </div>
    );
}
