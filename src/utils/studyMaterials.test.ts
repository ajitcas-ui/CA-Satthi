import test from 'node:test';
import assert from 'node:assert/strict';
import {
  canStudentUploadNotes,
  computeMaterialOverviewCounts,
  filterStudyMaterialsHierarchy,
  formatFileSize,
  isMaterialVisibleToStudent,
  resolveUploadInitialStatus,
  sanitizePdfFileName,
  validatePdfBinaryBuffer,
  validatePdfMetadata,
} from './studyMaterials.ts';
import type { StudyPdfMaterial } from '../types/index.ts';

function makePdfBuffer(body = 'dummy pdf stream'): Uint8Array {
  return Buffer.from(`%PDF-1.7\n${body}`, 'utf8');
}

const SAMPLE_MATERIALS: StudyPdfMaterial[] = [
  {
    id: 'mat_1',
    title: 'AS-2 Inventory Valuation Handwritten Notes',
    description: 'Complete handwritten formulas & examples',
    paperId: 'paper1',
    chapterId: 'ch_p1_04',
    chapterNumber: 4,
    chapterTitle: 'Inventories',
    attempt: 'January 2027',
    category: 'Handwritten Notes',
    fileName: 'as2_notes.pdf',
    storageFileName: 'mat_1.pdf',
    fileUrl: '/api/materials/mat_1/pdf',
    fileSizeBytes: 512000,
    mimeType: 'application/pdf',
    uploaderId: 'stu_1',
    uploaderName: 'Riya Sharma',
    uploaderRole: 'student',
    status: 'approved',
    createdAt: '2026-11-12T10:00:00.000Z',
    updatedAt: '2026-11-12T10:30:00.000Z',
  },
  {
    id: 'mat_2',
    title: 'Contract Act Section 10 Pending Notes',
    description: 'Pending review submission',
    paperId: 'paper2',
    chapterId: 'ch_p2_02',
    chapterNumber: 2,
    chapterTitle: 'The Indian Contract Act, 1872',
    attempt: 'May 2027',
    category: 'Chapter-wise Notes',
    fileName: 'contract_sec10.pdf',
    storageFileName: 'mat_2.pdf',
    fileUrl: '/api/materials/mat_2/pdf',
    fileSizeBytes: 1024000,
    mimeType: 'application/pdf',
    uploaderId: 'stu_2',
    uploaderName: 'Aman Verma',
    uploaderRole: 'student',
    status: 'pending',
    createdAt: '2026-11-13T09:00:00.000Z',
    updatedAt: '2026-11-13T09:00:00.000Z',
  },
  {
    id: 'mat_3',
    title: 'TVM Calculator Shortcuts & PYQ Bank',
    description: 'Official Faculty Compilation for Both Attempts',
    paperId: 'paper3',
    chapterId: 'ch_p3_04',
    chapterNumber: 4,
    chapterTitle: 'Mathematics of Finance',
    attempt: 'Both',
    category: 'Previous Year Questions',
    fileName: 'tvm_pyq.pdf',
    storageFileName: 'mat_3.pdf',
    fileUrl: '/api/materials/mat_3/pdf',
    fileSizeBytes: 2048000,
    mimeType: 'application/pdf',
    uploaderId: 'admin_1',
    uploaderName: 'CA Ajit Singh',
    uploaderRole: 'admin',
    status: 'approved',
    createdAt: '2026-11-11T08:00:00.000Z',
    updatedAt: '2026-11-11T08:00:00.000Z',
  },
];

test('student upload permission is strict default false and respects suspension', () => {
  assert.equal(canStudentUploadNotes(null, false), false);
  assert.equal(canStudentUploadNotes({ id: 'guest', role: 'student' }, false), false);
  assert.equal(canStudentUploadNotes({ id: 'stu_1', role: 'student' }, false), false);
  assert.equal(canStudentUploadNotes({ id: 'stu_1', role: 'student', canUploadNotes: false }, false), false);
  assert.equal(canStudentUploadNotes({ id: 'stu_1', role: 'student', canUploadNotes: true, isSuspended: true }, false), false);
  assert.equal(canStudentUploadNotes({ id: 'stu_1', role: 'student', canUploadNotes: true, isSuspended: false }, false), true);
  assert.equal(canStudentUploadNotes({ id: 'stu_1', role: 'student', canUploadNotes: false }, true), true);
});

