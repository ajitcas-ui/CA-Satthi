import fs from 'node:fs';
import path from 'node:path';
import type { Request, Response } from 'express';
import {
  AUTHORIZED_OWNER_EMAIL,
  parseBearerToken,
  verifyOwnerFirebaseToken,
  verifyStudentFirebaseToken,
} from './ownerAuth';
import {
  resolveUploadInitialStatus,
  validatePdfBinaryBuffer,
} from '../utils/studyMaterials';

export const PDF_STORAGE_ROOT = path.resolve(process.cwd(), '.data', 'study_pdfs');

export interface FirestoreRestValue {
  stringValue?: string;
  booleanValue?: boolean;
  integerValue?: string;
  doubleValue?: number;
  timestampValue?: string;
  nullValue?: null;
}

export function decodeFirestoreFields(
  fields?: Record<string, FirestoreRestValue>
): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  if (!fields || typeof fields !== 'object') return out;
  for (const [key, val] of Object.entries(fields)) {
    if (!val || typeof val !== 'object') continue;
    if (typeof val.stringValue === 'string') out[key] = val.stringValue;
    else if (typeof val.booleanValue === 'boolean') out[key] = val.booleanValue;
    else if (typeof val.integerValue === 'string') out[key] = Number(val.integerValue);
    else if (typeof val.doubleValue === 'number') out[key] = val.doubleValue;
    else if (typeof val.timestampValue === 'string') out[key] = val.timestampValue;
    else if ('nullValue' in val) out[key] = null;
  }
  return out;
}

export function resolveSafeStoragePath(storageDir: string, storageFileName: string): string | null {
  const clean = path.basename(String(storageFileName || '').trim());
  if (!/^[a-zA-Z0-9_.\-]+\.pdf$/i.test(clean)) {
    return null;
  }
  const baseDir = path.resolve(storageDir);
  const fullPath = path.resolve(baseDir, clean);
  if (!fullPath.startsWith(`${baseDir}${path.sep}`)) {
    return null;
  }
  return fullPath;
}

export function isStudentMembershipActive(
  userData: Record<string, unknown> | null | undefined,
  nowMs = Date.now()
): boolean {
  if (!userData) return false;
  if (userData.isSuspended === true) return false;
  if (userData.role === 'admin') return true;

  const expStr = String(userData.subscriptionExpiresAt || userData.passExpiry || '');
  const expMs = expStr ? new Date(expStr).getTime() : NaN;
  const hasFutureExpiry = Number.isFinite(expMs) && expMs > nowMs;

  if (userData.hasPaidPass === true) {
    return Number.isFinite(expMs) ? hasFutureExpiry : true;
  }
  if (userData.membershipStatus === 'active') {
    return Number.isFinite(expMs) ? hasFutureExpiry : true;
  }
  return false;
}

export function canUserAccessPdfMaterial(params: {
  isOwner: boolean;
  uid: string;
  userData?: Record<string, unknown> | null;
  materialData?: Record<string, unknown> | null;
  nowMs?: number;
}): { ok: true } | { ok: false; status: number; error: string } {
  if (params.isOwner) {
    return { ok: true };
  }
  if (!params.userData) {
    return { ok: false, status: 403, error: 'Forbidden: Student profile verification failed.' };
  }
  if (params.userData.isSuspended === true) {
    return { ok: false, status: 403, error: 'Forbidden: Student account is currently suspended.' };
  }
  if (!params.materialData) {
    return { ok: false, status: 404, error: 'Study material document not found.' };
  }

  const matStatus = String(params.materialData.status || '');
  const matUploader = String(params.materialData.uploaderId || '');
  if (matStatus !== 'approved' && matUploader !== params.uid) {
    return { ok: false, status: 403, error: 'Forbidden: Material has not been approved yet.' };
  }

  // Uploaders can always inspect their own submissions; peers must hold active ₹5 membership
  if (matUploader !== params.uid && !isStudentMembershipActive(params.userData, params.nowMs)) {
    return {
      ok: false,
      status: 403,
      error: 'Active ₹5 CA Saathi membership is required to access or download PDF materials.',
    };
  }

  return { ok: true };
}

export async function fetchFirestoreDocWithBearer(params: {
  projectId: string;
  databaseId: string;
  docPath: string;
  bearerToken: string;
}): Promise<{ exists: true; data: Record<string, unknown> } | { exists: false; status: number }> {
  const cleanPath = params.docPath.replace(/^\/+/, '');
  const url = `https://firestore.googleapis.com/v1/projects/${encodeURIComponent(
    params.projectId
  )}/databases/${encodeURIComponent(params.databaseId)}/documents/${cleanPath}`;

  const resp = await fetch(url, {
    headers: {
      Authorization: `Bearer ${params.bearerToken}`,
    },
  });

  if (resp.status === 404) {
    return { exists: false, status: 404 };
  }
  if (!resp.ok) {
    return { exists: false, status: resp.status };
  }

  const json = (await resp.json()) as { fields?: Record<string, FirestoreRestValue> };
  return {
    exists: true,
    data: decodeFirestoreFields(json.fields),
  };
}

