import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  computeOwnerOverviewMetrics,
  computeEngagementSummary,
  buildReportBuckets,
  filterStudentsForOwner,
} from './ownerAnalytics.ts';
import type { AnalyticsEvent, PaymentRequest, StudyPresence, UserProfile } from '../types/index.ts';

const NOW_MS = new Date('2026-11-13T10:00:00.000Z').getTime();

const SAMPLE_USERS: UserProfile[] = [
  {
    id: 'admin_owner',
    name: 'CA Ajit Singh',
    email: 'ajitsinghca9@gmail.com',
    role: 'admin',
    targetAttempt: 'January 2027',
    targetYear: 2027,
    avatar: '👨‍🏫',
    joinedGroupIds: ['grp_ca_saathi_common'],
    bookmarkedPostIds: [],
    blockedUserIds: [],
    privacyHideCity: false,
    privacyHideAttempt: false,
    createdAt: '2026-10-01',
  },
  {
    id: 'stu_paid',
    name: 'Riya Sharma',
    email: 'riya@example.com',
    role: 'student',
    targetAttempt: 'January 2027',
    targetYear: 2027,
    city: 'Jaipur',
    phone: '9876543210',
    avatar: '🎓',
    joinedGroupIds: ['grp_ca_saathi_common'],
    bookmarkedPostIds: [],
    blockedUserIds: [],
    privacyHideCity: false,
    privacyHideAttempt: false,
    membershipStatus: 'active',
    hasPaidPass: true,
    subscriptionExpiresAt: '2026-12-10T00:00:00.000Z',
    studyMinutesTotal: 180,
    totalQuestionsAttempted: 80,
    totalQuestionsCorrect: 64,
    lastActiveDate: '2026-11-13',
    createdAt: '2026-11-10',
  },
  {
    id: 'stu_pending',
    name: 'Aman Verma',
    email: 'aman@example.com',
    role: 'student',
    targetAttempt: 'January 2027',
    targetYear: 2027,
    city: 'Lucknow',
    avatar: '🎓',
    joinedGroupIds: ['grp_ca_saathi_common'],
    bookmarkedPostIds: [],
    blockedUserIds: [],
    privacyHideCity: false,
    privacyHideAttempt: false,
    membershipStatus: 'pending',
    hasPaidPass: false,
    studyMinutesTotal: 60,
    totalQuestionsAttempted: 20,
    totalQuestionsCorrect: 16,
    lastActiveDate: '2026-11-12',
    createdAt: '2026-11-12',
  },
  {
    id: 'stu_suspended',
    name: 'Suspended User',
    email: 'susp@example.com',
    role: 'student',
    targetAttempt: 'January 2027',
    targetYear: 2027,
    avatar: '🎓',
    joinedGroupIds: [],
    bookmarkedPostIds: [],
    blockedUserIds: [],
    privacyHideCity: false,
    privacyHideAttempt: false,
    isSuspended: true,
    createdAt: '2026-11-05',
  },
];

const SAMPLE_PAYMENTS: PaymentRequest[] = [
  {
    id: 'pay_1',
    studentId: 'stu_paid',
    studentName: 'Riya Sharma',
    studentEmail: 'riya@example.com',
    studentMobile: '9876543210',
    amount: 5,
    planType: 'monthly_access',
    utr: '431298765432',
    screenshotUrl: 'data:image/png;base64,iVBOR',
    status: 'approved',
    reviewedAt: '2026-11-11T09:00:00.000Z',
    createdAt: '2026-11-10T09:00:00.000Z',
    unlockedUntil: '2026-12-10T00:00:00.000Z',
  },
  {
    id: 'pay_2',
    studentId: 'stu_pending',
    studentName: 'Aman Verma',
    studentEmail: 'aman@example.com',
    studentMobile: '9123456789',
    amount: 5,
    planType: 'monthly_access',
    utr: '551122334455',
    screenshotUrl: 'data:image/png;base64,iVBOR',
    status: 'pending',
    createdAt: '2026-11-13T08:00:00.000Z',
  },
];

const SAMPLE_PRESENCES: StudyPresence[] = [
  {
    userId: 'stu_paid',
    displayName: 'Riya Sharma',
    avatar: '🎓',
    targetAttempt: 'January 2027',
    activePaperId: 'paper1',
    activeTopic: 'MCQ Practice',
    isStudying: true,
    sessionStartedAt: '2026-11-13T09:30:00.000Z',
    lastHeartbeatAt: '2026-11-13T09:59:00.000Z',
  },
];

