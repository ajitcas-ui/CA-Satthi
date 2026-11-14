import React, { useMemo, useState } from 'react';
import {
  ExamAttemptId,
  Language,
  MaterialCategory,
  PaperId,
  StudyNote,
  StudyPdfMaterial,
  SubjectChapter,
  UserProfile,
} from '../types';
import { PAPERS } from '../data/papersData';
import { CANONICAL_SYLLABUS } from '../data/syllabusData';
import { MOCK_NOTES } from '../data/mockNotes';
import { SUPPORTED_EXAM_ATTEMPTS, filterNotesForAttempt, getAttemptMetadata } from '../utils/examAttempt';
import {
  MATERIAL_CATEGORIES,
  canStudentUploadNotes,
  filterStudyMaterialsHierarchy,
  formatFileSize,
} from '../utils/studyMaterials';
import { fetchAuthorizedPdfBlobUrl } from '../firebase/services';
import { PdfReaderModal } from './PdfReaderModal';
import { NoteUploadModal } from './NoteUploadModal';
import {
  BookOpen,
  Calendar,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock,
  Download,
  Eye,
  FileText,
  FileUp,
  FolderOpen,
  Lightbulb,
  Loader2,
  Printer,
  Search,
  Sparkles,
  User,
} from 'lucide-react';

interface StudyNotesViewProps {
  language: Language;
  studyNotes?: StudyNote[];
  pdfMaterials?: StudyPdfMaterial[];
  mySubmittedNotes?: StudyPdfMaterial[];
  subjectChapters?: SubjectChapter[];
  currentUser?: UserProfile;
  isSuperAdmin?: boolean;
  selectedAttempt: ExamAttemptId;
  onChangeAttempt?: (attempt: ExamAttemptId) => void;
}

