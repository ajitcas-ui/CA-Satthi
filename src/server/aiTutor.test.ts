import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  GEMINI_AI_MODEL,
  buildCASaathiSystemInstruction,
  evaluateServerMembershipAccess,
  mapGeminiErrorToHttp,
  sanitizeChatHistory,
} from './aiTutor';
import { AUTHORIZED_OWNER_EMAIL } from './ownerAuth';

describe('CA Saathi AI server helpers', () => {
  it('uses gemini-4-hydrogen as the configured model', () => {
    assert.equal(GEMINI_AI_MODEL, 'gemini-4-hydrogen');
  });

  it('builds bilingual, step-by-step, anti-hallucination system instruction', () => {
    const hiInstruction = buildCASaathiSystemInstruction('paper1', 'hi');
    assert.match(hiInstruction, /CA Saathi AI/);
    assert.match(hiInstruction, /Paper 1: Accounting/);
    assert.match(hiInstruction, /Hindi \(Devanagari script\)/);
    assert.match(hiInstruction, /NEVER invent, guess, or fabricate ICAI/i);
    assert.match(hiInstruction, /not 100% certain/i);

    const lawInstruction = buildCASaathiSystemInstruction('paper2', 'en');
    assert.match(lawInstruction, /Paper 2: Business Laws/);
    assert.match(lawInstruction, /Indian Contract Act 1872/);
  });

  it('sanitizes multi-turn chat history into strict alternating user->model pairs ending on model', () => {
    const raw = [
      { role: 'model', content: 'Leading model greeting should be stripped' },
      { role: 'user', content: 'What is BRS?' },
      { role: 'user', content: 'Actually explain BRS with example' },
      { role: 'model', content: 'BRS reconciles Cash Book and Pass Book...' },
      { role: 'user', content: '   ' },
      { role: 'user', content: 'Pending latest question that should be popped' },
    ];

    const sanitized = sanitizeChatHistory(raw);
    assert.equal(sanitized.length, 2);
    assert.equal(sanitized[0].role, 'user');
    assert.equal(sanitized[0].parts[0].text, 'Actually explain BRS with example');
    assert.equal(sanitized[1].role, 'model');
    assert.equal(sanitized[1].parts[0].text, 'BRS reconciles Cash Book and Pass Book...');
  });

  it('enforces active ₹5 membership while allowing verified owner free access', () => {
    const now = Date.UTC(2026, 10, 15);
    const futureIso = new Date(now + 10 * 24 * 60 * 60 * 1000).toISOString();
    const pastIso = new Date(now - 2 * 24 * 60 * 60 * 1000).toISOString();

    assert.deepEqual(
      evaluateServerMembershipAccess({ email: AUTHORIZED_OWNER_EMAIL, emailVerified: true }, now),
      { allowed: true, reason: 'owner' }
    );

    assert.equal(
      evaluateServerMembershipAccess(
        {
          email: 'student@example.com',
          emailVerified: true,
          membershipStatus: 'active',
          hasPaidPass: true,
          subscriptionExpiresAt: futureIso,
        },
        now
      ).allowed,
      true
    );

    assert.equal(
      evaluateServerMembershipAccess(
        {
          email: 'student@example.com',
          emailVerified: true,
          membershipStatus: 'pending',
        },
        now
      ).allowed,
      false
    );

    assert.equal(
      evaluateServerMembershipAccess(
        {
          email: 'student@example.com',
          emailVerified: true,
          membershipStatus: 'active',
          hasPaidPass: true,
          subscriptionExpiresAt: futureIso,
          isSuspended: true,
        },
        now
      ).allowed,
      false
    );

    assert.equal(
      evaluateServerMembershipAccess(
        {
          email: 'student@example.com',
          emailVerified: true,
          membershipStatus: 'expired',
          subscriptionExpiresAt: pastIso,
        },
        now
      ).allowed,
      false
    );
  });

  it('maps Gemini API errors accurately without leaking secrets', () => {
    assert.equal(mapGeminiErrorToHttp(new Error('PERMISSION_DENIED: invalid')).status, 403);
    assert.equal(mapGeminiErrorToHttp(new Error('RESOURCE_EXHAUSTED 429')).status, 429);
    assert.equal(mapGeminiErrorToHttp(new Error('API_KEY_INVALID')).status, 400);
    assert.equal(mapGeminiErrorToHttp(new Error('Request timed out')).status, 504);
  });
});
