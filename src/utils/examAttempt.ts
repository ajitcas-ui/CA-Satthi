import {
  BilingualText,
  ExamAttemptId,
  ExamCountdownConfig,
  ExamUpdate,
  MCQQuestion,
  MockTest,
  StudyNote,
} from '../types';

export const SUPPORTED_EXAM_ATTEMPTS: readonly ExamAttemptId[] = ['January 2027', 'May 2027'];

export interface AttemptMetadata {
  id: ExamAttemptId;
  shortLabel: BilingualText;
  fullLabel: BilingualText;
  tentativeWindow: BilingualText;
  syllabusNote: BilingualText;
  studyPhaseBadge: BilingualText;
  pyqFocusSummary: BilingualText;
  recommendedDailyHours: number;
}

export const ATTEMPT_METADATA: Record<ExamAttemptId, AttemptMetadata> = {
  'January 2027': {
    id: 'January 2027',
    shortLabel: { en: 'Jan 2027', hi: 'जनवरी 2027' },
    fullLabel: { en: 'January 2027', hi: 'जनवरी 2027' },
    tentativeWindow: { en: 'Mid-January 2027 (Tentative)', hi: 'मध्य जनवरी 2027 (संभावित)' },
    syllabusNote: {
      en: 'ICAI New Scheme (46 Chapters) · Jan 2027 Applicable Statutory Limits & Standards',
      hi: 'आईसीएआई नई योजना (46 अध्याय) · जनवरी 2027 परीक्षा हेतु मान्य पाठ्यक्रम',
    },
    studyPhaseBadge: { en: 'Intensive Revision & Mock Sprint', hi: 'तीव्र रिवीजन एवं मॉक टेस्ट चरण' },
    pyqFocusSummary: {
      en: 'Prioritizing Latest ICAI PYQs (2024–2026) & High-Weightage Rapid Drills',
      hi: 'नवीनतम आईसीएआई विगत प्रश्न (2024–2026) एवं उच्च-अंक अभ्यास पर केंद्रित',
    },
    recommendedDailyHours: 4,
  },
  'May 2027': {
    id: 'May 2027',
    shortLabel: { en: 'May 2027', hi: 'मई 2027' },
    fullLabel: { en: 'May 2027', hi: 'मई 2027' },
    tentativeWindow: { en: 'Mid-May 2027 (Tentative)', hi: 'मध्य मई 2027 (संभावित)' },
    syllabusNote: {
      en: 'ICAI New Scheme (46 Chapters) · Updated Finance Act & 2027 Statutory Applicability',
      hi: 'आईसीएआई नई योजना (46 अध्याय) · मई 2027 परीक्षा हेतु अद्यतन वैधानिक प्रावधान',
    },
    studyPhaseBadge: { en: 'Concept Mastery & 2-Cycle Revision', hi: 'अवधारणा निर्माण एवं द्वि-स्तरीय रिवीजन' },
    pyqFocusSummary: {
      en: 'Prioritizing Concept-Builder ICAI Modules + Full 2020–2027 PYQ Archive',
      hi: 'संपूर्ण आईसीएआई मॉड्यूल अवधारणाओं व 2020–2027 PYQ संग्रह पर केंद्रित',
    },
    recommendedDailyHours: 3,
  },
};

export function normalizeExamAttempt(raw?: string | null): ExamAttemptId {
  if (!raw || typeof raw !== 'string') return 'January 2027';
  const normalized = raw.trim().toLowerCase();
  if (normalized.includes('may') && normalized.includes('2027')) {
    return 'May 2027';
  }
  return 'January 2027';
}

export function getAttemptMetadata(attempt?: string | null): AttemptMetadata {
  return ATTEMPT_METADATA[normalizeExamAttempt(attempt)];
}

/**
 * Resolves the active ExamCountdownConfig shown to a student for their selected attempt.
 * Preserves Admin-verified official schedule ONLY for the attempt that Admin verified;
 * for the secondary attempt, keeps `isDateVerified: false` so tentative dates are never
 * misrepresented as official ICAI notifications.
 */
