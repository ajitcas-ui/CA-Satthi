import React, { useState, useEffect } from 'react';
import { Language, ExamCountdownConfig } from '../types';
import { getExamCountdownConfig } from '../utils/storageDb';
import { Calendar, Clock, AlertCircle, Sparkles, CheckCircle2, Bell } from 'lucide-react';

interface ExamCountdownWidgetProps {
  language: Language;
  config?: ExamCountdownConfig;
  onOpenUpdates?: () => void;
}

export const ExamCountdownWidget: React.FC<ExamCountdownWidgetProps> = ({
  language,
  config: propConfig,
  onOpenUpdates,
}) => {
  const [config, setConfig] = useState<ExamCountdownConfig>(() => propConfig || getExamCountdownConfig());

  useEffect(() => {
    if (propConfig) {
      setConfig(propConfig);
    }
  }, [propConfig]);

  const [timeLeft, setTimeLeft] = useState<{
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
  }>({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    if (!config.isDateVerified) return;

    const calculateTime = () => {
      const targetTime = new Date(config.examDate).getTime();
      const now = Date.now();
      const diff = Math.max(0, targetTime - now);

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
      const minutes = Math.floor((diff / 1000 / 60) % 60);
      const seconds = Math.floor((diff / 1000) % 60);

      setTimeLeft({ days, hours, minutes, seconds });
    };

    calculateTime();
    const interval = setInterval(calculateTime, 1000);
    return () => clearInterval(interval);
  }, [config.examDate, config.isDateVerified]);

  return (
    <div className="bg-gradient-to-br from-[#0B1739] via-[#17285D] to-[#4C1D95] text-white rounded-2xl p-5 shadow-md border border-indigo-700/50 relative overflow-hidden h-full flex flex-col justify-between gap-4">
      {/* Subtle violet ambient glow */}
      <div className="absolute -top-12 -right-12 w-44 h-44 rounded-full bg-violet-500/20 blur-2xl pointer-events-none" />

      <div className="relative z-10 space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <span className="px-2.5 py-0.5 rounded-full bg-violet-500/25 text-violet-100 text-[11px] font-bold border border-violet-300/30 inline-flex items-center gap-1 whitespace-nowrap">
            <Calendar className="w-3 h-3 text-violet-200 shrink-0" />
            <span>{config.targetAttempt || 'January 2027'}</span>
          </span>

          {config.isDateVerified ? (
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-200 text-[11px] font-bold border border-emerald-400/30 inline-flex items-center gap-1 whitespace-nowrap">
              <CheckCircle2 className="w-3 h-3 text-emerald-300 shrink-0" />
              <span>{language === 'en' ? 'Official Schedule Confirmed' : 'आधिकारिक समय सारणी सत्यापित'}</span>
            </span>
          ) : (
            <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-200 text-[11px] font-bold border border-amber-400/30 inline-flex items-center gap-1 whitespace-nowrap">
              <Clock className="w-3 h-3 text-amber-300 shrink-0" />
              <span>{language === 'en' ? 'Tentative · Awaiting Official ICAI Date' : 'संभावित · आईसीएआई तिथि प्रतीक्षित'}</span>
            </span>
          )}
        </div>

        <h3 className="text-lg sm:text-xl font-extrabold tracking-tight text-white flex items-center gap-2">
          <span>{config.examName[language]}</span>
          <Sparkles className="w-4 h-4 text-violet-300 shrink-0" />
        </h3>
        <p className="text-xs text-indigo-100/90 leading-relaxed">
          {config.adminAlertNote[language]}
        </p>
      </div>

      <div className="relative z-10">
        {/* If date is verified: Show ticking countdown units */}
        {config.isDateVerified ? (
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-white/10">
            <div className="flex items-center gap-2 sm:gap-2.5">
              <div className="flex flex-col items-center justify-center bg-white/10 border border-white/15 rounded-xl px-3 py-2 min-w-[54px] text-center shadow-xs">
                <span className="text-2xl font-black text-amber-300 font-mono tracking-tight leading-none tabular-nums">
                  {timeLeft.days}
                </span>
                <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-200 mt-1">
                  {language === 'en' ? 'Days' : 'दिन'}
                </span>
              </div>

              <span className="text-lg font-bold text-indigo-300/60">:</span>

              <div className="flex flex-col items-center justify-center bg-white/10 border border-white/15 rounded-xl px-3 py-2 min-w-[50px] text-center shadow-xs">
                <span className="text-2xl font-black text-white font-mono tracking-tight leading-none tabular-nums">
                  {String(timeLeft.hours).padStart(2, '0')}
                </span>
                <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-200 mt-1">
                  {language === 'en' ? 'Hours' : 'घंटे'}
                </span>
              </div>

              <span className="text-lg font-bold text-indigo-300/60">:</span>

              <div className="flex flex-col items-center justify-center bg-white/10 border border-white/15 rounded-xl px-3 py-2 min-w-[50px] text-center shadow-xs">
                <span className="text-2xl font-black text-white font-mono tracking-tight leading-none tabular-nums">
                  {String(timeLeft.minutes).padStart(2, '0')}
                </span>
                <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-200 mt-1">
                  {language === 'en' ? 'Mins' : 'मिनट'}
                </span>
              </div>

              <span className="text-lg font-bold text-indigo-300/60">:</span>

              <div className="flex flex-col items-center justify-center bg-white/10 border border-white/15 rounded-xl px-3 py-2 min-w-[50px] text-center shadow-xs">
                <span className="text-2xl font-black text-violet-300 font-mono tracking-tight leading-none tabular-nums">
                  {String(timeLeft.seconds).padStart(2, '0')}
                </span>
                <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-200 mt-1">
                  {language === 'en' ? 'Secs' : 'सेकंड'}
                </span>
              </div>
            </div>

            {onOpenUpdates && (
              <button
                type="button"
                onClick={onOpenUpdates}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/12 hover:bg-white/20 text-white text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap"
              >
                <Bell className="w-3.5 h-3.5 text-amber-300" />
                <span>{language === 'en' ? 'Exam Schedule' : 'परीक्षा सूचना'}</span>
              </button>
            )}
          </div>
        ) : (
          /* If date is NOT verified: Display clear notice without unverified ticker */
          <div className="bg-[#081028]/55 border border-violet-300/25 rounded-xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-0.5">
              <span className="text-xs font-bold text-amber-200 flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5 text-amber-300 shrink-0" />
                <span>{language === 'en' ? 'Dates Under Official Notification' : 'आधिकारिक अधिसूचना प्रक्रियाधीन'}</span>
              </span>
              <span className="text-[11px] text-indigo-100/85 block leading-relaxed">
                {language === 'en'
                  ? `Live timer unlocks as soon as ICAI notifies ${config.targetAttempt} dates and Admin verifies them.`
                  : `आईसीएआई द्वारा ${config.targetAttempt} की तिथि घोषित व एडमिन द्वारा सत्यापित होते ही लाइव टाइमर शुरू होगा।`}
              </span>
            </div>
            {onOpenUpdates && (
              <button
                type="button"
                onClick={onOpenUpdates}
                className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-white hover:bg-violet-50 text-[#0F1E46] text-xs font-bold transition-colors cursor-pointer shrink-0 whitespace-nowrap"
              >
                <Bell className="w-3.5 h-3.5 text-violet-700" />
                <span>{language === 'en' ? 'ICAI Announcements' : 'आईसीएआई सूचनाएं'}</span>
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

