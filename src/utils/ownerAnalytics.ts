import {
  AnalyticsEvent,
  PaperId,
  PaymentRequest,
  StudyPresence,
  UserProfile,
} from '../types';
import { computeMembershipState } from './membershipRules';
import { formatIsoDateLocal } from './studyTracker';

export type StudentFilterMode = 'all' | 'active' | 'pending' | 'unpaid' | 'expired' | 'suspended' | 'uploaders';
export type ReportTimeframe = 'daily' | 'weekly' | 'monthly';

export interface OwnerOverviewMetrics {
  totalUsers: number;
  totalRegisteredStudents: number;
  onlineStudents: number;
  activeStudents: number;
  paidStudents: number;
  pendingStudents: number;
  unpaidStudents: number;
  expiredStudents: number;
  suspendedStudents: number;
  uploadPermittedStudents: number;
  jan2027Students: number;
  may2027Students: number;
  totalVisitors: number;
  currentlyStudyingCount: number;
  liveStudyDurationMinutes: number;
  totalApprovedPaymentsCount: number;
  pendingPaymentRequestsCount: number;
  rejectedPaymentRequestsCount: number;
  totalRevenueInr: number;
  dailyActiveUsers: number;
  newRegistrationsToday: number;
  newRegistrationsLast7Days: number;
}

export interface EngagementSummary {
  dau: number;
  wau: number;
  mau: number;
  stickinessPercent: number;
  totalTrackedHours: number;
  totalQuestionsAttempted: number;
  avgAccuracyPercent: number;
}

export interface ReportBucket {
  key: string;
  label: string;
  newUsers: number;
  revenueInr: number;
  approvedCount: number;
  visits: number;
  activeSessions: number;
}

const ONLINE_HEARTBEAT_TTL_MS = 180_000;

export function getRegisteredStudentsOnly(users: UserProfile[]): UserProfile[] {
  return users.filter((u) => u.role !== 'admin' && u.id !== 'guest');
}

export function isPresenceFresh(presence: StudyPresence, nowMs = Date.now()): boolean {
  const pingMs = new Date(presence.lastHeartbeatAt).getTime();
  return Number.isFinite(pingMs) && nowMs - pingMs >= -60_000 && nowMs - pingMs <= ONLINE_HEARTBEAT_TTL_MS;
}

export function computeLiveSessionMinutes(presence: StudyPresence, nowMs = Date.now()): number {
  const startedMs = new Date(presence.sessionStartedAt || presence.lastHeartbeatAt).getTime();
  if (!Number.isFinite(startedMs) || startedMs > nowMs) return 0;
  return Math.max(1, Math.round((nowMs - startedMs) / 60_000));
}

