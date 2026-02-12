'use client';

import React, { useState } from 'react';
import Modal, { Button } from '@/components/ui/SharedUI';
import { useStore } from '@/lib/store';
import { NoteImportance, TASK_TAGS } from '@/lib/types';

interface NoteFormModalProps {
    onClose: () => void;
    editNote?: { id: string; title: string; content: string; tags: string[]; importance: NoteImportance; pinned: boolean };
}

export default function NoteFormModal({ onClose, editNote }: NoteFormModalProps) {
    const { addNote, updateNote } = useStore();
    const [form, setForm] = useState({
        title: editNote?.title || '',
        content: editNote?.content || '',
        tags: editNote?.tags || [] as string[],
        importance: editNote?.importance || 'medium' as NoteImportance,
        pinned: editNote?.pinned || false,
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.title.trim()) return;

        if (editNote) {
            updateNote(editNote.id, form);
        } else {
            addNote(form);
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
        <Modal isOpen={true} onClose={onClose} title={editNote ? 'Notu Düzenle' : 'Yeni Not'}>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium mb-1.5 text-gray-600 dark:text-gray-400">Başlık *</label>
                    <input
                        type="text"
                        value={form.title}
                        onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 focus:ring-2 focus:ring-[rgb(var(--accent-500))] outline-none text-sm"
                        placeholder="Not başlığı..."
                        autoFocus
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium mb-1.5 text-gray-600 dark:text-gray-400">İçerik</label>
                    <textarea
                        value={form.content}
                        onChange={e => setForm(f => ({ ...f, content: e.target.value }))}
                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 focus:ring-2 focus:ring-[rgb(var(--accent-500))] outline-none text-sm resize-none"
                        rows={6}
                        placeholder="Notunuzu yazın..."
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium mb-1.5 text-gray-600 dark:text-gray-400">Önem</label>
                    <select
                        value={form.importance}
                        onChange={e => setForm(f => ({ ...f, importance: e.target.value as NoteImportance }))}
                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 focus:ring-2 focus:ring-[rgb(var(--accent-500))] outline-none text-sm"
                    >
                        <option value="low">Düşük</option>
                        <option value="medium">Orta</option>
                        <option value="high">Yüksek</option>
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium mb-1.5 text-gray-600 dark:text-gray-400">Etiketler</label>
                    <div className="flex flex-wrap gap-2">
                        {TASK_TAGS.map(tag => (
                            <button
                                key={tag}
                                type="button"
                                onClick={() => toggleTag(tag)}
                                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${form.tags.includes(tag) ? 'bg-[rgb(var(--accent-500)/0.2)] text-[rgb(var(--accent-400))] ring-1 ring-[rgb(var(--accent-500))]/40' : 'bg-gray-100 dark:bg-gray-800 text-gray-500'
                                    }`}
                            >
                                {tag}
                            </button>
                        ))}
                    </div>
                </div>
                <label className="flex items-center gap-2 cursor-pointer">
                    <input
                        type="checkbox"
                        checked={form.pinned}
                        onChange={e => setForm(f => ({ ...f, pinned: e.target.checked }))}
                        className="w-4 h-4 rounded accent-violet-500"
                    />
                    <span className="text-sm text-gray-600 dark:text-gray-400">Sabitle (Pin)</span>
                </label>
                <div className="flex gap-3 pt-2">
                    <Button variant="secondary" onClick={onClose} className="flex-1">İptal</Button>
                    <Button type="submit" className="flex-1">{editNote ? 'Güncelle' : 'Oluştur'}</Button>
                </div>
            </form>
        </Modal>
    );
}
