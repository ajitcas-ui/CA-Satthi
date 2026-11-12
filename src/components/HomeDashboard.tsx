import React from 'react';
import { 
  Language, 
  NavTab, 
  PaperId, 
  UserProfile, 
  ExamCountdownConfig, 
  TestAttemptResult 
} from '../types';
import { PAPERS } from '../data/papersData';
import { MOCK_EXAM_UPDATES } from '../data/mockUpdates';
import { INITIAL_STUDY_TASKS } from '../data/mockPlanner';
import { 
  getUserPaymentHistory, 
  checkUserHasValidPass, 
  getExamCountdownConfig, 
  getStudentMembershipStatus 
} from '../utils/storageDb';
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
  Play, 
  Bell,
  Calculator,
  Scale,
  LineChart,
  TrendingUp,
  Target,
  ChevronRight,
  Users,
  MessageSquare,
  Notebook,
  Trophy,
  Gift,
  CreditCard,
  History,
  FileCheck2,
  XCircle,
  ExternalLink,
  ShieldCheck,
  LogOut,
  Receipt,
  UserCheck,
  Check
} from 'lucide-react';
import { ExamCountdownWidget } from './ExamCountdownWidget';

interface HomeDashboardProps {
  language: Language;
  setActiveTab: (tab: NavTab) => void;
  setSelectedPaperForPractice?: (paperId: PaperId) => void;
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
  onOpenAuthModal?: () => void;
}