export const StudyNotesView: React.FC<StudyNotesViewProps> = ({
  language,
  studyNotes,
  pdfMaterials = [],
  mySubmittedNotes = [],
  subjectChapters,
  currentUser,
  isSuperAdmin = false,
  selectedAttempt,
  onChangeAttempt,
}) => {
  const allNotes = studyNotes && studyNotes.length > 0 ? studyNotes : MOCK_NOTES;
  const allChapters = subjectChapters && subjectChapters.length >= 46 ? subjectChapters : CANONICAL_SYLLABUS;

  const [selectedPaper, setSelectedPaper] = useState<'all' | PaperId>('all');
  const [selectedChapterId, setSelectedChapterId] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<'all' | MaterialCategory>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLargeFont, setIsLargeFont] = useState(false);
  const [showAllAttempts, setShowAllAttempts] = useState(false);

  const [activeReaderMaterial, setActiveReaderMaterial] = useState<StudyPdfMaterial | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [downloadError, setDownloadError] = useState<string | null>(null);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [showMySubmissions, setShowMySubmissions] = useState(false);

  const canUpload = canStudentUploadNotes(currentUser, isSuperAdmin);

  const chaptersForSelectedPaper = useMemo(() => {
    if (selectedPaper === 'all') return [];
    return allChapters
      .filter((c) => c.paperId === selectedPaper)
      .sort((a, b) => a.chapterNumber - b.chapterNumber);
  }, [allChapters, selectedPaper]);

  const handlePaperSelect = (nextPaper: 'all' | PaperId) => {
    setSelectedPaper(nextPaper);
    setSelectedChapterId('all');
  };

  const attemptNotes = useMemo(
    () => filterNotesForAttempt(allNotes, selectedAttempt, showAllAttempts),
    [allNotes, selectedAttempt, showAllAttempts]
  );
  const [expandedNoteId, setExpandedNoteId] = useState<string | null>(attemptNotes[0]?.id || null);

  const attemptMeta = useMemo(() => getAttemptMetadata(selectedAttempt), [selectedAttempt]);

  const filteredPdfMaterials = useMemo(
    () =>
      filterStudyMaterialsHierarchy(pdfMaterials, {
        paperId: selectedPaper,
        chapterId: selectedChapterId,
        attempt: showAllAttempts ? 'all' : selectedAttempt,
        category: selectedCategory,
        status: 'approved',
        search: searchQuery,
      }),
    [pdfMaterials, selectedPaper, selectedChapterId, showAllAttempts, selectedAttempt, selectedCategory, searchQuery]
  );

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

  const handleDownloadPdf = async (mat: StudyPdfMaterial) => {
    setDownloadError(null);
    setDownloadingId(mat.id);
    try {
      const { blobUrl, revoke } = await fetchAuthorizedPdfBlobUrl(mat, true);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = mat.fileName || `${mat.id}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => revoke(), 5000);
    } catch (err) {
      setDownloadError(err instanceof Error ? err.message : 'Unable to download PDF.');
    } finally {
      setDownloadingId(null);
    }
  };

  const toggleExpand = (id: string) => {
    setExpandedNoteId((prev) => (prev === id ? null : id));
  };

  return (
    <div className="space-y-6 pb-20 lg:pb-8">
      {/* Header and Top Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-[#0F1E46] dark:text-slate-100 flex items-center gap-2 tracking-tight">
            <FileText className="w-6 h-6 text-violet-700 dark:text-violet-400" />
            {language === 'en'
              ? `CA Foundation Study Material & Notes (${attemptMeta.shortLabel.en})`
              : `सीए फाउंडेशन अध्ययन सामग्री व नोट्स (${attemptMeta.shortLabel.hi})`}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            {attemptMeta.syllabusNote[language]}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Authorized Contributor Upload Button — strictly hidden for unauthorized students */}
          {canUpload && (
            <button
              type="button"
              onClick={() => setIsUploadModalOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-[#172554] to-violet-700 hover:from-[#0F1E46] hover:to-violet-800 text-white text-xs font-bold shadow-sm cursor-pointer"
            >
              <FileUp className="w-4 h-4" />
              <span>{language === 'hi' ? 'PDF नोट्स अपलोड करें' : 'Upload Notes (PDF)'}</span>
            </button>
          )}

          {(canUpload || mySubmittedNotes.length > 0) && (
            <button
              type="button"
              onClick={() => setShowMySubmissions((prev) => !prev)}
              className={`px-3 py-1.5 rounded-xl border text-xs font-bold cursor-pointer ${
                showMySubmissions
                  ? 'bg-violet-50 dark:bg-violet-950/60 border-violet-400 text-violet-800 dark:text-violet-300'
                  : 'border-slate-200 dark:border-[#24335C] text-slate-700 dark:text-slate-300'
              }`}
            >
              {language === 'hi'
                ? `मेरे अपलोड (${mySubmittedNotes.length})`
                : `My Uploads (${mySubmittedNotes.length})`}
            </button>
          )}

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
            {showAllAttempts ? (language === 'en' ? 'All Attempts' : 'सभी प्रयास') : attemptMeta.shortLabel[language]}
          </button>

          <button
            type="button"
            onClick={() => setIsLargeFont(!isLargeFont)}
            className={`px-3 py-1.5 rounded-lg border text-xs font-semibold transition-colors cursor-pointer ${
              isLargeFont
                ? 'bg-violet-50 dark:bg-violet-950/70 border-violet-400 dark:border-violet-500 text-violet-700 dark:text-violet-300'
                : 'border-slate-200 dark:border-[#24335C] text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-[#131E3D]'
            }`}
          >
            {isLargeFont ? (language === 'en' ? 'Text: Large' : 'अक्षर: बड़ा') : (language === 'en' ? 'Text: Normal' : 'अक्षर: सामान्य')}
          </button>

          <button
            type="button"
            onClick={() => window.print()}
            title={language === 'en' ? 'Print or Save Notes as PDF' : 'नोट्स प्रिंट या पीडीएफ सेव करें'}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-[#24335C] text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-[#131E3D] text-xs font-semibold cursor-pointer"
          >
            <Printer className="w-4 h-4 text-slate-500 dark:text-slate-400" />
            <span className="hidden sm:inline">{language === 'en' ? 'Print' : 'प्रिंट'}</span>
          </button>
        </div>
      </div>

      {/* Student's Own Submissions Tracker (Visible only when student uploaded or permitted) */}
      {showMySubmissions && (
        <section className="bg-white dark:bg-[#0F1936] rounded-2xl p-4 sm:p-5 border border-violet-200 dark:border-violet-800/70 space-y-3 shadow-xs">
          <div className="flex items-center justify-between gap-2">
            <div>
              <h2 className="text-sm font-extrabold text-[#0F1E46] dark:text-white">
                {language === 'hi' ? 'मेरे अपलोड किए गए PDF नोट्स (स्थिति ट्रैकर)' : 'My Submitted PDF Notes & Approval Status'}
              </h2>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                {language === 'hi'
                  ? 'एडमिन द्वारा स्वीकृत होने पर आपके नोट्स सभी छात्रों को दिखाई देंगे।'
                  : 'Admin reviews every uploaded file before publishing to peers.'}
              </p>
            </div>
            {canUpload && (
              <button
                type="button"
                onClick={() => setIsUploadModalOpen(true)}
                className="px-3 py-1.5 rounded-lg bg-violet-700 text-white text-xs font-bold cursor-pointer"
              >
                + Upload New
              </button>
            )}
          </div>

          {mySubmittedNotes.length === 0 ? (
            <p className="text-xs text-slate-500 dark:text-slate-400 py-4 text-center border border-dashed border-slate-200 dark:border-[#24335C] rounded-xl">
              {language === 'hi'
                ? 'आपने अभी तक कोई PDF नोट्स अपलोड नहीं किए हैं।'
                : 'You have not submitted any PDF notes yet.'}
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {mySubmittedNotes.map((sub) => (
                <div
                  key={sub.id}
                  className="p-3.5 rounded-xl border border-slate-200 dark:border-[#24335C] bg-slate-50/70 dark:bg-[#131E3D] space-y-1.5 text-xs"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-bold text-[#0F1E46] dark:text-white truncate">{sub.title}</span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase shrink-0 ${
                        sub.status === 'approved'
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                          : sub.status === 'rejected'
                            ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                            : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                      }`}
                    >
                      {sub.status}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    {sub.paperId.toUpperCase()} · Ch {sub.chapterNumber}: {sub.chapterTitle} · {sub.attempt} · {sub.category}
                  </p>
                  {sub.status === 'rejected' && sub.rejectionReason && (
                    <p className="text-[11px] text-rose-600 dark:text-rose-300 font-medium">
                      Admin Feedback: {sub.rejectionReason}
                    </p>
                  )}
                  <div className="flex items-center justify-between pt-1">
                    <span className="text-[10px] text-slate-400">
                      {new Date(sub.createdAt).toLocaleDateString()} · {formatFileSize(sub.fileSizeBytes)}
                    </span>
                    <button
                      type="button"
                      onClick={() => setActiveReaderMaterial(sub)}
                      className="text-violet-700 dark:text-violet-400 font-bold hover:underline cursor-pointer flex items-center gap-1"
                    >
                      <Eye className="w-3 h-3" />
                      Preview
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* Subject, Chapter, Category & Search Filters */}
      <div className="bg-white dark:bg-[#0F1936] rounded-2xl p-4 border border-slate-200/90 dark:border-[#213059] shadow-xs space-y-3">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder={
                language === 'en'
                  ? 'Search PDFs, chapters, handwritten notes, PYQs, or uploader...'
                  : 'PDF नोट्स, अध्याय, हस्तलिखित नोट्स या विषय खोजें...'
              }
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 dark:border-[#24335C] bg-white dark:bg-[#131E3D] text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 text-xs focus:outline-violet-500"
            />
          </div>

          {/* Paper Selector */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 lg:pb-0">
            <button
              type="button"
              onClick={() => handlePaperSelect('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                selectedPaper === 'all'
                  ? 'bg-[#172554] text-white shadow-xs'
                  : 'border border-slate-200 dark:border-[#24335C] text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-[#131E3D]'
              }`}
            >
              {language === 'en' ? 'All 4 Subjects' : 'सभी 4 विषय'}
            </button>
            {PAPERS.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => handlePaperSelect(p.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                  selectedPaper === p.id
                    ? 'bg-violet-700 text-white shadow-xs'
                    : 'border border-slate-200 dark:border-[#24335C] text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-[#131E3D]'
                }`}
              >
                {p.code}: {p.name[language].split(' ')[0]}
              </button>
            ))}
          </div>
        </div>

        {/* Nested Chapter Dropdown (for selected subject) + Material Category Filter Chips */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pt-2 border-t border-slate-100 dark:border-[#1E2B52]">
          {selectedPaper !== 'all' ? (
            <select
              value={selectedChapterId}
              onChange={(e) => setSelectedChapterId(e.target.value)}
              aria-label="Filter by syllabus chapter"
              className="px-3 py-1.5 rounded-xl border border-violet-200 dark:border-violet-800 bg-violet-50/60 dark:bg-[#131E3D] text-xs font-semibold text-[#0F1E46] dark:text-slate-100 sm:max-w-xs"
            >
              <option value="all">
                {language === 'hi'
                  ? `सभी अध्याय (${chaptersForSelectedPaper.length})`
                  : `All Chapters (${chaptersForSelectedPaper.length})`}
              </option>
              {chaptersForSelectedPaper.map((c) => (
                <option key={c.id} value={c.id}>
                  Ch {c.chapterNumber}: {c.title[language]}
                </option>
              ))}
            </select>
          ) : (
            <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
              {language === 'hi'
                ? 'अध्याय अनुसार फ़िल्टर करने के लिए ऊपर विषय चुनें (कुल 46 अध्याय)'
                : 'Select a subject above to filter across all 46 ICAI chapters'}
            </span>
          )}

          <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5">
            <button
              type="button"
              onClick={() => setSelectedCategory('all')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold whitespace-nowrap cursor-pointer ${
                selectedCategory === 'all'
                  ? 'bg-violet-700 text-white'
                  : 'bg-slate-100 dark:bg-[#131E3D] text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-[#1B2A54]'
              }`}
            >
              {language === 'hi' ? 'सभी श्रेणियाँ' : 'All Categories'}
            </button>
            {MATERIAL_CATEGORIES.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold whitespace-nowrap cursor-pointer ${
                  selectedCategory === cat
                    ? 'bg-violet-700 text-white'
                    : 'bg-slate-100 dark:bg-[#131E3D] text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-[#1B2A54]'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      {downloadError && (
        <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-xs font-semibold text-rose-700 dark:text-rose-300">
          {downloadError}
        </div>
      )}

      {/* Structured PDF Study Materials Library (Handwritten Notes, Chapter PDFs, Practice, PYQs, Mocks) */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-extrabold text-[#0F1E46] dark:text-white flex items-center gap-2">
            <FolderOpen className="w-5 h-5 text-violet-700 dark:text-violet-400" />
            <span>
              {language === 'hi'
                ? `PDF अध्ययन पुस्तकालय एवं हस्तलिखित नोट्स (${filteredPdfMaterials.length})`
                : `PDF Notes & Study Material Library (${filteredPdfMaterials.length})`}
            </span>
          </h2>
          <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
            {showAllAttempts ? 'Jan 2027 + May 2027' : attemptMeta.fullLabel[language]}
          </span>
        </div>

        {filteredPdfMaterials.length === 0 ? (
          <div className="bg-white dark:bg-[#0F1936] rounded-2xl p-6 text-center border border-dashed border-slate-300 dark:border-[#24335C] space-y-2">
            <FileText className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto" />
            <p className="text-xs sm:text-sm font-bold text-[#0F1E46] dark:text-slate-200">
              {language === 'hi'
                ? 'चयनित फ़िल्टर के अनुसार अभी कोई स्वीकृत PDF सामग्री उपलब्ध नहीं है।'
                : 'No approved PDF materials match the current Subject / Chapter / Category filter yet.'}
            </p>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              {language === 'hi'
                ? 'नीचे त्वरित अध्याय-वार रिवीजन कार्ड और सूत्र उपलब्ध हैं, या फ़िल्टर बदलकर देखें।'
                : 'Quick chapter revision cards remain available below, or clear filters to view all uploaded PDFs.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredPdfMaterials.map((mat) => {
              const paper = PAPERS.find((p) => p.id === mat.paperId);
              const isBusyDl = downloadingId === mat.id;
              return (
                <article
                  key={mat.id}
                  className="bg-white dark:bg-[#0F1936] rounded-2xl p-5 border border-slate-200/90 dark:border-[#213059] shadow-xs hover:border-violet-400 dark:hover:border-violet-500 transition-all flex flex-col justify-between gap-4"
                >
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="px-2 py-0.5 rounded-md bg-[#172554] text-white text-[10px] font-bold">
                        {paper?.code || mat.paperId.toUpperCase()}
                      </span>
                      <span className="px-2 py-0.5 rounded-md bg-violet-100 dark:bg-violet-950 text-violet-800 dark:text-violet-300 text-[10px] font-bold">
                        {mat.category}
                      </span>
                      <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-[#131E3D] text-slate-600 dark:text-slate-300 text-[10px] font-semibold">
                        {mat.attempt === 'Both' ? 'Jan & May 2027' : mat.attempt}
                      </span>
                    </div>

                    <h3 className="text-sm sm:text-base font-extrabold text-[#0F1E46] dark:text-white leading-snug">
                      {mat.title}
                    </h3>

                    <p className="text-xs font-semibold text-violet-700 dark:text-violet-400">
                      Ch {mat.chapterNumber}: {mat.chapterTitle}
                    </p>

                    {mat.description && (
                      <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2 leading-relaxed">
                        {mat.description}
                      </p>
                    )}
                  </div>

                  <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-[#1E2B52]">
                    <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-500 dark:text-slate-400">
                      <span className="inline-flex items-center gap-1 font-medium">
                        <User className="w-3.5 h-3.5 text-slate-400" />
                        {mat.uploaderName} ({mat.uploaderRole === 'admin' ? 'Faculty' : 'Student'})
                      </span>
                      <span className="tabular-nums">
                        {new Date(mat.createdAt).toLocaleDateString()} · {formatFileSize(mat.fileSizeBytes)}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setActiveReaderMaterial(mat)}
                        className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-gradient-to-r from-[#172554] to-violet-700 hover:from-[#0F1E46] hover:to-violet-800 text-white text-xs font-bold shadow-xs cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>{language === 'hi' ? 'ऐप में PDF पढ़ें' : 'Read PDF'}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDownloadPdf(mat)}
                        disabled={isBusyDl}
                        className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 dark:border-[#24335C] hover:bg-slate-50 dark:hover:bg-[#131E3D] text-xs font-bold text-[#0F1E46] dark:text-slate-200 cursor-pointer disabled:opacity-50"
                      >
                        {isBusyDl ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Download className="w-3.5 h-3.5" />
                        )}
                        <span>{language === 'hi' ? 'डाउनलोड' : 'Download'}</span>
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      {/* Preserved Bilingual Quick Revision Summary Notes & Mnemonics */}
      <section className="space-y-4 pt-2">
        <h2 className="text-base font-extrabold text-[#0F1E46] dark:text-white flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-violet-700 dark:text-violet-400" />
          <span>
            {language === 'hi'
              ? `त्वरित रिवीजन कार्ड व सूत्र (${filteredNotes.length})`
              : `Quick Revision Cards & Formula Summaries (${filteredNotes.length})`}
          </span>
        </h2>

        {filteredNotes.length === 0 ? (
          <div className="bg-white dark:bg-[#0F1936] rounded-xl p-8 text-center border border-dashed border-slate-300 dark:border-[#24335C]">
            <BookOpen className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
              {language === 'en' ? 'No revision cards match your search.' : 'आपकी खोज के अनुसार कोई रिवीजन कार्ड नहीं मिले।'}
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

                    <h3 className="text-base sm:text-lg font-bold text-[#0F1E46] dark:text-slate-100">
                      {note.topicTitle[language]}
                    </h3>

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

                  <button type="button" className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200">
                    {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                  </button>
                </div>

                {isExpanded && (
                  <div className={`p-5 sm:p-7 space-y-5 border-t border-slate-100 dark:border-slate-800 ${isLargeFont ? 'text-base' : 'text-sm'}`}>
                    <div className="p-3.5 bg-blue-50/60 dark:bg-blue-950/40 rounded-xl border border-blue-200/70 dark:border-blue-800/50">
                      <p className="font-medium text-blue-950 dark:text-blue-200 leading-relaxed">
                        {note.summary[language]}
                      </p>
                    </div>

                    <div className="space-y-2.5">
                      <h4 className="font-bold text-slate-900 dark:text-slate-100 text-sm flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                        {language === 'en' ? 'Key Exam Takeaways:' : 'परीक्षा हेतु मुख्य बिंदु:'}
                      </h4>
                      <div className="space-y-2 pl-1">
                        {note.keyPoints.map((pt, idx) => (
                          <div key={idx} className="flex items-start gap-2.5 text-slate-700 dark:text-slate-300">
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-600 dark:bg-blue-400 mt-2 shrink-0" />
                            <p className="leading-relaxed">{pt[language]}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    {note.formulasOrRules && note.formulasOrRules.length > 0 && (
                      <div className="space-y-2.5 pt-2">
                        <h4 className="font-bold text-slate-900 dark:text-slate-100 text-sm flex items-center gap-2">
                          <Lightbulb className="w-4 h-4 text-amber-500" />
                          {language === 'en' ? 'Core Formulas & Legal Rules:' : 'मुख्य सूत्र एवं कानूनी प्रावधान:'}
                        </h4>
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
      </section>

      {/* Embedded In-App PDF Reader Modal */}
      <PdfReaderModal
        material={activeReaderMaterial}
        language={language}
        onClose={() => setActiveReaderMaterial(null)}
      />

      {/* Authorized Contributor Upload Modal */}
      {canUpload && currentUser && (
        <NoteUploadModal
          isOpen={isUploadModalOpen}
          onClose={() => setIsUploadModalOpen(false)}
          language={language}
          currentUser={currentUser}
          defaultAttempt={selectedAttempt}
          chapters={allChapters}
          onUploaded={() => {
            setShowMySubmissions(true);
          }}
        />
      )}
    </div>
  );
};
