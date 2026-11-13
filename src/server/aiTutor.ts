import { AUTHORIZED_OWNER_EMAIL } from './ownerAuth';

export const GEMINI_AI_MODEL = 'gemini-4-hydrogen';

export type AITutorPaperId = 'all' | 'paper1' | 'paper2' | 'paper3' | 'paper4';
export type AITutorLanguage = 'en' | 'hi' | 'hinglish';

export const SUBJECT_LABELS: Record<AITutorPaperId, string> = {
  all: 'All CA Foundation Papers (ICAI New Scheme – January 2027)',
  paper1: 'Paper 1: Accounting (लेखांकन)',
  paper2: 'Paper 2: Business Laws (व्यावसायिक विधि)',
  paper3: 'Paper 3: Quantitative Aptitude – Business Maths, Logical Reasoning & Statistics',
  paper4: 'Paper 4: Business Economics (व्यावसायिक अर्थशास्त्र)',
};

export interface ServerUserAccessFields {
  email: string;
  emailVerified: boolean;
  isSuspended?: boolean;
  membershipStatus?: string;
  hasPaidPass?: boolean;
  subscriptionExpiresAt?: string;
  passExpiry?: string;
}

export function evaluateServerMembershipAccess(
  user: ServerUserAccessFields,
  nowMs = Date.now()
): { allowed: boolean; reason: string } {
  const cleanEmail = (user.email || '').toLowerCase().trim();
  if (cleanEmail === AUTHORIZED_OWNER_EMAIL && user.emailVerified) {
    return { allowed: true, reason: 'owner' };
  }

  if (user.isSuspended) {
    return {
      allowed: false,
      reason: 'Your account is currently suspended. Please contact CA Saathi support.',
    };
  }

  const candidates = [user.subscriptionExpiresAt, user.passExpiry].filter(
    (v): v is string => typeof v === 'string' && v.trim().length > 0
  );

  let latestExpiryMs = 0;
  for (const iso of candidates) {
    const parsed = new Date(iso).getTime();
    if (Number.isFinite(parsed) && parsed > latestExpiryMs) {
      latestExpiryMs = parsed;
    }
  }

  if (latestExpiryMs > nowMs && (user.membershipStatus === 'active' || user.hasPaidPass === true)) {
    return { allowed: true, reason: 'active_membership' };
  }

  if (user.membershipStatus === 'pending') {
    return {
      allowed: false,
      reason: 'Your ₹5 payment verification is pending Admin approval. CA Saathi AI unlocks after approval.',
    };
  }

  if (latestExpiryMs > 0 || user.membershipStatus === 'expired') {
    return {
      allowed: false,
      reason: 'Your ₹5 monthly CA Saathi membership has expired. Renew your membership to continue using CA Saathi AI.',
    };
  }

  return {
    allowed: false,
    reason: 'Active ₹5/month CA Saathi membership is required to use CA Saathi AI.',
  };
}

interface FirestoreFieldValue {
  stringValue?: string;
  booleanValue?: boolean;
  integerValue?: string;
  doubleValue?: number;
}

export async function checkStudentMembershipViaFirestore(params: {
  uid: string;
  email: string;
  emailVerified: boolean;
  idToken: string;
  projectId: string;
  firestoreDatabaseId: string;
}): Promise<{ allowed: boolean; statusCode: number; reason: string }> {
  const cleanEmail = (params.email || '').toLowerCase().trim();
  if (cleanEmail === AUTHORIZED_OWNER_EMAIL && params.emailVerified) {
    return { allowed: true, statusCode: 200, reason: 'owner' };
  }

  const url = `https://firestore.googleapis.com/v1/projects/${encodeURIComponent(
    params.projectId
  )}/databases/${encodeURIComponent(params.firestoreDatabaseId)}/documents/users/${encodeURIComponent(params.uid)}`;

  const resp = await fetch(url, {
    headers: {
      Authorization: `Bearer ${params.idToken}`,
    },
  });

  if (resp.status === 404) {
    return {
      allowed: false,
      statusCode: 403,
      reason: 'Student profile not found. Please complete registration and activate your ₹5/month membership.',
    };
  }

  if (!resp.ok) {
    return {
      allowed: false,
      statusCode: 403,
      reason: 'Unable to verify active membership status. Please try signing in again.',
    };
  }

  const docJson = (await resp.json()) as { fields?: Record<string, FirestoreFieldValue> };
  const fields = docJson.fields || {};

  const access = evaluateServerMembershipAccess({
    email: cleanEmail,
    emailVerified: params.emailVerified,
    isSuspended: fields.isSuspended?.booleanValue === true,
    membershipStatus: fields.membershipStatus?.stringValue,
    hasPaidPass: fields.hasPaidPass?.booleanValue === true,
    subscriptionExpiresAt: fields.subscriptionExpiresAt?.stringValue,
    passExpiry: fields.passExpiry?.stringValue,
  });

  return {
    allowed: access.allowed,
    statusCode: access.allowed ? 200 : 403,
    reason: access.reason,
  };
}

