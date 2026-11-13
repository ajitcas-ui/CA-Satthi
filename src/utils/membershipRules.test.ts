import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  ADMIN_OWNER_EMAIL,
  canUserAccessAdmin,
  computeMembershipState,
  computeSubscriptionExpiry,
} from './membershipRules';
import { PaymentRequest, UserProfile } from '../types';

const baseStudent: UserProfile = {
  id: 'usr_student_1',
  name: 'Riya Sharma',
  email: 'riya@example.com',
  role: 'student',
  targetAttempt: 'January 2027',
  targetYear: 2027,
  avatar: 'R',
  joinedGroupIds: ['grp_ca_saathi_common'],
  bookmarkedPostIds: [],
  blockedUserIds: [],
  privacyHideCity: false,
  privacyHideAttempt: false,
  createdAt: '2026-01-01T00:00:00.000Z',
  membershipStatus: 'unpaid',
};

describe('membershipRules', () => {
  it('keeps unpaid guest users locked out of paid features', () => {
    const guest: UserProfile = { ...baseStudent, id: 'guest', hasPaidPass: true, membershipStatus: 'active' };
    const state = computeMembershipState(guest, [], Date.now());
    assert.equal(state.status, 'unpaid');
    assert.equal(state.canAccessPremium, false);
  });

  it('never unlocks paid features when payment status is pending', () => {
    const now = Date.UTC(2026, 5, 10, 12, 0, 0);
    const pendingPayment: PaymentRequest = {
      id: 'pay_1',
      studentId: baseStudent.id,
      studentName: baseStudent.name,
      studentEmail: baseStudent.email,
      studentMobile: '9876543210',
      amount: 5,
      planType: 'monthly_access',
      utr: 'UTR1234567890',
      screenshotUrl: 'data:image/png;base64,abc',
      status: 'pending',
      createdAt: new Date(now).toISOString(),
    };
    const userWithPending: UserProfile = { ...baseStudent, membershipStatus: 'pending', hasPaidPass: true };
    const state = computeMembershipState(userWithPending, [pendingPayment], now);
    assert.equal(state.status, 'pending');
    assert.equal(state.canAccessPremium, false);
  });

  it('unlocks for 30 days only after admin approval and auto-expires after 30 days', () => {
    const approvedAt = Date.UTC(2026, 5, 1, 0, 0, 0);
    const expiresAt = computeSubscriptionExpiry(approvedAt, 30);
    const approvedPayment: PaymentRequest = {
      id: 'pay_2',
      studentId: baseStudent.id,
      studentName: baseStudent.name,
      studentEmail: baseStudent.email,
      studentMobile: '9876543210',
      amount: 5,
      planType: 'monthly_access',
      utr: 'UTR9988776655',
      screenshotUrl: 'data:image/png;base64,abc',
      status: 'approved',
      createdAt: new Date(approvedAt).toISOString(),
      reviewedAt: new Date(approvedAt).toISOString(),
      unlockedUntil: expiresAt,
    };

    const user: UserProfile = {
      ...baseStudent,
      membershipStatus: 'active',
      subscriptionExpiresAt: expiresAt,
    };

    // Day 15 -> Active
    const day15 = approvedAt + 15 * 24 * 60 * 60 * 1000;
    const activeState = computeMembershipState(user, [approvedPayment], day15);
    assert.equal(activeState.status, 'active');
    assert.equal(activeState.canAccessPremium, true);
    assert.equal(activeState.daysLeft, 15);

    // Day 31 -> Automatically Expired
    const day31 = approvedAt + 31 * 24 * 60 * 60 * 1000;
    const expiredState = computeMembershipState(user, [approvedPayment], day31);
    assert.equal(expiredState.status, 'expired');
    assert.equal(expiredState.canAccessPremium, false);
    assert.equal(expiredState.daysLeft, 0);
  });

  it('blocks suspended students even if subscription date has not elapsed', () => {
    const now = Date.UTC(2026, 5, 10);
    const futureExpiry = computeSubscriptionExpiry(now, 30);
    const suspended: UserProfile = {
      ...baseStudent,
      isSuspended: true,
      membershipStatus: 'active',
      subscriptionExpiresAt: futureExpiry,
    };
    const state = computeMembershipState(suspended, [], now);
    assert.equal(state.isSuspended, true);
    assert.equal(state.canAccessPremium, false);
  });

  it('restricts admin access strictly to verified owner email', () => {
    assert.equal(canUserAccessAdmin({ email: ADMIN_OWNER_EMAIL, role: 'admin' }, true), true);
    assert.equal(canUserAccessAdmin({ email: ADMIN_OWNER_EMAIL, role: 'admin' }, false), false);
    assert.equal(canUserAccessAdmin({ email: 'other@example.com', role: 'admin' }, true), false);
    assert.equal(canUserAccessAdmin({ email: ADMIN_OWNER_EMAIL, role: 'student' }, true), false);
  });
});
