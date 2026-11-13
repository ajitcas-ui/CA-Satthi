import React, { useState } from 'react';
import {
  Language,
  UserProfile,
  PaymentRequest,
  UpiConfig,
} from '../types';
import {
  getUpiConfig,
  submitPaymentRequest,
  getUserPaymentHistory,
  getStudentMembershipStatus,
  updateUserProfile,
} from '../utils/storageDb';
import {
  submitPaymentRequestToDb,
  updateUserProfileInDb,
  logAnalyticsEvent,
} from '../firebase/services';
import { playChimeSound } from '../utils/audio';
import {
  QrCode,
  Copy,
  Check,
  UploadCloud,
  ShieldCheck,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  FileText,
  X,
  Smartphone,
  Lock,
  ArrowRight,
  Phone,
  Hash,
} from 'lucide-react';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  language: Language;
  currentUser: UserProfile;
  userPayments?: PaymentRequest[];
  upiConfigOverride?: UpiConfig | null;
  onOpenAuthModal?: () => void;
  onSuccess?: () => void;
}

async function compressPaymentScreenshot(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Failed to read image file.'));
    reader.onload = () => {
      const dataUrl = reader.result as string;
      const img = new Image();
      img.onerror = () => resolve(dataUrl);
      img.onload = () => {
        const maxDim = 900;
        let { width, height } = img;
        if (width > maxDim || height > maxDim) {
          const ratio = Math.min(maxDim / width, maxDim / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(dataUrl);
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        const compressed = canvas.toDataURL('image/jpeg', 0.72);
        resolve(compressed.length < dataUrl.length ? compressed : dataUrl);
      };
      img.src = dataUrl;
    };
    reader.readAsDataURL(file);
  });
}

