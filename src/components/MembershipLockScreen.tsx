import React from 'react';
import { ExamAttemptId, Language, UserProfile, MembershipStatus } from '../types';
import { getAttemptMetadata } from '../utils/examAttempt';
import { 
  Lock, 
  Sparkles, 
  CreditCard, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  ShieldCheck, 
  ArrowRight, 
  BookOpen, 
  Award, 
  HelpCircle, 
  Users, 
  Calendar 
} from 'lucide-react';
import { playChimeSound } from '../utils/audio';

interface MembershipLockScreenProps {
  language: Language;
  selectedAttempt?: ExamAttemptId;
  currentUser: UserProfile;
  membershipStatus: MembershipStatus;
  expiresAt?: string;
  onOpenPaymentModal: () => void;
  onOpenAuthModal?: () => void;
  onGoHome: () => void;
  sectionName?: { en: string; hi: string };
}

export const MembershipLockScreen: React.FC<MembershipLockScreenProps> = ({
  language,
  selectedAttempt = 'January 2027',
  currentUser,
  membershipStatus,
  expiresAt,
  onOpenPaymentModal,
  onOpenAuthModal,
  onGoHome,
  sectionName,
}) => {
  const attemptMeta = getAttemptMetadata(selectedAttempt);
  const isGuest = !currentUser || currentUser.id === 'guest';
  const isPending = membershipStatus === 'pending';
  const isExpired = membershipStatus === 'expired';

  const handlePayClick = () => {
    playChimeSound('click');
    onOpenPaymentModal();
  };

  return (
    <div className="py-8 sm:py-12 px-4 max-w-3xl mx-auto space-y-6">
      {/* Main Lock Card */}
      <div className="bg-white dark:bg-[#0F1936] rounded-3xl border border-slate-200 dark:border-[#213059] shadow-xl p-6 sm:p-8 text-center relative overflow-hidden">
        {/* Glow Effects */}
        <div className="absolute -top-16 -right-16 w-44 h-44 bg-violet-500/10 dark:bg-violet-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-16 -left-16 w-44 h-44 bg-indigo-500/10 dark:bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />

        {/* Status Badge */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider mb-4 border shadow-2xs">
          {isPending ? (
            <span className="bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200 border-amber-300 dark:border-amber-800 flex items-center gap-1.5 px-2 py-0.5 rounded-full">
              <Clock className="w-3.5 h-3.5 text-amber-600" />
              <span>{language === 'en' ? 'Verification Pending' : 'सत्यापन प्रक्रियाधीन'}</span>
            </span>
          ) : isExpired ? (
            <span className="bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-200 border-rose-300 dark:border-rose-800 flex items-center gap-1.5 px-2 py-0.5 rounded-full">
              <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
              <span>{language === 'en' ? 'Membership Expired' : 'सदस्यता समाप्त'}</span>
            </span>
          ) : (
            <span className="bg-violet-100 text-[#172554] dark:bg-violet-950 dark:text-violet-200 border-violet-300 dark:border-violet-800 flex items-center gap-1.5 px-2 py-0.5 rounded-full">
              <Lock className="w-3.5 h-3.5 text-violet-700 dark:text-violet-300" />
              <span>{language === 'en' ? `Premium Pass · ${attemptMeta.shortLabel.en}` : `प्रीमियम पास · ${attemptMeta.shortLabel.hi}`}</span>
            </span>
          )}
        </div>

        {/* Header Icon */}
        <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-3xl bg-gradient-to-tr from-[#0B1739] via-[#172554] to-violet-700 text-white flex items-center justify-center mx-auto shadow-lg shadow-violet-600/25 mb-4">
          <Lock className="w-8 h-8 sm:w-10 sm:h-10" />
        </div>

        {/* Section Notice */}
        <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
          {sectionName ? (
            <span>
              {language === 'en' 
                ? `Unlock ${sectionName.en} with Paid Membership` 
                : `सशुल्क सदस्यता के साथ ${sectionName.hi} अनलॉक करें`}
            </span>
          ) : (
            <span>
              {language === 'en'
                ? 'CA Foundation Premium Access Required'
                : 'सीए फाउंडेशन प्रीमियम एक्सेस आवश्यक'}
            </span>
          )}
        </h2>

        {/* Description based on state */}
        <p className="text-sm text-slate-600 dark:text-slate-300 max-w-lg mx-auto mt-2 leading-relaxed">
          {isPending ? (
            language === 'en'
              ? 'Your payment screenshot and UTR are currently being verified against bank records by CA Ajit Singh (Super Admin). Premium access unlocks automatically once approved.'
              : 'आपका भुगतान स्क्रीनशॉट व UTR बैंक रिकॉर्ड से सत्यापित किया जा रहा है। एडमिन द्वारा अनुमोदन के बाद सभी प्रीमियम टेस्ट अनलॉक हो जाएंगे।'
          ) : isExpired ? (
            language === 'en'
              ? `Your monthly access ended on ${expiresAt ? new Date(expiresAt).toLocaleDateString() : 'recently'}. Renew today for just ₹5/month to continue your chapter MCQs, full mock tests, and study streak!`
              : `आपकी मासिक सदस्यता समाप्त हो चुकी है। अपनी तैयारी, मॉक टेस्ट व स्ट्रीक जारी रखने हेतु मात्र ₹5/माह में नवीनीकरण करें!`
          ) : (
            language === 'en'
              ? 'CA Saathi provides 100% authentic ICAI syllabus content, past exam papers, and timed mock tests for a nominal student subscription of just ₹5 per month.'
              : 'सीए साथी पर 100% प्रामाणिक आईसीएआई पाठ्यक्रम, विगत वर्षों के प्रश्न व मॉक टेस्ट मात्र ₹5 प्रति माह के नाममात्र शुल्क पर उपलब्ध हैं।'
          )}
        </p>

        {/* Pricing Box */}
        <div className="my-6 p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-violet-50/90 via-indigo-50/50 to-slate-50 dark:from-[#141F45] dark:via-violet-950/30 dark:to-[#0F1936] border border-violet-200 dark:border-violet-800 max-w-md mx-auto">
          <div className="flex items-center justify-between">
            <div className="text-left">
              <span className="text-[11px] font-bold uppercase tracking-wider text-violet-700 dark:text-violet-300 block">
                {language === 'en' ? 'Monthly All-Access Pass' : 'मासिक ऑल-एक्सेस पास'}
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400">
                {language === 'en' ? 'Jan 2027 & May 2027 · 30 Days Validity' : 'जनवरी 2027 व मई 2027 · 30 दिन'}
              </span>
            </div>
            <div className="text-right">
              <span className="text-3xl font-extrabold text-[#0F1E46] dark:text-white">₹5</span>
              <span className="text-xs text-slate-500 dark:text-slate-400 font-medium"> / {language === 'en' ? 'month' : 'माह'}</span>
            </div>
          </div>

          <div className="mt-3 pt-3 border-t border-violet-200/60 dark:border-violet-800/60 text-left text-xs text-slate-600 dark:text-slate-300 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>
              {language === 'en'
                ? 'Manual bank verification via personal UPI QR (Ajeet Patel, ajeet345@ptyes)'
                : 'व्यक्तिगत यूपीआई क्यूआर द्वारा मैनुअल बैंक सत्यापन (अजीत पटेल, ajeet345@ptyes)'}
            </span>
          </div>
        </div>

        {/* Included Features Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-w-lg mx-auto text-left text-xs mb-6">
          <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="font-semibold text-slate-800 dark:text-slate-200">
              {language === 'en' ? '4 CA Foundation Papers Complete MCQs' : '4 फाउंडेशन पेपरों के सम्पूर्ण बहुविकल्पीय प्रश्न'}
            </span>
          </div>

          <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="font-semibold text-slate-800 dark:text-slate-200">
              {language === 'en' ? 'Previous Year Questions (PYQs 2024-2020)' : 'विगत वर्षों के प्रश्न (PYQs 2024-2020)'}
            </span>
          </div>

          <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="font-semibold text-slate-800 dark:text-slate-200">
              {language === 'en' ? 'Timed Mock Tests with -0.25 Marking' : 'टाइम्ड मॉक टेस्ट (-0.25 नेगेटिव मार्किंग)'}
            </span>
          </div>

          <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="font-semibold text-slate-800 dark:text-slate-200">
              {language === 'en' ? 'AI Doubt Solver (English & Hindi)' : 'एआई शंका समाधान (हिंदी व अंग्रेजी)'}
            </span>
          </div>

          <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="font-semibold text-slate-800 dark:text-slate-200">
              {language === 'en' ? 'Spaced Repetition Study Planner' : 'दैनिक स्टडी प्लानर व रिमाइंडर'}
            </span>
          </div>

          <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="font-semibold text-slate-800 dark:text-slate-200">
              {language === 'en' ? 'CA Saathi Common Study Group & Live Room' : 'सामान्य विद्यार्थी अध्ययन समूह एवं लाइव रूम'}
            </span>
          </div>
        </div>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 max-w-md mx-auto">
          {isGuest && onOpenAuthModal ? (
            <button
              onClick={onOpenAuthModal}
              className="w-full sm:flex-1 py-3 px-6 rounded-2xl bg-gradient-to-r from-[#172554] to-violet-700 hover:from-[#1e316e] hover:to-violet-800 text-white font-bold text-sm shadow-sm transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>{language === 'en' ? 'Sign In with Google to Unlock' : 'अनलॉक हेतु गूगल से साइन इन करें'}</span>
            </button>
          ) : (
            <button
              onClick={handlePayClick}
              className="w-full sm:flex-1 py-3 px-6 rounded-2xl bg-gradient-to-r from-[#172554] to-violet-700 hover:from-[#1e316e] hover:to-violet-800 text-white font-bold text-sm shadow-sm transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <CreditCard className="w-4 h-4" />
              <span>
                {isPending
                  ? (language === 'en' ? 'Check Payment Status' : 'भुगतान स्थिति देखें')
                  : isExpired
                    ? (language === 'en' ? 'Renew for ₹5 / Month' : '₹5 में नवीनीकृत करें')
                    : (language === 'en' ? 'Pay ₹5 & Unlock Access' : '₹5 का भुगतान कर अनलॉक करें')}
              </span>
            </button>
          )}

          <button
            onClick={onGoHome}
            className="w-full sm:w-auto py-3 px-5 rounded-2xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs transition-colors cursor-pointer"
          >
            {language === 'en' ? 'Back to Dashboard' : 'डैशबोर्ड पर वापस जाएं'}
          </button>
        </div>

        {/* Student Unique Payment Reference */}
        {currentUser?.paymentReference && (
          <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 text-center">
            <span className="text-[11px] text-slate-500 dark:text-slate-400">
              {language === 'en' ? 'Your Unique Student Payment Reference: ' : 'आपका व्यक्तिगत छात्र भुगतान संदर्भ: '}
              <strong className="font-mono text-slate-800 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md">
                {currentUser.paymentReference}
              </strong>
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
