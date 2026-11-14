export type Language = 'en' | 'hi';

export type NavTab = 
  | 'home' 
  | 'planner' 
  | 'practice' 
  | 'mocks' 
  | 'notes' 
  | 'progress' 
  | 'updates'
  | 'community'
  | 'doubtSolver'
  | 'dailyChallenge'
  | 'leaderboard'
  | 'payment'
  | 'admin';

export type PaperId = 'paper1' | 'paper2' | 'paper3' | 'paper4';

export type QuestionSourceType = 'ICAI_MODULE' | 'PYQ' | 'PRACTICE';

export interface BilingualText {
  en: string;
  hi: string;
}

export interface PaperInfo {
  id: PaperId;
  paperNumber: number;
  name: BilingualText;
  code: string;
  totalMarks: number;
  passingMarks: number;
  type: BilingualText; // Subjective / Objective
  color: string;
  iconName: string;
  chaptersCount: number;
  progressPercent: number;
}

export interface MCQQuestion {
  id: string;
  paperId: PaperId;
  chapterId: string;
  chapterTitle: BilingualText;
  difficulty: 'easy' | 'medium' | 'hard';
  question: BilingualText;
  options: {
    en: string[];
    hi: string[];
  };
  correctIndex: number;
  explanation: BilingualText;
  keyRule: BilingualText;

  // Strict Source Tracking
  sourceType: QuestionSourceType; // 'ICAI_MODULE' | 'PYQ'
  sourceLabel: BilingualText;     // Official citation label
  examAttempt: string;            // e.g. "June 2024", "Dec 2023", "June 2023", "Dec 2022", "Nov 2020", "Module Edition 2024-25"
  examYear?: number;              // e.g. 2024, 2023, 2022
  officialQuestionRef: string;    // e.g. "ICAI-MOD-P3-CH4-TYK12"
  officialSourceLink: string;     // Official ICAI BoS URL
}

export interface WrongQuestionEntry {
  questionId: string;
  paperId: PaperId;
  failedCount: number;
  lastAttemptDate: string;
  lastSelectedOption: number;
  cleared: boolean;
  notes?: string;
}

export interface RevisionReminder {
  id: string;
  paperId: PaperId;
  chapterTitle: BilingualText;
  intervalDays: number; // 3, 7, 14 days spaced repetition
  dueDate: string;
  completed: boolean;
}

export interface StudyTask {
  id: string;
  title: BilingualText;
  paperId: PaperId;
  chapter: BilingualText;
  durationMinutes: number;
  completed: boolean;
  date: string; // YYYY-MM-DD
  priority: 'high' | 'medium' | 'low';
  examAttempt?: ExamAttemptId;
}

export type ExamAttemptId = 'January 2027' | 'May 2027';

export type MaterialCategory =
  | 'Chapter-wise Notes'
  | 'Handwritten Notes'
  | 'Practice Material'
  | 'Important Questions'
  | 'Previous Year Questions'
  | 'Mock Tests';

export type MaterialApprovalStatus = 'pending' | 'approved' | 'rejected';

export type MaterialAttemptScope = ExamAttemptId | 'Both';

