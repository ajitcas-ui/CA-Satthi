import express, { Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'node:fs';
import { createRequireOwnerAuth, VerifiedOwnerSession } from './src/server/ownerAuth';
import { registerMaterialRoutes } from './src/server/materialStorage';

dotenv.config();

const firebaseConfigRaw = JSON.parse(
  fs.readFileSync(path.resolve(process.cwd(), 'firebase-applet-config.json'), 'utf8')
) as { projectId: string; firestoreDatabaseId: string };
const requireOwnerAuth = createRequireOwnerAuth(firebaseConfigRaw.projectId);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

// Body parser with 25MB limit for image & PDF study material uploads
app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ extended: true, limit: '25mb' }));

// ============================================================================
// SERVER-SIDE PROTECTED OWNER ROUTES (/api/owner/*)
// ============================================================================
app.use('/api/owner', requireOwnerAuth);

app.get('/api/owner/session', (req: Request, res: Response) => {
  const session = (req as Request & { ownerSession?: VerifiedOwnerSession }).ownerSession;
  return res.json({
    authorized: true,
    ownerEmail: session?.email,
    uid: session?.uid,
    verifiedAt: new Date().toISOString(),
  });
});

app.use('/api/owner', (_req: Request, res: Response) => {
  return res.status(404).json({ error: 'Owner API endpoint not found.' });
});

// ============================================================================
// PROTECTED PDF STUDY MATERIAL ROUTES (/api/materials/*)
// ============================================================================
registerMaterialRoutes(app, firebaseConfigRaw);

// Subject labels for CA Foundation
const SUBJECT_LABELS: Record<string, string> = {
  paper1: 'Paper 1: Accounting (लेखांकन)',
  paper2: 'Paper 2: Business Laws (व्यावसायिक विधि)',
  paper3: 'Paper 3: Quantitative Aptitude (Maths, Logical Reasoning & Statistics)',
  paper4: 'Paper 4: Business Economics (व्यावसायिक अर्थशास्त्र)',
};

// ============================================================================
// AI DOUBT SOLVER ENDPOINT
// ============================================================================

