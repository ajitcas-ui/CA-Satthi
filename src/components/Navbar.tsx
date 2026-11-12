import React, { useState, useRef, useEffect } from 'react';
import { Language, NavTab, UserProfile, ThemeMode } from '../types';
import { 
  Flame, 
  Languages, 
  GraduationCap, 
  Calendar, 
  Sparkles,
  BookOpen,
  Users,
  Shield,
  UserCheck,
  Bell,
  Clock,
  ArrowRight,
  Send,
  Sun,
  Moon,
  Sparkle,
  CheckCircle2,
  Tag
} from 'lucide-react';
import { 
  getNotificationSettings, 
  getNotificationPermission, 
  sendTestNotification, 
  requestNotificationPermission 
} from '../utils/notificationService';
import { playChimeSound } from '../utils/audio';

interface NavbarProps {
  language: Language;
  setLanguage: (lang: Language) => void;
  activeTab: NavTab;
  setActiveTab: (tab: NavTab) => void;
  streak: number;
  studiedTodayMinutes: number;
  currentUser: UserProfile;
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
  onOpenAuthModal,
  pendingTasksCount = 0,
  theme,
  onToggleTheme,
  onOpenPricingModal,
  onOpenPaymentModal,
  onOpenReferralModal,
}) => {
  const [showNotificationMenu, setShowNotificationMenu] = useState(false);
  const [testSent, setTestSent] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);

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

  return (
    <header className="sticky top-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800 shadow-xs transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 h-16 flex items-center justify-between">
        {/* Brand / Logo */}
        <div 
          onClick={() => setActiveTab('home')}
          className="flex items-center gap-2.5 cursor-pointer group select-none shrink-0"
        >
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-tr from-blue-700 via-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20 group-hover:scale-105 transition-transform">
            <GraduationCap className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-lg sm:text-xl tracking-tight text-slate-900 dark:text-white">
                CA <span className="text-blue-600 dark:text-blue-400">Saathi</span>
              </span>
              <span className="text-[10px] sm:text-xs px-1.5 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 font-semibold border border-blue-200 dark:border-blue-800">
                सीए साथी
              </span>
            </div>
            <p className="text-[10px] sm:text-[11px] font-medium text-slate-500 dark:text-slate-400 leading-tight hidden xs:block">
              {language === 'en' ? 'CA Foundation Prep & Community' : 'सीए फाउंडेशन तैयारी एवं कम्युनिटी'}
            </p>
          </div>
        </div>

        {/* Desktop Navigation Links */}
        <nav className="hidden xl:flex items-center gap-1 text-sm font-medium text-slate-600 dark:text-slate-300">
          <button
            onClick={() => setActiveTab('home')}
            className={`px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer ${
              activeTab === 'home' 
                ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 font-semibold' 
                : 'hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-50 dark:hover:bg-slate-800/60'
            }`}
          >
            {language === 'en' ? 'Dashboard' : 'डैशबोर्ड'}
          </button>
          <button
            onClick={() => setActiveTab('planner')}
            className={`px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer ${
              activeTab === 'planner' 
                ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 font-semibold' 
                : 'hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-50 dark:hover:bg-slate-800/60'
            }`}
          >
            {language === 'en' ? 'Planner' : 'प्लानर'}
          </button>

          {/* Daily 10 Challenge */}
          <button
            onClick={() => setActiveTab('dailyChallenge')}
            className={`px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'dailyChallenge' 
                ? 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 font-bold border border-amber-200 dark:border-amber-800' 
                : 'hover:text-amber-600 dark:hover:text-amber-400 hover:bg-slate-50 dark:hover:bg-slate-800/60'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-500 animate-spin-slow" />
            <span>{language === 'en' ? 'Daily 10' : 'दैनिक 10'}</span>
          </button>

          {/* AI Doubt Solver */}
          <button
            onClick={() => setActiveTab('doubtSolver')}
            className={`px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'doubtSolver' 
                ? 'bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 font-bold border border-purple-200 dark:border-purple-800' 
                : 'hover:text-purple-600 dark:hover:text-purple-400 hover:bg-slate-50 dark:hover:bg-slate-800/60'
            }`}
          >
            <Sparkle className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
            <span>{language === 'en' ? 'AI Solver' : 'एआई सॉल्वर'}</span>
          </button>

          <button
            onClick={() => setActiveTab('practice')}
            className={`px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer ${
              activeTab === 'practice' 
                ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 font-semibold' 
                : 'hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-50 dark:hover:bg-slate-800/60'
            }`}
          >
            {language === 'en' ? 'Practice' : 'अभ्यास'}
          </button>
          <button
            onClick={() => setActiveTab('mocks')}
            className={`px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer ${
              activeTab === 'mocks' 
                ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 font-semibold' 
                : 'hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-50 dark:hover:bg-slate-800/60'
            }`}
          >
            {language === 'en' ? 'Mocks' : 'मॉक टेस्ट'}
          </button>

          {/* AIR Rankings */}
          <button
            onClick={() => setActiveTab('leaderboard')}
            className={`px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer ${
              activeTab === 'leaderboard' 
                ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 font-semibold' 
                : 'hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-50 dark:hover:bg-slate-800/60'
            }`}
          >
            {language === 'en' ? 'AIR Rankings' : 'रैंकिंग'}
          </button>

          <button
            onClick={() => setActiveTab('community')}
            className={`px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer flex items-center gap-1 ${
              activeTab === 'community' 
                ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 font-semibold' 
                : 'hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-50 dark:hover:bg-slate-800/60'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>{language === 'en' ? 'Community' : 'कम्युनिटी'}</span>
          </button>

          <button
            onClick={() => setActiveTab('notes')}
            className={`px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer ${
              activeTab === 'notes' 
                ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 font-semibold' 
                : 'hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-50 dark:hover:bg-slate-800/60'
            }`}
          >
            {language === 'en' ? 'Notes' : 'नोट्स'}
          </button>

          <button
            onClick={() => setActiveTab('updates')}
            className={`px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer ${
              activeTab === 'updates' 
                ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 font-semibold' 
                : 'hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-50 dark:hover:bg-slate-800/60'
            }`}
          >
            {language === 'en' ? 'Updates' : 'अपडेट्स'}
          </button>

          {/* Super Admin Dashboard link - strictly restricted to authorized administrator ajitsinghca9@gmail.com */}
          {currentUser?.role === 'admin' && currentUser?.email?.toLowerCase() === 'ajitsinghca9@gmail.com' && (
            <button
              onClick={() => setActiveTab('admin')}
              className={`px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer flex items-center gap-1 ${
                activeTab === 'admin' 
                  ? 'bg-purple-600 text-white font-bold' 
                  : 'text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-950/60 font-semibold'
              }`}
            >
              <Shield className="w-3.5 h-3.5" />
              <span>{language === 'en' ? 'Super Admin' : 'सुपर एडमिन'}</span>
            </button>
          )}
        </nav>

        {/* Right side widgets: Referrals, UPI QR Pay, Notifications, Theme, Language, Profile */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Referral & Rewards Button */}
          {onOpenReferralModal && (
            <button
              onClick={() => {
                playChimeSound('click');
                onOpenReferralModal();
              }}
              className="flex items-center gap-1 px-2 sm:px-2.5 py-1 rounded-full bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300 text-xs font-bold hover:scale-105 transition-transform cursor-pointer"
              title={language === 'en' ? 'Refer Friends & Earn Reward Points' : 'मित्रों को रेफर करें व अंक पाएं'}
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span className="hidden sm:inline">{language === 'en' ? 'Rewards' : 'इनाम'}</span>
              <span className="px-1.5 py-0.2 rounded-full bg-amber-200 dark:bg-amber-900/80 text-[10px] font-black">
                {currentUser.referralPoints || 0}
              </span>
            </button>
          )}

          {/* UPI QR Pay Button */}
          {onOpenPaymentModal && (
            <button
              onClick={() => {
                playChimeSound('click');
                onOpenPaymentModal();
              }}
              className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs hover:scale-105 transition-all cursor-pointer"
              title={language === 'en' ? 'Scan & Pay via UPI QR (₹5 Default)' : 'यूपीआई क्यूआर से भुगतान (₹5)'}
            >
              <span className="font-mono">₹5</span>
              <span>{language === 'en' ? 'Pass' : 'पास'}</span>
            </button>
          )}

          {/* Notification Bell Dropdown */}
          <div className="relative" ref={notifRef}>
            <button
              onClick={() => setShowNotificationMenu(!showNotificationMenu)}
              className="relative p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              aria-label="Study Target Notifications"
              title={language === 'en' ? 'Study Target Notifications' : 'अध्ययन अनुस्मारक'}
            >
              <Bell className="w-4 h-4" />
              {pendingTasksCount > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-amber-500 text-white text-[10px] font-black flex items-center justify-center animate-pulse">
                  {pendingTasksCount}
                </span>
              )}
            </button>

            {/* Notification Menu Popover */}
            {showNotificationMenu && (
              <div className="absolute right-0 mt-2 w-80 sm:w-88 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-4 z-50 text-slate-800 dark:text-slate-200 animate-in fade-in slide-in-from-top-2">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-2">
                    <Bell className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                      {language === 'en' ? 'Study Reminders & Alerts' : 'अध्ययन रिमाइंडर व सूचनाएं'}
                    </h4>
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 text-[10px] font-bold">
                    {streak}d Streak
                  </span>
                </div>

                <div className="py-3 space-y-2.5">
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-700 dark:text-slate-300">
                        {language === 'en' ? "Today's Study Targets" : 'आज के अध्ययन लक्ष्य'}
                      </span>
                      <span className="font-bold text-blue-600 dark:text-blue-400">
                        {pendingTasksCount} {language === 'en' ? 'Pending' : 'शेष'}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                      {pendingTasksCount > 0
                        ? (language === 'en'
                            ? 'Complete your targets before midnight to maintain your study streak!'
                            : 'अपनी स्ट्रीक जारी रखने के लिए आज ही लक्ष्य पूरे करें!')
                        : (language === 'en'
                            ? 'All study targets completed for today! Awesome!'
                            : 'आज के सभी लक्ष्य पूर्ण हो चुके हैं! शाबाश!')}
                    </p>
                  </div>

                  <div className="flex items-center justify-between text-xs px-1 text-slate-600 dark:text-slate-400">
                    <span className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-blue-500" />
                      <span>{language === 'en' ? 'Daily Alert: 08:00 PM' : 'दैनिक अलर्ट: रात्रि 8:00 बजे'}</span>
                    </span>
                    <button
                      onClick={handleTestAlert}
                      className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer flex items-center gap-1"
                    >
                      <Send className="w-3 h-3" />
                      <span>{testSent ? (language === 'en' ? 'Sent!' : 'भेजा गया!') : (language === 'en' ? 'Test Alert' : 'परीक्षण')}</span>
                    </button>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <button
                    onClick={() => {
                      setShowNotificationMenu(false);
                      onOpenPricingModal();
                    }}
                    className="text-[11px] text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
                  >
                    {language === 'en' ? 'Pricing Pass Info' : 'पास जानकारी'}
                  </button>

                  <button
                    onClick={() => {
                      setShowNotificationMenu(false);
                      setActiveTab('planner');
                    }}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-colors cursor-pointer"
                  >
                    <span>{language === 'en' ? 'Open Study Planner' : 'प्लानर खोलें'}</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Dark / Light Mode Toggle Button */}
          <button
            onClick={() => {
              playChimeSound('click');
              onToggleTheme();
            }}
            aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
            title={language === 'en' ? `Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode` : (theme === 'dark' ? 'लाइट मोड चालू करें' : 'डार्क मोड चालू करें')}
            className="p-2 rounded-xl text-slate-600 dark:text-amber-400 hover:bg-slate-100 dark:hover:bg-slate-800 border border-transparent dark:border-slate-700 transition-all cursor-pointer"
          >
            {theme === 'dark' ? (
              <Sun className="w-4 h-4 text-amber-400 animate-spin-slow" />
            ) : (
              <Moon className="w-4 h-4 text-slate-700" />
            )}
          </button>

          {/* Streak pill */}
          <div 
            title={language === 'en' ? `${streak} Days Study Streak!` : `${streak} दिनों की सतत पढ़ाई!`}
            className="hidden sm:flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300 text-xs font-bold"
          >
            <Flame className="w-4 h-4 text-amber-500 fill-amber-500 animate-pulse" />
            <span>{streak}</span>
            <span className="font-normal text-amber-700 dark:text-amber-400">
              {language === 'en' ? 'd' : 'दिन'}
            </span>
          </div>

          {/* Bilingual Language Switcher Button */}
          <button
            onClick={toggleLanguage}
            aria-label="Toggle language between English and Hindi"
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 dark:hover:bg-blue-900/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 text-xs font-bold transition-all cursor-pointer"
          >
            <Languages className="w-3.5 h-3.5" />
            <span>{language === 'en' ? 'हिन्दी' : 'ENG'}</span>
          </button>

          {/* User Account / Profile Chip */}
          <button
            onClick={onOpenAuthModal}
            className="flex items-center gap-2 p-1.5 sm:px-2.5 sm:py-1 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-blue-400 dark:hover:border-blue-500 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all cursor-pointer shadow-2xs"
            title={language === 'en' ? 'Student Profile & Accounts' : 'विद्यार्थी प्रोफ़ाइल एवं खाते'}
          >
            <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-blue-100 to-indigo-100 dark:from-blue-950 dark:to-indigo-950 flex items-center justify-center text-sm shrink-0">
              {currentUser.avatar || '🎓'}
            </div>
            <div className="hidden sm:block text-left">
              <div className="flex items-center gap-1">
                <span className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate max-w-[85px]">
                  {currentUser.name.split(' ')[0]}
                </span>
                {currentUser?.role === 'admin' && currentUser?.email?.toLowerCase() === 'ajitsinghca9@gmail.com' && (
                  <span className="text-[9px] font-black uppercase px-1 rounded-xs bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300">
                    ADM
                  </span>
                )}
              </div>
              <span className="text-[10px] text-slate-500 dark:text-slate-400 block leading-tight">
                {currentUser.targetAttempt}
              </span>
            </div>
          </button>
        </div>
      </div>
    </header>
  );
};
