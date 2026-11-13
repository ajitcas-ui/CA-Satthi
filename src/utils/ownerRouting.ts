export type OwnerRouteKind = 'owner-login' | 'owner-dashboard' | 'student';

export type ResolvedAppScreen = 'owner-login' | 'owner-dashboard' | 'student';

export interface OwnerRouteResolution {
  screen: ResolvedAppScreen;
  redirectPath: string | null;
}

export function normalizePathname(pathname: string): string {
  const trimmed = (pathname || '/').trim().replace(/\/+$/, '');
  return trimmed === '' ? '/' : trimmed.toLowerCase();
}

export function parseOwnerRoute(pathname: string, hash = '', search = ''): OwnerRouteKind {
  const cleanPath = normalizePathname(pathname);
  const cleanHash = (hash || '').trim().toLowerCase();
  const params = new URLSearchParams(search || '');

  if (cleanPath === '/owner-login' || cleanHash === '#owner-login') {
    return 'owner-login';
  }

  if (
    cleanPath === '/owner-dashboard' ||
    cleanHash === '#owner' ||
    cleanHash === '#owner-dashboard' ||
    params.get('owner') === '1'
  ) {
    return 'owner-dashboard';
  }

  return 'student';
}

export function resolveOwnerAuthRedirect(params: {
  routeKind: OwnerRouteKind;
  isSuperAdmin: boolean;
  ownerPreviewingStudent: boolean;
}): OwnerRouteResolution {
  const { routeKind, isSuperAdmin, ownerPreviewingStudent } = params;

  if (isSuperAdmin) {
    if (routeKind === 'owner-dashboard') {
      return { screen: 'owner-dashboard', redirectPath: null };
    }
    if (routeKind === 'owner-login' || !ownerPreviewingStudent) {
      return { screen: 'owner-dashboard', redirectPath: '/owner-dashboard' };
    }
    return { screen: 'student', redirectPath: null };
  }

  if (routeKind === 'owner-login') {
    return { screen: 'owner-login', redirectPath: null };
  }

  if (routeKind === 'owner-dashboard') {
    return { screen: 'owner-login', redirectPath: null };
  }

  return { screen: 'student', redirectPath: null };
}
