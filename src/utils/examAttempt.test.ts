import test from 'node:test';
import assert from 'node:assert/strict';
import {
  SUPPORTED_EXAM_ATTEMPTS,
  normalizeExamAttempt,
  getAttemptMetadata,
  resolveCountdownForAttempt,
  filterMockTestsForAttempt,
  filterNotesForAttempt,
  filterUpdatesForAttempt,
  prioritizeQuestionsForAttempt,
  buildAttemptChapterKey,
  resolveChapterStatusForAttempt,
  buildAttemptChapterProgressMap,
  filterStudySessionsByAttempt,
  filterTestResultsByAttempt,
} from './examAttempt.ts';
import type { ExamCountdownConfig, ExamUpdate, MCQQuestion, MockTest, StudyNote, StudySession, TestAttemptResult } from '../types/index.ts';

test('supported exam attempts include both January 2027 and May 2027', () => {
  assert.deepEqual(SUPPORTED_EXAM_ATTEMPTS, ['January 2027', 'May 2027']);
});

test('normalizeExamAttempt handles January 2027, May 2027, legacy values, and fallbacks', () => {
  assert.equal(normalizeExamAttempt('January 2027'), 'January 2027');
  assert.equal(normalizeExamAttempt('May 2027'), 'May 2027');
  assert.equal(normalizeExamAttempt('may 2027'), 'May 2027');
  assert.equal(normalizeExamAttempt('June 2027'), 'January 2027');
  assert.equal(normalizeExamAttempt('Faculty / Mentor'), 'January 2027');
  assert.equal(normalizeExamAttempt(undefined), 'January 2027');
});

test('getAttemptMetadata returns localized metadata for both attempts', () => {
  const jan = getAttemptMetadata('January 2027');
  const may = getAttemptMetadata('May 2027');
  assert.equal(jan.shortLabel.en, 'Jan 2027');
  assert.equal(may.shortLabel.en, 'May 2027');
  assert.notEqual(jan.studyPhaseBadge.en, may.studyPhaseBadge.en);
});

test('resolveCountdownForAttempt preserves admin verification only for matching attempt', () => {
  const verifiedJanConfig: ExamCountdownConfig = {
    examName: { en: 'CA Foundation January 2027 Examination', hi: 'सीए फाउंडेशन जनवरी 2027 परीक्षा' },
    examDate: '2027-01-18T14:00:00Z',
    targetAttempt: 'January 2027',
    isDateVerified: true,
    adminAlertNote: { en: 'Verified Jan', hi: 'सत्यापित' },
  };

  const resolvedJan = resolveCountdownForAttempt('January 2027', verifiedJanConfig);
  assert.equal(resolvedJan.isDateVerified, true);
  assert.equal(resolvedJan.targetAttempt, 'January 2027');

  const resolvedMay = resolveCountdownForAttempt('May 2027', verifiedJanConfig);
  assert.equal(resolvedMay.isDateVerified, false);
  assert.equal(resolvedMay.targetAttempt, 'May 2027');
  assert.match(resolvedMay.examName.en, /May 2027/);
});

test('filterMockTestsForAttempt separates January 2027 and May 2027 mock tests cleanly', () => {
  const tests = [
    { id: 't1', applicableAttempts: ['January 2027'] },
    { id: 't2', applicableAttempts: ['May 2027'] },
    { id: 't3' }, // shared
  ] as unknown as MockTest[];

  const janTests = filterMockTestsForAttempt(tests, 'January 2027');
  assert.deepEqual(
    janTests.map((t) => t.id),
    ['t1', 't3']
  );

  const mayTests = filterMockTestsForAttempt(tests, 'May 2027');
  assert.deepEqual(
    mayTests.map((t) => t.id),
    ['t2', 't3']
  );

  const allTests = filterMockTestsForAttempt(tests, 'May 2027', true);
  assert.equal(allTests.length, 3);
});

test('filterNotesForAttempt and filterUpdatesForAttempt prioritize selected attempt items first', () => {
  const notes = [
    { id: 'shared_note' },
    { id: 'may_note', applicableAttempts: ['May 2027'] },
    { id: 'jan_note', applicableAttempts: ['January 2027'] },
  ] as unknown as StudyNote[];

  const mayNotes = filterNotesForAttempt(notes, 'May 2027');
  assert.deepEqual(
    mayNotes.map((n) => n.id),
    ['may_note', 'shared_note']
  );

  const updates = [
    { id: 'u_shared' },
    { id: 'u_jan', applicableAttempts: ['January 2027'] },
    { id: 'u_may', applicableAttempts: ['May 2027'] },
  ] as unknown as ExamUpdate[];

  const janUpdates = filterUpdatesForAttempt(updates, 'January 2027');
  assert.deepEqual(
    janUpdates.map((u) => u.id),
    ['u_jan', 'u_shared']
  );
});

test('prioritizeQuestionsForAttempt orders PYQs first for Jan 2027 and ICAI Modules first for May 2027', () => {
  const qs = [
    { id: 'q_mod', sourceType: 'ICAI_MODULE', examYear: 2025 },
    { id: 'q_pyq_old', sourceType: 'PYQ', examYear: 2021 },
    { id: 'q_pyq_new', sourceType: 'PYQ', examYear: 2025 },
  ] as unknown as MCQQuestion[];

  const janOrder = prioritizeQuestionsForAttempt(qs, 'January 2027').map((q) => q.id);
  assert.deepEqual(janOrder, ['q_pyq_new', 'q_pyq_old', 'q_mod']);

  const mayOrder = prioritizeQuestionsForAttempt(qs, 'May 2027').map((q) => q.id);
  assert.deepEqual(mayOrder, ['q_mod', 'q_pyq_new', 'q_pyq_old']);
});

test('attempt-scoped chapter progress separates Jan 2027 and May 2027 while preserving legacy progress', () => {
  const rawProgress: Record<string, 'pending' | 'revising' | 'mastered'> = {
    ch_p1_01: 'mastered', // legacy unscoped record
    [buildAttemptChapterKey('ch_p1_02', 'May 2027')]: 'revising',
  };

  assert.equal(resolveChapterStatusForAttempt(rawProgress, 'ch_p1_01', 'January 2027'), 'mastered');
  assert.equal(resolveChapterStatusForAttempt(rawProgress, 'ch_p1_01', 'May 2027'), 'pending');
  assert.equal(resolveChapterStatusForAttempt(rawProgress, 'ch_p1_02', 'May 2027'), 'revising');

  const mayMap = buildAttemptChapterProgressMap(rawProgress, ['ch_p1_01', 'ch_p1_02'], 'May 2027');
  assert.deepEqual(mayMap, { ch_p1_01: 'pending', ch_p1_02: 'revising' });
});

test('filterStudySessionsByAttempt and filterTestResultsByAttempt isolate attempt records cleanly', () => {
  const sessions = [
    { id: 's_legacy', durationMinutes: 20 },
    { id: 's_may', durationMinutes: 30, examAttempt: 'May 2027' },
  ] as unknown as StudySession[];
  assert.deepEqual(filterStudySessionsByAttempt(sessions, 'January 2027').map((s) => s.id), ['s_legacy']);
  assert.deepEqual(filterStudySessionsByAttempt(sessions, 'May 2027').map((s) => s.id), ['s_may']);

  const tests = [
    { testId: 't_jan', examAttempt: 'January 2027' },
    { testId: 't_may', examAttempt: 'May 2027' },
  ] as unknown as TestAttemptResult[];
  assert.deepEqual(filterTestResultsByAttempt(tests, 'May 2027').map((t) => t.testId), ['t_may']);
});
