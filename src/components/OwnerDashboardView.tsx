import React, { useEffect, useMemo, useState } from 'react';
import {
  AnalyticsEvent,
  AppNotification,
  AuditLogEntry,
  CommunityPost,
  ExamCountdownConfig,
  ExamUpdate,
  Language,
  MCQQuestion,
  MaterialApprovalStatus,
  MaterialAttemptScope,
  MaterialCategory,
  ModerationReport,
  OwnerDashboardSection,
  PaperId,
  PaymentRequest,
  PricingConfig,
  QuestionSourceType,
  StudentProgressSnapshot,
  StudyNote,
  StudyPdfMaterial,
  StudyPresence,
  SubjectChapter,
  UpiConfig,
  UserProfile,
} from '../types';
import { CANONICAL_SYLLABUS, toSubjectChapters } from '../data/syllabusData';
import { PAPERS } from '../data/papersData';
import { MOCK_NOTES } from '../data/mockNotes';
import { canUserAccessAdmin, computeMembershipState } from '../utils/membershipRules';
import {
  buildReportBuckets,
  computeEngagementSummary,
  computeLiveSessionMinutes,
  computeOwnerOverviewMetrics,
  filterStudentsForOwner,
  formatPaperShortLabel,
  getRecentRegistrations,
  getRegisteredStudentsOnly,
  isPresenceFresh,
  ReportTimeframe,
  StudentFilterMode,
} from '../utils/ownerAnalytics';
import { auth } from '../firebase/config';
import {
  downloadCsvFile,
  exportPaymentsToCsv,
  exportRevenueToCsv,
  exportStudentsToCsv,
  getAllQuestions,
  saveExamCountdownConfig,
  saveUpiConfig,
} from '../utils/storageDb';
import {
  addAuditLogToDb,
  approveNoteMaterialInDb,
  approvePaymentRequestInDb,
  deleteCustomQuestionFromDb,
  deleteExamAnnouncementFromDb,
  deleteNoteMaterialInDb,
  deletePostFromDb,
  deleteReplyFromDb,
  deleteStudyMaterialFromDb,
  deleteSubjectChapterFromDb,
  fetchStudentProgressForAdmin,
  logoutUser,
  markNotificationReadInDb,
  publishExamAnnouncementToDb,
  rejectNoteMaterialInDb,
  rejectPaymentRequestInDb,
  replaceNoteMaterialPdf,
  resolveModerationReportInDb,
  saveCustomQuestionToDb,
  saveExamConfigToDb,
  saveStudyMaterialToDb,
  saveSubjectChapterToDb,
  saveUpiConfigToDb,
  sendAdminNotificationToDb,
  subscribeToAllNoteMaterialsForAdmin,
  subscribeToAllPaymentRequests,
  subscribeToAllStudents,
  subscribeToAnalyticsEvents,
  subscribeToAuditLogs,
  subscribeToCommunityPosts,
  subscribeToCustomQuestions,
  subscribeToModerationReports,
  subscribeToNotifications,
  subscribeToStudyMaterials,
  subscribeToStudyPresence,
  subscribeToSubjectChapters,
  togglePinPostInDb,
  toggleResolveDoubtInDb,
  toggleStudentUploadPermissionInDb,
  updateNoteMaterialMetaInDb,
  updateStudentStatusByAdmin,
  uploadPdfAndCreateNoteMaterial,
} from '../firebase/services';
import {
  MATERIAL_ATTEMPT_SCOPES,
  MATERIAL_CATEGORIES,
  MAX_PDF_SIZE_BYTES,
  computeMaterialOverviewCounts,
  filterStudyMaterialsHierarchy,
  formatFileSize,
  validatePdfMetadata,
} from '../utils/studyMaterials';
import { PdfReaderModal } from './PdfReaderModal';
import { playChimeSound } from '../utils/audio';
import {
  ArrowLeft,
  BarChart3,
  Bell,
  BookOpen,
  Calendar,
  Check,
  Clock,
  CreditCard,
  Download,
  Edit3,
  Eye,
  FileText,
  FileUp,
  Filter,
  IndianRupee,
  LayoutDashboard,
  LogOut,
  Menu,
  MessageSquare,
  Moon,
  Pin,
  Plus,
  QrCode,
  Radio,
  Search,
  Send,
  ShieldAlert,
  ShieldCheck,
  Sun,
  Trash2,
  Upload,
  Users,
  X,
} from 'lucide-react';

interface OwnerDashboardViewProps {
  language: Language;
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
  currentUser: UserProfile;
  isEmailVerified: boolean;
  onExitToStudentApp: () => void;
  examUpdates: ExamUpdate[];
  setExamUpdates: React.Dispatch<React.SetStateAction<ExamUpdate[]>>;
  pricingConfig: PricingConfig;
  countdownConfig: ExamCountdownConfig;
  setCountdownConfig: React.Dispatch<React.SetStateAction<ExamCountdownConfig>>;
  upiConfig: UpiConfig;
  setUpiConfig: React.Dispatch<React.SetStateAction<UpiConfig>>;
  subjectChapters: SubjectChapter[];
  setSubjectChapters: React.Dispatch<React.SetStateAction<SubjectChapter[]>>;
}

const SECTION_ITEMS: Array<{
  id: OwnerDashboardSection;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}> = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'payments', label: 'Payments', icon: CreditCard },
  { id: 'students', label: 'Students', icon: Users },
  { id: 'live_activity', label: 'Live Activity', icon: Radio },
  { id: 'content', label: 'Content Management', icon: BookOpen },
  { id: 'notes_management', label: 'Notes Management', icon: FileText },
  { id: 'groups', label: 'Group Management', icon: MessageSquare },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'analytics', label: 'Analytics', icon: BarChart3 },
];

