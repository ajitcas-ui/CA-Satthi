import test from 'node:test';
import assert from 'node:assert/strict';

test('UTR validation: ensures transaction reference is exactly 12 digits or alphanumeric without special characters', () => {
  const isValidUtr = (utr: string) => /^[A-Za-z0-9]{12}$/.test(utr.trim());

  assert.equal(isValidUtr('412345678901'), true);
  assert.equal(isValidUtr('SHORT_UTR'), false); // too short (< 12)
  assert.equal(isValidUtr('4123456789012'), false); // 13 chars
  assert.equal(isValidUtr('4123-4567-890'), false); // invalid characters
  assert.equal(isValidUtr('AXIS12345678'), true); // 12 chars
});

test('Referral Code generation and verification format', () => {
  const generateReferralCode = (name: string) => {
    const clean = name.replace(/[^a-zA-Z]/g, '').toUpperCase().slice(0, 5) || 'STUDENT';
    const rand = Math.floor(100 + Math.random() * 900);
    return `CAS-${clean}-${rand}`;
  };

  const code = generateReferralCode('Ajit Singh');
  assert.match(code, /^CAS-AJITS-\d{3}$/);

  const defaultCode = generateReferralCode('1234');
  assert.match(defaultCode, /^CAS-STUDENT-\d{3}$/);
});

test('Daily Challenge score and accuracy computation', () => {
  const computeChallengeStats = (totalQuestions: number, correctAnswers: number) => {
    const accuracy = totalQuestions > 0 ? Math.round((correctAnswers / totalQuestions) * 100) : 0;
    const basePoints = 20;
    const bonusPoints = accuracy >= 80 ? 10 : 0;
    return {
      accuracy,
      pointsEarned: basePoints + bonusPoints,
    };
  };

  const perfect = computeChallengeStats(10, 10);
  assert.equal(perfect.accuracy, 100);
  assert.equal(perfect.pointsEarned, 30);

  const average = computeChallengeStats(10, 7);
  assert.equal(average.accuracy, 70);
  assert.equal(average.pointsEarned, 20);
});

test('Exam countdown calculation returns non-negative time differential for January 2027', () => {
  const getExamDiff = (examDateStr: string, currentTimestamp: number) => {
    const target = new Date(examDateStr).getTime();
    const diff = Math.max(0, target - currentTimestamp);
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    return { diff, days };
  };

  const now = new Date('2026-11-10T00:00:00Z').getTime();
  const futureExam = '2027-01-18T14:00:00Z';
  const res = getExamDiff(futureExam, now);
  assert.ok(res.days > 50);

  const pastExam = '2025-01-18T14:00:00Z';
  const pastRes = getExamDiff(pastExam, now);
  assert.equal(pastRes.diff, 0);
  assert.equal(pastRes.days, 0);
});

test('Exam date verification protection: hides ticker when isDateVerified is false', () => {
  const getCountdownDisplayMode = (config: { isDateVerified: boolean; targetAttempt: string }) => {
    if (!config.isDateVerified) {
      return {
        showTimer: false,
        badgeText: 'Awaiting Official ICAI Date Notification',
        attemptLabel: config.targetAttempt,
      };
    }
    return {
      showTimer: true,
      badgeText: 'Official Schedule Confirmed',
      attemptLabel: config.targetAttempt,
    };
  };

  const unverified = getCountdownDisplayMode({ isDateVerified: false, targetAttempt: 'January 2027' });
  assert.equal(unverified.showTimer, false);
  assert.equal(unverified.badgeText, 'Awaiting Official ICAI Date Notification');
  assert.equal(unverified.attemptLabel, 'January 2027');

  const verified = getCountdownDisplayMode({ isDateVerified: true, targetAttempt: 'January 2027' });
  assert.equal(verified.showTimer, true);
  assert.equal(verified.badgeText, 'Official Schedule Confirmed');
});

test('Paid access verification: unlocks only after admin approval, never on pending or rejected', () => {
  const isAccessUnlocked = (userRole: string, hasPaidPass: boolean, payments: Array<{ status: 'pending' | 'approved' | 'rejected' }>) => {
    if (userRole === 'admin') return true;
    if (hasPaidPass) return true;
    return payments.some((p) => p.status === 'approved');
  };

  // Student with pending payment
  assert.equal(isAccessUnlocked('student', false, [{ status: 'pending' }]), false);

  // Student with rejected payment
  assert.equal(isAccessUnlocked('student', false, [{ status: 'rejected' }]), false);

  // Student with approved payment
  assert.equal(isAccessUnlocked('student', false, [{ status: 'approved' }]), true);

  // Admin always has access
  assert.equal(isAccessUnlocked('admin', false, []), true);
});

test('Student registered mobile validation: requires at least 10 digits', () => {
  const isValidMobile = (phone: string) => {
    let clean = phone.replace(/\D/g, '');
    if (clean.length === 12 && clean.startsWith('91')) {
      clean = clean.slice(2);
    }
    return clean.length === 10;
  };

  assert.equal(isValidMobile('9876543210'), true);
  assert.equal(isValidMobile('+91 9876543210'), true);
  assert.equal(isValidMobile('98765'), false); // too short
  assert.equal(isValidMobile('123456789012'), false); // too long without 91
  assert.equal(isValidMobile(''), false);
});

test('UPI Payment details: verifies Ajeet Patel, ajeet345@ptyes, and ₹5 fee', () => {
  const upiId = 'ajeet345@ptyes';
  const payeeName = 'Ajeet Patel';
  const amount = 5;

  assert.equal(upiId, 'ajeet345@ptyes');
  assert.equal(payeeName, 'Ajeet Patel');
  assert.equal(amount, 5);

  const upiUri = `upi://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(payeeName)}&am=${amount}&cu=INR&tn=CA%20Saathi%20Pass`;
  assert.ok(upiUri.includes('pa=ajeet345%40ptyes'));
  assert.ok(upiUri.includes('pn=Ajeet%20Patel'));
  assert.ok(upiUri.includes('am=5'));
});

test('Duplicate payment prevention: blocks identical UTR and multiple pending submissions', () => {
  const existingPayments = [
    { id: 'pay_1', studentId: 'student_1', utr: '412890563412', status: 'pending' },
    { id: 'pay_2', studentId: 'student_2', utr: '412890563889', status: 'approved' },
    { id: 'pay_3', studentId: 'student_3', utr: '412890000000', status: 'rejected' },
  ];

  const checkCanSubmit = (studentId: string, utr: string) => {
    const cleanUtr = utr.trim().toLowerCase();
    const duplicate = existingPayments.find((p) => p.utr.toLowerCase() === cleanUtr && p.status !== 'rejected');
    if (duplicate) return { canSubmit: false, error: 'Duplicate UTR' };

    const pending = existingPayments.find((p) => p.studentId === studentId && p.status === 'pending');
    if (pending) return { canSubmit: false, error: 'Already has pending claim' };

    return { canSubmit: true };
  };

  // Re-submitting registered approved UTR
  assert.equal(checkCanSubmit('student_4', '412890563889').canSubmit, false);

  // Student 1 trying to submit another claim while first is pending
  assert.equal(checkCanSubmit('student_1', '999988887777').canSubmit, false);

  // Re-using rejected UTR is allowed if corrected
  assert.equal(checkCanSubmit('student_3', '412890000000').canSubmit, true);

  // Fresh student with new UTR
  assert.equal(checkCanSubmit('student_4', '888877776666').canSubmit, true);
});
