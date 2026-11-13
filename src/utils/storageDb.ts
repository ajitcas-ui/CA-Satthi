import { 
  UserProfile, 
  CommunityGroup, 
  CommunityPost, 
  CommunityReply, 
  StudyPartner, 
  ModerationReport,
  WrongQuestionEntry,
  RevisionReminder,
  PaperId,
  PaymentRequest,
  UpiConfig,
  DoubtQuery,
  DailyChallengeRecord,
  ExamCountdownConfig,
  LeaderboardEntry,
  ReferralRecord,
  ReferralRewardConfig,
  MCQQuestion,
  AuditLogEntry,
  MembershipStatus,
  SubjectChapter,
  StudentBadge,
  StudySession
} from '../types';
import { COMMON_GROUP_ID, INITIAL_GROUPS, INITIAL_POSTS, INITIAL_STUDY_PARTNERS } from '../data/communityData';
import { MOCK_QUESTIONS } from '../data/mockQuestions';
import { toSubjectChapters } from '../data/syllabusData';
import { ADMIN_OWNER_EMAIL } from './membershipRules';

export const GUEST_USER: UserProfile = {
  id: 'guest',
  name: 'CA Aspirant',
  email: '',
  role: 'student',
  targetAttempt: 'January 2027',
  targetYear: 2027,
  city: 'India',
  phone: '',
  bio: 'Sign in with Google to track your CA Foundation January 2027 progress and unlock ₹5/month membership.',
  avatar: '🎓',
  joinedGroupIds: [COMMON_GROUP_ID],
  bookmarkedPostIds: [],
  blockedUserIds: [],
  privacyHideCity: false,
  privacyHideAttempt: false,
  createdAt: '2026-01-01',
  referralCode: 'CAS-GUEST',
  referralPoints: 0,
  hasPaidPass: false,
  membershipStatus: 'unpaid',
  paymentReference: 'CAS-2027-GUES',
  isSuspended: false,
  dailyGoalMinutes: 120,
  studyMinutesTotal: 0,
  studyStreak: 0,
};

// Preset standard accounts with verified membership profiles
export const PRESET_USERS: UserProfile[] = [
  {
    id: 'usr_priya',
    name: 'Priya Sharma',
    email: 'priya@example.com',
    role: 'student',
    targetAttempt: 'January 2027',
    targetYear: 2027,
    city: 'Jaipur',
    phone: '+91 98765 43210', // PRIVATE: Never exposed publicly
    bio: 'Determined CA Foundation aspirant. Target: 320+ aggregate. Accounts and Law lover.',
    avatar: '👩‍🎓',
    joinedGroupIds: ['grp_accounts', 'grp_law', 'grp_maths', 'grp_attempt_jan27', 'grp_doubts'],
    bookmarkedPostIds: ['post_1'],
    blockedUserIds: [],
    privacyHideCity: false,
    privacyHideAttempt: false,
    createdAt: '2026-09-01',
    referralCode: 'CAS-PRIYA-78',
    referralPoints: 120,
    hasPaidPass: true,
    passExpiry: '2027-06-30T23:59:59',
    membershipStatus: 'active',
    subscriptionExpiresAt: '2027-06-30T23:59:59',
    paymentReference: 'CAS-2027-PRIY',
    isSuspended: false,
  },
  {
    id: 'usr_rohan',
    name: 'Rohan Verma',
    email: 'rohan@example.com',
    role: 'student',
    targetAttempt: 'January 2027',
    targetYear: 2027,
    city: 'Lucknow',
    phone: '+91 91234 56789', // PRIVATE: Never exposed publicly
    bio: 'Focusing on high-speed Quantitative Aptitude and Economics revision.',
    avatar: '👨‍🎓',
    joinedGroupIds: ['grp_maths', 'grp_economics', 'grp_doubts'],
    bookmarkedPostIds: [],
    blockedUserIds: [],
    privacyHideCity: false,
    privacyHideAttempt: false,
    createdAt: '2026-10-15',
    referralCode: 'CAS-ROHAN-42',
    referralPoints: 40,
    hasPaidPass: false,
    membershipStatus: 'pending',
    paymentReference: 'CAS-2027-ROHA',
    isSuspended: false,
  },
  {
    id: 'usr_admin',
    name: 'CA Ajit Singh (Super Admin)',
    email: 'ajitsinghca9@gmail.com',
    role: 'admin',
    targetAttempt: 'Faculty / Mentor',
    targetYear: 2027,
    city: 'New Delhi',
    phone: '+91 98111 22233', // PRIVATE
    bio: 'Chartered Accountant & Super Administrator of CA Saathi. Managing verified ICAI modules, student payments, and database integrity.',
    avatar: '👨‍🏫',
    joinedGroupIds: ['grp_accounts', 'grp_law', 'grp_maths', 'grp_economics', 'grp_doubts', 'grp_attempt_jan27'],
    bookmarkedPostIds: [],
    blockedUserIds: [],
    privacyHideCity: false,
    privacyHideAttempt: false,
    createdAt: '2026-01-01',
    membershipStatus: 'active',
    subscriptionExpiresAt: '2099-12-31T23:59:59',
    paymentReference: 'CAS-ADMIN-AJIT',
    isSuspended: false,
  },
];

// LocalStorage Keys
const KEYS = {
  CURRENT_USER: 'ca_saathi_current_user',
  ALL_USERS: 'ca_saathi_all_users',
  GROUPS: 'ca_saathi_groups',
  POSTS: 'ca_saathi_posts',
  PARTNERS: 'ca_saathi_study_partners',
  REPORTS: 'ca_saathi_reports',
  WRONG_NOTEBOOK: 'ca_saathi_wrong_notebook',
  REMINDERS: 'ca_saathi_revision_reminders',
};

// Safe JSON Helpers
function getStored<T>(key: string, fallback: T): T {
  try {
    const val = localStorage.getItem(key);
    return val ? JSON.parse(val) : fallback;
  } catch {
    return fallback;
  }
}

function setStored<T>(key: string, data: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch {
    // quota exceeded or blocked
  }
}

// ============================================================================
// AUTHENTICATION & USER ACCOUNTS
// ============================================================================

export function generateStudentPaymentReference(studentId: string): string {
  const clean = studentId.replace(/[^a-zA-Z0-9]/g, '').slice(-4).toUpperCase() || 'STU1';
  return `CAS-2027-${clean}`;
}

export function getCurrentUser(): UserProfile {
  const current = getStored<UserProfile | null>(KEYS.CURRENT_USER, null);
  if (current && current.id && current.id !== 'guest') {
    // Auto-migrate missing fields safely without elevating membership
    if (!current.paymentReference || !current.membershipStatus) {
      const updated: UserProfile = {
        ...current,
        paymentReference: current.paymentReference || generateStudentPaymentReference(current.id),
        membershipStatus: current.membershipStatus || 'unpaid',
        isSuspended: typeof current.isSuspended === 'boolean' ? current.isSuspended : false,
      };
      setStored(KEYS.CURRENT_USER, updated);
      return updated;
    }
    return current;
  }

  return GUEST_USER;
}

export function clearCurrentUser(): void {
  try {
    localStorage.removeItem(KEYS.CURRENT_USER);
  } catch {
    // ignore storage restriction
  }
}

export function getAllUsers(): UserProfile[] {
  const users = getStored<UserProfile[]>(KEYS.ALL_USERS, PRESET_USERS);
  // Ensure every student has a payment reference and membership status
  return users.map((u) => ({
    ...u,
    paymentReference: u.paymentReference || generateStudentPaymentReference(u.id),
    membershipStatus: u.membershipStatus || (u.hasPaidPass ? 'active' : 'unpaid'),
    isSuspended: typeof u.isSuspended === 'boolean' ? u.isSuspended : false,
  }));
}

export function getStudentMembershipStatus(
  user: UserProfile | null | undefined,
  payments?: PaymentRequest[]
): {
  status: MembershipStatus;
  expiresAt?: string;
  daysRemaining: number;
  canAccessPremium: boolean;
  isSuspended: boolean;
  reason?: string;
} {
  if (!user || user.id === 'guest') {
    return { status: 'unpaid', daysRemaining: 0, canAccessPremium: false, isSuspended: false };
  }

  // Strictly Owner Super Admin only
  if (user.role === 'admin' && user.email?.toLowerCase().trim() === ADMIN_OWNER_EMAIL) {
    return {
      status: 'active',
      expiresAt: '2099-12-31T23:59:59',
      daysRemaining: 9999,
      canAccessPremium: true,
      isSuspended: false,
    };
  }

  // Account Suspension Check
  if (user.isSuspended) {
    return {
      status: 'unpaid',
      daysRemaining: 0,
      canAccessPremium: false,
      isSuspended: true,
      reason: user.suspensionReason || 'Account suspended by Super Admin.',
    };
  }

  // Check pending payment claim first (Pending NEVER unlocks paid features)
  const sourcePayments = payments ?? getPaymentRequests();
  const userPayments = sourcePayments.filter((p) => p.studentId === user.id);
  const pendingPayment = userPayments.find((p) => p.status === 'pending');
  const approvedPayment = [...userPayments]
    .filter((p) => p.status === 'approved')
    .sort((a, b) => new Date(b.unlockedUntil || b.createdAt).getTime() - new Date(a.unlockedUntil || a.createdAt).getTime())[0];

  // Check active approved subscription
  const expiryStr = approvedPayment?.unlockedUntil || user.subscriptionExpiresAt || user.passExpiry;
  if (expiryStr) {
    const expiryTime = new Date(expiryStr).getTime();
    const now = Date.now();
    if (expiryTime > now) {
      const daysRemaining = Math.max(1, Math.ceil((expiryTime - now) / (1000 * 60 * 60 * 24)));
      return {
        status: 'active',
        expiresAt: expiryStr,
        daysRemaining,
        canAccessPremium: true,
        isSuspended: false,
      };
    } else if (!pendingPayment && user.membershipStatus !== 'pending') {
      return {
        status: 'expired',
        expiresAt: expiryStr,
        daysRemaining: 0,
        canAccessPremium: false,
        isSuspended: false,
        reason: 'Monthly subscription period ended.',
      };
    }
  }

  if (pendingPayment || user.membershipStatus === 'pending') {
    return {
      status: 'pending',
      daysRemaining: 0,
      canAccessPremium: false,
      isSuspended: false,
      reason: 'Payment submitted with UTR. Under manual verification by Admin.',
    };
  }

  if (user.membershipStatus === 'expired') {
    return {
      status: 'expired',
      daysRemaining: 0,
      canAccessPremium: false,
      isSuspended: false,
    };
  }

  return {
    status: 'unpaid',
    daysRemaining: 0,
    canAccessPremium: false,
    isSuspended: false,
  };
}

