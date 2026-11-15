import { UserProfile } from '../types';
import {
  FirebaseAuthUserLike,
  normalizeFirestoreError,
  resolveGoogleUserEmail,
  withTimeout,
} from './firebaseAuthError';

export const DEFAULT_FIRESTORE_VERIFY_TIMEOUT_MS = 8000;

export interface AuthUserIdentity extends FirebaseAuthUserLike {
  uid: string;
  displayName?: string | null;
}

export interface ProfileStoreAdapter {
  readProfile: (uid: string) => Promise<{ exists: boolean; data?: UserProfile }>;
  createProfile: (uid: string, profile: UserProfile) => Promise<void>;
  syncOwnerFields: (
    uid: string,
    updates: Partial<UserProfile> & { updatedAt: string }
  ) => Promise<void>;
}

export interface ResolveProfileOptions {
  adminEmail: string;
  commonGroupId: string;
  timeoutMs?: number;
  now?: Date;
}

export async function resolveAuthorizedUserProfile(
  fbUser: AuthUserIdentity,
  store: ProfileStoreAdapter,
  options: ResolveProfileOptions
): Promise<UserProfile> {
  const emailClean = resolveGoogleUserEmail(fbUser);
  const adminEmail = options.adminEmail.trim().toLowerCase();
  const isVerifiedOwner = emailClean === adminEmail && Boolean(fbUser.emailVerified);
  const now = options.now ?? new Date();
  const todayIso = now.toISOString().split('T')[0];
  const timeoutMs = options.timeoutMs ?? DEFAULT_FIRESTORE_VERIFY_TIMEOUT_MS;

  let snapshot: { exists: boolean; data?: UserProfile };
  try {
    snapshot = await withTimeout(
      store.readProfile(fbUser.uid),
      timeoutMs,
      'firestore/timeout',
      'Timed out while verifying account profile in Cloud Firestore.'
    );
  } catch (err) {
    throw normalizeFirestoreError(err);
  }

  if (!snapshot.exists || !snapshot.data) {
    const newProfile: UserProfile = {
      id: fbUser.uid,
      name: fbUser.displayName || (isVerifiedOwner ? 'Ajeet Patel (Owner)' : 'CA Aspirant'),
      email: emailClean,
      role: isVerifiedOwner ? 'admin' : 'student',
      targetAttempt: 'January 2027',
      targetYear: 2027,
      city: 'India',
      phone: '',
      bio: isVerifiedOwner
        ? 'CA Saathi Platform Owner & Super Admin.'
        : 'CA Foundation Aspirant with CA Saathi.',
      avatar: isVerifiedOwner ? '👨‍🏫' : '🎓',
      joinedGroupIds: [options.commonGroupId],
      bookmarkedPostIds: [],
      blockedUserIds: [],
      privacyHideCity: false,
      privacyHideAttempt: false,
      membershipStatus: isVerifiedOwner ? 'active' : 'unpaid',
      hasPaidPass: isVerifiedOwner,
      dailyGoalMinutes: 120,
      studyMinutesTotal: 0,
      studyStreak: 0,
      canUploadNotes: isVerifiedOwner,
      lastActiveDate: todayIso,
      createdAt: todayIso,
    };

    try {
      await withTimeout(
        store.createProfile(fbUser.uid, newProfile),
        timeoutMs,
        'firestore/timeout',
        'Timed out while creating user profile in Cloud Firestore.'
      );
    } catch (err) {
      throw normalizeFirestoreError(err);
    }

    return newProfile;
  }

  const profile = snapshot.data;

  if (isVerifiedOwner) {
    const needsOwnerSync =
      profile.role !== 'admin' ||
      profile.hasPaidPass !== true ||
      profile.membershipStatus !== 'active' ||
      profile.isSuspended === true;

    const upgraded: UserProfile = {
      ...profile,
      email: emailClean,
      role: 'admin',
      hasPaidPass: true,
      membershipStatus: 'active',
      isSuspended: false,
      lastActiveDate: todayIso,
    };

    if (needsOwnerSync) {
      try {
        await withTimeout(
          store.syncOwnerFields(fbUser.uid, {
            role: 'admin',
            hasPaidPass: true,
            membershipStatus: 'active',
            isSuspended: false,
            lastActiveDate: todayIso,
            updatedAt: now.toISOString(),
          }),
          timeoutMs,
          'firestore/timeout',
          'Timed out while syncing owner permissions in Cloud Firestore.'
        );
      } catch (err) {
        throw normalizeFirestoreError(err);
      }
    }

    return upgraded;
  }

  return profile;
}
