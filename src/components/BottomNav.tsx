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
  Gift,
  BarChart3,
} from 'lucide-react';
import { canUserAccessAdmin } from '../utils/membershipRules';

interface BottomNavProps {
  activeTab: NavTab;
  setActiveTab: (tab: NavTab) => void;
  language: Language;
  hasUnreadUpdates?: boolean;
  currentUser?: UserProfile;
  isEmailVerified?: boolean;
  onOpenPaymentModal?: () => void;
  onOpenReferralModal?: () => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  activeTab,
  setActiveTab,
  language,
  hasUnreadUpdates = true,
  currentUser,
  isEmailVerified = true,
  onOpenPaymentModal,
  onOpenReferralModal,
}) => {
  const [showMoreSheet, setShowMoreSheet] = useState(false);
  const isOwner = canUserAccessAdmin(currentUser, isEmailVerified);

  const primaryItems = [
    {
      id: 'home' as NavTab,
      label: { en: 'Home', hi: 'होम' },
      icon: Home,
    },
    {
      id: 'practice' as NavTab,
      label: { en: 'Practice', hi: 'अभ्यास' },
      icon: HelpCircle,
    },
    {
      id: 'progress' as NavTab,
      label: { en: 'Tracker', hi: 'ट्रैकर' },
      icon: BarChart3,
    },
    {
      id: 'community' as NavTab,
      label: { en: 'Community', hi: 'कम्युनिटी' },
      icon: Users,
    },
  ];

  const secondaryItems = [
    {
      id: 'planner' as NavTab,
      label: { en: 'Syllabus & Planner', hi: 'पाठ्यक्रम व प्लानर' },
      description: { en: 'All 46 chapters, checklist & Pomodoro', hi: 'सभी 46 अध्याय एवं पोमोडोरो' },
      icon: CalendarCheck,
    },
    {
      id: 'dailyChallenge' as NavTab,
      label: { en: 'Daily 10 Quiz', hi: 'दैनिक 10 प्रश्न' },
      description: { en: '10 daily bilingual MCQs & streak', hi: 'दैनिक 10 प्रश्न व स्ट्रीक' },
      icon: Sparkles,
    },
    {
      id: 'doubtSolver' as NavTab,
      label: { en: 'AI Doubt Solver', hi: 'एआई शंका समाधान' },
      description: { en: 'Step-by-step concept solutions', hi: 'चरणबद्ध समाधान' },
      icon: Sparkle,
    },
    {
      id: 'mocks' as NavTab,
      label: { en: 'Mock Tests', hi: 'मॉक टेस्ट' },
      description: { en: 'Real exam timer & Jan 2027 mocks', hi: 'जनवरी 2027 मॉक परीक्षा' },
      icon: Award,
    },
    {
      id: 'leaderboard' as NavTab,
      label: { en: 'AIR Rankings', hi: 'ऑल इंडिया रैंकिंग' },
      description: { en: 'National leaderboard & badges', hi: 'देशव्यापी रैंकिंग व पदक' },
      icon: Trophy,
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

  if (isOwner) {
    secondaryItems.push({
      id: 'admin' as NavTab,
      label: { en: 'Owner Dashboard', hi: 'ओनर डैशबोर्ड' },
      description: { en: 'Separate private control panel', hi: 'निजी ओनर नियंत्रण कक्ष' },
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
      <nav
        aria-label="Mobile navigation"
        className="lg:hidden fixed bottom-0 left-0 right-0 z-40 h-14 bg-white/98 dark:bg-slate-900/98 border-t border-slate-200 dark:border-slate-800 px-2 transition-colors duration-200"
      >
        <div className="flex items-center justify-between max-w-lg mx-auto h-full">
          {primaryItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleSelectTab(item.id)}
                className={`flex flex-col items-center justify-center flex-1 h-full px-1 transition-colors cursor-pointer ${
                  isActive
                    ? 'text-blue-700 dark:text-blue-400 font-semibold'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 font-medium'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'stroke-[2.2]' : 'stroke-[1.8]'}`} />
                <span className="text-[11px] mt-0.5 tracking-tight truncate max-w-[64px] whitespace-nowrap">
                  {item.label[language]}
                </span>
              </button>
            );
          })}

          <button
            type="button"
            onClick={() => setShowMoreSheet(true)}
            className={`flex flex-col items-center justify-center flex-1 h-full px-1 transition-colors cursor-pointer ${
              isSecondaryActive
                ? 'text-blue-700 dark:text-blue-400 font-semibold'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 font-medium'
            }`}
          >
            <MoreHorizontal className={`w-4 h-4 ${isSecondaryActive ? 'stroke-[2.2]' : 'stroke-[1.8]'}`} />
            <span className="text-[11px] mt-0.5 tracking-tight whitespace-nowrap">
              {language === 'en' ? 'More' : 'अन्य'}
            </span>
          </button>
        </div>
      </nav>

      {showMoreSheet && (
        <div className="lg:hidden fixed inset-0 z-50 flex flex-col justify-end">
          <div
            onClick={() => setShowMoreSheet(false)}
            className="fixed inset-0 bg-slate-900/65 transition-opacity"
          />

          <div className="relative z-10 bg-white dark:bg-slate-900 rounded-t-3xl border-t border-slate-200 dark:border-slate-800 p-5 shadow-2xl max-h-[85vh] overflow-y-auto">
            <div className="w-12 h-1.5 rounded-full bg-slate-200 dark:bg-slate-700 mx-auto mb-4" />

            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                {language === 'en' ? 'All Learning Modules' : 'सभी अध्ययन मॉड्यूल'}
              </h3>
              <button
                type="button"
                onClick={() => setShowMoreSheet(false)}
                aria-label="Close module menu"
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2.5 my-3">
              {isOwner ? (
                <button
                  type="button"
                  onClick={() => handleSelectTab('admin')}
                  className="flex items-center gap-2 p-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 text-left cursor-pointer"
                >
                  <Shield className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
                  <div>
                    <span className="text-xs font-bold text-indigo-900 dark:text-indigo-200 block">
                      {language === 'en' ? 'Owner Console' : 'ओनर कंसोल'}
                    </span>
                    <span className="text-[11px] text-indigo-600 dark:text-indigo-400">
                      {language === 'en' ? 'Free Unlimited' : 'निःशुल्क प्रवेश'}
                    </span>
                  </div>
                </button>
              ) : (
                onOpenPaymentModal && (
                  <button
                    type="button"
                    onClick={() => {
                      setShowMoreSheet(false);
                      onOpenPaymentModal();
                    }}
                    className="flex items-center gap-2 p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-left cursor-pointer"
                  >
                    <CreditCard className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    <div>
                      <span className="text-xs font-bold text-emerald-800 dark:text-emerald-200 block">
                        {language === 'en' ? 'UPI Pass (₹5)' : 'यूपीआई पास (₹5)'}
                      </span>
                      <span className="text-[11px] text-emerald-600 dark:text-emerald-400">
                        {language === 'en' ? '30 Days Access' : '30 दिन वैधता'}
                      </span>
                    </div>
                  </button>
                )
              )}

              {onOpenReferralModal && (
                <button
                  type="button"
                  onClick={() => {
                    setShowMoreSheet(false);
                    onOpenReferralModal();
                  }}
                  className="flex items-center gap-2 p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-left cursor-pointer"
                >
                  <Gift className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                  <div>
                    <span className="text-xs font-bold text-amber-800 dark:text-amber-200 block">
                      {language === 'en' ? 'Refer & Earn' : 'रेफर व अंक'}
                    </span>
                    <span className="text-[11px] text-amber-600 dark:text-amber-400 tabular-nums">
                      {currentUser?.referralPoints || 0} pts
                    </span>
                  </div>
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 py-2">
              {secondaryItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleSelectTab(item.id)}
                    className={`flex items-center gap-3 p-3 rounded-xl border text-left transition-colors cursor-pointer ${
                      isActive
                        ? 'bg-blue-50 dark:bg-blue-950/60 border-blue-300 dark:border-blue-700'
                        : 'bg-slate-50/70 dark:bg-slate-800/40 border-slate-200/80 dark:border-slate-700/60 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    <div
                      className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                        isActive
                          ? 'bg-blue-600 text-white'
                          : 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-300 border border-slate-200 dark:border-slate-600'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="text-xs font-bold text-slate-900 dark:text-white truncate block">
                        {item.label[language]}
                      </span>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
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
