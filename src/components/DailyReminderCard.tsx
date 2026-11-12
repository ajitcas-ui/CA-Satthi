import React, { useState, useEffect } from 'react';
import { Language, StudyTask } from '../types';
import {
  StudyReminderSettings,
  getNotificationSettings,
  saveNotificationSettings,
  getNotificationPermission,
  requestNotificationPermission,
  sendTestNotification,
  isNotificationSupported,
} from '../utils/notificationService';
import { playChimeSound } from '../utils/audio';
import { 
  Bell, 
  Flame, 
  Clock, 
  Volume2, 
  VolumeX, 
  CheckCircle2, 
  AlertTriangle, 
  Sparkles, 
  Send,
  HelpCircle,
  Settings
} from 'lucide-react';

interface DailyReminderCardProps {
  language: Language;
  streak: number;
  tasks: StudyTask[];
  onOpenPlanner?: () => void;
}

export const DailyReminderCard: React.FC<DailyReminderCardProps> = ({
  language,
  streak,
  tasks,
  onOpenPlanner,
}) => {
  const [settings, setSettings] = useState<StudyReminderSettings>(getNotificationSettings());
  const [permission, setPermission] = useState<NotificationPermission | 'unsupported'>('unsupported');
  const [testSent, setTestSent] = useState(false);
  const [isRequesting, setIsRequesting] = useState(false);

  useEffect(() => {
    setPermission(getNotificationPermission());
  }, []);

  const handleRequestPermission = async () => {
    setIsRequesting(true);
    playChimeSound('click');
    const perm = await requestNotificationPermission();
    setPermission(perm);
    setIsRequesting(false);

    if (perm === 'granted') {
      const updated = { ...settings, enabled: true };
      setSettings(updated);
      saveNotificationSettings(updated);
      playChimeSound('success');
      // Send welcoming confirmation notification
      sendTestNotification(streak, tasks.filter((t) => !t.completed).length, language, onOpenPlanner);
    }
  };

  const handleToggleEnabled = () => {
    playChimeSound('click');
    const updated = { ...settings, enabled: !settings.enabled };
    setSettings(updated);
    saveNotificationSettings(updated);
  };

  const handleTimeChange = (newTime: string) => {
    const updated = { ...settings, reminderTime: newTime };
    setSettings(updated);
    saveNotificationSettings(updated);
  };

  const handleToggleChime = () => {
    playChimeSound('click');
    const updated = { ...settings, playChime: !settings.playChime };
    setSettings(updated);
    saveNotificationSettings(updated);
  };

  const handleSendTest = () => {
    const pendingCount = tasks.filter((t) => !t.completed).length;
    sendTestNotification(streak, pendingCount, language, onOpenPlanner);
    setTestSent(true);
    setTimeout(() => setTestSent(false), 3500);
  };

  const pendingTasksCount = tasks.filter((t) => !t.completed).length;

  return (
    <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white rounded-2xl p-4 sm:p-5 shadow-lg border border-blue-800/40 relative overflow-hidden">
      {/* Subtle background glow */}
      <div className="absolute -right-8 -bottom-8 w-44 h-44 bg-blue-500/10 rounded-full blur-2xl pointer-events-none" />
      <div className="absolute -left-8 -top-8 w-44 h-44 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />

      <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Left Side Info */}
        <div className="space-y-1.5 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-400/20 text-amber-300 text-xs font-bold border border-amber-400/30">
              <Flame className="w-3.5 h-3.5 fill-amber-400 text-amber-400 animate-pulse" />
              <span>{streak} {language === 'en' ? 'Day Streak' : 'दिनों की स्ट्रीक'}</span>
            </span>

            {permission === 'granted' ? (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[11px] font-semibold border border-emerald-500/30">
                <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                {language === 'en' ? 'Browser Notifications Active' : 'ब्राउज़र सूचना सक्रिय'}
              </span>
            ) : permission === 'denied' ? (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 text-[11px] font-semibold border border-rose-500/30">
                <AlertTriangle className="w-3 h-3 text-rose-400" />
                {language === 'en' ? 'Notifications Blocked in Browser' : 'ब्राउज़र में नोटिफिकेशन अवरुद्ध'}
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-400/20 text-blue-300 text-[11px] font-semibold border border-blue-400/30">
                <Bell className="w-3 h-3 text-blue-300" />
                {language === 'en' ? 'Permission Required' : 'अनुमति आवश्यक'}
              </span>
            )}
          </div>

          <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
            <Bell className="w-5 h-5 text-blue-400 shrink-0" />
            <span>
              {language === 'en'
                ? 'Daily Study Target Reminders'
                : 'दैनिक अध्ययन लक्ष्य अनुस्मारक (रिमाइंडर)'}
            </span>
          </h3>

          <p className="text-xs text-blue-200/90 max-w-xl leading-relaxed">
            {language === 'en'
              ? `Automated daily reminders alert you about pending targets (${pendingTasksCount} remaining today) to protect your study streak and build daily consistency.`
              : `स्वचालित दैनिक रिमाइंडर आपके शेष लक्ष्यों (आज ${pendingTasksCount} शेष) के लिए अलर्ट भेजते हैं ताकि आपकी स्टडी स्ट्रीक सुरक्षित रहे।`}
          </p>
        </div>

        {/* Right Side Controls */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 shrink-0 bg-white/10 backdrop-blur-md p-3 rounded-xl border border-white/10">
          {permission !== 'granted' ? (
            <div className="flex flex-col gap-2 w-full sm:w-auto">
              <button
                onClick={handleRequestPermission}
                disabled={isRequesting}
                className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-blue-500 hover:bg-blue-400 text-white text-xs font-bold transition-all shadow-md cursor-pointer disabled:opacity-50"
              >
                <Bell className="w-4 h-4 animate-bounce" />
                <span>
                  {isRequesting
                    ? (language === 'en' ? 'Requesting...' : 'अनुरोध कर रहे हैं...')
                    : (language === 'en' ? 'Enable Browser Reminders' : 'ब्राउज़र रिमाइंडर सक्षम करें')}
                </span>
              </button>

              {permission === 'denied' && (
                <p className="text-[10px] text-amber-200/90 text-center">
                  {language === 'en'
                    ? 'In-app reminder banners will still appear.'
                    : 'इन-ऐप रिमाइंडर बैनर अभी भी दिखेंगे।'}
                </p>
              )}
            </div>
          ) : (
            <div className="flex flex-wrap items-center gap-3">
              {/* Daily Toggle */}
              <label className="flex items-center gap-2 text-xs font-medium cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={settings.enabled}
                  onChange={handleToggleEnabled}
                  className="rounded text-blue-500 focus:ring-blue-400 w-4 h-4"
                />
                <span className="text-blue-100">
                  {language === 'en' ? 'Daily Alert' : 'दैनिक अलर्ट'}
                </span>
              </label>

              {/* Time Picker */}
              <div className="flex items-center gap-1.5 bg-slate-900/60 px-2.5 py-1.5 rounded-lg border border-white/10 text-xs">
                <Clock className="w-3.5 h-3.5 text-blue-300" />
                <input
                  type="time"
                  value={settings.reminderTime}
                  onChange={(e) => handleTimeChange(e.target.value)}
                  className="bg-transparent text-white font-mono text-xs focus:outline-none cursor-pointer"
                  title={language === 'en' ? 'Daily reminder time' : 'दैनिक रिमाइंडर का समय'}
                />
              </div>

              {/* Chime toggle */}
              <button
                onClick={handleToggleChime}
                title={settings.playChime ? 'Sound chime enabled' : 'Sound chime muted'}
                className="p-1.5 rounded-lg bg-slate-900/60 hover:bg-slate-800 text-blue-200 border border-white/10 transition-colors cursor-pointer"
              >
                {settings.playChime ? (
                  <Volume2 className="w-4 h-4 text-emerald-400" />
                ) : (
                  <VolumeX className="w-4 h-4 text-slate-400" />
                )}
              </button>

              {/* Send Test Notification Button */}
              <button
                onClick={handleSendTest}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-500 hover:bg-indigo-400 text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
                title={language === 'en' ? 'Send a test reminder now' : 'अभी परीक्षण रिमाइंडर भेजें'}
              >
                <Send className="w-3.5 h-3.5" />
                <span>
                  {testSent
                    ? (language === 'en' ? 'Sent!' : 'भेजा गया!')
                    : (language === 'en' ? 'Test Alert' : 'परीक्षण अलर्ट')}
                </span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Preset time chips when notifications are granted */}
      {permission === 'granted' && (
        <div className="mt-3 pt-3 border-t border-white/10 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[11px] text-blue-200/80 mr-1">
              {language === 'en' ? 'Quick reminder times:' : 'त्वरित समय:'}
            </span>
            {[
              { label: '08:00 AM', time: '08:00' },
              { label: '02:00 PM', time: '14:00' },
              { label: '06:00 PM', time: '18:00' },
              { label: '08:00 PM (Default)', time: '20:00' },
              { label: '09:30 PM', time: '21:30' },
            ].map((preset) => (
              <button
                key={preset.time}
                onClick={() => {
                  playChimeSound('click');
                  handleTimeChange(preset.time);
                }}
                className={`px-2 py-0.5 rounded-md text-[11px] font-medium transition-colors cursor-pointer ${
                  settings.reminderTime === preset.time
                    ? 'bg-blue-500 text-white font-bold'
                    : 'bg-white/10 hover:bg-white/20 text-blue-100'
                }`}
              >
                {preset.label}
              </button>
            ))}
          </div>

          <div className="text-[11px] text-blue-200/70 italic flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-amber-300" />
            <span>
              {language === 'en'
                ? 'Streak rule: Complete at least 1 study target daily'
                : 'नियम: अपनी स्ट्रीक के लिए प्रतिदिन कम से कम 1 लक्ष्य पूरा करें'}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