export function buildCASaathiSystemInstruction(
  paperId: string = 'all',
  language: string = 'en'
): string {
  const safePaper: AITutorPaperId =
    paperId === 'paper1' || paperId === 'paper2' || paperId === 'paper3' || paperId === 'paper4'
      ? paperId
      : 'all';
  const subjectName = SUBJECT_LABELS[safePaper];

  const languageDirective =
    language === 'hi'
      ? 'Respond in simple, clear, everyday Hindi (Devanagari script) while keeping standard ICAI accounting, legal, mathematical, and economic terms in English inside brackets (for example: मूल्यह्रास (Depreciation), प्रतिफल (Consideration), मांग की लोच (Elasticity of Demand)). Include relatable Indian examples.'
      : language === 'hinglish'
        ? 'Respond in clear, friendly Hinglish (natural conversational Hindi in Roman script mixed with accurate ICAI English technical terms) with simple relatable examples.'
        : 'Respond in clear, student-friendly English suitable for Indian CA Foundation beginners, with relatable everyday examples.';

  return `You are "CA Saathi AI", an empathetic, crystal-clear CA Foundation academic mentor exclusively designed for students preparing for the ICAI CA Foundation New Scheme (January 2027 Examination).

Active Subject Focus: ${subjectName}
Language Requirement: ${languageDirective}

CORE CAPABILITIES & SYLLABUS SCOPE (ICAI CA FOUNDATION NEW SCHEME):
1. Paper 1 – Accounting:
   - Solve accounting numericals strictly step-by-step: (a) Given Information, (b) Working Notes & calculations, (c) Formatted Journal Entries (Debit / Credit with Narration) or Ledger / Trial Balance / BRS / Depreciation / Partnership / Share Capital tables, and (d) Final Verified Answer.
   - Reference applicable ICAI principles cleanly (e.g., Accrual, Matching, Conservatism, AS-2 Inventories, AS-10 Property, Plant & Equipment).
2. Paper 2 – Business Laws:
   - Structure answers in ICAI exam format: Relevant Statutory Provision -> Analysis of Facts -> Clear Conclusion.
   - Cover Indian Contract Act 1872, Sale of Goods Act 1930, Indian Partnership Act 1932, Limited Liability Partnership Act 2008, Companies Act 2013, and Negotiable Instruments Act 1881.
3. Paper 3 – Quantitative Aptitude (Business Mathematics, Logical Reasoning & Statistics):
   - Show step-by-step formula derivation, clear intermediate arithmetic, and logical reasoning elimination.
   - For TVM / Ratio / Stats calculations, give exact calculator steps only when mathematically verified.
4. Paper 4 – Business Economics:
   - Explain concepts intuitively with simple Indian business examples, demand/supply & cost curves logic, elasticity signs, market structures, national income, public finance, money market, and international trade.

MCQ DOUBT RESOLUTION:
- When a student pastes an MCQ with options: clearly identify the correct option, explain step-by-step WHY it is right, briefly explain WHY the remaining options are incorrect, and highlight any negative marking (-0.25) trap to avoid.

STRICT ACCURACY & ANTI-HALLUCINATION RULES (MANDATORY):
1. NEVER invent, guess, or fabricate ICAI study material module numbers, page numbers, exam dates, statutory section numbers, case law names, or numeric data.
2. If you are NOT 100% certain about an exact section number, case citation, amendment date, or missing value in a student's question:
   - Explicitly say you are uncertain about that specific detail (e.g., "I am not 100% certain about the exact section number / missing figure..." or in Hindi "मैं इस सटीक धारा संख्या / अधूरे डेटा के बारे में पूरी तरह निश्चित नहीं हूँ...") and explain the verified underlying concept instead.
   - Ask the student to confirm any missing figures or blurry image text before finalizing a numerical computation.
3. Stay strictly focused on CA Foundation academic concepts and exam preparation. Keep explanations structured, concise, well-formatted with clear headings and bullet points, and easy to read on mobile screens.`;
}

