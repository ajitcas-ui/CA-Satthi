import { Language, StudyTask } from '../types';
import { playChimeSound } from './audio';

export interface StudyReminderSettings {
  enabled: boolean;
  reminderTime: string; // 24-hour "HH:MM", default "20:00" (8:00 PM)
  playChime: boolean;
  streakAlerts: boolean;
  lastReminderDate?: string; // "YYYY-MM-DD"
}

export interface ScheduledTaskAlert {
  taskId: string;
  taskTitle: string;
  remindAt: number; // timestamp in ms
}

export interface InAppNotification {
  id: string;
  title: string;
  message: string;
  type: 'streak' | 'reminder' | 'success';
  timestamp: string;
  actionLabel?: string;
  onAction?: () => void;
}

const SETTINGS_KEY = 'ca_saathi_notification_settings';
const SCHEDULED_TASKS_KEY = 'ca_saathi_scheduled_task_reminders';

export const DEFAULT_SETTINGS: StudyReminderSettings = {
  enabled: true,
  reminderTime: '20:00', // 8:00 PM by default
  playChime: true,
  streakAlerts: true,
};

// Check if browser supports Web Notifications
export function isNotificationSupported(): boolean {
  return typeof window !== 'undefined' && 'Notification' in window;
}

// Get current permission status
export function getNotificationPermission(): NotificationPermission | 'unsupported' {
  if (!isNotificationSupported()) return 'unsupported';
  return Notification.permission;
}

// Request permission from the user
export async function requestNotificationPermission(): Promise<NotificationPermission | 'unsupported'> {
  if (!isNotificationSupported()) return 'unsupported';
  try {
    const permission = await Notification.requestPermission();
    return permission;
  } catch (error) {
    console.error('Failed to request notification permission:', error);
    return Notification.permission;
  }
}

// Load notification settings
export function getNotificationSettings(): StudyReminderSettings {
  try {
    const saved = localStorage.getItem(SETTINGS_KEY);
    if (saved) {
      return { ...DEFAULT_SETTINGS, ...JSON.parse(saved) };
    }
  } catch {
    // fallback
  }
  return DEFAULT_SETTINGS;
}

// Save notification settings
export function saveNotificationSettings(settings: StudyReminderSettings): void {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch (e) {
    console.warn('Unable to persist notification settings to localStorage', e);
  }
}

// In-app subscribers for in-app alert banners/toasts
type NotificationListener = (notification: InAppNotification) => void;
const listeners = new Set<NotificationListener>();

