import React, { useState, useEffect, useMemo } from 'react';
import { ExamAttemptId, Language, StudyTask, PaperId, RevisionReminder, UserProfile, MCQQuestion } from '../types';
import { PAPERS } from '../data/papersData';
import { STUDY_PLAN_TEMPLATES } from '../data/mockPlanner';
import { CANONICAL_SYLLABUS, getCanonicalChaptersByPaper } from '../data/syllabusData';
import { auditSyllabusCompleteness } from '../utils/syllabusCompleteness';
import { getAttemptMetadata } from '../utils/examAttempt';
import { playChimeSound } from '../utils/audio';
import {
  getAllQuestions,
  getRevisionReminders,
  addRevisionReminder,
  toggleReminderCompleted,
} from '../utils/storageDb';
import {
  saveStudyTaskToDb,
  saveRevisionReminderToDb,
  subscribeToUserRevisionReminders,
  saveChapterProgressToDb,
  subscribeToUserChapterProgress,
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
  X,
  Bell,
  CheckSquare,
  BarChart3,
  ChevronDown,
  ChevronUp,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';
import { DailyReminderCard } from './DailyReminderCard';
import { ScheduleTaskReminderModal } from './ScheduleTaskReminderModal';

interface StudyPlannerViewProps {
  language: Language;
  selectedAttempt?: ExamAttemptId;
  tasks: StudyTask[];
  setTasks: React.Dispatch<React.SetStateAction<StudyTask[]>>;
  onStudySessionComplete: (minutes: number) => void;
  currentUser?: UserProfile;
  streak?: number;
  chapterProgress?: Record<string, 'pending' | 'revising' | 'mastered'>;
  onUpdateChapterProgress?: (chapterId: string, status: 'pending' | 'revising' | 'mastered') => void;
  allQuestions?: MCQQuestion[];
  onStartChapterPractice?: (paperId: PaperId) => void;
}

export const StudyPlannerView: React.FC<StudyPlannerViewProps> = ({
  language,
  selectedAttempt = 'January 2027',
  tasks,
  setTasks,
  onStudySessionComplete,
  currentUser,
  streak = 0,
  chapterProgress: externalProgress,
  onUpdateChapterProgress,
  allQuestions,
  onStartChapterPractice,
}) => {
  const attemptMeta = getAttemptMetadata(selectedAttempt);
  const [activeTab, setActiveTab] = useState<'daily' | 'weekly' | 'reminders' | 'tracker' | 'pomodoro' | 'templates'>('daily');
  const [filterPaper, setFilterPaper] = useState<string>('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [taskForReminder, setTaskForReminder] = useState<StudyTask | null>(null);
  const [taskReminderSuccess, setTaskReminderSuccess] = useState<string | null>(null);

  const [newTitleEn, setNewTitleEn] = useState('');
  const [newTitleHi, setNewTitleHi] = useState('');
  const [newPaper, setNewPaper] = useState<PaperId>('paper1');
  const [newChapter, setNewChapter] = useState('');
  const [newDuration, setNewDuration] = useState(45);
  const [newPriority, setNewPriority] = useState<'high' | 'medium' | 'low'>('medium');

  const [reminders, setReminders] = useState<RevisionReminder[]>(() => getRevisionReminders());
  const [showAddReminderModal, setShowAddReminderModal] = useState(false);
  const [newReminderPaper, setNewReminderPaper] = useState<PaperId>('paper3');
  const [newReminderChapterEn, setNewReminderChapterEn] = useState('');
  const [newReminderChapterHi, setNewReminderChapterHi] = useState('');
  const [newReminderInterval, setNewReminderInterval] = useState<number>(3);

  const [localProgress, setLocalProgress] = useState<Record<string, 'pending' | 'revising' | 'mastered'>>(() => {
    try {
      const saved = localStorage.getItem('ca_saathi_chapter_tracker');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  const effectiveChapters = externalProgress || localProgress;
  const [trackerPaper, setTrackerPaper] = useState<PaperId>('paper1');
  const [expandedChapterIds, setExpandedChapterIds] = useState<Record<string, boolean>>({});

  const [pomodoroMode, setPomodoroMode] = useState<'focus' | 'shortBreak' | 'longBreak'>('focus');
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isRunning, setIsRunning] = useState(false);

  const questionPool = useMemo(() => (allQuestions && allQuestions.length > 0 ? allQuestions : getAllQuestions()), [allQuestions]);

  const syllabusAudit = useMemo(
    () => auditSyllabusCompleteness(CANONICAL_SYLLABUS, questionPool, effectiveChapters),
    [questionPool, effectiveChapters]
  );

  useEffect(() => {
    try {
      localStorage.setItem('ca_saathi_chapter_tracker', JSON.stringify(effectiveChapters));
    } catch {
      // ignore storage restriction
    }
  }, [effectiveChapters]);

  useEffect(() => {
    if (!currentUser?.id || currentUser.id === 'guest') return;
    const unsubReminders = subscribeToUserRevisionReminders(currentUser.id, (rems) => {
      if (rems.length > 0) setReminders(rems);
    });
    const unsubProgress = subscribeToUserChapterProgress(currentUser.id, (progressMap) => {
      if (Object.keys(progressMap).length > 0) {
        setLocalProgress((prev) => ({ ...prev, ...progressMap }));
      }
    });
    return () => {
      unsubReminders();
      unsubProgress();
    };
  }, [currentUser?.id]);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;
    if (isRunning && timeLeft > 0) {
      interval = setInterval(() => setTimeLeft((prev) => prev - 1), 1000);
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
      title: { en: newTitleEn, hi: newTitleHi.trim() || newTitleEn },
      paperId: newPaper,
      chapter: { en: newChapter || 'General Revision', hi: newChapter || 'सामान्य रिवीजन' },
      durationMinutes: newDuration,
      completed: false,
      date: new Date().toISOString().split('T')[0],
      priority: newPriority,
    };
    setTasks((prev) => [newTask, ...prev]);
    if (currentUser?.id && currentUser.id !== 'guest') {
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
    const created = addRevisionReminder({
      paperId: newReminderPaper,
      chapterTitle: { en: newReminderChapterEn.trim(), hi: newReminderChapterHi.trim() || newReminderChapterEn.trim() },
      intervalDays: newReminderInterval,
      dueDate: targetDate.toISOString().split('T')[0],
    });
    setReminders((prev) => [created, ...prev]);
    if (currentUser?.id && currentUser.id !== 'guest') {
      saveRevisionReminderToDb(currentUser.id, created).catch(console.error);
    }
    setShowAddReminderModal(false);
    setNewReminderChapterEn('');
    setNewReminderChapterHi('');
    playChimeSound('success');
  };

  const toggleChapterStatus = (chId: string) => {
    playChimeSound('click');
    const current = effectiveChapters[chId] || 'pending';
    const next = current === 'pending' ? 'revising' : current === 'revising' ? 'mastered' : 'pending';
    if (onUpdateChapterProgress) {
      onUpdateChapterProgress(chId, next);
    } else {
      setLocalProgress((prev) => ({ ...prev, [chId]: next }));
      if (currentUser?.id && currentUser.id !== 'guest') {
        saveChapterProgressToDb(currentUser.id, chId, next).catch(console.error);
      }
    }
  };

  const trackerStats = () => {
    const total = CANONICAL_SYLLABUS.length;
    let mastered = 0;
    let revising = 0;
    CANONICAL_SYLLABUS.forEach((c) => {
      const s = effectiveChapters[c.id];
      if (s === 'mastered') mastered++;
      else if (s === 'revising') revising++;
    });
    const percent = Math.round((mastered / total) * 100);
    return { total, mastered, revising, percent };
  };

  const filteredTasks = tasks.filter((t) => filterPaper === 'all' || t.paperId === filterPaper);
  const completedCount = tasks.filter((t) => t.completed).length;
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const stats = trackerStats();
  const activePaperChapters = useMemo(() => getCanonicalChaptersByPaper(trackerPaper), [trackerPaper]);

  return (
    <div className="space-y-6 pb-20 lg:pb-8">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-[#0F1E46] dark:text-white flex items-center gap-2 tracking-tight">
            <Calendar className="w-6 h-6 text-violet-700 dark:text-violet-400" />
            {language === 'en'
              ? `CA Foundation Study Planner (${attemptMeta.shortLabel.en})`
              : `सीए फाउंडेशन अध्ययन प्लानर (${attemptMeta.shortLabel.hi})`}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            {language === 'en'
              ? 'Daily targets, weekly schedules, spaced revision alerts, and complete 46-chapter ICAI syllabus tracker'
              : 'दैनिक लक्ष्य, साप्ताहिक योजना, रिवीजन अनुस्मारक एवं संपूर्ण 46-अध्याय पाठ्यक्रम ट्रैकर'}
          </p>
        </div>

        <div className="flex items-center p-1 bg-slate-100 dark:bg-[#0F1936] rounded-xl overflow-x-auto max-w-full border border-slate-200 dark:border-[#213059]">
          {[
            { id: 'daily', labelEn: 'Daily Targets', labelHi: 'दैनिक लक्ष्य' },
            { id: 'weekly', labelEn: 'Weekly Plan', labelHi: 'साप्ताहिक' },
            { id: 'reminders', labelEn: 'Reminders', labelHi: 'अनुस्मारक' },
            { id: 'tracker', labelEn: '46-Chapter Syllabus', labelHi: '46-अध्याय पाठ्यक्रम' },
            { id: 'pomodoro', labelEn: 'Focus Timer', labelHi: 'फोकस टाइमर' },
            { id: 'templates', labelEn: 'Timetables', labelHi: 'टाइमटेबल' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                activeTab === tab.id
                  ? 'bg-[#172554] text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-[#0F1E46] dark:hover:text-white'
              }`}
            >
              {language === 'en' ? tab.labelEn : tab.labelHi}
            </button>
          ))}
        </div>
      </div>

      {/* TAB 1: DAILY TARGETS */}
      {activeTab === 'daily' && (
        <div className="space-y-4">
          <DailyReminderCard language={language} streak={streak} tasks={tasks} />

          {taskReminderSuccess && (
            <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-xs font-semibold flex items-center justify-between">
              <span className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{taskReminderSuccess}</span>
              </span>
              <button onClick={() => setTaskReminderSuccess(null)} className="font-bold px-1.5 py-0.5 cursor-pointer">
                ✕
              </button>
            </div>
          )}

          <div className="bg-white dark:bg-slate-900 rounded-xl p-4 border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-100 dark:border-blue-900/60 flex items-center justify-center font-bold tabular-nums">
                {completedCount}/{tasks.length}
              </div>
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white text-sm">
                  {language === 'en' ? 'Daily Targets Completed' : 'दैनिक लक्ष्य पूर्ण'}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {completedCount === tasks.length && tasks.length > 0
                    ? language === 'en'
                      ? 'All targets complete!'
                      : 'सभी कार्य पूरे!'
                    : `${tasks.length - completedCount} ${language === 'en' ? 'remaining today' : 'कार्य शेष'}`}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <select
                value={filterPaper}
                onChange={(e) => setFilterPaper(e.target.value)}
                className="text-xs font-medium px-2.5 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200"
              >
                <option value="all">{language === 'en' ? 'All Papers' : 'सभी विषय'}</option>
                {PAPERS.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.code}: {p.name[language]}
                  </option>
                ))}
              </select>

              <button
                onClick={() => setShowAddModal(true)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-violet-700 hover:bg-violet-800 text-white text-xs font-bold shadow-xs cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>{language === 'en' ? 'Add Target' : 'लक्ष्य जोड़ें'}</span>
              </button>
            </div>
          </div>

          <div className="space-y-2.5">
            {filteredTasks.length === 0 ? (
              <div className="bg-white dark:bg-slate-900 rounded-xl p-8 text-center border border-dashed border-slate-300 dark:border-slate-700">
                <CheckCircle2 className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
                <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                  {language === 'en' ? 'No study tasks match this filter.' : 'कोई अध्ययन लक्ष्य नहीं मिला।'}
                </p>
                <button
                  onClick={() => setShowAddModal(true)}
                  className="mt-3 text-xs font-bold text-blue-600 hover:underline cursor-pointer"
                >
                  {language === 'en' ? '+ Add Study Target' : '+ अध्ययन लक्ष्य जोड़ें'}
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
                        : 'border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs'
                    }`}
                  >
                    <div className="flex items-start gap-3 flex-1">
                      <button onClick={() => toggleTaskCompleted(task.id)} className="mt-0.5 cursor-pointer">
                        {task.completed ? (
                          <CheckCircle2 className="w-5 h-5 text-emerald-600 fill-emerald-100" />
                        ) : (
                          <Circle className="w-5 h-5 text-slate-400 hover:text-blue-600" />
                        )}
                      </button>

                      <div className="space-y-1">
                        <p
                          className={`text-sm font-medium ${
                            task.completed ? 'line-through text-slate-400' : 'text-slate-900 dark:text-white'
                          }`}
                        >
                          {task.title[language]}
                        </p>
                        <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400">
                          <span className="px-1.5 py-0.5 rounded bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 font-semibold">
                            {paper?.code || 'Paper'}
                          </span>
                          <span>{task.chapter[language]}</span>
                          <span className="flex items-center gap-1 tabular-nums">
                            <Clock className="w-3 h-3" />
                            {task.durationMinutes} min
                          </span>
                          {task.priority === 'high' && (
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-red-50 dark:bg-red-950/50 text-red-600 dark:text-red-300">
                              HIGH PRIORITY
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => setTaskForReminder(task)}
                        className="p-1.5 text-slate-400 hover:text-blue-600 rounded-lg cursor-pointer"
                        title="Set Reminder"
                      >
                        <Bell className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => deleteTask(task.id)}
                        className="p-1.5 text-slate-400 hover:text-red-500 rounded-lg cursor-pointer"
                        title="Delete"
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

      {/* TAB 2: WEEKLY PLANNER */}
      {activeTab === 'weekly' && (
        <div className="space-y-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200/90 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
            <div>
              <h3 className="font-bold text-[#0F1E46] dark:text-white text-base">
                {language === 'en'
                  ? `Weekly CA Foundation ${attemptMeta.shortLabel.en} Schedule`
                  : `साप्ताहिक सीए फाउंडेशन ${attemptMeta.shortLabel.hi} अध्ययन सारणी`}
              </h3>
              <p className="text-xs text-slate-500">
                {language === 'en'
                  ? 'Recommended 2-paper daily rotation balancing numericals & law/theory'
                  : 'प्रतिदिन 2 विषयों का संतुलित अध्ययन चक्र'}
              </p>
            </div>
            <span className="px-3 py-1 rounded-lg bg-violet-50 dark:bg-violet-950/60 text-violet-700 dark:text-violet-300 text-xs font-bold border border-violet-200 dark:border-violet-800">
              Target: 28–35 hrs/week
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {[
              { day: { en: 'Monday', hi: 'सोमवार' }, p1: 'Paper 1: Accounting (Partnership & BRS)', p2: 'Paper 2: Indian Contract Act', hrs: 4.5 },
              { day: { en: 'Tuesday', hi: 'मंगलवार' }, p1: 'Paper 3: Maths (TVM & Sequence)', p2: 'Paper 4: Demand & Supply Theory', hrs: 5 },
              { day: { en: 'Wednesday', hi: 'बुधवार' }, p1: 'Paper 1: Inventories & Depreciation', p2: 'Paper 2: Sale of Goods Act', hrs: 4.5 },
              { day: { en: 'Thursday', hi: 'गुरुवार' }, p1: 'Paper 3: Logical Reasoning & Stats', p2: 'Paper 4: Market Structures', hrs: 5 },
              { day: { en: 'Friday', hi: 'शुक्रवार' }, p1: 'Paper 1: Company Accounts', p2: 'Paper 2: Companies Act 2013', hrs: 5 },
              { day: { en: 'Saturday', hi: 'शनिवार' }, p1: 'Paper 3: Probability & Index Numbers', p2: 'Paper 4: National Income & RBI Policy', hrs: 5 },
              { day: { en: 'Sunday', hi: 'रविवार' }, p1: `Full Mock Test (${attemptMeta.shortLabel.en} Pattern)`, p2: 'Weekly Error Notebook Revision', hrs: 4 },
            ].map((d, idx) => (
              <div
                key={idx}
                className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2.5"
              >
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
                  <span className="font-black text-slate-900 dark:text-white text-sm">{d.day[language]}</span>
                  <span className="text-[11px] font-bold text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/60 px-2 py-0.5 rounded-md tabular-nums">
                    {d.hrs} hrs
                  </span>
                </div>
                <div className="space-y-1.5 text-xs text-slate-700 dark:text-slate-300">
                  <p>• {d.p1}</p>
                  <p>• {d.p2}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: SPACED REVISION REMINDERS */}
      {activeTab === 'reminders' && (
        <div className="space-y-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200/90 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-base flex items-center gap-2">
                <Bell className="w-5 h-5 text-blue-600" />
                {language === 'en' ? 'Spaced Repetition Revision Reminders' : 'अंतराल पुनरावृत्ति अनुस्मारक'}
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                {language === 'en'
                  ? 'Timed 3, 7, and 14-day recall reminders for high-weightage chapters'
                  : 'महत्वपूर्ण अध्यायों के लिए 3, 7 और 14 दिनों के अनुस्मारक'}
              </p>
            </div>

            <button
              onClick={() => setShowAddReminderModal(true)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>{language === 'en' ? 'New Revision Alert' : 'नया अनुस्मारक'}</span>
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
                      ? 'border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/30 opacity-75'
                      : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <button onClick={() => handleToggleReminder(r.id)} className="mt-0.5 cursor-pointer">
                      {r.completed ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-600 fill-emerald-100" />
                      ) : (
                        <Circle className="w-5 h-5 text-slate-400" />
                      )}
                    </button>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300">
                          {paper?.code || 'Paper'}
                        </span>
                        <h4 className={`text-sm font-bold ${r.completed ? 'line-through text-slate-400' : 'text-slate-900 dark:text-white'}`}>
                          {r.chapterTitle[language]}
                        </h4>
                      </div>
                      <p className="text-xs text-slate-500 mt-1 tabular-nums">
                        Due: <strong>{r.dueDate}</strong> • {r.intervalDays} Days Interval
                      </p>
                    </div>
                  </div>

                  <span
                    className={`text-[11px] font-bold px-2.5 py-1 rounded-lg border ${
                      r.completed
                        ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                        : 'bg-amber-100 text-amber-800 border-amber-200'
                    }`}
                  >
                    {r.completed ? 'Revised ✓' : 'Action Due'}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 4: COMPLETE 46-CHAPTER SYLLABUS TRACKER */}
      {activeTab === 'tracker' && (
        <div className="space-y-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200/90 dark:border-slate-800 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="font-bold text-[#0F1E46] dark:text-white text-base flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-violet-700 dark:text-violet-400" />
                  {language === 'en'
                    ? `ICAI ${attemptMeta.fullLabel.en} Complete 46-Chapter Syllabus Tracker`
                    : `आईसीएआई ${attemptMeta.fullLabel.hi} संपूर्ण 46-अध्याय पाठ्यक्रम ट्रैकर`}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  <span>
                    Syllabus Completeness Check: <strong>{syllabusAudit.coveredChapters}/{syllabusAudit.totalChapters}</strong>{' '}
                    official chapters verified with Topics & Practice MCQs ({syllabusAudit.overallCompletenessPercent}%)
                  </span>
                </p>
              </div>

              <div className="text-right tabular-nums">
                <span className="text-2xl font-black text-violet-700 dark:text-violet-400">{stats.percent}%</span>
                <span className="text-xs text-slate-500 block">
                  {stats.mastered} / {stats.total} Mastered • {stats.revising} Revising
                </span>
              </div>
            </div>

            <div className="w-full h-3 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-[#172554] to-violet-600 rounded-full transition-all duration-500"
                style={{ width: `${stats.percent}%` }}
              />
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              {PAPERS.map((p) => {
                const chs = getCanonicalChaptersByPaper(p.id);
                const done = chs.filter((c) => effectiveChapters[c.id] === 'mastered').length;
                const pPercent = chs.length > 0 ? Math.round((done / chs.length) * 100) : 0;
                const auditSummary = syllabusAudit.byPaper[p.id];

                return (
                  <button
                    key={p.id}
                    onClick={() => setTrackerPaper(p.id)}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                      trackerPaper === p.id
                        ? 'border-blue-600 bg-blue-50/40 dark:bg-blue-950/40 ring-1 ring-blue-600'
                        : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-black text-slate-800 dark:text-slate-200">{p.code}</span>
                      <span className="text-[10px] font-bold text-blue-700 dark:text-blue-400 tabular-nums">{pPercent}%</span>
                    </div>
                    <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 truncate mt-1">
                      {p.name[language].split('(')[0]}
                    </p>
                    <span className="text-[10px] text-slate-500 tabular-nums block mt-0.5">
                      {chs.length} Ch • {auditSummary.totalQuestions} MCQs ({auditSummary.totalPyqs} PYQs)
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200/90 dark:border-slate-800 shadow-xs space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h4 className="font-bold text-slate-900 dark:text-white text-sm">
                {PAPERS.find((p) => p.id === trackerPaper)?.code}:{' '}
                {PAPERS.find((p) => p.id === trackerPaper)?.name[language]} ({activePaperChapters.length} Chapters)
              </h4>
              <span className="text-xs text-slate-500">
                {language === 'en' ? 'Click status badge to update mastery' : 'स्थिति बदलने के लिए क्लिक करें'}
              </span>
            </div>

            <div className="space-y-2.5">
              {activePaperChapters.map((ch) => {
                const status = effectiveChapters[ch.id] || 'pending';
                const auditCh = syllabusAudit.chapters.find((c) => c.chapterId === ch.id);
                const isExpanded = Boolean(expandedChapterIds[ch.id]);

                return (
                  <div
                    key={ch.id}
                    className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-2"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                      <div className="flex items-start gap-3">
                        <span className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold flex items-center justify-center shrink-0 tabular-nums">
                          {ch.chapterNumber}
                        </span>
                        <div>
                          <div className="text-sm font-bold text-slate-900 dark:text-white">
                            {ch.title[language]}
                          </div>
                          <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-500 mt-0.5">
                            <span>{ch.weightageMarks}</span>
                            <span>•</span>
                            <span className="tabular-nums">{auditCh?.mcqCount || 0} MCQs ({auditCh?.pyqCount || 0} PYQs)</span>
                            <span>•</span>
                            <span className="tabular-nums">{ch.topics.length} Topics</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                        <button
                          type="button"
                          onClick={() =>
                            setExpandedChapterIds((prev) => ({ ...prev, [ch.id]: !prev[ch.id] }))
                          }
                          className="px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 text-[11px] font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-1 cursor-pointer"
                        >
                          <span>{isExpanded ? 'Hide Topics' : 'Topics'}</span>
                          {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                        </button>

                        {onStartChapterPractice && (
                          <button
                            type="button"
                            onClick={() => onStartChapterPractice(ch.paperId)}
                            className="px-2.5 py-1 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 text-[11px] font-bold hover:bg-blue-100 flex items-center gap-1 cursor-pointer"
                          >
                            <span>Practice</span>
                            <ArrowRight className="w-3 h-3" />
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => toggleChapterStatus(ch.id)}
                          className={`px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-wider cursor-pointer transition-colors ${
                            status === 'mastered'
                              ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200'
                              : status === 'revising'
                                ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-200'
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                          }`}
                        >
                          {status === 'mastered' ? 'Mastered ✓' : status === 'revising' ? 'Revising' : 'Pending'}
                        </button>
                      </div>
                    </div>

                    {isExpanded && (
                      <div className="pt-2 border-t border-slate-100 dark:border-slate-800 grid grid-cols-1 md:grid-cols-2 gap-2">
                        {ch.topics.map((topic) => (
                          <div
                            key={topic.id}
                            className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 text-xs"
                          >
                            <p className="font-bold text-slate-800 dark:text-slate-200">{topic.title[language]}</p>
                            <ul className="mt-1 space-y-0.5 text-[11px] text-slate-600 dark:text-slate-400 list-disc pl-4">
                              {topic.subtopics.map((sub, idx) => (
                                <li key={idx}>{sub[language]}</li>
                              ))}
                            </ul>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: FOCUS TIMER */}
      {activeTab === 'pomodoro' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 sm:p-8 border border-slate-200/90 dark:border-slate-800 shadow-sm text-center max-w-lg mx-auto">
          <div className="inline-flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl mb-6">
            {[
              { id: 'focus', label: 'CA Focus (25m)' },
              { id: 'shortBreak', label: 'Short Break (5m)' },
              { id: 'longBreak', label: 'Long Break (15m)' },
            ].map((m) => (
              <button
                key={m.id}
                onClick={() => switchPomodoroMode(m.id as typeof pomodoroMode)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer ${
                  pomodoroMode === m.id ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>

          <div className="relative w-48 h-48 mx-auto my-4 flex items-center justify-center rounded-full border-4 border-blue-100 dark:border-blue-900/60 bg-blue-50/40 dark:bg-blue-950/40">
            <div className="text-4xl sm:text-5xl font-black text-slate-900 dark:text-white font-mono tabular-nums">
              {formatTime(timeLeft)}
            </div>
          </div>

          <div className="flex items-center justify-center gap-3 mt-6">
            <button
              onClick={() => {
                setIsRunning(!isRunning);
                playChimeSound('click');
              }}
              className={`px-6 py-2.5 rounded-xl text-white font-bold text-sm flex items-center gap-2 shadow-md cursor-pointer ${
                isRunning ? 'bg-amber-600 hover:bg-amber-700' : 'bg-blue-600 hover:bg-blue-700'
              }`}
            >
              {isRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-white" />}
              <span>{isRunning ? 'Pause' : 'Start Focus'}</span>
            </button>

            <button
              onClick={() => switchPomodoroMode(pomodoroMode)}
              className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 text-slate-600 cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* TAB 6: TIMETABLES */}
      {activeTab === 'templates' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {STUDY_PLAN_TEMPLATES.map((tpl) => (
            <div
              key={tpl.id}
              className="bg-white dark:bg-slate-900 rounded-xl p-5 border border-slate-200 dark:border-slate-800 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="px-2 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 text-xs font-bold">
                    {tpl.durationDays} Days Plan
                  </span>
                  <span className="text-xs font-semibold text-slate-600">{tpl.hoursPerDay} hrs/day</span>
                </div>
                <h3 className="font-bold text-slate-900 dark:text-white text-base mb-2">{tpl.name[language]}</h3>
                <p className="text-xs text-slate-600 dark:text-slate-400 mb-4 leading-relaxed">
                  {tpl.description[language]}
                </p>
                <div className="space-y-1.5 mb-4">
                  {tpl.strategy[language].map((step, idx) => (
                    <p key={idx} className="text-xs text-slate-700 dark:text-slate-300">
                      • {step}
                    </p>
                  ))}
                </div>
              </div>

              <button
                onClick={() => {
                  playChimeSound('success');
                  setActiveTab('daily');
                }}
                className="w-full py-2 px-3 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 text-xs font-bold cursor-pointer"
              >
                {language === 'en' ? 'Adopt This Timetable' : 'यह टाइमटेबल अपनाएं'}
              </button>
            </div>
          ))}
        </div>
      )}

      {/* ADD TASK MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 relative">
            <button
              onClick={() => setShowAddModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">
              {language === 'en' ? 'Add Study Target' : 'नया अध्ययन लक्ष्य जोड़ें'}
            </h3>
            <form onSubmit={handleAddTask} className="space-y-3.5 text-xs">
              <input
                type="text"
                required
                placeholder="Task title (e.g. Revise Contract Act Sec 10)"
                value={newTitleEn}
                onChange={(e) => setNewTitleEn(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
              />
              <div className="grid grid-cols-2 gap-3">
                <select
                  value={newPaper}
                  onChange={(e) => setNewPaper(e.target.value as PaperId)}
                  className="px-2.5 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                >
                  {PAPERS.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.code}: {p.name[language]}
                    </option>
                  ))}
                </select>
                <input
                  type="number"
                  min={10}
                  max={180}
                  value={newDuration}
                  onChange={(e) => setNewDuration(Number(e.target.value))}
                  className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                />
              </div>
              <input
                type="text"
                placeholder="Chapter or topic"
                value={newChapter}
                onChange={(e) => setNewChapter(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
              />
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 cursor-pointer"
                >
                  Cancel
                </button>
                <button type="submit" className="px-4 py-2 rounded-lg bg-blue-600 text-white font-bold cursor-pointer">
                  Save Target
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ADD REMINDER MODAL */}
      {showAddReminderModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 relative">
            <button
              onClick={() => setShowAddReminderModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Add Spaced Revision Reminder</h3>
            <form onSubmit={handleAddReminder} className="space-y-3.5 text-xs">
              <select
                value={newReminderPaper}
                onChange={(e) => setNewReminderPaper(e.target.value as PaperId)}
                className="w-full px-2.5 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
              >
                {PAPERS.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.code}: {p.name[language]}
                  </option>
                ))}
              </select>
              <input
                type="text"
                required
                placeholder="Chapter / Topic"
                value={newReminderChapterEn}
                onChange={(e) => setNewReminderChapterEn(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
              />
              <div className="grid grid-cols-3 gap-2">
                {[3, 7, 14].map((days) => (
                  <button
                    key={days}
                    type="button"
                    onClick={() => setNewReminderInterval(days)}
                    className={`py-2 rounded-lg font-bold border cursor-pointer ${
                      newReminderInterval === days
                        ? 'bg-blue-50 border-blue-600 text-blue-700'
                        : 'border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    {days} Days
                  </button>
                ))}
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddReminderModal(false)}
                  className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 cursor-pointer"
                >
                  Cancel
                </button>
                <button type="submit" className="px-4 py-2 rounded-lg bg-blue-600 text-white font-bold cursor-pointer">
                  Create Alert
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {taskForReminder && (
        <ScheduleTaskReminderModal
          language={language}
          task={taskForReminder}
          onClose={() => setTaskForReminder(null)}
          onScheduled={(taskTitle, minutes) => {
            setTaskReminderSuccess(`Reminder scheduled in ${minutes} minutes for "${taskTitle}".`);
            setTimeout(() => setTaskReminderSuccess(null), 6000);
          }}
        />
      )}
    </div>
  );
};