export function computeOwnerOverviewMetrics(params: {
  users: UserProfile[];
  payments: PaymentRequest[];
  presences: StudyPresence[];
  analyticsEvents: AnalyticsEvent[];
  nowMs?: number;
}): OwnerOverviewMetrics {
  const nowMs = params.nowMs ?? Date.now();
  const todayIso = formatIsoDateLocal(new Date(nowMs));
  const sevenDaysAgoIso = formatIsoDateLocal(new Date(nowMs - 6 * 86_400_000));

  const students = getRegisteredStudentsOnly(params.users);
  const freshPresences = params.presences.filter((p) => isPresenceFresh(p, nowMs));
  const studyingPresences = freshPresences.filter((p) => p.isStudying);
  const onlineUidSet = new Set(freshPresences.map((p) => p.userId));

  let paidStudents = 0;
  let pendingStudents = 0;
  let unpaidStudents = 0;
  let expiredStudents = 0;
  let suspendedStudents = 0;
  let activeStudents = 0;
  let uploadPermittedStudents = 0;
  let jan2027Students = 0;
  let may2027Students = 0;

  const pendingStudentIdsWithClaim = new Set(
    params.payments.filter((p) => p.status === 'pending').map((p) => p.studentId)
  );

  for (const s of students) {
    if (s.canUploadNotes === true && !s.isSuspended) {
      uploadPermittedStudents += 1;
    }
    if ((s.targetAttempt || '').toLowerCase().includes('may') && (s.targetAttempt || '').includes('2027')) {
      may2027Students += 1;
    } else {
      jan2027Students += 1;
    }

    const state = computeMembershipState(s, params.payments, nowMs);
    if (s.isSuspended) {
      suspendedStudents += 1;
    } else if (state.status === 'active') {
      paidStudents += 1;
    } else if (state.status === 'pending' || pendingStudentIdsWithClaim.has(s.id)) {
      pendingStudents += 1;
    } else if (state.status === 'expired') {
      expiredStudents += 1;
    } else {
      unpaidStudents += 1;
    }

    const activeRecently =
      !s.isSuspended &&
      (state.status === 'active' ||
        onlineUidSet.has(s.id) ||
        (Boolean(s.lastActiveDate) && s.lastActiveDate! >= sevenDaysAgoIso));
    if (activeRecently) {
      activeStudents += 1;
    }

    if (s.lastActiveDate === todayIso && !s.isSuspended) {
      onlineUidSet.add(s.id);
    }
  }

  const approvedPayments = params.payments.filter((p) => p.status === 'approved');
  const pendingPayments = params.payments.filter((p) => p.status === 'pending');
  const rejectedPayments = params.payments.filter((p) => p.status === 'rejected');

  const totalRevenueInr = approvedPayments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
  const uniqueVisitors = new Set(
    params.analyticsEvents.filter((e) => Boolean(e.visitorId)).map((e) => e.visitorId)
  );

  const todayActiveIds = new Set<string>();
  for (const ev of params.analyticsEvents) {
    if (ev.date === todayIso) {
      todayActiveIds.add(ev.userId || ev.visitorId);
    }
  }
  for (const p of freshPresences) {
    todayActiveIds.add(p.userId);
  }
  for (const s of students) {
    if (s.lastActiveDate === todayIso) {
      todayActiveIds.add(s.id);
    }
  }

  const liveStudyDurationMinutes = studyingPresences.reduce(
    (sum, p) => sum + computeLiveSessionMinutes(p, nowMs),
    0
  );

  const newRegistrationsToday = students.filter(
    (s) => (s.createdAt || '').slice(0, 10) === todayIso
  ).length;
  const newRegistrationsLast7Days = students.filter((s) => {
    const d = (s.createdAt || '').slice(0, 10);
    return d >= sevenDaysAgoIso && d <= todayIso;
  }).length;

  return {
    totalUsers: params.users.filter((u) => u.id !== 'guest').length,
    totalRegisteredStudents: students.length,
    onlineStudents: onlineUidSet.size,
    activeStudents,
    paidStudents,
    pendingStudents,
    unpaidStudents,
    expiredStudents,
    suspendedStudents,
    uploadPermittedStudents,
    jan2027Students,
    may2027Students,
    totalVisitors: uniqueVisitors.size,
    currentlyStudyingCount: studyingPresences.length,
    liveStudyDurationMinutes,
    totalApprovedPaymentsCount: approvedPayments.length,
    pendingPaymentRequestsCount: pendingPayments.length,
    rejectedPaymentRequestsCount: rejectedPayments.length,
    totalRevenueInr,
    dailyActiveUsers: todayActiveIds.size,
    newRegistrationsToday,
    newRegistrationsLast7Days,
  };
}

export function getRecentRegistrations(users: UserProfile[], limit = 6): UserProfile[] {
  return [...getRegisteredStudentsOnly(users)]
    .sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''))
    .slice(0, limit);
}