export const OwnerDashboardView: React.FC<OwnerDashboardViewProps> = ({
  theme,
  onToggleTheme,
  currentUser,
  isEmailVerified,
  onExitToStudentApp,
  examUpdates,
  countdownConfig,
  setCountdownConfig,
  upiConfig,
  setUpiConfig,
  subjectChapters: propChapters,
  setSubjectChapters: setPropChapters,
}) => {
  const isAuthorizedOwner = canUserAccessAdmin(currentUser, isEmailVerified);

  const [activeSection, setActiveSection] = useState<OwnerDashboardSection>('overview');
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  // Strictly real Firestore data states (NO fake PRESET_USERS)
  const [usersList, setUsersList] = useState<UserProfile[]>([]);
  const [usersLoaded, setUsersLoaded] = useState(false);
  const [paymentsList, setPaymentsList] = useState<PaymentRequest[]>([]);
  const [presencesList, setPresencesList] = useState<StudyPresence[]>([]);
  const [analyticsEvents, setAnalyticsEvents] = useState<AnalyticsEvent[]>([]);
  const [notificationsList, setNotificationsList] = useState<AppNotification[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
  const [communityPosts, setCommunityPosts] = useState<CommunityPost[]>([]);
  const [moderationReports, setModerationReports] = useState<ModerationReport[]>([]);
  const [cloudQuestions, setCloudQuestions] = useState<MCQQuestion[]>([]);
  const [cloudChapters, setCloudChapters] = useState<SubjectChapter[]>(propChapters);
  const [cloudMaterials, setCloudMaterials] = useState<StudyNote[]>([]);
  const [pdfMaterials, setPdfMaterials] = useState<StudyPdfMaterial[]>([]);
  const [serverSessionStatus, setServerSessionStatus] = useState<'checking' | 'verified' | 'denied'>('checking');

  useEffect(() => {
    if (!isAuthorizedOwner) return;

    let cancelled = false;
    (async () => {
      try {
        const token = await auth.currentUser?.getIdToken();
        if (!token) {
          if (!cancelled) setServerSessionStatus('denied');
          return;
        }
        const resp = await fetch('/api/owner/session', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!cancelled) {
          setServerSessionStatus(resp.ok ? 'verified' : 'denied');
        }
      } catch {
        if (!cancelled) setServerSessionStatus('checking');
      }
    })();

    const unsubUsers = subscribeToAllStudents((list) => {
      setUsersList(list);
      setUsersLoaded(true);
    });
    const unsubPay = subscribeToAllPaymentRequests(setPaymentsList);
    const unsubPres = subscribeToStudyPresence(setPresencesList);
    const unsubAnalytics = subscribeToAnalyticsEvents(setAnalyticsEvents);
    const unsubNotifs = subscribeToNotifications('admin', setNotificationsList);
    const unsubLogs = subscribeToAuditLogs(setAuditLogs);
    const unsubPosts = subscribeToCommunityPosts(setCommunityPosts);
    const unsubReports = subscribeToModerationReports(setModerationReports);
    const unsubQs = subscribeToCustomQuestions(setCloudQuestions);
    const unsubChaps = subscribeToSubjectChapters((list) => {
      if (list.length > 0) {
        setCloudChapters(list);
        setPropChapters(list);
      }
    });
    const unsubMats = subscribeToStudyMaterials(setCloudMaterials);
    const unsubPdfMats = subscribeToAllNoteMaterialsForAdmin(setPdfMaterials);

    return () => {
      cancelled = true;
      unsubUsers();
      unsubPay();
      unsubPres();
      unsubAnalytics();
      unsubNotifs();
      unsubLogs();
      unsubPosts();
      unsubReports();
      unsubQs();
      unsubChaps();
      unsubMats();
      unsubPdfMats();
    };
  }, [isAuthorizedOwner, setPropChapters]);

  // Derived Real-Time Metrics
  const overviewMetrics = useMemo(
    () =>
      computeOwnerOverviewMetrics({
        users: usersList,
        payments: paymentsList,
        presences: presencesList,
        analyticsEvents,
      }),
    [usersList, paymentsList, presencesList, analyticsEvents]
  );

  const engagementSummary = useMemo(
    () =>
      computeEngagementSummary({
        users: usersList,
        analyticsEvents,
        presences: presencesList,
      }),
    [usersList, analyticsEvents, presencesList]
  );

  const unreadPaymentAlerts = useMemo(
    () => notificationsList.filter((n) => n.recipientId === 'admin' && n.type === 'payment_submitted' && !n.read),
    [notificationsList]
  );

  const materialOverviewCounts = useMemo(
    () => computeMaterialOverviewCounts(pdfMaterials),
    [pdfMaterials]
  );

  // ============================================================================
  // NOTES MANAGEMENT (ADMIN PDF UPLOAD / EDIT / REPLACE / APPROVAL WORKFLOW)
  // ============================================================================
  const canonicalAndCloudChapters = useMemo(
    () => (cloudChapters.length >= 46 ? cloudChapters : CANONICAL_SYLLABUS),
    [cloudChapters]
  );
  const [nmEditingTarget, setNmEditingTarget] = useState<StudyPdfMaterial | null>(null);
  const [nmTitle, setNmTitle] = useState('');
  const [nmPaperId, setNmPaperId] = useState<PaperId>('paper1');
  const nmPaperChapters = useMemo(
    () =>
      canonicalAndCloudChapters
        .filter((c) => c.paperId === nmPaperId)
        .sort((a, b) => a.chapterNumber - b.chapterNumber),
    [canonicalAndCloudChapters, nmPaperId]
  );
  const [nmChapterId, setNmChapterId] = useState('ch_p1_01');
  const [nmAttempt, setNmAttempt] = useState<MaterialAttemptScope>('January 2027');
  const [nmCategory, setNmCategory] = useState<MaterialCategory>('Chapter-wise Notes');
  const [nmDescription, setNmDescription] = useState('');
  const [nmFile, setNmFile] = useState<File | null>(null);
  const [nmSubmitting, setNmSubmitting] = useState(false);

  const [nmStatusFilter, setNmStatusFilter] = useState<'all' | MaterialApprovalStatus>('pending');
  const [nmPaperFilter, setNmPaperFilter] = useState<'all' | PaperId>('all');
  const [nmAttemptFilter, setNmAttemptFilter] = useState<'all' | MaterialAttemptScope>('all');
  const [nmCategoryFilter, setNmCategoryFilter] = useState<'all' | MaterialCategory>('all');
  const [nmRoleFilter, setNmRoleFilter] = useState<'all' | 'admin' | 'student'>('all');
  const [nmSearch, setNmSearch] = useState('');
  const [previewPdfMaterial, setPreviewPdfMaterial] = useState<StudyPdfMaterial | null>(null);
  const [rejectNoteTarget, setRejectNoteTarget] = useState<StudyPdfMaterial | null>(null);
  const [rejectNoteReason, setRejectNoteReason] = useState('');
  const [busyNoteId, setBusyNoteId] = useState<string | null>(null);

  const filteredAdminNotes = useMemo(
    () =>
      filterStudyMaterialsHierarchy(pdfMaterials, {
        status: nmStatusFilter,
        paperId: nmPaperFilter,
        attempt: nmAttemptFilter,
        category: nmCategoryFilter,
        uploaderRole: nmRoleFilter,
        search: nmSearch,
      }),
    [pdfMaterials, nmStatusFilter, nmPaperFilter, nmAttemptFilter, nmCategoryFilter, nmRoleFilter, nmSearch]
  );

  const resetNotesForm = () => {
    setNmEditingTarget(null);
    setNmTitle('');
    setNmPaperId('paper1');
    setNmChapterId('ch_p1_01');
    setNmAttempt('January 2027');
    setNmCategory('Chapter-wise Notes');
    setNmDescription('');
    setNmFile(null);
  };

  const handleSaveAdminPdfNote = async (e: React.FormEvent) => {
    e.preventDefault();
    const chObj = nmPaperChapters.find((c) => c.id === nmChapterId) || nmPaperChapters[0];
    if (!chObj) {
      showToast('Please select a syllabus chapter.', 'error');
      return;
    }

    const metaValidation = validatePdfMetadata({
      title: nmTitle,
      description: nmDescription,
      paperId: nmPaperId,
      chapterId: chObj.id,
      chapterNumber: chObj.chapterNumber,
      chapterTitle: chObj.title.en,
      attempt: nmAttempt,
      category: nmCategory,
    });

    if (!metaValidation.ok) {
      showToast(metaValidation.error, 'error');
      return;
    }

    if (!nmEditingTarget && !nmFile) {
      showToast('Please select a .PDF file to upload.', 'error');
      return;
    }

    if (nmFile && (nmFile.size <= 0 || nmFile.size > MAX_PDF_SIZE_BYTES || !nmFile.name.toLowerCase().endsWith('.pdf'))) {
      showToast('Only .PDF files up to 15 MB are permitted.', 'error');
      return;
    }

    setNmSubmitting(true);
    try {
      if (nmEditingTarget) {
        if (nmFile) {
          await replaceNoteMaterialPdf({ existing: nmEditingTarget, newFile: nmFile });
        }
        await updateNoteMaterialMetaInDb(nmEditingTarget.id, {
          title: metaValidation.clean.title,
          description: metaValidation.clean.description,
          paperId: metaValidation.clean.paperId as PaperId,
          chapterId: metaValidation.clean.chapterId,
          chapterNumber: metaValidation.clean.chapterNumber,
          chapterTitle: metaValidation.clean.chapterTitle,
          attempt: metaValidation.clean.attempt as MaterialAttemptScope,
          category: metaValidation.clean.category as MaterialCategory,
        });
        showToast(nmFile ? 'Updated study material metadata and replaced PDF file.' : 'Updated study material details.');
      } else if (nmFile) {
        await uploadPdfAndCreateNoteMaterial({
          file: nmFile,
          metadata: {
            title: metaValidation.clean.title,
            description: metaValidation.clean.description,
            paperId: metaValidation.clean.paperId as PaperId,
            chapterId: metaValidation.clean.chapterId,
            chapterNumber: metaValidation.clean.chapterNumber,
            chapterTitle: metaValidation.clean.chapterTitle,
            attempt: metaValidation.clean.attempt as MaterialAttemptScope,
            category: metaValidation.clean.category as MaterialCategory,
          },
          uploader: currentUser,
        });
        showToast('PDF study material uploaded and published to students.');
      }
      resetNotesForm();
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to save PDF note.', 'error');
    } finally {
      setNmSubmitting(false);
    }
  };

  const handleApproveNote = async (mat: StudyPdfMaterial) => {
    setBusyNoteId(mat.id);
    try {
      await approveNoteMaterialInDb(mat);
      playChimeSound('success');
      showToast(`Approved "${mat.title}" — now visible in Student Study Material Library.`);
    } catch {
      showToast('Failed to approve note submission.', 'error');
    } finally {
      setBusyNoteId(null);
    }
  };

  const handleConfirmRejectNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectNoteTarget) return;
    setBusyNoteId(rejectNoteTarget.id);
    try {
      await rejectNoteMaterialInDb(rejectNoteTarget, rejectNoteReason);
      playChimeSound('warning');
      showToast(`Rejected "${rejectNoteTarget.title}" and notified ${rejectNoteTarget.uploaderName}.`, 'info');
      setRejectNoteTarget(null);
      setRejectNoteReason('');
    } catch {
      showToast('Failed to reject note submission.', 'error');
    } finally {
      setBusyNoteId(null);
    }
  };

  const handleDeleteNoteMaterial = async (mat: StudyPdfMaterial) => {
    setBusyNoteId(mat.id);
    try {
      await deleteNoteMaterialInDb(mat);
      if (nmEditingTarget?.id === mat.id) resetNotesForm();
      showToast(`Deleted "${mat.title}".`, 'info');
    } catch {
      showToast('Failed to delete study material.', 'error');
    } finally {
      setBusyNoteId(null);
    }
  };

  // ============================================================================
  // PAYMENTS STATE & ACTIONS
  // ============================================================================
  const [paymentStatusFilter, setPaymentStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending');
  const [paymentSearch, setPaymentSearch] = useState('');
  const [inspectScreenshotUrl, setInspectScreenshotUrl] = useState<string | null>(null);
  const [rejectModalTarget, setRejectModalTarget] = useState<PaymentRequest | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [busyPaymentId, setBusyPaymentId] = useState<string | null>(null);

  const [upiIdInput, setUpiIdInput] = useState(upiConfig.upiId || 'ajeet345@ptyes');
  const [upiNameInput, setUpiNameInput] = useState(upiConfig.payeeName || 'Ajeet Patel');
  const [upiQrInput, setUpiQrInput] = useState(upiConfig.qrCodeImageUrl || '/owner-upi-qr.png');
  const [showUpiSettings, setShowUpiSettings] = useState(false);

  const filteredPayments = useMemo(() => {
    const q = paymentSearch.trim().toLowerCase();
    return paymentsList.filter((p) => {
      if (paymentStatusFilter !== 'all' && p.status !== paymentStatusFilter) return false;
      if (!q) return true;
      return (
        p.studentName.toLowerCase().includes(q) ||
        (p.studentEmail || '').toLowerCase().includes(q) ||
        (p.studentMobile || '').toLowerCase().includes(q) ||
        p.utr.toLowerCase().includes(q) ||
        (p.paymentReference || '').toLowerCase().includes(q)
      );
    });
  }, [paymentsList, paymentStatusFilter, paymentSearch]);

  const handleOneClickApprove = async (payment: PaymentRequest) => {
    setBusyPaymentId(payment.id);
    try {
      await approvePaymentRequestInDb(payment);
      playChimeSound('success');
      showToast(`Approved ₹${payment.amount} for ${payment.studentName} (+30 days unlocked)`);
    } catch {
      showToast('Failed to approve payment request.', 'error');
    } finally {
      setBusyPaymentId(null);
    }
  };

  const handleConfirmReject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectModalTarget) return;
    setBusyPaymentId(rejectModalTarget.id);
    try {
      await rejectPaymentRequestInDb(rejectModalTarget, rejectReason);
      playChimeSound('warning');
      showToast(`Rejected payment claim (${rejectModalTarget.utr})`, 'info');
      setRejectModalTarget(null);
      setRejectReason('');
    } catch {
      showToast('Failed to reject payment.', 'error');
    } finally {
      setBusyPaymentId(null);
    }
  };

  const handleSaveUpiConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    const updated: UpiConfig = {
      ...upiConfig,
      upiId: upiIdInput.trim() || 'ajeet345@ptyes',
      payeeName: upiNameInput.trim() || 'Ajeet Patel',
      qrCodeImageUrl: upiQrInput.trim() || '/owner-upi-qr.png',
    };
    saveUpiConfig(updated);
    setUpiConfig(updated);
    await saveUpiConfigToDb(updated);
    await addAuditLogToDb({
      action: 'Updated UPI QR Config',
      details: `UPI: ${updated.upiId} (${updated.payeeName})`,
      performedBy: currentUser.email,
      type: 'payment',
    });
    showToast('UPI QR & Payee details updated across all students.');
    setShowUpiSettings(false);
  };

  const handleUploadQrFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setUpiQrInput(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  // ============================================================================
  // STUDENTS STATE & PROGRESS DRAWER
  // ============================================================================
  const [studentSearch, setStudentSearch] = useState('');
  const [studentFilter, setStudentFilter] = useState<StudentFilterMode>('all');
  const [selectedStudent, setSelectedStudent] = useState<UserProfile | null>(null);
  const [studentProgress, setStudentProgress] = useState<StudentProgressSnapshot | null>(null);
  const [loadingProgress, setLoadingProgress] = useState(false);
  const [customExpiryDateInput, setCustomExpiryDateInput] = useState('');

  const registeredStudents = useMemo(() => getRegisteredStudentsOnly(usersList), [usersList]);

  const filteredStudents = useMemo(
    () =>
      filterStudentsForOwner({
        students: usersList,
        payments: paymentsList,
        query: studentSearch,
        filter: studentFilter,
      }),
    [usersList, paymentsList, studentSearch, studentFilter]
  );

  const openStudentDrawer = async (student: UserProfile) => {
    setSelectedStudent(student);
    setCustomExpiryDateInput(
      student.subscriptionExpiresAt ? student.subscriptionExpiresAt.slice(0, 10) : ''
    );
    setLoadingProgress(true);
    try {
      const snap = await fetchStudentProgressForAdmin(student.id);
      setStudentProgress(snap);
    } catch {
      setStudentProgress({ studySessions: [], testResults: [], chapterProgress: {} });
    } finally {
      setLoadingProgress(false);
    }
  };

  const handleExtendStudent30Days = async (student: UserProfile) => {
    const baseMs =
      student.subscriptionExpiresAt && new Date(student.subscriptionExpiresAt).getTime() > Date.now()
        ? new Date(student.subscriptionExpiresAt).getTime()
        : Date.now();
    const nextExpiry = new Date(baseMs + 30 * 86_400_000).toISOString();
    await updateStudentStatusByAdmin(
      student.id,
      {
        membershipStatus: 'active',
        hasPaidPass: true,
        subscriptionExpiresAt: nextExpiry,
        passExpiry: nextExpiry,
        isSuspended: false,
      },
      {
        action: 'Extended Membership +30d',
        details: `${student.name} unlocked until ${nextExpiry.slice(0, 10)}`,
        targetName: student.name,
      }
    );
    if (selectedStudent?.id === student.id) {
      setSelectedStudent((prev) =>
        prev
          ? {
              ...prev,
              membershipStatus: 'active',
              hasPaidPass: true,
              subscriptionExpiresAt: nextExpiry,
              isSuspended: false,
            }
          : null
      );
      setCustomExpiryDateInput(nextExpiry.slice(0, 10));
    }
    showToast(`Granted +30 days paid access to ${student.name}`);
  };

  const handleSetCustomExpiry = async () => {
    if (!selectedStudent || !customExpiryDateInput) return;
    const expiryIso = new Date(`${customExpiryDateInput}T23:59:59.000Z`).toISOString();
    const active = new Date(expiryIso).getTime() > Date.now();
    await updateStudentStatusByAdmin(
      selectedStudent.id,
      {
        membershipStatus: active ? 'active' : 'expired',
        hasPaidPass: active,
        subscriptionExpiresAt: expiryIso,
        passExpiry: expiryIso,
      },
      {
        action: 'Updated Custom Expiry',
        details: `${selectedStudent.name} set to ${customExpiryDateInput}`,
        targetName: selectedStudent.name,
      }
    );
    setSelectedStudent((prev) =>
      prev
        ? {
            ...prev,
            membershipStatus: active ? 'active' : 'expired',
            hasPaidPass: active,
            subscriptionExpiresAt: expiryIso,
          }
        : null
    );
    showToast(`Updated ${selectedStudent.name} expiry to ${customExpiryDateInput}`);
  };

  const handleRevokeMembership = async (student: UserProfile) => {
    await updateStudentStatusByAdmin(
      student.id,
      {
        membershipStatus: 'unpaid',
        hasPaidPass: false,
        subscriptionExpiresAt: '',
        passExpiry: '',
      },
      {
        action: 'Revoked Paid Access',
        details: `Removed paid membership from ${student.name}`,
        targetName: student.name,
      }
    );
    if (selectedStudent?.id === student.id) {
      setSelectedStudent((prev) =>
        prev ? { ...prev, membershipStatus: 'unpaid', hasPaidPass: false, subscriptionExpiresAt: '' } : null
      );
      setCustomExpiryDateInput('');
    }
    showToast(`Revoked paid access for ${student.name}`, 'info');
  };

  const handleToggleSuspendStudent = async (student: UserProfile) => {
    const nextSuspended = !student.isSuspended;
    await updateStudentStatusByAdmin(
      student.id,
      {
        isSuspended: nextSuspended,
        suspensionReason: nextSuspended ? 'Account suspended by Owner' : '',
      },
      {
        action: nextSuspended ? 'Suspended Student Account' : 'Reactivated Student Account',
        details: `${student.name} (${student.email})`,
        targetName: student.name,
      }
    );
    if (selectedStudent?.id === student.id) {
      setSelectedStudent((prev) => (prev ? { ...prev, isSuspended: nextSuspended } : null));
    }
    showToast(
      nextSuspended ? `Suspended ${student.name}` : `Reactivated ${student.name}`,
      nextSuspended ? 'info' : 'success'
    );
  };

  const handleToggleStudentUploadPermission = async (student: UserProfile) => {
    const nextAllow = student.canUploadNotes !== true;
    await toggleStudentUploadPermissionInDb(student, nextAllow);
    if (selectedStudent?.id === student.id) {
      setSelectedStudent((prev) => (prev ? { ...prev, canUploadNotes: nextAllow } : null));
    }
    showToast(
      nextAllow
        ? `Granted PDF notes upload permission to ${student.name}`
        : `Revoked PDF notes upload permission for ${student.name}`,
      nextAllow ? 'success' : 'info'
    );
  };

  // ============================================================================
  // LIVE ACTIVITY COMPUTATIONS
  // ============================================================================
  const freshLivePresences = useMemo(
    () =>
      presencesList
        .filter((p) => isPresenceFresh(p))
        .sort(
          (a, b) =>
            new Date(b.lastHeartbeatAt).getTime() - new Date(a.lastHeartbeatAt).getTime()
        ),
    [presencesList]
  );

  const todayIso = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const activeTodayStudents = useMemo(() => {
    const onlineIds = new Set(freshLivePresences.map((p) => p.userId));
    return registeredStudents.filter(
      (s) => onlineIds.has(s.id) || s.lastActiveDate === todayIso
    );
  }, [registeredStudents, freshLivePresences, todayIso]);

  // ============================================================================
  // CONTENT MANAGEMENT STATE & ACTIONS (QUESTIONS, PYQS, CHAPTERS, MATERIALS, EXAM CONFIG)
  // ============================================================================
  const [contentSubTab, setContentSubTab] = useState<'questions' | 'chapters' | 'materials' | 'exam'>('questions');
  const [contentPaperFilter, setContentPaperFilter] = useState<'all' | PaperId>('all');
  const [questionSourceFilter, setQuestionSourceFilter] = useState<'all' | QuestionSourceType>('all');
  const [questionSearch, setQuestionSearch] = useState('');

  // Merged Questions
  const allCombinedQuestions = useMemo(() => {
    const localQs = getAllQuestions();
    const map = new Map<string, MCQQuestion>();
    for (const q of localQs) map.set(q.id, q);
    for (const q of cloudQuestions) map.set(q.id, q);
    return Array.from(map.values());
  }, [cloudQuestions]);

  const cloudQuestionIds = useMemo(() => new Set(cloudQuestions.map((q) => q.id)), [cloudQuestions]);

  const filteredContentQuestions = useMemo(() => {
    const search = questionSearch.trim().toLowerCase();
    return allCombinedQuestions.filter((q) => {
      if (contentPaperFilter !== 'all' && q.paperId !== contentPaperFilter) return false;
      if (questionSourceFilter !== 'all' && q.sourceType !== questionSourceFilter) return false;
      if (!search) return true;
      return (
        q.question.en.toLowerCase().includes(search) ||
        q.chapterTitle.en.toLowerCase().includes(search) ||
        (q.examAttempt || '').toLowerCase().includes(search)
      );
    });
  }, [allCombinedQuestions, contentPaperFilter, questionSourceFilter, questionSearch]);

  // New/Edit Question form
  const [showQForm, setShowQForm] = useState(false);
  const [qPaperId, setQPaperId] = useState<PaperId>('paper1');
  const [qChapterId, setQChapterId] = useState('');
  const [qSourceType, setQSourceType] = useState<QuestionSourceType>('PYQ');
  const [qDifficulty, setQDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [qAttempt, setQAttempt] = useState('May 2025 PYQ');
  const [qPromptEn, setQPromptEn] = useState('');
  const [qOpt0, setQOpt0] = useState('');
  const [qOpt1, setQOpt1] = useState('');
  const [qOpt2, setQOpt2] = useState('');
  const [qOpt3, setQOpt3] = useState('');
  const [qCorrectIdx, setQCorrectIdx] = useState<number>(0);
  const [qExplanationEn, setQExplanationEn] = useState('');

  const handleCreateQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!qPromptEn.trim() || !qOpt0.trim() || !qOpt1.trim()) {
      showToast('Please fill question prompt and options.', 'error');
      return;
    }
    const chObj =
      cloudChapters.find((c) => c.id === qChapterId) ||
      cloudChapters.find((c) => c.paperId === qPaperId) ||
      CANONICAL_SYLLABUS[0];

    const newQ: MCQQuestion = {
      id: `q_owner_${Date.now()}`,
      paperId: qPaperId,
      chapterId: chObj.id,
      chapterTitle: chObj.title,
      difficulty: qDifficulty,
      question: { en: qPromptEn.trim(), hi: qPromptEn.trim() },
      options: {
        en: [qOpt0.trim(), qOpt1.trim(), qOpt2.trim() || 'None of the above', qOpt3.trim() || 'Both (a) & (b)'],
        hi: [qOpt0.trim(), qOpt1.trim(), qOpt2.trim() || 'इनमें से कोई नहीं', qOpt3.trim() || 'दोनों (a) व (b)'],
      },
      correctIndex: qCorrectIdx,
      explanation: { en: qExplanationEn.trim() || 'Verified ICAI reference explanation.', hi: qExplanationEn.trim() || 'आईसीएआई संदर्भ अनुसार।' },
      keyRule: { en: qSourceType === 'PYQ' ? `PYQ · ${qAttempt}` : 'ICAI Study Module', hi: qAttempt },
      sourceType: qSourceType,
      sourceLabel: { en: qSourceType === 'PYQ' ? `ICAI PYQ (${qAttempt})` : 'ICAI Study Material', hi: qAttempt },
      examAttempt: qAttempt,
      officialQuestionRef: `OWNER-${qPaperId.toUpperCase()}-${Date.now()}`,
      officialSourceLink: 'https://boslive.icai.org/',
    };

    await saveCustomQuestionToDb(newQ);
    await addAuditLogToDb({
      action: `Added ${qSourceType} Question`,
      details: `${qPaperId} · ${newQ.question.en.slice(0, 80)}`,
      performedBy: currentUser.email,
      type: 'content',
    });
    setQPromptEn('');
    setQOpt0('');
    setQOpt1('');
    setQOpt2('');
    setQOpt3('');
    setQExplanationEn('');
    setShowQForm(false);
    showToast(`${qSourceType} saved to Firestore and live for students.`);
  };

  // Chapter form
  const [chPaperId, setChPaperId] = useState<PaperId>('paper1');
  const [chNum, setChNum] = useState<number>(12);
  const [chTitleEn, setChTitleEn] = useState('');
  const [chTitleHi, setChTitleHi] = useState('');
  const [chWeightage, setChWeightage] = useState('10-15 Marks');

  const handleSaveChapter = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chTitleEn.trim()) return;
    const ch: SubjectChapter = {
      id: `ch_custom_${Date.now()}`,
      paperId: chPaperId,
      chapterNumber: chNum,
      title: { en: chTitleEn.trim(), hi: chTitleHi.trim() || chTitleEn.trim() },
      weightageMarks: chWeightage,
    };
    await saveSubjectChapterToDb(ch);
    setChTitleEn('');
    setChTitleHi('');
    showToast('Chapter saved to Firestore /subjectChapters');
  };

  const handleSyncCanonicalChapters = async () => {
    const canonical = toSubjectChapters();
    await Promise.all(canonical.map((c) => saveSubjectChapterToDb(c)));
    showToast(`Synced all ${canonical.length} canonical ICAI chapters to Firestore.`);
  };

  // Study Materials (Notes) CRUD
  const allMaterials = useMemo(() => {
    const map = new Map<string, StudyNote>();
    for (const n of MOCK_NOTES) map.set(n.id, n);
    for (const c of cloudMaterials) map.set(c.id, c);
    return Array.from(map.values());
  }, [cloudMaterials]);
  const cloudMaterialIds = useMemo(() => new Set(cloudMaterials.map((m) => m.id)), [cloudMaterials]);

  const [matPaperId, setMatPaperId] = useState<PaperId>('paper1');
  const [matChapterTitle, setMatChapterTitle] = useState('');
  const [matTopicTitle, setMatTopicTitle] = useState('');
  const [matReadMins, setMatReadMins] = useState<number>(5);
  const [matTagsText, setMatTagsText] = useState('Jan 2027, High Scoring');
  const [matSummary, setMatSummary] = useState('');
  const [matPointsText, setMatPointsText] = useState('');
  const [editingMaterialId, setEditingMaterialId] = useState<string | null>(null);

  const handleSaveMaterial = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!matChapterTitle.trim() || !matTopicTitle.trim() || !matSummary.trim()) {
      showToast('Chapter, Topic Title, and Summary are required.', 'error');
      return;
    }
    const id = editingMaterialId || `note_owner_${Date.now()}`;
    const points = matPointsText
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean)
      .map((line) => ({ en: line, hi: line }));

    const noteDoc: StudyNote = {
      id,
      paperId: matPaperId,
      chapterTitle: { en: matChapterTitle.trim(), hi: matChapterTitle.trim() },
      topicTitle: { en: matTopicTitle.trim(), hi: matTopicTitle.trim() },
      readTimeMinutes: Math.max(1, matReadMins),
      tags: matTagsText
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean),
      summary: { en: matSummary.trim(), hi: matSummary.trim() },
      keyPoints: points.length > 0 ? points : [{ en: matSummary.trim(), hi: matSummary.trim() }],
    };

    await saveStudyMaterialToDb(noteDoc);
    setEditingMaterialId(null);
    setMatChapterTitle('');
    setMatTopicTitle('');
    setMatSummary('');
    setMatPointsText('');
    showToast('Study material published to students in real time.');
  };

  // Exam Countdown config form
  const [examAttemptInput, setExamAttemptInput] = useState(countdownConfig.targetAttempt || 'January 2027');
  const [examDateInput, setExamDateInput] = useState((countdownConfig.examDate || '').slice(0, 16));
  const [examVerifiedInput, setExamVerifiedInput] = useState(Boolean(countdownConfig.isDateVerified));
  const [examNoteInput, setExamNoteInput] = useState(countdownConfig.adminAlertNote?.en || '');

  const handleSaveExamConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    const updated: ExamCountdownConfig = {
      examName: {
        en: `CA Foundation ${examAttemptInput.trim() || 'January 2027'}`,
        hi: `सीए फाउंडेशन ${examAttemptInput.trim() || 'जनवरी 2027'}`,
      },
      examDate: examDateInput ? new Date(examDateInput).toISOString() : '',
      targetAttempt: examAttemptInput.trim() || 'January 2027',
      isDateVerified: examVerifiedInput,
      adminAlertNote: {
        en: examNoteInput.trim(),
        hi: examNoteInput.trim(),
      },
    };
    saveExamCountdownConfig(updated);
    setCountdownConfig(updated);
    await saveExamConfigToDb(updated);
    await addAuditLogToDb({
      action: 'Updated Exam Configuration',
      details: `${updated.targetAttempt} · Date Verified: ${updated.isDateVerified}`,
      performedBy: currentUser.email,
      type: 'exam_config',
    });
    showToast('Exam attempt & countdown synced globally across all students.');
  };

  // ============================================================================
  // GROUP MANAGEMENT STATE & ACTIONS
  // ============================================================================
  const [groupSubTab, setGroupSubTab] = useState<'members' | 'messages' | 'reports'>('messages');
  const [groupMemberSearch, setGroupMemberSearch] = useState('');
  const [expandedPostRepliesId, setExpandedPostRepliesId] = useState<string | null>(null);

  const filteredGroupMembers = useMemo(() => {
    const q = groupMemberSearch.trim().toLowerCase();
    return registeredStudents.filter(
      (s) =>
        !q ||
        s.name.toLowerCase().includes(q) ||
        s.email.toLowerCase().includes(q) ||
        (s.city || '').toLowerCase().includes(q)
    );
  }, [registeredStudents, groupMemberSearch]);

  const pendingReportsCount = useMemo(
    () => moderationReports.filter((r) => r.status === 'pending').length,
    [moderationReports]
  );

  // ============================================================================
  // NOTIFICATIONS & ANNOUNCEMENTS STATE & ACTIONS
  // ============================================================================
  const [notifRecipient, setNotifRecipient] = useState<'all' | string>('all');
  const [notifType, setNotifType] = useState<AppNotification['type']>('broadcast');
  const [notifTitle, setNotifTitle] = useState('');
  const [notifMessage, setNotifMessage] = useState('');
  const [sendingNotif, setSendingNotif] = useState(false);

  const [annCategory, setAnnCategory] = useState<ExamUpdate['category']>('Exam Date');
  const [annTitle, setAnnTitle] = useState('');
  const [annSummary, setAnnSummary] = useState('');
  const [annImportant, setAnnImportant] = useState(true);

  const handleSendNotification = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!notifTitle.trim() || !notifMessage.trim()) return;
    setSendingNotif(true);
    try {
      await sendAdminNotificationToDb({
        recipientId: notifRecipient,
        title: notifTitle,
        message: notifMessage,
        type: notifType,
      });
      setNotifTitle('');
      setNotifMessage('');
      showToast(
        notifRecipient === 'all'
          ? 'Broadcast notification sent to all students.'
          : 'Notification sent to selected student.'
      );
    } catch {
      showToast('Failed to send notification.', 'error');
    } finally {
      setSendingNotif(false);
    }
  };

  const handlePublishAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!annTitle.trim() || !annSummary.trim()) return;
    await publishExamAnnouncementToDb({
      date: new Date().toISOString().slice(0, 10),
      category: annCategory,
      title: { en: annTitle.trim(), hi: annTitle.trim() },
      summary: { en: annSummary.trim(), hi: annSummary.trim() },
      detailedContent: { en: annSummary.trim(), hi: annSummary.trim() },
      isImportant: annImportant,
    });
    setAnnTitle('');
    setAnnSummary('');
    showToast('Official exam announcement published to student feed.');
  };

  // ============================================================================
  // ANALYTICS STATE
  // ============================================================================
  const [reportTimeframe, setReportTimeframe] = useState<ReportTimeframe>('daily');
  const reportBuckets = useMemo(
    () =>
      buildReportBuckets({
        timeframe: reportTimeframe,
        users: usersList,
        payments: paymentsList,
        analyticsEvents,
      }),
    [reportTimeframe, usersList, paymentsList, analyticsEvents]
  );

  // Security Defense in Depth: never render Owner Dashboard for non-owners
  if (!isAuthorizedOwner) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 text-center space-y-4 shadow-sm">
          <div className="w-12 h-12 rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <h1 className="text-lg font-bold text-slate-900 dark:text-white">
            403 · Private Owner Console
          </h1>
          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
            Access to the Owner Dashboard is strictly restricted to verified owner authentication.
          </p>
          <button
            type="button"
            onClick={onExitToStudentApp}
            className="w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold cursor-pointer"
          >
            Return to Student App
          </button>
        </div>
      </div>
    );
  }

  const maxNewUsers = Math.max(1, ...reportBuckets.map((b) => b.newUsers));
  const maxRevenue = Math.max(1, ...reportBuckets.map((b) => b.revenueInr));
  const maxVisits = Math.max(1, ...reportBuckets.map((b) => b.visits));

  const renderSidebarContent = () => (
    <div className="flex flex-col h-full bg-[#0B1739] text-slate-100">
      <div className="px-4 h-16 flex items-center justify-between border-b border-[#1E2F5C]">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-600 to-indigo-600 text-white flex items-center justify-center shrink-0 shadow-sm">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <div>
            <span className="font-extrabold text-sm text-white block leading-none tracking-tight">
              CA Saathi
            </span>
            <span className="text-[11px] font-semibold text-violet-300">
              Owner Console
            </span>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setMobileDrawerOpen(false)}
          className="lg:hidden p-1.5 rounded-lg text-slate-300 hover:bg-[#172854] cursor-pointer"
          aria-label="Close navigation menu"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto p-3 space-y-1" aria-label="Owner dashboard sections">
        {SECTION_ITEMS.map((item) => {
          const Icon = item.icon;
          const active = activeSection === item.id;
          const badge =
            item.id === 'payments' && overviewMetrics.pendingPaymentRequestsCount > 0
              ? overviewMetrics.pendingPaymentRequestsCount
              : item.id === 'notes_management' && materialOverviewCounts.pendingNotesCount > 0
                ? materialOverviewCounts.pendingNotesCount
                : item.id === 'groups' && pendingReportsCount > 0
                  ? pendingReportsCount
                  : item.id === 'notifications' && unreadPaymentAlerts.length > 0
                    ? unreadPaymentAlerts.length
                    : 0;

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                setActiveSection(item.id);
                setMobileDrawerOpen(false);
              }}
              className={`w-full flex items-center justify-between gap-2.5 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                active
                  ? 'bg-violet-600 text-white shadow-sm'
                  : 'text-slate-300 hover:bg-[#172854] hover:text-white'
              }`}
            >
              <span className="flex items-center gap-2.5 truncate">
                <Icon className={`w-4 h-4 shrink-0 ${active ? 'text-white' : 'text-slate-400'}`} />
                <span className="truncate">{item.label}</span>
              </span>
              {badge > 0 && (
                <span className="px-1.5 py-0.5 rounded-full bg-amber-500 text-white text-[10px] font-bold tabular-nums">
                  {badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      <div className="p-3 border-t border-[#1E2F5C] space-y-2">
        <div className="p-2.5 rounded-xl bg-[#13224A] border border-[#21366C] text-xs">
          <p className="font-semibold text-white truncate">{currentUser.name}</p>
          <p className="text-[11px] text-slate-300 truncate">{currentUser.email}</p>
          <span className="inline-block mt-1 text-[10px] font-semibold text-emerald-300">
            Free Owner Access Active
          </span>
        </div>

        <button
          type="button"
          onClick={onExitToStudentApp}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl border border-[#243B73] hover:bg-[#172854] text-slate-100 text-xs font-semibold cursor-pointer transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Student App View</span>
        </button>

        <button
          type="button"
          onClick={() => logoutUser()}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-rose-300 hover:bg-rose-950/40 text-xs font-semibold cursor-pointer transition-colors"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  );

  const currentSectionTitle = SECTION_ITEMS.find((s) => s.id === activeSection)?.label || 'Overview';

  return (
    <div className="min-h-screen bg-[#F7F8FC] dark:bg-[#080E21] text-[#0F1E46] dark:text-slate-100 flex font-sans">
      {/* Desktop Fixed Sidebar Rail */}
      <aside className="hidden lg:block w-64 shrink-0 bg-[#0B1739] border-r border-[#1E2F5C] sticky top-0 h-screen">
        {renderSidebarContent()}
      </aside>

      {/* Mobile Slide-Over Drawer */}
      {mobileDrawerOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div
            onClick={() => setMobileDrawerOpen(false)}
            className="fixed inset-0 bg-[#0B1739]/70 backdrop-blur-xs"
          />
          <aside className="relative z-10 w-68 max-w-[85vw] bg-[#0B1739] h-full border-r border-[#1E2F5C] shadow-2xl">
            {renderSidebarContent()}
          </aside>
        </div>
      )}

      {/* Main Content Workspace */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Crisp Single-Line Top Bar */}
        <header className="sticky top-0 z-30 h-16 bg-white/95 dark:bg-[#0F1936]/95 backdrop-blur-md border-b border-slate-200 dark:border-[#213059] px-4 sm:px-6 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setMobileDrawerOpen(true)}
              className="lg:hidden p-2 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 cursor-pointer"
              aria-label="Open owner sidebar"
            >
              <Menu className="w-4 h-4" />
            </button>
            <div className="min-w-0">
              <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400">
                <span>Private Owner Workspace</span>
                <span>/</span>
                <span className="text-indigo-600 dark:text-indigo-400 font-semibold truncate">
                  {currentSectionTitle}
                </span>
              </div>
              <h1 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white truncate">
                {currentSectionTitle}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {serverSessionStatus === 'verified' && (
              <span className="hidden md:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-[11px] font-semibold text-emerald-700 dark:text-emerald-300">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Server Verified</span>
              </span>
            )}
            <button
              type="button"
              onClick={onToggleTheme}
              aria-label="Toggle color theme"
              className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
            >
              {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
            </button>

            <button
              type="button"
              onClick={onExitToStudentApp}
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200 cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Student View</span>
            </button>
          </div>
        </header>

        {/* Inline Toast */}
        {toast && (
          <div className="px-4 sm:px-6 pt-4 max-w-7xl w-full mx-auto">
            <div
              className={`px-4 py-2.5 rounded-xl border text-xs font-semibold flex items-center justify-between gap-3 ${
                toast.type === 'error'
                  ? 'bg-rose-50 dark:bg-rose-950/50 border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200'
                  : toast.type === 'info'
                    ? 'bg-blue-50 dark:bg-blue-950/50 border-blue-200 dark:border-blue-800 text-blue-800 dark:text-blue-200'
                    : 'bg-emerald-50 dark:bg-emerald-950/50 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200'
              }`}
            >
              <span>{toast.message}</span>
              <button type="button" onClick={() => setToast(null)} className="cursor-pointer">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        <main className="flex-1 p-4 sm:p-6 max-w-7xl w-full mx-auto space-y-6">
          {/* ================================================================
              1. OVERVIEW SECTION
             ================================================================ */}
          {activeSection === 'overview' && (
            <div className="space-y-6">
              {/* 8 Primary Overview Metrics */}
              <div className="grid grid-cols-2 sm:grid-cols-4 xl:grid-cols-8 gap-3">
                {[
                  { label: 'Total Users', value: overviewMetrics.totalUsers, tone: 'text-slate-900 dark:text-white' },
                  { label: 'Registered Students', value: overviewMetrics.totalRegisteredStudents, tone: 'text-blue-700 dark:text-blue-400' },
                  { label: 'New Signups (7d)', value: overviewMetrics.newRegistrationsLast7Days, tone: 'text-indigo-700 dark:text-indigo-400' },
                  { label: 'Online Students', value: overviewMetrics.onlineStudents, tone: 'text-emerald-700 dark:text-emerald-400' },
                  { label: 'Active Students', value: overviewMetrics.activeStudents, tone: 'text-indigo-700 dark:text-indigo-400' },
                  { label: 'Paid Students', value: overviewMetrics.paidStudents, tone: 'text-emerald-700 dark:text-emerald-400' },
                  { label: 'Pending Students', value: overviewMetrics.pendingStudents, tone: 'text-amber-700 dark:text-amber-400' },
                  { label: 'Total Visitors', value: overviewMetrics.totalVisitors, tone: 'text-slate-900 dark:text-white' },
                ].map((kpi) => (
                  <div
                    key={kpi.label}
                    className="bg-white dark:bg-slate-900 rounded-xl p-4 border border-slate-200 dark:border-slate-800 shadow-2xs"
                  >
                    <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 block">
                      {kpi.label}
                    </span>
                    <span className={`text-2xl font-bold tabular-nums mt-1 block ${kpi.tone}`}>
                      {kpi.value}
                    </span>
                  </div>
                ))}
              </div>

              {/* Financial + Live Operations Strip */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-white dark:bg-slate-900 rounded-xl p-4 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                  <div>
                    <span className="text-xs text-slate-500 dark:text-slate-400 block">Total Approved Revenue</span>
                    <span className="text-xl font-bold text-slate-900 dark:text-white tabular-nums mt-0.5 block">
                      ₹{overviewMetrics.totalRevenueInr}
                    </span>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400 tabular-nums">
                      {overviewMetrics.totalApprovedPaymentsCount} verified approvals
                    </span>
                  </div>
                  <IndianRupee className="w-6 h-6 text-emerald-600 dark:text-emerald-400 shrink-0" />
                </div>

                <div className="bg-white dark:bg-slate-900 rounded-xl p-4 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                  <div>
                    <span className="text-xs text-slate-500 dark:text-slate-400 block">Pending Verifications</span>
                    <span className="text-xl font-bold text-amber-600 dark:text-amber-400 tabular-nums mt-0.5 block">
                      {overviewMetrics.pendingPaymentRequestsCount + materialOverviewCounts.pendingNotesCount}
                    </span>
                    <div className="flex items-center gap-3 mt-0.5">
                      <button
                        type="button"
                        onClick={() => setActiveSection('payments')}
                        className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
                      >
                        {overviewMetrics.pendingPaymentRequestsCount} Payments &rarr;
                      </button>
                      <button
                        type="button"
                        onClick={() => setActiveSection('notes_management')}
                        className="text-[11px] font-semibold text-violet-600 dark:text-violet-400 hover:underline cursor-pointer"
                      >
                        {materialOverviewCounts.pendingNotesCount} Notes &rarr;
                      </button>
                    </div>
                  </div>
                  <Clock className="w-6 h-6 text-amber-500 shrink-0" />
                </div>

                <div className="bg-white dark:bg-slate-900 rounded-xl p-4 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                  <div>
                    <span className="text-xs text-slate-500 dark:text-slate-400 block">Currently Studying Now</span>
                    <span className="text-xl font-bold text-blue-600 dark:text-blue-400 tabular-nums mt-0.5 block">
                      {overviewMetrics.currentlyStudyingCount}
                    </span>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400 tabular-nums">
                      DAU today: {overviewMetrics.dailyActiveUsers}
                    </span>
                  </div>
                  <Radio className="w-6 h-6 text-blue-600 dark:text-blue-400 shrink-0" />
                </div>
              </div>

              {/* Exam Attempt & Notes Library Overview Cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                <div className="bg-white dark:bg-slate-900 rounded-xl p-4 border border-slate-200 dark:border-slate-800">
                  <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 block">
                    January 2027 Students
                  </span>
                  <span className="text-xl font-extrabold text-[#172554] dark:text-violet-300 tabular-nums mt-1 block">
                    {overviewMetrics.jan2027Students}
                  </span>
                </div>
                <div className="bg-white dark:bg-slate-900 rounded-xl p-4 border border-slate-200 dark:border-slate-800">
                  <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 block">
                    May 2027 Students
                  </span>
                  <span className="text-xl font-extrabold text-violet-700 dark:text-violet-400 tabular-nums mt-1 block">
                    {overviewMetrics.may2027Students}
                  </span>
                </div>
                <div className="bg-white dark:bg-slate-900 rounded-xl p-4 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                  <div>
                    <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 block">
                      Total Uploaded Notes (PDF)
                    </span>
                    <span className="text-xl font-extrabold text-slate-900 dark:text-white tabular-nums mt-1 block">
                      {materialOverviewCounts.totalUploadedNotes}
                    </span>
                    <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">
                      {materialOverviewCounts.approvedNotesCount} live · {materialOverviewCounts.pendingNotesCount} pending
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveSection('notes_management')}
                    className="px-2.5 py-1 rounded-lg bg-violet-50 dark:bg-violet-950/60 text-violet-700 dark:text-violet-300 text-[11px] font-bold cursor-pointer"
                  >
                    Manage
                  </button>
                </div>
                <div className="bg-white dark:bg-slate-900 rounded-xl p-4 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                  <div>
                    <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 block">
                      Upload Permission Granted
                    </span>
                    <span className="text-xl font-extrabold text-indigo-700 dark:text-indigo-400 tabular-nums mt-1 block">
                      {overviewMetrics.uploadPermittedStudents}
                    </span>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400">
                      Students enabled
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setActiveSection('students');
                      setStudentFilter('uploaders');
                    }}
                    className="px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 text-[11px] font-semibold cursor-pointer"
                  >
                    View
                  </button>
                </div>
              </div>

              {/* Actionable Pending Payments + Live Studying Snapshots */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <section className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                      Pending Payment Requests ({overviewMetrics.pendingPaymentRequestsCount})
                    </h2>
                    <button
                      type="button"
                      onClick={() => setActiveSection('payments')}
                      className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
                    >
                      Manage All &rarr;
                    </button>
                  </div>

                  {paymentsList.filter((p) => p.status === 'pending').length === 0 ? (
                    <p className="text-xs text-slate-500 dark:text-slate-400 py-6 text-center border border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
                      No pending ₹5 payment verifications right now.
                    </p>
                  ) : (
                    <div className="space-y-2.5">
                      {paymentsList
                        .filter((p) => p.status === 'pending')
                        .slice(0, 4)
                        .map((p) => (
                          <div
                            key={p.id}
                            className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3 text-xs"
                          >
                            <div className="min-w-0">
                              <p className="font-bold text-slate-900 dark:text-white truncate">{p.studentName}</p>
                              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono truncate">
                                UTR: {p.utr} · ₹{p.amount} · {p.studentMobile}
                              </p>
                            </div>
                            <button
                              type="button"
                              disabled={busyPaymentId === p.id}
                              onClick={() => handleOneClickApprove(p)}
                              className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold cursor-pointer shrink-0 disabled:opacity-60"
                            >
                              {busyPaymentId === p.id ? 'Saving...' : 'Approve'}
                            </button>
                          </div>
                        ))}
                    </div>
                  )}
                </section>

                <section className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                      Students Currently Studying ({freshLivePresences.length})
                    </h2>
                    <button
                      type="button"
                      onClick={() => setActiveSection('live_activity')}
                      className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
                    >
                      Live Room &rarr;
                    </button>
                  </div>

                  {freshLivePresences.length === 0 ? (
                    <p className="text-xs text-slate-500 dark:text-slate-400 py-6 text-center border border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
                      No active live study sessions detected in the last 3 minutes.
                    </p>
                  ) : (
                    <div className="space-y-2.5">
                      {freshLivePresences.slice(0, 4).map((peer) => (
                        <div
                          key={peer.userId}
                          className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3 text-xs"
                        >
                          <div className="min-w-0">
                            <p className="font-semibold text-slate-900 dark:text-white truncate">
                              {peer.avatar} {peer.displayName}
                            </p>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                              {formatPaperShortLabel(peer.activePaperId)} · {peer.activeTopic || 'Studying'}
                            </p>
                          </div>
                          <span className="font-mono text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 tabular-nums shrink-0">
                            {computeLiveSessionMinutes(peer)}m live
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </section>
              </div>

              {/* Recent Student Registrations */}
              <section className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                      Recent Student Registrations
                    </h2>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      {overviewMetrics.newRegistrationsToday} today · {overviewMetrics.newRegistrationsLast7Days} in the last 7 days
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveSection('students')}
                    className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
                  >
                    All Students &rarr;
                  </button>
                </div>

                {getRecentRegistrations(usersList, 5).length === 0 ? (
                  <p className="text-xs text-slate-500 dark:text-slate-400 py-5 text-center border border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
                    No student registrations synced yet.
                  </p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5">
                    {getRecentRegistrations(usersList, 6).map((st) => {
                      const mem = computeMembershipState(st, paymentsList);
                      return (
                        <div
                          key={st.id}
                          className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2 text-xs"
                        >
                          <div className="min-w-0">
                            <p className="font-semibold text-slate-900 dark:text-white truncate">
                              {st.avatar || '🎓'} {st.name}
                            </p>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                              {st.email} · {st.createdAt || 'Recent'}
                            </p>
                          </div>
                          <span
                            className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase shrink-0 ${
                              mem.status === 'active'
                                ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300'
                                : mem.status === 'pending'
                                  ? 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300'
                                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                            }`}
                          >
                            {mem.status}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </section>
            </div>
          )}

          {/* ================================================================
              2. PAYMENTS SECTION
             ================================================================ */}
          {activeSection === 'payments' && (
            <div className="space-y-5">
              {/* Top Stats + Actions */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                <div className="bg-white dark:bg-slate-900 rounded-xl p-4 border border-slate-200 dark:border-slate-800">
                  <span className="text-xs text-slate-500 dark:text-slate-400">Pending Requests</span>
                  <span className="text-2xl font-bold text-amber-600 dark:text-amber-400 tabular-nums block mt-1">
                    {overviewMetrics.pendingPaymentRequestsCount}
                  </span>
                </div>
                <div className="bg-white dark:bg-slate-900 rounded-xl p-4 border border-slate-200 dark:border-slate-800">
                  <span className="text-xs text-slate-500 dark:text-slate-400">Approved Payments</span>
                  <span className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 tabular-nums block mt-1">
                    {overviewMetrics.totalApprovedPaymentsCount}
                  </span>
                </div>
                <div className="bg-white dark:bg-slate-900 rounded-xl p-4 border border-slate-200 dark:border-slate-800">
                  <span className="text-xs text-slate-500 dark:text-slate-400">Total Collected Revenue</span>
                  <span className="text-2xl font-bold text-slate-900 dark:text-white tabular-nums block mt-1">
                    ₹{overviewMetrics.totalRevenueInr}
                  </span>
                </div>
                <div className="bg-white dark:bg-slate-900 rounded-xl p-4 border border-slate-200 dark:border-slate-800">
                  <span className="text-xs text-slate-500 dark:text-slate-400">Rejected Claims</span>
                  <span className="text-2xl font-bold text-rose-600 dark:text-rose-400 tabular-nums block mt-1">
                    {overviewMetrics.rejectedPaymentRequestsCount}
                  </span>
                </div>
              </div>

              {/* Toolbar & UPI QR Config Trigger */}
              <div className="bg-white dark:bg-slate-900 rounded-xl p-4 border border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-2">
                  {(['pending', 'approved', 'rejected', 'all'] as const).map((st) => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => setPaymentStatusFilter(st)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize cursor-pointer ${
                        paymentStatusFilter === st
                          ? 'bg-indigo-600 text-white'
                          : 'border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                      }`}
                    >
                      {st}
                    </button>
                  ))}
                </div>

                <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                  <div className="relative w-full sm:w-52">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={paymentSearch}
                      onChange={(e) => setPaymentSearch(e.target.value)}
                      placeholder="Search UTR, name, mobile..."
                      className="pl-8 pr-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs w-full focus:outline-indigo-500"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowUpiSettings(!showUpiSettings)}
                    className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                  >
                    <QrCode className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                    <span>UPI & QR Settings</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => downloadCsvFile(`ca_saathi_payments_${todayIso}.csv`, exportPaymentsToCsv(paymentsList))}
                    className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Export CSV</span>
                  </button>
                </div>
              </div>

              {/* Optional Collapsible UPI QR Settings */}
              {showUpiSettings && (
                <form
                  onSubmit={handleSaveUpiConfig}
                  className="bg-white dark:bg-slate-900 rounded-xl p-5 border border-indigo-200 dark:border-indigo-800 space-y-4"
                >
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <QrCode className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                      <span>Personal UPI ID & QR Configuration</span>
                    </h3>
                    <button
                      type="button"
                      onClick={() => setShowUpiSettings(false)}
                      className="text-xs text-slate-500 hover:text-slate-800 cursor-pointer"
                    >
                      Close
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                    <div>
                      <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                        UPI ID
                      </label>
                      <input
                        type="text"
                        value={upiIdInput}
                        onChange={(e) => setUpiIdInput(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                        Account Name
                      </label>
                      <input
                        type="text"
                        value={upiNameInput}
                        onChange={(e) => setUpiNameInput(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                        Upload New QR Image (optional)
                      </label>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleUploadQrFile}
                        className="w-full text-xs text-slate-600 dark:text-slate-300 file:mr-2 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:bg-indigo-50 file:text-indigo-700 file:font-semibold"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-2">
                    <button
                      type="submit"
                      className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold cursor-pointer"
                    >
                      Save UPI Settings to Firestore
                    </button>
                  </div>
                </form>
              )}

              {/* Payment Requests & History Table */}
              <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
                {filteredPayments.length === 0 ? (
                  <p className="text-xs text-slate-500 dark:text-slate-400 p-8 text-center">
                    No payment requests found matching this filter.
                  </p>
                ) : (
                  <div className="divide-y divide-slate-200 dark:divide-slate-800">
                    {filteredPayments.map((p) => (
                      <div
                        key={p.id}
                        className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-50/70 dark:hover:bg-slate-800/30"
                      >
                        <div className="flex items-start gap-3 min-w-0">
                          {p.screenshotUrl ? (
                            <button
                              type="button"
                              onClick={() => setInspectScreenshotUrl(p.screenshotUrl)}
                              className="w-14 h-14 rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden shrink-0 cursor-pointer relative group"
                              title="Click to inspect payment screenshot"
                            >
                              <img
                                src={p.screenshotUrl}
                                alt={`Payment proof from ${p.studentName}`}
                                className="w-full h-full object-cover"
                              />
                            </button>
                          ) : (
                            <div className="w-14 h-14 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-[10px] text-slate-400 shrink-0">
                              No Img
                            </div>
                          )}

                          <div className="min-w-0 space-y-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="font-bold text-sm text-slate-900 dark:text-white">
                                {p.studentName}
                              </span>
                              <span
                                className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                                  p.status === 'approved'
                                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                                    : p.status === 'rejected'
                                      ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                                      : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                                }`}
                              >
                                {p.status}
                              </span>
                              <span className="text-xs font-bold text-slate-900 dark:text-white tabular-nums">
                                ₹{p.amount}
                              </span>
                            </div>
                            <p className="text-xs text-slate-600 dark:text-slate-300 font-mono">
                              UTR: <strong>{p.utr}</strong> · Mobile: {p.studentMobile}
                              {p.paymentReference ? ` · Ref: ${p.paymentReference}` : ''}
                            </p>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400">
                              {p.studentEmail} · Submitted {new Date(p.createdAt).toLocaleString()}
                              {p.unlockedUntil ? ` · Active until ${p.unlockedUntil.slice(0, 10)}` : ''}
                            </p>
                            {p.adminNotes && (
                              <p className="text-[11px] text-slate-600 dark:text-slate-300 italic">
                                Note: {p.adminNotes}
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-2 shrink-0">
                          {p.screenshotUrl && (
                            <button
                              type="button"
                              onClick={() => setInspectScreenshotUrl(p.screenshotUrl)}
                              className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-1 cursor-pointer"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span>Screenshot</span>
                            </button>
                          )}

                          {p.status !== 'approved' && (
                            <button
                              type="button"
                              disabled={busyPaymentId === p.id}
                              onClick={() => handleOneClickApprove(p)}
                              className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center gap-1 cursor-pointer disabled:opacity-60"
                            >
                              <Check className="w-3.5 h-3.5" />
                              <span>Approve (+30d)</span>
                            </button>
                          )}

                          {p.status === 'pending' && (
                            <button
                              type="button"
                              disabled={busyPaymentId === p.id}
                              onClick={() => {
                                setRejectModalTarget(p);
                                setRejectReason('UTR could not be matched with UPI statement.');
                              }}
                              className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold flex items-center gap-1 cursor-pointer disabled:opacity-60"
                            >
                              <X className="w-3.5 h-3.5" />
                              <span>Reject</span>
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ================================================================
              3. STUDENTS SECTION
             ================================================================ */}
          {activeSection === 'students' && (
            <div className="space-y-4">
              {/* Filter & Search Toolbar */}
              <div className="bg-white dark:bg-slate-900 rounded-xl p-4 border border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-1.5">
                  {(
                    [
                      { id: 'all', label: `All (${registeredStudents.length})` },
                      { id: 'active', label: `Paid (${overviewMetrics.paidStudents})` },
                      { id: 'pending', label: `Pending (${overviewMetrics.pendingStudents})` },
                      { id: 'unpaid', label: `Unpaid (${overviewMetrics.unpaidStudents})` },
                      { id: 'expired', label: `Expired (${overviewMetrics.expiredStudents})` },
                      { id: 'suspended', label: `Suspended (${overviewMetrics.suspendedStudents})` },
                      { id: 'uploaders', label: `Upload Permitted (${overviewMetrics.uploadPermittedStudents})` },
                    ] as Array<{ id: StudentFilterMode; label: string }>
                  ).map((f) => (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => setStudentFilter(f.id)}
                      className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold cursor-pointer ${
                        studentFilter === f.id
                          ? 'bg-indigo-600 text-white'
                          : 'border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                      }`}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>

                <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                  <div className="relative w-full sm:w-56">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={studentSearch}
                      onChange={(e) => setStudentSearch(e.target.value)}
                      placeholder="Search student, email, mobile..."
                      className="pl-8 pr-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs w-full focus:outline-indigo-500"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => downloadCsvFile(`ca_saathi_students_${todayIso}.csv`, exportStudentsToCsv(registeredStudents))}
                    className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Export CSV</span>
                  </button>
                </div>
              </div>

              {/* Registered Students Table */}
              <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-x-auto">
                {!usersLoaded ? (
                  <p className="text-xs text-slate-500 dark:text-slate-400 p-8 text-center">
                    Loading real student profiles from Firestore...
                  </p>
                ) : filteredStudents.length === 0 ? (
                  <p className="text-xs text-slate-500 dark:text-slate-400 p-8 text-center">
                    No registered students match the current search or filter.
                  </p>
                ) : (
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 text-slate-500 dark:text-slate-400">
                        <th className="py-3 px-4 font-semibold">Student</th>
                        <th className="py-3 px-4 font-semibold">Contact & Attempt</th>
                        <th className="py-3 px-4 font-semibold">Study Progress</th>
                        <th className="py-3 px-4 font-semibold">Membership</th>
                        <th className="py-3 px-4 font-semibold">Notes Upload</th>
                        <th className="py-3 px-4 font-semibold text-right">Access Controls</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                      {filteredStudents.map((s) => {
                        const state = computeMembershipState(s, paymentsList);
                        return (
                          <tr key={s.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/30">
                            <td className="py-3 px-4">
                              <p className="font-bold text-slate-900 dark:text-white">
                                {s.avatar || '🎓'} {s.name}
                              </p>
                              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                                {s.email}
                              </p>
                            </td>
                            <td className="py-3 px-4">
                              <p className="font-mono text-slate-700 dark:text-slate-300">
                                {s.phone || 'No mobile'}
                              </p>
                              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                                {s.targetAttempt} · {s.city || 'India'}
                              </p>
                            </td>
                            <td className="py-3 px-4 tabular-nums">
                              <p className="font-semibold text-slate-800 dark:text-slate-200">
                                {s.studyMinutesTotal || 0} min · {s.totalQuestionsAttempted || 0} MCQs
                              </p>
                              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                                Streak: {s.studyStreak || 0}d · Active: {s.lastActiveDate || '—'}
                              </p>
                            </td>
                            <td className="py-3 px-4">
                              {s.isSuspended ? (
                                <span className="px-2 py-0.5 rounded-full bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-300 text-[10px] font-bold">
                                  SUSPENDED
                                </span>
                              ) : (
                                <span
                                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                                    state.status === 'active'
                                      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                                      : state.status === 'pending'
                                        ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                                        : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                                  }`}
                                >
                                  {state.status} {state.daysLeft > 0 ? `(${state.daysLeft}d)` : ''}
                                </span>
                              )}
                            </td>
                            <td className="py-3 px-4">
                              <button
                                type="button"
                                onClick={() => handleToggleStudentUploadPermission(s)}
                                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-colors cursor-pointer ${
                                  s.canUploadNotes === true
                                    ? 'bg-violet-600 text-white border-violet-600'
                                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                                }`}
                                title="Toggle student permission to upload PDF notes for review"
                              >
                                {s.canUploadNotes === true ? 'Allowed (ON)' : 'Disabled (OFF)'}
                              </button>
                            </td>
                            <td className="py-3 px-4 text-right">
                              <div className="inline-flex items-center gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => openStudentDrawer(s)}
                                  className="px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 font-semibold text-slate-700 dark:text-slate-200 cursor-pointer"
                                >
                                  Progress & Edit
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleExtendStudent30Days(s)}
                                  className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold cursor-pointer"
                                >
                                  +30d
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleToggleSuspendStudent(s)}
                                  className={`px-2.5 py-1 rounded-lg font-semibold cursor-pointer ${
                                    s.isSuspended
                                      ? 'bg-blue-600 hover:bg-blue-700 text-white'
                                      : 'border border-rose-200 dark:border-rose-800 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40'
                                  }`}
                                >
                                  {s.isSuspended ? 'Activate' : 'Suspend'}
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          )}

          {/* ================================================================
              4. LIVE ACTIVITY SECTION
             ================================================================ */}
          {activeSection === 'live_activity' && (
            <div className="space-y-5">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                <div className="bg-white dark:bg-slate-900 rounded-xl p-4 border border-slate-200 dark:border-slate-800">
                  <span className="text-xs text-slate-500 dark:text-slate-400">Online Students</span>
                  <span className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 tabular-nums block mt-1">
                    {overviewMetrics.onlineStudents}
                  </span>
                </div>
                <div className="bg-white dark:bg-slate-900 rounded-xl p-4 border border-slate-200 dark:border-slate-800">
                  <span className="text-xs text-slate-500 dark:text-slate-400">Currently Studying Live</span>
                  <span className="text-2xl font-bold text-blue-600 dark:text-blue-400 tabular-nums block mt-1">
                    {freshLivePresences.length}
                  </span>
                </div>
                <div className="bg-white dark:bg-slate-900 rounded-xl p-4 border border-slate-200 dark:border-slate-800">
                  <span className="text-xs text-slate-500 dark:text-slate-400">Active Room Duration</span>
                  <span className="text-2xl font-bold text-slate-900 dark:text-white tabular-nums block mt-1">
                    {overviewMetrics.liveStudyDurationMinutes} min
                  </span>
                </div>
                <div className="bg-white dark:bg-slate-900 rounded-xl p-4 border border-slate-200 dark:border-slate-800">
                  <span className="text-xs text-slate-500 dark:text-slate-400">Daily Active Users (DAU)</span>
                  <span className="text-2xl font-bold text-indigo-600 dark:text-indigo-400 tabular-nums block mt-1">
                    {overviewMetrics.dailyActiveUsers}
                  </span>
                </div>
              </div>

              {/* Live Studying Stream */}
              <section className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 space-y-3">
                <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Radio className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span>Currently Studying Students (Real-Time Heartbeat)</span>
                </h2>
                {freshLivePresences.length === 0 ? (
                  <p className="text-xs text-slate-500 dark:text-slate-400 py-6 text-center border border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
                    No students currently in an active practice, mock test, or study room session.
                  </p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {freshLivePresences.map((p) => (
                      <div
                        key={p.userId}
                        className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3 text-xs"
                      >
                        <div className="space-y-0.5 min-w-0">
                          <p className="font-bold text-slate-900 dark:text-white truncate">
                            {p.avatar} {p.displayName}
                          </p>
                          <p className="text-[11px] text-slate-600 dark:text-slate-300 truncate">
                            {formatPaperShortLabel(p.activePaperId)} · {p.activeTopic}
                          </p>
                          <p className="text-[10px] text-slate-400">
                            Attempt: {p.targetAttempt} · Last ping {new Date(p.lastHeartbeatAt).toLocaleTimeString()}
                          </p>
                        </div>
                        <span className="px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-bold tabular-nums shrink-0">
                          {computeLiveSessionMinutes(p)} min
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </section>

              {/* Today's Active Students Table */}
              <section className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 space-y-3">
                <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                  Students Active Today ({activeTodayStudents.length})
                </h2>
                {activeTodayStudents.length === 0 ? (
                  <p className="text-xs text-slate-500 dark:text-slate-400 py-6 text-center">
                    No student login or study telemetry recorded today ({todayIso}).
                  </p>
                ) : (
                  <div className="divide-y divide-slate-200 dark:divide-slate-800">
                    {activeTodayStudents.map((s) => (
                      <div key={s.id} className="py-2.5 flex items-center justify-between gap-3 text-xs">
                        <div>
                          <span className="font-semibold text-slate-900 dark:text-white">{s.name}</span>
                          <span className="text-slate-500 dark:text-slate-400 ml-2">{s.email}</span>
                        </div>
                        <div className="flex items-center gap-3 tabular-nums">
                          <span className="text-slate-600 dark:text-slate-300">
                            {s.studyMinutesTotal || 0} total min
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              setActiveSection('students');
                              openStudentDrawer(s);
                            }}
                            className="text-indigo-600 dark:text-indigo-400 font-semibold hover:underline cursor-pointer"
                          >
                            Inspect
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            </div>
          )}

          {/* ================================================================
              5. CONTENT MANAGEMENT SECTION
             ================================================================ */}
          {activeSection === 'content' && (
            <div className="space-y-5">
              {/* Sub-navigation */}
              <div className="flex flex-wrap items-center gap-2 bg-white dark:bg-slate-900 p-2 rounded-xl border border-slate-200 dark:border-slate-800">
                {[
                  { id: 'questions', label: `Questions & PYQs (${allCombinedQuestions.length})` },
                  { id: 'chapters', label: `Chapters & Modules (${cloudChapters.length})` },
                  { id: 'materials', label: `Study Materials (${allMaterials.length})` },
                  { id: 'exam', label: 'Exam Configuration' },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setContentSubTab(tab.id as typeof contentSubTab)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer ${
                      contentSubTab === tab.id
                        ? 'bg-indigo-600 text-white'
                        : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* 5A. Questions & PYQs */}
              {contentSubTab === 'questions' && (
                <div className="space-y-4">
                  <div className="bg-white dark:bg-slate-900 rounded-xl p-4 border border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <select
                        value={contentPaperFilter}
                        onChange={(e) => setContentPaperFilter(e.target.value as 'all' | PaperId)}
                        className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold"
                      >
                        <option value="all">All 4 Papers</option>
                        {PAPERS.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.code} · {p.name.en}
                          </option>
                        ))}
                      </select>

                      <select
                        value={questionSourceFilter}
                        onChange={(e) => setQuestionSourceFilter(e.target.value as 'all' | QuestionSourceType)}
                        className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold"
                      >
                        <option value="all">All Sources (MCQs + PYQs)</option>
                        <option value="PYQ">Previous Year Questions (PYQ)</option>
                        <option value="ICAI_MODULE">ICAI Study Module</option>
                      </select>

                      <input
                        type="text"
                        value={questionSearch}
                        onChange={(e) => setQuestionSearch(e.target.value)}
                        placeholder="Search prompt, chapter, attempt..."
                        className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs w-full sm:w-56"
                      />
                    </div>

                    <button
                      type="button"
                      onClick={() => setShowQForm(!showQForm)}
                      className="px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add MCQ / PYQ</span>
                    </button>
                  </div>

                  {showQForm && (
                    <form
                      onSubmit={handleCreateQuestion}
                      className="bg-white dark:bg-slate-900 rounded-xl p-5 border border-indigo-200 dark:border-indigo-800 space-y-3"
                    >
                      <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                        Create Cloud MCQ / PYQ Question
                      </h3>
                      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                        <select
                          value={qPaperId}
                          onChange={(e) => setQPaperId(e.target.value as PaperId)}
                          className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
                        >
                          {PAPERS.map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.code}
                            </option>
                          ))}
                        </select>
                        <select
                          value={qSourceType}
                          onChange={(e) => setQSourceType(e.target.value as QuestionSourceType)}
                          className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
                        >
                          <option value="PYQ">PYQ (Past Exam)</option>
                          <option value="ICAI_MODULE">ICAI Study Module</option>
                        </select>
                        <select
                          value={qDifficulty}
                          onChange={(e) => setQDifficulty(e.target.value as 'easy' | 'medium' | 'hard')}
                          className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
                        >
                          <option value="easy">Easy</option>
                          <option value="medium">Medium</option>
                          <option value="hard">Hard</option>
                        </select>
                        <input
                          type="text"
                          value={qAttempt}
                          onChange={(e) => setQAttempt(e.target.value)}
                          placeholder="e.g. Jan 2025 PYQ"
                          className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
                        />
                      </div>

                      <select
                        value={qChapterId}
                        onChange={(e) => setQChapterId(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
                      >
                        <option value="">Select chapter...</option>
                        {cloudChapters
                          .filter((c) => c.paperId === qPaperId)
                          .map((c) => (
                            <option key={c.id} value={c.id}>
                              Ch {c.chapterNumber}: {c.title.en}
                            </option>
                          ))}
                      </select>

                      <textarea
                        rows={2}
                        value={qPromptEn}
                        onChange={(e) => setQPromptEn(e.target.value)}
                        placeholder="Question statement..."
                        className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
                      />

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        <input
                          type="text"
                          value={qOpt0}
                          onChange={(e) => setQOpt0(e.target.value)}
                          placeholder="Option A"
                          className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
                        />
                        <input
                          type="text"
                          value={qOpt1}
                          onChange={(e) => setQOpt1(e.target.value)}
                          placeholder="Option B"
                          className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
                        />
                        <input
                          type="text"
                          value={qOpt2}
                          onChange={(e) => setQOpt2(e.target.value)}
                          placeholder="Option C"
                          className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
                        />
                        <input
                          type="text"
                          value={qOpt3}
                          onChange={(e) => setQOpt3(e.target.value)}
                          placeholder="Option D"
                          className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
                        />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-center">
                        <select
                          value={qCorrectIdx}
                          onChange={(e) => setQCorrectIdx(Number(e.target.value))}
                          className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
                        >
                          <option value={0}>Correct: Option A</option>
                          <option value={1}>Correct: Option B</option>
                          <option value={2}>Correct: Option C</option>
                          <option value={3}>Correct: Option D</option>
                        </select>
                        <input
                          type="text"
                          value={qExplanationEn}
                          onChange={(e) => setQExplanationEn(e.target.value)}
                          placeholder="Explanation / ICAI Solution note..."
                          className="sm:col-span-2 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
                        />
                      </div>

                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => setShowQForm(false)}
                          className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-semibold cursor-pointer"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold cursor-pointer"
                        >
                          Publish Question
                        </button>
                      </div>
                    </form>
                  )}

                  <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 divide-y divide-slate-200 dark:divide-slate-800">
                    {filteredContentQuestions.slice(0, 40).map((q) => (
                      <div key={q.id} className="p-3.5 flex items-start justify-between gap-3 text-xs">
                        <div className="space-y-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300">
                              {q.paperId.toUpperCase()} · {q.sourceType}
                            </span>
                            <span className="text-[11px] text-slate-500 dark:text-slate-400">
                              {q.chapterTitle.en} · {q.examAttempt}
                            </span>
                            {cloudQuestionIds.has(q.id) && (
                              <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                                Cloud Editable
                              </span>
                            )}
                          </div>
                          <p className="font-medium text-slate-900 dark:text-white line-clamp-2">
                            {q.question.en}
                          </p>
                        </div>

                        {cloudQuestionIds.has(q.id) && (
                          <button
                            type="button"
                            onClick={async () => {
                              await deleteCustomQuestionFromDb(q.id);
                              showToast('Deleted cloud question.', 'info');
                            }}
                            className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 cursor-pointer shrink-0"
                            title="Delete custom question"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 5B. Chapters & Modules */}
              {contentSubTab === 'chapters' && (
                <div className="space-y-4">
                  <div className="bg-white dark:bg-slate-900 rounded-xl p-5 border border-slate-200 dark:border-slate-800 space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                        Add Syllabus Chapter / Sync Official 46 Chapters
                      </h3>
                      <button
                        type="button"
                        onClick={handleSyncCanonicalChapters}
                        className="px-3 py-1.5 rounded-lg border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 text-xs font-semibold hover:bg-indigo-50 dark:hover:bg-indigo-950/50 cursor-pointer"
                      >
                        Sync Official 46 Chapters to Firestore
                      </button>
                    </div>
                    <form onSubmit={handleSaveChapter} className="grid grid-cols-1 sm:grid-cols-5 gap-2.5">
                      <select
                        value={chPaperId}
                        onChange={(e) => setChPaperId(e.target.value as PaperId)}
                        className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
                      >
                        {PAPERS.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.code}
                          </option>
                        ))}
                      </select>
                      <input
                        type="number"
                        min={1}
                        value={chNum}
                        onChange={(e) => setChNum(Number(e.target.value))}
                        placeholder="Ch #"
                        className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
                      />
                      <input
                        type="text"
                        value={chTitleEn}
                        onChange={(e) => setChTitleEn(e.target.value)}
                        placeholder="Chapter title (English)"
                        className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs sm:col-span-2"
                      />
                      <button
                        type="submit"
                        className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold cursor-pointer"
                      >
                        Add Chapter
                      </button>
                    </form>
                  </div>

                  <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 divide-y divide-slate-200 dark:divide-slate-800">
                    {cloudChapters.map((c) => (
                      <div key={c.id} className="p-3.5 flex items-center justify-between gap-3 text-xs">
                        <div>
                          <span className="font-mono text-[11px] font-bold text-indigo-600 dark:text-indigo-400 mr-2">
                            {c.paperId.toUpperCase()} · Ch {c.chapterNumber}
                          </span>
                          <span className="font-semibold text-slate-900 dark:text-white">{c.title.en}</span>
                        </div>
                        {c.id.startsWith('ch_custom_') && (
                          <button
                            type="button"
                            onClick={() => deleteSubjectChapterFromDb(c.id)}
                            className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 5C. Study Materials (Revision Notes) */}
              {contentSubTab === 'materials' && (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
                  <form
                    onSubmit={handleSaveMaterial}
                    className="lg:col-span-5 bg-white dark:bg-slate-900 rounded-xl p-5 border border-slate-200 dark:border-slate-800 space-y-3"
                  >
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                      {editingMaterialId ? 'Edit Study Material' : 'Publish New Study Material'}
                    </h3>
                    <div className="grid grid-cols-2 gap-2.5">
                      <select
                        value={matPaperId}
                        onChange={(e) => setMatPaperId(e.target.value as PaperId)}
                        className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
                      >
                        {PAPERS.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.code}
                          </option>
                        ))}
                      </select>
                      <input
                        type="number"
                        min={1}
                        max={60}
                        value={matReadMins}
                        onChange={(e) => setMatReadMins(Number(e.target.value))}
                        placeholder="Read min"
                        className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
                      />
                    </div>
                    <input
                      type="text"
                      value={matChapterTitle}
                      onChange={(e) => setMatChapterTitle(e.target.value)}
                      placeholder="Chapter label (e.g. Ch 4: TVM & Annuity)"
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
                    />
                    <input
                      type="text"
                      value={matTopicTitle}
                      onChange={(e) => setMatTopicTitle(e.target.value)}
                      placeholder="Note topic headline"
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
                    />
                    <input
                      type="text"
                      value={matTagsText}
                      onChange={(e) => setMatTagsText(e.target.value)}
                      placeholder="Tags (comma-separated)"
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
                    />
                    <textarea
                      rows={2}
                      value={matSummary}
                      onChange={(e) => setMatSummary(e.target.value)}
                      placeholder="Executive summary..."
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
                    />
                    <textarea
                      rows={3}
                      value={matPointsText}
                      onChange={(e) => setMatPointsText(e.target.value)}
                      placeholder="Key exam takeaways (one point per line)..."
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
                    />
                    <div className="flex gap-2">
                      {editingMaterialId && (
                        <button
                          type="button"
                          onClick={() => {
                            setEditingMaterialId(null);
                            setMatChapterTitle('');
                            setMatTopicTitle('');
                            setMatSummary('');
                            setMatPointsText('');
                          }}
                          className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-semibold cursor-pointer"
                        >
                          Cancel
                        </button>
                      )}
                      <button
                        type="submit"
                        className="flex-1 py-2 px-4 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold cursor-pointer"
                      >
                        {editingMaterialId ? 'Update Material' : 'Publish Material'}
                      </button>
                    </div>
                  </form>

                  <div className="lg:col-span-7 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 divide-y divide-slate-200 dark:divide-slate-800">
                    {allMaterials.map((note) => (
                      <div key={note.id} className="p-4 flex items-start justify-between gap-3 text-xs">
                        <div className="space-y-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300">
                              {note.paperId.toUpperCase()} · {note.readTimeMinutes}m
                            </span>
                            <span className="text-slate-500 dark:text-slate-400 truncate">
                              {note.chapterTitle.en}
                            </span>
                          </div>
                          <p className="font-bold text-slate-900 dark:text-white">{note.topicTitle.en}</p>
                          <p className="text-slate-600 dark:text-slate-300 line-clamp-2">{note.summary.en}</p>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            type="button"
                            onClick={() => {
                              setEditingMaterialId(note.id);
                              setMatPaperId(note.paperId);
                              setMatChapterTitle(note.chapterTitle.en);
                              setMatTopicTitle(note.topicTitle.en);
                              setMatReadMins(note.readTimeMinutes);
                              setMatTagsText(note.tags.join(', '));
                              setMatSummary(note.summary.en);
                              setMatPointsText(note.keyPoints.map((kp) => kp.en).join('\n'));
                            }}
                            className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                            title="Edit study material"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          {cloudMaterialIds.has(note.id) && (
                            <button
                              type="button"
                              onClick={async () => {
                                await deleteStudyMaterialFromDb(note.id);
                                showToast('Deleted cloud study material.', 'info');
                              }}
                              className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 cursor-pointer"
                              title="Delete cloud study material"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 5D. Exam Configuration */}
              {contentSubTab === 'exam' && (
                <form
                  onSubmit={handleSaveExamConfig}
                  className="bg-white dark:bg-[#0F1936] rounded-xl p-5 border border-slate-200 dark:border-[#213059] max-w-2xl space-y-4"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h3 className="text-sm font-bold text-[#0F1E46] dark:text-white flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-violet-700 dark:text-violet-400" />
                      <span>CA Foundation Exam Attempt & Verified Date Controls</span>
                    </h3>
                    <div className="inline-flex items-center gap-1.5">
                      {(['January 2027', 'May 2027'] as const).map((preset) => (
                        <button
                          key={preset}
                          type="button"
                          onClick={() => {
                            setExamAttemptInput(preset);
                            if (preset === 'May 2027' && (!examDateInput || examDateInput.startsWith('2027-01'))) {
                              setExamDateInput('2027-05-15T14:00');
                            } else if (preset === 'January 2027' && (!examDateInput || examDateInput.startsWith('2027-05'))) {
                              setExamDateInput('2027-01-18T14:00');
                            }
                          }}
                          className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border cursor-pointer transition-colors ${
                            examAttemptInput.toLowerCase().includes(preset.split(' ')[0].toLowerCase())
                              ? 'bg-[#172554] text-white border-[#172554]'
                              : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                          }`}
                        >
                          {preset}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                        Target Exam Attempt Label
                      </label>
                      <input
                        type="text"
                        value={examAttemptInput}
                        onChange={(e) => setExamAttemptInput(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                        Official Exam Date & Time
                      </label>
                      <input
                        type="datetime-local"
                        value={examDateInput}
                        onChange={(e) => setExamDateInput(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
                      />
                    </div>
                  </div>
                  <label className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={examVerifiedInput}
                      onChange={(e) => setExamVerifiedInput(e.target.checked)}
                    />
                    <span>Show official exam date countdown (only check once verified by ICAI notification)</span>
                  </label>
                  <div>
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                      Alert Note Below Countdown
                    </label>
                    <input
                      type="text"
                      value={examNoteInput}
                      onChange={(e) => setExamNoteInput(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
                    />
                  </div>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-lg bg-violet-700 hover:bg-violet-800 text-white text-xs font-semibold cursor-pointer"
                  >
                    Save Exam Configuration
                  </button>
                </form>
              )}
            </div>
          )}

          {/* ================================================================
              5B. NOTES MANAGEMENT SECTION (PDF LIBRARY, UPLOADS & APPROVALS)
             ================================================================ */}
          {activeSection === 'notes_management' && (
            <div className="space-y-5">
              {/* Top Stats Strip */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                <div className="bg-white dark:bg-slate-900 rounded-xl p-4 border border-slate-200 dark:border-slate-800">
                  <span className="text-xs text-slate-500 dark:text-slate-400">Pending Student Reviews</span>
                  <span className="text-2xl font-bold text-amber-600 dark:text-amber-400 tabular-nums block mt-1">
                    {materialOverviewCounts.pendingNotesCount}
                  </span>
                </div>
                <div className="bg-white dark:bg-slate-900 rounded-xl p-4 border border-slate-200 dark:border-slate-800">
                  <span className="text-xs text-slate-500 dark:text-slate-400">Approved & Live PDFs</span>
                  <span className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 tabular-nums block mt-1">
                    {materialOverviewCounts.approvedNotesCount}
                  </span>
                </div>
                <div className="bg-white dark:bg-slate-900 rounded-xl p-4 border border-slate-200 dark:border-slate-800">
                  <span className="text-xs text-slate-500 dark:text-slate-400">Rejected Submissions</span>
                  <span className="text-2xl font-bold text-rose-600 dark:text-rose-400 tabular-nums block mt-1">
                    {materialOverviewCounts.rejectedNotesCount}
                  </span>
                </div>
                <div className="bg-white dark:bg-slate-900 rounded-xl p-4 border border-slate-200 dark:border-slate-800">
                  <span className="text-xs text-slate-500 dark:text-slate-400">Total Uploaded PDFs</span>
                  <span className="text-2xl font-bold text-[#172554] dark:text-violet-300 tabular-nums block mt-1">
                    {materialOverviewCounts.totalUploadedNotes}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 xl:grid-cols-12 gap-5 items-start">
                {/* Admin Upload / Edit / Replace PDF Form */}
                <form
                  onSubmit={handleSaveAdminPdfNote}
                  className="xl:col-span-5 bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 space-y-3.5"
                >
                  <div className="flex items-center justify-between">
                    <h2 className="text-sm font-extrabold text-[#0F1E46] dark:text-white flex items-center gap-2">
                      <FileUp className="w-4 h-4 text-violet-700 dark:text-violet-400" />
                      <span>
                        {nmEditingTarget ? 'Edit / Replace PDF Material' : 'Upload New Study PDF (Admin)'}
                      </span>
                    </h2>
                    {nmEditingTarget && (
                      <button
                        type="button"
                        onClick={resetNotesForm}
                        className="text-xs font-semibold text-slate-500 hover:text-slate-800 cursor-pointer"
                      >
                        Cancel Edit
                      </button>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Title *
                    </label>
                    <input
                      type="text"
                      required
                      value={nmTitle}
                      onChange={(e) => setNmTitle(e.target.value)}
                      placeholder="e.g. Ch 1 Theoretical Framework Complete PDF Notes"
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Subject *
                      </label>
                      <select
                        value={nmPaperId}
                        onChange={(e) => {
                          const p = e.target.value as PaperId;
                          setNmPaperId(p);
                          const firstCh = canonicalAndCloudChapters
                            .filter((c) => c.paperId === p)
                            .sort((a, b) => a.chapterNumber - b.chapterNumber)[0];
                          if (firstCh) setNmChapterId(firstCh.id);
                        }}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
                      >
                        {PAPERS.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.code}: {p.name.en}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Chapter *
                      </label>
                      <select
                        value={nmChapterId}
                        onChange={(e) => setNmChapterId(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
                      >
                        {nmPaperChapters.map((c) => (
                          <option key={c.id} value={c.id}>
                            Ch {c.chapterNumber}: {c.title.en}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Exam Attempt *
                      </label>
                      <select
                        value={nmAttempt}
                        onChange={(e) => setNmAttempt(e.target.value as MaterialAttemptScope)}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
                      >
                        {MATERIAL_ATTEMPT_SCOPES.map((att) => (
                          <option key={att} value={att}>
                            {att === 'Both' ? 'Both (Jan 2027 & May 2027)' : att}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Material Category *
                      </label>
                      <select
                        value={nmCategory}
                        onChange={(e) => setNmCategory(e.target.value as MaterialCategory)}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
                      >
                        {MATERIAL_CATEGORIES.map((cat) => (
                          <option key={cat} value={cat}>
                            {cat}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Description
                    </label>
                    <textarea
                      rows={2}
                      value={nmDescription}
                      onChange={(e) => setNmDescription(e.target.value)}
                      placeholder="Short note summary, ICAI module coverage, or exam pointers..."
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      {nmEditingTarget ? 'Replace PDF File (Optional)' : 'PDF File (Max 15 MB) *'}
                    </label>
                    <label className="flex flex-col items-center justify-center p-4 rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-violet-500 bg-slate-50 dark:bg-slate-800/40 cursor-pointer text-center">
                      <Upload className="w-4 h-4 text-violet-600 mb-1" />
                      <span className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                        {nmFile
                          ? `${nmFile.name} (${formatFileSize(nmFile.size)})`
                          : nmEditingTarget
                            ? `Keep current (${nmEditingTarget.fileName}) or click to replace`
                            : 'Click to pick .pdf file'}
                      </span>
                      <input
                        type="file"
                        accept=".pdf,application/pdf"
                        onChange={(e) => setNmFile(e.target.files?.[0] || null)}
                        className="sr-only"
                      />
                    </label>
                  </div>

                  <button
                    type="submit"
                    disabled={nmSubmitting}
                    className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-[#172554] to-violet-700 hover:from-[#0F1E46] hover:to-violet-800 text-white text-xs font-bold cursor-pointer disabled:opacity-60"
                  >
                    {nmSubmitting
                      ? 'Saving PDF Material...'
                      : nmEditingTarget
                        ? 'Save Changes'
                        : 'Upload & Publish PDF'}
                  </button>
                </form>

                {/* Approval Queue & All Uploaded Notes Table */}
                <div className="xl:col-span-7 space-y-3">
                  {/* Status Tabs & Filters */}
                  <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 space-y-3">
                    <div className="flex flex-wrap items-center gap-1.5">
                      {(
                        [
                          { id: 'pending', label: `Pending Review (${materialOverviewCounts.pendingNotesCount})` },
                          { id: 'approved', label: `Approved (${materialOverviewCounts.approvedNotesCount})` },
                          { id: 'rejected', label: `Rejected (${materialOverviewCounts.rejectedNotesCount})` },
                          { id: 'all', label: `All PDFs (${materialOverviewCounts.totalUploadedNotes})` },
                        ] as const
                      ).map((tab) => (
                        <button
                          key={tab.id}
                          type="button"
                          onClick={() => setNmStatusFilter(tab.id)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer ${
                            nmStatusFilter === tab.id
                              ? 'bg-violet-700 text-white'
                              : 'border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
                          }`}
                        >
                          {tab.label}
                        </button>
                      ))}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                      <div className="relative sm:col-span-2">
                        <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          value={nmSearch}
                          onChange={(e) => setNmSearch(e.target.value)}
                          placeholder="Search title, chapter, or student uploader..."
                          className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
                        />
                      </div>
                      <select
                        value={nmPaperFilter}
                        onChange={(e) => setNmPaperFilter(e.target.value as 'all' | PaperId)}
                        className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
                      >
                        <option value="all">All Subjects</option>
                        {PAPERS.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.code}
                          </option>
                        ))}
                      </select>
                      <select
                        value={nmAttemptFilter}
                        onChange={(e) => setNmAttemptFilter(e.target.value as 'all' | MaterialAttemptScope)}
                        className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
                      >
                        <option value="all">All Attempts</option>
                        {MATERIAL_ATTEMPT_SCOPES.map((att) => (
                          <option key={att} value={att}>
                            {att}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <select
                        value={nmCategoryFilter}
                        onChange={(e) => setNmCategoryFilter(e.target.value as 'all' | MaterialCategory)}
                        className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
                      >
                        <option value="all">All Categories</option>
                        {MATERIAL_CATEGORIES.map((cat) => (
                          <option key={cat} value={cat}>
                            {cat}
                          </option>
                        ))}
                      </select>
                      <select
                        value={nmRoleFilter}
                        onChange={(e) => setNmRoleFilter(e.target.value as 'all' | 'admin' | 'student')}
                        className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
                      >
                        <option value="all">All Uploaders (Admin + Students)</option>
                        <option value="student">Student Uploads Only</option>
                        <option value="admin">Admin Uploads Only</option>
                      </select>
                    </div>
                  </div>

                  {/* Notes Submissions & Library Cards */}
                  <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 divide-y divide-slate-200 dark:divide-slate-800">
                    {filteredAdminNotes.length === 0 ? (
                      <p className="text-xs text-slate-500 dark:text-slate-400 p-8 text-center">
                        No PDF study materials match the current filter.
                      </p>
                    ) : (
                      filteredAdminNotes.map((mat) => (
                        <div key={mat.id} className="p-4 space-y-2.5 text-xs">
                          <div className="flex flex-wrap items-start justify-between gap-2">
                            <div className="space-y-1 min-w-0">
                              <div className="flex flex-wrap items-center gap-1.5">
                                <span
                                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                                    mat.status === 'approved'
                                      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                                      : mat.status === 'rejected'
                                        ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                                        : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                                  }`}
                                >
                                  {mat.status}
                                </span>
                                <span className="px-2 py-0.5 rounded bg-[#172554] text-white text-[10px] font-bold">
                                  {mat.paperId.toUpperCase()} · Ch {mat.chapterNumber}
                                </span>
                                <span className="px-2 py-0.5 rounded bg-violet-100 dark:bg-violet-950 text-violet-800 dark:text-violet-300 text-[10px] font-bold">
                                  {mat.category}
                                </span>
                                <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[10px] font-semibold">
                                  {mat.attempt}
                                </span>
                              </div>
                              <p className="font-extrabold text-sm text-slate-900 dark:text-white">
                                {mat.title}
                              </p>
                              <p className="text-[11px] text-slate-600 dark:text-slate-300">
                                {mat.chapterTitle} {mat.description ? `· ${mat.description}` : ''}
                              </p>
                              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                                Uploaded by <strong>{mat.uploaderName}</strong> ({mat.uploaderRole})
                                {mat.uploaderEmail ? ` · ${mat.uploaderEmail}` : ''} ·{' '}
                                {new Date(mat.createdAt).toLocaleString()} · {formatFileSize(mat.fileSizeBytes)}
                              </p>
                              {mat.status === 'rejected' && mat.rejectionReason && (
                                <p className="text-[11px] text-rose-600 dark:text-rose-300 italic">
                                  Rejection Reason: {mat.rejectionReason}
                                </p>
                              )}
                            </div>
                          </div>

                          <div className="flex flex-wrap items-center gap-2 pt-1">
                            <button
                              type="button"
                              onClick={() => setPreviewPdfMaterial(mat)}
                              className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 font-semibold flex items-center gap-1 cursor-pointer"
                            >
                              <Eye className="w-3.5 h-3.5 text-violet-600" />
                              <span>Preview PDF</span>
                            </button>

                            {mat.status !== 'approved' && (
                              <button
                                type="button"
                                disabled={busyNoteId === mat.id}
                                onClick={() => handleApproveNote(mat)}
                                className="px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold flex items-center gap-1 cursor-pointer disabled:opacity-50"
                              >
                                <Check className="w-3.5 h-3.5" />
                                <span>Approve</span>
                              </button>
                            )}

                            {mat.status !== 'rejected' && (
                              <button
                                type="button"
                                disabled={busyNoteId === mat.id}
                                onClick={() => {
                                  setRejectNoteTarget(mat);
                                  setRejectNoteReason('Please ensure legible formatting and accurate ICAI syllabus alignment.');
                                }}
                                className="px-2.5 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-semibold flex items-center gap-1 cursor-pointer disabled:opacity-50"
                              >
                                <X className="w-3.5 h-3.5" />
                                <span>Reject</span>
                              </button>
                            )}

                            <button
                              type="button"
                              onClick={() => {
                                setNmEditingTarget(mat);
                                setNmTitle(mat.title);
                                setNmPaperId(mat.paperId);
                                setNmChapterId(mat.chapterId);
                                setNmAttempt(mat.attempt);
                                setNmCategory(mat.category);
                                setNmDescription(mat.description || '');
                                setNmFile(null);
                              }}
                              className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 font-semibold flex items-center gap-1 cursor-pointer"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                              <span>Edit / Replace</span>
                            </button>

                            <button
                              type="button"
                              disabled={busyNoteId === mat.id}
                              onClick={() => handleDeleteNoteMaterial(mat)}
                              className="px-2.5 py-1.5 rounded-lg text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 font-semibold flex items-center gap-1 cursor-pointer ml-auto"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>Delete</span>
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ================================================================
              6. GROUP MANAGEMENT SECTION
             ================================================================ */}
          {activeSection === 'groups' && (
            <div className="space-y-4">
              <div className="bg-white dark:bg-slate-900 rounded-xl p-4 border border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                    CA Saathi Common Group Moderation
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 tabular-nums">
                    {registeredStudents.length} members · {communityPosts.length} group threads · {pendingReportsCount} pending reports
                  </p>
                </div>
                <div className="flex items-center gap-1.5">
                  {[
                    { id: 'messages', label: `Messages (${communityPosts.length})` },
                    { id: 'members', label: `Members (${registeredStudents.length})` },
                    { id: 'reports', label: `Reports (${pendingReportsCount})` },
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setGroupSubTab(tab.id as typeof groupSubTab)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer ${
                        groupSubTab === tab.id
                          ? 'bg-indigo-600 text-white'
                          : 'border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>

              {groupSubTab === 'members' && (
                <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 space-y-3">
                  <input
                    type="text"
                    value={groupMemberSearch}
                    onChange={(e) => setGroupMemberSearch(e.target.value)}
                    placeholder="Filter group members..."
                    className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs w-full sm:w-64"
                  />
                  {filteredGroupMembers.length === 0 ? (
                    <p className="text-xs text-slate-500 dark:text-slate-400 py-6 text-center">
                      No real registered students found in the group.
                    </p>
                  ) : (
                    <div className="divide-y divide-slate-200 dark:divide-slate-800">
                      {filteredGroupMembers.map((m) => (
                        <div key={m.id} className="py-2.5 flex items-center justify-between gap-3 text-xs">
                          <div>
                            <span className="font-bold text-slate-900 dark:text-white">
                              {m.avatar || '🎓'} {m.name}
                            </span>
                            <span className="text-slate-500 dark:text-slate-400 ml-2">
                              {m.email} · {m.targetAttempt}
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleToggleSuspendStudent(m)}
                            className={`px-2.5 py-1 rounded-lg font-semibold cursor-pointer ${
                              m.isSuspended
                                ? 'bg-emerald-600 text-white'
                                : 'border border-rose-200 dark:border-rose-800 text-rose-600 dark:text-rose-400'
                            }`}
                          >
                            {m.isSuspended ? 'Unmute / Activate' : 'Suspend from Group'}
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {groupSubTab === 'messages' && (
                <div className="space-y-3">
                  {communityPosts.length === 0 ? (
                    <div className="bg-white dark:bg-slate-900 rounded-xl p-8 border border-slate-200 dark:border-slate-800 text-center text-xs text-slate-500 dark:text-slate-400">
                      No group discussion messages posted yet.
                    </div>
                  ) : (
                    communityPosts.map((post) => (
                      <div
                        key={post.id}
                        className="bg-white dark:bg-slate-900 rounded-xl p-4 border border-slate-200 dark:border-slate-800 space-y-2.5 text-xs"
                      >
                        <div className="flex flex-wrap items-start justify-between gap-2">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-slate-900 dark:text-white">{post.authorName}</span>
                              {post.isPinned && (
                                <span className="px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 text-[10px] font-bold">
                                  PINNED
                                </span>
                              )}
                              {post.isResolved && (
                                <span className="px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 text-[10px] font-bold">
                                  RESOLVED
                                </span>
                              )}
                            </div>
                            <p className="font-semibold text-sm text-slate-900 dark:text-white mt-0.5">
                              {post.title}
                            </p>
                          </div>

                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => togglePinPostInDb(post.id, !post.isPinned)}
                              className="px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 font-semibold cursor-pointer"
                            >
                              {post.isPinned ? 'Unpin' : 'Pin'}
                            </button>
                            <button
                              type="button"
                              onClick={() => toggleResolveDoubtInDb(post.id, !post.isResolved)}
                              className="px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 font-semibold cursor-pointer"
                            >
                              {post.isResolved ? 'Reopen' : 'Resolve'}
                            </button>
                            <button
                              type="button"
                              onClick={async () => {
                                await deletePostFromDb(post.id);
                                showToast('Post deleted from common group.', 'info');
                              }}
                              className="px-2.5 py-1 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-semibold cursor-pointer"
                            >
                              Delete
                            </button>
                          </div>
                        </div>

                        <p className="text-slate-600 dark:text-slate-300">{post.content}</p>

                        {(post.replies || []).length > 0 && (
                          <div>
                            <button
                              type="button"
                              onClick={() =>
                                setExpandedPostRepliesId(expandedPostRepliesId === post.id ? null : post.id)
                              }
                              className="text-indigo-600 dark:text-indigo-400 font-semibold hover:underline cursor-pointer"
                            >
                              {expandedPostRepliesId === post.id
                                ? 'Hide replies'
                                : `Manage ${post.replies.length} replies`}
                            </button>

                            {expandedPostRepliesId === post.id && (
                              <div className="mt-2 space-y-2 pl-3 border-l-2 border-slate-200 dark:border-slate-700">
                                {post.replies.map((rep) => (
                                  <div
                                    key={rep.id}
                                    className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 flex items-start justify-between gap-2"
                                  >
                                    <div>
                                      <p className="font-semibold text-slate-900 dark:text-white">{rep.authorName}</p>
                                      <p className="text-slate-600 dark:text-slate-300">{rep.content}</p>
                                    </div>
                                    <button
                                      type="button"
                                      onClick={() => deleteReplyFromDb(post.id, rep.id)}
                                      className="p-1 rounded text-rose-600 hover:bg-rose-100 dark:hover:bg-rose-950 cursor-pointer shrink-0"
                                      title="Delete reply"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              )}

              {groupSubTab === 'reports' && (
                <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 divide-y divide-slate-200 dark:divide-slate-800">
                  {moderationReports.length === 0 ? (
                    <p className="text-xs text-slate-500 dark:text-slate-400 p-8 text-center">
                      No moderation reports submitted.
                    </p>
                  ) : (
                    moderationReports.map((r) => (
                      <div key={r.id} className="p-4 flex items-center justify-between gap-3 text-xs">
                        <div className="space-y-0.5">
                          <span className="font-bold text-slate-900 dark:text-white block">
                            [{r.targetType.toUpperCase()}] {r.targetTitle}
                          </span>
                          <p className="text-slate-600 dark:text-slate-300">
                            Reason: {r.reason} · {r.details}
                          </p>
                          <p className="text-[11px] text-slate-400">
                            Reported by {r.reportedBy} · Status: {r.status}
                          </p>
                        </div>
                        {r.status === 'pending' && (
                          <div className="flex items-center gap-1.5 shrink-0">
                            <button
                              type="button"
                              onClick={() => resolveModerationReportInDb(r.id, 'resolved')}
                              className="px-2.5 py-1 rounded-lg bg-emerald-600 text-white font-semibold cursor-pointer"
                            >
                              Resolve
                            </button>
                            <button
                              type="button"
                              onClick={() => resolveModerationReportInDb(r.id, 'dismissed')}
                              className="px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 font-semibold cursor-pointer"
                            >
                              Dismiss
                            </button>
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          )}

          {/* ================================================================
              7. NOTIFICATIONS SECTION
             ================================================================ */}
          {activeSection === 'notifications' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
              {/* Left Column: Broadcast Composer + Exam Announcements */}
              <div className="lg:col-span-6 space-y-5">
                <form
                  onSubmit={handleSendNotification}
                  className="bg-white dark:bg-slate-900 rounded-xl p-5 border border-slate-200 dark:border-slate-800 space-y-3"
                >
                  <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <Send className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                    <span>Send Notification to All or Individual Student</span>
                  </h2>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <select
                      value={notifRecipient}
                      onChange={(e) => setNotifRecipient(e.target.value)}
                      className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
                    >
                      <option value="all">All Registered Students (Broadcast)</option>
                      {registeredStudents.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name} ({s.email})
                        </option>
                      ))}
                    </select>

                    <select
                      value={notifType}
                      onChange={(e) => setNotifType(e.target.value as AppNotification['type'])}
                      className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
                    >
                      <option value="broadcast">Important Broadcast</option>
                      <option value="exam_update">Exam Alert</option>
                      <option value="study_reminder">Study Reminder</option>
                    </select>
                  </div>

                  <input
                    type="text"
                    value={notifTitle}
                    onChange={(e) => setNotifTitle(e.target.value)}
                    placeholder="Notification headline..."
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
                  />

                  <textarea
                    rows={3}
                    value={notifMessage}
                    onChange={(e) => setNotifMessage(e.target.value)}
                    placeholder="Write message to deliver instantly to student bell inbox..."
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
                  />

                  <button
                    type="submit"
                    disabled={sendingNotif}
                    className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold cursor-pointer disabled:opacity-60"
                  >
                    {sendingNotif ? 'Sending...' : 'Send Notification Now'}
                  </button>
                </form>

                <form
                  onSubmit={handlePublishAnnouncement}
                  className="bg-white dark:bg-slate-900 rounded-xl p-5 border border-slate-200 dark:border-slate-800 space-y-3"
                >
                  <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <Bell className="w-4 h-4 text-amber-500" />
                    <span>Publish Official Exam Announcement</span>
                  </h2>
                  <div className="grid grid-cols-2 gap-2.5">
                    <select
                      value={annCategory}
                      onChange={(e) => setAnnCategory(e.target.value as ExamUpdate['category'])}
                      className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
                    >
                      <option value="Exam Date">Exam Date</option>
                      <option value="Admit Card">Admit Card</option>
                      <option value="Guidance">Guidance</option>
                      <option value="Syllabus">Syllabus</option>
                      <option value="Results">Results</option>
                    </select>
                    <label className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300 px-2">
                      <input
                        type="checkbox"
                        checked={annImportant}
                        onChange={(e) => setAnnImportant(e.target.checked)}
                      />
                      <span>Mark Important</span>
                    </label>
                  </div>
                  <input
                    type="text"
                    value={annTitle}
                    onChange={(e) => setAnnTitle(e.target.value)}
                    placeholder="Announcement title..."
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
                  />
                  <textarea
                    rows={2}
                    value={annSummary}
                    onChange={(e) => setAnnSummary(e.target.value)}
                    placeholder="Official ICAI / portal update summary..."
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold cursor-pointer"
                  >
                    Publish Announcement
                  </button>

                  {examUpdates.length > 0 && (
                    <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2 max-h-52 overflow-y-auto">
                      {examUpdates.map((upd) => (
                        <div key={upd.id} className="flex items-center justify-between gap-2 text-xs p-2 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                          <span className="truncate font-medium text-slate-800 dark:text-slate-200">
                            {upd.date} · {upd.title.en}
                          </span>
                          {upd.id.startsWith('upd_') && (
                            <button
                              type="button"
                              onClick={() => deleteExamAnnouncementFromDb(upd.id)}
                              className="text-rose-600 hover:underline shrink-0 cursor-pointer"
                            >
                              Delete
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </form>
              </div>

              {/* Right Column: Payment Alerts & Sent History */}
              <div className="lg:col-span-6 bg-white dark:bg-slate-900 rounded-xl p-5 border border-slate-200 dark:border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                    Payment Alerts & Sent Broadcasts ({notificationsList.length})
                  </h2>
                </div>
                {notificationsList.length === 0 ? (
                  <p className="text-xs text-slate-500 dark:text-slate-400 py-8 text-center">
                    No notifications or payment alerts recorded yet.
                  </p>
                ) : (
                  <div className="space-y-2 max-h-[540px] overflow-y-auto">
                    {notificationsList.map((n) => (
                      <div
                        key={n.id}
                        className={`p-3 rounded-xl border text-xs ${
                          n.read
                            ? 'bg-slate-50/50 dark:bg-slate-800/30 border-slate-200 dark:border-slate-800'
                            : 'bg-amber-50/70 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <span className="font-bold text-slate-900 dark:text-white">{n.title}</span>
                          <div className="flex items-center gap-2 shrink-0">
                            <span className="font-mono text-[10px] text-slate-500 uppercase">
                              TO: {n.recipientId}
                            </span>
                            {!n.read && n.recipientId === 'admin' && (
                              <button
                                type="button"
                                onClick={() => markNotificationReadInDb(n.id)}
                                className="text-indigo-600 dark:text-indigo-400 font-semibold hover:underline cursor-pointer"
                              >
                                Mark Read
                              </button>
                            )}
                          </div>
                        </div>
                        <p className="text-slate-600 dark:text-slate-300 mt-0.5">{n.message}</p>
                        <span className="text-[10px] text-slate-400 mt-1 block">
                          {n.type} · {new Date(n.createdAt).toLocaleString()}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ================================================================
              8. ANALYTICS SECTION
             ================================================================ */}
          {activeSection === 'analytics' && (
            <div className="space-y-5">
              {/* Header Bar + Timeframe Selector */}
              <div className="bg-white dark:bg-slate-900 rounded-xl p-4 border border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  {(
                    [
                      { id: 'daily', label: 'Daily (14 Days)' },
                      { id: 'weekly', label: 'Weekly (8 Weeks)' },
                      { id: 'monthly', label: 'Monthly (6 Months)' },
                    ] as Array<{ id: ReportTimeframe; label: string }>
                  ).map((tf) => (
                    <button
                      key={tf.id}
                      type="button"
                      onClick={() => setReportTimeframe(tf.id)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer ${
                        reportTimeframe === tf.id
                          ? 'bg-indigo-600 text-white'
                          : 'border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      {tf.label}
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => downloadCsvFile(`ca_saathi_revenue_${todayIso}.csv`, exportRevenueToCsv(paymentsList))}
                    className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Revenue CSV</span>
                  </button>
                </div>
              </div>

              {/* Engagement KPI Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                {[
                  { label: 'DAU', value: engagementSummary.dau },
                  { label: 'WAU', value: engagementSummary.wau },
                  { label: 'MAU', value: engagementSummary.mau },
                  { label: 'Stickiness (DAU/MAU)', value: `${engagementSummary.stickinessPercent}%` },
                  { label: 'Tracked Study Hours', value: `${engagementSummary.totalTrackedHours}h` },
                  { label: 'Avg MCQ Accuracy', value: `${engagementSummary.avgAccuracyPercent}%` },
                ].map((k) => (
                  <div
                    key={k.label}
                    className="bg-white dark:bg-slate-900 rounded-xl p-4 border border-slate-200 dark:border-slate-800"
                  >
                    <span className="text-[11px] text-slate-500 dark:text-slate-400 block">{k.label}</span>
                    <span className="text-xl font-bold text-slate-900 dark:text-white tabular-nums mt-1 block">
                      {k.value}
                    </span>
                  </div>
                ))}
              </div>

              {/* 3 Real-Data Charts */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {[
                  { title: 'User Growth (Registrations)', key: 'newUsers' as const, max: maxNewUsers, color: 'bg-blue-600', prefix: '' },
                  { title: 'Revenue Statistics (₹)', key: 'revenueInr' as const, max: maxRevenue, color: 'bg-emerald-600', prefix: '₹' },
                  { title: 'Unique Visitors', key: 'visits' as const, max: maxVisits, color: 'bg-indigo-600', prefix: '' },
                ].map((chart) => (
                  <div
                    key={chart.title}
                    className="bg-white dark:bg-slate-900 rounded-xl p-4 border border-slate-200 dark:border-slate-800 space-y-3"
                  >
                    <h3 className="text-xs font-bold text-slate-900 dark:text-white">{chart.title}</h3>
                    <div className="h-36 flex items-end gap-1.5 pt-4 border-b border-slate-200 dark:border-slate-800">
                      {reportBuckets.map((b) => {
                        const val = b[chart.key];
                        const pct = Math.max(val > 0 ? 12 : 4, Math.round((val / chart.max) * 100));
                        return (
                          <div
                            key={b.key}
                            className="flex-1 flex flex-col items-center justify-end h-full group"
                            title={`${b.label}: ${chart.prefix}${val}`}
                          >
                            <span className="text-[9px] font-semibold text-slate-500 dark:text-slate-400 tabular-nums mb-1">
                              {val > 0 ? `${chart.prefix}${val}` : ''}
                            </span>
                            <div
                              className={`w-full rounded-t ${val > 0 ? chart.color : 'bg-slate-200 dark:bg-slate-800'}`}
                              style={{ height: `${pct}%` }}
                            />
                          </div>
                        );
                      })}
                    </div>
                    <div className="flex items-center justify-between text-[10px] text-slate-400 tabular-nums">
                      <span>{reportBuckets[0]?.label}</span>
                      <span>{reportBuckets[reportBuckets.length - 1]?.label}</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Audit Logs */}
              <section className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 space-y-3">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Recent Owner Audit Trail ({auditLogs.length})
                </h3>
                {auditLogs.length === 0 ? (
                  <p className="text-xs text-slate-500 dark:text-slate-400 py-4">
                    No owner actions logged yet.
                  </p>
                ) : (
                  <div className="divide-y divide-slate-200 dark:divide-slate-800 max-h-64 overflow-y-auto text-xs">
                    {auditLogs.slice(0, 20).map((log) => (
                      <div key={log.id} className="py-2 flex items-center justify-between gap-3">
                        <div>
                          <span className="font-semibold text-slate-900 dark:text-white">{log.action}</span>
                          <span className="text-slate-500 dark:text-slate-400 ml-2">{log.details}</span>
                        </div>
                        <span className="text-[11px] text-slate-400 tabular-nums shrink-0">
                          {new Date(log.timestamp).toLocaleString()}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            </div>
          )}
        </main>
      </div>

      {/* ====================================================================
          STUDENT PROGRESS & ACCESS MANAGEMENT DRAWER
         ==================================================================== */}
      {selectedStudent && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div onClick={() => setSelectedStudent(null)} className="fixed inset-0 bg-slate-950/60" />
          <div className="relative z-10 w-full max-w-lg bg-white dark:bg-slate-900 h-full border-l border-slate-200 dark:border-slate-800 shadow-2xl overflow-y-auto p-6 space-y-5">
            <div className="flex items-start justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  {selectedStudent.avatar || '🎓'} {selectedStudent.name}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {selectedStudent.email} · {selectedStudent.phone || 'No phone'} · {selectedStudent.city || 'India'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedStudent(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                aria-label="Close student progress drawer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Access Controls */}
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 space-y-3 text-xs">
              <p className="font-bold text-slate-900 dark:text-white">Manage Student Access</p>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => handleExtendStudent30Days(selectedStudent)}
                  className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold cursor-pointer"
                >
                  Grant +30 Days Pass
                </button>
                <button
                  type="button"
                  onClick={() => handleRevokeMembership(selectedStudent)}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 font-semibold cursor-pointer"
                >
                  Revoke Paid Pass
                </button>
                <button
                  type="button"
                  onClick={() => handleToggleStudentUploadPermission(selectedStudent)}
                  className={`px-3 py-1.5 rounded-lg font-semibold cursor-pointer ${
                    selectedStudent.canUploadNotes === true
                      ? 'bg-violet-600 hover:bg-violet-700 text-white'
                      : 'border border-violet-300 dark:border-violet-700 text-violet-700 dark:text-violet-300 hover:bg-violet-50 dark:hover:bg-violet-950/40'
                  }`}
                >
                  {selectedStudent.canUploadNotes === true
                    ? 'Notes Upload: ON (Click to Revoke)'
                    : 'Grant Notes Upload Permission'}
                </button>
                <button
                  type="button"
                  onClick={() => handleToggleSuspendStudent(selectedStudent)}
                  className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-semibold cursor-pointer"
                >
                  {selectedStudent.isSuspended ? 'Reactivate Account' : 'Suspend Account'}
                </button>
              </div>

              <div className="flex items-center gap-2 pt-2 border-t border-slate-200 dark:border-slate-700">
                <input
                  type="date"
                  value={customExpiryDateInput}
                  onChange={(e) => setCustomExpiryDateInput(e.target.value)}
                  className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs"
                />
                <button
                  type="button"
                  onClick={handleSetCustomExpiry}
                  className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold cursor-pointer"
                >
                  Set Custom Expiry
                </button>
              </div>
            </div>

            {/* Study Progress Subcollection Data */}
            {loadingProgress ? (
              <p className="text-xs text-slate-500 py-6 text-center">Loading Firestore study progress...</p>
            ) : (
              <div className="space-y-4 text-xs">
                <div className="grid grid-cols-3 gap-2.5">
                  <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800">
                    <span className="text-[11px] text-slate-500 block">Study Sessions</span>
                    <span className="text-lg font-bold tabular-nums">
                      {studentProgress?.studySessions.length || 0}
                    </span>
                  </div>
                  <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800">
                    <span className="text-[11px] text-slate-500 block">Mock Tests</span>
                    <span className="text-lg font-bold tabular-nums">
                      {studentProgress?.testResults.length || 0}
                    </span>
                  </div>
                  <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800">
                    <span className="text-[11px] text-slate-500 block">Chapters Mastered</span>
                    <span className="text-lg font-bold tabular-nums">
                      {Object.values(studentProgress?.chapterProgress || {}).filter((v) => v === 'mastered').length}
                    </span>
                  </div>
                </div>

                <div>
                  <h4 className="font-bold text-slate-900 dark:text-white mb-2">Recent Study Sessions</h4>
                  {(studentProgress?.studySessions || []).length === 0 ? (
                    <p className="text-slate-500">No recorded study sessions yet.</p>
                  ) : (
                    <div className="space-y-1.5">
                      {studentProgress?.studySessions.slice(0, 6).map((sess) => (
                        <div
                          key={sess.id}
                          className="p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 flex items-center justify-between tabular-nums"
                        >
                          <span>
                            {sess.date} · {sess.activityType} ({formatPaperShortLabel(sess.paperId)})
                          </span>
                          <span className="font-semibold">{sess.durationMinutes} min</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  <h4 className="font-bold text-slate-900 dark:text-white mb-2">Mock Test Scorecards</h4>
                  {(studentProgress?.testResults || []).length === 0 ? (
                    <p className="text-slate-500">No mock tests attempted yet.</p>
                  ) : (
                    <div className="space-y-1.5">
                      {studentProgress?.testResults.slice(0, 5).map((t, i) => (
                        <div
                          key={`${t.testId}_${i}`}
                          className="p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 flex items-center justify-between tabular-nums"
                        >
                          <span className="truncate">{t.testTitle.en}</span>
                          <span className="font-semibold">
                            {t.score.toFixed(1)} ({t.percentage}%)
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ====================================================================
          PAYMENT SCREENSHOT LIGHTBOX MODAL (No backdrop-blur for smooth rendering)
         ==================================================================== */}
      {inspectScreenshotUrl && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full p-4 space-y-3 border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-900 dark:text-white">Payment Proof Screenshot</span>
              <button
                type="button"
                onClick={() => setInspectScreenshotUrl(null)}
                className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <img
              src={inspectScreenshotUrl}
              alt="Uploaded student UPI payment screenshot"
              className="w-full max-h-[70vh] object-contain rounded-xl bg-slate-100 dark:bg-slate-800"
            />
          </div>
        </div>
      )}

      {/* ====================================================================
          REJECT PAYMENT REASON MODAL
         ==================================================================== */}
      {rejectModalTarget && (
        <div className="fixed inset-0 z-50 bg-slate-950/75 flex items-center justify-center p-4">
          <form
            onSubmit={handleConfirmReject}
            className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-5 space-y-4 border border-slate-200 dark:border-slate-800"
          >
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Reject Payment Claim · {rejectModalTarget.studentName}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">
              UTR: {rejectModalTarget.utr}
            </p>
            <textarea
              rows={3}
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Reason shown to student..."
              className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
            />
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setRejectModalTarget(null)}
                className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold cursor-pointer"
              >
                Confirm Reject
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ====================================================================
          REJECT STUDENT NOTES REASON MODAL
         ==================================================================== */}
      {rejectNoteTarget && (
        <div className="fixed inset-0 z-50 bg-slate-950/75 flex items-center justify-center p-4">
          <form
            onSubmit={handleConfirmRejectNote}
            className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-5 space-y-4 border border-slate-200 dark:border-slate-800"
          >
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Reject Study Material · {rejectNoteTarget.title}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Submitted by {rejectNoteTarget.uploaderName} ({rejectNoteTarget.category})
            </p>
            <textarea
              rows={3}
              value={rejectNoteReason}
              onChange={(e) => setRejectNoteReason(e.target.value)}
              placeholder="Feedback shown to the student uploader..."
              className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
            />
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setRejectNoteTarget(null)}
                className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold cursor-pointer"
              >
                Confirm Reject
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ====================================================================
          IN-APP PDF PREVIEW MODAL FOR ADMIN
         ==================================================================== */}
      <PdfReaderModal
        material={previewPdfMaterial}
        language="en"
        onClose={() => setPreviewPdfMaterial(null)}
      />
    </div>
  );
};
