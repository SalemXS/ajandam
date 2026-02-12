'use client';

import React, { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useStore } from '@/lib/store';
import { Card, Badge, ProgressBar, Button, EmptyState } from '@/components/ui/SharedUI';
import TaskFormModal from '@/components/tasks/TaskFormModal';
import {
    Plus, List, LayoutGrid, GitBranch, CalendarDays, Search, Filter,
    ChevronRight, ChevronDown, GripVertical, MoreHorizontal, Edit2, Trash2, Archive,
    CheckCircle2, Circle, Clock, Pause, AlertCircle
} from 'lucide-react';
import {
    cn, classifyDueDate, getDueDateLabel, getDueDateBgColor,
    formatDateShort, calculateProgressRecursive, buildTaskTree,
    STATUS_COLORS, PRIORITY_COLORS, TaskTreeNode
} from '@/lib/utils';
import { Task, TaskStatus, TASK_STATUS_LABELS, TASK_PRIORITY_LABELS, TASK_TAGS } from '@/lib/types';

type ViewMode = 'kanban' | 'list' | 'tree' | 'calendar';

const STATUS_ICONS: Record<TaskStatus, React.ReactNode> = {
    'todo': <Circle size={16} className="text-slate-400" />,
    'in-progress': <Clock size={16} className="text-blue-400" />,
    'waiting': <Pause size={16} className="text-amber-400" />,
    'done': <CheckCircle2 size={16} className="text-emerald-400" />,
};

