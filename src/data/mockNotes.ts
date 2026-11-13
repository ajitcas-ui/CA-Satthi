import { StudyNote } from '../types';

export const MOCK_NOTES: StudyNote[] = [
  {
    id: 'note_acc_1',
    paperId: 'paper1',
    chapterTitle: {
      en: 'Ch 1: Theoretical Framework & Accounting Concepts',
      hi: 'अध्याय 1: लेखांकन का सैद्धांतिक ढांचा एवं सिद्धांत',
    },
    topicTitle: {
      en: 'Capital vs. Revenue Expenditure: Golden Rules',
      hi: 'पूंजीगत बनाम राजस्व व्यय: स्वर्णिम नियम',
    },
    readTimeMinutes: 5,
    tags: ['Paper 1', 'Basic Accounting', 'High Scoring'],
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
        en: 'Deferred Revenue Expenditure: Heavy promotional or launch expense whose benefit extends across 2–4 accounting years.',
        hi: 'आस्थगित राजस्व व्यय: भारी विज्ञापन या लॉन्च खर्च जिसका लाभ आगामी 2 से 4 वर्षों तक प्राप्त होता है।',
      },
    ],
    formulasOrRules: [
      {
        title: { en: 'Asset Capitalization Formula', hi: 'संपत्ति पूंजीकरण सूत्र' },
        detail: {
          en: 'Cost of Asset = Purchase Price + Non-refundable Taxes + Freight + Transit Insurance + Site Prep + Installation + Trial Run (net of scrap).',
          hi: 'संपत्ति लागत = क्रय मूल्य + गैर-वापसी कर + भाड़ा + बीमा + साइट तैयारी + स्थापना + ट्रायल रन (स्क्रैप घटाकर)।',
        },
      },
    ],
    mnemonic: {
      word: 'F.I.T.S.',
      meaning: {
        en: 'Freight, Installation, Taxes, Site preparation — all capitalized until asset is operational!',
        hi: 'भाड़ा (Freight), स्थापना (Installation), कर (Taxes), साइट निर्माण — सभी संपत्ति लागत में जुड़ते हैं!',
      },
    },
  },
  {
    id: 'note_acc_2',
    paperId: 'paper1',
    chapterTitle: {
      en: 'Ch 10 & 11: Partnership, LLP & Company Accounts',
      hi: 'अध्याय 10 एवं 11: साझेदारी, LLP व कंपनी खाते',
    },
    topicTitle: {
      en: 'Share Forfeiture, Re-issue & Preference Redemption Checklist',
      hi: 'अंश हरण, पुनर्निर्गमन व पूर्वाधिकार शोधन चेकलिस्ट',
    },
    readTimeMinutes: 6,
    tags: ['Paper 1', 'Company Accounts', '30 Marks Weightage'],
    summary: {
      en: 'Quick revision rules for Share Forfeiture Re-issue Capital Reserve and Section 55 CRR computation in Company Accounts.',
      hi: 'कंपनी खातों में अंश हरण, पुनर्निर्गमन पर पूंजी संचय तथा धारा 55 के अंतर्गत CRR गणना के त्वरित नियम।',
    },
    keyPoints: [
      {
        en: 'Securities Premium once collected CANNOT be cancelled upon share forfeiture (Section 52 restriction).',
        hi: 'एक बार प्राप्त हो चुका प्रतिभूति प्रीमियम अंश हरण के समय रद्द (नामे) नहीं किया जा सकता (धारा 52)।',
      },
      {
        en: 'Maximum permissible discount on re-issue of forfeited shares = Amount originally forfeited (credited to Share Forfeiture A/c) on those shares.',
        hi: 'पुनर्निर्गमन पर अधिकतम अनुमत बट्टा उन अंशों पर जब्त की गई राशि के बराबर हो सकता है।',
      },
      {
        en: 'CRR Requirement (Sec 55): Nominal Value of Preference Shares Redeemed MINUS Nominal Value of Fresh Equity Issue proceeds.',
        hi: 'CRR आवश्यक = शोधित पूर्वाधिकार अंशों का अंकित मूल्य - नए अंश निर्गमन का अंकित मूल्य।',
      },
    ],
    formulasOrRules: [
      {
        title: { en: 'Pro-rata Capital Reserve Formula', hi: 'आनुपातिक पूंजी संचय सूत्र' },
        detail: {
          en: 'Capital Reserve = [Total Forfeited Amount × (Re-issued Shares / Total Forfeited Shares)] - Re-issue Discount.',
          hi: 'पूंजी संचय = [कुल जब्त राशि × (पुनर्निर्गमित अंश / कुल हरण अंश)] - पुनर्निर्गमन बट्टा।',
        },
      },
    ],
  },
  {
    id: 'note_law_1',
    paperId: 'paper2',
    chapterTitle: {
      en: 'Ch 2: The Indian Contract Act, 1872',
      hi: 'अध्याय 2: भारतीय अनुबंध अधिनियम, 1872',
    },
    topicTitle: {
      en: 'Essentials of a Valid Contract (Section 10) & Exceptions',
      hi: 'वैध अनुबंध के आवश्यक तत्व (धारा 10) व अपवाद',
    },
    readTimeMinutes: 7,
    tags: ['Contract Act', 'Section 10', 'Paper 2 Core'],
    summary: {
      en: 'All agreements are not contracts, but all contracts are agreements. Section 10 lays down the mandatory conditions that transform a mere promise into a legally binding contract.',
      hi: 'सभी ठहराव अनुबंध नहीं होते, किंतु सभी अनुबंध ठहराव होते हैं। धारा 10 कानूनी रूप से बाध्यकारी अनुबंध की अनिवार्य शर्तें बताती है।',
    },
    keyPoints: [
      {
        en: 'Offer and Acceptance: Definite proposal and unqualified acceptance communicated properly (Sec 2(a), 2(b), Sec 4).',
        hi: 'प्रस्ताव एवं स्वीकृति: स्पष्ट प्रस्ताव तथा बिना शर्त स्वीकृति का विधिवत संवहन होना आवश्यक है।',
      },
      {
        en: 'Intention to Create Legal Relationship: Presumed absent in social/domestic agreements (Balfour v. Balfour).',
        hi: 'कानूनी संबंध बनाने का आशय: सामाजिक व पारिवारिक समझौतों में कानूनी आशय नहीं माना जाता (Balfour बनाम Balfour)।',
      },
      {
        en: 'No Consideration, No Contract (Sec 25) Exceptions: Written & registered love/affection, Past voluntary service, Time-barred debt, Completed gift, Agency.',
        hi: 'प्रतिफल के बिना अनुबंध व्यर्थ (धारा 25) के अपवाद: लिखित-पंजीकृत स्नेह वचन, पूर्व स्वैच्छिक सेवा, कालबाधित ऋण का लिखित वचन, पूर्ण दान व एजेंसी।',
      },
      {
        en: 'Free Consent (Sec 14): Free from Coercion (15), Undue Influence (16), Fraud (17), Misrepresentation (18), or Mistake (20-22).',
        hi: 'स्वतंत्र सहमति: उत्पीड़न, अनुचित प्रभाव, कपट, मिथ्या-वर्णन या भूल से मुक्त होनी चाहिए।',
      },
    ],
    mnemonic: {
      word: 'C.A.L.F.O.',
      meaning: {
        en: 'Consideration, Agreement, Legal intention, Free consent, Object lawful.',
        hi: 'प्रतिफल (Consideration), ठहराव (Agreement), कानूनी आशय (Legal), स्वतंत्र सहमति (Free), वैध उद्देश्य (Object)।',
      },
    },
  },
  {
    id: 'note_law_2',
    paperId: 'paper2',
    chapterTitle: {
      en: 'Ch 3, 6 & 7: Sale of Goods, Companies Act & NI Act',
      hi: 'अध्याय 3, 6 व 7: माल विक्रय, कंपनी व परक्राम्य लिखत अधिनियम',
    },
    topicTitle: {
      en: 'Key Legal Doctrines & Negotiable Instruments Deadlines',
      hi: 'प्रमुख कानूनी सिद्धांत एवं चेक अनादरण समय-सीमा',
    },
    readTimeMinutes: 6,
    tags: ['Companies Act', 'Sale of Goods', 'Sec 138 NI Act'],
    summary: {
      en: 'High-yield case-study checklist covering Caveat Emptor, Turquand Rule, Ultra Vires, and Section 138 Cheque Dishonour timelines.',
      hi: 'क्रेता सावधान सिद्धांत, टर्क्वैंड नियम, अधिकारतीत सिद्धांत व धारा 138 चेक अनादरण समय-सीमाओं का त्वरित सार।',
    },
    keyPoints: [
      {
        en: 'Caveat Emptor (Sec 16): Buyer beware — EXCEPT when buyer relies on seller skill/purpose, sale by description/sample, merchantable quality, or fraud.',
        hi: 'क्रेता सावधान (धारा 16): वस्तु चुनते समय क्रेता स्वयं जिम्मेदार है, सिवाय जब क्रेता विक्रेता के कौशल पर निर्भर करे या विक्रय वर्णन/नमूने से हो।',
      },
      {
        en: 'Indoor Management (Turquand Rule) protects outsiders against internal irregularities; exceptions include knowledge of irregularity, forgery, or negligence.',
        hi: 'आंतरिक प्रबंध का सिद्धांत बाहरी व्यक्तियों की रक्षा करता है (अपवाद: अनियमितता का ज्ञान, जालसाजी या लापरवाही)।',
      },
      {
        en: 'Sec 138 Dishonour Timelines: Present cheque within 3 months -> Notice within 30 days of bank memo -> Drawer pays within 15 days -> Complaint within 1 month.',
        hi: 'धारा 138 समय-सीमा: 3 माह में चेक प्रस्तुति -> मेमो के 30 दिन में नोटिस -> 15 दिन भुगतान अवधि -> 1 माह में न्यायालय में परिवाद।',
      },
    ],
  },
  {
    id: 'note_math_1',
    paperId: 'paper3',
    chapterTitle: {
      en: 'Ch 4: Mathematics of Finance (TVM) & Statistics Formulas',
      hi: 'अध्याय 4: वित्त गणित (TVM) एवं सांख्यिकी सूत्र',
    },
    topicTitle: {
      en: 'Quick Formula Sheet: Interest, Annuities, SD & Index Numbers',
      hi: 'त्वरित सूत्र सारणी: ब्याज, वार्षिकी, प्रमाप विचलन व सूचकांक',
    },
    readTimeMinutes: 7,
    tags: ['Highest Weightage', 'Calculator Tricks', 'Paper 3 Core'],
    summary: {
      en: 'TVM + Central Tendency/Dispersion + Correlation/Index together account for nearly 45+ marks in Paper 3.',
      hi: 'TVM, केंद्रीय प्रवृत्ति, विक्षेपण, सहसंबंध व सूचकांक मिलकर पेपर 3 में लगभग 45+ अंक कवर करते हैं।',
    },
    keyPoints: [
      {
        en: 'Simple Interest: SI = (P × R × T) / 100. Compound Amount: A = P(1 + i)^n.',
        hi: 'साधारण ब्याज: SI = (P × R × T)/100। चक्रवृद्धि मिश्रधन: A = P(1 + i)^n।',
      },
      {
        en: 'Rule of 72: Doubling time ≈ 72 / Rate(%). Effective Rate E = (1 + r/m)^m - 1.',
        hi: '72 का नियम: दोगुना समय ≈ 72 / दर(%)। प्रभावी दर E = (1 + r/m)^m - 1।',
      },
      {
        en: 'Normal Distribution Relations: QD = 0.6745σ ≈ 2/3σ, MD = 0.8σ ≈ 4/5σ; 68.27% within μ±σ, 95.45% within μ±2σ.',
        hi: 'प्रसामान्य बंटन: QD = 0.6745σ, MD = 0.8σ; μ±σ में 68.27% मान आते हैं।',
      },
    ],
    formulasOrRules: [
      {
        title: { en: 'Future Value of Ordinary Annuity', hi: 'सामान्य वार्षिकी का भविष्य मूल्य' },
        detail: {
          en: 'FVA = A × [ ((1 + i)^n - 1) / i ]. Multiply by (1 + i) if Annuity Due (beginning of period).',
          hi: 'FVA = A × [ ((1 + i)^n - 1) / i ]। यदि किस्त अवधि के आरंभ में हो (Annuity Due) तो (1 + i) से गुणा करें।',
        },
      },
      {
        title: { en: 'Fisher Ideal Index & Karl Pearson Empirical Mode', hi: 'फिशर सूचकांक व बहुलक सूत्र' },
        detail: {
          en: 'Fisher Index = √(Laspeyres × Paasche). Empirical Mode = 3 Median - 2 Mean.',
          hi: 'फिशर सूचकांक = √(L × P)। अनुभवजन्य बहुलक = 3 माध्यिका - 2 माध्य।',
        },
      },
    ],
  },
  {
    id: 'note_eco_1',
    paperId: 'paper4',
    chapterTitle: {
      en: 'Ch 2, 4, 6 & 8: Micro & Macro Economics Essentials',
      hi: 'अध्याय 2, 4, 6 व 8: व्यष्टि व समष्टि अर्थशास्त्र सार',
    },
    topicTitle: {
      en: 'Elasticity, Market Equilibria, National Income & RBI Policy',
      hi: 'लोच, बाजार संतुलन, राष्ट्रीय आय व RBI मौद्रिक नीति',
    },
    readTimeMinutes: 6,
    tags: ['Economics Core', 'MCQ Favorite', 'Paper 4'],
    summary: {
      en: 'High-frequency formulas and policy relationships tested across Microeconomics (Chapters 1–5) and Macroeconomics (Chapters 6–10).',
      hi: 'व्यष्टि अर्थशास्त्र (अध्याय 1–5) और समष्टि अर्थशास्त्र (अध्याय 6–10) के सर्वाधिक पूछे जाने वाले सूत्र व सिद्धांत।',
    },
    keyPoints: [
      {
        en: 'If |Ep| > 1 (Elastic): Price & Total Revenue move OPPOSITE. If |Ep| < 1: Same direction.',
        hi: 'लोचदार मांग (|Ep| > 1) में कीमत व कुल आगम विपरीत दिशा में, जबकि बेलोचदार में समान दिशा में चलते हैं।',
      },
      {
        en: 'GDP Deflator = (Nominal GDP / Real GDP) × 100. Investment Multiplier k = 1 / (1 - MPC) = 1 / MPS.',
        hi: 'GDP Deflator = (नाममात्र GDP / वास्तविक GDP) × 100। निवेश गुणक k = 1 / (1 - MPC) = 1 / MPS।',
      },
      {
        en: 'Broad Money M3 = M1 + Net Time Deposits with commercial banks. Repo hikes curb inflation; cuts stimulate growth.',
        hi: 'व्यापक मुद्रा M3 = M1 + बैंकों की सावधि जमा। रेपो दर बढ़ाने से मुद्रास्फीति नियंत्रित होती है।',
      },
    ],
    formulasOrRules: [
      {
        title: { en: 'MR & Elasticity Formula', hi: 'MR व मांग की लोच संबंध' },
        detail: {
          en: 'MR = AR × [(e - 1) / e]. When e = 1, MR = 0 (TR maximum).',
          hi: 'MR = AR × [(e - 1) / e]। जब e = 1 हो तो MR = 0 (कुल आगम अधिकतम)।',
        },
      },
    ],
  },
];