export function computeEngagementSummary(params: {
  users: UserProfile[];
  analyticsEvents: AnalyticsEvent[];
  presences: StudyPresence[];
  nowMs?: number;
}): EngagementSummary {
  const nowMs = params.nowMs ?? Date.now();
  const todayIso = formatIsoDateLocal(new Date(nowMs));
  const sevenDaysAgoIso = formatIsoDateLocal(new Date(nowMs - 6 * 86_400_000));
  const thirtyDaysAgoIso = formatIsoDateLocal(new Date(nowMs - 29 * 86_400_000));

  const dauSet = new Set<string>();
  const wauSet = new Set<string>();
  const mauSet = new Set<string>();

  for (const ev of params.analyticsEvents) {
    const actor = ev.userId || ev.visitorId;
    if (!actor || !ev.date) continue;
    if (ev.date === todayIso) dauSet.add(actor);
    if (ev.date >= sevenDaysAgoIso && ev.date <= todayIso) wauSet.add(actor);
    if (ev.date >= thirtyDaysAgoIso && ev.date <= todayIso) mauSet.add(actor);
  }

  for (const p of params.presences.filter((pr) => isPresenceFresh(pr, nowMs))) {
    dauSet.add(p.userId);
    wauSet.add(p.userId);
    mauSet.add(p.userId);
  }

  const students = getRegisteredStudentsOnly(params.users);
  let totalMinutes = 0;
  let totalQAttempted = 0;
  let totalQCorrect = 0;

  for (const s of students) {
    totalMinutes += Number(s.studyMinutesTotal) || 0;
    totalQAttempted += Number(s.totalQuestionsAttempted) || 0;
    totalQCorrect += Number(s.totalQuestionsCorrect) || 0;
    if (s.lastActiveDate) {
      if (s.lastActiveDate === todayIso) dauSet.add(s.id);
      if (s.lastActiveDate >= sevenDaysAgoIso && s.lastActiveDate <= todayIso) wauSet.add(s.id);
      if (s.lastActiveDate >= thirtyDaysAgoIso && s.lastActiveDate <= todayIso) mauSet.add(s.id);
    }
  }

  const dau = dauSet.size;
  const wau = wauSet.size;
  const mau = mauSet.size;
  const stickinessPercent = mau > 0 ? Math.min(100, Math.round((dau / mau) * 100)) : 0;
  const avgAccuracyPercent =
    totalQAttempted > 0 ? Math.min(100, Math.round((totalQCorrect / totalQAttempted) * 100)) : 0;

  return {
    dau,
    wau,
    mau,
    stickinessPercent,
    totalTrackedHours: Math.round((totalMinutes / 60) * 10) / 10,
    totalQuestionsAttempted: totalQAttempted,
    avgAccuracyPercent,
  };
}