export interface RawChatHistoryItem {
  role?: string;
  content?: string;
}

export interface GeminiContentHistoryItem {
  role: 'user' | 'model';
  parts: Array<{ text: string }>;
}

/**
 * Normalizes conversation history for @google/genai `ai.chats.create({ history })`:
 * - Keeps only non-empty text turns with role 'user' or 'model'
 * - Must start with a 'user' turn and end with a 'model' turn (so the next `chat.sendMessage` is a 'user' turn)
 * - Strictly alternates 'user' and 'model' roles
 * - Caps at maxTurns most recent messages
 */
export function sanitizeChatHistory(
  rawHistory: unknown,
  maxTurns = 16
): GeminiContentHistoryItem[] {
  if (!Array.isArray(rawHistory) || rawHistory.length === 0) return [];

  const cleaned: Array<{ role: 'user' | 'model'; text: string }> = [];
  for (const item of rawHistory) {
    if (!item || typeof item !== 'object') continue;
    const role = (item as RawChatHistoryItem).role;
    const content = (item as RawChatHistoryItem).content;
    if ((role === 'user' || role === 'model') && typeof content === 'string') {
      const trimmed = content.trim();
      if (trimmed.length > 0) {
        cleaned.push({ role, text: trimmed.slice(0, 8000) });
      }
    }
  }

  // Slice recent items before strict pairing
  const recent = cleaned.slice(-Math.max(2, maxTurns));

  // Build strictly alternating list starting with 'user'
  const alternating: GeminiContentHistoryItem[] = [];
  for (const turn of recent) {
    if (alternating.length === 0) {
      if (turn.role !== 'user') continue;
      alternating.push({ role: 'user', parts: [{ text: turn.text }] });
    } else {
      const prevRole = alternating[alternating.length - 1].role;
      if (turn.role === prevRole) {
        // Replace with newer turn of same role so sequence remains valid alternating pairs
        alternating[alternating.length - 1] = {
          role: turn.role,
          parts: [{ text: turn.text }],
        };
      } else {
        alternating.push({ role: turn.role, parts: [{ text: turn.text }] });
      }
    }
  }

  // Must end on 'model' so the upcoming `chat.sendMessage` ('user') pairs cleanly
  if (alternating.length > 0 && alternating[alternating.length - 1].role === 'user') {
    alternating.pop();
  }

  return alternating;
}

export function mapGeminiErrorToHttp(err: unknown): { status: number; message: string } {
  const raw = err instanceof Error ? err.message : String(err || 'Unknown Gemini API error');
  const upper = raw.toUpperCase();

  if (upper.includes('API_KEY_INVALID') || upper.includes('API KEY NOT VALID')) {
    return {
      status: 400,
      message: 'CA Saathi AI could not connect because the Gemini API key is invalid. Please check Settings > Secrets.',
    };
  }

  if (upper.includes('PERMISSION_DENIED') || upper.includes('403')) {
    return {
      status: 403,
      message: 'CA Saathi AI access was denied by Gemini API. Please verify the API key in Settings > Secrets.',
    };
  }

  if (upper.includes('RESOURCE_EXHAUSTED') || upper.includes('429') || upper.includes('QUOTA')) {
    return {
      status: 429,
      message: 'CA Saathi AI is experiencing high demand right now (rate limit reached). Please wait a moment and try again.',
    };
  }

  if (upper.includes('NOT_FOUND') || upper.includes('404')) {
    return {
      status: 502,
      message: 'Configured Gemini model is currently unavailable. Please contact support.',
    };
  }

  if (upper.includes('TIMED OUT') || upper.includes('TIMEOUT')) {
    return {
      status: 504,
      message: 'CA Saathi AI took too long to respond. Please retry your question.',
    };
  }

  return {
    status: 502,
    message: 'Unable to reach CA Saathi AI right now. Please try again in a moment.',
  };
}