export const PaymentModal: React.FC<PaymentModalProps> = ({
  isOpen,
  onClose,
  language,
  currentUser,
  userPayments,
  upiConfigOverride,
  onOpenAuthModal,
  onSuccess,
}) => {
  const [activeTab, setActiveTab] = useState<'pay' | 'history'>('pay');
  const [copiedUpi, setCopiedUpi] = useState(false);

  const isGuest = !currentUser || currentUser.id === 'guest';

  // Auto-fetch profile details cleanly (never invent a fake mobile if missing)
  const initialDigits = (() => {
    let raw = (currentUser.phone || '').replace(/\D/g, '');
    if (raw.length === 12 && raw.startsWith('91')) raw = raw.slice(2);
    return raw.length === 10 ? raw : '';
  })();

  const [mobileInput, setMobileInput] = useState(initialDigits);
  const [utr, setUtr] = useState('');
  const [screenshotUrl, setScreenshotUrl] = useState<string>('');
  const [screenshotFileName, setScreenshotFileName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);

  const [selectedReceipt, setSelectedReceipt] = useState<PaymentRequest | null>(null);

  if (!isOpen) return null;

  const upiConfig: UpiConfig = upiConfigOverride || getUpiConfig();
  const paymentHistory =
    userPayments && userPayments.length > 0 ? userPayments : getUserPaymentHistory(currentUser.id);
  const membership = getStudentMembershipStatus(currentUser, paymentHistory);
  const latestPayment = paymentHistory[0];

  const currentAmount = upiConfig.monthlyAmount || 5;
  const upiUri = `upi://pay?pa=${encodeURIComponent(upiConfig.upiId)}&pn=${encodeURIComponent(
    upiConfig.payeeName
  )}&am=${currentAmount}&cu=INR&tn=${encodeURIComponent('CA Saathi Monthly Membership')}`;
  const qrCodeUrl = upiConfig.qrCodeImageUrl || '/original-upi-qr.png';

  const handleCopyUpi = () => {
    try {
      if (navigator?.clipboard?.writeText) {
        navigator.clipboard.writeText(upiConfig.upiId).catch(() => {});
      }
    } catch {
      // ignore clipboard restriction
    }
    setCopiedUpi(true);
    playChimeSound('click');
    setTimeout(() => setCopiedUpi(false), 2500);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setSubmitError(
        language === 'en'
          ? 'Please upload a valid image file (JPG, PNG, WebP).'
          : 'कृपया केवल वैध इमेज फाइल (JPG, PNG, WebP) अपलोड करें।'
      );
      return;
    }

    if (file.size > 6 * 1024 * 1024) {
      setSubmitError(
        language === 'en'
          ? 'File size exceeds 6MB limit. Please upload a smaller screenshot.'
          : 'फाइल का आकार 6MB से अधिक है। कृपया छोटा स्क्रीनशॉट अपलोड करें।'
      );
      return;
    }

    setScreenshotFileName(file.name);
    try {
      const compressed = await compressPaymentScreenshot(file);
      if (compressed.length > 740_000) {
        setSubmitError(
          language === 'en'
            ? 'Compressed screenshot is still too large. Please upload a cropped receipt.'
            : 'स्क्रीनशॉट बहुत बड़ा है। कृपया क्रॉप की गई रसीद अपलोड करें।'
        );
        return;
      }
      setScreenshotUrl(compressed);
      setSubmitError(null);
    } catch {
      setSubmitError(language === 'en' ? 'Unable to read screenshot image.' : 'स्क्रीनशॉट पढ़ने में त्रुटि।');
    }
  };

  const handleSubmitPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);
    setSubmitSuccess(null);

    if (isGuest) {
      setSubmitError(
        language === 'en'
          ? 'Please sign in with Google or your student account before submitting a payment proof.'
          : 'भुगतान रसीद जमा करने से पहले कृपया गूगल या विद्यार्थी खाते से साइन इन करें।'
      );
      return;
    }

    const cleanName = (currentUser.name || 'CA Aspirant').trim();
    const resolvedMobile = (initialDigits || mobileInput).replace(/\D/g, '').slice(-10);
    if (resolvedMobile.length !== 10) {
      setSubmitError(
        language === 'en'
          ? 'Please enter your 10-digit registered mobile number so Admin can match your account.'
          : 'कृपया खाता मिलान हेतु अपना 10 अंकों का पंजीकृत मोबाइल नंबर दर्ज करें।'
      );
      return;
    }

    const cleanUtr = utr.trim().replace(/\s+/g, '');
    if (cleanUtr.length < 8) {
      setSubmitError(
        language === 'en'
          ? 'Please enter a valid 12-digit UPI transaction reference (UTR) number.'
          : 'कृपया वैध 12 अंकों का यूपीआई UTR नंबर दर्ज करें।'
      );
      return;
    }

    if (!screenshotUrl) {
      setSubmitError(
        language === 'en'
          ? 'Please upload your payment receipt screenshot.'
          : 'कृपया भुगतान रसीद का स्क्रीनशॉट अपलोड करें।'
      );
      return;
    }

    setIsSubmitting(true);
    try {
      // Save mobile number to profile if newly provided
      if (!initialDigits && resolvedMobile.length === 10) {
        updateUserProfile({ phone: resolvedMobile });
        updateUserProfileInDb(currentUser.id, { phone: resolvedMobile }).catch(() => {});
      }

      const res = submitPaymentRequest({
        studentId: currentUser.id,
        studentName: cleanName,
        studentEmail: currentUser.email,
        studentMobile: resolvedMobile,
        amount: currentAmount,
        planType: 'monthly_access',
        paymentReference: currentUser.paymentReference,
        utr: cleanUtr,
        screenshotUrl,
      });

      if (!res.success || !res.payment) {
        setSubmitError(res.message);
        playChimeSound('click');
      } else {
        await submitPaymentRequestToDb(res.payment);
        logAnalyticsEvent('payment_submit', currentUser.id, currentUser.id).catch(() => {});
        playChimeSound('success');
        setSubmitSuccess(
          language === 'en'
            ? 'Payment proof submitted! Status is Pending until Admin verifies UTR & activates your 30-day pass.'
            : 'भुगतान प्रमाण जमा हो गया! एडमिन द्वारा UTR सत्यापित होने तक स्थिति Pending रहेगी।'
        );
        setUtr('');
        setScreenshotUrl('');
        setScreenshotFileName('');
        setActiveTab('history');
        if (onSuccess) onSuccess();
      }
    } catch (err: unknown) {
      const msg = (err as { message?: string })?.message || 'Submission failed. Please try again.';
      setSubmitError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/65 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-xl w-full shadow-2xl border border-slate-200 dark:border-slate-800 relative my-6 overflow-hidden">
        {/* Header */}
        <div className="p-5 sm:p-6 bg-slate-900 text-white flex items-start justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-1.5">
              <span className="px-2.5 py-0.5 rounded-md bg-blue-500/20 text-blue-200 text-[11px] font-bold border border-blue-400/30 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-blue-300" />
                <span>{language === 'en' ? 'Manual Bank Verification' : 'मैनुअल बैंक सत्यापन'}</span>
              </span>
              <span className="px-2.5 py-0.5 rounded-md bg-amber-500/20 text-amber-200 text-[11px] font-bold border border-amber-400/30">
                ₹{currentAmount} / {language === 'en' ? '30 Days Monthly Pass' : '30 दिन मासिक पास'}
              </span>
              {membership.canAccessPremium && (
                <span className="px-2.5 py-0.5 rounded-md bg-emerald-500/20 text-emerald-200 text-[11px] font-bold border border-emerald-400/30 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-300" />
                  <span>{language === 'en' ? `Active (${membership.daysRemaining}d left)` : 'सक्रिय'}</span>
                </span>
              )}
            </div>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white flex items-center gap-2">
              <QrCode className="w-6 h-6 text-amber-300" />
              <span>{language === 'en' ? `Scan & Pay ₹${currentAmount}/Month via UPI` : `स्कैन एवं पे ₹${currentAmount}/माह`}</span>
            </h2>
            <p className="text-xs text-slate-300 mt-1">
              {language === 'en'
                ? 'Scan the official QR code below, upload your receipt screenshot, and enter your 12-digit UTR number.'
                : 'नीचे दिए क्यूआर कोड से भुगतान करें, स्क्रीनशॉट अपलोड करें व 12 अंकों का UTR नंबर दर्ज करें।'}
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer shrink-0"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Status Notification Banner */}
        {latestPayment && (
          <div
            className={`px-5 py-2.5 text-xs font-semibold flex items-center justify-between border-b ${
              latestPayment.status === 'approved'
                ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-200 border-emerald-200 dark:border-emerald-800'
                : latestPayment.status === 'pending'
                  ? 'bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-200 border-amber-200 dark:border-amber-800'
                  : 'bg-rose-50 dark:bg-rose-950/60 text-rose-800 dark:text-rose-200 border-rose-200 dark:border-rose-800'
            }`}
          >
            <div className="flex items-center gap-2">
              {latestPayment.status === 'approved' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              ) : latestPayment.status === 'pending' ? (
                <Clock className="w-4 h-4 text-amber-600 shrink-0" />
              ) : (
                <XCircle className="w-4 h-4 text-rose-600 shrink-0" />
              )}
              <span>
                {latestPayment.status === 'approved'
                  ? language === 'en'
                    ? 'Status: Approved! 30-day monthly membership is active.'
                    : 'स्थिति: स्वीकृत! मासिक सदस्यता सक्रिय है।'
                  : latestPayment.status === 'pending'
                    ? language === 'en'
                      ? `Status: Pending Review (UTR: ${latestPayment.utr}). Access stays locked until Admin approves.`
                      : `स्थिति: सत्यापनाधीन (UTR: ${latestPayment.utr})। एडमिन अनुमोदन के बाद ही एक्सेस खुलेगा।`
                    : language === 'en'
                      ? `Status: Rejected. ${latestPayment.adminNotes || 'Verification failed.'}`
                      : `स्थिति: अस्वीकृत। ${latestPayment.adminNotes || 'सत्यापन विफल।'}`}
              </span>
            </div>
            <button
              onClick={() => setActiveTab('history')}
              className="text-[11px] underline font-bold hover:opacity-80 shrink-0 ml-2 cursor-pointer"
            >
              {language === 'en' ? 'View' : 'देखें'}
            </button>
          </div>
        )}

        {/* Sub-Tabs */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-6 pt-3">
          <button
            onClick={() => setActiveTab('pay')}
            className={`pb-3 px-3 text-xs font-bold border-b-2 transition-all cursor-pointer ${
              activeTab === 'pay'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            {language === 'en' ? `Pay ₹${currentAmount} & Submit Verification` : `₹${currentAmount} भुगतान व सत्यापन`}
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`pb-3 px-3 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'history'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <span>{language === 'en' ? 'Payment History & Receipts' : 'भुगतान इतिहास व रसीदें'}</span>
            {paymentHistory.length > 0 && (
              <span className="px-1.5 py-0.2 rounded-md text-[10px] bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 font-bold">
                {paymentHistory.length}
              </span>
            )}
          </button>
        </div>

        {/* Body */}
        <div className="p-5 sm:p-6 max-h-[75vh] overflow-y-auto">
          {activeTab === 'pay' ? (
            <div className="space-y-5">
              {/* Guest Sign-In Required Notice */}
              {isGuest && (
                <div className="p-3.5 rounded-xl bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-800 flex items-center justify-between gap-3">
                  <div className="text-xs text-blue-900 dark:text-blue-200">
                    <strong className="block font-bold">
                      {language === 'en' ? 'Sign in required before submitting UTR' : 'UTR जमा करने से पहले साइन इन करें'}
                    </strong>
                    <span>
                      {language === 'en'
                        ? 'Your membership unlocks directly against your verified student account.'
                        : 'आपकी सदस्यता सीधे आपके सत्यापित विद्यार्थी खाते पर चालू होगी।'}
                    </span>
                  </div>
                  {onOpenAuthModal && (
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        onOpenAuthModal();
                      }}
                      className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shrink-0 cursor-pointer"
                    >
                      {language === 'en' ? 'Sign In' : 'साइन इन'}
                    </button>
                  )}
                </div>
              )}

              {/* QR Code and UPI Details Card */}
              <div className="bg-slate-50 dark:bg-slate-950/80 p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center gap-5">
                <div className="bg-white p-3 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 shrink-0 text-center">
                  <img
                    src={qrCodeUrl}
                    alt="Original UPI QR Code - Ajeet Patel"
                    className="w-40 h-40 mx-auto object-contain rounded-lg"
                  />
                  <span className="text-[10px] font-bold text-slate-600 mt-1.5 block uppercase tracking-wider">
                    {language === 'en' ? 'Original UPI QR Code' : 'मूल यूपीआई क्यूआर कोड'}
                  </span>
                  <span className="text-[11px] font-extrabold text-blue-700 block">
                    ₹{currentAmount}.00 / Month
                  </span>
                </div>

                <div className="space-y-3 flex-1 text-center sm:text-left w-full">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block">
                      {language === 'en' ? 'Official Payee' : 'आधिकारिक प्राप्तकर्ता'}
                    </span>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white">{upiConfig.payeeName}</h3>

                    <div className="flex items-center justify-center sm:justify-start gap-2 mt-1.5">
                      <div className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono font-bold text-xs sm:text-sm text-slate-900 dark:text-white select-all">
                        {upiConfig.upiId}
                      </div>
                      <button
                        type="button"
                        onClick={handleCopyUpi}
                        className="px-2.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-1 transition-colors cursor-pointer"
                      >
                        {copiedUpi ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copiedUpi ? (language === 'en' ? 'Copied' : 'कॉपी') : (language === 'en' ? 'Copy UPI ID' : 'कॉपी करें')}</span>
                      </button>
                    </div>
                  </div>

                  <div>
                    <a
                      href={upiUri}
                      className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm transition-colors cursor-pointer"
                    >
                      <Smartphone className="w-4 h-4" />
                      <span>{language === 'en' ? `Pay ₹${currentAmount} via UPI App` : `पे ₹${currentAmount} (UPI ऐप)`}</span>
                    </a>
                    <span className="text-[11px] text-slate-500 block mt-1">
                      {language === 'en' ? 'Supports PhonePe, Google Pay, Paytm & BHIM' : 'PhonePe, GPay, Paytm व BHIM समर्थित'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 text-amber-900 dark:text-amber-200 text-xs flex items-start gap-2.5">
                <Lock className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <p className="font-bold">
                    {language === 'en' ? 'Verification Rule:' : 'सत्यापन नियम:'}
                  </p>
                  <p className="text-[11px] leading-relaxed">
                    {language === 'en'
                      ? 'Submitting your UTR never unlocks access automatically. Admin manually verifies every payment against bank records before activating your 30-day pass.'
                      : 'UTR जमा करते ही एक्सेस स्वतः चालू नहीं होता। एडमिन द्वारा बैंक रिकॉर्ड मिलान के बाद ही 30 दिनों का पास सक्रिय होगा।'}
                  </p>
                </div>
              </div>

              <form onSubmit={handleSubmitPayment} className="space-y-4">
                {/* Auto-fetched profile */}
                <div className="p-3.5 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-blue-600/10 text-blue-600 dark:text-blue-400 font-bold text-base flex items-center justify-center shrink-0">
                      {currentUser.avatar || '🎓'}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs text-slate-900 dark:text-white truncate">
                          {currentUser.name}
                        </span>
                        <span className="px-1.5 py-0.5 rounded bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 text-[10px] font-bold">
                          {language === 'en' ? 'Auto-Fetched' : 'स्वतः प्राप्त'}
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-x-2 text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                        {initialDigits ? (
                          <span className="flex items-center gap-1 font-mono text-slate-700 dark:text-slate-300">
                            <Phone className="w-3 h-3 text-blue-500" />
                            {initialDigits}
                          </span>
                        ) : (
                          <span>{language === 'en' ? 'Enter mobile below' : 'नीचे मोबाइल दर्ज करें'}</span>
                        )}
                        {currentUser.email && <span>• {currentUser.email}</span>}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Mobile only if missing on profile */}
                {!initialDigits && (
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1">
                      <Phone className="w-3.5 h-3.5 text-blue-600" />
                      <span>{language === 'en' ? 'Registered 10-Digit Mobile Number *' : 'पंजीकृत 10 अंकों का मोबाइल नंबर *'}</span>
                    </label>
                    <input
                      type="tel"
                      required
                      maxLength={10}
                      placeholder="e.g. 9876543210"
                      value={mobileInput}
                      onChange={(e) => setMobileInput(e.target.value.replace(/\D/g, '').slice(0, 10))}
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono text-xs font-bold focus:outline-blue-500"
                    />
                  </div>
                )}

                {/* UTR / Transaction ID */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1">
                    <Hash className="w-3.5 h-3.5 text-indigo-600" />
                    <span>{language === 'en' ? 'UPI Transaction ID (UTR / Reference Number) *' : 'यूपीआई ट्रांजैक्शन आईडी (UTR नंबर) *'}</span>
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={28}
                    placeholder="e.g. 412890563412"
                    value={utr}
                    onChange={(e) => setUtr(e.target.value.replace(/\s+/g, ''))}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono text-xs font-bold focus:outline-blue-500"
                  />
                </div>

                {/* Upload Screenshot */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1">
                    <UploadCloud className="w-3.5 h-3.5 text-blue-600" />
                    <span>{language === 'en' ? 'Upload Payment Screenshot *' : 'भुगतान स्क्रीनशॉट अपलोड करें *'}</span>
                  </label>

                  {screenshotUrl ? (
                    <div className="p-3 rounded-xl border border-emerald-300 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-950/30 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <img
                          src={screenshotUrl}
                          alt="Screenshot preview"
                          className="w-12 h-12 rounded-lg object-cover border border-emerald-200"
                        />
                        <div className="min-w-0">
                          <span className="text-xs font-bold text-slate-900 dark:text-white block truncate">
                            {screenshotFileName || 'Payment_Screenshot.jpg'}
                          </span>
                          <span className="text-[10px] text-emerald-700 dark:text-emerald-400 font-semibold flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" />
                            {language === 'en' ? 'Ready for verification' : 'सत्यापन हेतु तैयार'}
                          </span>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          setScreenshotUrl('');
                          setScreenshotFileName('');
                        }}
                        className="text-xs font-bold text-rose-600 hover:text-rose-700 px-2 py-1 rounded-lg hover:bg-rose-50 cursor-pointer"
                      >
                        {language === 'en' ? 'Change' : 'बदलें'}
                      </button>
                    </div>
                  ) : (
                    <label className="border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-blue-500 rounded-2xl p-4 text-center flex flex-col items-center justify-center cursor-pointer transition-colors bg-white dark:bg-slate-800">
                      <UploadCloud className="w-7 h-7 text-blue-500 mb-1" />
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                        {language === 'en' ? 'Tap to select payment screenshot' : 'स्क्रीनशॉट चुनने हेतु टैप करें'}
                      </span>
                      <span className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">
                        JPG, PNG, WebP (auto-compressed)
                      </span>
                      <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                    </label>
                  )}
                </div>

                {submitError && (
                  <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs font-semibold flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    <span>{submitError}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isSubmitting || isGuest}
                  className="w-full py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-sm transition-colors disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
                >
                  <span>
                    {isSubmitting
                      ? language === 'en'
                        ? 'Submitting Payment...'
                        : 'जमा हो रहा है...'
                      : language === 'en'
                        ? `Submit ₹${currentAmount} Payment Proof`
                        : `₹${currentAmount} भुगतान प्रमाण जमा करें`}
                  </span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>
            </div>
          ) : (
            <div className="space-y-3.5">
              {submitSuccess && (
                <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-xs font-semibold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{submitSuccess}</span>
                </div>
              )}

              {paymentHistory.length === 0 ? (
                <div className="p-8 text-center border border-dashed border-slate-300 dark:border-slate-700 rounded-2xl">
                  <FileText className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
                  <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
                    {language === 'en' ? 'No payment claims submitted yet.' : 'अभी तक कोई भुगतान अनुरोध नहीं मिला।'}
                  </p>
                  <button
                    onClick={() => setActiveTab('pay')}
                    className="mt-3 px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 cursor-pointer"
                  >
                    {language === 'en' ? `Pay ₹${currentAmount} Now` : `अभी ₹${currentAmount} भुगतान करें`}
                  </button>
                </div>
              ) : (
                paymentHistory.map((req) => (
                  <div
                    key={req.id}
                    className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-2.5"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-xs sm:text-sm text-slate-900 dark:text-white select-all">
                            UTR: {req.utr}
                          </span>
                          <span className="text-xs font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950 px-2 py-0.5 rounded-md">
                            ₹{req.amount} / mo
                          </span>
                        </div>
                        <span className="text-[11px] text-slate-400 dark:text-slate-500 block mt-0.5 font-mono">
                          {new Date(req.createdAt).toLocaleString()} • {req.studentMobile || 'N/A'}
                        </span>
                      </div>

                      {req.status === 'approved' ? (
                        <span className="px-2.5 py-1 rounded-md text-xs font-bold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 flex items-center gap-1 shrink-0">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          <span>{language === 'en' ? 'Approved' : 'स्वीकृत'}</span>
                        </span>
                      ) : req.status === 'rejected' ? (
                        <span className="px-2.5 py-1 rounded-md text-xs font-bold bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-800 flex items-center gap-1 shrink-0">
                          <XCircle className="w-3.5 h-3.5 text-rose-600" />
                          <span>{language === 'en' ? 'Rejected' : 'अस्वीकृत'}</span>
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 rounded-md text-xs font-bold bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800 flex items-center gap-1 shrink-0">
                          <Clock className="w-3.5 h-3.5 text-amber-600" />
                          <span>{language === 'en' ? 'Pending' : 'सत्यापनाधीन'}</span>
                        </span>
                      )}
                    </div>

                    {req.adminNotes && (
                      <p className="text-xs text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800">
                        <strong>{language === 'en' ? 'Admin Note:' : 'एडमिन टिप्पणी:'}</strong> {req.adminNotes}
                      </p>
                    )}

                    <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
                      {req.status === 'approved' ? (
                        <button
                          onClick={() => setSelectedReceipt(req)}
                          className="text-blue-600 dark:text-blue-400 font-bold hover:underline flex items-center gap-1 cursor-pointer"
                        >
                          <FileText className="w-3.5 h-3.5" />
                          <span>{language === 'en' ? 'View Official Receipt' : 'आधिकारिक रसीद देखें'}</span>
                        </button>
                      ) : req.status === 'rejected' ? (
                        <button
                          onClick={() => setActiveTab('pay')}
                          className="text-rose-600 font-bold hover:underline cursor-pointer"
                        >
                          {language === 'en' ? 'Re-submit with correct UTR' : 'सही UTR के साथ पुनः जमा करें'}
                        </button>
                      ) : (
                        <span className="text-[11px] text-slate-400 dark:text-slate-500">
                          {language === 'en' ? 'Awaiting manual Admin verification' : 'एडमिन सत्यापन की प्रतीक्षा में'}
                        </span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>

      {/* Receipt Modal */}
      {selectedReceipt && (
        <div className="fixed inset-0 z-60 bg-black/75 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 relative">
            <button
              onClick={() => setSelectedReceipt(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="text-center space-y-2 border-b border-slate-100 dark:border-slate-800 pb-4 mb-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 mx-auto flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                {language === 'en' ? 'CA Saathi Membership Receipt' : 'सीए साथी सदस्यता रसीद'}
              </h3>
              <p className="text-[11px] text-slate-500">30-Day Monthly Learning Pass</p>
            </div>

            <div className="space-y-2.5 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-500">Receipt Ref:</span>
                <span className="font-mono font-bold text-slate-900 dark:text-white">{selectedReceipt.id}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-500">Student:</span>
                <span className="font-bold text-slate-900 dark:text-white">{selectedReceipt.studentName}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-500">Mobile:</span>
                <span className="font-mono font-bold text-slate-900 dark:text-white">{selectedReceipt.studentMobile || 'N/A'}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-500">Amount Paid:</span>
                <span className="font-bold text-emerald-600">₹{selectedReceipt.amount}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-500">UPI Ref / UTR:</span>
                <span className="font-mono font-bold text-slate-900 dark:text-white">{selectedReceipt.utr}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-500">Valid Until:</span>
                <span className="font-semibold text-slate-900 dark:text-white">
                  {selectedReceipt.unlockedUntil ? new Date(selectedReceipt.unlockedUntil).toLocaleDateString() : '30 Days'}
                </span>
              </div>
            </div>

            <button
              onClick={() => setSelectedReceipt(null)}
              className="mt-6 w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs cursor-pointer"
            >
              {language === 'en' ? 'Close Receipt' : 'रसीद बंद करें'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
