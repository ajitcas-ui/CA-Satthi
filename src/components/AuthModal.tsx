import React, { useState } from 'react';
import { Language, UserProfile } from '../types';
import { 
  registerWithEmail, 
  loginWithEmail, 
  loginWithGoogle, 
  sendForgotPasswordEmail, 
  logoutUser, 
  updateUserProfileInDb 
} from '../firebase/services';
import { switchDemoAccount, PRESET_USERS } from '../utils/storageDb';
import { playChimeSound } from '../utils/audio';
import { 
  User, 
  Lock, 
  ShieldCheck, 
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
  HelpCircle,
  Loader2
} from 'lucide-react';

interface AuthModalProps {
  language: Language;
  currentUser: UserProfile;
  setCurrentUser: (user: UserProfile) => void;
  isOpen: boolean;
  onClose: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  language,
  currentUser,
  setCurrentUser,
  isOpen,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'profile' | 'login' | 'register' | 'forgot'>('profile');

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
  const [regYear, setRegYear] = useState(2027);
  const [regCity, setRegCity] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regBio, setRegBio] = useState('');
  const [regError, setRegError] = useState('');

  // Forgot password form state
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotMsg, setForgotMsg] = useState('');
  const [forgotError, setForgotError] = useState('');

  // Privacy toggles state
  const [hideCity, setHideCity] = useState(currentUser.privacyHideCity);
  const [hideAttempt, setHideAttempt] = useState(currentUser.privacyHideAttempt);
  const [privacySaved, setPrivacySaved] = useState(false);

  if (!isOpen) return null;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    setIsLoading(true);

    try {
      const user = await loginWithEmail(loginEmail, loginPassword);
      setCurrentUser(user);
      playChimeSound('success');
      setActiveTab('profile');
      setLoginEmail('');
      setLoginPassword('');
    } catch (err: any) {
      console.error(err);
      const code = err?.code || '';
      if (code === 'auth/invalid-credential' || code === 'auth/wrong-password' || code === 'auth/user-not-found') {
        setLoginError(language === 'en' ? 'Invalid email or password.' : 'अमान्य ईमेल या पासवर्ड।');
      } else if (code === 'auth/invalid-email') {
        setLoginError(language === 'en' ? 'Please enter a valid email address.' : 'कृपया सही ईमेल दर्ज करें।');
      } else {
        setLoginError(err?.message || (language === 'en' ? 'Login failed. Please check credentials.' : 'लॉगिन विफल। कृपया विवरण जांचें।'));
      }
      playChimeSound('warning');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoginError('');
    setIsLoading(true);
    try {
      const user = await loginWithGoogle();
      setCurrentUser(user);
      playChimeSound('success');
      setActiveTab('profile');
    } catch (err: any) {
      console.error(err);
      setLoginError(err?.message || (language === 'en' ? 'Google Sign-In failed.' : 'गूगल साइन-इन विफल।'));
      playChimeSound('warning');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegError('');

    if (regPassword.length < 6) {
      setRegError(language === 'en' ? 'Password must be at least 6 characters.' : 'पासवर्ड कम से कम 6 अक्षरों का होना चाहिए।');
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
        bio: regBio,
      });

      setCurrentUser(user);
      playChimeSound('success');
      setActiveTab('profile');
      setRegName('');
      setRegEmail('');
      setRegPassword('');
      setRegConfirmPassword('');
    } catch (err: any) {
      console.error(err);
      const code = err?.code || '';
      if (code === 'auth/email-already-in-use') {
        setRegError(language === 'en' ? 'An account with this email already exists. Please login.' : 'इस ईमेल से खाता पहले से मौजूद है। कृपया लॉगिन करें।');
      } else {
        setRegError(err?.message || (language === 'en' ? 'Registration failed.' : 'पंजीकरण विफल।'));
      }
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
      setForgotMsg(language === 'en' ? 'Password reset link sent to your email!' : 'पासवर्ड रीसेट लिंक आपके ईमेल पर भेज दिया गया है!');
      playChimeSound('success');
    } catch (err: any) {
      console.error(err);
      setForgotError(err?.message || (language === 'en' ? 'Failed to send reset email.' : 'रीसेट ईमेल भेजने में विफल।'));
      playChimeSound('warning');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSavePrivacy = async () => {
    try {
      await updateUserProfileInDb(currentUser.id, {
        privacyHideCity: hideCity,
        privacyHideAttempt: hideAttempt,
      });
      setCurrentUser({
        ...currentUser,
        privacyHideCity: hideCity,
        privacyHideAttempt: hideAttempt,
      });
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
    // Switch to default student demo account
    const fallback = PRESET_USERS[0];
    setCurrentUser(fallback);
    playChimeSound('click');
    setActiveTab('login');
  };

  const handleQuickDemoSwitch = (userId: string) => {
    const user = switchDemoAccount(userId);
    setCurrentUser(user);
    playChimeSound('success');
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full max-h-[92vh] overflow-y-auto p-6 shadow-2xl border border-slate-200 dark:border-slate-800 relative animate-in fade-in zoom-in-95 duration-200">
        
        {/* Top Header & Close Button */}
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
                {language === 'en' ? 'Firebase Auth & Firestore Connected' : 'फायरबेस प्रमाणीकरण एवं डेटाबेस'}
              </span>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center p-1 bg-slate-100 dark:bg-slate-800 rounded-xl mb-5 text-xs font-bold text-slate-600 dark:text-slate-300">
          <button
            onClick={() => setActiveTab('profile')}
            className={`flex-1 py-1.5 rounded-lg transition-all cursor-pointer ${
              activeTab === 'profile' ? 'bg-white dark:bg-slate-900 text-blue-700 dark:text-blue-400 shadow-xs' : 'hover:text-slate-900 dark:hover:text-slate-100'
            }`}
          >
            {language === 'en' ? 'My Profile' : 'प्रोफ़ाइल'}
          </button>
          <button
            onClick={() => setActiveTab('login')}
            className={`flex-1 py-1.5 rounded-lg transition-all cursor-pointer ${
              activeTab === 'login' ? 'bg-white dark:bg-slate-900 text-blue-700 dark:text-blue-400 shadow-xs' : 'hover:text-slate-900 dark:hover:text-slate-100'
            }`}
          >
            {language === 'en' ? 'Student Login' : 'लॉगिन'}
          </button>
          <button
            onClick={() => setActiveTab('register')}
            className={`flex-1 py-1.5 rounded-lg transition-all cursor-pointer ${
              activeTab === 'register' ? 'bg-white dark:bg-slate-900 text-blue-700 dark:text-blue-400 shadow-xs' : 'hover:text-slate-900 dark:hover:text-slate-100'
            }`}
          >
            {language === 'en' ? 'New Registration' : 'नया पंजीकरण'}
          </button>
        </div>

        {/* --- TAB 1: PROFILE & PRIVACY SETTINGS --- */}
        {activeTab === 'profile' && (
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-gradient-to-tr from-blue-50/70 to-indigo-50/70 dark:from-slate-800/80 dark:to-indigo-950/40 border border-blue-100 dark:border-slate-700 flex items-start gap-3.5">
              <div className="w-14 h-14 rounded-2xl bg-white dark:bg-slate-800 border border-blue-200 dark:border-slate-700 flex items-center justify-center text-3xl shadow-xs shrink-0">
                {currentUser.avatar || '🎓'}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h4 className="font-black text-slate-900 dark:text-slate-100 text-base truncate">
                    {currentUser.name}
                  </h4>
                  <span className={`text-[10px] uppercase font-black px-2 py-0.5 rounded-full ${
                    currentUser.role === 'admin'
                      ? 'bg-indigo-600 text-white'
                      : 'bg-blue-100 dark:bg-blue-900/60 text-blue-800 dark:text-blue-300'
                  }`}>
                    {currentUser.role}
                  </span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-400 truncate mt-0.5">{currentUser.email}</p>
                <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                  <span>🎯 {currentUser.targetAttempt}</span>
                  {currentUser.city && <span>• 📍 {currentUser.city}</span>}
                </div>
              </div>
            </div>

            {currentUser.bio && (
              <p className="text-xs text-slate-600 dark:text-slate-300 italic bg-slate-50 dark:bg-slate-800/60 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
                "{currentUser.bio}"
              </p>
            )}

            {/* STRICT PRIVACY NOTICE */}
            <div className="p-3.5 rounded-xl bg-amber-50/80 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/50 text-amber-900 dark:text-amber-200 text-xs flex items-start gap-2.5">
              <PhoneOff className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <strong className="block font-bold mb-0.5">
                  {language === 'en' ? 'Strict Student Privacy Protection' : 'कठोर विद्यार्थी गोपनीयता सुरक्षा'}
                </strong>
                <span>
                  {language === 'en'
                    ? 'Your personal phone number is strictly encrypted and never visible to other students in groups or partner matching.'
                    : 'आपका मोबाइल नंबर पूर्णतः गोपनीय रखा जाता है और किसी भी सार्वजनिक कम्युनिटी ग्रुप या पार्टनर मैच में कभी नहीं दिखाया जाता।'}
                </span>
              </div>
            </div>

            {/* Privacy Preferences */}
            <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3 bg-white dark:bg-slate-900">
              <h5 className="font-bold text-slate-800 dark:text-slate-200 text-xs uppercase tracking-wider flex items-center gap-1.5">
                <Settings className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                {language === 'en' ? 'Community Privacy Preferences' : 'कम्युनिटी गोपनीयता प्राथमिकताएं'}
              </h5>

              <label className="flex items-center justify-between text-xs text-slate-700 dark:text-slate-300 cursor-pointer">
                <span>{language === 'en' ? 'Hide my city from public community profile' : 'सार्वजनिक प्रोफ़ाइल से मेरा शहर छिपाएं'}</span>
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
                    <span>{language === 'en' ? 'Saved to Cloud!' : 'क्लाउड पर सहेजा गया!'}</span>
                  </>
                ) : (
                  <span>{language === 'en' ? 'Save Privacy Settings' : 'गोपनीयता सेटिंग्स सहेजें'}</span>
                )}
              </button>
            </div>

            {/* Quick Demo Role Switcher */}
            <div className="p-3.5 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/40 space-y-2">
              <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                {language === 'en' ? 'Quick Demo Account Switcher:' : 'त्वरित डेमो खाता चयनकर्ता:'}
              </span>
              <div className="grid grid-cols-1 gap-1.5">
                {PRESET_USERS.map((u) => (
                  <button
                    key={u.id}
                    onClick={() => handleQuickDemoSwitch(u.id)}
                    className={`p-2 rounded-lg text-left text-xs transition-all flex items-center justify-between border cursor-pointer ${
                      currentUser.id === u.id
                        ? 'bg-blue-50 dark:bg-blue-950/70 border-blue-400 dark:border-blue-600 font-bold text-blue-900 dark:text-blue-200'
                        : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/60'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span>{u.avatar}</span>
                      <span>{u.name}</span>
                      <span className="text-[10px] text-slate-400 dark:text-slate-500 font-mono">({u.email})</span>
                    </div>
                    <span className="text-[9px] uppercase font-bold px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                      {u.role}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Logout Button */}
            <button
              onClick={handleLogout}
              className="w-full py-2.5 rounded-xl border border-rose-200 dark:border-rose-900/60 text-rose-700 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 font-bold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              <span>{language === 'en' ? 'Logout Account' : 'खाते से लॉगआउट करें'}</span>
            </button>
          </div>
        )}

        {/* --- TAB 2: SECURE STUDENT LOGIN --- */}
        {activeTab === 'login' && (
          <form onSubmit={handleLogin} className="space-y-4">
            {loginError && (
              <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
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
              className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-bold text-sm shadow-md transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>{language === 'en' ? 'Authenticating...' : 'सत्यापित किया जा रहा है...'}</span>
                </>
              ) : (
                <>
                  <Lock className="w-4 h-4" />
                  <span>{language === 'en' ? 'Secure Student Login' : 'सुरक्षित विद्यार्थी लॉगिन'}</span>
                </>
              )}
            </button>

            {/* Google Sign In Divider */}
            <div className="relative my-4 text-center">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200 dark:border-slate-800" />
              </div>
              <span className="relative px-3 bg-white dark:bg-slate-900 text-xs text-slate-400 dark:text-slate-500 font-medium">
                {language === 'en' ? 'or continue with' : 'अथवा इसके साथ जारी रखें'}
              </span>
            </div>

            <button
              type="button"
              onClick={handleGoogleLogin}
              disabled={isLoading}
              className="w-full py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 font-bold text-xs text-slate-700 dark:text-slate-200 transition-all flex items-center justify-center gap-2.5 cursor-pointer shadow-2xs"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>{language === 'en' ? 'Sign in with Google' : 'गूगल के साथ लॉगिन करें'}</span>
            </button>

            <div className="text-center pt-2">
              <span className="text-xs text-slate-500 dark:text-slate-400">
                {language === 'en' ? "Don't have an account yet?" : 'क्या आपका खाता नहीं है?'}{' '}
                <button
                  type="button"
                  onClick={() => setActiveTab('register')}
                  className="font-bold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                >
                  {language === 'en' ? 'Register Now' : 'पंजीकरण करें'}
                </button>
              </span>
            </div>
          </form>
        )}

        {/* --- TAB 3: STUDENT REGISTRATION --- */}
        {activeTab === 'register' && (
          <form onSubmit={handleRegister} className="space-y-3.5">
            {regError && (
              <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
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
                  <option value="September 2026">September 2026</option>
                  <option value="Dec 2026">Dec 2026</option>
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
                {language === 'en' ? 'Phone (Encrypted & Kept Private)' : 'फ़ोन (सुरक्षित व गोपनीय)'}
              </label>
              <input
                type="tel"
                placeholder="+91 98765 43210 (Never publicly exposed)"
                value={regPhone}
                onChange={(e) => setRegPhone(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm focus:outline-blue-500 placeholder-slate-400 dark:placeholder-slate-500"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-bold text-sm shadow-md transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>{language === 'en' ? 'Creating Cloud Account...' : 'खाता बनाया जा रहा है...'}</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>{language === 'en' ? 'Create Student Profile' : 'विद्यार्थी प्रोफ़ाइल बनाएं'}</span>
                </>
              )}
            </button>

            <div className="text-center pt-2">
              <span className="text-xs text-slate-500 dark:text-slate-400">
                {language === 'en' ? 'Already have an account?' : 'क्या पहले से खाता है?'}{' '}
                <button
                  type="button"
                  onClick={() => setActiveTab('login')}
                  className="font-bold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                >
                  {language === 'en' ? 'Login' : 'लॉगिन करें'}
                </button>
              </span>
            </div>
          </form>
        )}

        {/* --- TAB 4: FORGOT PASSWORD --- */}
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
                  ? "Enter your registered email address and we'll send you an official reset link."
                  : 'अपना पंजीकृत ईमेल दर्ज करें और हम आपको एक रीसेट लिंक भेजेंगे।'}
              </p>
            </div>

            {forgotMsg && (
              <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                <span>{forgotMsg}</span>
              </div>
            )}

            {forgotError && (
              <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
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
              className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-bold text-sm shadow-md transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-2"
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
