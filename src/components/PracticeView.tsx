import React, { useState, useMemo, useEffect } from 'react';
import { Language, MCQQuestion, PaperId, QuestionSourceType, StudentBadge, UserProfile } from '../types';
import { PAPERS } from '../data/papersData';
import { playChimeSound } from '../utils/audio';
import { 
  getAllQuestions,
  getWrongQuestions, 
  recordWrongAttempt, 
  markWrongQuestionCleared,
  recordLearningReward,
  getStudentQuestionAttempts
} from '../utils/storageDb';
import {
  saveWrongAttemptToDb,
  markWrongQuestionClearedInDb,
  toggleBookmarkInDb,
  subscribeToUserWrongQuestions
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
  Calendar
} from 'lucide-react';

interface PracticeViewProps {
  language: Language;
  selectedPaperId?: PaperId | string;
  onQuestionAnswered: (isCorrect: boolean) => void;
  bookmarkedIds: string[];
  setBookmarkedIds: React.Dispatch<React.SetStateAction<string[]>>;
  currentUser?: UserProfile;
}

export const PracticeView: React.FC<PracticeViewProps> = ({
  language,
  selectedPaperId = 'all',
  onQuestionAnswered,
  bookmarkedIds,
  setBookmarkedIds,
  currentUser,
}) => {
  // Practice Modes: 'standard' | 'random' | 'pyq' | 'notebook' | 'revision' | 'real_exam'
  const [practiceMode, setPracticeMode] = useState<'standard' | 'random' | 'pyq' | 'notebook' | 'revision' | 'real_exam'>('standard');

  // Separate sections: 'ALL' | 'ICAI_MODULE' | 'PYQ'
  const [activeSection, setActiveSection] = useState<'ALL' | QuestionSourceType>('ALL');

  // Subject filter
  const [activePaper, setActivePaper] = useState<string>(selectedPaperId || 'all');
  const [selectedChapter, setSelectedChapter] = useState<string>('all');
  const [selectedExamAttempt, setSelectedExamAttempt] = useState<string>('all');
  const [selectedPyqYear, setSelectedPyqYear] = useState<string>('all');
  const [difficultyFilter, setDifficultyFilter] = useState<'all' | 'easy' | 'medium' | 'hard'>('all');
  const [onlyBookmarks, setOnlyBookmarks] = useState(false);

  // Active question index
  const [currentIndex, setCurrentIndex] = useState(0);

  // Per-question state
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, number>>({});
  const [submittedQuestions, setSubmittedQuestions] = useState<Record<string, boolean>>({});
  const [questionLang, setQuestionLang] = useState<Record<string, Language>>({});
  const [shuffleOptions, setShuffleOptions] = useState<boolean>(false);

  // Gamification notification state
  const [latestRewardNotification, setLatestRewardNotification] = useState<{
    points: number;
    badge?: StudentBadge;
  } | null>(null);

  // Real Exam Mode state
  const [examTimeRemaining, setExamTimeRemaining] = useState<number>(15 * 60); // 15 mins
  const [isExamRunning, setIsExamRunning] = useState<boolean>(false);
  const [isExamSubmitted, setIsExamSubmitted] = useState<boolean>(false);

  // Question pool from storageDb (combines MOCK_QUESTIONS + any custom additions)
  const allPoolQuestions = useMemo(() => getAllQuestions(), []);

  // Wrong notebook local state cache for reactivity
  const [wrongQuestionsNotebook, setWrongQuestionsNotebook] = useState(() => getWrongQuestions());
  const [studentAttempts, setStudentAttempts] = useState(() => getStudentQuestionAttempts());

  const refreshWrongNotebook = () => {
    setWrongQuestionsNotebook(getWrongQuestions());
    setStudentAttempts(getStudentQuestionAttempts());
  };

  // Sync wrong questions from Firestore when logged in
  useEffect(() => {
    if (!currentUser?.id) return;
    const unsub = subscribeToUserWrongQuestions(currentUser.id, (entries) => {
      if (entries.length > 0) {
        setWrongQuestionsNotebook(entries);
      }
    });
    return () => unsub();
  }, [currentUser?.id]);

  // Exam timer effect
  useEffect(() => {
    let timer: NodeJS.Timeout | null = null;
    if (practiceMode === 'real_exam' && isExamRunning && !isExamSubmitted && examTimeRemaining > 0) {
      timer = setInterval(() => {
        setExamTimeRemaining((prev) => {
          if (prev <= 1) {
            clearInterval(timer!);
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

  // Auto-dismiss reward toast
  useEffect(() => {
    if (latestRewardNotification) {
      const t = setTimeout(() => {
        setLatestRewardNotification(null);
      }, 4000);
      return () => clearTimeout(t);
    }
  }, [latestRewardNotification]);

  // Dynamically extract chapters available for active paper
  const availableChapters = useMemo(() => {
    const map = new Map<string, { id: string; title: { en: string; hi: string } }>();
    allPoolQuestions.forEach((q) => {
      if (activePaper === 'all' || q.paperId === activePaper) {
        if (!map.has(q.chapterId)) {
          map.set(q.chapterId, { id: q.chapterId, title: q.chapterTitle });
        }
      }
    });
    return Array.from(map.values());
  }, [activePaper, allPoolQuestions]);

  // Dynamically extract exam attempts available in questions
  const availableExamAttempts = useMemo(() => {
    const set = new Set<string>();
    allPoolQuestions.forEach((q) => {
      if (activeSection === 'ALL' || q.sourceType === activeSection) {
        if (q.examAttempt) set.add(q.examAttempt);
      }
    });
    return Array.from(set);
  }, [activeSection, allPoolQuestions]);

  // Filter questions based on all active criteria & current mode
  const filteredQuestions = useMemo(() => {
    const unclearedWrongIds = wrongQuestionsNotebook
      .filter((w) => !w.cleared)
      .map((w) => w.questionId);

    return allPoolQuestions.filter((q) => {
      // Mode-specific filtering
      if (practiceMode === 'notebook') {
        if (!unclearedWrongIds.includes(q.id)) return false;
      } else if (practiceMode === 'revision') {
        // High-yield revision: Either bookmarked or in wrong notebook
        const isHighYield = bookmarkedIds.includes(q.id) || unclearedWrongIds.includes(q.id);
        if (!isHighYield) return false;
      } else if (practiceMode === 'pyq') {
        // Dedicated PYQ Bank mode
        if (q.sourceType !== 'PYQ') return false;
        if (selectedPyqYear !== 'all') {
          const yearStr = q.examYear ? q.examYear.toString() : '';
          const matchYear = yearStr === selectedPyqYear || q.examAttempt.includes(selectedPyqYear);
          if (!matchYear) return false;
        }
      }

      // 1. Separate Section Filter (when not in pyq mode)
      if (practiceMode !== 'pyq' && activeSection !== 'ALL' && q.sourceType !== activeSection) return false;

      // 2. Subject Filter
      if (activePaper !== 'all' && q.paperId !== activePaper) return false;

      // 3. Chapter Filter
      if (selectedChapter !== 'all' && q.chapterId !== selectedChapter) return false;

      // 4. Exam Attempt Filter
      if (selectedExamAttempt !== 'all' && q.examAttempt !== selectedExamAttempt) return false;

      // 5. Difficulty Filter
      if (difficultyFilter !== 'all' && q.difficulty !== difficultyFilter) return false;

      // 6. Bookmarked Filter
      if (onlyBookmarks && !bookmarkedIds.includes(q.id)) return false;

      return true;
    });
  }, [
    practiceMode,
    allPoolQuestions,
    wrongQuestionsNotebook,
    activeSection,
    activePaper,
    selectedChapter,
    selectedExamAttempt,
    selectedPyqYear,
    difficultyFilter,
    onlyBookmarks,
    bookmarkedIds
  ]);

  // Current question safety
  const currentQuestion: MCQQuestion | undefined = filteredQuestions[currentIndex] || filteredQuestions[0];
  const qLang: Language = (currentQuestion && questionLang[currentQuestion.id]) || language;

  // Handle Random Drawer - pick an unattempted question
  const handleDrawRandomQuestion = () => {
    playChimeSound('click');
    const attemptedKeys = Object.keys(studentAttempts);
    const unattempted = filteredQuestions.filter((q) => !attemptedKeys.includes(q.id));

    if (unattempted.length > 0) {
      const randomQ = unattempted[Math.floor(Math.random() * unattempted.length)];
      const targetIdx = filteredQuestions.findIndex((q) => q.id === randomQ.id);
      if (targetIdx !== -1) {
        setCurrentIndex(targetIdx);
        return;
      }
    }

    // If all filtered are attempted, choose any random question different from current
    if (filteredQuestions.length > 1) {
      let nextIdx = Math.floor(Math.random() * filteredQuestions.length);
      if (nextIdx === currentIndex) {
        nextIdx = (nextIdx + 1) % filteredQuestions.length;
      }
      setCurrentIndex(nextIdx);
    }
  };

  const handleSelectOption = (optionIdx: number) => {
    if (!currentQuestion) return;
    if (practiceMode !== 'real_exam' && submittedQuestions[currentQuestion.id]) return;
    if (practiceMode === 'real_exam' && isExamSubmitted) return;

    setSelectedAnswers((prev) => ({
      ...prev,
      [currentQuestion.id]: optionIdx,
    }));
  };

  const handleSubmitAnswer = () => {
    if (!currentQuestion) return;
    const selected = selectedAnswers[currentQuestion.id];
    if (selected === undefined) return;

    const isCorrect = selected === currentQuestion.correctIndex;
    if (isCorrect) {
      playChimeSound('success');
      // If question was in wrong notebook, mark as cleared
      markWrongQuestionCleared(currentQuestion.id);
      if (currentUser?.id) {
        markWrongQuestionClearedInDb(currentUser.id, currentQuestion.id).catch(console.error);
      }
    } else {
      playChimeSound('warning');
      // Record wrong attempt in Wrong Questions Notebook
      recordWrongAttempt(currentQuestion.id, currentQuestion.paperId, selected);
      if (currentUser?.id) {
        saveWrongAttemptToDb(currentUser.id, {
          questionId: currentQuestion.id,
          paperId: currentQuestion.paperId,
          failedCount: (wrongQuestionsNotebook.find(w => w.questionId === currentQuestion.id)?.failedCount || 0) + 1,
          lastAttemptDate: new Date().toISOString().split('T')[0],
          lastSelectedOption: selected,
          cleared: false,
        }).catch(console.error);
      }
    }

    // Award Learning Rewards & Check Badges
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

    setSubmittedQuestions((prev) => ({
      ...prev,
      [currentQuestion.id]: true,
    }));

    onQuestionAnswered(isCorrect);
  };

  const handleStartExam = () => {
    setSelectedAnswers({});
    setSubmittedQuestions({});
    setIsExamSubmitted(false);
    setIsExamRunning(true);
    setExamTimeRemaining(Math.max(5, filteredQuestions.length * 90)); // 90 secs per question
    setCurrentIndex(0);
    playChimeSound('click');
  };

  const handleFinishExam = () => {
    setIsExamRunning(false);
    setIsExamSubmitted(true);
    playChimeSound('complete');

    // Mark all attempted questions
    const newSubmitted: Record<string, boolean> = {};
    filteredQuestions.forEach((q) => {
      const selected = selectedAnswers[q.id];
      if (selected !== undefined) {
        newSubmitted[q.id] = true;
        const isCorrect = selected === q.correctIndex;
        if (!isCorrect) {
          recordWrongAttempt(q.id, q.paperId, selected);
        } else {
          markWrongQuestionCleared(q.id);
        }
        recordLearningReward(q.id, q.paperId, isCorrect, q.sourceType === 'PYQ');
        onQuestionAnswered(isCorrect);
      }
    });
    setSubmittedQuestions(newSubmitted);
    refreshWrongNotebook();
  };

  const handleNext = () => {
    if (currentIndex < filteredQuestions.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    }
  };

  const toggleBookmark = (id: string) => {
    playChimeSound('click');
    const isCurrentlyBookmarked = bookmarkedIds.includes(id);
    setBookmarkedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
    if (currentUser?.id) {
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
    ? (practiceMode === 'real_exam' ? isExamSubmitted : Boolean(submittedQuestions[currentQuestion.id]))
    : false;
  const currentSelected = currentQuestion ? selectedAnswers[currentQuestion.id] : undefined;

  // Wrong notebook entry for current question if exists
  const currentWrongEntry = currentQuestion 
    ? wrongQuestionsNotebook.find((w) => w.questionId === currentQuestion.id && !w.cleared)
    : undefined;

  // Counts for top status tabs
  const icaiModuleCount = allPoolQuestions.filter((q) => q.sourceType === 'ICAI_MODULE').length;
  const pyqCount = allPoolQuestions.filter((q) => q.sourceType === 'PYQ').length;
  const wrongCount = wrongQuestionsNotebook.filter((w) => !w.cleared).length;

  // Real exam calculations
  const examScoreAnalysis = useMemo(() => {
    let correct = 0;
    let incorrect = 0;
    let unattempted = 0;

    filteredQuestions.forEach((q) => {
      const selected = selectedAnswers[q.id];
      if (selected === undefined) {
        unattempted++;
      } else if (selected === q.correctIndex) {
        correct++;
      } else {
        incorrect++;
      }
    });

    const netScore = Math.max(0, correct * 1 - incorrect * 0.25);
    const maxScore = filteredQuestions.length;
    const percentage = maxScore > 0 ? (netScore / maxScore) * 100 : 0;
    const isPassing = percentage >= 40; // CA Foundation passing threshold per paper is 40%

    return {
      correct,
      incorrect,
      unattempted,
      netScore: Number(netScore.toFixed(2)),
      maxScore,
      percentage: Number(percentage.toFixed(1)),
      isPassing,
    };
  }, [filteredQuestions, selectedAnswers]);

  const formatExamTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remainder = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${remainder.toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-6 pb-20 lg:pb-8">
      {/* Header and Strict Source Notice */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <HelpCircle className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            {language === 'en' ? 'CA Foundation Practice Arena' : 'सीए फाउंडेशन अभ्यास क्षेत्र'}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            {language === 'en'
              ? 'Authorized ICAI Study Modules & Verified Past Examination PYQs for January 2027 Aspirants'
              : 'जनवरी 2027 परीक्षा हेतु अधिकृत आईसीएआई मॉड्यूल एवं सत्यापित विगत वर्ष प्रश्न (PYQs)'}
          </p>
        </div>

        {/* Source restriction verification banner */}
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50 dark:bg-blue-950 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-800 text-xs font-semibold self-start md:self-auto">
          <ShieldCheck className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          <span>{language === 'en' ? 'Official ICAI Questions Only' : 'केवल अधिकृत आईसीएआई प्रश्न'}</span>
        </div>
      </div>

      {/* --- PROMINENT 4-SUBJECT SELECTOR TABS --- */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-3 border border-slate-200/90 dark:border-slate-800 shadow-xs space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
            {language === 'en' ? 'Select CA Foundation Subject:' : 'सीए फाउंडेशन विषय चुनें:'}
          </span>
          <span className="text-[11px] font-bold text-blue-600 dark:text-blue-400">
            {language === 'en' ? 'January 2027 Syllabus' : 'जनवरी 2027 पाठ्यक्रम'}
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
          {/* All Papers Tab */}
          <button
            onClick={() => {
              setActivePaper('all');
              setSelectedChapter('all');
              setCurrentIndex(0);
            }}
            className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
              activePaper === 'all'
                ? 'border-blue-600 bg-blue-50/70 dark:bg-blue-950/60 ring-2 ring-blue-500/50'
                : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/60'
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] font-black px-1.5 py-0.5 rounded-md bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200">
                ALL
              </span>
              <Layers className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="font-bold text-xs text-slate-900 dark:text-slate-100">
              {language === 'en' ? 'All 4 Subjects' : 'चारों विषय'}
            </div>
            <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">
              {allPoolQuestions.length} {language === 'en' ? 'Questions' : 'प्रश्न'}
            </div>
          </button>

          {/* Paper 1: Accounting */}
          <button
            onClick={() => {
              setActivePaper('paper1');
              setSelectedChapter('all');
              setCurrentIndex(0);
            }}
            className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
              activePaper === 'paper1'
                ? 'border-blue-600 bg-blue-50/70 dark:bg-blue-950/60 ring-2 ring-blue-500/50'
                : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/60'
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] font-black px-1.5 py-0.5 rounded-md bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-300">
                P-1
              </span>
              <BookOpen className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="font-bold text-xs text-slate-900 dark:text-slate-100 truncate">
              {language === 'en' ? 'Accounting' : 'लेखांकन'}
            </div>
            <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">
              {allPoolQuestions.filter((q) => q.paperId === 'paper1').length} {language === 'en' ? 'Qns' : 'प्रश्न'}
            </div>
          </button>

          {/* Paper 2: Business Laws */}
          <button
            onClick={() => {
              setActivePaper('paper2');
              setSelectedChapter('all');
              setCurrentIndex(0);
            }}
            className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
              activePaper === 'paper2'
                ? 'border-indigo-600 bg-indigo-50/70 dark:bg-indigo-950/60 ring-2 ring-indigo-500/50'
                : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/60'
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] font-black px-1.5 py-0.5 rounded-md bg-indigo-100 dark:bg-indigo-900 text-indigo-800 dark:text-indigo-300">
                P-2
              </span>
              <ShieldCheck className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div className="font-bold text-xs text-slate-900 dark:text-slate-100 truncate">
              {language === 'en' ? 'Business Laws' : 'व्यापारिक कानून'}
            </div>
            <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">
              {allPoolQuestions.filter((q) => q.paperId === 'paper2').length} {language === 'en' ? 'Qns' : 'प्रश्न'}
            </div>
          </button>

          {/* Paper 3: Quantitative Aptitude */}
          <button
            onClick={() => {
              setActivePaper('paper3');
              setSelectedChapter('all');
              setCurrentIndex(0);
            }}
            className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
              activePaper === 'paper3'
                ? 'border-emerald-600 bg-emerald-50/70 dark:bg-emerald-950/60 ring-2 ring-emerald-500/50'
                : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/60'
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] font-black px-1.5 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-300">
                P-3
              </span>
              <Sparkles className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div className="font-bold text-xs text-slate-900 dark:text-slate-100 truncate">
              {language === 'en' ? 'Quantitative Aptitude' : 'मात्रात्मक योग्यता'}
            </div>
            <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">
              {allPoolQuestions.filter((q) => q.paperId === 'paper3').length} {language === 'en' ? 'Qns' : 'प्रश्न'}
            </div>
          </button>

          {/* Paper 4: Business Economics */}
          <button
            onClick={() => {
              setActivePaper('paper4');
              setSelectedChapter('all');
              setCurrentIndex(0);
            }}
            className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between col-span-2 sm:col-span-1 ${
              activePaper === 'paper4'
                ? 'border-amber-600 bg-amber-50/70 dark:bg-amber-950/60 ring-2 ring-amber-500/50'
                : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/60'
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] font-black px-1.5 py-0.5 rounded-md bg-amber-100 dark:bg-amber-900 text-amber-800 dark:text-amber-300">
                P-4
              </span>
              <Zap className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            </div>
            <div className="font-bold text-xs text-slate-900 dark:text-slate-100 truncate">
              {language === 'en' ? 'Business Economics' : 'व्यावसायिक अर्थशास्त्र'}
            </div>
            <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">
              {allPoolQuestions.filter((q) => q.paperId === 'paper4').length} {language === 'en' ? 'Qns' : 'प्रश्न'}
            </div>
          </button>
        </div>
      </div>

      {/* --- SMART PRACTICE MODES SWITCHER BAR --- */}
      <div className="bg-slate-100 dark:bg-slate-800 p-1.5 rounded-2xl flex flex-wrap items-center gap-1.5 border border-slate-200 dark:border-slate-700">
        <button
          onClick={() => {
            setPracticeMode('standard');
            setCurrentIndex(0);
          }}
          className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
            practiceMode === 'standard'
              ? 'bg-white dark:bg-slate-900 text-blue-700 dark:text-blue-400 shadow-xs'
              : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-100'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>{language === 'en' ? 'Chapter Practice' : 'अध्याय अभ्यास'}</span>
        </button>

        <button
          onClick={() => {
            setPracticeMode('pyq');
            setCurrentIndex(0);
          }}
          className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
            practiceMode === 'pyq'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-100'
          }`}
        >
          <History className="w-4 h-4" />
          <span>{language === 'en' ? 'Dedicated PYQ Bank' : 'विगत वर्ष प्रश्न (PYQ)'}</span>
          <span className={`px-1.5 py-0.2 rounded-full text-xs font-bold ${
            practiceMode === 'pyq' ? 'bg-indigo-700 text-white' : 'bg-indigo-100 dark:bg-indigo-950 text-indigo-800 dark:text-indigo-300'
          }`}>
            {pyqCount}
          </span>
        </button>

        <button
          onClick={() => {
            setPracticeMode('notebook');
            setCurrentIndex(0);
          }}
          className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
            practiceMode === 'notebook'
              ? 'bg-rose-600 text-white shadow-xs'
              : 'text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-100'
          }`}
        >
          <Notebook className="w-4 h-4" />
          <span>{language === 'en' ? 'Wrong Notebook' : 'त्रुटि पुस्तिका'}</span>
          <span className={`px-1.5 py-0.2 rounded-full text-xs font-black ${
            practiceMode === 'notebook' ? 'bg-rose-700 text-white' : 'bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-300'
          }`}>
            {wrongCount}
          </span>
        </button>

        <button
          onClick={() => {
            setPracticeMode('revision');
            setCurrentIndex(0);
          }}
          className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
            practiceMode === 'revision'
              ? 'bg-amber-500 text-white shadow-xs'
              : 'text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-100'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          <span>{language === 'en' ? 'Revision' : 'रिवीजन'}</span>
        </button>

        <button
          onClick={() => {
            setPracticeMode('real_exam');
            setCurrentIndex(0);
            if (!isExamRunning && !isExamSubmitted) {
              handleStartExam();
            }
          }}
          className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
            practiceMode === 'real_exam'
              ? 'bg-purple-600 text-white shadow-xs'
              : 'text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-100'
          }`}
        >
          <Timer className="w-4 h-4" />
          <span>{language === 'en' ? 'Timed Exam Mode' : 'एग्ज़ाम टाइमर'}</span>
        </button>
      </div>

      {/* --- RANDOM DRAWER & SHUFFLE TOOLBAR --- */}
      <div className="bg-blue-50/80 dark:bg-blue-950/40 p-3 rounded-2xl border border-blue-200/80 dark:border-blue-900/60 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2">
          <button
            onClick={handleDrawRandomQuestion}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold transition-all shadow-xs active:scale-95 cursor-pointer"
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
            <span>{language === 'en' ? (shuffleOptions ? 'Choices Shuffled' : 'Shuffle Choices') : (shuffleOptions ? 'विकल्प फेरबदल सक्रिय' : 'विकल्प फेरबदल')}</span>
          </button>
        </div>

        <div className="text-slate-600 dark:text-slate-400 font-medium flex items-center gap-3">
          <span>
            {language === 'en' ? 'Questions in current view:' : 'वर्तमान प्रश्न:'}{' '}
            <strong className="text-slate-900 dark:text-slate-100">{filteredQuestions.length}</strong>
          </span>
          <span className="hidden sm:inline text-slate-300 dark:text-slate-700">|</span>
          <span className="text-emerald-700 dark:text-emerald-400 font-bold flex items-center gap-1">
            <Award className="w-3.5 h-3.5" />
            <span>+10 pts / MCQ</span>
          </span>
        </div>
      </div>

      {/* --- REWARD & BADGE TOAST NOTIFICATION --- */}
      {latestRewardNotification && (
        <div className="bg-emerald-600 text-white p-3.5 rounded-2xl shadow-lg flex items-center justify-between gap-3 animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center text-lg">
              {latestRewardNotification.badge?.icon || '⭐'}
            </div>
            <div>
              <div className="font-bold text-xs">
                {language === 'en' ? 'Learning Reward Earned!' : 'अध्ययन पुरस्कार प्राप्त हुआ!'}
              </div>
              <div className="text-[11px] text-emerald-100">
                {latestRewardNotification.badge ? (
                  <span>
                    🎉 {language === 'en' ? 'Unlocked Badge:' : 'नया बैज मिला:'}{' '}
                    <strong>{latestRewardNotification.badge.name[language]}</strong> (+{latestRewardNotification.points} pts)
                  </span>
                ) : (
                  <span>+{latestRewardNotification.points} Learning Points added to your profile! Keep going!</span>
                )}
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

      {/* --- REAL EXAM STATUS BAR (if active) --- */}
      {practiceMode === 'real_exam' && (
        <div className="bg-purple-950 text-white rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-lg border border-purple-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-800 flex items-center justify-center text-amber-300 font-bold">
              <Timer className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm sm:text-base">
                  {language === 'en' ? 'Timed Exam Simulation' : 'समयबद्ध परीक्षा सिमुलेशन'}
                </h3>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-purple-800 text-purple-200">
                  {language === 'en' ? '-0.25 Negative Marking' : '-0.25 नकारात्मक अंकन'}
                </span>
              </div>
              <p className="text-xs text-purple-200 mt-0.5">
                {language === 'en'
                  ? 'Explanations are concealed until submission. Attempt carefully.'
                  : 'परीक्षा जमा करने तक व्याख्याएं छिपी रहेंगी। ध्यानपूर्वक हल करें।'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end">
            {/* Countdown clock */}
            <div className="text-center bg-purple-900/80 px-4 py-2 rounded-xl border border-purple-700/60 font-mono">
              <span className="text-[10px] text-purple-300 block uppercase font-bold">
                {language === 'en' ? 'Time Remaining' : 'शेष समय'}
              </span>
              <span className={`text-xl font-black ${examTimeRemaining < 180 ? 'text-rose-400 animate-pulse' : 'text-amber-300'}`}>
                {formatExamTime(examTimeRemaining)}
              </span>
            </div>

            {/* Action button */}
            {!isExamSubmitted ? (
              <button
                onClick={handleFinishExam}
                className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm shadow-md transition-transform active:scale-95 cursor-pointer flex items-center gap-1.5"
              >
                <Check className="w-4 h-4" />
                <span>{language === 'en' ? 'Submit Test' : 'परीक्षा जमा करें'}</span>
              </button>
            ) : (
              <button
                onClick={handleStartExam}
                className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm shadow-md transition-transform active:scale-95 cursor-pointer flex items-center gap-1.5"
              >
                <RotateCcw className="w-4 h-4" />
                <span>{language === 'en' ? 'Retake Exam' : 'पुनः प्रयास'}</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* --- EXAM RESULT SCORECARD (shown after submit in Exam Mode) --- */}
      {practiceMode === 'real_exam' && isExamSubmitted && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200/90 dark:border-slate-800 shadow-md animate-in fade-in space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-3">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black ${
                examScoreAnalysis.isPassing ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300' : 'bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300'
              }`}>
                <Trophy className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-black text-slate-900 dark:text-slate-100">
                  {language === 'en' ? 'Official Test Scorecard' : 'आधिकारिक परीक्षा परिणाम पत्र'}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {language === 'en' ? 'ICAI Criteria: 40% Minimum to pass individual paper' : 'आईसीएआई मानक: प्रत्येक विषय में न्यूनतम 40% अंक आवश्यक'}
                </p>
              </div>
            </div>

            <div className={`px-4 py-2 rounded-xl font-bold text-xs self-start sm:self-auto uppercase tracking-wider ${
              examScoreAnalysis.isPassing ? 'bg-emerald-50 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800' : 'bg-rose-50 dark:bg-rose-950/70 text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
            }`}>
              {examScoreAnalysis.isPassing 
                ? (language === 'en' ? '✓ QUALIFIED (Pass)' : '✓ उत्तीर्ण (पास)')
                : (language === 'en' ? '⚠️ NEED REVISION (<40%)' : '⚠️ पुनरावलोकन आवश्यक (<40%)')}
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-slate-50 dark:bg-slate-800/70 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 text-center">
              <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 block uppercase">
                {language === 'en' ? 'Net Score' : 'कुल अंक'}
              </span>
              <span className="text-2xl font-black text-blue-700 dark:text-blue-400">
                {examScoreAnalysis.netScore} / {examScoreAnalysis.maxScore}
              </span>
            </div>

            <div className="bg-slate-50 dark:bg-slate-800/70 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 text-center">
              <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 block uppercase">
                {language === 'en' ? 'Accuracy' : 'सटीकता'}
              </span>
              <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
                {examScoreAnalysis.percentage}%
              </span>
            </div>

            <div className="bg-slate-50 dark:bg-slate-800/70 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 text-center">
              <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 block uppercase">
                {language === 'en' ? 'Correct (+1.00)' : 'सही (+1.00)'}
              </span>
              <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
                {examScoreAnalysis.correct}
              </span>
            </div>

            <div className="bg-slate-50 dark:bg-slate-800/70 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 text-center">
              <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 block uppercase">
                {language === 'en' ? 'Wrong (-0.25)' : 'गलत (-0.25)'}
              </span>
              <span className="text-2xl font-black text-rose-600 dark:text-rose-400">
                {examScoreAnalysis.incorrect}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* --- DEDICATED PYQ BANK FILTER BAR (when in PYQ mode) --- */}
      {practiceMode === 'pyq' && (
        <div className="bg-indigo-50/70 dark:bg-indigo-950/40 p-4 rounded-2xl border border-indigo-200 dark:border-indigo-800/80 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-indigo-900 dark:text-indigo-200 flex items-center gap-1.5">
              <History className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <span>{language === 'en' ? 'Filter Previous Year Questions by Examination Year:' : 'परीक्षा वर्ष अनुसार विगत वर्ष प्रश्न चुनें:'}</span>
            </span>
          </div>

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
                    : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-indigo-50/50'
                }`}
              >
                {year === 'all' ? (language === 'en' ? 'All Exam Years' : 'सभी परीक्षा वर्ष') : `${year} Exams`}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* --- SECONDARY FILTERS: CHAPTER, DIFFICULTY, BOOKMARKS --- */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200/90 dark:border-slate-800 shadow-xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
          {/* Chapter Filter */}
          <div>
            <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
              {language === 'en' ? 'Chapter:' : 'अध्याय:'}
            </label>
            <select
              value={selectedChapter}
              onChange={(e) => {
                setSelectedChapter(e.target.value);
                setCurrentIndex(0);
              }}
              className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-medium focus:outline-blue-500"
            >
              <option value="all">{language === 'en' ? 'All Chapters' : 'सभी अध्याय'}</option>
              {availableChapters.map((ch) => (
                <option key={ch.id} value={ch.id}>
                  {ch.title[language]}
                </option>
              ))}
            </select>
          </div>

          {/* Difficulty Filter */}
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
              className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-medium focus:outline-blue-500"
            >
              <option value="all">{language === 'en' ? 'All Difficulties' : 'सभी स्तर'}</option>
              <option value="easy">{language === 'en' ? 'Easy (सरल)' : 'सरल'}</option>
              <option value="medium">{language === 'en' ? 'Medium (मध्यम)' : 'मध्यम'}</option>
              <option value="hard">{language === 'en' ? 'Hard (कठिन)' : 'कठिन'}</option>
            </select>
          </div>

          {/* Bookmarks Toggle Button */}
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
              <span className="px-1.5 py-0.2 rounded-full bg-slate-100 dark:bg-slate-800 text-[10px] font-bold">
                {bookmarkedIds.length}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* --- QUESTION CARD AREA --- */}
      {!currentQuestion ? (
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-12 text-center border border-dashed border-slate-300 dark:border-slate-700">
          <HelpCircle className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-700 dark:text-slate-300">
            {practiceMode === 'notebook'
              ? (language === 'en' ? 'Great work! No pending questions in your Wrong Questions Notebook.' : 'शानदार! आपकी त्रुटि पुस्तिका में कोई लंबित प्रश्न नहीं है।')
              : (language === 'en' ? 'No official questions match the selected filters.' : 'चयनित फ़िल्टर के अनुसार कोई आधिकारिक प्रश्न नहीं मिला।')}
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {practiceMode === 'notebook'
              ? (language === 'en' ? 'When you answer a question incorrectly, it appears here automatically for revision.' : 'जब आप कोई प्रश्न गलत करेंगे, तो वह रिवीजन के लिए यहाँ अपने आप जुड़ जाएगा।')
              : (language === 'en' ? 'Try clearing chapter, exam year, or subject filters.' : 'कृपया अध्याय, सत्र या विषय फ़िल्टर बदलें।')}
          </p>
          <button
            onClick={() => {
              setPracticeMode('standard');
              setActiveSection('ALL');
              setActivePaper('all');
              setSelectedChapter('all');
              setSelectedExamAttempt('all');
              setSelectedPyqYear('all');
              setDifficultyFilter('all');
              setOnlyBookmarks(false);
              setCurrentIndex(0);
            }}
            className="mt-4 px-4 py-2 rounded-lg bg-blue-600 text-white text-xs font-bold shadow-xs hover:bg-blue-700 cursor-pointer"
          >
            {language === 'en' ? 'Reset All Filters & Return' : 'सभी फ़िल्टर रीसेट करें'}
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 sm:p-7 border border-slate-200/90 dark:border-slate-800 shadow-sm relative space-y-4">
            
            {/* WRONG NOTEBOOK BADGE IF IN NOTEBOOK */}
            {currentWrongEntry && (
              <div className="p-3 bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 rounded-xl flex items-center justify-between text-rose-900 dark:text-rose-200 text-xs">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
                  <span className="font-bold">
                    {language === 'en'
                      ? `Wrong Attempt Recorded: Failed ${currentWrongEntry.failedCount} time(s). Last on ${currentWrongEntry.lastAttemptDate}`
                      : `त्रुटि दर्ज: ${currentWrongEntry.failedCount} बार गलत हुआ। अंतिम प्रयास: ${currentWrongEntry.lastAttemptDate}`}
                  </span>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-200 dark:bg-rose-900 text-rose-800 dark:text-rose-200">
                  {language === 'en' ? 'Needs Mastery' : 'पुनः अभ्यास आवश्यक'}
                </span>
              </div>
            )}

            {/* PROMINENT OFFICIAL SOURCE CITATION BANNER */}
            <div className={`p-3.5 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 ${
              currentQuestion.sourceType === 'ICAI_MODULE'
                ? 'bg-blue-50/70 dark:bg-blue-950/50 border-blue-200/90 dark:border-blue-800 text-blue-950 dark:text-blue-200'
                : 'bg-indigo-50/70 dark:bg-indigo-950/50 border-indigo-200/90 dark:border-indigo-800 text-indigo-950 dark:text-indigo-200'
            }`}>
              <div className="flex items-start gap-2.5">
                <div className={`p-1.5 rounded-lg mt-0.5 shrink-0 ${
                  currentQuestion.sourceType === 'ICAI_MODULE'
                    ? 'bg-blue-600 text-white'
                    : 'bg-indigo-600 text-white'
                }`}>
                  {currentQuestion.sourceType === 'ICAI_MODULE' ? (
                    <BookOpen className="w-4 h-4" />
                  ) : (
                    <History className="w-4 h-4" />
                  )}
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-black uppercase tracking-wider">
                      {currentQuestion.sourceType === 'ICAI_MODULE'
                        ? (language === 'en' ? 'ICAI Study Material Question' : 'आईसीएआई अध्ययन सामग्री प्रश्न')
                        : (language === 'en' ? `CA Foundation Past Exam (PYQ: ${currentQuestion.examAttempt})` : `सीए फाउंडेशन विगत वर्ष परीक्षा (PYQ: ${currentQuestion.examAttempt})`)}
                    </span>
                    <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-md bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold text-slate-700 dark:text-slate-300">
                      {currentQuestion.officialQuestionRef}
                    </span>
                  </div>
                  <p className="text-xs text-slate-700 dark:text-slate-300 font-medium leading-relaxed mt-0.5">
                    {currentQuestion.sourceLabel[qLang]}
                  </p>
                </div>
              </div>

              {/* Direct Link to Official ICAI Portal */}
              <a
                href={currentQuestion.officialSourceLink}
                target="_blank"
                rel="noopener noreferrer"
                title={language === 'en' ? 'Verify on official ICAI website' : 'आईसीएआई की आधिकारिक वेबसाइट पर देखें'}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-blue-700 dark:text-blue-300 text-xs font-bold hover:bg-blue-50 dark:hover:bg-slate-700 transition-colors shadow-2xs self-start sm:self-auto shrink-0"
              >
                <span>{language === 'en' ? 'ICAI Official Portal' : 'आईसीएआई पोर्टल'}</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>

            {/* Question Chapter & Difficulty Header */}
            <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300 text-xs font-bold border border-blue-200 dark:border-blue-800 uppercase">
                  {currentQuestion.paperId}
                </span>
                <span className="text-xs text-slate-600 dark:text-slate-400 font-semibold">
                  {currentQuestion.chapterTitle[qLang]}
                </span>
                <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-md ${
                  currentQuestion.difficulty === 'easy'
                    ? 'bg-emerald-50 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300'
                    : currentQuestion.difficulty === 'medium'
                    ? 'bg-amber-50 dark:bg-amber-950/70 text-amber-700 dark:text-amber-300'
                    : 'bg-rose-50 dark:bg-rose-950/70 text-rose-700 dark:text-rose-300'
                }`}>
                  {currentQuestion.difficulty}
                </span>
              </div>

              <div className="flex items-center gap-2">
                {/* Language Switch for this Question */}
                <button
                  onClick={() => toggleSingleQuestionLang(currentQuestion.id)}
                  title={language === 'en' ? 'Switch question text language' : 'प्रश्न भाषा बदलें'}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-medium cursor-pointer"
                >
                  <Languages className="w-3.5 h-3.5" />
                  <span>{qLang === 'en' ? 'हिन्दी' : 'English'}</span>
                </button>

                {/* Bookmark Toggle */}
                <button
                  onClick={() => toggleBookmark(currentQuestion.id)}
                  aria-label="Bookmark question"
                  className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                    isBookmarked
                      ? 'bg-amber-50 dark:bg-amber-950/70 border-amber-300 dark:border-amber-700 text-amber-500'
                      : 'border-slate-200 dark:border-slate-700 text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
                >
                  <Bookmark className={`w-4 h-4 ${isBookmarked ? 'fill-amber-500' : ''}`} />
                </button>
              </div>
            </div>

            {/* Question Counter */}
            <div className="flex items-center justify-between text-xs text-slate-400 dark:text-slate-500 font-medium">
              <span>
                {language === 'en' ? 'Question' : 'प्रश्न'} {currentIndex + 1} / {filteredQuestions.length}
              </span>
              {isSubmitted && (
                <span className={currentSelected === currentQuestion.correctIndex ? 'text-emerald-600 dark:text-emerald-400 font-bold' : 'text-rose-600 dark:text-rose-400 font-bold'}>
                  {currentSelected === currentQuestion.correctIndex
                    ? (language === 'en' ? 'Correct (+1.00)' : 'सही उत्तर (+1.00)')
                    : (language === 'en' ? 'Incorrect (-0.25)' : 'गलत उत्तर (-0.25)')}
                </span>
              )}
            </div>

            {/* Question Text */}
            <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100 leading-snug">
              {currentQuestion.question[qLang]}
            </h2>

            {/* Options List */}
            <div className="space-y-3">
              {currentQuestion.options[qLang].map((optionText, optIdx) => {
                const isChosen = currentSelected === optIdx;
                const isCorrect = currentQuestion.correctIndex === optIdx;

                let optionStyle = 'border-slate-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-600 hover:bg-blue-50/20 dark:hover:bg-slate-800/50 text-slate-900 dark:text-slate-100';
                if (isSubmitted) {
                  if (isCorrect) {
                    optionStyle = 'border-emerald-500 bg-emerald-50/70 dark:bg-emerald-950/60 text-emerald-900 dark:text-emerald-200 font-semibold ring-1 ring-emerald-500';
                  } else if (isChosen && !isCorrect) {
                    optionStyle = 'border-rose-500 bg-rose-50/70 dark:bg-rose-950/60 text-rose-900 dark:text-rose-200 font-semibold ring-1 ring-rose-500';
                  } else {
                    optionStyle = 'border-slate-200 dark:border-slate-700 opacity-60 text-slate-700 dark:text-slate-300';
                  }
                } else if (isChosen) {
                  optionStyle = 'border-blue-600 bg-blue-50/50 dark:bg-blue-950/60 text-blue-900 dark:text-blue-100 ring-1 ring-blue-600 font-semibold';
                }

                const letter = String.fromCharCode(65 + optIdx); // A, B, C, D

                return (
                  <button
                    key={optIdx}
                    disabled={isSubmitted && practiceMode !== 'real_exam'}
                    onClick={() => handleSelectOption(optIdx)}
                    className={`w-full text-left p-3.5 sm:p-4 rounded-xl border transition-all flex items-start gap-3 cursor-pointer ${optionStyle}`}
                  >
                    <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-0.5 ${
                      isSubmitted && isCorrect
                        ? 'bg-emerald-600 text-white'
                        : isSubmitted && isChosen && !isCorrect
                        ? 'bg-rose-600 text-white'
                        : isChosen
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                    }`}>
                      {letter}
                    </span>
                    <span className="text-sm leading-relaxed flex-1">{optionText}</span>
                    {isSubmitted && isCorrect && (
                      <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    )}
                    {isSubmitted && isChosen && !isCorrect && (
                      <XCircle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Submit / Check Answer Button */}
            {practiceMode !== 'real_exam' && !isSubmitted ? (
              <button
                disabled={currentSelected === undefined}
                onClick={handleSubmitAnswer}
                className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 dark:disabled:bg-slate-800 disabled:text-slate-400 dark:disabled:text-slate-600 disabled:cursor-not-allowed text-white font-bold text-sm shadow-md transition-all active:scale-[0.99] cursor-pointer"
              >
                {language === 'en' ? 'Check Answer & Earn Points' : 'उत्तर जांचें एवं अंक प्राप्त करें'}
              </button>
            ) : isSubmitted ? (
              /* Conceptual Explanation Box */
              <div className="bg-slate-50 dark:bg-slate-800/60 rounded-xl p-4 sm:p-5 border border-slate-200/90 dark:border-slate-700 space-y-3 animate-in fade-in duration-300">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  <Lightbulb className="w-4 h-4 text-amber-500" />
                  <span>{language === 'en' ? 'Official Solution & Explanation' : 'आधिकारिक हल एवं व्याख्या'}</span>
                </div>
                <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                  {currentQuestion.explanation[qLang]}
                </p>

                {/* Key Rule Pill */}
                <div className="p-3 bg-blue-50/70 dark:bg-blue-950/60 border border-blue-200/80 dark:border-blue-800 rounded-lg">
                  <span className="text-[11px] font-bold text-blue-900 dark:text-blue-300 block mb-0.5">
                    📌 {language === 'en' ? 'ICAI Syllabus Rule / Principle:' : 'आईसीएआई पाठ्यक्रम नियम / सिद्धांत:'}
                  </span>
                  <span className="text-xs text-blue-800 dark:text-blue-200 font-medium">
                    {currentQuestion.keyRule[qLang]}
                  </span>
                </div>
              </div>
            ) : null}
          </div>

          {/* Bottom Navigation Pagination Bar */}
          <div className="flex items-center justify-between gap-3">
            <button
              disabled={currentIndex === 0}
              onClick={handlePrevious}
              className="px-4 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>{language === 'en' ? 'Previous' : 'पिछला'}</span>
            </button>

            {/* Quick jump question numbers */}
            <div className="flex items-center gap-1 overflow-x-auto max-w-[200px] sm:max-w-md px-1">
              {filteredQuestions.map((q, idx) => {
                const isAns = practiceMode === 'real_exam' ? selectedAnswers[q.id] !== undefined : submittedQuestions[q.id];
                const isCurr = idx === currentIndex;
                const isCor = selectedAnswers[q.id] === q.correctIndex;

                let circleClass = 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400';
                if (isAns) {
                  if (practiceMode === 'real_exam' && !isExamSubmitted) {
                    circleClass = 'bg-purple-600 text-white';
                  } else {
                    circleClass = isCor ? 'bg-emerald-600 text-white' : 'bg-rose-600 text-white';
                  }
                }
                if (isCurr) {
                  circleClass += ' ring-2 ring-blue-600 font-bold';
                }

                return (
                  <button
                    key={q.id}
                    onClick={() => setCurrentIndex(idx)}
                    className={`w-7 h-7 rounded-lg text-xs font-medium shrink-0 flex items-center justify-center transition-all ${circleClass}`}
                  >
                    {idx + 1}
                  </button>
                );
              })}
            </div>

            <button
              disabled={currentIndex === filteredQuestions.length - 1}
              onClick={handleNext}
              className="px-4 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
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
