'use client';

import { Capacitor } from '@capacitor/core';
import { LocalNotifications } from '@capacitor/local-notifications';
import type { Task } from './types';
import { parseISO, isToday, isTomorrow, startOfDay, addHours } from 'date-fns';

/**
 * Check if running in a native Capacitor environment (not web).
 */
function isNative(): boolean {
    return Capacitor.isNativePlatform();
}

/**
 * Generate a stable numeric ID from a string (task ID).
 * Local notifications require numeric IDs.
 */
function hashStringToInt(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash |= 0; // Convert to 32bit integer
    }
    return Math.abs(hash);
}

/**
 * Request notification permissions from the user.
 * Should be called once on app startup.
 */
export async function requestNotificationPermission(): Promise<boolean> {
    if (!isNative()) return false;

    try {
        const status = await LocalNotifications.checkPermissions();
        if (status.display === 'granted') return true;

        const result = await LocalNotifications.requestPermissions();
        return result.display === 'granted';
    } catch (error) {
        console.error('Notification permission error:', error);
        return false;
    }
}

/**
 * Schedule local notifications for tasks with upcoming due dates.
 * - Tasks due TODAY → notification immediately (or at 9 AM if morning hasn't passed)
 * - Tasks due TOMORROW → notification at 9 AM tomorrow
 * Only considers active, non-completed, non-archived tasks.
 */
export async function scheduleTaskNotifications(tasks: Task[]): Promise<void> {
    if (!isNative()) return;

    try {
        const hasPermission = await requestNotificationPermission();
        if (!hasPermission) return;

        // Cancel all previously scheduled task notifications
        const pending = await LocalNotifications.getPending();
        if (pending.notifications.length > 0) {
            await LocalNotifications.cancel({
                notifications: pending.notifications.map(n => ({ id: n.id }))
            });
        }

        // Find tasks due today or tomorrow that are not done/archived
        const upcomingTasks = tasks.filter(t => {
            if (t.archived || t.status === 'done' || !t.dueDate) return false;
            const dueDate = parseISO(t.dueDate);
            return isToday(dueDate) || isTomorrow(dueDate);
        });

        if (upcomingTasks.length === 0) return;

        const now = new Date();
        const notifications = upcomingTasks.map(task => {
            const dueDate = parseISO(task.dueDate!);
            const isDueToday = isToday(dueDate);

            // Schedule at 9 AM on the due date, or in 5 seconds if already past 9 AM today
            let scheduleAt: Date;
            const nineAM = addHours(startOfDay(dueDate), 9);

            if (isDueToday && now >= nineAM) {
                // Already past 9 AM today — schedule 5 seconds from now
                scheduleAt = new Date(now.getTime() + 5000);
            } else {
                scheduleAt = nineAM;
            }

            const priorityEmoji = task.priority === 'high' ? '🔴' : task.priority === 'medium' ? '🟡' : '🟢';
            const dayLabel = isDueToday ? 'Bugün' : 'Yarın';

            return {
                id: hashStringToInt(task.id),
                title: `${priorityEmoji} ${dayLabel} son gün: ${task.title}`,
                body: task.description || `Bu görevin son tarihi ${dayLabel.toLowerCase()}.`,
                schedule: { at: scheduleAt },
                sound: undefined,
                smallIcon: 'ic_stat_icon_config_sample',
                iconColor: '#8B5CF6',
            };
        });

        await LocalNotifications.schedule({ notifications });
        console.log(`Scheduled ${notifications.length} task notifications`);
    } catch (error) {
        console.error('Notification scheduling error:', error);
    }
}
