'use client';

import React, { useState, useMemo } from 'react';
import { useStore } from '@/lib/store';
import { Card, Badge, Button, EmptyState } from '@/components/ui/SharedUI';
import NoteFormModal from '@/components/notes/NoteFormModal';
import ReminderFormModal from '@/components/notes/ReminderFormModal';
import {
    Plus, Search, Pin, StickyNote, Bell, Trash2, Edit2,
    CheckCircle2, Clock, RotateCcw, Calendar
} from 'lucide-react';
import { cn, formatDate, formatDateTime, getUpcomingReminders } from '@/lib/utils';
import { Note, Reminder } from '@/lib/types';
import { isToday, isTomorrow, parseISO, isPast } from 'date-fns';

export default function NotlarPage() {
    const { notes, reminders, deleteNote, deleteReminder, updateReminder } = useStore();
    const [activeTab, setActiveTab] = useState<'notes' | 'reminders'>('notes');
    const [showNoteForm, setShowNoteForm] = useState(false);
    const [showReminderForm, setShowReminderForm] = useState(false);
    const [editingNote, setEditingNote] = useState<Note | null>(null);
    const [editingReminder, setEditingReminder] = useState<Reminder | null>(null);
    const [searchQuery, setSearchQuery] = useState('');

    const filteredNotes = useMemo(() => {
        let result = [...notes];
        if (searchQuery) {
            const q = searchQuery.toLowerCase();
            result = result.filter(n => n.title.toLowerCase().includes(q) || n.content.toLowerCase().includes(q));
        }
        // Pinned first, then by date
        return result.sort((a, b) => {
            if (a.pinned && !b.pinned) return -1;
            if (!a.pinned && b.pinned) return 1;
            return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        });
    }, [notes, searchQuery]);

    const upcomingReminders = getUpcomingReminders(reminders, 30);
    const pastReminders = reminders.filter(r => !r.completed && isPast(parseISO(r.datetime)) && !isToday(parseISO(r.datetime)));

    const importanceColors = {
        high: 'border-l-red-400',
        medium: 'border-l-amber-400',
        low: 'border-l-emerald-400',
    };

    return (
        <div className="space-y-4 md:space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                    <h1 className="text-2xl md:text-3xl font-bold">Notlar & Hatırlatmalar</h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-0.5 text-sm truncate">{notes.length} not · {reminders.filter(r => !r.completed).length} aktif hatırlatma</p>
                </div>
                <div className="flex gap-2 flex-shrink-0">
                    <Button size="sm" variant="secondary" onClick={() => setShowReminderForm(true)}><Bell size={14} /></Button>
                    <Button size="sm" onClick={() => setShowNoteForm(true)}><Plus size={14} /> Not</Button>
                </div>
            </div>

            {/* Tab Toggle */}
            <div className="flex gap-1 p-1 bg-gray-100 dark:bg-gray-800/80 rounded-xl w-fit">
                <button
                    onClick={() => setActiveTab('notes')}
                    className={cn('flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all',
                        activeTab === 'notes' ? 'bg-white dark:bg-gray-700 shadow-sm text-[rgb(var(--accent-600))] dark:text-[rgb(var(--accent-400))]' : 'text-gray-500'
                    )}
                >
                    <StickyNote size={14} /> Notlar
                </button>
                <button
                    onClick={() => setActiveTab('reminders')}
                    className={cn('flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all',
                        activeTab === 'reminders' ? 'bg-white dark:bg-gray-700 shadow-sm text-[rgb(var(--accent-600))] dark:text-[rgb(var(--accent-400))]' : 'text-gray-500'
                    )}
                >
                    <Bell size={14} /> Hatırlatmalar
                    {upcomingReminders.length > 0 && (
                        <span className="w-5 h-5 text-white text-[10px] rounded-full flex items-center justify-center" style={{ backgroundColor: 'rgb(var(--accent-500))' }}>{upcomingReminders.length}</span>
                    )}
                </button>
            </div>

            {/* ===== NOTES TAB ===== */}
            {activeTab === 'notes' && (
                <>
                    <div className="relative">
                        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 text-sm outline-none focus:ring-2 focus:ring-[rgb(var(--accent-500))]"
                            placeholder="Notlarda ara..."
                        />
                    </div>

                    {filteredNotes.length === 0 ? (
                        <EmptyState
                            icon={<StickyNote size={32} className="text-gray-400" />}
                            title="Henüz not yok"
                            description="Hızlı notlar alarak fikirlerinizi kaydedin"
                            action={<Button onClick={() => setShowNoteForm(true)}><Plus size={14} /> Not Ekle</Button>}
                        />
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
                            {filteredNotes.map(note => (
                                <Card
                                    key={note.id}
                                    className={cn('p-4 border-l-4 group', importanceColors[note.importance])}
                                    onClick={() => setEditingNote(note)}
                                >
                                    <div className="flex items-start justify-between mb-2">
                                        <h3 className="font-semibold text-sm flex-1 truncate">{note.title}</h3>
                                        <div className="flex gap-1 ml-2">
                                            {note.pinned && <Pin size={14} className="text-amber-400" />}
                                            <button
                                                onClick={(e) => { e.stopPropagation(); deleteNote(note.id); }}
                                                className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-500/10 rounded transition-all"
                                            >
                                                <Trash2 size={12} className="text-red-400" />
                                            </button>
                                        </div>
                                    </div>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-4 whitespace-pre-line mb-3">{note.content}</p>
                                    <div className="flex items-center justify-between">
                                        <div className="flex gap-1.5 flex-wrap">
                                            {note.tags.slice(0, 3).map(tag => <Badge key={tag} variant="purple">{tag}</Badge>)}
                                        </div>
                                        <span className="text-[10px] text-gray-400">{formatDate(note.createdAt.split('T')[0])}</span>
                                    </div>
                                </Card>
                            ))}
                        </div>
                    )}
                </>
            )}

            {/* ===== REMINDERS TAB ===== */}
            {activeTab === 'reminders' && (
                <div className="space-y-4">
                    {/* Overdue */}
                    {pastReminders.length > 0 && (
                        <div>
                            <h3 className="text-sm font-semibold text-red-400 mb-2">Gecikmiş</h3>
                            <div className="space-y-2">
                                {pastReminders.map(r => (
                                    <ReminderItem key={r.id} reminder={r} onEdit={setEditingReminder} onDelete={deleteReminder} onComplete={id => updateReminder(id, { completed: true })} />
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Today */}
                    {(() => {
                        const todayR = reminders.filter(r => !r.completed && isToday(parseISO(r.datetime)));
                        return todayR.length > 0 ? (
                            <div>
                                <h3 className="text-sm font-semibold text-orange-400 mb-2">Bugün</h3>
                                <div className="space-y-2">
                                    {todayR.map(r => (
                                        <ReminderItem key={r.id} reminder={r} onEdit={setEditingReminder} onDelete={deleteReminder} onComplete={id => updateReminder(id, { completed: true })} />
                                    ))}
                                </div>
                            </div>
                        ) : null;
                    })()}

                    {/* Tomorrow */}
                    {(() => {
                        const tmrR = reminders.filter(r => !r.completed && isTomorrow(parseISO(r.datetime)));
                        return tmrR.length > 0 ? (
                            <div>
                                <h3 className="text-sm font-semibold text-yellow-400 mb-2">Yarın</h3>
                                <div className="space-y-2">
                                    {tmrR.map(r => (
                                        <ReminderItem key={r.id} reminder={r} onEdit={setEditingReminder} onDelete={deleteReminder} onComplete={id => updateReminder(id, { completed: true })} />
                                    ))}
                                </div>
                            </div>
                        ) : null;
                    })()}

                    {/* Upcoming */}
                    {upcomingReminders.filter(r => !isToday(parseISO(r.datetime)) && !isTomorrow(parseISO(r.datetime))).length > 0 && (
                        <div>
                            <h3 className="text-sm font-semibold text-blue-400 mb-2">Yaklaşan</h3>
                            <div className="space-y-2">
                                {upcomingReminders.filter(r => !isToday(parseISO(r.datetime)) && !isTomorrow(parseISO(r.datetime))).map(r => (
                                    <ReminderItem key={r.id} reminder={r} onEdit={setEditingReminder} onDelete={deleteReminder} onComplete={id => updateReminder(id, { completed: true })} />
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Completed */}
                    {reminders.filter(r => r.completed).length > 0 && (
                        <div>
                            <h3 className="text-sm font-semibold text-gray-400 mb-2">Tamamlanan</h3>
                            <div className="space-y-2">
                                {reminders.filter(r => r.completed).slice(0, 5).map(r => (
                                    <ReminderItem key={r.id} reminder={r} onEdit={setEditingReminder} onDelete={deleteReminder} onComplete={id => updateReminder(id, { completed: false })} completed />
                                ))}
                            </div>
                        </div>
                    )}

                    {reminders.length === 0 && (
                        <EmptyState
                            icon={<Bell size={32} className="text-gray-400" />}
                            title="Hatırlatma yok"
                            description="Önemli tarihleri kaçırmamak için hatırlatma ekleyin"
                            action={<Button onClick={() => setShowReminderForm(true)}><Plus size={14} /> Hatırlatma Ekle</Button>}
                        />
                    )}
                </div>
            )}

            {/* Modals */}
            {showNoteForm && <NoteFormModal onClose={() => setShowNoteForm(false)} />}
            {editingNote && <NoteFormModal editNote={editingNote} onClose={() => setEditingNote(null)} />}
            {showReminderForm && <ReminderFormModal onClose={() => setShowReminderForm(false)} />}
            {editingReminder && <ReminderFormModal editReminder={editingReminder} onClose={() => setEditingReminder(null)} />}
        </div>
    );
}

// ===== REMINDER ITEM =====
function ReminderItem({ reminder, onEdit, onDelete, onComplete, completed }: {
    reminder: Reminder;
    onEdit: (r: Reminder) => void;
    onDelete: (id: string) => void;
    onComplete: (id: string) => void;
    completed?: boolean;
}) {
    const repeatLabels: Record<string, string> = { daily: 'Günlük', weekly: 'Haftalık', monthly: 'Aylık', none: '' };

    return (
        <Card className={cn('p-3 group', completed && 'opacity-50')}>
            <div className="flex items-center gap-3">
                <button onClick={() => onComplete(reminder.id)} className="flex-shrink-0">
                    {completed
                        ? <CheckCircle2 size={18} className="text-emerald-400" />
                        : <div className="w-[18px] h-[18px] rounded-full border-2 border-gray-300 dark:border-gray-600 hover:border-[rgb(var(--accent-400))] transition-colors" />
                    }
                </button>
                <div className="flex-1 min-w-0 cursor-pointer" onClick={() => onEdit(reminder)}>
                    <p className={cn('text-sm font-medium truncate', completed && 'line-through')}>{reminder.title}</p>
                    <div className="flex items-center gap-2 text-[10px] text-gray-400">
                        <span className="flex items-center gap-1"><Calendar size={10} /> {formatDateTime(reminder.datetime)}</span>
                        {reminder.repeatRule !== 'none' && (
                            <Badge variant="info">{repeatLabels[reminder.repeatRule]}</Badge>
                        )}
                    </div>
                </div>
                <button onClick={() => onDelete(reminder.id)} className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-red-500/10 rounded-lg transition-all">
                    <Trash2 size={12} className="text-red-400" />
                </button>
            </div>
        </Card>
    );
}
