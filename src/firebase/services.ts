import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  sendEmailVerification,
  signInWithPopup,
  GoogleAuthProvider,
  onAuthStateChanged,
  updateProfile,
  User as FirebaseUser,
} from 'firebase/auth';
import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  query,
  where,
  onSnapshot,
  arrayUnion,
  arrayRemove,
  increment,
  Unsubscribe,
} from 'firebase/firestore';
import { auth, db, handleFirestoreError, OperationType } from './config';
import {
  UserProfile,
  TestAttemptResult,
  WrongQuestionEntry,
  StudyTask,
  RevisionReminder,
  CommunityPost,
  CommunityReply,
  ModerationReport,
  ExamUpdate,
  ExamCountdownConfig,
  PaymentRequest,
  UpiConfig,
  AppNotification,
  StudyPresence,
  StudySession,
  AnalyticsEvent,
  AuditLogEntry,
  SubjectChapter,
  MCQQuestion,
  StudyNote,
  StudentProgressSnapshot,
} from '../types';
import { computeSubscriptionExpiry } from '../utils/membershipRules';

export const ADMIN_EMAIL = 'ajitsinghca9@gmail.com';
export const COMMON_GROUP_ID = 'grp_ca_saathi_common';

export function isVerifiedAdminAuth(): boolean {
  const user = auth.currentUser;
  return Boolean(
    user &&
      user.email?.toLowerCase().trim() === ADMIN_EMAIL &&
      user.emailVerified
  );
}

// ============================================================================
// 1. AUTHENTICATION & USER PROFILE
// ============================================================================

export async function registerWithEmail(params: {
  name: string;
  email: string;
  password: string;
  targetAttempt: string;
  targetYear: number;
  city?: string;
  phone?: string;
  bio?: string;
}): Promise<UserProfile> {
  const emailClean = params.email.trim().toLowerCase();
  const credential = await createUserWithEmailAndPassword(auth, emailClean, params.password);
  const fbUser = credential.user;

  await updateProfile(fbUser, { displayName: params.name.trim() });

  const role = emailClean === ADMIN_EMAIL && fbUser.emailVerified ? 'admin' : 'student';

  const userProfile: UserProfile = {
    id: fbUser.uid,
    name: params.name.trim(),
    email: emailClean,
    role,
    targetAttempt: params.targetAttempt || 'January 2027',
    targetYear: params.targetYear || 2027,
    city: params.city?.trim() || 'India',
    phone: params.phone?.trim() || '',
    bio: params.bio?.trim() || 'Determined CA Foundation aspirant with CA Saathi.',
    avatar: role === 'admin' ? '👨‍🏫' : '🎓',
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
    createdAt: new Date().toISOString().split('T')[0],
  };

  try {
    await setDoc(doc(db, 'users', fbUser.uid), userProfile);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `users/${fbUser.uid}`);
  }

  return userProfile;
}

async function ensureAuthorizedUserProfile(fbUser: FirebaseUser): Promise<UserProfile> {
  const emailClean = (fbUser.email || '').toLowerCase().trim();
  const isVerifiedOwner = emailClean === ADMIN_EMAIL && fbUser.emailVerified;
  const todayIso = new Date().toISOString().split('T')[0];

  let profile: UserProfile | null = null;
  try {
    profile = await getUserProfile(fbUser.uid);
  } catch {
    profile = null;
  }

  if (!profile) {
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
      joinedGroupIds: [COMMON_GROUP_ID],
      bookmarkedPostIds: [],
      blockedUserIds: [],
      privacyHideCity: false,
      privacyHideAttempt: false,
      membershipStatus: isVerifiedOwner ? 'active' : 'unpaid',
      hasPaidPass: isVerifiedOwner,
      dailyGoalMinutes: 120,
      studyMinutesTotal: 0,
      studyStreak: 0,
      lastActiveDate: todayIso,
      createdAt: todayIso,
    };

    try {
      await setDoc(doc(db, 'users', fbUser.uid), newProfile);
    } catch (error) {
      if (!isVerifiedOwner) {
        handleFirestoreError(error, OperationType.WRITE, `users/${fbUser.uid}`);
      }
    }
    return newProfile;
  }

  if (isVerifiedOwner) {
    const needsOwnerSync =
      profile.role !== 'admin' ||
      profile.hasPaidPass !== true ||
      profile.membershipStatus !== 'active';

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
        await updateDoc(doc(db, 'users', fbUser.uid), {
          role: 'admin',
          hasPaidPass: true,
          membershipStatus: 'active',
          isSuspended: false,
          lastActiveDate: todayIso,
          updatedAt: new Date().toISOString(),
        });
      } catch {
        // Non-blocking fallback: still return verified owner profile
      }
    }
    return upgraded;
  }

  return profile;
}

export async function loginWithEmail(email: string, password: string): Promise<UserProfile> {
  const emailClean = email.trim().toLowerCase();
  const credential = await signInWithEmailAndPassword(auth, emailClean, password);
  return ensureAuthorizedUserProfile(credential.user);
}

