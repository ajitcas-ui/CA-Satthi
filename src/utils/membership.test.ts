import test from 'node:test';
import assert from 'node:assert/strict';
import { 
  getStudentMembershipStatus, 
  generateStudentPaymentReference, 
  approvePaymentRequest,
  exportStudentsToCsv,
  exportPaymentsToCsv,
  exportRevenueToCsv
} from './storageDb';
import { UserProfile, PaymentRequest } from '../types';

test('generateStudentPaymentReference generates valid CAS-2027- format', () => {
  const ref1 = generateStudentPaymentReference('usr_test1');
  const ref2 = generateStudentPaymentReference('usr_test2');
  
  assert.ok(ref1.startsWith('CAS-2027-'), 'Ref must start with CAS-2027-');
  assert.ok(ref2.startsWith('CAS-2027-'), 'Ref must start with CAS-2027-');
  assert.equal(ref1.length, 13, 'Ref length should be 13 characters');
});

test('getStudentMembershipStatus: Admin is exempt and has active premium access', () => {
  const adminUser: UserProfile = {
    id: 'usr_admin_test',
    name: 'CA Ajit Singh',
    email: 'ajitsinghca9@gmail.com',
    role: 'admin',
    targetAttempt: 'January 2027',
    targetYear: 2027,
    avatar: '👨‍🏫',
    joinedGroupIds: [],
    bookmarkedPostIds: [],
    blockedUserIds: [],
    createdAt: '2026-01-01',
    membershipStatus: 'active',
    privacyHideCity: false,
    privacyHideAttempt: false,
  };

  const status = getStudentMembershipStatus(adminUser, []);
  assert.equal(status.status, 'active');
  assert.equal(status.canAccessPremium, true);
  assert.equal(status.daysRemaining, 9999);
});

test('getStudentMembershipStatus: Suspended student has no access', () => {
  const suspendedUser: UserProfile = {
    id: 'usr_susp_test',
    name: 'Bad Actor',
    email: 'bad@example.com',
    role: 'student',
    targetAttempt: 'January 2027',
    targetYear: 2027,
    avatar: '👨‍🎓',
    joinedGroupIds: [],
    bookmarkedPostIds: [],
    blockedUserIds: [],
    createdAt: '2026-01-01',
    membershipStatus: 'active',
    isSuspended: true,
    suspensionReason: 'Spamming',
    privacyHideCity: false,
    privacyHideAttempt: false,
  };

  const status = getStudentMembershipStatus(suspendedUser, []);
  assert.equal(status.canAccessPremium, false);
  assert.equal(status.isSuspended, true);
});

test('getStudentMembershipStatus: Unpaid student has unpaid status', () => {
  const unpaidUser: UserProfile = {
    id: 'usr_unpaid_test',
    name: 'New Student',
    email: 'new@example.com',
    role: 'student',
    targetAttempt: 'January 2027',
    targetYear: 2027,
    avatar: '👨‍🎓',
    joinedGroupIds: [],
    bookmarkedPostIds: [],
    blockedUserIds: [],
    createdAt: '2026-01-01',
    membershipStatus: 'unpaid',
    privacyHideCity: false,
    privacyHideAttempt: false,
  };

  const status = getStudentMembershipStatus(unpaidUser, []);
  assert.equal(status.status, 'unpaid');
  assert.equal(status.canAccessPremium, false);
});

