import React, { useState } from 'react';
import { ExamAttemptId, Language, StudySession, TestAttemptResult, UserProfile } from '../types';
import { PAPERS } from '../data/papersData';
import { CANONICAL_SYLLABUS, getCanonicalChaptersByPaper } from '../data/syllabusData';
import { getAttemptMetadata } from '../utils/examAttempt';
import { computeDailyGoalSummary, computeStudyStats } from '../utils/studyTracker';
import { getStudentBadges, getStudentAnalytics, getCurrentUser } from '../utils/storageDb';
import emptyBooksImg from '../assets/images/empty_study_state_1794574705091.jpg';
import {
  TrendingUp,
  Award,
  Flame,
  CheckCircle2,
  Clock,
  BarChart3,
  Target,
  Sparkles,
  ShieldAlert,
  Zap,
  BookOpen,
} from 'lucide-react';

interface ProgressTrackerViewProps {
  language: Language;
  selectedAttempt?: ExamAttemptId;
  streak: number;
  studiedTodayMinutes: number;
  totalQuestionsSolved: number;
  accuracyRate: number;
  testHistory: TestAttemptResult[];
  studySessions?: StudySession[];
  currentUser?: UserProfile;
  chapterProgress?: Record<string, 'pending' | 'revising' | 'mastered'>;
  onUpdateDailyGoal?: (goalMinutes: number) => void;
}