export function ensurePdfStorageDir(): void {
  fs.mkdirSync(PDF_STORAGE_ROOT, { recursive: true });
}

export function registerMaterialRoutes(
  app: import('express').Express,
  firebaseConfig: { projectId: string; firestoreDatabaseId: string }
): void {
  ensurePdfStorageDir();

  // Upload PDF (Authorized Owner OR Student with canUploadNotes === true in Firestore)
  app.post('/api/materials/upload', async (req: Request, res: Response) => {
    try {
      const token = parseBearerToken(req.headers.authorization);
      if (!token) {
        return res.status(401).json({ error: 'Authentication required: Missing Bearer token.' });
      }

      const ownerCheck = await verifyOwnerFirebaseToken(token, firebaseConfig.projectId);
      const isOwner = ownerCheck.ok;
      let sessionUid = ownerCheck.ok ? ownerCheck.session.uid : '';
      let sessionEmail = ownerCheck.ok ? ownerCheck.session.email : '';

      if (!isOwner) {
        const studentCheck = await verifyStudentFirebaseToken(token, firebaseConfig.projectId);
        if (!studentCheck.ok) {
          return res.status(studentCheck.status).json({ error: studentCheck.error });
        }
        sessionUid = studentCheck.session.uid;
        sessionEmail = studentCheck.session.email;

        if (sessionEmail === AUTHORIZED_OWNER_EMAIL && !studentCheck.session.emailVerified) {
          return res.status(403).json({ error: 'Owner email verification required.' });
        }

        const userDoc = await fetchFirestoreDocWithBearer({
          projectId: firebaseConfig.projectId,
          databaseId: firebaseConfig.firestoreDatabaseId,
          docPath: `users/${sessionUid}`,
          bearerToken: token,
        });

        if (!userDoc.exists) {
          return res.status(403).json({ error: 'Forbidden: Student profile not found.' });
        }
        if (userDoc.data.isSuspended === true) {
          return res.status(403).json({ error: 'Forbidden: Suspended accounts cannot upload notes.' });
        }
        if (userDoc.data.canUploadNotes !== true) {
          return res.status(403).json({
            error: 'Forbidden: Notes upload permission has not been granted to your account by Admin.',
          });
        }
      }

      const { fileName, fileBase64, mimeType = 'application/pdf' } = req.body || {};
      if (typeof fileBase64 !== 'string' || !fileBase64.trim()) {
        return res.status(400).json({ error: 'Missing PDF file payload.' });
      }

      const cleanBase64 = fileBase64.replace(/^data:application\/(pdf|x-pdf);base64,/i, '').trim();
      const buffer = Buffer.from(cleanBase64, 'base64');
      const binValidation = validatePdfBinaryBuffer(
        String(fileName || 'study_material.pdf'),
        String(mimeType || 'application/pdf'),
        buffer
      );

      if (!binValidation.ok) {
        return res.status(400).json({ error: binValidation.error });
      }

      const materialId = `mat_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
      const storageFileName = `${materialId}.pdf`;
      const targetPath = resolveSafeStoragePath(PDF_STORAGE_ROOT, storageFileName);
      if (!targetPath) {
        return res.status(500).json({ error: 'Failed to resolve safe storage path.' });
      }

      ensurePdfStorageDir();
      fs.writeFileSync(targetPath, buffer);

      const initialState = resolveUploadInitialStatus(isOwner);
      return res.json({
        ok: true,
        materialId,
        storageFileName,
        fileUrl: `/api/materials/${materialId}/pdf`,
        fileName: binValidation.cleanFileName,
        fileSizeBytes: buffer.byteLength,
        mimeType: 'application/pdf',
        forcedStatus: initialState.status,
        uploaderRole: initialState.uploaderRole,
        uploaderId: sessionUid,
        uploaderEmail: sessionEmail,
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'PDF upload failed.';
      return res.status(500).json({ error: msg });
    }
  });

  // Owner-only: Replace PDF binary on existing material
  app.post('/api/materials/:id/replace', async (req: Request, res: Response) => {
    try {
      const token = parseBearerToken(req.headers.authorization);
      if (!token) {
        return res.status(401).json({ error: 'Authentication required.' });
      }
      const ownerCheck = await verifyOwnerFirebaseToken(token, firebaseConfig.projectId);
      if (!ownerCheck.ok) {
        return res.status(ownerCheck.status).json({ error: ownerCheck.error });
      }

      const materialId = String(req.params.id || '').replace(/[^a-zA-Z0-9_\-]/g, '');
      if (!materialId) {
        return res.status(400).json({ error: 'Invalid material ID.' });
      }

      const { fileName, fileBase64, mimeType = 'application/pdf', oldStorageFileName } = req.body || {};
      if (typeof fileBase64 !== 'string' || !fileBase64.trim()) {
        return res.status(400).json({ error: 'Missing replacement PDF file payload.' });
      }

      const cleanBase64 = fileBase64.replace(/^data:application\/(pdf|x-pdf);base64,/i, '').trim();
      const buffer = Buffer.from(cleanBase64, 'base64');
      const binValidation = validatePdfBinaryBuffer(
        String(fileName || 'study_material.pdf'),
        String(mimeType || 'application/pdf'),
        buffer
      );
      if (!binValidation.ok) {
        return res.status(400).json({ error: binValidation.error });
      }

      const newStorageFileName = `${materialId}_v${Date.now()}.pdf`;
      const newPath = resolveSafeStoragePath(PDF_STORAGE_ROOT, newStorageFileName);
      if (!newPath) {
        return res.status(500).json({ error: 'Failed to resolve safe storage path.' });
      }

      ensurePdfStorageDir();
      fs.writeFileSync(newPath, buffer);

      if (typeof oldStorageFileName === 'string' && oldStorageFileName.trim()) {
        const oldPath = resolveSafeStoragePath(PDF_STORAGE_ROOT, oldStorageFileName);
        if (oldPath && oldPath !== newPath && fs.existsSync(oldPath)) {
          fs.unlinkSync(oldPath);
        }
      }

      return res.json({
        ok: true,
        materialId,
        storageFileName: newStorageFileName,
        fileUrl: `/api/materials/${materialId}/pdf`,
        fileName: binValidation.cleanFileName,
        fileSizeBytes: buffer.byteLength,
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to replace PDF.';
      return res.status(500).json({ error: msg });
    }
  });

  // Owner-only: Delete stored PDF file
  app.delete('/api/materials/:id/file', async (req: Request, res: Response) => {
    try {
      const token = parseBearerToken(req.headers.authorization);
      if (!token) {
        return res.status(401).json({ error: 'Authentication required.' });
      }
      const ownerCheck = await verifyOwnerFirebaseToken(token, firebaseConfig.projectId);
      if (!ownerCheck.ok) {
        return res.status(ownerCheck.status).json({ error: ownerCheck.error });
      }

      const storageFileName = String(req.query.storageFileName || `${req.params.id}.pdf`);
      const targetPath = resolveSafeStoragePath(PDF_STORAGE_ROOT, storageFileName);
      if (targetPath && fs.existsSync(targetPath)) {
        fs.unlinkSync(targetPath);
      }

      return res.json({ ok: true });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to delete PDF file.';
      return res.status(500).json({ error: msg });
    }
  });

  // Protected PDF stream / download (verifies Firebase Bearer token + paid access + approval state)
  app.get('/api/materials/:id/pdf', async (req: Request, res: Response) => {
    try {
      const token = parseBearerToken(req.headers.authorization);
      if (!token) {
        return res.status(401).json({ error: 'Authentication required to open PDF materials.' });
      }

      const ownerCheck = await verifyOwnerFirebaseToken(token, firebaseConfig.projectId);
      const isOwner = ownerCheck.ok;
      let uid = ownerCheck.ok ? ownerCheck.session.uid : '';

      if (!isOwner) {
        const studentCheck = await verifyStudentFirebaseToken(token, firebaseConfig.projectId);
        if (!studentCheck.ok) {
          return res.status(studentCheck.status).json({ error: studentCheck.error });
        }
        uid = studentCheck.session.uid;
      }

      const materialId = String(req.params.id || '').replace(/[^a-zA-Z0-9_\-]/g, '');
      if (!materialId) {
        return res.status(400).json({ error: 'Invalid material ID.' });
      }

      const matDoc = await fetchFirestoreDocWithBearer({
        projectId: firebaseConfig.projectId,
        databaseId: firebaseConfig.firestoreDatabaseId,
        docPath: `noteMaterials/${materialId}`,
        bearerToken: token,
      });

      let userData: Record<string, unknown> | null = null;
      if (!isOwner) {
        const userDoc = await fetchFirestoreDocWithBearer({
          projectId: firebaseConfig.projectId,
          databaseId: firebaseConfig.firestoreDatabaseId,
          docPath: `users/${uid}`,
          bearerToken: token,
        });
        userData = userDoc.exists ? userDoc.data : null;
      }

      const accessCheck = canUserAccessPdfMaterial({
        isOwner,
        uid,
        userData,
        materialData: matDoc.exists ? matDoc.data : null,
      });

      if (!accessCheck.ok) {
        return res.status(accessCheck.status).json({ error: accessCheck.error });
      }

      const storageFileName = matDoc.exists
        ? String(matDoc.data.storageFileName || `${materialId}.pdf`)
        : `${materialId}.pdf`;
      const downloadName = matDoc.exists
        ? String(matDoc.data.fileName || `${materialId}.pdf`).replace(/["\r\n]/g, '')
        : `${materialId}.pdf`;

      const filePath = resolveSafeStoragePath(PDF_STORAGE_ROOT, storageFileName);
      if (!filePath || !fs.existsSync(filePath)) {
        return res.status(404).json({ error: 'PDF file binary is not available on storage.' });
      }

      const disposition = req.query.download === '1' ? 'attachment' : 'inline';
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `${disposition}; filename="${downloadName}"`);
      res.setHeader('Cache-Control', 'private, no-store');
      res.setHeader('X-Content-Type-Options', 'nosniff');
      return res.sendFile(filePath);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unable to stream PDF file.';
      return res.status(500).json({ error: msg });
    }
  });
}
