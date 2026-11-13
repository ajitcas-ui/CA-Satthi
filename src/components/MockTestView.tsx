import React, { useState, useEffect } from 'react';
import { Language, MockTest, TestAttemptResult, UserProfile, PaymentRequest } from '../types';
import { MOCK_TESTS } from '../data/mockTests';
import { calculateQuizScore, ScoreBreakdown } from '../utils/quizEngine';
import { checkUserHasValidPass, getStudentMembershipStatus, getUserPaymentHistory } from '../utils/storageDb';
import { playChimeSound } from '../utils/audio';
import confetti from 'canvas-confetti';
import { 
  Award, 
  Clock, 
  AlertTriangle, 
  CheckCircle2, 
  XCircle, 
  Bookmark, 
  ArrowLeft, 
  ArrowRight, 
  RotateCcw, 
  FileText, 
  ChevronRight, 
  ShieldCheck, 
  HelpCircle,
  BarChart2,
  Lock,
  Sparkles,
  CreditCard,
  X,
  Gift
} from 'lucide-react';

interface MockTestViewProps {
  language: Language;
  onTestCompleted: (result: TestAttemptResult) => void;
  currentUser?: UserProfile;
  onOpenPaymentModal?: () => void;
  onOpenReferralModal?: () => void;
}

export const MockTestView: React.FC<MockTestViewProps> = ({
  language,
  onTestCompleted,
  currentUser,
  onOpenPaymentModal,
  onOpenReferralModal,
}) => {
  const [activeTest, setActiveTest] = useState<MockTest | null>(null);
  const [testState, setTestState] = useState<'list' | 'running' | 'result'>('list');
  const [lockedModalTest, setLockedModalTest] = useState<MockTest | null>(null);

  // Test session state
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<Record<string, number>>({});
  const [markedForReview, setMarkedForReview] = useState<Record<string, boolean>>({});
  const [secondsRemaining, setSecondsRemaining] = useState(0);
  const [showSubmitModal, setShowSubmitModal] = useState(false);

  // Result state
  const [scoreResult, setScoreResult] = useState<ScoreBreakdown | null>(null);
  const [completedTest, setCompletedTest] = useState<MockTest | null>(null);

  // Timer countdown effect
  useEffect(() => {
    let timer: NodeJS.Timeout | null = null;
    if (testState === 'running' && secondsRemaining > 0) {
      timer = setInterval(() => {
        setSecondsRemaining((prev) => {
          if (prev <= 1) {
            handleFinalSubmit();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [testState, secondsRemaining]);

  const handleStartTest = (test: MockTest) => {
    setActiveTest(test);
    setCurrentQIndex(0);
    setUserAnswers({});
    setMarkedForReview({});
    setSecondsRemaining(test.durationMinutes * 60);
    setTestState('running');
    playChimeSound('click');
  };

  const handleSelectOption = (questionId: string, optionIdx: number) => {
    playChimeSound('click');
    setUserAnswers((prev) => ({
      ...prev,
      [questionId]: optionIdx,
    }));
  };

  const handleClearSelection = (questionId: string) => {
    setUserAnswers((prev) => {
      const copy = { ...prev };
      delete copy[questionId];
      return copy;
    });
  };

  const toggleReviewMark = (questionId: string) => {
    setMarkedForReview((prev) => ({
      ...prev,
      [questionId]: !prev[questionId],
    }));
  };

  const handleFinalSubmit = () => {
    if (!activeTest) return;

    setShowSubmitModal(false);
    const score = calculateQuizScore(userAnswers, activeTest.questions);
    setScoreResult(score);
    setCompletedTest(activeTest);
    setTestState('result');

    const resultRecord: TestAttemptResult = {
      testId: activeTest.id,
      testTitle: activeTest.title,
      date: new Date().toISOString().split('T')[0],
      paperId: activeTest.paperId,
      totalQuestions: score.totalQuestions,
      attempted: score.attempted,
      correct: score.correct,
      incorrect: score.incorrect,
      unattempted: score.unattempted,
      score: score.netScore,
      percentage: Number(((score.netScore / score.totalQuestions) * 100).toFixed(1)),
      timeSpentSeconds: activeTest.durationMinutes * 60 - secondsRemaining,
      userAnswers: { ...userAnswers },
    };

    onTestCompleted(resultRecord);

    if (score.accuracy >= 60) {
      playChimeSound('complete');
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
        });
      } catch {
        // fallback if canvas not available
      }
    } else {
      playChimeSound('warning');
    }
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // --- SCREEN 1: AVAILABLE MOCK TESTS LIST ---
  if (testState === 'list') {
    return (
      <div className="space-y-6 pb-20 lg:pb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Award className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            {language === 'en' ? 'CA Foundation Mock Tests (Jan 2027)' : 'सीए फाउंडेशन मॉक टेस्ट (जनवरी 2027)'}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            {language === 'en'
              ? 'Simulate real January 2027 ICAI exam conditions with negative marking (+1 / -0.25)'
              : 'जनवरी 2027 आईसीएआई परीक्षा प्रारूप और -0.25 निगेटिव मार्किंग के साथ वास्तविक अभ्यास करें'}
          </p>
        </div>

        {/* Negative marking reminder box */}
        <div className="bg-amber-50 dark:bg-amber-950/40 rounded-xl p-4 border border-amber-200/80 dark:border-amber-800/50 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
          <div className="text-xs text-amber-900 dark:text-amber-200 leading-relaxed">
            <span className="font-bold block mb-0.5">
              {language === 'en' ? 'ICAI Examination Marking Protocol:' : 'आईसीएआई परीक्षा अंकन नियम:'}
            </span>
            {language === 'en'
              ? 'Each correct answer awards +1.0 Mark. Each wrong answer deducts 0.25 Marks (-0.25). Unattempted questions carry 0 marks.'
              : 'प्रत्येक सही उत्तर पर +1.0 अंक मिलेगा। प्रत्येक गलत उत्तर पर 0.25 अंक काटे जाएंगे (-0.25)। बिना प्रयास वाले प्रश्न पर 0 अंक।'}
          </div>
        </div>

        {/* Tests Grid */}
        {(() => {
          const membership = currentUser?.id ? getStudentMembershipStatus(currentUser, getUserPaymentHistory(currentUser.id)) : null;
          const hasPass = Boolean(membership?.canAccessPremium || checkUserHasValidPass(currentUser?.id || ''));
          const userPayments = currentUser?.id ? getUserPaymentHistory(currentUser.id) : [];
          const pendingPayment = userPayments.find(p => p.status === 'pending');

          return (
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {MOCK_TESTS.map((test) => {
                  const isTestLocked = Boolean(test.isPremium && !hasPass);

                  return (
                    <div
                      key={test.id}
                      className={`bg-white dark:bg-slate-900 rounded-2xl p-5 border shadow-xs transition-all flex flex-col justify-between ${
                        isTestLocked 
                          ? 'border-amber-200/80 dark:border-amber-900/60 hover:border-amber-400' 
                          : 'border-slate-200 dark:border-slate-800 hover:border-blue-400 dark:hover:border-blue-600 hover:shadow-md'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-1.5">
                            <span className="px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 text-xs font-bold border border-blue-200 dark:border-blue-800">
                              {test.paperId.toUpperCase()}
                            </span>
                            {test.isPremium ? (
                              hasPass ? (
                                <span className="px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 text-[10px] font-black border border-emerald-200 dark:border-emerald-800 flex items-center gap-1">
                                  <ShieldCheck className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                                  <span>{language === 'en' ? 'Unlocked' : 'अनलॉक'}</span>
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 text-[10px] font-black border border-amber-200 dark:border-amber-800 flex items-center gap-1">
                                  <Lock className="w-3 h-3 text-amber-600 dark:text-amber-400" />
                                  <span>{language === 'en' ? '₹5 Pass' : '₹5 पास'}</span>
                                </span>
                              )
                            ) : (
                              <span className="px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 text-[10px] font-bold border border-emerald-200 dark:border-emerald-800">
                                {language === 'en' ? 'Free Trial' : 'निःशुल्क'}
                              </span>
                            )}
                          </div>

                          <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                            {test.durationMinutes} {language === 'en' ? 'mins' : 'मिनट'}
                          </span>
                        </div>

                        <h3 className="font-bold text-slate-900 dark:text-slate-100 text-base mb-2">
                          {test.title[language]}
                        </h3>

                        <p className="text-xs text-slate-600 dark:text-slate-300 mb-4 leading-relaxed">
                          {test.instructions[language]}
                        </p>

                        <div className="bg-slate-50 dark:bg-slate-800/60 rounded-lg p-2.5 text-xs text-slate-700 dark:text-slate-300 mb-4 space-y-1">
                          <div className="flex justify-between">
                            <span className="text-slate-500 dark:text-slate-400">{language === 'en' ? 'Total Questions:' : 'कुल प्रश्न:'}</span>
                            <span className="font-bold">{test.questions.length}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-500 dark:text-slate-400">{language === 'en' ? 'Marking:' : 'मार्किंग:'}</span>
                            <span className="font-bold text-blue-700 dark:text-blue-400">+1 / -0.25</span>
                          </div>
                        </div>
                      </div>

                      {isTestLocked ? (
                        <button
                          onClick={() => {
                            playChimeSound('click');
                            setLockedModalTest(test);
                          }}
                          className="w-full py-2.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs shadow-xs transition-all active:scale-[0.98] cursor-pointer flex items-center justify-center gap-2"
                        >
                          <Lock className="w-4 h-4 text-white" />
                          <span>{language === 'en' ? 'Unlock with ₹5 Pass' : '₹5 पास से अनलॉक करें'}</span>
                        </button>
                      ) : (
                        <button
                          onClick={() => handleStartTest(test)}
                          className="w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs transition-all active:scale-[0.98] cursor-pointer flex items-center justify-center gap-2"
                        >
                          <span>{language === 'en' ? 'Start Mock Test' : 'मॉक टेस्ट शुरू करें'}</span>
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Paywall & Unlock Modal */}
              {lockedModalTest && (
                <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
                  <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 border border-slate-200 dark:border-slate-800 shadow-2xl relative animate-in fade-in zoom-in-95">
                    <button
                      onClick={() => setLockedModalTest(null)}
                      className="absolute top-4 right-4 p-1.5 rounded-full text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
                    >
                      <X className="w-5 h-5" />
                    </button>

                    <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center mb-4">
                      <Lock className="w-6 h-6" />
                    </div>

                    <h3 className="text-lg font-black text-slate-900 dark:text-white">
                      {language === 'en' ? 'Unlock Premium Mock Test' : 'प्रीमियम मॉक टेस्ट अनलॉक करें'}
                    </h3>
                    <p className="text-xs font-semibold text-blue-600 dark:text-blue-400 mt-0.5">
                      {lockedModalTest.title[language]}
                    </p>

                    <p className="text-xs text-slate-600 dark:text-slate-300 mt-3 leading-relaxed">
                      {language === 'en'
                        ? 'This mock test features authentic ICAI examination format, timer simulation, and counts toward the All India Ranking leaderboard.'
                        : 'यह मॉक टेस्ट आधिकारिक आईसीएआई परीक्षा प्रारूप, टाइमर सिमुलेशन और ऑल इंडिया रैंकिंग हेतु मान्य है।'}
                    </p>

                    {/* Pending Verification Notice if student already submitted */}
                    {pendingPayment ? (
                      <div className="mt-4 p-3 rounded-xl bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-800">
                        <div className="flex items-center gap-1.5 text-blue-800 dark:text-blue-200 text-xs font-bold">
                          <Clock className="w-4 h-4 text-blue-600" />
                          <span>{language === 'en' ? 'Payment Verification Pending' : 'सत्यापन प्रक्रियाधीन'}</span>
                        </div>
                        <p className="text-[11px] text-blue-700 dark:text-blue-300 mt-1">
                          {language === 'en'
                            ? `Your payment with UTR ${pendingPayment.utr} has been sent to the admin dashboard. CA Ajit Singh will verify and unlock your access shortly.`
                            : `आपका UTR ${pendingPayment.utr} एडमिन डैशबोर्ड को भेजा जा चुका है। सत्यापन होते ही यह टेस्ट स्वतः खुल जाएगा।`}
                        </p>
                      </div>
                    ) : (
                      <div className="mt-4 p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60">
                        <div className="flex items-center justify-between text-xs font-bold text-amber-900 dark:text-amber-200">
                          <span>{language === 'en' ? 'Nominal Access Fee:' : 'न्यूनतम छात्र शुल्क:'}</span>
                          <span className="text-base text-amber-600 dark:text-amber-400 font-extrabold font-mono">₹5</span>
                        </div>
                        <p className="text-[11px] text-amber-800 dark:text-amber-300 mt-1">
                          {language === 'en'
                            ? 'Scan the admin personal UPI QR code, enter your 12-digit UTR, and upload screenshot. Once approved by mentor, test unlocks immediately.'
                            : 'एडमिन के यूपीआई क्यूआर को स्कैन करें, 12 अंकों का UTR और स्क्रीनशॉट सबमिट करें। एडमिन द्वारा स्वीकृति के बाद तुरंत अनलॉक हो जाएगा।'}
                        </p>
                      </div>
                    )}

                    <div className="space-y-2 mt-5">
                      {onOpenPaymentModal && (
                        <button
                          onClick={() => {
                            setLockedModalTest(null);
                            onOpenPaymentModal();
                          }}
                          className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
                        >
                          <CreditCard className="w-4 h-4" />
                          <span>{language === 'en' ? 'Scan & Pay ₹5 (UPI QR)' : 'यूपीआई क्यूआर स्कैन करें (₹5)'}</span>
                        </button>
                      )}

                      {onOpenReferralModal && (
                        <button
                          onClick={() => {
                            setLockedModalTest(null);
                            onOpenReferralModal();
                          }}
                          className="w-full py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-semibold text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
                        >
                          <Gift className="w-4 h-4 text-amber-500" />
                          <span>{language === 'en' ? 'Or Redeem 100 Referral Points' : 'या 100 रेफरल अंकों से अनलॉक करें'}</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </>
          );
        })()}
      </div>
    );
  }

  // --- SCREEN 2: RUNNING MOCK TEST (EXAM MODE) ---
  if (testState === 'running' && activeTest) {
    const currentQ = activeTest.questions[currentQIndex];
    const isSelected = userAnswers[currentQ.id] !== undefined;
    const isMarked = Boolean(markedForReview[currentQ.id]);

    const answeredCount = Object.keys(userAnswers).length;
    const reviewCount = Object.values(markedForReview).filter(Boolean).length;

    return (
      <div className="space-y-4 pb-24">
        {/* Sticky Exam Top Bar with Timer */}
        <div className="sticky top-16 z-30 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md rounded-xl p-3 border border-slate-200/90 dark:border-slate-800 shadow-sm flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="font-bold text-xs text-slate-700 dark:text-slate-300 hidden sm:inline">
              {activeTest.title[language]}
            </span>
            <span className="text-xs px-2 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 font-semibold border border-blue-200 dark:border-blue-800">
              Q {currentQIndex + 1}/{activeTest.questions.length}
            </span>
          </div>

          {/* Countdown Clock */}
          <div className={`flex items-center gap-1.5 px-3 py-1 rounded-lg font-mono font-bold text-sm tabular-nums ${
            secondsRemaining < 180 ? 'bg-rose-50 dark:bg-rose-950 text-rose-700 dark:text-rose-300 border border-rose-300 dark:border-rose-800' : 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200'
          }`}>
            <Clock className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <span>{formatTime(secondsRemaining)}</span>
          </div>

          <button
            onClick={() => setShowSubmitModal(true)}
            className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer"
          >
            {language === 'en' ? 'Submit Test' : 'टेस्ट जमा करें'}
          </button>
        </div>

        {/* Question Area */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 sm:p-7 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100 dark:border-slate-800">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                {currentQ.chapterTitle[language]}
              </span>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                currentQ.sourceType === 'ICAI_MODULE' ? 'bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800' : 'bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800'
              }`}>
                {currentQ.sourceType === 'ICAI_MODULE' ? 'ICAI Study Material' : `PYQ: ${currentQ.examAttempt}`}
              </span>
            </div>
            <button
              onClick={() => toggleReviewMark(currentQ.id)}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold border transition-colors cursor-pointer ${
                isMarked
                  ? 'bg-amber-50 dark:bg-amber-950/70 border-amber-300 dark:border-amber-700 text-amber-800 dark:text-amber-300'
                  : 'border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
            >
              <Bookmark className={`w-3.5 h-3.5 ${isMarked ? 'fill-amber-500 text-amber-500' : ''}`} />
              <span>{language === 'en' ? 'Review Later' : 'बाद में समीक्षा'}</span>
            </button>
          </div>

          {/* Question Text */}
          <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100 mb-6 leading-snug">
            {currentQ.question[language]}
          </h2>

          {/* Options */}
          <div className="space-y-3 mb-6">
            {currentQ.options[language].map((optText, idx) => {
              const isChecked = userAnswers[currentQ.id] === idx;
              const letter = String.fromCharCode(65 + idx);
              return (
                <button
                  key={idx}
                  onClick={() => handleSelectOption(currentQ.id, idx)}
                  className={`w-full text-left p-3.5 sm:p-4 rounded-xl border transition-all flex items-start gap-3 cursor-pointer ${
                    isChecked
                      ? 'border-blue-600 bg-blue-50/60 dark:bg-blue-950/60 ring-1 ring-blue-600 font-semibold text-blue-950 dark:text-blue-100'
                      : 'border-slate-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-600 hover:bg-slate-50/50 dark:hover:bg-slate-800/50 text-slate-800 dark:text-slate-200'
                  }`}
                >
                  <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-0.5 ${
                    isChecked ? 'bg-blue-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                  }`}>
                    {letter}
                  </span>
                  <span className="text-sm leading-relaxed">{optText}</span>
                </button>
              );
            })}
          </div>

          {/* Clear selection option */}
          {isSelected && (
            <button
              onClick={() => handleClearSelection(currentQ.id)}
              className="text-xs text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 underline"
            >
              {language === 'en' ? 'Clear response for this question' : 'इस प्रश्न का उत्तर हटाएं'}
            </button>
          )}
        </div>

        {/* Question Palette Drawer */}
        <div className="bg-white dark:bg-slate-900 rounded-xl p-4 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex flex-wrap items-center justify-between text-xs font-medium text-slate-600 dark:text-slate-400 mb-3 gap-2">
            <span>{language === 'en' ? 'Question Palette' : 'प्रश्न तालिका'}:</span>
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                {answeredCount} {language === 'en' ? 'Answered' : 'उत्तरित'}
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                {reviewCount} {language === 'en' ? 'Review' : 'समीक्षा'}
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-slate-300 dark:bg-slate-600" />
                {activeTest.questions.length - answeredCount} {language === 'en' ? 'Pending' : 'शेष'}
              </span>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {activeTest.questions.map((q, idx) => {
              const hasAns = userAnswers[q.id] !== undefined;
              const hasRev = markedForReview[q.id];
              const isCurrent = idx === currentQIndex;

              let btnBg = 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700';
              if (hasAns && hasRev) {
                btnBg = 'bg-purple-600 text-white';
              } else if (hasAns) {
                btnBg = 'bg-emerald-600 text-white';
              } else if (hasRev) {
                btnBg = 'bg-amber-500 text-white';
              }

              if (isCurrent) {
                btnBg += ' ring-2 ring-blue-700 font-bold scale-105';
              }

              return (
                <button
                  key={q.id}
                  onClick={() => setCurrentQIndex(idx)}
                  className={`w-8 h-8 rounded-lg text-xs font-medium flex items-center justify-center transition-all cursor-pointer ${btnBg}`}
                >
                  {idx + 1}
                </button>
              );
            })}
          </div>
        </div>

        {/* Footer Navigation */}
        <div className="flex items-center justify-between gap-3">
          <button
            disabled={currentQIndex === 0}
            onClick={() => setCurrentQIndex((prev) => prev - 1)}
            className="px-4 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center gap-1.5 shadow-xs cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>{language === 'en' ? 'Previous' : 'पिछला'}</span>
          </button>

          <button
            disabled={currentQIndex === activeTest.questions.length - 1}
            onClick={() => setCurrentQIndex((prev) => prev + 1)}
            className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-xs font-bold text-white disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5 shadow-xs cursor-pointer"
          >
            <span>{language === 'en' ? 'Save & Next' : 'सहेजें व आगे बढ़ें'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {/* Submit Confirmation Modal */}
        {showSubmitModal && (
          <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 text-center animate-in fade-in zoom-in-95 duration-150">
              <Award className="w-12 h-12 text-blue-600 dark:text-blue-400 mx-auto mb-3" />
              <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-1">
                {language === 'en' ? 'Submit Mock Test?' : 'मॉक टेस्ट जमा करें?'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-4 leading-relaxed">
                {language === 'en'
                  ? `You have answered ${answeredCount} of ${activeTest.questions.length} questions. Are you ready to see your detailed scorecard?`
                  : `आपने ${activeTest.questions.length} में से ${answeredCount} प्रश्नों के उत्तर दिए हैं। क्या आप अपना परिणाम देखना चाहते हैं?`}
              </p>

              <div className="flex items-center justify-center gap-3">
                <button
                  onClick={() => setShowSubmitModal(false)}
                  className="flex-1 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
                >
                  {language === 'en' ? 'Continue Test' : 'टेस्ट जारी रखें'}
                </button>
                <button
                  onClick={handleFinalSubmit}
                  className="flex-1 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs cursor-pointer"
                >
                  {language === 'en' ? 'Yes, Submit' : 'हाँ, जमा करें'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // --- SCREEN 3: TEST RESULT & DETAILED SOLUTION REVIEW ---
  if (testState === 'result' && scoreResult && completedTest) {
    const isPassing = (scoreResult.netScore / scoreResult.totalQuestions) >= 0.40;

    return (
      <div className="space-y-6 pb-20 lg:pb-8">
        {/* Result Header Card */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-sm text-center">
          <div className="inline-flex p-3 rounded-2xl bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 mb-3">
            <Award className="w-10 h-10" />
          </div>

          <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100 mb-1">
            {completedTest.title[language]}
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-6">
            {language === 'en' ? 'Detailed Test Analysis & Solution Review' : 'विस्तृत परीक्षा विश्लेषण एवं हल समीक्षा'}
          </p>

          {/* Primary Score Counter */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-8 mb-6">
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 min-w-[150px]">
              <span className="text-xs uppercase text-slate-500 dark:text-slate-400 font-bold block mb-1">
                {language === 'en' ? 'Net Score (After -0.25)' : 'शुद्ध प्राप्तांक (-0.25 के बाद)'}
              </span>
              <div className="text-3xl sm:text-4xl font-black text-blue-600 dark:text-blue-400">
                {scoreResult.netScore} <span className="text-base text-slate-400 dark:text-slate-500 font-medium">/ {scoreResult.totalQuestions}</span>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 min-w-[150px]">
              <span className="text-xs uppercase text-slate-500 dark:text-slate-400 font-bold block mb-1">
                {language === 'en' ? 'Accuracy Rate' : 'सटीकता दर'}
              </span>
              <div className="text-3xl sm:text-4xl font-black text-slate-800 dark:text-slate-100">
                {scoreResult.accuracy}%
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 min-w-[150px]">
              <span className="text-xs uppercase text-slate-500 dark:text-slate-400 font-bold block mb-1">
                {language === 'en' ? 'ICAI Benchmark (40%)' : 'आईसीएआई मानक (40%)'}
              </span>
              <div className={`text-base font-bold flex items-center justify-center gap-1.5 mt-2 ${
                isPassing ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'
              }`}>
                {isPassing ? <CheckCircle2 className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
                <span>{isPassing ? (language === 'en' ? 'Qualified (>= 40%)' : 'उत्तीर्ण (>= 40%)') : (language === 'en' ? 'Needs Revision (< 40%)' : 'पुनरावृत्ति आवश्यक (< 40%)')}</span>
              </div>
            </div>
          </div>

          {/* Detailed Metric Chips */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-xl mx-auto text-xs">
            <div className="p-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-200 border border-emerald-200 dark:border-emerald-800">
              <span className="font-bold block text-sm">{scoreResult.correct}</span>
              <span>{language === 'en' ? 'Correct Answers' : 'सही उत्तर (+1.00)'}</span>
            </div>
            <div className="p-2.5 rounded-lg bg-rose-50 dark:bg-rose-950/60 text-rose-800 dark:text-rose-200 border border-rose-200 dark:border-rose-800">
              <span className="font-bold block text-sm">{scoreResult.incorrect}</span>
              <span>{language === 'en' ? 'Wrong Answers' : 'गलत उत्तर (-0.25)'}</span>
            </div>
            <div className="p-2.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
              <span className="font-bold block text-sm">-{scoreResult.negativeMarks}</span>
              <span>{language === 'en' ? 'Negative Marks' : 'कटौती अंक'}</span>
            </div>
            <div className="p-2.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
              <span className="font-bold block text-sm">{scoreResult.unattempted}</span>
              <span>{language === 'en' ? 'Skipped' : 'छोड़े गए'}</span>
            </div>
          </div>

          <div className="flex items-center justify-center gap-3 mt-6">
            <button
              onClick={() => handleStartTest(completedTest)}
              className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5 cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
              <span>{language === 'en' ? 'Retake Test' : 'पुनः टेस्ट दें'}</span>
            </button>
            <button
              onClick={() => setTestState('list')}
              className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs cursor-pointer"
            >
              {language === 'en' ? 'Back to All Mocks' : 'सभी मॉक टेस्ट पर लौटें'}
            </button>
          </div>
        </div>

        {/* Question-by-Question Solution Review */}
        <div className="space-y-4">
          <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            {language === 'en' ? 'Detailed Question Review & Explanations' : 'प्रत्येक प्रश्न का विस्तृत हल व व्याख्या'}
          </h3>

          {completedTest.questions.map((q, idx) => {
            const userChoice = userAnswers[q.id];
            const isCorrect = userChoice === q.correctIndex;
            const isSkipped = userChoice === undefined;

            return (
              <div
                key={q.id}
                className="bg-white dark:bg-slate-900 rounded-xl p-5 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3"
              >
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-700 dark:text-slate-300">
                      {language === 'en' ? 'Question' : 'प्रश्न'} {idx + 1}
                    </span>
                    <span className={`px-2 py-0.5 rounded-md font-bold text-[10px] ${
                      q.sourceType === 'ICAI_MODULE'
                        ? 'bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300'
                        : 'bg-indigo-100 dark:bg-indigo-950 text-indigo-800 dark:text-indigo-300'
                    }`}>
                      {q.sourceType === 'ICAI_MODULE' ? 'ICAI Module' : `PYQ: ${q.examAttempt}`}
                    </span>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">
                      {q.officialQuestionRef}
                    </span>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full font-bold text-[11px] ${
                    isCorrect
                      ? 'bg-emerald-50 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                      : isSkipped
                      ? 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                      : 'bg-rose-50 dark:bg-rose-950/70 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
                  }`}>
                    {isCorrect
                      ? (language === 'en' ? 'Correct (+1.00)' : 'सही (+1.00)')
                      : isSkipped
                      ? (language === 'en' ? 'Unattempted (0.00)' : 'अनुत्तरित (0.00)')
                      : (language === 'en' ? 'Incorrect (-0.25)' : 'गलत (-0.25)')}
                  </span>
                </div>

                {/* Source Citation */}
                <div className="text-[11px] text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/60 px-2.5 py-1 rounded-md border border-slate-200/60 dark:border-slate-700 flex items-center justify-between">
                  <span>📖 {q.sourceLabel[language]}</span>
                  <a
                    href={q.officialSourceLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 dark:text-blue-400 hover:underline font-semibold ml-2 inline-flex items-center gap-0.5 shrink-0"
                  >
                    {language === 'en' ? 'ICAI Portal' : 'पोर्टल'} &rarr;
                  </a>
                </div>

                <p className="font-bold text-sm text-slate-900 dark:text-slate-100">
                  {q.question[language]}
                </p>

                {/* Options Review */}
                <div className="space-y-1.5 text-xs">
                  {q.options[language].map((optText, optIdx) => {
                    const isAns = optIdx === q.correctIndex;
                    const isChosen = optIdx === userChoice;

                    let bgClass = 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300';
                    if (isAns) {
                      bgClass = 'bg-emerald-50/80 dark:bg-emerald-950/60 border-emerald-400 dark:border-emerald-600 text-emerald-950 dark:text-emerald-200 font-semibold';
                    } else if (isChosen && !isAns) {
                      bgClass = 'bg-rose-50/80 dark:bg-rose-950/60 border-rose-400 dark:border-rose-600 text-rose-950 dark:text-rose-200 font-semibold';
                    }

                    return (
                      <div
                        key={optIdx}
                        className={`p-2.5 rounded-lg border flex items-center justify-between ${bgClass}`}
                      >
                        <div className="flex items-center gap-2">
                          <span className="font-bold w-4">{String.fromCharCode(65 + optIdx)}.</span>
                          <span>{optText}</span>
                        </div>
                        {isAns && (
                          <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-300 uppercase">
                            {language === 'en' ? 'Correct Answer' : 'सही उत्तर'}
                          </span>
                        )}
                        {isChosen && !isAns && (
                          <span className="text-[10px] font-bold text-rose-700 dark:text-rose-300 uppercase">
                            {language === 'en' ? 'Your Answer' : 'आपका उत्तर'}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Explanation */}
                <div className="p-3 bg-blue-50/50 dark:bg-blue-950/40 rounded-lg border border-blue-100 dark:border-blue-900/60 text-xs text-slate-700 dark:text-slate-300 space-y-1">
                  <span className="font-bold text-blue-900 dark:text-blue-300 block">
                    💡 {language === 'en' ? 'Conceptual Reasoning:' : 'अवधारणात्मक व्याख्या:'}
                  </span>
                  <p className="leading-relaxed">{q.explanation[language]}</p>
                  <p className="text-blue-800 dark:text-blue-300 font-medium pt-1">
                    📌 {q.keyRule[language]}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  return null;
};
