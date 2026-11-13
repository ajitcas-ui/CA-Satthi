import React, { useState, useEffect } from 'react';
import {
  Language,
  UserProfile,
  LeaderboardEntry,
  StudyPresence,
  StudySession,
  TestAttemptResult,
} from '../types';
import { getLeaderboardEntries } from '../utils/storageDb';
import { buildStudentLeaderboard, LeaderboardPeriod, resolvePublicDisplayName } from '../utils/leaderboard';
import {
  Trophy,
  ShieldCheck,
  EyeOff,
  Check,
  UserCheck,
} from 'lucide-react';

interface AllIndiaRankingViewProps {
  language: Language;
  currentUser: UserProfile;
  livePeers?: StudyPresence[];
  studySessions?: StudySession[];
  testHistory?: TestAttemptResult[];
  accuracyRate?: number;
  streak?: number;
  onUpdateDisplayName?: (
    displayName: string,
    privacyHideCity: boolean,
    privacyHideAttempt: boolean
  ) => Promise<void> | void;
}

export const AllIndiaRankingView: React.FC<AllIndiaRankingViewProps> = ({
  language,
  currentUser,
  livePeers = [],
  studySessions = [],
  testHistory = [],
  accuracyRate = 0,
  streak = 0,
  onUpdateDisplayName,
}) => {
  const [period, setPeriod] = useState<LeaderboardPeriod>('weekly');
  const [displayNameInput, setDisplayNameInput] = useState<string>(() => resolvePublicDisplayName(currentUser));
  const [hideCity, setHideCity] = useState<boolean>(Boolean(currentUser.privacyHideCity));
  const [hideAttempt, setHideAttempt] = useState<boolean>(Boolean(currentUser.privacyHideAttempt));
  const [savedNotice, setSavedNotice] = useState<boolean>(false);

  useEffect(() => {
    setDisplayNameInput(resolvePublicDisplayName(currentUser));
    setHideCity(Boolean(currentUser.privacyHideCity));
    setHideAttempt(Boolean(currentUser.privacyHideAttempt));
  }, [currentUser.displayName, currentUser.name, currentUser.privacyHideCity, currentUser.privacyHideAttempt]);

  const { entries, myEntry } = buildStudentLeaderboard({
    currentUser,
    period,
    baseEntries: getLeaderboardEntries(period),
    livePeers,
    studySessions,
    testHistory,
    fallbackAccuracyRate: accuracyRate,
    fallbackStreak: streak,
  });

  const top3: LeaderboardEntry[] = entries.slice(0, 3);
  const rest: LeaderboardEntry[] = entries.slice(3);

  const handleSavePrivacyProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!onUpdateDisplayName) return;
    const cleaned = displayNameInput.trim().slice(0, 40) || resolvePublicDisplayName(currentUser);
    await onUpdateDisplayName(cleaned, hideCity, hideAttempt);
    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 2200);
  };

  return (
    <div className="space-y-6 pb-20 lg:pb-8">
      {/* Header & Sub-Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 text-[11px] font-bold border border-amber-200 dark:border-amber-800 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-amber-600" />
              <span>{language === 'en' ? 'Verified Study Activity Only' : 'केवल सत्यापित अध्ययन गतिविधि'}</span>
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400">
              {language === 'en' ? 'Privacy-safe display names' : 'गोपनीयता-सुरक्षित डिस्प्ले नाम'}
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <Trophy className="w-7 h-7 text-amber-500" />
            <span>{language === 'en' ? 'CA Foundation Study Leaderboard' : 'सीए फाउंडेशन अध्ययन लीडरबोर्ड'}</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            {language === 'en'
              ? 'Rankings computed dynamically from verified active study minutes, MCQ accuracy, and completed mock tests.'
              : 'सत्यापित अध्ययन समय, एमसीक्यू सटीकता एवं मॉक टेस्ट के आधार पर रैंकिंग।'}
          </p>
        </div>

        {/* Period Switcher Tabs */}
        <div className="inline-flex p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 self-start md:self-auto">
          <button
            onClick={() => setPeriod('weekly')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              period === 'weekly'
                ? 'bg-white dark:bg-slate-700 text-blue-700 dark:text-blue-300 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            {language === 'en' ? 'Weekly' : 'साप्ताहिक'}
          </button>
          <button
            onClick={() => setPeriod('monthly')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              period === 'monthly'
                ? 'bg-white dark:bg-slate-700 text-blue-700 dark:text-blue-300 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            {language === 'en' ? 'Monthly' : 'मासिक'}
          </button>
          <button
            onClick={() => setPeriod('all')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              period === 'all'
                ? 'bg-white dark:bg-slate-700 text-blue-700 dark:text-blue-300 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            {language === 'en' ? 'All-Time AIR' : 'सर्वकालिक AIR'}
          </button>
        </div>
      </div>

      {/* Student's Pinned Standing Card */}
      <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-slate-900 text-white p-5 rounded-3xl shadow-md border border-blue-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-md text-2xl flex items-center justify-center shrink-0 border border-white/20">
            {myEntry.avatar}
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-black text-base text-white">{myEntry.studentName}</h3>
              <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-md bg-amber-400/20 text-amber-300 border border-amber-300/30">
                {myEntry.badge}
              </span>
            </div>
            <span className="text-xs text-blue-200 mt-0.5 block">
              {myEntry.city} • {myEntry.targetAttempt} • {myEntry.streakDays}d Streak • {myEntry.accuracyRate}% Accuracy
            </span>
          </div>
        </div>

        <div className="flex items-center gap-4 border-t sm:border-t-0 sm:border-l border-white/15 pt-3 sm:pt-0 sm:pl-5 shrink-0 tabular-nums">
          <div className="text-center sm:text-right">
            <span className="text-[10px] uppercase font-bold text-blue-200 block">
              {language === 'en' ? 'Current Rank' : 'वर्तमान रैंक'}
            </span>
            <span className="text-2xl sm:text-3xl font-black text-amber-300 leading-none">
              AIR #{myEntry.rank}
            </span>
          </div>
          <div className="text-center sm:text-right pl-3 border-l border-white/15">
            <span className="text-[10px] uppercase font-bold text-blue-200 block">
              {language === 'en' ? 'Verified Points' : 'सत्यापित अंक'}
            </span>
            <span className="text-2xl sm:text-3xl font-black text-white leading-none">
              {myEntry.totalPoints}
            </span>
          </div>
        </div>
      </div>

      {/* Leaderboard Display Name & Privacy Settings */}
      {onUpdateDisplayName && (
        <form
          onSubmit={handleSavePrivacyProfile}
          className="bg-white dark:bg-slate-900 rounded-2xl p-4 sm:p-5 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                {language === 'en' ? 'Public Leaderboard Display Name & Privacy' : 'सार्वजनिक लीडरबोर्ड नाम एवं गोपनीयता'}
              </h2>
            </div>
            <span className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1">
              <EyeOff className="w-3.5 h-3.5" />
              {language === 'en'
                ? 'Email & mobile number are never shown publicly'
                : 'ईमेल व मोबाइल नंबर कभी सार्वजनिक नहीं दिखते'}
            </span>
          </div>

          <div className="flex flex-col md:flex-row md:items-center gap-3">
            <input
              type="text"
              maxLength={40}
              value={displayNameInput}
              onChange={(e) => setDisplayNameInput(e.target.value)}
              placeholder={language === 'en' ? 'e.g. CA Aspirant 2027' : 'उदा. CA Aspirant 2027'}
              aria-label={language === 'en' ? 'Leaderboard display name' : 'लीडरबोर्ड डिस्प्ले नाम'}
              className="flex-1 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs sm:text-sm font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />

            <label className="inline-flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={hideCity}
                onChange={(e) => setHideCity(e.target.checked)}
                className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              />
              <span>{language === 'en' ? 'Hide City' : 'शहर छुपाएं'}</span>
            </label>

            <label className="inline-flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={hideAttempt}
                onChange={(e) => setHideAttempt(e.target.checked)}
                className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              />
              <span>{language === 'en' ? 'Hide Attempt' : 'प्रयास छुपाएं'}</span>
            </label>

            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold inline-flex items-center justify-center gap-1.5 cursor-pointer transition-colors shrink-0"
            >
              {savedNotice ? <Check className="w-3.5 h-3.5" /> : null}
              <span>
                {savedNotice
                  ? language === 'en'
                    ? 'Saved!'
                    : 'सहेजा गया!'
                  : language === 'en'
                    ? 'Save Display Name'
                    : 'नाम सहेजें'}
              </span>
            </button>
          </div>
        </form>
      )}

      {/* Top 3 Podium Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
        {top3.map((podium, pIdx) => {
          const isFirst = pIdx === 0;
          const isSecond = pIdx === 1;

          return (
            <div
              key={podium.studentId}
              className={`rounded-3xl p-5 border text-center relative flex flex-col justify-between transition-all ${
                isFirst
                  ? 'bg-gradient-to-b from-amber-50 to-white dark:from-amber-950/40 dark:to-slate-900 border-amber-300 dark:border-amber-700 shadow-md ring-1 ring-amber-400/30 order-first md:order-2 md:-translate-y-2'
                  : isSecond
                    ? 'bg-gradient-to-b from-slate-50 to-white dark:from-slate-800/40 dark:to-slate-900 border-slate-300 dark:border-slate-700 shadow-xs order-2 md:order-1'
                    : 'bg-gradient-to-b from-amber-50/40 to-white dark:from-amber-950/20 dark:to-slate-900 border-amber-200 dark:border-amber-800/60 shadow-xs order-3'
              }`}
            >
              {/* Rank Badge */}
              <div className="absolute top-4 right-4">
                <span
                  className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-xs tabular-nums ${
                    isFirst
                      ? 'bg-amber-400 text-amber-950 shadow-xs'
                      : isSecond
                        ? 'bg-slate-300 text-slate-800'
                        : 'bg-amber-700/80 text-amber-100'
                  }`}
                >
                  #{podium.rank}
                </span>
              </div>

              <div>
                <span className="text-4xl block mb-2">{podium.avatar}</span>
                <h3 className="font-bold text-slate-900 dark:text-white text-base">{podium.studentName}</h3>
                <span className="text-xs text-slate-500 dark:text-slate-400 block mt-0.5">
                  {podium.city} • {podium.targetAttempt}
                </span>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-around text-xs tabular-nums">
                <div>
                  <span className="font-black text-slate-900 dark:text-white block text-sm">
                    {podium.totalPoints}
                  </span>
                  <span className="text-[10px] text-slate-400 uppercase font-semibold">Points</span>
                </div>
                <div>
                  <span className="font-black text-emerald-600 dark:text-emerald-400 block text-sm">
                    {podium.accuracyRate}%
                  </span>
                  <span className="text-[10px] text-slate-400 uppercase font-semibold">Accuracy</span>
                </div>
                <div>
                  <span className="font-black text-blue-600 dark:text-blue-400 block text-sm">
                    {podium.testsCompleted}
                  </span>
                  <span className="text-[10px] text-slate-400 uppercase font-semibold">Tests</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Remaining Leaderboard Table */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
        <h3 className="font-bold text-slate-900 dark:text-white text-sm">
          {language === 'en' ? 'Aspirants Leaderboard (Positions 4+)' : 'अन्य प्रतिभागी रैंकिंग (स्थान 4+)'}
        </h3>

        <div className="space-y-2">
          {rest.map((entry) => (
            <div
              key={entry.studentId}
              className="p-3.5 rounded-2xl border border-slate-100 dark:border-slate-800/80 hover:border-slate-300 dark:hover:border-slate-700 bg-slate-50/50 dark:bg-slate-800/30 transition-all flex items-center justify-between gap-3 text-xs"
            >
              <div className="flex items-center gap-3 min-w-0">
                <span className="w-7 h-7 rounded-xl bg-slate-200 dark:bg-slate-800 font-bold text-slate-700 dark:text-slate-300 flex items-center justify-center shrink-0 tabular-nums">
                  #{entry.rank}
                </span>
                <span className="text-xl shrink-0">{entry.avatar}</span>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="font-bold text-slate-900 dark:text-white text-sm truncate">
                      {entry.studentName}
                    </span>
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 whitespace-nowrap">
                      {entry.badge}
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-400 dark:text-slate-500">
                    {entry.city} • {entry.targetAttempt} • {entry.testsCompleted} Tests Taken
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-4 text-right shrink-0 tabular-nums">
                <div>
                  <span className="font-black text-slate-900 dark:text-white text-sm block">{entry.totalPoints}</span>
                  <span className="text-[10px] text-slate-400 uppercase font-semibold">Points</span>
                </div>
                <div className="hidden sm:block">
                  <span className="font-black text-emerald-600 dark:text-emerald-400 text-sm block">
                    {entry.accuracyRate}%
                  </span>
                  <span className="text-[10px] text-slate-400 uppercase font-semibold">Accuracy</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

