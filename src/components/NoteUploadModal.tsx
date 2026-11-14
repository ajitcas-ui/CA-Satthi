import React, { useMemo, useState } from 'react';
import {
  ExamAttemptId,
  Language,
  MaterialAttemptScope,
  MaterialCategory,
  PaperId,
  StudyPdfMaterial,
  SubjectChapter,
  UserProfile,
} from '../types';
import { PAPERS } from '../data/papersData';
import { CANONICAL_SYLLABUS } from '../data/syllabusData';
import {
  MATERIAL_ATTEMPT_SCOPES,
  MATERIAL_CATEGORIES,
  MAX_PDF_SIZE_BYTES,
  formatFileSize,
  validatePdfMetadata,
} from '../utils/studyMaterials';
import { uploadPdfAndCreateNoteMaterial } from '../firebase/services';
import { AlertCircle, CheckCircle2, FileUp, Loader2, ShieldCheck, Upload, X } from 'lucide-react';

interface NoteUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  language: Language;
  currentUser: UserProfile;
  defaultAttempt: ExamAttemptId;
  chapters?: SubjectChapter[];
  onUploaded?: (material: StudyPdfMaterial) => void;
}

export const NoteUploadModal: React.FC<NoteUploadModalProps> = ({
  isOpen,
  onClose,
  language,
  currentUser,
  defaultAttempt,
  chapters,
  onUploaded,
}) => {
  const allChapters = chapters && chapters.length >= 46 ? chapters : CANONICAL_SYLLABUS;

  const [title, setTitle] = useState('');
  const [paperId, setPaperId] = useState<PaperId>('paper1');
  const subjectChapters = useMemo(
    () =>
      allChapters
        .filter((c) => c.paperId === paperId)
        .sort((a, b) => a.chapterNumber - b.chapterNumber),
    [allChapters, paperId]
  );

  const [chapterId, setChapterId] = useState<string>(() => subjectChapters[0]?.id || 'ch_p1_01');
  const [attempt, setAttempt] = useState<MaterialAttemptScope>(defaultAttempt);
  const [category, setCategory] = useState<MaterialCategory>('Handwritten Notes');
  const [description, setDescription] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handlePaperChange = (nextPaper: PaperId) => {
    setPaperId(nextPaper);
    const firstCh = allChapters
      .filter((c) => c.paperId === nextPaper)
      .sort((a, b) => a.chapterNumber - b.chapterNumber)[0];
    if (firstCh) {
      setChapterId(firstCh.id);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setErrorMsg(null);
    const file = e.target.files?.[0] || null;
    if (!file) {
      setSelectedFile(null);
      return;
    }
    if (!file.name.toLowerCase().endsWith('.pdf') || (file.type && file.type !== 'application/pdf')) {
      setErrorMsg(
        language === 'hi'
          ? 'केवल .PDF फ़ाइलें ही अपलोड की जा सकती हैं।'
          : 'Only valid .PDF files are allowed.'
      );
      setSelectedFile(null);
      return;
    }
    if (file.size <= 0 || file.size > MAX_PDF_SIZE_BYTES) {
      setErrorMsg(
        language === 'hi'
          ? 'PDF फ़ाइल का आकार 15 MB से कम होना चाहिए।'
          : 'PDF file must be smaller than 15 MB.'
      );
      setSelectedFile(null);
      return;
    }
    setSelectedFile(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    const chObj = subjectChapters.find((c) => c.id === chapterId) || subjectChapters[0];
    if (!chObj) {
      setErrorMsg('Please select a syllabus chapter.');
      return;
    }

    const metaValidation = validatePdfMetadata({
      title,
      description,
      paperId,
      chapterId: chObj.id,
      chapterNumber: chObj.chapterNumber,
      chapterTitle: chObj.title.en,
      attempt,
      category,
    });

    if (!metaValidation.ok) {
      setErrorMsg(metaValidation.error);
      return;
    }

    if (!selectedFile) {
      setErrorMsg(language === 'hi' ? 'कृपया एक PDF फ़ाइल चुनें।' : 'Please select a PDF file to upload.');
      return;
    }

    setSubmitting(true);
    try {
      const created = await uploadPdfAndCreateNoteMaterial({
        file: selectedFile,
        metadata: {
          title: metaValidation.clean.title,
          description: metaValidation.clean.description,
          paperId: metaValidation.clean.paperId as PaperId,
          chapterId: metaValidation.clean.chapterId,
          chapterNumber: metaValidation.clean.chapterNumber,
          chapterTitle: metaValidation.clean.chapterTitle,
          attempt: metaValidation.clean.attempt as MaterialAttemptScope,
          category: metaValidation.clean.category as MaterialCategory,
        },
        uploader: currentUser,
      });

      setSuccessMsg(
        created.status === 'pending'
          ? language === 'hi'
            ? 'आपके नोट्स एडमिन समीक्षा के लिए सफलतापूर्वक भेजे गए हैं। स्वीकृति के बाद यह लाइब्रेरी में प्रकाशित होंगे।'
            : 'Notes submitted for Admin review! They will become visible to students once approved.'
          : language === 'hi'
            ? 'अध्ययन सामग्री सफलतापूर्वक प्रकाशित हो गई है।'
            : 'Study material uploaded and published!'
      );
      setTitle('');
      setDescription('');
      setSelectedFile(null);
      if (onUploaded) onUploaded(created);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to upload PDF.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-[#0B1739]/75 backdrop-blur-sm flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Upload Study Notes PDF"
    >
      <div className="bg-white dark:bg-[#0F1936] border border-slate-200 dark:border-[#24335C] rounded-2xl w-full max-w-xl max-h-[92vh] overflow-y-auto shadow-2xl">
        <div className="px-5 py-4 border-b border-slate-200 dark:border-[#213059] flex items-center justify-between bg-slate-50/70 dark:bg-[#0B1739]">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#172554] to-violet-700 text-white flex items-center justify-center">
              <FileUp className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-extrabold text-[#0F1E46] dark:text-white">
                {language === 'hi' ? 'अध्ययन नोट्स (PDF) अपलोड करें' : 'Upload Study Material (PDF)'}
              </h2>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                {language === 'hi'
                  ? 'एडमिन अनुमति प्राप्त योगदानकर्ता · अपलोड समीक्षा के बाद लाइव होगा'
                  : 'Authorized Contributor · Submissions go to Admin approval queue'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close upload modal"
            className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-200/70 dark:hover:bg-[#16244A] cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="p-3 rounded-xl bg-violet-50 dark:bg-violet-950/40 border border-violet-200 dark:border-violet-800/70 flex items-start gap-2.5 text-xs text-violet-900 dark:text-violet-200">
            <ShieldCheck className="w-4 h-4 text-violet-700 dark:text-violet-400 shrink-0 mt-0.5" />
            <span>
              {language === 'hi'
                ? 'आपके द्वारा अपलोड की गई PDF पहले एडमिन द्वारा जांची जाएगी। स्वीकृति मिलने पर सभी पात्र छात्रों को दिखाई देगी।'
                : 'Uploaded PDFs enter Pending Review automatically and are published to students after Owner verification.'}
            </span>
          </div>

          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-xs font-semibold text-rose-700 dark:text-rose-300 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-xs font-semibold text-emerald-700 dark:text-emerald-300 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              {language === 'hi' ? 'नोट्स शीर्षक *' : 'Title *'}
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Ch 4 AS-2 Inventory Valuation Handwritten Notes"
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-[#24335C] bg-white dark:bg-[#131E3D] text-xs focus:outline-violet-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                {language === 'hi' ? 'विषय (Subject) *' : 'Subject *'}
              </label>
              <select
                value={paperId}
                onChange={(e) => handlePaperChange(e.target.value as PaperId)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-[#24335C] bg-white dark:bg-[#131E3D] text-xs"
              >
                {PAPERS.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.code}: {p.name[language]}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                {language === 'hi' ? 'अध्याय (Chapter) *' : 'Chapter *'}
              </label>
              <select
                value={chapterId}
                onChange={(e) => setChapterId(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-[#24335C] bg-white dark:bg-[#131E3D] text-xs"
              >
                {subjectChapters.map((c) => (
                  <option key={c.id} value={c.id}>
                    Ch {c.chapterNumber}: {c.title[language]}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                {language === 'hi' ? 'परीक्षा प्रयास (Attempt) *' : 'Exam Attempt *'}
              </label>
              <select
                value={attempt}
                onChange={(e) => setAttempt(e.target.value as MaterialAttemptScope)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-[#24335C] bg-white dark:bg-[#131E3D] text-xs"
              >
                {MATERIAL_ATTEMPT_SCOPES.map((att) => (
                  <option key={att} value={att}>
                    {att === 'Both' ? 'Both (Jan 2027 & May 2027)' : att}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                {language === 'hi' ? 'सामग्री श्रेणी (Category) *' : 'Material Category *'}
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as MaterialCategory)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-[#24335C] bg-white dark:bg-[#131E3D] text-xs"
              >
                {MATERIAL_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              {language === 'hi' ? 'विवरण (Description)' : 'Description'}
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief summary of topics, formulas, or solved examples included in this PDF..."
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-[#24335C] bg-white dark:bg-[#131E3D] text-xs focus:outline-violet-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              {language === 'hi' ? 'PDF फ़ाइल चुनें (अधिकतम 15 MB) *' : 'Select PDF File (Max 15 MB) *'}
            </label>
            <label className="flex flex-col items-center justify-center p-4 rounded-xl border-2 border-dashed border-slate-300 dark:border-[#24335C] hover:border-violet-500 bg-slate-50/70 dark:bg-[#131E3D]/70 cursor-pointer transition-colors text-center">
              <Upload className="w-5 h-5 text-violet-600 mb-1.5" />
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                {selectedFile
                  ? `${selectedFile.name} (${formatFileSize(selectedFile.size)})`
                  : language === 'hi'
                    ? 'PDF चुनने के लिए क्लिक करें'
                    : 'Click to choose a .pdf document'}
              </span>
              <input
                type="file"
                accept=".pdf,application/pdf"
                onChange={handleFileChange}
                className="sr-only"
              />
            </label>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-200 dark:border-[#213059]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-200 dark:border-[#24335C] text-xs font-bold text-slate-600 dark:text-slate-300 cursor-pointer"
            >
              {language === 'hi' ? 'बंद करें' : 'Close'}
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#172554] to-violet-700 hover:from-[#0F1E46] hover:to-violet-800 text-white text-xs font-bold flex items-center gap-1.5 disabled:opacity-60 cursor-pointer"
            >
              {submitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <FileUp className="w-3.5 h-3.5" />}
              <span>
                {submitting
                  ? language === 'hi'
                    ? 'अपलोड हो रहा है...'
                    : 'Uploading...'
                  : language === 'hi'
                    ? 'समीक्षा के लिए भेजें'
                    : 'Submit for Review'}
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
