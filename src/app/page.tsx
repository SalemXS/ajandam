'use client';

import React from 'react';
import { useStore } from '@/lib/store';
import { useAuth } from '@/lib/auth';
import { Card, Badge, ProgressBar, StatCard } from '@/components/ui/SharedUI';
import {
  CheckSquare, TrendingUp, Wallet, Target, AlertTriangle, Clock,
  ArrowUpRight, ArrowDownRight, Bell, CalendarDays, Zap, Plus,
  ListTodo, Receipt, StickyNote, Sparkles, ArrowRight,
  CircleDot, Activity, CheckCircle2, TrendingDown, AlertCircle, Settings
} from 'lucide-react';
import {
  formatCurrency, classifyDueDate, getDueDateLabel, getDueDateBgColor,
  getMonthlyIncome, getMonthlyExpense, getMonthlyNet,
  getOverdueTasks, getTodayTasks, getUpcomingTasks,
  getGoalProgress, getGoalRemaining, getGoalETA,
  getUpcomingReminders, formatDate, formatDateShort, cn,
  calculateProgressRecursive, getLast6MonthsData, getCategoryBreakdown,
  PRIORITY_COLORS, CATEGORY_COLORS,
} from '@/lib/utils';
import { TASK_STATUS_LABELS } from '@/lib/types';
import Link from 'next/link';


// Circular progress ring component
function ProgressRing({ value, size = 80, stroke = 6 }: { value: number; size?: number; stroke?: number }) {
  const radius = (size - stroke) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (value / 100) * circumference;

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2} cy={size / 2} r={radius}
          strokeWidth={stroke}
          className="fill-none stroke-gray-200 dark:stroke-gray-800"
        />
        <circle
          cx={size / 2} cy={size / 2} r={radius}
          strokeWidth={stroke}
          className="fill-none transition-all duration-1000"
          style={{
            stroke: `rgb(var(--accent-500))`,
            strokeDasharray: circumference,
            strokeDashoffset: offset,
            strokeLinecap: 'round',
          }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-lg font-bold">%{value}</span>
      </div>
    </div>
  );
}

// Get time-based greeting
function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 6) return { text: 'İyi geceler', emoji: '🌙' };
  if (hour < 12) return { text: 'Günaydın', emoji: '☀️' };
  if (hour < 18) return { text: 'İyi günler', emoji: '👋' };
  return { text: 'İyi akşamlar', emoji: '🌆' };
}

// Format Turkish date
function formatTurkishDate() {
  const days = ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'];
  const months = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];
  const now = new Date();
  return `${now.getDate()} ${months[now.getMonth()]} ${now.getFullYear()}, ${days[now.getDay()]}`;
}