export function subscribeToInAppNotifications(listener: NotificationListener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function notifyInApp(notification: InAppNotification) {
  listeners.forEach((fn) => {
    try {
      fn(notification);
    } catch (e) {
      console.error(e);
    }
  });
}

// Core trigger function for Web Notification + in-app fallback
export function triggerBrowserNotification(params: {
  title: string;
  body: string;
  type?: 'streak' | 'reminder' | 'success';
  tag?: string;
  actionLabel?: string;
  onAction?: () => void;
  playChime?: boolean;
}): boolean {
  const { title, body, type = 'streak', tag, actionLabel, onAction, playChime = true } = params;

  // 1. Play auditory chime if requested
  if (playChime) {
    if (type === 'success') {
      playChimeSound('complete');
    } else {
      playChimeSound('success');
    }
  }

  // 2. Always dispatch in-app notification banner for instant visual cue
  notifyInApp({
    id: `notif_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    title,
    message: body,
    type,
    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    actionLabel,
    onAction,
  });

  // 3. Fire native Web Notification if supported and granted
  if (isNotificationSupported() && Notification.permission === 'granted') {
    try {
      const notif = new Notification(title, {
        body,
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        tag: tag || 'ca-saathi-reminder',
        requireInteraction: false,
      });

      notif.onclick = () => {
        window.focus();
        if (onAction) onAction();
        notif.close();
      };

      return true;
    } catch (e) {
      console.warn('Web Notification instantiation failed, in-app banner was displayed:', e);
    }
  }

  return false;
}

// Check and trigger daily reminder based on scheduled time & pending study targets
export function checkAndTriggerDailyReminder(
  tasks: StudyTask[],
  streak: number,
  language: Language,
  onNavigateToPlanner?: () => void
): boolean {
  const settings = getNotificationSettings();
  if (!settings.enabled) return false;

  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];

  // Already reminded today?
  if (settings.lastReminderDate === todayStr) {
    return false;
  }

  // Parse reminderTime "HH:MM"
  const [targetHourStr, targetMinuteStr] = settings.reminderTime.split(':');
  const targetHour = parseInt(targetHourStr, 10);
  const targetMinute = parseInt(targetMinuteStr, 10);

  if (isNaN(targetHour) || isNaN(targetMinute)) return false;

  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();

  // Check if current time has reached or passed the target reminder time
  const currentTotalMinutes = currentHour * 60 + currentMinute;
  const targetTotalMinutes = targetHour * 60 + targetMinute;

  if (currentTotalMinutes >= targetTotalMinutes) {
    const pendingTasks = tasks.filter((t) => !t.completed);
    const completedTasks = tasks.filter((t) => t.completed);

    if (pendingTasks.length > 0) {
      const topTasksText = pendingTasks
        .slice(0, 2)
        .map((t) => (language === 'hi' ? t.title.hi : t.title.en))
        .join(', ');

      const title =
        language === 'hi'
          ? `🔥 अपनी ${streak}-दिनों की स्टडी स्ट्रीक बचाएं!`
          : `🔥 Protect Your ${streak}-Day Study Streak!`;

      const body =
        language === 'hi'
          ? `आज के ${pendingTasks.length} अध्ययन लक्ष्य बाकी हैं: "${topTasksText}". स्ट्रीक सुरक्षित करने के लिए अभी पूरा करें!`
          : `You have ${pendingTasks.length} pending study target(s) today: "${topTasksText}". Complete them now to maintain your streak!`;

      triggerBrowserNotification({
        title,
        body,
        type: 'streak',
        tag: `daily-reminder-${todayStr}`,
        actionLabel: language === 'hi' ? 'प्लानर खोलें' : 'Open Planner',
        onAction: onNavigateToPlanner,
        playChime: settings.playChime,
      });
    } else if (tasks.length > 0 && completedTasks.length === tasks.length) {
      const title =
        language === 'hi'
          ? `🌟 शानदार! दैनिक लक्ष्य पूरे हुए!`
          : `🌟 Fantastic! Daily Targets Achieved!`;

      const body =
        language === 'hi'
          ? `आपने आज के सभी लक्ष्य पूरे कर लिए हैं। आपकी ${streak}-दिनों की स्ट्रीक सुरक्षित है!`
          : `You've completed all study targets for today. Your ${streak}-day streak is secured! Keep shining!`;

      triggerBrowserNotification({
        title,
        body,
        type: 'success',
        tag: `daily-reminder-${todayStr}`,
        actionLabel: language === 'hi' ? 'प्रगति देखें' : 'View Progress',
        onAction: onNavigateToPlanner,
        playChime: settings.playChime,
      });
    }

    // Mark as reminded today
    settings.lastReminderDate = todayStr;
    saveNotificationSettings(settings);
    return true;
  }

  return false;
}

// Immediate Test Notification trigger
export function sendTestNotification(
  streak: number,
  pendingCount: number,
  language: Language,
  onNavigateToPlanner?: () => void
): boolean {
  const settings = getNotificationSettings();

  const title =
    language === 'hi'
      ? `🔥 सीए साथी: ${streak}-दिनों की स्टडी स्ट्रीक अलर्ट!`
      : `🔥 CA Saathi: ${streak}-Day Study Streak Alert!`;

  const body =
    language === 'hi'
      ? `दैनिक रिमाइंडर सक्रिय है! आपके पास आज ${pendingCount} अध्ययन लक्ष्य शेष हैं। नियमित अभ्यास ही CA परीक्षा में सफलता की कुंजी है।`
      : `Daily reminder is active! You have ${pendingCount} pending target(s) for today. Consistency is your superpower in CA Foundation!`;

  return triggerBrowserNotification({
    title,
    body,
    type: 'streak',
    tag: 'test-reminder',
    actionLabel: language === 'hi' ? 'प्लानर देखें' : 'View Planner',
    onAction: onNavigateToPlanner,
    playChime: settings.playChime,
  });
}

// Task-specific quick timer alerts (e.g., "Remind me in 30 minutes to study this")
export function scheduleTargetAlert(
  task: StudyTask,
  delayMinutes: number,
  language: Language,
  onNavigateToPlanner?: () => void
): void {
  const settings = getNotificationSettings();
  const taskTitle = language === 'hi' ? task.title.hi : task.title.en;

  setTimeout(() => {
    const title =
      language === 'hi'
        ? `⏰ अध्ययन लक्ष्य समय: ${taskTitle}`
        : `⏰ Time for Study Target: ${taskTitle}`;

    const body =
      language === 'hi'
        ? `निर्धारित समय हो गया है! "${taskTitle}" (${task.durationMinutes} मिनट) शुरू करें और अपनी दैनिक स्ट्रीक मजबूत करें।`
        : `Scheduled study time is here! Begin "${taskTitle}" (${task.durationMinutes} min) to stay ahead on your streak.`;

    triggerBrowserNotification({
      title,
      body,
      type: 'reminder',
      tag: `task-${task.id}`,
      actionLabel: language === 'hi' ? 'अध्ययन शुरू करें' : 'Start Study',
      onAction: onNavigateToPlanner,
      playChime: settings.playChime,
    });
  }, delayMinutes * 60 * 1000);
}
