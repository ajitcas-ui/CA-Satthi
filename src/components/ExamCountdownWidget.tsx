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
    <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white rounded-2xl p-4 sm:p-5 shadow-md border border-blue-800/60 relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute -top-12 -right-12 w-44 h-44 rounded-full bg-blue-500/10 blur-2xl pointer-events-none" />

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-300 text-[11px] font-bold border border-blue-400/30 flex items-center gap-1">
              <Calendar className="w-3 h-3 text-blue-400" />
              <span>{config.targetAttempt || 'January 2027'}</span>
            </span>

            {config.isDateVerified ? (
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-bold border border-emerald-400/30 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                <span>{language === 'en' ? 'Official Schedule Confirmed' : 'आधिकारिक समय सारणी सत्यापित'}</span>
              </span>
            ) : (
              <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-[10px] font-bold border border-amber-400/30 flex items-center gap-1">
                <Clock className="w-3 h-3 text-amber-400 animate-pulse" />
                <span>{language === 'en' ? 'Awaiting Official ICAI Date Notification' : 'आईसीएआई आधिकारिक तिथि अधिसूचना प्रतीक्षित'}</span>
              </span>
            )}
          </div>

          <h3 className="text-base sm:text-lg font-black tracking-tight text-white flex items-center gap-2">
            <span>{config.examName[language]}</span>
            <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
          </h3>
          <p className="text-xs text-blue-200/90 mt-1 line-clamp-2 max-w-xl">
            {config.adminAlertNote[language]}
          </p>
        </div>

        {/* If date is verified: Show ticking countdown units */}
        {config.isDateVerified ? (
          <div className="flex items-center gap-2 sm:gap-3 self-center md:self-auto shrink-0">
            <div className="flex flex-col items-center justify-center bg-white/10 backdrop-blur-md border border-white/15 rounded-xl px-3 py-2 min-w-[56px] text-center shadow-xs">
              <span className="text-2xl sm:text-3xl font-black text-amber-300 font-mono tracking-tight leading-none">
                {timeLeft.days}
              </span>
              <span className="text-[10px] font-bold uppercase tracking-wider text-blue-200 mt-1">
                {language === 'en' ? 'Days' : 'दिन'}
              </span>
            </div>

            <span className="text-xl font-bold text-blue-300/60">:</span>

            <div className="flex flex-col items-center justify-center bg-white/10 backdrop-blur-md border border-white/15 rounded-xl px-3 py-2 min-w-[52px] text-center shadow-xs">
              <span className="text-2xl sm:text-3xl font-black text-white font-mono tracking-tight leading-none">
                {String(timeLeft.hours).padStart(2, '0')}
              </span>
              <span className="text-[10px] font-bold uppercase tracking-wider text-blue-200 mt-1">
                {language === 'en' ? 'Hours' : 'घंटे'}
              </span>
            </div>

            <span className="text-xl font-bold text-blue-300/60">:</span>

            <div className="flex flex-col items-center justify-center bg-white/10 backdrop-blur-md border border-white/15 rounded-xl px-3 py-2 min-w-[52px] text-center shadow-xs">
              <span className="text-2xl sm:text-3xl font-black text-white font-mono tracking-tight leading-none">
                {String(timeLeft.minutes).padStart(2, '0')}
              </span>
              <span className="text-[10px] font-bold uppercase tracking-wider text-blue-200 mt-1">
                {language === 'en' ? 'Mins' : 'मिनट'}
              </span>
            </div>

            <span className="text-xl font-bold text-blue-300/60">:</span>

            <div className="flex flex-col items-center justify-center bg-white/10 backdrop-blur-md border border-white/15 rounded-xl px-3 py-2 min-w-[52px] text-center shadow-xs">
              <span className="text-2xl sm:text-3xl font-black text-amber-400 font-mono tracking-tight leading-none animate-pulse">
                {String(timeLeft.seconds).padStart(2, '0')}
              </span>
              <span className="text-[10px] font-bold uppercase tracking-wider text-blue-200 mt-1">
                {language === 'en' ? 'Secs' : 'सेकंड'}
              </span>
            </div>
          </div>
        ) : (
          /* If date is NOT verified: Display educational notice without unverified ticker */
          <div className="bg-amber-950/40 border border-amber-500/30 rounded-xl p-3 max-w-sm text-center md:text-right shrink-0">
            <span className="text-xs font-bold text-amber-200 block">
              {language === 'en' ? 'Dates Under Official Notification' : 'आधिकारिक अधिसूचना प्रक्रियाधीन'}
            </span>
            <span className="text-[11px] text-amber-100/80 block mt-0.5">
              {language === 'en'
                ? `ICAI Examination Directorate will notify exact commencement dates for ${config.targetAttempt}. Live timer unlocks immediately upon official gazette publication.`
                : `आईसीएआई द्वारा ${config.targetAttempt} हेतु आधिकारिक तिथि पत्र जारी होते ही लाइव टाइमर सक्रिय होगा।`}
            </span>
            {onOpenUpdates && (
              <button
                onClick={onOpenUpdates}
                className="mt-2 inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-amber-400 hover:bg-amber-300 text-slate-950 text-[11px] font-black transition-all cursor-pointer"
              >
                <Bell className="w-3 h-3" />
                <span>{language === 'en' ? 'ICAI Announcements' : 'आईसीएआई सूचनाएं'}</span>
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

