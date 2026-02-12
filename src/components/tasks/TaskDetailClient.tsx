'use client';

import React, { useState, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useStore } from '@/lib/store';
import { Card, Badge, ProgressBar, Button } from '@/components/ui/SharedUI';
import TaskFormModal from '@/components/tasks/TaskFormModal';
import {
    ArrowLeft, Edit2, Trash2, Plus, CheckCircle2, Clock, Calendar,
    Tag, FolderOpen, ChevronRight, X, Palette
} from 'lucide-react';
import {
    cn, calculateProgressRecursive, classifyDueDate, getDueDateLabel,
    getDueDateBgColor, formatDate, buildTaskTree, TaskTreeNode
} from '@/lib/utils';
import { Task, TaskStatus, TASK_STATUS_LABELS, TASK_PRIORITY_LABELS } from '@/lib/types';

const STICKY_COLORS = [
    '#fef08a', '#bbf7d0', '#bfdbfe', '#f9a8d4', '#e9d5ff',
    '#fed7aa', '#99f6e4', '#fca5a5',
];

export default function TaskDetailClient() {
    const { id } = useParams();
    const router = useRouter();
    const {
        tasks, projects, taskNotes,
        updateTask, deleteTask, autoCompleteParent,
        addTask, addTaskNote, updateTaskNote, deleteTaskNote
    } = useStore();

    const [showEditModal, setShowEditModal] = useState(false);
    const [addingSubTask, setAddingSubTask] = useState(false);
    const [newSubTitle, setNewSubTitle] = useState('');
    const [newNoteContent, setNewNoteContent] = useState('');
    const [newNoteColor, setNewNoteColor] = useState(STICKY_COLORS[0]);
    const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
    const [editingNoteContent, setEditingNoteContent] = useState('');

    const task = tasks.find(t => t.id === id);
    if (!task) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
                <p className="text-gray-400">Görev bulunamadı</p>
                <Button onClick={() => router.push('/gorevler')}>
                    <ArrowLeft size={14} /> Görevlere Dön
                </Button>
            </div>
        );
    }

    const project = projects.find(p => p.id === task.projectId);
    const progress = calculateProgressRecursive(task.id, tasks);
    const childTasks = tasks.filter(t => t.parentId === task.id && !t.archived);
    const doneChildren = childTasks.filter(t => t.status === 'done').length;
    const cls = classifyDueDate(task.dueDate);
    const parentTask = task.parentId ? tasks.find(t => t.id === task.parentId) : null;
    const notes = taskNotes.filter(n => n.taskId === task.id).sort((a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    const handleToggleDone = (taskId: string, currentStatus: TaskStatus) => {
        const newStatus = currentStatus === 'done' ? 'todo' : 'done';
        updateTask(taskId, { status: newStatus, progress: newStatus === 'done' ? 100 : 0 });
        setTimeout(() => autoCompleteParent(taskId), 0);
    };

    const handleAddSubTask = () => {
        if (!newSubTitle.trim()) return;
        addTask({
            title: newSubTitle.trim(),
            description: '',
            status: 'todo',
            priority: task.priority,
            projectId: task.projectId,
            parentId: task.id,
            dueDate: null,
            startDate: null,
            tags: [],
            progress: 0,
            estimatedHours: null,
            actualHours: null,
            repeatRule: 'none',
            dependsOn: null,
        });
        setNewSubTitle('');
    };

    const handleAddNote = () => {
        if (!newNoteContent.trim()) return;
        addTaskNote({
            taskId: task.id,
            content: newNoteContent.trim(),
            color: newNoteColor,
        });
        setNewNoteContent('');
    };

    const handleSaveEditNote = (noteId: string) => {
        updateTaskNote(noteId, { content: editingNoteContent });
        setEditingNoteId(null);
    };

    return (
        <div className="space-y-6 max-w-5xl mx-auto">
            {/* Breadcrumb */}
            <div className="flex items-center gap-2 text-sm text-gray-400">
                <button onClick={() => router.push('/gorevler')} className="hover:text-[rgb(var(--accent-400))] transition-colors flex items-center gap-1">
                    <ArrowLeft size={14} /> Görevler
                </button>
                {parentTask && (
                    <>
                        <ChevronRight size={12} />
                        <button onClick={() => router.push(`/gorevler/${parentTask.id}`)} className="hover:text-[rgb(var(--accent-400))] transition-colors truncate max-w-[150px]">
                            {parentTask.title}
                        </button>
                    </>
                )}
                <ChevronRight size={12} />
                <span className="text-white truncate max-w-[200px]">{task.title}</span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left: Main Content */}
                <div className="lg:col-span-2 space-y-5">
                    {/* Task Header */}
                    <Card className="p-5">
                        <div className="flex items-start justify-between gap-3 mb-4">
                            <div className="flex-1">
                                <div className="flex items-center gap-3 mb-2">
                                    <button onClick={() => handleToggleDone(task.id, task.status)} className="flex-shrink-0">
                                        {task.status === 'done' ? (
                                            <div className="w-7 h-7 rounded-lg bg-emerald-500 flex items-center justify-center transition-all shadow-lg shadow-emerald-500/30">
                                                <CheckCircle2 size={18} className="text-white" />
                                            </div>
                                        ) : (
                                            <div className={cn(
                                                'w-7 h-7 rounded-lg border-2 transition-all hover:border-[rgb(var(--accent-400))]',
                                                task.status === 'in-progress' ? 'border-blue-400 bg-blue-400/20' :
                                                    task.status === 'waiting' ? 'border-amber-400 bg-amber-400/20' :
                                                        'border-gray-400'
                                            )} />
                                        )}
                                    </button>
                                    <h1 className={cn('text-xl md:text-2xl font-bold flex-1', task.status === 'done' && 'line-through opacity-50')}>
                                        {task.title}
                                    </h1>
                                </div>
                                {task.description && (
                                    <p className="text-sm text-gray-400 ml-10 whitespace-pre-line">{task.description}</p>
                                )}
                            </div>
                            <div className="flex gap-2">
                                <button onClick={() => setShowEditModal(true)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors">
                                    <Edit2 size={16} />
                                </button>
                                <button onClick={() => { deleteTask(task.id); router.push('/gorevler'); }} className="p-2 hover:bg-red-500/10 rounded-xl transition-colors">
                                    <Trash2 size={16} className="text-red-400" />
                                </button>
                            </div>
                        </div>

                        <div className="flex flex-wrap gap-2 ml-10">
                            <Badge variant={task.status === 'done' ? 'success' : task.status === 'in-progress' ? 'info' : 'default'}>
                                {TASK_STATUS_LABELS[task.status]}
                            </Badge>
                            <Badge variant={task.priority === 'high' ? 'danger' : task.priority === 'medium' ? 'warning' : 'default'}>
                                {TASK_PRIORITY_LABELS[task.priority]}
                            </Badge>
                            {project && (
                                <span className="text-[10px] px-2 py-1 rounded-md" style={{ backgroundColor: project.color + '20', color: project.color }}>
                                    {project.name}
                                </span>
                            )}
                            {task.dueDate && <Badge className={getDueDateBgColor(cls)}>{getDueDateLabel(cls)}</Badge>}
                            {task.tags.map(tag => <Badge key={tag} variant="purple">{tag}</Badge>)}
                        </div>
                    </Card>

                    <Card className="p-5">
                        <div className="flex items-center justify-between mb-3">
                            <h3 className="text-sm font-semibold">İlerleme</h3>
                            <span className="text-lg font-bold" style={{ color: 'rgb(var(--accent-400))' }}>%{progress}</span>
                        </div>
                        <ProgressBar
                            value={progress}
                            size="md"
                            color={progress >= 100 ? 'bg-gradient-to-r from-emerald-500 to-green-400' : progress >= 50 ? 'bg-gradient-to-r from-blue-500 to-cyan-400' : undefined}
                        />
                        {childTasks.length > 0 && (
                            <p className="text-xs text-gray-400 mt-2">{doneChildren}/{childTasks.length} alt görev tamamlandı</p>
                        )}
                    </Card>

                    <Card className="p-5">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-sm font-semibold">Alt Görevler</h3>
                            <button
                                onClick={() => setAddingSubTask(true)}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
                                style={{ backgroundColor: 'rgb(var(--accent-500) / 0.15)', color: 'rgb(var(--accent-400))' }}
                            >
                                <Plus size={12} /> Alt Görev Ekle
                            </button>
                        </div>

                        <div className="space-y-1.5">
                            {childTasks.length === 0 && !addingSubTask && (
                                <p className="text-xs text-gray-400 text-center py-6">Henüz alt görev yok</p>
                            )}

                            {childTasks.map(child => {
                                const childProgress = calculateProgressRecursive(child.id, tasks);
                                const grandchildCount = tasks.filter(t => t.parentId === child.id && !t.archived).length;
                                return (
                                    <div key={child.id} className="flex items-center gap-3 py-2.5 px-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800/40 group transition-colors">
                                        <button onClick={() => handleToggleDone(child.id, child.status)} className="flex-shrink-0">
                                            {child.status === 'done' ? (
                                                <div className="w-5 h-5 rounded-md bg-emerald-500 flex items-center justify-center">
                                                    <CheckCircle2 size={14} className="text-white" />
                                                </div>
                                            ) : (
                                                <div className={cn(
                                                    'w-5 h-5 rounded-md border-2 transition-all hover:border-[rgb(var(--accent-400))]',
                                                    child.status === 'in-progress' ? 'border-blue-400 bg-blue-400/20' :
                                                        'border-gray-300 dark:border-gray-600'
                                                )} />
                                            )}
                                        </button>
                                        <button
                                            onClick={() => router.push(`/gorevler/${child.id}`)}
                                            className={cn('flex-1 text-sm text-left truncate hover:text-[rgb(var(--accent-400))] transition-colors', child.status === 'done' && 'line-through opacity-50')}
                                        >
                                            {child.title}
                                        </button>
                                        {grandchildCount > 0 && (
                                            <span className="text-[10px] text-gray-400">{grandchildCount} alt</span>
                                        )}
                                        <div className="w-12">
                                            <ProgressBar value={childProgress} size="xs" color={childProgress >= 100 ? 'bg-emerald-500' : undefined} />
                                        </div>
                                        <span className="text-[10px] text-gray-400 w-8 text-right">%{childProgress}</span>
                                    </div>
                                );
                            })}

                            {addingSubTask && (
                                <div className="flex items-center gap-2 py-2 px-3 animate-in">
                                    <div className="w-5 h-5 rounded-md border-2 border-dashed flex items-center justify-center flex-shrink-0" style={{ borderColor: 'rgb(var(--accent-400) / 0.5)' }}>
                                        <Plus size={10} style={{ color: 'rgb(var(--accent-400))' }} />
                                    </div>
                                    <input
                                        type="text"
                                        value={newSubTitle}
                                        onChange={e => setNewSubTitle(e.target.value)}
                                        onKeyDown={e => {
                                            if (e.key === 'Enter') handleAddSubTask();
                                            if (e.key === 'Escape') { setAddingSubTask(false); setNewSubTitle(''); }
                                        }}
                                        className="flex-1 bg-transparent border-b text-sm py-1 outline-none placeholder:text-gray-400"
                                        style={{ borderColor: 'rgb(var(--accent-400) / 0.3)' }}
                                        placeholder="Alt görev adı yazın, Enter'a basın..."
                                        autoFocus
                                    />
                                    <button onClick={handleAddSubTask} className="text-xs font-medium px-2 py-1 rounded-lg" style={{ color: 'rgb(var(--accent-400))' }}>Ekle</button>
                                    <button onClick={() => { setAddingSubTask(false); setNewSubTitle(''); }} className="text-xs text-gray-400 px-2 py-1">İptal</button>
                                </div>
                            )}
                        </div>
                    </Card>
                </div>

                <div className="space-y-5">
                    <Card className="p-5">
                        <h3 className="text-sm font-semibold mb-3">Detaylar</h3>
                        <div className="space-y-3 text-sm">
                            <div className="flex items-center gap-2 text-gray-400">
                                <Calendar size={14} />
                                <span>Başlangıç:</span>
                                <span className="text-white ml-auto">{task.startDate ? formatDate(task.startDate) : '—'}</span>
                            </div>
                            <div className="flex items-center gap-2 text-gray-400">
                                <Clock size={14} />
                                <span>Bitiş:</span>
                                <span className="text-white ml-auto">{task.dueDate ? formatDate(task.dueDate) : '—'}</span>
                            </div>
                            {project && (
                                <div className="flex items-center gap-2 text-gray-400">
                                    <FolderOpen size={14} />
                                    <span>Proje:</span>
                                    <span className="ml-auto text-xs px-2 py-0.5 rounded" style={{ backgroundColor: project.color + '20', color: project.color }}>{project.name}</span>
                                </div>
                            )}
                            {task.tags.length > 0 && (
                                <div className="flex items-center gap-2 text-gray-400">
                                    <Tag size={14} />
                                    <span>Etiketler:</span>
                                    <div className="flex gap-1 ml-auto flex-wrap justify-end">
                                        {task.tags.map(t => <Badge key={t} variant="purple">{t}</Badge>)}
                                    </div>
                                </div>
                            )}
                            {task.estimatedHours && (
                                <div className="flex items-center gap-2 text-gray-400">
                                    <Clock size={14} />
                                    <span>Tahmini:</span>
                                    <span className="text-white ml-auto">{task.estimatedHours}s</span>
                                </div>
                            )}
                            <div className="text-[10px] text-gray-500 pt-2 border-t border-gray-200 dark:border-gray-800">
                                Oluşturulma: {formatDate(task.createdAt.split('T')[0])}
                            </div>
                        </div>
                    </Card>

                    <div>
                        <div className="flex items-center justify-between mb-3">
                            <h3 className="text-sm font-semibold">📝 Notlar</h3>
                            <span className="text-[10px] text-gray-400">{notes.length} not</span>
                        </div>

                        <div className="mb-3 rounded-2xl p-3 shadow-md" style={{ backgroundColor: newNoteColor }}>
                            <textarea
                                value={newNoteContent}
                                onChange={e => setNewNoteContent(e.target.value)}
                                onKeyDown={e => { if (e.key === 'Enter' && e.ctrlKey) handleAddNote(); }}
                                className="w-full bg-transparent text-gray-800 text-sm outline-none resize-none placeholder:text-gray-500 min-h-[60px]"
                                placeholder="Not ekle... (Ctrl+Enter ile kaydet)"
                            />
                            <div className="flex items-center justify-between mt-2">
                                <div className="flex gap-1.5">
                                    {STICKY_COLORS.map(c => (
                                        <button
                                            key={c}
                                            onClick={() => setNewNoteColor(c)}
                                            className={cn('w-5 h-5 rounded-full transition-all', newNoteColor === c ? 'ring-2 ring-gray-600 scale-110' : 'hover:scale-110')}
                                            style={{ backgroundColor: c }}
                                        />
                                    ))}
                                </div>
                                <button
                                    onClick={handleAddNote}
                                    disabled={!newNoteContent.trim()}
                                    className="text-xs font-semibold text-gray-700 bg-white/50 hover:bg-white/80 px-3 py-1 rounded-lg transition-colors disabled:opacity-30"
                                >
                                    Ekle
                                </button>
                            </div>
                        </div>

                        <div className="space-y-2.5">
                            {notes.map(note => (
                                <div key={note.id} className="rounded-2xl p-3.5 shadow-md group relative transition-transform hover:-rotate-1" style={{ backgroundColor: note.color }}>
                                    {editingNoteId === note.id ? (
                                        <>
                                            <textarea
                                                value={editingNoteContent}
                                                onChange={e => setEditingNoteContent(e.target.value)}
                                                className="w-full bg-transparent text-gray-800 text-sm outline-none resize-none min-h-[60px]"
                                                autoFocus
                                            />
                                            <div className="flex justify-end gap-2 mt-1">
                                                <button onClick={() => setEditingNoteId(null)} className="text-[10px] text-gray-600 hover:text-gray-800">İptal</button>
                                                <button onClick={() => handleSaveEditNote(note.id)} className="text-[10px] font-semibold text-gray-800 bg-white/50 px-2 py-0.5 rounded">Kaydet</button>
                                            </div>
                                        </>
                                    ) : (
                                        <>
                                            <p className="text-sm text-gray-800 whitespace-pre-line leading-relaxed">{note.content}</p>
                                            <div className="flex items-center justify-between mt-2">
                                                <span className="text-[9px] text-gray-500">{formatDate(note.createdAt.split('T')[0])}</span>
                                                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button onClick={() => { setEditingNoteId(note.id); setEditingNoteContent(note.content); }} className="text-[10px] text-gray-600 hover:text-gray-800 px-1.5 py-0.5 rounded bg-white/30">Düzenle</button>
                                                    <button onClick={() => deleteTaskNote(note.id)} className="text-[10px] text-red-600 hover:text-red-800 px-1.5 py-0.5 rounded bg-white/30">Sil</button>
                                                </div>
                                            </div>
                                        </>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {showEditModal && <TaskFormModal editTask={task} onClose={() => setShowEditModal(false)} />}
        </div>
    );
}