export default function DashboardPage() {
  const { tasks, transactions, goals, reminders } = useStore();
  const { user } = useAuth();

  const greeting = getGreeting();
  const firstName = user?.user_metadata?.full_name?.split(' ')[0] || user?.email?.split('@')[0] || 'Kullanıcı';

  const activeTasks = tasks.filter(t => !t.archived);
  const completedCount = activeTasks.filter(t => t.status === 'done').length;
  const totalActive = activeTasks.filter(t => t.parentId === null).length;
  const overallProgress = totalActive > 0 ? Math.round((activeTasks.filter(t => t.parentId === null && t.status === 'done').length / totalActive) * 100) : 0;

  const todayTasks = getTodayTasks(tasks);
  const overdueTasks = getOverdueTasks(tasks);
  const upcomingTasks = getUpcomingTasks(tasks, 7);

  const monthlyIncome = getMonthlyIncome(transactions);
  const monthlyExpense = getMonthlyExpense(transactions);
  const monthlyNet = getMonthlyNet(transactions);
  const totalSaved = goals.reduce((s, g) => s + g.currentSaved, 0);

  const upcomingReminders = getUpcomingReminders(reminders);
  const monthlyData = getLast6MonthsData(transactions);
  const expenseBreakdown = getCategoryBreakdown(transactions, 'expense');

  // Recent activity: last completed tasks
  const recentCompleted = activeTasks
    .filter(t => t.status === 'done')
    .sort((a, b) => new Date(b.updatedAt || b.createdAt).getTime() - new Date(a.updatedAt || a.createdAt).getTime())
    .slice(0, 4);


  return (
    <div className="space-y-6">
      {/* Greeting Header */}
      <div className="animate-fade-up">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-2">
          {/* Greeting Header */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-3xl md:text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-400 mb-2">
                  {greeting.text}, {firstName} {greeting.emoji}
                </h1>
                <p className="text-gray-500 dark:text-gray-400 font-medium flex items-center gap-2">
                  <CalendarDays size={18} className="text-[rgb(var(--accent-500))]" />
                  {formatTurkishDate()}
                </p>
              </div>
              <Link
                href="/ayarlar"
                className="md:hidden p-2.5 rounded-xl text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/10 transition-colors press-effect flex-shrink-0"
              >
                <Settings size={22} />
              </Link>
            </div>
            {/* Quick summary chips */}
            <div className="flex gap-2 flex-wrap">
              {overdueTasks.length > 0 && (
                <Link href="/gorevler" className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-red-500/10 text-red-400 text-xs font-medium hover:bg-red-500/20 transition-colors press-effect">
                  <AlertTriangle size={12} />
                  {overdueTasks.length} gecikmiş
                </Link>
              )}
              {todayTasks.length > 0 && (
                <Link href="/gorevler" className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-blue-500/10 text-blue-400 text-xs font-medium hover:bg-blue-500/20 transition-colors press-effect">
                  <Clock size={12} />
                  {todayTasks.length} bugün
                </Link>
              )}
              {upcomingReminders.length > 0 && (
                <Link href="/notlar" className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium hover:opacity-80 transition-colors press-effect"
                  style={{ background: 'rgb(var(--accent-500) / 0.1)', color: 'rgb(var(--accent-400))' }}>
                  <Bell size={12} />
                  {upcomingReminders.length} hatırlatma
                </Link>
              )}
            </div>
          </div>
        </div>

        {/* Summary Cards */}
        {/* Summary Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5">
          {/* Task Progress - with ring */}
          <Card className="p-4 md:p-5 hover-lift animate-fade-up delay-1">
            <div className="flex items-center gap-4">
              <ProgressRing value={overallProgress} size={64} stroke={5} />
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">Görev İlerlemesi</p>
                <p className="text-sm font-semibold mt-0.5">{completedCount}/{totalActive}</p>
                <p className="text-[10px] text-gray-400">tamamlandı</p>
              </div>
            </div>
          </Card>

          {/* Today's tasks */}
          <Card className="p-4 md:p-5 hover-lift animate-fade-up delay-2">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">Bugün</p>
                <p className="text-2xl font-bold mt-1">{todayTasks.length}</p>
                <p className="text-[10px] text-gray-400 mt-0.5">
                  {overdueTasks.length > 0 ? (
                    <span className="text-red-400">{overdueTasks.length} gecikmiş!</span>
                  ) : 'Hepsi yolunda'}
                </p>
              </div>
              <div className="p-2.5 rounded-xl bg-blue-500/15">
                <Clock size={20} className="text-blue-400" />
              </div>
            </div>
          </Card>

          {/* Monthly Net */}
          <Card className="p-4 md:p-5 hover-lift animate-fade-up delay-3">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">Bu Ay Net</p>
                <p className={cn('text-xl font-bold mt-1', monthlyNet >= 0 ? 'text-emerald-400' : 'text-red-400')}>
                  {formatCurrency(monthlyNet)}
                </p>
                <p className="text-[10px] text-gray-400 mt-0.5">G: {formatCurrency(monthlyIncome)}</p>
              </div>
              <div className={cn('p-2.5 rounded-xl', monthlyNet >= 0 ? 'bg-emerald-500/15' : 'bg-red-500/15')}>
                {monthlyNet >= 0 ? <ArrowUpRight size={20} className="text-emerald-400" /> : <ArrowDownRight size={20} className="text-red-400" />}
              </div>
            </div>
          </Card>

          {/* Total Savings */}
          <Card className="p-4 md:p-5 hover-lift animate-fade-up delay-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">Toplam Birikim</p>
                <p className="text-xl font-bold mt-1">{formatCurrency(totalSaved)}</p>
                <p className="text-[10px] text-gray-400 mt-0.5">{goals.length} aktif hedef</p>
              </div>
              <div className="p-2.5 rounded-xl bg-amber-500/15">
                <Target size={20} className="text-amber-400" />
              </div>
            </div>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="animate-fade-up delay-3 mt-3 md:mt-4">
          <div className="flex gap-3 md:gap-4 overflow-x-auto pb-2 scrollbar-none">
            <Link href="/gorevler" className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all hover-scale press-effect whitespace-nowrap border border-gray-200 dark:border-gray-800 hover:border-blue-400/50 text-gray-600 dark:text-gray-300">
              <div className="p-1 rounded-lg bg-blue-500/15"><ListTodo size={14} className="text-blue-400" /></div>
              Görev Ekle
            </Link>
            <Link href="/finans" className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all hover-scale press-effect whitespace-nowrap border border-gray-200 dark:border-gray-800 hover:border-emerald-400/50 text-gray-600 dark:text-gray-300">
              <div className="p-1 rounded-lg bg-emerald-500/15"><Receipt size={14} className="text-emerald-400" /></div>
              İşlem Ekle
            </Link>
            <Link href="/notlar" className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all hover-scale press-effect whitespace-nowrap border border-gray-200 dark:border-gray-800 hover:border-amber-400/50 text-gray-600 dark:text-gray-300">
              <div className="p-1 rounded-lg bg-amber-500/15"><StickyNote size={14} className="text-amber-400" /></div>
              Not Ekle
            </Link>
            <Link href="/hedefler" className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all hover-scale press-effect whitespace-nowrap border border-gray-200 dark:border-gray-800 text-gray-600 dark:text-gray-300"
              style={{ borderColor: 'rgb(var(--accent-500) / 0.3)' }}>
              <div className="p-1 rounded-lg" style={{ background: 'rgb(var(--accent-500) / 0.15)' }}><Target size={14} style={{ color: 'rgb(var(--accent-400))' }} /></div>
              Hedef Ekle
            </Link>
          </div>
        </div>

        {/* Smart Alerts */}
        {(overdueTasks.length > 0 || monthlyNet < 0) && (
          <Card className="p-4 md:p-5 animate-fade-up delay-4 border-amber-500/20 dark:border-amber-500/10">
            <h3 className="flex items-center gap-2 text-sm font-semibold mb-3">
              <div className="p-1.5 rounded-lg bg-amber-500/15"><Zap size={14} className="text-amber-400" /></div>
              Akıllı Uyarılar
            </h3>
            <div className="space-y-2">
              {overdueTasks.map(t => (
                <Link key={t.id} href={`/gorevler/${t.id}`} className="flex items-center gap-3 p-3 rounded-xl bg-red-500/8 hover:bg-red-500/12 transition-colors text-sm group">
                  <AlertTriangle size={14} className="text-red-400 flex-shrink-0" />
                  <span className="flex-1 truncate"><strong>{t.title}</strong> — son tarih geçti!</span>
                  <span className="text-[10px] text-red-300">{formatDateShort(t.dueDate)}</span>
                  <ArrowRight size={14} className="text-red-300 opacity-0 group-hover:opacity-100 transition-opacity" />
                </Link>
              ))}
              {monthlyNet < 0 && (
                <div className="flex items-center gap-3 p-3 rounded-xl bg-amber-500/8 text-sm">
                  <AlertTriangle size={14} className="text-amber-400 flex-shrink-0" />
                  <span>Bu ay harcamalarınız gelirinizi <strong>{formatCurrency(Math.abs(monthlyNet))}</strong> aştı.</span>
                </div>
              )}
            </div>
          </Card>
        )}

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
          {/* Left Column - 2 span */}
          <div className="lg:col-span-2 space-y-4 md:space-y-6">

            {/* Monthly Chart */}
            <Card className="p-4 md:p-5 animate-fade-up delay-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold flex items-center gap-2">
                  <Activity size={14} className="text-gray-400" />
                  Aylık Gelir / Gider Trendi
                </h3>
                <div className="flex gap-4 text-xs text-gray-400">
                  <span className="flex items-center gap-1.5"><span className="w-2 h-2 bg-emerald-500 rounded-full" /> Gelir</span>
                  <span className="flex items-center gap-1.5"><span className="w-2 h-2 bg-red-400 rounded-full" /> Gider</span>
                </div>
              </div>
              <div className="h-48 flex items-end gap-2">
                {monthlyData.map((d, i) => {
                  const maxVal = Math.max(...monthlyData.map(m => Math.max(m.income, m.expense)), 1);
                  return (
                    <div key={i} className="flex-1 flex flex-col items-center gap-1 group">
                      <div className="w-full flex gap-1 items-end h-36">
                        <div
                          className="flex-1 rounded-t-lg transition-all duration-700 animate-progress group-hover:opacity-80"
                          style={{
                            height: `${(d.income / maxVal) * 100}%`,
                            background: 'linear-gradient(to top, rgba(16, 185, 129, 0.6), rgba(16, 185, 129, 0.9))',
                            animationDelay: `${i * 100}ms`
                          }}
                        />
                        <div
                          className="flex-1 rounded-t-lg transition-all duration-700 animate-progress group-hover:opacity-80"
                          style={{
                            height: `${(d.expense / maxVal) * 100}%`,
                            background: 'linear-gradient(to top, rgba(248, 113, 113, 0.6), rgba(248, 113, 113, 0.9))',
                            animationDelay: `${i * 100 + 50}ms`
                          }}
                        />
                      </div>
                      <span className="text-[10px] text-gray-500 dark:text-gray-400">{d.month}</span>
                    </div>
                  );
                })}
              </div>
            </Card>

            {/* Expense Breakdown */}
            <Card className="p-4 md:p-5 animate-fade-up delay-6">
              <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
                <TrendingUp size={14} className="text-gray-400" />
                Kategori Bazlı Harcama
              </h3>
              <div className="space-y-3">
                {expenseBreakdown.slice(0, 6).map(({ category, amount }, i) => {
                  const pct = monthlyExpense > 0 ? (amount / monthlyExpense) * 100 : 0;
                  return (
                    <div key={category} className="animate-fade-up" style={{ animationDelay: `${(i + 1) * 80}ms` }}>
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-2.5">
                          <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: CATEGORY_COLORS[category] || '#64748b' }} />
                          <span className="text-sm">{category}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-sm font-semibold">{formatCurrency(amount)}</span>
                          <span className="text-xs text-gray-400 w-10 text-right">%{Math.round(pct)}</span>
                        </div>
                      </div>
                      <div className="h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full animate-progress"
                          style={{
                            width: `${pct}%`,
                            backgroundColor: CATEGORY_COLORS[category] || '#64748b',
                            animationDelay: `${(i + 1) * 100}ms`
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
                {expenseBreakdown.length === 0 && (
                  <p className="text-xs text-gray-500 py-6 text-center">Henüz harcama kaydı yok</p>
                )}
              </div>
            </Card>

            {/* Recent Activity */}
            {recentCompleted.length > 0 && (
              <Card className="p-4 md:p-5 animate-fade-up delay-7">
                <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                  <Sparkles size={14} style={{ color: 'rgb(var(--accent-400))' }} />
                  Son Tamamlanan Görevler
                </h3>
                <div className="space-y-2">
                  {recentCompleted.map((t, i) => (
                    <div key={t.id} className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-gray-50 dark:hover:bg-white/5 transition-colors animate-fade-up" style={{ animationDelay: `${i * 60}ms` }}>
                      <div className="w-6 h-6 rounded-full bg-emerald-500/15 flex items-center justify-center flex-shrink-0">
                        <CheckSquare size={12} className="text-emerald-400" />
                      </div>
                      <span className="text-sm flex-1 truncate">{t.title}</span>
                      <span className="text-[10px] text-gray-400">{formatDateShort(t.updatedAt || t.createdAt)}</span>
                    </div>
                  ))}
                </div>
              </Card>
            )}
          </div>

          {/* Right Column */}
          <div className="space-y-4 md:space-y-6">
            {/* Upcoming Tasks */}
            <Card className="p-4 md:p-5 animate-fade-up delay-5">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold flex items-center gap-2">
                  <CircleDot size={14} className="text-blue-400" />
                  Yaklaşan Görevler
                </h3>
                <Link href="/gorevler" className="text-xs font-medium hover:opacity-80 transition-opacity flex items-center gap-1" style={{ color: 'rgb(var(--accent-400))' }}>
                  Tümü <ArrowRight size={12} />
                </Link>
              </div>
              <div className="space-y-1.5">
                {upcomingTasks.length === 0 && <p className="text-xs text-gray-500 py-6 text-center">Yaklaşan görev yok 🎉</p>}
                {upcomingTasks.slice(0, 6).map((t, i) => {
                  const cls = classifyDueDate(t.dueDate);
                  return (
                    <Link
                      key={t.id}
                      href={`/gorevler/${t.id}`}
                      className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-gray-50 dark:hover:bg-white/5 transition-all group animate-fade-up"
                      style={{ animationDelay: `${i * 60}ms` }}
                    >
                      <div className={cn('w-1.5 h-8 rounded-full flex-shrink-0 transition-all group-hover:h-10',
                        t.priority === 'high' ? 'bg-red-400' : t.priority === 'medium' ? 'bg-amber-400' : 'bg-emerald-400'
                      )} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm truncate group-hover:text-[rgb(var(--accent-400))] transition-colors">{t.title}</p>
                        <p className="text-[10px] text-gray-400">{TASK_STATUS_LABELS[t.status]}</p>
                      </div>
                      <Badge className={getDueDateBgColor(cls)}>{getDueDateLabel(cls)}</Badge>
                    </Link>
                  );
                })}
              </div>
            </Card>

            {/* Reminders */}
            <Card className="p-4 md:p-5 animate-fade-up delay-6">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold flex items-center gap-2">
                  <Bell size={14} style={{ color: 'rgb(var(--accent-400))' }} />
                  Hatırlatmalar
                </h3>
                <Link href="/notlar" className="text-xs font-medium hover:opacity-80 transition-opacity flex items-center gap-1" style={{ color: 'rgb(var(--accent-400))' }}>
                  Tümü <ArrowRight size={12} />
                </Link>
              </div>
              <div className="space-y-1.5">
                {upcomingReminders.length === 0 && <p className="text-xs text-gray-500 py-6 text-center">Yaklaşan hatırlatma yok</p>}
                {upcomingReminders.slice(0, 5).map((r, i) => (
                  <div key={r.id} className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-gray-50 dark:hover:bg-white/5 transition-colors animate-fade-up" style={{ animationDelay: `${i * 60}ms` }}>
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: 'rgb(var(--accent-500) / 0.12)' }}>
                      <Bell size={14} style={{ color: 'rgb(var(--accent-400))' }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm truncate">{r.title}</p>
                      <p className="text-[10px] text-gray-400">{formatDate(r.datetime.split('T')[0])} · {r.datetime.split('T')[1]?.substring(0, 5)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            {/* Goals Progress */}
            <Card className="p-4 md:p-5 animate-fade-up delay-7">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold flex items-center gap-2">
                  <Target size={14} className="text-amber-400" />
                  Hedefler
                </h3>
                <Link href="/hedefler" className="text-xs font-medium hover:opacity-80 transition-opacity flex items-center gap-1" style={{ color: 'rgb(var(--accent-400))' }}>
                  Tümü <ArrowRight size={12} />
                </Link>
              </div>
              <div className="space-y-3.5">
                {goals.length === 0 && <p className="text-xs text-gray-500 py-6 text-center">Henüz hedef eklenmedi</p>}
                {goals.map((g, i) => {
                  const progress = getGoalProgress(g);
                  const eta = getGoalETA(g, transactions);
                  return (
                    <div key={g.id} className="animate-fade-up" style={{ animationDelay: `${i * 80}ms` }}>
                      <div className="flex justify-between text-sm mb-1.5">
                        <span className="truncate font-medium">{g.name}</span>
                        <span className="text-xs font-semibold ml-2" style={{ color: 'rgb(var(--accent-400))' }}>%{progress}</span>
                      </div>
                      <div className="h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full animate-progress"
                          style={{
                            width: `${Math.min(100, Math.max(0, progress))}%`,
                            background: 'linear-gradient(to right, rgb(var(--accent-500)), rgb(var(--accent-400)))',
                            animationDelay: `${i * 100 + 200}ms`
                          }}
                        />
                      </div>
                      <p className="text-[10px] text-gray-400 mt-1">
                        {formatCurrency(g.currentSaved)} / {formatCurrency(g.targetAmount)}
                        {eta.possible && eta.months > 0 && ` · ~${eta.months} ay kaldı`}
                      </p>
                    </div>
                  );
                })}
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
