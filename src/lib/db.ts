import { Project, Task, Transaction, Goal, GoalTransaction, TaskNote, Note, Reminder, AppSettings } from './types';

// ==================== HELPER: Local Storage safe wrapper ====================
const safeStorage = {
    getItem: (key: string): string | null => {
        if (typeof window === 'undefined') return null;
        try { return window.localStorage.getItem(key); } catch { return null; }
    },
    setItem: (key: string, value: string) => {
        if (typeof window === 'undefined') return;
        try { window.localStorage.setItem(key, value); } catch { }
    },
    removeItem: (key: string) => {
        if (typeof window === 'undefined') return;
        try { window.localStorage.removeItem(key); } catch { }
    }
};

// ==================== FETCH ALL DATA ====================

// Simulate database read locally
const getTable = (tableName: string, userId: string): any[] => {
    const raw = safeStorage.getItem(`ajanda_${tableName}`);
    if (!raw) return [];
    try {
        const rows = JSON.parse(raw);
        return rows.filter((r: any) => r.userId === userId || r.user_id === userId || r.id === userId); // user_settings case
    } catch {
        return [];
    }
}

export async function fetchAllData(userId: string) {
    const projects = getTable('projects', userId);
    const tasks = getTable('tasks', userId);
    const transactions = getTable('transactions', userId);
    const goals = getTable('goals', userId);
    const goalTransactions = getTable('goal_transactions', userId);
    const taskNotes = getTable('task_notes', userId);
    const notes = getTable('notes', userId);
    const reminders = getTable('reminders', userId);

    // Sort logic mimics what the database used to do
    const sortedProjects = [...projects].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    const sortedTasks = [...tasks].sort((a, b) => (a.orderIndex || 0) - (b.orderIndex || 0));
    const sortedTransactions = [...transactions].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    const sortedGoals = [...goals].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    const sortedGoalTransactions = [...goalTransactions].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    const sortedTaskNotes = [...taskNotes].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    const sortedNotes = [...notes].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    const sortedReminders = [...reminders].sort((a, b) => new Date(a.datetime).getTime() - new Date(b.datetime).getTime());

    const settingsRows = getTable('user_settings', userId);
    let settings = settingsRows.length > 0 ? settingsRows[0] : null;

    if (settings && typeof settings.customPalettes === 'string') {
        try { settings.customPalettes = JSON.parse(settings.customPalettes); } catch { }
    }

    return {
        projects: sortedProjects as Project[],
        tasks: sortedTasks as Task[],
        transactions: sortedTransactions as Transaction[],
        goals: sortedGoals as Goal[],
        goalTransactions: sortedGoalTransactions as GoalTransaction[],
        taskNotes: sortedTaskNotes as TaskNote[],
        notes: sortedNotes as Note[],
        reminders: sortedReminders as Reminder[],
        settings,
    };
}

// ==================== GENERIC CRUD ====================

type TableName = 'projects' | 'tasks' | 'transactions' | 'goals' | 'goal_transactions' | 'task_notes' | 'notes' | 'reminders';

export async function dbInsert(table: TableName, data: Record<string, unknown>) {
    const userId = data.userId || data.user_id;
    if (!userId) throw new Error("userId is required for dbInsert");

    // Auto generate UUID if not provided. In real DB this was automatic.
    const newId = data.id || crypto.randomUUID();

    const newRow = {
        ...data,
        id: newId,
        createdAt: data.createdAt || new Date().toISOString(),
        updatedAt: data.updatedAt || new Date().toISOString()
    };

    const dbKey = `ajanda_${table}`;
    const raw = safeStorage.getItem(dbKey);
    let rows = [];
    if (raw) {
        try { rows = JSON.parse(raw); } catch { }
    }

    rows.push(newRow);
    safeStorage.setItem(dbKey, JSON.stringify(rows));

    return newRow;
}

export async function dbUpdate(table: TableName, id: string, data: Record<string, unknown>) {
    const dbKey = `ajanda_${table}`;
    const raw = safeStorage.getItem(dbKey);
    let rows = [];
    if (raw) {
        try { rows = JSON.parse(raw); } catch { }
    }

    const index = rows.findIndex((r: any) => r.id === id);
    if (index === -1) {
        console.warn(`Update failed: Row with id ${id} not found in ${table}`);
        return;
    }

    const updatedData = { ...data };
    delete updatedData.id;
    delete updatedData.userId;
    delete updatedData.user_id;
    delete updatedData.createdAt;
    delete updatedData.created_at;

    rows[index] = {
        ...rows[index],
        ...updatedData,
        updatedAt: new Date().toISOString()
    };

    safeStorage.setItem(dbKey, JSON.stringify(rows));
}

export async function dbDelete(table: TableName, id: string) {
    const dbKey = `ajanda_${table}`;
    const raw = safeStorage.getItem(dbKey);
    if (!raw) return;

    try {
        const rows = JSON.parse(raw);
        const filtered = rows.filter((r: any) => r.id !== id);

        // Handle cascading deletes manually (since mock DB doesn't have CASCADE)
        if (table === 'projects') {
            // Cascade delete tasks if project is deleted
            const tRaw = safeStorage.getItem('ajanda_tasks');
            if (tRaw) {
                const tRows = JSON.parse(tRaw).filter((t: any) => t.projectId !== id);
                safeStorage.setItem('ajanda_tasks', JSON.stringify(tRows));
            }
        } else if (table === 'goals') {
            // Cascade delete goal transactions
            const gtRaw = safeStorage.getItem('ajanda_goal_transactions');
            if (gtRaw) {
                const gtRows = JSON.parse(gtRaw).filter((gt: any) => gt.goalId !== id);
                safeStorage.setItem('ajanda_goal_transactions', JSON.stringify(gtRows));
            }
        }

        safeStorage.setItem(dbKey, JSON.stringify(filtered));
    } catch (e) {
        console.error(`DB delete error (${table}):`, e);
    }
}

// ==================== SETTINGS ====================

export async function dbUpsertSettings(userId: string, data: Record<string, unknown>) {
    const dbKey = `ajanda_user_settings`;
    const raw = safeStorage.getItem(dbKey);
    let rows = [];
    if (raw) {
        try { rows = JSON.parse(raw); } catch { }
    }

    const index = rows.findIndex((r: any) => r.id === userId);

    const updateData = { ...data };

    if (data.customPalettes !== undefined) {
        updateData.customPalettes = JSON.stringify(data.customPalettes);
    }

    if (index === -1) {
        // Insert
        rows.push({
            id: userId,
            ...updateData,
            updatedAt: new Date().toISOString()
        });
    } else {
        // Update
        rows[index] = {
            ...rows[index],
            ...updateData,
            updatedAt: new Date().toISOString()
        };
    }

    safeStorage.setItem(dbKey, JSON.stringify(rows));
}
