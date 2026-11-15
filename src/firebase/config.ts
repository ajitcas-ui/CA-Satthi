import { initializeApp, getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import {
  getFirestore,
  initializeFirestore,
  doc,
  getDocFromServer,
  Firestore,
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import {
  FirebaseCodedError,
  normalizeFirestoreError,
  withTimeout,
} from '../utils/firebaseAuthError';

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

const databaseId =
  (firebaseConfig as { firestoreDatabaseId?: string }).firestoreDatabaseId?.trim() || '(default)';

function createFirestoreInstance(): Firestore {
  const targetDbId = databaseId === '(default)' ? undefined : databaseId;
  try {
    return initializeFirestore(
      app,
      { experimentalAutoDetectLongPolling: true },
      targetDbId
    );
  } catch {
    return targetDbId ? getFirestore(app, targetDbId) : getFirestore(app);
  }
}

export const db = createFirestoreInstance();
export const auth = getAuth(app);

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
): never {
  const normalized = normalizeFirestoreError(error);
  const errInfo: FirestoreErrorInfo = {
    error: normalized.message,
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo:
        auth.currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  };

  if (normalized.code === 'firestore/unavailable' || normalized.code === 'firestore/timeout') {
    console.warn('Firestore Connection Warning: ', JSON.stringify(errInfo));
  } else {
    console.error('Firestore Error: ', JSON.stringify(errInfo));
  }

  const thrown = new Error(`Firestore Error: ${JSON.stringify(errInfo)}`) as FirebaseCodedError;
  thrown.code = normalized.code;
  throw thrown;
}

// Non-blocking boot connectivity check
export async function testConnection(): Promise<{ ok: boolean; code?: string; message?: string }> {
  try {
    await withTimeout(
      getDocFromServer(doc(db, 'test', 'connection')),
      6000,
      'firestore/timeout',
      'Timed out connecting to Cloud Firestore.'
    );
    return { ok: true };
  } catch (error) {
    const normalized = normalizeFirestoreError(error);
    if (
      normalized.code === 'firestore/unavailable' ||
      normalized.code === 'firestore/timeout'
    ) {
      console.warn(
        `Cloud Firestore (${firebaseConfig.projectId} / ${databaseId}) is unreachable or not enabled yet: ${normalized.message}`
      );
    }
    return { ok: false, code: normalized.code, message: normalized.message };
  }
}

testConnection();