app.post('/api/ai-doubt-solver', async (req: Request, res: Response) => {
  try {
    const { paperId = 'paper1', imageBase64, mimeType = 'image/png', language = 'en' } = req.body;
    const question = req.body.question || req.body.questionText;

    if (!question && !imageBase64) {
      return res.status(400).json({ error: 'Please provide question text or upload a question image.' });
    }

    const subjectName = SUBJECT_LABELS[paperId] || 'CA Foundation';
    const apiKey = process.env.GEMINI_API_KEY;

    // Check if Gemini API Key is present
    if (apiKey && apiKey !== 'MY_GEMINI_API_KEY' && apiKey.trim().length > 10) {
      try {
        const ai = new GoogleGenAI({ apiKey });

        const systemInstruction = `You are the chief academic mentor at "CA Saathi" (सीए साथी), a premier educational guidance platform exclusively for CA Foundation students under the Institute of Chartered Accountants of India (ICAI) New Scheme.
Subject: ${subjectName}.
Student Preferred Language: ${language === 'hi' ? 'Hindi (हिंदी)' : language === 'hinglish' ? 'Hinglish (Hindi + English mix)' : 'English'}.

CRITICAL RULES FOR CA FOUNDATION ACCURACY:
1. Provide step-by-step educational guidance, conceptual clarity, and exact problem solving steps.
2. For Paper 1 (Accounts): Show Debit/Credit entries, Journal format, ledger balances, and cite AS (Accounting Standards) where applicable (AS-2 Inventories, AS-10 PPE).
3. For Paper 2 (Law): State the Principle / Section of Indian Contract Act 1872, Sale of Goods Act 1930, Indian Partnership Act 1932, or Companies Act 2013, explain facts and provide legal conclusion with landmark case law references where appropriate.
4. For Paper 3 (Maths/Stats): Show step-by-step formula derivation, calculator shortcuts (e.g., Casio MJ-12D tricks for TVM/annuities, GP series, regression coefficients).
5. For Paper 4 (Economics): Explain economic logic, demand/supply curves, market structures (Monopoly, Oligopoly, Perfect Competition), national income and fiscal/monetary policies.
6. Clearly format your output with:
   - **Step-by-Step Solution** (चरण-दर-चरण समाधान)
   - **Key ICAI Concept / Provision** (मुख्य नियम या धारा)
   - **Exam Tip & Common Pitfall** (परीक्षा सुझाव एवं सामान्य गलतियां)`;

        const contents: any[] = [];

        // If student uploaded an image of a textbook or handwritten question
        if (imageBase64) {
          const cleanBase64 = imageBase64.replace(/^data:[a-zA-Z0-9/]+;base64,/, '');
          contents.push({
            inlineData: {
              data: cleanBase64,
              mimeType: mimeType || 'image/jpeg',
            },
          });
        }

        const userPrompt = question 
          ? `Question/Doubt:\n${question}\n\nPlease solve this step-by-step for a CA Foundation aspirant.`
          : 'Please examine this question image and provide a comprehensive step-by-step solution for a CA Foundation student.';

        contents.push({ text: userPrompt });

        // Timeout promise after 6 seconds to prevent hanging on network stalls
        const timeoutPromise = new Promise<never>((_, reject) => 
          setTimeout(() => reject(new Error('Gemini API call timed out')), 6000)
        );

        const aiPromise = ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents,
          config: {
            systemInstruction,
            temperature: 0.2, // Low temperature for high academic precision
          },
        });

        const aiResponse = await Promise.race([aiPromise, timeoutPromise]);

        const explanationText = aiResponse.text || 'Unable to generate explanation. Please try again.';

        return res.json({
          success: true,
          source: 'gemini-ai',
          explanation: explanationText,
          conceptKey: `${subjectName} Conceptual Masterclass`,
          icaiReferenceNote: 'Solved in alignment with ICAI New Scheme Study Material & Standards.',
        });
      } catch (geminiError: any) {
        console.warn('Gemini API call failed or timed out, deploying curriculum fallback:', geminiError?.message);
      }
    }

    // High-yield CA Foundation Knowledge Base Fallback
    const fallback = generateCurriculumFallback(paperId, question || '', language);
    return res.json({
      success: true,
      source: 'curriculum-engine',
      explanation: fallback.explanation,
      conceptKey: fallback.conceptKey,
      icaiReferenceNote: fallback.icaiReferenceNote,
    });
  } catch (error: any) {
    console.error('AI Doubt Solver error:', error);
    return res.status(500).json({
      error: 'An error occurred while analyzing the doubt. Please try again.',
      details: error?.message,
    });
  }
});

