import test from 'node:test';
import assert from 'node:assert/strict';
import { resolveAuthorizedUserProfile, ProfileStoreAdapter } from './ownerProfileSync';
import { UserProfile } from '../types';

const ADMIN_EMAIL = 'ajitsinghca9@gmail.com';
const COMMON_GROUP_ID = 'grp_ca_saathi_common';

test('resolveAuthorizedUserProfile fails fast when readProfile rejects offline instead of falling through to hanging createProfile', async () => {
  let createCalled = false;
  const store: ProfileStoreAdapter = {
    readProfile: async () => {
      throw new Error('Failed to get document because the client is offline.');
    },
    createProfile: async () => {
      createCalled = true;
      return new Promise<void>(() => {});
    },
    syncOwnerFields: async () => {},
  };

  await assert.rejects(
    () =>
      resolveAuthorizedUserProfile(
        {
          uid: 'vAarf5lPSJPMneAhyrHozNzbfPs2',
          email: ADMIN_EMAIL,
          emailVerified: true,
          displayName: 'Ajit Singh',
        },
        store,
        { adminEmail: ADMIN_EMAIL, commonGroupId: COMMON_GROUP_ID, timeoutMs: 200 }
      ),
    (err: unknown) => {
      assert.equal((err as { code?: string }).code, 'firestore/unavailable');
      assert.match((err as Error).message, /client is offline/);
      return true;
    }
  );

  assert.equal(createCalled, false);
});

test('resolveAuthorizedUserProfile times out stalled createProfile (setDoc offline hang) instead of infinite loading', async () => {
  let createCalled = false;
  const store: ProfileStoreAdapter = {
    readProfile: async () => ({ exists: false }),
    createProfile: async () => {
      createCalled = true;
      return new Promise<void>(() => {}); // simulates offline Firestore setDoc never resolving
    },
    syncOwnerFields: async () => {},
  };

  await assert.rejects(
    () =>
      resolveAuthorizedUserProfile(
        {
          uid: 'owner_uid',
          email: ADMIN_EMAIL,
          emailVerified: true,
          displayName: 'Ajit Singh',
        },
        store,
        { adminEmail: ADMIN_EMAIL, commonGroupId: COMMON_GROUP_ID, timeoutMs: 30 }
      ),
    (err: unknown) => {
      assert.equal((err as { code?: string }).code, 'firestore/timeout');
      assert.match((err as Error).message, /Timed out/);
      return true;
    }
  );

  assert.equal(createCalled, true);
});

test('resolveAuthorizedUserProfile creates and returns admin profile for verified owner when Firestore succeeds', async () => {
  let created: UserProfile | null = null;
  const store: ProfileStoreAdapter = {
    readProfile: async () => ({ exists: false }),
    createProfile: async (_uid, profile) => {
      created = profile;
    },
    syncOwnerFields: async () => {},
  };

  const result = await resolveAuthorizedUserProfile(
    {
      uid: 'owner_uid',
      email: 'AJITSINGHCA9@gmail.com',
      emailVerified: true,
      displayName: 'Ajit Singh',
    },
    store,
    { adminEmail: ADMIN_EMAIL, commonGroupId: COMMON_GROUP_ID, timeoutMs: 200 }
  );

  assert.equal(result.role, 'admin');
  assert.equal(result.email, ADMIN_EMAIL);
  assert.equal(result.hasPaidPass, true);
  assert.equal(result.membershipStatus, 'active');
  assert.ok(created);
});

test('resolveAuthorizedUserProfile refuses admin privilege when owner emailVerified is false', async () => {
  const store: ProfileStoreAdapter = {
    readProfile: async () => ({ exists: false }),
    createProfile: async () => {},
    syncOwnerFields: async () => {},
  };

  const result = await resolveAuthorizedUserProfile(
    {
      uid: 'unverified_owner_uid',
      email: ADMIN_EMAIL,
      emailVerified: false,
    },
    store,
    { adminEmail: ADMIN_EMAIL, commonGroupId: COMMON_GROUP_ID, timeoutMs: 200 }
  );

  assert.equal(result.role, 'student');
  assert.equal(result.hasPaidPass, false);
});

test('resolveAuthorizedUserProfile propagates permission-denied when syncing owner fields', async () => {
  const existingNonAdmin: UserProfile = {
    id: 'owner_uid',
    name: 'Ajit',
    email: ADMIN_EMAIL,
    role: 'student',
    targetAttempt: 'January 2027',
    targetYear: 2027,
    city: 'India',
    phone: '',
    bio: '',
    avatar: '🎓',
    joinedGroupIds: [COMMON_GROUP_ID],
    bookmarkedPostIds: [],
    blockedUserIds: [],
    privacyHideCity: false,
    privacyHideAttempt: false,
    membershipStatus: 'unpaid',
    hasPaidPass: false,
    dailyGoalMinutes: 120,
    studyMinutesTotal: 0,
    studyStreak: 0,
    canUploadNotes: false,
    createdAt: '2026-01-01',
  };

  const store: ProfileStoreAdapter = {
    readProfile: async () => ({ exists: true, data: existingNonAdmin }),
    createProfile: async () => {},
    syncOwnerFields: async () => {
      throw Object.assign(new Error('Missing or insufficient permissions.'), {
        code: 'permission-denied',
      });
    },
  };

  await assert.rejects(
    () =>
      resolveAuthorizedUserProfile(
        { uid: 'owner_uid', email: ADMIN_EMAIL, emailVerified: true },
        store,
        { adminEmail: ADMIN_EMAIL, commonGroupId: COMMON_GROUP_ID, timeoutMs: 200 }
      ),
    (err: unknown) => {
      assert.equal((err as { code?: string }).code, 'firestore/permission-denied');
      return true;
    }
  );
});