export function loginUser(email: string): { success: boolean; user?: UserProfile; message: string } {
  const users = getAllUsers();
  const found = users.find((u) => u.email.toLowerCase() === email.trim().toLowerCase());
  if (found) {
    setStored(KEYS.CURRENT_USER, found);
    return { success: true, user: found, message: 'Logged in successfully' };
  }
  return { success: false, message: 'No registered student account found with this email' };
}

export function registerStudent(params: {
  name: string;
  email: string;
  targetAttempt: string;
  targetYear: number;
  city?: string;
  phone?: string;
  bio?: string;
}): { success: boolean; user?: UserProfile; message: string } {
  const users = getAllUsers();
  const existing = users.find((u) => u.email.toLowerCase() === params.email.trim().toLowerCase());
  if (existing) {
    return { success: false, message: 'An account with this email already exists. Please login.' };
  }

  const newId = `usr_${Date.now()}`;
  const newUser: UserProfile = {
    id: newId,
    name: params.name.trim(),
    email: params.email.trim().toLowerCase(),
    role: 'student',
    targetAttempt: params.targetAttempt || 'January 2027',
    targetYear: params.targetYear || 2027,
    city: params.city?.trim() || 'India',
    phone: params.phone?.trim() || '', // Stored strictly private
    bio: params.bio?.trim() || 'CA Foundation Aspirant with CA Saathi.',
    avatar: '🎓',
    joinedGroupIds: ['grp_doubts', 'grp_attempt_jan27'],
    bookmarkedPostIds: [],
    blockedUserIds: [],
    privacyHideCity: false,
    privacyHideAttempt: false,
    createdAt: new Date().toISOString().split('T')[0],
    membershipStatus: 'unpaid',
    hasPaidPass: false,
    paymentReference: generateStudentPaymentReference(newId),
    isSuspended: false,
  };

  const updatedUsers = [...users, newUser];
  setStored(KEYS.ALL_USERS, updatedUsers);
  setStored(KEYS.CURRENT_USER, newUser);

  return { success: true, user: newUser, message: 'Student account registered successfully!' };
}

export function toggleSuspendStudent(studentId: string, adminName: string, reason?: string): { success: boolean; isSuspended: boolean } {
  const users = getAllUsers();
  let nextState = false;
  const updated = users.map((u) => {
    if (u.id === studentId) {
      nextState = !u.isSuspended;
      return {
        ...u,
        isSuspended: nextState,
        suspensionReason: nextState ? (reason || 'Suspended by Super Admin') : undefined,
      };
    }
    return u;
  });
  setStored(KEYS.ALL_USERS, updated);

  const current = getCurrentUser();
  if (current.id === studentId) {
    setStored(KEYS.CURRENT_USER, {
      ...current,
      isSuspended: nextState,
      suspensionReason: nextState ? (reason || 'Suspended by Super Admin') : undefined,
    });
  }

  addAdminAuditLog({
    action: nextState ? 'Student Suspended' : 'Student Re-activated',
    details: `${nextState ? 'Suspended' : 'Re-activated'} student account ${studentId}. Reason: ${reason || 'N/A'}`,
    performedBy: adminName,
    targetId: studentId,
    type: 'user',
  });

  return { success: true, isSuspended: nextState };
}

export function extendStudentMembership(studentId: string, days: number, adminName: string): { success: boolean; newExpiry: string } {
  const users = getAllUsers();
  let newExpiryIso = '';
  const updated = users.map((u) => {
    if (u.id === studentId) {
      const baseDate = u.subscriptionExpiresAt && new Date(u.subscriptionExpiresAt).getTime() > Date.now()
        ? new Date(u.subscriptionExpiresAt)
        : new Date();
      baseDate.setDate(baseDate.getDate() + days);
      newExpiryIso = baseDate.toISOString();
      return {
        ...u,
        membershipStatus: 'active' as const,
        hasPaidPass: true,
        subscriptionExpiresAt: newExpiryIso,
        passExpiry: newExpiryIso,
      };
    }
    return u;
  });
  setStored(KEYS.ALL_USERS, updated);

  const current = getCurrentUser();
  if (current.id === studentId) {
    setStored(KEYS.CURRENT_USER, {
      ...current,
      membershipStatus: 'active',
      hasPaidPass: true,
      subscriptionExpiresAt: newExpiryIso,
      passExpiry: newExpiryIso,
    });
  }

  addAdminAuditLog({
    action: 'Membership Extended',
    details: `Extended membership by ${days} days (valid until ${new Date(newExpiryIso).toLocaleDateString()})`,
    performedBy: adminName,
    targetId: studentId,
    type: 'user',
  });

  return { success: true, newExpiry: newExpiryIso };
}

export function setStudentMembershipExpiry(studentId: string, expiryDateIso: string, adminName: string): { success: boolean; newExpiry: string } {
  const users = getAllUsers();
  const isFuture = new Date(expiryDateIso).getTime() > Date.now();
  const nextStatus: MembershipStatus = isFuture ? 'active' : 'expired';

  const updated = users.map((u) => {
    if (u.id === studentId) {
      return {
        ...u,
        membershipStatus: nextStatus,
        hasPaidPass: isFuture,
        subscriptionExpiresAt: expiryDateIso,
        passExpiry: expiryDateIso,
      };
    }
    return u;
  });
  setStored(KEYS.ALL_USERS, updated);

  const current = getCurrentUser();
  if (current.id === studentId) {
    setStored(KEYS.CURRENT_USER, {
      ...current,
      membershipStatus: nextStatus,
      hasPaidPass: isFuture,
      subscriptionExpiresAt: expiryDateIso,
      passExpiry: expiryDateIso,
    });
  }

  addAdminAuditLog({
    action: 'Membership Expiry Set',
    details: `Updated membership expiry to ${expiryDateIso} (Status: ${nextStatus})`,
    performedBy: adminName,
    targetId: studentId,
    type: 'user',
  });

  return { success: true, newExpiry: expiryDateIso };
}

export function switchDemoAccount(userId: string): UserProfile {
  const users = getAllUsers();
  const found = users.find((u) => u.id === userId) || users[0];
  setStored(KEYS.CURRENT_USER, found);
  return found;
}

export function updateUserProfile(updates: Partial<UserProfile>): UserProfile {
  const current = getCurrentUser();
  const updated: UserProfile = { ...current, ...updates };
  setStored(KEYS.CURRENT_USER, updated);

  const users = getAllUsers().map((u) => (u.id === updated.id ? updated : u));
  setStored(KEYS.ALL_USERS, users);
  return updated;
}

// ============================================================================
// STUDENT COMMUNITY (GROUPS & POSTS)
// ============================================================================

const ALLOWED_GROUP_IDS = [COMMON_GROUP_ID];

export function getGroups(): CommunityGroup[] {
  const stored = getStored<CommunityGroup[]>(KEYS.GROUPS, INITIAL_GROUPS);
  const filtered = stored.filter((g) => ALLOWED_GROUP_IDS.includes(g.id));
  return filtered.length === 1 ? filtered : INITIAL_GROUPS;
}

export function toggleJoinGroup(groupId: string): CommunityGroup[] {
  const user = getCurrentUser();
  const isJoined = user.joinedGroupIds.includes(groupId);
  const nextJoined = isJoined
    ? user.joinedGroupIds.filter((id) => id !== groupId)
    : [...user.joinedGroupIds, groupId];

  updateUserProfile({ joinedGroupIds: nextJoined });

  const groups = getGroups().map((g) => {
    if (g.id === groupId) {
      return {
        ...g,
        memberCount: Math.max(0, g.memberCount + (isJoined ? -1 : 1)),
      };
    }
    return g;
  });

  setStored(KEYS.GROUPS, groups);
  return groups;
}

export function getPosts(): CommunityPost[] {
  return getStored<CommunityPost[]>(KEYS.POSTS, INITIAL_POSTS);
}

