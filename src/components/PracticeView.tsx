import React, { useState, useMemo, useEffect } from 'react';
import { ExamAttemptId, Language, MCQQuestion, PaperId, QuestionSourceType, StudentBadge, UserProfile } from '../types';
import { CANONICAL_SYLLABUS, getCanonicalChapterById, getCanonicalChaptersByPaper } from '../data/syllabusData';
import { SUPPORTED_EXAM_ATTEMPTS, getAttemptMetadata, prioritizeQuestionsForAttempt } from '../utils/examAttempt';
import { playChimeSound } from '../utils/audio';
import {
  getAllQuestions,
  getDailyChallengeQuestions,
  getWrongQuestions,
  recordWrongAttempt,
  markWrongQuestionCleared,
  recordLearningReward,
  getStudentQuestionAttempts,
} from '../utils/storageDb';
import {
  saveWrongAttemptToDb,
  markWrongQuestionClearedInDb,
  toggleBookmarkInDb,
  subscribeToUserWrongQuestions,
} from '../firebase/services';
import {
  HelpCircle,
  Bookmark,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  XCircle,
  Lightbulb,
  Languages,
  ExternalLink,
  BookOpen,
  History,
  ShieldCheck,
  Layers,
  Timer,
  AlertTriangle,
  RotateCcw,
  Trophy,
  Notebook,
  Sparkles,
  Check,
  Shuffle,
  Dice5,
  Award,
  Zap,
  Calendar,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

interface PracticeViewProps {
  language: Language;
  selectedAttempt?: ExamAttemptId;
  onChangeAttempt?: (attempt: ExamAttemptId) => void;
  selectedPaperId?: PaperId | string;
  onQuestionAnswered: (isCorrect: boolean) => void;
  bookmarkedIds: string[];
  setBookmarkedIds: React.Dispatch<React.SetStateAction<string[]>>;
  currentUser?: UserProfile;
  allQuestionsOverride?: MCQQuestion[];
  chapterProgress?: Record<string, 'pending' | 'revising' | 'mastered'>;
  onUpdateChapterProgress?: (chapterId: string, status: 'pending' | 'revising' | 'mastered') => void;
}

export const PracticeView: React.FC<PracticeViewProps> = ({
  language,
  selectedAttempt = 'January 2027',
  onChangeAttempt,
  selectedPaperId = 'all',
  onQuestionAnswered,
  bookmarkedIds,
  setBookmarkedIds,
  currentUser,
  allQuestionsOverride,
  chapterProgress = {},
  onUpdateChapterProgress,
}) => {
  const attemptMeta = getAttemptMetadata(selectedAttempt);
  const [practiceMode, setPracticeMode] = useState<
    'standard' | 'daily' | 'random' | 'pyq' | 'notebook' | 'revision' | 'real_exam'
  >('standard');
  const [activeSection, setActiveSection] = useState<'ALL' | QuestionSourceType>('ALL');
  const [activePaper, setActivePaper] = useState<string>(selectedPaperId || 'all');
  const [selectedChapter, setSelectedChapter] = useState<string>('all');
  const [selectedPyqYear, setSelectedPyqYear] = useState<string>('all');
  const [difficultyFilter, setDifficultyFilter] = useState<'all' | 'easy' | 'medium' | 'hard'>('all');
  const [onlyBookmarks, setOnlyBookmarks] = useState(false);
  const [showChapterTopics, setShowChapterTopics] = useState(true);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, number>>({});
  const [submittedQuestions, setSubmittedQuestions] = useState<Record<string, boolean>>({});
  const [questionLang, setQuestionLang] = useState<Record<string, Language>>({});
  const [shuffleOptions, setShuffleOptions] = useState<boolean>(false);

  const [latestRewardNotification, setLatestRewardNotification] = useState<{
    points: number;
    badge?: StudentBadge;
  } | null>(null);

  const [examTimeRemaining, setExamTimeRemaining] = useState<number>(15 * 60);
  const [isExamRunning, setIsExamRunning] = useState<boolean>(false);
  const [isExamSubmitted, setIsExamSubmitted] = useState<boolean>(false);

  // Sync incoming selectedPaperId prop when student clicks a subject card on Home
  useEffect(() => {
    if (selectedPaperId) {
      setActivePaper(selectedPaperId);
      setSelectedChapter('all');
      setCurrentIndex(0);
    }
  }, [selectedPaperId]);

  const rawPoolQuestions = useMemo(
    () => (allQuestionsOverride && allQuestionsOverride.length > 0 ? allQuestionsOverride : getAllQuestions()),
    [allQuestionsOverride]
  );

  const allPoolQuestions = useMemo(
    () => prioritizeQuestionsForAttempt(rawPoolQuestions, selectedAttempt),
    [rawPoolQuestions, selectedAttempt]
  );

  const todayStr = new Date().toISOString().split('T')[0];
  const dailyPracticeQuestions = useMemo(() => getDailyChallengeQuestions(todayStr), [todayStr]);

  const [wrongQuestionsNotebook, setWrongQuestionsNotebook] = useState(() => getWrongQuestions());
  const [studentAttempts, setStudentAttempts] = useState(() => getStudentQuestionAttempts());

  const refreshWrongNotebook = () => {
    setWrongQuestionsNotebook(getWrongQuestions());
    setStudentAttempts(getStudentQuestionAttempts());
  };

  useEffect(() => {
    if (!currentUser?.id || currentUser.id === 'guest') return;
    const unsub = subscribeToUserWrongQuestions(currentUser.id, (entries) => {
      if (entries.length > 0) {
        setWrongQuestionsNotebook(entries);
      }
    });
    return () => unsub();
  }, [currentUser?.id]);

  useEffect(() => {
    let timer: ReturnType<typeof setInterval> | null = null;
    if (practiceMode === 'real_exam' && isExamRunning && !isExamSubmitted && examTimeRemaining > 0) {
      timer = setInterval(() => {
        setExamTimeRemaining((prev) => {
          if (prev <= 1) {
            if (timer) clearInterval(timer);
            handleFinishExam();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [practiceMode, isExamRunning, isExamSubmitted, examTimeRemaining]);

  useEffect(() => {
    if (latestRewardNotification) {
      const t = setTimeout(() => setLatestRewardNotification(null), 4000);
      return () => clearTimeout(t);
    }
  }, [latestRewardNotification]);

  // All 46 canonical chapters available for selected paper
  const availableChapters = useMemo(() => {
    const baseChapters =
      activePaper === 'all'
        ? CANONICAL_SYLLABUS
        : getCanonicalChaptersByPaper(activePaper as PaperId);
    return baseChapters.map((ch) => ({
      ...ch,
      qCount: allPoolQuestions.filter((q) => q.chapterId === ch.id).length,
    }));
  }, [activePaper, allPoolQuestions]);

  const activeCanonicalChapter = useMemo(() => {
    if (selectedChapter === 'all') return undefined;
    return getCanonicalChapterById(selectedChapter);
  }, [selectedChapter]);

  // Deterministic option order mapping when shuffleOptions is active
  const getOptionOrder = (q: MCQQuestion): number[] => {
    const len = q.options.en.length;
    const base = Array.from({ length: len }, (_, i) => i);
    if (!shuffleOptions) return base;
    let seed = 0;
    for (let i = 0; i < q.id.length; i++) {
      seed = (seed * 31 + q.id.charCodeAt(i)) >>> 0;
    }
    const copy = [...base];
    for (let i = copy.length - 1; i > 0; i--) {
      seed = (seed * 1664525 + 1013904223) >>> 0;
      const j = seed % (i + 1);
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  };

  const filteredQuestions = useMemo(() => {
    const unclearedWrongIds = wrongQuestionsNotebook.filter((w) => !w.cleared).map((w) => w.questionId);
    const sourcePool = practiceMode === 'daily' ? dailyPracticeQuestions : allPoolQuestions;

    const list = sourcePool.filter((q) => {
      if (practiceMode === 'notebook') {
        if (!unclearedWrongIds.includes(q.id)) return false;
      } else if (practiceMode === 'revision') {
        const isHighYield = bookmarkedIds.includes(q.id) || unclearedWrongIds.includes(q.id);
        if (!isHighYield) return false;
      } else if (practiceMode === 'pyq') {
        if (q.sourceType !== 'PYQ') return false;
        if (selectedPyqYear !== 'all') {
          const yearStr = q.examYear ? q.examYear.toString() : '';
          if (yearStr !== selectedPyqYear && !q.examAttempt.includes(selectedPyqYear)) return false;
        }
      }

      if (practiceMode !== 'pyq' && practiceMode !== 'daily' && activeSection !== 'ALL' && q.sourceType !== activeSection) {
        return false;
      }
      if (activePaper !== 'all' && q.paperId !== activePaper) return false;
      if (selectedChapter !== 'all' && q.chapterId !== selectedChapter) return false;
      if (difficultyFilter !== 'all' && q.difficulty !== difficultyFilter) return false;
      if (onlyBookmarks && !bookmarkedIds.includes(q.id)) return false;

      return true;
    });

    if (practiceMode === 'random') {
      return [...list].sort((a, b) => a.id.localeCompare(b.id) * ((todayStr.charCodeAt(todayStr.length - 1) % 2) ? 1 : -1));
    }
    return list;
  }, [
    practiceMode,
    dailyPracticeQuestions,
    allPoolQuestions,
    wrongQuestionsNotebook,
    activeSection,
    activePaper,
    selectedChapter,
    selectedPyqYear,
    difficultyFilter,
    onlyBookmarks,
    bookmarkedIds,
    todayStr,
  ]);

  const currentQuestion: MCQQuestion | undefined = filteredQuestions[currentIndex] || filteredQuestions[0];
  const qLang: Language = (currentQuestion && questionLang[currentQuestion.id]) || language;

  const handleDrawRandomQuestion = () => {
    playChimeSound('click');
    const attemptedKeys = Object.keys(studentAttempts);
    const unattempted = filteredQuestions.filter((q) => !attemptedKeys.includes(q.id));
    const pool = unattempted.length > 0 ? unattempted : filteredQuestions;
    if (pool.length === 0) return;

    let nextIdx = filteredQuestions.findIndex((q) => q.id === pool[Math.floor(Math.random() * pool.length)].id);
    if (nextIdx === currentIndex && filteredQuestions.length > 1) {
      nextIdx = (nextIdx + 1) % filteredQuestions.length;
    }
    if (nextIdx !== -1) setCurrentIndex(nextIdx);
  };

  const handleSelectOption = (originalOptionIdx: number) => {
    if (!currentQuestion) return;
    if (practiceMode !== 'real_exam' && submittedQuestions[currentQuestion.id]) return;
    if (practiceMode === 'real_exam' && isExamSubmitted) return;
    setSelectedAnswers((prev) => ({
      ...prev,
      [currentQuestion.id]: originalOptionIdx,
    }));
  };

  const handleSubmitAnswer = () => {
    if (!currentQuestion) return;
    const selected = selectedAnswers[currentQuestion.id];
    if (selected === undefined) return;

    const isCorrect = selected === currentQuestion.correctIndex;
    if (isCorrect) {
      playChimeSound('success');
      markWrongQuestionCleared(currentQuestion.id);
      if (currentUser?.id && currentUser.id !== 'guest') {
        markWrongQuestionClearedInDb(currentUser.id, currentQuestion.id).catch(console.error);
      }
    } else {
      playChimeSound('warning');
      recordWrongAttempt(currentQuestion.id, currentQuestion.paperId, selected);
      if (currentUser?.id && currentUser.id !== 'guest') {
        saveWrongAttemptToDb(currentUser.id, {
          questionId: currentQuestion.id,
          paperId: currentQuestion.paperId,
          failedCount: (wrongQuestionsNotebook.find((w) => w.questionId === currentQuestion.id)?.failedCount || 0) + 1,
          lastAttemptDate: todayStr,
          lastSelectedOption: selected,
          cleared: false,
        }).catch(console.error);
      }
    }

    const reward = recordLearningReward(
      currentQuestion.id,
      currentQuestion.paperId,
      isCorrect,
      currentQuestion.sourceType === 'PYQ'
    );
    if (reward.pointsAwarded > 0 || reward.newlyUnlockedBadges.length > 0) {
      setLatestRewardNotification({
        points: reward.pointsAwarded,
        badge: reward.newlyUnlockedBadges[0],
      });
    }

    refreshWrongNotebook();
    setSubmittedQuestions((prev) => ({ ...prev, [currentQuestion.id]: true }));
    onQuestionAnswered(isCorrect);
  };

  const handleStartExam = () => {
    setSelectedAnswers({});
    setSubmittedQuestions({});
    setIsExamSubmitted(false);
    setIsExamRunning(true);
    setExamTimeRemaining(Math.max(5, filteredQuestions.length * 90));
    setCurrentIndex(0);
    playChimeSound('click');
  };

  const handleFinishExam = () => {
    setIsExamRunning(false);
    setIsExamSubmitted(true);
    playChimeSound('complete');

    const newSubmitted: Record<string, boolean> = {};
    filteredQuestions.forEach((q) => {
      const selected = selectedAnswers[q.id];
      if (selected !== undefined) {
        newSubmitted[q.id] = true;
        const isCorrect = selected === q.correctIndex;
        if (!isCorrect) recordWrongAttempt(q.id, q.paperId, selected);
        else markWrongQuestionCleared(q.id);
        recordLearningReward(q.id, q.paperId, isCorrect, q.sourceType === 'PYQ');
        onQuestionAnswered(isCorrect);
      }
    });
    setSubmittedQuestions(newSubmitted);
    refreshWrongNotebook();
  };

  const handleNext = () => {
    if (currentIndex < filteredQuestions.length - 1) setCurrentIndex((prev) => prev + 1);
  };

  const handlePrevious = () => {
    if (currentIndex > 0) setCurrentIndex((prev) => prev - 1);
  };

  const toggleBookmark = (id: string) => {
    playChimeSound('click');
    const isCurrentlyBookmarked = bookmarkedIds.includes(id);
    setBookmarkedIds((prev) => (prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]));
    if (currentUser?.id && currentUser.id !== 'guest') {
      toggleBookmarkInDb(currentUser.id, id, isCurrentlyBookmarked).catch(console.error);
    }
  };

  const toggleSingleQuestionLang = (id: string) => {
    setQuestionLang((prev) => ({
      ...prev,
      [id]: (prev[id] || language) === 'en' ? 'hi' : 'en',
    }));
  };

  const isBookmarked = currentQuestion ? bookmarkedIds.includes(currentQuestion.id) : false;
  const isSubmitted = currentQuestion
    ? practiceMode === 'real_exam'
      ? isExamSubmitted
      : Boolean(submittedQuestions[currentQuestion.id])
    : false;
  const currentSelected = currentQuestion ? selectedAnswers[currentQuestion.id] : undefined;
  const currentWrongEntry = currentQuestion
    ? wrongQuestionsNotebook.find((w) => w.questionId === currentQuestion.id && !w.cleared)
    : undefined;

  const pyqCount = allPoolQuestions.filter((q) => q.sourceType === 'PYQ').length;
  const wrongCount = wrongQuestionsNotebook.filter((w) => !w.cleared).length;

  const examScoreAnalysis = useMemo(() => {
    let correct = 0;
    let incorrect = 0;
    let unattempted = 0;
    filteredQuestions.forEach((q) => {
      const selected = selectedAnswers[q.id];
      if (selected === undefined) unattempted++;
      else if (selected === q.correctIndex) correct++;
      else incorrect++;
    });
    const netScore = Math.max(0, correct * 1 - incorrect * 0.25);
    const maxScore = filteredQuestions.length;
    const percentage = maxScore > 0 ? (netScore / maxScore) * 100 : 0;
    return {
      correct,
      incorrect,
      unattempted,
      netScore: Number(netScore.toFixed(2)),
      maxScore,
      percentage: Number(percentage.toFixed(1)),
      isPassing: percentage >= 40,
    };
  }, [filteredQuestions, selectedAnswers]);

  const formatExamTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remainder = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${remainder.toString().padStart(2, '0')}`;
  };

  const optionOrder = currentQuestion ? getOptionOrder(currentQuestion) : [];

  return (
    <div className="space-y-5 pb-20 lg:pb-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-[#0F1E46] dark:text-slate-100 flex items-center gap-2 tracking-tight">
            <HelpCircle className="w-6 h-6 text-violet-700 dark:text-violet-400" />
            {language === 'en' ? 'CA Foundation Practice Arena' : 'सीए फाउंडेशन अभ्यास क्षेत्र'}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            {language === 'en'
              ? `All 46 ICAI Chapters (${attemptMeta.fullLabel.en}) • ${attemptMeta.pyqFocusSummary.en}`
              : `${attemptMeta.fullLabel.hi} के सभी 46 आईसीएआई अध्याय • ${attemptMeta.pyqFocusSummary.hi}`}
          </p>
        </div>

        {onChangeAttempt ? (
          <div className="inline-flex items-center p-1 rounded-xl bg-white dark:bg-[#0F1936] border border-slate-200 dark:border-[#213059] shadow-xs self-start md:self-auto">
            {SUPPORTED_EXAM_ATTEMPTS.map((attempt) => {
              const active = selectedAttempt === attempt;
              const meta = getAttemptMetadata(attempt);
              return (
                <button
                  key={attempt}
                  type="button"
                  onClick={() => {
                    onChangeAttempt(attempt);
                    setCurrentIndex(0);
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    active
                      ? 'bg-[#172554] text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#192852]'
                  }`}
                >
                  {meta.shortLabel[language]}
                </button>
              );
            })}
          </div>
        ) : (
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-violet-50 dark:bg-violet-950/60 text-[#172554] dark:text-violet-200 border border-violet-200 dark:border-violet-800 text-xs font-semibold self-start md:self-auto">
            <ShieldCheck className="w-4 h-4 text-violet-700 dark:text-violet-400" />
            <span>{attemptMeta.fullLabel[language]} ICAI</span>
          </div>
        )}
      </div>

      {/* --- 4-SUBJECT SELECTOR TABS --- */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-3 border border-slate-200/90 dark:border-slate-800 shadow-xs space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            {language === 'en' ? 'Select CA Foundation Subject:' : 'सीए फाउंडेशन विषय चुनें:'}
          </span>
          <span className="text-[11px] font-bold text-blue-600 dark:text-blue-400">
            {availableChapters.length} {language === 'en' ? 'Chapters Visible' : 'अध्याय'}
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
          {[
            {
              id: 'all',
              code: 'ALL',
              labelEn: 'All 4 Subjects',
              labelHi: 'चारों विषय',
              chCount: 46,
              icon: Layers,
              activeCls: 'border-blue-600 bg-blue-50/70 dark:bg-blue-950/60 ring-2 ring-blue-500/40',
            },
            {
              id: 'paper1',
              code: 'P-1',
              labelEn: 'Accounting',
              labelHi: 'लेखांकन',
              chCount: 11,
              icon: BookOpen,
              activeCls: 'border-blue-600 bg-blue-50/70 dark:bg-blue-950/60 ring-2 ring-blue-500/40',
            },
            {
              id: 'paper2',
              code: 'P-2',
              labelEn: 'Business Laws',
              labelHi: 'व्यापारिक कानून',
              chCount: 7,
              icon: ShieldCheck,
              activeCls: 'border-indigo-600 bg-indigo-50/70 dark:bg-indigo-950/60 ring-2 ring-indigo-500/40',
            },
            {
              id: 'paper3',
              code: 'P-3',
              labelEn: 'Quantitative Aptitude',
              labelHi: 'मात्रात्मक योग्यता',
              chCount: 18,
              icon: Sparkles,
              activeCls: 'border-emerald-600 bg-emerald-50/70 dark:bg-emerald-950/60 ring-2 ring-emerald-500/40',
            },
            {
              id: 'paper4',
              code: 'P-4',
              labelEn: 'Business Economics',
              labelHi: 'व्यावसायिक अर्थशास्त्र',
              chCount: 10,
              icon: Zap,
              activeCls: 'border-amber-600 bg-amber-50/70 dark:bg-amber-950/60 ring-2 ring-amber-500/40',
            },
          ].map((item) => {
            const Icon = item.icon;
            const qTotal =
              item.id === 'all'
                ? allPoolQuestions.length
                : allPoolQuestions.filter((q) => q.paperId === item.id).length;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActivePaper(item.id);
                  setSelectedChapter('all');
                  setCurrentIndex(0);
                }}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                  item.id === 'paper4' ? 'col-span-2 sm:col-span-1' : ''
                } ${
                  activePaper === item.id
                    ? item.activeCls
                    : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-black px-1.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200">
                    {item.code}
                  </span>
                  <Icon className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="font-bold text-xs text-slate-900 dark:text-slate-100 truncate">
                  {language === 'en' ? item.labelEn : item.labelHi}
                </div>
                <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 tabular-nums">
                  {item.chCount} Ch • {qTotal} Qs
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* --- PRACTICE MODES SWITCHER BAR --- */}
      <div className="bg-slate-100 dark:bg-slate-800 p-1.5 rounded-2xl flex flex-wrap items-center gap-1.5 border border-slate-200 dark:border-slate-700">
        {[
          { id: 'standard', labelEn: 'Chapter Practice', labelHi: 'अध्याय अभ्यास', icon: BookOpen },
          { id: 'daily', labelEn: 'Daily Practice', labelHi: 'दैनिक अभ्यास', icon: Calendar },
          { id: 'random', labelEn: 'Random MCQs', labelHi: 'रैंडम प्रश्न', icon: Dice5 },
          { id: 'pyq', labelEn: `PYQ Bank (${pyqCount})`, labelHi: `PYQ (${pyqCount})`, icon: History },
          { id: 'notebook', labelEn: `Wrong (${wrongCount})`, labelHi: `त्रुटि (${wrongCount})`, icon: Notebook },
          { id: 'revision', labelEn: 'Revision', labelHi: 'रिवीजन', icon: Sparkles },
          { id: 'real_exam', labelEn: 'Timed Exam', labelHi: 'एग्ज़ाम टाइमर', icon: Timer },
        ].map((mode) => {
          const Icon = mode.icon;
          const isActive = practiceMode === mode.id;
          return (
            <button
              key={mode.id}
              onClick={() => {
                setPracticeMode(mode.id as typeof practiceMode);
                setCurrentIndex(0);
                if (mode.id === 'real_exam' && !isExamRunning && !isExamSubmitted) {
                  handleStartExam();
                }
              }}
              className={`flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                isActive
                  ? 'bg-gradient-to-r from-[#172554] to-violet-700 text-white shadow-xs'
                  : 'text-slate-700 dark:text-slate-300 hover:bg-white/80 dark:hover:bg-[#192852]'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{language === 'en' ? mode.labelEn : mode.labelHi}</span>
            </button>
          );
        })}
      </div>

      {/* --- RANDOM DRAWER & SHUFFLE TOOLBAR --- */}
      <div className="bg-violet-50/70 dark:bg-[#0F1936] p-3 rounded-2xl border border-violet-200/80 dark:border-[#213059] flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleDrawRandomQuestion}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-violet-700 hover:bg-violet-800 text-white font-bold transition-all shadow-xs active:scale-95 cursor-pointer"
          >
            <Dice5 className="w-4 h-4" />
            <span>{language === 'en' ? 'Draw Random Unattempted MCQ' : 'अनदेखा प्रश्न निकालें'}</span>
          </button>

          <button
            onClick={() => setShuffleOptions(!shuffleOptions)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border font-bold transition-all cursor-pointer ${
              shuffleOptions
                ? 'bg-emerald-600 text-white border-emerald-600'
                : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
            }`}
          >
            <Shuffle className="w-3.5 h-3.5" />
            <span>
              {language === 'en'
                ? shuffleOptions
                  ? 'Choices Shuffled'
                  : 'Shuffle Choices'
                : shuffleOptions
                  ? 'विकल्प फेरबदल सक्रिय'
                  : 'विकल्प फेरबदल'}
            </span>
          </button>
        </div>

        <div className="text-slate-600 dark:text-slate-400 font-medium flex items-center gap-3 tabular-nums">
          <span>
            {language === 'en' ? 'Questions in view:' : 'वर्तमान प्रश्न:'}{' '}
            <strong className="text-slate-900 dark:text-slate-100">{filteredQuestions.length}</strong>
          </span>
          <span className="text-emerald-700 dark:text-emerald-400 font-bold flex items-center gap-1">
            <Award className="w-3.5 h-3.5" />
            <span>+10 pts / MCQ</span>
          </span>
        </div>
      </div>

      {/* Reward toast */}
      {latestRewardNotification && (
        <div className="bg-emerald-600 text-white p-3.5 rounded-2xl shadow-lg flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center text-lg">
              {latestRewardNotification.badge?.icon || '⭐'}
            </div>
            <div>
              <div className="font-bold text-xs">
                {language === 'en' ? 'Learning Reward Earned!' : 'अध्ययन पुरस्कार प्राप्त हुआ!'}
              </div>
              <div className="text-[11px] text-emerald-100">
                {latestRewardNotification.badge
                  ? `Unlocked Badge: ${latestRewardNotification.badge.name[language]} (+${latestRewardNotification.points} pts)`
                  : `+${latestRewardNotification.points} Learning Points added to your profile.`}
              </div>
            </div>
          </div>
          <button
            onClick={() => setLatestRewardNotification(null)}
            className="text-white/80 hover:text-white text-xs font-bold px-2 py-1 rounded-lg hover:bg-white/10"
          >
            ✕
          </button>
        </div>
      )}

      {/* Timed Exam Bar */}
      {practiceMode === 'real_exam' && (
        <div className="bg-purple-950 text-white rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-lg border border-purple-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-800 flex items-center justify-center text-amber-300 font-bold">
              <Timer className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm sm:text-base">
                  {language === 'en' ? 'Timed Exam Simulation' : 'समयबद्ध परीक्षा सिमुलेशन'}
                </h3>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-md bg-purple-800 text-purple-200">
                  -0.25 Negative Marking
                </span>
              </div>
              <p className="text-xs text-purple-200 mt-0.5">
                {language === 'en'
                  ? 'Explanations are hidden until test submission.'
                  : 'परीक्षा जमा करने तक व्याख्या छिपी रहेगी।'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end">
            <div className="text-center bg-purple-900/80 px-4 py-2 rounded-xl border border-purple-700/60 font-mono tabular-nums">
              <span className="text-[10px] text-purple-300 block uppercase font-bold">
                {language === 'en' ? 'Time Left' : 'शेष समय'}
              </span>
              <span className={`text-xl font-black ${examTimeRemaining < 60 ? 'text-rose-400' : 'text-amber-300'}`}>
                {formatExamTime(examTimeRemaining)}
              </span>
            </div>

            {!isExamSubmitted ? (
              <button
                onClick={handleFinishExam}
                className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm shadow-md cursor-pointer flex items-center gap-1.5"
              >
                <Check className="w-4 h-4" />
                <span>{language === 'en' ? 'Submit Test' : 'जमा करें'}</span>
              </button>
            ) : (
              <button
                onClick={handleStartExam}
                className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm shadow-md cursor-pointer flex items-center gap-1.5"
              >
                <RotateCcw className="w-4 h-4" />
                <span>{language === 'en' ? 'Retake Exam' : 'पुनः प्रयास'}</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Timed Exam Scorecard */}
      {practiceMode === 'real_exam' && isExamSubmitted && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200/90 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-3">
              <div
                className={`w-11 h-11 rounded-2xl flex items-center justify-center ${
                  examScoreAnalysis.isPassing
                    ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300'
                    : 'bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300'
                }`}
              >
                <Trophy className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900 dark:text-slate-100">
                  {language === 'en' ? 'Timed Practice Scorecard' : 'समयबद्ध अभ्यास परिणाम'}
                </h3>
                <p className="text-xs text-slate-500">ICAI Criteria: 40% Minimum to pass individual paper</p>
              </div>
            </div>

            <div
              className={`px-3 py-1.5 rounded-xl font-bold text-xs self-start sm:self-auto ${
                examScoreAnalysis.isPassing
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                  : 'bg-rose-50 text-rose-800 border border-rose-200'
              }`}
            >
              {examScoreAnalysis.isPassing ? 'Qualified (>=40%)' : 'Needs Revision (<40%)'}
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 tabular-nums">
            <div className="bg-slate-50 dark:bg-slate-800/70 p-3 rounded-xl border border-slate-200 dark:border-slate-700 text-center">
              <span className="text-[11px] font-bold text-slate-500 block uppercase">Net Score</span>
              <span className="text-xl font-black text-blue-700 dark:text-blue-400">
                {examScoreAnalysis.netScore} / {examScoreAnalysis.maxScore}
              </span>
            </div>
            <div className="bg-slate-50 dark:bg-slate-800/70 p-3 rounded-xl border border-slate-200 dark:border-slate-700 text-center">
              <span className="text-[11px] font-bold text-slate-500 block uppercase">Accuracy</span>
              <span className="text-xl font-black text-emerald-600">{examScoreAnalysis.percentage}%</span>
            </div>
            <div className="bg-slate-50 dark:bg-slate-800/70 p-3 rounded-xl border border-slate-200 dark:border-slate-700 text-center">
              <span className="text-[11px] font-bold text-slate-500 block uppercase">Correct</span>
              <span className="text-xl font-black text-emerald-600">{examScoreAnalysis.correct}</span>
            </div>
            <div className="bg-slate-50 dark:bg-slate-800/70 p-3 rounded-xl border border-slate-200 dark:border-slate-700 text-center">
              <span className="text-[11px] font-bold text-slate-500 block uppercase">Wrong (-0.25)</span>
              <span className="text-xl font-black text-rose-600">{examScoreAnalysis.incorrect}</span>
            </div>
          </div>
        </div>
      )}

      {/* PYQ Year Filter */}
      {practiceMode === 'pyq' && (
        <div className="bg-indigo-50/70 dark:bg-indigo-950/40 p-4 rounded-2xl border border-indigo-200 dark:border-indigo-800/80 space-y-2.5">
          <span className="text-xs font-bold text-indigo-900 dark:text-indigo-200 flex items-center gap-1.5">
            <History className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            <span>{language === 'en' ? 'Filter PYQs by Examination Year:' : 'परीक्षा वर्ष अनुसार विगत वर्ष प्रश्न चुनें:'}</span>
          </span>
          <div className="flex flex-wrap items-center gap-2">
            {['all', '2024', '2023', '2022'].map((year) => (
              <button
                key={year}
                onClick={() => {
                  setSelectedPyqYear(year);
                  setCurrentIndex(0);
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  selectedPyqYear === year
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                }`}
              >
                {year === 'all' ? (language === 'en' ? 'All Years' : 'सभी वर्ष') : `${year} Exams`}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Secondary Filters: Chapter (all 46), Difficulty, Bookmarks */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200/90 dark:border-slate-800 shadow-xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
          <div>
            <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
              {language === 'en' ? `Chapter (${availableChapters.length} ICAI Chapters):` : `अध्याय (${availableChapters.length}):`}
            </label>
            <select
              value={selectedChapter}
              onChange={(e) => {
                setSelectedChapter(e.target.value);
                setCurrentIndex(0);
              }}
              className="w-full px-2.5 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 font-medium"
            >
              <option value="all">{language === 'en' ? 'All Chapters' : 'सभी अध्याय'}</option>
              {availableChapters.map((ch) => {
                const st = chapterProgress[ch.id];
                const mark = st === 'mastered' ? ' ✓' : st === 'revising' ? ' • Revising' : '';
                return (
                  <option key={ch.id} value={ch.id}>
                    Ch {ch.chapterNumber}: {ch.title[language]} ({ch.qCount} Qs){mark}
                  </option>
                );
              })}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
              {language === 'en' ? 'Difficulty:' : 'कठिनाई:'}
            </label>
            <select
              value={difficultyFilter}
              onChange={(e) => {
                setDifficultyFilter(e.target.value as 'all' | 'easy' | 'medium' | 'hard');
                setCurrentIndex(0);
              }}
              className="w-full px-2.5 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 font-medium"
            >
              <option value="all">{language === 'en' ? 'All Difficulties' : 'सभी स्तर'}</option>
              <option value="easy">{language === 'en' ? 'Easy' : 'सरल'}</option>
              <option value="medium">{language === 'en' ? 'Medium' : 'मध्यम'}</option>
              <option value="hard">{language === 'en' ? 'Hard' : 'कठिन'}</option>
            </select>
          </div>

          <div className="flex flex-col justify-end">
            <button
              onClick={() => {
                setOnlyBookmarks(!onlyBookmarks);
                setCurrentIndex(0);
              }}
              className={`w-full py-2 px-3 rounded-lg border font-semibold flex items-center justify-center gap-1.5 cursor-pointer transition-all ${
                onlyBookmarks
                  ? 'bg-amber-50 dark:bg-amber-950/70 border-amber-300 dark:border-amber-700 text-amber-800 dark:text-amber-300'
                  : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
            >
              <Bookmark className={`w-3.5 h-3.5 ${onlyBookmarks ? 'fill-amber-500 text-amber-500' : ''}`} />
              <span>{language === 'en' ? 'Bookmarked' : 'चिह्नित प्रश्न'}</span>
              <span className="px-1.5 rounded bg-slate-100 dark:bg-slate-800 text-[10px] font-bold">
                {bookmarkedIds.length}
              </span>
            </button>
          </div>
        </div>

        {/* Canonical Chapter Topics/Subtopics + Progress Bar when a Chapter is Chosen */}
        {activeCanonicalChapter && (
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2.5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-blue-700 dark:text-blue-400">
                    Ch {activeCanonicalChapter.chapterNumber} • {activeCanonicalChapter.section}
                  </span>
                  <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                    {activeCanonicalChapter.weightageMarks}
                  </span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                  {activeCanonicalChapter.description[language]}
                </p>
              </div>

              <div className="flex items-center gap-2">
                {onUpdateChapterProgress && (
                  <button
                    type="button"
                    onClick={() => {
                      const curr = chapterProgress[activeCanonicalChapter.id] || 'pending';
                      const next = curr === 'pending' ? 'revising' : curr === 'revising' ? 'mastered' : 'pending';
                      onUpdateChapterProgress(activeCanonicalChapter.id, next);
                      playChimeSound('success');
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold border cursor-pointer transition-colors ${
                      chapterProgress[activeCanonicalChapter.id] === 'mastered'
                        ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-300 dark:border-emerald-700 text-emerald-700 dark:text-emerald-300'
                        : chapterProgress[activeCanonicalChapter.id] === 'revising'
                          ? 'bg-amber-50 dark:bg-amber-950/60 border-amber-300 dark:border-amber-700 text-amber-700 dark:text-amber-300'
                          : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    {chapterProgress[activeCanonicalChapter.id] === 'mastered'
                      ? 'Mastered ✓'
                      : chapterProgress[activeCanonicalChapter.id] === 'revising'
                        ? 'Revising'
                        : 'Mark Revising'}
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => setShowChapterTopics(!showChapterTopics)}
                  className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-500 hover:text-slate-800 dark:hover:text-white cursor-pointer"
                >
                  {showChapterTopics ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {showChapterTopics && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 pt-1">
                {activeCanonicalChapter.topics.map((t) => (
                  <div
                    key={t.id}
                    className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700/70 text-xs"
                  >
                    <p className="font-bold text-slate-800 dark:text-slate-200">{t.title[language]}</p>
                    <ul className="mt-1 space-y-0.5 text-[11px] text-slate-600 dark:text-slate-400 list-disc pl-4">
                      {t.subtopics.map((sub, sIdx) => (
                        <li key={sIdx}>{sub[language]}</li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* --- QUESTION CARD AREA --- */}
      {!currentQuestion ? (
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-10 text-center border border-dashed border-slate-300 dark:border-slate-700">
          <HelpCircle className="w-11 h-11 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-700 dark:text-slate-300">
            {practiceMode === 'notebook'
              ? language === 'en'
                ? 'No pending questions in your Wrong Questions Notebook.'
                : 'आपकी त्रुटि पुस्तिका में कोई लंबित प्रश्न नहीं है।'
              : language === 'en'
                ? 'No official questions match the selected filters.'
                : 'चयनित फ़िल्टर के अनुसार कोई प्रश्न नहीं मिला।'}
          </h3>
          <button
            onClick={() => {
              setPracticeMode('standard');
              setActiveSection('ALL');
              setActivePaper('all');
              setSelectedChapter('all');
              setSelectedPyqYear('all');
              setDifficultyFilter('all');
              setOnlyBookmarks(false);
              setCurrentIndex(0);
            }}
            className="mt-4 px-4 py-2 rounded-lg bg-blue-600 text-white text-xs font-bold shadow-xs hover:bg-blue-700 cursor-pointer"
          >
            {language === 'en' ? 'Reset All Filters' : 'सभी फ़िल्टर रीसेट करें'}
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 sm:p-7 border border-slate-200/90 dark:border-slate-800 shadow-sm relative space-y-4">
            {currentWrongEntry && (
              <div className="p-3 bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 rounded-xl flex items-center justify-between text-rose-900 dark:text-rose-200 text-xs">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
                  <span className="font-bold">
                    {language === 'en'
                      ? `Wrong Attempt Recorded (${currentWrongEntry.failedCount}x) • Last: ${currentWrongEntry.lastAttemptDate}`
                      : `त्रुटि दर्ज (${currentWrongEntry.failedCount}x)`}
                  </span>
                </div>
              </div>
            )}

            {/* Source Citation Banner */}
            <div
              className={`p-3.5 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 ${
                currentQuestion.sourceType === 'ICAI_MODULE'
                  ? 'bg-blue-50/70 dark:bg-blue-950/50 border-blue-200/90 dark:border-blue-800 text-blue-950 dark:text-blue-200'
                  : 'bg-indigo-50/70 dark:bg-indigo-950/50 border-indigo-200/90 dark:border-indigo-800 text-indigo-950 dark:text-indigo-200'
              }`}
            >
              <div className="flex items-start gap-2.5">
                <div
                  className={`p-1.5 rounded-lg mt-0.5 shrink-0 ${
                    currentQuestion.sourceType === 'ICAI_MODULE' ? 'bg-blue-600 text-white' : 'bg-indigo-600 text-white'
                  }`}
                >
                  {currentQuestion.sourceType === 'ICAI_MODULE' ? (
                    <BookOpen className="w-4 h-4" />
                  ) : (
                    <History className="w-4 h-4" />
                  )}
                </div>

                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[11px] font-black uppercase tracking-wider">
                      {currentQuestion.sourceType === 'ICAI_MODULE'
                        ? language === 'en'
                          ? 'ICAI Study Material Question'
                          : 'आईसीएआई अध्ययन सामग्री प्रश्न'
                        : `Past Exam (PYQ: ${currentQuestion.examAttempt})`}
                    </span>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold text-slate-700 dark:text-slate-300">
                      {currentQuestion.officialQuestionRef}
                    </span>
                  </div>
                  <p className="text-xs text-slate-700 dark:text-slate-300 font-medium leading-relaxed mt-0.5">
                    {currentQuestion.sourceLabel[qLang]}
                  </p>
                </div>
              </div>

              <a
                href={currentQuestion.officialSourceLink}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-blue-700 dark:text-blue-300 text-xs font-bold hover:bg-blue-50 dark:hover:bg-slate-700 self-start sm:self-auto shrink-0"
              >
                <span>{language === 'en' ? 'ICAI Portal' : 'आईसीएआई पोर्टल'}</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>

            {/* Chapter & Difficulty Header */}
            <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-md bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300 text-xs font-bold uppercase">
                  {currentQuestion.paperId}
                </span>
                <span className="text-xs text-slate-600 dark:text-slate-400 font-semibold">
                  {currentQuestion.chapterTitle[qLang]}
                </span>
                <span
                  className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-md ${
                    currentQuestion.difficulty === 'easy'
                      ? 'bg-emerald-50 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300'
                      : currentQuestion.difficulty === 'medium'
                        ? 'bg-amber-50 dark:bg-amber-950/70 text-amber-700 dark:text-amber-300'
                        : 'bg-rose-50 dark:bg-rose-950/70 text-rose-700 dark:text-rose-300'
                  }`}
                >
                  {currentQuestion.difficulty}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => toggleSingleQuestionLang(currentQuestion.id)}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:text-blue-600 text-xs font-medium cursor-pointer"
                >
                  <Languages className="w-3.5 h-3.5" />
                  <span>{qLang === 'en' ? 'हिन्दी' : 'English'}</span>
                </button>

                <button
                  onClick={() => toggleBookmark(currentQuestion.id)}
                  aria-label="Bookmark question"
                  className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                    isBookmarked
                      ? 'bg-amber-50 dark:bg-amber-950/70 border-amber-300 dark:border-amber-700 text-amber-500'
                      : 'border-slate-200 dark:border-slate-700 text-slate-400 hover:text-slate-700'
                  }`}
                >
                  <Bookmark className={`w-4 h-4 ${isBookmarked ? 'fill-amber-500' : ''}`} />
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs text-slate-400 font-medium tabular-nums">
              <span>
                {language === 'en' ? 'Question' : 'प्रश्न'} {currentIndex + 1} / {filteredQuestions.length}
              </span>
              {isSubmitted && (
                <span
                  className={
                    currentSelected === currentQuestion.correctIndex
                      ? 'text-emerald-600 dark:text-emerald-400 font-bold'
                      : 'text-rose-600 dark:text-rose-400 font-bold'
                  }
                >
                  {currentSelected === currentQuestion.correctIndex ? 'Correct (+1.00)' : 'Incorrect (-0.25)'}
                </span>
              )}
            </div>

            <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100 leading-snug">
              {currentQuestion.question[qLang]}
            </h2>

            {/* Options List (respects shuffleOptions deterministically) */}
            <div className="space-y-3">
              {optionOrder.map((origIdx, displayIdx) => {
                const optionText = currentQuestion.options[qLang][origIdx];
                const isChosen = currentSelected === origIdx;
                const isCorrect = currentQuestion.correctIndex === origIdx;

                let optionStyle =
                  'border-slate-200 dark:border-[#213059] hover:border-violet-400 dark:hover:border-violet-500 hover:bg-violet-50/30 dark:hover:bg-[#162447] text-[#0F1E46] dark:text-slate-100';
                if (isSubmitted) {
                  if (isCorrect) {
                    optionStyle =
                      'border-emerald-500 bg-emerald-50/70 dark:bg-emerald-950/60 text-emerald-900 dark:text-emerald-200 font-semibold ring-1 ring-emerald-500';
                  } else if (isChosen && !isCorrect) {
                    optionStyle =
                      'border-rose-500 bg-rose-50/70 dark:bg-rose-950/60 text-rose-900 dark:text-rose-200 font-semibold ring-1 ring-rose-500';
                  } else {
                    optionStyle = 'border-slate-200 dark:border-slate-700 opacity-60 text-slate-700 dark:text-slate-300';
                  }
                } else if (isChosen) {
                  optionStyle =
                    'border-violet-600 bg-violet-50/70 dark:bg-violet-950/50 text-[#172554] dark:text-violet-100 ring-1 ring-violet-600 font-semibold';
                }

                const letter = String.fromCharCode(65 + displayIdx);

                return (
                  <button
                    key={origIdx}
                    disabled={isSubmitted && practiceMode !== 'real_exam'}
                    onClick={() => handleSelectOption(origIdx)}
                    className={`w-full text-left p-3.5 sm:p-4 rounded-xl border transition-all flex items-start gap-3 cursor-pointer ${optionStyle}`}
                  >
                    <span
                      className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-0.5 ${
                        isSubmitted && isCorrect
                          ? 'bg-emerald-600 text-white'
                          : isSubmitted && isChosen && !isCorrect
                            ? 'bg-rose-600 text-white'
                            : isChosen
                              ? 'bg-violet-700 text-white'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                      }`}
                    >
                      {letter}
                    </span>
                    <span className="text-sm leading-relaxed flex-1">{optionText}</span>
                    {isSubmitted && isCorrect && <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />}
                    {isSubmitted && isChosen && !isCorrect && <XCircle className="w-5 h-5 text-rose-600 shrink-0" />}
                  </button>
                );
              })}
            </div>

            {practiceMode !== 'real_exam' && !isSubmitted ? (
              <button
                disabled={currentSelected === undefined}
                onClick={handleSubmitAnswer}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-[#172554] to-violet-700 hover:from-[#1e316e] hover:to-violet-800 disabled:bg-slate-200 disabled:bg-none dark:disabled:bg-slate-800 disabled:text-slate-400 text-white font-bold text-sm shadow-md transition-all cursor-pointer"
              >
                {language === 'en' ? 'Check Answer & Earn Points' : 'उत्तर जांचें एवं अंक प्राप्त करें'}
              </button>
            ) : isSubmitted ? (
              <div className="bg-slate-50 dark:bg-slate-800/60 rounded-xl p-4 sm:p-5 border border-slate-200/90 dark:border-slate-700 space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  <Lightbulb className="w-4 h-4 text-amber-500" />
                  <span>{language === 'en' ? 'Official Solution & Explanation' : 'आधिकारिक हल एवं व्याख्या'}</span>
                </div>
                <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                  {currentQuestion.explanation[qLang]}
                </p>
                <div className="p-3 bg-blue-50/70 dark:bg-blue-950/60 border border-blue-200/80 dark:border-blue-800 rounded-lg">
                  <span className="text-[11px] font-bold text-blue-900 dark:text-blue-300 block mb-0.5">
                    {language === 'en' ? 'ICAI Syllabus Rule / Principle:' : 'आईसीएआई पाठ्यक्रम नियम:'}
                  </span>
                  <span className="text-xs text-blue-800 dark:text-blue-200 font-medium">
                    {currentQuestion.keyRule[qLang]}
                  </span>
                </div>
              </div>
            ) : null}
          </div>

          {/* Pagination Footer */}
          <div className="flex items-center justify-between gap-3">
            <button
              disabled={currentIndex === 0}
              onClick={handlePrevious}
              className="px-4 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 disabled:opacity-40 flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>{language === 'en' ? 'Previous' : 'पिछला'}</span>
            </button>

            <div className="flex items-center gap-1 overflow-x-auto max-w-[200px] sm:max-w-md px-1 tabular-nums">
              {filteredQuestions.slice(0, 30).map((q, idx) => {
                const isAns =
                  practiceMode === 'real_exam' ? selectedAnswers[q.id] !== undefined : submittedQuestions[q.id];
                const isCurr = idx === currentIndex;
                const isCor = selectedAnswers[q.id] === q.correctIndex;
                let circleClass = 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400';
                if (isAns) {
                  if (practiceMode === 'real_exam' && !isExamSubmitted) circleClass = 'bg-purple-600 text-white';
                  else circleClass = isCor ? 'bg-emerald-600 text-white' : 'bg-rose-600 text-white';
                }
                if (isCurr) circleClass += ' ring-2 ring-blue-600 font-bold';
                return (
                  <button
                    key={q.id}
                    onClick={() => setCurrentIndex(idx)}
                    className={`w-7 h-7 rounded-lg text-xs font-medium shrink-0 flex items-center justify-center ${circleClass}`}
                  >
                    {idx + 1}
                  </button>
                );
              })}
            </div>

            <button
              disabled={currentIndex === filteredQuestions.length - 1}
              onClick={handleNext}
              className="px-4 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 disabled:opacity-40 flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <span>{language === 'en' ? 'Next' : 'अगला'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
