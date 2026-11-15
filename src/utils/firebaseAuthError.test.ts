import test from 'node:test';
import assert from 'node:assert/strict';
import {
  extractFirebaseAuthError,
  formatFirebaseAuthError,
  normalizeFirestoreError,
  resolveGoogleUserEmail,
  withTimeout,
} from './firebaseAuthError';

test('formatFirebaseAuthError surfaces exact auth/unauthorized-domain code and domain hint', () => {
  const err = Object.assign(new Error('Firebase: Error (auth/unauthorized-domain).'), {
    code: 'auth/unauthorized-domain',
  });

  const formatted = formatFirebaseAuthError(err, {
    hostname: 'ca-satthi.ajitcas.workers.dev',
    projectId: 'ca-satthi',
  });

  assert.equal(formatted.code, 'auth/unauthorized-domain');
  assert.match(formatted.displayText, /auth\/unauthorized-domain/);
  assert.match(formatted.displayText, /ca-satthi\.ajitcas\.workers\.dev/);
  assert.match(formatted.displayText, /ca-satthi/);
});

test('formatFirebaseAuthError extracts embedded code when err.code is missing and never uses generic message', () => {
  const err = new Error('Firebase: Error (auth/popup-blocked).');
  const formatted = formatFirebaseAuthError(err);

  assert.equal(formatted.code, 'auth/popup-blocked');
  assert.match(formatted.displayText, /\[auth\/popup-blocked\]/);
  assert.doesNotMatch(formatted.displayText, /Sign in failed\. Please try again\./i);
});

test('extractFirebaseAuthError handles unknown errors cleanly while preserving message', () => {
  const formatted = formatFirebaseAuthError(new Error('Custom OAuth failure from browser'));
  assert.equal(formatted.code, 'auth/unknown-error');
  assert.equal(formatted.rawMessage, 'Custom OAuth failure from browser');
  assert.match(formatted.displayText, /Custom OAuth failure from browser/);
});

test('resolveGoogleUserEmail reads direct email or falls back to google.com providerData', () => {
  assert.equal(
    resolveGoogleUserEmail({ email: ' AJITSINGHCA9@gmail.com ', providerData: [] }),
    'ajitsinghca9@gmail.com'
  );

  assert.equal(
    resolveGoogleUserEmail({
      email: null,
      providerData: [{ providerId: 'google.com', email: 'AjitSinghCA9@gmail.com' }],
    }),
    'ajitsinghca9@gmail.com'
  );

  assert.equal(resolveGoogleUserEmail(null), '');
});

test('withTimeout resolves fast promises and rejects stalled promises with structured code', async () => {
  const fastResult = await withTimeout(
    Promise.resolve('ok'),
    500,
    'firestore/timeout',
    'Should not time out'
  );
  assert.equal(fastResult, 'ok');

  const neverSettling = new Promise<string>(() => {});
  await assert.rejects(
    () =>
      withTimeout(
        neverSettling,
        25,
        'firestore/timeout',
        'Timed out while verifying Cloud Firestore.'
      ),
    (err: unknown) => {
      assert.equal((err as { code?: string }).code, 'firestore/timeout');
      assert.match((err as Error).message, /Timed out/);
      return true;
    }
  );
});

test('formatFirebaseAuthError decodes JSON Firestore offline errors into firestore/unavailable with actionable hint', () => {
  const jsonErr = new Error(
    JSON.stringify({
      error: 'Failed to get document because the client is offline.',
      operationType: 'get',
      path: 'users/vAarf5lPSJPMneAhyrHozNzbfPs2',
    })
  );

  const formatted = formatFirebaseAuthError(jsonErr, { projectId: 'ca-satthi' });
  assert.equal(formatted.code, 'firestore/unavailable');
  assert.match(formatted.rawMessage, /client is offline/);
  assert.match(formatted.rawMessage, /users\/vAarf5lPSJPMneAhyrHozNzbfPs2/);
  assert.match(formatted.hint || '', /Cloud Firestore database "\(default\)"/);
  assert.match(formatted.hint || '', /ca-satthi/);
});

test('normalizeFirestoreError preserves firestore/permission-denied and firestore/timeout codes', () => {
  const perm = normalizeFirestoreError(
    Object.assign(new Error('Missing or insufficient permissions.'), { code: 'permission-denied' })
  );
  assert.equal(perm.code, 'firestore/permission-denied');

  const formattedPerm = formatFirebaseAuthError(perm, { projectId: 'ca-satthi' });
  assert.match(formattedPerm.hint || '', /firestore\.rules/);

  const timedOut = normalizeFirestoreError(
    Object.assign(new Error('Timed out while reading profile.'), { code: 'firestore/timeout' })
  );
  assert.equal(timedOut.code, 'firestore/timeout');
});

