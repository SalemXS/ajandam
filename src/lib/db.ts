import { supabase } from './supabase';
import { Project, Task, Transaction, Goal, GoalTransaction, TaskNote, Note, Reminder } from './types';

// ==================== HELPER: snake_case <-> camelCase ====================

function snakeToCamel(obj: Record<string, unknown>): Record<string, unknown> {
    const result: Record<string, unknown> = {};
    for (const key of Object.keys(obj)) {
        const camelKey = key.replace(/_([a-z])/g, (_, c) => c.toUpperCase());
        result[camelKey] = obj[key];
    }
    return result;
}

function camelToSnake(obj: Record<string, unknown>): Record<string, unknown> {
    const result: Record<string, unknown> = {};
    for (const key of Object.keys(obj)) {
        const snakeKey = key.replace(/[A-Z]/g, (c) => `_${c.toLowerCase()}`);
        result[snakeKey] = obj[key];
    }
    return result;
}

// Convert array of DB rows to camelCase
function rowsToCamel<T>(rows: Record<string, unknown>[]): T[] {
    return rows.map(r => snakeToCamel(r) as T);
}

// ==================== FETCH ALL DATA ====================

export async function fetchAllData(userId: string) {
    const [
        { data: projects },
        { data: tasks },
        { data: transactions },
        { data: goals },
        { data: goalTransactions },
        { data: taskNotes },
        { data: notes },
        { data: reminders },
        { data: settingsRow },
    ] = await Promise.all([
        supabase.from('projects').select('*').eq('user_id', userId).order('created_at', { ascending: false }),
        supabase.from('tasks').select('*').eq('user_id', userId).order('order_index', { ascending: true }),
        supabase.from('transactions').select('*').eq('user_id', userId).order('date', { ascending: false }),
        supabase.from('goals').select('*').eq('user_id', userId).order('created_at', { ascending: false }),
        supabase.from('goal_transactions').select('*').eq('user_id', userId).order('date', { ascending: false }),
        supabase.from('task_notes').select('*').eq('user_id', userId).order('created_at', { ascending: false }),
        supabase.from('notes').select('*').eq('user_id', userId).order('created_at', { ascending: false }),
        supabase.from('reminders').select('*').eq('user_id', userId).order('datetime', { ascending: true }),
        supabase.from('user_settings').select('*').eq('id', userId).single(),
    ]);

    return {
        projects: rowsToCamel<Project>(projects || []),
        tasks: rowsToCamel<Task>(tasks || []),
        transactions: rowsToCamel<Transaction>(transactions || []),
        goals: rowsToCamel<Goal>(goals || []),
        goalTransactions: rowsToCamel<GoalTransaction>(goalTransactions || []),
        taskNotes: rowsToCamel<TaskNote>(taskNotes || []),
        notes: rowsToCamel<Note>(notes || []),
        reminders: rowsToCamel<Reminder>(reminders || []),
        settings: settingsRow ? snakeToCamel(settingsRow as Record<string, unknown>) : null,
    };
}

// ==================== GENERIC CRUD ====================

type TableName = 'projects' | 'tasks' | 'transactions' | 'goals' | 'goal_transactions' | 'task_notes' | 'notes' | 'reminders';

export async function dbInsert(table: TableName, data: Record<string, unknown>) {
    const snakeData = camelToSnake(data);
    // Remove id if it's a client-generated one — let DB generate UUID
    delete snakeData.id;
    const { data: result, error } = await supabase.from(table).insert(snakeData).select().single();
    if (error) {
        console.error(`DB insert error (${table}):`, error);
        throw error;
    }
    return snakeToCamel(result as Record<string, unknown>);
}

export async function dbUpdate(table: TableName, id: string, data: Record<string, unknown>) {
    const snakeData = camelToSnake(data);
    delete snakeData.id;
    delete snakeData.user_id;
    delete snakeData.created_at;
    snakeData.updated_at = new Date().toISOString();
    const { error } = await supabase.from(table).update(snakeData).eq('id', id);
    if (error) {
        console.error(`DB update error (${table}):`, error);
        throw error;
    }
}

export async function dbDelete(table: TableName, id: string) {
    const { error } = await supabase.from(table).delete().eq('id', id);
    if (error) {
        console.error(`DB delete error (${table}):`, error);
        throw error;
    }
}

// ==================== SETTINGS ====================

export async function dbUpsertSettings(userId: string, data: Record<string, unknown>) {
    const snakeData = camelToSnake(data);
    // Remove fields that don't belong in DB
    delete snakeData.custom_palettes; // stored as JSON

    const updateData: Record<string, unknown> = {
        id: userId,
        updated_at: new Date().toISOString(),
        ...snakeData,
    };

    // Handle customPalettes -> JSONB
    if (data.customPalettes !== undefined) {
        updateData.custom_palettes = JSON.stringify(data.customPalettes);
    }

    const { error } = await supabase.from('user_settings').upsert(updateData);
    if (error) {
        console.error('DB settings upsert error:', error);
        throw error;
    }
}
