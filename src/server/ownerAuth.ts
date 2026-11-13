import crypto from 'node:crypto';
import type { Request, Response, NextFunction } from 'express';

export const AUTHORIZED_OWNER_EMAIL = 'ajitsinghca9@gmail.com';
const SECURE_TOKEN_CERTS_URL =
  'https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com';

export interface FirebaseJwtPayload {
  iss?: string;
  aud?: string;
  sub?: string;
  user_id?: string;
  email?: string;
  email_verified?: boolean;
  exp?: number;
  iat?: number;
  auth_time?: number;
}

export interface FirebaseJwtHeader {
  alg?: string;
  kid?: string;
  typ?: string;
}

export interface VerifiedOwnerSession {
  uid: string;
  email: string;
  emailVerified: boolean;
}

interface CertCacheEntry {
  certs: Record<string, string>;
  expiresAtMs: number;
}

let certCache: CertCacheEntry | null = null;

function decodeBase64Url(segment: string): Buffer {
  const padded = segment.replace(/-/g, '+').replace(/_/g, '/') + '='.repeat((4 - (segment.length % 4)) % 4);
  return Buffer.from(padded, 'base64');
}

export function parseBearerToken(authHeader?: string): string | null {
  if (!authHeader) return null;
  const match = /^Bearer\s+(.+)$/i.exec(authHeader.trim());
  return match ? match[1].trim() : null;
}

export function validateStudentTokenClaims(
  payload: FirebaseJwtPayload,
  projectId: string,
  nowSec = Math.floor(Date.now() / 1000)
): { ok: true; session: VerifiedOwnerSession } | { ok: false; status: number; error: string } {
  const expectedIssuer = `https://securetoken.google.com/${projectId}`;
  if (!payload || typeof payload !== 'object') {
    return { ok: false, status: 401, error: 'Malformed authentication token payload.' };
  }

  if (payload.aud !== projectId) {
    return { ok: false, status: 401, error: 'Token audience does not match Firebase project.' };
  }

  if (payload.iss !== expectedIssuer) {
    return { ok: false, status: 401, error: 'Invalid Firebase token issuer.' };
  }

  const uid = (payload.sub || payload.user_id || '').trim();
  if (!uid) {
    return { ok: false, status: 401, error: 'Token missing subject user identifier.' };
  }

  if (typeof payload.exp !== 'number' || payload.exp <= nowSec) {
    return { ok: false, status: 401, error: 'Authentication token has expired.' };
  }

  if (typeof payload.iat === 'number' && payload.iat > nowSec + 300) {
    return { ok: false, status: 401, error: 'Token issued-at timestamp is invalid.' };
  }

  return {
    ok: true,
    session: {
      uid,
      email: (payload.email || '').toLowerCase().trim(),
      emailVerified: payload.email_verified === true,
    },
  };
}

export function validateOwnerTokenClaims(
  payload: FirebaseJwtPayload,
  projectId: string,
  nowSec = Math.floor(Date.now() / 1000)
): { ok: true; session: VerifiedOwnerSession } | { ok: false; status: number; error: string } {
  const base = validateStudentTokenClaims(payload, projectId, nowSec);
  if (!base.ok) return base;

  if (base.session.email !== AUTHORIZED_OWNER_EMAIL) {
    return { ok: false, status: 403, error: 'Forbidden: Only the authorized owner account can access this resource.' };
  }

  if (!base.session.emailVerified) {
    return { ok: false, status: 403, error: 'Forbidden: Owner email verification is required.' };
  }

  return base;
}

async function fetchGoogleSecureTokenCerts(): Promise<Record<string, string>> {
  const now = Date.now();
  if (certCache && certCache.expiresAtMs > now) {
    return certCache.certs;
  }

  const resp = await fetch(SECURE_TOKEN_CERTS_URL);
  if (!resp.ok) {
    throw new Error(`Failed to fetch Firebase public keys (${resp.status})`);
  }

  const certs = (await resp.json()) as Record<string, string>;
  const cacheControl = resp.headers.get('cache-control') || '';
  const maxAgeMatch = /max-age=(\d+)/i.exec(cacheControl);
  const ttlMs = maxAgeMatch ? Math.max(60, Number(maxAgeMatch[1])) * 1000 : 3600_000;

  certCache = {
    certs,
    expiresAtMs: now + ttlMs,
  };
  return certs;
}

async function verifyFirebaseJwtSignature(
  idToken: string
): Promise<{ ok: true; payload: FirebaseJwtPayload } | { ok: false; status: number; error: string }> {
  const parts = idToken.split('.');
  if (parts.length !== 3) {
    return { ok: false, status: 401, error: 'Invalid Bearer JWT structure.' };
  }

  let header: FirebaseJwtHeader;
  let payload: FirebaseJwtPayload;
  try {
    header = JSON.parse(decodeBase64Url(parts[0]).toString('utf8')) as FirebaseJwtHeader;
    payload = JSON.parse(decodeBase64Url(parts[1]).toString('utf8')) as FirebaseJwtPayload;
  } catch {
    return { ok: false, status: 401, error: 'Failed to decode authentication token.' };
  }

  if (header.alg !== 'RS256' || !header.kid) {
    return { ok: false, status: 401, error: 'Unsupported token signature algorithm or missing key id.' };
  }

  const certs = await fetchGoogleSecureTokenCerts();
  const pem = certs[header.kid];
  if (!pem) {
    return { ok: false, status: 401, error: 'Unknown signing certificate for token.' };
  }

  const signedContent = `${parts[0]}.${parts[1]}`;
  const signature = decodeBase64Url(parts[2]);

  const verifier = crypto.createVerify('RSA-SHA256');
  verifier.update(signedContent);
  verifier.end();

  if (!verifier.verify(pem, signature)) {
    return { ok: false, status: 401, error: 'Invalid Firebase ID token signature.' };
  }

  return { ok: true, payload };
}

export async function verifyStudentFirebaseToken(
  idToken: string,
  projectId: string
): Promise<{ ok: true; session: VerifiedOwnerSession } | { ok: false; status: number; error: string }> {
  const verified = await verifyFirebaseJwtSignature(idToken);
  if (!verified.ok) return verified;
  return validateStudentTokenClaims(verified.payload, projectId);
}

export async function verifyOwnerFirebaseToken(
  idToken: string,
  projectId: string
): Promise<{ ok: true; session: VerifiedOwnerSession } | { ok: false; status: number; error: string }> {
  const verified = await verifyFirebaseJwtSignature(idToken);
  if (!verified.ok) return verified;
  return validateOwnerTokenClaims(verified.payload, projectId);
}

export function createRequireOwnerAuth(projectId: string) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const token = parseBearerToken(req.headers.authorization);
    if (!token) {
      return res.status(401).json({
        authorized: false,
        error: 'Authentication required: Missing Bearer Firebase ID token.',
      });
    }

    try {
      const result = await verifyOwnerFirebaseToken(token, projectId);
      if (!result.ok) {
        return res.status(result.status).json({
          authorized: false,
          error: result.error,
        });
      }

      (req as Request & { ownerSession?: VerifiedOwnerSession }).ownerSession = result.session;
      return next();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unable to verify authentication token.';
      return res.status(401).json({
        authorized: false,
        error: message,
      });
    }
  };
}