export const HomeDashboard: React.FC<HomeDashboardProps> = ({
  language,
  setActiveTab,
  setSelectedPaperForPractice,
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
  onOpenAuthModal,
}) => {
  const resolvedCountdown = countdownConfig || getExamCountdownConfig();
  const paymentHistory = currentUser ? getUserPaymentHistory(currentUser.id) : [];
  const membership = getStudentMembershipStatus(currentUser, paymentHistory);
  const hasActivePass = membership.canAccessPremium;
  const latestPayment = paymentHistory[0];

  const getPaperIcon = (id: PaperId) => {
    switch (id) {
      case 'paper1': return Calculator;
      case 'paper2': return Scale;
      case 'paper3': return LineChart;
      case 'paper4': return TrendingUp;
    }
  };

  const handleStartPaperPractice = (paperId: PaperId) => {
    if (setSelectedPaperForPractice) {
      setSelectedPaperForPractice(paperId);
    }
    setActiveTab('practice');
  };

  const studyProgress = Math.min(100, Math.round((studiedTodayMinutes / dailyGoalMinutes) * 100));
  const questionProgress = Math.min(100, Math.round((questionsSolvedToday / dailyQuestionGoal) * 100));

  const latestUpdate = MOCK_EXAM_UPDATES[0];
  const pendingTasks = INITIAL_STUDY_TASKS.filter(t => !t.completed).slice(0, 2);

  return (
    <div className="space-y-6 pb-20 lg:pb-8">
      {/* 1. Verified Student Profile & Membership Status Header Card */}
      {currentUser && (
        <section className="bg-white dark:bg-slate-900 rounded-2xl p-4 sm:p-5 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            {/* Student Info */}
            <div className="flex items-start sm:items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-purple-600 text-white flex items-center justify-center text-2xl shadow-md shadow-blue-500/20 shrink-0">
                {currentUser.avatar || '🎓'}
              </div>

              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white">
                    {currentUser.name}
                  </h2>

                  {/* Membership Status Badge */}
                  <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-black uppercase tracking-wider border flex items-center gap-1.5 ${
                    membership.status === 'active'
                      ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-300 dark:border-emerald-700 text-emerald-700 dark:text-emerald-300'
                      : membership.status === 'pending'
                        ? 'bg-amber-50 dark:bg-amber-950/60 border-amber-300 dark:border-amber-700 text-amber-800 dark:text-amber-300'
                        : membership.status === 'expired'
                          ? 'bg-rose-50 dark:bg-rose-950/60 border-rose-300 dark:border-rose-700 text-rose-700 dark:text-rose-300'
                          : 'bg-blue-50 dark:bg-blue-950/60 border-blue-300 dark:border-blue-700 text-blue-700 dark:text-blue-300'
                  }`}>
                    {membership.status === 'active' ? (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                        <span>{language === 'en' ? `Active Pro (${membership.daysRemaining}d Left)` : `सक्रिय प्रो (${membership.daysRemaining} दिन शेष)`}</span>
                      </>
                    ) : membership.status === 'pending' ? (
                      <>
                        <Clock className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 animate-spin" />
                        <span>{language === 'en' ? 'Payment Pending' : 'सत्यापनाधीन'}</span>
                      </>
                    ) : membership.status === 'expired' ? (
                      <>
                        <XCircle className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
                        <span>{language === 'en' ? 'Pass Expired' : 'पास समाप्त'}</span>
                      </>
                    ) : (
                      <>
                        <CreditCard className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                        <span>{language === 'en' ? 'Free Tier' : 'निःशुल्क टीयर'}</span>
                      </>
                    )}
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500 dark:text-slate-400">
                  <span>{currentUser.email}</span>
                  {currentUser.phone && (
                    <>
                      <span>•</span>
                      <span className="font-mono text-slate-700 dark:text-slate-300">
                        📱 {currentUser.phone}
                      </span>
                    </>
                  )}
                  <span>•</span>
                  <span className="text-blue-600 dark:text-blue-400 font-bold">
                    Target: {currentUser.targetAttempt}
                  </span>
                  {currentUser.paymentReference && (
                    <>
                      <span>•</span>
                      <span className="font-mono bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                        Ref: {currentUser.paymentReference}
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Quick Actions for Profile */}
            <div className="flex flex-wrap items-center gap-2 self-start md:self-auto shrink-0">
              {onOpenPaymentModal && (
                <button
                  onClick={onOpenPaymentModal}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold shadow-xs cursor-pointer flex items-center gap-1.5 transition-all active:scale-95 ${
                    membership.status === 'active'
                      ? 'bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 text-emerald-800 dark:text-emerald-200 border border-emerald-300 dark:border-emerald-700'
                      : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                  }`}
                >
                  <CreditCard className="w-3.5 h-3.5" />
                  <span>
                    {membership.status === 'active'
                      ? (language === 'en' ? 'View Membership Pass' : 'सदस्यता पास देखें')
                      : membership.status === 'pending'
                        ? (language === 'en' ? 'Check Payment Status' : 'भुगतान स्थिति जांचें')
                        : (language === 'en' ? 'Unlock ₹5 / Month Pass' : '₹5/माह पास अनलॉक करें')}
                  </span>
                </button>
              )}

              {onOpenAuthModal && (
                <button
                  onClick={onOpenAuthModal}
                  className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                  title="Switch student profile or login"
                >
                  <UserCheck className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                  <span>{language === 'en' ? 'Profile / Logout' : 'प्रोफ़ाइल / लॉगआउट'}</span>
                </button>
              )}
            </div>
          </div>
        </section>
      )}

      {/* Hero Welcome Banner */}
      <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900 text-white p-5 sm:p-7 shadow-lg">
        {/* Decorative background glow */}
        <div className="absolute -top-12 -right-12 w-48 h-48 bg-blue-500/20 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -bottom-8 -left-8 w-40 h-40 bg-indigo-500/20 rounded-full blur-xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-5">
          <div className="space-y-2 max-w-xl">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-500/20 border border-blue-400/30 text-blue-200 text-xs font-medium">
              <Sparkles className="w-3.5 h-3.5 text-blue-300" />
              <span>{language === 'en' ? `Target: CA Foundation ${resolvedCountdown.targetAttempt || 'January 2027'}` : `लक्ष्य: सीए फाउंडेशन ${resolvedCountdown.targetAttempt || 'जनवरी 2027'}`}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
              {language === 'en' 
                ? 'Welcome back, Future CA!' 
                : 'स्वागत है, भावी सीए!'}
            </h1>
            <p className="text-blue-100 text-sm sm:text-base leading-relaxed">
              {language === 'en'
                ? `Consistency beats intensity. Conquer your 4 papers for ${resolvedCountdown.targetAttempt || 'January 2027'} with verified ICAI modules, previous year questions, and AI doubt assistance.`
                : `निरंतरता ही सफलता की कुंजी है। ${resolvedCountdown.targetAttempt || 'जनवरी 2027'} हेतु आधिकारिक आईसीएआई मॉड्यूल, पिछले वर्षों के प्रश्न (PYQs) व एआई सहायता से तैयारी मजबूत करें।`}
            </p>
          </div>

          <div className="flex flex-wrap sm:flex-nowrap items-center gap-2.5 self-start md:self-auto shrink-0">
            <button
              onClick={() => setActiveTab('dailyChallenge')}
              className="px-4 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-900 font-black text-xs sm:text-sm shadow-md transition-all active:scale-95 cursor-pointer flex items-center gap-1.5"
            >
              <Sparkles className="w-4 h-4 text-slate-900" />
              <span>{language === 'en' ? "Today's Daily 10" : 'दैनिक 10 प्रश्न'}</span>
            </button>
            <button
              onClick={() => setActiveTab('doubtSolver')}
              className="px-4 py-2.5 rounded-xl bg-white/15 hover:bg-white/25 border border-white/30 text-white font-bold text-xs sm:text-sm transition-all active:scale-95 cursor-pointer flex items-center gap-1.5"
            >
              <Sparkle className="w-4 h-4 text-purple-300" />
              <span>{language === 'en' ? 'AI Solver' : 'एआई सॉल्वर'}</span>
            </button>
          </div>
        </div>
      </section>

      {/* Payment Approval Status Card */}
      <section className={`rounded-2xl p-4 sm:p-4.5 border transition-all ${
        hasActivePass || latestPayment?.status === 'approved'
          ? 'bg-gradient-to-r from-emerald-50 to-teal-50/50 dark:from-emerald-950/40 dark:to-teal-950/20 border-emerald-300 dark:border-emerald-800/80 text-emerald-900 dark:text-emerald-100 shadow-xs'
          : latestPayment?.status === 'pending'
            ? 'bg-gradient-to-r from-amber-50 to-orange-50/50 dark:from-amber-950/40 dark:to-orange-950/20 border-amber-300 dark:border-amber-800/80 text-amber-900 dark:text-amber-100 shadow-xs'
            : latestPayment?.status === 'rejected'
              ? 'bg-gradient-to-r from-rose-50 to-red-50/50 dark:from-rose-950/40 dark:to-red-950/20 border-rose-300 dark:border-rose-800/80 text-rose-900 dark:text-rose-100 shadow-xs'
              : 'bg-gradient-to-r from-blue-50 to-indigo-50/60 dark:from-blue-950/40 dark:to-indigo-950/20 border-blue-200 dark:border-blue-800/80 text-blue-950 dark:text-blue-100 shadow-xs'
      }`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3.5">
          <div className="flex items-start sm:items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
              hasActivePass || latestPayment?.status === 'approved'
                ? 'bg-emerald-600 text-white'
                : latestPayment?.status === 'pending'
                  ? 'bg-amber-600 text-white'
                  : latestPayment?.status === 'rejected'
                    ? 'bg-rose-600 text-white'
                    : 'bg-blue-600 text-white'
            }`}>
              {hasActivePass || latestPayment?.status === 'approved' ? (
                <CheckCircle2 className="w-5 h-5" />
              ) : latestPayment?.status === 'pending' ? (
                <Clock className="w-5 h-5 animate-spin" />
              ) : latestPayment?.status === 'rejected' ? (
                <XCircle className="w-5 h-5" />
              ) : (
                <CreditCard className="w-5 h-5" />
              )}
            </div>

            <div className="space-y-0.5 min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${
                  hasActivePass || latestPayment?.status === 'approved'
                    ? 'bg-emerald-100 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-200'
                    : latestPayment?.status === 'pending'
                      ? 'bg-amber-100 dark:bg-amber-900 text-amber-800 dark:text-amber-200'
                      : latestPayment?.status === 'rejected'
                        ? 'bg-rose-100 dark:bg-rose-900 text-rose-800 dark:text-rose-200'
                        : 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200'
                }`}>
                  {hasActivePass || latestPayment?.status === 'approved'
                    ? (language === 'en' ? 'Payment Status: Approved' : 'भुगतान स्थिति: स्वीकृत')
                    : latestPayment?.status === 'pending'
                      ? (language === 'en' ? 'Payment Status: Verification Pending' : 'भुगतान स्थिति: सत्यापनाधीन')
                      : latestPayment?.status === 'rejected'
                        ? (language === 'en' ? 'Payment Status: Rejected' : 'भुगतान स्थिति: अस्वीकृत')
                        : (language === 'en' ? 'Student Mock Test Access: Free Tier' : 'मॉक टेस्ट: निःशुल्क टीयर')
                  }
                </span>

                {latestPayment?.utr && (
                  <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
                    UTR: {latestPayment.utr}
                  </span>
                )}
              </div>

              <h3 className="font-extrabold text-sm sm:text-base">
                {hasActivePass || latestPayment?.status === 'approved'
                  ? (language === 'en' ? 'Full CA Foundation January 2027 Mock Pass Active' : 'सीए फाउंडेशन जनवरी 2027 पूर्ण मॉक पास सक्रिय')
                  : latestPayment?.status === 'pending'
                    ? (language === 'en' ? 'Admin is Manually Verifying Bank UTR' : 'एडमिन बैंक UTR का मैनुअल सत्यापन कर रहे हैं')
                    : latestPayment?.status === 'rejected'
                      ? (language === 'en' ? 'Payment Verification Could Not Be Confirmed' : 'भुगतान सत्यापन की पुष्टि नहीं हो सकी')
                      : (language === 'en' ? 'Upgrade to CA Foundation Pro Pass for ₹5' : 'मात्र ₹5 में सीए फाउंडेशन प्रो पास प्राप्त करें')
                }
              </h3>

              <p className="text-xs opacity-90 leading-relaxed max-w-2xl">
                {hasActivePass || latestPayment?.status === 'approved'
                  ? (language === 'en' 
                      ? 'Your ₹5 payment was verified against bank records. All full syllabus and chapter-wise timed mock tests are unlocked.' 
                      : 'आपका ₹5 भुगतान बैंक रिकॉर्ड से सत्यापित हो गया है। सभी फुल सिलेबस व चैप्टर-वाइज मॉक टेस्ट अनलॉक हैं।')
                  : latestPayment?.status === 'pending'
                    ? (language === 'en'
                        ? 'Your payment screenshot and UTR have been sent to the Admin Dashboard. Paid tests unlock immediately once verified.'
                        : 'आपका स्क्रीनशॉट व UTR एडमिन डैशबोर्ड को भेज दिया गया है। एडमिन द्वारा बैंक जांच के उपरांत तुरंत अनलॉक होगा।')
                    : latestPayment?.status === 'rejected'
                      ? (language === 'en'
                          ? `Reason: ${latestPayment.adminNotes || 'UTR not reflected in bank statement'}. You can re-submit with correct details.`
                          : `कारण: ${latestPayment.adminNotes || 'बैंक विवरण में UTR दर्ज नहीं मिला'}। कृपया सही विवरण पुनः दर्ज करें।`)
                      : (language === 'en'
                          ? 'Scan admin UPI QR code (Ajeet Patel, ajeet345@ptyes) with PhonePe, GPay, or Paytm. Submit screenshot and UTR for manual approval.'
                          : 'फोनपे, गूगल पे या पेटीएम से एडमिन का UPI QR स्कैन करें। ₹5 भुगतान कर स्क्रीनशॉट व UTR सबमिट करें।')
                }
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-center shrink-0">
            {onOpenPaymentModal && (
              <button
                onClick={onOpenPaymentModal}
                className={`px-3.5 py-2 rounded-xl font-bold text-xs shadow-xs transition-all active:scale-95 cursor-pointer flex items-center gap-1.5 ${
                  hasActivePass || latestPayment?.status === 'approved'
                    ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                    : latestPayment?.status === 'pending'
                      ? 'bg-amber-600 hover:bg-amber-700 text-white'
                      : latestPayment?.status === 'rejected'
                        ? 'bg-rose-600 hover:bg-rose-700 text-white'
                        : 'bg-blue-600 hover:bg-blue-700 text-white'
                }`}
              >
                {hasActivePass || latestPayment?.status === 'approved' ? (
                  <>
                    <FileCheck2 className="w-3.5 h-3.5" />
                    <span>{language === 'en' ? 'View Pass & Receipt' : 'पास व रसीद देखें'}</span>
                  </>
                ) : latestPayment?.status === 'pending' ? (
                  <>
                    <Clock className="w-3.5 h-3.5" />
                    <span>{language === 'en' ? 'Check Status' : 'स्थिति जांचें'}</span>
                  </>
                ) : (
                  <>
                    <CreditCard className="w-3.5 h-3.5" />
                    <span>{language === 'en' ? 'Pay ₹5 & Verify' : '₹5 भुगतान व सत्यापन'}</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </section>

      {/* Live Admin-Configured Exam Countdown Widget */}
      <ExamCountdownWidget 
        language={language} 
        config={resolvedCountdown}
        onOpenUpdates={() => setActiveTab('updates')} 
      />

      {/* Daily Progress & Stats Cards */}
      <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Daily Study Time */}
        <div className="bg-white dark:bg-slate-900 rounded-xl p-4 border border-slate-200/80 dark:border-slate-800 shadow-xs hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-semibold mb-2">
            <span className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
              <Clock className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              {language === 'en' ? "Today's Study Time" : 'आज की पढ़ाई का समय'}
            </span>
            <span>{studiedTodayMinutes} / {dailyGoalMinutes} min</span>
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
            {studiedTodayMinutes} <span className="text-sm font-medium text-slate-500 dark:text-slate-400">{language === 'en' ? 'minutes' : 'मिनट'}</span>
          </div>
          <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
            <div 
              className="bg-blue-600 dark:bg-blue-500 h-2 rounded-full transition-all duration-500"
              style={{ width: `${studyProgress}%` }}
            />
          </div>
          <div className="flex justify-between items-center mt-2 text-[11px] text-slate-500 dark:text-slate-400">
            <span>{studyProgress}% {language === 'en' ? 'of daily goal' : 'दैनिक लक्ष्य का'}</span>
            <button 
              onClick={() => setActiveTab('planner')}
              className="text-blue-600 dark:text-blue-400 font-semibold hover:underline flex items-center gap-0.5 cursor-pointer"
            >
              {language === 'en' ? 'Timer' : 'टाइमर'} &rarr;
            </button>
          </div>
        </div>

        {/* Daily MCQs Solved */}
        <div className="bg-white dark:bg-slate-900 rounded-xl p-4 border border-slate-200/80 dark:border-slate-800 shadow-xs hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-semibold mb-2">
            <span className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              {language === 'en' ? 'MCQs Solved Today' : 'आज हल किए गए प्रश्न'}
            </span>
            <span>{questionsSolvedToday} / {dailyQuestionGoal}</span>
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
            {questionsSolvedToday} <span className="text-sm font-medium text-slate-500 dark:text-slate-400">{language === 'en' ? 'solved' : 'प्रश्न'}</span>
          </div>
          <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
            <div 
              className="bg-emerald-500 h-2 rounded-full transition-all duration-500"
              style={{ width: `${questionProgress}%` }}
            />
          </div>
          <div className="flex justify-between items-center mt-2 text-[11px] text-slate-500 dark:text-slate-400">
            <span>{questionProgress}% {language === 'en' ? 'completed' : 'पूर्ण'}</span>
            <button 
              onClick={() => setActiveTab('practice')}
              className="text-emerald-700 dark:text-emerald-400 font-semibold hover:underline flex items-center gap-0.5 cursor-pointer"
            >
              {language === 'en' ? 'Practice' : 'अभ्यास'} &rarr;
            </button>
          </div>
        </div>

        {/* Streak & Consistency */}
        <div className="bg-white dark:bg-slate-900 rounded-xl p-4 border border-slate-200/80 dark:border-slate-800 shadow-xs hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-semibold mb-2">
            <span className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
              <Flame className="w-4 h-4 text-amber-500" />
              {language === 'en' ? 'Study Streak' : 'सतत अध्ययन'}
            </span>
            <span className="text-amber-600 dark:text-amber-400 font-bold">{streak} {language === 'en' ? 'Days' : 'दिन'}</span>
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-1">
            <span>{streak}</span> 
            <span className="text-sm font-medium text-slate-500 dark:text-slate-400">{language === 'en' ? 'consecutive days' : 'दिन लगातार'}</span>
            <span className="text-lg">🔥</span>
          </div>
          <p className="text-[12px] text-slate-600 dark:text-slate-300 leading-snug">
            {language === 'en' 
              ? 'Great momentum! Solve the Daily 10 Challenge today to extend your streak.'
              : 'शानदार लय! अपनी स्ट्रीक बढ़ाने हेतु आज दैनिक 10 चुनौती हल करें।'}
          </p>
        </div>
      </section>

      {/* Quick Action Buttons */}
      <section className="bg-slate-50 dark:bg-slate-900/60 rounded-2xl p-4 border border-slate-200/80 dark:border-slate-800">
        <h2 className="text-sm font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-3 flex items-center gap-2">
          <Target className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          {language === 'en' ? 'Quick Learning Actions' : 'त्वरित अध्ययन कार्य'}
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {/* 1. Daily 10 Challenge */}
          <button
            onClick={() => setActiveTab('dailyChallenge')}
            className="flex flex-col items-center justify-center p-3.5 bg-white dark:bg-slate-900 rounded-xl border border-amber-200 dark:border-amber-900/60 hover:border-amber-400 hover:shadow-sm text-center transition-all group cursor-pointer"
          >
            <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
              <Sparkles className="w-5 h-5 text-amber-500" />
            </div>
            <span className="text-xs font-bold text-slate-800 dark:text-slate-100">
              {language === 'en' ? 'Daily 10 Quiz' : 'दैनिक 10 प्रश्न'}
            </span>
            <span className="text-[10px] text-amber-600 dark:text-amber-400 font-semibold mt-0.5">
              +20 pts • Streak
            </span>
          </button>

          {/* 2. AI Doubt Solver */}
          <button
            onClick={() => setActiveTab('doubtSolver')}
            className="flex flex-col items-center justify-center p-3.5 bg-white dark:bg-slate-900 rounded-xl border border-purple-200 dark:border-purple-900/60 hover:border-purple-400 hover:shadow-sm text-center transition-all group cursor-pointer"
          >
            <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
              <Sparkle className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            </div>
            <span className="text-xs font-bold text-slate-800 dark:text-slate-100">
              {language === 'en' ? 'AI Doubt Solver' : 'एआई शंका समाधान'}
            </span>
            <span className="text-[10px] text-purple-600 dark:text-purple-400 font-semibold mt-0.5">
              {language === 'en' ? 'Step-by-Step' : 'चरणबद्ध हल'}
            </span>
          </button>

          {/* 3. AIR Rankings */}
          <button
            onClick={() => setActiveTab('leaderboard')}
            className="flex flex-col items-center justify-center p-3.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800 hover:border-blue-400 dark:hover:border-blue-500 hover:shadow-sm text-center transition-all group cursor-pointer"
          >
            <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
              <Trophy className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold text-slate-800 dark:text-slate-100">
              {language === 'en' ? 'AIR Rankings' : 'ऑल इंडिया रैंक'}
            </span>
            <span className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
              {language === 'en' ? 'Verified Scores' : 'सत्यापित अंक'}
            </span>
          </button>

          {/* 4. ICAI Module Practice */}
          <button
            onClick={() => setActiveTab('practice')}
            className="flex flex-col items-center justify-center p-3.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800 hover:border-blue-400 dark:hover:border-blue-500 hover:shadow-sm text-center transition-all group cursor-pointer"
          >
            <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
              <BookOpen className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold text-slate-800 dark:text-slate-100">
              {language === 'en' ? 'Module & PYQs' : 'मॉड्यूल व PYQs'}
            </span>
            <span className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
              {language === 'en' ? 'Official Sources' : 'आधिकारिक स्रोत'}
            </span>
          </button>

          {/* 5. Mock Tests */}
          <button
            onClick={() => setActiveTab('mocks')}
            className="flex flex-col items-center justify-center p-3.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800 hover:border-blue-400 dark:hover:border-blue-500 hover:shadow-sm text-center transition-all group cursor-pointer"
          >
            <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
              <Award className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold text-slate-800 dark:text-slate-100">
              {language === 'en' ? 'Timed Mocks' : 'टाइम्ड मॉक टेस्ट'}
            </span>
            <span className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
              {language === 'en' ? 'Exam Simulation' : 'परीक्षा प्रारूप'}
            </span>
          </button>

          {/* 6. Notes */}
          <button
            onClick={() => setActiveTab('notes')}
            className="flex flex-col items-center justify-center p-3.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800 hover:border-blue-400 dark:hover:border-blue-500 hover:shadow-sm text-center transition-all group cursor-pointer"
          >
            <div className="w-10 h-10 rounded-xl bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
              <Calculator className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold text-slate-800 dark:text-slate-100">
              {language === 'en' ? 'Study Notes' : 'स्टडी नोट्स'}
            </span>
            <span className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
              {language === 'en' ? 'Rules & Tricks' : 'नियम व ट्रिक्स'}
            </span>
          </button>
        </div>
      </section>

      {/* Referral & UPI QR Pass Rewards Banner */}
      <section className="bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 dark:from-amber-900/60 dark:via-orange-900/60 dark:to-amber-950/60 rounded-2xl p-4 sm:p-5 text-white shadow-md flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center shrink-0">
            <Gift className="w-6 h-6 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded-full bg-white/20 text-white text-[10px] font-black uppercase tracking-wider">
                {language === 'en' ? 'Student Rewards' : 'विद्यार्थी पुरस्कार'}
              </span>
              <span className="text-xs text-amber-100">
                {language === 'en' ? '50 Pts / Friend' : '50 अंक प्रति मित्र'}
              </span>
            </div>
            <h3 className="font-extrabold text-base sm:text-lg text-white mt-0.5">
              {language === 'en' ? 'Invite CA Aspirants & Unlock Test Passes for Free!' : 'मित्रों को आमंत्रित करें और निःशुल्क टेस्ट पास अनलॉक करें!'}
            </h3>
            <p className="text-xs text-amber-100/90 leading-relaxed">
              {language === 'en'
                ? 'Share your unique referral code with fellow CA Foundation peers. Redeem points for premium mock tests or use the nominal ₹5 UPI pass.'
                : 'अपने सहपाठियों के साथ रेफरल कोड साझा करें। अंकों से मॉक टेस्ट अनलॉक करें या मात्र ₹5 का यूपीआई पास प्राप्त करें।'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto">
          {onOpenReferralModal && (
            <button
              onClick={onOpenReferralModal}
              className="flex-1 sm:flex-initial px-4 py-2 rounded-xl bg-white text-orange-950 hover:bg-amber-50 font-black text-xs shadow-md transition-transform active:scale-95 cursor-pointer flex items-center justify-center gap-1.5"
            >
              <Gift className="w-4 h-4 text-orange-600" />
              <span>{language === 'en' ? 'Get Referral Code' : 'रेफरल कोड पाएं'}</span>
            </button>
          )}
          {onOpenPaymentModal && (
            <button
              onClick={onOpenPaymentModal}
              className="flex-1 sm:flex-initial px-4 py-2 rounded-xl bg-orange-900/60 hover:bg-orange-900/80 border border-white/20 text-white font-bold text-xs transition-transform active:scale-95 cursor-pointer flex items-center justify-center gap-1.5"
            >
              <CreditCard className="w-4 h-4 text-amber-300" />
              <span>{language === 'en' ? 'Scan QR (₹5)' : 'क्यूआर स्कैन (₹5)'}</span>
            </button>
          )}
        </div>
      </section>

      {/* Student Community & Smart Practice Spotlight Banner */}
      <section className="bg-gradient-to-r from-blue-700 via-indigo-700 to-blue-900 dark:from-blue-900 dark:via-indigo-900 dark:to-slate-900 rounded-2xl p-5 sm:p-6 text-white shadow-md relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-radial from-white/10 to-transparent pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5 max-w-xl">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-white/20 text-white text-[11px] font-bold tracking-wide uppercase">
                {language === 'en' ? '👥 Student Community Hub' : '👥 छात्र कम्युनिटी हब'}
              </span>
              <span className="text-xs text-blue-200">
                {language === 'en' ? '7 Active Groups • 1.6k+ Peers' : '7 सक्रिय ग्रुप • 1.6k+ सहपाठी'}
              </span>
            </div>
            <h3 className="text-lg sm:text-xl font-black">
              {language === 'en' ? 'Study Together, Solve Doubts & Find Study Partners' : 'साथ मिलकर पढ़ें, शंकाएं दूर करें और स्टडी पार्टनर खोजें'}
            </h3>
            <p className="text-xs text-blue-100/90 leading-relaxed">
              {language === 'en'
                ? 'Join subject-wise groups for Accounts, Laws, QA, and Economics. Ask questions with step-by-step peer & faculty answers.'
                : 'अकाउंट्स, लॉ, मैथ्स और इकोनॉमिक्स के ग्रुप्स में शामिल हों। साथी छात्रों और फैकल्टी के साथ चर्चा करें।'}
            </p>
          </div>

          <div className="flex flex-wrap sm:flex-nowrap items-center gap-2.5 self-start md:self-auto">
            <button
              onClick={() => setActiveTab('community')}
              className="px-4 py-2.5 rounded-xl bg-white text-blue-800 hover:bg-blue-50 font-black text-xs sm:text-sm shadow-md transition-all active:scale-95 cursor-pointer flex items-center gap-2"
            >
              <Users className="w-4 h-4" />
              <span>{language === 'en' ? 'Join Community' : 'कम्युनिटी में जाएं'}</span>
            </button>
            <button
              onClick={() => setActiveTab('practice')}
              className="px-4 py-2.5 rounded-xl bg-white/15 hover:bg-white/25 border border-white/30 text-white font-bold text-xs sm:text-sm transition-all active:scale-95 cursor-pointer flex items-center gap-1.5"
            >
              <Notebook className="w-4 h-4" />
              <span>{language === 'en' ? 'Error Notebook' : 'त्रुटि पुस्तिका'}</span>
            </button>
          </div>
        </div>
      </section>

      {/* Previous Year Questions (PYQs) Spotlight */}
      <section className="bg-gradient-to-br from-indigo-50 via-purple-50/50 to-blue-50/40 dark:from-indigo-950/40 dark:via-purple-950/30 dark:to-blue-950/30 rounded-2xl p-5 border border-indigo-200/90 dark:border-indigo-800/60 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5 max-w-xl">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-indigo-600/15 text-indigo-700 dark:text-indigo-300 text-[10px] font-black uppercase tracking-wider flex items-center gap-1">
                <History className="w-3 h-3 text-indigo-600 dark:text-indigo-400" />
                <span>{language === 'en' ? 'Official ICAI Archive' : 'आधिकारिक आईसीएआई अभिलेखागार'}</span>
              </span>
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                {language === 'en' ? 'June 2024 • Dec 2023 • June 2023 • Dec 2022' : 'जून 2024 • दिस. 2023 • जून 2023 • दिस. 2022'}
              </span>
            </div>
            <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
              {language === 'en' ? 'Previous Year Questions (PYQs) with Step-by-Step Solutions' : 'विगत वर्षों के प्रश्न (PYQs) चरणबद्ध हल सहित'}
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              {language === 'en'
                ? 'Practice genuine questions from past ICAI CA Foundation examinations. Filter by examination year, attempt, and paper source with verified answers.'
                : 'आईसीएआई की पिछली परीक्षाओं के प्रामाणिक प्रश्नों का अभ्यास करें। वर्ष, सत्र व विषय अनुसार फ़िल्टर कर तैयारी को पुख्ता करें।'}
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <button
              onClick={() => setActiveTab('practice')}
              className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs shadow-md transition-all active:scale-95 cursor-pointer flex items-center gap-2"
            >
              <BookOpen className="w-4 h-4" />
              <span>{language === 'en' ? 'Solve Exam PYQs' : 'PYQs हल करें'}</span>
            </button>
            <button
              onClick={() => setActiveTab('mocks')}
              className="px-4 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 font-bold text-xs hover:bg-indigo-50 dark:hover:bg-slate-700 transition-all cursor-pointer flex items-center gap-1.5"
            >
              <Award className="w-4 h-4" />
              <span>{language === 'en' ? 'PYQ Mock Test' : 'PYQ मॉक टेस्ट'}</span>
            </button>
          </div>
        </div>
      </section>

      {/* Available Study Modules (4 CA Foundation Papers Overview) */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              <span>
                {language === 'en' 
                  ? `Available Study Modules (CA Foundation ${resolvedCountdown.targetAttempt || 'January 2027'})` 
                  : `उपलब्ध अध्ययन मॉड्यूल (सीए फाउंडेशन ${resolvedCountdown.targetAttempt || 'जनवरी 2027'})`}
              </span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {language === 'en' ? 'Official ICAI Study Module chapters with theory, illustrations, and comprehensive MCQs' : 'आधिकारिक आईसीएआई मॉड्यूल अध्याय, सूत्र व व्यापक बहुविकल्पीय प्रश्न'}
            </p>
          </div>
          <button
            onClick={() => setActiveTab('practice')}
            className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 flex items-center gap-1 cursor-pointer"
          >
            {language === 'en' ? 'View All MCQs' : 'सभी प्रश्न देखें'}
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {PAPERS.map((paper) => {
            const Icon = getPaperIcon(paper.id);
            return (
              <div
                key={paper.id}
                className="bg-white dark:bg-slate-900 rounded-xl p-4 border border-slate-200/90 dark:border-slate-800 shadow-xs hover:border-blue-300 dark:hover:border-blue-500 hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 flex items-center justify-center font-bold">
                        <Icon className="w-5 h-5" />
                      </div>
                      <div>
                        <span className="text-[11px] font-bold text-blue-700 dark:text-blue-400 uppercase tracking-wide">
                          {paper.code}
                        </span>
                        <h3 className="font-bold text-slate-900 dark:text-white text-sm sm:text-base leading-tight">
                          {paper.name[language]}
                        </h3>
                      </div>
                    </div>
                    <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 whitespace-nowrap">
                      {paper.type[language]}
                    </span>
                  </div>

                  <div className="mt-3">
                    <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400 mb-1">
                      <span>{language === 'en' ? 'Syllabus Mastery' : 'पाठ्यक्रम तैयारी'}</span>
                      <span className="font-bold text-slate-700 dark:text-slate-200">{paper.progressPercent}%</span>
                    </div>
                    <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-blue-600 dark:bg-blue-500 h-2 rounded-full"
                        style={{ width: `${paper.progressPercent}%` }}
                      />
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 mt-4 pt-3 border-t border-slate-100 dark:border-slate-800">
                  <button
                    onClick={() => handleStartPaperPractice(paper.id)}
                    className="flex-1 py-1.5 px-3 rounded-lg bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 dark:hover:bg-blue-900/60 text-blue-700 dark:text-blue-300 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <BookOpen className="w-3.5 h-3.5" />
                    <span>{language === 'en' ? 'Practice MCQs' : 'MCQ अभ्यास'}</span>
                  </button>
                  <button
                    onClick={() => setActiveTab('notes')}
                    className="py-1.5 px-3 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-medium transition-colors cursor-pointer"
                  >
                    {language === 'en' ? 'Notes' : 'नोट्स'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Today's Planner Preview & Latest Update banner */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Pending Planner Tasks */}
        <div className="bg-white dark:bg-slate-900 rounded-xl p-4 border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-2">
              <Calendar className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              {language === 'en' ? "Today's Study Checklist" : 'आज की अध्ययन सूची'}
            </h3>
            <button
              onClick={() => setActiveTab('planner')}
              className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
            >
              {language === 'en' ? 'Open Planner' : 'प्लानर खोलें'} &rarr;
            </button>
          </div>

          <div className="space-y-2.5">
            {pendingTasks.map((task) => (
              <div 
                key={task.id}
                onClick={() => setActiveTab('planner')}
                className="p-2.5 rounded-lg border border-slate-100 dark:border-slate-800 hover:border-blue-200 dark:hover:border-blue-700 bg-slate-50/60 dark:bg-slate-800/40 hover:bg-blue-50/40 dark:hover:bg-blue-950/40 transition-colors flex items-center justify-between cursor-pointer"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-4 h-4 rounded-full border-2 border-slate-300 dark:border-slate-600" />
                  <div>
                    <p className="text-xs font-medium text-slate-800 dark:text-slate-200 line-clamp-1">
                      {task.title[language]}
                    </p>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400">
                      {task.chapter[language]} • {task.durationMinutes} min
                    </span>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </div>
            ))}
          </div>
        </div>

        {/* Latest Exam Announcement Ticker */}
        <div className="bg-gradient-to-br from-amber-50 to-orange-50/60 dark:from-amber-950/20 dark:to-orange-950/20 rounded-xl p-4 border border-amber-200/80 dark:border-amber-800/60 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-200 border border-amber-200 dark:border-amber-700">
                <Bell className="w-3 h-3 text-amber-600 dark:text-amber-400" />
                {latestUpdate.category}
              </span>
              <span className="text-[11px] text-amber-700 dark:text-amber-300 font-medium">
                {latestUpdate.date}
              </span>
            </div>
            <h4 className="font-bold text-slate-900 dark:text-white text-sm mb-1">
              {latestUpdate.title[language]}
            </h4>
            <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2 leading-relaxed">
              {latestUpdate.summary[language]}
            </p>
          </div>

          <button
            onClick={() => setActiveTab('updates')}
            className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-amber-900 dark:text-amber-300 hover:underline self-start cursor-pointer"
          >
            {language === 'en' ? 'Read Complete Notification & FAQ' : 'पूरी अधिसूचना व FAQ पढ़ें'} &rarr;
          </button>
        </div>
      </section>

      {/* Subject-wise Discussion Groups Access */}
      <section className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-white flex items-center gap-2">
              <Users className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <span>{language === 'en' ? 'Subject-wise Discussion Groups' : 'विषयवार परिचर्चा समूह'}</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {language === 'en' ? 'Connect with peers, ask chapter-wise doubts, and find study buddies' : 'साथी विद्यार्थियों से जुड़ें, अध्यायवार शंकाएं पूछें व अध्ययन मित्र खोजें'}
            </p>
          </div>
          <button
            onClick={() => setActiveTab('community')}
            className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 cursor-pointer"
          >
            <span>{language === 'en' ? 'Open Community Hub' : 'कम्युनिटी हब खोलें'}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 pt-1">
          <button
            onClick={() => setActiveTab('community')}
            className="p-3 rounded-xl border border-slate-200/80 dark:border-slate-800 hover:border-blue-400 dark:hover:border-blue-600 bg-slate-50/70 dark:bg-slate-800/40 text-left transition-all hover:scale-[1.02] cursor-pointer"
          >
            <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 flex items-center justify-center font-bold mb-2">
              📊
            </div>
            <span className="text-xs font-bold text-slate-900 dark:text-white block truncate">
              {language === 'en' ? 'Accounts Group' : 'अकाउंट्स ग्रुप'}
            </span>
            <span className="text-[10px] text-slate-500 dark:text-slate-400">Paper 1</span>
          </button>

          <button
            onClick={() => setActiveTab('community')}
            className="p-3 rounded-xl border border-slate-200/80 dark:border-slate-800 hover:border-blue-400 dark:hover:border-blue-600 bg-slate-50/70 dark:bg-slate-800/40 text-left transition-all hover:scale-[1.02] cursor-pointer"
          >
            <div className="w-8 h-8 rounded-lg bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 flex items-center justify-center font-bold mb-2">
              ⚖️
            </div>
            <span className="text-xs font-bold text-slate-900 dark:text-white block truncate">
              {language === 'en' ? 'Laws Circle' : 'लॉ ग्रुप'}
            </span>
            <span className="text-[10px] text-slate-500 dark:text-slate-400">Paper 2</span>
          </button>

          <button
            onClick={() => setActiveTab('community')}
            className="p-3 rounded-xl border border-slate-200/80 dark:border-slate-800 hover:border-blue-400 dark:hover:border-blue-600 bg-slate-50/70 dark:bg-slate-800/40 text-left transition-all hover:scale-[1.02] cursor-pointer"
          >
            <div className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 flex items-center justify-center font-bold mb-2">
              📐
            </div>
            <span className="text-xs font-bold text-slate-900 dark:text-white block truncate">
              {language === 'en' ? 'QA & Stats' : 'मैथ्स व स्टैट्स'}
            </span>
            <span className="text-[10px] text-slate-500 dark:text-slate-400">Paper 3</span>
          </button>

          <button
            onClick={() => setActiveTab('community')}
            className="p-3 rounded-xl border border-slate-200/80 dark:border-slate-800 hover:border-blue-400 dark:hover:border-blue-600 bg-slate-50/70 dark:bg-slate-800/40 text-left transition-all hover:scale-[1.02] cursor-pointer"
          >
            <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 flex items-center justify-center font-bold mb-2">
              📈
            </div>
            <span className="text-xs font-bold text-slate-900 dark:text-white block truncate">
              {language === 'en' ? 'Economics' : 'इकोनॉमिक्स'}
            </span>
            <span className="text-[10px] text-slate-500 dark:text-slate-400">Paper 4</span>
          </button>

          <button
            onClick={() => setActiveTab('community')}
            className="p-3 rounded-xl border border-purple-200 dark:border-purple-800 hover:border-purple-400 bg-purple-50/60 dark:bg-purple-950/30 text-left transition-all hover:scale-[1.02] cursor-pointer col-span-2 sm:col-span-1"
          >
            <div className="w-8 h-8 rounded-lg bg-purple-200 dark:bg-purple-900 text-purple-800 dark:text-purple-200 flex items-center justify-center font-bold mb-2">
              🎯
            </div>
            <span className="text-xs font-bold text-purple-900 dark:text-purple-200 block truncate">
              {resolvedCountdown.targetAttempt}
            </span>
            <span className="text-[10px] text-purple-700 dark:text-purple-300">Aspirants Circle</span>
          </button>
        </div>
      </section>

      {/* Student Test History & Score Reports */}
      <section className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-white flex items-center gap-2">
              <Award className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <span>{language === 'en' ? 'Your Mock Test Attempts & History' : 'आपके मॉक टेस्ट प्रयास एवं इतिहास'}</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {language === 'en' ? 'Track your official speed, accuracy, and negative marking penalty scores' : 'अपनी गति, सटीकता और -0.25 नेगेटिव मार्किंग स्कोर की निगरानी करें'}
            </p>
          </div>
          <button
            onClick={() => setActiveTab('mocks')}
            className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 cursor-pointer"
          >
            <span>{language === 'en' ? 'Take New Mock' : 'नया टेस्ट दें'}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {testHistory.length === 0 ? (
          <div className="p-6 text-center rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-700 text-xs text-slate-500">
            {language === 'en'
              ? 'No mock tests attempted yet. Take your first timed mock test to evaluate your preparation!'
              : 'अभी तक कोई मॉक टेस्ट नहीं दिया है। अपनी तैयारी का आकलन करने के लिए पहला टेस्ट दें!'}
          </div>
        ) : (
          <div className="space-y-2.5">
            {testHistory.slice(0, 3).map((test, idx) => (
              <div
                key={`${test.testId}_${idx}`}
                className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
              >
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900 dark:text-white text-sm">
                      {test.testTitle[language]}
                    </span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                      test.score >= 40 
                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' 
                        : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                    }`}>
                      {test.score >= 40 ? 'Cleared ✓' : 'Needs Revision'}
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 block">
                    Date: {test.date} • Attempted: {test.attempted}/{test.totalQuestions} • Correct: {test.correct} • Incorrect: {test.incorrect}
                  </span>
                </div>

                <div className="flex items-center gap-3 self-end sm:self-auto shrink-0">
                  <div className="text-right">
                    <span className="text-base font-extrabold text-slate-900 dark:text-white">
                      {test.score.toFixed(2)}
                    </span>
                    <span className="text-[10px] text-slate-400 block">{test.percentage}% marks</span>
                  </div>
                  <button
                    onClick={() => setActiveTab('mocks')}
                    className="px-3 py-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 text-indigo-700 dark:text-indigo-300 font-bold text-xs cursor-pointer"
                  >
                    {language === 'en' ? 'Review' : 'समीक्षा'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Student Payment & Subscription History */}
      <section className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-white flex items-center gap-2">
              <Receipt className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>{language === 'en' ? 'Your Payment & Subscription History' : 'आपका भुगतान एवं सदस्यता इतिहास'}</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {language === 'en' ? 'Transparent record of all ₹5 membership submissions and bank approval receipts' : 'सभी ₹5 सदस्यता भुगतानों और बैंक स्वीकृति रसीदों का पारदर्शी रिकॉर्ड'}
            </p>
          </div>
          {onOpenPaymentModal && (
            <button
              onClick={onOpenPaymentModal}
              className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1 cursor-pointer"
            >
              <span>{language === 'en' ? 'Submit New Payment' : 'नया भुगतान करें'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {paymentHistory.length === 0 ? (
          <div className="p-6 text-center rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-700 text-xs text-slate-500">
            {language === 'en'
              ? 'No payments submitted yet. Scan the admin UPI QR code to unlock full CA Foundation access for ₹5/month.'
              : 'अभी तक कोई भुगतान जमा नहीं किया गया है। ₹5/माह में पूर्ण अध्ययन सामग्री अनलॉक करने हेतु क्यूआर कोड स्कैन करें।'}
          </div>
        ) : (
          <div className="space-y-2.5">
            {paymentHistory.map((p) => (
              <div
                key={p.id}
                className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
              >
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900 dark:text-white font-mono text-sm">
                      ₹{p.amount} Monthly Access
                    </span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                      p.status === 'approved'
                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                        : p.status === 'pending'
                          ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                          : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                    }`}>
                      {p.status}
                    </span>
                  </div>
                  <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400 block">
                    UTR: {p.utr} • Date: {new Date(p.createdAt).toLocaleDateString()} {p.unlockedUntil ? `• Valid until: ${new Date(p.unlockedUntil).toLocaleDateString()}` : ''}
                  </span>
                  {p.adminNotes && (
                    <span className="text-[11px] text-slate-600 dark:text-slate-400 block italic">
                      Remarks: {p.adminNotes} (Reviewed by: {p.reviewedBy || 'Admin'})
                    </span>
                  )}
                </div>

                <div className="self-end sm:self-auto shrink-0">
                  {onOpenPaymentModal && (
                    <button
                      onClick={onOpenPaymentModal}
                      className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold cursor-pointer"
                    >
                      {language === 'en' ? 'View Proof / Details' : 'विवरण देखें'}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Motivational Quote Banner */}
      <section className="rounded-xl p-4 bg-blue-50 dark:bg-blue-950/40 border border-blue-200/60 dark:border-blue-800/60 text-center">
        <p className="text-xs font-semibold text-blue-800 dark:text-blue-200 italic">
          {language === 'en'
            ? '"Chartered Accountancy demands precision, ethical firmness, and daily devotion. Every solved MCQ brings you closer to your CA prefix."'
            : '"सीए केवल एक परीक्षा नहीं, अनुशासन और सत्यनिष्ठा की साधना है। प्रत्येक हल किया गया प्रश्न आपको आपके सीए उपसर्ग के करीब ले जाता है।"'}
        </p>
        <span className="text-[10px] text-blue-600 dark:text-blue-400 font-medium mt-1 inline-block">
          — {language === 'en' ? 'CA Saathi Mentorship' : 'सीए साथी मार्गदर्शन'}
        </span>
      </section>
    </div>
  );
};
