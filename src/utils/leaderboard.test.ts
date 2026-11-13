import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { buildStudentLeaderboard, resolvePublicDisplayName } from './leaderboard';
import { LeaderboardEntry, StudySession, UserProfile } from '../types';
import { formatIsoDateLocal } from './studyTracker';

const baseUser: UserProfile = {
  id: 'stu_101',
  name: 'Riya Deshmukh',
  displayName: 'CA Riya 2027',
  email: 'riya.private@example.com',
  phone: '9876543210',
  role: 'student',
  targetAttempt: 'January 2027',
  targetYear: 2027,
  city: 'Pune',
  avatar: '👩‍🎓',
  joinedGroupIds: ['grp_common_jan2027'],
  bookmarkedPostIds: [],
  blockedUserIds: [],
  privacyHideCity: true,
  privacyHideAttempt: false,
  createdAt: '2026-10-01T10:00:00Z',
  learningPoints: 150,
  studyStreak: 4,
};

const baseEntries: LeaderboardEntry[] = [
  {
    rank: 1,
    studentId: 'peer_1',
    studentName: 'Rohit Khandelwal',
    avatar: '👨‍🎓',
    targetAttempt: 'January 2027',
    city: 'Mumbai',
    totalPoints: 1000,
    testsCompleted: 10,
    accuracyRate: 90,
    badge: 'AIR Top 10',
    streakDays: 12,
  },
  {
    rank: 2,
    studentId: 'peer_2',
    studentName: 'Ananya Nair',
    avatar: '👩‍🎓',
    targetAttempt: 'January 2027',
    city: 'Jaipur',
    totalPoints: 400,
    testsCompleted: 5,
    accuracyRate: 84,
    badge: 'Scholar',
    streakDays: 5,
  },
];

describe('leaderboard', () => {
  it('uses custom displayName and masks private city/email/phone', () => {
    assert.equal(resolvePublicDisplayName(baseUser), 'CA Riya 2027');

    const result = buildStudentLeaderboard({
      currentUser: baseUser,
      period: 'weekly',
      baseEntries,
      studySessions: [],
      testHistory: [],
    });

    assert.equal(result.myEntry.studentName, 'CA Riya 2027 (You)');
    assert.equal(result.myEntry.city, 'India (Private)');
    const serialized = JSON.stringify(result);
    assert.equal(serialized.includes('riya.private@example.com'), false);
    assert.equal(serialized.includes('9876543210'), false);
  });

  it('ranks student accurately based on verified study sessions and test points', () => {
    const now = new Date(2026, 9, 15, 18, 0, 0).getTime();
    const today = formatIsoDateLocal(new Date(now));
    const sessions: StudySession[] = [
      {
        id: 'sess_1',
        userId: baseUser.id,
        date: today,
        paperId: 'paper1',
        activityType: 'practice',
        durationMinutes: 120,
        questionsAttempted: 20,
        questionsCorrect: 18,
        startedAt: `${today}T09:00:00Z`,
        endedAt: `${today}T11:00:00Z`,
      },
    ];

    const result = buildStudentLeaderboard({
      currentUser: baseUser,
      period: 'weekly',
      baseEntries,
      studySessions: sessions,
      testHistory: [],
      nowMs: now,
    });

    // Weekly scaled peer_1 = 350, peer_2 = 140; student = 120*2 + 150 + 18*5 = 480 => Rank #1
    assert.equal(result.myEntry.rank, 1);
    assert.equal(result.myEntry.totalPoints, 480);
    assert.equal(result.entries[0].studentId, baseUser.id);
    assert.equal(result.entries[1].rank, 2);
  });
});