export async function loginWithGoogle(): Promise<UserProfile> {
  const provider = new GoogleAuthProvider();
  const credential = await signInWithPopup(auth, provider);
  return ensureAuthorizedUserProfile(credential.user);
}

export async function sendVerificationForCurrentUser(): Promise<void> {
  if (auth.currentUser && !auth.currentUser.emailVerified) {
    await sendEmailVerification(auth.currentUser);
  }
}

export async function sendForgotPasswordEmail(email: string): Promise<void> {
  await sendPasswordResetEmail(auth, email.trim().toLowerCase());
}

export async function logoutUser(): Promise<void> {
  const uid = auth.currentUser?.uid;
  if (uid) {
    try {
      await deleteDoc(doc(db, 'studyPresence', uid));
    } catch {
      // ignore offline/cleanup issues on logout
    }
  }
  await signOut(auth);
}

export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  try {
    const snap = await getDoc(doc(db, 'users', userId));
    if (snap.exists()) {
      return snap.data() as UserProfile;
    }
    return null;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, `users/${userId}`);
    return null;
  }
}

export async function updateUserProfileInDb(userId: string, updates: Partial<UserProfile>): Promise<void> {
  if (!auth.currentUser) return;
  try {
    const payload: Record<string, unknown> = { ...updates, updatedAt: new Date().toISOString() };
    // Never allow client-side non-admin callers to write protected privilege fields
    if (!isVerifiedAdminAuth()) {
      delete payload.role;
      delete payload.membershipStatus;
      delete payload.hasPaidPass;
      delete payload.subscriptionExpiresAt;
      delete payload.passExpiry;
      delete payload.isSuspended;
      delete payload.suspensionReason;
    }
    await updateDoc(doc(db, 'users', userId), payload);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `users/${userId}`);
  }
}

export function subscribeToAuthState(callback: (user: UserProfile | null) => void): Unsubscribe {
  return onAuthStateChanged(auth, async (fbUser: FirebaseUser | null) => {
    if (!fbUser) {
      callback(null);
      return;
    }
    try {
      const profile = await ensureAuthorizedUserProfile(fbUser);
      callback(profile);
    } catch {
      callback(null);
    }
  });
}

// ============================================================================
// 2. ADMIN STUDENT MANAGEMENT & REAL-TIME USER SNAPSHOTS
// ============================================================================

export function subscribeToAllStudents(callback: (users: UserProfile[]) => void): Unsubscribe {
  if (!isVerifiedAdminAuth()) return () => {};
  const path = 'users';
  return onSnapshot(
    collection(db, path),
    (snapshot) => {
      const list: UserProfile[] = [];
      snapshot.forEach((d) => list.push(d.data() as UserProfile));
      callback(list);
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
    }
  );
}

