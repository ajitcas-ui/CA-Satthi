import React, { useState, useEffect, useRef } from 'react';
import {
  ExamAttemptId,
  Language,
  NavTab,
  PaperId,
  StudyTask,
  TestAttemptResult,
  UserProfile,
  ExamUpdate,
  ThemeMode,
  PricingConfig,
  ExamCountdownConfig,
  PaymentRequest,
  UpiConfig,
  StudySession,
  AppNotification,
  SubjectChapter,
  MCQQuestion,
  StudyPresence,
  StudyPdfMaterial,
} from './types';
import { CANONICAL_SYLLABUS } from './data/syllabusData';
import { INITIAL_STUDY_TASKS } from './data/mockPlanner';
import { MOCK_EXAM_UPDATES } from './data/mockUpdates';
import {
  GUEST_USER,
  clearCurrentUser,
  getCurrentUser,
  getPricingConfig,
  getExamCountdownConfig,
  saveExamCountdownConfig,
  getUpiConfig,
  saveUpiConfig,
  getStudentMembershipStatus,
  getUserPaymentHistory,
  getStudySessionsLocal,
  saveStudySessionLocal,
  getAllQuestions,
  getSubjectChapters,
  updateUserProfile,
} from './utils/storageDb';
import { canUserAccessAdmin } from './utils/membershipRules';
import {
  normalizeExamAttempt,
  buildAttemptChapterKey,
  buildAttemptChapterProgressMap,
  filterStudySessionsByAttempt,
  filterTestResultsByAttempt,
  filterStudyTasksByAttempt,
} from './utils/examAttempt';
import { formatIsoDateLocal } from './utils/studyTracker';
import { resolvePublicDisplayName } from './utils/leaderboard';
import { Sidebar } from './components/Sidebar';
import { Navbar } from './components/Navbar';
import { BottomNav } from './components/BottomNav';
import { StudyNote } from './types';
import { MOCK_NOTES } from './data/mockNotes';
import { HomeDashboard } from './components/HomeDashboard';
import { StudyPlannerView } from './components/StudyPlannerView';
import { PracticeView } from './components/PracticeView';
import { MockTestView } from './components/MockTestView';
import { StudyNotesView } from './components/StudyNotesView';
import { ProgressTrackerView } from './components/ProgressTrackerView';
import { ExamUpdatesView } from './components/ExamUpdatesView';
import { CommunityView } from './components/CommunityView';
import { OwnerDashboardView } from './components/OwnerDashboardView';
import { OwnerLoginView } from './components/OwnerLoginView';
import { AIDoubtSolverView } from './components/AIDoubtSolverView';
import { DailyChallengeView } from './components/DailyChallengeView';
import { AllIndiaRankingView } from './components/AllIndiaRankingView';
import { PaymentModal } from './components/PaymentModal';
import { ReferralRewardModal } from './components/ReferralRewardModal';
import { AuthModal } from './components/AuthModal';
import { PricingModal } from './components/PricingModal';
import { NotificationBanner } from './components/NotificationBanner';
import { MembershipLockScreen } from './components/MembershipLockScreen';
import { checkAndTriggerDailyReminder } from './utils/notificationService';
import { parseOwnerRoute, resolveOwnerAuthRedirect, OwnerRouteKind } from './utils/ownerRouting';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './firebase/config';
import {
  subscribeToAuthState,
  saveTestResultToDb,
  subscribeToUserTestResults,
  subscribeToUserBookmarks,
  subscribeToUserStudyTasks,
  subscribeToExamAnnouncements,
  subscribeToExamConfig,
  subscribeToUpiConfig,
  subscribeToUserPayments,
  subscribeToUserStudySessions,
  subscribeToUserChapterProgress,
  subscribeToNotifications,
  subscribeToCustomQuestions,
  subscribeToSubjectChapters,
  subscribeToStudyMaterials,
  subscribeToApprovedNoteMaterials,
  subscribeToMySubmittedNotes,
  subscribeToStudyPresence,
  saveStudySessionToDb,
  upsertStudyPresence,
  logAnalyticsEvent,
  saveChapterProgressToDb,
  updateUserProfileInDb,
} from './firebase/services';

const OWNER_STUDENT_PREVIEW_KEY = 'ca_saathi_owner_preview_student';

function readCurrentOwnerRoute(): OwnerRouteKind {
  if (typeof window === 'undefined') return 'student';
  return parseOwnerRoute(window.location.pathname, window.location.hash, window.location.search);
}

function replaceBrowserUrl(path: string): void {
  if (typeof window === 'undefined') return;
  if (window.location.pathname === path && !window.location.hash && !window.location.search) return;
  window.history.replaceState({}, '', path);
}

function pushBrowserUrl(path: string): void {
  if (typeof window === 'undefined') return;
  if (window.location.pathname === path && !window.location.hash && !window.location.search) return;
  window.history.pushState({}, '', path);
}

const LEARNING_TABS = new Set<NavTab>([
  'practice',
  'mocks',
  'notes',
  'planner',
  'doubtSolver',
  'dailyChallenge',
]);