test('getStudentMembershipStatus: Student with pending payment has pending status', () => {
  const pendingUser: UserProfile = {
    id: 'usr_pend_test',
    name: 'Pending Student',
    email: 'pend@example.com',
    role: 'student',
    targetAttempt: 'January 2027',
    targetYear: 2027,
    avatar: '👨‍🎓',
    joinedGroupIds: [],
    bookmarkedPostIds: [],
    blockedUserIds: [],
    createdAt: '2026-01-01',
    membershipStatus: 'pending',
    privacyHideCity: false,
    privacyHideAttempt: false,
  };

  const pendingPayment: PaymentRequest = {
    id: 'pay_pend_01',
    studentId: 'usr_pend_test',
    studentName: 'Pending Student',
    studentEmail: 'pend@example.com',
    studentMobile: '+91 99999 88888',
    planType: 'monthly_access',
    screenshotUrl: '/payment-proof.png',
    amount: 5,
    utr: '123456789012',
    status: 'pending',
    createdAt: new Date().toISOString(),
  };

  const status = getStudentMembershipStatus(pendingUser, [pendingPayment]);
  assert.equal(status.status, 'pending');
  assert.equal(status.canAccessPremium, false);
});

test('getStudentMembershipStatus: Active subscription calculates days remaining', () => {
  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + 25);

  const activeUser: UserProfile = {
    id: 'usr_active_test',
    name: 'Active Student',
    email: 'active@example.com',
    role: 'student',
    targetAttempt: 'January 2027',
    targetYear: 2027,
    avatar: '👩‍🎓',
    joinedGroupIds: [],
    bookmarkedPostIds: [],
    blockedUserIds: [],
    createdAt: '2026-01-01',
    membershipStatus: 'active',
    subscriptionExpiresAt: futureDate.toISOString(),
    privacyHideCity: false,
    privacyHideAttempt: false,
  };

  const status = getStudentMembershipStatus(activeUser, []);
  assert.equal(status.status, 'active');
  assert.equal(status.canAccessPremium, true);
  assert.ok(status.daysRemaining !== null && status.daysRemaining >= 24, 'Days remaining should be at least 24');
});

test('CSV export utilities generate valid header and rows', () => {
  const mockStudents: UserProfile[] = [
    {
      id: 'usr_s1',
      name: 'Rohan Sharma',
      email: 'rohan@test.com',
      phone: '+91 99999 88888',
      role: 'student',
      targetAttempt: 'January 2027',
      targetYear: 2027,
      avatar: '👨‍🎓',
      joinedGroupIds: [],
      bookmarkedPostIds: [],
      blockedUserIds: [],
      createdAt: '2026-11-01',
      membershipStatus: 'active',
      subscriptionExpiresAt: '2026-12-01T00:00:00Z',
      paymentReference: 'CAS-2027-ROHA',
      privacyHideCity: false,
      privacyHideAttempt: false,
    }
  ];

  const studentCsv = exportStudentsToCsv(mockStudents);
  assert.ok(studentCsv.includes('Student ID,Name,Email,Mobile,Target Attempt,Membership Status'));
  assert.ok(studentCsv.includes('"Rohan Sharma"'));
  assert.ok(studentCsv.includes('CAS-2027-ROHA'));

  const mockPayments: PaymentRequest[] = [
    {
      id: 'pay_001',
      studentId: 'usr_s1',
      studentName: 'Rohan Sharma',
      studentEmail: 'rohan@test.com',
      studentMobile: '+91 99999 88888',
      paymentReference: 'CAS-2027-ROHA',
      planType: 'monthly_access',
      screenshotUrl: '/proof.png',
      amount: 5,
      utr: 'UTR998877665544',
      status: 'approved',
      createdAt: '2026-11-01T10:00:00Z',
      reviewedAt: '2026-11-01T10:05:00Z',
      reviewedBy: 'CA Ajit Singh',
      adminNotes: 'Bank confirmed',
    }
  ];

  const paymentCsv = exportPaymentsToCsv(mockPayments);
  assert.ok(paymentCsv.includes('Payment ID,Student ID,Student Name,Email,Mobile,Payment Ref,Amount (INR),UTR Number'));
  assert.ok(paymentCsv.includes('UTR998877665544'));

  const revCsv = exportRevenueToCsv(mockPayments);
  assert.ok(revCsv.includes('Payment ID,Date,Student Name,UTR,Plan,Amount (INR),Verified By'));
  assert.ok(revCsv.includes('"TOTAL REVENUE"'));
});