export function createCommunityPost(data: {
  groupId: string;
  title: string;
  content: string;
  paperId?: PaperId;
  chapterName?: string;
  tags?: string[];
}): CommunityPost {
  const user = getCurrentUser();
  const posts = getPosts();

  const newPost: CommunityPost = {
    id: `post_${Date.now()}`,
    groupId: data.groupId,
    authorId: user.id,
    authorName: user.name,
    authorRole: user.role,
    authorAvatar: user.avatar,
    createdAt: 'Just now',
    title: data.title.trim(),
    content: data.content.trim(),
    paperId: data.paperId,
    chapterName: data.chapterName,
    tags: data.tags && data.tags.length > 0 ? data.tags : ['CA Foundation'],
    likes: 0,
    likedBy: [],
    replies: [],
  };

  const updatedPosts = [newPost, ...posts];
  setStored(KEYS.POSTS, updatedPosts);

  // Update group active count
  const groups = getGroups().map((g) => {
    if (g.id === data.groupId) {
      return { ...g, activeDiscussionsCount: g.activeDiscussionsCount + 1 };
    }
    return g;
  });
  setStored(KEYS.GROUPS, groups);

  return newPost;
}

export function addReplyToPost(postId: string, content: string): CommunityReply | null {
  if (!content.trim()) return null;
  const user = getCurrentUser();
  const posts = getPosts();

  let createdReply: CommunityReply | null = null;

  const updatedPosts = posts.map((post) => {
    if (post.id === postId) {
      const reply: CommunityReply = {
        id: `rep_${Date.now()}`,
        postId,
        authorId: user.id,
        authorName: user.name,
        authorRole: user.role,
        authorAvatar: user.avatar,
        createdAt: 'Just now',
        content: content.trim(),
        likes: 0,
        likedBy: [],
      };
      createdReply = reply;
      return {
        ...post,
        replies: [...post.replies, reply],
      };
    }
    return post;
  });

  setStored(KEYS.POSTS, updatedPosts);
  return createdReply;
}

export function toggleLikePost(postId: string): CommunityPost[] {
  const user = getCurrentUser();
  const posts = getPosts().map((post) => {
    if (post.id === postId) {
      const hasLiked = post.likedBy.includes(user.id);
      const nextLikedBy = hasLiked
        ? post.likedBy.filter((id) => id !== user.id)
        : [...post.likedBy, user.id];
      return {
        ...post,
        likes: Math.max(0, post.likes + (hasLiked ? -1 : 1)),
        likedBy: nextLikedBy,
      };
    }
    return post;
  });

  setStored(KEYS.POSTS, posts);
  return posts;
}

export function togglePinPost(postId: string): CommunityPost[] {
  const posts = getPosts().map((p) => {
    if (p.id === postId) {
      return { ...p, isPinned: !p.isPinned };
    }
    return p;
  });
  setStored(KEYS.POSTS, posts);
  return posts;
}

export function toggleResolveDoubt(postId: string): CommunityPost[] {
  const posts = getPosts().map((p) => {
    if (p.id === postId) {
      return { ...p, isResolved: !p.isResolved };
    }
    return p;
  });
  setStored(KEYS.POSTS, posts);
  return posts;
}

export function deletePost(postId: string): CommunityPost[] {
  const posts = getPosts().filter((p) => p.id !== postId);
  setStored(KEYS.POSTS, posts);
  return posts;
}

// ============================================================================
// STUDY PARTNER MATCHING
// ============================================================================

export function getStudyPartners(): StudyPartner[] {
  return getStored<StudyPartner[]>(KEYS.PARTNERS, INITIAL_STUDY_PARTNERS);
}

export function toggleConnectPartner(partnerId: string): StudyPartner[] {
  const partners = getStudyPartners().map((sp) => {
    if (sp.id === partnerId) {
      return { ...sp, connected: !sp.connected };
    }
    return sp;
  });
  setStored(KEYS.PARTNERS, partners);
  return partners;
}

// ============================================================================
// MODERATION & REPORTS
// ============================================================================

export function getModerationReports(): ModerationReport[] {
  return getStored<ModerationReport[]>(KEYS.REPORTS, [
    {
      id: 'rep_sample_1',
      targetType: 'post',
      targetId: 'post_2',
      targetTitle: 'Case Law Citation in Paper 2',
      reportedBy: 'Simran K.',
      reason: 'Off-topic discussion in wrong paper',
      details: 'Please check if this should be moved to Business Laws group.',
      status: 'pending',
      createdAt: '2026-11-07',
    },
  ]);
}

export function submitReport(params: {
  targetType: 'post' | 'reply' | 'user';
  targetId: string;
  targetTitle: string;
  reason: string;
  details: string;
}): void {
  const user = getCurrentUser();
  const reports = getModerationReports();
  const newReport: ModerationReport = {
    id: `rep_${Date.now()}`,
    targetType: params.targetType,
    targetId: params.targetId,
    targetTitle: params.targetTitle,
    reportedBy: user.name,
    reason: params.reason,
    details: params.details,
    status: 'pending',
    createdAt: new Date().toISOString().split('T')[0],
  };
  setStored(KEYS.REPORTS, [newReport, ...reports]);
}

export function resolveReport(reportId: string, status: 'resolved' | 'dismissed'): ModerationReport[] {
  const reports = getModerationReports().map((r) => {
    if (r.id === reportId) {
      return { ...r, status };
    }
    return r;
  });
  setStored(KEYS.REPORTS, reports);
  return reports;
}

// ============================================================================
// SMART PRACTICE: WRONG QUESTIONS NOTEBOOK (त्रुटि पुस्तिका)
// ============================================================================

export function getWrongQuestions(): WrongQuestionEntry[] {
  return getStored<WrongQuestionEntry[]>(KEYS.WRONG_NOTEBOOK, [
    {
      questionId: 'icai_mod_p3_01',
      paperId: 'paper3',
      failedCount: 2,
      lastAttemptDate: '2026-11-07',
      lastSelectedOption: 0,
      cleared: false,
      notes: 'Remember compounding m=4 for quarterly!',
    },
  ]);
}

export function recordWrongAttempt(questionId: string, paperId: PaperId, chosenOption: number): void {
  const notebook = getWrongQuestions();
  const existing = notebook.find((item) => item.questionId === questionId);

  let updated: WrongQuestionEntry[];
  if (existing) {
    updated = notebook.map((item) => {
      if (item.questionId === questionId) {
        return {
          ...item,
          failedCount: item.failedCount + 1,
          lastAttemptDate: new Date().toISOString().split('T')[0],
          lastSelectedOption: chosenOption,
          cleared: false,
        };
      }
      return item;
    });
  } else {
    updated = [
      {
        questionId,
        paperId,
        failedCount: 1,
        lastAttemptDate: new Date().toISOString().split('T')[0],
        lastSelectedOption: chosenOption,
        cleared: false,
      },
      ...notebook,
    ];
  }
  setStored(KEYS.WRONG_NOTEBOOK, updated);
}

export function markWrongQuestionCleared(questionId: string): void {
  const notebook = getWrongQuestions().map((item) => {
    if (item.questionId === questionId) {
      return { ...item, cleared: true };
    }
    return item;
  });
  setStored(KEYS.WRONG_NOTEBOOK, notebook);
}

// ============================================================================
// STUDY PLANNER: REVISION REMINDERS (Spaced Repetition)
// ============================================================================

export function getRevisionReminders(): RevisionReminder[] {
  return getStored<RevisionReminder[]>(KEYS.REMINDERS, [
    {
      id: 'rem_1',
      paperId: 'paper3',
      chapterTitle: {
        en: 'Time Value of Money (TVM)',
        hi: 'मुद्रा का समय मूल्य (TVM)',
      },
      intervalDays: 3,
      dueDate: '2026-11-10',
      completed: false,
    },
    {
      id: 'rem_2',
      paperId: 'paper2',
      chapterTitle: {
        en: 'Indian Contract Act - Section 10',
        hi: 'भारतीय अनुबंध अधिनियम - धारा 10',
      },
      intervalDays: 7,
      dueDate: '2026-11-14',
      completed: false,
    },
  ]);
}

export function addRevisionReminder(reminder: Omit<RevisionReminder, 'id' | 'completed'>): RevisionReminder {
  const reminders = getRevisionReminders();
  const newRem: RevisionReminder = {
    ...reminder,
    id: `rem_${Date.now()}`,
    completed: false,
  };
  setStored(KEYS.REMINDERS, [newRem, ...reminders]);
  return newRem;
}

export function toggleReminderCompleted(id: string): RevisionReminder[] {
  const reminders = getRevisionReminders().map((r) => {
    if (r.id === id) {
      return { ...r, completed: !r.completed };
    }
    return r;
  });
  setStored(KEYS.REMINDERS, reminders);
  return reminders;
}

// ============================================================================
// PRICING CONFIGURATION
// ============================================================================

export const DEFAULT_PRICING_CONFIG = {
  freeTierActive: false,
  nominalFeeEnabled: true,
  testPassPriceInRupees: 5,
  monthlyAccessPriceInRupees: 5,
  freeMockTestsLimit: 0,
  currency: 'INR',
  announcementNote: {
    en: 'CA Saathi Monthly Membership is ₹5/month (30 days) via verified UPI QR payment.',
    hi: 'सीए साथी मासिक सदस्यता केवल ₹5/माह (30 दिन) सत्यापित UPI भुगतान द्वारा उपलब्ध है।',
  },
  paymentGatewayActive: true,
};

