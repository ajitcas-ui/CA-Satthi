import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { computeStudyStats, computeDailyGoalSummary, formatIsoDateLocal } from './studyTracker';
import { StudySession, TestAttemptResult } from '../types';

describe('studyTracker', () => {
  it('computes today, weekly, total hours, streak, and accuracy accurately', () => {
    const now = new Date(2026, 5, 10, 18, 0, 0).getTime();
    const today = formatIsoDateLocal(new Date(now));
    const yesterday = formatIsoDateLocal(new Date(now - 24 * 60 * 60 * 1000));
    const twoDaysAgo = formatIsoDateLocal(new Date(now - 2 * 24 * 60 * 60 * 1000));

    const sessions: StudySession[] = [
      {
        id: 's1',
        userId: 'u1',
        date: today,
        paperId: 'paper1',
        activityType: 'practice',
        durationMinutes: 60,
        questionsAttempted: 20,
        questionsCorrect: 16,
        startedAt: `${today}T10:00:00Z`,
        endedAt: `${today}T11:00:00Z`,
      },
      {
        id: 's2',
        userId: 'u1',
        date: yesterday,
        paperId: 'paper3',
        activityType: 'notes',
        durationMinutes: 45,
        questionsAttempted: 10,
        questionsCorrect: 8,
        startedAt: `${yesterday}T14:00:00Z`,
        endedAt: `${yesterday}T14:45:00Z`,
      },
      {
        id: 's3',
        userId: 'u1',
        date: twoDaysAgo,
        paperId: 'paper2',
        activityType: 'planner',
        durationMinutes: 15,
        startedAt: `${twoDaysAgo}T09:00:00Z`,
        endedAt: `${twoDaysAgo}T09:15:00Z`,
      },
    ];

    const mocks: TestAttemptResult[] = [
      {
        testId: 't1',
        testTitle: { en: 'P3 Mock', hi: 'P3 Mock' },
        date: today,
        paperId: 'paper3',
        totalQuestions: 20,
        attempted: 10,
        correct: 6,
        incorrect: 4,
        unattempted: 10,
        score: 5,
        percentage: 30,
        timeSpentSeconds: 600,
        userAnswers: {},
      },
    ];

    const stats = computeStudyStats(sessions, mocks, { dailyGoalMinutes: 120 }, now);
    assert.equal(stats.todayMinutes, 60);
    assert.equal(stats.weeklyMinutes, 120);
    assert.equal(stats.totalMinutes, 120);
    assert.equal(stats.totalHours, 2.0);
    assert.equal(stats.dailyGoalPercent, 50);
    assert.equal(stats.streakDays, 3);
    assert.equal(stats.totalQuestionsAttempted, 40);
    assert.equal(stats.totalQuestionsCorrect, 30);
    assert.equal(stats.totalQuestionsIncorrect, 10);
    assert.equal(stats.accuracyPercent, 75);
    assert.equal(stats.weeklySeries.length, 7);
  });

  it('computes completed and remaining study hours and caps completion at 100%', () => {
    const partial = computeDailyGoalSummary(90, 180);
    assert.equal(partial.goalHours, 3.0);
    assert.equal(partial.completedHours, 1.5);
    assert.equal(partial.remainingHours, 1.5);
    assert.equal(partial.remainingMinutes, 90);
    assert.equal(partial.percentComplete, 50);
    assert.equal(partial.isGoalMet, false);

    const exceeded = computeDailyGoalSummary(210, 180);
    assert.equal(exceeded.remainingHours, 0);
    assert.equal(exceeded.remainingMinutes, 0);
    assert.equal(exceeded.percentComplete, 100);
    assert.equal(exceeded.isGoalMet, true);
  });
});
