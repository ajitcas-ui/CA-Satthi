import { MembershipStatus, PaymentRequest, UserProfile } from '../types';

export const ADMIN_OWNER_EMAIL = 'ajitsinghca9@gmail.com';
export const MEMBERSHIP_DURATION_DAYS = 30;
export const MONTHLY_MEMBERSHIP_FEE_INR = 5;

export interface ComputedMembershipState {
  status: MembershipStatus;
  canAccessPremium: boolean;
  isSuspended: boolean;
  expiresAt?: string;
  daysLeft: number;
  latestPayment?: PaymentRequest;
}

export function canUserAccessAdmin(
  user: Pick<UserProfile, 'email' | 'role'> | null | undefined,
  isEmailVerified = true
): boolean {
  if (!user || !isEmailVerified) return false;
  return user.email?.toLowerCase().trim() === ADMIN_OWNER_EMAIL && user.role === 'admin';
}

export function computeSubscriptionExpiry(approvedAtMs: number, durationDays = MEMBERSHIP_DURATION_DAYS): string {
  const safeDays = Number.isFinite(durationDays) && durationDays > 0 ? durationDays : MEMBERSHIP_DURATION_DAYS;
  return new Date(approvedAtMs + safeDays * 24 * 60 * 60 * 1000).toISOString();
}

export function computeMembershipState(
  user: UserProfile | null | undefined,
  payments: PaymentRequest[] = [],
  nowMs = Date.now()
): ComputedMembershipState {
  if (!user || user.id === 'guest') {
    return {
      status: 'unpaid',
      canAccessPremium: false,
      isSuspended: false,
      daysLeft: 0,
    };
  }

  if (user.isSuspended) {
    return {
      status: 'expired',
      canAccessPremium: false,
      isSuspended: true,
      daysLeft: 0,
    };
  }

  // Strictly owner email + admin role grants administrative full access
  if (user.email?.toLowerCase().trim() === ADMIN_OWNER_EMAIL && user.role === 'admin') {
    return {
      status: 'active',
      canAccessPremium: true,
      isSuspended: false,
      daysLeft: 365,
    };
  }

  const userPayments = payments
    .filter(p => p.studentId === user.id || (!!user.email && p.studentEmail?.toLowerCase() === user.email.toLowerCase()))
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const latestPayment = userPayments[0];
  const latestApproved = userPayments.find(p => p.status === 'approved');
  const latestPending = userPayments.find(p => p.status === 'pending');

  // Check explicit server/admin expiry timestamp or approved payment unlockedUntil
  const expiryCandidates = [
    user.subscriptionExpiresAt,
    user.passExpiry,
    latestApproved?.unlockedUntil,
  ].filter((v): v is string => Boolean(v));

  let activeExpiryMs = 0;
  let activeExpiryIso: string | undefined;

  for (const iso of expiryCandidates) {
    const parsed = new Date(iso).getTime();
    if (Number.isFinite(parsed) && parsed > activeExpiryMs) {
      activeExpiryMs = parsed;
      activeExpiryIso = new Date(parsed).toISOString();
    }
  }

  if (activeExpiryMs > nowMs) {
    const daysLeft = Math.max(1, Math.ceil((activeExpiryMs - nowMs) / (1000 * 60 * 60 * 24)));
    return {
      status: 'active',
      canAccessPremium: true,
      isSuspended: false,
      expiresAt: activeExpiryIso,
      daysLeft,
      latestPayment,
    };
  }

  // Pending claim must NEVER unlock paid access before Admin Approval
  if (latestPending || user.membershipStatus === 'pending') {
    return {
      status: 'pending',
      canAccessPremium: false,
      isSuspended: false,
      daysLeft: 0,
      latestPayment: latestPending || latestPayment,
    };
  }

  // Previously expired subscription or expired approved payment
  if (activeExpiryMs > 0 || user.membershipStatus === 'expired') {
    return {
      status: 'expired',
      canAccessPremium: false,
      isSuspended: false,
      expiresAt: activeExpiryIso,
      daysLeft: 0,
      latestPayment,
    };
  }

  return {
    status: 'unpaid',
    canAccessPremium: false,
    isSuspended: false,
    daysLeft: 0,
    latestPayment,
  };
}