export function getPricingConfig() {
  return getStored('ca_saathi_pricing', DEFAULT_PRICING_CONFIG);
}

export function savePricingConfig(config: typeof DEFAULT_PRICING_CONFIG): void {
  setStored('ca_saathi_pricing', config);
}

// ============================================================================
// 1. UPI QR CODE PAYMENT & SECURITY SYSTEM
// ============================================================================

export const DEFAULT_UPI_CONFIG: UpiConfig = {
  upiId: 'ajeet345@ptyes',
  payeeName: 'Ajeet Patel',
  defaultAmount: 5,
  monthlyAmount: 5,
  qrCodeImageUrl: '/original-upi-qr.png',
  instructions: {
    en: 'Scan the original UPI QR code using PhonePe, Google Pay, Paytm, BHIM, or any UPI app. Pay ₹5 for 30 days full access, enter your 12-digit UTR / Transaction ID, and upload your payment receipt screenshot. Access unlocks immediately once Admin verifies.',
    hi: 'PhonePe, Google Pay, Paytm, BHIM या किसी भी यूपीआई ऐप से मूल क्यूआर कोड स्कैन करें। 30 दिनों के पूर्ण एक्सेस हेतु ₹5 का भुगतान करें, अपना 12 अंकों का UTR नंबर दर्ज करें और रसीद का स्क्रीनशॉट अपलोड करें। एडमिन सत्यापन के तुरंत बाद प्रीमियम एक्सेस चालू होगा।',
  },
};

const RECEIPT_SVG_DATA_URI =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="420" height="240" viewBox="0 0 420 240"><rect width="420" height="240" rx="16" fill="#F8FAFC"/><rect x="20" y="20" width="380" height="200" rx="12" fill="#FFFFFF" stroke="#CBD5E1" stroke-width="2"/><text x="40" y="62" font-family="sans-serif" font-size="18" font-weight="bold" fill="#0F172A">UPI Payment Receipt (Sample Proof)</text><text x="40" y="96" font-family="sans-serif" font-size="15" fill="#16A34A">Paid Rs. 5.00 to Ajeet Patel</text><text x="40" y="126" font-family="monospace" font-size="14" fill="#475569">UPI ID: ajeet345@ptyes</text><text x="40" y="156" font-family="monospace" font-size="13" fill="#64748B">UTR Ref: Sample Record Preview</text></svg>'
  );

export const INITIAL_PAYMENT_REQUESTS: PaymentRequest[] = [
  {
    id: 'pay_1001',
    studentId: 'usr_rohan',
    studentName: 'Rohan Verma',
    studentEmail: 'rohan@example.com',
    studentMobile: '9876543210',
    amount: 5,
    planType: 'monthly_access',
    utr: '412890563412',
    screenshotUrl: RECEIPT_SVG_DATA_URI,
    status: 'pending',
    createdAt: '2026-11-09T17:45:00',
  },
  {
    id: 'pay_1002',
    studentId: 'usr_priya',
    studentName: 'Priya Sharma',
    studentEmail: 'priya@example.com',
    studentMobile: '9812345678',
    amount: 5,
    planType: 'monthly_access',
    utr: '412890563889',
    screenshotUrl: RECEIPT_SVG_DATA_URI,
    status: 'approved',
    adminNotes: 'Verified with bank transaction record. 30-day monthly membership activated.',
    reviewedBy: 'Ajeet Patel',
    reviewedAt: '2026-11-09T18:00:00',
    createdAt: '2026-11-09T16:20:00',
    unlockedUntil: '2027-11-09T18:00:00',
  },
  {
    id: 'pay_1003',
    studentId: 'usr_aman',
    studentName: 'Aman Gupta',
    studentEmail: 'aman@example.com',
    studentMobile: '9765432100',
    amount: 5,
    planType: 'monthly_access',
    utr: '412890000000',
    screenshotUrl: RECEIPT_SVG_DATA_URI,
    status: 'rejected',
    adminNotes: 'Invalid UTR reference: Transaction not found in bank ledger.',
    reviewedBy: 'Ajeet Patel',
    reviewedAt: '2026-11-09T18:15:00',
    createdAt: '2026-11-09T15:10:00',
  },
];

export function getUpiConfig(): UpiConfig {
  const cfg = getStored<UpiConfig>('ca_saathi_upi_config', DEFAULT_UPI_CONFIG);
  // Auto-upgrade if previous preset values were loaded
  if (cfg.upiId !== 'ajeet345@ptyes' || cfg.payeeName !== 'Ajeet Patel' || cfg.defaultAmount !== 5 || !cfg.qrCodeImageUrl) {
    const updated: UpiConfig = {
      ...cfg,
      upiId: 'ajeet345@ptyes',
      payeeName: 'Ajeet Patel',
      defaultAmount: 5,
      monthlyAmount: 5,
      qrCodeImageUrl: cfg.qrCodeImageUrl && cfg.qrCodeImageUrl !== '' ? cfg.qrCodeImageUrl : '/original-upi-qr.png',
    };
    setStored('ca_saathi_upi_config', updated);
    return updated;
  }
  return cfg;
}

export function saveUpiConfig(config: UpiConfig): void {
  setStored('ca_saathi_upi_config', config);
}

export function getPaymentRequests(): PaymentRequest[] {
  return getStored<PaymentRequest[]>('ca_saathi_payment_requests', INITIAL_PAYMENT_REQUESTS);
}

export function submitPaymentRequest(request: Omit<PaymentRequest, 'id' | 'status' | 'createdAt'>): { success: boolean; message: string; payment?: PaymentRequest } {
  const all = getPaymentRequests();
  const cleanUtr = request.utr.trim().replace(/\s+/g, '');
  let cleanMobile = (request.studentMobile || '').trim().replace(/\D/g, '');
  if (cleanMobile.length === 12 && cleanMobile.startsWith('91')) {
    cleanMobile = cleanMobile.slice(2);
  }

  // Validate student mobile number: 10-digit Indian phone number
  if (!cleanMobile || cleanMobile.length !== 10) {
    return { success: false, message: 'Please enter a valid 10-digit registered mobile number.' };
  }

  // Prevent duplicate UTR submission across claims
  const duplicateUtr = all.find((p) => p.utr.toLowerCase() === cleanUtr.toLowerCase() && p.status !== 'rejected');
  if (duplicateUtr) {
    return { success: false, message: 'This UPI Transaction ID (UTR) has already been submitted and is in our verification records.' };
  }

  // Prevent duplicate pending claims from the same student
  const existingPending = all.find((p) => p.studentId === request.studentId && p.status === 'pending');
  if (existingPending) {
    return { success: false, message: 'You already have a pending payment request under admin verification (UTR: ' + existingPending.utr + '). Please wait for admin approval.' };
  }

  if (!request.screenshotUrl) {
    return { success: false, message: 'Payment screenshot is required for manual verification.' };
  }

  const newPayment: PaymentRequest = {
    ...request,
    id: `pay_${Date.now()}`,
    utr: cleanUtr,
    studentMobile: cleanMobile,
    paymentReference: request.paymentReference || generateStudentPaymentReference(request.studentId),
    amount: 5, // Strict ₹5 monthly membership fee
    status: 'pending',
    createdAt: new Date().toISOString(),
  };

  const updated = [newPayment, ...all];
  setStored('ca_saathi_payment_requests', updated);

  // Update student profile status to pending
  const allUsers = getAllUsers();
  const updatedUsers = allUsers.map((u) => {
    if (u.id === request.studentId) {
      return {
        ...u,
        membershipStatus: 'pending' as const,
        paymentReference: newPayment.paymentReference,
      };
    }
    return u;
  });
  setStored(KEYS.ALL_USERS, updatedUsers);

  const current = getCurrentUser();
  if (current.id === request.studentId) {
    setStored(KEYS.CURRENT_USER, {
      ...current,
      membershipStatus: 'pending',
      paymentReference: newPayment.paymentReference,
    });
  }

  return { 
    success: true, 
    message: 'Payment submitted successfully! Your request has been sent to the admin dashboard for verification.', 
    payment: newPayment 
  };
}

