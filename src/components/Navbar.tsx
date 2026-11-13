import React, { useState, useRef, useEffect } from 'react';
import { AppNotification, Language, NavTab, ThemeMode, UserProfile } from '../types';
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
} from 'lucide-react';
import { sendTestNotification } from '../utils/notificationService';
import { playChimeSound } from '../utils/audio';
import { canUserAccessAdmin } from '../utils/membershipRules';
import { markNotificationReadInDb } from '../firebase/services';

interface NavbarProps {
  language: Language;
  setLanguage: (lang: Language) => void;
  activeTab: NavTab;
  setActiveTab: (tab: NavTab) => void;
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

export const Navbar: React.FC<NavbarProps> = ({
  language,
  setLanguage,
  activeTab,
  setActiveTab,
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

  const navLinks: Array<{ id: NavTab; label: string }> = [
    { id: 'home', label: language === 'en' ? 'Dashboard' : 'डैशबोर्ड' },
    { id: 'practice', label: language === 'en' ? 'Practice' : 'अभ्यास' },
    { id: 'mocks', label: language === 'en' ? 'Mocks' : 'मॉक टेस्ट' },
    { id: 'planner', label: language === 'en' ? 'Syllabus' : 'पाठ्यक्रम' },
    { id: 'community', label: language === 'en' ? 'Community' : 'कम्युनिटी' },
  ];

  return (
    <header className="sticky top-0 z-40 bg-white/98 dark:bg-slate-900/98 border-b border-slate-200 dark:border-slate-800 transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-6">
        {/* Zone 1: Brand Wordmark Only */}
        <button
          type="button"
          onClick={() => setActiveTab('home')}
          className="flex items-center gap-2.5 cursor-pointer group select-none shrink-0 whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 rounded-lg"
        >
          <span className="w-8 h-8 rounded-lg bg-blue-700 text-white flex items-center justify-center shrink-0">
            <GraduationCap className="w-5 h-5" />
          </span>
          <span className="font-bold text-lg tracking-tight text-slate-900 dark:text-white whitespace-nowrap">
            CA Saathi
          </span>
        </button>

        {/* Zone 2: Clean Single-Line Navigation Links */}
        <nav aria-label="Primary navigation" className="hidden lg:flex items-center gap-6 text-sm font-medium text-slate-600 dark:text-slate-300">
          {navLinks.map((link) => {
            const isActive = activeTab === link.id;
            return (
              <button
                key={link.id}
                type="button"
                onClick={() => setActiveTab(link.id)}
                className={`py-1.5 border-b-2 transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                  isActive
                    ? 'border-blue-600 text-blue-700 dark:text-blue-400 font-semibold'
                    : 'border-transparent hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {link.label}
              </button>
            );
          })}

          {showAdminLink && (
            <button
              type="button"
              onClick={() => setActiveTab('admin')}
              className={`py-1.5 border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
                activeTab === 'admin'
                  ? 'border-indigo-600 text-indigo-700 dark:text-indigo-400 font-semibold'
                  : 'border-transparent text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300'
              }`}
            >
              <Shield className="w-3.5 h-3.5" />
              <span>{language === 'en' ? 'Owner Console' : 'ओनर कंसोल'}</span>
            </button>
          )}
        </nav>

        {/* Zone 3: Compact Utility Controls & Account Action */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Language Switcher */}
          <button
            type="button"
            onClick={toggleLanguage}
            aria-label="Toggle language between English and Hindi"
            className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-medium transition-colors cursor-pointer whitespace-nowrap shrink-0"
          >
            <Languages className="w-3.5 h-3.5" />
            <span>{language === 'en' ? 'हिन्दी' : 'ENG'}</span>
          </button>

          {/* Theme Toggle */}
          <button
            type="button"
            onClick={() => {
              playChimeSound('click');
              onToggleTheme();
            }}
            aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
            className="p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer shrink-0"
          >
            {theme === 'dark' ? (
              <Sun className="w-4 h-4 text-amber-400" />
            ) : (
              <Moon className="w-4 h-4 text-slate-700" />
            )}
          </button>

          {/* Notifications Popover */}
          <div className="relative" ref={notifRef}>
            <button
              type="button"
              onClick={() => setShowNotificationMenu(!showNotificationMenu)}
              className="relative p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer shrink-0"
              aria-label="Notifications and study reminders"
            >
              <Bell className="w-4 h-4" />
              {(unreadNotifications.length > 0 || pendingTasksCount > 0) && (
                <span className="absolute -top-0.5 -right-0.5 min-w-4 h-4 px-1 rounded-full bg-blue-600 text-white text-[10px] font-bold flex items-center justify-center tabular-nums">
                  {unreadNotifications.length > 0 ? unreadNotifications.length : pendingTasksCount}
                </span>
              )}
            </button>

            {showNotificationMenu && (
              <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl p-4 z-50 text-slate-800 dark:text-slate-200">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                  <h4 className="text-xs font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <Bell className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
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
                            className={`p-2.5 rounded-lg border text-xs ${
                              alreadyRead
                                ? 'bg-slate-50/60 dark:bg-slate-800/40 border-slate-200/70 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                                : 'bg-blue-50/70 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800 text-slate-800 dark:text-slate-100'
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
                                  className="text-[11px] text-blue-600 dark:text-blue-400 hover:underline shrink-0 flex items-center gap-0.5 cursor-pointer"
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

                  <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium text-slate-700 dark:text-slate-300">
                        {language === 'en' ? "Today's Study Targets" : 'आज के अध्ययन लक्ष्य'}
                      </span>
                      <span className="font-semibold text-blue-600 dark:text-blue-400 tabular-nums">
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
                      <Clock className="w-3.5 h-3.5 text-blue-500" />
                      <span>{language === 'en' ? 'Daily Alert: 8:00 PM' : 'दैनिक अलर्ट: रात्रि 8:00 बजे'}</span>
                    </span>
                    <button
                      type="button"
                      onClick={handleTestAlert}
                      className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer flex items-center gap-1"
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
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition-colors cursor-pointer"
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
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap shrink-0"
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
                className="hidden sm:inline-flex items-center px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap shrink-0"
              >
                {language === 'en' ? '₹5 Pass' : '₹5 पास'}
              </button>
            )
          )}

          <button
            type="button"
            onClick={onOpenAuthModal}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-100 text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap shrink-0"
          >
            <User className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
            <span className="truncate max-w-[100px]">
              {isGuest ? (language === 'en' ? 'Sign In' : 'लॉगिन') : currentUser.name.split(' ')[0]}
            </span>
          </button>
        </div>
      </div>
    </header>
  );
};
