import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
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
  orderBy,
  onSnapshot,
  serverTimestamp,
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
} from '../types';

// Admin email configured in runtime environment
export const ADMIN_EMAIL = 'ajitsinghca9@gmail.com';

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

  // Update display name
  await updateProfile(fbUser, { displayName: params.name.trim() });

  const role = emailClean === ADMIN_EMAIL || emailClean === 'admin@casaathi.in' ? 'admin' : 'student';

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
    joinedGroupIds: ['grp_accounts', 'grp_doubts', 'grp_attempt_jan27'],
    bookmarkedPostIds: [],
    blockedUserIds: [],
    privacyHideCity: false,
    privacyHideAttempt: false,
    createdAt: new Date().toISOString().split('T')[0],
  };

  try {
    await setDoc(doc(db, 'users', fbUser.uid), userProfile);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `users/${fbUser.uid}`);
  }

  return userProfile;
}

export async function loginWithEmail(email: string, password: string): Promise<UserProfile> {
  const emailClean = email.trim().toLowerCase();
  const credential = await signInWithEmailAndPassword(auth, emailClean, password);
  const fbUser = credential.user;

  // Retrieve user profile from Firestore
  let profile = await getUserProfile(fbUser.uid);
  if (!profile) {
    // Bootstrap profile if missing
    const role = emailClean === ADMIN_EMAIL || emailClean === 'admin@casaathi.in' ? 'admin' : 'student';
    profile = {
      id: fbUser.uid,
      name: fbUser.displayName || 'CA Aspirant',
      email: emailClean,
      role,
      targetAttempt: 'January 2027',
      targetYear: 2027,
      city: 'India',
      phone: '',
      bio: 'CA Foundation Aspirant with CA Saathi.',
      avatar: role === 'admin' ? '👨‍🏫' : '🎓',
      joinedGroupIds: ['grp_accounts', 'grp_doubts', 'grp_attempt_jan27'],
      bookmarkedPostIds: [],
      blockedUserIds: [],
      privacyHideCity: false,
      privacyHideAttempt: false,
      createdAt: new Date().toISOString().split('T')[0],
    };
    try {
      await setDoc(doc(db, 'users', fbUser.uid), profile);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `users/${fbUser.uid}`);
    }
  }

  return profile;
}

export async function loginWithGoogle(): Promise<UserProfile> {
  const provider = new GoogleAuthProvider();
  const credential = await signInWithPopup(auth, provider);
  const fbUser = credential.user;
  const emailClean = fbUser.email?.toLowerCase() || '';

  let profile = await getUserProfile(fbUser.uid);
  if (!profile) {
    const role = emailClean === ADMIN_EMAIL || emailClean === 'admin@casaathi.in' ? 'admin' : 'student';
    profile = {
      id: fbUser.uid,
      name: fbUser.displayName || 'CA Aspirant',
      email: emailClean,
      role,
      targetAttempt: 'January 2027',
      targetYear: 2027,
      city: 'India',
      phone: '',
      bio: 'CA Foundation Aspirant with CA Saathi.',
      avatar: role === 'admin' ? '👨‍🏫' : '🎓',
      joinedGroupIds: ['grp_accounts', 'grp_doubts', 'grp_attempt_jan27'],
      bookmarkedPostIds: [],
      blockedUserIds: [],
      privacyHideCity: false,
      privacyHideAttempt: false,
      createdAt: new Date().toISOString().split('T')[0],
    };
    try {
      await setDoc(doc(db, 'users', fbUser.uid), profile);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `users/${fbUser.uid}`);
    }
  }

  return profile;
}

export async function sendForgotPasswordEmail(email: string): Promise<void> {
  await sendPasswordResetEmail(auth, email.trim().toLowerCase());
}

export async function logoutUser(): Promise<void> {
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
  try {
    await updateDoc(doc(db, 'users', userId), updates);
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
    const profile = await getUserProfile(fbUser.uid);
    callback(profile);
  });
}

// ============================================================================
// 2. MOCK TEST RESULTS & MCQ SCORES
// ============================================================================

export async function saveTestResultToDb(userId: string, result: TestAttemptResult): Promise<void> {
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
  if (!auth.currentUser || auth.currentUser.uid !== userId) {
    return () => {};
  }
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

// ============================================================================
// 3. WRONG QUESTIONS NOTEBOOK (त्रुटि पुस्तिका)
// ============================================================================

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

// ============================================================================
// 4. BOOKMARKS
// ============================================================================

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

// ============================================================================
// 5. STUDY PLANNER: TASKS & REVISION REMINDERS
// ============================================================================

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
// 6. COMMUNITY POSTS & REPLIES
// ============================================================================

export async function createCommunityPostInDb(
  post: Omit<CommunityPost, 'id' | 'likes' | 'likedBy' | 'replies' | 'createdAt'> & { createdAt?: string }
): Promise<string> {
  const postId = `post_${Date.now()}`;
  const path = `posts/${postId}`;
  try {
    await setDoc(doc(db, 'posts', postId), {
      ...post,
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

    // Also update parent post replies array for fast feed rendering
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
// 7. MODERATION REPORTS & EXAM UPDATES
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

// ============================================================================
// 10. REAL-TIME EXAM COUNTDOWN & CONFIGURATION
// ============================================================================

export async function saveExamConfigToDb(config: ExamCountdownConfig): Promise<void> {
  if (!auth.currentUser) {
    // Unauthenticated preview session: saved to local storage fallback
    return;
  }
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
      if (snap.exists()) {
        callback(snap.data() as ExamCountdownConfig);
      } else {
        callback(null);
      }
    },
    (error) => {
      handleFirestoreError(error, OperationType.GET, path);
    }
  );
}

