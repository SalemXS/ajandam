import {
    Task, TaskStatus, Transaction, Goal, GoalTransaction, Reminder,
} from './types';
import {
    isToday, isTomorrow, isPast, differenceInDays, parseISO,
    startOfMonth, endOfMonth, isWithinInterval, subMonths, format,
} from 'date-fns';
import { tr } from 'date-fns/locale';

// ==================== DATE HELPERS ====================

export type DueDateClass = 'overdue' | 'today' | 'tomorrow' | 'soon3' | 'soon7' | 'later' | 'none';

export function classifyDueDate(dueDate: string | null): DueDateClass {
    if (!dueDate) return 'none';
    const d = parseISO(dueDate);
    const now = new Date();
    now.setHours(0, 0, 0, 0);

    if (isPast(d) && !isToday(d)) return 'overdue';
    if (isToday(d)) return 'today';
    if (isTomorrow(d)) return 'tomorrow';
    const diff = differenceInDays(d, now);
    if (diff <= 3) return 'soon3';
    if (diff <= 7) return 'soon7';
    return 'later';
}

export function getDueDateLabel(cls: DueDateClass): string {
    const map: Record<DueDateClass, string> = {
        overdue: 'Gecikmiş',
        today: 'Bugün',
        tomorrow: 'Yarın',
        soon3: '3 Gün İçinde',
        soon7: '7 Gün İçinde',
        later: 'Daha Sonra',
        none: 'Tarih Yok',
    };
    return map[cls];
}

export function getDueDateColor(cls: DueDateClass): string {
    const map: Record<DueDateClass, string> = {
        overdue: 'text-red-500',
        today: 'text-orange-500',
        tomorrow: 'text-yellow-500',
        soon3: 'text-blue-500',
        soon7: 'text-cyan-500',
        later: 'text-gray-400',
        none: 'text-gray-300',
    };
    return map[cls];
}

export function getDueDateBgColor(cls: DueDateClass): string {
    const map: Record<DueDateClass, string> = {
        overdue: 'bg-red-500/15 text-red-400 border-red-500/30',
        today: 'bg-orange-500/15 text-orange-400 border-orange-500/30',
        tomorrow: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30',
        soon3: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
        soon7: 'bg-cyan-500/15 text-cyan-400 border-cyan-500/30',
        later: 'bg-gray-500/15 text-gray-400 border-gray-500/30',
        none: 'bg-gray-500/10 text-gray-400 border-gray-500/20',
    };
    return map[cls];
}

// ==================== TASK TREE ====================

export interface TaskTreeNode extends Task {
    children: TaskTreeNode[];
}

export function buildTaskTree(tasks: Task[], parentId: string | null = null): TaskTreeNode[] {
    return tasks
        .filter(t => t.parentId === parentId && !t.archived)
        .sort((a, b) => a.orderIndex - b.orderIndex)
        .map(t => ({
            ...t,
            children: buildTaskTree(tasks, t.id),
        }));
}

export function calculateProgress(task: Task, allTasks: Task[]): number {
    const children = allTasks.filter(t => t.parentId === task.id && !t.archived);
    if (children.length === 0) return task.progress;
    const done = children.filter(c => c.status === 'done').length;
    return Math.round((done / children.length) * 100);
}

export function calculateProgressRecursive(taskId: string, allTasks: Task[]): number {
    const children = allTasks.filter(t => t.parentId === taskId && !t.archived);
    if (children.length === 0) {
        const task = allTasks.find(t => t.id === taskId);
        return task ? task.progress : 0;
    }
    const total = children.reduce((sum, c) => sum + calculateProgressRecursive(c.id, allTasks), 0);
    return Math.round(total / children.length);
}

export function getDescendantIds(taskId: string, allTasks: Task[]): string[] {
    const children = allTasks.filter(t => t.parentId === taskId);
    let ids: string[] = [];
    for (const child of children) {
        ids.push(child.id);
        ids = ids.concat(getDescendantIds(child.id, allTasks));
    }
    return ids;
}

export function getAncestorIds(taskId: string, allTasks: Task[]): string[] {
    const task = allTasks.find(t => t.id === taskId);
    if (!task || !task.parentId) return [];
    return [task.parentId, ...getAncestorIds(task.parentId, allTasks)];
}

// ==================== TASK FILTERS ====================

export function getTasksByStatus(tasks: Task[], status: TaskStatus): Task[] {
    return tasks.filter(t => t.status === status && !t.archived);
}

export function getRootTasks(tasks: Task[]): Task[] {
    return tasks.filter(t => t.parentId === null && !t.archived);
}

export function getOverdueTasks(tasks: Task[]): Task[] {
    return tasks.filter(t => {
        if (t.archived || t.status === 'done' || !t.dueDate) return false;
        return classifyDueDate(t.dueDate) === 'overdue';
    });
}

export function getTodayTasks(tasks: Task[]): Task[] {
    return tasks.filter(t => {
        if (t.archived || t.status === 'done') return false;
        if (t.dueDate && isToday(parseISO(t.dueDate))) return true;
        if (t.startDate && isToday(parseISO(t.startDate))) return true;
        return false;
    });
}

export function getUpcomingTasks(tasks: Task[], days: number = 7): Task[] {
    const now = new Date();
    return tasks.filter(t => {
        if (t.archived || t.status === 'done' || !t.dueDate) return false;
        const d = parseISO(t.dueDate);
        const diff = differenceInDays(d, now);
        return diff >= 0 && diff <= days;
    }).sort((a, b) => parseISO(a.dueDate!).getTime() - parseISO(b.dueDate!).getTime());
}

