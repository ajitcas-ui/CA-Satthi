import { StudySession, TestAttemptResult, UserProfile } from '../types';

export interface DailyStudyPoint {
  date: string;
  label: string;
  minutes: number;
  questionsAttempted: number;
}

export interface ComputedStudyStats {
  todayMinutes: number;
  weeklyMinutes: number;
  totalMinutes: number;
  totalHours: number;
  dailyGoalMinutes: number;
  dailyGoalPercent: number;
  streakDays: number;
  totalQuestionsAttempted: number;
  totalQuestionsCorrect: number;
  totalQuestionsIncorrect: number;
  accuracyPercent: number;
  weeklySeries: DailyStudyPoint[];
}

export function formatIsoDateLocal(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function computeStudyStats(
  sessions: StudySession[],
  testResults: TestAttemptResult[],
  user?: Pick<UserProfile, 'dailyGoalMinutes' | 'studyMinutesTotal' | 'totalQuestionsAttempted' | 'totalQuestionsCorrect' | 'studyStreak'>,
  nowMs = Date.now()
): ComputedStudyStats {
  const dailyGoalMinutes = Math.max(15, user?.dailyGoalMinutes || 120);
  const nowDate = new Date(nowMs);
  const todayStr = formatIsoDateLocal(nowDate);

  const minutesByDay = new Map<string, number>();
  const questionsByDay = new Map<string, number>();

  for (const session of sessions) {
    const day = session.date || session.startedAt?.slice(0, 10) || todayStr;
    const mins = Math.max(0, Number(session.durationMinutes) || 0);
    minutesByDay.set(day, (minutesByDay.get(day) || 0) + mins);
    const qAtt = Math.max(0, Number(session.questionsAttempted) || 0);
    questionsByDay.set(day, (questionsByDay.get(day) || 0) + qAtt);
  }

  // Build 7-day rolling window ending today
  const weeklySeries: DailyStudyPoint[] = [];
  let weeklyMinutes = 0;
  for (let offset = 6; offset >= 0; offset--) {
    const dt = new Date(nowMs - offset * 24 * 60 * 60 * 1000);
    const dayKey = formatIsoDateLocal(dt);
    const mins = Math.round(minutesByDay.get(dayKey) || 0);
    weeklyMinutes += mins;
    weeklySeries.push({
      date: dayKey,
      label: dt.toLocaleDateString('en-US', { weekday: 'short' }),
      minutes: mins,
      questionsAttempted: questionsByDay.get(dayKey) || 0,
    });
  }

  const todayMinutes = Math.round(minutesByDay.get(todayStr) || 0);
  const sessionMinutesSum = sessions.reduce((sum, s) => sum + Math.max(0, Number(s.durationMinutes) || 0), 0);
  const totalMinutes = Math.max(Math.round(sessionMinutesSum), Math.round(user?.studyMinutesTotal || 0));
  const totalHours = Number((totalMinutes / 60).toFixed(1));

  // Compute study streak across consecutive active days up to today/yesterday
  let streakDays = 0;
  const activeDates = new Set(
    Array.from(minutesByDay.entries())
      .filter(([, mins]) => mins > 0)
      .map(([d]) => d)
  );
  let cursorOffset = activeDates.has(todayStr) ? 0 : 1;
  while (true) {
    const checkKey = formatIsoDateLocal(new Date(nowMs - cursorOffset * 24 * 60 * 60 * 1000));
    if (activeDates.has(checkKey)) {
      streakDays += 1;
      cursorOffset += 1;
    } else {
      break;
    }
  }
  if (streakDays === 0 && (user?.studyStreak || 0) > 0 && activeDates.size === 0) {
    streakDays = user?.studyStreak || 0;
  }

  // Aggregate question metrics from sessions + mock tests + profile counters
  const mockAttempted = testResults.reduce((acc, t) => acc + Math.max(0, t.attempted || 0), 0);
  const mockCorrect = testResults.reduce((acc, t) => acc + Math.max(0, t.correct || 0), 0);
  const sessionAttempted = sessions.reduce((acc, s) => acc + Math.max(0, s.questionsAttempted || 0), 0);
  const sessionCorrect = sessions.reduce((acc, s) => acc + Math.max(0, s.questionsCorrect || 0), 0);

  const totalQuestionsAttempted = Math.max(
    user?.totalQuestionsAttempted || 0,
    mockAttempted + sessionAttempted
  );
  const totalQuestionsCorrect = Math.min(
    totalQuestionsAttempted,
    Math.max(user?.totalQuestionsCorrect || 0, mockCorrect + sessionCorrect)
  );
  const totalQuestionsIncorrect = Math.max(0, totalQuestionsAttempted - totalQuestionsCorrect);
  const accuracyPercent =
    totalQuestionsAttempted > 0
      ? Math.round((totalQuestionsCorrect / totalQuestionsAttempted) * 100)
      : 0;

  return {
    todayMinutes,
    weeklyMinutes,
    totalMinutes,
    totalHours,
    dailyGoalMinutes,
    dailyGoalPercent: Math.min(100, Math.round((todayMinutes / dailyGoalMinutes) * 100)),
    streakDays,
    totalQuestionsAttempted,
    totalQuestionsCorrect,
    totalQuestionsIncorrect,
    accuracyPercent,
    weeklySeries,
  };
}

export interface DailyGoalSummary {
  goalMinutes: number;
  completedMinutes: number;
  remainingMinutes: number;
  goalHours: number;
  completedHours: number;
  remainingHours: number;
  percentComplete: number;
  isGoalMet: boolean;
}

export function computeDailyGoalSummary(
  todayMinutes: number,
  dailyGoalMinutes: number = 120
): DailyGoalSummary {
  const safeGoal = Math.max(15, Math.min(720, Math.round(dailyGoalMinutes || 120)));
  const safeCompleted = Math.max(0, Math.round(todayMinutes || 0));
  const remainingMinutes = Math.max(0, safeGoal - safeCompleted);
  return {
    goalMinutes: safeGoal,
    completedMinutes: safeCompleted,
    remainingMinutes,
    goalHours: Number((safeGoal / 60).toFixed(1)),
    completedHours: Number((safeCompleted / 60).toFixed(1)),
    remainingHours: Number((remainingMinutes / 60).toFixed(1)),
    percentComplete: Math.min(100, Math.round((safeCompleted / safeGoal) * 100)),
    isGoalMet: safeCompleted >= safeGoal,
  };
}