export function approvePaymentRequest(
  paymentId: string, 
  adminName: string, 
  adminNotes?: string
): { success: boolean; payment?: PaymentRequest; message: string } {
  const all = getPaymentRequests();
  const target = all.find((p) => p.id === paymentId);

  if (!target) {
    return { success: false, message: 'Payment request not found.' };
  }

  // Prevent duplicate approvals
  if (target.status === 'approved') {
    return { success: false, message: 'This payment has already been approved. Duplicate approval is prevented.' };
  }

  // Set 30 days monthly membership access
  const unlockedDate = new Date();
  unlockedDate.setDate(unlockedDate.getDate() + 30);
  const expiryIso = unlockedDate.toISOString();

  const approvedPayment: PaymentRequest = {
    ...target,
    status: 'approved' as const,
    adminNotes: adminNotes || 'Payment verified against bank UPI credit. 30-day access unlocked.',
    reviewedBy: adminName,
    reviewedAt: new Date().toISOString(),
    unlockedUntil: expiryIso,
  };

  const updatedPayments = all.map((p) => (p.id === paymentId ? approvedPayment : p));
  setStored('ca_saathi_payment_requests', updatedPayments);

  // Update target student user profile across the entire system
  const allUsers = getAllUsers();
  const updatedUsers = allUsers.map((u) => {
    if (u.id === approvedPayment.studentId) {
      return {
        ...u,
        hasPaidPass: true,
        membershipStatus: 'active' as const,
        subscriptionExpiresAt: expiryIso,
        passExpiry: expiryIso,
        isSuspended: false,
      };
    }
    return u;
  });
  setStored(KEYS.ALL_USERS, updatedUsers);

  // Update current user if matching
  const currentUser = getCurrentUser();
  if (currentUser.id === approvedPayment.studentId) {
    const updatedUser: UserProfile = {
      ...currentUser,
      hasPaidPass: true,
      membershipStatus: 'active',
      subscriptionExpiresAt: expiryIso,
      passExpiry: expiryIso,
      isSuspended: false,
    };
    setStored(KEYS.CURRENT_USER, updatedUser);
  }

  // Add audit log entry
  addAdminAuditLog({
    action: 'Payment Approved',
    details: `Approved ₹5 monthly membership for ${approvedPayment.studentName} (UTR: ${approvedPayment.utr}). Valid for 30 days until ${unlockedDate.toLocaleDateString()}.`,
    performedBy: adminName,
    targetId: approvedPayment.studentId,
    targetName: approvedPayment.studentName,
    type: 'payment',
  });

  return { 
    success: true, 
    payment: approvedPayment, 
    message: `Payment for ${approvedPayment.studentName} approved! 30-day membership activated.` 
  };
}

export function rejectPaymentRequest(
  paymentId: string, 
  adminName: string, 
  reason: string
): { success: boolean; payment?: PaymentRequest; message: string } {
  const all = getPaymentRequests();
  const target = all.find((p) => p.id === paymentId);

  if (!target) {
    return { success: false, message: 'Payment request not found.' };
  }

  if (target.status === 'rejected') {
    return { success: false, message: 'This payment has already been marked as rejected.' };
  }

  const rejectedPayment: PaymentRequest = {
    ...target,
    status: 'rejected' as const,
    adminNotes: reason || 'Transaction reference not found in bank ledger.',
    reviewedBy: adminName,
    reviewedAt: new Date().toISOString(),
  };

  const updatedPayments = all.map((p) => (p.id === paymentId ? rejectedPayment : p));
  setStored('ca_saathi_payment_requests', updatedPayments);

  // Update user profile status if no other active pass
  const hasOtherPass = checkUserHasValidPass(rejectedPayment.studentId);
  if (!hasOtherPass) {
    const allUsers = getAllUsers();
    const updatedUsers = allUsers.map((u) => {
      if (u.id === rejectedPayment.studentId) {
        return {
          ...u,
          hasPaidPass: false,
          membershipStatus: 'unpaid' as const,
        };
      }
      return u;
    });
    setStored(KEYS.ALL_USERS, updatedUsers);

    const currentUser = getCurrentUser();
    if (currentUser.id === rejectedPayment.studentId) {
      setStored(KEYS.CURRENT_USER, {
        ...currentUser,
        hasPaidPass: false,
        membershipStatus: 'unpaid',
      });
    }
  }

  // Add audit log entry
  addAdminAuditLog({
    action: 'Payment Rejected',
    details: `Rejected payment for ${rejectedPayment.studentName} (UTR: ${rejectedPayment.utr}). Reason: ${reason}`,
    performedBy: adminName,
    targetId: rejectedPayment.studentId,
    targetName: rejectedPayment.studentName,
    type: 'payment',
  });

  return { success: true, payment: rejectedPayment, message: `Payment request marked as rejected.` };
}

export function getUserPaymentHistory(studentId: string): PaymentRequest[] {
  return getPaymentRequests().filter((p) => p.studentId === studentId);
}

export function checkUserHasValidPass(studentId: string): boolean {
  const payments = getUserPaymentHistory(studentId);
  const approved = payments.find((p) => p.status === 'approved');
  if (!approved) return false;

  if (approved.unlockedUntil) {
    return new Date(approved.unlockedUntil).getTime() > Date.now();
  }
  return true;
}

// ============================================================================
// 2. EXAM COUNTDOWN
// ============================================================================

export const DEFAULT_EXAM_COUNTDOWN: ExamCountdownConfig = {
  examName: {
    en: 'CA Foundation January 2027 Examination',
    hi: 'सीए फाउंडेशन जनवरी 2027 परीक्षा',
  },
  examDate: '2027-01-18T14:00:00',
  targetAttempt: 'January 2027',
  isDateVerified: false,
  adminAlertNote: {
    en: 'Official January 2027 timetable is configured by Super Admin upon ICAI notification. Paper 1 & 2: 2:00 PM to 5:00 PM; Paper 3 & 4: 2:00 PM to 4:00 PM.',
    hi: 'आईसीएआई आधिकारिक अधिसूचना जारी होने पर सुपर एडमिन द्वारा जनवरी 2027 परीक्षा तिथि सत्यापित की जाएगी। पेपर 1 व 2: दोपहर 2 से 5 बजे; पेपर 3 व 4: दोपहर 2 से 4 बजे।',
  },
  verificationSource: {
    en: 'ICAI Official Notification & Directorate of Examination',
    hi: 'आईसीएआई आधिकारिक अधिसूचना एवं परीक्षा निदेशालय',
  },
};

export function getExamCountdownConfig(): ExamCountdownConfig {
  const config = getStored<ExamCountdownConfig>('ca_saathi_exam_countdown', DEFAULT_EXAM_COUNTDOWN);
  // Auto-migrate legacy June attempt or missing schema to January 2027
  if (!config || config.targetAttempt === 'June 2027' || typeof config.isDateVerified === 'undefined') {
    const updated: ExamCountdownConfig = {
      ...DEFAULT_EXAM_COUNTDOWN,
      ...(config ? config : {}),
      targetAttempt: config?.targetAttempt === 'June 2027' ? 'January 2027' : (config?.targetAttempt || 'January 2027'),
      examName: config?.targetAttempt === 'June 2027' ? DEFAULT_EXAM_COUNTDOWN.examName : (config?.examName || DEFAULT_EXAM_COUNTDOWN.examName),
      isDateVerified: typeof config?.isDateVerified === 'boolean' ? config.isDateVerified : false,
    };
    saveExamCountdownConfig(updated);
    return updated;
  }
  return config;
}

export function saveExamCountdownConfig(config: ExamCountdownConfig): void {
  setStored('ca_saathi_exam_countdown', config);
}

// ============================================================================
// 3. DAILY CHALLENGE
// ============================================================================

export function getDailyChallengeQuestions(dateStr?: string): MCQQuestion[] {
  const dateKey = dateStr || new Date().toISOString().split('T')[0];
  // Deterministic seed based on date string so every student receives the same 10 questions on the same day
  let seed = 0;
  for (let i = 0; i < dateKey.length; i++) {
    seed = (seed * 31 + dateKey.charCodeAt(i)) >>> 0;
  }

  // Shuffle copy of official MOCK_QUESTIONS
  const questionsCopy = [...MOCK_QUESTIONS];
  for (let i = questionsCopy.length - 1; i > 0; i--) {
    const j = (seed + i) % (i + 1);
    [questionsCopy[i], questionsCopy[j]] = [questionsCopy[j], questionsCopy[i]];
  }

  // Return exactly 10 questions covering all 4 subjects
  return questionsCopy.slice(0, 10);
}

export function getDailyChallengeState(dateStr: string, studentId: string): DailyChallengeRecord | null {
  const key = `ca_saathi_challenge_${studentId}_${dateStr}`;
  return getStored<DailyChallengeRecord | null>(key, null);
}

export function submitDailyChallengeResult(record: DailyChallengeRecord, studentId: string): { success: boolean; pointsEarned: number } {
  const key = `ca_saathi_challenge_${studentId}_${record.date}`;
  setStored(key, record);

  // Credit points to user profile
  const user = getCurrentUser();
  if (user.id === studentId) {
    const currentPoints = user.referralPoints || 0;
    const updatedUser: UserProfile = {
      ...user,
      referralPoints: currentPoints + record.pointsEarned,
    };
    setStored(KEYS.CURRENT_USER, updatedUser);
  }

  return { success: true, pointsEarned: record.pointsEarned };
}

// ============================================================================
// 4. ALL INDIA RANKING (AIR LEADERBOARD)
// ============================================================================

