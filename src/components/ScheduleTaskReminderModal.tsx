import React, { useState } from 'react';
import { Language, StudyTask } from '../types';
import { scheduleTargetAlert, getNotificationPermission, requestNotificationPermission } from '../utils/notificationService';
import { playChimeSound } from '../utils/audio';
import { Bell, Clock, X, Check, Sparkles } from 'lucide-react';

interface ScheduleTaskReminderModalProps {
  language: Language;
  task: StudyTask | null;
  onClose: () => void;
  onScheduled: (taskTitle: string, delayMinutes: number) => void;
}

export const ScheduleTaskReminderModal: React.FC<ScheduleTaskReminderModalProps> = ({
  language,
  task,
  onClose,
  onScheduled,
}) => {
  const [selectedMinutes, setSelectedMinutes] = useState<number>(30);
  const [customMinutes, setCustomMinutes] = useState<string>('45');
  const [isCustom, setIsCustom] = useState(false);

  if (!task) return null;

  const presets = [
    { label: language === 'en' ? 'In 15 minutes' : '15 मिनट में', minutes: 15 },
    { label: language === 'en' ? 'In 30 minutes' : '30 मिनट में', minutes: 30 },
    { label: language === 'en' ? 'In 1 hour' : '1 घंटे में', minutes: 60 },
    { label: language === 'en' ? 'In 2 hours' : '2 घंटे में', minutes: 120 },
  ];

  const handleSetReminder = async () => {
    const delay = isCustom ? Math.max(1, parseInt(customMinutes, 10) || 30) : selectedMinutes;

    // Check notification permission
    const currentPerm = getNotificationPermission();
    if (currentPerm === 'default') {
      await requestNotificationPermission();
    }

    scheduleTargetAlert(task, delay, language);
    playChimeSound('success');
    onScheduled(language === 'hi' ? task.title.hi : task.title.en, delay);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-5 shadow-2xl border border-slate-200 dark:border-slate-800">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 flex items-center justify-center">
              <Bell className="w-4 h-4" />
            </div>
            <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm sm:text-base">
              {language === 'en' ? 'Schedule Target Reminder' : 'लक्ष्य के लिए रिमाइंडर सेट करें'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="py-4 space-y-3">
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700">
            <span className="text-[10px] font-bold text-blue-700 dark:text-blue-400 uppercase tracking-wider">
              {language === 'en' ? 'Selected Study Target' : 'चयनित अध्ययन लक्ष्य'}
            </span>
            <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 mt-0.5">
              {task.title[language]}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              <span>{task.durationMinutes} min • {task.chapter[language]}</span>
            </p>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
              {language === 'en' ? 'When should we alert you?' : 'आपको कब याद दिलाएं?'}
            </label>
            <div className="grid grid-cols-2 gap-2">
              {presets.map((preset) => {
                const active = !isCustom && selectedMinutes === preset.minutes;
                return (
                  <button
                    key={preset.minutes}
                    type="button"
                    onClick={() => {
                      setIsCustom(false);
                      setSelectedMinutes(preset.minutes);
                      playChimeSound('click');
                    }}
                    className={`py-2 px-3 rounded-xl text-xs font-semibold border transition-all text-left flex items-center justify-between cursor-pointer ${
                      active
                        ? 'bg-blue-50 dark:bg-blue-950/70 border-blue-600 dark:border-blue-500 text-blue-700 dark:text-blue-300 shadow-xs'
                        : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/60'
                    }`}
                  >
                    <span>{preset.label}</span>
                    {active && <Check className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="pt-1">
            <button
              type="button"
              onClick={() => setIsCustom(true)}
              className={`text-xs font-semibold cursor-pointer ${
                isCustom ? 'text-blue-700 dark:text-blue-400 font-bold' : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              {language === 'en' ? '+ Custom minutes delay' : '+ अन्य मिनट दर्ज करें'}
            </button>

            {isCustom && (
              <div className="mt-2 flex items-center gap-2">
                <input
                  type="number"
                  min="1"
                  max="720"
                  value={customMinutes}
                  onChange={(e) => setCustomMinutes(e.target.value)}
                  className="w-24 px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 text-xs font-mono focus:outline-blue-600"
                  placeholder="Minutes"
                />
                <span className="text-xs text-slate-600 dark:text-slate-400 font-medium">
                  {language === 'en' ? 'minutes from now' : 'मिनट बाद'}
                </span>
              </div>
            )}
          </div>
        </div>

        <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            {language === 'en' ? 'Cancel' : 'रद्द करें'}
          </button>
          <button
            type="button"
            onClick={handleSetReminder}
            className="px-4 py-2 rounded-lg text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white transition-all shadow-xs cursor-pointer flex items-center gap-1.5"
          >
            <Bell className="w-3.5 h-3.5" />
            <span>{language === 'en' ? 'Set Reminder' : 'रिमाइंडर सेट करें'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
