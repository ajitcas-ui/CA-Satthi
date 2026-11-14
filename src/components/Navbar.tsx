import React, { useState, useRef, useEffect } from 'react';
import { AppNotification, ExamAttemptId, Language, NavTab, ThemeMode, UserProfile } from '../types';
import {
  Languages,
  GraduationCap,
  Shield,
  Bell,
  Clock,
  ArrowRight,
  Send,
  Sun,
  Moon,
  Check,
  User,
  Calendar,
} from 'lucide-react';
import { sendTestNotification } from '../utils/notificationService';
import { playChimeSound } from '../utils/audio';
import { canUserAccessAdmin } from '../utils/membershipRules';
import { markNotificationReadInDb } from '../firebase/services';
import { SUPPORTED_EXAM_ATTEMPTS, getAttemptMetadata } from '../utils/examAttempt';

interface NavbarProps {
  language: Language;
  setLanguage: (lang: Language) => void;
  activeTab: NavTab;
  setActiveTab: (tab: NavTab) => void;
  selectedAttempt: ExamAttemptId;
  onChangeAttempt: (attempt: ExamAttemptId) => void;
  streak: number;
  studiedTodayMinutes: number;
  currentUser: UserProfile;
  isEmailVerified?: boolean;
  notifications?: AppNotification[];
  onOpenAuthModal: () => void;
  pendingTasksCount?: number;
  theme: ThemeMode;
  onToggleTheme: () => void;
  onOpenPricingModal: () => void;
  onOpenPaymentModal?: () => void;
  onOpenReferralModal?: () => void;
}

const TAB_TITLES: Record<NavTab, { en: string; hi: string }> = {
  home: { en: 'Student Dashboard', hi: 'विद्यार्थी डैशबोर्ड' },
  practice: { en: 'Practice Arena & PYQs', hi: 'अभ्यास एवं विगत प्रश्न' },
  mocks: { en: 'Mock Test Series', hi: 'मॉक टेस्ट श्रृंखला' },
  notes: { en: 'Revision Notes & Modules', hi: 'रिवीजन नोट्स व मॉड्यूल' },
  planner: { en: '46-Chapter Syllabus & Planner', hi: '46-अध्याय पाठ्यक्रम व प्लानर' },
  progress: { en: 'Study Tracker & Analytics', hi: 'अध्ययन ट्रैकर' },
  dailyChallenge: { en: 'Daily 10 Quiz', hi: 'दैनिक 10 प्रश्न' },
  doubtSolver: { en: 'CA Saathi AI Doubt Solver', hi: 'सीए साथी AI समाधान' },
  leaderboard: { en: 'All India Rankings', hi: 'ऑल इंडिया रैंकिंग' },
  community: { en: 'Common Study Community', hi: 'साझा अध्ययन समुदाय' },
  updates: { en: 'ICAI Updates & Passing Criteria', hi: 'आईसीएआई सूचनाएं' },
  payment: { en: '₹5 UPI Membership', hi: '₹5 यूपीआई सदस्यता' },
  admin: { en: 'Owner Console', hi: 'ओनर कंसोल' },
};