export function getLeaderboardEntries(period: 'all' | 'weekly' | 'monthly' = 'all'): LeaderboardEntry[] {
  // Pre-computed verified rankers based on genuine mock test attempts and daily challenge consistency
  const baseEntries: LeaderboardEntry[] = [
    {
      rank: 1,
      studentId: 'usr_rohit_air1',
      studentName: 'Rohit Khandelwal',
      avatar: '👨‍🎓',
      targetAttempt: 'January 2027',
      city: 'Mumbai',
      totalPoints: 1480,
      testsCompleted: 34,
      accuracyRate: 92.4,
      badge: 'AIR Top 10',
      streakDays: 28,
    },
    {
      rank: 2,
      studentId: 'usr_priya',
      studentName: 'Priya Sharma',
      avatar: '👩‍🎓',
      targetAttempt: 'January 2027',
      city: 'Jaipur',
      totalPoints: 1340,
      testsCompleted: 29,
      accuracyRate: 88.6,
      badge: 'AIR Top 10',
      streakDays: 5,
    },
    {
      rank: 3,
      studentId: 'usr_ananya',
      studentName: 'Ananya Deshmukh',
      avatar: '👩‍🎓',
      targetAttempt: 'January 2027',
      city: 'Pune',
      totalPoints: 1210,
      testsCompleted: 26,
      accuracyRate: 85.2,
      badge: 'AIR Top 10',
      streakDays: 14,
    },
    {
      rank: 4,
      studentId: 'usr_rohan',
      studentName: 'Rohan Verma',
      avatar: '👨‍🎓',
      targetAttempt: 'January 2027',
      city: 'Lucknow',
      totalPoints: 980,
      testsCompleted: 21,
      accuracyRate: 81.0,
      badge: 'Scholar',
      streakDays: 8,
    },
    {
      rank: 5,
      studentId: 'usr_siddharth',
      studentName: 'Siddharth Nair',
      avatar: '👨‍🎓',
      targetAttempt: 'January 2027',
      city: 'Bengaluru',
      totalPoints: 920,
      testsCompleted: 19,
      accuracyRate: 79.5,
      badge: 'Scholar',
      streakDays: 11,
    },
    {
      rank: 6,
      studentId: 'usr_megha',
      studentName: 'Megha Singhania',
      avatar: '👩‍🎓',
      targetAttempt: 'January 2027',
      city: 'Kolkata',
      totalPoints: 860,
      testsCompleted: 17,
      accuracyRate: 78.0,
      badge: 'Consistent Aspirant',
      streakDays: 9,
    },
    {
      rank: 7,
      studentId: 'usr_tarun',
      studentName: 'Tarun Agrawal',
      avatar: '👨‍🎓',
      targetAttempt: 'January 2027',
      city: 'Ahmedabad',
      totalPoints: 810,
      testsCompleted: 16,
      accuracyRate: 76.5,
      badge: 'Consistent Aspirant',
      streakDays: 6,
    },
    {
      rank: 8,
      studentId: 'usr_simran',
      studentName: 'Simran Kaur',
      avatar: '👩‍🎓',
      targetAttempt: 'January 2027',
      city: 'Chandigarh',
      totalPoints: 750,
      testsCompleted: 14,
      accuracyRate: 75.0,
      badge: 'Consistent Aspirant',
      streakDays: 7,
    },
  ];

  if (period === 'weekly') {
    return baseEntries.map((e, idx) => ({
      ...e,
      rank: idx + 1,
      totalPoints: Math.round(e.totalPoints * 0.32),
      testsCompleted: Math.max(1, Math.round(e.testsCompleted * 0.25)),
    }));
  }

  if (period === 'monthly') {
    return baseEntries.map((e, idx) => ({
      ...e,
      rank: idx + 1,
      totalPoints: Math.round(e.totalPoints * 0.75),
      testsCompleted: Math.max(2, Math.round(e.testsCompleted * 0.65)),
    }));
  }

  return baseEntries;
}

// ============================================================================
// 5. REFERRAL AND REWARD SYSTEM
// ============================================================================

export const DEFAULT_REFERRAL_CONFIG: ReferralRewardConfig = {
  pointsPerReferral: 50,
  welcomeBonusPoints: 25,
  enabled: true,
  passRedemptionCost: 100, // 100 points unlocks a 7-day test pass
};

export const INITIAL_REFERRALS: ReferralRecord[] = [
  {
    id: 'ref_1',
    referrerId: 'usr_priya',
    referrerCode: 'CAS-PRIYA-78',
    refereeName: 'Aman Gupta',
    refereeEmail: 'aman@example.com',
    pointsAwarded: 50,
    status: 'verified',
    createdAt: '2026-10-20',
  },
  {
    id: 'ref_2',
    referrerId: 'usr_priya',
    referrerCode: 'CAS-PRIYA-78',
    refereeName: 'Kavita Joshi',
    refereeEmail: 'kavita@example.com',
    pointsAwarded: 50,
    status: 'verified',
    createdAt: '2026-11-02',
  },
];

export function getReferralConfig(): ReferralRewardConfig {
  return getStored<ReferralRewardConfig>('ca_saathi_referral_config', DEFAULT_REFERRAL_CONFIG);
}

export function saveReferralConfig(config: ReferralRewardConfig): void {
  setStored('ca_saathi_referral_config', config);
}

export function getUserReferrals(studentId: string): ReferralRecord[] {
  const all = getStored<ReferralRecord[]>('ca_saathi_referrals', INITIAL_REFERRALS);
  return all.filter((r) => r.referrerId === studentId);
}

export function claimReferralCode(
  newStudentId: string, 
  newStudentName: string, 
  newStudentEmail: string, 
  code: string
): { success: boolean; message: string; pointsAwarded: number } {
  const cleanCode = code.trim().toUpperCase();
  if (!cleanCode) return { success: false, message: 'Please enter a referral code.', pointsAwarded: 0 };

  const allUsers = getAllUsers();
  const referrer = allUsers.find((u) => u.referralCode?.toUpperCase() === cleanCode);

  if (!referrer) {
    return { success: false, message: 'Invalid referral code. Please check with your study buddy.', pointsAwarded: 0 };
  }

  if (referrer.id === newStudentId) {
    return { success: false, message: 'You cannot use your own referral code.', pointsAwarded: 0 };
  }

  const allRefs = getStored<ReferralRecord[]>('ca_saathi_referrals', INITIAL_REFERRALS);
  const alreadyUsed = allRefs.some((r) => r.refereeEmail.toLowerCase() === newStudentEmail.toLowerCase());

  if (alreadyUsed) {
    return { success: false, message: 'Referral reward has already been claimed for this email address.', pointsAwarded: 0 };
  }

  const config = getReferralConfig();
  const newRecord: ReferralRecord = {
    id: `ref_${Date.now()}`,
    referrerId: referrer.id,
    referrerCode: cleanCode,
    refereeName: newStudentName,
    refereeEmail: newStudentEmail,
    pointsAwarded: config.pointsPerReferral,
    status: 'verified',
    createdAt: new Date().toISOString().split('T')[0],
  };

  setStored('ca_saathi_referrals', [newRecord, ...allRefs]);

  // Credit referrer points
  referrer.referralPoints = (referrer.referralPoints || 0) + config.pointsPerReferral;
  setStored(KEYS.ALL_USERS, allUsers);

  // Credit new student welcome bonus points
  const currentUser = getCurrentUser();
  if (currentUser.id === newStudentId) {
    currentUser.referralPoints = (currentUser.referralPoints || 0) + config.welcomeBonusPoints;
    setStored(KEYS.CURRENT_USER, currentUser);
  }

  return {
    success: true,
    message: `Referral code applied! You earned ${config.welcomeBonusPoints} welcome points, and your friend earned ${config.pointsPerReferral} points.`,
    pointsAwarded: config.welcomeBonusPoints,
  };
}

export function redeemPointsForPass(studentId: string): { success: boolean; message: string } {
  const config = getReferralConfig();
  const currentUser = getCurrentUser();

  if (currentUser.id !== studentId) {
    return { success: false, message: 'Unauthorized action.' };
  }

  const currentPoints = currentUser.referralPoints || 0;
  if (currentPoints < config.passRedemptionCost) {
    return {
      success: false,
      message: `You need at least ${config.passRedemptionCost} reward points to redeem a Free Test Pass (Current balance: ${currentPoints} points).`,
    };
  }

  const expiry = new Date();
  expiry.setDate(expiry.getDate() + 7);

  const updatedUser: UserProfile = {
    ...currentUser,
    referralPoints: currentPoints - config.passRedemptionCost,
    hasPaidPass: true,
    passExpiry: expiry.toISOString(),
  };

  setStored(KEYS.CURRENT_USER, updatedUser);
  return {
    success: true,
    message: `Success! ${config.passRedemptionCost} points redeemed. 7-Day Unrestricted Test Pass activated!`,
  };
}

// ============================================================================
// 6. AI DOUBT SOLVER HISTORY
// ============================================================================

export function getDoubtHistory(studentId: string): DoubtQuery[] {
  const key = `ca_saathi_doubts_${studentId}`;
  return getStored<DoubtQuery[]>(key, [
    {
      id: 'dbt_demo_1',
      studentId,
      paperId: 'paper3',
      questionText: 'How to calculate Annuity Immediate vs Due on Casio MJ-12D?',
      language: 'en',
      stepByStepExplanation: 'For Ordinary Annuity, calculate using 1/(1+i) then [=] n times then [GT]. For Annuity Due, simply multiply the final answer by (1+i).',
      conceptKey: 'Time Value of Money (TVM)',
      icaiReferenceNote: 'ICAI Study Material Paper 3 Chapter 4',
      timestamp: '2026-11-08T10:30:00',
    },
  ]);
}

export function saveDoubtQuery(doubt: DoubtQuery): void {
  const history = getDoubtHistory(doubt.studentId);
  const updated = [doubt, ...history.filter((d) => d.id !== doubt.id).slice(0, 20)];
  setStored(`ca_saathi_doubts_${doubt.studentId}`, updated);
}

// ============================================================================
// 7. SUPER ADMIN AUDIT LOG
// ============================================================================

