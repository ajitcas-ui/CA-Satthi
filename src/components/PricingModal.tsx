import React from 'react';
import { Language, PricingConfig } from '../types';
import { 
  Sparkles, 
  CheckCircle2, 
  ShieldCheck, 
  X, 
  HelpCircle, 
  Lock,
  Flame,
  BookOpen
} from 'lucide-react';

interface PricingModalProps {
  language: Language;
  pricingConfig: PricingConfig;
  isOpen: boolean;
  onClose: () => void;
  isAdmin?: boolean;
  onOpenAdminPanel?: () => void;
}

export const PricingModal: React.FC<PricingModalProps> = ({
  language,
  pricingConfig,
  isOpen,
  onClose,
  isAdmin,
  onOpenAdminPanel,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 dark:bg-black/80 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 relative overflow-hidden">
        {/* Background gradient decorative element */}
        <div className="absolute -top-16 -right-16 w-48 h-48 bg-blue-500/10 dark:bg-blue-500/20 rounded-full blur-2xl pointer-events-none" />

        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-md shadow-blue-500/20">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-lg text-slate-900 dark:text-white leading-tight">
                {language === 'en' ? 'CA Saathi Student Pass' : 'सीए साथी विद्यार्थी पास'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {language === 'en' ? 'Quality CA Foundation prep accessible to all' : 'सभी के लिए सुलभ सीए फाउंडेशन तैयारी'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Current Active Plan Banner */}
        <div className="my-5 p-4 rounded-2xl bg-gradient-to-r from-blue-50 via-indigo-50 to-blue-50 dark:from-blue-950/40 dark:via-indigo-950/40 dark:to-blue-950/40 border border-blue-200/80 dark:border-blue-800/60">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black uppercase tracking-wider text-blue-700 dark:text-blue-300 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              {language === 'en' ? 'Current Tier: Free Access' : 'सक्रिय प्लान: 100% निःशुल्क'}
            </span>
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300 text-xs font-extrabold">
              ₹0 • FREE
            </span>
          </div>

          <h4 className="mt-2 text-base font-bold text-slate-900 dark:text-white">
            {language === 'en' ? '100% Free Foundation Mission' : 'पूर्णतः निःशुल्क सीए फाउंडेशन मिशन'}
          </h4>
          <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
            {pricingConfig.announcementNote[language]}
          </p>
        </div>

        {/* Features list */}
        <div className="space-y-2.5">
          <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            {language === 'en' ? 'Included With Every Account' : 'प्रत्येक खाते के साथ शामिल सुविधाएं'}
          </p>

          {[
            {
              en: 'Full ICAI Study Material MCQ Question Bank (4 Papers)',
              hi: 'पूर्ण आईसीएआई स्टडी मटेरियल एमसीक्यू प्रश्न बैंक (4 विषय)',
            },
            {
              en: 'CA Foundation Previous Year Exam Questions (PYQs)',
              hi: 'सीए फाउंडेशन विगत वर्षों के परीक्षा प्रश्न (PYQs)',
            },
            {
              en: 'Timed Mock Tests with Instant Score & Analysis',
              hi: 'तुरंत परिणाम व विश्लेषण के साथ समयबद्ध मॉक टेस्ट',
            },
            {
              en: 'Subject-wise Student Community & Doubt Clearing',
              hi: 'विषयवार विद्यार्थी कम्युनिटी एवं संदेह निवारण',
            },
            {
              en: 'Daily Study Planner, Revision Alarms & Streak Tracker',
              hi: 'दैनिक स्टडी प्लानर, रिवीजन अलार्म एवं स्ट्रीक ट्रैकर',
            },
          ].map((item, idx) => (
            <div key={idx} className="flex items-center gap-2.5 text-xs text-slate-700 dark:text-slate-300">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 dark:text-emerald-400 shrink-0" />
              <span>{item[language]}</span>
            </div>
          ))}
        </div>

        {/* Future Nominal Fee Notice */}
        <div className="mt-5 p-3 rounded-xl bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-400">
          <div className="flex items-start gap-2">
            <HelpCircle className="w-4 h-4 text-slate-400 dark:text-slate-500 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-slate-800 dark:text-slate-200">
                {language === 'en' ? 'Admin Pricing Policy:' : 'एडमिन शुल्क नीति:'}
              </span>{' '}
              {language === 'en'
                ? `Core learning features remain free. A nominal fee (such as ₹${pricingConfig.testPassPriceInRupees} per mock speed test pass) may be enabled by faculty admin in the future to support server costs. Real payment gateways are currently inactive.`
                : `मूल शिक्षण सुविधाएं हमेशा निःशुल्क रहेंगी। भविष्य में सर्वर खर्च के लिए एडमिन द्वारा नाममात्र शुल्क (जैसे ₹${pricingConfig.testPassPriceInRupees} प्रति मॉक टेस्ट) सक्षम किया जा सकता है। वर्तमान में वास्तविक भुगतान निष्क्रिय है।`}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
          {isAdmin && onOpenAdminPanel ? (
            <button
              onClick={() => {
                onClose();
                onOpenAdminPanel();
              }}
              className="text-xs text-indigo-600 dark:text-indigo-400 font-bold hover:underline cursor-pointer"
            >
              {language === 'en' ? 'Manage Pricing in Admin Panel →' : 'एडमिन पैनल में शुल्क प्रबंधित करें →'}
            </button>
          ) : (
            <div className="text-[11px] text-slate-400 dark:text-slate-500 flex items-center gap-1">
              <Lock className="w-3.5 h-3.5" />
              <span>{language === 'en' ? 'Zero payment required' : 'कोई भुगतान आवश्यक नहीं'}</span>
            </div>
          )}

          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
          >
            {language === 'en' ? 'Continue Studying' : 'पढ़ाई जारी रखें'}
          </button>
        </div>
      </div>
    </div>
  );
};
