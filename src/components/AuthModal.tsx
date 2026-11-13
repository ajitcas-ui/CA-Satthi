import React, { useEffect, useState } from 'react';
import { Language, UserProfile } from '../types';
import {
  registerWithEmail,
  loginWithEmail,
  loginWithGoogle,
  sendForgotPasswordEmail,
  logoutUser,
  updateUserProfileInDb,
  logAnalyticsEvent,
} from '../firebase/services';
import { clearCurrentUser, GUEST_USER, updateUserProfile } from '../utils/storageDb';
import { playChimeSound } from '../utils/audio';
import {
  Lock,
  LogOut,
  Sparkles,
  X,
  CheckCircle2,
  Eye,
  EyeOff,
  GraduationCap,
  Settings,
  PhoneOff,
  Mail,
  KeyRound,
  AlertCircle,
  Loader2,
  Phone,
  Target,
} from 'lucide-react';

interface AuthModalProps {
  language: Language;
  currentUser: UserProfile;
  setCurrentUser: (user: UserProfile) => void;
  isOpen: boolean;
  onClose: () => void;
  onOpenOwnerLogin?: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  language,
  currentUser,
  setCurrentUser,
  isOpen,
  onClose,
  onOpenOwnerLogin,
}) => {
  const isGuest = !currentUser || currentUser.id === 'guest';
  const [activeTab, setActiveTab] = useState<'profile' | 'login' | 'register' | 'forgot'>(
    isGuest ? 'login' : 'profile'
  );

  // Login form state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Register form state
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [regAttempt, setRegAttempt] = useState('January 2027');
  const [regYear] = useState(2027);
  const [regCity, setRegCity] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regError, setRegError] = useState('');

  // Forgot password form state
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotMsg, setForgotMsg] = useState('');
  const [forgotError, setForgotError] = useState('');

  // Profile & Privacy state
  const [hideCity, setHideCity] = useState(currentUser.privacyHideCity);
  const [hideAttempt, setHideAttempt] = useState(currentUser.privacyHideAttempt);
  const [profilePhone, setProfilePhone] = useState(currentUser.phone || '');
  const [dailyGoalMinutes, setDailyGoalMinutes] = useState(currentUser.dailyGoalMinutes || 120);
  const [privacySaved, setPrivacySaved] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setActiveTab(currentUser.id === 'guest' ? 'login' : 'profile');
      setHideCity(currentUser.privacyHideCity);
      setHideAttempt(currentUser.privacyHideAttempt);
      setProfilePhone(currentUser.phone || '');
      setDailyGoalMinutes(currentUser.dailyGoalMinutes || 120);
      setLoginError('');
      setRegError('');
      setForgotError('');
    }
  }, [isOpen, currentUser]);

  if (!isOpen) return null;

  const mapAuthError = (err: unknown, context: 'login' | 'register' | 'forgot'): string => {
    const code = (err as { code?: string })?.code || '';
    if (code === 'auth/operation-not-allowed') {
      return language === 'en'
        ? 'Email/Password sign-in is not yet enabled in Firebase Console (Authentication -> Sign-in method). Please use "Continue with Google" above for instant secure access.'
        : 'ईमेल/पासवर्ड साइन-इन अभी Firebase Console में सक्रिय नहीं है। कृपया तुरंत सुरक्षित प्रवेश के लिए ऊपर दिए "Continue with Google" बटन का उपयोग करें।';
    }
    if (code === 'auth/invalid-credential' || code === 'auth/wrong-password' || code === 'auth/user-not-found') {
      return language === 'en' ? 'Invalid email or password.' : 'अमान्य ईमेल या पासवर्ड।';
    }
    if (code === 'auth/invalid-email') {
      return language === 'en' ? 'Please enter a valid email address.' : 'कृपया सही ईमेल दर्ज करें।';
    }
    if (code === 'auth/email-already-in-use') {
      return language === 'en'
        ? 'An account with this email already exists. Please sign in.'
        : 'इस ईमेल से खाता पहले से मौजूद है। कृपया लॉगिन करें।';
    }
    if (code === 'auth/popup-closed-by-user') {
      return language === 'en'
        ? 'Google Sign-In popup was closed before completing login.'
        : 'गूगल साइन-इन पूरा होने से पहले विंडो बंद हो गई।';
    }
    const fallbackMsg = (err as { message?: string })?.message;
    if (fallbackMsg) return fallbackMsg;
    if (context === 'register') return language === 'en' ? 'Registration failed.' : 'पंजीकरण विफल।';
    if (context === 'forgot') return language === 'en' ? 'Failed to send reset email.' : 'रीसेट ईमेल विफल।';
    return language === 'en' ? 'Authentication failed.' : 'लॉगिन विफल।';
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    setIsLoading(true);

    try {
      const user = await loginWithEmail(loginEmail, loginPassword);
      setCurrentUser(user);
      logAnalyticsEvent('login', user.id, user.id).catch(() => {});
      playChimeSound('success');
      setLoginEmail('');
      setLoginPassword('');
      onClose();
    } catch (err) {
      setLoginError(mapAuthError(err, 'login'));
      playChimeSound('warning');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoginError('');
    setRegError('');
    setIsLoading(true);
    try {
      const user = await loginWithGoogle();
      setCurrentUser(user);
      logAnalyticsEvent('login', user.id, user.id).catch(() => {});
      playChimeSound('success');
      onClose();
    } catch (err) {
      const msg = mapAuthError(err, 'login');
      setLoginError(msg);
      setRegError(msg);
      playChimeSound('warning');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegError('');

    if (regPassword.length < 6) {
      setRegError(
        language === 'en' ? 'Password must be at least 6 characters.' : 'पासवर्ड कम से कम 6 अक्षरों का होना चाहिए।'
      );
      return;
    }

    if (regPassword !== regConfirmPassword) {
      setRegError(language === 'en' ? 'Passwords do not match.' : 'पासवर्ड मेल नहीं खाते।');
      return;
    }

    setIsLoading(true);
    try {
      const user = await registerWithEmail({
        name: regName,
        email: regEmail,
        password: regPassword,
        targetAttempt: regAttempt,
        targetYear: regYear,
        city: regCity,
        phone: regPhone,
      });

      setCurrentUser(user);
      logAnalyticsEvent('signup', user.id, user.id).catch(() => {});
      playChimeSound('success');
      setRegName('');
      setRegEmail('');
      setRegPassword('');
      setRegConfirmPassword('');
      onClose();
    } catch (err) {
      setRegError(mapAuthError(err, 'register'));
      playChimeSound('warning');
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotMsg('');
    setForgotError('');
    setIsLoading(true);

    try {
      await sendForgotPasswordEmail(forgotEmail);
      setForgotMsg(
        language === 'en'
          ? 'Password reset link sent to your email!'
          : 'पासवर्ड रीसेट लिंक आपके ईमेल पर भेज दिया गया है!'
      );
      playChimeSound('success');
    } catch (err) {
      setForgotError(mapAuthError(err, 'forgot'));
      playChimeSound('warning');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSavePrivacy = async () => {
    if (isGuest) return;
    const cleanPhone = profilePhone.replace(/\D/g, '').slice(-10);
    const updates: Partial<UserProfile> = {
      privacyHideCity: hideCity,
      privacyHideAttempt: hideAttempt,
      dailyGoalMinutes: Math.max(15, Math.min(720, Number(dailyGoalMinutes) || 120)),
      ...(cleanPhone.length === 10 ? { phone: cleanPhone } : {}),
    };
    try {
      await updateUserProfileInDb(currentUser.id, updates);
      const merged = updateUserProfile(updates);
      setCurrentUser({ ...currentUser, ...merged, ...updates });
      setPrivacySaved(true);
      playChimeSound('success');
      setTimeout(() => setPrivacySaved(false), 2500);
    } catch (err) {
      console.error(err);
    }
  };

  const handleLogout = async () => {
    try {
      await logoutUser();
    } catch (e) {
      console.error(e);
    }
    clearCurrentUser();
    setCurrentUser(GUEST_USER);
    playChimeSound('click');
    setActiveTab('login');
  };

  const GoogleButton = () => (
    <button
      type="button"
      onClick={handleGoogleLogin}
      disabled={isLoading}
      className="w-full py-2.5 px-4 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 font-bold text-sm text-slate-800 dark:text-slate-100 transition-colors flex items-center justify-center gap-2.5 cursor-pointer shadow-xs"
    >
      <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
      </svg>
      <span>{language === 'en' ? 'Continue with Google (Instant)' : 'गूगल के साथ साइन इन करें'}</span>
    </button>
  );

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full max-h-[92vh] overflow-y-auto p-6 shadow-2xl border border-slate-200 dark:border-slate-800 relative">
        {/* Top Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 flex items-center justify-center font-bold">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 dark:text-slate-100 text-base leading-tight">
                {language === 'en' ? 'Student Account & Security' : 'विद्यार्थी खाता एवं सुरक्षा'}
              </h3>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                {language === 'en' ? 'Target: CA Foundation January 2027' : 'लक्ष्य: सीए फाउंडेशन जनवरी 2027'}
              </span>
            </div>
          </div>

          <button
            onClick={onClose}
            aria-label="Close modal"
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center p-1 bg-slate-100 dark:bg-slate-800 rounded-xl mb-5 text-xs font-bold text-slate-600 dark:text-slate-300">
          {!isGuest && (
            <button
              onClick={() => setActiveTab('profile')}
              className={`flex-1 py-1.5 rounded-lg transition-all cursor-pointer ${
                activeTab === 'profile'
                  ? 'bg-white dark:bg-slate-900 text-blue-700 dark:text-blue-400 shadow-xs'
                  : 'hover:text-slate-900 dark:hover:text-slate-100'
              }`}
            >
              {language === 'en' ? 'My Profile' : 'प्रोफ़ाइल'}
            </button>
          )}
          <button
            onClick={() => setActiveTab('login')}
            className={`flex-1 py-1.5 rounded-lg transition-all cursor-pointer ${
              activeTab === 'login'
                ? 'bg-white dark:bg-slate-900 text-blue-700 dark:text-blue-400 shadow-xs'
                : 'hover:text-slate-900 dark:hover:text-slate-100'
            }`}
          >
            {language === 'en' ? 'Student Login' : 'लॉगिन'}
          </button>
          <button
            onClick={() => setActiveTab('register')}
            className={`flex-1 py-1.5 rounded-lg transition-all cursor-pointer ${
              activeTab === 'register'
                ? 'bg-white dark:bg-slate-900 text-blue-700 dark:text-blue-400 shadow-xs'
                : 'hover:text-slate-900 dark:hover:text-slate-100'
            }`}
          >
            {language === 'en' ? 'New Registration' : 'नया पंजीकरण'}
          </button>
        </div>

        {/* TAB 1: PROFILE & PRIVACY SETTINGS (Signed-in Users Only) */}
        {activeTab === 'profile' && !isGuest && (
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 flex items-start gap-3.5">
              <div className="w-14 h-14 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-3xl shrink-0">
                {currentUser.avatar || '🎓'}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h4 className="font-bold text-slate-900 dark:text-slate-100 text-base truncate">
                    {currentUser.name}
                  </h4>
                  <span
                    className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-md ${
                      currentUser.role === 'admin'
                        ? 'bg-indigo-600 text-white'
                        : 'bg-blue-100 dark:bg-blue-900/60 text-blue-800 dark:text-blue-300'
                    }`}
                  >
                    {currentUser.role}
                  </span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-400 truncate mt-0.5">{currentUser.email}</p>
                <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                  <span>{currentUser.targetAttempt}</span>
                  {currentUser.city && <span>• {currentUser.city}</span>}
                </div>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-amber-50/80 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/50 text-amber-900 dark:text-amber-200 text-xs flex items-start gap-2.5">
              <PhoneOff className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <strong className="block font-bold mb-0.5">
                  {language === 'en' ? 'Strict Student Privacy Protection' : 'कठोर विद्यार्थी गोपनीयता सुरक्षा'}
                </strong>
                <span>
                  {language === 'en'
                    ? 'Your mobile number and email are kept strictly private and are never exposed to other students.'
                    : 'आपका मोबाइल नंबर व ईमेल पूर्णतः गोपनीय रखा जाता है और अन्य विद्यार्थियों को कभी नहीं दिखाया जाता।'}
                </span>
              </div>
            </div>

            <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3 bg-white dark:bg-slate-900">
              <h5 className="font-bold text-slate-800 dark:text-slate-200 text-xs uppercase tracking-wider flex items-center gap-1.5">
                <Settings className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                {language === 'en' ? 'Study Goal & Privacy Preferences' : 'अध्ययन लक्ष्य एवं गोपनीयता'}
              </h5>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1 flex items-center gap-1">
                    <Phone className="w-3 h-3" />
                    <span>{language === 'en' ? 'Registered Mobile (10 digits)' : 'मोबाइल नंबर (10 अंक)'}</span>
                  </label>
                  <input
                    type="tel"
                    maxLength={10}
                    placeholder="10-digit mobile"
                    value={profilePhone}
                    onChange={(e) => setProfilePhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-mono text-slate-900 dark:text-slate-100"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1 flex items-center gap-1">
                    <Target className="w-3 h-3" />
                    <span>{language === 'en' ? 'Daily Study Goal (Mins)' : 'दैनिक लक्ष्य (मिनट)'}</span>
                  </label>
                  <input
                    type="number"
                    min={15}
                    max={720}
                    step={15}
                    value={dailyGoalMinutes}
                    onChange={(e) => setDailyGoalMinutes(Number(e.target.value))}
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-mono text-slate-900 dark:text-slate-100"
                  />
                </div>
              </div>

              <label className="flex items-center justify-between text-xs text-slate-700 dark:text-slate-300 cursor-pointer pt-1">
                <span>{language === 'en' ? 'Hide my city from community profile' : 'समुदाय प्रोफ़ाइल से मेरा शहर छिपाएं'}</span>
                <input
                  type="checkbox"
                  checked={hideCity}
                  onChange={(e) => setHideCity(e.target.checked)}
                  className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer"
                />
              </label>

              <label className="flex items-center justify-between text-xs text-slate-700 dark:text-slate-300 cursor-pointer">
                <span>{language === 'en' ? 'Hide target exam attempt year' : 'लक्षित परीक्षा सत्र वर्ष छिपाएं'}</span>
                <input
                  type="checkbox"
                  checked={hideAttempt}
                  onChange={(e) => setHideAttempt(e.target.checked)}
                  className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer"
                />
              </label>

              <button
                onClick={handleSavePrivacy}
                className="w-full py-2 rounded-lg bg-blue-50 dark:bg-slate-800 hover:bg-blue-100 dark:hover:bg-slate-700 text-blue-700 dark:text-blue-300 font-bold text-xs transition-colors cursor-pointer flex items-center justify-center gap-1"
              >
                {privacySaved ? (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>{language === 'en' ? 'Saved!' : 'सहेजा गया!'}</span>
                  </>
                ) : (
                  <span>{language === 'en' ? 'Save Profile Settings' : 'सेटिंग्स सहेजें'}</span>
                )}
              </button>
            </div>

            <button
              onClick={handleLogout}
              className="w-full py-2.5 rounded-xl border border-rose-200 dark:border-rose-900/60 text-rose-700 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 font-bold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              <span>{language === 'en' ? 'Sign Out' : 'लॉगआउट करें'}</span>
            </button>
          </div>
        )}

        {/* TAB 2: SECURE STUDENT LOGIN */}
        {activeTab === 'login' && (
          <div className="space-y-4">
            <GoogleButton />

            <div className="relative text-center">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200 dark:border-slate-800" />
              </div>
              <span className="relative px-3 bg-white dark:bg-slate-900 text-xs text-slate-400 dark:text-slate-500 font-medium">
                {language === 'en' ? 'or sign in with email' : 'अथवा ईमेल से लॉगिन करें'}
              </span>
            </div>

            <form onSubmit={handleLogin} className="space-y-3.5">
              {loginError && (
                <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200 text-xs flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{loginError}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {language === 'en' ? 'Student Email' : 'विद्यार्थी ईमेल'}
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="email"
                    required
                    placeholder="student@example.com"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm focus:outline-blue-500 placeholder-slate-400 dark:placeholder-slate-500"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    {language === 'en' ? 'Password' : 'पासवर्ड'}
                  </label>
                  <button
                    type="button"
                    onClick={() => setActiveTab('forgot')}
                    className="text-[11px] text-blue-600 dark:text-blue-400 hover:underline cursor-pointer font-semibold"
                  >
                    {language === 'en' ? 'Forgot Password?' : 'पासवर्ड भूल गए?'}
                  </button>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="••••••••"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    className="w-full pl-9 pr-9 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm focus:outline-blue-500 placeholder-slate-400 dark:placeholder-slate-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-bold text-sm shadow-sm transition-colors cursor-pointer flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>{language === 'en' ? 'Authenticating...' : 'सत्यापित किया जा रहा है...'}</span>
                  </>
                ) : (
                  <>
                    <Lock className="w-4 h-4" />
                    <span>{language === 'en' ? 'Sign In with Email' : 'ईमेल से लॉगिन करें'}</span>
                  </>
                )}
              </button>

              <div className="text-center pt-1 space-y-2">
                <span className="text-xs text-slate-500 dark:text-slate-400 block">
                  {language === 'en' ? "Don't have an account yet?" : 'क्या आपका खाता नहीं है?'}{' '}
                  <button
                    type="button"
                    onClick={() => setActiveTab('register')}
                    className="font-bold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                  >
                    {language === 'en' ? 'Register Now' : 'पंजीकरण करें'}
                  </button>
                </span>
                {onOpenOwnerLogin && (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onOpenOwnerLogin();
                    }}
                    className="text-[11px] font-medium text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
                  >
                    Owner Login Portal (/owner-login) &rarr;
                  </button>
                )}
              </div>
            </form>
          </div>
        )}

        {/* TAB 3: STUDENT REGISTRATION */}
        {activeTab === 'register' && (
          <div className="space-y-4">
            <GoogleButton />

            <div className="relative text-center">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200 dark:border-slate-800" />
              </div>
              <span className="relative px-3 bg-white dark:bg-slate-900 text-xs text-slate-400 dark:text-slate-500 font-medium">
                {language === 'en' ? 'or register with email & password' : 'अथवा ईमेल द्वारा पंजीकरण करें'}
              </span>
            </div>

            <form onSubmit={handleRegister} className="space-y-3">
              {regError && (
                <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200 text-xs flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{regError}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {language === 'en' ? 'Full Name' : 'पूरा नाम'}
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Rahul Sharma"
                  value={regName}
                  onChange={(e) => setRegName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm focus:outline-blue-500 placeholder-slate-400 dark:placeholder-slate-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {language === 'en' ? 'Email Address' : 'ईमेल पता'}
                </label>
                <input
                  type="email"
                  required
                  placeholder="rahul@example.com"
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm focus:outline-blue-500 placeholder-slate-400 dark:placeholder-slate-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {language === 'en' ? 'Password' : 'पासवर्ड'}
                  </label>
                  <input
                    type="password"
                    required
                    placeholder="Min 6 chars"
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm focus:outline-blue-500 placeholder-slate-400 dark:placeholder-slate-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {language === 'en' ? 'Confirm' : 'पुष्टि करें'}
                  </label>
                  <input
                    type="password"
                    required
                    placeholder="Repeat password"
                    value={regConfirmPassword}
                    onChange={(e) => setRegConfirmPassword(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm focus:outline-blue-500 placeholder-slate-400 dark:placeholder-slate-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {language === 'en' ? 'Target Attempt' : 'लक्षित सत्र'}
                  </label>
                  <select
                    value={regAttempt}
                    onChange={(e) => setRegAttempt(e.target.value)}
                    className="w-full px-2.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-medium focus:outline-blue-500 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                  >
                    <option value="January 2027">January 2027</option>
                    <option value="May 2027">May 2027</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {language === 'en' ? 'City' : 'शहर'}
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Pune, Jaipur"
                    value={regCity}
                    onChange={(e) => setRegCity(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm focus:outline-blue-500 placeholder-slate-400 dark:placeholder-slate-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {language === 'en' ? 'Mobile Number (Kept Private)' : 'मोबाइल नंबर (गोपनीय)'}
                </label>
                <input
                  type="tel"
                  maxLength={10}
                  placeholder="10-digit mobile (used for payment verification)"
                  value={regPhone}
                  onChange={(e) => setRegPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm focus:outline-blue-500 placeholder-slate-400 dark:placeholder-slate-500"
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-bold text-sm shadow-sm transition-colors cursor-pointer flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>{language === 'en' ? 'Creating Account...' : 'खाता बनाया जा रहा है...'}</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>{language === 'en' ? 'Create Student Account' : 'विद्यार्थी खाता बनाएं'}</span>
                  </>
                )}
              </button>
            </form>
          </div>
        )}

        {/* TAB 4: FORGOT PASSWORD */}
        {activeTab === 'forgot' && (
          <form onSubmit={handleForgotPassword} className="space-y-4">
            <div className="text-center space-y-1">
              <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto">
                <KeyRound className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-slate-900 dark:text-slate-100 text-sm">
                {language === 'en' ? 'Reset Your Password' : 'अपना पासवर्ड रीसेट करें'}
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {language === 'en'
                  ? "Enter your registered email address and we'll send you a reset link."
                  : 'अपना पंजीकृत ईमेल दर्ज करें और हम आपको रीसेट लिंक भेजेंगे।'}
              </p>
            </div>

            {forgotMsg && (
              <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                <span>{forgotMsg}</span>
              </div>
            )}

            {forgotError && (
              <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200 text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{forgotError}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                {language === 'en' ? 'Registered Email' : 'पंजीकृत ईमेल'}
              </label>
              <input
                type="email"
                required
                placeholder="student@example.com"
                value={forgotEmail}
                onChange={(e) => setForgotEmail(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm focus:outline-blue-500 placeholder-slate-400 dark:placeholder-slate-500"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-bold text-sm shadow-sm cursor-pointer flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>{language === 'en' ? 'Sending Link...' : 'लिंक भेजा जा रहा है...'}</span>
                </>
              ) : (
                <span>{language === 'en' ? 'Send Reset Link' : 'रीसेट लिंक भेजें'}</span>
              )}
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('login')}
              className="w-full text-xs text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 text-center font-semibold cursor-pointer block"
            >
              &larr; {language === 'en' ? 'Back to Login' : 'लॉगिन पर वापस जाएं'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
