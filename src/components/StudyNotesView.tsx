import React, { useMemo, useState } from 'react';
import { ExamAttemptId, Language, StudyNote } from '../types';
import { PAPERS } from '../data/papersData';
import { MOCK_NOTES } from '../data/mockNotes';
import { SUPPORTED_EXAM_ATTEMPTS, filterNotesForAttempt, getAttemptMetadata } from '../utils/examAttempt';
import { 
  FileText, 
  Search, 
  Clock, 
  Sparkles, 
  Printer, 
  BookOpen, 
  Lightbulb, 
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Calendar,
} from 'lucide-react';

interface StudyNotesViewProps {
  language: Language;
  studyNotes?: StudyNote[];
  selectedAttempt: ExamAttemptId;
  onChangeAttempt?: (attempt: ExamAttemptId) => void;
}

export const StudyNotesView: React.FC<StudyNotesViewProps> = ({
  language,
  studyNotes,
  selectedAttempt,
  onChangeAttempt,
}) => {
  const allNotes = studyNotes && studyNotes.length > 0 ? studyNotes : MOCK_NOTES;
  const [selectedPaper, setSelectedPaper] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLargeFont, setIsLargeFont] = useState(false);
  const [showAllAttempts, setShowAllAttempts] = useState(false);

  const attemptNotes = useMemo(
    () => filterNotesForAttempt(allNotes, selectedAttempt, showAllAttempts),
    [allNotes, selectedAttempt, showAllAttempts]
  );
  const [expandedNoteId, setExpandedNoteId] = useState<string | null>(attemptNotes[0]?.id || null);

  const attemptMeta = useMemo(() => getAttemptMetadata(selectedAttempt), [selectedAttempt]);

  const filteredNotes = attemptNotes.filter((note) => {
    if (selectedPaper !== 'all' && note.paperId !== selectedPaper) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchEn = note.topicTitle.en.toLowerCase().includes(q) || note.chapterTitle.en.toLowerCase().includes(q);
      const matchHi = note.topicTitle.hi.toLowerCase().includes(q) || note.chapterTitle.hi.toLowerCase().includes(q);
      const matchTag = note.tags.some((t) => t.toLowerCase().includes(q));
      if (!matchEn && !matchHi && !matchTag) return false;
    }
    return true;
  });

  const toggleExpand = (id: string) => {
    setExpandedNoteId((prev) => (prev === id ? null : id));
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 pb-20 lg:pb-8">
      {/* Header and Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[#0F1E46] dark:text-slate-100 flex items-center gap-2">
            <FileText className="w-6 h-6 text-violet-700 dark:text-violet-400" />
            {language === 'en'
              ? `CA Foundation Study Notes (${attemptMeta.shortLabel.en})`
              : `सीए फाउंडेशन रिवीजन नोट्स (${attemptMeta.shortLabel.hi})`}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            {attemptMeta.syllabusNote[language]}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {onChangeAttempt && (
            <div className="inline-flex items-center gap-1 p-1 rounded-xl bg-slate-100 dark:bg-[#131E3D] border border-slate-200 dark:border-[#24335C]">
              <Calendar className="w-3.5 h-3.5 text-violet-700 dark:text-violet-400 ml-1" />
              {SUPPORTED_EXAM_ATTEMPTS.map((attempt) => {
                const meta = getAttemptMetadata(attempt);
                const active = selectedAttempt === attempt;
                return (
                  <button
                    key={attempt}
                    type="button"
                    onClick={() => onChangeAttempt(attempt)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      active
                        ? 'bg-gradient-to-r from-[#172554] to-violet-700 text-white shadow-xs'
                        : 'text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    {meta.shortLabel[language]}
                  </button>
                );
              })}
            </div>
          )}

          <button
            type="button"
            onClick={() => setShowAllAttempts((prev) => !prev)}
            className={`px-3 py-1.5 rounded-lg border text-xs font-semibold transition-colors cursor-pointer ${
              showAllAttempts
                ? 'bg-violet-700 border-violet-700 text-white'
                : 'border-slate-200 dark:border-[#24335C] text-slate-600 dark:text-slate-300'
            }`}
          >
            {showAllAttempts ? (language === 'en' ? 'All Notes' : 'सभी नोट्स') : attemptMeta.shortLabel[language]}
          </button>

          {/* Font size toggle */}
          <button
            onClick={() => setIsLargeFont(!isLargeFont)}
            className={`px-3 py-1.5 rounded-lg border text-xs font-semibold transition-colors cursor-pointer ${
              isLargeFont
                ? 'bg-violet-50 dark:bg-violet-950/70 border-violet-400 dark:border-violet-500 text-violet-700 dark:text-violet-300'
                : 'border-slate-200 dark:border-[#24335C] text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-[#131E3D]'
            }`}
          >
            {isLargeFont ? (language === 'en' ? 'Text Size: Large' : 'अक्षर: बड़ा') : (language === 'en' ? 'Text Size: Normal' : 'अक्षर: सामान्य')}
          </button>

          {/* Print button */}
          <button
            onClick={handlePrint}
            title={language === 'en' ? 'Print or Save Notes as PDF' : 'नोट्स प्रिंट या पीडीएफ सेव करें'}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-[#24335C] text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-[#131E3D] text-xs font-semibold cursor-pointer"
          >
            <Printer className="w-4 h-4 text-slate-500 dark:text-slate-400" />
            <span className="hidden sm:inline">{language === 'en' ? 'Print / PDF' : 'प्रिंट'}</span>
          </button>
        </div>
      </div>

      {/* Filter Chips & Search Bar */}
      <div className="bg-white dark:bg-[#0F1936] rounded-xl p-3 border border-slate-200/90 dark:border-[#213059] shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder={language === 'en' ? 'Search by topic, formula, or tag (e.g. TVM, Section 10)...' : 'अध्याय, सूत्र या टैग से खोजें (उदा. TVM, धारा 10)...'}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-200 dark:border-[#24335C] bg-white dark:bg-[#131E3D] text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 text-xs focus:outline-violet-500"
          />
        </div>

        {/* Paper selector */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0">
          <button
            onClick={() => setSelectedPaper('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
              selectedPaper === 'all'
                ? 'bg-violet-700 text-white shadow-xs'
                : 'border border-slate-200 dark:border-[#24335C] text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-[#131E3D]'
            }`}
          >
            {language === 'en' ? 'All' : 'सभी'}
          </button>
          {PAPERS.map((p) => (
            <button
              key={p.id}
              onClick={() => setSelectedPaper(p.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                selectedPaper === p.id
                  ? 'bg-violet-700 text-white shadow-xs'
                  : 'border border-slate-200 dark:border-[#24335C] text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-[#131E3D]'
              }`}
            >
              {p.code}
            </button>
          ))}
        </div>
      </div>

      {/* Notes List */}
      <div className="space-y-4">
        {filteredNotes.length === 0 ? (
          <div className="bg-white dark:bg-[#0F1936] rounded-xl p-8 text-center border border-dashed border-slate-300 dark:border-[#24335C]">
            <BookOpen className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
              {language === 'en' ? 'No revision notes match your search.' : 'आपकी खोज के अनुसार कोई नोट्स नहीं मिले।'}
            </p>
          </div>
        ) : (
          filteredNotes.map((note) => {
            const paper = PAPERS.find((p) => p.id === note.paperId);
            const isExpanded = expandedNoteId === note.id;

            return (
              <article
                key={note.id}
                className="bg-white dark:bg-[#0F1936] rounded-2xl border border-slate-200/90 dark:border-[#213059] shadow-xs hover:border-violet-300 dark:hover:border-violet-600 transition-all overflow-hidden"
              >
                {/* Note Card Header */}
                <div
                  onClick={() => toggleExpand(note.id)}
                  className="p-5 flex items-start justify-between gap-3 cursor-pointer bg-slate-50/50 dark:bg-[#131E3D]/60 hover:bg-slate-50 dark:hover:bg-[#18264D] transition-colors"
                >
                  <div className="space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="px-2 py-0.5 rounded-md bg-violet-100 dark:bg-violet-950 text-violet-800 dark:text-violet-300 text-[11px] font-bold border border-violet-200 dark:border-violet-800">
                        {paper?.code || 'CA NOTE'}
                      </span>
                      <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold">
                        {note.chapterTitle[language]}
                      </span>
                      <span className="text-[11px] text-slate-400 dark:text-slate-500 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {note.readTimeMinutes} {language === 'en' ? 'min read' : 'मिनट'}
                      </span>
                    </div>

                    <h2 className="text-base sm:text-lg font-bold text-[#0F1E46] dark:text-slate-100">
                      {note.topicTitle[language]}
                    </h2>

                    <div className="flex flex-wrap gap-1.5 pt-0.5">
                      {note.tags.map((tag, tIdx) => (
                        <span
                          key={tIdx}
                          className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[10px] font-medium"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  </div>

                  <button className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200">
                    {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                  </button>
                </div>

                {/* Expanded Detailed Content */}
                {isExpanded && (
                  <div className={`p-5 sm:p-7 space-y-5 border-t border-slate-100 dark:border-slate-800 ${isLargeFont ? 'text-base' : 'text-sm'}`}>
                    {/* Executive Summary */}
                    <div className="p-3.5 bg-blue-50/60 dark:bg-blue-950/40 rounded-xl border border-blue-200/70 dark:border-blue-800/50">
                      <p className="font-medium text-blue-950 dark:text-blue-200 leading-relaxed">
                        {note.summary[language]}
                      </p>
                    </div>

                    {/* Key High-Yield Points */}
                    <div className="space-y-2.5">
                      <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                        {language === 'en' ? 'Key Exam Takeaways:' : 'परीक्षा हेतु मुख्य बिंदु:'}
                      </h3>
                      <div className="space-y-2 pl-1">
                        {note.keyPoints.map((pt, idx) => (
                          <div key={idx} className="flex items-start gap-2.5 text-slate-700 dark:text-slate-300">
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-600 dark:bg-blue-400 mt-2 shrink-0" />
                            <p className="leading-relaxed">{pt[language]}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Formulas / Statutory Rules Section */}
                    {note.formulasOrRules && note.formulasOrRules.length > 0 && (
                      <div className="space-y-2.5 pt-2">
                        <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm flex items-center gap-2">
                          <Lightbulb className="w-4 h-4 text-amber-500" />
                          {language === 'en' ? 'Core Formulas & Legal Rules:' : 'मुख्य सूत्र एवं कानूनी प्रावधान:'}
                        </h3>
                        <div className="grid grid-cols-1 gap-2.5">
                          {note.formulasOrRules.map((rule, rIdx) => (
                            <div key={rIdx} className="p-3.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl space-y-1">
                              <span className="font-bold text-xs text-slate-900 dark:text-slate-100 block">
                                {rule.title[language]}
                              </span>
                              <p className="text-xs text-slate-700 dark:text-slate-300 font-mono leading-relaxed bg-white dark:bg-slate-900 p-2 rounded-md border border-slate-200/60 dark:border-slate-700">
                                {rule.detail[language]}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Mnemonic Memory Trick */}
                    {note.mnemonic && (
                      <div className="p-4 rounded-xl bg-gradient-to-r from-amber-50 to-yellow-50 dark:from-amber-950/40 dark:to-yellow-950/30 border border-amber-300/80 dark:border-amber-700/50 flex items-start gap-3">
                        <Sparkles className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                        <div>
                          <span className="text-[11px] font-extrabold uppercase tracking-wider text-amber-800 dark:text-amber-300 block mb-0.5">
                            {language === 'en' ? 'CA Saathi Memory Mnemonic Trick:' : 'सीए साथी याद रखने की ट्रिक (Mnemonic):'}
                          </span>
                          <span className="text-base font-black text-amber-950 dark:text-amber-200 font-mono tracking-widest block mb-1">
                            {note.mnemonic.word}
                          </span>
                          <p className="text-xs text-amber-900 dark:text-amber-200/90 leading-relaxed font-medium">
                            {note.mnemonic.meaning[language]}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </article>
            );
          })
        )}
      </div>
    </div>
  );
};
