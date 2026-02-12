'use client';

import { create } from 'zustand';
import { AppState, Task, TaskNote, Project, Transaction, Goal, GoalTransaction, Note, Reminder, AppSettings } from './types';
import { generateId } from './utils';
import { fetchAllData, dbInsert, dbUpdate, dbDelete, dbUpsertSettings } from './db';
import { supabase } from './supabase';

const defaultSettings: AppSettings = {
    theme: 'dark',
    monthlyIncomeEstimate: 15000,
    notificationPreferences: { email: false, inApp: true },
    onboardingCompleted: false,
    accentPalette: 'violet',
    customPalettes: [],
};

// Get current user ID helper
const getUserId = async (): Promise<string | null> => {
    const { data: { user } } = await supabase.auth.getUser();
    return user?.id ?? null;
};

export const useStore = create<AppState & {
    initialized: boolean;
    initializeData: () => Promise<void>;
}>()((set, get) => ({
    projects: [],
    tasks: [],
    transactions: [],
    goals: [],
    goalTransactions: [],
    notes: [],
    reminders: [],
    taskNotes: [],
    settings: defaultSettings,
    initialized: false,

    // ===== INITIALIZE: Fetch all data from Supabase =====
    initializeData: async () => {
        const userId = await getUserId();
        if (!userId) return;

        try {
            const data = await fetchAllData(userId);
            set({
                projects: data.projects,
                tasks: data.tasks,
                transactions: data.transactions,
                goals: data.goals,
                goalTransactions: data.goalTransactions,
                taskNotes: data.taskNotes,
                notes: data.notes,
                reminders: data.reminders,
                settings: data.settings ? {
                    theme: (data.settings as Record<string, unknown>).theme as AppSettings['theme'] || defaultSettings.theme,
                    monthlyIncomeEstimate: (data.settings as Record<string, unknown>).monthlyIncomeEstimate as number || defaultSettings.monthlyIncomeEstimate,
                    notificationPreferences: {
                        email: (data.settings as Record<string, unknown>).notificationEmail as boolean || false,
                        inApp: (data.settings as Record<string, unknown>).notificationInApp as boolean || true,
                    },
                    onboardingCompleted: (data.settings as Record<string, unknown>).onboardingCompleted as boolean || false,
                    accentPalette: (data.settings as Record<string, unknown>).accentPalette as string || 'violet',
                    customPalettes: (() => {
                        const raw = (data.settings as Record<string, unknown>).customPalettes;
                        if (typeof raw === 'string') {
                            try { return JSON.parse(raw); } catch { return []; }
                        }
                        return Array.isArray(raw) ? raw : [];
                    })(),
                } : defaultSettings,
                initialized: true,
            });
        } catch (error) {
            console.error('Failed to initialize data from Supabase:', error);
            set({ initialized: true }); // Still mark as initialized so app doesn't hang
        }
    },

    // ===== PROJECT ACTIONS =====
    addProject: (data) => {
        const tempId = generateId();
        const now = new Date().toISOString();
        const project = { ...data, id: tempId, createdAt: now, updatedAt: now };
        set((s) => ({ projects: [...s.projects, project] }));
        // Async DB insert
        getUserId().then(userId => {
            if (!userId) return;
            dbInsert('projects', { ...data, userId }).then(result => {
                // Update with real DB id
                set((s) => ({
                    projects: s.projects.map(p => p.id === tempId ? { ...p, id: result.id as string } : p),
                }));
            }).catch(console.error);
        });
    },
    updateProject: (id, data) => {
        set((s) => ({
            projects: s.projects.map(p => p.id === id ? { ...p, ...data, updatedAt: new Date().toISOString() } : p),
        }));
        dbUpdate('projects', id, data).catch(console.error);
    },
    deleteProject: (id) => {
        set((s) => ({
            projects: s.projects.filter(p => p.id !== id),
            tasks: s.tasks.filter(t => t.projectId !== id),
        }));
        dbDelete('projects', id).catch(console.error);
    },

    // ===== TASK ACTIONS =====
    addTask: (data) => {
        const tasks = get().tasks;
        const maxOrder = tasks.filter(t => t.parentId === data.parentId).reduce((max, t) => Math.max(max, t.orderIndex), -1);
        const tempId = generateId();
        const now = new Date().toISOString();
        const task = {
            ...data, id: tempId, archived: false,
            orderIndex: maxOrder + 1, createdAt: now, updatedAt: now,
        };
        set((s) => ({ tasks: [...s.tasks, task] }));
        getUserId().then(userId => {
            if (!userId) return;
            dbInsert('tasks', { ...data, userId, archived: false, orderIndex: maxOrder + 1 }).then(result => {
                set((s) => ({
                    tasks: s.tasks.map(t => t.id === tempId ? { ...t, id: result.id as string } : t),
                }));
            }).catch(console.error);
        });
    },
    updateTask: (id, data) => {
        set((s) => ({
            tasks: s.tasks.map(t => t.id === id ? { ...t, ...data, updatedAt: new Date().toISOString() } : t),
        }));
        dbUpdate('tasks', id, data).catch(console.error);
    },
    deleteTask: (id) => {
        const allTasks = get().tasks;
        const getDescIds = (tid: string): string[] => {
            const children = allTasks.filter(t => t.parentId === tid);
            return children.flatMap(c => [c.id, ...getDescIds(c.id)]);
        };
        const toDelete = new Set([id, ...getDescIds(id)]);
        set((s) => ({ tasks: s.tasks.filter(t => !toDelete.has(t.id)) }));
        // Delete from DB (cascade will handle children due to FK)
        dbDelete('tasks', id).catch(console.error);
    },
    archiveTask: (id) => {
        set((s) => ({
            tasks: s.tasks.map(t => t.id === id ? { ...t, archived: true, updatedAt: new Date().toISOString() } : t),
        }));
        dbUpdate('tasks', id, { archived: true }).catch(console.error);
    },
    restoreTask: (id) => {
        set((s) => ({
            tasks: s.tasks.map(t => t.id === id ? { ...t, archived: false, updatedAt: new Date().toISOString() } : t),
        }));
        dbUpdate('tasks', id, { archived: false }).catch(console.error);
    },
    moveTask: (taskId, newParentId) => {
        set((s) => ({
            tasks: s.tasks.map(t => t.id === taskId ? { ...t, parentId: newParentId, updatedAt: new Date().toISOString() } : t),
        }));
        dbUpdate('tasks', taskId, { parentId: newParentId }).catch(console.error);
    },
    autoCompleteParent: (childId) => {
        const state = get();
        const child = state.tasks.find(t => t.id === childId);
        if (!child || !child.parentId) return;
        const parentId = child.parentId;
        const siblings = state.tasks.filter(t => t.parentId === parentId && !t.archived);
        const allDone = siblings.every(t => t.status === 'done');
        if (allDone) {
            set((s) => ({
                tasks: s.tasks.map(t => t.id === parentId ? { ...t, status: 'done', progress: 100, updatedAt: new Date().toISOString() } : t),
            }));
            dbUpdate('tasks', parentId, { status: 'done', progress: 100 }).catch(console.error);
            get().autoCompleteParent(parentId);
        } else {
            const parent = state.tasks.find(t => t.id === parentId);
            if (parent && parent.status === 'done') {
                set((s) => ({
                    tasks: s.tasks.map(t => t.id === parentId ? { ...t, status: 'in-progress', progress: 0, updatedAt: new Date().toISOString() } : t),
                }));
                dbUpdate('tasks', parentId, { status: 'in-progress', progress: 0 }).catch(console.error);
            }
        }
    },

    // ===== TASK NOTE ACTIONS =====
    addTaskNote: (data) => {
        const tempId = generateId();
        const now = new Date().toISOString();
        set((s) => ({ taskNotes: [...s.taskNotes, { ...data, id: tempId, createdAt: now }] }));
        getUserId().then(userId => {
            if (!userId) return;
            dbInsert('task_notes', { ...data, userId }).then(result => {
                set((s) => ({ taskNotes: s.taskNotes.map(n => n.id === tempId ? { ...n, id: result.id as string } : n) }));
            }).catch(console.error);
        });
    },
    updateTaskNote: (id, data) => {
        set((s) => ({ taskNotes: s.taskNotes.map(n => n.id === id ? { ...n, ...data } : n) }));
        dbUpdate('task_notes', id, data).catch(console.error);
    },
    deleteTaskNote: (id) => {
        set((s) => ({ taskNotes: s.taskNotes.filter(n => n.id !== id) }));
        dbDelete('task_notes', id).catch(console.error);
    },

    // ===== TRANSACTION ACTIONS =====
    addTransaction: (data) => {
        const tempId = generateId();
        const now = new Date().toISOString();
        set((s) => ({ transactions: [...s.transactions, { ...data, id: tempId, createdAt: now }] }));
        getUserId().then(userId => {
            if (!userId) return;
            dbInsert('transactions', { ...data, userId }).then(result => {
                set((s) => ({ transactions: s.transactions.map(t => t.id === tempId ? { ...t, id: result.id as string } : t) }));
            }).catch(console.error);
        });
    },
    updateTransaction: (id, data) => {
        set((s) => ({ transactions: s.transactions.map(t => t.id === id ? { ...t, ...data } : t) }));
        dbUpdate('transactions', id, data).catch(console.error);
    },
    deleteTransaction: (id) => {
        set((s) => ({ transactions: s.transactions.filter(t => t.id !== id) }));
        dbDelete('transactions', id).catch(console.error);
    },

    // ===== GOAL ACTIONS =====
    addGoal: (data) => {
        const tempId = generateId();
        const now = new Date().toISOString();
        set((s) => ({ goals: [...s.goals, { ...data, id: tempId, createdAt: now, updatedAt: now }] }));
        getUserId().then(userId => {
            if (!userId) return;
            dbInsert('goals', { ...data, userId }).then(result => {
                set((s) => ({ goals: s.goals.map(g => g.id === tempId ? { ...g, id: result.id as string } : g) }));
            }).catch(console.error);
        });
    },
    updateGoal: (id, data) => {
        set((s) => ({ goals: s.goals.map(g => g.id === id ? { ...g, ...data, updatedAt: new Date().toISOString() } : g) }));
        dbUpdate('goals', id, data).catch(console.error);
    },
    deleteGoal: (id) => {
        set((s) => ({
            goals: s.goals.filter(g => g.id !== id),
            goalTransactions: s.goalTransactions.filter(gt => gt.goalId !== id),
        }));
        dbDelete('goals', id).catch(console.error);
    },
    addGoalTransaction: (data) => {
        const goal = get().goals.find(g => g.id === data.goalId);
        if (!goal) return;
        const newSaved = data.type === 'deposit'
            ? goal.currentSaved + data.amount
            : Math.max(0, goal.currentSaved - data.amount);
        const tempId = generateId();
        set((s) => ({
            goalTransactions: [...s.goalTransactions, { ...data, id: tempId }],
            goals: s.goals.map(g => g.id === data.goalId ? { ...g, currentSaved: newSaved, updatedAt: new Date().toISOString() } : g),
        }));
        getUserId().then(userId => {
            if (!userId) return;
            dbInsert('goal_transactions', { ...data, userId }).catch(console.error);
            dbUpdate('goals', data.goalId, { currentSaved: newSaved }).catch(console.error);
        });
    },

    // ===== NOTE ACTIONS =====
    addNote: (data) => {
        const tempId = generateId();
        const now = new Date().toISOString();
        set((s) => ({ notes: [...s.notes, { ...data, id: tempId, createdAt: now, updatedAt: now }] }));
        getUserId().then(userId => {
            if (!userId) return;
            dbInsert('notes', { ...data, userId }).then(result => {
                set((s) => ({ notes: s.notes.map(n => n.id === tempId ? { ...n, id: result.id as string } : n) }));
            }).catch(console.error);
        });
    },
    updateNote: (id, data) => {
        set((s) => ({ notes: s.notes.map(n => n.id === id ? { ...n, ...data, updatedAt: new Date().toISOString() } : n) }));
        dbUpdate('notes', id, data).catch(console.error);
    },
    deleteNote: (id) => {
        set((s) => ({ notes: s.notes.filter(n => n.id !== id) }));
        dbDelete('notes', id).catch(console.error);
    },

    // ===== REMINDER ACTIONS =====
    addReminder: (data) => {
        const tempId = generateId();
        const now = new Date().toISOString();
        set((s) => ({ reminders: [...s.reminders, { ...data, id: tempId, createdAt: now }] }));
        getUserId().then(userId => {
            if (!userId) return;
            dbInsert('reminders', { ...data, userId }).then(result => {
                set((s) => ({ reminders: s.reminders.map(r => r.id === tempId ? { ...r, id: result.id as string } : r) }));
            }).catch(console.error);
        });
    },
    updateReminder: (id, data) => {
        set((s) => ({ reminders: s.reminders.map(r => r.id === id ? { ...r, ...data } : r) }));
        dbUpdate('reminders', id, data).catch(console.error);
    },
    deleteReminder: (id) => {
        set((s) => ({ reminders: s.reminders.filter(r => r.id !== id) }));
        dbDelete('reminders', id).catch(console.error);
    },

    // ===== SETTINGS =====
    updateSettings: (data) => {
        set((s) => ({ settings: { ...s.settings, ...data } }));
        getUserId().then(userId => {
            if (!userId) return;
            dbUpsertSettings(userId, data).catch(console.error);
        });
    },

    // ===== SEED & CLEAR (now DB-backed) =====
    seedData: async () => {
        const userId = await getUserId();
        if (!userId) return;

        try {
            const { getSeedData } = await import('./seed');
            const seed = getSeedData();

            // Insert projects first and map old IDs to new DB UUIDs
            const projectIdMap: Record<string, string> = {};
            for (const p of seed.projects) {
                const { id: oldId, createdAt, updatedAt, ...data } = p;
                const result = await dbInsert('projects', { ...data, userId });
                projectIdMap[oldId] = result.id as string;
            }

            // Insert tasks with mapped projectId, clear parent/depends refs
            for (const t of seed.tasks) {
                const { id, createdAt, updatedAt, projectId, ...data } = t;
                const newProjectId = projectId ? (projectIdMap[projectId] || null) : null;
                await dbInsert('tasks', { ...data, userId, projectId: newProjectId, parentId: null, dependsOn: null });
            }

            // Insert transactions
            for (const tr of seed.transactions) {
                const { id, createdAt, ...data } = tr;
                await dbInsert('transactions', { ...data, userId });
            }

            // Insert goals and map old IDs to new DB UUIDs
            const goalIdMap: Record<string, string> = {};
            for (const g of seed.goals) {
                const { id: oldId, createdAt, updatedAt, ...data } = g;
                const result = await dbInsert('goals', { ...data, userId });
                goalIdMap[oldId] = result.id as string;
            }

            // Insert goal transactions with mapped goal IDs
            for (const gt of seed.goalTransactions) {
                const { id, goalId, ...data } = gt;
                const newGoalId = goalIdMap[goalId];
                if (newGoalId) {
                    await dbInsert('goal_transactions', { ...data, goalId: newGoalId, userId });
                }
            }

            // Insert notes
            for (const n of seed.notes) {
                const { id, createdAt, updatedAt, ...data } = n;
                await dbInsert('notes', { ...data, userId });
            }

            // Insert reminders (clear linkedId since old task IDs no longer exist)
            for (const r of seed.reminders) {
                const { id, createdAt, linkedId, ...data } = r;
                await dbInsert('reminders', { ...data, userId, linkedId: null, linkedType: null });
            }

            // Re-fetch all data from DB to update the store
            await get().initializeData();
        } catch (error) {
            console.error('Seed data error:', error);
        }
    },
    clearData: async () => {
        const userId = await getUserId();
        if (!userId) return;

        try {
            // Delete in order: children first, then parents (FK constraints)
            await supabase.from('goal_transactions').delete().eq('user_id', userId);
            await supabase.from('task_notes').delete().eq('user_id', userId);
            await supabase.from('reminders').delete().eq('user_id', userId);
            await supabase.from('notes').delete().eq('user_id', userId);
            await supabase.from('transactions').delete().eq('user_id', userId);
            await supabase.from('tasks').delete().eq('user_id', userId);
            await supabase.from('goals').delete().eq('user_id', userId);
            await supabase.from('projects').delete().eq('user_id', userId);

            set({
                projects: [],
                tasks: [],
                transactions: [],
                goals: [],
                goalTransactions: [],
                notes: [],
                reminders: [],
                taskNotes: [],
                settings: defaultSettings,
                initialized: true,
            });
        } catch (error) {
            console.error('Clear data error:', error);
        }
    },
}));
