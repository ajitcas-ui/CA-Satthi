import {
  ExamAttemptId,
  MaterialApprovalStatus,
  MaterialAttemptScope,
  MaterialCategory,
  PaperId,
  StudyPdfMaterial,
  UserProfile,
} from '../types';

export const MATERIAL_CATEGORIES: readonly MaterialCategory[] = [
  'Chapter-wise Notes',
  'Handwritten Notes',
  'Practice Material',
  'Important Questions',
  'Previous Year Questions',
  'Mock Tests',
];

export const MATERIAL_ATTEMPT_SCOPES: readonly MaterialAttemptScope[] = [
  'January 2027',
  'May 2027',
  'Both',
];

export const VALID_PAPER_IDS: readonly PaperId[] = ['paper1', 'paper2', 'paper3', 'paper4'];

export const MAX_PDF_SIZE_BYTES = 15 * 1024 * 1024; // 15 MB

export interface PdfMetadataInput {
  title: string;
  description?: string;
  paperId: string;
  chapterId: string;
  chapterNumber: number;
  chapterTitle: string;
  attempt: string;
  category: string;
}

export function canStudentUploadNotes(
  user?: Pick<UserProfile, 'id' | 'role' | 'canUploadNotes' | 'isSuspended'> | null,
  isVerifiedOwner = false
): boolean {
  if (isVerifiedOwner) return true;
  if (!user || user.id === 'guest') return false;
  if (user.isSuspended) return false;
  return user.canUploadNotes === true;
}

export function resolveUploadInitialStatus(isVerifiedOwner: boolean): {
  status: MaterialApprovalStatus;
  uploaderRole: 'admin' | 'student';
} {
  if (isVerifiedOwner) {
    return { status: 'approved', uploaderRole: 'admin' };
  }
  return { status: 'pending', uploaderRole: 'student' };
}

export function sanitizePdfFileName(rawName: string): string {
  const base = rawName.split(/[/\\]/).pop() || 'study_material.pdf';
  const cleaned = base.replace(/[^a-zA-Z0-9._\- ]+/g, '_').trim();
  const nonEmpty = cleaned || 'study_material.pdf';
  return nonEmpty.toLowerCase().endsWith('.pdf') ? nonEmpty : `${nonEmpty}.pdf`;
}

export function isValidMaterialAttempt(value: string): value is MaterialAttemptScope {
  return value === 'January 2027' || value === 'May 2027' || value === 'Both';
}

export function isValidMaterialCategory(value: string): value is MaterialCategory {
  return (MATERIAL_CATEGORIES as readonly string[]).includes(value);
}

export function isValidPaperId(value: string): value is PaperId {
  return (VALID_PAPER_IDS as readonly string[]).includes(value);
}

export function validatePdfMetadata(
  input: PdfMetadataInput
): { ok: true; clean: Required<PdfMetadataInput> } | { ok: false; error: string } {
  const title = (input.title || '').trim();
  if (title.length < 3 || title.length > 200) {
    return { ok: false, error: 'Title must be between 3 and 200 characters.' };
  }

  const description = (input.description || '').trim();
  if (description.length > 1500) {
    return { ok: false, error: 'Description must not exceed 1500 characters.' };
  }

  if (!isValidPaperId(input.paperId)) {
    return { ok: false, error: 'Invalid CA Foundation subject selected.' };
  }

  const chapterId = (input.chapterId || '').trim();
  const chapterTitle = (input.chapterTitle || '').trim();
  const chapterNumber = Number(input.chapterNumber);
  if (!chapterId || !chapterTitle || !Number.isFinite(chapterNumber) || chapterNumber < 1) {
    return { ok: false, error: 'Please select a valid syllabus chapter.' };
  }

  if (!isValidMaterialAttempt(input.attempt)) {
    return { ok: false, error: 'Attempt must be January 2027, May 2027, or Both.' };
  }

  if (!isValidMaterialCategory(input.category)) {
    return { ok: false, error: 'Invalid study material category selected.' };
  }

  return {
    ok: true,
    clean: {
      title,
      description,
      paperId: input.paperId,
      chapterId,
      chapterNumber,
      chapterTitle,
      attempt: input.attempt,
      category: input.category,
    },
  };
}

export function hasPdfMagicHeader(buffer: Uint8Array): boolean {
  if (buffer.length < 5) return false;
  // %PDF- in ASCII: 0x25, 0x50, 0x44, 0x46, 0x2d
  return (
    buffer[0] === 0x25 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x44 &&
    buffer[3] === 0x46 &&
    buffer[4] === 0x2d
  );
}

