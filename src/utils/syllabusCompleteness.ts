import { CanonicalChapter } from '../data/syllabusData';
import { MCQQuestion, PaperId } from '../types';

export interface ChapterCompletenessStatus {
  chapterId: string;
  paperId: PaperId;
  chapterNumber: number;
  titleEn: string;
  topicsCount: number;
  mcqCount: number;
  pyqCount: number;
  practiceCount: number;
  hasEasy: boolean;
  hasMediumOrHard: boolean;
  isComplete: boolean;
}

export interface PaperCompletenessSummary {
  paperId: PaperId;
  totalChapters: number;
  coveredChapters: number;
  totalQuestions: number;
  totalPyqs: number;
  completenessPercent: number;
  emptyChapterIds: string[];
}

export interface SyllabusAuditReport {
  totalChapters: number;
  coveredChapters: number;
  overallCompletenessPercent: number;
  emptyChapterIds: string[];
  byPaper: Record<PaperId, PaperCompletenessSummary>;
  chapters: ChapterCompletenessStatus[];
}

export function auditSyllabusCompleteness(
  syllabus: CanonicalChapter[],
  questions: MCQQuestion[],
  chapterProgressMap: Record<string, 'pending' | 'revising' | 'mastered'> = {}
): SyllabusAuditReport {
  const chapters: ChapterCompletenessStatus[] = syllabus.map(ch => {
    const chQuestions = questions.filter(q => q.chapterId === ch.id && q.paperId === ch.paperId);
    const pyqCount = chQuestions.filter(q => q.sourceType === 'PYQ').length;
    const practiceCount = chQuestions.length - pyqCount;
    const hasEasy = chQuestions.some(q => q.difficulty === 'easy');
    const hasMediumOrHard = chQuestions.some(q => q.difficulty === 'medium' || q.difficulty === 'hard');

    return {
      chapterId: ch.id,
      paperId: ch.paperId,
      chapterNumber: ch.chapterNumber,
      titleEn: ch.title.en,
      topicsCount: ch.topics.length,
      mcqCount: chQuestions.length,
      pyqCount,
      practiceCount,
      hasEasy,
      hasMediumOrHard,
      isComplete: ch.topics.length > 0 && chQuestions.length > 0,
    };
  });

  const paperIds: PaperId[] = ['paper1', 'paper2', 'paper3', 'paper4'];
  const byPaper = {} as Record<PaperId, PaperCompletenessSummary>;

  for (const pid of paperIds) {
    const pChapters = chapters.filter(c => c.paperId === pid);
    const emptyChapterIds = pChapters.filter(c => !c.isComplete).map(c => c.chapterId);
    const coveredChapters = pChapters.length - emptyChapterIds.length;
    const masteredOrCovered = pChapters.filter(c => {
      const status = chapterProgressMap[c.chapterId];
      return c.isComplete && (!Object.keys(chapterProgressMap).length || status !== undefined || c.isComplete);
    }).length;

    byPaper[pid] = {
      paperId: pid,
      totalChapters: pChapters.length,
      coveredChapters,
      totalQuestions: pChapters.reduce((sum, c) => sum + c.mcqCount, 0),
      totalPyqs: pChapters.reduce((sum, c) => sum + c.pyqCount, 0),
      completenessPercent: pChapters.length > 0 ? Math.round((masteredOrCovered / pChapters.length) * 100) : 0,
      emptyChapterIds,
    };
  }

  const emptyChapterIds = chapters.filter(c => !c.isComplete).map(c => c.chapterId);
  const coveredChapters = chapters.length - emptyChapterIds.length;

  return {
    totalChapters: chapters.length,
    coveredChapters,
    overallCompletenessPercent: chapters.length > 0 ? Math.round((coveredChapters / chapters.length) * 100) : 0,
    emptyChapterIds,
    byPaper,
    chapters,
  };
}
