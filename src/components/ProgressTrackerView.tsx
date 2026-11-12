import React from 'react';
import { Language, PaperId, TestAttemptResult } from '../types';
import { PAPERS } from '../data/papersData';
import { 
  getStudentBadges, 
  getStudentAnalytics, 
  getCurrentUser 
} from '../utils/storageDb';
import { 
  TrendingUp, 
  Award, 
  Flame, 
  CheckCircle2, 
  Clock, 
  BarChart3, 
  Target, 
  Sparkles, 
  Calendar,
  AlertCircle,
  BookOpen,
  ShieldAlert,
  ArrowRight,
  Zap,
  HelpCircle
} from 'lucide-react';

interface ProgressTrackerViewProps {
  language: Language;
  streak: number;
  studiedTodayMinutes: number;
  totalQuestionsSolved: number;
  accuracyRate: number;
  testHistory: TestAttemptResult[];
}

export const ProgressTrackerView: React.FC<ProgressTrackerViewProps> = ({
  language,
  streak,
  studiedTodayMinutes,
  totalQuestionsSolved,
  accuracyRate,
  testHistory,
}) => {
  const currentUser = getCurrentUser();
  const badges = getStudentBadges(currentUser);
  const analytics = getStudentAnalytics(currentUser);

  // 7-day study history data
  const studyDays = [
    { day: language === 'en' ? 'Mon' : 'सोम', minutes: 75 },
    { day: language === 'en' ? 'Tue' : 'मंगल', minutes: 90 },
    { day: language === 'en' ? 'Wed' : 'बुध', minutes: 45 },
    { day: language === 'en' ? 'Thu' : 'गुरु', minutes: 110 },
    { day: language === 'en' ? 'Fri' : 'शुक्र', minutes: 60 },
    { day: language === 'en' ? 'Sat' : 'शनि', minutes: 120 },
    { day: language === 'en' ? 'Sun' : 'रवि', minutes: Math.max(studiedTodayMinutes, 45) },
  ];

  const maxMinutes = Math.max(...studyDays.map((d) => d.minutes), 120);

  // Overall syllabus readiness score calculated from question accuracy and streak
  const computedQuestionsSolved = Math.max(totalQuestionsSolved, analytics.totalAttempted);
  const computedAccuracy = analytics.totalAttempted > 0 ? analytics.accuracyRate : accuracyRate;
  const overallReadiness = Math.min(
    95,
    Math.max(45, Math.round(computedAccuracy * 0.6 + Math.min(streak * 3, 20) + (computedQuestionsSolved > 10 ? 15 : 5)))
  );

  return (
    <div className="space-y-6 pb-20 lg:pb-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <TrendingUp className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            {language === 'en' ? 'Student Analytics & Performance Hub' : 'छात्र प्रगति एवं प्रदर्शन केंद्र'}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            {language === 'en'
              ? 'Complete tracking for CA Foundation January 2027: subject analytics, chapter mastery & gamification badges'
              : 'सीए फाउंडेशन जनवरी 2027 हेतु संपूर्ण विश्लेषण: विषयवार प्रदर्शन, अध्याय प्रवीणता एवं उपलब्धि बैज'}
          </p>
        </div>

        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300 text-xs font-bold self-start sm:self-auto">
          <Zap className="w-4 h-4 text-amber-600 dark:text-amber-400" />
          <span>{currentUser.learningPoints || analytics.learningPoints} {language === 'en' ? 'Learning Points' : 'अंक'}</span>
        </div>
      </div>

      {/* Top Metric Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3.5">
        {/* Overall Readiness Gauge */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 sm:p-5 border border-slate-200/90 dark:border-slate-800 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-600 dark:text-slate-400 mb-2">
            <span>{language === 'en' ? 'Jan 2027 Readiness' : 'जनवरी 2027 तत्परता'}</span>
            <Target className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          </div>
          <div className="flex items-baseline gap-2 mb-2">
            <span className="text-3xl font-black text-blue-600 dark:text-blue-400">{overallReadiness}%</span>
            <span className="text-xs text-slate-500 dark:text-slate-400">{language === 'en' ? 'Exam Ready' : 'तैयार'}</span>
          </div>
          <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2 overflow-hidden mb-1">
            <div
              className="bg-gradient-to-r from-blue-600 to-indigo-600 h-2 rounded-full"
              style={{ width: `${overallReadiness}%` }}
            />
          </div>
          <span className="text-[10px] text-slate-500 dark:text-slate-400">
            {language === 'en' ? 'Target: 80%+ aggregate' : 'लक्ष्य: कुल 80%+ स्कोर'}
          </span>
        </div>

        {/* Total Questions Solved */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 sm:p-5 border border-slate-200/90 dark:border-slate-800 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-600 dark:text-slate-400 mb-2">
            <span>{language === 'en' ? 'MCQs Attempted' : 'प्रयास किए गए प्रश्न'}</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div className="flex items-baseline gap-2 mb-2">
            <span className="text-3xl font-black text-slate-900 dark:text-slate-100">{computedQuestionsSolved}</span>
            <span className="text-xs text-slate-500 dark:text-slate-400">{language === 'en' ? 'Total' : 'कुल'}</span>
          </div>
          <div className="text-[11px] text-emerald-700 dark:text-emerald-300 font-bold bg-emerald-50 dark:bg-emerald-950/60 px-2.5 py-1 rounded-lg border border-emerald-100 dark:border-emerald-800 self-start">
            {language === 'en' ? `Accuracy: ${computedAccuracy}%` : `सटीकता: ${computedAccuracy}%`}
          </div>
        </div>

        {/* Current Active Streak */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 sm:p-5 border border-slate-200/90 dark:border-slate-800 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-600 dark:text-slate-400 mb-2">
            <span>{language === 'en' ? 'Daily Study Streak' : 'दैनिक अध्ययन लय'}</span>
            <Flame className="w-4 h-4 text-amber-500" />
          </div>
          <div className="flex items-baseline gap-2 mb-2">
            <span className="text-3xl font-black text-amber-600 dark:text-amber-400">{currentUser.studyStreak || streak || 1}</span>
            <span className="text-xs text-slate-500 dark:text-slate-400">{language === 'en' ? 'Days' : 'दिन लगातार'}</span>
          </div>
          <span className="text-[11px] text-slate-600 dark:text-slate-400">
            {language === 'en' ? 'Streak multiplier active (+5 pts)' : 'लकीर गुणक सक्रिय (+5 अतिरिक्त)'}
          </span>
        </div>

        {/* Badges Unlocked */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 sm:p-5 border border-slate-200/90 dark:border-slate-800 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-600 dark:text-slate-400 mb-2">
            <span>{language === 'en' ? 'Badges Unlocked' : 'प्राप्त बैज'}</span>
            <Award className="w-4 h-4 text-purple-600 dark:text-purple-400" />
          </div>
          <div className="flex items-baseline gap-2 mb-2">
            <span className="text-3xl font-black text-purple-600 dark:text-purple-400">
              {badges.filter((b) => b.isUnlocked).length} / {badges.length}
            </span>
          </div>
          <span className="text-[11px] text-purple-700 dark:text-purple-300 font-semibold">
            {badges.filter((b) => b.isUnlocked).length === badges.length
              ? (language === 'en' ? 'All badges unlocked!' : 'सभी बैज पूर्ण!')
              : (language === 'en' ? 'Next milestone in progress' : 'अगला लक्ष्य जारी है')}
          </span>
        </div>
      </div>

      {/* --- ALL 4 CA FOUNDATION SUBJECTS ACCURACY BREAKDOWN --- */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 sm:p-6 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
        <div>
          <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            {language === 'en' ? 'Subject-wise Performance Breakdown (All 4 Papers)' : 'विषयवार प्रदर्शन विश्लेषण (चारों प्रश्नपत्र)'}
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {language === 'en'
              ? 'Real-time accuracy and attempt tracking across official ICAI modules and past exams'
              : 'आईसीएआई मॉड्यूल एवं विगत वर्षों के प्रश्नों पर आधारित वास्तविक सटीकता'}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {PAPERS.map((p) => {
            const stat = analytics.subjectBreakdown[p.id] || { attempted: 0, correct: 0, accuracy: 0 };
            return (
              <div
                key={p.id}
                className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 flex flex-col justify-between space-y-3"
              >
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-md bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-300">
                      {p.code}
                    </span>
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      {stat.accuracy > 0 ? `${stat.accuracy}%` : `${p.progressPercent}%`}
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
                      style={{ width: `${Math.max(10, stat.accuracy > 0 ? stat.accuracy : p.progressPercent)}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400">
                    <span>{stat.attempted} {language === 'en' ? 'Attempted' : 'प्रयास'}</span>
                    <span className="text-emerald-600 dark:text-emerald-400 font-semibold">{stat.correct} {language === 'en' ? 'Correct' : 'सही'}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* --- WEAK CHAPTER DIAGNOSTICS & TARGETED RECOMMENDATIONS --- */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 sm:p-6 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-rose-600 dark:text-rose-400" />
              {language === 'en' ? 'Diagnostic Weak Areas & Exam Strategy' : 'कमजोर विषय विश्लेषण एवं परीक्षा रणनीति'}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {language === 'en'
                ? 'Targeted revision plan for CA Foundation January 2027 based on your practice errors'
                : 'आपकी गलतियों के आधार पर जनवरी 2027 सीए फाउंडेशन परीक्षा हेतु समर्पित सुधार योजना'}
            </p>
          </div>
          <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-rose-50 dark:bg-rose-950 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
            {analytics.weakChapters.length} {language === 'en' ? 'Areas Flagged' : 'पहचाने गए क्षेत्र'}
          </span>
        </div>

        {analytics.weakChapters.length > 0 ? (
          <div className="space-y-2.5">
            {analytics.weakChapters.map((w, idx) => (
              <div
                key={idx}
                className="p-3.5 rounded-xl border border-rose-200 dark:border-rose-900 bg-rose-50/40 dark:bg-rose-950/20 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-rose-100 dark:bg-rose-900 flex items-center justify-center font-bold text-rose-700 dark:text-rose-300 shrink-0">
                    !
                  </div>
                  <div>
                    <span className="font-bold text-rose-950 dark:text-rose-200 uppercase">
                      {w.paperId.toUpperCase()} • {w.questionId}
                    </span>
                    <p className="text-slate-600 dark:text-slate-400 text-[11px] mt-0.5">
                      {language === 'en'
                        ? `Incorrect ${w.failedCount} time(s). Last attempted on ${w.lastAttemptDate}. Prioritize ICAI Study Material Unit examples.`
                        : `${w.failedCount} बार गलत हुआ। अंतिम प्रयास: ${w.lastAttemptDate}। आईसीएआई मॉड्यूल उदाहरणों का पुनः अभ्यास करें।`}
                    </p>
                  </div>
                </div>

                <span className="text-[10px] font-bold px-2.5 py-1 rounded-md bg-rose-200/80 dark:bg-rose-900 text-rose-900 dark:text-rose-200 self-start sm:self-auto shrink-0">
                  {language === 'en' ? 'Revise in Wrong Notebook' : 'त्रुटि पुस्तिका में दोहराएं'}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-4 rounded-xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50/40 dark:bg-emerald-950/20 flex items-center gap-3 text-xs text-emerald-900 dark:text-emerald-200">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <div>
              <span className="font-bold">
                {language === 'en' ? 'Excellent accuracy across all practiced chapters!' : 'सभी अभ्यास किए गए अध्यायों में उत्कृष्ट सटीकता!'}
              </span>
              <p className="text-[11px] text-emerald-800 dark:text-emerald-300 mt-0.5">
                {language === 'en'
                  ? 'No critical weak spots detected in your Wrong Questions Notebook. Keep challenging yourself with timed mocks.'
                  : 'आपकी त्रुटि पुस्तिका में कोई गंभीर कमजोर क्षेत्र नहीं है। समयबद्ध मॉक टेस्ट के साथ अभ्यास जारी रखें।'}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* --- 7-DAY STUDY HOURS CHART --- */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 sm:p-6 border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Clock className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              {language === 'en' ? '7-Day Study Activity (Minutes per day)' : 'गत 7 दिनों की पढ़ाई का समय (प्रतिदिन मिनट)'}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {language === 'en' ? 'Track your daily study consistency' : 'दैनिक अध्ययन समय की निगरानी करें'}
            </p>
          </div>
          <span className="text-xs font-bold text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950 px-2.5 py-1 rounded-lg border border-blue-100 dark:border-blue-800">
            {studyDays.reduce((acc, curr) => acc + curr.minutes, 0)} {language === 'en' ? 'mins this week' : 'मिनट इस सप्ताह'}
          </span>
        </div>

        {/* Responsive bar chart */}
        <div className="h-44 flex items-end justify-between gap-2 pt-6 pb-2 border-b border-slate-100 dark:border-slate-800">
          {studyDays.map((item, idx) => {
            const heightPercent = Math.max(12, Math.round((item.minutes / maxMinutes) * 100));
            const isToday = idx === studyDays.length - 1;

            return (
              <div key={idx} className="flex-1 flex flex-col items-center gap-2 h-full justify-end group">
                <span className="text-[10px] font-bold text-slate-600 dark:text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity">
                  {item.minutes}m
                </span>
                <div className="w-full max-w-[42px] bg-slate-100 dark:bg-slate-800 rounded-t-lg h-full flex items-end overflow-hidden">
                  <div
                    className={`w-full rounded-t-lg transition-all duration-500 ${
                      isToday ? 'bg-blue-600' : 'bg-blue-400 group-hover:bg-blue-500'
                    }`}
                    style={{ height: `${heightPercent}%` }}
                  />
                </div>
                <span className={`text-[11px] font-semibold ${isToday ? 'text-blue-700 dark:text-blue-400 font-bold' : 'text-slate-500 dark:text-slate-400'}`}>
                  {item.day}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* --- ACHIEVEMENT BADGES & GAMIFICATION GALLERY --- */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 sm:p-6 border border-slate-200 dark:border-slate-800 shadow-xs">
        <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-slate-100 mb-3 flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-amber-500" />
          {language === 'en' ? 'CA Foundation Badges & Achievements' : 'सीए फाउंडेशन बैज एवं उपलब्धियां'}
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {badges.map((ach) => (
            <div
              key={ach.id}
              className={`p-3.5 rounded-xl border text-center transition-all flex flex-col justify-between ${
                ach.isUnlocked
                  ? 'bg-amber-50/50 dark:bg-amber-950/30 border-amber-300 dark:border-amber-800 shadow-xs'
                  : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200/60 dark:border-slate-800 opacity-60'
              }`}
            >
              <div>
                <div className="text-2xl mb-1">{ach.icon}</div>
                <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 leading-tight mb-0.5">
                  {ach.name[language]}
                </h4>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-relaxed mb-2">
                  {ach.description[language]}
                </p>
              </div>

              <div>
                <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-1.5 overflow-hidden mb-1">
                  <div
                    className={`h-1.5 rounded-full ${ach.isUnlocked ? 'bg-amber-500' : 'bg-blue-500'}`}
                    style={{ width: `${Math.min(100, (ach.progress / ach.target) * 100)}%` }}
                  />
                </div>
                <span className="text-[10px] font-bold text-slate-600 dark:text-slate-400">
                  {ach.isUnlocked ? (language === 'en' ? '✓ Unlocked' : '✓ प्राप्त') : `${ach.progress}/${ach.target}`}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Mock Test Attempts History */}
      {testHistory.length > 0 && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 sm:p-6 border border-slate-200 dark:border-slate-800 shadow-xs">
          <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-slate-100 mb-3 flex items-center gap-2">
            <Award className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            {language === 'en' ? 'Recent Mock Test Attempts' : 'हाल ही में दिए गए मॉक टेस्ट'}
          </h3>
          <div className="space-y-2.5">
            {testHistory.map((rec, idx) => (
              <div
                key={idx}
                className="p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 flex items-center justify-between text-xs"
              >
                <div>
                  <h4 className="font-bold text-slate-900 dark:text-slate-100 text-sm">{rec.testTitle[language]}</h4>
                  <span className="text-slate-500 dark:text-slate-400">{rec.date} • {rec.totalQuestions} Questions</span>
                </div>
                <div className="text-right">
                  <div className="text-sm font-bold text-blue-600 dark:text-blue-400">
                    {rec.score} / {rec.totalQuestions}
                  </div>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">
                    {rec.percentage}% ({language === 'en' ? 'Accuracy' : 'सटीकता'}: {Math.round((rec.correct / Math.max(1, rec.attempted)) * 100)}%)
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
