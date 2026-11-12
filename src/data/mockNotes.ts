import { StudyNote } from '../types';

export const MOCK_NOTES: StudyNote[] = [
  {
    id: 'note_acc_1',
    paperId: 'paper1',
    chapterTitle: {
      en: 'Accounting Principles & Concepts',
      hi: 'लेखांकन सिद्धांत एवं अवधारणाएं',
    },
    topicTitle: {
      en: 'Capital vs. Revenue Expenditure: Golden Rules',
      hi: 'पूंजीगत बनाम राजस्व व्यय: स्वर्णिम नियम',
    },
    readTimeMinutes: 5,
    tags: ['Basic Accounting', 'Exam Favorite', 'High Scoring'],
    summary: {
      en: 'Mastering the exact distinction between Capital and Revenue expenditure is critical for passing Paper 1. Misclassification distorts the Balance Sheet and Net Profit.',
      hi: 'पूंजीगत और राजस्व व्यय में सही भेद समझना पेपर 1 के लिए अत्यंत आवश्यक है। गलत वर्गीकरण से लाभ-हानि व आर्थिक चिट्ठे दोनों अशुद्ध हो जाते हैं।',
    },
    keyPoints: [
      {
        en: 'Capital Expenditure: Incurred to acquire, improve, or ready a fixed asset. Gives enduring benefit over multiple accounting periods. Shown in Balance Sheet.',
        hi: 'पूंजीगत व्यय: स्थाई संपत्ति के क्रय, विस्तार या उसे चालू स्थिति में लाने के लिए। इसका लाभ कई वर्षों तक मिलता है। इसे चिट्ठे (Balance Sheet) में दिखाया जाता है।',
      },
      {
        en: 'Revenue Expenditure: Incurred to maintain current earning capacity, routine repairs, salaries, rent. Debited to Trading / Profit & Loss Account.',
        hi: 'राजस्व व्यय: सामान्य व्यापार संचालन तथा वर्तमान अर्जन क्षमता बनाए रखने हेतु (वेतन, किराया, साधारण मरम्मत)। इसे P&L खाते में नामे लिखा जाता है।',
      },
      {
        en: 'Deferred Revenue Expenditure: Heavy revenue advertising or preliminary launch expenses whose benefit spills across 2-4 years.',
        hi: 'आस्थगित राजस्व व्यय: भारी विज्ञापन या उत्पाद लॉन्च खर्च जिसका लाभ आगामी 2 से 4 वर्षों तक प्राप्त होता है।',
      },
    ],
    formulasOrRules: [
      {
        title: { en: 'Asset Capitalization Formula', hi: 'संपत्ति पूंजीकरण सूत्र' },
        detail: {
          en: 'Cost of Asset = Purchase Price + Taxes (non-refundable) + Freight + Transit Insurance + Site Preparation + Installation/Erection + Test Runs (less scrap proceeds).',
          hi: 'संपत्ति की कुल लागत = क्रय मूल्य + गैर-वापसी कर + भाड़ा + पारगमन बीमा + स्थापना/इरेक्शन खर्च + ट्रायल रन लागत (स्क्रैप आय घटाकर)।',
        },
      },
    ],
    mnemonic: {
      word: 'F.I.T.S.',
      meaning: {
        en: 'Freight, Installation, Taxes, Site preparation — all capitalized until asset is operational!',
        hi: 'भाड़ा (Freight), स्थापना (Installation), कर (Taxes), साइट निर्माण (Site) — सभी संपत्ति में जुड़ते हैं!',
      },
    },
  },
  {
    id: 'note_law_1',
    paperId: 'paper2',
    chapterTitle: {
      en: 'The Indian Contract Act, 1872',
      hi: 'भारतीय अनुबंध अधिनियम, 1872',
    },
    topicTitle: {
      en: 'Essentials of a Valid Contract (Section 10)',
      hi: 'वैध अनुबंध के आवश्यक तत्व (धारा 10)',
    },
    readTimeMinutes: 7,
    tags: ['Contract Act', 'Section 10', 'Law Fundamentals'],
    summary: {
      en: 'All agreements are not contracts, but all contracts are agreements. Section 10 lays down the mandatory conditions that transform a mere promise into a legally binding contract.',
      hi: 'सभी ठहराव अनुबंध नहीं होते, किंतु सभी अनुबंध ठहराव होते हैं। धारा 10 उन आवश्यक शर्तों का उल्लेख करती है जो किसी वादे को कानूनी रूप से बाध्यकारी बनाती हैं।',
    },
    keyPoints: [
      {
        en: 'Offer and Acceptance: There must be two distinct parties with a definite proposal and unqualified acceptance.',
        hi: 'प्रस्ताव एवं स्वीकृति: कम से कम दो पक्षकार, स्पष्ट प्रस्ताव तथा बिना शर्त स्वीकृति होनी चाहिए।',
      },
      {
        en: 'Intention to Create Legal Relationship: In social or domestic arrangements (e.g. Balfour v. Balfour), legal intention is presumed absent.',
        hi: 'कानूनी संबंध बनाने का उद्देश्य: घरेलू या सामाजिक समझौतों में कानूनी बाध्यता का अभाव माना जाता है।',
      },
      {
        en: 'Lawful Consideration: "Quid pro quo" (something in return). Need not be adequate, but must be of value in the eye of law.',
        hi: 'वैधानिक प्रतिफल: "कुछ के बदले कुछ" (Quid pro quo)। प्रतिफल पर्याप्त होना आवश्यक नहीं, किंतु कानूनी रूप से मान्य होना चाहिए।',
      },
      {
        en: 'Capacity to Contract: Parties must be major (18+), of sound mind, and not disqualified by law (e.g., alien enemies, insolvents).',
        hi: 'अनुबंध करने की क्षमता: पक्षकार वयस्क (18+), स्वस्थ मस्तिष्क का हो तथा कानून द्वारा अयोग्य घोषित न हो।',
      },
      {
        en: 'Free Consent (Sec 14): Consent must NOT be caused by Coercion (Sec 15), Undue Influence (Sec 16), Fraud (Sec 17), Misrepresentation (Sec 18), or Mistake (Sec 20).',
        hi: 'स्वतंत्र सहमति: सहमति उत्पीड़न, अनुचित प्रभाव, कपट, मिथ्या-वर्णन या भूल से प्रभावित न हो।',
      },
    ],
    mnemonic: {
      word: 'C.A.L.F.O.',
      meaning: {
        en: 'Consideration, Agreement, Legal intention, Free consent, Object lawful.',
        hi: 'प्रतिफल (Consideration), ठहराव (Agreement), कानूनी उद्देश्य (Legal), स्वतंत्र सहमति (Free), उद्देश्य वैध (Object)।',
      },
    },
  },
  {
    id: 'note_math_1',
    paperId: 'paper3',
    chapterTitle: {
      en: 'Time Value of Money (TVM)',
      hi: 'मुद्रा का समय मूल्य (TVM)',
    },
    topicTitle: {
      en: 'Quick Formula Sheet for Simple & Compound Interest, Annuities',
      hi: 'साधारण व चक्रवृद्धि ब्याज तथा वार्षिकी (Annuity) के त्वरित सूत्र',
    },
    readTimeMinutes: 6,
    tags: ['Highest Weightage', 'Calculator Tricks', 'Paper 3 Core'],
    summary: {
      en: 'Time Value of Money carries 12-15 marks in Paper 3 Quantitative Aptitude. Memorize these core formulas and calculator shortcuts.',
      hi: 'गणित में TVM अध्याय से 12 से 15 अंक पूछे जाते हैं। इन मूल सूत्रों और कैलकुलेटर शॉर्टकट्स को कंठस्थ कर लें।',
    },
    keyPoints: [
      {
        en: 'Simple Interest: SI = (P * R * T) / 100. Amount A = P + SI = P(1 + RT/100).',
        hi: 'साधारण ब्याज: SI = (P × R × T) / 100। मिश्रधन A = P(1 + RT/100)।',
      },
      {
        en: 'Compound Interest: Amount A = P(1 + i)^n where i = r / (100 * m), and n = t * m (m = compounding periods per year).',
        hi: 'चक्रवृद्धि ब्याज: A = P(1 + i)^n। यदि छमाही हो तो दर आधी (r/2) और समय दोगुना (2t) होगा।',
      },
      {
        en: 'Rule of 72: Doubling time of money ≈ 72 / (Interest Rate in %). E.g. at 9% p.a., money doubles in ~8 years.',
        hi: '72 का नियम: धन दोगुना होने का अनुमानित समय ≈ 72 / (ब्याज दर %)। जैसे 9% की दर से धन लगभग 8 वर्ष में दोगुना होगा।',
      },
    ],
    formulasOrRules: [
      {
        title: { en: 'Effective Rate of Interest', hi: 'प्रभावी ब्याज दर' },
        detail: {
          en: 'E = (1 + i/m)^m - 1. Compares nominal rates with different compounding frequencies.',
          hi: 'E = (1 + i/m)^m - 1। विभिन्न अवधियों की वास्तविक वार्षिक ब्याज दर की तुलना करता है।',
        },
      },
      {
        title: { en: 'Future Value of Ordinary Annuity', hi: 'सामान्य वार्षिकी का भविष्य मूल्य' },
        detail: {
          en: 'FVA = A * [ ((1 + i)^n - 1) / i ]. Used for recurring deposits or sinking funds.',
          hi: 'FVA = A × [ ((1 + i)^n - 1) / i ]। आवर्ती जमा व ऋण परिशोधन हेतु प्रयुक्त।',
        },
      },
    ],
    mnemonic: {
      word: 'P.I.N.',
      meaning: {
        en: 'Principal, Interest rate per period, Number of periods. Always convert r and t to same period basis!',
        hi: 'मूलधन (P), आवधिक ब्याज (I), कुल किस्तें (N)। हमेशा दर व समय को समान आधार पर बदलें!',
      },
    },
  },
  {
    id: 'note_eco_1',
    paperId: 'paper4',
    chapterTitle: {
      en: 'Business Economics - Demand & Consumer Behavior',
      hi: 'व्यावसायिक अर्थशास्त्र - मांग एवं उपभोक्ता व्यवहार',
    },
    topicTitle: {
      en: 'Price Elasticity of Demand & Revenue Relationship',
      hi: 'मांग की कीमत लोच एवं आगम (Revenue) संबंध',
    },
    readTimeMinutes: 5,
    tags: ['Economics Core', 'MCQ Favorite', 'Total Outlay Method'],
    summary: {
      en: 'Understanding how Price Elasticity (Ep) influences Total Revenue and Marginal Revenue is a staple question type in Paper 4 MCQs.',
      hi: 'कीमत लोच (Ep) कुल आगम (TR) तथा सीमांत आगम (MR) को कैसे प्रभावित करती है, यह पेपर 4 का सबसे पसंदीदा प्रश्न है।',
    },
    keyPoints: [
      {
        en: 'If Ep > 1 (Elastic): Price and Total Revenue move in OPPOSITE directions. A price cut increases total revenue.',
        hi: 'यदि Ep > 1 (लोचदार): कीमत और कुल आगम विपरीत दिशा में चलते हैं। कीमत घटाने से कुल आय बढ़ती है।',
      },
      {
        en: 'If Ep < 1 (Inelastic): Price and Total Revenue move in the SAME direction. A price rise increases total revenue.',
        hi: 'यदि Ep < 1 (बेलोचदार): कीमत और कुल आगम एक ही दिशा में चलते हैं। कीमत बढ़ाने पर कुल आय बढ़ती है।',
      },
      {
        en: 'If Ep = 1 (Unitary): Change in price leaves Total Revenue unchanged.',
        hi: 'यदि Ep = 1 (इकाई लोचदार): कीमत बदलने पर भी कुल आगम स्थिर रहता है।',
      },
    ],
    formulasOrRules: [
      {
        title: { en: 'MR & Elasticity Relationship', hi: 'MR और लोच में संबंध' },
        detail: {
          en: 'MR = AR * [ (e - 1) / e ]. When e = 1, MR = 0. When e > 1, MR > 0. When e < 1, MR < 0.',
          hi: 'MR = AR × [ (e - 1) / e ]। जब e = 1 हो तो MR = 0 होता है। e > 1 पर MR धनात्मक तथा e < 1 पर ऋणात्मक।',
        },
      },
    ],
  },
];
