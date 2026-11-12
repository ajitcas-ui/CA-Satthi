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
  PaperId 
} from '../types';
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
  addAdminAuditLog, 
  getSubjectChapters, 
  addSubjectChapter, 
  getAllQuestions, 
  addCustomQuestion, 
  updateCustomQuestion, 
  deleteCustomQuestion, 
  exportStudentsToCsv, 
  exportPaymentsToCsv, 
  exportRevenueToCsv, 
  downloadCsvFile 
} from '../utils/storageDb';
import { 
  resolveModerationReportInDb, 
  deletePostFromDb, 
  publishExamAnnouncementToDb, 
  subscribeToModerationReports, 
  saveExamConfigToDb, 
  subscribeToExamConfig 
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
  Lock, 
  QrCode, 
  Calendar, 
  Gift, 
  CheckCircle2, 
  XCircle, 
  Eye, 
  Clock, 
  UploadCloud, 
  Download, 
  Search, 
  Filter, 
  RefreshCw, 
  UserX, 
  UserCheck, 
  BookOpen, 
  BarChart3, 
  FileSpreadsheet, 
  Edit3, 
  Tag, 
  Copy, 
  Sliders, 
  Layers, 
  HelpCircle 
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
}

export const AdminPanelView: React.FC<AdminPanelViewProps> = ({
  language,
  currentUser,
  setCurrentUser,
  examUpdates,
  setExamUpdates,
  countdownConfig: propCountdownConfig,
  setCountdownConfig: setPropCountdownConfig,
}) => {
  // SUPER ADMIN PERMISSION CHECK: STRICTLY ajitsinghca9@gmail.com
  const isSuperAdmin = currentUser?.role === 'admin' && currentUser?.email?.toLowerCase() === 'ajitsinghca9@gmail.com';

  // Navigation tab for the super admin suite
  const [adminTab, setAdminTab] = useState<'overview' | 'students' | 'payments' | 'content' | 'community' | 'reports' | 'audit' | 'config'>('overview');

  // Shared Toast Notification
  const [adminToast, setAdminToast] = useState<{ message: string; type: 'success' | 'info' | 'error' } | null>(null);
  const showToast = (message: string, type: 'success' | 'info' | 'error' = 'success') => {
    setAdminToast({ message, type });
    setTimeout(() => setAdminToast(null), 4000);
  };

  // -------------------------------------------------------------
  // 1. DATA STATE HOOKS
  // -------------------------------------------------------------
  const [studentsList, setStudentsList] = useState<UserProfile[]>(() => getAllUsers());
  const [paymentRequests, setPaymentRequests] = useState<PaymentRequest[]>(() => getPaymentRequests());
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>(() => getAdminAuditLogs());
  const [subjectChapters, setSubjectChapters] = useState<SubjectChapter[]>(() => getSubjectChapters());
  const [questionsList, setQuestionsList] = useState<MCQQuestion[]>(() => getAllQuestions());
  const [moderationReports, setModerationReports] = useState<ModerationReport[]>(() => getModerationReports());
  const [communityPosts, setCommunityPosts] = useState<CommunityPost[]>(() => getPosts());

  // Config states
  const [upiConfig, setUpiConfig] = useState<UpiConfig>(() => getUpiConfig());
  const [upiSavedNotice, setUpiSavedNotice] = useState(false);
  const [countdownConfig, setCountdownConfig] = useState<ExamCountdownConfig>(() => propCountdownConfig || getExamCountdownConfig());
  const [countdownSavedNotice, setCountdownSavedNotice] = useState(false);
  const [isSyncingCountdown, setIsSyncingCountdown] = useState(false);
  const [referralConfig, setReferralConfig] = useState<ReferralRewardConfig>(() => getReferralConfig());
  const [referralSavedNotice, setReferralSavedNotice] = useState(false);

  // Sync prop changes for countdown
  useEffect(() => {
    if (propCountdownConfig) setCountdownConfig(propCountdownConfig);
  }, [propCountdownConfig]);

  useEffect(() => {
    const unsub = subscribeToExamConfig((cloudConfig) => {
      if (cloudConfig) {
        setCountdownConfig(cloudConfig);
        if (setPropCountdownConfig) setPropCountdownConfig(cloudConfig);
      }
    });
    return () => unsub();
  }, [setPropCountdownConfig]);

  // Real-time Firestore sync for moderation reports
  useEffect(() => {
    if (!isSuperAdmin) return;
    const unsub = subscribeToModerationReports((cloudReports) => {
      if (cloudReports.length > 0) setModerationReports(cloudReports);
    });
    return () => unsub();
  }, [isSuperAdmin]);

  // Reload shared data helper
  const reloadData = () => {
    setStudentsList(getAllUsers());
    setPaymentRequests(getPaymentRequests());
    setAuditLogs(getAdminAuditLogs());
    setSubjectChapters(getSubjectChapters());
    setQuestionsList(getAllQuestions());
    setModerationReports(getModerationReports());
    setCommunityPosts(getPosts());
  };

  // -------------------------------------------------------------
  // 2. PAYMENTS TAB STATE & ACTIONS
  // -------------------------------------------------------------
  const [paymentFilter, setPaymentFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [zoomedScreenshot, setZoomedScreenshot] = useState<string | null>(null);
  const [rejectingPaymentId, setRejectingPaymentId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState('Transaction reference (UTR) not reflected in bank credit statement.');

  const handleApprovePayment = (id: string, studentName: string) => {
    playChimeSound('success');
    const res = approvePaymentRequest(id, currentUser.name, 'Verified with UPI bank ledger. 30-day all-access membership activated.');
    if (res.success) {
      reloadData();
      showToast(language === 'en' ? `Payment for ${studentName} verified! 30-Day pass unlocked.` : `भुगतान स्वीकृत! ${studentName} के लिए 30-दिवसीय पास सक्रिय हो गया।`, 'success');
    } else {
      showToast(res.message, 'error');
    }
  };

  const handleConfirmReject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectingPaymentId) return;
    playChimeSound('click');
    const res = rejectPaymentRequest(rejectingPaymentId, currentUser.name, rejectionReason);
    if (res.success) {
      reloadData();
      setRejectingPaymentId(null);
      showToast(language === 'en' ? 'Payment rejected and student notified.' : 'भुगतान अस्वीकृत कर दिया गया है।', 'info');
    }
  };

  // -------------------------------------------------------------
  // 3. STUDENT MANAGEMENT STATE & ACTIONS
  // -------------------------------------------------------------
  const [studentSearchQuery, setStudentSearchQuery] = useState('');
  const [studentStatusFilter, setStudentStatusFilter] = useState<string>('all');
  const [selectedStudentForExpiry, setSelectedStudentForExpiry] = useState<UserProfile | null>(null);
  const [customExpiryDate, setCustomExpiryDate] = useState('');
  const [suspensionModalStudent, setSuspensionModalStudent] = useState<UserProfile | null>(null);
  const [suspensionReasonText, setSuspensionReasonText] = useState('Violation of community code of conduct');

  const filteredStudents = useMemo(() => {
    return studentsList.filter((s) => {
      const q = studentSearchQuery.toLowerCase().trim();
      const matchesSearch = !q || 
        s.name.toLowerCase().includes(q) || 
        s.email.toLowerCase().includes(q) || 
        (s.phone && s.phone.includes(q)) || 
        (s.paymentReference && s.paymentReference.toLowerCase().includes(q));

      if (!matchesSearch) return false;
      if (studentStatusFilter === 'all') return true;
      if (studentStatusFilter === 'suspended') return !!s.isSuspended;
      
      const st = getStudentMembershipStatus(s, paymentRequests.filter((p) => p.studentId === s.id));
      return st.status === studentStatusFilter;
    });
  }, [studentsList, studentSearchQuery, studentStatusFilter, paymentRequests]);

  const handleToggleSuspend = (student: UserProfile) => {
    const isCurrentlySuspended = !!student.isSuspended;
    const res = toggleSuspendStudent(student.id, currentUser.name, isCurrentlySuspended ? undefined : suspensionReasonText);
    if (res.success) {
      reloadData();
      setSuspensionModalStudent(null);
      showToast(
        language === 'en'
          ? `Student ${student.name} account ${isCurrentlySuspended ? 'reactivated' : 'suspended'}.`
          : `छात्र ${student.name} का खाता ${isCurrentlySuspended ? 'पुनः सक्रिय' : 'निलंबित'} किया गया।`,
        isCurrentlySuspended ? 'success' : 'info'
      );
    }
  };

  const handleQuickExtend = (studentId: string, days: number, studentName: string) => {
    const res = extendStudentMembership(studentId, days, currentUser.name);
    if (res.success) {
      reloadData();
      showToast(language === 'en' ? `Extended ${days} days access for ${studentName}!` : `${studentName} के लिए ${days} दिनों की सदस्यता बढ़ाई गई!`, 'success');
    }
  };

  const handleSaveCustomExpiry = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudentForExpiry || !customExpiryDate) return;
    const res = setStudentMembershipExpiry(selectedStudentForExpiry.id, customExpiryDate, currentUser.name);
    if (res.success) {
      reloadData();
      setSelectedStudentForExpiry(null);
      showToast(language === 'en' ? `Updated expiry for ${selectedStudentForExpiry.name}!` : 'सदस्यता समाप्ति तिथि अद्यतन की गई!');
    }
  };

  // -------------------------------------------------------------
  // 4. CONTENT MANAGEMENT: CHAPTERS & QUESTIONS
  // -------------------------------------------------------------
  const [contentPaperTab, setContentPaperTab] = useState<PaperId>('paper1');
  const [questionSearch, setQuestionSearch] = useState('');
  const [selectedChapterFilter, setSelectedChapterFilter] = useState<string>('all');
  const [showAddChapterModal, setShowAddChapterModal] = useState(false);
  const [newChapterTitleEn, setNewChapterTitleEn] = useState('');
  const [newChapterTitleHi, setNewChapterTitleHi] = useState('');
  const [newChapterNumber, setNewChapterNumber] = useState<number>(1);

  const [showAddQuestionModal, setShowAddQuestionModal] = useState(false);
  const [editingQuestionId, setEditingQuestionId] = useState<string | null>(null);
  const [qPaperId, setQPaperId] = useState<PaperId>('paper1');
  const [qChapterId, setQChapterId] = useState<string>('ch_p1_01');
  const [qTextEn, setQTextEn] = useState('');
  const [qTextHi, setQTextHi] = useState('');
  const [qOptAEn, setQOptAEn] = useState('');
  const [qOptAHi, setQOptAHi] = useState('');
  const [qOptBEn, setQOptBEn] = useState('');
  const [qOptBHi, setQOptBHi] = useState('');
  const [qOptCEn, setQOptCEn] = useState('');
  const [qOptCHi, setQOptCHi] = useState('');
  const [qOptDEn, setQOptDEn] = useState('');
  const [qOptDHi, setQOptDHi] = useState('');
  const [qCorrectIndex, setQCorrectIndex] = useState<number>(0);
  const [qExpEn, setQExpEn] = useState('');
  const [qExpHi, setQExpHi] = useState('');
  const [qSourceCitation, setQSourceCitation] = useState('ICAI Study Module 2026/27 Chapter Revision');
  const [qAttemptTag, setQAttemptTag] = useState('January 2027');

  const filteredChapters = useMemo(() => {
    return subjectChapters.filter((c) => c.paperId === contentPaperTab);
  }, [subjectChapters, contentPaperTab]);

  const filteredQuestions = useMemo(() => {
    return questionsList.filter((q) => {
      if (q.paperId !== contentPaperTab) return false;
      if (selectedChapterFilter !== 'all' && q.chapterId !== selectedChapterFilter) return false;
      if (questionSearch.trim()) {
        const needle = questionSearch.toLowerCase();
        return (
          q.question.en.toLowerCase().includes(needle) ||
          q.question.hi.toLowerCase().includes(needle) ||
          (q.sourceLabel && q.sourceLabel.en.toLowerCase().includes(needle))
        );
      }
      return true;
    });
  }, [questionsList, contentPaperTab, selectedChapterFilter, questionSearch]);

  const handleCreateChapter = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newChapterTitleEn.trim()) return;
    const newChap: SubjectChapter = {
      id: `ch_${contentPaperTab}_${Date.now()}`,
      paperId: contentPaperTab,
      chapterNumber: newChapterNumber,
      title: {
        en: newChapterTitleEn.trim(),
        hi: newChapterTitleHi.trim() || newChapterTitleEn.trim(),
      },
      questionCount: 0,
    };
    addSubjectChapter(newChap, currentUser.name);
    reloadData();
    setShowAddChapterModal(false);
    setNewChapterTitleEn('');
    setNewChapterTitleHi('');
    showToast(language === 'en' ? 'New chapter created successfully!' : 'नया अध्याय सफलतापूर्वक जोड़ा गया!');
  };

  const handleSaveQuestion = (e: React.FormEvent) => {
    e.preventDefault();
    if (!qTextEn.trim() || !qOptAEn.trim() || !qOptBEn.trim()) {
      showToast('Please fill in required question and options fields.', 'error');
      return;
    }

    const chap = subjectChapters.find((c) => c.id === qChapterId) || filteredChapters[0];

    const questionPayload: MCQQuestion = {
      id: editingQuestionId || `cq_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      paperId: qPaperId,
      chapterId: chap?.id || 'ch_gen',
      chapterTitle: chap?.title || { en: 'General Chapter', hi: 'सामान्य अध्याय' },
      difficulty: 'medium',
      question: {
        en: qTextEn,
        hi: qTextHi || qTextEn,
      },
      options: {
        en: [qOptAEn, qOptBEn, qOptCEn, qOptDEn],
        hi: [qOptAHi || qOptAEn, qOptBHi || qOptBEn, qOptCHi || qOptCEn, qOptDHi || qOptDEn],
      },
      correctIndex: qCorrectIndex,
      explanation: {
        en: qExpEn || 'Refer to official ICAI CA Foundation Module guidance notes.',
        hi: qExpHi || 'कृपया आधिकारिक आईसीएआई सीए फाउंडेशन अध्ययन सामग्री का संदर्भ लें।',
      },
      keyRule: {
        en: 'Refer to ICAI Study Material Section Guidance',
        hi: 'आईसीएआई अध्ययन सामग्री अनुभाग दिशानिर्देश देखें',
      },
      sourceType: 'ICAI_MODULE',
      sourceLabel: {
        en: qSourceCitation,
        hi: qSourceCitation,
      },
      examAttempt: qAttemptTag,
      officialQuestionRef: `ICAI-${qPaperId.toUpperCase()}-${Date.now().toString().slice(-4)}`,
      officialSourceLink: 'https://boslive.icai.org',
    };

    if (editingQuestionId) {
      updateCustomQuestion(editingQuestionId, questionPayload, currentUser.name);
      showToast(language === 'en' ? 'Question updated!' : 'प्रश्न अद्यतन किया गया!');
    } else {
      addCustomQuestion(questionPayload, currentUser.name);
      showToast(language === 'en' ? 'Question added to Question Bank!' : 'प्रश्न बैंक में नया प्रश्न जोड़ा गया!');
    }

    reloadData();
    setShowAddQuestionModal(false);
    setEditingQuestionId(null);
  };

  const handleDeleteQuestionItem = (qId: string) => {
    if (confirm(language === 'en' ? 'Delete this question from question bank?' : 'क्या आप इस प्रश्न को हटाना चाहते हैं?')) {
      deleteCustomQuestion(qId, currentUser.name);
      reloadData();
      showToast(language === 'en' ? 'Question deleted.' : 'प्रश्न हटा दिया गया।', 'info');
    }
  };

  // -------------------------------------------------------------
  // 5. COMMUNITY MODERATION
  // -------------------------------------------------------------
  const handleResolveReportItem = (reportId: string, status: 'resolved' | 'dismissed') => {
    playChimeSound('click');
    resolveReport(reportId, status);
    resolveModerationReportInDb(reportId, status).catch(console.error);
    reloadData();
    showToast(`Report ${status}!`, 'info');
  };

  const handleDeletePostItem = (postId: string) => {
    if (confirm(language === 'en' ? 'Delete this post?' : 'इस पोस्ट को हटाएं?')) {
      deletePost(postId);
      deletePostFromDb(postId).catch(console.error);
      reloadData();
      showToast(language === 'en' ? 'Post deleted from community.' : 'पोस्ट हटा दी गई।', 'info');
    }
  };

  const handleTogglePinPostItem = (postId: string) => {
    togglePinPost(postId);
    reloadData();
    showToast(language === 'en' ? 'Post pin status updated.' : 'पिन स्थिति अपडेट की गई।');
  };

  // -------------------------------------------------------------
  // 6. UPI & EXAM SETTINGS ACTIONS
  // -------------------------------------------------------------
  const handleQrUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const updated = { ...upiConfig, qrCodeImageUrl: reader.result as string };
      setUpiConfig(updated);
      saveUpiConfig(updated);
      showToast(language === 'en' ? 'UPI QR Image updated!' : 'क्यूआर इमेज अपडेट किया गया!');
    };
    reader.readAsDataURL(file);
  };

  const handleSaveUpi = (e: React.FormEvent) => {
    e.preventDefault();
    saveUpiConfig(upiConfig);
    setUpiSavedNotice(true);
    setTimeout(() => setUpiSavedNotice(false), 3000);
    showToast(language === 'en' ? 'UPI Settings Saved!' : 'यूपीआई सेटिंग्स सहेजी गईं!');
  };

  const handleSaveExamCountdown = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSyncingCountdown(true);
    saveExamCountdownConfig(countdownConfig);
    if (setPropCountdownConfig) setPropCountdownConfig(countdownConfig);
    try {
      await saveExamConfigToDb(countdownConfig);
    } catch (err) {
      console.error('Failed to sync to Firestore:', err);
    } finally {
      setIsSyncingCountdown(false);
    }
    setCountdownSavedNotice(true);
    setTimeout(() => setCountdownSavedNotice(false), 3000);
    showToast(language === 'en' ? 'Exam configuration synced to Firestore!' : 'परीक्षा विन्यास फायरस्टोर में सिंक हुआ!');
  };

  const handleSaveReferral = (e: React.FormEvent) => {
    e.preventDefault();
    saveReferralConfig(referralConfig);
    setReferralSavedNotice(true);
    setTimeout(() => setReferralSavedNotice(false), 3000);
    showToast(language === 'en' ? 'Referral policy saved!' : 'रेफरल नीति सहेजी गई!');
  };

  // -------------------------------------------------------------
  // 7. KEY OVERVIEW METRICS
  // -------------------------------------------------------------
  const pendingPayments = useMemo(() => paymentRequests.filter((p) => p.status === 'pending'), [paymentRequests]);
  const approvedPayments = useMemo(() => paymentRequests.filter((p) => p.status === 'approved'), [paymentRequests]);
  const rejectedPayments = useMemo(() => paymentRequests.filter((p) => p.status === 'rejected'), [paymentRequests]);

  const totalRevenue = useMemo(() => {
    return approvedPayments.reduce((acc, p) => acc + (p.amount || 5), 0);
  }, [approvedPayments]);

  const activeMembershipsCount = useMemo(() => {
    return studentsList.filter((s) => {
      const st = getStudentMembershipStatus(s, paymentRequests.filter((p) => p.studentId === s.id));
      return st.status === 'active';
    }).length;
  }, [studentsList, paymentRequests]);

  const expiredMembershipsCount = useMemo(() => {
    return studentsList.filter((s) => {
      const st = getStudentMembershipStatus(s, paymentRequests.filter((p) => p.studentId === s.id));
      return st.status === 'expired';
    }).length;
  }, [studentsList, paymentRequests]);

  // STRICT 403 RESTRICTION: Non-Super Admin Access is blocked completely
  if (!isSuperAdmin) {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 border border-red-200 dark:border-red-900/60 text-center max-w-md mx-auto space-y-4 my-12 shadow-xl">
        <div className="w-16 h-16 rounded-2xl bg-red-50 dark:bg-red-950/80 text-red-600 dark:text-red-400 mx-auto flex items-center justify-center">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-black text-slate-900 dark:text-white">
          403 — Private Super Admin Dashboard
        </h2>
        <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
          Access to administrative controls, student verification, and transaction records is strictly restricted to <strong className="text-purple-600 dark:text-purple-400">ajitsinghca9@gmail.com</strong>.
        </p>
        <p className="text-[11px] text-slate-400">
          This incident is logged. If you are an authorized administrator, please log in with your verified administrative credentials.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-24 lg:pb-8">
      {/* Toast Alert */}
      {adminToast && (
        <div className={`p-4 rounded-2xl text-xs font-bold border flex items-center justify-between shadow-lg transition-all animate-in fade-in slide-in-from-top-2 ${
          adminToast.type === 'success'
            ? 'bg-emerald-50 dark:bg-emerald-950/80 border-emerald-300 dark:border-emerald-700 text-emerald-800 dark:text-emerald-200'
            : adminToast.type === 'info'
              ? 'bg-blue-50 dark:bg-blue-950/80 border-blue-300 dark:border-blue-700 text-blue-800 dark:text-blue-200'
              : 'bg-red-50 dark:bg-red-950/80 border-red-300 dark:border-red-700 text-red-800 dark:text-red-200'
        }`}>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{adminToast.message}</span>
          </div>
          <button onClick={() => setAdminToast(null)} className="p-1 hover:opacity-75 cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Super Admin Top Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-md bg-purple-100 dark:bg-purple-950 text-purple-800 dark:text-purple-300 text-[10px] font-black uppercase tracking-wider border border-purple-200 dark:border-purple-800">
              Super Admin Console
            </span>
            <span className="text-xs text-slate-500 font-bold">ajitsinghca9@gmail.com</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2 mt-1">
            <ShieldCheck className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            <span>{language === 'en' ? 'Super Admin Management Center' : 'सुपर एडमिन प्रबंधन केंद्र'}</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Verified manual payment verification, student membership controls, question bank authoring, and audit logging.
          </p>
        </div>

        {/* Global Navigation Tabs */}
        <div className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 text-xs">
          {[
            { id: 'overview', labelEn: 'Overview', labelHi: 'विवरण', icon: BarChart3 },
            { id: 'students', labelEn: `Students (${studentsList.length})`, labelHi: `छात्र (${studentsList.length})`, icon: Users },
            { id: 'payments', labelEn: `Payments (${pendingPayments.length})`, labelHi: `भुगतान (${pendingPayments.length})`, icon: QrCode, badge: pendingPayments.length > 0 ? pendingPayments.length : undefined },
            { id: 'content', labelEn: 'Content & Chapters', labelHi: 'सामग्री व अध्याय', icon: BookOpen },
            { id: 'community', labelEn: 'Community & Reports', labelHi: 'कम्युनिटी', icon: MessageSquare },
            { id: 'reports', labelEn: 'Reports & CSV', labelHi: 'रिपोर्ट्स', icon: FileSpreadsheet },
            { id: 'audit', labelEn: 'Audit Logs', labelHi: 'ऑडिट लॉग', icon: ShieldCheck },
            { id: 'config', labelEn: 'Exam & UPI Config', labelHi: 'सेटिंग्स', icon: Sliders },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = adminTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setAdminTab(tab.id as any)}
                className={`px-3 py-1.5 rounded-xl font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  isActive
                    ? 'bg-purple-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-white/60 dark:hover:bg-slate-700/60'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{language === 'en' ? tab.labelEn : tab.labelHi}</span>
                {tab.badge && (
                  <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] font-black bg-rose-500 text-white animate-pulse">
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* ==================================================================== */}
      {/* TAB 1: OVERVIEW & DASHBOARD METRICS                                  */}
      {/* ==================================================================== */}
      {adminTab === 'overview' && (
        <div className="space-y-6">
          {/* Key Stat Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
            <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs">
              <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 block">Total Registered</span>
              <span className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white mt-1 block">
                {studentsList.length}
              </span>
              <span className="text-[10px] text-purple-600 dark:text-purple-400 font-bold block mt-1">Aspirants enrolled</span>
            </div>

            <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-3xl border border-emerald-200 dark:border-emerald-900/60 shadow-xs bg-emerald-50/20">
              <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 block">Active Subscriptions</span>
              <span className="text-2xl sm:text-3xl font-black text-emerald-600 dark:text-emerald-400 mt-1 block">
                {activeMembershipsCount}
              </span>
              <span className="text-[10px] text-emerald-700 font-bold block mt-1">₹5/month pass unlocked</span>
            </div>

            <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-3xl border border-amber-200 dark:border-amber-900/60 shadow-xs bg-amber-50/20">
              <span className="text-[11px] font-bold text-amber-700 dark:text-amber-400 block">Pending Approvals</span>
              <span className="text-2xl sm:text-3xl font-black text-amber-600 dark:text-amber-400 mt-1 block">
                {pendingPayments.length}
              </span>
              <span className="text-[10px] text-amber-700 font-bold block mt-1">Awaiting manual UTR review</span>
            </div>

            <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-3xl border border-purple-200 dark:border-purple-900/60 shadow-xs bg-purple-50/20">
              <span className="text-[11px] font-bold text-purple-700 dark:text-purple-300 block">Total Revenue (₹)</span>
              <span className="text-2xl sm:text-3xl font-black text-purple-600 dark:text-purple-400 mt-1 block">
                ₹{totalRevenue}
              </span>
              <span className="text-[10px] text-purple-700 font-bold block mt-1">{approvedPayments.length} verified transactions</span>
            </div>
          </div>

          {/* Quick Actions & Recent Activities */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Quick Actions Panel */}
            <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
              <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
                <Sliders className="w-4 h-4 text-purple-600" />
                <span>Super Admin Quick Actions</span>
              </h3>
              <div className="space-y-2 text-xs">
                <button
                  onClick={() => setAdminTab('payments')}
                  className="w-full py-2.5 px-3 rounded-xl bg-purple-50 dark:bg-purple-950/60 hover:bg-purple-100 text-purple-800 dark:text-purple-200 font-bold flex items-center justify-between cursor-pointer"
                >
                  <span className="flex items-center gap-2">
                    <QrCode className="w-4 h-4 text-purple-600" />
                    <span>Review Pending Payments ({pendingPayments.length})</span>
                  </span>
                  <span className="text-xs font-mono font-black">→</span>
                </button>

                <button
                  onClick={() => {
                    const csv = exportStudentsToCsv(studentsList);
                    downloadCsvFile(`ca_saathi_students_${new Date().toISOString().slice(0, 10)}.csv`, csv);
                    showToast('Students CSV Downloaded!');
                  }}
                  className="w-full py-2.5 px-3 rounded-xl bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold flex items-center justify-between cursor-pointer"
                >
                  <span className="flex items-center gap-2">
                    <Download className="w-4 h-4 text-blue-600" />
                    <span>Export Students Master CSV</span>
                  </span>
                  <span className="text-xs font-mono font-black">.csv</span>
                </button>

                <button
                  onClick={() => {
                    setContentPaperTab('paper1');
                    setAdminTab('content');
                    setShowAddQuestionModal(true);
                  }}
                  className="w-full py-2.5 px-3 rounded-xl bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold flex items-center justify-between cursor-pointer"
                >
                  <span className="flex items-center gap-2">
                    <Plus className="w-4 h-4 text-emerald-600" />
                    <span>Add Verified ICAI Question</span>
                  </span>
                  <span className="text-xs font-mono font-black">+</span>
                </button>

                <button
                  onClick={() => setAdminTab('config')}
                  className="w-full py-2.5 px-3 rounded-xl bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold flex items-center justify-between cursor-pointer"
                >
                  <span className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-amber-600" />
                    <span>Configure Active Exam Attempt</span>
                  </span>
                  <span className="text-xs font-mono font-black">→</span>
                </button>
              </div>
            </div>

            {/* Recent Audit Activities Stream */}
            <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
                <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-purple-600" />
                  <span>Real-time Administrative Audit Stream</span>
                </h3>
                <button
                  onClick={() => setAdminTab('audit')}
                  className="text-xs font-bold text-purple-600 dark:text-purple-400 hover:underline cursor-pointer"
                >
                  View All Logs ({auditLogs.length})
                </button>
              </div>

              <div className="space-y-2.5 max-h-72 overflow-y-auto text-xs">
                {auditLogs.slice(0, 6).map((log) => (
                  <div
                    key={log.id}
                    className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 flex items-start justify-between gap-3"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded-md font-bold text-[10px] uppercase ${
                          log.type === 'payment' ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300' :
                          log.type === 'user' ? 'bg-purple-100 dark:bg-purple-950 text-purple-800 dark:text-purple-300' :
                          log.type === 'content' ? 'bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300' :
                          'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300'
                        }`}>
                          {log.action}
                        </span>
                        <span className="font-bold text-slate-900 dark:text-white">{log.targetName || log.targetId}</span>
                      </div>
                      <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-1">{log.details}</p>
                    </div>
                    <span className="text-[10px] text-slate-400 whitespace-nowrap">
                      {new Date(log.timestamp).toLocaleDateString()}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* TAB 2: STUDENT MANAGEMENT & MEMBERSHIP CONTROLS                       */}
      {/* ==================================================================== */}
      {adminTab === 'students' && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
            <div>
              <h3 className="font-black text-slate-900 dark:text-white text-base flex items-center gap-2">
                <Users className="w-5 h-5 text-purple-600" />
                <span>Student Management & Subscriptions ({filteredStudents.length} Aspirants)</span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Search, inspect unique payment references, extend 30/90 days validity, or suspend disruptive accounts.
              </p>
            </div>

            {/* Quick Export Button */}
            <button
              onClick={() => {
                const csv = exportStudentsToCsv(filteredStudents);
                downloadCsvFile(`students_export_${new Date().toISOString().slice(0, 10)}.csv`, csv);
                showToast('Students export CSV generated!');
              }}
              className="px-3.5 py-1.5 rounded-xl bg-purple-50 dark:bg-purple-950/60 hover:bg-purple-100 text-purple-700 dark:text-purple-300 font-bold text-xs flex items-center gap-1.5 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </button>
          </div>

          {/* Search & Filters */}
          <div className="flex flex-col sm:flex-row items-center gap-3 text-xs">
            <div className="relative flex-1 w-full">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={studentSearchQuery}
                onChange={(e) => setStudentSearchQuery(e.target.value)}
                placeholder="Search by student name, email, mobile (+91), or payment reference (CAS-2027-XXXX)..."
                className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Filter className="w-4 h-4 text-slate-400" />
              <select
                value={studentStatusFilter}
                onChange={(e) => setStudentStatusFilter(e.target.value)}
                className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-bold"
              >
                <option value="all">All Membership Statuses</option>
                <option value="active">Active Members (₹5 Paid)</option>
                <option value="pending">Pending Payment Review</option>
                <option value="expired">Expired Memberships</option>
                <option value="unpaid">Unpaid Students</option>
                <option value="suspended">Suspended Accounts</option>
              </select>
            </div>
          </div>

          {/* Student Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 uppercase text-[10px] font-black">
                <tr>
                  <th className="p-3 rounded-l-xl">Student Details</th>
                  <th className="p-3">Payment Reference</th>
                  <th className="p-3">Target Attempt</th>
                  <th className="p-3">Membership Status</th>
                  <th className="p-3">Valid Until</th>
                  <th className="p-3 text-right rounded-r-xl">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredStudents.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-400">
                      No students match the search filter.
                    </td>
                  </tr>
                ) : (
                  filteredStudents.map((st) => {
                    const studentPayments = paymentRequests.filter((p) => p.studentId === st.id);
                    const mem = getStudentMembershipStatus(st, studentPayments);
                    const isSusp = !!st.isSuspended;

                    return (
                      <tr key={st.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                        <td className="p-3">
                          <div className="flex items-center gap-2.5">
                            <span className="text-2xl">{st.avatar}</span>
                            <div>
                              <div className="flex items-center gap-1.5">
                                <span className="font-bold text-slate-900 dark:text-white text-sm">{st.name}</span>
                                {isSusp && (
                                  <span className="px-1.5 py-0.2 rounded text-[9px] font-black bg-rose-100 text-rose-700">
                                    SUSPENDED
                                  </span>
                                )}
                              </div>
                              <span className="text-[11px] text-slate-500 block">{st.email}</span>
                              {st.phone && (
                                <span className="text-[10px] font-mono text-blue-600 dark:text-blue-400 font-bold">
                                  📱 {st.phone}
                                </span>
                              )}
                            </div>
                          </div>
                        </td>

                        <td className="p-3">
                          <div className="flex items-center gap-1">
                            <span className="font-mono font-bold text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-950 px-2 py-0.5 rounded text-[11px]">
                              {st.paymentReference || 'CAS-NONE'}
                            </span>
                            {st.paymentReference && (
                              <button
                                onClick={() => {
                                  try { navigator.clipboard?.writeText(st.paymentReference || ''); } catch (_) {}
                                  showToast(`Copied ${st.paymentReference}!`, 'info');
                                }}
                                className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded cursor-pointer text-slate-500"
                                title="Copy Reference"
                              >
                                <Copy className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                        </td>

                        <td className="p-3">
                          <span className="font-bold text-slate-700 dark:text-slate-300">{st.targetAttempt}</span>
                        </td>

                        <td className="p-3">
                          <span className={`px-2.5 py-0.5 rounded-full font-bold text-[10px] uppercase ${
                            mem.status === 'active' ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300' :
                            mem.status === 'pending' ? 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300' :
                            mem.status === 'expired' ? 'bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300' :
                            'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                          }`}>
                            {mem.status}
                          </span>
                        </td>

                        <td className="p-3">
                          <span className="font-mono text-slate-600 dark:text-slate-400">
                            {st.subscriptionExpiresAt ? new Date(st.subscriptionExpiresAt).toLocaleDateString() : 'N/A'}
                          </span>
                          {mem.daysRemaining !== null && mem.daysRemaining > 0 && (
                            <span className="text-[10px] text-emerald-600 block font-bold">
                              {mem.daysRemaining} days left
                            </span>
                          )}
                        </td>

                        <td className="p-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {/* Extend +30 Days */}
                            <button
                              onClick={() => handleQuickExtend(st.id, 30, st.name)}
                              className="px-2 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950 hover:bg-emerald-100 text-emerald-700 dark:text-emerald-300 font-bold text-[10px] cursor-pointer"
                              title="Add 30 Days Access"
                            >
                              +30d
                            </button>

                            {/* Custom Date Modal Trigger */}
                            <button
                              onClick={() => setSelectedStudentForExpiry(st)}
                              className="px-2 py-1 rounded-lg bg-purple-50 dark:bg-purple-950 hover:bg-purple-100 text-purple-700 dark:text-purple-300 font-bold text-[10px] cursor-pointer"
                              title="Set Custom Expiry Date"
                            >
                              Edit Expiry
                            </button>

                            {/* Suspend / Reactivate */}
                            {isSusp ? (
                              <button
                                onClick={() => handleToggleSuspend(st)}
                                className="px-2 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10px] cursor-pointer flex items-center gap-1"
                                title="Reactivate Account"
                              >
                                <UserCheck className="w-3 h-3" />
                                <span>Reactivate</span>
                              </button>
                            ) : (
                              <button
                                onClick={() => setSuspensionModalStudent(st)}
                                className="px-2 py-1 rounded-lg bg-rose-50 dark:bg-rose-950 hover:bg-rose-100 text-rose-700 dark:text-rose-300 font-bold text-[10px] cursor-pointer flex items-center gap-1"
                                title="Suspend Student Account"
                              >
                                <UserX className="w-3 h-3" />
                                <span>Suspend</span>
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* TAB 3: PAYMENT VERIFICATION & UTR QUEUE                              */}
      {/* ==================================================================== */}
      {adminTab === 'payments' && (
        <div className="space-y-6">
          {/* Revenue Counter Banner */}
          <div className="bg-gradient-to-r from-purple-900 to-indigo-900 text-white p-5 rounded-3xl shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <span className="text-xs uppercase tracking-wider text-purple-200 font-bold">Bank Verification Ledger</span>
              <h2 className="text-2xl font-black mt-0.5">Verified UPI Revenue: ₹{totalRevenue}</h2>
              <p className="text-xs text-purple-100 opacity-90 mt-1">
                Displaying student payment submissions for personal UPI ({upiConfig.upiId}). Verify UTR with bank records before approval.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  const csv = exportPaymentsToCsv(paymentRequests);
                  downloadCsvFile(`payments_ledger_${new Date().toISOString().slice(0, 10)}.csv`, csv);
                  showToast('Payments Ledger CSV Downloaded!');
                }}
                className="px-4 py-2 rounded-xl bg-white/20 hover:bg-white/30 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer backdrop-blur-xs"
              >
                <Download className="w-4 h-4" />
                <span>Export Ledger CSV</span>
              </button>
            </div>
          </div>

          {/* Payment Requests Table */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <h3 className="font-black text-slate-900 dark:text-white text-base">
                  Payment Requests & Manual Review Queue
                </h3>
                <span className="text-xs text-slate-500">
                  Access activates ONLY upon manual admin approval. Never auto-unlocks.
                </span>
              </div>

              {/* Status Filter */}
              <div className="inline-flex p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl text-xs">
                {(['all', 'pending', 'approved', 'rejected'] as const).map((st) => (
                  <button
                    key={st}
                    onClick={() => setPaymentFilter(st)}
                    className={`px-3 py-1 rounded-xl font-bold capitalize transition-all cursor-pointer ${
                      paymentFilter === st
                        ? 'bg-purple-600 text-white shadow-xs'
                        : 'text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    {st} {st === 'pending' && pendingPayments.length > 0 && `(${pendingPayments.length})`}
                  </button>
                ))}
              </div>
            </div>

            {/* Request Cards */}
            {paymentRequests
              .filter((p) => (paymentFilter === 'all' ? true : p.status === paymentFilter))
              .map((pay) => (
                <div
                  key={pay.id}
                  className="p-4 rounded-3xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs"
                >
                  <div className="flex items-start gap-4">
                    {/* Zoomable Screenshot */}
                    {pay.screenshotUrl ? (
                      <div
                        onClick={() => setZoomedScreenshot(pay.screenshotUrl)}
                        className="w-16 h-16 rounded-2xl border border-slate-200 overflow-hidden shrink-0 relative group cursor-pointer shadow-xs"
                        title="Click to zoom screenshot"
                      >
                        <img
                          src={pay.screenshotUrl}
                          alt="Payment Proof"
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity">
                          <Eye className="w-4 h-4" />
                        </div>
                      </div>
                    ) : (
                      <div className="w-16 h-16 rounded-2xl bg-slate-200 flex items-center justify-center text-slate-400 shrink-0">
                        No Pic
                      </div>
                    )}

                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-slate-900 dark:text-white">{pay.studentName}</span>
                        <span className="font-mono text-purple-700 dark:text-purple-300 font-bold px-2 py-0.5 rounded-md bg-purple-50 dark:bg-purple-950">
                          ₹{pay.amount} ({pay.planType === 'monthly_access' ? 'Monthly Pass' : 'Test Pass'})
                        </span>
                        {pay.paymentReference && (
                          <span className="font-mono text-[10px] font-bold text-slate-500 bg-slate-100 dark:bg-slate-700 px-1.5 py-0.2 rounded">
                            Ref: {pay.paymentReference}
                          </span>
                        )}
                      </div>

                      {/* UTR Copy */}
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-slate-700 dark:text-slate-300">
                          UTR: <strong className="text-slate-900 dark:text-white select-all text-sm">{pay.utr}</strong>
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            try { navigator.clipboard?.writeText(pay.utr); } catch (_) {}
                            showToast(`UTR ${pay.utr} copied!`, 'info');
                          }}
                          className="px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 text-[10px] font-bold cursor-pointer"
                        >
                          Copy UTR
                        </button>
                      </div>

                      {/* Student Contact Info */}
                      <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-500">
                        <span>{pay.studentEmail}</span>
                        <span>•</span>
                        <span className="font-mono font-bold text-blue-600 dark:text-blue-400">
                          📱 {pay.studentMobile || 'No mobile'}
                        </span>
                      </div>

                      <span className="text-[10px] text-slate-400 block">
                        Submitted: {new Date(pay.createdAt).toLocaleString()}
                      </span>
                      {pay.adminNotes && (
                        <span className="text-[11px] text-slate-600 dark:text-slate-400 block italic">
                          Audit note: {pay.adminNotes} (Reviewed by {pay.reviewedBy || 'Admin'})
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions & Status */}
                  <div className="flex items-center gap-2 self-end md:self-auto shrink-0">
                    {pay.status === 'pending' ? (
                      <>
                        <button
                          onClick={() => handleApprovePayment(pay.id, pay.studentName)}
                          className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition-all cursor-pointer flex items-center gap-1.5"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          <span>Approve & Unlock (+30d)</span>
                        </button>
                        <button
                          onClick={() => setRejectingPaymentId(pay.id)}
                          className="px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-xs transition-all cursor-pointer flex items-center gap-1"
                        >
                          <XCircle className="w-4 h-4" />
                          <span>Reject</span>
                        </button>
                      </>
                    ) : (
                      <span className={`px-3 py-1.5 rounded-full text-xs font-bold ${
                        pay.status === 'approved' 
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' 
                          : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                      }`}>
                        {pay.status === 'approved' ? 'Approved & Unlocked ✓' : 'Rejected ✗'}
                      </span>
                    )}
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* TAB 4: CONTENT MANAGEMENT: CHAPTERS & QUESTION BANK                  */}
      {/* ==================================================================== */}
      {adminTab === 'content' && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200 dark:border-slate-800 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
            <div>
              <h3 className="font-black text-slate-900 dark:text-white text-base flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-purple-600" />
                <span>ICAI Study Material & Question Bank Management</span>
              </h3>
              <p className="text-xs text-slate-500">
                Manage syllabus chapters, create official ICAI questions with step-by-step bilingual explanations.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowAddChapterModal(true)}
                className="px-3 py-1.5 rounded-xl border border-purple-200 dark:border-purple-800 hover:bg-purple-50 text-purple-700 dark:text-purple-300 font-bold text-xs flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Chapter</span>
              </button>

              <button
                onClick={() => {
                  setEditingQuestionId(null);
                  setQPaperId(contentPaperTab);
                  setQChapterId(filteredChapters[0]?.id || 'ch_gen');
                  setShowAddQuestionModal(true);
                }}
                className="px-3.5 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Question</span>
              </button>
            </div>
          </div>

          {/* Subject Tabs */}
          <div className="flex flex-wrap gap-2">
            {[
              { id: 'paper1', name: 'Paper 1: Accounting' },
              { id: 'paper2', name: 'Paper 2: Business Laws' },
              { id: 'paper3', name: 'Paper 3: Quantitative Aptitude' },
              { id: 'paper4', name: 'Paper 4: Business Economics' },
            ].map((p) => (
              <button
                key={p.id}
                onClick={() => {
                  setContentPaperTab(p.id as PaperId);
                  setSelectedChapterFilter('all');
                }}
                className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
                  contentPaperTab === p.id
                    ? 'bg-purple-600 text-white shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
                }`}
              >
                {p.name}
              </button>
            ))}
          </div>

          {/* Chapter Filter & Search */}
          <div className="flex flex-col sm:flex-row items-center gap-3 text-xs">
            <div className="w-full sm:w-64">
              <select
                value={selectedChapterFilter}
                onChange={(e) => setSelectedChapterFilter(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold"
              >
                <option value="all">All Chapters ({filteredChapters.length})</option>
                {filteredChapters.map((ch) => (
                  <option key={ch.id} value={ch.id}>
                    Ch {ch.chapterNumber}: {ch.title.en}
                  </option>
                ))}
              </select>
            </div>

            <div className="relative flex-1 w-full">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={questionSearch}
                onChange={(e) => setQuestionSearch(e.target.value)}
                placeholder="Search question text or source citation..."
                className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
              />
            </div>
          </div>

          {/* Question List */}
          <div className="space-y-3">
            {filteredQuestions.length === 0 ? (
              <p className="text-center py-8 text-xs text-slate-400">
                No questions found for this subject and filter. Click "Add Question" to create one.
              </p>
            ) : (
              filteredQuestions.map((q, idx) => (
                <div
                  key={q.id}
                  className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 space-y-2 text-xs"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-black text-purple-600">Q{idx + 1}.</span>
                        <span className="font-bold text-slate-900 dark:text-white text-sm">{q.question.en}</span>
                      </div>
                      <span className="text-[11px] text-slate-500 font-hindi block">{q.question.hi}</span>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        onClick={() => handleDeleteQuestionItem(q.id)}
                        className="p-1.5 rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-100 cursor-pointer"
                        title="Delete Question"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Options */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pt-1">
                    {q.options.en.map((optText, oIdx) => (
                      <div
                        key={oIdx}
                        className={`p-2 rounded-xl border text-[11px] flex items-center gap-2 ${
                          oIdx === q.correctIndex
                            ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200 font-bold'
                            : 'bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        <span className="w-5 h-5 rounded-full flex items-center justify-center bg-slate-100 dark:bg-slate-700 text-[10px] shrink-0 font-bold">
                          {String.fromCharCode(65 + oIdx)}
                        </span>
                        <span>{optText}</span>
                        {oIdx === q.correctIndex && (
                          <Check className="w-3.5 h-3.5 text-emerald-600 ml-auto shrink-0" />
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Metadata and Citations */}
                  <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-[10px] text-slate-500">
                    <span className="font-mono bg-purple-50 dark:bg-purple-950 px-2 py-0.5 rounded text-purple-700 dark:text-purple-300">
                      Citation: {q.sourceLabel ? q.sourceLabel.en : 'ICAI Study Module'}
                    </span>
                    <span className="font-bold text-slate-700 dark:text-slate-300">
                      Attempt: {q.examAttempt} • Chapter: {q.chapterTitle.en}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* TAB 5: COMMUNITY & MODERATION                                        */}
      {/* ==================================================================== */}
      {adminTab === 'community' && (
        <div className="space-y-6">
          {/* Moderation Reports Queue */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
            <h3 className="font-black text-slate-900 dark:text-white text-base flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-500" />
              <span>Student Complaints & Moderation Reports ({moderationReports.filter((r) => r.status === 'pending').length} Pending)</span>
            </h3>

            {moderationReports.length === 0 ? (
              <p className="text-xs text-slate-400 py-6 text-center">No moderation reports logged.</p>
            ) : (
              <div className="space-y-2.5 text-xs">
                {moderationReports.map((rep) => (
                  <div
                    key={rep.id}
                    className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 flex items-center justify-between"
                  >
                    <div>
                      <span className="font-bold text-slate-900 dark:text-white block">{rep.targetTitle}</span>
                      <span className="text-slate-500 text-[11px]">
                        Reason: {rep.reason} • Reporter: {rep.reportedBy} • Status: {rep.status}
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
                          className="px-3 py-1.5 rounded-xl bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold cursor-pointer"
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

          {/* 4 Dedicated Subject Educational Groups Management */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-black text-slate-900 dark:text-white text-base flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-emerald-600" />
                  <span>Strict Four Subject Groups Oversight</span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Only 4 official academic groups permitted. Female student privacy and zero unsolicited DM policy enforced.
                </p>
              </div>
              <span className="text-xs font-bold px-3 py-1 rounded-xl bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                4 Active Forums
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              {[
                { id: 'grp_accounts', paper: 'Paper 1', name: 'Accounting Forum', icon: 'Calculator', members: 1420, active: 38 },
                { id: 'grp_law', paper: 'Paper 2', name: 'Business Laws Hub', icon: 'Scale', members: 1650, active: 44 },
                { id: 'grp_maths', paper: 'Paper 3', name: 'Quantitative Aptitude & LR', icon: 'LineChart', members: 1890, active: 52 },
                { id: 'grp_economics', paper: 'Paper 4', name: 'Business Economics Circle', icon: 'TrendingUp', members: 1310, active: 29 },
              ].map((grp) => (
                <div key={grp.id} className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                      <span className="text-[10px] font-black px-1.5 py-0.5 rounded-md bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-300">
                        {grp.paper}
                      </span>
                      <span>{grp.name}</span>
                    </span>
                    <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-50 dark:bg-emerald-950 px-2 py-0.5 rounded-md">
                      Protected
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-slate-500 text-[11px]">
                    <span>{grp.members.toLocaleString()} Registered Students</span>
                    <span className="text-slate-700 dark:text-slate-300 font-semibold">{grp.active} Active Threads</span>
                  </div>
                  <div className="pt-1 border-t border-slate-200/60 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-600 dark:text-slate-400">
                    <span>Moderator: <strong>CA Ajit Singh</strong></span>
                    <span className="text-emerald-600 font-semibold">Zero Spam Flagged</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
            <h3 className="font-black text-slate-900 dark:text-white text-base flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-purple-600" />
              <span>Community Discussions Oversight ({communityPosts.length} Posts)</span>
            </h3>

            <div className="space-y-3 text-xs">
              {communityPosts.map((post) => (
                <div
                  key={post.id}
                  className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 flex items-start justify-between gap-3"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 dark:text-white">{post.authorName}</span>
                      <span className="text-[10px] text-slate-400">{new Date(post.createdAt).toLocaleDateString()}</span>
                      {post.isPinned && (
                        <span className="px-1.5 py-0.2 rounded text-[9px] bg-purple-100 text-purple-700 font-bold">
                          PINNED
                        </span>
                      )}
                    </div>
                    <p className="text-slate-700 dark:text-slate-300">{post.content}</p>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      onClick={() => handleTogglePinPostItem(post.id)}
                      className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-600 cursor-pointer"
                      title="Toggle Pin"
                    >
                      <Pin className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeletePostItem(post.id)}
                      className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 cursor-pointer"
                      title="Delete Post"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* TAB 6: REPORTS & INSTANT CSV DOWNLOADS                               */}
      {/* ==================================================================== */}
      {adminTab === 'reports' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-xs space-y-5">
            <div>
              <h3 className="font-black text-slate-900 dark:text-white text-lg flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-purple-600" />
                <span>Executive Reports & CSV Data Export</span>
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Generate and download comprehensive spreadsheet reports for auditing, banking reconciliation, and student growth tracking.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Report 1: Students Master Report */}
              <div className="p-5 rounded-3xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 space-y-3">
                <div className="w-10 h-10 rounded-2xl bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-300 flex items-center justify-center font-bold">
                  <Users className="w-5 h-5" />
                </div>
                <h4 className="font-black text-slate-900 dark:text-white text-sm">Students Master Report</h4>
                <p className="text-xs text-slate-500">
                  Full roster including student name, email, registered mobile, unique payment reference, membership status, and subscription expiry.
                </p>
                <button
                  onClick={() => {
                    const csv = exportStudentsToCsv(studentsList);
                    downloadCsvFile(`ca_saathi_students_${new Date().toISOString().slice(0, 10)}.csv`, csv);
                    showToast('Students CSV Downloaded!');
                  }}
                  className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center justify-center gap-2 cursor-pointer shadow-xs"
                >
                  <Download className="w-4 h-4" />
                  <span>Download Students CSV</span>
                </button>
              </div>

              {/* Report 2: Payments & UTR Ledger */}
              <div className="p-5 rounded-3xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 space-y-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-300 flex items-center justify-center font-bold">
                  <QrCode className="w-5 h-5" />
                </div>
                <h4 className="font-black text-slate-900 dark:text-white text-sm">Payments & UTR Ledger</h4>
                <p className="text-xs text-slate-500">
                  Audit trail of all student submissions, UTR transaction numbers, approval dates, amounts, and reviewer notes.
                </p>
                <button
                  onClick={() => {
                    const csv = exportPaymentsToCsv(paymentRequests);
                    downloadCsvFile(`ca_saathi_payments_${new Date().toISOString().slice(0, 10)}.csv`, csv);
                    showToast('Payments Ledger CSV Downloaded!');
                  }}
                  className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-2 cursor-pointer shadow-xs"
                >
                  <Download className="w-4 h-4" />
                  <span>Download Payments CSV</span>
                </button>
              </div>

              {/* Report 3: Revenue Summary */}
              <div className="p-5 rounded-3xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 space-y-3">
                <div className="w-10 h-10 rounded-2xl bg-purple-100 dark:bg-purple-950 text-purple-600 dark:text-purple-300 flex items-center justify-center font-bold">
                  <BarChart3 className="w-5 h-5" />
                </div>
                <h4 className="font-black text-slate-900 dark:text-white text-sm">Revenue & Financial Summary</h4>
                <p className="text-xs text-slate-500">
                  Detailed approved revenue ledger totaling ₹{totalRevenue} across {approvedPayments.length} verified monthly passes.
                </p>
                <button
                  onClick={() => {
                    const csv = exportRevenueToCsv(paymentRequests);
                    downloadCsvFile(`ca_saathi_revenue_${new Date().toISOString().slice(0, 10)}.csv`, csv);
                    showToast('Revenue Summary CSV Downloaded!');
                  }}
                  className="w-full py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs flex items-center justify-center gap-2 cursor-pointer shadow-xs"
                >
                  <Download className="w-4 h-4" />
                  <span>Download Revenue CSV</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* TAB 7: ADMIN AUDIT LOGS                                              */}
      {/* ==================================================================== */}
      {adminTab === 'audit' && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <div>
              <h3 className="font-black text-slate-900 dark:text-white text-base flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-purple-600" />
                <span>Administrative Audit Trail ({auditLogs.length} Records)</span>
              </h3>
              <p className="text-xs text-slate-500">
                Immutable chronological log of all approvals, rejections, suspensions, and content edits.
              </p>
            </div>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
            {auditLogs.map((log) => (
              <div key={log.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 rounded-md font-bold text-[10px] uppercase ${
                      log.type === 'payment' ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300' :
                      log.type === 'user' ? 'bg-purple-100 dark:bg-purple-950 text-purple-800 dark:text-purple-300' :
                      log.type === 'content' ? 'bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300' :
                      'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300'
                    }`}>
                      {log.action}
                    </span>
                    <span className="font-bold text-slate-900 dark:text-white">{log.targetName || log.targetId}</span>
                    <span className="text-[11px] text-slate-400">by {log.performedBy}</span>
                  </div>
                  <p className="text-slate-600 dark:text-slate-400 text-[11px]">{log.details}</p>
                </div>
                <span className="font-mono text-slate-400 text-[10px] shrink-0">
                  {new Date(log.timestamp).toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* TAB 8: EXAM CONFIG & UPI QR SETTINGS                                 */}
      {/* ==================================================================== */}
      {adminTab === 'config' && (
        <div className="space-y-6">
          {/* Exam Countdown & Attempt Configuration */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <h3 className="font-black text-slate-900 dark:text-white text-base flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-purple-600" />
                  <span>CA Foundation Active Exam Attempt & Countdown Settings</span>
                </h3>
                <p className="text-xs text-slate-500">
                  Syncs to Cloud Firestore. Changes reflect in real time on all student dashboards.
                </p>
              </div>

              {countdownSavedNotice && (
                <span className="text-xs font-bold text-emerald-600 flex items-center gap-1 bg-emerald-50 px-2.5 py-1 rounded-lg">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Saved & Synced!</span>
                </span>
              )}
            </div>

            <form onSubmit={handleSaveExamCountdown} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Active Exam Attempt Label *
                  </label>
                  <input
                    type="text"
                    required
                    value={countdownConfig.targetAttempt}
                    onChange={(e) => setCountdownConfig({ ...countdownConfig, targetAttempt: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-bold"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Commencement Date & Time *
                  </label>
                  <input
                    type="datetime-local"
                    required
                    value={countdownConfig.examDate ? countdownConfig.examDate.slice(0, 16) : ''}
                    onChange={(e) => setCountdownConfig({ ...countdownConfig, examDate: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono font-bold"
                  />
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-purple-50/50 dark:bg-purple-950/30 border border-purple-100 dark:border-purple-900 flex items-center gap-3">
                <input
                  type="checkbox"
                  id="chkVerified"
                  checked={countdownConfig.isDateVerified}
                  onChange={(e) => setCountdownConfig({ ...countdownConfig, isDateVerified: e.target.checked })}
                  className="w-4 h-4 rounded text-purple-600"
                />
                <label htmlFor="chkVerified" className="cursor-pointer">
                  <span className="font-bold text-slate-900 dark:text-white block">Official ICAI Verification Status</span>
                  <span className="text-[11px] text-slate-500">
                    When checked, students see the verified live ticking countdown. If unchecked, date remains hidden to protect against rumors.
                  </span>
                </label>
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={isSyncingCountdown}
                  className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs cursor-pointer shadow-xs"
                >
                  {isSyncingCountdown ? 'Syncing...' : 'Save & Sync Exam Config'}
                </button>
              </div>
            </form>
          </div>

          {/* UPI Settings */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <h3 className="font-black text-slate-900 dark:text-white text-base flex items-center gap-2">
                  <QrCode className="w-5 h-5 text-purple-600" />
                  <span>Personal UPI QR Code Settings</span>
                </h3>
                <p className="text-xs text-slate-500">
                  Update payment details displayed to students on the ₹5 monthly pass payment modal.
                </p>
              </div>

              {upiSavedNotice && (
                <span className="text-xs font-bold text-emerald-600 flex items-center gap-1 bg-emerald-50 px-2.5 py-1 rounded-lg">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Saved!</span>
                </span>
              )}
            </div>

            <div className="p-4 rounded-2xl bg-purple-50/50 dark:bg-purple-950/30 border border-purple-100 dark:border-purple-900 flex flex-col sm:flex-row items-center gap-4 text-xs">
              <img
                src={upiConfig.qrCodeImageUrl || '/original-upi-qr.png'}
                alt="Current Admin QR"
                className="w-24 h-24 object-contain rounded-xl bg-white p-2 border border-purple-200 dark:border-purple-800 shrink-0"
              />
              <div className="space-y-2 flex-1 text-center sm:text-left">
                <span className="font-bold text-slate-900 dark:text-white block">Active Original Payment QR Code</span>
                <p className="text-slate-500 text-[11px]">Students scan this QR with PhonePe, Google Pay, or Paytm.</p>
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                  <label className="px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs cursor-pointer inline-flex items-center gap-1.5 shadow-xs">
                    <UploadCloud className="w-3.5 h-3.5" />
                    <span>Upload New QR Image</span>
                    <input type="file" accept="image/*" onChange={handleQrUpload} className="hidden" />
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      const updated = { ...upiConfig, qrCodeImageUrl: '/original-upi-qr.png' };
                      setUpiConfig(updated);
                      saveUpiConfig(updated);
                      showToast('Reset to original QR image!');
                    }}
                    className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-white text-slate-700 dark:text-slate-300 font-bold text-xs cursor-pointer"
                  >
                    Reset to Default QR
                  </button>
                </div>
              </div>
            </div>

            <form onSubmit={handleSaveUpi} className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Admin UPI ID *</label>
                <input
                  type="text"
                  required
                  value={upiConfig.upiId}
                  onChange={(e) => setUpiConfig({ ...upiConfig, upiId: e.target.value.trim() })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono font-bold"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Payee Name *</label>
                <input
                  type="text"
                  required
                  value={upiConfig.payeeName}
                  onChange={(e) => setUpiConfig({ ...upiConfig, payeeName: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-semibold"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Pass Amount (₹) *</label>
                <input
                  type="number"
                  min="1"
                  max="500"
                  value={upiConfig.defaultAmount}
                  onChange={(e) => setUpiConfig({ ...upiConfig, defaultAmount: Number(e.target.value) })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold text-purple-600"
                />
              </div>

              <div className="sm:col-span-3 flex justify-end">
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs cursor-pointer shadow-xs"
                >
                  Save UPI Configuration
                </button>
              </div>
            </form>
          </div>

          {/* Referral Settings */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <h3 className="font-black text-slate-900 dark:text-white text-base flex items-center gap-2">
                  <Gift className="w-5 h-5 text-purple-600" />
                  <span>Referrals & Rewards Program Policy</span>
                </h3>
                <p className="text-xs text-slate-500">Reward points awarded to students when referring study partners.</p>
              </div>
              {referralSavedNotice && (
                <span className="text-xs font-bold text-emerald-600 flex items-center gap-1 bg-emerald-50 px-2.5 py-1 rounded-lg">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Saved!</span>
                </span>
              )}
            </div>

            <form onSubmit={handleSaveReferral} className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Points per Referral *</label>
                <input
                  type="number"
                  value={referralConfig.pointsPerReferral}
                  onChange={(e) => setReferralConfig({ ...referralConfig, pointsPerReferral: Number(e.target.value) })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Friend Welcome Bonus *</label>
                <input
                  type="number"
                  value={referralConfig.welcomeBonusPoints}
                  onChange={(e) => setReferralConfig({ ...referralConfig, welcomeBonusPoints: Number(e.target.value) })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Points for 1 Free Pass *</label>
                <input
                  type="number"
                  value={referralConfig.passRedemptionCost}
                  onChange={(e) => setReferralConfig({ ...referralConfig, passRedemptionCost: Number(e.target.value) })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold"
                />
              </div>

              <div className="sm:col-span-3 flex justify-end">
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs cursor-pointer shadow-xs"
                >
                  Save Referral Policy
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* MODALS                                                               */}
      {/* ==================================================================== */}

      {/* Screenshot Zoom Modal */}
      {zoomedScreenshot && (
        <div className="fixed inset-0 z-60 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full p-4 relative shadow-2xl">
            <button
              onClick={() => setZoomedScreenshot(null)}
              className="absolute top-3 right-3 text-slate-400 hover:text-white cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
            <h4 className="font-bold text-xs text-slate-900 dark:text-white mb-2">Original Student Payment Receipt</h4>
            <img
              src={zoomedScreenshot}
              alt="Payment Proof"
              className="w-full h-auto max-h-[70vh] object-contain rounded-2xl border border-slate-200 dark:border-slate-800"
            />
          </div>
        </div>
      )}

      {/* Reject Payment Reason Modal */}
      {rejectingPaymentId && (
        <div className="fixed inset-0 z-60 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 text-xs">
            <h3 className="text-sm font-black text-rose-600 flex items-center gap-1.5 mb-2">
              <XCircle className="w-4 h-4" />
              <span>Reject Payment Submission</span>
            </h3>
            <p className="text-slate-500 mb-3">
              Provide an official audit rejection reason. This will be recorded and shown to the student.
            </p>
            <form onSubmit={handleConfirmReject} className="space-y-3">
              <textarea
                required
                rows={3}
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                className="w-full p-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
              />
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setRejectingPaymentId(null)}
                  className="px-3.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-xl bg-rose-600 text-white font-bold"
                >
                  Confirm Rejection
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Custom Expiry Date Modal */}
      {selectedStudentForExpiry && (
        <div className="fixed inset-0 z-60 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 text-xs space-y-3">
            <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
              <Calendar className="w-4 h-4 text-purple-600" />
              <span>Update Membership Expiry: {selectedStudentForExpiry.name}</span>
            </h3>
            <form onSubmit={handleSaveCustomExpiry} className="space-y-3">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  New Subscription Expiry Date *
                </label>
                <input
                  type="datetime-local"
                  required
                  value={customExpiryDate}
                  onChange={(e) => setCustomExpiryDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                />
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedStudentForExpiry(null)}
                  className="px-3.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-xl bg-purple-600 text-white font-bold"
                >
                  Save Expiry
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Account Suspension Modal */}
      {suspensionModalStudent && (
        <div className="fixed inset-0 z-60 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 text-xs space-y-3">
            <h3 className="text-sm font-black text-rose-600 flex items-center gap-2">
              <UserX className="w-4 h-4" />
              <span>Suspend Account: {suspensionModalStudent.name}</span>
            </h3>
            <p className="text-slate-500">
              Suspended students are immediately blocked from all learning modules, community groups, and tests.
            </p>
            <div className="space-y-2">
              <label className="block font-bold text-slate-700 dark:text-slate-300">Reason for Suspension *</label>
              <textarea
                rows={2}
                value={suspensionReasonText}
                onChange={(e) => setSuspensionReasonText(e.target.value)}
                className="w-full p-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
              />
            </div>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setSuspensionModalStudent(null)}
                className="px-3.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleToggleSuspend(suspensionModalStudent)}
                className="px-4 py-1.5 rounded-xl bg-rose-600 text-white font-bold"
              >
                Confirm Suspension
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Chapter Modal */}
      {showAddChapterModal && (
        <div className="fixed inset-0 z-60 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 text-xs space-y-3">
            <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-purple-600" />
              <span>Add New Chapter ({contentPaperTab.toUpperCase()})</span>
            </h3>
            <form onSubmit={handleCreateChapter} className="space-y-3">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Chapter Number *</label>
                <input
                  type="number"
                  min="1"
                  required
                  value={newChapterNumber}
                  onChange={(e) => setNewChapterNumber(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Title (English) *</label>
                <input
                  type="text"
                  required
                  value={newChapterTitleEn}
                  onChange={(e) => setNewChapterTitleEn(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Title (Hindi)</label>
                <input
                  type="text"
                  value={newChapterTitleHi}
                  onChange={(e) => setNewChapterTitleHi(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddChapterModal(false)}
                  className="px-3.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-xl bg-purple-600 text-white font-bold"
                >
                  Create Chapter
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add / Edit Question Modal */}
      {showAddQuestionModal && (
        <div className="fixed inset-0 z-60 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-2xl w-full max-h-[85vh] overflow-y-auto p-6 shadow-2xl border border-slate-200 dark:border-slate-800 text-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
              <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                <Plus className="w-5 h-5 text-purple-600" />
                <span>{editingQuestionId ? 'Edit ICAI Question' : 'Add New ICAI Study Question'}</span>
              </h3>
              <button
                onClick={() => setShowAddQuestionModal(false)}
                className="text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveQuestion} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Subject *</label>
                  <select
                    value={qPaperId}
                    onChange={(e) => {
                      const p = e.target.value as PaperId;
                      setQPaperId(p);
                      const chaps = subjectChapters.filter((c) => c.paperId === p);
                      if (chaps.length > 0) setQChapterId(chaps[0].id);
                    }}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold"
                  >
                    <option value="paper1">Paper 1: Accounting</option>
                    <option value="paper2">Paper 2: Business Laws</option>
                    <option value="paper3">Paper 3: Quantitative Aptitude</option>
                    <option value="paper4">Paper 4: Business Economics</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Chapter *</label>
                  <select
                    value={qChapterId}
                    onChange={(e) => setQChapterId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold"
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
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Question (English) *</label>
                <textarea
                  rows={2}
                  required
                  value={qTextEn}
                  onChange={(e) => setQTextEn(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Question (Hindi)</label>
                <textarea
                  rows={2}
                  value={qTextHi}
                  onChange={(e) => setQTextHi(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                />
              </div>

              {/* 4 Options */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Option A (EN) *</label>
                  <input
                    type="text"
                    required
                    value={qOptAEn}
                    onChange={(e) => setQOptAEn(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Option B (EN) *</label>
                  <input
                    type="text"
                    required
                    value={qOptBEn}
                    onChange={(e) => setQOptBEn(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Option C (EN) *</label>
                  <input
                    type="text"
                    required
                    value={qOptCEn}
                    onChange={(e) => setQOptCEn(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Option D (EN) *</label>
                  <input
                    type="text"
                    required
                    value={qOptDEn}
                    onChange={(e) => setQOptDEn(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Correct Option *</label>
                  <select
                    value={qCorrectIndex}
                    onChange={(e) => setQCorrectIndex(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold text-emerald-600"
                  >
                    <option value={0}>Option A</option>
                    <option value={1}>Option B</option>
                    <option value={2}>Option C</option>
                    <option value={3}>Option D</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Exam Attempt Tag *</label>
                  <input
                    type="text"
                    value={qAttemptTag}
                    onChange={(e) => setQAttemptTag(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Official ICAI Source Citation *</label>
                <input
                  type="text"
                  required
                  value={qSourceCitation}
                  onChange={(e) => setQSourceCitation(e.target.value)}
                  placeholder="e.g. ICAI Study Module 2026/27 Chapter 4"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Detailed Explanation (English)</label>
                <textarea
                  rows={2}
                  value={qExpEn}
                  onChange={(e) => setQExpEn(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddQuestionModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold cursor-pointer"
                >
                  Save Question
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