export function validatePdfBinaryBuffer(
  fileName: string,
  mimeType: string,
  buffer: Uint8Array
): { ok: true; cleanFileName: string } | { ok: false; error: string } {
  const lowerName = (fileName || '').trim().toLowerCase();
  if (!lowerName.endsWith('.pdf')) {
    return { ok: false, error: 'Only .pdf files are allowed.' };
  }

  const lowerMime = (mimeType || '').trim().toLowerCase();
  if (lowerMime && lowerMime !== 'application/pdf' && lowerMime !== 'application/x-pdf') {
    return { ok: false, error: 'Invalid file MIME type. Only PDF files are permitted.' };
  }

  if (buffer.byteLength === 0) {
    return { ok: false, error: 'Uploaded PDF file is empty.' };
  }

  if (buffer.byteLength > MAX_PDF_SIZE_BYTES) {
    return { ok: false, error: 'PDF file exceeds the 15 MB size limit.' };
  }

  if (!hasPdfMagicHeader(buffer)) {
    return { ok: false, error: 'File content is not a valid PDF document (%PDF- header missing).' };
  }

  return { ok: true, cleanFileName: sanitizePdfFileName(fileName) };
}

export function isMaterialVisibleToStudent(
  material: Pick<StudyPdfMaterial, 'status' | 'uploaderId'>,
  studentId?: string | null
): boolean {
  if (material.status === 'approved') return true;
  if (studentId && studentId !== 'guest' && material.uploaderId === studentId) return true;
  return false;
}

export interface MaterialFilterOptions {
  paperId?: 'all' | PaperId;
  chapterId?: 'all' | string;
  attempt?: 'all' | ExamAttemptId | 'Both';
  category?: 'all' | MaterialCategory;
  status?: 'all' | MaterialApprovalStatus;
  uploaderRole?: 'all' | 'admin' | 'student';
  search?: string;
}

export function filterStudyMaterialsHierarchy(
  materials: StudyPdfMaterial[],
  filters: MaterialFilterOptions
): StudyPdfMaterial[] {
  const paperId = filters.paperId || 'all';
  const chapterId = filters.chapterId || 'all';
  const attempt = filters.attempt || 'all';
  const category = filters.category || 'all';
  const status = filters.status || 'all';
  const uploaderRole = filters.uploaderRole || 'all';
  const q = (filters.search || '').trim().toLowerCase();

  const filtered = materials.filter((item) => {
    if (status !== 'all' && item.status !== status) return false;
    if (uploaderRole !== 'all' && item.uploaderRole !== uploaderRole) return false;
    if (paperId !== 'all' && item.paperId !== paperId) return false;
    if (chapterId !== 'all' && item.chapterId !== chapterId) return false;
    if (category !== 'all' && item.category !== category) return false;

    if (attempt !== 'all') {
      if (attempt === 'Both') {
        if (item.attempt !== 'Both') return false;
      } else if (item.attempt !== attempt && item.attempt !== 'Both') {
        return false;
      }
    }

    if (q) {
      const hay = `${item.title} ${item.description} ${item.chapterTitle} ${item.category} ${item.uploaderName} ${item.uploaderEmail || ''} ${item.fileName}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }

    return true;
  });

  return filtered.sort((a, b) => {
    if (attempt !== 'all' && attempt !== 'Both') {
      const aExact = a.attempt === attempt ? 0 : 1;
      const bExact = b.attempt === attempt ? 0 : 1;
      if (aExact !== bExact) return aExact - bExact;
    }
    return (b.createdAt || '').localeCompare(a.createdAt || '');
  });
}

export function formatFileSize(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return '0 KB';
  if (bytes < 1024 * 1024) {
    return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  }
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export function computeMaterialOverviewCounts(materials: StudyPdfMaterial[]): {
  totalUploadedNotes: number;
  approvedNotesCount: number;
  pendingNotesCount: number;
  rejectedNotesCount: number;
  studentSubmissionsCount: number;
} {
  let approvedNotesCount = 0;
  let pendingNotesCount = 0;
  let rejectedNotesCount = 0;
  let studentSubmissionsCount = 0;

  for (const m of materials) {
    if (m.status === 'approved') approvedNotesCount += 1;
    else if (m.status === 'pending') pendingNotesCount += 1;
    else if (m.status === 'rejected') rejectedNotesCount += 1;
    if (m.uploaderRole === 'student') studentSubmissionsCount += 1;
  }

  return {
    totalUploadedNotes: materials.length,
    approvedNotesCount,
    pendingNotesCount,
    rejectedNotesCount,
    studentSubmissionsCount,
  };
}