// Helper for educational fallback explanations
function generateCurriculumFallback(paperId: string, query: string, language: string) {
  const qLower = query.toLowerCase();

  if (paperId === 'paper1' || qLower.includes('journal') || qLower.includes('brs') || qLower.includes('depreciation') || qLower.includes('share')) {
    return {
      conceptKey: 'Accounting Principles & Framework (AS-2 / AS-10)',
      icaiReferenceNote: 'ICAI Study Module Paper-1: Accounting Process & Final Accounts',
      explanation: language === 'hi'
        ? `### चरण-दर-चरण समाधान (Step-by-Step Solution):
1. **लेखांकन सिद्धांत की पहचान**: व्यावसायिक लेन-देन में द्विपक्षीय प्रभाव (Dual Aspect Concept) लागू होता है।
2. **जर्नल प्रविष्टि नियम**:
   - व्यक्तिगत खाता (Personal Account): पाने वाले को नाम (Debit the receiver), देने वाले को जमा (Credit the giver).
   - वास्तविक खाता (Real Account): जो आए उसे नाम (Debit what comes in), जो जाए उसे जमा (Credit what goes out).
   - नाममात्र खाता (Nominal Account): सभी व्यय एवं हानियों को नाम, सभी आय एवं लाभ को जमा।
3. **समायोजन प्रविष्टि**:
   - यदि अंतिम खाते तैयार करते समय कोई त्रुटि या अपूर्ण प्रविष्टि हो, तो उसे उचित प्रावधान (Provision) या उचंत खाता (Suspense A/c) के माध्यम से संतुलित करें।
4. **परीक्षा सुझाव**: जर्नल बनाते समय संक्षेप में Narration अवश्य लिखें।`
        : `### Step-by-Step Accounting Solution:
1. **Identify the Core Principle**: Every transaction impacts at least two accounts under the Dual Aspect System (Assets = Capital + Liabilities).
2. **Apply the Golden Rules**:
   - **Real Accounts**: Debit what comes in, Credit what goes out.
   - **Personal Accounts**: Debit the receiver, Credit the giver.
   - **Nominal Accounts**: Debit all expenses & losses, Credit all incomes & gains.
3. **Transaction Treatment**:
   - For BRS: Determine the starting balance (Cash Book vs Pass Book). If Cash Book shows debit (favorable), add cheques issued but not yet presented and direct deposits by customers; deduct cheques deposited but not cleared.
   - For Shares: Money received on application is transferred to Equity Share Capital upon valid allotment by the Board.
4. **ICAI Exam Tip**: Always verify that the balance sheet totals match and write concise narrations for all journal entries.`,
    };
  }

  if (paperId === 'paper2' || qLower.includes('contract') || qLower.includes('section') || qLower.includes('offer') || qLower.includes('consideration')) {
    return {
      conceptKey: 'Indian Contract Act 1872 & Sale of Goods Act 1930',
      icaiReferenceNote: 'ICAI Study Module Paper-2: Business Laws Provisions',
      explanation: language === 'hi'
        ? `### विधिक विश्लेषण एवं समाधान (Legal Analysis):
1. **प्रासंगिक धारा (Relevant Section)**:
   - भारतीय अनुबंध अधिनियम 1872 की धारा 10 के अनुसार: "सभी ठहराव अनुबंध हैं यदि वे पक्षकारों की स्वतंत्र सहमति से, सक्षम पक्षकारों द्वारा, वैध प्रतिफल एवं वैध उद्देश्य के लिए किए गए हों।"
2. **विधिक तथ्य एवं परीक्षण**:
   - केवल सामाजिक या घरेलू ठहराव (Domestic/Social Agreements) कानूनी संबंध स्थापित करने के इरादे के अभाव में प्रवर्तनीय नहीं होते (*बाल्फोर बनाम बाल्फोर* केस)।
   - वाणिज्यिक समझौतों में विधिक संबंध बनाने का इरादा स्वतः माना जाता है।
3. **निष्कर्ष (Conclusion)**:
   - यदि स्वतंत्र सहमति (Free Consent - धारा 14) कपट, मिथ्या वर्णन, दबाव या अनुचित प्रभाव से मुक्त है, तो अनुबंध पूर्णतः वैध और न्यायालय द्वारा प्रवर्तनीय होगा।`
        : `### Legal Provision & Step-by-Step Analysis:
1. **Statutory Framework (Indian Contract Act, 1872)**:
   - Under Section 10: "All agreements are contracts if they are made by the free consent of parties competent to contract, for a lawful consideration and with a lawful object."
2. **Analysis of the Situation**:
   - An offer must be distinguished from an "Invitation to Offer" (*Pharmaceutical Society of Great Britain v. Boots Cash Chemists*).
   - In domestic/social agreements, there is a presumption that legal intention is absent (*Balfour v. Balfour*). In commercial pacts, legal intention is rebuttably presumed.
   - Consideration must move at the desire of the promisor (Section 2(d)) and need not be adequate, but must have real value in the eye of law.
3. **Conclusion & Exam Strategy**:
   - When answering ICAI descriptive questions: State the Relevant Provision -> Explain the Facts -> Connect Law with Facts -> Conclude with unambiguous rationale.`,
    };
  }

  if (paperId === 'paper3' || qLower.includes('ratio') || qLower.includes('tvm') || qLower.includes('interest') || qLower.includes('probability')) {
    return {
      conceptKey: 'Time Value of Money (TVM) & Mathematical Aptitude',
      icaiReferenceNote: 'ICAI Study Module Paper-3: Quantitative Aptitude & Logical Reasoning',
      explanation: language === 'hi'
        ? `### गणितीय गणना एवं शॉर्टकट (Mathematical Solution & Shortcut):
1. **मुद्रा का समय मूल्य (TVM) सूत्र**:
   - चक्रवृद्धि ब्याज मिश्रधन: $A = P \\times (1 + i)^n$
   - जहां $i = r / (100 \\times m)$, और $n = t \\times m$ (m = प्रति वर्ष चक्रण की संख्या).
2. **वार्षिकी (Annuity) शॉर्टकट ट्रिक (Casio MJ-12D)**:
   - सामान्य वार्षिकी (Ordinary Annuity): हर अवधि के अंत में भुगतान। कैलकुलेटर पर $1 \\div (1 + i)$ दबाएं, फिर $[=]$ को $n$ बार दबाकर $[GT]$ दबाएं, फिर किश्त राशि से गुणा करें।
   - वार्षिकी देय (Annuity Due): शुरुआत में भुगतान। सामान्य वार्षिकी परिणाम को सिर्फ $(1 + i)$ से गुणा करें।
3. **सटीक उत्तर सत्यापन**:
   - नकारात्मक अंकन (-0.25) से बचने के लिए केवल निश्चित होने पर ही विकल्प मार्क करें।`
        : `### Mathematical Step-by-Step Derivation & Calculator Shortcut:
1. **Standard Formulae**:
   - Compound Amount: $A = P(1 + i)^n$, where $i = r / m$ and $n = t \\times m$.
   - Present Value of Ordinary Annuity: $PV = \\frac{A}{i} [1 - (1+i)^{-n}]$.
   - Future Value of Ordinary Annuity: $FV = \\frac{A}{i} [(1+i)^n - 1]$.
2. **Casio MJ-12D Exam Calculator Sequence**:
   - Step 1: Compute Discount Factor: $1 \\div (1 + i)$.
   - Step 2: Press $[=]$ repeatedly $n$ times.
   - Step 3: Press $[GT]$ (Grand Total key) to get Present Value Annuity Factor (PVAF).
   - Step 4: Multiply by Installment ($A$).
   - *For Annuity Due*: Simply multiply the final figure by $(1 + i)$.
3. **Logical Check**:
   - Present Value is always strictly LESS than the sum of nominal installments because money has time-preference value.`,
    };
  }

  // Economics default
  return {
    conceptKey: 'Theory of Demand, Supply & Price Determination',
    icaiReferenceNote: 'ICAI Study Module Paper-4: Business Economics',
    explanation: language === 'hi'
      ? `### व्यावसायिक अर्थशास्त्र अवधारणा (Economic Concept):
1. **मांग का नियम (Law of Demand)**:
   - अन्य बातें समान रहने पर (Ceteris Paribus), जब किसी वस्तु की कीमत बढ़ती है तो उसकी मांगी गई मात्रा घटती है।
2. **मूल्य लोच (Price Elasticity of Demand - $E_p$)**:
   - $E_p = \\frac{\\% \\text{ मांग में परिवर्तन}}{\\% \\text{ कीमत में परिवर्तन}}$
   - $E_p > 1$: अत्यधिक लोचदार (Elastic - विलासिता वस्तुएं)
   - $E_p < 1$: बेलोचदार (Inelastic - अनिवार्य वस्तुएं जैसे नमक, दवाइयां)
3. **बाजार संतुलन**:
   - संतुलन मूल्य वह बिंदु है जहां बाजार मांग वक्र (DD) और बाजार पूर्ति वक्र (SS) एक दूसरे को काटते हैं।`
      : `### Business Economics Analytical Breakdown:
1. **Law of Demand & Elasticity**:
   - Governed by *Ceteris Paribus* (other determinants remaining constant). Downward sloping demand curve is caused by the Income Effect, Substitution Effect, Law of Diminishing Marginal Utility, and New Buyers entering.
2. **Price Elasticity ($E_p$) Formulas**:
   - Percentage Method: $\\frac{\\Delta Q}{\\Delta P} \\times \\frac{P}{Q}$.
   - Total Outlay Method: When Price and Total Expenditure move in opposite directions, Elasticity $> 1$. When they move in the same direction, Elasticity $< 1$.
3. **Market Structures Summary**:
   - **Perfect Competition**: Large number of buyers & sellers, homogeneous goods, price taker ($P = AR = MR$).
   - **Monopoly**: Single seller, unique product with no close substitutes, price maker.
   - **Oligopoly**: Few dominant interdependent firms, kinked demand curve (*Paul Sweezy model*).`,
  };
}

// ============================================================================
// DEV & STATIC SERVER HANDLING
// ============================================================================

async function startServer() {
  if (process.env.NODE_ENV === 'production') {
    // Serve production static build
    const distPath = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  } else {
    // Dev mode with Vite middleware
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`CA Saathi Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
