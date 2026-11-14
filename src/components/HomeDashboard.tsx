import React, { useMemo, useState } from 'react';
import {
  Language,
  NavTab,
  PaperId,
  UserProfile,
  ExamCountdownConfig,
  TestAttemptResult,
  PaymentRequest,
  StudySession,
  MCQQuestion,
  StudyTask,
  ExamUpdate,
  ExamAttemptId,
  StudyNote,
} from '../types';
import { PAPERS } from '../data/papersData';
import { CANONICAL_SYLLABUS } from '../data/syllabusData';
import { MOCK_EXAM_UPDATES } from '../data/mockUpdates';
import { MOCK_TESTS } from '../data/mockTests';
import { MOCK_NOTES } from '../data/mockNotes';
import { INITIAL_STUDY_TASKS } from '../data/mockPlanner';
import {
  getAllQuestions,
  getExamCountdownConfig,
  getStudentMembershipStatus,
  getUserPaymentHistory,
} from '../utils/storageDb';
import { computeDailyGoalSummary, computeStudyStats } from '../utils/studyTracker';
import { auditSyllabusCompleteness } from '../utils/syllabusCompleteness';
import {
  SUPPORTED_EXAM_ATTEMPTS,
  getAttemptMetadata,
  resolveCountdownForAttempt,
  filterMockTestsForAttempt,
  filterNotesForAttempt,
  filterUpdatesForAttempt,
} from '../utils/examAttempt';
import {
  Flame,
  Clock,
  CheckCircle2,
  ArrowRight,
  BookOpen,
  Award,
  Calendar,
  Sparkles,
  Sparkle,
  Bell,
  Calculator,
  Scale,
  LineChart,
  TrendingUp,
  ChevronRight,
  Users,
  Trophy,
  Gift,
  CreditCard,
  FileCheck2,
  XCircle,
  UserCheck,
  Receipt,
  ListChecks,
  X,
  BarChart3,
  ShieldCheck,
} from 'lucide-react';
import { ExamCountdownWidget } from './ExamCountdownWidget';
import heroStudyImg from '../assets/images/hero_study_desk_1794574704108.jpg';
import goalStudyImg from '../assets/images/motivation_ca_goal_1794574705043.jpg';

interface HomeDashboardProps {
  language: Language;
  setActiveTab: (tab: NavTab) => void;
  setSelectedPaperForPractice?: (paperId: PaperId) => void;
  selectedAttempt: ExamAttemptId;
  onChangeAttempt: (attempt: ExamAttemptId) => void;
  streak: number;
  studiedTodayMinutes: number;
  dailyGoalMinutes: number;
  questionsSolvedToday: number;
  dailyQuestionGoal: number;
  onOpenPaymentModal?: () => void;
  onOpenReferralModal?: () => void;
  currentUser?: UserProfile;
  countdownConfig?: ExamCountdownConfig;
  testHistory?: TestAttemptResult[];
  userPayments?: PaymentRequest[];
  studySessions?: StudySession[];
  chapterProgress?: Record<string, 'pending' | 'revising' | 'mastered'>;
  allQuestions?: MCQQuestion[];
  studyNotes?: StudyNote[];
  tasks?: StudyTask[];
  livePeersCount?: number;
  onOpenAuthModal?: () => void;
  isSuperAdmin?: boolean;
  examUpdates?: ExamUpdate[];
}