const SAMPLE_EVENTS: AnalyticsEvent[] = [
  { id: 'ev_1', visitorId: 'v1', eventType: 'visit', date: '2026-11-13', createdAt: '2026-11-13T08:00:00Z' },
  { id: 'ev_2', visitorId: 'v2', eventType: 'visit', date: '2026-11-13', createdAt: '2026-11-13T08:15:00Z' },
  { id: 'ev_3', userId: 'stu_paid', visitorId: 'v1', eventType: 'login', date: '2026-11-13', createdAt: '2026-11-13T08:20:00Z' },
  { id: 'ev_4', visitorId: 'v3', eventType: 'visit', date: '2026-11-10', createdAt: '2026-11-10T08:00:00Z' },
];

describe('ownerAnalytics pure computations', () => {
  it('computes accurate overview KPIs strictly from real user/payment/presence/event arrays', () => {
    const metrics = computeOwnerOverviewMetrics({
      users: SAMPLE_USERS,
      payments: SAMPLE_PAYMENTS,
      presences: SAMPLE_PRESENCES,
      analyticsEvents: SAMPLE_EVENTS,
      nowMs: NOW_MS,
    });

    assert.equal(metrics.totalUsers, 4);
    assert.equal(metrics.totalRegisteredStudents, 3);
    assert.equal(metrics.paidStudents, 1);
    assert.equal(metrics.pendingStudents, 1);
    assert.equal(metrics.suspendedStudents, 1);
    assert.equal(metrics.onlineStudents, 1);
    assert.equal(metrics.activeStudents, 2); // paid + Aman active yesterday
    assert.equal(metrics.currentlyStudyingCount, 1);
    assert.equal(metrics.liveStudyDurationMinutes, 30);
    assert.equal(metrics.totalVisitors, 3);
    assert.equal(metrics.totalRevenueInr, 5);
    assert.equal(metrics.totalApprovedPaymentsCount, 1);
    assert.equal(metrics.pendingPaymentRequestsCount, 1);
  });

  it('computes engagement stats (DAU/WAU/MAU, study hours, accuracy)', () => {
    const summary = computeEngagementSummary({
      users: SAMPLE_USERS,
      analyticsEvents: SAMPLE_EVENTS,
      presences: SAMPLE_PRESENCES,
      nowMs: NOW_MS,
    });

    assert.equal(summary.dau, 3); // v1, v2, stu_paid
    assert.equal(summary.wau, 5); // + stu_pending (lastActiveDate 2026-11-12), v3 (2026-11-10)
    assert.equal(summary.totalTrackedHours, 4); // (180 + 60) / 60
    assert.equal(summary.totalQuestionsAttempted, 100);
    assert.equal(summary.avgAccuracyPercent, 80);
  });

  it('builds daily, weekly, and monthly report buckets without inventing zero-record data', () => {
    const daily = buildReportBuckets({
      timeframe: 'daily',
      users: SAMPLE_USERS,
      payments: SAMPLE_PAYMENTS,
      analyticsEvents: SAMPLE_EVENTS,
      nowMs: NOW_MS,
    });
    assert.equal(daily.length, 14);
    const nov11 = daily.find((b) => b.key === '2026-11-11');
    assert.ok(nov11);
    assert.equal(nov11.revenueInr, 5);
    assert.equal(nov11.approvedCount, 1);

    const weekly = buildReportBuckets({
      timeframe: 'weekly',
      users: SAMPLE_USERS,
      payments: SAMPLE_PAYMENTS,
      analyticsEvents: SAMPLE_EVENTS,
      nowMs: NOW_MS,
    });
    assert.equal(weekly.length, 8);

    const monthly = buildReportBuckets({
      timeframe: 'monthly',
      users: SAMPLE_USERS,
      payments: SAMPLE_PAYMENTS,
      analyticsEvents: SAMPLE_EVENTS,
      nowMs: NOW_MS,
    });
    assert.equal(monthly.length, 6);
    const novMonth = monthly[monthly.length - 1];
    assert.equal(novMonth.revenueInr, 5);
    assert.equal(novMonth.newUsers, 3);
  });

  it('filters students accurately by search query and membership status', () => {
    const activeOnly = filterStudentsForOwner({
      students: SAMPLE_USERS,
      payments: SAMPLE_PAYMENTS,
      query: '',
      filter: 'active',
      nowMs: NOW_MS,
    });
    assert.deepEqual(
      activeOnly.map((u) => u.id),
      ['stu_paid']
    );

    const searched = filterStudentsForOwner({
      students: SAMPLE_USERS,
      payments: SAMPLE_PAYMENTS,
      query: 'aman',
      filter: 'pending',
      nowMs: NOW_MS,
    });
    assert.deepEqual(
      searched.map((u) => u.id),
      ['stu_pending']
    );
  });
});
