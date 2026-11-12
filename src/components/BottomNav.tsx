import React, { useState } from 'react';
import { Language, NavTab, UserProfile } from '../types';
import { 
  Home, 
  Sparkles, 
  Sparkle, 
  HelpCircle, 
  Award, 
  Trophy, 
  Users, 
  CalendarCheck, 
  FileText, 
  Bell, 
  Shield, 
  MoreHorizontal, 
  X,
  CreditCard,
  Gift
} from 'lucide-react';

interface BottomNavProps {
  activeTab: NavTab;
  setActiveTab: (tab: NavTab) => void;
  language: Language;
  hasUnreadUpdates?: boolean;
  currentUser?: UserProfile;
  onOpenPaymentModal?: () => void;
  onOpenReferralModal?: () => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  activeTab,
  setActiveTab,
  language,
  hasUnreadUpdates = true,
  currentUser,
  onOpenPaymentModal,
  onOpenReferralModal,
}) => {
  const [showMoreSheet, setShowMoreSheet] = useState(false);

  const primaryItems = [
    {
      id: 'home' as NavTab,
      label: { en: 'Home', hi: 'होम' },
      icon: Home,
    },
    {
      id: 'dailyChallenge' as NavTab,
      label: { en: 'Daily 10', hi: 'दैनिक 10' },
      icon: Sparkles,
      highlight: true,
    },
    {
      id: 'doubtSolver' as NavTab,
      label: { en: 'AI Solver', hi: 'एआई सॉल्वर' },
      icon: Sparkle,
      highlight: true,
    },
    {
      id: 'practice' as NavTab,
      label: { en: 'Practice', hi: 'अभ्यास' },
      icon: HelpCircle,
    },
  ];

  const secondaryItems = [
    {
      id: 'mocks' as NavTab,
      label: { en: 'Mock Tests', hi: 'मॉक टेस्ट' },
      description: { en: 'Real exam timer & speed tests', hi: 'वास्तविक परीक्षा टाइमर' },
      icon: Award,
    },
    {
      id: 'leaderboard' as NavTab,
      label: { en: 'AIR Rankings', hi: 'ऑल इंडिया रैंकिंग' },
      description: { en: 'National leaderboard & badges', hi: 'देशव्यापी रैंकिंग व पदक' },
      icon: Trophy,
    },
    {
      id: 'community' as NavTab,
      label: { en: 'Community Hub', hi: 'कम्युनिटी हब' },
      description: { en: '7 active study groups & doubt chat', hi: 'विषयवार ग्रुप व परिचर्चा' },
      icon: Users,
    },
    {
      id: 'planner' as NavTab,
      label: { en: 'Study Planner', hi: 'स्टडी प्लानर' },
      description: { en: 'Daily targets & Pomodoro clock', hi: 'दैनिक लक्ष्य एवं पोमोडोरो' },
      icon: CalendarCheck,
    },
    {
      id: 'notes' as NavTab,
      label: { en: 'Study Notes', hi: 'स्टडी नोट्स' },
      description: { en: 'Key formulas & mnemonics', hi: 'महत्वपूर्ण सूत्र व संक्षेप' },
      icon: FileText,
    },
    {
      id: 'updates' as NavTab,
      label: { en: 'ICAI Updates', hi: 'आईसीएआई अपडेट्स' },
      description: { en: 'Official notifications & dates', hi: 'आधिकारिक सूचनाएं व तिथियां' },
      icon: Bell,
      hasBadge: hasUnreadUpdates,
    },
  ];

  // Super Admin item - strictly restricted to authorized administrator ajitsinghca9@gmail.com
  if (currentUser?.role === 'admin' && currentUser?.email?.toLowerCase() === 'ajitsinghca9@gmail.com') {
    secondaryItems.push({
      id: 'admin' as NavTab,
      label: { en: 'Super Admin', hi: 'सुपर एडमिन' },
      description: { en: 'Manage payments, students, questions & reports', hi: 'भुगतान, छात्र, प्रश्न एवं रिपोर्ट नियंत्रण' },
      icon: Shield,
    });
  }

  const isSecondaryActive = secondaryItems.some((item) => item.id === activeTab);

  const handleSelectTab = (tab: NavTab) => {
    setActiveTab(tab);
    setShowMoreSheet(false);
  };

  return (
    <>
      {/* Mobile Bottom Navigation Bar */}
      <nav 
        aria-label="Mobile navigation" 
        className="xl:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 px-2 py-1 shadow-lg transition-colors duration-200"
      >
        <div className="flex items-center justify-between max-w-lg mx-auto">
          {primaryItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleSelectTab(item.id)}
                className={`flex flex-col items-center justify-center flex-1 py-1 px-1 rounded-lg transition-all relative cursor-pointer ${
                  isActive 
                    ? 'text-blue-700 dark:text-blue-400 font-bold' 
                    : item.highlight
                      ? 'text-purple-600 dark:text-purple-400 font-semibold'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 font-medium'
                }`}
              >
                <div className="relative">
                  <Icon 
                    className={`w-5 h-5 transition-transform ${
                      isActive ? 'scale-110 text-blue-600 dark:text-blue-400 stroke-[2.4]' : 'stroke-[1.8]'
                    }`} 
                  />
                  {item.highlight && !isActive && (
                    <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                  )}
                </div>
                <span className={`text-[10px] mt-0.5 tracking-tight truncate max-w-[58px] ${
                  isActive ? 'font-bold' : ''
                }`}>
                  {item.label[language]}
                </span>
                {isActive && (
                  <div className="w-4 h-0.5 bg-blue-600 dark:bg-blue-400 rounded-full mt-0.5" />
                )}
              </button>
            );
          })}

          {/* More Menu Trigger */}
          <button
            onClick={() => setShowMoreSheet(true)}
            className={`flex flex-col items-center justify-center flex-1 py-1 px-1 rounded-lg transition-all relative cursor-pointer ${
              isSecondaryActive 
                ? 'text-blue-700 dark:text-blue-400 font-bold' 
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 font-medium'
            }`}
          >
            <div className="relative">
              <MoreHorizontal className={`w-5 h-5 ${isSecondaryActive ? 'stroke-[2.4]' : 'stroke-[1.8]'}`} />
              {hasUnreadUpdates && (
                <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-red-500 ring-1 ring-white dark:ring-slate-900" />
              )}
            </div>
            <span className="text-[10px] mt-0.5 tracking-tight font-medium">
              {language === 'en' ? 'More' : 'अन्य'}
            </span>
            {isSecondaryActive && (
              <div className="w-4 h-0.5 bg-blue-600 dark:bg-blue-400 rounded-full mt-0.5" />
            )}
          </button>
        </div>
      </nav>

      {/* Expanded "More" Bottom Sheet for Mobile */}
      {showMoreSheet && (
        <div className="xl:hidden fixed inset-0 z-50 flex flex-col justify-end">
          {/* Backdrop */}
          <div 
            onClick={() => setShowMoreSheet(false)}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity animate-in fade-in"
          />

          {/* Content Sheet */}
          <div className="relative z-10 bg-white dark:bg-slate-900 rounded-t-3xl border-t border-slate-200 dark:border-slate-800 p-5 shadow-2xl max-h-[85vh] overflow-y-auto animate-in slide-in-from-bottom duration-200">
            {/* Sheet Handle */}
            <div className="w-12 h-1.5 rounded-full bg-slate-200 dark:bg-slate-700 mx-auto mb-4" />

            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                {language === 'en' ? 'All Learning Modules' : 'सभी अध्ययन मॉड्यूल'}
              </h3>
              <button
                onClick={() => setShowMoreSheet(false)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick action banners for Payments & Referrals in sheet */}
            <div className="grid grid-cols-2 gap-2.5 my-3">
              {onOpenPaymentModal && (
                <button
                  onClick={() => {
                    setShowMoreSheet(false);
                    onOpenPaymentModal();
                  }}
                  className="flex items-center gap-2 p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-left hover:scale-[1.02] transition-transform"
                >
                  <CreditCard className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <div>
                    <span className="text-xs font-bold text-emerald-800 dark:text-emerald-200 block">
                      {language === 'en' ? 'UPI Pass (₹5)' : 'यूपीआई पास (₹5)'}
                    </span>
                    <span className="text-[10px] text-emerald-600 dark:text-emerald-400">
                      {language === 'en' ? 'Scan & Unlock' : 'स्कैन व अनलॉक'}
                    </span>
                  </div>
                </button>
              )}

              {onOpenReferralModal && (
                <button
                  onClick={() => {
                    setShowMoreSheet(false);
                    onOpenReferralModal();
                  }}
                  className="flex items-center gap-2 p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-left hover:scale-[1.02] transition-transform"
                >
                  <Gift className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                  <div>
                    <span className="text-xs font-bold text-amber-800 dark:text-amber-200 block">
                      {language === 'en' ? 'Refer & Earn' : 'रेफर व अंक'}
                    </span>
                    <span className="text-[10px] text-amber-600 dark:text-amber-400">
                      {currentUser?.referralPoints || 0} pts
                    </span>
                  </div>
                </button>
              )}
            </div>

            {/* Grid of Secondary Modules */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 py-2">
              {secondaryItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleSelectTab(item.id)}
                    className={`flex items-center gap-3 p-3 rounded-xl border text-left transition-all ${
                      isActive
                        ? 'bg-blue-50 dark:bg-blue-950/60 border-blue-300 dark:border-blue-700'
                        : 'bg-slate-50/70 dark:bg-slate-800/40 border-slate-200/80 dark:border-slate-700/60 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                      isActive 
                        ? 'bg-blue-600 text-white shadow-xs' 
                        : 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-300 border border-slate-200 dark:border-slate-600'
                    }`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-900 dark:text-white truncate">
                          {item.label[language]}
                        </span>
                        {item.hasBadge && (
                          <span className="w-2 h-2 rounded-full bg-red-500 shrink-0" />
                        )}
                      </div>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                        {item.description[language]}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </>
  );
};