export const Navbar: React.FC<NavbarProps> = ({
  language,
  setLanguage,
  activeTab,
  setActiveTab,
  selectedAttempt,
  onChangeAttempt,
  streak,
  currentUser,
  isEmailVerified = true,
  notifications = [],
  onOpenAuthModal,
  pendingTasksCount = 0,
  theme,
  onToggleTheme,
  onOpenPricingModal,
  onOpenPaymentModal,
}) => {
  const [showNotificationMenu, setShowNotificationMenu] = useState(false);
  const [testSent, setTestSent] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);

  const isGuest = !currentUser || currentUser.id === 'guest';
  const showAdminLink = canUserAccessAdmin(currentUser, isEmailVerified);
  const [localReadBroadcastIds, setLocalReadBroadcastIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('ca_saathi_read_broadcasts');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const isNotifRead = (n: AppNotification) =>
    n.read || (n.recipientId === 'all' && localReadBroadcastIds.includes(n.id));
  const unreadNotifications = notifications.filter((n) => !isNotifRead(n));

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setShowNotificationMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleLanguage = () => {
    setLanguage(language === 'en' ? 'hi' : 'en');
  };

  const handleTestAlert = () => {
    playChimeSound('click');
    sendTestNotification(streak, pendingTasksCount, language, () => {
      setShowNotificationMenu(false);
      setActiveTab('planner');
    });
    setTestSent(true);
    setTimeout(() => setTestSent(false), 3000);
  };

  const activeTitle = TAB_TITLES[activeTab]?.[language] || 'CA Saathi';

  return (
    <header className="sticky top-0 z-40 bg-white/95 dark:bg-[#0B132B]/95 backdrop-blur-md border-b border-slate-200/90 dark:border-[#1E2B4D] transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-2.5 sm:px-6 h-16 flex items-center justify-between gap-1.5 sm:gap-3">
        {/* Zone 1: Mobile Brand Logo OR Desktop Workspace Context */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0 lg:min-w-0">
          <button
            type="button"
            onClick={() => setActiveTab('home')}
            aria-label="CA Saathi Home"
            className="lg:hidden flex items-center gap-2 cursor-pointer select-none shrink-0 whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-600 rounded-lg"
          >
            <span className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#0F2152] to-violet-700 text-white flex items-center justify-center shrink-0">
              <GraduationCap className="w-4 h-4" />
            </span>
            <span className="hidden sm:inline font-bold text-base tracking-tight text-[#0F1E46] dark:text-white whitespace-nowrap">
              CA Saathi
            </span>
          </button>

          <div className="hidden lg:flex items-center gap-2 min-w-0">
            <span className="text-xs font-medium text-slate-400 dark:text-slate-500">
              CA Foundation
            </span>
            <span className="text-slate-300 dark:text-slate-700">/</span>
            <span className="text-sm font-bold text-[#0F1E46] dark:text-white truncate">
              {activeTitle}
            </span>
          </div>
        </div>

        {/* Zone 2: Quick Attempt Switcher (Accessible on all screen sizes) */}
        <div
          role="group"
          aria-label={language === 'en' ? 'Select CA Foundation exam attempt' : 'परीक्षा सत्र चुनें'}
          className="inline-flex items-center gap-1 p-1 rounded-xl bg-slate-100 dark:bg-[#131E3D] border border-slate-200/90 dark:border-[#24335C] shrink-0"
        >
          <Calendar className="w-3.5 h-3.5 text-violet-700 dark:text-violet-400 ml-1.5 hidden sm:block shrink-0" />
          {SUPPORTED_EXAM_ATTEMPTS.map((attempt) => {
            const meta = getAttemptMetadata(attempt);
            const active = selectedAttempt === attempt;
            return (
              <button
                key={attempt}
                type="button"
                onClick={() => {
                  playChimeSound('click');
                  onChangeAttempt(attempt);
                }}
                aria-pressed={active}
                className={`px-2 sm:px-2.5 py-1 rounded-lg text-[10px] sm:text-[11px] font-bold transition-all cursor-pointer whitespace-nowrap ${
                  active
                    ? 'bg-[#172554] dark:bg-violet-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {meta.shortLabel[language]}
              </button>
            );
          })}
        </div>

        {/* Zone 3: Compact Utility Controls & Account Action */}
        <div className="flex items-center gap-1 sm:gap-2 shrink-0">
          {/* Language Switcher */}
          <button
            type="button"
            onClick={toggleLanguage}
            aria-label="Toggle language between English and Hindi"
            className="inline-flex items-center gap-1 px-2 sm:px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-[#24335C] text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-[#142040] text-[11px] sm:text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap shrink-0"
          >
            <Languages className="w-3.5 h-3.5 text-violet-700 dark:text-violet-400 hidden sm:block" />
            <span className="sm:hidden">{language === 'en' ? 'हिं' : 'EN'}</span>
            <span className="hidden sm:inline">{language === 'en' ? 'हिन्दी' : 'ENG'}</span>
          </button>

          {/* Theme Toggle */}
          <button
            type="button"
            onClick={() => {
              playChimeSound('click');
              onToggleTheme();
            }}
            aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
            className="p-1.5 sm:p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#142040] transition-colors cursor-pointer shrink-0"
          >
            {theme === 'dark' ? (
              <Sun className="w-4 h-4 text-amber-400" />
            ) : (
              <Moon className="w-4 h-4 text-[#172554]" />
            )}
          </button>

          {/* Notifications Popover */}
          <div className="relative" ref={notifRef}>
            <button
              type="button"
              onClick={() => setShowNotificationMenu(!showNotificationMenu)}
              className="relative p-1.5 sm:p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#142040] transition-colors cursor-pointer shrink-0"
              aria-label="Notifications and study reminders"
            >
              <Bell className="w-4 h-4" />
              {(unreadNotifications.length > 0 || pendingTasksCount > 0) && (
                <span className="absolute -top-0.5 -right-0.5 min-w-4 h-4 px-1 rounded-full bg-violet-600 text-white text-[10px] font-bold flex items-center justify-center tabular-nums">
                  {unreadNotifications.length > 0 ? unreadNotifications.length : pendingTasksCount}
                </span>
              )}
            </button>

            {showNotificationMenu && (
              <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl bg-white dark:bg-[#0F1936] border border-slate-200 dark:border-[#24335C] shadow-xl p-4 z-50 text-slate-800 dark:text-slate-200">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                  <h4 className="text-xs font-bold text-[#0F1E46] dark:text-white flex items-center gap-1.5">
                    <Bell className="w-3.5 h-3.5 text-violet-600 dark:text-violet-400" />
                    <span>{language === 'en' ? 'Notifications & Reminders' : 'सूचनाएं एवं रिमाइंडर'}</span>
                  </h4>
                  <span className="text-xs text-slate-500 dark:text-slate-400 tabular-nums">
                    {streak}d streak
                  </span>
                </div>

                <div className="py-3 space-y-2.5 max-h-64 overflow-y-auto">
                  {notifications.length > 0 && (
                    <div className="space-y-2">
                      {notifications.slice(0, 4).map((n) => {
                        const alreadyRead = isNotifRead(n);
                        return (
                          <div
                            key={n.id}
                            className={`p-2.5 rounded-xl border text-xs ${
                              alreadyRead
                                ? 'bg-slate-50/70 dark:bg-slate-900/40 border-slate-200/70 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                                : 'bg-violet-50/70 dark:bg-violet-950/30 border-violet-200 dark:border-violet-800 text-slate-800 dark:text-slate-100'
                            }`}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <p className="font-semibold">{n.title}</p>
                              {!alreadyRead && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (n.recipientId === 'all') {
                                      setLocalReadBroadcastIds((prev) => {
                                        const next = [...prev, n.id];
                                        localStorage.setItem('ca_saathi_read_broadcasts', JSON.stringify(next));
                                        return next;
                                      });
                                    } else {
                                      markNotificationReadInDb(n.id);
                                    }
                                  }}
                                  className="text-[11px] text-violet-700 dark:text-violet-400 hover:underline shrink-0 flex items-center gap-0.5 cursor-pointer"
                                >
                                  <Check className="w-3 h-3" />
                                  <span>Read</span>
                                </button>
                              )}
                            </div>
                            <p className="text-[11px] mt-0.5 opacity-90">{n.message}</p>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#131E3D] border border-slate-200/80 dark:border-[#24335C]">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium text-slate-700 dark:text-slate-300">
                        {language === 'en' ? "Today's Study Targets" : 'आज के अध्ययन लक्ष्य'}
                      </span>
                      <span className="font-semibold text-violet-700 dark:text-violet-400 tabular-nums">
                        {pendingTasksCount} {language === 'en' ? 'Pending' : 'शेष'}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                      {pendingTasksCount > 0
                        ? language === 'en'
                          ? 'Complete pending chapters today to protect your daily streak.'
                          : 'अपनी स्ट्रीक जारी रखने के लिए आज के लक्ष्य पूरे करें।'
                        : language === 'en'
                          ? 'All study targets completed for today.'
                          : 'आज के सभी अध्ययन लक्ष्य पूरे हो चुके हैं।'}
                    </p>
                  </div>

                  <div className="flex items-center justify-between text-xs px-1 text-slate-600 dark:text-slate-400">
                    <span className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-violet-600 dark:text-violet-400" />
                      <span>{language === 'en' ? 'Daily Alert: 8:00 PM' : 'दैनिक अलर्ट: रात्रि 8:00 बजे'}</span>
                    </span>
                    <button
                      type="button"
                      onClick={handleTestAlert}
                      className="text-xs font-semibold text-violet-700 dark:text-violet-400 hover:underline cursor-pointer flex items-center gap-1"
                    >
                      <Send className="w-3 h-3" />
                      <span>{testSent ? (language === 'en' ? 'Sent' : 'भेजा गया') : (language === 'en' ? 'Test' : 'परीक्षण')}</span>
                    </button>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => {
                      setShowNotificationMenu(false);
                      onOpenPricingModal();
                    }}
                    className="text-xs text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 cursor-pointer"
                  >
                    {language === 'en' ? 'Membership Info' : 'सदस्यता जानकारी'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowNotificationMenu(false);
                      setActiveTab('progress');
                    }}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#172554] hover:bg-[#1E3A8A] text-white text-xs font-semibold transition-colors cursor-pointer"
                  >
                    <span>{language === 'en' ? 'Study Tracker' : 'स्टडी ट्रैकर'}</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Primary Action: Owner Console OR Student ₹5 Pass */}
          {showAdminLink ? (
            <button
              type="button"
              onClick={() => {
                playChimeSound('click');
                setActiveTab('admin');
              }}
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-violet-700 hover:bg-violet-800 text-white text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap shrink-0"
            >
              <Shield className="w-3.5 h-3.5" />
              <span>{language === 'en' ? 'Owner Dashboard' : 'ओनर डैशबोर्ड'}</span>
            </button>
          ) : (
            onOpenPaymentModal && (
              <button
                type="button"
                onClick={() => {
                  playChimeSound('click');
                  onOpenPaymentModal();
                }}
                className="hidden sm:inline-flex items-center px-3 py-1.5 rounded-xl bg-violet-700 hover:bg-violet-800 text-white text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap shrink-0"
              >
                {language === 'en' ? '₹5 Pass' : '₹5 पास'}
              </button>
            )
          )}

          <button
            type="button"
            onClick={onOpenAuthModal}
            className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1.5 rounded-xl border border-slate-200 dark:border-[#24335C] bg-white dark:bg-[#131E3D] hover:bg-slate-50 dark:hover:bg-[#1B2952] text-[#0F1E46] dark:text-slate-100 text-[11px] sm:text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap shrink-0"
          >
            <User className="w-3.5 h-3.5 text-violet-700 dark:text-violet-400 shrink-0" />
            <span className="truncate max-w-[78px] sm:max-w-[90px]">
              {isGuest ? (language === 'en' ? 'Sign In' : 'लॉगिन') : currentUser.name.split(' ')[0]}
            </span>
          </button>
        </div>
      </div>
    </header>
  );
};
