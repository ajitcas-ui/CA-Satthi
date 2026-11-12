import React, { useState, useEffect } from 'react';
import { Language, StudyTask, PaperId, RevisionReminder, UserProfile } from '../types';
import { PAPERS } from '../data/papersData';
import { INITIAL_STUDY_TASKS, STUDY_PLAN_TEMPLATES } from '../data/mockPlanner';
import { playChimeSound } from '../utils/audio';
import { 
  getRevisionReminders, 
  addRevisionReminder, 
  toggleReminderCompleted 
} from '../utils/storageDb';
import {
  saveStudyTaskToDb,
  deleteStudyTaskFromDb,
  saveRevisionReminderToDb,
  toggleRevisionReminderInDb,
  subscribeToUserRevisionReminders,
  saveChapterProgressToDb,
  subscribeToUserChapterProgress
} from '../firebase/services';
import { 
  Calendar, 
  CheckCircle2, 
  Circle, 
  Plus, 
  Trash2, 
  Clock, 
  Play, 
  Pause, 
  RotateCcw, 
  Sparkles, 
  BookOpen, 
  AlertCircle,
  X,
  Bell,
  CheckSquare,
  BarChart3,
  CalendarDays,
  Target
} from 'lucide-react';

import { DailyReminderCard } from './DailyReminderCard';
import { ScheduleTaskReminderModal } from './ScheduleTaskReminderModal';

interface StudyPlannerViewProps {
  language: Language;
  tasks: StudyTask[];
  setTasks: React.Dispatch<React.SetStateAction<StudyTask[]>>;
  onStudySessionComplete: (minutes: number) => void;
  currentUser?: UserProfile;
  streak?: number;
}

// CA Foundation Syllabus Chapters for Completion Tracker
const SYLLABUS_CHAPTERS: Record<PaperId, Array<{ id: string; name: { en: string; hi: string }; weightage: string }>> = {
  paper1: [
    { id: 'p1_ch1', name: { en: 'Theoretical Framework of Accounting', hi: 'लेखांकन का सैद्धांतिक ढांचा' }, weightage: '5-10%' },
    { id: 'p1_ch2', name: { en: 'Accounting Process & Journal/Ledger', hi: 'लेखांकन प्रक्रिया एवं जर्नल/खाताबही' }, weightage: '10-15%' },
    { id: 'p1_ch3', name: { en: 'Bank Reconciliation Statement (BRS)', hi: 'बैंक समाधान विवरण (BRS)' }, weightage: '8-10%' },
    { id: 'p1_ch4', name: { en: 'Inventories & Valuation (AS-2)', hi: 'रहंतिया एवं मूल्यांकन (AS-2)' }, weightage: '8-12%' },
    { id: 'p1_ch5', name: { en: 'Depreciation and Amortization (AS-10)', hi: 'मूल्यह्रास एवं परिशोधन' }, weightage: '8-12%' },
    { id: 'p1_ch6', name: { en: 'Final Accounts of Sole Proprietors', hi: 'एकल व्यापारियों के अंतिम खाते' }, weightage: '15-20%' },
    { id: 'p1_ch7', name: { en: 'Partnership & LLP Accounts', hi: 'साझेदारी एवं एलएलपी खाते' }, weightage: '15-20%' },
    { id: 'p1_ch8', name: { en: 'Company Accounts (Share Capital & Debentures)', hi: 'कंपनी खाते (अंश पूंजी एवं ऋणपत्र)' }, weightage: '15-20%' },
  ],
  paper2: [
    { id: 'p2_ch1', name: { en: 'Indian Regulatory Framework', hi: 'भारतीय विनियामक ढांचा' }, weightage: '5-10%' },
    { id: 'p2_ch2', name: { en: 'The Indian Contract Act, 1872 (General Principles)', hi: 'भारतीय अनुबंध अधिनियम, 1872 (सामान्य सिद्धांत)' }, weightage: '20-25%' },
    { id: 'p2_ch3', name: { en: 'The Indian Contract Act (Special Contracts)', hi: 'भारतीय अनुबंध अधिनियम (विशेष अनुबंध)' }, weightage: '10-15%' },
    { id: 'p2_ch4', name: { en: 'The Sale of Goods Act, 1930', hi: 'माल विक्रय अधिनियम, 1930' }, weightage: '15-20%' },
    { id: 'p2_ch5', name: { en: 'The Indian Partnership Act, 1932', hi: 'भारतीय साझेदारी अधिनियम, 1932' }, weightage: '15-20%' },
    { id: 'p2_ch6', name: { en: 'The Limited Liability Partnership Act, 2008', hi: 'सीमित देयता भागीदारी अधिनियम, 2008' }, weightage: '8-12%' },
    { id: 'p2_ch7', name: { en: 'The Companies Act, 2013 (Basics & Incorporation)', hi: 'कंपनी अधिनियम, 2013 (मूल बातें एवं समामेलन)' }, weightage: '15-20%' },
  ],
  paper3: [
    { id: 'p3_ch1', name: { en: 'Ratio, Proportion, Indices and Logarithms', hi: 'अनुपात, समानुपात, घातांक एवं लघुगणक' }, weightage: '6-8%' },
    { id: 'p3_ch2', name: { en: 'Equations & Matrices', hi: 'समीकरण एवं आव्यूह' }, weightage: '6-8%' },
    { id: 'p3_ch3', name: { en: 'Linear Inequalities', hi: 'रैखिक असमिकाएं' }, weightage: '3-5%' },
    { id: 'p3_ch4', name: { en: 'Time Value of Money (TVM - High Weightage)', hi: 'मुद्रा का समय मूल्य (TVM - उच्चतम भार)' }, weightage: '12-16%' },
    { id: 'p3_ch5', name: { en: 'Permutations and Combinations', hi: 'क्रमचय एवं संचय' }, weightage: '5-7%' },
    { id: 'p3_ch6', name: { en: 'Sequence and Series (AP & GP)', hi: 'अनुक्रम एवं श्रेणी (AP और GP)' }, weightage: '4-6%' },
    { id: 'p3_ch7', name: { en: 'Logical Reasoning (Number Series, Direction, Blood Relations)', hi: 'तार्किक योग्यता (दिशा ज्ञान, रक्त संबंध, बैठक व्यवस्था)' }, weightage: '20%' },
    { id: 'p3_ch8', name: { en: 'Statistical Representation & Central Tendency', hi: 'सांख्यिकीय निरूपण एवं केंद्रीय प्रवृत्ति' }, weightage: '15-18%' },
    { id: 'p3_ch9', name: { en: 'Probability & Theoretical Distributions', hi: 'प्रायिकता एवं सैद्धांतिक बंटन' }, weightage: '10-12%' },
  ],
  paper4: [
    { id: 'p4_ch1', name: { en: 'Introduction to Business Economics', hi: 'व्यावसायिक अर्थशास्त्र का परिचय' }, weightage: '8-10%' },
    { id: 'p4_ch2', name: { en: 'Theory of Demand and Supply', hi: 'मांग और पूर्ति का सिद्धांत' }, weightage: '15-20%' },
    { id: 'p4_ch3', name: { en: 'Theory of Production and Cost', hi: 'उत्पादन एवं लागत का सिद्धांत' }, weightage: '12-15%' },
    { id: 'p4_ch4', name: { en: 'Price Determination in Different Markets', hi: 'विभिन्न बाजारों में मूल्य निर्धारण' }, weightage: '15-18%' },
    { id: 'p4_ch5', name: { en: 'Determination of National Income', hi: 'राष्ट्रीय आय का निर्धारण' }, weightage: '12-15%' },
    { id: 'p4_ch6', name: { en: 'Public Finance & Fiscal Policy', hi: 'लोक वित्त एवं राजकोषीय नीति' }, weightage: '10-12%' },
    { id: 'p4_ch7', name: { en: 'Money Market & Monetary Policy', hi: 'मुद्रा बाजार एवं मौद्रिक नीति' }, weightage: '10-12%' },
    { id: 'p4_ch8', name: { en: 'International Trade & Business Cycles', hi: 'अंतर्राष्ट्रीय व्यापार एवं व्यापार चक्र' }, weightage: '10-12%' },
  ],
};

