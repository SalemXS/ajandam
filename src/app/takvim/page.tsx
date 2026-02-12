'use client';

import React, { useState } from 'react';
import { useStore } from '@/lib/store';
import { Card, Badge, Button } from '@/components/ui/SharedUI';
import TaskFormModal from '@/components/tasks/TaskFormModal';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { cn, classifyDueDate, getDueDateBgColor, getDueDateLabel } from '@/lib/utils';
import { Task, TASK_STATUS_LABELS } from '@/lib/types';
import { format, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, getDay, isToday, isSameMonth, parseISO } from 'date-fns';
import { tr } from 'date-fns/locale';

export default function TakvimPage() {
    const { tasks, reminders } = useStore();
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState<string | null>(null);
    const [showForm, setShowForm] = useState(false);
    const [editingTask, setEditingTask] = useState<Task | null>(null);

    const activeTasks = tasks.filter(t => !t.archived);
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
    const startDayOffset = (getDay(monthStart) + 6) % 7;
    const dayNames = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'];

    const getItemsForDay = (date: Date) => {
        const dateStr = format(date, 'yyyy-MM-dd');
        return {
            dayTasks: activeTasks.filter(t => t.dueDate === dateStr || t.startDate === dateStr),
            dayReminders: reminders.filter(r => !r.completed && r.datetime.startsWith(dateStr)),
        };
    };

    const selectedItems = selectedDate ? getItemsForDay(parseISO(selectedDate)) : { dayTasks: [], dayReminders: [] };

    return (
        <div className="space-y-4 md:space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold">Takvim</h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-0.5 text-sm">Görev ve etkinlikleri takvimde görüntüle</p>
                </div>
                <Button onClick={() => setShowForm(true)}><Plus size={16} /> Yeni Görev</Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 md:gap-6">
                <Card className="lg:col-span-3 p-4 md:p-5">
                    <div className="flex items-center justify-between mb-4">
                        <button onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl"><ChevronLeft size={18} /></button>
                        <h2 className="text-lg font-semibold">{format(currentMonth, 'MMMM yyyy', { locale: tr })}</h2>
                        <button onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl"><ChevronRight size={18} /></button>
                    </div>

                    <div className="grid grid-cols-7 gap-px mb-1">
                        {dayNames.map(d => <div key={d} className="text-center text-xs font-medium text-gray-400 py-2">{d}</div>)}
                    </div>

                    <div className="grid grid-cols-7 gap-px">
                        {Array.from({ length: startDayOffset }).map((_, i) => <div key={`e-${i}`} className="min-h-[70px] md:min-h-[90px]" />)}
                        {days.map(day => {
                            const dateStr = format(day, 'yyyy-MM-dd');
                            const { dayTasks, dayReminders } = getItemsForDay(day);
                            const isSelected = selectedDate === dateStr;
                            const total = dayTasks.length + dayReminders.length;

                            return (
                                <button key={dateStr} onClick={() => setSelectedDate(dateStr)}
                                    className={cn('min-h-[70px] md:min-h-[90px] p-1.5 rounded-xl text-left transition-all hover:bg-gray-50 dark:hover:bg-gray-800/40',
                                        isToday(day) && 'bg-[rgb(var(--accent-500)/0.1)] border border-[rgb(var(--accent-500)/0.3)]',
                                        isSelected && 'ring-2 ring-[rgb(var(--accent-500))]'
                                    )}>
                                    <span className={cn('text-xs font-medium', isToday(day) ? 'text-[rgb(var(--accent-400))] font-bold' : 'text-gray-500')}>{format(day, 'd')}</span>
                                    <div className="mt-1 space-y-0.5">
                                        {dayTasks.slice(0, 2).map(t => (
                                            <div key={t.id} className={cn('text-[8px] md:text-[10px] px-1 py-0.5 rounded truncate',
                                                t.priority === 'high' ? 'bg-red-500/20 text-red-400' : t.priority === 'medium' ? 'bg-amber-500/20 text-amber-400' : 'bg-blue-500/20 text-blue-400'
                                            )}>{t.title}</div>
                                        ))}
                                        {dayReminders.slice(0, 1).map(r => (
                                            <div key={r.id} className="text-[8px] md:text-[10px] px-1 py-0.5 rounded bg-purple-500/20 text-purple-400 truncate">🔔 {r.title}</div>
                                        ))}
                                        {total > 3 && <span className="text-[8px] text-gray-400">+{total - 3}</span>}
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </Card>

                <div className="space-y-4">
                    <Card className="p-4">
                        <h3 className="text-sm font-semibold mb-3">
                            {selectedDate ? format(parseISO(selectedDate), 'd MMMM yyyy, EEEE', { locale: tr }) : 'Bir gün seçin'}
                        </h3>
                        {!selectedDate && <p className="text-xs text-gray-400 py-6 text-center">Takvimden bir gün seçin</p>}
                        {selectedDate && selectedItems.dayTasks.length === 0 && selectedItems.dayReminders.length === 0 && (
                            <p className="text-xs text-gray-400 py-6 text-center">Bu tarihte etkinlik yok</p>
                        )}
                        {selectedDate && (
                            <div className="space-y-2">
                                {selectedItems.dayTasks.map(t => {
                                    const cls = classifyDueDate(t.dueDate);
                                    return (
                                        <div key={t.id} className="p-2.5 rounded-xl bg-gray-50 dark:bg-gray-800/50 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800" onClick={() => setEditingTask(t)}>
                                            <p className="text-sm font-medium truncate">{t.title}</p>
                                            <div className="flex gap-2 mt-1">
                                                <Badge variant={t.status === 'done' ? 'success' : 'default'}>{TASK_STATUS_LABELS[t.status]}</Badge>
                                                <Badge className={getDueDateBgColor(cls)}>{getDueDateLabel(cls)}</Badge>
                                            </div>
                                        </div>
                                    );
                                })}
                                {selectedItems.dayReminders.map(r => (
                                    <div key={r.id} className="p-2.5 rounded-xl bg-purple-500/10">
                                        <p className="text-sm font-medium">🔔 {r.title}</p>
                                        <p className="text-xs text-gray-400 mt-0.5">{r.datetime.split('T')[1]?.substring(0, 5)}</p>
                                    </div>
                                ))}
                            </div>
                        )}
                    </Card>
                </div>
            </div>

            {showForm && <TaskFormModal onClose={() => setShowForm(false)} />}
            {editingTask && <TaskFormModal editTask={editingTask} onClose={() => setEditingTask(null)} />}
        </div>
    );
}