export default function GorevlerPage() {
    const { tasks, projects, updateTask, deleteTask, archiveTask, addTask, autoCompleteParent } = useStore();
    const router = useRouter();
    const [viewMode, setViewMode] = useState<ViewMode>('kanban');
    const [showForm, setShowForm] = useState(false);
    const [editingTask, setEditingTask] = useState<Task | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterStatus, setFilterStatus] = useState<TaskStatus | ''>('');
    const [filterPriority, setFilterPriority] = useState('');
    const [filterProject, setFilterProject] = useState('');
    const [filterTag, setFilterTag] = useState('');
    const [showFilters, setShowFilters] = useState(false);
    const [addingSubTaskParentId, setAddingSubTaskParentId] = useState<string | null>(null);
    const [newSubTaskTitle, setNewSubTaskTitle] = useState('');

    const activeTasks = useMemo(() => {
        let filtered = tasks.filter(t => !t.archived);
        if (searchQuery) {
            const q = searchQuery.toLowerCase();
            filtered = filtered.filter(t => t.title.toLowerCase().includes(q) || t.description.toLowerCase().includes(q));
        }
        if (filterStatus) filtered = filtered.filter(t => t.status === filterStatus);
        if (filterPriority) filtered = filtered.filter(t => t.priority === filterPriority);
        if (filterProject) filtered = filtered.filter(t => t.projectId === filterProject);
        if (filterTag) filtered = filtered.filter(t => t.tags.includes(filterTag));
        return filtered;
    }, [tasks, searchQuery, filterStatus, filterPriority, filterProject, filterTag]);

    const rootTasks = activeTasks.filter(t => t.parentId === null);

    const handleStatusChange = (taskId: string, newStatus: TaskStatus) => {
        updateTask(taskId, { status: newStatus, progress: newStatus === 'done' ? 100 : undefined });
    };

    const handleToggleDone = (taskId: string, currentStatus: TaskStatus) => {
        const newStatus = currentStatus === 'done' ? 'todo' : 'done';
        updateTask(taskId, { status: newStatus, progress: newStatus === 'done' ? 100 : 0 });
        // Auto-complete parent if all siblings done, or revert if undone
        setTimeout(() => autoCompleteParent(taskId), 0);
    };

    const handleAddSubTask = (parentId: string) => {
        if (!newSubTaskTitle.trim()) return;
        const parent = tasks.find(t => t.id === parentId);
        addTask({
            title: newSubTaskTitle.trim(),
            description: '',
            status: 'todo',
            priority: parent?.priority || 'medium',
            projectId: parent?.projectId || null,
            parentId: parentId,
            dueDate: null,
            startDate: null,
            tags: [],
            progress: 0,
            estimatedHours: null,
            actualHours: null,
            repeatRule: 'none',
            dependsOn: null,
        });
        setNewSubTaskTitle('');
        setAddingSubTaskParentId(null);
    };

    // ===== KANBAN VIEW =====
    const KanbanView = () => {
        const columns: TaskStatus[] = ['todo', 'in-progress', 'waiting', 'done'];
        return (
            <>
                {/* Desktop: horizontal scroll */}
                <div className="hidden md:flex gap-4 overflow-x-auto pb-4">
                    {columns.map(status => {
                        const columnTasks = rootTasks.filter(t => t.status === status);
                        return (
                            <div key={status} className="flex-shrink-0 w-80 lg:flex-1 min-w-[280px]">
                                <div className="flex items-center gap-2 mb-3 px-1">
                                    <span className={cn('w-2.5 h-2.5 rounded-full', STATUS_COLORS[status])} />
                                    <h3 className="text-sm font-semibold">{TASK_STATUS_LABELS[status]}</h3>
                                    <Badge>{columnTasks.length}</Badge>
                                </div>
                                <div className="space-y-2.5 min-h-[200px]">
                                    {columnTasks.map(task => (
                                        <TaskCard key={task.id} task={task} onEdit={(t) => router.push(`/gorevler/${t.id}`)} onStatusChange={handleStatusChange} />
                                    ))}
                                    {columnTasks.length === 0 && (
                                        <div className="border-2 border-dashed border-gray-200 dark:border-gray-800 rounded-xl p-6 text-center text-xs text-gray-400">
                                            Görev yok
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
                {/* Mobile: stacked columns */}
                <div className="md:hidden space-y-4">
                    {columns.map(status => {
                        const columnTasks = rootTasks.filter(t => t.status === status);
                        if (columnTasks.length === 0) return null;
                        return (
                            <div key={status}>
                                <div className="flex items-center gap-2 mb-2 px-1">
                                    <span className={cn('w-2.5 h-2.5 rounded-full', STATUS_COLORS[status])} />
                                    <h3 className="text-sm font-semibold">{TASK_STATUS_LABELS[status]}</h3>
                                    <Badge>{columnTasks.length}</Badge>
                                </div>
                                <div className="space-y-2">
                                    {columnTasks.map(task => (
                                        <TaskCard key={task.id} task={task} onEdit={(t) => router.push(`/gorevler/${t.id}`)} onStatusChange={handleStatusChange} />
                                    ))}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </>
        );
    };

    // ===== LIST VIEW =====
    const ListView = () => {
        const tree = buildTaskTree(activeTasks, null);
        return (
            <div className="space-y-1">
                {tree.length === 0 && <EmptyState icon={<List size={32} className="text-gray-400" />} title="Görev bulunamadı" description="Yeni bir görev ekleyerek başlayın" />}
                {tree.map(node => (
                    <ListItem key={node.id} node={node} depth={0} />
                ))}
            </div>
        );
    };

    const ListItem = ({ node, depth }: { node: TaskTreeNode; depth: number }) => {
        const [expanded, setExpanded] = useState(true);
        const progress = calculateProgressRecursive(node.id, tasks);
        const cls = classifyDueDate(node.dueDate);
        const doneCount = node.children.filter(c => c.status === 'done').length;
        const totalChildren = node.children.length;

        return (
            <div>
                <div
                    className={cn(
                        'flex items-center gap-2 py-2 px-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors group',
                        depth > 0 && 'ml-6'
                    )}
                >
                    {node.children.length > 0 ? (
                        <button onClick={() => setExpanded(!expanded)} className="p-0.5">
                            {expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                        </button>
                    ) : <span className="w-5" />}
                    {/* Checkbox */}
                    <button
                        onClick={() => handleToggleDone(node.id, node.status)}
                        className="flex-shrink-0"
                    >
                        {node.status === 'done' ? (
                            <div className="w-5 h-5 rounded-md bg-emerald-500 flex items-center justify-center">
                                <CheckCircle2 size={14} className="text-white" />
                            </div>
                        ) : (
                            <div className="w-5 h-5 rounded-md border-2 border-gray-300 dark:border-gray-600 hover:border-[rgb(var(--accent-400))] transition-colors" />
                        )}
                    </button>
                    <span className={cn('flex-1 text-sm truncate', node.status === 'done' && 'line-through opacity-50')}>{node.title}</span>
                    <div className="hidden md:flex items-center gap-2">
                        {node.tags.slice(0, 2).map(tag => <Badge key={tag} variant="purple">{tag}</Badge>)}
                        {node.dueDate && <Badge className={getDueDateBgColor(cls)}>{getDueDateLabel(cls)}</Badge>}
                        <span className={cn('text-xs font-medium', PRIORITY_COLORS[node.priority])}>
                            {TASK_PRIORITY_LABELS[node.priority]}
                        </span>
                    </div>
                    {totalChildren > 0 && (
                        <span className="text-[10px] text-gray-400 hidden md:inline">{doneCount}/{totalChildren}</span>
                    )}
                    <div className="w-16 hidden md:block">
                        <ProgressBar value={progress} size="xs" />
                    </div>
                    {/* Add sub-task */}
                    <button
                        onClick={(e) => { e.stopPropagation(); setAddingSubTaskParentId(node.id); setNewSubTaskTitle(''); }}
                        className="opacity-0 group-hover:opacity-100 p-1 hover:bg-[rgb(var(--accent-500)/0.1)] rounded-lg transition-all"
                        title="Alt görev ekle"
                    >
                        <Plus size={14} className="text-[rgb(var(--accent-400))]" />
                    </button>
                    <button onClick={() => setEditingTask(node)} className="opacity-0 group-hover:opacity-100 p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-all">
                        <Edit2 size={14} />
                    </button>
                </div>
                {expanded && node.children.map(child => (
                    <ListItem key={child.id} node={child} depth={depth + 1} />
                ))}
                {/* Inline add sub-task input */}
                {expanded && addingSubTaskParentId === node.id && (
                    <div className={cn('flex items-center gap-2 py-1.5 px-3', depth > 0 ? 'ml-12' : 'ml-6')}>
                        <span className="w-5" />
                        <div className="w-5 h-5 rounded-md border-2 border-dashed border-[rgb(var(--accent-400)/0.5)] flex items-center justify-center">
                            <Plus size={10} className="text-[rgb(var(--accent-400))]" />
                        </div>
                        <input
                            type="text"
                            value={newSubTaskTitle}
                            onChange={e => setNewSubTaskTitle(e.target.value)}
                            onKeyDown={e => {
                                if (e.key === 'Enter') handleAddSubTask(node.id);
                                if (e.key === 'Escape') setAddingSubTaskParentId(null);
                            }}
                            className="flex-1 bg-transparent border-b border-[rgb(var(--accent-400)/0.3)] text-sm py-1 outline-none placeholder:text-gray-400 focus:border-[rgb(var(--accent-500))]"
                            placeholder="Alt görev adı yazın, Enter'a basın..."
                            autoFocus
                        />
                        <button onClick={() => handleAddSubTask(node.id)} className="text-xs text-[rgb(var(--accent-400))] hover:text-[rgb(var(--accent-300))] font-medium">Ekle</button>
                        <button onClick={() => setAddingSubTaskParentId(null)} className="text-xs text-gray-400 hover:text-gray-300">İptal</button>
                    </div>
                )}
            </div>
        );
    };

    // ===== TREE VIEW =====
    const TreeView = () => {
        const tree = buildTaskTree(activeTasks, null);
        return (
            <div className="space-y-1 bg-white dark:bg-gray-900/50 rounded-2xl border border-gray-200 dark:border-gray-800 p-4">
                {tree.length === 0 && <EmptyState icon={<GitBranch size={32} className="text-gray-400" />} title="Görev ağacı boş" description="Hiyerarşik görevler ekleyin" />}
                {tree.map(node => (
                    <TreeNode key={node.id} node={node} depth={0} />
                ))}
            </div>
        );
    };

    const TreeNode = ({ node, depth }: { node: TaskTreeNode; depth: number }) => {
        const [expanded, setExpanded] = useState(depth < 2);
        const [showActions, setShowActions] = useState(false);
        const progress = calculateProgressRecursive(node.id, tasks);
        const project = projects.find(p => p.id === node.projectId);
        const doneCount = node.children.filter(c => c.status === 'done').length;
        const totalChildren = node.children.length;

        return (
            <div>
                <div
                    className={cn('flex items-center gap-2 py-2 px-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/40 group transition-colors')}
                    style={{ paddingLeft: `${depth * 24 + 8}px` }}
                >
                    {/* Expand/Collapse */}
                    {node.children.length > 0 ? (
                        <button onClick={() => setExpanded(!expanded)} className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded">
                            {expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                        </button>
                    ) : <span className="w-7" />}

                    {/* Checkbox */}
                    <button
                        onClick={() => handleToggleDone(node.id, node.status)}
                        className="flex-shrink-0"
                    >
                        {node.status === 'done' ? (
                            <div className="w-5 h-5 rounded-md bg-emerald-500 flex items-center justify-center transition-all">
                                <CheckCircle2 size={14} className="text-white" />
                            </div>
                        ) : (
                            <div className={cn(
                                'w-5 h-5 rounded-md border-2 transition-all',
                                node.status === 'in-progress' ? 'border-blue-400 bg-blue-400/20' :
                                    node.status === 'waiting' ? 'border-amber-400 bg-amber-400/20' :
                                        'border-gray-300 dark:border-gray-600 hover:border-[rgb(var(--accent-400))]'
                            )} />
                        )}
                    </button>

                    {/* Title */}
                    <span className={cn('flex-1 text-sm', node.status === 'done' && 'line-through opacity-50')}>
                        {node.title}
                    </span>

                    {/* Sub-task count */}
                    {totalChildren > 0 && (
                        <span className="text-[10px] text-gray-400 tabular-nums">{doneCount}/{totalChildren}</span>
                    )}

                    {/* Meta */}
                    <div className="hidden md:flex items-center gap-2">
                        {project && (
                            <span className="text-[10px] px-2 py-0.5 rounded-md" style={{ backgroundColor: project.color + '20', color: project.color }}>
                                {project.name}
                            </span>
                        )}
                        <span className="text-xs text-gray-400">%{progress}</span>
                    </div>

                    {/* Progress bar */}
                    <div className="w-16 hidden md:block">
                        <ProgressBar
                            value={progress}
                            size="xs"
                            color={progress >= 100 ? 'bg-emerald-500' : progress >= 50 ? 'bg-blue-500' : undefined}
                        />
                    </div>

                    {/* Add sub-task button */}
                    <button
                        onClick={() => { setAddingSubTaskParentId(node.id); setNewSubTaskTitle(''); }}
                        className="opacity-0 group-hover:opacity-100 p-1 hover:bg-[rgb(var(--accent-500)/0.1)] rounded-lg transition-all"
                        title="Alt görev ekle"
                    >
                        <Plus size={14} className="text-[rgb(var(--accent-400))]" />
                    </button>

                    {/* Actions */}
                    <div className="relative">
                        <button
                            onClick={() => setShowActions(!showActions)}
                            className="opacity-0 group-hover:opacity-100 p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-all"
                        >
                            <MoreHorizontal size={14} />
                        </button>
                        {showActions && (
                            <>
                                <div className="fixed inset-0 z-10" onClick={() => setShowActions(false)} />
                                <div className="absolute right-0 top-8 z-20 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl py-1 w-44">
                                    <button onClick={() => { setEditingTask(node); setShowActions(false); }} className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-700"><Edit2 size={14} /> Düzenle</button>
                                    <button onClick={() => { archiveTask(node.id); setShowActions(false); }} className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-700"><Archive size={14} /> Arşivle</button>
                                    <button onClick={() => { deleteTask(node.id); setShowActions(false); }} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-400 hover:bg-red-500/10"><Trash2 size={14} /> Sil</button>
                                </div>
                            </>
                        )}
                    </div>
                </div>

                {/* Children */}
                {expanded && node.children.map(child => (
                    <TreeNode key={child.id} node={child} depth={depth + 1} />
                ))}

                {/* Inline add sub-task */}
                {expanded && addingSubTaskParentId === node.id && (
                    <div
                        className="flex items-center gap-2 py-1.5 px-2 rounded-lg animate-in"
                        style={{ paddingLeft: `${(depth + 1) * 24 + 8}px` }}
                    >
                        <span className="w-7" />
                        <div className="w-5 h-5 rounded-md border-2 border-dashed border-[rgb(var(--accent-400)/0.5)] flex items-center justify-center flex-shrink-0">
                            <Plus size={10} className="text-[rgb(var(--accent-400))]" />
                        </div>
                        <input
                            type="text"
                            value={newSubTaskTitle}
                            onChange={e => setNewSubTaskTitle(e.target.value)}
                            onKeyDown={e => {
                                if (e.key === 'Enter') handleAddSubTask(node.id);
                                if (e.key === 'Escape') setAddingSubTaskParentId(null);
                            }}
                            className="flex-1 bg-transparent border-b border-[rgb(var(--accent-400)/0.3)] text-sm py-1 outline-none placeholder:text-gray-400 focus:border-[rgb(var(--accent-500))]"
                            placeholder="Alt görev adı yazın, Enter'a basın..."
                            autoFocus
                        />
                        <button onClick={() => handleAddSubTask(node.id)} className="text-xs text-[rgb(var(--accent-400))] hover:text-[rgb(var(--accent-300))] font-medium px-2 py-1 rounded-lg hover:bg-[rgb(var(--accent-500)/0.1)]">Ekle</button>
                        <button onClick={() => setAddingSubTaskParentId(null)} className="text-xs text-gray-400 hover:text-gray-300 px-2 py-1">İptal</button>
                    </div>
                )}
            </div>
        );
    };

    // ===== CALENDAR VIEW =====
    const CalendarView = () => {
        const now = new Date();
        const [calMonth, setCalMonth] = useState(now.getMonth());
        const [calYear, setCalYear] = useState(now.getFullYear());

        const firstDay = new Date(calYear, calMonth, 1).getDay();
        const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
        const monthNames = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];
        const dayNames = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'];

        const adjustedFirstDay = firstDay === 0 ? 6 : firstDay - 1;

        const getTasksForDay = (day: number) => {
            const dateStr = `${calYear}-${String(calMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            return activeTasks.filter(t => t.dueDate === dateStr);
        };

        return (
            <Card className="p-4 md:p-5">
                <div className="flex items-center justify-between mb-4">
                    <button onClick={() => { if (calMonth === 0) { setCalMonth(11); setCalYear(y => y - 1); } else setCalMonth(m => m - 1); }} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl">
                        <ChevronRight size={16} className="rotate-180" />
                    </button>
                    <h3 className="text-sm font-semibold">{monthNames[calMonth]} {calYear}</h3>
                    <button onClick={() => { if (calMonth === 11) { setCalMonth(0); setCalYear(y => y + 1); } else setCalMonth(m => m + 1); }} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl">
                        <ChevronRight size={16} />
                    </button>
                </div>
                <div className="grid grid-cols-7 gap-px">
                    {dayNames.map(d => (
                        <div key={d} className="text-center text-xs text-gray-400 py-2 font-medium">{d}</div>
                    ))}
                    {Array.from({ length: adjustedFirstDay }).map((_, i) => <div key={`e-${i}`} />)}
                    {Array.from({ length: daysInMonth }).map((_, i) => {
                        const day = i + 1;
                        const dayTasks = getTasksForDay(day);
                        const isToday = day === now.getDate() && calMonth === now.getMonth() && calYear === now.getFullYear();
                        return (
                            <div
                                key={day}
                                className={cn(
                                    'min-h-[60px] md:min-h-[80px] p-1 border border-gray-100 dark:border-gray-800/50 rounded-lg',
                                    isToday && 'bg-[rgb(var(--accent-500)/0.1)] border-[rgb(var(--accent-500)/0.3)]'
                                )}
                            >
                                <span className={cn('text-xs font-medium', isToday ? 'text-[rgb(var(--accent-400))]' : 'text-gray-500')}>{day}</span>
                                <div className="space-y-0.5 mt-0.5">
                                    {dayTasks.slice(0, 2).map(t => (
                                        <div
                                            key={t.id}
                                            className={cn('text-[9px] md:text-[10px] px-1 py-0.5 rounded truncate cursor-pointer',
                                                t.priority === 'high' ? 'bg-red-500/20 text-red-400' :
                                                    t.priority === 'medium' ? 'bg-amber-500/20 text-amber-400' :
                                                        'bg-blue-500/20 text-blue-400'
                                            )}
                                            onClick={() => setEditingTask(t)}
                                        >
                                            {t.title}
                                        </div>
                                    ))}
                                    {dayTasks.length > 2 && (
                                        <span className="text-[9px] text-gray-400">+{dayTasks.length - 2} daha</span>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </Card>
        );
    };

    return (
        <div className="space-y-4 md:space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between gap-3">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold">Görevler</h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-0.5 text-sm">{activeTasks.length} aktif görev</p>
                </div>
                <Button size="sm" onClick={() => setShowForm(true)}><Plus size={16} /> Yeni Görev</Button>
            </div>

            {/* View Toggle + Search */}
            <div className="flex flex-col md:flex-row gap-3">
                <div className="flex gap-1 p-1 bg-gray-100 dark:bg-gray-800/80 rounded-xl">
                    {([
                        { mode: 'kanban' as ViewMode, icon: LayoutGrid, label: 'Kanban' },
                        { mode: 'list' as ViewMode, icon: List, label: 'Liste' },
                        { mode: 'tree' as ViewMode, icon: GitBranch, label: 'Ağaç' },
                        { mode: 'calendar' as ViewMode, icon: CalendarDays, label: 'Takvim' },
                    ]).map(v => (
                        <button
                            key={v.mode}
                            onClick={() => setViewMode(v.mode)}
                            className={cn(
                                'flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all',
                                viewMode === v.mode ? 'bg-white dark:bg-gray-700 shadow-sm text-[rgb(var(--accent-600))] dark:text-[rgb(var(--accent-400))]' : 'text-gray-500'
                            )}
                        >
                            <v.icon size={14} /><span className="hidden md:inline">{v.label}</span>
                        </button>
                    ))}
                </div>

                <div className="flex-1 flex gap-2">
                    <div className="relative flex-1">
                        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 text-sm outline-none focus:ring-2 focus:ring-[rgb(var(--accent-500))]"
                            placeholder="Görev ara..."
                        />
                    </div>
                    <button
                        onClick={() => setShowFilters(!showFilters)}
                        className={cn('p-2.5 rounded-xl border transition-colors', showFilters ? 'border-[rgb(var(--accent-500))] bg-[rgb(var(--accent-500)/0.1)] text-[rgb(var(--accent-400))]' : 'border-gray-200 dark:border-gray-700 text-gray-400')}
                    >
                        <Filter size={16} />
                    </button>
                </div>
            </div>

            {/* Filters */}
            {showFilters && (
                <div className="flex flex-wrap gap-2 p-3 bg-gray-50 dark:bg-gray-800/30 rounded-xl">
                    <select value={filterStatus} onChange={e => setFilterStatus(e.target.value as TaskStatus)} className="px-3 py-1.5 rounded-lg text-xs bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                        <option value="">Tüm Durumlar</option>
                        {Object.entries(TASK_STATUS_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                    </select>
                    <select value={filterPriority} onChange={e => setFilterPriority(e.target.value)} className="px-3 py-1.5 rounded-lg text-xs bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                        <option value="">Tüm Öncelikler</option>
                        {Object.entries(TASK_PRIORITY_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                    </select>
                    <select value={filterProject} onChange={e => setFilterProject(e.target.value)} className="px-3 py-1.5 rounded-lg text-xs bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                        <option value="">Tüm Projeler</option>
                        {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                    <select value={filterTag} onChange={e => setFilterTag(e.target.value)} className="px-3 py-1.5 rounded-lg text-xs bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                        <option value="">Tüm Etiketler</option>
                        {TASK_TAGS.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                </div>
            )}

            {/* View Content */}
            {viewMode === 'kanban' && <KanbanView />}
            {viewMode === 'list' && <ListView />}
            {viewMode === 'tree' && <TreeView />}
            {viewMode === 'calendar' && <CalendarView />}

            {/* Modals */}
            {showForm && <TaskFormModal onClose={() => setShowForm(false)} />}
            {editingTask && <TaskFormModal editTask={editingTask} onClose={() => setEditingTask(null)} />}
        </div>
    );
}

// ===== TASK CARD (Kanban) =====
function TaskCard({ task, onEdit, onStatusChange }: {
    task: Task;
    onEdit: (t: Task) => void;
    onStatusChange: (id: string, status: TaskStatus) => void;
}) {
    const tasks = useStore(s => s.tasks);
    const projects = useStore(s => s.projects);
    const childCount = tasks.filter(t => t.parentId === task.id && !t.archived).length;
    const progress = calculateProgressRecursive(task.id, tasks);
    const cls = classifyDueDate(task.dueDate);
    const project = projects.find(p => p.id === task.projectId);

    return (
        <Card className="p-3 md:p-3.5 hover:border-[rgb(var(--accent-500)/0.3)] group overflow-hidden" onClick={() => onEdit(task)}>
            <div className="flex items-start justify-between gap-2 mb-1.5">
                <div className="flex items-center gap-1.5 flex-1 min-w-0 overflow-hidden">
                    {project && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded-md flex-shrink-0 truncate max-w-[100px]" style={{ backgroundColor: project.color + '20', color: project.color }}>
                            {project.name}
                        </span>
                    )}
                </div>
                <span className={cn('text-xs font-bold flex-shrink-0', PRIORITY_COLORS[task.priority])}>
                    {task.priority === 'high' ? '↑' : task.priority === 'medium' ? '→' : '↓'}
                </span>
            </div>
            <h4 className={cn('text-sm font-medium mb-1.5 truncate', task.status === 'done' && 'line-through opacity-50')}>{task.title}</h4>

            {task.description && <p className="text-xs text-gray-400 mb-1.5 line-clamp-2">{task.description}</p>}

            <div className="flex items-center gap-1.5 flex-wrap mb-1.5">
                {task.tags.slice(0, 2).map(tag => <Badge key={tag} variant="purple">{tag}</Badge>)}
                {task.dueDate && <Badge className={getDueDateBgColor(cls)}>{getDueDateLabel(cls)}</Badge>}
            </div>

            <div className="flex items-center gap-2">
                <ProgressBar value={progress} size="xs" />
                <span className="text-[10px] text-gray-400 flex-shrink-0">%{progress}</span>
            </div>

            {childCount > 0 && (
                <p className="text-[10px] text-gray-400 mt-1.5">{childCount} alt görev</p>
            )}
        </Card>
    );
}