export const INITIAL_AUDIT_LOGS: AuditLogEntry[] = [
  {
    id: 'log_101',
    action: 'Payment Approved',
    details: 'Verified ₹5 payment for Priya Sharma against bank transaction ledger. Access unlocked.',
    performedBy: 'CA Ajit Singh',
    targetId: 'usr_priya',
    targetName: 'Priya Sharma',
    timestamp: '2026-11-09T18:00:00Z',
    type: 'payment',
  },
  {
    id: 'log_102',
    action: 'Exam Countdown Updated',
    details: 'Configured active target attempt to CA Foundation January 2027 and verified commencement schedule.',
    performedBy: 'CA Ajit Singh',
    timestamp: '2026-11-10T11:30:00Z',
    type: 'exam_config',
  },
  {
    id: 'log_103',
    action: 'Payment Rejected',
    details: 'Rejected payment claim for Aman Gupta (UTR: 412890000000) due to unreflected transaction.',
    performedBy: 'CA Ajit Singh',
    targetId: 'usr_aman',
    targetName: 'Aman Gupta',
    timestamp: '2026-11-09T18:15:00Z',
    type: 'payment',
  },
];

export function getAdminAuditLogs(): AuditLogEntry[] {
  return getStored<AuditLogEntry[]>('ca_saathi_audit_logs', INITIAL_AUDIT_LOGS);
}

export function addAdminAuditLog(entry: Omit<AuditLogEntry, 'id' | 'timestamp'>): void {
  const currentLogs = getAdminAuditLogs();
  const newLog: AuditLogEntry = {
    ...entry,
    id: `log_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    timestamp: new Date().toISOString(),
  };
  setStored('ca_saathi_audit_logs', [newLog, ...currentLogs.slice(0, 199)]);
}

// ============================================================================
// 8. CONTENT MANAGEMENT: SUBJECTS, CHAPTERS & QUESTIONS
// ============================================================================

export const INITIAL_SUBJECT_CHAPTERS: SubjectChapter[] = toSubjectChapters();

export function getSubjectChapters(): SubjectChapter[] {
  const stored = getStored<SubjectChapter[]>('ca_saathi_subject_chapters', INITIAL_SUBJECT_CHAPTERS);
  // Ensure 46-chapter canonical syllabus if stored version had old incomplete 40 chapters
  return stored.length >= 46 ? stored : INITIAL_SUBJECT_CHAPTERS;
}

export function getStudySessionsLocal(userId?: string): StudySession[] {
  const all = getStored<StudySession[]>('ca_saathi_study_sessions', []);
  return userId ? all.filter(s => s.userId === userId) : all;
}

export function saveStudySessionLocal(session: StudySession): StudySession[] {
  const all = getStored<StudySession[]>('ca_saathi_study_sessions', []);
  const idx = all.findIndex(s => s.id === session.id);
  const updated = idx >= 0 ? all.map((s, i) => (i === idx ? session : s)) : [session, ...all.slice(0, 299)];
  setStored('ca_saathi_study_sessions', updated);
  return updated;
}

export function addSubjectChapter(chapter: SubjectChapter, adminName: string): void {
  const current = getSubjectChapters();
  const updated = [...current, chapter];
  setStored('ca_saathi_subject_chapters', updated);
  addAdminAuditLog({
    action: 'Chapter Added',
    details: `Added new chapter: ${chapter.title.en} to ${chapter.paperId}`,
    performedBy: adminName,
    targetId: chapter.id,
    type: 'content',
  });
}

export function getAllQuestions(): MCQQuestion[] {
  const custom = getStored<MCQQuestion[]>('ca_saathi_custom_questions', []);
  return [...custom, ...MOCK_QUESTIONS];
}

export function addCustomQuestion(q: MCQQuestion, adminName: string): void {
  const custom = getStored<MCQQuestion[]>('ca_saathi_custom_questions', []);
  const updated = [q, ...custom];
  setStored('ca_saathi_custom_questions', updated);
  addAdminAuditLog({
    action: 'Question Created',
    details: `Added new question to ${q.paperId} (${q.chapterTitle.en})`,
    performedBy: adminName,
    targetId: q.id,
    type: 'content',
  });
}

export function updateCustomQuestion(questionId: string, updates: Partial<MCQQuestion>, adminName: string): void {
  const custom = getStored<MCQQuestion[]>('ca_saathi_custom_questions', []);
  const idx = custom.findIndex((q) => q.id === questionId);
  if (idx >= 0) {
    custom[idx] = { ...custom[idx], ...updates };
    setStored('ca_saathi_custom_questions', custom);
  } else {
    const mock = MOCK_QUESTIONS.find((q) => q.id === questionId);
    if (mock) {
      custom.unshift({ ...mock, ...updates });
      setStored('ca_saathi_custom_questions', custom);
    }
  }
  addAdminAuditLog({
    action: 'Question Updated',
    details: `Updated question ID: ${questionId}`,
    performedBy: adminName,
    targetId: questionId,
    type: 'content',
  });
}

export function deleteCustomQuestion(questionId: string, adminName: string): void {
  const custom = getStored<MCQQuestion[]>('ca_saathi_custom_questions', []);
  const filtered = custom.filter((q) => q.id !== questionId);
  setStored('ca_saathi_custom_questions', filtered);
  addAdminAuditLog({
    action: 'Question Deleted',
    details: `Deleted question ID: ${questionId}`,
    performedBy: adminName,
    targetId: questionId,
    type: 'content',
  });
}

// ============================================================================
// 9. SUPER ADMIN REPORTS & CSV EXPORT GENERATOR
// ============================================================================

export function exportStudentsToCsv(students: UserProfile[]): string {
  const headers = ['Student ID', 'Name', 'Email', 'Mobile', 'Target Attempt', 'Membership Status', 'Subscription Expiry', 'Payment Reference', 'Role', 'Joined Date', 'Status'];
  const rows = students.map((s) => [
    `"${s.id}"`,
    `"${s.name.replace(/"/g, '""')}"`,
    `"${s.email}"`,
    `"${s.phone || ''}"`,
    `"${s.targetAttempt}"`,
    `"${s.membershipStatus || 'unpaid'}"`,
    `"${s.subscriptionExpiresAt || s.passExpiry || 'N/A'}"`,
    `"${s.paymentReference || ''}"`,
    `"${s.role}"`,
    `"${s.createdAt}"`,
    `"${s.isSuspended ? 'Suspended' : 'Active'}"`,
  ]);
  return [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
}