export const ProgressTrackerView: React.FC<ProgressTrackerViewProps> = ({
  language,
  selectedAttempt = 'January 2027',
  streak,
  studiedTodayMinutes,
  totalQuestionsSolved,
  accuracyRate,
  testHistory,
  studySessions = [],
  currentUser: propUser,
  chapterProgress = {},
  onUpdateDailyGoal,
}) => {
  const attemptMeta = getAttemptMetadata(selectedAttempt);
  const effectiveUser = propUser || getCurrentUser();
  const badges = getStudentBadges(effectiveUser);
  const analytics = getStudentAnalytics(effectiveUser);

  const studyStats = computeStudyStats(
    studySessions,
    testHistory,
    {
      dailyGoalMinutes: effectiveUser.dailyGoalMinutes || 120,
      studyMinutesTotal: Math.max(effectiveUser.studyMinutesTotal || 0, studiedTodayMinutes),
      totalQuestionsAttempted: Math.max(
        effectiveUser.totalQuestionsAttempted || 0,
        totalQuestionsSolved,
        analytics.totalAttempted
      ),
      totalQuestionsCorrect: Math.max(
        effectiveUser.totalQuestionsCorrect || 0,
        analytics.totalCorrect || Math.round((totalQuestionsSolved * accuracyRate) / 100)
      ),
      studyStreak: Math.max(effectiveUser.studyStreak || 0, streak),
    }
  );

  const [goalDraftHours, setGoalDraftHours] = useState<number>(() =>
    Number(((effectiveUser.dailyGoalMinutes || 120) / 60).toFixed(1))
  );
  const [goalSavedMsg, setGoalSavedMsg] = useState(false);

  const effectiveTodayMinutes = Math.max(studyStats.todayMinutes, studiedTodayMinutes);
  const dailyGoalSummary = computeDailyGoalSummary(effectiveTodayMinutes, effectiveUser.dailyGoalMinutes || 120);

  const handleApplyDailyGoal = (hours: number) => {
    const clampedHours = Math.max(0.5, Math.min(12, hours));
    setGoalDraftHours(clampedHours);
    if (onUpdateDailyGoal) {
      onUpdateDailyGoal(Math.round(clampedHours * 60));
      setGoalSavedMsg(true);
      setTimeout(() => setGoalSavedMsg(false), 2000);
    }
  };

  const maxMinutes = Math.max(...studyStats.weeklySeries.map((d) => d.minutes), studyStats.dailyGoalMinutes, 60);

  const masteredChaptersCount = CANONICAL_SYLLABUS.filter((c) => chapterProgress[c.id] === 'mastered').length;
  const revisingChaptersCount = CANONICAL_SYLLABUS.filter((c) => chapterProgress[c.id] === 'revising').length;
  const syllabusMasteryPercent = Math.round((masteredChaptersCount / CANONICAL_SYLLABUS.length) * 100);

  const hasAnyStudyActivity =
    studyStats.totalMinutes > 0 || studyStats.totalQuestionsAttempted > 0 || testHistory.length > 0;

  return (
    <div className="space-y-6 pb-20 lg:pb-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-[#0F1E46] dark:text-slate-100 flex items-center gap-2 tracking-tight">
            <TrendingUp className="w-6 h-6 text-violet-700 dark:text-violet-400" />
            {language === 'en' ? 'Student Study Tracker & Analytics' : 'छात्र अध्ययन ट्रैकर एवं विश्लेषण'}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            {language === 'en'
              ? `Real tracked study hours, daily goal completion, 46-chapter mastery & accuracy for ${attemptMeta.fullLabel.en}`
              : `${attemptMeta.fullLabel.hi} परीक्षा हेतु वास्तविक अध्ययन घंटे, दैनिक लक्ष्य, 46-अध्याय प्रगति एवं प्रश्न सटीकता`}
          </p>
        </div>

        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300 text-xs font-bold self-start sm:self-auto tabular-nums">
          <Zap className="w-4 h-4 text-amber-600 dark:text-amber-400" />
          <span>{effectiveUser.learningPoints || analytics.learningPoints} Learning Points</span>
        </div>
      </div>

      {/* Top 4 Genuine Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Card 1: Daily Study Goal */}
        <div className="bg-white dark:bg-[#0F1936] rounded-2xl p-4 sm:p-5 border border-slate-200/90 dark:border-[#213059] shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-600 dark:text-slate-400 mb-2">
            <span>{language === 'en' ? 'Daily Study Target' : 'दैनिक अध्ययन लक्ष्य'}</span>
            <Target className="w-4 h-4 text-violet-700 dark:text-violet-400" />
          </div>
          <div className="flex items-baseline gap-2 mb-2 tabular-nums">
            <span className="text-3xl font-black text-[#172554] dark:text-violet-300">
              {dailyGoalSummary.completedHours}h
            </span>
            <span className="text-xs text-slate-500">
              / {dailyGoalSummary.goalHours}h goal ({dailyGoalSummary.percentComplete}%)
            </span>
          </div>
          <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2 overflow-hidden mb-1.5">
            <div
              className={`h-2 rounded-full transition-all duration-500 ${
                dailyGoalSummary.isGoalMet ? 'bg-emerald-600' : 'bg-blue-600'
              }`}
              style={{ width: `${dailyGoalSummary.percentComplete}%` }}
            />
          </div>
          <div className="flex items-center justify-between text-[11px] text-slate-500 tabular-nums">
            <span>
              {dailyGoalSummary.isGoalMet
                ? language === 'en'
                  ? 'Goal achieved!'
                  : 'लक्ष्य पूरा!'
                : `${dailyGoalSummary.remainingHours}h ${language === 'en' ? 'remaining' : 'शेष'}`}
            </span>
            <span>{studyStats.totalHours}h lifetime</span>
          </div>
        </div>

        {/* Card 2: Questions Attempted, Correct & Incorrect */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 sm:p-5 border border-slate-200/90 dark:border-slate-800 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-600 dark:text-slate-400 mb-2">
            <span>{language === 'en' ? 'Questions & Accuracy' : 'प्रश्न एवं सटीकता'}</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div className="flex items-baseline gap-2 mb-2 tabular-nums">
            <span className="text-3xl font-black text-slate-900 dark:text-slate-100">
              {studyStats.totalQuestionsAttempted}
            </span>
            <span className="text-xs text-slate-500">attempted ({studyStats.accuracyPercent}%)</span>
          </div>
          <div className="flex items-center gap-2 text-[11px] font-bold tabular-nums">
            <span className="px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300">
              {studyStats.totalQuestionsCorrect} Correct
            </span>
            <span className="px-2 py-0.5 rounded bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300">
              {studyStats.totalQuestionsIncorrect} Incorrect
            </span>
          </div>
        </div>

        {/* Card 3: 46-Chapter Mastery */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 sm:p-5 border border-slate-200/90 dark:border-slate-800 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-600 dark:text-slate-400 mb-2">
            <span>{language === 'en' ? 'Syllabus Mastery' : 'पाठ्यक्रम प्रवीणता'}</span>
            <BookOpen className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
          </div>
          <div className="flex items-baseline gap-2 mb-2 tabular-nums">
            <span className="text-3xl font-black text-indigo-600 dark:text-indigo-400">
              {masteredChaptersCount}/{CANONICAL_SYLLABUS.length}
            </span>
            <span className="text-xs text-slate-500">chapters ({syllabusMasteryPercent}%)</span>
          </div>
          <span className="text-[11px] text-slate-500 tabular-nums">
            {revisingChaptersCount} currently revising across 4 papers
          </span>
        </div>

        {/* Card 4: Study Streak & Badges */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 sm:p-5 border border-slate-200/90 dark:border-slate-800 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-600 dark:text-slate-400 mb-2">
            <span>{language === 'en' ? 'Study Streak & Badges' : 'अध्ययन लय व बैज'}</span>
            <Flame className="w-4 h-4 text-amber-500" />
          </div>
          <div className="flex items-baseline gap-2 mb-2 tabular-nums">
            <span className="text-3xl font-black text-amber-600 dark:text-amber-400">{studyStats.streakDays}</span>
            <span className="text-xs text-slate-500">days active streak</span>
          </div>
          <span className="text-[11px] text-purple-700 dark:text-purple-300 font-semibold tabular-nums">
            {badges.filter((b) => b.isUnlocked).length} / {badges.length} Badges Unlocked
          </span>
        </div>
      </div>

      {/* Interactive Daily Study Target Configurator */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 sm:p-5 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Target className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">
              {language === 'en' ? 'Set Daily Study Target' : 'दैनिक अध्ययन लक्ष्य निर्धारित करें'}
            </h2>
            {goalSavedMsg && (
              <span className="px-2 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 text-[11px] font-bold">
                {language === 'en' ? 'Target Saved' : 'लक्ष्य सहेजा गया'}
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 tabular-nums">
            {language === 'en'
              ? `Completed ${dailyGoalSummary.completedHours}h today · ${dailyGoalSummary.remainingHours}h remaining toward your ${dailyGoalSummary.goalHours}h goal`
              : `आज ${dailyGoalSummary.completedHours} घंटे पूरे · ${dailyGoalSummary.goalHours} घंटे के लक्ष्य में ${dailyGoalSummary.remainingHours} घंटे शेष`}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {[1, 2, 3, 4, 6].map((presetHours) => {
            const isSelected = Math.abs(goalDraftHours - presetHours) < 0.05;
            return (
              <button
                key={presetHours}
                type="button"
                onClick={() => handleApplyDailyGoal(presetHours)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer tabular-nums ${
                  isSelected
                    ? 'bg-violet-700 text-white border-violet-700 shadow-xs'
                    : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-violet-400'
                }`}
              >
                {presetHours}h
              </button>
            );
          })}

          <div className="flex items-center gap-1.5 pl-1">
            <input
              type="number"
              min={0.5}
              max={12}
              step={0.5}
              aria-label={language === 'en' ? 'Custom daily study hours' : 'कस्टम दैनिक अध्ययन घंटे'}
              value={goalDraftHours}
              onChange={(e) => setGoalDraftHours(Number(e.target.value) || 0.5)}
              className="w-16 px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold text-slate-900 dark:text-slate-100 tabular-nums focus:outline-none focus:ring-2 focus:ring-violet-500"
            />
            <button
              type="button"
              onClick={() => handleApplyDailyGoal(goalDraftHours)}
              className="px-3 py-1.5 rounded-xl bg-[#172554] dark:bg-violet-700 hover:bg-[#1e316e] dark:hover:bg-violet-800 text-white text-xs font-bold cursor-pointer transition-colors"
            >
              {language === 'en' ? 'Save Goal' : 'लक्ष्य सहेजें'}
            </button>
          </div>
        </div>
      </div>

      {/* Empty State Banner when brand new student has 0 logged activity */}
      {!hasAnyStudyActivity && (
        <div className="bg-white dark:bg-[#0F1936] rounded-2xl p-5 border border-slate-200 dark:border-[#213059] flex flex-col sm:flex-row items-center gap-5">
          <img
            src={emptyBooksImg}
            alt="Start your CA Foundation study log"
            className="w-full sm:w-44 h-32 object-cover rounded-xl shrink-0"
          />
          <div className="space-y-1.5">
            <h3 className="text-base font-bold text-[#0F1E46] dark:text-white">
              {language === 'en'
                ? `Your ${attemptMeta.fullLabel.en} Study Log Starts Here`
                : `आपका ${attemptMeta.fullLabel.hi} अध्ययन रिकॉर्ड यहाँ शुरू होता है`}
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              {language === 'en'
                ? 'Active study time, daily streaks, MCQ accuracy, and chapter mastery are automatically recorded whenever you solve MCQs, attempt Mock Tests, or run the Focus Timer.'
                : 'जैसे ही आप प्रश्न हल करेंगे, मॉक टेस्ट देंगे या फोकस टाइमर चलाएंगे, आपकी प्रगति अपने आप दर्ज होने लगेगी।'}
            </p>
          </div>
        </div>
      )}

      {/* --- ALL 4 CA FOUNDATION SUBJECTS & CHAPTER MASTERY BREAKDOWN --- */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 sm:p-6 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
        <div>
          <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            {language === 'en'
              ? 'Subject-wise Accuracy & Chapter Progress (All 46 Chapters)'
              : 'विषयवार सटीकता एवं अध्याय प्रगति (सभी 46 अध्याय)'}
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {PAPERS.map((p) => {
            const stat = analytics.subjectBreakdown[p.id] || { attempted: 0, correct: 0, accuracy: 0 };
            const paperChs = getCanonicalChaptersByPaper(p.id);
            const paperMastered = paperChs.filter((c) => chapterProgress[c.id] === 'mastered').length;
            const paperCompletion = Math.round((paperMastered / paperChs.length) * 100);

            return (
              <div
                key={p.id}
                className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 flex flex-col justify-between space-y-3"
              >
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-300">
                      {p.code}
                    </span>
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300 tabular-nums">
                      {paperMastered}/{paperChs.length} Ch
                    </span>
                  </div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
                    {p.name[language]}
                  </h4>
                </div>

                <div className="space-y-1.5">
                  <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${paperCompletion}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400 tabular-nums">
                    <span>{stat.attempted} Qs</span>
                    <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                      {stat.attempted > 0 ? `${stat.accuracy}% Accuracy` : '0 attempts'}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* --- REAL 7-DAY ROLLING STUDY ACTIVITY CHART --- */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 sm:p-6 border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Clock className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              {language === 'en' ? '7-Day Rolling Study Activity (Minutes / Day)' : 'गत 7 दिनों की अध्ययन गतिविधि (मिनट/दिन)'}
            </h3>
            <p className="text-xs text-slate-500">Automatically logged active minutes across practice, mocks & focus sessions</p>
          </div>
          <span className="text-xs font-bold text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950 px-2.5 py-1 rounded-lg border border-blue-100 dark:border-blue-800 tabular-nums">
            {studyStats.weeklyMinutes} mins this week
          </span>
        </div>

        <div className="h-44 flex items-end justify-between gap-2 pt-6 pb-2 border-b border-slate-100 dark:border-slate-800">
          {studyStats.weeklySeries.map((item, idx) => {
            const heightPercent = item.minutes > 0 ? Math.max(8, Math.round((item.minutes / maxMinutes) * 100)) : 4;
            const isToday = idx === studyStats.weeklySeries.length - 1;
            return (
              <div key={item.date} className="flex-1 flex flex-col items-center gap-2 h-full justify-end group">
                <span className="text-[10px] font-bold text-slate-600 dark:text-slate-400 tabular-nums">
                  {item.minutes}m
                </span>
                <div className="w-full max-w-[42px] bg-slate-100 dark:bg-slate-800 rounded-t-lg h-full flex items-end overflow-hidden">
                  <div
                    className={`w-full rounded-t-lg transition-all duration-500 ${
                      item.minutes === 0
                        ? 'bg-slate-200 dark:bg-slate-700'
                        : isToday
                          ? 'bg-violet-700'
                          : 'bg-violet-400 group-hover:bg-violet-500'
                    }`}
                    style={{ height: `${heightPercent}%` }}
                  />
                </div>
                <span className={`text-[11px] font-semibold ${isToday ? 'text-blue-700 dark:text-blue-400 font-bold' : 'text-slate-500'}`}>
                  {item.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Weak Areas Diagnostic */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 sm:p-6 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-rose-600 dark:text-rose-400" />
              {language === 'en' ? 'Diagnostic Weak Areas' : 'कमजोर विषय विश्लेषण'}
            </h3>
          </div>
          <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-rose-50 dark:bg-rose-950 text-rose-700 dark:text-rose-300 border border-rose-200">
            {analytics.weakChapters.length} Flagged
          </span>
        </div>

        {analytics.weakChapters.length > 0 ? (
          <div className="space-y-2.5">
            {analytics.weakChapters.map((w, idx) => (
              <div
                key={idx}
                className="p-3.5 rounded-xl border border-rose-200 dark:border-rose-900 bg-rose-50/40 dark:bg-rose-950/20 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
              >
                <div>
                  <span className="font-bold text-rose-950 dark:text-rose-200 uppercase">
                    {w.paperId.toUpperCase()} • {w.questionId}
                  </span>
                  <p className="text-slate-600 dark:text-slate-400 text-[11px] mt-0.5">
                    Incorrect {w.failedCount}x • Last attempted: {w.lastAttemptDate}
                  </p>
                </div>
                <span className="text-[10px] font-bold px-2.5 py-1 rounded bg-rose-200/80 text-rose-900">
                  Revise in Wrong Notebook
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-4 rounded-xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50/40 dark:bg-emerald-950/20 flex items-center gap-3 text-xs text-emerald-900 dark:text-emerald-200">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>
              {language === 'en'
                ? 'No unresolved mistakes flagged in your Wrong Questions Notebook.'
                : 'आपकी त्रुटि पुस्तिका में कोई लंबित गलती नहीं है।'}
            </span>
          </div>
        )}
      </div>

      {/* Achievements Gallery */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 sm:p-6 border border-slate-200 dark:border-slate-800 shadow-xs">
        <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-slate-100 mb-3 flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-amber-500" />
          {language === 'en' ? 'CA Foundation Achievements' : 'सीए फाउंडेशन उपलब्धियां'}
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {badges.map((ach) => (
            <div
              key={ach.id}
              className={`p-3.5 rounded-xl border text-center flex flex-col justify-between ${
                ach.isUnlocked
                  ? 'bg-amber-50/50 dark:bg-amber-950/30 border-amber-300'
                  : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200/60 opacity-65'
              }`}
            >
              <div>
                <div className="text-2xl mb-1">{ach.icon}</div>
                <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 mb-0.5">{ach.name[language]}</h4>
                <p className="text-[10px] text-slate-500 mb-2">{ach.description[language]}</p>
              </div>
              <div>
                <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-1.5 overflow-hidden mb-1">
                  <div
                    className={`h-1.5 rounded-full ${ach.isUnlocked ? 'bg-amber-500' : 'bg-blue-500'}`}
                    style={{ width: `${Math.min(100, (ach.progress / ach.target) * 100)}%` }}
                  />
                </div>
                <span className="text-[10px] font-bold text-slate-600 dark:text-slate-400 tabular-nums">
                  {ach.isUnlocked ? 'Unlocked ✓' : `${ach.progress}/${ach.target}`}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Mock Test History */}
      {testHistory.length > 0 && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 sm:p-6 border border-slate-200 dark:border-slate-800 shadow-xs">
          <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-slate-100 mb-3 flex items-center gap-2">
            <Award className="w-4 h-4 text-blue-600" />
            {language === 'en' ? 'Recent Mock Test Attempts' : 'हाल के मॉक टेस्ट परिणाम'}
          </h3>
          <div className="space-y-2.5">
            {testHistory.map((rec, idx) => (
              <div
                key={idx}
                className="p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 flex items-center justify-between text-xs"
              >
                <div>
                  <h4 className="font-bold text-slate-900 dark:text-slate-100 text-sm">{rec.testTitle[language]}</h4>
                  <span className="text-slate-500">{rec.date} • {rec.totalQuestions} Questions</span>
                </div>
                <div className="text-right tabular-nums">
                  <div className="text-sm font-bold text-blue-600 dark:text-blue-400">
                    {rec.score} / {rec.totalQuestions}
                  </div>
                  <span className="text-[11px] text-slate-500">{rec.percentage}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
