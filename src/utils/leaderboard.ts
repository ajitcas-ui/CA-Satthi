import { LeaderboardEntry, StudyPresence, StudySession, TestAttemptResult, UserProfile } from '../types';
import { computeStudyStats } from './studyTracker';

export type LeaderboardPeriod = 'all' | 'weekly' | 'monthly';

export interface BuildLeaderboardInput {
  currentUser: UserProfile;
  period: LeaderboardPeriod;
  baseEntries: LeaderboardEntry[];
  livePeers?: StudyPresence[];
  studySessions?: StudySession[];
  testHistory?: TestAttemptResult[];
  fallbackAccuracyRate?: number;
  fallbackStreak?: number;
  nowMs?: number;
}

export interface BuiltLeaderboardResult {
  entries: LeaderboardEntry[];
  myEntry: LeaderboardEntry;
}

export function resolvePublicDisplayName(user: Pick<UserProfile, 'name' | 'displayName'>): string {
  const alias = (user.displayName || '').trim();
  if (alias.length >= 2) return alias;
  const real = (user.name || '').trim();
  if (!real || real === 'Guest Learner') return 'CA Aspirant';
  return real;
}

function deriveLeaderboardBadge(rank: number, streakDays: number, totalPoints: number): LeaderboardEntry['badge'] {
  if (rank <= 10 && totalPoints >= 1000) return 'AIR Top 10';
  if (totalPoints >= 600) return 'Scholar';
  if (streakDays >= 3 || (rank <= 50 && totalPoints >= 150)) return 'AIR Top 50';
  return 'Consistent Aspirant';
}

export function buildStudentLeaderboard(input: BuildLeaderboardInput): BuiltLeaderboardResult {
  const {
    currentUser,
    period,
    baseEntries,
    livePeers = [],
    studySessions = [],
    testHistory = [],
    fallbackAccuracyRate = 0,
    fallbackStreak = 0,
    nowMs = Date.now(),
  } = input;

  const stats = computeStudyStats(
    studySessions,
    testHistory,
    {
      dailyGoalMinutes: currentUser.dailyGoalMinutes,
      studyMinutesTotal: currentUser.studyMinutesTotal,
      totalQuestionsAttempted: currentUser.totalQuestionsAttempted,
      totalQuestionsCorrect: currentUser.totalQuestionsCorrect,
      studyStreak: Math.max(currentUser.studyStreak || 0, fallbackStreak),
    },
    nowMs
  );

  // Compute student's verified points from real activity (never inflated for 0-activity users)
  const verifiedStudyPts =
    period === 'weekly'
      ? Math.round(stats.weeklyMinutes * 2)
      : period === 'monthly'
        ? Math.round(stats.totalMinutes * 2)
        : Math.round(stats.totalMinutes * 2);

  const quizAndMockPts =
    (currentUser.learningPoints || 0) +
    stats.totalQuestionsCorrect * 5 +
    testHistory.length * 40;

  const myPoints = Math.max(0, verifiedStudyPts + quizAndMockPts);
  const myAccuracy =
    stats.totalQuestionsAttempted > 0
      ? stats.accuracyPercent
      : Math.max(0, Math.min(100, fallbackAccuracyRate || 0));

  const publicName = resolvePublicDisplayName(currentUser);
  const publicCity = currentUser.privacyHideCity ? 'India (Private)' : currentUser.city || 'India';
  const publicAttempt = currentUser.privacyHideAttempt ? 'CA Foundation' : currentUser.targetAttempt || 'January 2027';

  const isGuest = !currentUser?.id || currentUser.id === 'guest';
  const myStudentId = isGuest ? 'guest_self' : currentUser.id;

  const mergedMap = new Map<string, LeaderboardEntry>();

  // 1. Scale period baselines cleanly from verified pool without leaking "(You)"
  const periodFactor = period === 'weekly' ? 0.35 : period === 'monthly' ? 0.65 : 1;
  for (const item of baseEntries) {
    const cleanName = item.studentName.replace(/\s*\(You\)\s*$/i, '').trim();
    const scaledPts = Math.round(item.totalPoints * periodFactor);
    mergedMap.set(item.studentId, {
      ...item,
      studentName: cleanName,
      targetAttempt: 'January 2027',
      totalPoints: scaledPts,
      testsCompleted: Math.max(1, Math.round(item.testsCompleted * periodFactor)),
    });
  }

  // 2. Merge currently active live peers (non-PII StudyPresence only)
  for (const peer of livePeers) {
    if (!peer.userId || peer.userId === myStudentId) continue;
    const existing = mergedMap.get(peer.userId);
    const elapsedMins = Math.max(
      1,
      Math.round((nowMs - new Date(peer.sessionStartedAt).getTime()) / 60_000)
    );
    const liveBonus = Math.min(180, elapsedMins * 2);
    if (existing) {
      mergedMap.set(peer.userId, {
        ...existing,
        studentName: peer.displayName || existing.studentName,
        totalPoints: existing.totalPoints + liveBonus,
      });
    } else {
      mergedMap.set(peer.userId, {
        rank: 0,
        studentId: peer.userId,
        studentName: peer.displayName || 'CA Aspirant',
        avatar: peer.avatar || '🎓',
        targetAttempt: peer.targetAttempt || 'January 2027',
        city: 'India',
        totalPoints: Math.max(20, liveBonus),
        testsCompleted: 1,
        accuracyRate: 80,
        badge: 'Consistent Aspirant',
        streakDays: 1,
      });
    }
  }

  // 3. Insert / update the current student's verified standing
  const myStreak = Math.max(stats.streakDays, fallbackStreak, currentUser.studyStreak || 0);
  const myDraft: LeaderboardEntry = {
    rank: 0,
    studentId: myStudentId,
    studentName: `${publicName} (You)`,
    avatar: currentUser.avatar || '🎓',
    targetAttempt: publicAttempt,
    city: publicCity,
    totalPoints: myPoints,
    testsCompleted: testHistory.length,
    accuracyRate: myAccuracy,
    badge: 'Consistent Aspirant',
    streakDays: myStreak,
  };

  mergedMap.set(myStudentId, myDraft);

  // 4. Sort descending by verified points, then accuracy, then streak
  const sorted = Array.from(mergedMap.values()).sort((a, b) => {
    if (b.totalPoints !== a.totalPoints) return b.totalPoints - a.totalPoints;
    if (b.accuracyRate !== a.accuracyRate) return b.accuracyRate - a.accuracyRate;
    return b.streakDays - a.streakDays;
  });

  const ranked = sorted.map((entry, idx) => {
    const rank = idx + 1;
    return {
      ...entry,
      rank,
      badge: deriveLeaderboardBadge(rank, entry.streakDays, entry.totalPoints),
    };
  });

  const myEntry = ranked.find((e) => e.studentId === myStudentId) || {
    ...myDraft,
    rank: ranked.length + 1,
  };

  return { entries: ranked, myEntry };
}
