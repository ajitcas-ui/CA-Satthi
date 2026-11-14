import React from 'react';
import { ExamAttemptId, Language, NavTab, UserProfile } from '../types';
import { SUPPORTED_EXAM_ATTEMPTS, getAttemptMetadata } from '../utils/examAttempt';
import { canUserAccessAdmin, computeMembershipState } from '../utils/membershipRules';
import {
  Award,
  BarChart3,
  Bell,
  Calendar,
  CalendarCheck,
  CheckCircle2,
  CreditCard,
  FileText,
  GraduationCap,
  HelpCircle,
  Home,
  Shield,
  Sparkle,
  Sparkles,
  Trophy,
  Users,
} from 'lucide-react';

interface SidebarProps {
  language: Language;
  activeTab: NavTab;
  setActiveTab: (tab: NavTab) => void;
  selectedAttempt: ExamAttemptId;
  onChangeAttempt: (attempt: ExamAttemptId) => void;
  currentUser: UserProfile;
  isEmailVerified: boolean;
  onOpenPaymentModal: () => void;
  onOpenAuthModal: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  language,
  activeTab,
  setActiveTab,
  selectedAttempt,
  onChangeAttempt,
  currentUser,
  isEmailVerified,
  onOpenPaymentModal,
  onOpenAuthModal,
}) => {
  const isOwner = canUserAccessAdmin(currentUser, isEmailVerified);
  const membership = computeMembershipState(currentUser, []);
  const isGuest = !currentUser || currentUser.id === 'guest';

  const navGroups: Array<{
    heading: { en: string; hi: string };
    items: Array<{ id: NavTab; label: { en: string; hi: string }; icon: React.ComponentType<{ className?: string }> }>;
  }> = [
    {
      heading: { en: 'Prepare', hi: 'तैयारी' },
      items: [
        { id: 'home', label: { en: 'Dashboard', hi: 'डैशबोर्ड' }, icon: Home },
        { id: 'practice', label: { en: 'Practice & PYQs', hi: 'अभ्यास व PYQ' }, icon: HelpCircle },
        { id: 'mocks', label: { en: 'Mock Tests', hi: 'मॉक टेस्ट' }, icon: Award },
        { id: 'notes', label: { en: 'Revision Notes', hi: 'रिवीजन नोट्स' }, icon: FileText },
        { id: 'planner', label: { en: '46-Ch Syllabus & Plan', hi: 'पाठ्यक्रम व प्लानर' }, icon: CalendarCheck },
      ],
    },
    {
      heading: { en: 'Track & AI', hi: 'प्रगति व AI' },
      items: [
        { id: 'progress', label: { en: 'Study Tracker', hi: 'स्टडी ट्रैकर' }, icon: BarChart3 },
        { id: 'dailyChallenge', label: { en: 'Daily 10 Quiz', hi: 'दैनिक 10 प्रश्न' }, icon: Sparkles },
        { id: 'doubtSolver', label: { en: 'CA Saathi AI', hi: 'सीए साथी AI' }, icon: Sparkle },
      ],
    },
    {
      heading: { en: 'Community', hi: 'समुदाय' },
      items: [
        { id: 'community', label: { en: 'Common Group', hi: 'साझा ग्रुप' }, icon: Users },
        { id: 'leaderboard', label: { en: 'AIR Rankings', hi: 'रैंकिंग' }, icon: Trophy },
        { id: 'updates', label: { en: 'ICAI Updates', hi: 'आईसीएआई सूचनाएं' }, icon: Bell },
      ],
    },
  ];

  return (
    <aside
      aria-label="Desktop workspace sidebar"
      className="hidden lg:flex lg:flex-col w-64 shrink-0 bg-[#0B1739] text-white border-r border-[#1E2F5C] sticky top-0 h-screen select-none"
    >
      {/* Brand Lockup */}
      <div className="h-16 px-5 flex items-center gap-3 border-b border-white/10 shrink-0">
        <button
          type="button"
          onClick={() => setActiveTab('home')}
          className="flex items-center gap-2.5 text-left cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400 rounded-lg"
        >
          <span className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 text-white flex items-center justify-center shadow-sm shrink-0">
            <GraduationCap className="w-5 h-5" />
          </span>
          <div>
            <span className="font-bold text-base tracking-tight text-white block leading-none">
              CA Saathi
            </span>
            <span className="text-[11px] text-indigo-200/80 font-medium block mt-0.5">
              {language === 'en' ? 'CA Foundation Prep' : 'सीए फाउंडेशन तैयारी'}
            </span>
          </div>
        </button>
      </div>

      {/* Attempt Selector Block */}
      <div className="px-4 py-3 border-b border-white/10">
        <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-indigo-200/80 mb-2">
          <span className="flex items-center gap-1">
            <Calendar className="w-3 h-3 text-violet-300" />
            <span>{language === 'en' ? 'Exam Attempt' : 'परीक्षा सत्र'}</span>
          </span>
        </div>
        <div className="grid grid-cols-2 gap-1 p-1 rounded-xl bg-[#071029] border border-white/10">
          {SUPPORTED_EXAM_ATTEMPTS.map((attempt) => {
            const meta = getAttemptMetadata(attempt);
            const active = selectedAttempt === attempt;
            return (
              <button
                key={attempt}
                type="button"
                onClick={() => onChangeAttempt(attempt)}
                aria-pressed={active}
                className={`py-1.5 px-2 rounded-lg text-[11px] font-bold transition-all cursor-pointer whitespace-nowrap ${
                  active
                    ? 'bg-violet-600 text-white shadow-xs'
                    : 'text-indigo-200/80 hover:text-white hover:bg-white/5'
                }`}
              >
                {meta.shortLabel[language]}
              </button>
            );
          })}
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-4">
        {navGroups.map((group) => (
          <div key={group.heading.en} className="space-y-1">
            <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-indigo-300/60">
              {group.heading[language]}
            </p>
            <div className="space-y-0.5">
              {group.items.map((item) => {
                const Icon = item.icon;
                const active = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setActiveTab(item.id)}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all duration-150 cursor-pointer ${
                      active
                        ? 'bg-violet-600/95 text-white shadow-xs'
                        : 'text-indigo-100/80 hover:text-white hover:bg-white/8'
                    }`}
                  >
                    <Icon
                      className={`w-4 h-4 shrink-0 ${
                        active ? 'text-white' : 'text-indigo-300/80'
                      }`}
                    />
                    <span className="truncate">{item.label[language]}</span>
                  </button>
                );
              })}
            </div>
          </div>
        ))}

        {isOwner && (
          <div className="pt-2 border-t border-white/10">
            <button
              type="button"
              onClick={() => setActiveTab('admin')}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
                activeTab === 'admin'
                  ? 'bg-violet-600 text-white'
                  : 'bg-indigo-900/60 text-indigo-100 hover:bg-indigo-800/70 border border-indigo-700/50'
              }`}
            >
              <Shield className="w-4 h-4 text-violet-300 shrink-0" />
              <span>{language === 'en' ? 'Owner Console' : 'ओनर कंसोल'}</span>
            </button>
          </div>
        )}
      </nav>

      {/* Bottom Membership / Account Card */}
      <div className="p-3 border-t border-white/10 shrink-0">
        {isOwner ? (
          <div className="p-3 rounded-xl bg-white/8 border border-white/10 space-y-1">
            <div className="flex items-center gap-1.5 text-xs font-bold text-violet-200">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>{language === 'en' ? 'Owner Free Access' : 'निःशुल्क ओनर प्रवेश'}</span>
            </div>
            <p className="text-[11px] text-indigo-200/75 truncate">{currentUser.email}</p>
          </div>
        ) : membership.canAccessPremium ? (
          <div className="p-3 rounded-xl bg-emerald-500/15 border border-emerald-400/25 space-y-1">
            <div className="flex items-center justify-between text-xs font-bold text-emerald-200">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>{language === 'en' ? '₹5 Pass Active' : '₹5 पास सक्रिय'}</span>
              </span>
              <span className="tabular-nums">{membership.daysLeft}d</span>
            </div>
            <p className="text-[11px] text-emerald-100/75 truncate">
              {currentUser.name}
            </p>
          </div>
        ) : (
          <div className="p-3 rounded-xl bg-white/8 border border-white/10 space-y-2">
            <div>
              <p className="text-xs font-bold text-white">
                {language === 'en' ? 'Full Access · ₹5/mo' : 'पूर्ण एक्सेस · ₹5/माह'}
              </p>
              <p className="text-[11px] text-indigo-200/75 mt-0.5">
                {language === 'en'
                  ? '46 chapters, PYQs & mocks'
                  : '46 अध्याय, PYQ व मॉक टेस्ट'}
              </p>
            </div>
            <button
              type="button"
              onClick={isGuest ? onOpenAuthModal : onOpenPaymentModal}
              className="w-full py-1.5 px-3 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold transition-colors cursor-pointer flex items-center justify-center gap-1.5"
            >
              <CreditCard className="w-3.5 h-3.5" />
              <span>
                {isGuest
                  ? language === 'en'
                    ? 'Sign In to Start'
                    : 'लॉगिन करें'
                  : language === 'en'
                    ? 'Unlock ₹5 Pass'
                    : '₹5 पास अनलॉक करें'}
              </span>
            </button>
          </div>
        )}
      </div>
    </aside>
  );
};