export function resolveCountdownForAttempt(
  selectedAttempt: string | null | undefined,
  globalAdminConfig: ExamCountdownConfig
): ExamCountdownConfig {
  const attempt = normalizeExamAttempt(selectedAttempt);
  const meta = ATTEMPT_METADATA[attempt];
  const adminAttempt = normalizeExamAttempt(globalAdminConfig.targetAttempt);

  if (adminAttempt === attempt) {
    return {
      ...globalAdminConfig,
      targetAttempt: attempt,
    };
  }

  return {
    examName: {
      en: `CA Foundation ${meta.fullLabel.en} Examination`,
      hi: `सीए फाउंडेशन ${meta.fullLabel.hi} परीक्षा`,
    },
    examDate: attempt === 'May 2027' ? '2027-05-15T14:00:00' : '2027-01-18T14:00:00',
    targetAttempt: attempt,
    isDateVerified: false,
    adminAlertNote: {
      en: `You are viewing your ${meta.fullLabel.en} preparation workspace. Official exam timetable will activate here once notified by ICAI and verified by Super Admin.`,
      hi: `आप ${meta.fullLabel.hi} तैयारी मोड देख रहे हैं। आईसीएआई द्वारा आधिकारिक तिथि घोषित व एडमिन द्वारा सत्यापित होते ही लाइव काउंटडाउन प्रारंभ होगा।`,
    },
    verificationSource: globalAdminConfig.verificationSource,
  };
}

export function isItemApplicableToAttempt(
  applicableAttempts: ExamAttemptId[] | undefined,
  selectedAttempt: ExamAttemptId
): boolean {
  if (!applicableAttempts || applicableAttempts.length === 0) {
    return true;
  }
  return applicableAttempts.includes(selectedAttempt);
}

export function filterMockTestsForAttempt(
  tests: MockTest[],
  selectedAttempt: ExamAttemptId,
  includeAllAttempts = false
): MockTest[] {
  if (includeAllAttempts) return tests;
  const matched = tests.filter((t) => isItemApplicableToAttempt(t.applicableAttempts, selectedAttempt));
  return matched.length > 0 ? matched : tests;
}

export function filterNotesForAttempt(
  notes: StudyNote[],
  selectedAttempt: ExamAttemptId,
  includeAllAttempts = false
): StudyNote[] {
  if (includeAllAttempts) return notes;
  const matched = notes.filter((n) => isItemApplicableToAttempt(n.applicableAttempts, selectedAttempt));
  // Sort attempt-specific notes before shared notes so attempt-tailored study material appears first
  return [...matched].sort((a, b) => {
    const aSpecific = a.applicableAttempts && a.applicableAttempts.length === 1 && a.applicableAttempts[0] === selectedAttempt ? 0 : 1;
    const bSpecific = b.applicableAttempts && b.applicableAttempts.length === 1 && b.applicableAttempts[0] === selectedAttempt ? 0 : 1;
    return aSpecific - bSpecific;
  });
}

export function filterUpdatesForAttempt(
  updates: ExamUpdate[],
  selectedAttempt: ExamAttemptId
): ExamUpdate[] {
  const matched = updates.filter((u) => isItemApplicableToAttempt(u.applicableAttempts, selectedAttempt));
  return [...matched].sort((a, b) => {
    const aSpecific = a.applicableAttempts && a.applicableAttempts.length === 1 && a.applicableAttempts[0] === selectedAttempt ? 0 : 1;
    const bSpecific = b.applicableAttempts && b.applicableAttempts.length === 1 && b.applicableAttempts[0] === selectedAttempt ? 0 : 1;
    return aSpecific - bSpecific;
  });
}

/**
 * Prioritizes PYQs and practice MCQs based on the selected exam attempt while preserving
 * full coverage of all 46 ICAI New Scheme chapters.
 */
export function prioritizeQuestionsForAttempt(
  questions: MCQQuestion[],
  selectedAttempt: ExamAttemptId
): MCQQuestion[] {
  return [...questions].sort((a, b) => {
    if (selectedAttempt === 'January 2027') {
      // Prioritize recent PYQs first for intensive Jan 2027 sprint
      const aScore = a.sourceType === 'PYQ' ? (a.examYear || 2020) : 1990;
      const bScore = b.sourceType === 'PYQ' ? (b.examYear || 2020) : 1990;
      if (aScore !== bScore) return bScore - aScore;
    } else {
      // May 2027: prioritize foundational ICAI Module conceptual drills first, then full PYQ bank newest-first
      const aScore = a.sourceType === 'ICAI_MODULE' ? 3000 : a.examYear || 2020;
      const bScore = b.sourceType === 'ICAI_MODULE' ? 3000 : b.examYear || 2020;
      if (aScore !== bScore) return bScore - aScore;
    }
    return 0;
  });
}
