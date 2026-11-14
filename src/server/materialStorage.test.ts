import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import {
  canUserAccessPdfMaterial,
  decodeFirestoreFields,
  isStudentMembershipActive,
  resolveSafeStoragePath,
} from './materialStorage.ts';

test('decodeFirestoreFields parses Firestore REST field types cleanly', () => {
  const decoded = decodeFirestoreFields({
    id: { stringValue: 'stu_1' },
    canUploadNotes: { booleanValue: true },
    hasPaidPass: { booleanValue: false },
    fileSizeBytes: { integerValue: '512000' },
  });
  assert.deepEqual(decoded, {
    id: 'stu_1',
    canUploadNotes: true,
    hasPaidPass: false,
    fileSizeBytes: 512000,
  });
});

test('resolveSafeStoragePath blocks path traversal and non-PDF filenames', () => {
  const root = '/tmp/study_pdfs';
  assert.equal(resolveSafeStoragePath(root, '../../etc/passwd'), null);
  assert.equal(resolveSafeStoragePath(root, 'script.js'), null);
  assert.equal(
    resolveSafeStoragePath(root, 'mat_12345.pdf'),
    path.resolve(root, 'mat_12345.pdf')
  );
});

test('isStudentMembershipActive checks suspension, paid status, and expiry', () => {
  const now = new Date('2026-11-14T00:00:00Z').getTime();
  assert.equal(isStudentMembershipActive({ hasPaidPass: true, isSuspended: true }, now), false);
  assert.equal(
    isStudentMembershipActive(
      { hasPaidPass: true, membershipStatus: 'active', subscriptionExpiresAt: '2026-12-01T00:00:00Z' },
      now
    ),
    true
  );
  assert.equal(
    isStudentMembershipActive(
      { hasPaidPass: true, membershipStatus: 'active', subscriptionExpiresAt: '2026-10-01T00:00:00Z' },
      now
    ),
    false
  );
  assert.equal(
    isStudentMembershipActive({ hasPaidPass: false, membershipStatus: 'unpaid' }, now),
    false
  );
});

test('canUserAccessPdfMaterial enforces owner, paid membership, and pending note isolation', () => {
  const now = new Date('2026-11-14T00:00:00Z').getTime();
  // Owner can always access pending/approved notes
  assert.equal(
    canUserAccessPdfMaterial({
      isOwner: true,
      uid: 'owner_1',
      materialData: { status: 'pending', uploaderId: 'stu_1' },
      nowMs: now,
    }).ok,
    true
  );

  // Unpaid student cannot read approved note
  const unpaidBlocked = canUserAccessPdfMaterial({
    isOwner: false,
    uid: 'stu_unpaid',
    userData: { membershipStatus: 'unpaid', hasPaidPass: false },
    materialData: { status: 'approved', uploaderId: 'admin_1' },
    nowMs: now,
  });
  assert.equal(unpaidBlocked.ok, false);

  // Paid peer cannot read someone else's pending note
  const pendingBlocked = canUserAccessPdfMaterial({
    isOwner: false,
    uid: 'stu_paid',
    userData: {
      membershipStatus: 'active',
      hasPaidPass: true,
      subscriptionExpiresAt: '2026-12-10T00:00:00Z',
    },
    materialData: { status: 'pending', uploaderId: 'stu_other' },
    nowMs: now,
  });
  assert.equal(pendingBlocked.ok, false);

  // Paid student can read approved note
  const paidAllowed = canUserAccessPdfMaterial({
    isOwner: false,
    uid: 'stu_paid',
    userData: {
      membershipStatus: 'active',
      hasPaidPass: true,
      subscriptionExpiresAt: '2026-12-10T00:00:00Z',
    },
    materialData: { status: 'approved', uploaderId: 'admin_1' },
    nowMs: now,
  });
  assert.equal(paidAllowed.ok, true);
});
