import React, { useEffect, useState } from 'react';
import { Language, StudyPdfMaterial } from '../types';
import { fetchAuthorizedPdfBlobUrl } from '../firebase/services';
import { formatFileSize } from '../utils/studyMaterials';
import { PAPERS } from '../data/papersData';
import {
  AlertCircle,
  Calendar,
  Download,
  FileText,
  Loader2,
  User,
  X,
} from 'lucide-react';

interface PdfReaderModalProps {
  material: StudyPdfMaterial | null;
  language?: Language;
  onClose: () => void;
}

export const PdfReaderModal: React.FC<PdfReaderModalProps> = ({
  material,
  language = 'en',
  onClose,
}) => {
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    if (!material) {
      setBlobUrl(null);
      setError(null);
      return;
    }

    let cancelled = false;
    let revokeFn: (() => void) | null = null;

    setLoading(true);
    setError(null);
    setBlobUrl(null);

    fetchAuthorizedPdfBlobUrl(material, false)
      .then(({ blobUrl: url, revoke }) => {
        if (cancelled) {
          revoke();
          return;
        }
        revokeFn = revoke;
        setBlobUrl(url);
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Unable to open PDF material.');
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
      if (revokeFn) revokeFn();
    };
  }, [material]);

  if (!material) return null;

  const paper = PAPERS.find((p) => p.id === material.paperId);

  const handleDownload = async () => {
    setDownloading(true);
    try {
      const { blobUrl: dlUrl, revoke } = await fetchAuthorizedPdfBlobUrl(material, true);
      const a = document.createElement('a');
      a.href = dlUrl;
      a.download = material.fileName || `${material.id}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => revoke(), 5000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Download failed.');
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-[#0B1739]/80 backdrop-blur-sm flex items-center justify-center p-2 sm:p-5"
      role="dialog"
      aria-modal="true"
      aria-label={material.title}
    >
      <div className="bg-white dark:bg-[#0F1936] border border-slate-200 dark:border-[#24335C] rounded-2xl w-full max-w-5xl h-[90vh] flex flex-col overflow-hidden shadow-2xl">
        {/* Reader Top Bar */}
        <div className="px-4 sm:px-6 py-3.5 border-b border-slate-200 dark:border-[#213059] bg-slate-50 dark:bg-[#0B1739] flex items-center justify-between gap-3">
          <div className="min-w-0 space-y-1">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="px-2 py-0.5 rounded-md bg-violet-100 dark:bg-violet-950 text-violet-800 dark:text-violet-300 text-[10px] font-bold">
                {paper?.code || material.paperId.toUpperCase()} · Ch {material.chapterNumber}
              </span>
              <span className="px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950/70 text-indigo-700 dark:text-indigo-300 text-[10px] font-bold">
                {material.category}
              </span>
              <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[10px] font-semibold flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                {material.attempt}
              </span>
            </div>
            <h2 className="text-sm sm:text-base font-extrabold text-[#0F1E46] dark:text-white truncate">
              {material.title}
            </h2>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 flex flex-wrap items-center gap-2 truncate">
              <span className="inline-flex items-center gap-1">
                <User className="w-3 h-3" />
                {language === 'hi' ? 'अपलोडकर्ता:' : 'Uploaded by'} {material.uploaderName}
              </span>
              <span>·</span>
              <span>{new Date(material.createdAt).toLocaleDateString()}</span>
              <span>·</span>
              <span>{formatFileSize(material.fileSizeBytes)}</span>
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleDownload}
              disabled={downloading || loading || Boolean(error)}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-gradient-to-r from-[#172554] to-violet-700 hover:from-[#0F1E46] hover:to-violet-800 text-white text-xs font-bold shadow-xs disabled:opacity-50 cursor-pointer"
            >
              {downloading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
              <span className="hidden sm:inline">{language === 'hi' ? 'PDF डाउनलोड' : 'Download PDF'}</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close PDF Reader"
              className="p-2 rounded-xl border border-slate-200 dark:border-[#24335C] text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#16244A] cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Embedded PDF Surface */}
        <div className="flex-1 bg-slate-100 dark:bg-[#080E21] relative flex items-center justify-center">
          {loading && (
            <div className="flex flex-col items-center gap-3 text-slate-600 dark:text-slate-300">
              <Loader2 className="w-8 h-8 animate-spin text-violet-600" />
              <p className="text-xs font-semibold">
                {language === 'hi' ? 'सुरक्षित PDF डॉक्यूमेंट लोड हो रहा है...' : 'Loading secure PDF reader...'}
              </p>
            </div>
          )}

          {!loading && error && (
            <div className="max-w-md mx-4 p-6 rounded-2xl bg-white dark:bg-[#0F1936] border border-rose-200 dark:border-rose-800 text-center space-y-3 shadow-sm">
              <AlertCircle className="w-8 h-8 text-rose-600 mx-auto" />
              <p className="text-sm font-bold text-slate-900 dark:text-white">{error}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {language === 'hi'
                  ? 'कृपया सुनिश्चित करें कि आपका ₹5 सदस्यता पास सक्रिय है।'
                  : 'Ensure you are signed in with an active ₹5 membership pass.'}
              </p>
            </div>
          )}

          {!loading && !error && blobUrl && (
            <iframe
              src={`${blobUrl}#toolbar=1&navpanes=0`}
              title={material.title}
              className="w-full h-full border-0"
            />
          )}

          {!loading && !error && !blobUrl && (
            <div className="text-slate-500 text-xs flex items-center gap-2">
              <FileText className="w-4 h-4" />
              <span>No preview stream available.</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
