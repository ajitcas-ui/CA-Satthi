import React, { useState } from 'react';
import { 
  Language, 
  UserProfile, 
  PaymentRequest, 
  UpiConfig 
} from '../types';
import { 
  getUpiConfig, 
  submitPaymentRequest, 
  getUserPaymentHistory, 
  checkUserHasValidPass 
} from '../utils/storageDb';
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
  ExternalLink, 
  X, 
  Smartphone, 
  Lock, 
  ArrowRight,
  User,
  Phone,
  Hash,
  Download,
  Printer
} from 'lucide-react';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  language: Language;
  currentUser: UserProfile;
  onSuccess?: () => void;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({
  isOpen,
  onClose,
  language,
  currentUser,
  onSuccess,
}) => {
  const [activeTab, setActiveTab] = useState<'pay' | 'history'>('pay');
  const [copiedUpi, setCopiedUpi] = useState(false);

  // Form State - Automatically fetched from student profile account
  const studentName = currentUser.name || 'CA Aspirant';
  const studentMobile = (() => {
    let raw = (currentUser.phone || '9876543210').replace(/\D/g, '');
    if (raw.length === 12 && raw.startsWith('91')) raw = raw.slice(2);
    return raw.length === 10 ? raw : '9876543210';
  })();
  const [utr, setUtr] = useState('');
  const [screenshotUrl, setScreenshotUrl] = useState<string>('');
  const [screenshotFileName, setScreenshotFileName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);

  // Receipt Modal State
  const [selectedReceipt, setSelectedReceipt] = useState<PaymentRequest | null>(null);

  const upiConfig: UpiConfig = getUpiConfig();
  const paymentHistory = getUserPaymentHistory(currentUser.id);
  const hasActivePass = checkUserHasValidPass(currentUser.id);
  const latestPayment = paymentHistory[0];

  if (!isOpen) return null;

  const currentAmount = 5; // Strict ₹5 one-time fee

  // UPI deep-link intent URI for mobile applications
  const upiUri = `upi://pay?pa=${encodeURIComponent(upiConfig.upiId)}&pn=${encodeURIComponent(upiConfig.payeeName)}&am=${currentAmount}&cu=INR&tn=CA%20Saathi%20Pass`;
  // Original uploaded QR image
  const qrCodeUrl = upiConfig.qrCodeImageUrl || '/original-upi-qr.png';

  const handleCopyUpi = () => {
    try {
      if (navigator?.clipboard?.writeText) {
        navigator.clipboard.writeText(upiConfig.upiId).catch(() => {});
      }
    } catch (_) {}
    setCopiedUpi(true);
    playChimeSound('click');
    setTimeout(() => setCopiedUpi(false), 2500);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
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

    if (file.size > 5 * 1024 * 1024) {
      setSubmitError(
        language === 'en'
          ? 'File size exceeds 5MB limit. Please upload a smaller screenshot.'
          : 'फाइल का आकार 5MB से अधिक है। कृपया छोटा स्क्रीनशॉट अपलोड करें।'
      );
      return;
    }

    setScreenshotFileName(file.name);
    const reader = new FileReader();
    reader.onload = () => {
      setScreenshotUrl(reader.result as string);
      setSubmitError(null);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmitPayment = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);
    setSubmitSuccess(null);

    const cleanName = studentName.trim();
    if (!cleanName || cleanName.length < 2) {
      setSubmitError(language === 'en' ? 'Please enter your full name.' : 'कृपया अपना पूरा नाम दर्ज करें।');
      return;
    }

    let cleanMobile = studentMobile.trim().replace(/\D/g, '');
    if (cleanMobile.length === 12 && cleanMobile.startsWith('91')) {
      cleanMobile = cleanMobile.slice(2);
    }
    if (!cleanMobile || cleanMobile.length !== 10) {
      setSubmitError(
        language === 'en'
          ? 'Please enter a valid 10-digit registered mobile number.'
          : 'कृपया 10 अंकों का वैध पंजीकृत मोबाइल नंबर दर्ज करें।'
      );
      return;
    }

    const cleanUtr = utr.trim().replace(/\s+/g, '');
    if (!cleanUtr || cleanUtr.length < 8) {
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
          ? 'Please attach your payment receipt screenshot.'
          : 'कृपया भुगतान रसीद का स्क्रीनशॉट संलग्न करें।'
      );
      return;
    }

    setIsSubmitting(true);

    try {
      const res = submitPaymentRequest({
        studentId: currentUser.id,
        studentName: cleanName,
        studentEmail: currentUser.email,
        studentMobile: cleanMobile,
        amount: currentAmount,
        planType: 'monthly_access',
        paymentReference: currentUser.paymentReference,
        utr: cleanUtr,
        screenshotUrl,
      });

      if (!res.success) {
        setSubmitError(res.message);
        playChimeSound('click');
      } else {
        playChimeSound('success');
        setSubmitSuccess(
          language === 'en'
            ? 'Payment submitted! Admin will verify against bank records and approve your pass.'
            : 'भुगतान जमा हो गया! एडमिन बैंक रिकॉर्ड से सत्यापित कर पास अनलॉक करेंगे।'
        );
        setUtr('');
        setScreenshotUrl('');
        setScreenshotFileName('');
        setActiveTab('history');
        if (onSuccess) onSuccess();
      }
    } catch (err: any) {
      setSubmitError(err.message || 'Submission failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-xl w-full shadow-2xl border border-slate-200 dark:border-slate-800 relative my-6 animate-in fade-in zoom-in-95 duration-200 overflow-hidden">
        
        {/* Header Bar */}
        <div className="p-5 sm:p-6 bg-gradient-to-r from-blue-700 via-indigo-700 to-slate-900 text-white flex items-start justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full bg-blue-500/30 text-blue-200 text-[11px] font-bold border border-blue-400/30 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-blue-300" />
                <span>{language === 'en' ? 'Verified UPI Payment' : 'सत्यापित यूपीआई गेटवे'}</span>
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-amber-500/30 text-amber-200 text-[11px] font-extrabold border border-amber-400/30">
                ₹5 Single Test Pass
              </span>
              {hasActivePass && (
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/30 text-emerald-200 text-[11px] font-bold border border-emerald-400/30 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-300" />
                  <span>{language === 'en' ? 'Pass Active' : 'पास सक्रिय'}</span>
                </span>
              )}
            </div>
            <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white flex items-center gap-2">
              <QrCode className="w-6 h-6 text-amber-300" />
              <span>{language === 'en' ? 'Scan & Pay ₹5 via UPI' : 'स्कैन एवं पे ₹5 यूपीआई'}</span>
            </h2>
            <p className="text-xs text-blue-100/90 mt-1">
              {language === 'en'
                ? 'Scan the original UPI QR code or tap Pay ₹5. Upload screenshot & UTR for manual admin verification.'
                : 'मूल क्यूआर कोड स्कैन करें या पे ₹5 दबाएं। एडमिन द्वारा बैंक मिलान हेतु स्क्रीनशॉट व यूटीआर दर्ज करें।'}
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

        {/* Current Status Notification Banner */}
        {latestPayment && (
          <div className={`px-5 py-2.5 text-xs font-semibold flex items-center justify-between border-b ${
            latestPayment.status === 'approved'
              ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-200 border-emerald-200 dark:border-emerald-800'
              : latestPayment.status === 'pending'
                ? 'bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-200 border-amber-200 dark:border-amber-800'
                : 'bg-rose-50 dark:bg-rose-950/60 text-rose-800 dark:text-rose-200 border-rose-200 dark:border-rose-800'
          }`}>
            <div className="flex items-center gap-2">
              {latestPayment.status === 'approved' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              ) : latestPayment.status === 'pending' ? (
                <Clock className="w-4 h-4 text-amber-600 shrink-0 animate-pulse" />
              ) : (
                <XCircle className="w-4 h-4 text-rose-600 shrink-0" />
              )}
              <span>
                {latestPayment.status === 'approved'
                  ? language === 'en' ? 'Status: Approved! Full test access is active.' : 'स्थिति: स्वीकृत! सभी टेस्ट अनलॉक हैं।'
                  : latestPayment.status === 'pending'
                    ? language === 'en' ? `Status: Pending Review (UTR: ${latestPayment.utr}). Admin is verifying.` : `स्थिति: सत्यापनाधीन (UTR: ${latestPayment.utr})। एडमिन जांच रहे हैं।`
                    : language === 'en' ? `Status: Rejected. Reason: ${latestPayment.adminNotes || 'Verification failed.'}` : `स्थिति: अस्वीकृत। कारण: ${latestPayment.adminNotes || 'सत्यापन विफल।'}`
                }
              </span>
            </div>
            <button
              onClick={() => setActiveTab('history')}
              className="text-[11px] underline font-bold hover:opacity-80 shrink-0 ml-2"
            >
              {language === 'en' ? 'View Details' : 'विवरण देखें'}
            </button>
          </div>
        )}

        {/* Navigation Sub-Tabs */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-6 pt-3">
          <button
            onClick={() => setActiveTab('pay')}
            className={`pb-3 px-3 text-xs font-bold border-b-2 transition-all cursor-pointer ${
              activeTab === 'pay'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            {language === 'en' ? 'Pay ₹5 & Submit Verification' : '₹5 भुगतान एवं सत्यापन'}
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`pb-3 px-3 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'history'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <span>{language === 'en' ? 'Payment History & Receipts' : 'भुगतान इतिहास एवं रसीदें'}</span>
            {paymentHistory.length > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 font-black">
                {paymentHistory.length}
              </span>
            )}
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 sm:p-6 max-h-[75vh] overflow-y-auto">
          {activeTab === 'pay' ? (
            <div className="space-y-5">
              
              {/* QR Code and Payment Details Card */}
              <div className="bg-gradient-to-br from-slate-50 to-blue-50/30 dark:from-slate-950/80 dark:to-blue-950/20 p-4 sm:p-5 rounded-2xl border border-blue-100 dark:border-slate-800 flex flex-col sm:flex-row items-center gap-5 shadow-xs">
                
                {/* 1. Display uploaded original UPI QR code clearly */}
                <div className="bg-white p-3 rounded-2xl shadow-md border-2 border-slate-200 dark:border-slate-700 shrink-0 text-center relative group">
                  <div className="p-1 rounded-xl bg-slate-50 border border-slate-100">
                    <img
                      src={qrCodeUrl}
                      alt="Original UPI QR Code - Ajeet Patel"
                      className="w-40 h-40 mx-auto object-contain rounded-lg"
                    />
                  </div>
                  <span className="text-[10px] font-bold text-slate-600 dark:text-slate-500 mt-1.5 block uppercase tracking-wider">
                    {language === 'en' ? 'Original UPI QR Code' : 'मूल यूपीआई क्यूआर कोड'}
                  </span>
                  <span className="text-[11px] font-extrabold text-blue-700 block">
                    ₹5.00 INR
                  </span>
                </div>

                {/* 2 & 3. UPI Details & Copy Button */}
                <div className="space-y-3 flex-1 text-center sm:text-left w-full">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block">
                      {language === 'en' ? 'Admin Payee Details' : 'प्राप्तकर्ता विवरण'}
                    </span>
                    <h3 className="text-base font-black text-slate-900 dark:text-white">
                      {upiConfig.payeeName}
                    </h3>

                    {/* Show UPI ID & Copy UPI ID Button */}
                    <div className="flex items-center justify-center sm:justify-start gap-2 mt-1">
                      <div className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono font-bold text-xs sm:text-sm text-slate-900 dark:text-white select-all">
                        {upiConfig.upiId}
                      </div>
                      <button
                        type="button"
                        onClick={handleCopyUpi}
                        className="px-2.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-1 transition-colors cursor-pointer shadow-xs active:scale-95"
                        title="Copy UPI ID"
                      >
                        {copiedUpi ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-white" />
                            <span>{language === 'en' ? 'Copied!' : 'कॉपी!'}</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            <span>{language === 'en' ? 'Copy UPI ID' : 'कॉपी करें'}</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* 4. Add a Pay ₹5 button (direct intent) */}
                  <div>
                    <a
                      href={upiUri}
                      className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs shadow-md transition-all active:scale-95 cursor-pointer"
                    >
                      <Smartphone className="w-4 h-4" />
                      <span>{language === 'en' ? 'Pay ₹5 via UPI App' : 'पे ₹5 (UPI ऐप खोलें)'}</span>
                    </a>
                    <span className="text-[10px] text-slate-500 block mt-1">
                      {language === 'en' ? 'Direct mobile intent: launches PhonePe, GPay, Paytm or BHIM' : 'मोबाइल पर सीधे ऐप खोलने के लिए टैप करें'}
                    </span>
                  </div>

                  {/* 5. Supported apps notice */}
                  <div className="flex flex-wrap items-center justify-center sm:justify-start gap-1.5 text-[10px] text-slate-600 dark:text-slate-400 pt-1">
                    <span className="px-2 py-0.5 rounded-md bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold">Google Pay</span>
                    <span className="px-2 py-0.5 rounded-md bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold">PhonePe</span>
                    <span className="px-2 py-0.5 rounded-md bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold">Paytm</span>
                    <span className="px-2 py-0.5 rounded-md bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold">BHIM</span>
                  </div>
                </div>
              </div>

              {/* Security Warning Notice */}
              <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 text-amber-900 dark:text-amber-200 text-xs flex items-start gap-2.5">
                <Lock className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <p className="font-bold">
                    {language === 'en' ? 'Manual Bank Verification Policy:' : 'मैनुअल बैंक सत्यापन नीति:'}
                  </p>
                  <p className="text-[11px] leading-relaxed">
                    {language === 'en'
                      ? 'Admins manually verify the transaction against bank credits before unlocking. Never share your UPI PIN or net banking password. Only admin-approved students receive full pass access.'
                      : 'एडमिन द्वारा बैंक क्रेडिट में यूटीआर की जांच के बाद ही पास सक्रिय किया जाता है। यूपीआई पिन किसी से साझा न करें। केवल स्वीकृत छात्र ही पेड मॉक टेस्ट एक्सेस कर सकते हैं।'}
                  </p>
                </div>
              </div>

              {/* Submission Form: 6, 7, 8, 9 */}
              <form onSubmit={handleSubmitPayment} className="space-y-4">
                
                {/* Auto-Fetched Verified Student Account Details (No manual input needed) */}
                <div className="p-3.5 rounded-xl bg-slate-100/90 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-600/10 text-blue-600 dark:text-blue-400 font-black text-base flex items-center justify-center shrink-0 border border-blue-500/20">
                      {currentUser.avatar || '🎓'}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-xs text-slate-900 dark:text-white truncate">
                          {currentUser.name}
                        </span>
                        <span className="px-1.5 py-0.5 rounded-md bg-blue-100 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 text-[10px] font-bold">
                          {language === 'en' ? 'Auto-Fetched Account' : 'स्वतः प्राप्त खाता'}
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-x-2.5 gap-y-0.5 text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 font-medium">
                        <span className="flex items-center gap-1 font-mono text-slate-700 dark:text-slate-300">
                          <Phone className="w-3 h-3 text-blue-500" />
                          {studentMobile}
                        </span>
                        <span className="text-slate-300 dark:text-slate-600">•</span>
                        <span className="truncate">{currentUser.email}</span>
                      </div>
                    </div>
                  </div>
                  <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold self-start sm:self-center flex items-center gap-1 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-md border border-emerald-200 dark:border-emerald-800/60">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                    <span>{language === 'en' ? 'Verified Profile' : 'सत्यापित प्रोफ़ाइल'}</span>
                  </span>
                </div>

                {/* 7. Students must enter their UTR / Transaction ID */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1">
                    <Hash className="w-3.5 h-3.5 text-purple-600" />
                    <span>{language === 'en' ? 'UPI Transaction ID (UTR / Reference Number) *' : 'यूपीआई ट्रांजैक्शन आईडी (UTR / संदर्भ संख्या) *'}</span>
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={24}
                    placeholder="e.g. 412890563412 (12-digit UTR)"
                    value={utr}
                    onChange={(e) => setUtr(e.target.value.replace(/\s+/g, ''))}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono text-xs font-bold focus:outline-blue-500"
                  />
                  <span className="text-[10px] text-slate-400 dark:text-slate-500 block mt-1">
                    {language === 'en'
                      ? 'Locate the 12-digit UPI Ref ID / UTR in PhonePe, Google Pay, Paytm, or BHIM receipt.'
                      : 'PhonePe, Google Pay, Paytm या BHIM में 12-अंकों का UPI Ref No / UTR देखें।'}
                  </span>
                </div>

                {/* 6. Upload payment screenshot */}
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
                            {screenshotFileName || 'Payment_Screenshot.png'}
                          </span>
                          <span className="text-[10px] text-emerald-700 dark:text-emerald-400 font-semibold flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" />
                            {language === 'en' ? 'Screenshot attached successfully' : 'स्क्रीनशॉट सफलतापूर्वक संलग्न'}
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
                        {language === 'en' ? 'Click to select transaction screenshot image' : 'ट्रांजैक्शन स्क्रीनशॉट चयन हेतु क्लिक करें'}
                      </span>
                      <span className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">
                        JPG, PNG, WebP (Max 5MB)
                      </span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                      />
                    </label>
                  )}
                </div>

                {submitError && (
                  <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs font-semibold flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    <span>{submitError}</span>
                  </div>
                )}

                {/* 9. Submit Payment button */}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-md transition-all active:scale-95 disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <span>{language === 'en' ? 'Submitting Payment Request...' : 'सत्यापन अनुरोध भेजा जा रहा है...'}</span>
                  ) : (
                    <>
                      <span>{language === 'en' ? 'Submit ₹5 Payment' : '₹5 भुगतान सत्यापन हेतु जमा करें'}</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            </div>
          ) : (
            /* Tab 2: 10. Show payment status: Pending, Approved or Rejected */
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
                  <p className="text-xs text-slate-400 mt-1">
                    {language === 'en' ? 'Complete your ₹5 UPI payment to unlock premium mock tests.' : 'प्रीमियम टेस्ट अनलॉक करने के लिए ₹5 का भुगतान करें।'}
                  </p>
                  <button
                    onClick={() => setActiveTab('pay')}
                    className="mt-3 px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 cursor-pointer"
                  >
                    {language === 'en' ? 'Pay ₹5 Now' : 'अभी ₹5 का भुगतान करें'}
                  </button>
                </div>
              ) : (
                paymentHistory.map((req) => (
                  <div
                    key={req.id}
                    className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs space-y-2.5"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-xs sm:text-sm text-slate-900 dark:text-white select-all">
                            UTR: {req.utr}
                          </span>
                          <span className="text-xs font-black text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950 px-2 py-0.5 rounded-md">
                            ₹{req.amount}
                          </span>
                        </div>
                        <span className="text-[11px] text-slate-400 dark:text-slate-500 block mt-0.5 font-mono">
                          {new Date(req.createdAt).toLocaleString()} • {req.studentMobile || 'Mobile not recorded'}
                        </span>
                      </div>

                      {/* 10. Status Badges: Pending, Approved, Rejected */}
                      {req.status === 'approved' ? (
                        <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 flex items-center gap-1 shrink-0">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          <span>{language === 'en' ? 'Approved' : 'स्वीकृत'}</span>
                        </span>
                      ) : req.status === 'rejected' ? (
                        <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-800 flex items-center gap-1 shrink-0">
                          <XCircle className="w-3.5 h-3.5 text-rose-600" />
                          <span>{language === 'en' ? 'Rejected' : 'अस्वीकृत'}</span>
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800 flex items-center gap-1 shrink-0 animate-pulse">
                          <Clock className="w-3.5 h-3.5 text-amber-600" />
                          <span>{language === 'en' ? 'Pending' : 'सत्यापनाधीन'}</span>
                        </span>
                      )}
                    </div>

                    {req.adminNotes && (
                      <p className="text-xs text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800">
                        💬 <strong>{language === 'en' ? 'Admin Audit Note:' : 'एडमिन टिप्पणी:'}</strong> {req.adminNotes}
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
                          {language === 'en' ? 'Re-submit with correct UTR →' : 'सही UTR के साथ पुनः प्रयास करें →'}
                        </button>
                      ) : (
                        <span className="text-[11px] text-slate-400 dark:text-slate-500">
                          {language === 'en' ? 'Under manual bank verification' : 'मैनुअल बैंक सत्यापन प्रगति पर है'}
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

      {/* Official Payment Receipt Modal */}
      {selectedReceipt && (
        <div className="fixed inset-0 z-60 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 relative animate-in fade-in zoom-in-95">
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
              <h3 className="text-lg font-black text-slate-900 dark:text-white">
                {language === 'en' ? 'CA Saathi Pass Receipt' : 'सीए साथी पास रसीद'}
              </h3>
              <p className="text-[11px] text-slate-500">
                Official Student Authorization Voucher
              </p>
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
                <span className="text-slate-500">Registered Mobile:</span>
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
                <span className="text-slate-500">Verified By:</span>
                <span className="font-semibold text-slate-900 dark:text-white">{selectedReceipt.reviewedBy || 'Ajeet Patel (Admin)'}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-500">Access Status:</span>
                <span className="font-bold text-emerald-600">Active & Unlocked ✓</span>
              </div>
            </div>

            <button
              onClick={() => setSelectedReceipt(null)}
              className="mt-6 w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs cursor-pointer shadow-xs"
            >
              {language === 'en' ? 'Close Receipt' : 'रसीद बंद करें'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