export interface StudyPdfMaterial {
  id: string;
  title: string;
  description: string;
  paperId: PaperId;
  chapterId: string;
  chapterNumber: number;
  chapterTitle: string;
  attempt: MaterialAttemptScope;
  category: MaterialCategory;
  fileName: string;
  storageFileName: string;
  fileUrl: string;
  fileSizeBytes: number;
  mimeType: 'application/pdf';
  uploaderId: string;
  uploaderName: string;
  uploaderEmail?: string;
  uploaderRole: 'admin' | 'student';
  status: MaterialApprovalStatus;
  rejectionReason?: string;
  reviewedBy?: string;
  reviewedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface StudyNote {
  id: string;
  paperId: PaperId;
  chapterTitle: BilingualText;
  topicTitle: BilingualText;
  readTimeMinutes: number;
  tags: string[];
  applicableAttempts?: ExamAttemptId[];
  summary: BilingualText;
  keyPoints: BilingualText[];
  formulasOrRules?: Array<{
    title: BilingualText;
    detail: BilingualText;
  }>;
  mnemonic?: {
    word: string;
    meaning: BilingualText;
  };
}

export interface MockTest {
  id: string;
  title: BilingualText;
  paperId: PaperId;
  durationMinutes: number;
  questions: MCQQuestion[];
  instructions: BilingualText;
  isPremium?: boolean;
  applicableAttempts?: ExamAttemptId[];
}

export interface ExamUpdate {
  id: string;
  date: string;
  category: 'Exam Date' | 'Admit Card' | 'Guidance' | 'Syllabus' | 'Results';
  title: BilingualText;
  summary: BilingualText;
  detailedContent: BilingualText;
  isImportant?: boolean;
  applicableAttempts?: ExamAttemptId[];
}

export interface TestAttemptResult {
  testId: string;
  testTitle: BilingualText;
  date: string;
  paperId: PaperId;
  totalQuestions: number;
  attempted: number;
  correct: number;
  incorrect: number;
  unattempted: number;
  score: number;
  percentage: number;
  timeSpentSeconds: number;
  userAnswers: Record<string, number>; // questionId -> selectedOption
  examAttempt?: ExamAttemptId;
}

// ============================================================================
// STUDENT COMMUNITY & AUTHENTICATION
// ============================================================================

export type UserRole = 'student' | 'moderator' | 'admin';

export type MembershipStatus = 'active' | 'pending' | 'expired' | 'unpaid';

export interface UserProfile {
  id: string;
  name: string;
  displayName?: string;
  email: string;
  role: UserRole;
  targetAttempt: string; // e.g. "January 2027" or "May 2027"
  targetYear: number;
  city?: string;
  phone?: string; // STRICT PRIVACY: NEVER publicly displayed
  bio?: string;
  avatar: string;
  joinedGroupIds: string[];
  bookmarkedPostIds: string[];
  blockedUserIds: string[];
  privacyHideCity: boolean;
  privacyHideAttempt: boolean;
  createdAt: string;
  referralCode?: string;
  referralPoints?: number;
  hasPaidPass?: boolean;
  passExpiry?: string;
  membershipStatus?: MembershipStatus;
  subscriptionExpiresAt?: string;
  paymentReference?: string; // Unique student payment identifier e.g. CAS-2027-XXXX
  isSuspended?: boolean;
  suspensionReason?: string;
  // Gamification & Learning Performance
  learningPoints?: number;
  unlockedBadgeIds?: string[];
  studyStreak?: number;
  lastActiveDate?: string;
  totalQuestionsAttempted?: number;
  totalQuestionsCorrect?: number;
  dailyGoalMinutes?: number;
  studyMinutesTotal?: number;
  canUploadNotes?: boolean;
}

export interface StudySession {
  id: string;
  userId: string;
  date: string; // YYYY-MM-DD
  paperId?: PaperId;
  chapterId?: string;
  examAttempt?: ExamAttemptId;
  activityType: 'practice' | 'mock' | 'notes' | 'planner' | 'doubtSolver' | 'dailyChallenge' | 'general';
  durationMinutes: number;
  questionsAttempted?: number;
  questionsCorrect?: number;
  startedAt: string;
  endedAt: string;
}

export interface StudyPresence {
  userId: string;
  displayName: string;
  avatar: string;
  targetAttempt: string;
  activePaperId?: PaperId;
  activeTopic?: string;
  isStudying: boolean;
  sessionStartedAt: string;
  lastHeartbeatAt: string;
}

export interface AppNotification {
  id: string;
  recipientId: string; // 'admin', 'all', or studentId
  title: string;
  message: string;
  type:
    | 'payment_submitted'
    | 'payment_approved'
    | 'payment_rejected'
    | 'exam_update'
    | 'study_reminder'
    | 'broadcast'
    | 'announcement'
    | 'note_submitted'
    | 'note_approved'
    | 'note_rejected'
    | 'upload_permission';
  read: boolean;
  relatedId?: string;
  createdAt: string;
}

export type OwnerDashboardSection =
  | 'overview'
  | 'payments'
  | 'students'
  | 'live_activity'
  | 'content'
  | 'notes_management'
  | 'groups'
  | 'notifications'
  | 'analytics';

export interface StudentProgressSnapshot {
  studySessions: StudySession[];
  testResults: TestAttemptResult[];
  chapterProgress: Record<string, 'pending' | 'revising' | 'mastered'>;
}

export interface AnalyticsEvent {
  id: string;
  userId?: string;
  visitorId: string;
  eventType: 'visit' | 'login' | 'signup' | 'study_session' | 'payment_submit';
  date: string; // YYYY-MM-DD
  createdAt: string;
}

export interface StudentBadge {
  id: string;
  name: BilingualText;
  description: BilingualText;
  icon: string;
  category: 'practice' | 'streak' | 'accuracy' | 'mastery';
  progress: number;
  target: number;
  isUnlocked: boolean;
  unlockedAt?: string;
}

export interface AuditLogEntry {
  id: string;
  action: string;
  details: string;
  performedBy: string;
  targetId?: string;
  targetName?: string;
  timestamp: string;
  type: 'payment' | 'user' | 'content' | 'notes' | 'moderation' | 'exam_config';
}

export interface SyllabusTopicDetail {
  id: string;
  title: BilingualText;
  subtopics: BilingualText[];
}

export interface SubjectChapter {
  id: string;
  paperId: PaperId;
  chapterNumber: number;
  title: BilingualText;
  description?: BilingualText;
  questionCount?: number;
  section?: string;
  weightageMarks?: string;
  topics?: SyllabusTopicDetail[];
}

export interface CommunityGroup {
  id: string;
  name: BilingualText;
  category: 'subject' | 'attempt' | 'doubt' | 'general';
  paperId?: PaperId;
  attemptLabel?: string;
  description: BilingualText;
  iconName: string;
  memberCount: number;
  activeDiscussionsCount: number;
}

export interface CommunityReply {
  id: string;
  postId: string;
  authorId: string;
  authorName: string;
  authorRole: UserRole;
  authorAvatar: string;
  createdAt: string;
  content: string;
  likes: number;
  likedBy: string[];
  isAcceptedSolution?: boolean;
}

export interface CommunityPost {
  id: string;
  groupId: string;
  authorId: string;
  authorName: string;
  authorRole: UserRole;
  authorAvatar: string;
  createdAt: string;
  title: string;
  content: string;
  paperId?: PaperId;
  chapterName?: string;
  tags: string[];
  likes: number;
  likedBy: string[];
  isPinned?: boolean;
  isResolved?: boolean;
  replies: CommunityReply[];
}

export interface StudyPartner {
  id: string;
  studentName: string;
  targetAttempt: string;
  strongSubject: PaperId;
  weakSubject: PaperId;
  studyHoursPerDay: number;
  preferredTime: 'Morning (सुबह)' | 'Afternoon (दोपहर)' | 'Night (रात)';
  bio: string;
  city: string;
  connected: boolean;
}

export interface ModerationReport {
  id: string;
  targetType: 'post' | 'reply' | 'user';
  targetId: string;
  targetTitle: string;
  reportedBy: string;
  reason: string;
  details: string;
  status: 'pending' | 'resolved' | 'dismissed';
  createdAt: string;
}

export type ThemeMode = 'light' | 'dark';

export interface PricingConfig {
  freeTierActive: boolean;
  nominalFeeEnabled: boolean;
  testPassPriceInRupees: number;
  monthlyAccessPriceInRupees: number;
  freeMockTestsLimit: number;
  currency: string;
  announcementNote: BilingualText;
  paymentGatewayActive: boolean;
}

// ============================================================================
// 1. QR CODE PAYMENT & SECURITY SYSTEM
// ============================================================================

export type PaymentStatus = 'pending' | 'approved' | 'rejected';
export type PlanType = 'test_pass' | 'monthly_access';

export interface PaymentRequest {
  id: string;
  studentId: string;
  studentName: string;
  studentEmail: string;
  studentMobile: string; // Student registered mobile number
  paymentReference?: string; // e.g. CAS-2027-1001
  amount: number;
  planType: PlanType;
  utr: string; // 12-digit UPI transaction reference
  screenshotUrl: string; // data URL or image path
  status: PaymentStatus;
  adminNotes?: string;
  reviewedBy?: string;
  reviewedAt?: string;
  createdAt: string;
  unlockedUntil?: string;
}

export interface UpiConfig {
  upiId: string; // e.g. ajeet345@ptyes
  payeeName: string; // e.g. Ajeet Patel
  qrCodeImageUrl?: string; // custom uploaded QR image
  defaultAmount: number;
  monthlyAmount: number;
  instructions: BilingualText;
}

// ============================================================================
// 2. AI DOUBT SOLVER
// ============================================================================

export interface DoubtQuery {
  id: string;
  studentId: string;
  paperId: PaperId;
  questionText: string;
  imageUrl?: string;
  language: 'en' | 'hi' | 'hinglish';
  stepByStepExplanation: string;
  conceptKey: string;
  icaiReferenceNote: string;
  timestamp: string;
}

export interface AIChatMessage {
  id: string;
  userId: string;
  role: 'user' | 'model';
  content: string;
  paperId: PaperId | 'all';
  language: 'en' | 'hi' | 'hinglish';
  imageUrl?: string;
  createdAt: string;
}

// ============================================================================
// 3. DAILY CHALLENGE
// ============================================================================

export interface DailyChallengeRecord {
  date: string; // YYYY-MM-DD
  paperId: PaperId;
  completed: boolean;
  score: number;
  totalQuestions: number;
  pointsEarned: number;
  accuracy: number;
  completedAt?: string;
  userAnswers: Record<string, number>;
}

// ============================================================================
// 4. EXAM COUNTDOWN
// ============================================================================

export interface ExamCountdownConfig {
  examName: BilingualText;
  examDate: string; // ISO string e.g. "2027-01-18T14:00:00"
  targetAttempt: string; // e.g. "January 2027"
  adminAlertNote: BilingualText;
  isDateVerified: boolean;
  verificationSource?: BilingualText;
}

// ============================================================================
// 5. ALL INDIA RANKING (AIR LEADERBOARD)
// ============================================================================

export interface LeaderboardEntry {
  rank: number;
  studentId: string;
  studentName: string;
  avatar: string;
  targetAttempt: string;
  city: string;
  totalPoints: number;
  testsCompleted: number;
  accuracyRate: number;
  badge: 'AIR Top 10' | 'AIR Top 50' | 'Scholar' | 'Consistent Aspirant';
  streakDays: number;
}

// ============================================================================
// 6. REFERRAL AND REWARD SYSTEM
// ============================================================================

export interface ReferralRewardConfig {
  pointsPerReferral: number;
  welcomeBonusPoints: number;
  enabled: boolean;
  passRedemptionCost: number; // e.g. 100 points = 1 free test pass
}

export interface ReferralRecord {
  id: string;
  referrerId: string;
  referrerCode: string;
  refereeName: string;
  refereeEmail: string;
  pointsAwarded: number;
  status: 'verified' | 'pending';
  createdAt: string;
}
