import React, { useState, useEffect, useMemo } from 'react';
import {
  Language,
  UserProfile,
  ModerationReport,
  CommunityPost,
  ExamUpdate,
  MCQQuestion,
  PricingConfig,
  PaymentRequest,
  UpiConfig,
  ExamCountdownConfig,
  ReferralRewardConfig,
  SubjectChapter,
  AuditLogEntry,
  PaperId,
  StudyPresence,
  AnalyticsEvent,
  AppNotification,
} from '../types';
import { CANONICAL_SYLLABUS, toSubjectChapters } from '../data/syllabusData';
import { COMMON_GROUP_ID } from '../data/communityData';
import { canUserAccessAdmin } from '../utils/membershipRules';
import {
  getAllUsers,
  toggleSuspendStudent,
  extendStudentMembership,
  setStudentMembershipExpiry,
  getStudentMembershipStatus,
  getPaymentRequests,
  approvePaymentRequest,
  rejectPaymentRequest,
  getUpiConfig,
  saveUpiConfig,
  getExamCountdownConfig,
  saveExamCountdownConfig,
  getReferralConfig,
  saveReferralConfig,
  getModerationReports,
  resolveReport,
  getPosts,
  deletePost,
  togglePinPost,
  getAdminAuditLogs,
  getSubjectChapters,
  addSubjectChapter,
  getAllQuestions,
  addCustomQuestion,
  deleteCustomQuestion,
  exportStudentsToCsv,
  exportPaymentsToCsv,
  exportRevenueToCsv,
  downloadCsvFile,
} from '../utils/storageDb';
import {
  resolveModerationReportInDb,
  deletePostFromDb,
  togglePinPostInDb,
  saveExamConfigToDb,
  subscribeToExamConfig,
  saveUpiConfigToDb,
  subscribeToUpiConfig,
  subscribeToModerationReports,
  subscribeToAllStudents,
  subscribeToAllPaymentRequests,
  subscribeToStudyPresence,
  subscribeToAnalyticsEvents,
  subscribeToAuditLogs,
  subscribeToNotifications,
  subscribeToSubjectChapters,
  subscribeToCustomQuestions,
  subscribeToCommunityPosts,
  approvePaymentRequestInDb,
  rejectPaymentRequestInDb,
  updateStudentStatusByAdmin,
  saveSubjectChapterToDb,
  saveCustomQuestionToDb,
  markNotificationReadInDb,
} from '../firebase/services';
import { playChimeSound } from '../utils/audio';
import {
  ShieldCheck,
  ShieldAlert,
  Users,
  MessageSquare,
  Check,
  X,
  Trash2,
  Pin,
  Plus,
  AlertTriangle,
  QrCode,
  Calendar,
  Gift,
  CheckCircle2,
  XCircle,
  Eye,
  UploadCloud,
  Download,
  Search,
  Filter,
  UserX,
  UserCheck,
  BookOpen,
  BarChart3,
  FileSpreadsheet,
  Copy,
  Sliders,
  Bell,
  Radio,
  Activity,
} from 'lucide-react';

interface AdminPanelViewProps {
  language: Language;
  currentUser: UserProfile;
  setCurrentUser: (user: UserProfile) => void;
  examUpdates: ExamUpdate[];
  setExamUpdates: React.Dispatch<React.SetStateAction<ExamUpdate[]>>;
  pricingConfig: PricingConfig;
  setPricingConfig: React.Dispatch<React.SetStateAction<PricingConfig>>;
  countdownConfig?: ExamCountdownConfig;
  setCountdownConfig?: React.Dispatch<React.SetStateAction<ExamCountdownConfig>>;
  upiConfig?: UpiConfig;
  setUpiConfig?: React.Dispatch<React.SetStateAction<UpiConfig>>;
  subjectChapters?: SubjectChapter[];
  setSubjectChapters?: React.Dispatch<React.SetStateAction<SubjectChapter[]>>;
}

