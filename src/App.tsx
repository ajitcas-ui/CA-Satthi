import React, { useState, useEffect } from 'react';
import { 
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
} from './types';
import { INITIAL_STUDY_TASKS } from './data/mockPlanner';
import { MOCK_EXAM_UPDATES } from './data/mockUpdates';
import { 
  getCurrentUser, 
  getPricingConfig, 
  savePricingConfig, 
  getExamCountdownConfig, 
  saveExamCountdownConfig,
  getStudentMembershipStatus,
  getUserPaymentHistory
} from './utils/storageDb';
import { Navbar } from './components/Navbar';
import { BottomNav } from './components/BottomNav';
import { HomeDashboard } from './components/HomeDashboard';
import { StudyPlannerView } from './components/StudyPlannerView';
import { PracticeView } from './components/PracticeView';
import { MockTestView } from './components/MockTestView';
import { StudyNotesView } from './components/StudyNotesView';
import { ProgressTrackerView } from './components/ProgressTrackerView';
import { ExamUpdatesView } from './components/ExamUpdatesView';
import { CommunityView } from './components/CommunityView';
import { AdminPanelView } from './components/AdminPanelView';
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
import {
  subscribeToAuthState,
  saveTestResultToDb,
  subscribeToUserTestResults,
  subscribeToUserBookmarks,
  subscribeToUserStudyTasks,
  subscribeToExamAnnouncements,
  subscribeToExamConfig,
} from './firebase/services';

