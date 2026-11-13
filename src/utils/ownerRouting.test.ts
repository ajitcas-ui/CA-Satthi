import test from 'node:test';
import assert from 'node:assert/strict';
import { parseOwnerRoute, resolveOwnerAuthRedirect } from './ownerRouting';

test('parseOwnerRoute detects /owner-login, /owner-dashboard, and legacy #owner routes', () => {
  assert.equal(parseOwnerRoute('/owner-login'), 'owner-login');
  assert.equal(parseOwnerRoute('/owner-login/'), 'owner-login');
  assert.equal(parseOwnerRoute('/owner-dashboard'), 'owner-dashboard');
  assert.equal(parseOwnerRoute('/owner-dashboard/'), 'owner-dashboard');
  assert.equal(parseOwnerRoute('/', '#owner', ''), 'owner-dashboard');
  assert.equal(parseOwnerRoute('/', '', '?owner=1'), 'owner-dashboard');
  assert.equal(parseOwnerRoute('/'), 'student');
});

test('resolveOwnerAuthRedirect automatically redirects authorized owner to /owner-dashboard', () => {
  const fromLogin = resolveOwnerAuthRedirect({
    routeKind: 'owner-login',
    isSuperAdmin: true,
    ownerPreviewingStudent: false,
  });
  assert.deepEqual(fromLogin, { screen: 'owner-dashboard', redirectPath: '/owner-dashboard' });

  const fromRoot = resolveOwnerAuthRedirect({
    routeKind: 'student',
    isSuperAdmin: true,
    ownerPreviewingStudent: false,
  });
  assert.deepEqual(fromRoot, { screen: 'owner-dashboard', redirectPath: '/owner-dashboard' });

  const whilePreviewingStudent = resolveOwnerAuthRedirect({
    routeKind: 'student',
    isSuperAdmin: true,
    ownerPreviewingStudent: true,
  });
  assert.deepEqual(whilePreviewingStudent, { screen: 'student', redirectPath: null });
});

test('resolveOwnerAuthRedirect protects /owner-dashboard from guests and regular students', () => {
  const unauthedDashboard = resolveOwnerAuthRedirect({
    routeKind: 'owner-dashboard',
    isSuperAdmin: false,
    ownerPreviewingStudent: false,
  });
  assert.deepEqual(unauthedDashboard, { screen: 'owner-login', redirectPath: null });

  const studentHome = resolveOwnerAuthRedirect({
    routeKind: 'student',
    isSuperAdmin: false,
    ownerPreviewingStudent: false,
  });
  assert.deepEqual(studentHome, { screen: 'student', redirectPath: null });
});
