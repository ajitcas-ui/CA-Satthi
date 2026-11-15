import test from 'node:test';
import assert from 'node:assert/strict';
import {
  extractFirebaseAuthError,
  formatFirebaseAuthError,
  resolveGoogleUserEmail,
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
