import { MCQQuestion, TestAttemptResult } from '../types';

export interface ScoreBreakdown {
  totalQuestions: number;
  attempted: number;
  correct: number;
  incorrect: number;
  unattempted: number;
  rawScore: number;
  negativeMarks: number;
  netScore: number;
  accuracy: number;
}

/**
 * Calculates exam score based on standard CA Foundation marking:
 * +1 mark for every correct answer
 * -0.25 marks penalty for every incorrect answer
 * 0 marks for unattempted
 */
export function calculateQuizScore(
  userAnswers: Record<string, number>,
  questions: Pick<MCQQuestion, 'id' | 'correctIndex'>[]
): ScoreBreakdown {
  const totalQuestions = questions.length;
  let correct = 0;
  let incorrect = 0;
  let attempted = 0;

  for (const q of questions) {
    const selected = userAnswers[q.id];
    if (selected !== undefined && selected !== null && selected >= 0) {
      attempted++;
      if (selected === q.correctIndex) {
        correct++;
      } else {
        incorrect++;
      }
    }
  }

  const unattempted = totalQuestions - attempted;
  const negativeMarks = Number((incorrect * 0.25).toFixed(2));
  const rawScore = correct;
  const netScore = Number(Math.max(0, rawScore - negativeMarks).toFixed(2));
  const accuracy = attempted > 0 ? Number(((correct / attempted) * 100).toFixed(1)) : 0;

  return {
    totalQuestions,
    attempted,
    correct,
    incorrect,
    unattempted,
    rawScore,
    negativeMarks,
    netScore,
    accuracy,
  };
}

export interface PassingEvaluation {
  passed: boolean;
  totalMarks: number;
  percentage: number;
  isDistinction: boolean;
  paperResults: {
    paper1: { marks: number; passed: boolean };
    paper2: { marks: number; passed: boolean };
    paper3: { marks: number; passed: boolean };
    paper4: { marks: number; passed: boolean };
  };
  failedPapers: string[];
  aggregateShortfall: number;
  summaryMessage: {
    en: string;
    hi: string;
  };
}

/**
 * Evaluates ICAI CA Foundation passing criteria:
 * 1. Minimum 40% (40 marks out of 100) in EACH individual paper
 * 2. Minimum 50% (200 marks out of 400) in AGGREGATE
 */
export function evaluatePassingCriteria(scores: {
  paper1: number;
  paper2: number;
  paper3: number;
  paper4: number;
}): PassingEvaluation {
  const p1 = Math.max(0, Math.min(100, scores.paper1 || 0));
  const p2 = Math.max(0, Math.min(100, scores.paper2 || 0));
  const p3 = Math.max(0, Math.min(100, scores.paper3 || 0));
  const p4 = Math.max(0, Math.min(100, scores.paper4 || 0));

  const paperResults = {
    paper1: { marks: p1, passed: p1 >= 40 },
    paper2: { marks: p2, passed: p2 >= 40 },
    paper3: { marks: p3, passed: p3 >= 40 },
    paper4: { marks: p4, passed: p4 >= 40 },
  };

  const failedPapers: string[] = [];
  if (!paperResults.paper1.passed) failedPapers.push('Paper 1 (Accounting)');
  if (!paperResults.paper2.passed) failedPapers.push('Paper 2 (Business Laws)');
  if (!paperResults.paper3.passed) failedPapers.push('Paper 3 (Quantitative Aptitude)');
  if (!paperResults.paper4.passed) failedPapers.push('Paper 4 (Business Economics)');

  const totalMarks = p1 + p2 + p3 + p4;
  const percentage = Number(((totalMarks / 400) * 100).toFixed(1));
  const aggregateShortfall = Math.max(0, 200 - totalMarks);
  const passedAggregate = totalMarks >= 200;
  const passedAllPapers = failedPapers.length === 0;
  const passed = passedAllPapers && passedAggregate;
  const isDistinction = totalMarks >= 280; // 70% or more

  let messageEn = '';
  let messageHi = '';

  if (passed) {
    if (isDistinction) {
      messageEn = `Congratulations! You cleared CA Foundation with Distinction (${totalMarks}/400, ${percentage}%)!`;
      messageHi = `बधाई हो! आपने विशेष योग्यता (Distinction) के साथ सीए फाउंडेशन उत्तीर्ण किया (${totalMarks}/400, ${percentage}%)!`;
    } else {
      messageEn = `Congratulations! You cleared CA Foundation with ${totalMarks}/400 marks (${percentage}%).`;
      messageHi = `बधाई हो! आपने ${totalMarks}/400 अंकों (${percentage}%) के साथ सीए फाउंडेशन परीक्षा पास कर ली है।`;
    }
  } else if (!passedAllPapers && !passedAggregate) {
    messageEn = `Did not qualify: Failed in ${failedPapers.length} paper(s) and aggregate is short by ${aggregateShortfall} marks.`;
    messageHi = `उत्तीर्ण नहीं: ${failedPapers.length} विषय में 40 से कम अंक और कुल योग में ${aggregateShortfall} अंकों की कमी है।`;
  } else if (!passedAllPapers) {
    messageEn = `Did not qualify: Aggregate met (>=200), but scored below 40 in ${failedPapers.join(', ')}.`;
    messageHi = `उत्तीर्ण नहीं: कुल 200 अंक तो हैं, लेकिन ${failedPapers.join(', ')} में न्यूनतम 40 अंक प्राप्त नहीं हुए।`;
  } else {
    messageEn = `Did not qualify: Cleared individual papers, but aggregate is ${totalMarks}/400 (Short by ${aggregateShortfall} marks to hit 200).`;
    messageHi = `उत्तीर्ण नहीं: सभी विषयों में 40+ हैं, लेकिन कुल योग ${totalMarks}/400 है (200 के लिए ${aggregateShortfall} अंक कम)।`;
  }

  return {
    passed,
    totalMarks,
    percentage,
    isDistinction,
    paperResults,
    failedPapers,
    aggregateShortfall,
    summaryMessage: {
      en: messageEn,
      hi: messageHi,
    },
  };
}

/**
 * Calculates current study streak in days based on recorded unique activity dates
 */
export function calculateStreak(activityDates: string[], todayStr: string): number {
  if (!activityDates || activityDates.length === 0) return 0;

  const dateSet = new Set(activityDates);
  const today = new Date(todayStr);
  
  // Format helper YYYY-MM-DD
  const format = (d: Date) => d.toISOString().split('T')[0];

  let streak = 0;
  let checkDate = new Date(today);

  // If today has activity, streak starts from today, otherwise check if yesterday had activity
  const todayFormatted = format(checkDate);
  if (dateSet.has(todayFormatted)) {
    streak++;
    checkDate.setDate(checkDate.getDate() - 1);
  } else {
    checkDate.setDate(checkDate.getDate() - 1);
    if (!dateSet.has(format(checkDate))) {
      return 0; // Streak broken
    }
  }

  while (dateSet.has(format(checkDate))) {
    streak++;
    checkDate.setDate(checkDate.getDate() - 1);
  }

  return streak;
}