export const AdminPanelView: React.FC<AdminPanelViewProps> = ({
  language,
  currentUser,
  countdownConfig: propCountdownConfig,
  setCountdownConfig: setPropCountdownConfig,
  upiConfig: propUpiConfig,
  setUpiConfig: setPropUpiConfig,
  subjectChapters: propSubjectChapters,
  setSubjectChapters: setPropSubjectChapters,
}) => {
  const isSuperAdmin = canUserAccessAdmin(currentUser, true);

  const [adminTab, setAdminTab] = useState<
    'overview' | 'students' | 'payments' | 'content' | 'community' | 'reports' | 'audit' | 'config'
  >('overview');

  const [adminToast, setAdminToast] = useState<{ message: string; type: 'success' | 'info' | 'error' } | null>(null);
  const showToast = (message: string, type: 'success' | 'info' | 'error' = 'success') => {
    setAdminToast({ message, type });
    setTimeout(() => setAdminToast(null), 4000);
  };

  // Real-time cloud + local merged states
  const [studentsList, setStudentsList] = useState<UserProfile[]>(() => getAllUsers());
  const [paymentRequests, setPaymentRequests] = useState<PaymentRequest[]>(() => getPaymentRequests());
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>(() => getAdminAuditLogs());
  const [subjectChapters, setSubjectChapters] = useState<SubjectChapter[]>(
    () => propSubjectChapters || toSubjectChapters()
  );
  const [questionsList, setQuestionsList] = useState<MCQQuestion[]>(() => getAllQuestions());
  const [moderationReports, setModerationReports] = useState<ModerationReport[]>(() => getModerationReports());
  const [communityPosts, setCommunityPosts] = useState<CommunityPost[]>(() => getPosts());
  const [livePeers, setLivePeers] = useState<StudyPresence[]>([]);
  const [analyticsEvents, setAnalyticsEvents] = useState<AnalyticsEvent[]>([]);
  const [adminNotifications, setAdminNotifications] = useState<AppNotification[]>([]);

  const [upiConfig, setUpiConfig] = useState<UpiConfig>(() => propUpiConfig || getUpiConfig());
  const [upiSavedNotice, setUpiSavedNotice] = useState(false);
  const [countdownConfig, setCountdownConfig] = useState<ExamCountdownConfig>(
    () => propCountdownConfig || getExamCountdownConfig()
  );
  const [countdownSavedNotice, setCountdownSavedNotice] = useState(false);
  const [isSyncingCountdown, setIsSyncingCountdown] = useState(false);
  const [referralConfig, setReferralConfig] = useState<ReferralRewardConfig>(() => getReferralConfig());
  const [referralSavedNotice, setReferralSavedNotice] = useState(false);

  useEffect(() => {
    if (propCountdownConfig) setCountdownConfig(propCountdownConfig);
  }, [propCountdownConfig]);

  useEffect(() => {
    if (propUpiConfig) setUpiConfig(propUpiConfig);
  }, [propUpiConfig]);

  // Firestore real-time listeners when authenticated as owner super admin
  useEffect(() => {
    if (!isSuperAdmin) return;

    const unsubStudents = subscribeToAllStudents((cloudUsers) => {
      if (cloudUsers.length > 0) setStudentsList(cloudUsers);
    });
    const unsubPayments = subscribeToAllPaymentRequests((cloudPayments) => {
      setPaymentRequests((prev) => {
        const map = new Map<string, PaymentRequest>();
        cloudPayments.forEach((p) => map.set(p.id, p));
        prev.forEach((p) => {
          if (!map.has(p.id)) map.set(p.id, p);
        });
        return Array.from(map.values()).sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
      });
    });
    const unsubPresence = subscribeToStudyPresence((peers) => setLivePeers(peers));
    const unsubEvents = subscribeToAnalyticsEvents((evts) => setAnalyticsEvents(evts));
    const unsubNotifs = subscribeToNotifications('admin', (notifs) => setAdminNotifications(notifs));
    const unsubAudit = subscribeToAuditLogs((logs) => {
      if (logs.length > 0) setAuditLogs(logs);
    });
    const unsubReports = subscribeToModerationReports((reports) => {
      if (reports.length > 0) setModerationReports(reports);
    });
    const unsubPosts = subscribeToCommunityPosts((posts) => {
      if (posts.length > 0) setCommunityPosts(posts);
    });
    const unsubExam = subscribeToExamConfig((cfg) => {
      if (cfg) {
        setCountdownConfig(cfg);
        setPropCountdownConfig?.(cfg);
      }
    });
    const unsubUpi = subscribeToUpiConfig((cfg) => {
      if (cfg) {
        setUpiConfig(cfg);
        setPropUpiConfig?.(cfg);
      }
    });
    const unsubChaps = subscribeToSubjectChapters((cloudChaps) => {
      if (cloudChaps.length > 0) {
        const canonical = toSubjectChapters();
        const merged = [...canonical];
        cloudChaps.forEach((cc) => {
          const idx = merged.findIndex((m) => m.id === cc.id);
          if (idx !== -1) merged[idx] = cc;
          else merged.push(cc);
        });
        setSubjectChapters(merged);
        setPropSubjectChapters?.(merged);
      }
    });
    const unsubCustomQs = subscribeToCustomQuestions((cloudQs) => {
      if (cloudQs.length > 0) {
        const base = getAllQuestions();
        const ids = new Set(base.map((q) => q.id));
        const unique = cloudQs.filter((q) => !ids.has(q.id));
        setQuestionsList([...unique, ...base]);
      }
    });

    return () => {
      unsubStudents();
      unsubPayments();
      unsubPresence();
      unsubEvents();
      unsubNotifs();
      unsubAudit();
      unsubReports();
      unsubPosts();
      unsubExam();
      unsubUpi();
      unsubChaps();
      unsubCustomQs();
    };
  }, [isSuperAdmin, setPropCountdownConfig, setPropSubjectChapters, setPropUpiConfig]);

  const reloadLocalFallback = () => {
    setAuditLogs((prev) => (prev.length > 0 ? prev : getAdminAuditLogs()));
    setSubjectChapters((prev) => (prev.length >= 46 ? prev : getSubjectChapters()));
    setQuestionsList(getAllQuestions());
  };

  // Payments actions
  const [paymentFilter, setPaymentFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [zoomedScreenshot, setZoomedScreenshot] = useState<string | null>(null);
  const [rejectingPaymentId, setRejectingPaymentId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState(
    'Transaction reference (UTR) not reflected in bank credit statement.'
  );

  const handleApprovePayment = async (pay: PaymentRequest) => {
    playChimeSound('success');
    const expiresAt = await approvePaymentRequestInDb(pay);
    approvePaymentRequest(pay.id, currentUser.name, 'Verified with UPI bank ledger (+30 days unlocked).');
    setPaymentRequests((prev) =>
      prev.map((p) => (p.id === pay.id ? { ...p, status: 'approved', unlockedUntil: expiresAt || p.unlockedUntil } : p))
    );
    showToast(`Approved ₹${pay.amount} for ${pay.studentName} (+30 Days Pass Activated).`, 'success');
  };

  const handleConfirmReject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectingPaymentId) return;
    const target = paymentRequests.find((p) => p.id === rejectingPaymentId);
    playChimeSound('click');
    if (target) {
      await rejectPaymentRequestInDb(target, rejectionReason);
    }
    rejectPaymentRequest(rejectingPaymentId, currentUser.name, rejectionReason);
    setPaymentRequests((prev) =>
      prev.map((p) => (p.id === rejectingPaymentId ? { ...p, status: 'rejected', adminNotes: rejectionReason } : p))
    );
    setRejectingPaymentId(null);
    showToast('Payment claim rejected and student notified.', 'info');
  };

  // Students management state & actions
  const [studentSearchQuery, setStudentSearchQuery] = useState('');
  const [studentStatusFilter, setStudentStatusFilter] = useState<string>('all');
  const [selectedStudentForExpiry, setSelectedStudentForExpiry] = useState<UserProfile | null>(null);
  const [customExpiryDate, setCustomExpiryDate] = useState('');
  const [suspensionModalStudent, setSuspensionModalStudent] = useState<UserProfile | null>(null);
  const [suspensionReasonText, setSuspensionReasonText] = useState('Violation of community code of conduct');

  const filteredStudents = useMemo(() => {
    return studentsList.filter((s) => {
      const q = studentSearchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        s.name.toLowerCase().includes(q) ||
        s.email.toLowerCase().includes(q) ||
        (s.phone && s.phone.includes(q)) ||
        (s.paymentReference && s.paymentReference.toLowerCase().includes(q));
      if (!matchesSearch) return false;
      if (studentStatusFilter === 'all') return true;
      if (studentStatusFilter === 'suspended') return !!s.isSuspended;
      const st = getStudentMembershipStatus(
        s,
        paymentRequests.filter((p) => p.studentId === s.id)
      );
      return st.status === studentStatusFilter;
    });
  }, [studentsList, studentSearchQuery, studentStatusFilter, paymentRequests]);

  const handleToggleSuspend = async (student: UserProfile) => {
    const isCurrentlySuspended = !!student.isSuspended;
    const nextSuspended = !isCurrentlySuspended;
    await updateStudentStatusByAdmin(
      student.id,
      {
        isSuspended: nextSuspended,
        suspensionReason: nextSuspended ? suspensionReasonText : '',
      },
      {
        action: nextSuspended ? 'Suspended Student Account' : 'Reactivated Student Account',
        details: nextSuspended ? suspensionReasonText : 'Reactivated by Owner Admin',
        targetName: student.name,
      }
    );
    toggleSuspendStudent(student.id, currentUser.name, nextSuspended ? suspensionReasonText : undefined);
    setStudentsList((prev) =>
      prev.map((u) => (u.id === student.id ? { ...u, isSuspended: nextSuspended } : u))
    );
    setSuspensionModalStudent(null);
    showToast(`Student ${student.name} ${nextSuspended ? 'suspended' : 'reactivated'}.`, nextSuspended ? 'info' : 'success');
  };

  const handleQuickExtend = async (student: UserProfile, days: number) => {
    const baseMs =
      student.subscriptionExpiresAt && new Date(student.subscriptionExpiresAt).getTime() > Date.now()
        ? new Date(student.subscriptionExpiresAt).getTime()
        : Date.now();
    const nextExpiry = new Date(baseMs + days * 24 * 60 * 60 * 1000).toISOString();
    await updateStudentStatusByAdmin(
      student.id,
      {
        membershipStatus: 'active',
        hasPaidPass: true,
        subscriptionExpiresAt: nextExpiry,
        passExpiry: nextExpiry,
      },
      {
        action: 'Extended Membership',
        details: `Added ${days} days access (until ${nextExpiry.slice(0, 10)})`,
        targetName: student.name,
      }
    );
    extendStudentMembership(student.id, days, currentUser.name);
    setStudentsList((prev) =>
      prev.map((u) =>
        u.id === student.id
          ? { ...u, membershipStatus: 'active', hasPaidPass: true, subscriptionExpiresAt: nextExpiry }
          : u
      )
    );
    showToast(`Extended +${days} days for ${student.name}.`);
  };

  const handleSaveCustomExpiry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudentForExpiry || !customExpiryDate) return;
    const iso = new Date(customExpiryDate).toISOString();
    await updateStudentStatusByAdmin(
      selectedStudentForExpiry.id,
      {
        membershipStatus: new Date(iso).getTime() > Date.now() ? 'active' : 'expired',
        hasPaidPass: new Date(iso).getTime() > Date.now(),
        subscriptionExpiresAt: iso,
        passExpiry: iso,
      },
      {
        action: 'Updated Custom Expiry',
        details: `Set expiry to ${iso}`,
        targetName: selectedStudentForExpiry.name,
      }
    );
    setStudentMembershipExpiry(selectedStudentForExpiry.id, customExpiryDate, currentUser.name);
    setStudentsList((prev) =>
      prev.map((u) => (u.id === selectedStudentForExpiry.id ? { ...u, subscriptionExpiresAt: iso } : u))
    );
    setSelectedStudentForExpiry(null);
    showToast(`Updated expiry for ${selectedStudentForExpiry.name}.`);
  };

  // Content management
  const [contentPaperTab, setContentPaperTab] = useState<PaperId>('paper1');
  const [questionSearch, setQuestionSearch] = useState('');
  const [selectedChapterFilter, setSelectedChapterFilter] = useState<string>('all');
  const [showAddChapterModal, setShowAddChapterModal] = useState(false);
  const [newChapterTitleEn, setNewChapterTitleEn] = useState('');
  const [newChapterTitleHi, setNewChapterTitleHi] = useState('');
  const [newChapterNumber, setNewChapterNumber] = useState<number>(1);

  const [showAddQuestionModal, setShowAddQuestionModal] = useState(false);
  const [qPaperId, setQPaperId] = useState<PaperId>('paper1');
  const [qChapterId, setQChapterId] = useState<string>('ch_p1_01');
  const [qTextEn, setQTextEn] = useState('');
  const [qTextHi, setQTextHi] = useState('');
  const [qOptAEn, setQOptAEn] = useState('');
  const [qOptBEn, setQOptBEn] = useState('');
  const [qOptCEn, setQOptCEn] = useState('');
  const [qOptDEn, setQOptDEn] = useState('');
  const [qCorrectIndex, setQCorrectIndex] = useState<number>(0);
  const [qExpEn, setQExpEn] = useState('');
  const [qSourceCitation, setQSourceCitation] = useState('ICAI Study Module Jan 2027 Edition');
  const [qAttemptTag, setQAttemptTag] = useState('January 2027');

  const filteredChapters = useMemo(
    () => subjectChapters.filter((c) => c.paperId === contentPaperTab),
    [subjectChapters, contentPaperTab]
  );

  const filteredQuestions = useMemo(() => {
    return questionsList.filter((q) => {
      if (q.paperId !== contentPaperTab) return false;
      if (selectedChapterFilter !== 'all' && q.chapterId !== selectedChapterFilter) return false;
      if (questionSearch.trim()) {
        const needle = questionSearch.toLowerCase();
        return q.question.en.toLowerCase().includes(needle) || q.question.hi.toLowerCase().includes(needle);
      }
      return true;
    });
  }, [questionsList, contentPaperTab, selectedChapterFilter, questionSearch]);

  const handleCreateChapter = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newChapterTitleEn.trim()) return;
    const newChap: SubjectChapter = {
      id: `ch_${contentPaperTab}_${Date.now()}`,
      paperId: contentPaperTab,
      chapterNumber: newChapterNumber,
      title: { en: newChapterTitleEn.trim(), hi: newChapterTitleHi.trim() || newChapterTitleEn.trim() },
      questionCount: 0,
    };
    await saveSubjectChapterToDb(newChap);
    addSubjectChapter(newChap, currentUser.name);
    setSubjectChapters((prev) => [...prev, newChap]);
    setShowAddChapterModal(false);
    setNewChapterTitleEn('');
    setNewChapterTitleHi('');
    showToast('Chapter synced to Firestore.');
  };

  const handleSaveQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!qTextEn.trim() || !qOptAEn.trim() || !qOptBEn.trim()) return;
    const chap = subjectChapters.find((c) => c.id === qChapterId) || filteredChapters[0];
    const payload: MCQQuestion = {
      id: `cq_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      paperId: qPaperId,
      chapterId: chap?.id || 'ch_gen',
      chapterTitle: chap?.title || { en: 'General', hi: 'सामान्य' },
      difficulty: 'medium',
      question: { en: qTextEn, hi: qTextHi || qTextEn },
      options: {
        en: [qOptAEn, qOptBEn, qOptCEn || 'None', qOptDEn || 'All of the above'],
        hi: [qOptAEn, qOptBEn, qOptCEn || 'कोई नहीं', qOptDEn || 'उपरोक्त सभी'],
      },
      correctIndex: qCorrectIndex,
      explanation: { en: qExpEn || 'Refer to ICAI Jan 2027 module.', hi: qExpEn || 'आईसीएआई मॉड्यूल देखें।' },
      keyRule: { en: 'ICAI Study Module Guidance', hi: 'आईसीएआई नियम' },
      sourceType: 'ICAI_MODULE',
      sourceLabel: { en: qSourceCitation, hi: qSourceCitation },
      examAttempt: qAttemptTag,
      officialQuestionRef: `ICAI-${qPaperId.toUpperCase()}-${Date.now().toString().slice(-4)}`,
      officialSourceLink: 'https://boslive.icai.org',
    };
    await saveCustomQuestionToDb(payload);
    addCustomQuestion(payload, currentUser.name);
    setQuestionsList((prev) => [payload, ...prev]);
    setShowAddQuestionModal(false);
    setQTextEn('');
    setQTextHi('');
    showToast('Question published & synced to all students.');
  };

  const handleDeleteQuestionItem = (qId: string) => {
    deleteCustomQuestion(qId, currentUser.name);
    reloadLocalFallback();
    showToast('Question removed from local bank.', 'info');
  };

  // Community moderation
  const handleResolveReportItem = (reportId: string, status: 'resolved' | 'dismissed') => {
    playChimeSound('click');
    resolveReport(reportId, status);
    resolveModerationReportInDb(reportId, status).catch(console.error);
    setModerationReports((prev) => prev.map((r) => (r.id === reportId ? { ...r, status } : r)));
    showToast(`Report marked ${status}.`, 'info');
  };

  const handleDeletePostItem = (postId: string) => {
    deletePost(postId);
    deletePostFromDb(postId).catch(console.error);
    setCommunityPosts((prev) => prev.filter((p) => p.id !== postId));
    showToast('Post removed from Common Group.', 'info');
  };

  const handleTogglePinPostItem = (postId: string) => {
    const target = communityPosts.find((p) => p.id === postId);
    togglePinPost(postId);
    togglePinPostInDb(postId, !(target?.isPinned)).catch(console.error);
    setCommunityPosts((prev) => prev.map((p) => (p.id === postId ? { ...p, isPinned: !p.isPinned } : p)));
    showToast('Post pin toggled.');
  };

  // UPI & Exam Config
  const handleQrUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async () => {
      const updated = { ...upiConfig, qrCodeImageUrl: reader.result as string };
      setUpiConfig(updated);
      setPropUpiConfig?.(updated);
      saveUpiConfig(updated);
      await saveUpiConfigToDb(updated).catch(() => {});
      showToast('UPI QR image updated and synced.');
    };
    reader.readAsDataURL(file);
  };

  const handleSaveUpi = async (e: React.FormEvent) => {
    e.preventDefault();
    saveUpiConfig(upiConfig);
    setPropUpiConfig?.(upiConfig);
    await saveUpiConfigToDb(upiConfig).catch(() => {});
    setUpiSavedNotice(true);
    setTimeout(() => setUpiSavedNotice(false), 3000);
    showToast('UPI settings saved & synced to Cloud.');
  };

  const handleSaveExamCountdown = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSyncingCountdown(true);
    saveExamCountdownConfig(countdownConfig);
    setPropCountdownConfig?.(countdownConfig);
    try {
      await saveExamConfigToDb(countdownConfig);
    } finally {
      setIsSyncingCountdown(false);
    }
    setCountdownSavedNotice(true);
    setTimeout(() => setCountdownSavedNotice(false), 3000);
    showToast('Exam attempt & date configuration synced globally.');
  };

  const handleSaveReferral = (e: React.FormEvent) => {
    e.preventDefault();
    saveReferralConfig(referralConfig);
    setReferralSavedNotice(true);
    setTimeout(() => setReferralSavedNotice(false), 3000);
    showToast('Referral policy saved.');
  };

  // KPI & Analytics Calculations (strictly real computed values)
  const pendingPayments = useMemo(() => paymentRequests.filter((p) => p.status === 'pending'), [paymentRequests]);
  const approvedPayments = useMemo(() => paymentRequests.filter((p) => p.status === 'approved'), [paymentRequests]);
  const rejectedPayments = useMemo(() => paymentRequests.filter((p) => p.status === 'rejected'), [paymentRequests]);
  const totalRevenue = useMemo(() => approvedPayments.reduce((acc, p) => acc + (p.amount || 5), 0), [approvedPayments]);

  const membershipBuckets = useMemo(() => {
    let active = 0;
    let unpaid = 0;
    let expired = 0;
    studentsList.forEach((s) => {
      if (s.role === 'admin') return;
      const st = getStudentMembershipStatus(
        s,
        paymentRequests.filter((p) => p.studentId === s.id)
      );
      if (st.status === 'active') active++;
      else if (st.status === 'expired') expired++;
      else if (st.status === 'unpaid') unpaid++;
    });
    return { active, unpaid, expired };
  }, [studentsList, paymentRequests]);

  const analyticsSummary = useMemo(() => {
    const now = Date.now();
    const todayIso = new Date(now).toISOString().slice(0, 10);
    const sevenDaysAgo = now - 7 * 86400_000;
    const thirtyDaysAgo = now - 30 * 86400_000;
    const fourteenDaysAgo = now - 14 * 86400_000;

    const uniqueVisitors = new Set(analyticsEvents.map((e) => e.visitorId)).size;
    const signupEvents = analyticsEvents.filter((e) => e.eventType === 'signup').length;
    const dau = new Set(
      analyticsEvents.filter((e) => e.date === todayIso).map((e) => e.userId || e.visitorId)
    ).size;
    const wau = new Set(
      analyticsEvents
        .filter((e) => new Date(e.createdAt).getTime() >= sevenDaysAgo)
        .map((e) => e.userId || e.visitorId)
    ).size;
    const mau = new Set(
      analyticsEvents
        .filter((e) => new Date(e.createdAt).getTime() >= thirtyDaysAgo)
        .map((e) => e.userId || e.visitorId)
    ).size;

    const inactiveChurnedCount = studentsList.filter((s) => {
      if (s.role === 'admin' || !s.lastActiveDate) return false;
      return new Date(s.lastActiveDate).getTime() < fourteenDaysAgo;
    }).length;

    const dailyTrend = Array.from({ length: 7 }, (_, i) => {
      const dt = new Date(now - (6 - i) * 86400_000);
      const key = dt.toISOString().slice(0, 10);
      const count = analyticsEvents.filter((e) => e.date === key).length;
      return { date: key, label: dt.toLocaleDateString('en-US', { weekday: 'short' }), count };
    });

    return { uniqueVisitors, signupEvents, dau, wau, mau, inactiveChurnedCount, dailyTrend };
  }, [analyticsEvents, studentsList]);

  const unreadAdminNotifs = adminNotifications.filter((n) => !n.read);

  if (!isSuperAdmin) {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 border border-red-200 dark:border-red-900/60 text-center max-w-md mx-auto space-y-4 my-12 shadow-xl">
        <div className="w-16 h-16 rounded-2xl bg-red-50 dark:bg-red-950/80 text-red-600 mx-auto flex items-center justify-center">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-black text-slate-900 dark:text-white">403 — Private Super Admin Dashboard</h2>
        <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
          Administrative controls, student records, and payment verification are strictly restricted to{' '}
          <strong>ajitsinghca9@gmail.com</strong>.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-24 lg:pb-8">
      {adminToast && (
        <div
          className={`p-4 rounded-2xl text-xs font-bold border flex items-center justify-between shadow-lg ${
            adminToast.type === 'success'
              ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
              : adminToast.type === 'info'
                ? 'bg-blue-50 border-blue-300 text-blue-800'
                : 'bg-red-50 border-red-300 text-red-800'
          }`}
        >
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{adminToast.message}</span>
          </div>
          <button onClick={() => setAdminToast(null)} className="cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Real-time Admin Notification Alerts */}
      {unreadAdminNotifs.length > 0 && (
        <div className="bg-amber-50 dark:bg-amber-950/50 border border-amber-300 dark:border-amber-800 rounded-2xl p-4 space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-amber-900 dark:text-amber-200">
            <span className="flex items-center gap-2">
              <Bell className="w-4 h-4 text-amber-600" />
              <span>{unreadAdminNotifs.length} New Real-Time Payment Alert(s)</span>
            </span>
            <button
              onClick={() => setAdminTab('payments')}
              className="px-3 py-1 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold cursor-pointer"
            >
              Review Payments
            </button>
          </div>
          <div className="space-y-1.5">
            {unreadAdminNotifs.slice(0, 3).map((n) => (
              <div
                key={n.id}
                className="flex items-center justify-between gap-2 bg-white/80 dark:bg-slate-900/80 px-3 py-2 rounded-xl text-xs"
              >
                <span className="text-slate-800 dark:text-slate-200">{n.message}</span>
                <button
                  onClick={() => markNotificationReadInDb(n.id)}
                  className="text-[11px] font-bold text-blue-600 hover:underline shrink-0 cursor-pointer"
                >
                  Mark Read
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Super Admin Header & Tab Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-md bg-purple-100 dark:bg-purple-950 text-purple-800 dark:text-purple-300 text-[10px] font-black uppercase">
              Super Admin Console
            </span>
            <span className="text-xs text-slate-500 font-bold">ajitsinghca9@gmail.com</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2 mt-1">
            <ShieldCheck className="w-6 h-6 text-purple-600" />
            <span>{language === 'en' ? 'Owner Management & Analytics Center' : 'सुपर एडमिन प्रबंधन केंद्र'}</span>
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 text-xs">
          {[
            { id: 'overview', label: 'Overview & Analytics', icon: BarChart3 },
            { id: 'students', label: `Students (${studentsList.length})`, icon: Users },
            { id: 'payments', label: `Payments (${pendingPayments.length})`, icon: QrCode, badge: pendingPayments.length },
            { id: 'content', label: '46 Chapters & MCQs', icon: BookOpen },
            { id: 'community', label: 'Common Group', icon: MessageSquare },
            { id: 'reports', label: 'CSV Exports', icon: FileSpreadsheet },
            { id: 'audit', label: 'Audit Logs', icon: ShieldCheck },
            { id: 'config', label: 'Exam & UPI QR', icon: Sliders },
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setAdminTab(tab.id as typeof adminTab)}
                className={`px-3 py-1.5 rounded-xl font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  adminTab === tab.id
                    ? 'bg-purple-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-white/60 dark:hover:bg-slate-700/60'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
                {tab.badge ? (
                  <span className="ml-1 px-1.5 rounded-full text-[10px] font-black bg-rose-500 text-white tabular-nums">
                    {tab.badge}
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>
      </div>

      {/* TAB 1: OVERVIEW & REAL ANALYTICS */}
      {adminTab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 tabular-nums">
            <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
              <span className="text-[11px] font-bold text-slate-500 block">Registered Students</span>
              <span className="text-2xl font-black text-slate-900 dark:text-white mt-1 block">
                {studentsList.filter((s) => s.role !== 'admin').length}
              </span>
              <span className="text-[10px] text-slate-500 block mt-1">
                {membershipBuckets.unpaid} Unpaid • {membershipBuckets.expired} Expired
              </span>
            </div>

            <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-emerald-200 dark:border-emerald-900/60">
              <span className="text-[11px] font-bold text-emerald-700 block">Active Paid Students</span>
              <span className="text-2xl font-black text-emerald-600 mt-1 block">{membershipBuckets.active}</span>
              <span className="text-[10px] text-emerald-700 block mt-1">₹{totalRevenue} Total Verified Revenue</span>
            </div>

            <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-amber-200 dark:border-amber-900/60">
              <span className="text-[11px] font-bold text-amber-700 block">Pending Verifications</span>
              <span className="text-2xl font-black text-amber-600 mt-1 block">{pendingPayments.length}</span>
              <span className="text-[10px] text-amber-700 block mt-1">{rejectedPayments.length} Rejected Claims</span>
            </div>

            <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-blue-200 dark:border-blue-900/60">
              <span className="text-[11px] font-bold text-blue-700 flex items-center gap-1">
                <Radio className="w-3.5 h-3.5 text-emerald-500" /> Studying Live Right Now
              </span>
              <span className="text-2xl font-black text-blue-600 mt-1 block">{livePeers.length}</span>
              <span className="text-[10px] text-slate-500 block mt-1">Active Firestore presence heartbeats</span>
            </div>
          </div>

          {/* App Usage & Growth Analytics */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <Activity className="w-4 h-4 text-purple-600" />
                  <span>App Growth, Retention & Visitors (/analyticsEvents)</span>
                </h3>
                <span className="text-[11px] text-slate-500 tabular-nums">{analyticsEvents.length} Logged Events</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs tabular-nums">
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60">
                  <span className="text-[11px] text-slate-500 block">Unique Visitors</span>
                  <strong className="text-lg text-slate-900 dark:text-white">{analyticsSummary.uniqueVisitors}</strong>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60">
                  <span className="text-[11px] text-slate-500 block">DAU / WAU / MAU</span>
                  <strong className="text-lg text-blue-600">
                    {analyticsSummary.dau} / {analyticsSummary.wau} / {analyticsSummary.mau}
                  </strong>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60">
                  <span className="text-[11px] text-slate-500 block">New Signups</span>
                  <strong className="text-lg text-emerald-600">{analyticsSummary.signupEvents}</strong>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60">
                  <span className="text-[11px] text-slate-500 block">Inactive (&gt;14d)</span>
                  <strong className="text-lg text-rose-600">{analyticsSummary.inactiveChurnedCount}</strong>
                </div>
              </div>

              {/* 7-day trend bar chart */}
              <div className="pt-2">
                <span className="text-[11px] font-bold text-slate-500 block mb-2">7-Day Visit & Activity Trend</span>
                <div className="h-28 flex items-end justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-1">
                  {analyticsSummary.dailyTrend.map((d) => {
                    const max = Math.max(...analyticsSummary.dailyTrend.map((x) => x.count), 5);
                    const pct = d.count > 0 ? Math.max(10, Math.round((d.count / max) * 100)) : 4;
                    return (
                      <div key={d.date} className="flex-1 flex flex-col items-center gap-1 h-full justify-end">
                        <span className="text-[10px] font-bold text-slate-500 tabular-nums">{d.count}</span>
                        <div className="w-full max-w-[36px] bg-slate-100 dark:bg-slate-800 rounded-t h-full flex items-end">
                          <div
                            className={`w-full rounded-t ${d.count > 0 ? 'bg-purple-600' : 'bg-slate-200 dark:bg-slate-700'}`}
                            style={{ height: `${pct}%` }}
                          />
                        </div>
                        <span className="text-[10px] text-slate-500">{d.label}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Live Studying Peers List */}
            <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-3">
              <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
                <Radio className="w-4 h-4 text-emerald-500" />
                <span>Students Online Now ({livePeers.length})</span>
              </h3>
              {livePeers.length === 0 ? (
                <p className="text-xs text-slate-500 py-8 text-center">No active study sessions at this moment.</p>
              ) : (
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {livePeers.map((peer) => (
                    <div
                      key={peer.userId}
                      className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span>{peer.avatar || '🎓'}</span>
                        <div className="min-w-0">
                          <p className="font-bold text-slate-900 dark:text-white truncate">{peer.displayName}</p>
                          <p className="text-[10px] text-slate-500 truncate">{peer.activeTopic}</p>
                        </div>
                      </div>
                      <span className="text-[10px] font-bold text-emerald-600 shrink-0">Active</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: STUDENTS */}
      {adminTab === 'students' && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
            <div>
              <h3 className="font-black text-slate-900 dark:text-white text-base">
                Student Management ({filteredStudents.length} Accounts)
              </h3>
              <p className="text-xs text-slate-500">View study hours, extend +30d membership, or suspend accounts.</p>
            </div>
            <button
              onClick={() => {
                const csv = exportStudentsToCsv(filteredStudents);
                downloadCsvFile(`students_export_${new Date().toISOString().slice(0, 10)}.csv`, csv);
                showToast('Students CSV downloaded.');
              }}
              className="px-3.5 py-1.5 rounded-xl bg-purple-50 text-purple-700 font-bold text-xs flex items-center gap-1.5 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </button>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3 text-xs">
            <div className="relative flex-1 w-full">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={studentSearchQuery}
                onChange={(e) => setStudentSearchQuery(e.target.value)}
                placeholder="Search name, email, phone, or CAS-2027-XXXX..."
                className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Filter className="w-4 h-4 text-slate-400" />
              <select
                value={studentStatusFilter}
                onChange={(e) => setStudentStatusFilter(e.target.value)}
                className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold"
              >
                <option value="all">All Statuses</option>
                <option value="active">Active Paid</option>
                <option value="pending">Pending Verification</option>
                <option value="expired">Expired</option>
                <option value="unpaid">Unpaid</option>
                <option value="suspended">Suspended</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 uppercase text-[10px] font-black">
                <tr>
                  <th className="p-3">Student</th>
                  <th className="p-3">Study Time & Qs</th>
                  <th className="p-3">Ref</th>
                  <th className="p-3">Membership</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredStudents.map((st) => {
                  const mem = getStudentMembershipStatus(
                    st,
                    paymentRequests.filter((p) => p.studentId === st.id)
                  );
                  return (
                    <tr key={st.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                      <td className="p-3">
                        <div className="flex items-center gap-2.5">
                          <span className="text-xl">{st.avatar}</span>
                          <div>
                            <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                              <span>{st.name}</span>
                              {st.isSuspended && (
                                <span className="px-1.5 rounded text-[9px] bg-rose-100 text-rose-700">SUSPENDED</span>
                              )}
                            </div>
                            <span className="text-[11px] text-slate-500 block">{st.email}</span>
                            {st.phone && <span className="text-[10px] font-mono text-blue-600">{st.phone}</span>}
                          </div>
                        </div>
                      </td>
                      <td className="p-3 tabular-nums">
                        <span className="font-bold block">{Math.round((st.studyMinutesTotal || 0) / 60 * 10) / 10} hrs</span>
                        <span className="text-[10px] text-slate-500">{st.totalQuestionsAttempted || 0} MCQs</span>
                      </td>
                      <td className="p-3 font-mono font-bold text-purple-700 dark:text-purple-300">
                        {st.paymentReference || 'CAS-NONE'}
                      </td>
                      <td className="p-3">
                        <span
                          className={`px-2 py-0.5 rounded font-bold text-[10px] uppercase ${
                            mem.status === 'active'
                              ? 'bg-emerald-100 text-emerald-700'
                              : mem.status === 'pending'
                                ? 'bg-amber-100 text-amber-700'
                                : mem.status === 'expired'
                                  ? 'bg-rose-100 text-rose-700'
                                  : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {mem.status}
                        </span>
                        {st.subscriptionExpiresAt && (
                          <span className="text-[10px] text-slate-400 block mt-0.5 tabular-nums">
                            Until {new Date(st.subscriptionExpiresAt).toLocaleDateString()}
                          </span>
                        )}
                      </td>
                      <td className="p-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleQuickExtend(st, 30)}
                            className="px-2 py-1 rounded bg-emerald-50 text-emerald-700 font-bold text-[10px] cursor-pointer"
                          >
                            +30d
                          </button>
                          <button
                            onClick={() => setSelectedStudentForExpiry(st)}
                            className="px-2 py-1 rounded bg-purple-50 text-purple-700 font-bold text-[10px] cursor-pointer"
                          >
                            Expiry
                          </button>
                          {st.isSuspended ? (
                            <button
                              onClick={() => handleToggleSuspend(st)}
                              className="px-2 py-1 rounded bg-emerald-600 text-white font-bold text-[10px] cursor-pointer flex items-center gap-1"
                            >
                              <UserCheck className="w-3 h-3" /> Activate
                            </button>
                          ) : (
                            <button
                              onClick={() => setSuspensionModalStudent(st)}
                              className="px-2 py-1 rounded bg-rose-50 text-rose-700 font-bold text-[10px] cursor-pointer flex items-center gap-1"
                            >
                              <UserX className="w-3 h-3" /> Suspend
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: PAYMENT VERIFICATION QUEUE */}
      {adminTab === 'payments' && (
        <div className="space-y-5">
          <div className="bg-gradient-to-r from-purple-900 to-indigo-900 text-white p-5 rounded-3xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <span className="text-xs uppercase tracking-wider text-purple-200 font-bold">UPI Verification Queue</span>
              <h2 className="text-2xl font-black mt-0.5 tabular-nums">Verified UPI Revenue: ₹{totalRevenue}</h2>
              <p className="text-xs text-purple-100 mt-1">
                Personal UPI: <strong>{upiConfig.upiId}</strong> ({upiConfig.payeeName}). Verify UTR before unlocking.
              </p>
            </div>
            <button
              onClick={() => {
                const csv = exportPaymentsToCsv(paymentRequests);
                downloadCsvFile(`payments_ledger_${new Date().toISOString().slice(0, 10)}.csv`, csv);
                showToast('Payments ledger CSV downloaded.');
              }}
              className="px-4 py-2 rounded-xl bg-white/20 hover:bg-white/30 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Export Ledger CSV</span>
            </button>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="font-black text-slate-900 dark:text-white text-base">
                Payment Requests & History
              </h3>
              <div className="inline-flex p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl text-xs">
                {(['all', 'pending', 'approved', 'rejected'] as const).map((st) => (
                  <button
                    key={st}
                    onClick={() => setPaymentFilter(st)}
                    className={`px-3 py-1 rounded-xl font-bold capitalize cursor-pointer ${
                      paymentFilter === st ? 'bg-purple-600 text-white' : 'text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    {st} {st === 'pending' ? `(${pendingPayments.length})` : ''}
                  </button>
                ))}
              </div>
            </div>

            {paymentRequests.filter((p) => (paymentFilter === 'all' ? true : p.status === paymentFilter)).length === 0 ? (
              <p className="text-center text-xs text-slate-500 py-8">No payment claims in this filter.</p>
            ) : (
              paymentRequests
                .filter((p) => (paymentFilter === 'all' ? true : p.status === paymentFilter))
                .map((pay) => (
                  <div
                    key={pay.id}
                    className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs"
                  >
                    <div className="flex items-start gap-4">
                      {pay.screenshotUrl ? (
                        <div
                          onClick={() => setZoomedScreenshot(pay.screenshotUrl)}
                          className="w-16 h-16 rounded-xl border border-slate-200 overflow-hidden shrink-0 relative group cursor-pointer"
                        >
                          <img src={pay.screenshotUrl} alt="Payment proof" className="w-full h-full object-cover" />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white">
                            <Eye className="w-4 h-4" />
                          </div>
                        </div>
                      ) : (
                        <div className="w-16 h-16 rounded-xl bg-slate-200 flex items-center justify-center text-slate-400 shrink-0">
                          No Pic
                        </div>
                      )}

                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-bold text-sm text-slate-900 dark:text-white">{pay.studentName}</span>
                          <span className="font-mono text-purple-700 font-bold px-2 py-0.5 rounded bg-purple-50">
                            ₹{pay.amount}
                          </span>
                          {pay.paymentReference && (
                            <span className="font-mono text-[10px] font-bold text-slate-500">Ref: {pay.paymentReference}</span>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono">
                            UTR: <strong className="text-sm select-all">{pay.utr}</strong>
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              try {
                                navigator.clipboard?.writeText(pay.utr);
                              } catch {}
                              showToast(`Copied UTR ${pay.utr}`, 'info');
                            }}
                            className="px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-[10px] font-bold cursor-pointer"
                          >
                            Copy UTR
                          </button>
                        </div>
                        <div className="text-[11px] text-slate-500">
                          {pay.studentEmail} • <span className="font-mono font-bold text-blue-600">{pay.studentMobile}</span>
                        </div>
                        <span className="text-[10px] text-slate-400 block">
                          Submitted: {new Date(pay.createdAt).toLocaleString()}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {pay.status === 'pending' ? (
                        <>
                          <button
                            onClick={() => handleApprovePayment(pay)}
                            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs cursor-pointer flex items-center gap-1.5"
                          >
                            <CheckCircle2 className="w-4 h-4" />
                            <span>Approve (+30d)</span>
                          </button>
                          <button
                            onClick={() => setRejectingPaymentId(pay.id)}
                            className="px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs cursor-pointer flex items-center gap-1"
                          >
                            <XCircle className="w-4 h-4" />
                            <span>Reject</span>
                          </button>
                        </>
                      ) : (
                        <span
                          className={`px-3 py-1 rounded-lg text-xs font-bold ${
                            pay.status === 'approved' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {pay.status === 'approved' ? 'Approved ✓' : 'Rejected ✗'}
                        </span>
                      )}
                    </div>
                  </div>
                ))
            )}
          </div>
        </div>
      )}

      {/* TAB 4: 46 CHAPTERS & MCQS */}
      {adminTab === 'content' && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200 dark:border-slate-800 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
            <div>
              <h3 className="font-black text-slate-900 dark:text-white text-base">
                ICAI Jan 2027 Syllabus ({CANONICAL_SYLLABUS.length} Chapters • {questionsList.length} MCQs)
              </h3>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowAddChapterModal(true)}
                className="px-3 py-1.5 rounded-xl border border-purple-200 text-purple-700 font-bold text-xs flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" /> Add Chapter
              </button>
              <button
                onClick={() => {
                  setQPaperId(contentPaperTab);
                  setQChapterId(filteredChapters[0]?.id || 'ch_p1_01');
                  setShowAddQuestionModal(true);
                }}
                className="px-3.5 py-1.5 rounded-xl bg-purple-600 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" /> Add MCQ
              </button>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {[
              { id: 'paper1', name: 'Paper 1: Accounting (11)' },
              { id: 'paper2', name: 'Paper 2: Business Laws (7)' },
              { id: 'paper3', name: 'Paper 3: Quantitative Aptitude (18)' },
              { id: 'paper4', name: 'Paper 4: Business Economics (10)' },
            ].map((p) => (
              <button
                key={p.id}
                onClick={() => {
                  setContentPaperTab(p.id as PaperId);
                  setSelectedChapterFilter('all');
                }}
                className={`px-4 py-2 rounded-xl text-xs font-bold cursor-pointer ${
                  contentPaperTab === p.id ? 'bg-purple-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-700'
                }`}
              >
                {p.name}
              </button>
            ))}
          </div>

          <div className="flex flex-col sm:flex-row gap-3 text-xs">
            <select
              value={selectedChapterFilter}
              onChange={(e) => setSelectedChapterFilter(e.target.value)}
              className="w-full sm:w-64 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold"
            >
              <option value="all">All Chapters ({filteredChapters.length})</option>
              {filteredChapters.map((ch) => (
                <option key={ch.id} value={ch.id}>
                  Ch {ch.chapterNumber}: {ch.title.en}
                </option>
              ))}
            </select>

            <input
              type="text"
              value={questionSearch}
              onChange={(e) => setQuestionSearch(e.target.value)}
              placeholder="Search question text..."
              className="flex-1 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
            />
          </div>

          <div className="space-y-3">
            {filteredQuestions.map((q, idx) => (
              <div
                key={q.id}
                className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 space-y-2 text-xs"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <span className="font-black text-purple-600 mr-1.5">Q{idx + 1}.</span>
                    <span className="font-bold text-slate-900 dark:text-white">{q.question.en}</span>
                  </div>
                  <button
                    onClick={() => handleDeleteQuestionItem(q.id)}
                    className="p-1.5 rounded-lg bg-rose-50 text-rose-600 cursor-pointer shrink-0"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div className="text-[11px] text-slate-500">
                  {q.chapterTitle.en} • {q.sourceLabel?.en}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 5: SINGLE COMMON GROUP MODERATION & REPORTS */}
      {adminTab === 'community' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200 dark:border-slate-800 space-y-4">
            <h3 className="font-black text-slate-900 dark:text-white text-base flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-500" />
              <span>Moderation Reports Queue ({moderationReports.filter((r) => r.status === 'pending').length} Pending)</span>
            </h3>
            {moderationReports.length === 0 ? (
              <p className="text-xs text-slate-400 py-6 text-center">No moderation reports logged.</p>
            ) : (
              <div className="space-y-2.5 text-xs">
                {moderationReports.map((rep) => (
                  <div
                    key={rep.id}
                    className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 flex items-center justify-between"
                  >
                    <div>
                      <span className="font-bold block">{rep.targetTitle}</span>
                      <span className="text-slate-500">
                        Reason: {rep.reason} • By: {rep.reportedBy} • Status: {rep.status}
                      </span>
                    </div>
                    {rep.status === 'pending' && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleResolveReportItem(rep.id, 'resolved')}
                          className="px-3 py-1.5 rounded-xl bg-emerald-600 text-white font-bold cursor-pointer"
                        >
                          Resolve
                        </button>
                        <button
                          onClick={() => handleResolveReportItem(rep.id, 'dismissed')}
                          className="px-3 py-1.5 rounded-xl bg-slate-200 text-slate-700 font-bold cursor-pointer"
                        >
                          Dismiss
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-black text-slate-900 dark:text-white text-base">
                  Single Common Community Group ({COMMON_GROUP_ID})
                </h3>
                <p className="text-xs text-slate-500">
                  CA Saathi Jan 2027 Aspirants Community • {communityPosts.length} Total Threads
                </p>
              </div>
            </div>

            <div className="space-y-3 text-xs">
              {communityPosts.map((post) => (
                <div
                  key={post.id}
                  className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 flex items-start justify-between gap-3"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold">{post.authorName}</span>
                      {post.isPinned && (
                        <span className="px-1.5 rounded text-[9px] bg-purple-100 text-purple-700 font-bold">PINNED</span>
                      )}
                    </div>
                    <p className="font-semibold mt-0.5">{post.title}</p>
                    <p className="text-slate-600 dark:text-slate-400">{post.content}</p>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button onClick={() => handleTogglePinPostItem(post.id)} className="p-1.5 rounded-lg bg-slate-100 cursor-pointer">
                      <Pin className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => handleDeletePostItem(post.id)} className="p-1.5 rounded-lg bg-rose-50 text-rose-600 cursor-pointer">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 6: CSV EXPORTS */}
      {adminTab === 'reports' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-3">
            <h4 className="font-black text-sm">Students Master CSV</h4>
            <p className="text-xs text-slate-500">Full roster with mobile numbers, payment references, and validity dates.</p>
            <button
              onClick={() => {
                downloadCsvFile(`ca_saathi_students.csv`, exportStudentsToCsv(studentsList));
                showToast('Students CSV downloaded.');
              }}
              className="w-full py-2.5 rounded-xl bg-blue-600 text-white font-bold text-xs cursor-pointer"
            >
              Download Students CSV
            </button>
          </div>
          <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-3">
            <h4 className="font-black text-sm">Payments & UTR Ledger</h4>
            <p className="text-xs text-slate-500">Complete transaction audit trail with UTRs & review timestamps.</p>
            <button
              onClick={() => {
                downloadCsvFile(`ca_saathi_payments.csv`, exportPaymentsToCsv(paymentRequests));
                showToast('Payments CSV downloaded.');
              }}
              className="w-full py-2.5 rounded-xl bg-emerald-600 text-white font-bold text-xs cursor-pointer"
            >
              Download Payments CSV
            </button>
          </div>
          <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-3">
            <h4 className="font-black text-sm">Revenue Summary</h4>
            <p className="text-xs text-slate-500">Verified revenue totaling ₹{totalRevenue} across {approvedPayments.length} passes.</p>
            <button
              onClick={() => {
                downloadCsvFile(`ca_saathi_revenue.csv`, exportRevenueToCsv(paymentRequests));
                showToast('Revenue CSV downloaded.');
              }}
              className="w-full py-2.5 rounded-xl bg-purple-600 text-white font-bold text-xs cursor-pointer"
            >
              Download Revenue CSV
            </button>
          </div>
        </div>
      )}

      {/* TAB 7: AUDIT LOGS */}
      {adminTab === 'audit' && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200 dark:border-slate-800 space-y-4">
          <h3 className="font-black text-base">Administrative Audit Trail ({auditLogs.length})</h3>
          <div className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
            {auditLogs.map((log) => (
              <div key={log.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <span className="px-2 py-0.5 rounded bg-purple-100 text-purple-800 font-bold text-[10px] uppercase mr-2">
                    {log.action}
                  </span>
                  <span className="font-bold">{log.targetName || log.targetId}</span>
                  <p className="text-slate-500 text-[11px] mt-1">{log.details}</p>
                </div>
                <span className="font-mono text-slate-400 text-[10px]">
                  {new Date(log.timestamp).toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 8: EXAM CONFIG & UPI QR SETTINGS */}
      {adminTab === 'config' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <h3 className="font-black text-base flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-purple-600" />
                  <span>Exam Configuration (Firestore Live Sync)</span>
                </h3>
                <p className="text-xs text-slate-500">Updates active exam attempt & countdown globally across all clients.</p>
              </div>
              {countdownSavedNotice && <span className="text-xs font-bold text-emerald-600">Saved & Synced!</span>}
            </div>

            <form onSubmit={handleSaveExamCountdown} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block font-bold mb-1">Active Exam Attempt Label *</label>
                  <input
                    type="text"
                    required
                    value={countdownConfig.targetAttempt}
                    onChange={(e) => setCountdownConfig({ ...countdownConfig, targetAttempt: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold"
                  />
                </div>
                <div>
                  <label className="block font-bold mb-1">Exam Commencement Date & Time *</label>
                  <input
                    type="datetime-local"
                    required
                    value={countdownConfig.examDate ? countdownConfig.examDate.slice(0, 16) : ''}
                    onChange={(e) => setCountdownConfig({ ...countdownConfig, examDate: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono font-bold"
                  />
                </div>
              </div>

              <div className="p-3 rounded-xl bg-purple-50/50 dark:bg-purple-950/30 border border-purple-100 flex items-center gap-3">
                <input
                  type="checkbox"
                  id="chkVerified"
                  checked={countdownConfig.isDateVerified}
                  onChange={(e) => setCountdownConfig({ ...countdownConfig, isDateVerified: e.target.checked })}
                  className="w-4 h-4"
                />
                <label htmlFor="chkVerified" className="cursor-pointer">
                  <span className="font-bold block">Verified ICAI Exam Date</span>
                  <span className="text-[11px] text-slate-500">
                    Uncheck if ICAI official timetable is not yet released to prevent showing unverified dates.
                  </span>
                </label>
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={isSyncingCountdown}
                  className="px-5 py-2.5 rounded-xl bg-purple-600 text-white font-bold text-xs cursor-pointer"
                >
                  {isSyncingCountdown ? 'Syncing...' : 'Save & Sync Exam Config'}
                </button>
              </div>
            </form>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="font-black text-base flex items-center gap-2">
                <QrCode className="w-5 h-5 text-purple-600" />
                <span>Personal UPI QR Settings</span>
              </h3>
              {upiSavedNotice && <span className="text-xs font-bold text-emerald-600">Saved!</span>}
            </div>

            <div className="p-4 rounded-2xl bg-purple-50/50 dark:bg-purple-950/30 border border-purple-100 flex flex-col sm:flex-row items-center gap-4 text-xs">
              <img
                src={upiConfig.qrCodeImageUrl || '/original-upi-qr.png'}
                alt="Admin UPI QR"
                className="w-24 h-24 object-contain rounded-xl bg-white p-2 border shrink-0"
              />
              <div className="space-y-2 flex-1">
                <label className="px-3 py-1.5 rounded-xl bg-purple-600 text-white font-bold text-xs cursor-pointer inline-flex items-center gap-1.5">
                  <UploadCloud className="w-3.5 h-3.5" />
                  <span>Upload QR Image</span>
                  <input type="file" accept="image/*" onChange={handleQrUpload} className="hidden" />
                </label>
              </div>
            </div>

            <form onSubmit={handleSaveUpi} className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div>
                <label className="block font-bold mb-1">Admin UPI ID *</label>
                <input
                  type="text"
                  required
                  value={upiConfig.upiId}
                  onChange={(e) => setUpiConfig({ ...upiConfig, upiId: e.target.value.trim() })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono font-bold"
                />
              </div>
              <div>
                <label className="block font-bold mb-1">Account Name *</label>
                <input
                  type="text"
                  required
                  value={upiConfig.payeeName}
                  onChange={(e) => setUpiConfig({ ...upiConfig, payeeName: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-semibold"
                />
              </div>
              <div>
                <label className="block font-bold mb-1">Membership Fee (₹) *</label>
                <input
                  type="number"
                  min={1}
                  max={500}
                  value={upiConfig.defaultAmount}
                  onChange={(e) => setUpiConfig({ ...upiConfig, defaultAmount: Number(e.target.value) })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold"
                />
              </div>
              <div className="sm:col-span-3 flex justify-end">
                <button type="submit" className="px-4 py-2 rounded-xl bg-purple-600 text-white font-bold text-xs cursor-pointer">
                  Save & Sync UPI Settings
                </button>
              </div>
            </form>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="font-black text-base flex items-center gap-2">
                <Gift className="w-5 h-5 text-purple-600" />
                <span>Referral Rewards Policy</span>
              </h3>
              {referralSavedNotice && <span className="text-xs font-bold text-emerald-600">Saved!</span>}
            </div>
            <form onSubmit={handleSaveReferral} className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div>
                <label className="block font-bold mb-1">Points / Referral</label>
                <input
                  type="number"
                  value={referralConfig.pointsPerReferral}
                  onChange={(e) => setReferralConfig({ ...referralConfig, pointsPerReferral: Number(e.target.value) })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                />
              </div>
              <div>
                <label className="block font-bold mb-1">Welcome Bonus</label>
                <input
                  type="number"
                  value={referralConfig.welcomeBonusPoints}
                  onChange={(e) => setReferralConfig({ ...referralConfig, welcomeBonusPoints: Number(e.target.value) })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                />
              </div>
              <div>
                <label className="block font-bold mb-1">Redemption Points</label>
                <input
                  type="number"
                  value={referralConfig.passRedemptionCost}
                  onChange={(e) => setReferralConfig({ ...referralConfig, passRedemptionCost: Number(e.target.value) })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                />
              </div>
              <div className="sm:col-span-3 flex justify-end">
                <button type="submit" className="px-4 py-2 rounded-xl bg-purple-600 text-white font-bold text-xs cursor-pointer">
                  Save Referral Policy
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODALS */}
      {zoomedScreenshot && (
        <div className="fixed inset-0 z-60 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full p-4 relative">
            <button onClick={() => setZoomedScreenshot(null)} className="absolute top-3 right-3 text-slate-400 cursor-pointer">
              <X className="w-5 h-5" />
            </button>
            <img src={zoomedScreenshot} alt="Payment receipt" className="w-full max-h-[70vh] object-contain rounded-2xl" />
          </div>
        </div>
      )}

      {rejectingPaymentId && (
        <div className="fixed inset-0 z-60 bg-black/70 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 text-xs space-y-3">
            <h3 className="text-sm font-black text-rose-600">Reject Payment Claim</h3>
            <form onSubmit={handleConfirmReject} className="space-y-3">
              <textarea
                required
                rows={3}
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
              />
              <div className="flex justify-end gap-2">
                <button type="button" onClick={() => setRejectingPaymentId(null)} className="px-3 py-1.5 rounded-xl border">
                  Cancel
                </button>
                <button type="submit" className="px-4 py-1.5 rounded-xl bg-rose-600 text-white font-bold cursor-pointer">
                  Confirm Reject
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {selectedStudentForExpiry && (
        <div className="fixed inset-0 z-60 bg-black/70 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 text-xs space-y-3">
            <h3 className="text-sm font-black">Update Expiry: {selectedStudentForExpiry.name}</h3>
            <form onSubmit={handleSaveCustomExpiry} className="space-y-3">
              <input
                type="datetime-local"
                required
                value={customExpiryDate}
                onChange={(e) => setCustomExpiryDate(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
              />
              <div className="flex justify-end gap-2">
                <button type="button" onClick={() => setSelectedStudentForExpiry(null)} className="px-3 py-1.5 rounded-xl border">
                  Cancel
                </button>
                <button type="submit" className="px-4 py-1.5 rounded-xl bg-purple-600 text-white font-bold cursor-pointer">
                  Save Expiry
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {suspensionModalStudent && (
        <div className="fixed inset-0 z-60 bg-black/70 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 text-xs space-y-3">
            <h3 className="text-sm font-black text-rose-600">Suspend {suspensionModalStudent.name}</h3>
            <textarea
              rows={2}
              value={suspensionReasonText}
              onChange={(e) => setSuspensionReasonText(e.target.value)}
              className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
            />
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setSuspensionModalStudent(null)} className="px-3 py-1.5 rounded-xl border">
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleToggleSuspend(suspensionModalStudent)}
                className="px-4 py-1.5 rounded-xl bg-rose-600 text-white font-bold cursor-pointer"
              >
                Confirm Suspend
              </button>
            </div>
          </div>
        </div>
      )}

      {showAddChapterModal && (
        <div className="fixed inset-0 z-60 bg-black/70 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 text-xs space-y-3">
            <h3 className="text-sm font-black">Add Chapter ({contentPaperTab.toUpperCase()})</h3>
            <form onSubmit={handleCreateChapter} className="space-y-3">
              <input
                type="number"
                min={1}
                required
                value={newChapterNumber}
                onChange={(e) => setNewChapterNumber(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
              />
              <input
                type="text"
                required
                placeholder="Chapter Title (EN)"
                value={newChapterTitleEn}
                onChange={(e) => setNewChapterTitleEn(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
              />
              <input
                type="text"
                placeholder="Chapter Title (HI)"
                value={newChapterTitleHi}
                onChange={(e) => setNewChapterTitleHi(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
              />
              <div className="flex justify-end gap-2">
                <button type="button" onClick={() => setShowAddChapterModal(false)} className="px-3 py-1.5 rounded-xl border">
                  Cancel
                </button>
                <button type="submit" className="px-4 py-1.5 rounded-xl bg-purple-600 text-white font-bold cursor-pointer">
                  Create Chapter
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showAddQuestionModal && (
        <div className="fixed inset-0 z-60 bg-black/70 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-2xl w-full max-h-[85vh] overflow-y-auto p-6 text-xs space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-black">Add Verified ICAI MCQ</h3>
              <button onClick={() => setShowAddQuestionModal(false)} className="cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSaveQuestion} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <select
                  value={qPaperId}
                  onChange={(e) => setQPaperId(e.target.value as PaperId)}
                  className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                >
                  <option value="paper1">Paper 1: Accounting</option>
                  <option value="paper2">Paper 2: Business Laws</option>
                  <option value="paper3">Paper 3: Quantitative Aptitude</option>
                  <option value="paper4">Paper 4: Business Economics</option>
                </select>
                <select
                  value={qChapterId}
                  onChange={(e) => setQChapterId(e.target.value)}
                  className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                >
                  {subjectChapters
                    .filter((c) => c.paperId === qPaperId)
                    .map((c) => (
                      <option key={c.id} value={c.id}>
                        Ch {c.chapterNumber}: {c.title.en}
                      </option>
                    ))}
                </select>
              </div>
              <textarea
                rows={2}
                required
                placeholder="Question text (English)"
                value={qTextEn}
                onChange={(e) => setQTextEn(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
              />
              <div className="grid grid-cols-2 gap-2">
                <input
                  required
                  placeholder="Option A"
                  value={qOptAEn}
                  onChange={(e) => setQOptAEn(e.target.value)}
                  className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                />
                <input
                  required
                  placeholder="Option B"
                  value={qOptBEn}
                  onChange={(e) => setQOptBEn(e.target.value)}
                  className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                />
                <input
                  required
                  placeholder="Option C"
                  value={qOptCEn}
                  onChange={(e) => setQOptCEn(e.target.value)}
                  className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                />
                <input
                  required
                  placeholder="Option D"
                  value={qOptDEn}
                  onChange={(e) => setQOptDEn(e.target.value)}
                  className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <select
                  value={qCorrectIndex}
                  onChange={(e) => setQCorrectIndex(Number(e.target.value))}
                  className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                >
                  <option value={0}>Correct: Option A</option>
                  <option value={1}>Correct: Option B</option>
                  <option value={2}>Correct: Option C</option>
                  <option value={3}>Correct: Option D</option>
                </select>
                <input
                  value={qAttemptTag}
                  onChange={(e) => setQAttemptTag(e.target.value)}
                  className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                />
              </div>
              <input
                required
                placeholder="ICAI Source Citation"
                value={qSourceCitation}
                onChange={(e) => setQSourceCitation(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
              />
              <textarea
                rows={2}
                placeholder="Detailed Explanation"
                value={qExpEn}
                onChange={(e) => setQExpEn(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
              />
              <div className="flex justify-end gap-2">
                <button type="button" onClick={() => setShowAddQuestionModal(false)} className="px-4 py-2 rounded-xl border">
                  Cancel
                </button>
                <button type="submit" className="px-5 py-2 rounded-xl bg-purple-600 text-white font-bold cursor-pointer">
                  Save & Sync Question
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