function getOrCreateVisitorId(): string {
  try {
    const existing = localStorage.getItem('ca_saathi_visitor_id');
    if (existing) return existing;
    const created = `vis_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    localStorage.setItem('ca_saathi_visitor_id', created);
    return created;
  } catch {
    return `vis_${Date.now()}`;
  }
}

export default function App() {
  const [theme, setTheme] = useState<ThemeMode>(() => {
    const saved = localStorage.getItem('ca_saathi_theme');
    if (saved === 'dark' || saved === 'light') return saved;
    if (typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }
    return 'light';
  });

  useEffect(() => {
    localStorage.setItem('ca_saathi_theme', theme);
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  const [language, setLanguage] = useState<Language>(() => {
    const saved = localStorage.getItem('ca_saathi_lang');
    return saved === 'hi' ? 'hi' : 'en';
  });

  const [pricingConfig, setPricingConfig] = useState<PricingConfig>(() => getPricingConfig());
  const [isPricingModalOpen, setIsPricingModalOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isReferralModalOpen, setIsReferralModalOpen] = useState(false);
  const [countdownConfig, setCountdownConfig] = useState<ExamCountdownConfig>(() => getExamCountdownConfig());
  const [upiConfig, setUpiConfig] = useState<UpiConfig>(() => getUpiConfig());

  const [currentUser, setCurrentUser] = useState<UserProfile>(() => getCurrentUser());
  const [isEmailVerified, setIsEmailVerified] = useState<boolean>(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  const [selectedAttempt, setSelectedAttempt] = useState<ExamAttemptId>(() => {
    try {
      const savedAttempt = localStorage.getItem('ca_saathi_selected_attempt');
      if (savedAttempt) return normalizeExamAttempt(savedAttempt);
    } catch {
      // ignore storage access issues
    }
    return normalizeExamAttempt(getCurrentUser()?.targetAttempt);
  });

  const [routeKind, setRouteKind] = useState<OwnerRouteKind>(() => readCurrentOwnerRoute());
  const [ownerPreviewingStudent, setOwnerPreviewingStudent] = useState<boolean>(() => {
    try {
      return sessionStorage.getItem(OWNER_STUDENT_PREVIEW_KEY) === '1';
    } catch {
      return false;
    }
  });

  const [activeTab, setActiveTab] = useState<NavTab>(() =>
    readCurrentOwnerRoute() === 'owner-dashboard' ? 'admin' : 'home'
  );
  const [selectedPaperForPractice, setSelectedPaperForPractice] = useState<PaperId>('paper1');

  const [tasks, setTasks] = useState<StudyTask[]>(() => {
    const saved = localStorage.getItem('ca_saathi_tasks');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        // fallback
      }
    }
    return INITIAL_STUDY_TASKS;
  });

  const [streak, setStreak] = useState<number>(() => {
    const saved = localStorage.getItem('ca_saathi_streak');
    return saved ? Number(saved) : 0;
  });

  const [studiedTodayMinutes, setStudiedTodayMinutes] = useState<number>(() => {
    const saved = localStorage.getItem('ca_saathi_studied_today');
    return saved ? Number(saved) : 0;
  });

  const dailyGoalMinutes = currentUser?.dailyGoalMinutes || 120;

  const [questionsSolvedToday, setQuestionsSolvedToday] = useState<number>(() => {
    const saved = localStorage.getItem('ca_saathi_q_today');
    return saved ? Number(saved) : 0;
  });

  const dailyQuestionGoal = 30;

  const [totalQuestionsSolved, setTotalQuestionsSolved] = useState<number>(() => {
    const saved = localStorage.getItem('ca_saathi_q_total');
    return saved ? Number(saved) : 0;
  });

  const [accuracyRate, setAccuracyRate] = useState<number>(() => {
    const saved = localStorage.getItem('ca_saathi_accuracy');
    return saved ? Number(saved) : 0;
  });

  const [bookmarkedIds, setBookmarkedIds] = useState<string[]>(() => {
    const saved = localStorage.getItem('ca_saathi_bookmarks');
    return saved ? JSON.parse(saved) : [];
  });

  const [testHistory, setTestHistory] = useState<TestAttemptResult[]>(() => {
    const saved = localStorage.getItem('ca_saathi_tests');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        // fallback
      }
    }
    return [];
  });

  const [studySessions, setStudySessions] = useState<StudySession[]>(() => getStudySessionsLocal());
  const [userPayments, setUserPayments] = useState<PaymentRequest[]>([]);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [livePeers, setLivePeers] = useState<StudyPresence[]>([]);
  const [chapterProgress, setChapterProgress] = useState<Record<string, 'pending' | 'revising' | 'mastered'>>(() => {
    try {
      const saved = localStorage.getItem('ca_saathi_chapter_progress');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });
  const [cloudCustomQuestions, setCloudCustomQuestions] = useState<MCQQuestion[]>([]);
  const [cloudStudyMaterials, setCloudStudyMaterials] = useState<StudyNote[]>([]);
  const [approvedPdfMaterials, setApprovedPdfMaterials] = useState<StudyPdfMaterial[]>([]);
  const [mySubmittedNotes, setMySubmittedNotes] = useState<StudyPdfMaterial[]>([]);
  const [subjectChapters, setSubjectChapters] = useState<SubjectChapter[]>(() => getSubjectChapters());
  const [examUpdates, setExamUpdates] = useState<ExamUpdate[]>(MOCK_EXAM_UPDATES);

  // Persist local preferences
  useEffect(() => {
    localStorage.setItem('ca_saathi_lang', language);
  }, [language]);

  useEffect(() => {
    localStorage.setItem('ca_saathi_tasks', JSON.stringify(tasks));
  }, [tasks]);

  useEffect(() => {
    localStorage.setItem('ca_saathi_bookmarks', JSON.stringify(bookmarkedIds));
  }, [bookmarkedIds]);

  useEffect(() => {
    localStorage.setItem('ca_saathi_tests', JSON.stringify(testHistory));
  }, [testHistory]);

  useEffect(() => {
    localStorage.setItem('ca_saathi_studied_today', studiedTodayMinutes.toString());
  }, [studiedTodayMinutes]);

  useEffect(() => {
    localStorage.setItem('ca_saathi_streak', streak.toString());
  }, [streak]);

  useEffect(() => {
    localStorage.setItem('ca_saathi_q_today', questionsSolvedToday.toString());
  }, [questionsSolvedToday]);

  useEffect(() => {
    localStorage.setItem('ca_saathi_q_total', totalQuestionsSolved.toString());
  }, [totalQuestionsSolved]);

  useEffect(() => {
    localStorage.setItem('ca_saathi_chapter_progress', JSON.stringify(chapterProgress));
  }, [chapterProgress]);

  // Analytics visit logging (once per session)
  useEffect(() => {
    if (sessionStorage.getItem('ca_saathi_visit_logged')) return;
    sessionStorage.setItem('ca_saathi_visit_logged', '1');
    const visitorId = getOrCreateVisitorId();
    const uid = currentUser?.id && currentUser.id !== 'guest' ? currentUser.id : undefined;
    logAnalyticsEvent('visit', visitorId, uid).catch(() => {});
  }, [currentUser?.id]);

  // Firebase Auth state synchronization (resets to GUEST_USER when signed out)
  useEffect(() => {
    const unsubRaw = onAuthStateChanged(auth, (fbUser) => {
      setIsEmailVerified(Boolean(fbUser?.emailVerified));
    });
    const unsubProfile = subscribeToAuthState((profile) => {
      if (profile) {
        setCurrentUser(profile);
        localStorage.setItem('ca_saathi_current_user', JSON.stringify(profile));
        try {
          if (!localStorage.getItem('ca_saathi_selected_attempt') && profile.targetAttempt) {
            const normalized = normalizeExamAttempt(profile.targetAttempt);
            setSelectedAttempt(normalized);
            localStorage.setItem('ca_saathi_selected_attempt', normalized);
          }
        } catch {
          // ignore
        }
      } else {
        setCurrentUser(GUEST_USER);
        clearCurrentUser();
        setUserPayments([]);
        setNotifications([]);
        setMySubmittedNotes([]);
      }
    });
    return () => {
      unsubRaw();
      unsubProfile();
    };
  }, []);

  // Global Firestore configs & shared syllabus/questions listeners
  useEffect(() => {
    const unsubExam = subscribeToExamConfig((cloudConfig) => {
      if (cloudConfig) {
        setCountdownConfig(cloudConfig);
        saveExamCountdownConfig(cloudConfig);
      }
    });

    const unsubUpi = subscribeToUpiConfig((cloudUpi) => {
      if (cloudUpi) {
        setUpiConfig(cloudUpi);
        saveUpiConfig(cloudUpi);
      }
    });

    const unsubAnnouncements = subscribeToExamAnnouncements((cloudUpdates) => {
      if (cloudUpdates.length > 0) setExamUpdates(cloudUpdates);
    });

    const unsubChapters = subscribeToSubjectChapters((cloudCh) => {
      if (cloudCh.length >= 46) setSubjectChapters(cloudCh);
    });

    const unsubQuestions = subscribeToCustomQuestions((cloudQs) => {
      setCloudCustomQuestions(cloudQs);
    });

    const unsubMaterials = subscribeToStudyMaterials((cloudMats) => {
      setCloudStudyMaterials(cloudMats);
    });

    const unsubApprovedPdf = subscribeToApprovedNoteMaterials((pdfList) => {
      setApprovedPdfMaterials(pdfList);
    });

    const syncRoute = () => {
      setRouteKind(readCurrentOwnerRoute());
    };
    window.addEventListener('hashchange', syncRoute);
    window.addEventListener('popstate', syncRoute);

    return () => {
      unsubExam();
      unsubUpi();
      unsubAnnouncements();
      unsubChapters();
      unsubQuestions();
      unsubMaterials();
      unsubApprovedPdf();
      window.removeEventListener('hashchange', syncRoute);
      window.removeEventListener('popstate', syncRoute);
    };
  }, []);

  const isSuperAdmin = canUserAccessAdmin(currentUser, isEmailVerified);

  const openOwnerDashboardRoute = (usePush = true) => {
    try {
      sessionStorage.removeItem(OWNER_STUDENT_PREVIEW_KEY);
    } catch {
      // ignore
    }
    setOwnerPreviewingStudent(false);
    setRouteKind('owner-dashboard');
    setActiveTab('admin');
    if (usePush) {
      pushBrowserUrl('/owner-dashboard');
    } else {
      replaceBrowserUrl('/owner-dashboard');
    }
  };

  const openOwnerLoginRoute = () => {
    setRouteKind('owner-login');
    pushBrowserUrl('/owner-login');
  };

  const openStudentAppRoute = (previewingAsOwner = false) => {
    try {
      if (previewingAsOwner) {
        sessionStorage.setItem(OWNER_STUDENT_PREVIEW_KEY, '1');
      } else {
        sessionStorage.removeItem(OWNER_STUDENT_PREVIEW_KEY);
      }
    } catch {
      // ignore
    }
    setOwnerPreviewingStudent(previewingAsOwner);
    setRouteKind('student');
    setActiveTab('home');
    pushBrowserUrl('/');
  };

  const handleTabChange = (tab: NavTab) => {
    if (tab === 'admin') {
      if (isSuperAdmin) {
        openOwnerDashboardRoute(true);
      } else {
        openOwnerLoginRoute();
      }
      return;
    }
    setActiveTab(tab);
  };

  // Authenticated User real-time Firestore listeners
  useEffect(() => {
    if (!currentUser?.id || currentUser.id === 'guest') {
      setStudySessions(getStudySessionsLocal('guest'));
      return;
    }

    const unsubBookmarks = subscribeToUserBookmarks(currentUser.id, (cloudIds) => {
      setBookmarkedIds(cloudIds);
    });

    const unsubTests = subscribeToUserTestResults(currentUser.id, (cloudTests) => {
      setTestHistory(cloudTests);
    });

    const unsubTasks = subscribeToUserStudyTasks(currentUser.id, (cloudTasks) => {
      if (cloudTasks.length > 0) setTasks(cloudTasks);
    });

    const unsubPayments = subscribeToUserPayments(currentUser.id, (cloudPayments) => {
      setUserPayments(cloudPayments);
    });

    const unsubSessions = subscribeToUserStudySessions(currentUser.id, (cloudSessions) => {
      setStudySessions(cloudSessions);
    });

    const unsubProgress = subscribeToUserChapterProgress(currentUser.id, (cloudMap) => {
      if (Object.keys(cloudMap).length > 0) setChapterProgress(cloudMap);
    });

    const unsubNotifs = subscribeToNotifications(isSuperAdmin ? 'admin' : currentUser.id, (list) => {
      setNotifications(list);
    });

    const unsubPresence = subscribeToStudyPresence((peers) => {
      setLivePeers(peers);
    });

    const unsubMyNotes = subscribeToMySubmittedNotes(currentUser.id, (list) => {
      setMySubmittedNotes(list);
    });

    return () => {
      unsubBookmarks();
      unsubTests();
      unsubTasks();
      unsubPayments();
      unsubSessions();
      unsubProgress();
      unsubNotifs();
      unsubPresence();
      unsubMyNotes();
    };
  }, [currentUser?.id, isSuperAdmin]);

  // Automatic redirect & authorization enforcement for Owner vs Student routes
  const routeResolution = resolveOwnerAuthRedirect({
    routeKind,
    isSuperAdmin,
    ownerPreviewingStudent,
  });

  useEffect(() => {
    if (isSuperAdmin && routeResolution.redirectPath === '/owner-dashboard') {
      replaceBrowserUrl('/owner-dashboard');
      setRouteKind('owner-dashboard');
      setActiveTab('admin');
      return;
    }

    if (!isSuperAdmin && activeTab === 'admin') {
      setActiveTab('home');
    }
  }, [isSuperAdmin, routeResolution.redirectPath, activeTab]);

  // Automated active Study Session Tracker + Live Presence Heartbeat
  const lastInteractionRef = useRef<number>(Date.now());
  const pendingMinutesRef = useRef<number>(0);
  const sessionQuestionsRef = useRef<{ attempted: number; correct: number }>({ attempted: 0, correct: 0 });
  const sessionStartedAtRef = useRef<string>(new Date().toISOString());

  useEffect(() => {
    const touch = () => {
      lastInteractionRef.current = Date.now();
    };
    window.addEventListener('pointerdown', touch, { passive: true });
    window.addEventListener('keydown', touch, { passive: true });
    window.addEventListener('scroll', touch, { passive: true });
    return () => {
      window.removeEventListener('pointerdown', touch);
      window.removeEventListener('keydown', touch);
      window.removeEventListener('scroll', touch);
    };
  }, []);

  const flushActiveStudySession = (tab: NavTab) => {
    const mins = pendingMinutesRef.current;
    const qAtt = sessionQuestionsRef.current.attempted;
    const qCorr = sessionQuestionsRef.current.correct;
    if (mins <= 0 && qAtt <= 0) return;

    const uid = currentUser?.id || 'guest';
    const now = new Date();
    const sessionRecord: StudySession = {
      id: `sess_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      userId: uid,
      date: formatIsoDateLocal(now),
      paperId: selectedPaperForPractice,
      activityType: LEARNING_TABS.has(tab) ? (tab as StudySession['activityType']) : 'general',
      durationMinutes: Math.max(mins, qAtt > 0 ? 1 : 0),
      questionsAttempted: qAtt,
      questionsCorrect: qCorr,
      startedAt: sessionStartedAtRef.current,
      endedAt: now.toISOString(),
      examAttempt: selectedAttempt,
    };

    pendingMinutesRef.current = 0;
    sessionQuestionsRef.current = { attempted: 0, correct: 0 };
    sessionStartedAtRef.current = now.toISOString();

    const updatedLocal = saveStudySessionLocal(sessionRecord);
    if (uid === 'guest') {
      setStudySessions(updatedLocal.filter((s) => s.userId === 'guest'));
    } else {
      saveStudySessionToDb(uid, sessionRecord).catch(() => {});
    }
  };

  useEffect(() => {
    if (!LEARNING_TABS.has(activeTab)) {
      flushActiveStudySession(activeTab);
      return;
    }

    sessionStartedAtRef.current = new Date().toISOString();

    const sendHeartbeat = () => {
      if (!currentUser?.id || currentUser.id === 'guest') return;
      if (document.hidden) return;
      if (Date.now() - lastInteractionRef.current > 180_000) return;
      upsertStudyPresence({
        userId: currentUser.id,
        displayName: resolvePublicDisplayName(currentUser),
        avatar: currentUser.avatar || '🎓',
        targetAttempt: selectedAttempt,
        activePaperId: selectedPaperForPractice,
        activeTopic: activeTab === 'mocks' ? 'Timed Mock Test' : activeTab === 'doubtSolver' ? 'AI Doubt Solver' : 'MCQ Practice',
        isStudying: true,
        sessionStartedAt: sessionStartedAtRef.current,
        lastHeartbeatAt: new Date().toISOString(),
      }).catch(() => {});
    };

    sendHeartbeat();

    const timer = setInterval(() => {
      if (document.hidden) return;
      // Pause automatically after 3 minutes of inactivity
      if (Date.now() - lastInteractionRef.current > 180_000) return;

      pendingMinutesRef.current += 1;
      setStudiedTodayMinutes((prev) => prev + 1);
      sendHeartbeat();

      // Persist session batch every 2 active minutes
      if (pendingMinutesRef.current >= 2) {
        flushActiveStudySession(activeTab);
      }
    }, 60_000);

    const onVisibilityChange = () => {
      if (document.hidden) {
        flushActiveStudySession(activeTab);
      }
    };
    const onBeforeUnload = () => flushActiveStudySession(activeTab);

    document.addEventListener('visibilitychange', onVisibilityChange);
    window.addEventListener('beforeunload', onBeforeUnload);

    return () => {
      clearInterval(timer);
      document.removeEventListener('visibilitychange', onVisibilityChange);
      window.removeEventListener('beforeunload', onBeforeUnload);
      flushActiveStudySession(activeTab);
    };
  }, [activeTab, currentUser?.id, selectedPaperForPractice, selectedAttempt]);

  // Daily study reminder scheduler
  useEffect(() => {
    checkAndTriggerDailyReminder(tasks, streak, language, () => setActiveTab('planner'));
    const interval = setInterval(() => {
      checkAndTriggerDailyReminder(tasks, streak, language, () => setActiveTab('planner'));
    }, 30000);
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        checkAndTriggerDailyReminder(tasks, streak, language, () => setActiveTab('planner'));
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [tasks, streak, language]);

  const handleStudySessionComplete = (minutes: number) => {
    setStudiedTodayMinutes((prev) => prev + minutes);
    const uid = currentUser?.id || 'guest';
    const now = new Date();
    const record: StudySession = {
      id: `pomo_${Date.now()}`,
      userId: uid,
      date: formatIsoDateLocal(now),
      paperId: selectedPaperForPractice,
      activityType: 'planner',
      durationMinutes: minutes,
      startedAt: new Date(now.getTime() - minutes * 60_000).toISOString(),
      endedAt: now.toISOString(),
      examAttempt: selectedAttempt,
    };
    const updatedLocal = saveStudySessionLocal(record);
    if (uid === 'guest') {
      setStudySessions(updatedLocal.filter((s) => s.userId === 'guest'));
    } else {
      saveStudySessionToDb(uid, record).catch(() => {});
    }
  };

  const handleQuestionAnswered = (isCorrect: boolean) => {
    setQuestionsSolvedToday((prev) => prev + 1);
    setTotalQuestionsSolved((prev) => prev + 1);
    sessionQuestionsRef.current.attempted += 1;
    if (isCorrect) sessionQuestionsRef.current.correct += 1;
    setAccuracyRate((prev) => {
      const next = prev === 0 ? (isCorrect ? 100 : 0) : isCorrect ? Math.min(100, prev + 1) : Math.max(0, prev - 1);
      localStorage.setItem('ca_saathi_accuracy', next.toString());
      return next;
    });
  };

  const handleTestCompleted = (result: TestAttemptResult) => {
    const attemptTaggedResult: TestAttemptResult = {
      ...result,
      examAttempt: result.examAttempt || selectedAttempt,
    };
    setTestHistory((prev) => [attemptTaggedResult, ...prev]);
    if (currentUser?.id && currentUser.id !== 'guest') {
      saveTestResultToDb(currentUser.id, attemptTaggedResult).catch(console.error);
    }
    setQuestionsSolvedToday((prev) => prev + attemptTaggedResult.attempted);
    setTotalQuestionsSolved((prev) => prev + attemptTaggedResult.attempted);
    sessionQuestionsRef.current.attempted += attemptTaggedResult.attempted;
    sessionQuestionsRef.current.correct += attemptTaggedResult.correct;
  };

  const handleUpdateChapterProgress = (chapterId: string, status: 'pending' | 'revising' | 'mastered') => {
    const scopedKey = buildAttemptChapterKey(chapterId, selectedAttempt);
    setChapterProgress((prev) => ({ ...prev, [scopedKey]: status }));
    if (currentUser?.id && currentUser.id !== 'guest') {
      saveChapterProgressToDb(currentUser.id, scopedKey, status).catch(() => {});
    }
  };

  const handleUpdateUserProfile = async (updates: Partial<UserProfile>) => {
    setCurrentUser((prev) => ({ ...prev, ...updates }));
    updateUserProfile(updates);
    if (currentUser?.id && currentUser.id !== 'guest') {
      await updateUserProfileInDb(currentUser.id, updates).catch(() => {});
    }
  };

  const handleChangeAttempt = (nextAttempt: ExamAttemptId) => {
    const normalized = normalizeExamAttempt(nextAttempt);
    setSelectedAttempt(normalized);
    try {
      localStorage.setItem('ca_saathi_selected_attempt', normalized);
    } catch {
      // ignore
    }
    setCurrentUser((prev) => ({ ...prev, targetAttempt: normalized }));
    updateUserProfile({ targetAttempt: normalized });
    if (currentUser?.id && currentUser.id !== 'guest') {
      updateUserProfileInDb(currentUser.id, { targetAttempt: normalized }).catch(() => {});
    }
  };

  // Strict Membership Status Resolution (combines live Firestore userPayments + local fallback)
  const resolvedPayments =
    userPayments.length > 0
      ? userPayments
      : currentUser?.id && currentUser.id !== 'guest'
        ? getUserPaymentHistory(currentUser.id)
        : [];
  const membership = getStudentMembershipStatus(currentUser, resolvedPayments);

  const renderGatedContent = (component: React.ReactNode) => {
    if (!membership.canAccessPremium && !isSuperAdmin) {
      return (
        <MembershipLockScreen
          language={language}
          selectedAttempt={selectedAttempt}
          currentUser={currentUser}
          membershipStatus={membership.status}
          expiresAt={membership.expiresAt}
          onOpenPaymentModal={() => setIsPaymentModalOpen(true)}
          onOpenAuthModal={() => setIsAuthModalOpen(true)}
          onGoHome={() => setActiveTab('home')}
        />
      );
    }
    return component;
  };

  const combinedQuestions = React.useMemo(() => {
    const localAll = getAllQuestions();
    const existingIds = new Set(localAll.map((q) => q.id));
    const uniqueCloud = cloudCustomQuestions.filter((q) => !existingIds.has(q.id));
    return [...uniqueCloud, ...localAll];
  }, [cloudCustomQuestions]);

  const combinedStudyNotes = React.useMemo(() => {
    const map = new Map<string, StudyNote>();
    for (const n of MOCK_NOTES) map.set(n.id, n);
    for (const m of cloudStudyMaterials) map.set(m.id, m);
    return Array.from(map.values());
  }, [cloudStudyMaterials]);

  const attemptChapterIds = React.useMemo(
    () => (subjectChapters.length >= 46 ? subjectChapters : CANONICAL_SYLLABUS).map((c) => c.id),
    [subjectChapters]
  );

  const attemptChapterProgress = React.useMemo(
    () => buildAttemptChapterProgressMap(chapterProgress, attemptChapterIds, selectedAttempt),
    [chapterProgress, attemptChapterIds, selectedAttempt]
  );

  const attemptStudySessions = React.useMemo(
    () => filterStudySessionsByAttempt(studySessions, selectedAttempt),
    [studySessions, selectedAttempt]
  );

  const attemptTestHistory = React.useMemo(
    () => filterTestResultsByAttempt(testHistory, selectedAttempt),
    [testHistory, selectedAttempt]
  );

  const attemptStudyTasks = React.useMemo(
    () => filterStudyTasksByAttempt(tasks, selectedAttempt),
    [tasks, selectedAttempt]
  );

  const pendingTasksCount = attemptStudyTasks.filter((t) => !t.completed).length;

  // 1. Dedicated Owner Login Portal (/owner-login, or /owner-dashboard without owner authorization)
  if (routeResolution.screen === 'owner-login') {
    return (
      <OwnerLoginView
        currentUser={currentUser}
        isEmailVerified={isEmailVerified}
        onOwnerAuthenticated={(prof) => {
          setCurrentUser(prof);
          setIsEmailVerified(true);
          openOwnerDashboardRoute(true);
        }}
        onReturnToStudentApp={() => openStudentAppRoute(false)}
      />
    );
  }

  // 2. Completely Separate Private Owner Dashboard (/owner-dashboard)
  if (routeResolution.screen === 'owner-dashboard' && isSuperAdmin) {
    return (
      <OwnerDashboardView
        language={language}
        theme={theme}
        onToggleTheme={toggleTheme}
        currentUser={currentUser}
        isEmailVerified={isEmailVerified}
        onExitToStudentApp={() => openStudentAppRoute(true)}
        examUpdates={examUpdates}
        setExamUpdates={setExamUpdates}
        pricingConfig={pricingConfig}
        countdownConfig={countdownConfig}
        setCountdownConfig={setCountdownConfig}
        upiConfig={upiConfig}
        setUpiConfig={setUpiConfig}
        subjectChapters={subjectChapters}
        setSubjectChapters={setSubjectChapters}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#F7F8FC] dark:bg-[#080E21] text-[#0F1E46] dark:text-slate-100 flex font-sans selection:bg-violet-700 selection:text-white transition-colors duration-200">
      <Sidebar
        language={language}
        activeTab={activeTab}
        setActiveTab={handleTabChange}
        selectedAttempt={selectedAttempt}
        onChangeAttempt={handleChangeAttempt}
        currentUser={currentUser}
        isEmailVerified={isEmailVerified}
        onOpenPaymentModal={() => setIsPaymentModalOpen(true)}
        onOpenAuthModal={() => setIsAuthModalOpen(true)}
      />

      <div className="flex-1 flex flex-col min-w-0">
        <NotificationBanner onOpenPlanner={() => setActiveTab('planner')} />

        <Navbar
          language={language}
          setLanguage={setLanguage}
          activeTab={activeTab}
          setActiveTab={handleTabChange}
          selectedAttempt={selectedAttempt}
          onChangeAttempt={handleChangeAttempt}
          streak={streak}
          studiedTodayMinutes={studiedTodayMinutes}
          currentUser={currentUser}
          isEmailVerified={isEmailVerified}
          notifications={notifications}
          onOpenAuthModal={() => setIsAuthModalOpen(true)}
          pendingTasksCount={pendingTasksCount}
          theme={theme}
          onToggleTheme={toggleTheme}
          onOpenPricingModal={() => setIsPricingModalOpen(true)}
          onOpenPaymentModal={() => setIsPaymentModalOpen(true)}
          onOpenReferralModal={() => setIsReferralModalOpen(true)}
        />

        <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 pt-5">
          <div key={activeTab} className="animate-view-enter">
            {activeTab === 'home' && (
              <HomeDashboard
                language={language}
                setActiveTab={handleTabChange}
                setSelectedPaperForPractice={(pId) => setSelectedPaperForPractice(pId)}
                selectedAttempt={selectedAttempt}
                onChangeAttempt={handleChangeAttempt}
                streak={streak}
                studiedTodayMinutes={studiedTodayMinutes}
                dailyGoalMinutes={dailyGoalMinutes}
                questionsSolvedToday={questionsSolvedToday}
                dailyQuestionGoal={dailyQuestionGoal}
                onOpenPaymentModal={() => setIsPaymentModalOpen(true)}
                onOpenReferralModal={() => setIsReferralModalOpen(true)}
                currentUser={currentUser}
                countdownConfig={countdownConfig}
                testHistory={attemptTestHistory}
                userPayments={resolvedPayments}
                studySessions={attemptStudySessions}
                chapterProgress={attemptChapterProgress}
                allQuestions={combinedQuestions}
                studyNotes={combinedStudyNotes}
                tasks={attemptStudyTasks}
                livePeersCount={livePeers.length}
                examUpdates={examUpdates}
                onOpenAuthModal={() => setIsAuthModalOpen(true)}
                isSuperAdmin={isSuperAdmin}
              />
            )}

            {activeTab === 'dailyChallenge' &&
              renderGatedContent(
                <DailyChallengeView
                  language={language}
                  currentUser={currentUser}
                  streak={streak}
                  onChallengeCompleted={(earnedPts) => {
                    setCurrentUser((prev) => ({
                      ...prev,
                      referralPoints: (prev.referralPoints || 0) + earnedPts,
                    }));
                    setStreak((prev) => prev + 1);
                  }}
                />
              )}

            {activeTab === 'doubtSolver' &&
              renderGatedContent(<AIDoubtSolverView language={language} currentUser={currentUser} />)}

            {activeTab === 'leaderboard' &&
              renderGatedContent(
                <AllIndiaRankingView
                  language={language}
                  currentUser={currentUser}
                  livePeers={livePeers}
                  studySessions={studySessions}
                  testHistory={testHistory}
                  accuracyRate={accuracyRate}
                  streak={streak}
                  onUpdateDisplayName={(displayName, privacyHideCity, privacyHideAttempt) =>
                    handleUpdateUserProfile({ displayName, privacyHideCity, privacyHideAttempt })
                  }
                />
              )}

            {activeTab === 'planner' &&
              renderGatedContent(
                <StudyPlannerView
                  language={language}
                  selectedAttempt={selectedAttempt}
                  tasks={attemptStudyTasks}
                  setTasks={setTasks}
                  onStudySessionComplete={handleStudySessionComplete}
                  currentUser={currentUser}
                  streak={streak}
                  chapterProgress={attemptChapterProgress}
                  onUpdateChapterProgress={handleUpdateChapterProgress}
                  allQuestions={combinedQuestions}
                  onStartChapterPractice={(pId) => {
                    setSelectedPaperForPractice(pId);
                    setActiveTab('practice');
                  }}
                />
              )}

            {activeTab === 'practice' &&
              renderGatedContent(
                <PracticeView
                  language={language}
                  selectedAttempt={selectedAttempt}
                  onChangeAttempt={handleChangeAttempt}
                  selectedPaperId={selectedPaperForPractice}
                  onQuestionAnswered={handleQuestionAnswered}
                  bookmarkedIds={bookmarkedIds}
                  setBookmarkedIds={setBookmarkedIds}
                  currentUser={currentUser}
                  allQuestionsOverride={combinedQuestions}
                  chapterProgress={attemptChapterProgress}
                  onUpdateChapterProgress={handleUpdateChapterProgress}
                />
              )}

            {activeTab === 'mocks' &&
              renderGatedContent(
                <MockTestView
                  language={language}
                  selectedAttempt={selectedAttempt}
                  onChangeAttempt={handleChangeAttempt}
                  onTestCompleted={handleTestCompleted}
                  currentUser={currentUser}
                  onOpenPaymentModal={() => setIsPaymentModalOpen(true)}
                  onOpenReferralModal={() => setIsReferralModalOpen(true)}
                />
              )}

            {activeTab === 'community' &&
              renderGatedContent(
                <CommunityView
                  language={language}
                  selectedAttempt={selectedAttempt}
                  currentUser={currentUser}
                  livePeers={livePeers}
                />
              )}

            {activeTab === 'notes' &&
              renderGatedContent(
                <StudyNotesView
                  language={language}
                  studyNotes={combinedStudyNotes}
                  pdfMaterials={approvedPdfMaterials}
                  mySubmittedNotes={mySubmittedNotes}
                  subjectChapters={subjectChapters}
                  currentUser={currentUser}
                  isSuperAdmin={isSuperAdmin}
                  selectedAttempt={selectedAttempt}
                  onChangeAttempt={handleChangeAttempt}
                />
              )}

            {activeTab === 'progress' &&
              renderGatedContent(
                <ProgressTrackerView
                  language={language}
                  selectedAttempt={selectedAttempt}
                  streak={streak}
                  studiedTodayMinutes={studiedTodayMinutes}
                  totalQuestionsSolved={totalQuestionsSolved}
                  accuracyRate={accuracyRate}
                  testHistory={attemptTestHistory}
                  studySessions={attemptStudySessions}
                  currentUser={currentUser}
                  chapterProgress={attemptChapterProgress}
                  onUpdateDailyGoal={(mins) => handleUpdateUserProfile({ dailyGoalMinutes: mins })}
                />
              )}

            {activeTab === 'updates' && (
              <ExamUpdatesView
                language={language}
                selectedAttempt={selectedAttempt}
                onChangeAttempt={handleChangeAttempt}
                examUpdates={examUpdates}
              />
            )}

            {activeTab === 'payment' && !isSuperAdmin && (
              <div className="py-6 max-w-2xl mx-auto">
                <PaymentModal
                  isOpen={true}
                  onClose={() => setActiveTab('home')}
                  language={language}
                  currentUser={currentUser}
                  userPayments={resolvedPayments}
                  upiConfigOverride={upiConfig}
                  onOpenAuthModal={() => setIsAuthModalOpen(true)}
                  onSuccess={() => {
                    setCurrentUser((prev) => ({
                      ...prev,
                      membershipStatus: prev.membershipStatus === 'active' ? 'active' : 'pending',
                    }));
                  }}
                />
              </div>
            )}
          </div>
        </main>

        <BottomNav
          activeTab={activeTab}
          setActiveTab={handleTabChange}
          language={language}
          selectedAttempt={selectedAttempt}
          onChangeAttempt={handleChangeAttempt}
          hasUnreadUpdates={true}
          currentUser={currentUser}
          isEmailVerified={isEmailVerified}
          onOpenPaymentModal={() => setIsPaymentModalOpen(true)}
          onOpenReferralModal={() => setIsReferralModalOpen(true)}
        />
      </div>

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        language={language}
        currentUser={currentUser}
        setCurrentUser={(u) => {
          setCurrentUser(u);
          if (u.targetAttempt) {
            handleChangeAttempt(normalizeExamAttempt(u.targetAttempt));
          }
          if (u.email?.toLowerCase().trim() === 'ajitsinghca9@gmail.com' && u.role === 'admin') {
            openOwnerDashboardRoute(true);
          }
        }}
        onOpenOwnerLogin={openOwnerLoginRoute}
        selectedAttempt={selectedAttempt}
        onChangeAttempt={handleChangeAttempt}
      />

      <PricingModal
        isOpen={isPricingModalOpen}
        onClose={() => setIsPricingModalOpen(false)}
        language={language}
        pricingConfig={pricingConfig}
        isAdmin={isSuperAdmin}
        onOpenAdminPanel={() => openOwnerDashboardRoute(true)}
      />

      <PaymentModal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        language={language}
        currentUser={currentUser}
        userPayments={resolvedPayments}
        upiConfigOverride={upiConfig}
        onOpenAuthModal={() => setIsAuthModalOpen(true)}
        onSuccess={() => {
          setCurrentUser((prev) => ({
            ...prev,
            membershipStatus: prev.membershipStatus === 'active' ? 'active' : 'pending',
          }));
        }}
      />

      <ReferralRewardModal
        isOpen={isReferralModalOpen}
        onClose={() => setIsReferralModalOpen(false)}
        language={language}
        currentUser={currentUser}
        onPointsRedeemed={() => {
          setCurrentUser((prev) => ({
            ...prev,
            referralPoints: Math.max(0, (prev.referralPoints || 0) - 100),
          }));
        }}
      />
    </div>
  );
}