export default function App() {
  // Theme state: 'light' | 'dark'
  const [theme, setTheme] = useState<ThemeMode>(() => {
    const saved = localStorage.getItem('ca_saathi_theme');
    if (saved === 'dark' || saved === 'light') return saved;
    if (typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }
    return 'light';
  });

  // Apply theme to document element
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

  // Language state (persisted)
  const [language, setLanguage] = useState<Language>(() => {
    const saved = localStorage.getItem('ca_saathi_lang');
    return saved === 'hi' ? 'hi' : 'en';
  });

  // Pricing & Pass state
  const [pricingConfig, setPricingConfig] = useState<PricingConfig>(() => getPricingConfig());
  const [isPricingModalOpen, setIsPricingModalOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isReferralModalOpen, setIsReferralModalOpen] = useState(false);

  // Active Exam Attempt & Countdown Configuration state
  const [countdownConfig, setCountdownConfig] = useState<ExamCountdownConfig>(() => getExamCountdownConfig());

  // User Profile Account state
  const [currentUser, setCurrentUser] = useState<UserProfile>(() => getCurrentUser());
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  // Current active section tab
  const [activeTab, setActiveTab] = useState<NavTab>('home');

  // Selected paper for deep-linking into Practice view from Home cards
  const [selectedPaperForPractice, setSelectedPaperForPractice] = useState<PaperId>('paper3');

  // Study tasks list
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

  // Gamification & metrics state
  const [streak, setStreak] = useState<number>(() => {
    const saved = localStorage.getItem('ca_saathi_streak');
    return saved ? Number(saved) : 5;
  });

  const [studiedTodayMinutes, setStudiedTodayMinutes] = useState<number>(() => {
    const saved = localStorage.getItem('ca_saathi_studied_today');
    return saved ? Number(saved) : 45;
  });

  const dailyGoalMinutes = 60;

  const [questionsSolvedToday, setQuestionsSolvedToday] = useState<number>(() => {
    const saved = localStorage.getItem('ca_saathi_q_today');
    return saved ? Number(saved) : 15;
  });

  const dailyQuestionGoal = 30;

  const [totalQuestionsSolved, setTotalQuestionsSolved] = useState<number>(() => {
    const saved = localStorage.getItem('ca_saathi_q_total');
    return saved ? Number(saved) : 68;
  });

  const [accuracyRate, setAccuracyRate] = useState<number>(() => {
    const saved = localStorage.getItem('ca_saathi_accuracy');
    return saved ? Number(saved) : 76;
  });

  // Bookmarked questions
  const [bookmarkedIds, setBookmarkedIds] = useState<string[]>(() => {
    const saved = localStorage.getItem('ca_saathi_bookmarks');
    return saved ? JSON.parse(saved) : ['icai_mod_p3_01', 'icai_mod_p2_01'];
  });

  // Mock test attempt history
  const [testHistory, setTestHistory] = useState<TestAttemptResult[]>(() => {
    const saved = localStorage.getItem('ca_saathi_tests');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        // fallback
      }
    }
    return [
      {
        testId: 'mock_paper3_speed',
        testTitle: {
          en: 'Paper 3: Quantitative Aptitude Speed Test',
          hi: 'पेपर 3: मात्रात्मक योग्यता गति परीक्षा',
        },
        date: '2026-11-07',
        paperId: 'paper3',
        totalQuestions: 6,
        attempted: 6,
        correct: 5,
        incorrect: 1,
        unattempted: 0,
        score: 4.75,
        percentage: 79.2,
        timeSpentSeconds: 420,
        userAnswers: {},
      },
    ];
  });

  // Verified Exam Announcements state
  const [examUpdates, setExamUpdates] = useState<ExamUpdate[]>(MOCK_EXAM_UPDATES);

  // Sync to local storage
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

  // Real-time Firebase Authentication listener
  useEffect(() => {
    const unsubAuth = subscribeToAuthState((profile) => {
      if (profile) {
        setCurrentUser(profile);
      }
    });
    return () => unsubAuth();
  }, []);

  // Real-time user data sync from Firestore
  useEffect(() => {
    if (!currentUser?.id) return;

    const unsubBookmarks = subscribeToUserBookmarks(currentUser.id, (cloudIds) => {
      if (cloudIds.length > 0) setBookmarkedIds(cloudIds);
    });

    const unsubTests = subscribeToUserTestResults(currentUser.id, (cloudTests) => {
      if (cloudTests.length > 0) setTestHistory(cloudTests);
    });

    const unsubTasks = subscribeToUserStudyTasks(currentUser.id, (cloudTasks) => {
      if (cloudTasks.length > 0) setTasks(cloudTasks);
    });

    const unsubAnnouncements = subscribeToExamAnnouncements((cloudUpdates) => {
      if (cloudUpdates.length > 0) setExamUpdates(cloudUpdates);
    });

    return () => {
      unsubBookmarks();
      unsubTests();
      unsubTasks();
      unsubAnnouncements();
    };
  }, [currentUser?.id]);

  // Real-time Firestore sync for Exam Countdown Configuration
  useEffect(() => {
    const unsubExam = subscribeToExamConfig((cloudConfig) => {
      if (cloudConfig) {
        setCountdownConfig(cloudConfig);
        saveExamCountdownConfig(cloudConfig);
      }
    });
    return () => unsubExam();
  }, []);

  // Automated background daily study reminder scheduler
  useEffect(() => {
    // Check on boot
    checkAndTriggerDailyReminder(tasks, streak, language, () => setActiveTab('planner'));

    // Check periodically every 30 seconds
    const interval = setInterval(() => {
      checkAndTriggerDailyReminder(tasks, streak, language, () => setActiveTab('planner'));
    }, 30000);

    // Check on tab focus
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

  // Handler when study session (pomodoro / task) is finished
  const handleStudySessionComplete = (minutes: number) => {
    setStudiedTodayMinutes((prev) => prev + minutes);
  };

  // Handler when a practice question is submitted
  const handleQuestionAnswered = (isCorrect: boolean) => {
    setQuestionsSolvedToday((prev) => prev + 1);
    setTotalQuestionsSolved((prev) => prev + 1);
    // Smoothly update accuracy
    setAccuracyRate((prev) => {
      const next = isCorrect ? Math.min(100, prev + 1) : Math.max(0, prev - 1);
      localStorage.setItem('ca_saathi_accuracy', next.toString());
      return next;
    });
  };

  // Handler when mock test is submitted
  const handleTestCompleted = (result: TestAttemptResult) => {
    setTestHistory((prev) => [result, ...prev]);
    if (currentUser?.id) {
      saveTestResultToDb(currentUser.id, result).catch(console.error);
    }
    setQuestionsSolvedToday((prev) => prev + result.attempted);
    setTotalQuestionsSolved((prev) => prev + result.attempted);
  };

  // Super Admin Check - strictly restricted to ajitsinghca9@gmail.com
  const isSuperAdmin = currentUser?.role === 'admin' && currentUser?.email?.toLowerCase() === 'ajitsinghca9@gmail.com';

  // Real-time membership calculation
  const paymentHistory = currentUser ? getUserPaymentHistory(currentUser.id) : [];
  const membership = getStudentMembershipStatus(currentUser, paymentHistory);

  // Security check: Redirect if non-super-admin tries to navigate to admin tab
  useEffect(() => {
    if (activeTab === 'admin' && !isSuperAdmin) {
      setActiveTab('home');
    }
  }, [activeTab, isSuperAdmin]);

  // Helper to render gated screen if student is not subscribed
  const renderGatedContent = (component: React.ReactNode) => {
    if (!membership.canAccessPremium && !isSuperAdmin) {
      return (
        <MembershipLockScreen
          language={language}
          currentUser={currentUser}
          membershipStatus={membership.status}
          expiresAt={membership.expiresAt}
          onOpenPaymentModal={() => setIsPaymentModalOpen(true)}
          onGoHome={() => setActiveTab('home')}
        />
      );
    }
    return component;
  };

  const pendingTasksCount = tasks.filter((t) => !t.completed).length;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans selection:bg-blue-600 selection:text-white transition-colors duration-200">
      {/* Interactive In-App Notification Banners */}
      <NotificationBanner onOpenPlanner={() => setActiveTab('planner')} />

      {/* Top Navigation */}
      <Navbar
        language={language}
        setLanguage={setLanguage}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        streak={streak}
        studiedTodayMinutes={studiedTodayMinutes}
        currentUser={currentUser}
        onOpenAuthModal={() => setIsAuthModalOpen(true)}
        pendingTasksCount={pendingTasksCount}
        theme={theme}
        onToggleTheme={toggleTheme}
        onOpenPricingModal={() => setIsPricingModalOpen(true)}
        onOpenPaymentModal={() => setIsPaymentModalOpen(true)}
        onOpenReferralModal={() => setIsReferralModalOpen(true)}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 pt-5">
        {activeTab === 'home' && (
          <HomeDashboard
            language={language}
            setActiveTab={setActiveTab}
            setSelectedPaperForPractice={(pId) => {
              setSelectedPaperForPractice(pId);
            }}
            streak={streak}
            studiedTodayMinutes={studiedTodayMinutes}
            dailyGoalMinutes={dailyGoalMinutes}
            questionsSolvedToday={questionsSolvedToday}
            dailyQuestionGoal={dailyQuestionGoal}
            onOpenPaymentModal={() => setIsPaymentModalOpen(true)}
            onOpenReferralModal={() => setIsReferralModalOpen(true)}
            currentUser={currentUser}
            countdownConfig={countdownConfig}
            testHistory={testHistory}
            onOpenAuthModal={() => setIsAuthModalOpen(true)}
          />
        )}

        {/* 1. Daily 10 Practice Challenge */}
        {activeTab === 'dailyChallenge' && renderGatedContent(
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

        {/* 2. AI Doubt Solver with Step-by-Step Guidance */}
        {activeTab === 'doubtSolver' && renderGatedContent(
          <AIDoubtSolverView
            language={language}
            currentUser={currentUser}
          />
        )}

        {/* 3. All India Ranking (AIR Leaderboard) */}
        {activeTab === 'leaderboard' && renderGatedContent(
          <AllIndiaRankingView
            language={language}
            currentUser={currentUser}
          />
        )}

        {activeTab === 'planner' && renderGatedContent(
          <StudyPlannerView
            language={language}
            tasks={tasks}
            setTasks={setTasks}
            onStudySessionComplete={handleStudySessionComplete}
            currentUser={currentUser}
            streak={streak}
          />
        )}

        {activeTab === 'practice' && renderGatedContent(
          <PracticeView
            language={language}
            selectedPaperId={selectedPaperForPractice}
            onQuestionAnswered={handleQuestionAnswered}
            bookmarkedIds={bookmarkedIds}
            setBookmarkedIds={setBookmarkedIds}
            currentUser={currentUser}
          />
        )}

        {activeTab === 'mocks' && renderGatedContent(
          <MockTestView
            language={language}
            onTestCompleted={handleTestCompleted}
            currentUser={currentUser}
            onOpenPaymentModal={() => setIsPaymentModalOpen(true)}
            onOpenReferralModal={() => setIsReferralModalOpen(true)}
          />
        )}

        {activeTab === 'community' && renderGatedContent(
          <CommunityView
            language={language}
            currentUser={currentUser}
          />
        )}

        {activeTab === 'notes' && renderGatedContent(
          <StudyNotesView
            language={language}
          />
        )}

        {activeTab === 'progress' && renderGatedContent(
          <ProgressTrackerView
            language={language}
            streak={streak}
            studiedTodayMinutes={studiedTodayMinutes}
            totalQuestionsSolved={totalQuestionsSolved}
            accuracyRate={accuracyRate}
            testHistory={testHistory}
          />
        )}

        {activeTab === 'updates' && (
          <ExamUpdatesView
            language={language}
          />
        )}

        {activeTab === 'admin' && isSuperAdmin && (
          <AdminPanelView
            language={language}
            currentUser={currentUser}
            setCurrentUser={setCurrentUser}
            examUpdates={examUpdates}
            setExamUpdates={setExamUpdates}
            pricingConfig={pricingConfig}
            setPricingConfig={setPricingConfig}
            countdownConfig={countdownConfig}
            setCountdownConfig={setCountdownConfig}
          />
        )}

        {/* Direct Payment Tab if accessed via URL or link */}
        {activeTab === 'payment' && (
          <div className="py-6 max-w-2xl mx-auto">
            <PaymentModal
              isOpen={true}
              onClose={() => setActiveTab('home')}
              language={language}
              currentUser={currentUser}
              onSuccess={() => {
                setCurrentUser(getCurrentUser());
              }}
            />
          </div>
        )}
      </main>

      {/* Mobile-First Bottom Navigation Bar */}
      <BottomNav
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        language={language}
        hasUnreadUpdates={true}
        currentUser={currentUser}
        onOpenPaymentModal={() => setIsPaymentModalOpen(true)}
        onOpenReferralModal={() => setIsReferralModalOpen(true)}
      />

      {/* User Authentication & Profile Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        language={language}
        currentUser={currentUser}
        setCurrentUser={setCurrentUser}
      />

      {/* Pricing & Free Access Modal */}
      <PricingModal
        isOpen={isPricingModalOpen}
        onClose={() => setIsPricingModalOpen(false)}
        language={language}
        pricingConfig={pricingConfig}
        isAdmin={currentUser.role === 'admin'}
        onOpenAdminPanel={() => setActiveTab('admin')}
      />

      {/* QR Code Payment & Pass Unlock Modal */}
      <PaymentModal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        language={language}
        currentUser={currentUser}
        onSuccess={() => {
          setCurrentUser((prev) => ({
            ...prev,
            hasPaidPass: true,
          }));
        }}
      />

      {/* Referral & Rewards Modal */}
      <ReferralRewardModal
        isOpen={isReferralModalOpen}
        onClose={() => setIsReferralModalOpen(false)}
        language={language}
        currentUser={currentUser}
        onPointsRedeemed={() => {
          setCurrentUser((prev) => ({
            ...prev,
            hasPaidPass: true,
            referralPoints: Math.max(0, (prev.referralPoints || 0) - 100),
          }));
        }}
      />
    </div>
  );
}
