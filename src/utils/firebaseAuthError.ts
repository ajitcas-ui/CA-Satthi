export interface FormattedFirebaseAuthError {
  code: string;
  rawMessage: string;
  hint?: string;
  displayText: string;
}

export interface FirebaseAuthUserLike {
  email?: string | null;
  emailVerified?: boolean;
  providerData?: Array<{ providerId?: string | null; email?: string | null } | null>;
}

export function resolveGoogleUserEmail(fbUser: FirebaseAuthUserLike | null | undefined): string {
  if (!fbUser) return '';
  const direct = (fbUser.email || '').trim().toLowerCase();
  if (direct) return direct;

  if (Array.isArray(fbUser.providerData)) {
    const googleEntry = fbUser.providerData.find(
      (p) => p?.providerId === 'google.com' && typeof p.email === 'string' && p.email.trim().length > 0
    );
    if (googleEntry?.email) return googleEntry.email.trim().toLowerCase();

    const anyEntry = fbUser.providerData.find(
      (p) => typeof p?.email === 'string' && p.email.trim().length > 0
    );
    if (anyEntry?.email) return anyEntry.email.trim().toLowerCase();
  }

  return '';
}

export function extractFirebaseAuthError(err: unknown): { code: string; rawMessage: string } {
  if (!err || typeof err !== 'object') {
    return {
      code: 'auth/unknown-error',
      rawMessage: typeof err === 'string' && err.trim() ? err : 'Unexpected authentication error.',
    };
  }

  const record = err as { code?: unknown; message?: unknown };
  const rawMessage =
    typeof record.message === 'string' && record.message.trim().length > 0
      ? record.message.trim()
      : 'Unexpected Firebase authentication error.';

  let code =
    typeof record.code === 'string' && record.code.trim().length > 0 ? record.code.trim() : '';

  if (!code) {
    const embeddedCodeMatch = /\((auth\/[a-z0-9-]+)\)/i.exec(rawMessage);
    if (embeddedCodeMatch?.[1]) {
      code = embeddedCodeMatch[1];
    }
  }

  return {
    code: code || 'auth/unknown-error',
    rawMessage,
  };
}

export function formatFirebaseAuthError(
  err: unknown,
  context?: { hostname?: string; projectId?: string }
): FormattedFirebaseAuthError {
  const { code, rawMessage } = extractFirebaseAuthError(err);
  const host = context?.hostname?.trim();
  const projectId = context?.projectId?.trim();

  let hint: string | undefined;

  switch (code) {
    case 'auth/unauthorized-domain':
      hint = host
        ? `Current domain "${host}" is not listed under Firebase Console → Authentication → Settings → Authorized domains${
            projectId ? ` for project "${projectId}"` : ''
          }.`
        : 'Current domain is not listed under Firebase Console → Authentication → Settings → Authorized domains.';
      break;
    case 'auth/popup-blocked':
      hint = 'Your browser blocked the Google Sign-In popup window. Allow popups for this site and click again.';
      break;
    case 'auth/popup-closed-by-user':
      hint = 'Google Sign-In popup window was closed before authentication completed.';
      break;
    case 'auth/cancelled-popup-request':
      hint = 'Another sign-in popup request superseded this one. Please wait a moment and try again.';
      break;
    case 'auth/operation-not-allowed':
      hint = 'This sign-in provider is not enabled in Firebase Console → Authentication → Sign-in method.';
      break;
    case 'auth/network-request-failed':
      hint = 'Network request to Google/Firebase Auth failed. Check internet connection or content blockers.';
      break;
    case 'auth/account-exists-with-different-credential':
      hint = 'An account already exists with this email using a different sign-in provider.';
      break;
    case 'auth/internal-error':
      hint =
        'Firebase Auth encountered an internal/OAuth configuration error. Verify Authorized Domains and OAuth consent/client settings in Firebase Console.';
      break;
    default:
      break;
  }

  const displayText = hint ? `[${code}] ${rawMessage} — ${hint}` : `[${code}] ${rawMessage}`;

  return {
    code,
    rawMessage,
    hint,
    displayText,
  };
}