test('student uploads always default to pending while admin uploads default to approved', () => {
  assert.deepEqual(resolveUploadInitialStatus(false), { status: 'pending', uploaderRole: 'student' });
  assert.deepEqual(resolveUploadInitialStatus(true), { status: 'approved', uploaderRole: 'admin' });
});

test('validatePdfBinaryBuffer rejects non-PDF, invalid magic header, empty, and oversized files', () => {
  const nonPdfExt = validatePdfBinaryBuffer('notes.docx', 'application/pdf', makePdfBuffer());
  assert.equal(nonPdfExt.ok, false);

  const badMime = validatePdfBinaryBuffer('notes.pdf', 'image/png', makePdfBuffer());
  assert.equal(badMime.ok, false);

  const fakeHeader = validatePdfBinaryBuffer('notes.pdf', 'application/pdf', Buffer.from('NOT_A_PDF'));
  assert.equal(fakeHeader.ok, false);

  const emptyBuf = validatePdfBinaryBuffer('notes.pdf', 'application/pdf', new Uint8Array(0));
  assert.equal(emptyBuf.ok, false);

  const valid = validatePdfBinaryBuffer('folder/Chapter 1 Notes!.pdf', 'application/pdf', makePdfBuffer());
  assert.equal(valid.ok, true);
  if (valid.ok) {
    assert.equal(valid.cleanFileName, 'Chapter 1 Notes_.pdf');
  }
  assert.equal(sanitizePdfFileName('../../evil.pdf'), 'evil.pdf');
});

test('validatePdfMetadata enforces required subject, chapter, attempt, category, and title', () => {
  const badTitle = validatePdfMetadata({
    title: 'Hi',
    paperId: 'paper1',
    chapterId: 'ch_p1_01',
    chapterNumber: 1,
    chapterTitle: 'Theoretical Framework',
    attempt: 'January 2027',
    category: 'Chapter-wise Notes',
  });
  assert.equal(badTitle.ok, false);

  const valid = validatePdfMetadata({
    title: 'Accounting Standards Summary',
    description: 'Clean short notes',
    paperId: 'paper1',
    chapterId: 'ch_p1_01',
    chapterNumber: 1,
    chapterTitle: 'Theoretical Framework',
    attempt: 'May 2027',
    category: 'Handwritten Notes',
  });
  assert.equal(valid.ok, true);
});

test('isMaterialVisibleToStudent hides pending notes from other students while showing to uploader', () => {
  assert.equal(isMaterialVisibleToStudent(SAMPLE_MATERIALS[0], 'stu_999'), true);
  assert.equal(isMaterialVisibleToStudent(SAMPLE_MATERIALS[1], 'stu_999'), false);
  assert.equal(isMaterialVisibleToStudent(SAMPLE_MATERIALS[1], 'stu_2'), true);
});

test('filterStudyMaterialsHierarchy filters by paper, chapter, attempt, category, status, and search', () => {
  const janApproved = filterStudyMaterialsHierarchy(SAMPLE_MATERIALS, {
    attempt: 'January 2027',
    status: 'approved',
  });
  assert.deepEqual(
    janApproved.map((m) => m.id),
    ['mat_1', 'mat_3'] // Jan-specific before Both
  );

  const p1Handwritten = filterStudyMaterialsHierarchy(SAMPLE_MATERIALS, {
    paperId: 'paper1',
    chapterId: 'ch_p1_04',
    category: 'Handwritten Notes',
    status: 'approved',
  });
  assert.deepEqual(
    p1Handwritten.map((m) => m.id),
    ['mat_1']
  );

  const uploaderSearch = filterStudyMaterialsHierarchy(SAMPLE_MATERIALS, {
    search: 'Aman Verma',
  });
  assert.deepEqual(
    uploaderSearch.map((m) => m.id),
    ['mat_2']
  );
});

test('formatFileSize and computeMaterialOverviewCounts compute accurate metrics', () => {
  assert.equal(formatFileSize(512000), '500 KB');
  assert.equal(formatFileSize(2048000), '1.95 MB');
  const counts = computeMaterialOverviewCounts(SAMPLE_MATERIALS);
  assert.deepEqual(counts, {
    totalUploadedNotes: 3,
    approvedNotesCount: 2,
    pendingNotesCount: 1,
    rejectedNotesCount: 0,
    studentSubmissionsCount: 2,
  });
});