export async function updateStudentStatusByAdmin(
  studentId: string,
  updates: Partial<UserProfile>,
  auditSummary?: { action: string; details: string; targetName?: string }
): Promise<void> {
  if (!isVerifiedAdminAuth()) return;
  const path = `users/${studentId}`;
  try {
    await updateDoc(doc(db, 'users', studentId), {
      ...updates,
      updatedAt: new Date().toISOString(),
    });
    if (auditSummary) {
      await addAuditLogToDb({
        action: auditSummary.action,
        details: auditSummary.details,
        performedBy: auth.currentUser?.email || ADMIN_EMAIL,
        targetId: studentId,
        targetName: auditSummary.targetName || studentId,
        type: 'user',
      });
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function fetchStudentProgressForAdmin(studentId: string): Promise<StudentProgressSnapshot> {
  if (!isVerifiedAdminAuth()) {
    return { studySessions: [], testResults: [], chapterProgress: {} };
  }
  try {
    const [sessionsSnap, testsSnap, chaptersSnap] = await Promise.all([
      getDocs(collection(db, 'users', studentId, 'studySessions')),
      getDocs(collection(db, 'users', studentId, 'testResults')),
      getDocs(collection(db, 'users', studentId, 'chapterProgress')),
    ]);

    const studySessions: StudySession[] = [];
    sessionsSnap.forEach((d) => studySessions.push(d.data() as StudySession));
    studySessions.sort((a, b) => (b.startedAt || b.date || '').localeCompare(a.startedAt || a.date || ''));

    const testResults: TestAttemptResult[] = [];
    testsSnap.forEach((d) => testResults.push(d.data() as TestAttemptResult));
    testResults.sort((a, b) => (b.date || '').localeCompare(a.date || ''));

    const chapterProgress: Record<string, 'pending' | 'revising' | 'mastered'> = {};
    chaptersSnap.forEach((d) => {
      const data = d.data() as { status?: 'pending' | 'revising' | 'mastered' };
      if (data.status) {
        chapterProgress[d.id] = data.status;
      }
    });

    return { studySessions, testResults, chapterProgress };
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, `users/${studentId}/progress`);
    return { studySessions: [], testResults: [], chapterProgress: {} };
  }
}

// ============================================================================
// 3. ₹5 MONTHLY PAYMENT VERIFICATION & NOTIFICATIONS
// ============================================================================

export async function submitPaymentRequestToDb(claim: PaymentRequest): Promise<void> {
  if (!auth.currentUser || auth.currentUser.uid !== claim.studentId) return;
  const path = `paymentRequests/${claim.id}`;
  try {
    await setDoc(doc(db, 'paymentRequests', claim.id), {
      ...claim,
      status: 'pending',
    });

    // Notify Admin in real-time
    const notifId = `notif_pay_${claim.id}`;
    await setDoc(doc(db, 'notifications', notifId), {
      id: notifId,
      recipientId: 'admin',
      title: 'New ₹5 Payment Claim Submitted',
      message: `${claim.studentName} submitted UTR ${claim.utr} (₹${claim.amount}) for verification.`,
      type: 'payment_submitted',
      read: false,
      relatedId: claim.id,
      createdAt: new Date().toISOString(),
    } as AppNotification);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function approvePaymentRequestInDb(payment: PaymentRequest): Promise<string> {
  if (!isVerifiedAdminAuth()) return '';
  const nowIso = new Date().toISOString();
  const expiresAt = computeSubscriptionExpiry(Date.now(), 30);

  try {
    await updateDoc(doc(db, 'paymentRequests', payment.id), {
      status: 'approved',
      reviewedAt: nowIso,
      reviewedBy: auth.currentUser?.email || ADMIN_EMAIL,
      unlockedUntil: expiresAt,
      adminNotes: 'Verified by Admin (+30 days access unlocked)',
    });

    await updateDoc(doc(db, 'users', payment.studentId), {
      membershipStatus: 'active',
      hasPaidPass: true,
      subscriptionExpiresAt: expiresAt,
      passExpiry: expiresAt,
      updatedAt: nowIso,
    });

    const notifId = `notif_appr_${payment.id}`;
    await setDoc(doc(db, 'notifications', notifId), {
      id: notifId,
      recipientId: payment.studentId,
      title: 'Membership Approved! Welcome to Premium',
      message: `Your ₹${payment.amount} monthly pass (UTR: ${payment.utr}) is verified. Access is active for 30 days.`,
      type: 'payment_approved',
      read: false,
      relatedId: payment.id,
      createdAt: nowIso,
    } as AppNotification);

    await addAuditLogToDb({
      action: 'Approved Payment Request',
      details: `Approved ₹${payment.amount} (UTR: ${payment.utr}) for ${payment.studentName}. Access valid until ${expiresAt.split('T')[0]}.`,
      performedBy: auth.currentUser?.email || ADMIN_EMAIL,
      targetId: payment.id,
      targetName: payment.studentName,
      type: 'payment',
    });

    return expiresAt;
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `paymentRequests/${payment.id}`);
    return '';
  }
}

export async function rejectPaymentRequestInDb(payment: PaymentRequest, reason: string): Promise<void> {
  if (!isVerifiedAdminAuth()) return;
  const nowIso = new Date().toISOString();
  const cleanReason = reason.trim() || 'UTR / Transaction ID could not be matched with bank statement.';

  try {
    await updateDoc(doc(db, 'paymentRequests', payment.id), {
      status: 'rejected',
      reviewedAt: nowIso,
      reviewedBy: auth.currentUser?.email || ADMIN_EMAIL,
      adminNotes: cleanReason,
    });

    const notifId = `notif_rej_${payment.id}`;
    await setDoc(doc(db, 'notifications', notifId), {
      id: notifId,
      recipientId: payment.studentId,
      title: 'Payment Verification Rejected',
      message: `Your payment claim (UTR: ${payment.utr}) was rejected: ${cleanReason}`,
      type: 'payment_rejected',
      read: false,
      relatedId: payment.id,
      createdAt: nowIso,
    } as AppNotification);

    await addAuditLogToDb({
      action: 'Rejected Payment Request',
      details: `Rejected UTR ${payment.utr} for ${payment.studentName}. Reason: ${cleanReason}`,
      performedBy: auth.currentUser?.email || ADMIN_EMAIL,
      targetId: payment.id,
      targetName: payment.studentName,
      type: 'payment',
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `paymentRequests/${payment.id}`);
  }
}

export function subscribeToUserPayments(
  userId: string,
  callback: (payments: PaymentRequest[]) => void
): Unsubscribe {
  if (!auth.currentUser || auth.currentUser.uid !== userId) return () => {};
  const path = 'paymentRequests';
  const q = query(collection(db, path), where('studentId', '==', userId));
  return onSnapshot(
    q,
    (snapshot) => {
      const list: PaymentRequest[] = [];
      snapshot.forEach((d) => list.push(d.data() as PaymentRequest));
      callback(list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
    }
  );
}

export function subscribeToAllPaymentRequests(
  callback: (payments: PaymentRequest[]) => void
): Unsubscribe {
  if (!isVerifiedAdminAuth()) return () => {};
  const path = 'paymentRequests';
  return onSnapshot(
    collection(db, path),
    (snapshot) => {
      const list: PaymentRequest[] = [];
      snapshot.forEach((d) => list.push(d.data() as PaymentRequest));
      callback(list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
    }
  );
}

export function subscribeToNotifications(
  recipientId: string,
  callback: (notifications: AppNotification[]) => void
): Unsubscribe {
  if (!auth.currentUser) return () => {};
  const path = 'notifications';
  if (recipientId === 'admin') {
    if (!isVerifiedAdminAuth()) return () => {};
    return onSnapshot(
      collection(db, path),
      (snapshot) => {
        const list: AppNotification[] = [];
        snapshot.forEach((d) => list.push(d.data() as AppNotification));
        callback(list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, path);
      }
    );
  }

  const q = query(collection(db, path), where('recipientId', 'in', [recipientId, 'all']));
  return onSnapshot(
    q,
    (snapshot) => {
      const list: AppNotification[] = [];
      snapshot.forEach((d) => list.push(d.data() as AppNotification));
      callback(list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
    }
  );
}

export async function sendAdminNotificationToDb(params: {
  recipientId: string; // 'all' or specific studentId
  title: string;
  message: string;
  type: AppNotification['type'];
  relatedId?: string;
}): Promise<string> {
  if (!isVerifiedAdminAuth()) return '';
  const id = `notif_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
  const path = `notifications/${id}`;
  try {
    const payload: AppNotification = {
      id,
      recipientId: params.recipientId,
      title: params.title.trim().slice(0, 200),
      message: params.message.trim().slice(0, 500),
      type: params.type,
      read: false,
      ...(params.relatedId ? { relatedId: params.relatedId } : {}),
      createdAt: new Date().toISOString(),
    };
    await setDoc(doc(db, 'notifications', id), payload);
    await addAuditLogToDb({
      action: params.recipientId === 'all' ? 'Broadcast Notification Sent' : 'Direct Student Alert Sent',
      details: `${payload.title} -> ${params.recipientId === 'all' ? 'All Students' : params.recipientId}`,
      performedBy: auth.currentUser?.email || ADMIN_EMAIL,
      targetId: params.recipientId,
      type: 'content',
    });
    return id;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
    return '';
  }
}

export async function markNotificationReadInDb(notifId: string): Promise<void> {
  if (!auth.currentUser) return;
  try {
    await updateDoc(doc(db, 'notifications', notifId), { read: true });
  } catch {
    // non-fatal (for shared 'all' broadcasts, handled cleanly client-side)
  }
}

// ============================================================================
// 4. STUDY SESSIONS TRACKER & REAL-TIME LIVE PRESENCE
// ============================================================================

export async function saveStudySessionToDb(userId: string, session: StudySession): Promise<void> {
  if (!auth.currentUser || auth.currentUser.uid !== userId) return;
  const path = `users/${userId}/studySessions/${session.id}`;
  try {
    await setDoc(doc(db, 'users', userId, 'studySessions', session.id), session);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export function subscribeToUserStudySessions(
  userId: string,
  callback: (sessions: StudySession[]) => void
): Unsubscribe {
  if (!auth.currentUser || auth.currentUser.uid !== userId) return () => {};
  const path = `users/${userId}/studySessions`;
  return onSnapshot(
    collection(db, 'users', userId, 'studySessions'),
    (snapshot) => {
      const list: StudySession[] = [];
      snapshot.forEach((d) => list.push(d.data() as StudySession));
      callback(list.sort((a, b) => b.startedAt.localeCompare(a.startedAt)));
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
    }
  );
}

export async function upsertStudyPresence(presence: StudyPresence): Promise<void> {
  if (!auth.currentUser || auth.currentUser.uid !== presence.userId) return;
  const path = `studyPresence/${presence.userId}`;
  try {
    // Strictly non-PII presence fields
    await setDoc(doc(db, 'studyPresence', presence.userId), {
      userId: presence.userId,
      displayName: presence.displayName.slice(0, 80),
      avatar: presence.avatar || '🎓',
      targetAttempt: presence.targetAttempt || 'January 2027',
      activePaperId: presence.activePaperId || 'paper1',
      activeTopic: (presence.activeTopic || 'CA Foundation Study').slice(0, 120),
      isStudying: Boolean(presence.isStudying),
      sessionStartedAt: presence.sessionStartedAt,
      lastHeartbeatAt: presence.lastHeartbeatAt,
    });
  } catch {
    // non-fatal background heartbeat
  }
}

export function subscribeToStudyPresence(callback: (peers: StudyPresence[]) => void): Unsubscribe {
  if (!auth.currentUser) return () => {};
  const path = 'studyPresence';
  return onSnapshot(
    collection(db, path),
    (snapshot) => {
      const now = Date.now();
      const activePeers: StudyPresence[] = [];
      snapshot.forEach((d) => {
        const data = d.data() as StudyPresence;
        const lastPing = new Date(data.lastHeartbeatAt).getTime();
        // Consider online if heartbeat within last 3 minutes
        if (Number.isFinite(lastPing) && now - lastPing <= 180_000 && data.isStudying) {
          activePeers.push(data);
        }
      });
      callback(activePeers);
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
    }
  );
}

// ============================================================================
// 5. MOCK TEST RESULTS, WRONG NOTEBOOK, BOOKMARKS, PLANNER
// ============================================================================

export async function saveTestResultToDb(userId: string, result: TestAttemptResult): Promise<void> {
  if (!auth.currentUser || auth.currentUser.uid !== userId) return;
  const resultId = `res_${Date.now()}`;
  try {
    await setDoc(doc(db, 'users', userId, 'testResults', resultId), {
      ...result,
      id: resultId,
      userId,
      createdAt: new Date().toISOString(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `users/${userId}/testResults/${resultId}`);
  }
}

export function subscribeToUserTestResults(
  userId: string,
  callback: (results: TestAttemptResult[]) => void
): Unsubscribe {
  if (!auth.currentUser || auth.currentUser.uid !== userId) return () => {};
  const path = `users/${userId}/testResults`;
  const q = collection(db, 'users', userId, 'testResults');
  return onSnapshot(
    q,
    (snapshot) => {
      const list: TestAttemptResult[] = [];
      snapshot.forEach((d) => list.push(d.data() as TestAttemptResult));
      callback(list.sort((a, b) => b.date.localeCompare(a.date)));
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
    }
  );
}

export async function saveWrongAttemptToDb(
  userId: string,
  entry: WrongQuestionEntry
): Promise<void> {
  if (!auth.currentUser || auth.currentUser.uid !== userId) return;
  const path = `users/${userId}/wrongQuestions/${entry.questionId}`;
  try {
    await setDoc(
      doc(db, 'users', userId, 'wrongQuestions', entry.questionId),
      {
        ...entry,
        userId,
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function markWrongQuestionClearedInDb(
  userId: string,
  questionId: string
): Promise<void> {
  if (!auth.currentUser || auth.currentUser.uid !== userId) return;
  const path = `users/${userId}/wrongQuestions/${questionId}`;
  try {
    await updateDoc(doc(db, 'users', userId, 'wrongQuestions', questionId), {
      cleared: true,
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export function subscribeToUserWrongQuestions(
  userId: string,
  callback: (entries: WrongQuestionEntry[]) => void
): Unsubscribe {
  if (!auth.currentUser || auth.currentUser.uid !== userId) return () => {};
  const path = `users/${userId}/wrongQuestions`;
  const q = collection(db, 'users', userId, 'wrongQuestions');
  return onSnapshot(
    q,
    (snapshot) => {
      const list: WrongQuestionEntry[] = [];
      snapshot.forEach((d) => list.push(d.data() as WrongQuestionEntry));
      callback(list);
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
    }
  );
}

export async function toggleBookmarkInDb(userId: string, questionId: string, isBookmarked: boolean): Promise<void> {
  if (!auth.currentUser || auth.currentUser.uid !== userId) return;
  const path = `users/${userId}/bookmarks/${questionId}`;
  try {
    if (isBookmarked) {
      await deleteDoc(doc(db, 'users', userId, 'bookmarks', questionId));
    } else {
      await setDoc(doc(db, 'users', userId, 'bookmarks', questionId), {
        questionId,
        userId,
        createdAt: new Date().toISOString(),
      });
    }
  } catch (error) {
    handleFirestoreError(error, isBookmarked ? OperationType.DELETE : OperationType.WRITE, path);
  }
}

export function subscribeToUserBookmarks(
  userId: string,
  callback: (ids: string[]) => void
): Unsubscribe {
  if (!auth.currentUser || auth.currentUser.uid !== userId) return () => {};
  const path = `users/${userId}/bookmarks`;
  const q = collection(db, 'users', userId, 'bookmarks');
  return onSnapshot(
    q,
    (snapshot) => {
      const ids: string[] = [];
      snapshot.forEach((d) => ids.push(d.id));
      callback(ids);
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
    }
  );
}

export async function saveStudyTaskToDb(userId: string, task: StudyTask): Promise<void> {
  if (!auth.currentUser || auth.currentUser.uid !== userId) return;
  const path = `users/${userId}/studyTasks/${task.id}`;
  try {
    await setDoc(doc(db, 'users', userId, 'studyTasks', task.id), {
      ...task,
      userId,
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function deleteStudyTaskFromDb(userId: string, taskId: string): Promise<void> {
  if (!auth.currentUser || auth.currentUser.uid !== userId) return;
  const path = `users/${userId}/studyTasks/${taskId}`;
  try {
    await deleteDoc(doc(db, 'users', userId, 'studyTasks', taskId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export function subscribeToUserStudyTasks(
  userId: string,
  callback: (tasks: StudyTask[]) => void
): Unsubscribe {
  if (!auth.currentUser || auth.currentUser.uid !== userId) return () => {};
  const path = `users/${userId}/studyTasks`;
  const q = collection(db, 'users', userId, 'studyTasks');
  return onSnapshot(
    q,
    (snapshot) => {
      const list: StudyTask[] = [];
      snapshot.forEach((d) => list.push(d.data() as StudyTask));
      callback(list);
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
    }
  );
}

export async function saveRevisionReminderToDb(
  userId: string,
  reminder: RevisionReminder
): Promise<void> {
  if (!auth.currentUser || auth.currentUser.uid !== userId) return;
  const path = `users/${userId}/revisionReminders/${reminder.id}`;
  try {
    await setDoc(doc(db, 'users', userId, 'revisionReminders', reminder.id), {
      ...reminder,
      userId,
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function toggleRevisionReminderInDb(
  userId: string,
  reminderId: string,
  completed: boolean
): Promise<void> {
  if (!auth.currentUser || auth.currentUser.uid !== userId) return;
  const path = `users/${userId}/revisionReminders/${reminderId}`;
  try {
    await updateDoc(doc(db, 'users', userId, 'revisionReminders', reminderId), {
      completed,
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export function subscribeToUserRevisionReminders(
  userId: string,
  callback: (reminders: RevisionReminder[]) => void
): Unsubscribe {
  if (!auth.currentUser || auth.currentUser.uid !== userId) return () => {};
  const path = `users/${userId}/revisionReminders`;
  const q = collection(db, 'users', userId, 'revisionReminders');
  return onSnapshot(
    q,
    (snapshot) => {
      const list: RevisionReminder[] = [];
      snapshot.forEach((d) => list.push(d.data() as RevisionReminder));
      callback(list);
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
    }
  );
}

export async function saveChapterProgressToDb(
  userId: string,
  chapterId: string,
  status: 'pending' | 'revising' | 'mastered'
): Promise<void> {
  if (!auth.currentUser || auth.currentUser.uid !== userId) return;
  const path = `users/${userId}/chapterProgress/${chapterId}`;
  try {
    await setDoc(
      doc(db, 'users', userId, 'chapterProgress', chapterId),
      {
        chapterId,
        userId,
        status,
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export function subscribeToUserChapterProgress(
  userId: string,
  callback: (progress: Record<string, 'pending' | 'revising' | 'mastered'>) => void
): Unsubscribe {
  if (!auth.currentUser || auth.currentUser.uid !== userId) return () => {};
  const path = `users/${userId}/chapterProgress`;
  const q = collection(db, 'users', userId, 'chapterProgress');
  return onSnapshot(
    q,
    (snapshot) => {
      const map: Record<string, 'pending' | 'revising' | 'mastered'> = {};
      snapshot.forEach((d) => {
        const data = d.data();
        map[d.id] = data.status;
      });
      callback(map);
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
    }
  );
}

// ============================================================================
// 6. COMMUNITY POSTS & REPLIES (SINGLE COMMON GROUP)
// ============================================================================

export async function createCommunityPostInDb(
  post: Omit<CommunityPost, 'id' | 'likes' | 'likedBy' | 'replies' | 'createdAt'> & { createdAt?: string }
): Promise<string> {
  const postId = `post_${Date.now()}`;
  const path = `posts/${postId}`;
  try {
    await setDoc(doc(db, 'posts', postId), {
      ...post,
      groupId: COMMON_GROUP_ID,
      id: postId,
      likes: 0,
      likedBy: [],
      isPinned: false,
      isResolved: false,
      replies: [],
      createdAt: post.createdAt || 'Just now',
    });
    return postId;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
    return '';
  }
}

export async function addReplyInDb(
  postId: string,
  reply: Omit<CommunityReply, 'id' | 'likes' | 'likedBy' | 'createdAt'> & { createdAt?: string }
): Promise<void> {
  const replyId = `rep_${Date.now()}`;
  const path = `posts/${postId}/replies/${replyId}`;
  try {
    const replyDoc: CommunityReply = {
      ...reply,
      id: replyId,
      postId,
      likes: 0,
      likedBy: [],
      createdAt: 'Just now',
    };
    await setDoc(doc(db, 'posts', postId, 'replies', replyId), replyDoc);

    await updateDoc(doc(db, 'posts', postId), {
      replies: arrayUnion(replyDoc),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function toggleLikePostInDb(
  postId: string,
  userId: string,
  hasLiked: boolean
): Promise<void> {
  const path = `posts/${postId}`;
  try {
    await updateDoc(doc(db, 'posts', postId), {
      likes: increment(hasLiked ? -1 : 1),
      likedBy: hasLiked ? arrayRemove(userId) : arrayUnion(userId),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function togglePinPostInDb(postId: string, isPinned: boolean): Promise<void> {
  const path = `posts/${postId}`;
  try {
    await updateDoc(doc(db, 'posts', postId), { isPinned });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function toggleResolveDoubtInDb(postId: string, isResolved: boolean): Promise<void> {
  const path = `posts/${postId}`;
  try {
    await updateDoc(doc(db, 'posts', postId), { isResolved });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function deletePostFromDb(postId: string): Promise<void> {
  const path = `posts/${postId}`;
  try {
    await deleteDoc(doc(db, 'posts', postId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function deleteReplyFromDb(postId: string, replyId: string): Promise<void> {
  const path = `posts/${postId}/replies/${replyId}`;
  try {
    await deleteDoc(doc(db, 'posts', postId, 'replies', replyId));
    const postSnap = await getDoc(doc(db, 'posts', postId));
    if (postSnap.exists()) {
      const data = postSnap.data() as CommunityPost;
      const nextReplies = (data.replies || []).filter((r) => r.id !== replyId);
      await updateDoc(doc(db, 'posts', postId), { replies: nextReplies });
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export function subscribeToCommunityPosts(
  callback: (posts: CommunityPost[]) => void
): Unsubscribe {
  const path = 'posts';
  const q = collection(db, 'posts');
  return onSnapshot(
    q,
    (snapshot) => {
      const list: CommunityPost[] = [];
      snapshot.forEach((d) => list.push(d.data() as CommunityPost));
      callback(list);
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
    }
  );
}

// ============================================================================
// 7. MODERATION REPORTS, EXAM UPDATES, UPI CONFIG, EXAM COUNTDOWN
// ============================================================================

export async function submitModerationReportToDb(
  report: Omit<ModerationReport, 'id' | 'status' | 'createdAt'> & { reportedByUid: string }
): Promise<void> {
  const reportId = `rep_${Date.now()}`;
  const path = `moderationReports/${reportId}`;
  try {
    await setDoc(doc(db, 'moderationReports', reportId), {
      ...report,
      id: reportId,
      status: 'pending',
      createdAt: new Date().toISOString().split('T')[0],
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function resolveModerationReportInDb(
  reportId: string,
  status: 'resolved' | 'dismissed'
): Promise<void> {
  const path = `moderationReports/${reportId}`;
  try {
    await updateDoc(doc(db, 'moderationReports', reportId), { status });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export function subscribeToModerationReports(
  callback: (reports: ModerationReport[]) => void
): Unsubscribe {
  if (!auth.currentUser) return () => {};
  const path = 'moderationReports';
  const q = collection(db, 'moderationReports');
  return onSnapshot(
    q,
    (snapshot) => {
      const list: ModerationReport[] = [];
      snapshot.forEach((d) => list.push(d.data() as ModerationReport));
      callback(list);
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
    }
  );
}

export async function publishExamAnnouncementToDb(
  announcement: Omit<ExamUpdate, 'id'>
): Promise<string> {
  const id = `upd_${Date.now()}`;
  const path = `examAnnouncements/${id}`;
  try {
    await setDoc(doc(db, 'examAnnouncements', id), {
      ...announcement,
      id,
    });
    return id;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
    return '';
  }
}

export async function deleteExamAnnouncementFromDb(announcementId: string): Promise<void> {
  if (!isVerifiedAdminAuth()) return;
  const path = `examAnnouncements/${announcementId}`;
  try {
    await deleteDoc(doc(db, 'examAnnouncements', announcementId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export function subscribeToExamAnnouncements(
  callback: (updates: ExamUpdate[]) => void
): Unsubscribe {
  const path = 'examAnnouncements';
  const q = collection(db, 'examAnnouncements');
  return onSnapshot(
    q,
    (snapshot) => {
      const list: ExamUpdate[] = [];
      snapshot.forEach((d) => list.push(d.data() as ExamUpdate));
      callback(list);
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
    }
  );
}

export async function saveUpiConfigToDb(config: UpiConfig): Promise<void> {
  if (!isVerifiedAdminAuth()) return;
  const path = 'upiConfig/activeUpi';
  try {
    await setDoc(doc(db, 'upiConfig', 'activeUpi'), config);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export function subscribeToUpiConfig(callback: (config: UpiConfig | null) => void): Unsubscribe {
  const path = 'upiConfig/activeUpi';
  return onSnapshot(
    doc(db, 'upiConfig', 'activeUpi'),
    (snap) => {
      callback(snap.exists() ? (snap.data() as UpiConfig) : null);
    },
    (error) => {
      handleFirestoreError(error, OperationType.GET, path);
    }
  );
}

export async function saveExamConfigToDb(config: ExamCountdownConfig): Promise<void> {
  if (!isVerifiedAdminAuth()) return;
  const path = 'examCountdown/activeConfig';
  try {
    await setDoc(doc(db, 'examCountdown', 'activeConfig'), config);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export function subscribeToExamConfig(
  callback: (config: ExamCountdownConfig | null) => void
): Unsubscribe {
  const path = 'examCountdown/activeConfig';
  return onSnapshot(
    doc(db, 'examCountdown', 'activeConfig'),
    (snap) => {
      callback(snap.exists() ? (snap.data() as ExamCountdownConfig) : null);
    },
    (error) => {
      handleFirestoreError(error, OperationType.GET, path);
    }
  );
}

// ============================================================================
// 8. ADMIN ANALYTICS, AUDIT LOGS & CONTENT MANAGEMENT
// ============================================================================

export async function logAnalyticsEvent(
  eventType: AnalyticsEvent['eventType'],
  visitorId: string,
  userId?: string
): Promise<void> {
  const id = `evt_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  const nowIso = new Date().toISOString();
  try {
    await setDoc(doc(db, 'analyticsEvents', id), {
      id,
      visitorId: visitorId.slice(0, 80),
      ...(userId ? { userId } : {}),
      eventType,
      date: nowIso.slice(0, 10),
      createdAt: nowIso,
    });
  } catch {
    // non-fatal analytics telemetry
  }
}

export function subscribeToAnalyticsEvents(callback: (events: AnalyticsEvent[]) => void): Unsubscribe {
  if (!isVerifiedAdminAuth()) return () => {};
  const path = 'analyticsEvents';
  return onSnapshot(
    collection(db, path),
    (snapshot) => {
      const list: AnalyticsEvent[] = [];
      snapshot.forEach((d) => list.push(d.data() as AnalyticsEvent));
      callback(list.sort((a, b) => b.createdAt.localeCompare(a.createdAt)));
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
    }
  );
}

export async function addAuditLogToDb(
  entry: Omit<AuditLogEntry, 'id' | 'timestamp'>
): Promise<void> {
  if (!isVerifiedAdminAuth()) return;
  const id = `log_${Date.now()}`;
  try {
    await setDoc(doc(db, 'auditLogs', id), {
      ...entry,
      id,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `auditLogs/${id}`);
  }
}

export function subscribeToAuditLogs(callback: (logs: AuditLogEntry[]) => void): Unsubscribe {
  if (!isVerifiedAdminAuth()) return () => {};
  const path = 'auditLogs';
  return onSnapshot(
    collection(db, path),
    (snapshot) => {
      const list: AuditLogEntry[] = [];
      snapshot.forEach((d) => list.push(d.data() as AuditLogEntry));
      callback(list.sort((a, b) => b.timestamp.localeCompare(a.timestamp)));
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
    }
  );
}

export async function saveSubjectChapterToDb(chapter: SubjectChapter): Promise<void> {
  if (!isVerifiedAdminAuth()) return;
  try {
    await setDoc(doc(db, 'subjectChapters', chapter.id), chapter);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `subjectChapters/${chapter.id}`);
  }
}

export async function deleteSubjectChapterFromDb(chapterId: string): Promise<void> {
  if (!isVerifiedAdminAuth()) return;
  try {
    await deleteDoc(doc(db, 'subjectChapters', chapterId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `subjectChapters/${chapterId}`);
  }
}

export function subscribeToSubjectChapters(callback: (chapters: SubjectChapter[]) => void): Unsubscribe {
  const path = 'subjectChapters';
  return onSnapshot(
    collection(db, path),
    (snapshot) => {
      const list: SubjectChapter[] = [];
      snapshot.forEach((d) => list.push(d.data() as SubjectChapter));
      callback(list);
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
    }
  );
}

export async function saveCustomQuestionToDb(question: MCQQuestion): Promise<void> {
  if (!isVerifiedAdminAuth()) return;
  try {
    await setDoc(doc(db, 'customQuestions', question.id), question);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `customQuestions/${question.id}`);
  }
}

export async function deleteCustomQuestionFromDb(questionId: string): Promise<void> {
  if (!isVerifiedAdminAuth()) return;
  try {
    await deleteDoc(doc(db, 'customQuestions', questionId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `customQuestions/${questionId}`);
  }
}

export function subscribeToCustomQuestions(callback: (questions: MCQQuestion[]) => void): Unsubscribe {
  const path = 'customQuestions';
  return onSnapshot(
    collection(db, path),
    (snapshot) => {
      const list: MCQQuestion[] = [];
      snapshot.forEach((d) => list.push(d.data() as MCQQuestion));
      callback(list);
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
    }
  );
}

export async function saveStudyMaterialToDb(material: StudyNote): Promise<void> {
  if (!isVerifiedAdminAuth()) return;
  try {
    await setDoc(doc(db, 'studyMaterials', material.id), material);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `studyMaterials/${material.id}`);
  }
}

export async function deleteStudyMaterialFromDb(materialId: string): Promise<void> {
  if (!isVerifiedAdminAuth()) return;
  try {
    await deleteDoc(doc(db, 'studyMaterials', materialId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `studyMaterials/${materialId}`);
  }
}

export function subscribeToStudyMaterials(callback: (materials: StudyNote[]) => void): Unsubscribe {
  const path = 'studyMaterials';
  return onSnapshot(
    collection(db, path),
    (snapshot) => {
      const list: StudyNote[] = [];
      snapshot.forEach((d) => list.push(d.data() as StudyNote));
      callback(list);
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
    }
  );
}
