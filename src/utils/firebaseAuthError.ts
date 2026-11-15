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

export interface FirebaseCodedError extends Error {
  code: string;
}

export function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  errorCode: string,
  message: string
): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => {
      const timeoutError = new Error(message) as FirebaseCodedError;
      timeoutError.code = errorCode;
      reject(timeoutError);
    }, timeoutMs);

    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (err) => {
        clearTimeout(timer);
        reject(err);
      }
    );
  });
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

function unwrapFirestoreErrorJson(message: string): {
  innerMessage: string;
  path?: string;
  operationType?: string;
} {
  const prefix = 'Firestore Error:';
  const trimmed = message.trim();
  const candidate = trimmed.startsWith(prefix) ? trimmed.slice(prefix.length).trim() : trimmed;
  if (!candidate.startsWith('{')) {
    return { innerMessage: message };
  }
  try {
    const parsed = JSON.parse(candidate) as {
      error?: unknown;
      path?: unknown;
      operationType?: unknown;
    };
    if (typeof parsed.error === 'string' && parsed.error.trim().length > 0) {
      return {
        innerMessage: parsed.error.trim(),
        path: typeof parsed.path === 'string' ? parsed.path : undefined,
        operationType: typeof parsed.operationType === 'string' ? parsed.operationType : undefined,
      };
    }
  } catch {
    // not JSON, fall back to raw message
  }
  return { innerMessage: message };
}

function inferFirestoreCodeFromMessage(rawCode: string, message: string): string | null {
  const normalizedCode = rawCode.trim().toLowerCase();
  const lowerMsg = message.toLowerCase();

  if (normalizedCode === 'firestore/timeout' || normalizedCode === 'deadline-exceeded') {
    return 'firestore/timeout';
  }
  if (
    normalizedCode === 'firestore/unavailable' ||
    normalizedCode === 'unavailable' ||
    normalizedCode === 'firestore/offline'
  ) {
    return 'firestore/unavailable';
  }
  if (normalizedCode === 'firestore/permission-denied' || normalizedCode === 'permission-denied') {
    return 'firestore/permission-denied';
  }
  if (normalizedCode === 'firestore/not-found' || normalizedCode === 'not-found') {
    return 'firestore/not-found';
  }
  if (normalizedCode.startsWith('firestore/')) {
    return normalizedCode;
  }

  if (
    lowerMsg.includes('client is offline') ||
    lowerMsg.includes('failed to get document because the client is offline') ||
    lowerMsg.includes('could not reach cloud firestore backend') ||
    lowerMsg.includes('service_disabled') ||
    lowerMsg.includes('firestore.googleapis.com')
  ) {
    return 'firestore/unavailable';
  }
  if (lowerMsg.includes('timed out')) {
    return 'firestore/timeout';
  }
  if (lowerMsg.includes('missing or insufficient permissions') || lowerMsg.includes('permission-denied')) {
    return 'firestore/permission-denied';
  }
  return null;
}

export function normalizeFirestoreError(err: unknown): FirebaseCodedError {
  const { code, rawMessage } = extractFirebaseAuthError(err);
  const normalized = new Error(rawMessage) as FirebaseCodedError;
  normalized.code = code;
  return normalized;
}

export function extractFirebaseAuthError(err: unknown): { code: string; rawMessage: string } {
  if (!err || typeof err !== 'object') {
    const raw = typeof err === 'string' && err.trim() ? err.trim() : 'Unexpected authentication error.';
    const unwrapped = unwrapFirestoreErrorJson(raw);
    const inferred = inferFirestoreCodeFromMessage('', unwrapped.innerMessage);
    return {
      code: inferred || 'auth/unknown-error',
      rawMessage: unwrapped.innerMessage,
    };
  }

  const record = err as { code?: unknown; message?: unknown };
  const initialMessage =
    typeof record.message === 'string' && record.message.trim().length > 0
      ? record.message.trim()
      : 'Unexpected Firebase authentication error.';

  const unwrapped = unwrapFirestoreErrorJson(initialMessage);
  const rawMessage = unwrapped.path
    ? `${unwrapped.innerMessage} (${unwrapped.operationType || 'op'}: ${unwrapped.path})`
    : unwrapped.innerMessage;

  let code =
    typeof record.code === 'string' && record.code.trim().length > 0 ? record.code.trim() : '';

  if (!code) {
    const embeddedCodeMatch = /\(((?:auth|firestore)\/[a-z0-9-]+)\)/i.exec(rawMessage);
    if (embeddedCodeMatch?.[1]) {
      code = embeddedCodeMatch[1];
    }
  }

  const firestoreCode = inferFirestoreCodeFromMessage(code, unwrapped.innerMessage);
  if (firestoreCode) {
    code = firestoreCode;
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
    case 'firestore/unavailable':
      hint = `Cloud Firestore database "(default)"${
        projectId ? ` in Firebase project "${projectId}"` : ''
      } is offline, disabled, or not yet created. Enable Cloud Firestore in Firebase Console → Build → Firestore Database and deploy firestore.rules.`;
      break;
    case 'firestore/timeout':
      hint = `Cloud Firestore verification timed out${
        projectId ? ` for project "${projectId}"` : ''
      }. Confirm Cloud Firestore database "(default)" is enabled in Firebase Console and reachable from your network.`;
      break;
    case 'firestore/permission-denied':
      hint = `Firestore security rules rejected this request${
        projectId ? ` on project "${projectId}"` : ''
      }. Deploy firestore.rules to "${projectId || 'ca-satthi'}" and verify owner email authorization.`;
      break;
    case 'firestore/not-found':
      hint = `The Firestore database or user document was not found${
        projectId ? ` in project "${projectId}"` : ''
      }.`;
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