// ==================== FINANCE HELPERS ====================

export function getMonthlyTransactions(transactions: Transaction[], date: Date = new Date()) {
    const start = startOfMonth(date);
    const end = endOfMonth(date);
    return transactions.filter(t =>
        isWithinInterval(parseISO(t.date), { start, end })
    );
}

export function getMonthlyIncome(transactions: Transaction[], date?: Date): number {
    return getMonthlyTransactions(transactions, date)
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + t.amount, 0);
}

export function getMonthlyExpense(transactions: Transaction[], date?: Date): number {
    return getMonthlyTransactions(transactions, date)
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0);
}

export function getMonthlyNet(transactions: Transaction[], date?: Date): number {
    return getMonthlyIncome(transactions, date) - getMonthlyExpense(transactions, date);
}

export function getCategoryBreakdown(transactions: Transaction[], type: 'income' | 'expense', date?: Date) {
    const monthly = getMonthlyTransactions(transactions, date).filter(t => t.type === type);
    const map: Record<string, number> = {};
    for (const t of monthly) {
        map[t.category] = (map[t.category] || 0) + t.amount;
    }
    return Object.entries(map)
        .map(([category, amount]) => ({ category, amount }))
        .sort((a, b) => b.amount - a.amount);
}

export function getAverageNetSavings(transactions: Transaction[], months: number = 3): number {
    const now = new Date();
    let total = 0;
    for (let i = 0; i < months; i++) {
        const date = subMonths(now, i);
        total += getMonthlyNet(transactions, date);
    }
    return total / months;
}

export function getLast6MonthsData(transactions: Transaction[]) {
    const now = new Date();
    const data = [];
    for (let i = 5; i >= 0; i--) {
        const date = subMonths(now, i);
        data.push({
            month: format(date, 'MMM yy', { locale: tr }),
            income: getMonthlyIncome(transactions, date),
            expense: getMonthlyExpense(transactions, date),
            net: getMonthlyNet(transactions, date),
        });
    }
    return data;
}

// ==================== GOAL HELPERS ====================

export function getGoalRemaining(goal: Goal): number {
    return Math.max(0, goal.targetAmount - goal.currentSaved);
}

export function getGoalProgress(goal: Goal): number {
    if (goal.targetAmount === 0) return 100;
    return Math.min(100, Math.round((goal.currentSaved / goal.targetAmount) * 100));
}

export function getGoalETA(goal: Goal, transactions: Transaction[]): { months: number; possible: boolean } {
    const remaining = getGoalRemaining(goal);
    if (remaining <= 0) return { months: 0, possible: true };

    if (goal.monthlyPlanAmount && goal.monthlyPlanAmount > 0) {
        return { months: Math.ceil(remaining / goal.monthlyPlanAmount), possible: true };
    }

    const avgNet = getAverageNetSavings(transactions);
    if (avgNet <= 0) return { months: -1, possible: false };
    return { months: Math.ceil(remaining / avgNet), possible: true };
}

// ==================== REMINDER HELPERS ====================

export function getUpcomingReminders(reminders: Reminder[], days: number = 7): Reminder[] {
    const now = new Date();
    return reminders
        .filter(r => {
            if (r.completed) return false;
            const d = parseISO(r.datetime);
            const diff = differenceInDays(d, now);
            return diff >= -1 && diff <= days;
        })
        .sort((a, b) => parseISO(a.datetime).getTime() - parseISO(b.datetime).getTime());
}

// ==================== FORMAT HELPERS ====================

export function formatCurrency(amount: number): string {
    return new Intl.NumberFormat('tr-TR', {
        style: 'currency',
        currency: 'TRY',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(amount);
}

export function formatDate(date: string | null): string {
    if (!date) return '-';
    return format(parseISO(date), 'd MMM yyyy', { locale: tr });
}

export function formatDateShort(date: string | null): string {
    if (!date) return '-';
    return format(parseISO(date), 'd MMM', { locale: tr });
}

export function formatDateTime(date: string): string {
    return format(parseISO(date), 'd MMM yyyy HH:mm', { locale: tr });
}

export function cn(...classes: (string | boolean | undefined | null)[]): string {
    return classes.filter(Boolean).join(' ');
}

export function generateId(): string {
    return crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 15);
}

export const STATUS_COLORS: Record<TaskStatus, string> = {
    'todo': 'bg-slate-500',
    'in-progress': 'bg-blue-500',
    'waiting': 'bg-amber-500',
    'done': 'bg-emerald-500',
};

export const PRIORITY_COLORS: Record<string, string> = {
    low: 'text-emerald-400',
    medium: 'text-amber-400',
    high: 'text-red-400',
};

export const CATEGORY_COLORS: Record<string, string> = {
    'Kira': '#ef4444',
    'Market': '#f97316',
    'Ulaşım': '#eab308',
    'Eğlence': '#a855f7',
    'Sağlık': '#ec4899',
    'Eğitim': '#3b82f6',
    'Giyim': '#14b8a6',
    'Faturalar': '#f43f5e',
    'Yemek': '#f59e0b',
    'Abonelikler': '#8b5cf6',
    'Maaş': '#22c55e',
    'Freelance': '#06b6d4',
    'Yatırım': '#6366f1',
    'Hediye': '#d946ef',
    'İade': '#10b981',
    'Diğer': '#64748b',
};
