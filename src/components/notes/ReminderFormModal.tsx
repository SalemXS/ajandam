'use client';

import React, { useState } from 'react';
import Modal, { Button } from '@/components/ui/SharedUI';
import { useStore } from '@/lib/store';
import { RepeatRule } from '@/lib/types';
import { format } from 'date-fns';

interface ReminderFormModalProps {
    onClose: () => void;
    editReminder?: { id: string; title: string; datetime: string; repeatRule: RepeatRule; completed: boolean };
}

export default function ReminderFormModal({ onClose, editReminder }: ReminderFormModalProps) {
    const { addReminder, updateReminder } = useStore();
    const [form, setForm] = useState({
        title: editReminder?.title || '',
        date: editReminder ? editReminder.datetime.split('T')[0] : format(new Date(), 'yyyy-MM-dd'),
        time: editReminder ? editReminder.datetime.split('T')[1]?.substring(0, 5) || '09:00' : '09:00',
        repeatRule: editReminder?.repeatRule || 'none' as RepeatRule,
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.title.trim()) return;

        const datetime = `${form.date}T${form.time}:00`;

        if (editReminder) {
            updateReminder(editReminder.id, { title: form.title, datetime, repeatRule: form.repeatRule });
        } else {
            addReminder({ title: form.title, datetime, repeatRule: form.repeatRule, linkedType: null, linkedId: null, completed: false });
        }
        onClose();
    };

    return (
        <Modal isOpen={true} onClose={onClose} title={editReminder ? 'Hatırlatma Düzenle' : 'Yeni Hatırlatma'}>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium mb-1.5 text-gray-600 dark:text-gray-400">Başlık *</label>
                    <input
                        type="text"
                        value={form.title}
                        onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 focus:ring-2 focus:ring-[rgb(var(--accent-500))] outline-none text-sm"
                        placeholder="Hatırlatma başlığı..."
                        autoFocus
                    />
                </div>
                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <label className="block text-sm font-medium mb-1.5 text-gray-600 dark:text-gray-400">Tarih</label>
                        <input
                            type="date"
                            value={form.date}
                            onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
                            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 focus:ring-2 focus:ring-[rgb(var(--accent-500))] outline-none text-sm"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1.5 text-gray-600 dark:text-gray-400">Saat</label>
                        <input
                            type="time"
                            value={form.time}
                            onChange={e => setForm(f => ({ ...f, time: e.target.value }))}
                            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 focus:ring-2 focus:ring-[rgb(var(--accent-500))] outline-none text-sm"
                        />
                    </div>
                </div>
                <div>
                    <label className="block text-sm font-medium mb-1.5 text-gray-600 dark:text-gray-400">Tekrar</label>
                    <select
                        value={form.repeatRule}
                        onChange={e => setForm(f => ({ ...f, repeatRule: e.target.value as RepeatRule }))}
                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 focus:ring-2 focus:ring-[rgb(var(--accent-500))] outline-none text-sm"
                    >
                        <option value="none">Tekrar etme</option>
                        <option value="daily">Günlük</option>
                        <option value="weekly">Haftalık</option>
                        <option value="monthly">Aylık</option>
                    </select>
                </div>
                <div className="flex gap-3 pt-2">
                    <Button variant="secondary" onClick={onClose} className="flex-1">İptal</Button>
                    <Button type="submit" className="flex-1">{editReminder ? 'Güncelle' : 'Oluştur'}</Button>
                </div>
            </form>
        </Modal>
    );
}
