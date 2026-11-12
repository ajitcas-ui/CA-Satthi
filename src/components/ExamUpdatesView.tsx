import React, { useState } from 'react';
import { Language, ExamUpdate } from '../types';
import { MOCK_EXAM_UPDATES, EXAM_FAQS } from '../data/mockUpdates';
import { evaluatePassingCriteria, PassingEvaluation } from '../utils/quizEngine';
import { 
  Bell, 
  Calendar, 
  Calculator, 
  HelpCircle, 
  ChevronDown, 
  ChevronUp, 
  AlertCircle, 
  CheckCircle2, 
  Sparkles, 
  Info,
  ShieldAlert,
  ArrowRight
} from 'lucide-react';

interface ExamUpdatesViewProps {
  language: Language;
}

export const ExamUpdatesView: React.FC<ExamUpdatesViewProps> = ({ language }) => {
  const [selectedUpdate, setSelectedUpdate] = useState<ExamUpdate | null>(null);
  const [expandedFaqId, setExpandedFaqId] = useState<string | null>(EXAM_FAQS[0]?.id || null);

  // Passing marks calculator state
  const [p1Marks, setP1Marks] = useState<number>(55);
  const [p2Marks, setP2Marks] = useState<number>(50);
  const [p3Marks, setP3Marks] = useState<number>(45);
  const [p4Marks, setP4Marks] = useState<number>(60);

  const evaluation: PassingEvaluation = evaluatePassingCriteria({
    paper1: p1Marks,
    paper2: p2Marks,
    paper3: p3Marks,
    paper4: p4Marks,
  });

  const toggleFaq = (id: string) => {
    setExpandedFaqId((prev) => (prev === id ? null : id));
  };

  return (
    <div className="space-y-6 pb-20 lg:pb-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
          <Bell className="w-6 h-6 text-blue-600 dark:text-blue-400" />
          {language === 'en' ? 'CA Foundation Exam Updates & Guidance' : 'सीए फाउंडेशन परीक्षा अपडेट्स एवं दिशा-निर्देश'}
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
          {language === 'en'
            ? 'Latest ICAI announcements, passing marks criteria calculator, and exam hall FAQs'
            : 'नवीनतम घोषणाएं, उत्तीर्ण अंक पात्रता कैलकुलेटर और परीक्षा संबंधी प्रश्नोत्तर'}
        </p>
      </div>

      {/* Passing Marks Eligibility Calculator Card */}
      <section className="bg-gradient-to-br from-blue-900 via-indigo-900 to-slate-900 text-white rounded-2xl p-5 sm:p-7 shadow-lg border border-blue-800/50">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-blue-700/60 mb-5">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-blue-300">
              {language === 'en' ? 'Interactive Tool' : 'इंटरएक्टिव टूल'}
            </span>
            <h2 className="text-lg sm:text-xl font-black text-white flex items-center gap-2 mt-0.5">
              <Calculator className="w-5 h-5 text-blue-300" />
              {language === 'en' ? 'ICAI Passing Marks Eligibility Calculator' : 'आईसीएआई उत्तीर्ण अंक पात्रता कैलकुलेटर'}
            </h2>
          </div>
          <div className="text-xs bg-blue-800/80 px-3 py-1.5 rounded-xl border border-blue-600 text-blue-200">
            {language === 'en' ? 'Rule: ≥ 40 each & ≥ 50% aggregate' : 'नियम: प्रत्येक में ≥ 40 व कुल ≥ 50%'}
          </div>
        </div>

        {/* 4 Paper Score Inputs */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
          <div className="bg-white/10 backdrop-blur-xs p-3 rounded-xl border border-white/10">
            <label className="block text-[11px] font-bold text-blue-200 mb-1">
              Paper 1: Accounts
            </label>
            <input
              type="number"
              min="0"
              max="100"
              value={p1Marks}
              onChange={(e) => setP1Marks(Math.max(0, Math.min(100, Number(e.target.value))))}
              className="w-full px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-bold text-base focus:outline-blue-400"
            />
            <span className={`text-[10px] mt-1 block font-semibold ${p1Marks >= 40 ? 'text-emerald-300' : 'text-rose-300'}`}>
              {p1Marks >= 40 ? '✓ Cleared' : '✗ Below 40'}
            </span>
          </div>

          <div className="bg-white/10 backdrop-blur-xs p-3 rounded-xl border border-white/10">
            <label className="block text-[11px] font-bold text-blue-200 mb-1">
              Paper 2: Law
            </label>
            <input
              type="number"
              min="0"
              max="100"
              value={p2Marks}
              onChange={(e) => setP2Marks(Math.max(0, Math.min(100, Number(e.target.value))))}
              className="w-full px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-bold text-base focus:outline-blue-400"
            />
            <span className={`text-[10px] mt-1 block font-semibold ${p2Marks >= 40 ? 'text-emerald-300' : 'text-rose-300'}`}>
              {p2Marks >= 40 ? '✓ Cleared' : '✗ Below 40'}
            </span>
          </div>

          <div className="bg-white/10 backdrop-blur-xs p-3 rounded-xl border border-white/10">
            <label className="block text-[11px] font-bold text-blue-200 mb-1">
              Paper 3: QA (Math)
            </label>
            <input
              type="number"
              min="0"
              max="100"
              value={p3Marks}
              onChange={(e) => setP3Marks(Math.max(0, Math.min(100, Number(e.target.value))))}
              className="w-full px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-bold text-base focus:outline-blue-400"
            />
            <span className={`text-[10px] mt-1 block font-semibold ${p3Marks >= 40 ? 'text-emerald-300' : 'text-rose-300'}`}>
              {p3Marks >= 40 ? '✓ Cleared' : '✗ Below 40'}
            </span>
          </div>

          <div className="bg-white/10 backdrop-blur-xs p-3 rounded-xl border border-white/10">
            <label className="block text-[11px] font-bold text-blue-200 mb-1">
              Paper 4: Economics
            </label>
            <input
              type="number"
              min="0"
              max="100"
              value={p4Marks}
              onChange={(e) => setP4Marks(Math.max(0, Math.min(100, Number(e.target.value))))}
              className="w-full px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-bold text-base focus:outline-blue-400"
            />
            <span className={`text-[10px] mt-1 block font-semibold ${p4Marks >= 40 ? 'text-emerald-300' : 'text-rose-300'}`}>
              {p4Marks >= 40 ? '✓ Cleared' : '✗ Below 40'}
            </span>
          </div>
        </div>

        {/* Real-time Result Banner */}
        <div className={`p-4 rounded-xl border ${
          evaluation.passed
            ? 'bg-emerald-950/60 border-emerald-500/50 text-emerald-100'
            : 'bg-rose-950/60 border-rose-500/50 text-rose-100'
        }`}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
            <div className="flex items-center gap-2">
              {evaluation.passed ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
              ) : (
                <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
              )}
              <span className="font-extrabold text-base">
                {evaluation.passed
                  ? (language === 'en' ? 'RESULT: QUALIFIED / PASS' : 'परिणाम: उत्तीर्ण (PASS)')
                  : (language === 'en' ? 'RESULT: DID NOT QUALIFY' : 'परिणाम: अनुत्तीर्ण')}
              </span>
            </div>
            <div className="text-sm font-black">
              {evaluation.totalMarks} / 400 ({evaluation.percentage}%)
            </div>
          </div>

          <p className="text-xs leading-relaxed opacity-90">
            {evaluation.summaryMessage[language]}
          </p>
        </div>
      </section>

      {/* Official Updates & Announcements Feed */}
      <section className="space-y-4">
        <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
          <Bell className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          {language === 'en' ? 'Latest Exam Announcements' : 'नवीनतम परीक्षा सूचनाएं'}
        </h2>

        <div className="space-y-3">
          {MOCK_EXAM_UPDATES.map((update) => (
            <div
              key={update.id}
              className={`p-5 rounded-2xl border transition-all bg-white dark:bg-slate-900 ${
                update.isImportant
                  ? 'border-blue-300 dark:border-blue-700 shadow-xs ring-1 ring-blue-500/10'
                  : 'border-slate-200 dark:border-slate-800 shadow-xs'
              }`}
            >
              <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 text-xs font-bold border border-blue-200 dark:border-blue-800">
                    {update.category}
                  </span>
                  {update.isImportant && (
                    <span className="px-2 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-300 text-xs font-bold border border-amber-200 dark:border-amber-800">
                      {language === 'en' ? 'IMPORTANT' : 'महत्वपूर्ण'}
                    </span>
                  )}
                </div>
                <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">{update.date}</span>
              </div>

              <h3 className="font-bold text-slate-900 dark:text-slate-100 text-base mb-2">
                {update.title[language]}
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed mb-3">
                {update.summary[language]}
              </p>

              <button
                onClick={() => setSelectedUpdate(update)}
                className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 flex items-center gap-1 cursor-pointer"
              >
                <span>{language === 'en' ? 'Read Complete Instructions' : 'पूरा विवरण पढ़ें'}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* Frequently Asked Questions (FAQ) Section */}
      <section className="bg-white dark:bg-slate-900 rounded-2xl p-5 sm:p-7 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
        <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
          <HelpCircle className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          {language === 'en' ? 'Frequently Asked Questions (CA Foundation FAQ)' : 'अक्सर पूछे जाने वाले प्रश्न (FAQ)'}
        </h2>

        <div className="space-y-2.5">
          {EXAM_FAQS.map((faq) => {
            const isOpen = expandedFaqId === faq.id;
            return (
              <div
                key={faq.id}
                className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden transition-all"
              >
                <button
                  onClick={() => toggleFaq(faq.id)}
                  className="w-full p-4 text-left font-bold text-sm text-slate-900 dark:text-slate-100 flex items-center justify-between gap-3 bg-slate-50/50 dark:bg-slate-800/40 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
                >
                  <span>{faq.question[language]}</span>
                  {isOpen ? <ChevronUp className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
                </button>
                {isOpen && (
                  <div className="p-4 bg-white dark:bg-slate-900 text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed border-t border-slate-100 dark:border-slate-800">
                    {faq.answer[language]}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* Modal for Detailed Notification */}
      {selectedUpdate && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 relative animate-in fade-in zoom-in-95 duration-150 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-100 dark:border-slate-800">
              <span className="px-2.5 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300 text-xs font-bold">
                {selectedUpdate.category}
              </span>
              <span className="text-xs text-slate-400 font-medium">{selectedUpdate.date}</span>
            </div>

            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-3">
              {selectedUpdate.title[language]}
            </h3>

            <div className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 whitespace-pre-line leading-relaxed mb-6 bg-slate-50 dark:bg-slate-800/60 p-4 rounded-xl border border-slate-100 dark:border-slate-800 font-sans">
              {selectedUpdate.detailedContent[language]}
            </div>

            <div className="flex justify-end">
              <button
                onClick={() => setSelectedUpdate(null)}
                className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold cursor-pointer"
              >
                {language === 'en' ? 'Close' : 'बंद करें'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