export function buildReportBuckets(params: {
  timeframe: ReportTimeframe;
  users: UserProfile[];
  payments: PaymentRequest[];
  analyticsEvents: AnalyticsEvent[];
  nowMs?: number;
}): ReportBucket[] {
  const nowMs = params.nowMs ?? Date.now();
  const students = getRegisteredStudentsOnly(params.users);
  const approvedPayments = params.payments.filter((p) => p.status === 'approved');

  const buckets: ReportBucket[] = [];

  if (params.timeframe === 'daily') {
    for (let offset = 13; offset >= 0; offset -= 1) {
      const d = new Date(nowMs - offset * 86_400_000);
      const iso = formatIsoDateLocal(d);
      const label = d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });

      const newUsers = students.filter((s) => (s.createdAt || '').slice(0, 10) === iso).length;
      const dayApproved = approvedPayments.filter(
        (p) => (p.reviewedAt || p.createdAt || '').slice(0, 10) === iso
      );
      const revenueInr = dayApproved.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
      const dayEvents = params.analyticsEvents.filter((e) => e.date === iso);
      const visits = new Set(
        dayEvents.filter((e) => e.eventType === 'visit').map((e) => e.visitorId)
      ).size;
      const activeSessions = dayEvents.filter(
        (e) => e.eventType === 'study_session' || e.eventType === 'login'
      ).length;

      buckets.push({
        key: iso,
        label,
        newUsers,
        revenueInr,
        approvedCount: dayApproved.length,
        visits,
        activeSessions,
      });
    }
    return buckets;
  }

  if (params.timeframe === 'weekly') {
    for (let weekIdx = 7; weekIdx >= 0; weekIdx -= 1) {
      const endMs = nowMs - weekIdx * 7 * 86_400_000;
      const startMs = endMs - 6 * 86_400_000;
      const startIso = formatIsoDateLocal(new Date(startMs));
      const endIso = formatIsoDateLocal(new Date(endMs));
      const label = `${new Date(startMs).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}`;

      const newUsers = students.filter((s) => {
        const d = (s.createdAt || '').slice(0, 10);
        return d >= startIso && d <= endIso;
      }).length;

      const weekApproved = approvedPayments.filter((p) => {
        const d = (p.reviewedAt || p.createdAt || '').slice(0, 10);
        return d >= startIso && d <= endIso;
      });
      const revenueInr = weekApproved.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);

      const weekEvents = params.analyticsEvents.filter(
        (e) => e.date >= startIso && e.date <= endIso
      );
      const visits = new Set(
        weekEvents.filter((e) => e.eventType === 'visit').map((e) => e.visitorId)
      ).size;
      const activeSessions = weekEvents.filter(
        (e) => e.eventType === 'study_session' || e.eventType === 'login'
      ).length;

      buckets.push({
        key: `${startIso}_${endIso}`,
        label,
        newUsers,
        revenueInr,
        approvedCount: weekApproved.length,
        visits,
        activeSessions,
      });
    }
    return buckets;
  }

  // Monthly (last 6 calendar months)
  const nowDate = new Date(nowMs);
  for (let mOffset = 5; mOffset >= 0; mOffset -= 1) {
    const monthDate = new Date(nowDate.getFullYear(), nowDate.getMonth() - mOffset, 1);
    const yyyyMm = `${monthDate.getFullYear()}-${String(monthDate.getMonth() + 1).padStart(2, '0')}`;
    const label = monthDate.toLocaleDateString('en-IN', { month: 'short', year: '2-digit' });

    const newUsers = students.filter((s) => (s.createdAt || '').startsWith(yyyyMm)).length;
    const monthApproved = approvedPayments.filter((p) =>
      (p.reviewedAt || p.createdAt || '').startsWith(yyyyMm)
    );
    const revenueInr = monthApproved.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
    const monthEvents = params.analyticsEvents.filter((e) => (e.date || '').startsWith(yyyyMm));
    const visits = new Set(
      monthEvents.filter((e) => e.eventType === 'visit').map((e) => e.visitorId)
    ).size;
    const activeSessions = monthEvents.filter(
      (e) => e.eventType === 'study_session' || e.eventType === 'login'
    ).length;

    buckets.push({
      key: yyyyMm,
      label,
      newUsers,
      revenueInr,
      approvedCount: monthApproved.length,
      visits,
      activeSessions,
    });
  }

  return buckets;
}

export function filterStudentsForOwner(params: {
  students: UserProfile[];
  payments: PaymentRequest[];
  query: string;
  filter: StudentFilterMode;
  nowMs?: number;
}): UserProfile[] {
  const nowMs = params.nowMs ?? Date.now();
  const q = params.query.trim().toLowerCase();

  return getRegisteredStudentsOnly(params.students).filter((student) => {
    const state = computeMembershipState(student, params.payments, nowMs);

    if (params.filter === 'suspended' && !student.isSuspended) return false;
    if (params.filter === 'active' && (student.isSuspended || state.status !== 'active')) return false;
    if (params.filter === 'pending' && state.status !== 'pending') return false;
    if (params.filter === 'expired' && (student.isSuspended || state.status !== 'expired')) return false;
    if (params.filter === 'unpaid' && (student.isSuspended || state.status !== 'unpaid')) return false;
    if (params.filter === 'uploaders' && (student.isSuspended || student.canUploadNotes !== true)) return false;

    if (!q) return true;
    return (
      student.name.toLowerCase().includes(q) ||
      student.email.toLowerCase().includes(q) ||
      (student.phone || '').toLowerCase().includes(q) ||
      (student.city || '').toLowerCase().includes(q) ||
      (student.paymentReference || '').toLowerCase().includes(q)
    );
  });
}

export function formatPaperShortLabel(paperId?: PaperId): string {
  switch (paperId) {
    case 'paper1':
      return 'P1 · Accounts';
    case 'paper2':
      return 'P2 · Laws';
    case 'paper3':
      return 'P3 · Quant';
    case 'paper4':
      return 'P4 · Economics';
    default:
      return 'General Study';
  }
}
