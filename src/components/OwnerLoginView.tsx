import React, { useState } from 'react';
import { UserProfile } from '../types';
import {
  ADMIN_EMAIL,
  loginWithEmail,
  loginWithGoogle,
  logoutUser,
  sendVerificationForCurrentUser,
} from '../firebase/services';
import { auth } from '../firebase/config';
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  Eye,
  EyeOff,
  Loader2,
  Lock,
  LogOut,
  Mail,
  ShieldCheck,
} from 'lucide-react';

interface OwnerLoginViewProps {
  currentUser: UserProfile;
  isEmailVerified: boolean;
  onOwnerAuthenticated: (profile: UserProfile) => void;
  onReturnToStudentApp: () => void;
}

export const OwnerLoginView: React.FC<OwnerLoginViewProps> = ({
  currentUser,
  isEmailVerified,
  onOwnerAuthenticated,
  onReturnToStudentApp,
}) => {
  const [email, setEmail] = useState(ADMIN_EMAIL);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [infoMsg, setInfoMsg] = useState('');

  const isSignedInNonOwner = Boolean(
    currentUser?.id &&
      currentUser.id !== 'guest' &&
      (currentUser.email?.toLowerCase().trim() !== ADMIN_EMAIL || !isEmailVerified)
  );

  const isUnverifiedOwnerEmail = Boolean(
    currentUser?.id &&
      currentUser.id !== 'guest' &&
      currentUser.email?.toLowerCase().trim() === ADMIN_EMAIL &&
      !isEmailVerified
  );

  const handleGoogleOwnerLogin = async () => {
    setError('');
    setInfoMsg('');
    setBusy(true);
    try {
      const profile = await loginWithGoogle();
      const fbUser = auth.currentUser;
      const verifiedEmail = fbUser?.email?.toLowerCase().trim() || profile.email?.toLowerCase().trim();
      if (verifiedEmail !== ADMIN_EMAIL || !fbUser?.emailVerified || profile.role !== 'admin') {
        await logoutUser();
        setError(
          `Unauthorized account (${verifiedEmail || 'unknown'}). Only the authorized owner account (${ADMIN_EMAIL}) can access /owner-dashboard.`
        );
        return;
      }
      onOwnerAuthenticated(profile);
    } catch (err) {
      const code = (err as { code?: string })?.code || '';
      if (code === 'auth/popup-closed-by-user') {
        setError('Google Sign-In window was closed before completing login.');
      } else {
        setError('Owner Google Sign-In failed. Please try again.');
      }
    } finally {
      setBusy(false);
    }
  };

  const handleEmailOwnerLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setInfoMsg('');

    const cleanEmail = email.trim().toLowerCase();
    if (cleanEmail !== ADMIN_EMAIL) {
      setError(`Only the authorized owner email (${ADMIN_EMAIL}) is permitted on /owner-login.`);
      return;
    }

    if (!password) {
      setError('Please enter your owner account password.');
      return;
    }

    setBusy(true);
    try {
      const profile = await loginWithEmail(cleanEmail, password);
      const fbUser = auth.currentUser;
      if (!fbUser?.emailVerified) {
        setError(
          'Your email is not verified in Firebase Auth yet. Click "Continue with Owner Google Account" above for instant verified access, or verify your email link.'
        );
        return;
      }
      onOwnerAuthenticated(profile);
    } catch (err) {
      const code = (err as { code?: string })?.code || '';
      if (code === 'auth/operation-not-allowed') {
        setError('Email/Password sign-in is disabled in Firebase Console. Use "Continue with Owner Google Account" above.');
      } else if (code === 'auth/invalid-credential' || code === 'auth/wrong-password' || code === 'auth/user-not-found') {
        setError('Invalid owner email or password. You can also sign in instantly with your Owner Google Account above.');
      } else {
        setError('Owner authentication failed. Please use your authorized Owner Google Account.');
      }
    } finally {
      setBusy(false);
    }
  };

  const handleResendVerification = async () => {
    setError('');
    setInfoMsg('');
    try {
      await sendVerificationForCurrentUser();
      setInfoMsg(`Verification email sent to ${ADMIN_EMAIL}. Once verified, reload or sign in via Google.`);
    } catch {
      setError('Unable to send verification email right now. Please sign in with Google instead.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-4 font-sans">
      <div className="max-w-md w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-8 shadow-sm space-y-6">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-xl bg-indigo-600 text-white flex items-center justify-center mx-auto shadow-sm">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
            CA Saathi · Private Control Panel
          </p>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">
            Owner Login Portal
          </h1>
          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
            Dedicated authentication for the platform owner. Verified owner login automatically redirects to <span className="font-mono font-semibold text-indigo-600 dark:text-indigo-400">/owner-dashboard</span>.
          </p>
        </div>

        {isSignedInNonOwner && (
          <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-xs text-amber-900 dark:text-amber-200 space-y-2.5">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">
                  {isUnverifiedOwnerEmail
                    ? 'Owner Email Pending Verification'
                    : `Signed in as ${currentUser.email || 'Student Account'}`}
                </p>
                <p className="text-[11px] mt-0.5 opacity-90">
                  {isUnverifiedOwnerEmail
                    ? 'Please sign in with Google or verify your email to unlock server-authorized Owner Dashboard access.'
                    : 'This session does not have owner privileges. Switch to your authorized Owner Google account to proceed.'}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              {isUnverifiedOwnerEmail && (
                <button
                  type="button"
                  onClick={handleResendVerification}
                  className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-[11px] font-semibold cursor-pointer"
                >
                  Send Verification Link
                </button>
              )}
              <button
                type="button"
                onClick={async () => {
                  await logoutUser();
                  setError('');
                  setInfoMsg('Signed out previous account. Sign in as Owner below.');
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-amber-300 dark:border-amber-700 text-amber-900 dark:text-amber-200 text-[11px] font-semibold cursor-pointer"
              >
                <LogOut className="w-3 h-3" />
                <span>Sign Out & Switch Account</span>
              </button>
            </div>
          </div>
        )}

        {error && (
          <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {infoMsg && (
          <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-xs flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{infoMsg}</span>
          </div>
        )}

        {/* Primary Verified Owner Google Sign-In */}
        <button
          type="button"
          disabled={busy}
          onClick={handleGoogleOwnerLogin}
          className="w-full py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 transition-colors"
        >
          {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
          <span>{busy ? 'Verifying Owner Account...' : 'Continue with Owner Google Account'}</span>
        </button>

        <div className="relative flex items-center py-1">
          <div className="flex-grow border-t border-slate-200 dark:border-slate-800" />
          <span className="shrink mx-3 text-[11px] font-medium text-slate-400">or owner email login</span>
          <div className="flex-grow border-t border-slate-200 dark:border-slate-800" />
        </div>

        {/* Owner Email + Password Sign-In */}
        <form onSubmit={handleEmailOwnerLogin} className="space-y-3">
          <div>
            <label htmlFor="owner-login-email" className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Authorized Owner Email
            </label>
            <div className="relative">
              <Mail className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                id="owner-login-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={ADMIN_EMAIL}
                className="w-full pl-8 pr-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:outline-indigo-500"
              />
            </div>
          </div>

          <div>
            <label htmlFor="owner-login-password" className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Owner Password
            </label>
            <div className="relative">
              <Lock className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                id="owner-login-password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter account password"
                className="w-full pl-8 pr-9 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:outline-indigo-500"
              />
              <button
                type="button"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={busy}
            className="w-full py-2.5 px-4 rounded-xl bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 dark:hover:bg-slate-700 text-white text-xs font-semibold cursor-pointer disabled:opacity-60 transition-colors"
          >
            Sign In to Owner Dashboard
          </button>
        </form>

        <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onReturnToStudentApp}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Student App</span>
          </button>

          <span className="text-[11px] text-slate-400 font-mono">/owner-login</span>
        </div>
      </div>
    </div>
  );
};