export const StudyPlannerView: React.FC<StudyPlannerViewProps> = ({
  language,
  tasks,
  setTasks,
  onStudySessionComplete,
  currentUser,
  streak = 5,
}) => {
  const [activeTab, setActiveTab] = useState<'daily' | 'weekly' | 'reminders' | 'tracker' | 'pomodoro' | 'templates'>('daily');
  const [filterPaper, setFilterPaper] = useState<string>('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [taskForReminder, setTaskForReminder] = useState<StudyTask | null>(null);
  const [taskReminderSuccess, setTaskReminderSuccess] = useState<string | null>(null);

  // New task form state
  const [newTitleEn, setNewTitleEn] = useState('');
  const [newTitleHi, setNewTitleHi] = useState('');
  const [newPaper, setNewPaper] = useState<PaperId>('paper1');
  const [newChapter, setNewChapter] = useState('');
  const [newDuration, setNewDuration] = useState(45);
  const [newPriority, setNewPriority] = useState<'high' | 'medium' | 'low'>('medium');

  // Revision reminders state
  const [reminders, setReminders] = useState<RevisionReminder[]>(() => getRevisionReminders());
  const [showAddReminderModal, setShowAddReminderModal] = useState(false);
  const [newReminderPaper, setNewReminderPaper] = useState<PaperId>('paper3');
  const [newReminderChapterEn, setNewReminderChapterEn] = useState('');
  const [newReminderChapterHi, setNewReminderChapterHi] = useState('');
  const [newReminderInterval, setNewReminderInterval] = useState<number>(3);

  // Chapter completion tracker state (persisted in localStorage)
  const [completedChapters, setCompletedChapters] = useState<Record<string, 'mastered' | 'revising' | 'pending'>>(() => {
    try {
      const saved = localStorage.getItem('ca_saathi_chapter_tracker');
      return saved ? JSON.parse(saved) : {
        'p1_ch1': 'mastered',
        'p1_ch2': 'mastered',
        'p1_ch3': 'revising',
        'p2_ch1': 'mastered',
        'p2_ch2': 'revising',
        'p3_ch1': 'mastered',
        'p3_ch4': 'revising',
        'p4_ch1': 'mastered',
        'p4_ch2': 'mastered',
      };
    } catch {
      return {};
    }
  });

  // Selected paper in Chapter Tracker
  const [trackerPaper, setTrackerPaper] = useState<PaperId>('paper1');

  // Pomodoro state
  const [pomodoroMode, setPomodoroMode] = useState<'focus' | 'shortBreak' | 'longBreak'>('focus');
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isRunning, setIsRunning] = useState(false);

  // Sync chapter tracker to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('ca_saathi_chapter_tracker', JSON.stringify(completedChapters));
    } catch {
      // quota or blocked
    }
  }, [completedChapters]);

  // Sync revision reminders and chapter progress from Firestore
  useEffect(() => {
    if (!currentUser?.id) return;
    const unsubReminders = subscribeToUserRevisionReminders(currentUser.id, (rems) => {
      if (rems.length > 0) setReminders(rems);
    });
    const unsubProgress = subscribeToUserChapterProgress(currentUser.id, (progressMap) => {
      if (Object.keys(progressMap).length > 0) {
        setCompletedChapters((prev) => ({ ...prev, ...progressMap }));
      }
    });
    return () => {
      unsubReminders();
      unsubProgress();
    };
  }, [currentUser?.id]);

  // Pomodoro timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isRunning && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (isRunning && timeLeft === 0) {
      setIsRunning(false);
      playChimeSound('complete');
      if (pomodoroMode === 'focus') {
        onStudySessionComplete(25);
      }
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRunning, timeLeft, pomodoroMode, onStudySessionComplete]);

  const switchPomodoroMode = (mode: 'focus' | 'shortBreak' | 'longBreak') => {
    setIsRunning(false);
    setPomodoroMode(mode);
    if (mode === 'focus') setTimeLeft(25 * 60);
    else if (mode === 'shortBreak') setTimeLeft(5 * 60);
    else setTimeLeft(15 * 60);
  };

  const toggleTaskCompleted = (id: string) => {
    playChimeSound('click');
    setTasks((prev) =>
      prev.map((t) => {
        if (t.id === id) {
          const next = !t.completed;
          if (next) {
            playChimeSound('success');
            onStudySessionComplete(Math.min(30, t.durationMinutes));
          }
          return { ...t, completed: next };
        }
        return t;
      })
    );
  };

  const deleteTask = (id: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== id));
  };

  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitleEn.trim()) return;

    const newTask: StudyTask = {
      id: `task_${Date.now()}`,
      title: {
        en: newTitleEn,
        hi: newTitleHi.trim() || newTitleEn,
      },
      paperId: newPaper,
      chapter: {
        en: newChapter || 'General Revision',
        hi: newChapter || 'सामान्य रिवीजन',
      },
      durationMinutes: newDuration,
      completed: false,
      date: new Date().toISOString().split('T')[0],
      priority: newPriority,
    };

    setTasks((prev) => [newTask, ...prev]);
    if (currentUser?.id) {
      saveStudyTaskToDb(currentUser.id, newTask).catch(console.error);
    }
    setShowAddModal(false);
    setNewTitleEn('');
    setNewTitleHi('');
    setNewChapter('');
    playChimeSound('success');
  };

  const handleToggleReminder = (id: string) => {
    playChimeSound('click');
    const updated = toggleReminderCompleted(id);
    setReminders(updated);
  };

  const handleAddReminder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newReminderChapterEn.trim()) return;

    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + newReminderInterval);
    const dueDateStr = targetDate.toISOString().split('T')[0];

    const created = addRevisionReminder({
      paperId: newReminderPaper,
      chapterTitle: {
        en: newReminderChapterEn.trim(),
        hi: newReminderChapterHi.trim() || newReminderChapterEn.trim(),
      },
      intervalDays: newReminderInterval,
      dueDate: dueDateStr,
    });

    setReminders((prev) => [created, ...prev]);
    if (currentUser?.id) {
      saveRevisionReminderToDb(currentUser.id, created).catch(console.error);
    }
    setShowAddReminderModal(false);
    setNewReminderChapterEn('');
    setNewReminderChapterHi('');
    playChimeSound('success');
  };

  const toggleChapterStatus = (chId: string) => {
    playChimeSound('click');
    setCompletedChapters((prev) => {
      const current = prev[chId] || 'pending';
      const next = current === 'pending' ? 'revising' : current === 'revising' ? 'mastered' : 'pending';
      if (currentUser?.id) {
        saveChapterProgressToDb(currentUser.id, chId, next).catch(console.error);
      }
      return { ...prev, [chId]: next };
    });
  };

  // Chapter Tracker overall statistics
  const trackerStats = () => {
    const allChs = Object.values(SYLLABUS_CHAPTERS).flat();
    const total = allChs.length;
    let mastered = 0;
    let revising = 0;

    allChs.forEach((c) => {
      const s = completedChapters[c.id];
      if (s === 'mastered') mastered++;
      else if (s === 'revising') revising++;
    });

    const percent = Math.round((mastered / total) * 100);
    return { total, mastered, revising, percent };
  };

  const filteredTasks = tasks.filter((t) => {
    if (filterPaper !== 'all' && t.paperId !== filterPaper) return false;
    return true;
  });

  const completedCount = tasks.filter((t) => t.completed).length;
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const stats = trackerStats();

  return (
    <div className="space-y-6 pb-20 lg:pb-8">
      {/* Header and Mode switcher */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Calendar className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            {language === 'en' ? 'CA Foundation Study Planner' : 'सीए फाउंडेशन अध्ययन प्लानर'}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            {language === 'en'
              ? 'Daily targets, weekly schedules, spaced repetition revision reminders, and syllabus tracker'
              : 'दैनिक लक्ष्य, साप्ताहिक योजना, अंतराल पुनरावृत्ति (रिवीजन) एवं पाठ्यक्रम ट्रैकर'}
          </p>
        </div>

        {/* View Switcher Tabs */}
        <div className="flex items-center p-1 bg-slate-100 dark:bg-slate-800 rounded-xl overflow-x-auto max-w-full border border-slate-200 dark:border-slate-700">
          <button
            onClick={() => setActiveTab('daily')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'daily' ? 'bg-white dark:bg-slate-700 text-blue-700 dark:text-blue-300 shadow-xs' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            {language === 'en' ? 'Daily Targets' : 'दैनिक लक्ष्य'}
          </button>
          <button
            onClick={() => setActiveTab('weekly')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'weekly' ? 'bg-white dark:bg-slate-700 text-blue-700 dark:text-blue-300 shadow-xs' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            {language === 'en' ? 'Weekly Planner' : 'साप्ताहिक प्लानर'}
          </button>
          <button
            onClick={() => setActiveTab('reminders')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1 cursor-pointer ${
              activeTab === 'reminders' ? 'bg-white dark:bg-slate-700 text-blue-700 dark:text-blue-300 shadow-xs' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Bell className="w-3.5 h-3.5" />
            <span>{language === 'en' ? 'Revision Reminders' : 'रिवीजन अनुस्मारक'}</span>
          </button>
          <button
            onClick={() => setActiveTab('tracker')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1 cursor-pointer ${
              activeTab === 'tracker' ? 'bg-white dark:bg-slate-700 text-blue-700 dark:text-blue-300 shadow-xs' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <CheckSquare className="w-3.5 h-3.5" />
            <span>{language === 'en' ? 'Syllabus Tracker' : 'पाठ्यक्रम ट्रैकर'}</span>
          </button>
          <button
            onClick={() => setActiveTab('pomodoro')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'pomodoro' ? 'bg-white dark:bg-slate-700 text-blue-700 dark:text-blue-300 shadow-xs' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            {language === 'en' ? 'Focus Timer' : 'फोकस टाइमर'}
          </button>
          <button
            onClick={() => setActiveTab('templates')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'templates' ? 'bg-white dark:bg-slate-700 text-blue-700 dark:text-blue-300 shadow-xs' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            {language === 'en' ? 'Timetables' : 'टाइमटेबल'}
          </button>
        </div>
      </div>

      {/* --- TAB 1: DAILY TARGETS --- */}
      {activeTab === 'daily' && (
        <div className="space-y-4">
          {/* Daily Streak Reminder & Browser Notification Control Card */}
          <DailyReminderCard
            language={language}
            streak={streak}
            tasks={tasks}
          />

          {taskReminderSuccess && (
            <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-xs font-semibold flex items-center justify-between shadow-2xs animate-in fade-in">
              <span className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span>{taskReminderSuccess}</span>
              </span>
              <button
                onClick={() => setTaskReminderSuccess(null)}
                className="text-emerald-600 dark:text-emerald-400 hover:text-emerald-900 dark:hover:text-emerald-100 font-bold px-1.5 py-0.5 rounded-md hover:bg-emerald-100 dark:hover:bg-emerald-900/50 transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>
          )}

          {/* Progress summary & Add button bar */}
          <div className="bg-white dark:bg-slate-900 rounded-xl p-4 border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-100 dark:border-blue-900/60 flex items-center justify-center font-bold">
                {completedCount}/{tasks.length}
              </div>
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white text-sm">
                  {language === 'en' ? 'Daily Targets Completed' : 'दैनिक लक्ष्य पूर्ण'}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {completedCount === tasks.length && tasks.length > 0
                    ? (language === 'en' ? 'All tasks complete! Great work today!' : 'सभी कार्य पूरे! आज शानदार प्रदर्शन!')
                    : (language === 'en' ? `${tasks.length - completedCount} tasks remaining for today` : `आज के लिए ${tasks.length - completedCount} कार्य शेष`)}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* Paper Filter */}
              <select
                value={filterPaper}
                onChange={(e) => setFilterPaper(e.target.value)}
                className="text-xs font-medium px-2.5 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 focus:outline-blue-500"
              >
                <option value="all">{language === 'en' ? 'All Papers' : 'सभी विषय'}</option>
                {PAPERS.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.code}: {p.name[language]}
                  </option>
                ))}
              </select>

              {/* Add Task Button */}
              <button
                onClick={() => setShowAddModal(true)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-500 text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>{language === 'en' ? 'Add Target' : 'लक्ष्य जोड़ें'}</span>
              </button>
            </div>
          </div>

          {/* Tasks List */}
          <div className="space-y-2.5">
            {filteredTasks.length === 0 ? (
              <div className="bg-white dark:bg-slate-900 rounded-xl p-8 text-center border border-dashed border-slate-300 dark:border-slate-700">
                <CheckCircle2 className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
                <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                  {language === 'en' ? 'No study tasks found for this filter.' : 'इस फ़िल्टर के लिए कोई कार्य नहीं मिला।'}
                </p>
                <button
                  onClick={() => setShowAddModal(true)}
                  className="mt-3 text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                >
                  {language === 'en' ? '+ Add your first study target' : '+ पहला अध्ययन लक्ष्य जोड़ें'}
                </button>
              </div>
            ) : (
              filteredTasks.map((task) => {
                const paper = PAPERS.find((p) => p.id === task.paperId);
                return (
                  <div
                    key={task.id}
                    className={`p-3.5 rounded-xl border transition-all flex items-center justify-between gap-3 ${
                      task.completed
                        ? 'border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/30 dark:bg-emerald-950/20 opacity-75'
                        : 'border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-blue-300 dark:hover:border-blue-700 shadow-xs'
                    }`}
                  >
                    <div className="flex items-start gap-3 flex-1">
                      <button
                        onClick={() => toggleTaskCompleted(task.id)}
                        className="mt-0.5 text-slate-400 dark:text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 transition-colors cursor-pointer"
                      >
                        {task.completed ? (
                          <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 fill-emerald-100 dark:fill-emerald-950/60" />
                        ) : (
                          <Circle className="w-5 h-5 hover:text-blue-600 dark:hover:text-blue-400" />
                        )}
                      </button>

                      <div className="space-y-1">
                        <p
                          className={`text-sm font-medium ${
                            task.completed ? 'line-through text-slate-400 dark:text-slate-500' : 'text-slate-900 dark:text-white'
                          }`}
                        >
                          {task.title[language]}
                        </p>
                        <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400">
                          <span className="px-1.5 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 font-semibold border border-blue-100 dark:border-blue-900/60">
                            {paper?.code || 'Paper'}
                          </span>
                          <span>{task.chapter[language]}</span>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3 text-slate-400 dark:text-slate-500" />
                            {task.durationMinutes} min
                          </span>
                          {task.priority === 'high' && (
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-sm bg-red-50 dark:bg-red-950/50 text-red-600 dark:text-red-300 border border-red-200 dark:border-red-800">
                              {language === 'en' ? 'HIGH PRIORITY' : 'उच्च प्राथमिकता'}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => setTaskForReminder(task)}
                        className="p-1.5 text-slate-400 dark:text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                        title={language === 'en' ? 'Set Target Reminder' : 'इस लक्ष्य के लिए रिमाइंडर सेट करें'}
                      >
                        <Bell className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => deleteTask(task.id)}
                        className="p-1.5 text-slate-400 dark:text-slate-500 hover:text-red-500 dark:hover:text-red-400 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                        title={language === 'en' ? 'Delete Task' : 'हटाएं'}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* --- TAB 2: WEEKLY STUDY PLANNER --- */}
      {activeTab === 'weekly' && (
        <div className="space-y-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200/90 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-base">
                {language === 'en' ? 'Weekly CA Foundation Study Schedule' : 'साप्ताहिक सीए फाउंडेशन अध्ययन सारणी'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {language === 'en' 
                  ? 'Recommended 2-paper rotation per day to balance numericals and theory'
                  : 'संख्यात्मक एवं सैद्धांतिक विषयों के संतुलन के लिए प्रतिदिन 2 विषयों का चक्र'}
              </p>
            </div>
            <span className="px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 text-xs font-bold border border-blue-200 dark:border-blue-800">
              {language === 'en' ? 'Target: 28-35 Hours / Week' : 'लक्ष्य: 28-35 घंटे / सप्ताह'}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {[
              { day: { en: 'Monday', hi: 'सोमवार' }, p1: 'Paper 1: Accounting (Partnership)', p2: 'Paper 2: Indian Contract Act', hrs: 4.5 },
              { day: { en: 'Tuesday', hi: 'मंगलवार' }, p1: 'Paper 3: Math (TVM & Sequence)', p2: 'Paper 4: Demand & Supply Theory', hrs: 5 },
              { day: { en: 'Wednesday', hi: 'बुधवार' }, p1: 'Paper 1: BRS & Depreciation', p2: 'Paper 2: Sale of Goods Act', hrs: 4.5 },
              { day: { en: 'Thursday', hi: 'गुरुवार' }, p1: 'Paper 3: Logical Reasoning & Stats', p2: 'Paper 4: Market Structures & Pricing', hrs: 5 },
              { day: { en: 'Friday', hi: 'शुक्रवार' }, p1: 'Paper 1: Company Accounts', p2: 'Paper 2: Companies Act 2013', hrs: 5 },
              { day: { en: 'Saturday', hi: 'शनिवार' }, p1: 'Paper 3: Probability & Index Nos', p2: 'Paper 4: National Income & Public Finance', hrs: 5 },
              { day: { en: 'Sunday', hi: 'रविवार' }, p1: 'Full Mock Test (Paper 3 / 4 MCQ)', p2: 'Weekly Error Notebook Revision', hrs: 4 },
            ].map((d, idx) => (
              <div key={idx} className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs hover:border-blue-400 dark:hover:border-blue-600 transition-all space-y-2.5">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
                  <span className="font-black text-slate-900 dark:text-white text-sm">{d.day[language]}</span>
                  <span className="text-[11px] font-bold text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/60 px-2 py-0.5 rounded-md border border-blue-100 dark:border-blue-900/60">
                    {d.hrs} {language === 'en' ? 'hrs' : 'घंटे'}
                  </span>
                </div>
                <div className="space-y-1.5 text-xs text-slate-700 dark:text-slate-300">
                  <div className="flex items-start gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-600 dark:bg-blue-400 mt-1.5 shrink-0" />
                    <span className="font-medium">{d.p1}</span>
                  </div>
                  <div className="flex items-start gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 dark:bg-indigo-400 mt-1.5 shrink-0" />
                    <span className="font-medium">{d.p2}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* --- TAB 3: REVISION REMINDERS (Spaced Repetition) --- */}
      {activeTab === 'reminders' && (
        <div className="space-y-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200/90 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <Bell className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                <h3 className="font-bold text-slate-900 dark:text-white text-base">
                  {language === 'en' ? 'Spaced Repetition Revision Reminders' : 'अंतराल पुनरावृत्ति (रिवीजन अनुस्मारक)'}
                </h3>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {language === 'en'
                  ? 'Scientifically timed recall intervals (3, 7, 14 days) to prevent forgetting difficult CA provisions'
                  : 'कठिन अनुभागों और सूत्रों को स्थायी स्मृति में रखने के लिए 3, 7 और 14 दिनों के अंतराल अनुस्मारक'}
              </p>
            </div>

            <button
              onClick={() => setShowAddReminderModal(true)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-500 text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>{language === 'en' ? 'New Revision Alert' : 'नया अनुस्मारक जोड़ें'}</span>
            </button>
          </div>

          <div className="space-y-2.5">
            {reminders.map((r) => {
              const paper = PAPERS.find((p) => p.id === r.paperId);
              return (
                <div
                  key={r.id}
                  className={`p-4 rounded-xl border transition-all flex items-center justify-between gap-3 ${
                    r.completed
                      ? 'border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/30 dark:bg-emerald-950/20 opacity-75'
                      : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <button
                      onClick={() => handleToggleReminder(r.id)}
                      className="mt-0.5 text-slate-400 dark:text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 transition-colors cursor-pointer"
                    >
                      {r.completed ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 fill-emerald-100 dark:fill-emerald-950/60" />
                      ) : (
                        <Circle className="w-5 h-5" />
                      )}
                    </button>

                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-100 dark:border-blue-900/60">
                          {paper?.code || 'Paper'}
                        </span>
                        <h4 className={`text-sm font-bold ${r.completed ? 'line-through text-slate-400 dark:text-slate-500' : 'text-slate-900 dark:text-white'}`}>
                          {r.chapterTitle[language]}
                        </h4>
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-2">
                        <span>🗓️ {language === 'en' ? 'Due Date:' : 'नियत तिथि:'} <strong>{r.dueDate}</strong></span>
                        <span>•</span>
                        <span className="font-semibold text-blue-700 dark:text-blue-400">
                          {r.intervalDays} {language === 'en' ? 'Days Interval' : 'दिनों का अंतराल'}
                        </span>
                      </p>
                    </div>
                  </div>

                  <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full ${
                    r.completed
                      ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                      : 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800 animate-pulse'
                  }`}>
                    {r.completed ? (language === 'en' ? 'Revised ✓' : 'रिवीजन पूर्ण ✓') : (language === 'en' ? 'Action Due' : 'रिवीजन बाकी')}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* --- TAB 4: SYLLABUS COMPLETION TRACKER & PROGRESS REPORT --- */}
      {activeTab === 'tracker' && (
        <div className="space-y-4">
          {/* Progress Summary Card */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200/90 dark:border-slate-800 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white text-base flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  {language === 'en' ? 'CA Foundation Overall Syllabus Completion' : 'सीए फाउंडेशन समग्र पाठ्यक्रम पूर्णता'}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  {language === 'en'
                    ? 'Official ICAI New Scheme Syllabus Tracker. Mark chapters as you study.'
                    : 'आईसीएआई नवीन योजना पाठ्यक्रम ट्रैकर। अध्याय पूर्ण होने पर चिह्नित करें।'}
                </p>
              </div>

              <div className="text-right">
                <span className="text-2xl font-black text-blue-700 dark:text-blue-400">{stats.percent}%</span>
                <span className="text-xs text-slate-500 dark:text-slate-400 block">
                  {stats.mastered} / {stats.total} {language === 'en' ? 'Chapters Mastered' : 'अध्याय कंठस्थ'}
                </span>
              </div>
            </div>

            {/* Overall Progress Bar */}
            <div className="w-full h-3 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-500 dark:to-indigo-500 rounded-full transition-all duration-500"
                style={{ width: `${stats.percent}%` }}
              />
            </div>

            {/* Subject Selector Buttons */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              {PAPERS.map((p) => {
                const chs = SYLLABUS_CHAPTERS[p.id] || [];
                const done = chs.filter((c) => completedChapters[c.id] === 'mastered').length;
                const pPercent = chs.length > 0 ? Math.round((done / chs.length) * 100) : 0;

                return (
                  <button
                    key={p.id}
                    onClick={() => setTrackerPaper(p.id)}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                      trackerPaper === p.id 
                        ? 'border-blue-600 dark:border-blue-500 bg-blue-50/40 dark:bg-blue-950/40 ring-1 ring-blue-600 dark:ring-blue-500'
                        : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-black text-slate-800 dark:text-slate-200">{p.code}</span>
                      <span className="text-[10px] font-bold text-blue-700 dark:text-blue-400">{pPercent}%</span>
                    </div>
                    <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 truncate mt-1">
                      {p.name[language].split('(')[0]}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Detailed Chapter Checklist for Selected Paper */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200/90 dark:border-slate-800 shadow-xs space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h4 className="font-bold text-slate-900 dark:text-white text-sm">
                {PAPERS.find((p) => p.id === trackerPaper)?.code}: {PAPERS.find((p) => p.id === trackerPaper)?.name[language]}
              </h4>
              <span className="text-xs text-slate-500 dark:text-slate-400">
                {language === 'en' ? 'Tap chapter status to update' : 'स्थिति बदलने के लिए क्लिक करें'}
              </span>
            </div>

            <div className="space-y-2">
              {SYLLABUS_CHAPTERS[trackerPaper]?.map((ch, idx) => {
                const status = completedChapters[ch.id] || 'pending';
                return (
                  <div
                    key={ch.id}
                    onClick={() => toggleChapterStatus(ch.id)}
                    className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-blue-300 dark:hover:border-blue-700 bg-white dark:bg-slate-900 transition-all flex items-center justify-between gap-3 cursor-pointer group"
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-6 h-6 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold flex items-center justify-center shrink-0">
                        {idx + 1}
                      </span>
                      <div>
                        <span className="text-sm font-medium text-slate-900 dark:text-white group-hover:text-blue-700 dark:group-hover:text-blue-400 transition-colors">
                          {ch.name[language]}
                        </span>
                        <span className="text-[10px] text-slate-400 dark:text-slate-500 block">
                          Weightage: {ch.weightage}
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      className={`px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-wider shrink-0 transition-colors ${
                        status === 'mastered'
                          ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                          : status === 'revising'
                          ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                      }`}
                    >
                      {status === 'mastered'
                        ? (language === 'en' ? 'Mastered ✓' : 'कंठस्थ ✓')
                        : status === 'revising'
                        ? (language === 'en' ? 'Revising 🔄' : 'पुनरावलोकन 🔄')
                        : (language === 'en' ? 'Pending' : 'लंबित')}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* --- TAB 5: POMODORO FOCUS TIMER --- */}
      {activeTab === 'pomodoro' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 sm:p-8 border border-slate-200/90 dark:border-slate-800 shadow-sm text-center max-w-lg mx-auto">
          <div className="inline-flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl mb-6">
            <button
              onClick={() => switchPomodoroMode('focus')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                pomodoroMode === 'focus' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              {language === 'en' ? 'CA Focus (25m)' : 'सीए फोकस (25m)'}
            </button>
            <button
              onClick={() => switchPomodoroMode('shortBreak')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                pomodoroMode === 'shortBreak' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              {language === 'en' ? 'Short Break (5m)' : 'छोटा ब्रेक (5m)'}
            </button>
            <button
              onClick={() => switchPomodoroMode('longBreak')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                pomodoroMode === 'longBreak' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              {language === 'en' ? 'Long Break (15m)' : 'बड़ा ब्रेक (15m)'}
            </button>
          </div>

          {/* Clock Display */}
          <div className="relative w-48 h-48 mx-auto my-4 flex items-center justify-center rounded-full border-4 border-blue-100 dark:border-blue-900/60 bg-blue-50/40 dark:bg-blue-950/40">
            <div className="text-4xl sm:text-5xl font-black text-slate-900 dark:text-white font-mono tracking-tight">
              {formatTime(timeLeft)}
            </div>
          </div>

          <p className="text-xs text-slate-500 dark:text-slate-400 mb-6">
            {pomodoroMode === 'focus'
              ? (language === 'en' ? 'Deep focus: Solve MCQs or read notes with zero distractions.' : 'गहन अध्ययन: बिना किसी रुकावट के प्रश्न हल करें या नोट्स पढ़ें।')
              : (language === 'en' ? 'Rest your eyes, hydrate, and stretch.' : 'आंखों को आराम दें, पानी पिएं और खिंचाव करें।')}
          </p>

          {/* Controls */}
          <div className="flex items-center justify-center gap-3">
            <button
              onClick={() => {
                setIsRunning(!isRunning);
                playChimeSound('click');
              }}
              className={`px-6 py-2.5 rounded-xl text-white font-bold text-sm flex items-center gap-2 shadow-md transition-all active:scale-95 cursor-pointer ${
                isRunning ? 'bg-amber-600 hover:bg-amber-700' : 'bg-blue-600 hover:bg-blue-700'
              }`}
            >
              {isRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-white" />}
              <span>{isRunning ? (language === 'en' ? 'Pause' : 'रोकें') : (language === 'en' ? 'Start Focus' : 'शुरू करें')}</span>
            </button>

            <button
              onClick={() => switchPomodoroMode(pomodoroMode)}
              className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
              title={language === 'en' ? 'Reset' : 'रीसेट'}
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400">
            💡 {language === 'en' ? 'Completing 1 focus block logs 25 minutes directly into your daily study tracker!' : '1 फोकस सत्र पूरा करने पर आपके दैनिक अध्ययन ट्रैकर में 25 मिनट स्वतः जुड़ जाते हैं!'}
          </div>
        </div>
      )}

      {/* --- TAB 6: TIMETABLES & TEMPLATES --- */}
      {activeTab === 'templates' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {STUDY_PLAN_TEMPLATES.map((tpl) => (
            <div
              key={tpl.id}
              className="bg-white dark:bg-slate-900 rounded-xl p-5 border border-slate-200 dark:border-slate-800 shadow-xs hover:border-blue-400 dark:hover:border-blue-600 hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 text-xs font-bold border border-blue-200 dark:border-blue-800">
                    {tpl.durationDays} {language === 'en' ? 'Days Plan' : 'दिनों का प्लान'}
                  </span>
                  <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                    {tpl.hoursPerDay} {language === 'en' ? 'hrs/day' : 'घंटे/दिन'}
                  </span>
                </div>

                <h3 className="font-bold text-slate-900 dark:text-white text-base mb-2">
                  {tpl.name[language]}
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-400 mb-4 leading-relaxed">
                  {tpl.description[language]}
                </p>

                <div className="space-y-2 mb-4">
                  <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    {language === 'en' ? 'Phase-Wise Strategy:' : 'चरणबद्ध रणनीति:'}
                  </h4>
                  {tpl.strategy[language].map((step, idx) => (
                    <div key={idx} className="flex items-start gap-2 text-xs text-slate-700 dark:text-slate-300">
                      <div className="w-1.5 h-1.5 rounded-full bg-blue-600 dark:bg-blue-400 mt-1.5 shrink-0" />
                      <span>{step}</span>
                    </div>
                  ))}
                </div>
              </div>

              <button
                onClick={() => {
                  playChimeSound('success');
                  setActiveTab('daily');
                }}
                className="w-full py-2 px-3 rounded-lg bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 dark:hover:bg-blue-900/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 text-xs font-bold transition-colors cursor-pointer"
              >
                {language === 'en' ? 'Adopt This Timetable' : 'यह टाइमटेबल अपनाएं'}
              </button>
            </div>
          ))}
        </div>
      )}

      {/* --- ADD TASK MODAL --- */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 relative animate-in fade-in zoom-in-95 duration-200">
            <button
              onClick={() => setShowAddModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">
              {language === 'en' ? 'Add Study Target' : 'नया अध्ययन लक्ष्य जोड़ें'}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
              {language === 'en' ? 'Define what you will study or solve today' : 'तय करें कि आप आज क्या पढ़ेंगे या हल करेंगे'}
            </p>

            <form onSubmit={handleAddTask} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {language === 'en' ? 'Task Title (English)' : 'कार्य शीर्षक (अंग्रेजी)'}
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Revise Indian Contract Act Section 10"
                  value={newTitleEn}
                  onChange={(e) => setNewTitleEn(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {language === 'en' ? 'Task Title (Hindi - Optional)' : 'कार्य शीर्षक (हिंदी)'}
                </label>
                <input
                  type="text"
                  placeholder="उदा. अनुबंध अधिनियम धारा 10 दोहराएं"
                  value={newTitleHi}
                  onChange={(e) => setNewTitleHi(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {language === 'en' ? 'Subject Paper' : 'विषय'}
                  </label>
                  <select
                    value={newPaper}
                    onChange={(e) => setNewPaper(e.target.value as PaperId)}
                    className="w-full px-2.5 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-medium focus:outline-blue-500"
                  >
                    {PAPERS.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.code}: {p.name[language]}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {language === 'en' ? 'Duration (mins)' : 'अवधि (मिनट)'}
                  </label>
                  <input
                    type="number"
                    min="10"
                    max="180"
                    value={newDuration}
                    onChange={(e) => setNewDuration(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-medium focus:outline-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {language === 'en' ? 'Chapter / Topic' : 'अध्याय / विषय'}
                </label>
                <input
                  type="text"
                  placeholder="e.g. Free Consent & Consideration"
                  value={newChapter}
                  onChange={(e) => setNewChapter(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {language === 'en' ? 'Priority' : 'प्राथमिकता'}
                </label>
                <div className="flex gap-2">
                  {(['low', 'medium', 'high'] as const).map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setNewPriority(p)}
                      className={`flex-1 py-1.5 rounded-lg text-xs font-bold capitalize border cursor-pointer ${
                        newPriority === p
                          ? 'bg-blue-50 dark:bg-blue-950/60 border-blue-600 dark:border-blue-500 text-blue-700 dark:text-blue-300'
                          : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
                >
                  {language === 'en' ? 'Cancel' : 'रद्द करें'}
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs cursor-pointer"
                >
                  {language === 'en' ? 'Save Target' : 'लक्ष्य सहेजें'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- ADD REVISION REMINDER MODAL --- */}
      {showAddReminderModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 relative animate-in fade-in zoom-in-95 duration-200">
            <button
              onClick={() => setShowAddReminderModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">
              {language === 'en' ? 'Add Spaced Revision Reminder' : 'नया रिवीजन अनुस्मारक जोड़ें'}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
              {language === 'en' ? 'Set timed intervals to revisit crucial CA chapters' : 'महत्वपूर्ण अध्यायों के लिए स्वचालित रिवीजन अलार्म सेट करें'}
            </p>

            <form onSubmit={handleAddReminder} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {language === 'en' ? 'Subject Paper' : 'विषय'}
                </label>
                <select
                  value={newReminderPaper}
                  onChange={(e) => setNewReminderPaper(e.target.value as PaperId)}
                  className="w-full px-2.5 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-medium focus:outline-blue-500"
                >
                  {PAPERS.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.code}: {p.name[language]}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {language === 'en' ? 'Chapter / Topic (English)' : 'अध्याय / विषय (अंग्रेजी)'}
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Partnership - Admission & Retirement"
                  value={newReminderChapterEn}
                  onChange={(e) => setNewReminderChapterEn(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {language === 'en' ? 'Chapter / Topic (Hindi - Optional)' : 'अध्याय / विषय (हिंदी)'}
                </label>
                <input
                  type="text"
                  placeholder="उदा. साझेदारी - प्रवेश एवं अवकाश ग्रहण"
                  value={newReminderChapterHi}
                  onChange={(e) => setNewReminderChapterHi(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {language === 'en' ? 'Spaced Repetition Interval' : 'पुनरावृत्ति अंतराल'}
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { days: 3, label: '3 Days (Fast)' },
                    { days: 7, label: '7 Days (Standard)' },
                    { days: 14, label: '14 Days (Deep)' },
                  ].map((inv) => (
                    <button
                      key={inv.days}
                      type="button"
                      onClick={() => setNewReminderInterval(inv.days)}
                      className={`py-2 px-1 rounded-lg text-xs font-bold border text-center cursor-pointer ${
                        newReminderInterval === inv.days
                          ? 'bg-blue-50 dark:bg-blue-950/60 border-blue-600 dark:border-blue-500 text-blue-700 dark:text-blue-300'
                          : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                      }`}
                    >
                      {inv.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddReminderModal(false)}
                  className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
                >
                  {language === 'en' ? 'Cancel' : 'रद्द करें'}
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs cursor-pointer"
                >
                  {language === 'en' ? 'Create Alert' : 'अलार्म बनाएं'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Schedule Task Reminder Modal */}
      {taskForReminder && (
        <ScheduleTaskReminderModal
          language={language}
          task={taskForReminder}
          onClose={() => setTaskForReminder(null)}
          onScheduled={(taskTitle, minutes) => {
            setTaskReminderSuccess(
              language === 'hi'
                ? `रिमाइंडर सेट: "${taskTitle}" के लिए ${minutes} मिनट में अलर्ट प्राप्त होगा!`
                : `Reminder set: Alert scheduled in ${minutes} minutes for "${taskTitle}"!`
            );
            setTimeout(() => setTaskReminderSuccess(null), 6000);
          }}
        />
      )}
    </div>
  );
};
