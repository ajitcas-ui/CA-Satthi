import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { CANONICAL_SYLLABUS } from '../data/syllabusData';
import { MOCK_QUESTIONS } from '../data/mockQuestions';
import { auditSyllabusCompleteness } from './syllabusCompleteness';

describe('syllabusCompleteness', () => {
  it('contains exact 46 official ICAI CA Foundation New Scheme chapters across all 4 papers', () => {
    const p1 = CANONICAL_SYLLABUS.filter(c => c.paperId === 'paper1');
    const p2 = CANONICAL_SYLLABUS.filter(c => c.paperId === 'paper2');
    const p3 = CANONICAL_SYLLABUS.filter(c => c.paperId === 'paper3');
    const p4 = CANONICAL_SYLLABUS.filter(c => c.paperId === 'paper4');

    assert.equal(p1.length, 11);
    assert.equal(p2.length, 7);
    assert.equal(p3.length, 18);
    assert.equal(p4.length, 10);
    assert.equal(CANONICAL_SYLLABUS.length, 46);
  });

  it('ensures zero empty chapters across all 46 syllabus chapters in question bank', () => {
    const report = auditSyllabusCompleteness(CANONICAL_SYLLABUS, MOCK_QUESTIONS);
    assert.deepEqual(report.emptyChapterIds, []);
    assert.equal(report.coveredChapters, 46);
    assert.equal(report.overallCompletenessPercent, 100);
  });
});
