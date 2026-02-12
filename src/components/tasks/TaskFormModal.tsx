'use client';

import React, { useState } from 'react';
import Modal from '@/components/ui/SharedUI';
import { Button } from '@/components/ui/SharedUI';
import { useStore } from '@/lib/store';
import { TaskStatus, TaskPriority, TASK_STATUS_LABELS, TASK_PRIORITY_LABELS, TASK_TAGS } from '@/lib/types';

interface TaskFormModalProps {
    onClose: () => void;
    editTask?: { id: string; title: string; description: string; status: TaskStatus; priority: TaskPriority; tags: string[]; projectId: string | null; parentId: string | null; startDate: string | null; dueDate: string | null; estimatedHours: number | null; progress: number; repeatRule: string };
}

export default function TaskFormModal({ onClose, editTask }: TaskFormModalProps) {
    const { projects, addTask, updateTask } = useStore();
    const [form, setForm] = useState({
        title: editTask?.title || '',
        description: editTask?.description || '',
        status: editTask?.status || 'todo' as TaskStatus,
        priority: editTask?.priority || 'medium' as TaskPriority,
        tags: editTask?.tags || [] as string[],
        projectId: editTask?.projectId || '',
        parentId: editTask?.parentId || null as string | null,
        startDate: editTask?.startDate || '',
        dueDate: editTask?.dueDate || '',
        estimatedHours: editTask?.estimatedHours?.toString() || '',
        progress: editTask?.progress || 0,
        repeatRule: editTask?.repeatRule || 'none',
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.title.trim()) return;

        const taskData = {
            title: form.title.trim(),
            description: form.description.trim(),
            status: form.status,
            priority: form.priority,
            tags: form.tags,
            projectId: form.projectId || null,
            parentId: form.parentId,
            startDate: form.startDate || null,
            dueDate: form.dueDate || null,
            estimatedHours: form.estimatedHours ? parseFloat(form.estimatedHours) : null,
            actualHours: null,
            progress: form.progress,
            repeatRule: form.repeatRule as 'none' | 'daily' | 'weekly' | 'monthly',
            dependsOn: null,
        };

        if (editTask) {
            updateTask(editTask.id, taskData);
        } else {
            addTask(taskData);
        }
        onClose();
    };

    const toggleTag = (tag: string) => {
        setForm(f => ({
            ...f,
            tags: f.tags.includes(tag) ? f.tags.filter(t => t !== tag) : [...f.tags, tag],
        }));
    };

    return (
        <Modal isOpen={true} onClose={onClose} title={editTask ? 'Görevi Düzenle' : 'Yeni Görev'} size="lg">
            <form onSubmit={handleSubmit} className="space-y-4">
                {/* Title */}
                <div>
                    <label className="block text-sm font-medium mb-1.5 text-gray-600 dark:text-gray-400">Başlık *</label>
                    <input
                        type="text"
                        value={form.title}
                        onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 focus:ring-2 focus:ring-[rgb(var(--accent-500))] outline-none transition text-sm"
                        placeholder="Görev başlığı girin..."
                        autoFocus
                    />
                </div>

                {/* Description */}
                <div>
                    <label className="block text-sm font-medium mb-1.5 text-gray-600 dark:text-gray-400">Açıklama</label>
                    <textarea
                        value={form.description}
                        onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 focus:ring-2 focus:ring-[rgb(var(--accent-500))] outline-none transition text-sm resize-none"
                        rows={3}
                        placeholder="Detaylı açıklama..."
                    />
                </div>

                {/* Status & Priority */}
                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <label className="block text-sm font-medium mb-1.5 text-gray-600 dark:text-gray-400">Durum</label>
                        <select
                            value={form.status}
                            onChange={e => setForm(f => ({ ...f, status: e.target.value as TaskStatus }))}
                            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 focus:ring-2 focus:ring-[rgb(var(--accent-500))] outline-none text-sm"
                        >
                            {Object.entries(TASK_STATUS_LABELS).map(([k, v]) => (
                                <option key={k} value={k}>{v}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1.5 text-gray-600 dark:text-gray-400">Öncelik</label>
                        <select
                            value={form.priority}
                            onChange={e => setForm(f => ({ ...f, priority: e.target.value as TaskPriority }))}
                            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 focus:ring-2 focus:ring-[rgb(var(--accent-500))] outline-none text-sm"
                        >
                            {Object.entries(TASK_PRIORITY_LABELS).map(([k, v]) => (
                                <option key={k} value={k}>{v}</option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Project */}
                <div>
                    <label className="block text-sm font-medium mb-1.5 text-gray-600 dark:text-gray-400">Proje</label>
                    <select
                        value={form.projectId}
                        onChange={e => setForm(f => ({ ...f, projectId: e.target.value }))}
                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 focus:ring-2 focus:ring-[rgb(var(--accent-500))] outline-none text-sm"
                    >
                        <option value="">Proje seçin (opsiyonel)</option>
                        {projects.map(p => (
                            <option key={p.id} value={p.id}>{p.name}</option>
                        ))}
                    </select>
                </div>

                {/* Dates */}
                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <label className="block text-sm font-medium mb-1.5 text-gray-600 dark:text-gray-400">Başlangıç Tarihi</label>
                        <input
                            type="date"
                            value={form.startDate}
                            onChange={e => setForm(f => ({ ...f, startDate: e.target.value }))}
                            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 focus:ring-2 focus:ring-[rgb(var(--accent-500))] outline-none text-sm"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1.5 text-gray-600 dark:text-gray-400">Son Tarih</label>
                        <input
                            type="date"
                            value={form.dueDate}
                            onChange={e => setForm(f => ({ ...f, dueDate: e.target.value }))}
                            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 focus:ring-2 focus:ring-[rgb(var(--accent-500))] outline-none text-sm"
                        />
                    </div>
                </div>

                {/* Estimated Hours & Repeat */}
                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <label className="block text-sm font-medium mb-1.5 text-gray-600 dark:text-gray-400">Tahmini Süre (saat)</label>
                        <input
                            type="number"
                            min="0"
                            step="0.5"
                            value={form.estimatedHours}
                            onChange={e => setForm(f => ({ ...f, estimatedHours: e.target.value }))}
                            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 focus:ring-2 focus:ring-[rgb(var(--accent-500))] outline-none text-sm"
                            placeholder="0"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1.5 text-gray-600 dark:text-gray-400">Tekrar</label>
                        <select
                            value={form.repeatRule}
                            onChange={e => setForm(f => ({ ...f, repeatRule: e.target.value }))}
                            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 focus:ring-2 focus:ring-[rgb(var(--accent-500))] outline-none text-sm"
                        >
                            <option value="none">Tekrar etme</option>
                            <option value="daily">Günlük</option>
                            <option value="weekly">Haftalık</option>
                            <option value="monthly">Aylık</option>
                        </select>
                    </div>
                </div>

                {/* Progress */}
                <div>
                    <label className="block text-sm font-medium mb-1.5 text-gray-600 dark:text-gray-400">İlerleme: %{form.progress}</label>
                    <input
                        type="range"
                        min="0"
                        max="100"
                        value={form.progress}
                        onChange={e => setForm(f => ({ ...f, progress: parseInt(e.target.value) }))}
                        className="w-full accent-violet-500"
                    />
                </div>

                {/* Tags */}
                <div>
                    <label className="block text-sm font-medium mb-1.5 text-gray-600 dark:text-gray-400">Etiketler</label>
                    <div className="flex flex-wrap gap-2">
                        {TASK_TAGS.map(tag => (
                            <button
                                key={tag}
                                type="button"
                                onClick={() => toggleTag(tag)}
                                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${form.tags.includes(tag)
                                        ? 'bg-[rgb(var(--accent-500)/0.2)] text-[rgb(var(--accent-400))] ring-1 ring-[rgb(var(--accent-500))]/40'
                                        : 'bg-gray-100 dark:bg-gray-800 text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-700'
                                    }`}
                            >
                                {tag}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Actions */}
                <div className="flex gap-3 pt-2">
                    <Button variant="secondary" onClick={onClose} className="flex-1">İptal</Button>
                    <Button type="submit" className="flex-1">{editTask ? 'Güncelle' : 'Oluştur'}</Button>
                </div>
            </form>
        </Modal>
    );
}