export const HomeDashboard: React.FC<HomeDashboardProps> = ({
  language,
  setActiveTab,
  setSelectedPaperForPractice,
  selectedAttempt,
  onChangeAttempt,
  streak,
  studiedTodayMinutes,
  dailyGoalMinutes,
  questionsSolvedToday,
  dailyQuestionGoal,
  onOpenPaymentModal,
  onOpenReferralModal,
  currentUser,
  countdownConfig,
  testHistory = [],
  userPayments,
  studySessions = [],
  chapterProgress = {},
  allQuestions,
  studyNotes,
  tasks = INITIAL_STUDY_TASKS,
  livePeersCount = 0,
  onOpenAuthModal,
  isSuperAdmin = false,
  examUpdates,
}) => {
  const [showSyllabusChecklist, setShowSyllabusChecklist] = useState(false);
  const [checklistPaperFilter, setChecklistPaperFilter] = useState<'all' | PaperId>('all');

  const isGuest = !currentUser || currentUser.id === 'guest';
  const baseCountdown = countdownConfig || getExamCountdownConfig();
  const resolvedCountdown = useMemo(
    () => resolveCountdownForAttempt(selectedAttempt, baseCountdown),
    [selectedAttempt, baseCountdown]
  );
  const attemptMeta = useMemo(() => getAttemptMetadata(selectedAttempt), [selectedAttempt]);

  const paymentHistory = useMemo(
    () => (userPayments !== undefined ? userPayments : currentUser && !isGuest ? getUserPaymentHistory(currentUser.id) : []),
    [userPayments, currentUser, isGuest]
  );

  const membership = getStudentMembershipStatus(currentUser, paymentHistory);
  const hasActivePass = membership.canAccessPremium;
  const latestPayment = paymentHistory[0];

  const questionBank = useMemo(() => allQuestions || getAllQuestions(), [allQuestions]);

  const studyStats = useMemo(
    () =>
      computeStudyStats(studySessions, testHistory, {
        dailyGoalMinutes: currentUser?.dailyGoalMinutes || dailyGoalMinutes,
        studyMinutesTotal: currentUser?.studyMinutesTotal || studiedTodayMinutes,
        totalQuestionsAttempted: currentUser?.totalQuestionsAttempted,
        totalQuestionsCorrect: currentUser?.totalQuestionsCorrect,
        studyStreak: streak,
      }),
    [studySessions, testHistory, currentUser, dailyGoalMinutes, studiedTodayMinutes, streak]
  );

  const effectiveTodayMins = Math.max(studyStats.todayMinutes, studiedTodayMinutes);
  const effectiveGoalMins = currentUser?.dailyGoalMinutes || dailyGoalMinutes || 120;
  const dailyGoalSummary = computeDailyGoalSummary(effectiveTodayMins, effectiveGoalMins);
  const studyProgress = dailyGoalSummary.percentComplete;
  const questionProgress = Math.min(100, Math.round((questionsSolvedToday / dailyQuestionGoal) * 100));

  const syllabusAudit = useMemo(
    () => auditSyllabusCompleteness(CANONICAL_SYLLABUS, questionBank, chapterProgress),
    [questionBank, chapterProgress]
  );

  const paperCompletionMap = useMemo(() => {
    const map: Record<PaperId, { total: number; mastered: number; revising: number; percent: number }> = {
      paper1: { total: 11, mastered: 0, revising: 0, percent: 0 },
      paper2: { total: 7, mastered: 0, revising: 0, percent: 0 },
      paper3: { total: 18, mastered: 0, revising: 0, percent: 0 },
      paper4: { total: 10, mastered: 0, revising: 0, percent: 0 },
    };
    for (const ch of CANONICAL_SYLLABUS) {
      const st = chapterProgress[ch.id];
      if (st === 'mastered') map[ch.paperId].mastered += 1;
      else if (st === 'revising') map[ch.paperId].revising += 1;
    }
    (['paper1', 'paper2', 'paper3', 'paper4'] as PaperId[]).forEach((pid) => {
      const entry = map[pid];
      entry.percent = entry.total > 0 ? Math.round(((entry.mastered + entry.revising * 0.5) / entry.total) * 100) : 0;
    });
    return map;
  }, [chapterProgress]);

  const getPaperIcon = (id: PaperId) => {
    switch (id) {
      case 'paper1':
        return Calculator;
      case 'paper2':
        return Scale;
      case 'paper3':
        return LineChart;
      case 'paper4':
        return TrendingUp;
    }
  };

  const handleStartPaperPractice = (paperId: PaperId) => {
    if (setSelectedPaperForPractice) {
      setSelectedPaperForPractice(paperId);
    }
    setActiveTab('practice');
  };

  const attemptUpdates = useMemo(
    () => filterUpdatesForAttempt(examUpdates && examUpdates.length > 0 ? examUpdates : MOCK_EXAM_UPDATES, selectedAttempt),
    [examUpdates, selectedAttempt]
  );
  const attemptMocks = useMemo(
    () => filterMockTestsForAttempt(MOCK_TESTS, selectedAttempt, false).slice(0, 2),
    [selectedAttempt]
  );
  const attemptNotes = useMemo(
    () => filterNotesForAttempt(studyNotes && studyNotes.length > 0 ? studyNotes : MOCK_NOTES, selectedAttempt, false).slice(0, 2),
    [studyNotes, selectedAttempt]
  );

  const latestUpdate = attemptUpdates[0] || (examUpdates && examUpdates.length > 0 ? examUpdates[0] : MOCK_EXAM_UPDATES[0]);
  const pendingTasks = tasks.filter((t) => !t.completed).slice(0, 3);
  const filteredAuditChapters =
    checklistPaperFilter === 'all'
      ? syllabusAudit.chapters
      : syllabusAudit.chapters.filter((c) => c.paperId === checklistPaperFilter);

  const overallMasteredCount = useMemo(
    () => CANONICAL_SYLLABUS.filter((c) => chapterProgress[c.id] === 'mastered').length,
    [chapterProgress]
  );

  return (
    <div className="space-y-6 pb-20 lg:pb-10">
      {/* 1. Hero Split Section with Desk Study Photography & Exam Attempt Switcher */}
      <section className="rounded-2xl overflow-hidden bg-white dark:bg-[#0F1936] border border-slate-200/90 dark:border-[#213059] shadow-sm">
        <div className="grid grid-cols-1 lg:grid-cols-12 items-stretch">
          <div className="lg:col-span-7 p-6 sm:p-8 flex flex-col justify-between space-y-5">
            <div className="space-y-3.5">
              {/* Interactive Exam Attempt Switcher */}
              <div className="flex flex-wrap items-center justify-between gap-2.5">
                <div className="inline-flex items-center gap-1 p-1 rounded-xl bg-slate-100 dark:bg-[#0B132B] border border-slate-200 dark:border-[#24335C]">
                  {SUPPORTED_EXAM_ATTEMPTS.map((attempt) => {
                    const meta = getAttemptMetadata(attempt);
                    const isSelected = selectedAttempt === attempt;
                    return (
                      <button
                        key={attempt}
                        type="button"
                        onClick={() => onChangeAttempt(attempt)}
                        aria-pressed={isSelected}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                          isSelected
                            ? 'bg-gradient-to-r from-[#172554] to-violet-700 text-white shadow-xs'
                            : 'text-slate-600 dark:text-slate-300 hover:text-[#0F1E46] dark:hover:text-white'
                        }`}
                      >
                        {meta.fullLabel[language]}
                      </button>
                    );
                  })}
                </div>

                <span className="px-2.5 py-1 rounded-lg bg-violet-50 dark:bg-violet-950/60 border border-violet-200/80 dark:border-violet-800 text-[11px] font-bold text-violet-700 dark:text-violet-300">
                  {attemptMeta.studyPhaseBadge[language]}
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-violet-700 dark:text-violet-300">
                <span>CA Foundation {attemptMeta.fullLabel[language]}</span>
                <span aria-hidden="true">·</span>
                <span>46 ICAI Chapters</span>
                <span aria-hidden="true">·</span>
                <span>Bilingual Hindi &amp; English</span>
              </div>

              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#0F1E46] dark:text-white leading-tight [text-wrap:balance]">
                {language === 'en'
                  ? `Structured Prep for CA Foundation ${attemptMeta.fullLabel.en}`
                  : `सीए फाउंडेशन ${attemptMeta.fullLabel.hi} हेतु व्यवस्थित एवं सटीक तैयारी`}
              </h1>

              <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed max-w-xl">
                {attemptMeta.syllabusNote[language]}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5 pt-1">
              <button
                type="button"
                onClick={() => setActiveTab('practice')}
                className="px-4 py-2.5 rounded-xl bg-violet-700 hover:bg-violet-800 text-white font-semibold text-xs sm:text-sm transition-colors cursor-pointer flex items-center gap-1.5 whitespace-nowrap shadow-xs"
              >
                <BookOpen className="w-4 h-4 shrink-0" />
                <span>{language === 'en' ? 'Start Chapter Practice' : 'अध्याय अभ्यास शुरू करें'}</span>
              </button>

              {isGuest && onOpenAuthModal ? (
                <button
                  type="button"
                  onClick={onOpenAuthModal}
                  className="px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-[#24335C] bg-white dark:bg-[#131E3D] hover:bg-slate-50 dark:hover:bg-[#1B2952] text-[#0F1E46] dark:text-slate-100 font-semibold text-xs sm:text-sm transition-colors cursor-pointer flex items-center gap-1.5 whitespace-nowrap"
                >
                  <UserCheck className="w-4 h-4 text-violet-700 dark:text-violet-400 shrink-0" />
                  <span>{language === 'en' ? 'Sign In with Google' : 'Google से साइन इन करें'}</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setActiveTab('dailyChallenge')}
                  className="px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-[#24335C] bg-white dark:bg-[#131E3D] hover:bg-slate-50 dark:hover:bg-[#1B2952] text-[#0F1E46] dark:text-slate-100 font-semibold text-xs sm:text-sm transition-colors cursor-pointer flex items-center gap-1.5 whitespace-nowrap"
                >
                  <Sparkles className="w-4 h-4 text-amber-500 shrink-0" />
                  <span>{language === 'en' ? 'Daily 10 Quiz' : 'दैनिक 10 प्रश्न'}</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => setShowSyllabusChecklist(true)}
                className="px-3 py-2.5 rounded-xl text-violet-700 dark:text-violet-300 hover:bg-violet-50 dark:hover:bg-violet-950/40 font-semibold text-xs sm:text-sm transition-colors cursor-pointer flex items-center gap-1.5 whitespace-nowrap"
              >
                <ListChecks className="w-4 h-4 shrink-0" />
                <span>{language === 'en' ? '46-Chapter Checklist' : '46-अध्याय सूची'}</span>
              </button>
            </div>
          </div>

          <div className="lg:col-span-5 relative min-h-[220px] lg:min-h-full bg-[#0B1739]">
            <img
              src={heroStudyImg}
              alt="CA Foundation study desk with accounting ledger and calculator"
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0B1739]/90 via-[#172554]/35 to-transparent flex flex-col justify-end p-5">
              <p className="text-xs font-medium text-violet-200">
                {isGuest
                  ? language === 'en'
                    ? `Guest Preview · ${attemptMeta.shortLabel.en} Mode`
                    : `अतिथि मोड · ${attemptMeta.shortLabel.hi}`
                  : `${currentUser.name} · ${attemptMeta.fullLabel[language]}`}
              </p>
              <p className="text-sm font-bold text-white mt-0.5 tabular-nums">
                {isSuperAdmin
                  ? language === 'en'
                    ? 'Owner Account · Free Unlimited Access'
                    : 'ओनर खाता · निःशुल्क पूर्ण प्रवेश'
                  : membership.status === 'active'
                    ? language === 'en'
                      ? `Active ₹5 Pass · ${membership.daysRemaining} days left`
                      : `सक्रिय ₹5 पास · ${membership.daysRemaining} दिन शेष`
                    : membership.status === 'pending'
                      ? language === 'en'
                        ? 'Payment Pending Admin Verification'
                        : 'भुगतान एडमिन सत्यापनाधीन है'
                      : language === 'en'
                        ? 'Unlock Full Access for ₹5 / Month'
                        : 'मात्र ₹5/माह में पूर्ण एक्सेस पाएं'}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Live Exam Countdown & Payment Approval Status Row */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch">
        <div className="lg:col-span-7">
          <ExamCountdownWidget
            language={language}
            config={resolvedCountdown}
            onOpenUpdates={() => setActiveTab('updates')}
          />
        </div>

        {/* Clean Membership Status OR Owner Console Card */}
        {isSuperAdmin ? (
          <section className="lg:col-span-5 bg-white dark:bg-[#0F1936] rounded-2xl p-5 border border-violet-200 dark:border-violet-800/80 shadow-xs flex flex-col justify-between gap-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2 text-xs">
                <span className="font-semibold text-violet-700 dark:text-violet-400 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4" />
                  <span>{language === 'en' ? 'Owner Access · Active Free' : 'ओनर एक्सेस · पूर्णतः निःशुल्क'}</span>
                </span>
                <span className="font-mono text-[11px] text-slate-500 dark:text-slate-400">
                  {currentUser?.email}
                </span>
              </div>
              <h3 className="text-base font-bold text-[#0F1E46] dark:text-white">
                {language === 'en' ? 'Private Owner Control Panel' : 'निजी ओनर नियंत्रण पैनल'}
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                {language === 'en'
                  ? 'You have permanent free access to all modules. Open the separate Owner Dashboard to verify ₹5 UPI claims, manage students, live study sessions, content, groups & analytics.'
                  : 'आपके पास सभी मॉड्यूल का निःशुल्क प्रवेश है। भुगतान, छात्रों, सामग्री व एनालिटिक्स के लिए अलग ओनर डैशबोर्ड खोलें।'}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100 dark:border-[#213059]">
              <button
                type="button"
                onClick={() => setActiveTab('admin')}
                className="flex-1 px-3.5 py-2 rounded-xl bg-violet-700 hover:bg-violet-800 text-white text-xs font-semibold transition-colors cursor-pointer flex items-center justify-center gap-1.5 whitespace-nowrap"
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>{language === 'en' ? 'Open Owner Dashboard' : 'ओनर डैशबोर्ड खोलें'}</span>
              </button>
              {onOpenAuthModal && (
                <button
                  type="button"
                  onClick={onOpenAuthModal}
                  className="px-3.5 py-2 rounded-xl border border-slate-200 dark:border-[#24335C] hover:bg-slate-50 dark:hover:bg-[#131E3D] text-slate-700 dark:text-slate-200 text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap"
                >
                  {language === 'en' ? 'Account' : 'खाता'}
                </button>
              )}
            </div>
          </section>
        ) : (
          <section className="lg:col-span-5 bg-white dark:bg-[#0F1936] rounded-2xl p-5 border border-slate-200/90 dark:border-[#213059] shadow-xs flex flex-col justify-between gap-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2 text-xs">
                <span className="font-semibold text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
                  {hasActivePass ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  ) : latestPayment?.status === 'pending' || membership.status === 'pending' ? (
                    <Clock className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                  ) : latestPayment?.status === 'rejected' ? (
                    <XCircle className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                  ) : (
                    <CreditCard className="w-4 h-4 text-violet-700 dark:text-violet-400" />
                  )}
                  <span>
                    {hasActivePass
                      ? language === 'en'
                        ? 'Membership: Active'
                        : 'सदस्यता: सक्रिय'
                      : latestPayment?.status === 'pending' || membership.status === 'pending'
                        ? language === 'en'
                          ? 'Payment: Pending Approval'
                          : 'भुगतान: सत्यापनाधीन'
                        : latestPayment?.status === 'rejected'
                          ? language === 'en'
                            ? 'Payment: Rejected'
                            : 'भुगतान: अस्वीकृत'
                          : membership.status === 'expired'
                            ? language === 'en'
                              ? 'Membership: Expired'
                              : 'सदस्यता: समाप्त'
                            : language === 'en'
                              ? 'Membership: Unpaid'
                              : 'सदस्यता: अनलॉक करें'}
                  </span>
                </span>
                {currentUser?.paymentReference && !isGuest && (
                  <span className="font-mono text-[11px] text-slate-500 dark:text-slate-400">
                    {currentUser.paymentReference}
                  </span>
                )}
              </div>

              <h3 className="text-base font-bold text-[#0F1E46] dark:text-white">
                {hasActivePass
                  ? language === 'en'
                    ? `Pro Access Active (${membership.daysRemaining}d remaining)`
                    : `प्रो एक्सेस सक्रिय (${membership.daysRemaining} दिन शेष)`
                  : latestPayment?.status === 'pending' || membership.status === 'pending'
                    ? language === 'en'
                      ? 'Admin Reviewing Bank UTR'
                      : 'एडमिन द्वारा UTR की जांच जारी'
                    : language === 'en'
                      ? '₹5 Monthly Student Membership'
                      : '₹5 मासिक विद्यार्थी सदस्यता'}
              </h3>

              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                {hasActivePass
                  ? language === 'en'
                    ? 'All 46 chapters, timed mock tests, PYQs, CA Saathi AI, and Common Study Group are unlocked.'
                    : 'सभी 46 अध्याय, मॉक टेस्ट, PYQs, एआई सॉल्वर व कम्युनिटी अनलॉक हैं।'
                  : latestPayment?.status === 'pending' || membership.status === 'pending'
                    ? language === 'en'
                      ? `UTR ${latestPayment?.utr || ''} submitted. Access activates immediately once verified by Admin.`
                      : `UTR ${latestPayment?.utr || ''} प्राप्त हुआ। एडमिन सत्यापन के बाद एक्सेस सक्रिय होगा।`
                    : latestPayment?.status === 'rejected'
                      ? `${language === 'en' ? 'Reason' : 'कारण'}: ${latestPayment.adminNotes || 'UTR mismatch'}`
                      : language === 'en'
                        ? 'Pay ₹5 to ajeet345@ptyes (Ajeet Patel), submit screenshot & UTR. Unlocks only after admin verification.'
                        : 'ajeet345@ptyes पर ₹5 भुगतान कर स्क्रीनशॉट व UTR अपलोड करें। एडमिन सत्यापन के बाद अनलॉक होगा।'}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100 dark:border-[#213059]">
              {onOpenPaymentModal && (
                <button
                  type="button"
                  onClick={onOpenPaymentModal}
                  className="flex-1 px-3.5 py-2 rounded-xl bg-violet-700 hover:bg-violet-800 text-white text-xs font-semibold transition-colors cursor-pointer flex items-center justify-center gap-1.5 whitespace-nowrap"
                >
                  <CreditCard className="w-3.5 h-3.5" />
                  <span>
                    {hasActivePass
                      ? language === 'en'
                        ? 'View Receipt'
                        : 'रसीद देखें'
                      : latestPayment?.status === 'pending'
                        ? language === 'en'
                          ? 'Payment Status'
                          : 'भुगतान स्थिति'
                        : language === 'en'
                          ? 'Pay ₹5 via UPI QR'
                          : '₹5 UPI भुगतान करें'}
                  </span>
                </button>
              )}
              {onOpenAuthModal && (
                <button
                  type="button"
                  onClick={onOpenAuthModal}
                  className="px-3.5 py-2 rounded-xl border border-slate-200 dark:border-[#24335C] hover:bg-slate-50 dark:hover:bg-[#131E3D] text-slate-700 dark:text-slate-200 text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap"
                >
                  {isGuest ? (language === 'en' ? 'Sign In' : 'साइन इन') : (language === 'en' ? 'Account' : 'खाता')}
                </button>
              )}
            </div>
          </section>
        )}
      </div>

      {/* 3. Study Tracker Metrics + Goal & Motivation Split */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch">
        <div className="lg:col-span-8 bg-white dark:bg-[#0F1936] rounded-2xl p-5 border border-slate-200/90 dark:border-[#213059] shadow-xs flex flex-col justify-between gap-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="text-base font-bold text-[#0F1E46] dark:text-white flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-violet-700 dark:text-violet-400" />
                <span>{language === 'en' ? 'Your Study Tracker' : 'आपका अध्ययन ट्रैकर'}</span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {language === 'en'
                  ? `Active study time is tracked automatically while practicing ${attemptMeta.shortLabel.en} modules.`
                  : 'अभ्यास, नोट्स व मॉक टेस्ट के दौरान आपका अध्ययन समय स्वतः रिकॉर्ड होता है।'}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setActiveTab('progress')}
              className="text-xs font-semibold text-violet-700 dark:text-violet-400 hover:underline flex items-center gap-1 cursor-pointer whitespace-nowrap"
            >
              <span>{language === 'en' ? 'Full Analytics' : 'पूरा विवरण'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#131E3D] border border-slate-200/70 dark:border-[#24335C]">
              <span className="text-xs text-slate-500 dark:text-slate-400 block">
                {language === 'en' ? 'Today / Goal' : 'आज / लक्ष्य'}
              </span>
              <span className="text-xl font-bold text-[#0F1E46] dark:text-white tabular-nums mt-1 block">
                {dailyGoalSummary.completedHours}h{' '}
                <span className="text-xs font-normal text-slate-500 dark:text-slate-400">/ {dailyGoalSummary.goalHours}h</span>
              </span>
              <div className="w-full bg-slate-200 dark:bg-[#24335C] rounded-full h-1.5 mt-2 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-[#172554] to-violet-600 h-1.5 rounded-full transition-all"
                  style={{ width: `${studyProgress}%` }}
                />
              </div>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 tabular-nums mt-1 block">
                {dailyGoalSummary.isGoalMet
                  ? language === 'en'
                    ? 'Daily target complete'
                    : 'दैनिक लक्ष्य पूर्ण'
                  : language === 'en'
                    ? `${dailyGoalSummary.remainingHours}h left today`
                    : `${dailyGoalSummary.remainingHours}h शेष`}
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#131E3D] border border-slate-200/70 dark:border-[#24335C]">
              <span className="text-xs text-slate-500 dark:text-slate-400 block">
                {language === 'en' ? 'Total Study' : 'कुल अध्ययन'}
              </span>
              <span className="text-xl font-bold text-[#0F1E46] dark:text-white tabular-nums mt-1 block">
                {studyStats.totalHours} hrs
              </span>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 tabular-nums mt-1 block">
                {studyStats.weeklyMinutes}m {language === 'en' ? 'this week' : 'इस सप्ताह'}
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#131E3D] border border-slate-200/70 dark:border-[#24335C]">
              <span className="text-xs text-slate-500 dark:text-slate-400 block">
                {language === 'en' ? 'MCQs Attempted' : 'हल प्रश्न'}
              </span>
              <span className="text-xl font-bold text-[#0F1E46] dark:text-white tabular-nums mt-1 block">
                {Math.max(studyStats.totalQuestionsAttempted, questionsSolvedToday)}
              </span>
              <span className="text-[11px] text-emerald-600 dark:text-emerald-400 tabular-nums mt-1 block font-medium">
                {studyStats.accuracyPercent}% {language === 'en' ? 'accuracy' : 'सटीकता'}
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#131E3D] border border-slate-200/70 dark:border-[#24335C]">
              <span className="text-xs text-slate-500 dark:text-slate-400 block">
                {language === 'en' ? 'Study Streak' : 'अध्ययन स्ट्रीक'}
              </span>
              <span className="text-xl font-bold text-[#0F1E46] dark:text-white tabular-nums mt-1 flex items-center gap-1.5">
                <Flame className="w-4 h-4 text-amber-500" />
                <span>{Math.max(studyStats.streakDays, streak)}d</span>
              </span>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 block tabular-nums">
                {questionsSolvedToday}/{dailyQuestionGoal} {language === 'en' ? 'today' : 'आज'} ({questionProgress}%)
              </span>
            </div>
          </div>
        </div>

        {/* Motivation & Journal Card */}
        <div className="lg:col-span-4 rounded-2xl overflow-hidden bg-white dark:bg-[#0F1936] border border-slate-200/90 dark:border-[#213059] shadow-xs flex flex-col">
          <div className="h-36 w-full relative overflow-hidden bg-[#0B1739]">
            <img
              src={goalStudyImg}
              alt="CA Foundation revision notebook and pen"
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover"
            />
          </div>
          <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
            <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed italic">
              {language === 'en'
                ? '"Chartered Accountancy rewards daily discipline over last-minute cramming. Finish one chapter a day cleanly."'
                : '"सीए परीक्षा अंतिम दिन की रटंत नहीं, बल्कि प्रतिदिन के अनुशासन से जीती जाती है।"'}
            </p>
            <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-100 dark:border-[#213059]">
              <span className="text-slate-500 dark:text-slate-400">
                {language === 'en' ? `Rec: ${attemptMeta.recommendedDailyHours}h/day` : `सुझाव: ${attemptMeta.recommendedDailyHours}h/दिन`}
              </span>
              <button
                type="button"
                onClick={() => setActiveTab('planner')}
                className="font-semibold text-violet-700 dark:text-violet-400 hover:underline cursor-pointer"
              >
                {language === 'en' ? 'Open Planner' : 'प्लानर खोलें'} &rarr;
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Attempt-Tailored Study Modules, Mock Tests & PYQ Focus */}
      <section className="rounded-2xl bg-gradient-to-r from-[#0B1739] via-[#172554] to-[#4C1D95] text-white p-5 sm:p-6 shadow-sm border border-indigo-800/60 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-violet-200">
              {attemptMeta.fullLabel[language]} · {attemptMeta.studyPhaseBadge[language]}
            </span>
            <h2 className="text-base sm:text-lg font-extrabold text-white mt-0.5">
              {language === 'en'
                ? `Curated Mocks, Modules & PYQs for ${attemptMeta.fullLabel.en}`
                : `${attemptMeta.fullLabel.hi} हेतु विशेष मॉक टेस्ट, मॉड्यूल व PYQs`}
            </h2>
            <p className="text-xs text-indigo-100/85 mt-0.5">{attemptMeta.pyqFocusSummary[language]}</p>
          </div>
          <button
            type="button"
            onClick={() => setActiveTab('mocks')}
            className="px-3.5 py-2 rounded-xl bg-white text-[#0B1739] hover:bg-violet-50 text-xs font-bold transition-colors cursor-pointer shrink-0 self-start sm:self-auto flex items-center gap-1.5"
          >
            <span>{language === 'en' ? `View ${attemptMeta.shortLabel.en} Mocks` : `${attemptMeta.shortLabel.hi} मॉक देखें`}</span>
            <ArrowRight className="w-3.5 h-3.5 text-violet-700" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {attemptMocks.map((mock) => (
            <button
              key={mock.id}
              type="button"
              onClick={() => setActiveTab('mocks')}
              className="p-3.5 rounded-xl bg-white/10 hover:bg-white/15 border border-white/15 text-left transition-colors cursor-pointer flex items-center justify-between gap-3"
            >
              <div className="min-w-0">
                <span className="text-[10px] font-bold uppercase tracking-wider text-violet-200 block">
                  {language === 'en' ? 'Recommended Mock Test' : 'अनुशंसित मॉक टेस्ट'} · {mock.durationMinutes} min
                </span>
                <p className="text-xs sm:text-sm font-bold text-white truncate mt-0.5">{mock.title[language]}</p>
              </div>
              <ChevronRight className="w-4 h-4 text-violet-200 shrink-0" />
            </button>
          ))}
          {attemptNotes.slice(0, 2).map((note) => (
            <button
              key={note.id}
              type="button"
              onClick={() => setActiveTab('notes')}
              className="p-3.5 rounded-xl bg-white/10 hover:bg-white/15 border border-white/15 text-left transition-colors cursor-pointer flex items-center justify-between gap-3"
            >
              <div className="min-w-0">
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-200 block">
                  {language === 'en' ? 'Attempt Revision Guide' : 'सत्र रिवीजन नोट्स'} · {note.readTimeMinutes}m read
                </span>
                <p className="text-xs sm:text-sm font-bold text-white truncate mt-0.5">{note.topicTitle[language]}</p>
              </div>
              <ChevronRight className="w-4 h-4 text-violet-200 shrink-0" />
            </button>
          ))}
        </div>
      </section>

      {/* 5. All 4 CA Foundation Subjects & Exam Preparation Progress Cards */}
      <section className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="text-lg font-bold text-[#0F1E46] dark:text-white flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-violet-700 dark:text-violet-400" />
              <span>
                {language === 'en'
                  ? `CA Foundation ${attemptMeta.fullLabel.en} Preparation Cards (46 Chapters)`
                  : `सीए फाउंडेशन ${attemptMeta.fullLabel.hi} विषय तैयारी कार्ड (46 अध्याय)`}
              </span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 tabular-nums">
              {language === 'en'
                ? `${overallMasteredCount}/${syllabusAudit.totalChapters} chapters mastered · ${syllabusAudit.coveredChapters}/${syllabusAudit.totalChapters} official chapters active with MCQs & PYQs`
                : `${overallMasteredCount}/${syllabusAudit.totalChapters} अध्याय पूर्ण · ${syllabusAudit.coveredChapters} आधिकारिक अध्यायों में MCQ व PYQs उपलब्ध`}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setShowSyllabusChecklist(true)}
              className="text-xs font-semibold text-[#0F1E46] dark:text-slate-200 border border-slate-200 dark:border-[#24335C] px-3 py-1.5 rounded-lg hover:bg-slate-50 dark:hover:bg-[#131E3D] flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
            >
              <ListChecks className="w-3.5 h-3.5 text-violet-700 dark:text-violet-400" />
              <span>{language === 'en' ? 'Syllabus Completeness Checklist' : 'पाठ्यक्रम पूर्णता सूची'}</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('practice')}
              className="text-xs font-semibold text-violet-700 dark:text-violet-400 hover:underline flex items-center gap-1 cursor-pointer whitespace-nowrap"
            >
              <span>{language === 'en' ? 'Practice All' : 'सभी अभ्यास'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {PAPERS.map((paper) => {
            const Icon = getPaperIcon(paper.id);
            const paperStats = paperCompletionMap[paper.id];
            const summary = syllabusAudit.byPaper[paper.id];
            return (
              <div
                key={paper.id}
                className="bg-white dark:bg-[#0F1936] rounded-2xl p-4 sm:p-5 border border-slate-200/90 dark:border-[#213059] shadow-xs hover:border-violet-300 dark:hover:border-violet-600 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#0B1739] to-violet-700 text-white flex items-center justify-center shrink-0 shadow-xs">
                        <Icon className="w-5 h-5" />
                      </div>
                      <div>
                        <span className="text-xs font-semibold text-violet-700 dark:text-violet-300 tabular-nums">
                          {paper.code} · {summary.totalChapters} Chapters · {summary.totalQuestions} MCQs
                        </span>
                        <h3 className="font-bold text-[#0F1E46] dark:text-white text-sm sm:text-base leading-snug">
                          {paper.name[language]}
                        </h3>
                      </div>
                    </div>
                  </div>

                  <div className="mt-3">
                    <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400 mb-1.5">
                      <span>
                        {language === 'en' ? 'Chapter Mastery' : 'अध्याय प्रगति'} ({paperStats.mastered}/
                        {paperStats.total})
                      </span>
                      <span className="font-bold text-[#0F1E46] dark:text-slate-200 tabular-nums">
                        {paperStats.percent}%
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 dark:bg-[#1A274D] rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-[#172554] to-violet-600 h-2 rounded-full transition-all"
                        style={{ width: `${paperStats.percent}%` }}
                      />
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 mt-4 pt-3 border-t border-slate-100 dark:border-[#213059]">
                  <button
                    type="button"
                    onClick={() => handleStartPaperPractice(paper.id)}
                    className="flex-1 py-2 px-3 rounded-xl bg-violet-50 dark:bg-violet-950/60 hover:bg-violet-100 dark:hover:bg-violet-900/60 text-violet-800 dark:text-violet-200 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <BookOpen className="w-3.5 h-3.5" />
                    <span>{language === 'en' ? 'Chapter MCQs & PYQs' : 'अध्याय MCQ व PYQ'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('notes')}
                    className="py-2 px-3 rounded-xl border border-slate-200 dark:border-[#24335C] hover:bg-slate-50 dark:hover:bg-[#131E3D] text-slate-700 dark:text-slate-200 text-xs font-semibold transition-colors cursor-pointer"
                  >
                    {language === 'en' ? 'Notes' : 'नोट्स'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 6. Core Learning Tools */}
      <section className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <button
          type="button"
          onClick={() => setActiveTab('dailyChallenge')}
          className="p-3.5 bg-white dark:bg-[#0F1936] rounded-xl border border-slate-200/90 dark:border-[#213059] hover:border-violet-400 text-left transition-colors cursor-pointer"
        >
          <Sparkles className="w-5 h-5 text-amber-500 mb-2" />
          <span className="text-xs font-bold text-[#0F1E46] dark:text-white block">
            {language === 'en' ? 'Daily 10 Quiz' : 'दैनिक 10 प्रश्न'}
          </span>
          <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 block">
            {language === 'en' ? 'Daily streak set' : 'दैनिक अभ्यास'}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('doubtSolver')}
          className="p-3.5 bg-white dark:bg-[#0F1936] rounded-xl border border-slate-200/90 dark:border-[#213059] hover:border-violet-400 text-left transition-colors cursor-pointer"
        >
          <Sparkle className="w-5 h-5 text-violet-700 dark:text-violet-400 mb-2" />
          <span className="text-xs font-bold text-[#0F1E46] dark:text-white block">
            {language === 'en' ? 'CA Saathi AI' : 'सीए साथी AI'}
          </span>
          <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 block">
            {language === 'en' ? 'Concept breakdown' : 'चरणबद्ध हल'}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('mocks')}
          className="p-3.5 bg-white dark:bg-[#0F1936] rounded-xl border border-slate-200/90 dark:border-[#213059] hover:border-violet-400 text-left transition-colors cursor-pointer"
        >
          <Award className="w-5 h-5 text-[#172554] dark:text-indigo-300 mb-2" />
          <span className="text-xs font-bold text-[#0F1E46] dark:text-white block">
            {language === 'en' ? 'Mock Tests' : 'मॉक टेस्ट'}
          </span>
          <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 block">
            {attemptMeta.shortLabel[language]} {language === 'en' ? 'Pattern' : 'प्रारूप'}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('leaderboard')}
          className="p-3.5 bg-white dark:bg-[#0F1936] rounded-xl border border-slate-200/90 dark:border-[#213059] hover:border-violet-400 text-left transition-colors cursor-pointer"
        >
          <Trophy className="w-5 h-5 text-amber-600 dark:text-amber-400 mb-2" />
          <span className="text-xs font-bold text-[#0F1E46] dark:text-white block">
            {language === 'en' ? 'AIR Rankings' : 'ऑल इंडिया रैंक'}
          </span>
          <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 block">
            {language === 'en' ? 'National rank' : 'राष्ट्रीय रैंक'}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('progress')}
          className="p-3.5 bg-white dark:bg-[#0F1936] rounded-xl border border-slate-200/90 dark:border-[#213059] hover:border-violet-400 text-left transition-colors cursor-pointer"
        >
          <BarChart3 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 mb-2" />
          <span className="text-xs font-bold text-[#0F1E46] dark:text-white block">
            {language === 'en' ? 'Study Tracker' : 'स्टडी ट्रैकर'}
          </span>
          <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 block">
            {language === 'en' ? 'Hours & goals' : 'घंटे व लक्ष्य'}
          </span>
        </button>

        {onOpenReferralModal && (
          <button
            type="button"
            onClick={onOpenReferralModal}
            className="p-3.5 bg-white dark:bg-[#0F1936] rounded-xl border border-slate-200/90 dark:border-[#213059] hover:border-violet-400 text-left transition-colors cursor-pointer"
          >
            <Gift className="w-5 h-5 text-violet-600 dark:text-violet-400 mb-2" />
            <span className="text-xs font-bold text-[#0F1E46] dark:text-white block">
              {language === 'en' ? 'Refer & Rewards' : 'रेफर व पुरस्कार'}
            </span>
            <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 block tabular-nums">
              {currentUser?.referralPoints || 0} {language === 'en' ? 'points' : 'अंक'}
            </span>
          </button>
        )}
      </section>

      {/* 7. Single Common Student Group & Live Peer Study Room */}
      <section className="bg-white dark:bg-[#0F1936] rounded-2xl p-5 border border-slate-200/90 dark:border-[#213059] shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
            <span className="font-semibold text-violet-700 dark:text-violet-400">
              {language === 'en' ? 'Single Common Community' : 'एक साझा विद्यार्थी समुदाय'}
            </span>
            <span aria-hidden="true">·</span>
            <span className="tabular-nums">
              {livePeersCount > 0
                ? `${livePeersCount} ${language === 'en' ? 'students studying live now' : 'छात्र अभी लाइव पढ़ रहे हैं'}`
                : language === 'en'
                  ? 'Live Study Room ready'
                  : 'लाइव स्टडी रूम तैयार'}
            </span>
          </div>
          <h3 className="font-bold text-base text-[#0F1E46] dark:text-white flex items-center gap-2">
            <Users className="w-4 h-4 text-violet-700 dark:text-violet-400" />
            <span>{language === 'en' ? 'CA Saathi Aspirants Community (2027 Attempts)' : 'सीए साथी 2027 विद्यार्थी समुदाय'}</span>
          </h3>
          <p className="text-xs text-slate-600 dark:text-slate-300 max-w-2xl">
            {language === 'en'
              ? 'All January 2027 & May 2027 CA Foundation students connect inside one unified group—filter doubts by Paper 1–4, study alongside live peers, and view real study timers.'
              : 'जनवरी 2027 व मई 2027 के सभी विद्यार्थी एक साझा समूह में जुड़ते हैं—पेपर 1–4 के अनुसार शंकाएं पूछें व लाइव स्टडी रूम में साथ पढ़ें।'}
          </p>
        </div>

        <button
          type="button"
          onClick={() => setActiveTab('community')}
          className="px-4 py-2.5 rounded-xl bg-[#172554] hover:bg-[#1E3A8A] text-white font-semibold text-xs sm:text-sm transition-colors cursor-pointer flex items-center gap-2 shrink-0 whitespace-nowrap self-start md:self-auto"
        >
          <Users className="w-4 h-4" />
          <span>{language === 'en' ? 'Open Common Group' : 'साझा ग्रुप खोलें'}</span>
        </button>
      </section>

      {/* 8. Today's Tasks & Latest ICAI Notification */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white dark:bg-[#0F1936] rounded-xl p-4 border border-slate-200/90 dark:border-[#213059] shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-[#0F1E46] dark:text-white text-sm flex items-center gap-2">
              <Calendar className="w-4 h-4 text-violet-700 dark:text-violet-400" />
              {language === 'en' ? "Today's Study Checklist" : 'आज की अध्ययन सूची'}
            </h3>
            <button
              type="button"
              onClick={() => setActiveTab('planner')}
              className="text-xs font-semibold text-violet-700 dark:text-violet-400 hover:underline cursor-pointer"
            >
              {language === 'en' ? 'Open Syllabus & Planner' : 'प्लानर खोलें'} &rarr;
            </button>
          </div>

          <div className="space-y-2">
            {pendingTasks.length === 0 ? (
              <p className="text-xs text-slate-500 dark:text-slate-400 py-3">
                {language === 'en' ? 'All planned tasks completed today.' : 'आज के सभी कार्य पूर्ण हो गए हैं।'}
              </p>
            ) : (
              pendingTasks.map((task) => (
                <button
                  key={task.id}
                  type="button"
                  onClick={() => setActiveTab('planner')}
                  className="w-full p-3 rounded-lg border border-slate-200/80 dark:border-[#24335C] hover:border-violet-300 dark:hover:border-violet-700 bg-slate-50/70 dark:bg-[#131E3D]/60 transition-colors flex items-center justify-between text-left cursor-pointer"
                >
                  <div>
                    <p className="text-xs font-semibold text-[#0F1E46] dark:text-slate-200 line-clamp-1">
                      {task.title[language]}
                    </p>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400">
                      {task.chapter[language]} · {task.durationMinutes} min
                    </span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
                </button>
              ))
            )}
          </div>
        </div>

        <div className="bg-white dark:bg-[#0F1936] rounded-xl p-4 border border-slate-200/90 dark:border-[#213059] shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-2">
              <span className="font-semibold text-amber-700 dark:text-amber-400 flex items-center gap-1.5">
                <Bell className="w-3.5 h-3.5" />
                <span>{latestUpdate.category}</span>
              </span>
              <span>{latestUpdate.date}</span>
            </div>
            <h4 className="font-bold text-[#0F1E46] dark:text-white text-sm mb-1">
              {latestUpdate.title[language]}
            </h4>
            <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2 leading-relaxed">
              {latestUpdate.summary[language]}
            </p>
          </div>

          <button
            type="button"
            onClick={() => setActiveTab('updates')}
            className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-violet-700 dark:text-violet-400 hover:underline self-start cursor-pointer"
          >
            {language === 'en' ? 'Read Official Updates' : 'सभी अपडेट्स पढ़ें'} &rarr;
          </button>
        </div>
      </section>

      {/* 9. Mock Test & Payment History */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <section className="bg-white dark:bg-[#0F1936] rounded-xl p-5 border border-slate-200/90 dark:border-[#213059] shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm text-[#0F1E46] dark:text-white flex items-center gap-2">
              <Award className="w-4 h-4 text-violet-700 dark:text-violet-400" />
              <span>{language === 'en' ? 'Recent Mock Tests' : 'हालिया मॉक टेस्ट'}</span>
            </h3>
            <button
              type="button"
              onClick={() => setActiveTab('mocks')}
              className="text-xs font-semibold text-violet-700 dark:text-violet-400 hover:underline cursor-pointer"
            >
              {language === 'en' ? 'Open Mocks' : 'टेस्ट खोलें'} &rarr;
            </button>
          </div>

          {testHistory.length === 0 ? (
            <p className="text-xs text-slate-500 dark:text-slate-400 py-4 text-center">
              {language === 'en' ? 'No mock tests attempted yet.' : 'अभी तक कोई मॉक टेस्ट नहीं दिया गया है।'}
            </p>
          ) : (
            <div className="space-y-2">
              {testHistory.slice(0, 3).map((test, idx) => (
                <div
                  key={`${test.testId}_${idx}`}
                  className="p-3 rounded-lg border border-slate-200/80 dark:border-[#24335C] bg-slate-50/50 dark:bg-[#131E3D]/60 flex items-center justify-between gap-3 text-xs"
                >
                  <div className="min-w-0">
                    <p className="font-semibold text-[#0F1E46] dark:text-white truncate">{test.testTitle[language]}</p>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400 tabular-nums">
                      {test.date} · {test.correct}/{test.totalQuestions} correct
                    </span>
                  </div>
                  <div className="text-right shrink-0 tabular-nums">
                    <span className="font-bold text-[#0F1E46] dark:text-white block">{test.score.toFixed(2)}</span>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400">{test.percentage}%</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {!isSuperAdmin && (
          <section className="bg-white dark:bg-[#0F1936] rounded-xl p-5 border border-slate-200/90 dark:border-[#213059] shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-sm text-[#0F1E46] dark:text-white flex items-center gap-2">
                <Receipt className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>{language === 'en' ? 'Your Payment History' : 'आपका भुगतान इतिहास'}</span>
              </h3>
              {onOpenPaymentModal && (
                <button
                  type="button"
                  onClick={onOpenPaymentModal}
                  className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer"
                >
                  {language === 'en' ? 'Pay / Check Status' : 'भुगतान / स्थिति'} &rarr;
                </button>
              )}
            </div>

            {paymentHistory.length === 0 ? (
              <p className="text-xs text-slate-500 dark:text-slate-400 py-4 text-center">
                {isGuest
                  ? language === 'en'
                    ? 'Sign in and submit your ₹5 UPI payment to view verification history.'
                    : 'सत्यापन इतिहास देखने के लिए साइन इन करें व ₹5 का भुगतान जमा करें।'
                  : language === 'en'
                    ? 'No payments submitted yet.'
                    : 'अभी तक कोई भुगतान जमा नहीं किया गया है।'}
              </p>
            ) : (
              <div className="space-y-2">
                {paymentHistory.slice(0, 3).map((p) => (
                  <div
                    key={p.id}
                    className="p-3 rounded-lg border border-slate-200/80 dark:border-[#24335C] bg-slate-50/50 dark:bg-[#131E3D]/60 flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="min-w-0">
                      <p className="font-semibold text-[#0F1E46] dark:text-white tabular-nums">
                        ₹{p.amount} Monthly Pass · {p.status.toUpperCase()}
                      </p>
                      <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400 truncate block">
                        UTR: {p.utr} · {new Date(p.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    {onOpenPaymentModal && (
                      <button
                        type="button"
                        onClick={onOpenPaymentModal}
                        className="px-2.5 py-1 rounded-lg border border-slate-200 dark:border-[#24335C] text-slate-700 dark:text-slate-300 text-xs font-medium cursor-pointer shrink-0"
                      >
                        {language === 'en' ? 'Details' : 'विवरण'}
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </section>
        )}
      </div>

      {/* Syllabus Completeness Checklist Modal (All 46 Canonical ICAI 2027 Chapters) */}
      {showSyllabusChecklist && (
        <div className="fixed inset-0 z-50 bg-[#080F24]/70 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#0F1936] border border-slate-200 dark:border-[#24335C] rounded-2xl max-w-4xl w-full max-h-[88vh] flex flex-col shadow-2xl overflow-hidden">
            <div className="px-5 py-4 bg-gradient-to-r from-[#0B1739] to-[#4C1D95] text-white flex items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-violet-200" />
                  <span>
                    {language === 'en'
                      ? `ICAI ${attemptMeta.fullLabel.en} Syllabus Completeness Checklist`
                      : `आईसीएआई ${attemptMeta.fullLabel.hi} पाठ्यक्रम पूर्णता सूची`}
                  </span>
                </h3>
                <p className="text-xs text-violet-100/85 tabular-nums">
                  {syllabusAudit.coveredChapters}/{syllabusAudit.totalChapters} chapters active ({syllabusAudit.overallCompletenessPercent}% coverage) · {questionBank.length} MCQs verified
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowSyllabusChecklist(false)}
                aria-label="Close syllabus checklist"
                className="p-2 rounded-lg text-white/80 hover:bg-white/10 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="px-5 py-3 border-b border-slate-100 dark:border-[#213059] flex flex-wrap items-center gap-2 bg-slate-50 dark:bg-[#0B132B]/60">
              {(['all', 'paper1', 'paper2', 'paper3', 'paper4'] as const).map((pid) => (
                <button
                  key={pid}
                  type="button"
                  onClick={() => setChecklistPaperFilter(pid)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                    checklistPaperFilter === pid
                      ? 'bg-violet-700 text-white'
                      : 'bg-white dark:bg-[#131E3D] text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-[#24335C]'
                  }`}
                >
                  {pid === 'all'
                    ? `All 4 Papers (${syllabusAudit.totalChapters})`
                    : pid === 'paper1'
                      ? `Paper 1: Accounting (${syllabusAudit.byPaper.paper1.totalChapters})`
                      : pid === 'paper2'
                        ? `Paper 2: Business Laws (${syllabusAudit.byPaper.paper2.totalChapters})`
                        : pid === 'paper3'
                          ? `Paper 3: Quant Aptitude (${syllabusAudit.byPaper.paper3.totalChapters})`
                          : `Paper 4: Business Economics (${syllabusAudit.byPaper.paper4.totalChapters})`}
                </button>
              ))}
            </div>

            <div className="p-5 overflow-y-auto space-y-2">
              {filteredAuditChapters.map((ch) => {
                const progressState = chapterProgress[ch.chapterId] || 'pending';
                return (
                  <div
                    key={ch.chapterId}
                    className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
                  >
                    <div className="space-y-0.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-[11px] font-semibold text-blue-600 dark:text-blue-400 uppercase">
                          {ch.paperId.replace('paper', 'Paper ')} · Ch {ch.chapterNumber}
                        </span>
                        <span className="font-bold text-slate-900 dark:text-white">{ch.titleEn}</span>
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 tabular-nums">
                        {ch.topicsCount} topics · {ch.mcqCount} MCQs · {ch.pyqCount} PYQs · Status: {progressState}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setShowSyllabusChecklist(false);
                        handleStartPaperPractice(ch.paperId);
                      }}
                      className="px-3 py-1.5 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 font-semibold hover:bg-blue-100 cursor-pointer shrink-0 self-start sm:self-center"
                    >
                      {language === 'en' ? 'Practice' : 'अभ्यास'} &rarr;
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