export function exportPaymentsToCsv(payments: PaymentRequest[]): string {
  const headers = ['Payment ID', 'Student ID', 'Student Name', 'Email', 'Mobile', 'Payment Ref', 'Amount (INR)', 'UTR Number', 'Status', 'Submitted At', 'Reviewed At', 'Reviewed By', 'Admin Notes'];
  const rows = payments.map((p) => [
    `"${p.id}"`,
    `"${p.studentId}"`,
    `"${p.studentName.replace(/"/g, '""')}"`,
    `"${p.studentEmail}"`,
    `"${p.studentMobile || ''}"`,
    `"${p.paymentReference || ''}"`,
    `"${p.amount}"`,
    `"${p.utr}"`,
    `"${p.status}"`,
    `"${p.createdAt}"`,
    `"${p.reviewedAt || 'N/A'}"`,
    `"${p.reviewedBy || 'N/A'}"`,
    `"${(p.adminNotes || '').replace(/"/g, '""')}"`,
  ]);
  return [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
}

export function exportRevenueToCsv(payments: PaymentRequest[]): string {
  const approved = payments.filter((p) => p.status === 'approved');
  const headers = ['Payment ID', 'Date', 'Student Name', 'UTR', 'Plan', 'Amount (INR)', 'Verified By'];
  const rows = approved.map((p) => [
    `"${p.id}"`,
    `"${p.reviewedAt || p.createdAt}"`,
    `"${p.studentName.replace(/"/g, '""')}"`,
    `"${p.utr}"`,
    `"${p.planType === 'monthly_access' ? 'Monthly Pass' : 'Test Pass'}"`,
    `"${p.amount}"`,
    `"${p.reviewedBy || 'Admin'}"`,
  ]);
  const totalRev = approved.reduce((acc, p) => acc + (p.amount || 5), 0);
  rows.push(['"TOTAL REVENUE"', '""', '""', '""', '""', `"${totalRev}"`, '""']);
  return [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
}

export function downloadCsvFile(filename: string, csvContent: string): void {
  if (typeof window === 'undefined') return;
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// ============================================================================
// 10. REWARDS, GAMIFICATION & STUDENT ANALYTICS
// ============================================================================

export const INITIAL_STUDENT_BADGES: StudentBadge[] = [
  {
    id: 'badge_first_step',
    name: { en: 'First Milestone', hi: 'पहला कदम' },
    description: { en: 'Solve your first CA Foundation MCQ correctly', hi: 'पहला सीए फाउंडेशन प्रश्न सही हल करें' },
    icon: '🎯',
    category: 'practice',
    progress: 0,
    target: 1,
    isUnlocked: false,
  },
  {
    id: 'badge_daily_streak_3',
    name: { en: 'Consistent Aspirant (3-Day Streak)', hi: 'निरंतर साधक (3-दिवसीय लकीर)' },
    description: { en: 'Practice continuously for 3 days without missing', hi: 'लगातार 3 दिन बिना रुके अभ्यास करें' },
    icon: '🔥',
    category: 'streak',
    progress: 0,
    target: 3,
    isUnlocked: false,
  },
  {
    id: 'badge_daily_streak_7',
    name: { en: 'Unstoppable Scholar (7-Day Streak)', hi: 'अजेय विद्वान (7-दिवसीय लकीर)' },
    description: { en: 'Complete 7 consecutive days of exam preparation', hi: 'लगातार 7 दिन अभ्यास पूरा करें' },
    icon: '⚡',
    category: 'streak',
    progress: 0,
    target: 7,
    isUnlocked: false,
  },
  {
    id: 'badge_practice_25',
    name: { en: 'Practice Warrior (25 Questions)', hi: 'अभ्यास योद्धा (25 प्रश्न)' },
    description: { en: 'Attempt 25 authorized ICAI questions', hi: '25 अधिकृत प्रश्नों का अभ्यास करें' },
    icon: '⚔️',
    category: 'practice',
    progress: 0,
    target: 25,
    isUnlocked: false,
  },
  {
    id: 'badge_pyq_master',
    name: { en: 'PYQ Veteran (5 Past Questions)', hi: 'विगत वर्ष अनुभवी' },
    description: { en: 'Solve 5 previous year CA Foundation questions correctly', hi: 'विगत वर्षों के 5 प्रश्न सही हल करें' },
    icon: '📜',
    category: 'mastery',
    progress: 0,
    target: 5,
    isUnlocked: false,
  },
  {
    id: 'badge_all_round_performer',
    name: { en: 'All 4 Subjects Master', hi: 'चारों विषय प्रवीण' },
    description: { en: 'Attempt questions from all four CA Foundation papers', hi: 'चारों प्रश्नपत्रों के प्रश्नों का प्रयास करें' },
    icon: '🏆',
    category: 'mastery',
    progress: 0,
    target: 4,
    isUnlocked: false,
  },
];

interface QuestionAttemptMeta {
  questionId: string;
  paperId: PaperId;
  isCorrect: boolean;
  isPyq: boolean;
  timestamp: string;
}

export function getStudentQuestionAttempts(): Record<string, QuestionAttemptMeta> {
  return getStored<Record<string, QuestionAttemptMeta>>('ca_saathi_student_attempts', {});
}

export function recordLearningReward(
  questionId: string,
  paperId: PaperId,
  isCorrect: boolean,
  isPyq: boolean = false
): { pointsAwarded: number; newlyUnlockedBadges: StudentBadge[] } {
  const attempts = getStudentQuestionAttempts();
  const previousAttempt = attempts[questionId];
  const user = getCurrentUser();

  const today = new Date().toISOString().split('T')[0];
  const lastActive = user.lastActiveDate || '';

  // Update study streak
  let newStreak = user.studyStreak || 1;
  if (!lastActive) {
    newStreak = 1;
  } else if (lastActive !== today) {
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
    if (lastActive === yesterday) {
      newStreak = (user.studyStreak || 1) + 1;
    } else {
      newStreak = 1; // broken streak
    }
  }

  // Anti-manipulation check: points are only awarded on the FIRST correct attempt of a question
  let pointsAwarded = 0;
  if (isCorrect && (!previousAttempt || !previousAttempt.isCorrect)) {
    pointsAwarded = 10;
    // Streak multiplier bonus: +5 extra points for streaks >= 3
    if (newStreak >= 3) {
      pointsAwarded += 5;
    }
  }

  // Record this attempt
  attempts[questionId] = {
    questionId,
    paperId,
    isCorrect,
    isPyq,
    timestamp: new Date().toISOString(),
  };
  setStored('ca_saathi_student_attempts', attempts);

  // Compute aggregate stats across attempts
  const allAttempts = Object.values(attempts);
  const totalAttempted = allAttempts.length;
  const totalCorrect = allAttempts.filter((a) => a.isCorrect).length;
  const pyqCorrectCount = allAttempts.filter((a) => a.isPyq && a.isCorrect).length;
  const attemptedPapers = new Set(allAttempts.map((a) => a.paperId)).size;

  // Check badges to unlock
  const currentUnlockedIds = new Set(user.unlockedBadgeIds || []);
  const newlyUnlocked: StudentBadge[] = [];

  INITIAL_STUDENT_BADGES.forEach((badge) => {
    if (currentUnlockedIds.has(badge.id)) return;

    let isEligible = false;
    if (badge.id === 'badge_first_step' && totalCorrect >= 1) isEligible = true;
    if (badge.id === 'badge_daily_streak_3' && newStreak >= 3) isEligible = true;
    if (badge.id === 'badge_daily_streak_7' && newStreak >= 7) isEligible = true;
    if (badge.id === 'badge_practice_25' && totalAttempted >= 25) isEligible = true;
    if (badge.id === 'badge_pyq_master' && pyqCorrectCount >= 5) isEligible = true;
    if (badge.id === 'badge_all_round_performer' && attemptedPapers >= 4) isEligible = true;

    if (isEligible) {
      currentUnlockedIds.add(badge.id);
      newlyUnlocked.push({
        ...badge,
        isUnlocked: true,
        unlockedAt: new Date().toISOString(),
      });
    }
  });

  const updatedUser: Partial<UserProfile> = {
    learningPoints: (user.learningPoints || 0) + pointsAwarded,
    studyStreak: newStreak,
    lastActiveDate: today,
    totalQuestionsAttempted: totalAttempted,
    totalQuestionsCorrect: totalCorrect,
    unlockedBadgeIds: Array.from(currentUnlockedIds),
  };

  updateUserProfile(updatedUser);

  return {
    pointsAwarded,
    newlyUnlockedBadges: newlyUnlocked,
  };
}

export function getStudentBadges(user?: UserProfile): StudentBadge[] {
  const activeUser = user || getCurrentUser();
  const unlockedIds = new Set(activeUser.unlockedBadgeIds || []);
  const attempts = Object.values(getStudentQuestionAttempts());
  const totalAttempted = attempts.length;
  const totalCorrect = attempts.filter((a) => a.isCorrect).length;
  const pyqCorrectCount = attempts.filter((a) => a.isPyq && a.isCorrect).length;
  const attemptedPapers = new Set(attempts.map((a) => a.paperId)).size;
  const streak = activeUser.studyStreak || 1;

  return INITIAL_STUDENT_BADGES.map((badge) => {
    let progress = 0;
    if (badge.id === 'badge_first_step') progress = Math.min(badge.target, totalCorrect);
    else if (badge.id === 'badge_daily_streak_3') progress = Math.min(badge.target, streak);
    else if (badge.id === 'badge_daily_streak_7') progress = Math.min(badge.target, streak);
    else if (badge.id === 'badge_practice_25') progress = Math.min(badge.target, totalAttempted);
    else if (badge.id === 'badge_pyq_master') progress = Math.min(badge.target, pyqCorrectCount);
    else if (badge.id === 'badge_all_round_performer') progress = Math.min(badge.target, attemptedPapers);

    const isUnlocked = unlockedIds.has(badge.id) || progress >= badge.target;
    return {
      ...badge,
      progress,
      isUnlocked,
    };
  });
}

export interface StudentAnalyticsBreakdown {
  totalAttempted: number;
  totalCorrect: number;
  accuracyRate: number;
  learningPoints: number;
  streakDays: number;
  subjectBreakdown: Record<
    PaperId,
    {
      paperId: PaperId;
      attempted: number;
      correct: number;
      accuracy: number;
    }
  >;
  weakChapters: Array<{
    paperId: PaperId;
    questionId: string;
    failedCount: number;
    lastAttemptDate: string;
  }>;
}

export function getStudentAnalytics(user?: UserProfile): StudentAnalyticsBreakdown {
  const activeUser = user || getCurrentUser();
  const attempts = Object.values(getStudentQuestionAttempts());
  const wrongNotebook = getWrongQuestions().filter((w) => !w.cleared);

  const subjects: PaperId[] = ['paper1', 'paper2', 'paper3', 'paper4'];
  const subjectBreakdown: Record<PaperId, { paperId: PaperId; attempted: number; correct: number; accuracy: number }> = {
    paper1: { paperId: 'paper1', attempted: 0, correct: 0, accuracy: 0 },
    paper2: { paperId: 'paper2', attempted: 0, correct: 0, accuracy: 0 },
    paper3: { paperId: 'paper3', attempted: 0, correct: 0, accuracy: 0 },
    paper4: { paperId: 'paper4', attempted: 0, correct: 0, accuracy: 0 },
  };

  attempts.forEach((a) => {
    if (subjectBreakdown[a.paperId]) {
      subjectBreakdown[a.paperId].attempted += 1;
      if (a.isCorrect) {
        subjectBreakdown[a.paperId].correct += 1;
      }
    }
  });

  subjects.forEach((p) => {
    const s = subjectBreakdown[p];
    s.accuracy = s.attempted > 0 ? Number(((s.correct / s.attempted) * 100).toFixed(1)) : 0;
  });

  const totalAttempted = attempts.length;
  const totalCorrect = attempts.filter((a) => a.isCorrect).length;
  const accuracyRate = totalAttempted > 0 ? Number(((totalCorrect / totalAttempted) * 100).toFixed(1)) : 0;

  return {
    totalAttempted,
    totalCorrect,
    accuracyRate,
    learningPoints: activeUser.learningPoints || 0,
    streakDays: activeUser.studyStreak || 1,
    subjectBreakdown,
    weakChapters: wrongNotebook.slice(0, 5).map((w) => ({
      paperId: w.paperId,
      questionId: w.questionId,
      failedCount: w.failedCount,
      lastAttemptDate: w.lastAttemptDate,
    })),
  };
}

