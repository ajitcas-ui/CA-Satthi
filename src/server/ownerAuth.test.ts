import test from 'node:test';
import assert from 'node:assert/strict';
import {
  AUTHORIZED_OWNER_EMAIL,
  parseBearerToken,
  validateOwnerTokenClaims,
} from './ownerAuth';

const TEST_PROJECT = 'gen-lang-client-0883887437';
const NOW = 1_800_000_000;

test('parseBearerToken extracts Bearer JWT safely', () => {
  assert.equal(parseBearerToken('Bearer abc.def.ghi'), 'abc.def.ghi');
  assert.equal(parseBearerToken('bearer token123'), 'token123');
  assert.equal(parseBearerToken('Basic foo'), null);
  assert.equal(parseBearerToken(undefined), null);
});

test('validateOwnerTokenClaims authorizes verified owner email with valid project claims', () => {
  const res = validateOwnerTokenClaims(
    {
      aud: TEST_PROJECT,
      iss: `https://securetoken.google.com/${TEST_PROJECT}`,
      sub: 'owner_uid_1',
      email: AUTHORIZED_OWNER_EMAIL,
      email_verified: true,
      iat: NOW - 60,
      exp: NOW + 3600,
    },
    TEST_PROJECT,
    NOW
  );
  assert.equal(res.ok, true);
  if (res.ok) {
    assert.equal(res.session.email, AUTHORIZED_OWNER_EMAIL);
    assert.equal(res.session.uid, 'owner_uid_1');
  }
});

test('validateOwnerTokenClaims rejects non-owner student accounts with 403 Forbidden', () => {
  const res = validateOwnerTokenClaims(
    {
      aud: TEST_PROJECT,
      iss: `https://securetoken.google.com/${TEST_PROJECT}`,
      sub: 'student_uid_2',
      email: 'student@example.com',
      email_verified: true,
      iat: NOW - 60,
      exp: NOW + 3600,
    },
    TEST_PROJECT,
    NOW
  );
  assert.equal(res.ok, false);
  if (!res.ok) {
    assert.equal(res.status, 403);
  }
});

test('validateOwnerTokenClaims rejects unverified owner email and expired tokens', () => {
  const unverified = validateOwnerTokenClaims(
    {
      aud: TEST_PROJECT,
      iss: `https://securetoken.google.com/${TEST_PROJECT}`,
      sub: 'owner_uid_1',
      email: AUTHORIZED_OWNER_EMAIL,
      email_verified: false,
      iat: NOW - 60,
      exp: NOW + 3600,
    },
    TEST_PROJECT,
    NOW
  );
  assert.equal(unverified.ok, false);
  if (!unverified.ok) {
    assert.equal(unverified.status, 403);
  }

  const expired = validateOwnerTokenClaims(
    {
      aud: TEST_PROJECT,
      iss: `https://securetoken.google.com/${TEST_PROJECT}`,
      sub: 'owner_uid_1',
      email: AUTHORIZED_OWNER_EMAIL,
      email_verified: true,
      iat: NOW - 7200,
      exp: NOW - 10,
    },
    TEST_PROJECT,
    NOW
  );
  assert.equal(expired.ok, false);
  if (!expired.ok) {
    assert.equal(expired.status, 401);
  }
});
