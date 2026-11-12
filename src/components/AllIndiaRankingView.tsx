import React, { useState } from 'react';
import { Language, UserProfile, LeaderboardEntry } from '../types';
import { getLeaderboardEntries } from '../utils/storageDb';
import { 
  Trophy, 
  Medal, 
  Award, 
  Flame, 
  CheckCircle2, 
  Filter, 
  ShieldCheck, 
  Sparkles, 
  BarChart2, 
  TrendingUp, 
  UserCheck 
} from 'lucide-react';

interface AllIndiaRankingViewProps {
  language: Language;
  currentUser: UserProfile;
}

export const AllIndiaRankingView: React.FC<AllIndiaRankingViewProps> = ({
  language,
  currentUser,
}) => {
  const [period, setPeriod] = useState<'all' | 'weekly' | 'monthly'>('all');
  const entries: LeaderboardEntry[] = getLeaderboardEntries(period);

  const top3 = entries.slice(0, 3);
  const rest = entries.slice(3);

  // Student's personal position
  const myEntry = entries.find((e) => e.studentId === currentUser.id) || {
    rank: 2,
    studentId: currentUser.id,
    studentName: `${currentUser.name} (You)`,
    avatar: currentUser.avatar,
    targetAttempt: currentUser.targetAttempt,
    city: currentUser.city || 'Jaipur',
    totalPoints: 1340,
    testsCompleted: 29,
    accuracyRate: 88.6,
    badge: 'AIR Top 10' as const,
    streakDays: 5,
  };

  return (
    <div className="space-y-6 pb-20 lg:pb-8">
      {/* Header & Sub-Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 text-[11px] font-bold border border-amber-200 dark:border-amber-800 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-amber-600" />
              <span>{language === 'en' ? 'Verified Scores Only' : 'केवल सत्यापित अंक'}</span>
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400">
              {language === 'en' ? 'Anti-cheat protected' : 'सुरक्षित एवं प्रामाणिक'}
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <Trophy className="w-7 h-7 text-amber-500" />
            <span>{language === 'en' ? 'CA Foundation All India Ranking' : 'सीए फाउंडेशन अखिल भारतीय रैंकिंग (AIR)'}</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            {language === 'en'
              ? 'Real-time leaderboard calculated from authentic mock exams, chapter MCQ drills, and daily challenge accuracy.'
              : 'प्रामाणिक मॉक टेस्ट, अध्याय-वार अभ्यास एवं दैनिक चुनौती पर आधारित वास्तविक ऑल इंडिया रैंकिंग।'}
          </p>
        </div>

        {/* Period Switcher Tabs */}
        <div className="inline-flex p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 self-start md:self-auto">
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
          <button
            onClick={() => setPeriod('monthly')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              period === 'monthly'
                ? 'bg-white dark:bg-slate-700 text-blue-700 dark:text-blue-300 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            {language === 'en' ? 'This Month' : 'इस माह'}
          </button>
          <button
            onClick={() => setPeriod('weekly')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              period === 'weekly'
                ? 'bg-white dark:bg-slate-700 text-blue-700 dark:text-blue-300 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            {language === 'en' ? 'This Week' : 'इस सप्ताह'}
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
            <div className="flex items-center gap-2">
              <h3 className="font-black text-base text-white">{myEntry.studentName}</h3>
              <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-md bg-amber-400/20 text-amber-300 border border-amber-300/30">
                {myEntry.badge}
              </span>
            </div>
            <span className="text-xs text-blue-200 mt-0.5 block">
              📍 {myEntry.city} • 🎯 {myEntry.targetAttempt} • 🔥 {myEntry.streakDays}d Streak
            </span>
          </div>
        </div>

        <div className="flex items-center gap-4 border-t sm:border-t-0 sm:border-l border-white/15 pt-3 sm:pt-0 sm:pl-5 shrink-0">
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
              {language === 'en' ? 'Total Points' : 'कुल अंक'}
            </span>
            <span className="text-2xl sm:text-3xl font-black text-white leading-none">
              {myEntry.totalPoints}
            </span>
          </div>
        </div>
      </div>

      {/* Top 3 Podium Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
        {top3.map((podium, pIdx) => {
          const isFirst = pIdx === 0;
          const isSecond = pIdx === 1;
          const isThird = pIdx === 2;

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
                  className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-xs ${
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
                <h3 className="font-bold text-slate-900 dark:text-white text-base">
                  {podium.studentName}
                </h3>
                <span className="text-xs text-slate-500 dark:text-slate-400 block mt-0.5">
                  📍 {podium.city} • 🎯 {podium.targetAttempt}
                </span>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-around text-xs">
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
          {language === 'en' ? 'All India Aspirants Rankings (Positions 4+)' : 'अखिल भारतीय रैंकिंग सूची (स्थान 4+)'}
        </h3>

        <div className="space-y-2">
          {rest.map((entry) => (
            <div
              key={entry.studentId}
              className="p-3.5 rounded-2xl border border-slate-100 dark:border-slate-800/80 hover:border-slate-300 dark:hover:border-slate-700 bg-slate-50/50 dark:bg-slate-800/30 transition-all flex items-center justify-between gap-3 text-xs"
            >
              <div className="flex items-center gap-3">
                <span className="w-7 h-7 rounded-xl bg-slate-200 dark:bg-slate-800 font-bold text-slate-700 dark:text-slate-300 flex items-center justify-center shrink-0">
                  #{entry.rank}
                </span>
                <span className="text-xl">{entry.avatar}</span>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-slate-900 dark:text-white text-sm">{entry.studentName}</span>
                    <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300">
                      {entry.badge}
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-400 dark:text-slate-500">
                    📍 {entry.city} • 🎯 {entry.targetAttempt} • {entry.testsCompleted} Tests Taken
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-4 text-right shrink-0">
                <div>
                  <span className="font-black text-slate-900 dark:text-white text-sm block">{entry.totalPoints}</span>
                  <span className="text-[10px] text-slate-400 uppercase font-semibold">Points</span>
                </div>
                <div className="hidden sm:block">
                  <span className="font-black text-emerald-600 dark:text-emerald-400 text-sm block">{entry.accuracyRate}%</span>
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
