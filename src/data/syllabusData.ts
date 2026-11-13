import { BilingualText, PaperId, SubjectChapter, SyllabusTopicDetail } from '../types';

export interface CanonicalChapter extends SubjectChapter {
  paperId: PaperId;
  chapterNumber: number;
  title: BilingualText;
  description: BilingualText;
  section: string;
  weightageMarks: string;
  topics: SyllabusTopicDetail[];
}

function topic(id: string, en: string, hi: string, subtopicsEn: string[], subtopicsHi?: string[]): SyllabusTopicDetail {
  return {
    id,
    title: { en, hi },
    subtopics: subtopicsEn.map((s, idx) => ({
      en: s,
      hi: subtopicsHi?.[idx] || s,
    })),
  };
}

export const CANONICAL_SYLLABUS: CanonicalChapter[] = [
  // =========================================================================
  // PAPER 1: ACCOUNTING (11 CHAPTERS - ICAI NEW SCHEME JAN 2027)
  // =========================================================================
  {
    id: 'ch_p1_01',
    paperId: 'paper1',
    chapterNumber: 1,
    section: 'Paper 1: Accounting',
    weightageMarks: '8–12 Marks',
    title: { en: 'Theoretical Framework', hi: 'अध्याय 1: लेखांकन का सैद्धांतिक ढांचा' },
    description: {
      en: 'Meaning & Scope, Concepts/Conventions, Capital & Revenue, Contingent Items, Policies, Measurement, AS & Ind AS',
      hi: 'अर्थ एवं क्षेत्र, लेखांकन सिद्धांत, पूंजी व राजस्व मदें, आकस्मिक देयताएं, नीतियाँ एवं मानक (AS/Ind AS)',
    },
    topics: [
      topic('p1_c1_t1', 'Meaning & Scope of Accounting', 'लेखांकन का अर्थ एवं क्षेत्र', [
        'Book-keeping vs Accounting, Users of financial statements',
        'Qualitative characteristics & Limitations of Accounting',
      ]),
      topic('p1_c1_t2', 'Accounting Concepts, Principles & Conventions', 'लेखांकन अवधारणाएँ एवं परंपराएँ', [
        'Entity, Money Measurement, Periodicity, Accrual, Matching',
        'Going Concern, Cost, Realisation, Conservatism, Materiality, Consistency',
      ]),
      topic('p1_c1_t3', 'Capital & Revenue Expenditures and Receipts', 'पूंजीगत एवं राजस्व व्यय और प्राप्तियाँ', [
        'Criteria for Capital vs Revenue Expenditure & Deferred Revenue Exp.',
        'Capital vs Revenue Receipts treatment in Trading, P&L & Balance Sheet',
      ]),
      topic('p1_c1_t4', 'Contingent Assets & Contingent Liabilities', 'आकस्मिक संपत्तियाँ एवं आकस्मिक देयताएँ', [
        'Provision vs Contingent Liability vs Liability (AS 29 framework)',
        'Disclosure requirements in Notes to Accounts',
      ]),
      topic('p1_c1_t5', 'Accounting Policies, Valuation & Estimates', 'लेखांकन नीतियाँ, मापन एवं अनुमान', [
        'Selection criteria: Prudence, Substance over Form, Materiality',
        'Measurement bases: Historical Cost, Current Cost, Realisable Value, Present Value',
      ]),
      topic('p1_c1_t6', 'Accounting Standards (AS) & Overview of Ind AS', 'लेखांकन मानक (AS) एवं Ind AS का परिचय', [
        'Objectives, Benefits & Standard Setting Process in India',
        'Convergence to IFRS & Ind AS Roadmap overview',
      ]),
    ],
  },
  {
    id: 'ch_p1_02',
    paperId: 'paper1',
    chapterNumber: 2,
    section: 'Paper 1: Accounting',
    weightageMarks: '10–15 Marks',
    title: { en: 'Accounting Process', hi: 'अध्याय 2: लेखांकन प्रक्रिया' },
    description: {
      en: 'Journal Entries, Ledgers, Trial Balance, Subsidiary Books, Cash Book & Rectification of Errors',
      hi: 'रोजनामचा, खाता-बही, तलपट, सहायक बहियाँ, रोकड़ बही एवं अशुद्धियों का सुधार',
    },
    topics: [
      topic('p1_c2_t1', 'Basic Accounting Procedures - Journal Entries', 'रोजनामचा प्रविष्टियाँ एवं डेबिट-क्रेडिट नियम', [
        'Golden Rules & Accounting Equation approach',
        'Compound entries, Opening entries, Trade vs Cash discount',
      ]),
      topic('p1_c2_t2', 'Ledgers & Trial Balance', 'खाता-बही एवं तलपट', [
        'Posting & Balancing of Ledger accounts',
        'Preparation of Trial Balance & Adjusted Trial Balance',
      ]),
      topic('p1_c2_t3', 'Subsidiary Books & Cash Book', 'सहायक बहियाँ एवं रोकड़ बही', [
        'Purchases, Sales, Purchase Return & Sales Return Books',
        'Single, Double & Three-Column Cash Book, Petty Cash Book (Imprest)',
      ]),
      topic('p1_c2_t4', 'Rectification of Errors', 'अशुद्धियों का सुधार', [
        'Errors of Omission, Commission, Principle & Compensating errors',
        'Rectification before Trial Balance, after Trial Balance via Suspense A/c, and next accounting period',
      ]),
    ],
  },
  {
    id: 'ch_p1_03',
    paperId: 'paper1',
    chapterNumber: 3,
    section: 'Paper 1: Accounting',
    weightageMarks: '8–10 Marks',
    title: { en: 'Bank Reconciliation Statement', hi: 'अध्याय 3: बैंक समाधान विवरण (BRS)' },
    description: {
      en: 'Timing differences, Overdraft BRS, and Adjusted Cash Book preparation',
      hi: 'समय अंतराल के कारण, ओवरड्राफ्ट BRS तथा संशोधित रोकड़ बही',
    },
    topics: [
      topic('p1_c3_t1', 'Causes of Difference between Cash Book & Pass Book', 'रोकड़ बही व पासबुक में अंतर के कारण', [
        'Cheques issued not presented vs deposited not cleared',
        'Direct bank credits, standing instructions, dishonoured cheques',
      ]),
      topic('p1_c3_t2', 'BRS Preparation & Adjusted Cash Book', 'BRS निर्माण एवं संशोधित रोकड़ बही', [
        'Favourable and Overdraft starting balances',
        'Reconciliation after adjusting omissions/errors in Cash Book',
      ]),
    ],
  },
  {
    id: 'ch_p1_04',
    paperId: 'paper1',
    chapterNumber: 4,
    section: 'Paper 1: Accounting',
    weightageMarks: '6–10 Marks',
    title: { en: 'Inventories', hi: 'अध्याय 4: स्टॉक (इन्वेंटरी) मूल्यांकन' },
    description: {
      en: 'AS 2 Valuation, Cost vs NRV, FIFO, LIFO, Weighted Average & Inventory Taking',
      hi: 'AS 2 के अंतर्गत लागत बनाम शुद्ध वसूली मूल्य, FIFO, भारित औसत एवं स्टॉक मिलान',
    },
    topics: [
      topic('p1_c4_t1', 'Basis of Inventory Valuation (AS 2)', 'इन्वेंटरी मूल्यांकन के सिद्धांत (AS 2)', [
        'Lower of Cost and Net Realisable Value (NRV)',
        'Costs included vs excluded (abnormal waste, storage, admin)',
      ]),
      topic('p1_c4_t2', 'Cost Formulas & Stock Taking Reconciliation', 'लागत विधियाँ एवं स्टॉक मिलान', [
        'FIFO, LIFO, Simple & Weighted Average, Retail Price method',
        'Reconciliation of physical stock taken before/after balance sheet date',
      ]),
    ],
  },
  {
    id: 'ch_p1_05',
    paperId: 'paper1',
    chapterNumber: 5,
    section: 'Paper 1: Accounting',
    weightageMarks: '8–10 Marks',
    title: { en: 'Depreciation and Amortisation', hi: 'अध्याय 5: मूल्यह्रास एवं परिशोधन' },
    description: {
      en: 'SLM, WDV, Sum of Years Digits, Machine Hour, Change in Method & Amortisation of Intangibles',
      hi: 'सीधी रेखा, क्रमागत शेष विधि, विधि परिवर्तन, मशीन प्रति घंटा दर एवं अमूर्त संपत्ति परिशोधन',
    },
    topics: [
      topic('p1_c5_t1', 'Methods of Depreciation & Disposal of Assets', 'मूल्यह्रास की विधियाँ एवं संपत्ति विक्रय', [
        'Straight Line Method (SLM), Written Down Value (WDV), Units of Production',
        'Provision for Depreciation Account & Asset Disposal Account',
      ]),
      topic('p1_c5_t2', 'Change in Method, Useful Life & Amortisation', 'विधि/अवधि परिवर्तन एवं अमूर्त संपत्ति', [
        'Prospective accounting for change in depreciation method / useful life (AS 10)',
        'Amortisation of Intangible Assets (Patents, Copyrights, Goodwill)',
      ]),
    ],
  },
  {
    id: 'ch_p1_06',
    paperId: 'paper1',
    chapterNumber: 6,
    section: 'Paper 1: Accounting',
    weightageMarks: '8–12 Marks',
    title: { en: 'Bills of Exchange and Promissory Notes', hi: 'अध्याय 6: विनिमय विपत्र एवं प्रतिज्ञा-पत्र' },
    description: {
      en: 'Trade & Accommodation Bills, Discounting, Endorsement, Renewal, Dishonour & Insolvency',
      hi: 'व्यापारिक व सहायतार्थ विपत्र, भुनाना, बेचान, नवीनीकरण, अनादरण एवं दिवालियापन',
    },
    topics: [
      topic('p1_c6_t1', 'Accounting for Trade Bills', 'व्यापारिक विपत्रों का लेखांकन', [
        'Maturity date calculation (Public vs Emergency holidays)',
        'Retaining, Discounting with Bank, Endorsement, Sent for Collection',
      ]),
      topic('p1_c6_t2', 'Dishonour, Renewal, Retirement & Accommodation Bills', 'अनादरण, नवीनीकरण व सहायतार्थ विपत्र', [
        'Noting charges, Interest on renewal, Rebate on retirement',
        'Accommodation bills & Insolvency of Drawee accounting entries',
      ]),
    ],
  },
  {
    id: 'ch_p1_07',
    paperId: 'paper1',
    chapterNumber: 7,
    section: 'Paper 1: Accounting',
    weightageMarks: '12–16 Marks',
    title: { en: 'Preparation of Final Accounts of Sole Proprietors', hi: 'अध्याय 7: एकल स्वामित्व के अंतिम खाते' },
    description: {
      en: 'Non-Manufacturing & Manufacturing Entities: Trading, P&L, Balance Sheet & Year-end Adjustments',
      hi: 'निर्माणी एवं गैर-निर्माणी संस्थाओं के व्यापार खाता, लाभ-हानि खाता, चिट्ठा एवं समायोजन',
    },
    topics: [
      topic('p1_c7_t1', 'Final Accounts of Non-Manufacturing Entities', 'गैर-निर्माणी संस्थाओं के अंतिम खाते', [
        'Trading Account, Profit & Loss Account, Marshalling of Balance Sheet',
        'Closing entries & Adjustments (Outstanding, Prepaid, RDD, Abnormal Loss, Goods on Approval)',
      ]),
      topic('p1_c7_t2', 'Final Accounts of Manufacturing Entities', 'निर्माणी संस्थाओं के अंतिम खाते', [
        'Raw Materials consumed, Work-in-Progress (WIP), Factory Overheads',
        'Cost of Goods Manufactured transfer to Trading Account',
      ]),
    ],
  },
  {
    id: 'ch_p1_08',
    paperId: 'paper1',
    chapterNumber: 8,
    section: 'Paper 1: Accounting',
    weightageMarks: '10–12 Marks',
    title: { en: 'Financial Statements of Not-for-Profit Organisations', hi: 'अध्याय 8: गैर-लाभकारी संस्थाओं (NPO) के वित्तीय विवरण' },
    description: {
      en: 'Receipts & Payments A/c, Income & Expenditure A/c, Fund-based Accounting & Subscription Adjustments',
      hi: 'प्राप्ति एवं भुगतान खाता, आय-व्यय खाता, कोष-आधारित लेखांकन एवं चंदा समायोजन',
    },
    topics: [
      topic('p1_c8_t1', 'Receipts & Payments vs Income & Expenditure Account', 'प्राप्ति एवं भुगतान बनाम आय-व्यय खाता', [
        'Accrual adjustments for Subscription, Salaries, Consumables (Stationery/Medicines)',
        'Capital vs Revenue items (Entrance Fees, Legacy, Life Membership, Donations)',
      ]),
      topic('p1_c8_t2', 'Fund-Based Accounting & Educational Institutions', 'कोष-आधारित लेखांकन व शिक्षण संस्थान', [
        'Tournament Fund, Building Fund, Prize Fund & Opening Capital Fund calculation',
      ]),
    ],
  },
  {
    id: 'ch_p1_09',
    paperId: 'paper1',
    chapterNumber: 9,
    section: 'Paper 1: Accounting',
    weightageMarks: '8–12 Marks',
    title: { en: 'Accounts from Incomplete Records', hi: 'अध्याय 9: अपूर्ण अभिलेखों से खाते (Single Entry)' },
    description: {
      en: 'Statement of Affairs Method and Conversion into Double Entry Final Accounts',
      hi: 'स्थिति विवरण विधि एवं दोहरा लेखा प्रणाली में रूपांतरण',
    },
    topics: [
      topic('p1_c9_t1', 'Statement of Affairs (Net Worth) Method', 'स्थिति विवरण विधि', [
        'Ascertainment of Opening & Closing Capital',
        'Profit computation adjusting Drawings & Fresh Capital',
      ]),
      topic('p1_c9_t2', 'Conversion Method into Double Entry', 'दोहरा लेखा में रूपांतरण विधि', [
        'Total Debtors, Total Creditors, Bills Receivable & Bills Payable A/c',
        'Cash/Bank summary reconstruction for missing sales or purchases',
      ]),
    ],
  },
  {
    id: 'ch_p1_10',
    paperId: 'paper1',
    chapterNumber: 10,
    section: 'Paper 1: Accounting',
    weightageMarks: '15–20 Marks',
    title: { en: 'Partnership and LLP Accounts', hi: 'अध्याय 10: साझेदारी एवं LLP लेखांकन' },
    description: {
      en: 'Fundamentals, Goodwill, Admission, Retirement, Death of Partner & Dissolution of Partnership Firm (incl. LLP basics)',
      hi: 'मूल बातें, ख्याति, प्रवेश, अवकाश, मृत्यु एवं साझेदारी फर्म का विघटन (LLP सहित)',
    },
    topics: [
      topic('p1_c10_t1', 'Introduction to Partnership & LLP Accounts', 'साझेदारी व LLP के मूल सिद्धांत', [
        'P&L Appropriation A/c, Interest on Capital/Drawings, Past Adjustments, Guarantee of Profit',
        'Features & Accounting distinctions of Limited Liability Partnership (LLP)',
      ]),
      topic('p1_c10_t2', 'Treatment & Valuation of Goodwill', 'ख्याति का मूल्यांकन एवं समायोजन', [
        'Average Profit, Super Profit, Capitalisation & Annuity Methods',
      ]),
      topic('p1_c10_t3', 'Admission, Retirement & Death of a Partner', 'प्रवेश, सेवानिवृत्ति एवं मृत्यु पर लेखांकन', [
        'Sacrificing/Gaining Ratio, Revaluation A/c, Hidden Goodwill',
        'Joint Life Policy (JLP), Section 37 share of profit & Executor Loan Account',
      ]),
      topic('p1_c10_t4', 'Dissolution of Partnership Firms', 'साझेदारी फर्म का विघटन', [
        'Realisation Account, Settlement under Garner vs Murray rule',
        'Piecemeal distribution (Proportionate Capital & Maximum Loss Method)',
      ]),
    ],
  },
  {
    id: 'ch_p1_11',
    paperId: 'paper1',
    chapterNumber: 11,
    section: 'Paper 1: Accounting',
    weightageMarks: '15–20 Marks',
    title: { en: 'Company Accounts', hi: 'अध्याय 11: कंपनी खाते' },
    description: {
      en: 'Issue/Forfeiture/Reissue of Shares, Debentures, Bonus & Right Issue, Redemption of Preference Shares & Debentures',
      hi: 'अंशों का निर्गमन, हरण व पुनर्निर्गमन, ऋणपत्र, बोनस व अधिकार अंश, पूर्वाधिकार अंश व ऋणपत्र शोधन',
    },
    topics: [
      topic('p1_c11_t1', 'Issue, Forfeiture & Re-issue of Shares', 'अंशों का निर्गमन, हरण एवं पुनर्निर्गमन', [
        'Calls-in-Arrears, Calls-in-Advance, Pro-rata Allotment & Oversubscription',
        'Forfeiture of shares issued at par/premium & Capital Reserve computation',
      ]),
      topic('p1_c11_t2', 'Issue of Debentures', 'ऋणपत्रों (Debentures) का निर्गमन', [
        'Issue for Cash, Consideration other than Cash, Collateral Security',
        'Terms of Redemption & Writing off Discount/Loss on Issue',
      ]),
      topic('p1_c11_t3', 'Accounting for Bonus Issue & Right Issue', 'बोनस अंश एवं अधिकार अंश', [
        'SEBI/Companies Act Sec 63 Sources for Bonus Issue & Sec 62 Right Issue value of right',
      ]),
      topic('p1_c11_t4', 'Redemption of Preference Shares & Debentures', 'पूर्वाधिकार अंशों व ऋणपत्रों का शोधन', [
        'Companies Act Sec 55 CRR creation & fresh issue computation',
        'Debenture Redemption Reserve (DRR), DRRI (15%), Open Market Purchase & Sinking Fund',
      ]),
    ],
  },

  // =========================================================================
  // PAPER 2: BUSINESS LAWS (7 CHAPTERS - ICAI NEW SCHEME JAN 2027)
  // =========================================================================
  {
    id: 'ch_p2_01',
    paperId: 'paper2',
    chapterNumber: 1,
    section: 'Paper 2: Business Laws',
    weightageMarks: '5–8 Marks',
    title: { en: 'Indian Regulatory Framework', hi: 'अध्याय 1: भारतीय नियामक ढांचा' },
    description: {
      en: 'Sources of Law, Parliamentary Law-making Process, Regulators (MCA, SEBI, RBI, IBBI) & Court Structure',
      hi: 'कानून के स्रोत, संसद में कानून निर्माण प्रक्रिया, नियामक संस्थाएं (MCA, SEBI, RBI, IBBI) व न्यायिक ढांचा',
    },
    topics: [
      topic('p2_c1_t1', 'What is Law & Sources of Indian Law', 'कानून क्या है व भारतीय कानून के स्रोत', [
        'Criminal vs Civil Law, Constitution of India & Statutory Law',
        'Process of making a Bill an Act in Parliament',
      ]),
      topic('p2_c1_t2', 'Major Regulatory Bodies & Judicial Hierarchy', 'प्रमुख नियामक संस्थाएं एवं न्यायालय पदानुक्रम', [
        'Role of Ministry of Finance, MCA, SEBI, RBI, IBBI',
        'Supreme Court, High Courts, District & Magistrate Courts',
      ]),
    ],
  },
  {
    id: 'ch_p2_02',
    paperId: 'paper2',
    chapterNumber: 2,
    section: 'Paper 2: Business Laws',
    weightageMarks: '25–30 Marks',
    title: { en: 'The Indian Contract Act, 1872', hi: 'अध्याय 2: भारतीय अनुबंध अधिनियम, 1872' },
    description: {
      en: 'All 9 Units: Contract Nature, Consideration, Capacity/Consent, Void Agreements, Performance, Breach, Contingent, Quasi-Contracts, Indemnity/Guarantee, Bailment/Pledge & Agency',
      hi: 'सभी 9 इकाइयाँ: प्रस्ताव/स्वीकृति, प्रतिफल, क्षमता व सहमति, व्यर्थ ठहराव, निष्पादन, भंग, आकस्मिक व अर्ध-अनुबंध, क्षतिपूर्ति/गारंटी, निक्षेप/गिरवी व एजेंसी',
    },
    topics: [
      topic('p2_c2_t1', 'Nature of Contracts, Offer, Acceptance & Consideration', 'अनुबंध की प्रकृति, प्रस्ताव, स्वीकृति व प्रतिफल', [
        'Essentials u/s 10, Communication & Revocation of Offer/Acceptance',
        'Privity of Contract & Exceptions u/s 25 (Agreement without consideration)',
      ]),
      topic('p2_c2_t2', 'Competency, Free Consent & Void Agreements', 'पक्षकारों की क्षमता, स्वतंत्र सहमति व व्यर्थ ठहराव', [
        'Minor agreements (Mohori Bibee), Coercion, Undue Influence, Fraud, Misrepresentation',
        'Agreements in restraint of trade/legal proceedings, Wagering agreements (Sec 24-30)',
      ]),
      topic('p2_c2_t3', 'Performance, Discharge, Breach, Contingent & Quasi-Contracts', 'निष्पादन, समाप्ति, भंग, आकस्मिक व अर्ध-अनुबंध', [
        'Appropriation of payments (Sec 59-61), Supervening impossibility (Sec 56)',
        'Liquidated Damages vs Penalty (Sec 73-74), Hadley v. Baxendale, Quasi-Contracts (Sec 68-72)',
      ]),
      topic('p2_c2_t4', 'Indemnity, Guarantee, Bailment, Pledge & Agency', 'क्षतिपूर्ति, गारंटी, निक्षेप, गिरवी एवं एजेंसी', [
        'Surety liability co-extensive & discharge (Sec 124-147)',
        'Rights/Duties of Bailor/Bailee, Finder of goods, Pawnor/Pawnee (Sec 148-181)',
        'Creation & Termination of Agency, Ratification, Sub-agent vs Substituted Agent (Sec 182-238)',
      ]),
    ],
  },
  {
    id: 'ch_p2_03',
    paperId: 'paper2',
    chapterNumber: 3,
    section: 'Paper 2: Business Laws',
    weightageMarks: '15–20 Marks',
    title: { en: 'The Sale of Goods Act, 1930', hi: 'अध्याय 3: माल विक्रय अधिनियम, 1930' },
    description: {
      en: 'Formation of Contract of Sale, Conditions & Warranties, Transfer of Ownership, Unpaid Seller & Auction Sale',
      hi: 'विक्रय अनुबंध, शर्तें व आश्वासन, स्वामित्व हस्तांतरण, अदत्त विक्रेता के अधिकार व नीलामी विक्रय',
    },
    topics: [
      topic('p2_c3_t1', 'Formation of Contract of Sale', 'विक्रय अनुबंध का निर्माण', [
        'Sale vs Agreement to Sell, Types of Goods (Existing, Future, Contingent)',
        'Ascertainment of Price & Destruction of goods (Sec 7-10)',
      ]),
      topic('p2_c3_t2', 'Conditions, Warranties & Caveat Emptor', 'शर्तें, आश्वासन एवं क्रेता सावधान सिद्धांत', [
        'Implied Conditions & Warranties (Sec 14-17)',
        'Doctrine of Caveat Emptor & its 8 exceptions',
      ]),
      topic('p2_c3_t3', 'Transfer of Ownership & Delivery (Nemo Dat)', 'स्वामित्व अंतरण एवं सुपुर्दगी', [
        'Passing of property in Specific, Unascertained & Sale on Approval goods',
        'Nemo Dat Quod Non Habet & its statutory exceptions (Sec 27-30)',
      ]),
      topic('p2_c3_t4', 'Unpaid Seller & Auction Sales', 'अदत्त विक्रेता के अधिकार एवं नीलामी विक्रय', [
        'Right of Lien, Stoppage in Transit, Resale & Suit for Price (Sec 45-61)',
        'Rules of Auction Sale & Knock-out agreements (Sec 64)',
      ]),
    ],
  },
  {
    id: 'ch_p2_04',
    paperId: 'paper2',
    chapterNumber: 4,
    section: 'Paper 2: Business Laws',
    weightageMarks: '12–16 Marks',
    title: { en: 'The Indian Partnership Act, 1932', hi: 'अध्याय 4: भारतीय साझेदारी अधिनियम, 1932' },
    description: {
      en: 'General Nature of Partnership, Relations of Partners, Implied Authority, Minor Admission, Registration & Dissolution',
      hi: 'साझेदारी की प्रकृति, आपसी संबंध, विवक्षित प्राधिकार, अवयस्क का प्रवेश, पंजीकरण व विघटन',
    },
    topics: [
      topic('p2_c4_t1', 'General Nature of Partnership & Types of Partners', 'साझेदारी की प्रकृति व साझेदारों के प्रकार', [
        'True test of partnership: Mutual Agency (Sec 6), Partnership vs HUF/Company',
        'Active, Sleeping, Nominal, Partner by Estoppel/Holding out (Sec 28)',
      ]),
      topic('p2_c4_t2', 'Relations of Partners & Third Parties', 'साझेदारों के परस्पर एवं बाहरी संबंध', [
        'Implied Authority (Sec 19) & statutory restrictions, Admission of Minor (Sec 30)',
      ]),
      topic('p2_c4_t3', 'Registration & Dissolution of Firm', 'फर्म का पंजीकरण एवं विघटन', [
        'Consequences of non-registration (Sec 69) & exceptions',
        'Modes of Dissolution with/without Court intervention (Sec 39-44)',
      ]),
    ],
  },
  {
    id: 'ch_p2_05',
    paperId: 'paper2',
    chapterNumber: 5,
    section: 'Paper 2: Business Laws',
    weightageMarks: '6–10 Marks',
    title: { en: 'The Limited Liability Partnership Act, 2008', hi: 'अध्याय 5: सीमित देयता साझेदारी अधिनियम, 2008' },
    description: {
      en: 'Nature of LLP, Designated Partners, Incorporation Document, Extent of Liability & Conversion',
      hi: 'LLP की विशेषताएं, नामित साझेदार, निगमन प्रक्रिया, सीमित देयता व रूपांतरण',
    },
    topics: [
      topic('p2_c5_t1', 'Characteristics, Partners & Incorporation', 'LLP विशेषताएं, साझेदार एवं निगमन', [
        'Body Corporate, Perpetual Succession, Designated Partners (DPIN)',
        'Incorporation via FiLLiP & LLP Agreement filing',
      ]),
      topic('p2_c5_t2', 'Liability, Whistleblowing & Winding Up', 'देयता की सीमा एवं समापन', [
        'Unlimited liability in case of fraud (Sec 30), Financial Disclosures, Partnership vs LLP vs Company',
      ]),
    ],
  },
  {
    id: 'ch_p2_06',
    paperId: 'paper2',
    chapterNumber: 6,
    section: 'Paper 2: Business Laws',
    weightageMarks: '15–20 Marks',
    title: { en: 'The Companies Act, 2013', hi: 'अध्याय 6: कंपनी अधिनियम, 2013' },
    description: {
      en: 'Corporate Veil & Lifting, Types of Companies (OPC/Small/Sec 8), MOA, AOA, Ultra Vires, Constructive Notice & Indoor Management',
      hi: 'निगमित आवरण, कंपनियों के प्रकार (OPC/लघु/धारा 8), पार्षद सीमा नियम, अंतर्नियम, अधिकारतीत व आंतरिक प्रबंध सिद्धांत',
    },
    topics: [
      topic('p2_c6_t1', 'Essential Features & Lifting of Corporate Veil', 'कंपनी की विशेषताएं व निगमित आवरण उठाना', [
        'Salomon v. Salomon & Co., Judicial & Statutory exceptions to Corporate Veil',
      ]),
      topic('p2_c6_t2', 'Classification of Companies', 'कंपनियों का वर्गीकरण', [
        'Private, Public, OPC, Small Company, Holding/Subsidiary, Associate, Section 8, Government, Dormant',
      ]),
      topic('p2_c6_t3', 'MOA, AOA & Legal Doctrines', 'MOA, AOA एवं प्रमुख कानूनी सिद्धांत', [
        'Doctrine of Ultra Vires (Ashbury Railway), Constructive Notice, Indoor Management (Turquand rule)',
      ]),
    ],
  },
  {
    id: 'ch_p2_07',
    paperId: 'paper2',
    chapterNumber: 7,
    section: 'Paper 2: Business Laws',
    weightageMarks: '10–14 Marks',
    title: { en: 'The Negotiable Instruments Act, 1881', hi: 'अध्याय 7: परक्राम्य लिखत अधिनियम, 1881' },
    description: {
      en: 'Promissory Notes, Bills of Exchange, Cheques, Holder vs Holder in Due Course, Negotiation, Crossing & Section 138 Dishonour',
      hi: 'प्रतिज्ञा-पत्र, विनिमय विपत्र, चेक, धारक व यथाविधि धारक, बेचान, रेखांकन एवं धारा 138 अनादरण',
    },
    topics: [
      topic('p2_c7_t1', 'Characteristics & Classification of Instruments', 'परक्राम्य लिखतों के लक्षण व प्रकार', [
        'Promissory Note (Sec 4), Bill of Exchange (Sec 5), Cheque (Sec 6)',
        'Bearer vs Order, Inland vs Foreign, Ambiguous & Inchoate Instruments',
      ]),
      topic('p2_c7_t2', 'Holder, Holder in Due Course, Crossing & Dishonour', 'धारक, रेखांकन एवं चेक अनादरण (Sec 138)', [
        'Privileges of Holder in Due Course (Sec 9), General/Special/A/c Payee Crossing',
        'Dishonour of Cheque for insufficiency of funds (Sec 138-142 timelines & penalties)',
      ]),
    ],
  },

  // =========================================================================
  // PAPER 3: QUANTITATIVE APTITUDE (18 CHAPTERS - ICAI NEW SCHEME JAN 2027)
  // Part A: Business Mathematics (Ch 1–8)
  // Part B: Logical Reasoning (Ch 9–12)
  // Part C: Statistics (Ch 13–18)
  // =========================================================================
  {
    id: 'ch_p3_01',
    paperId: 'paper3',
    chapterNumber: 1,
    section: 'Part A: Business Mathematics',
    weightageMarks: '4–6 Marks',
    title: { en: 'Ratio and Proportion, Indices and Logarithms', hi: 'अध्याय 1: अनुपात, समानुपात, घातांक एवं लघुगणक' },
    description: {
      en: 'Inverse/Compound Ratio, Componendo-Dividendo, Laws of Indices & Laws of Logarithms',
      hi: 'अनुपात नियम, समानुपात गुणधर्म, घातांक के नियम एवं लघुगणक के नियम',
    },
    topics: [
      topic('p3_c1_t1', 'Ratio & Proportion Properties', 'अनुपात एवं समानुपात गुणधर्म', [
        'Duplicate, Sub-duplicate, Triplicate, Continued Proportion, Componendo & Dividendo',
      ]),
      topic('p3_c1_t2', 'Laws of Indices & Logarithms', 'घातांक एवं लघुगणक नियम', [
        'Product, Quotient, Power & Base-change laws of Logarithms',
      ]),
    ],
  },
  {
    id: 'ch_p3_02',
    paperId: 'paper3',
    chapterNumber: 2,
    section: 'Part A: Business Mathematics',
    weightageMarks: '4–5 Marks',
    title: { en: 'Equations', hi: 'अध्याय 2: समीकरण (Equations)' },
    description: {
      en: 'Linear Equations in 2–3 Variables, Quadratic Equations, Nature of Roots & Cubic Equations',
      hi: 'रैखिक समीकरण, द्विघात समीकरण, मूलों की प्रकृति एवं त्रिघात समीकरण',
    },
    topics: [
      topic('p3_c2_t1', 'Linear & Simultaneous Equations', 'रैखिक एवं युगपत समीकरण', [
        'Cross multiplication & Elimination applications',
      ]),
      topic('p3_c2_t2', 'Quadratic & Cubic Equations', 'द्विघात एवं त्रिघात समीकरण', [
        'Sum & Product of roots, Discriminant (b² - 4ac), Remainder Theorem',
      ]),
    ],
  },
  {
    id: 'ch_p3_03',
    paperId: 'paper3',
    chapterNumber: 3,
    section: 'Part A: Business Mathematics',
    weightageMarks: '2–4 Marks',
    title: { en: 'Linear Inequalities', hi: 'अध्याय 3: रैखिक असमिकाएँ (Linear Inequalities)' },
    description: {
      en: 'Linear Inequalities in One and Two Variables, Feasible Region & Optimal Solution Graphs',
      hi: 'एक व दो चर की रैखिक असमिकाएँ, सुसंगत क्षेत्र एवं ग्राफीय हल',
    },
    topics: [
      topic('p3_c3_t1', 'Algebraic & Graphical Solution of Linear Inequalities', 'रैखिक असमिकाओं का बीजीय व ग्राफीय हल', [
        'Sign reversal rule on negative multiplication & Common feasible region shading',
      ]),
    ],
  },
  {
    id: 'ch_p3_04',
    paperId: 'paper3',
    chapterNumber: 4,
    section: 'Part A: Business Mathematics',
    weightageMarks: '12–16 Marks',
    title: { en: 'Mathematics of Finance (Time Value of Money)', hi: 'अध्याय 4: वित्त गणित (मुद्रा का समय मूल्य)' },
    description: {
      en: 'Simple & Compound Interest, Effective Rate, Annuity Regular/Due, Sinking Fund, Perpetuity, CAGR & NPV',
      hi: 'साधारण व चक्रवृद्धि ब्याज, प्रभावी दर, वार्षिकी, सिंकिंग फंड, शाश्वत वार्षिकी, CAGR व NPV',
    },
    topics: [
      topic('p3_c4_t1', 'Simple Interest, Compound Interest & Effective Rate', 'साधारण व चक्रवृद्धि ब्याज एवं प्रभावी दर', [
        'Compounding frequencies (Annual, Semi-Annual, Quarterly, Monthly, Continuous)',
        'Depreciation & Nominal vs Effective Rate equivalence',
      ]),
      topic('p3_c4_t2', 'Annuities, Perpetuity, Sinking Fund & Valuation', 'वार्षिकी, शाश्वत वार्षिकी व निवेश मूल्यांकन', [
        'Future & Present Value of Annuity Regular vs Annuity Due, Deferred Annuity',
        'Loan Amortisation (EMI), Bond Valuation, Net Present Value (NPV) & CAGR',
      ]),
    ],
  },
  {
    id: 'ch_p3_05',
    paperId: 'paper3',
    chapterNumber: 5,
    section: 'Part A: Business Mathematics',
    weightageMarks: '4–6 Marks',
    title: { en: 'Basic Concepts of Permutations and Combinations', hi: 'अध्याय 5: क्रमचय और संचय (Permutations & Combinations)' },
    description: {
      en: 'Factorial Notation, nPr with/without repetition, Circular Permutations & nCr Pascal Identities',
      hi: 'फैक्टोरियल, क्रमचय, वृत्तीय क्रमचय एवं संचय के अनुप्रयोग',
    },
    topics: [
      topic('p3_c5_t1', 'Fundamental Counting Principle & Permutations', 'गणना सिद्धांत एवं क्रमचय', [
        'Restricted arrangements (vowels together/never together), Circular permutations',
      ]),
      topic('p3_c5_t2', 'Combinations & Complementary Identities', 'संचय एवं महत्वपूर्ण सर्वसमिकाएँ', [
        'nCr = nC(n-r), nCr + nC(r-1) = (n+1)Cr, Committee selection & Geometry diagonals',
      ]),
    ],
  },
  {
    id: 'ch_p3_06',
    paperId: 'paper3',
    chapterNumber: 6,
    section: 'Part A: Business Mathematics',
    weightageMarks: '4–6 Marks',
    title: { en: 'Sequence and Series (AP & GP)', hi: 'अध्याय 6: अनुक्रम एवं श्रेणी (AP और GP)' },
    description: {
      en: 'Arithmetic Progression (AP), Geometric Progression (GP), Infinite GP, AM & GM Relationship',
      hi: 'समांतर श्रेणी (AP), गुणोत्तर श्रेणी (GP), अनंत श्रेणी एवं माध्य संबंध',
    },
    topics: [
      topic('p3_c6_t1', 'Arithmetic Progression & Geometric Progression', 'समांतर व गुणोत्तर श्रेणी', [
        'nth term & Sum of n terms of AP and GP, Sum of Infinite GP (|r| < 1)',
        'Special Series (Σn, Σn², Σn³) & Arithmetic/Geometric Means',
      ]),
    ],
  },
  {
    id: 'ch_p3_07',
    paperId: 'paper3',
    chapterNumber: 7,
    section: 'Part A: Business Mathematics',
    weightageMarks: '4–5 Marks',
    title: { en: 'Sets, Relations and Functions, Limits and Continuity', hi: 'अध्याय 7: समुच्चय, संबंध, फलन, सीमा एवं सांतत्य' },
    description: {
      en: 'Venn Diagrams, Types of Relations, Injective/Bijective/Inverse Functions, Limits & Continuity',
      hi: 'वेन आरेख, संबंधों के प्रकार, प्रतिलोम फलन, सीमाएं एवं सांतत्य',
    },
    topics: [
      topic('p3_c7_t1', 'Sets, Cartesian Product, Relations & Functions', 'समुच्चय, संबंध एवं फलन', [
        'De Morgan Laws, n(A∪B∪C), Reflexive/Symmetric/Transitive relations, One-One/Onto/Composite functions',
      ]),
      topic('p3_c7_t2', 'Limits & Continuity Intuitive Approach', 'सीमा (Limits) एवं सांतत्य (Continuity)', [
        'Standard exponential/algebraic limits & conditions for continuity at a point',
      ]),
    ],
  },
  {
    id: 'ch_p3_08',
    paperId: 'paper3',
    chapterNumber: 8,
    section: 'Part A: Business Mathematics',
    weightageMarks: '4–5 Marks',
    title: { en: 'Basic Applications of Differential and Integral Calculus', hi: 'अध्याय 8: अवकलन और समाकलन के मूल अनुप्रयोग' },
    description: {
      en: 'Differentiation Rules, Maxima/Minima, Marginal Cost/Revenue & Definite/Indefinite Integration',
      hi: 'अवकलन के नियम, उच्चिष्ठ व निम्निष्ठ, सीमांत लागत/आगम एवं समाकलन',
    },
    topics: [
      topic('p3_c8_t1', 'Differential Calculus & Business Maxima/Minima', 'अवकलन एवं व्यावसायिक अनुप्रयोग', [
        'Chain, Product, Quotient rules; Marginal Cost, Marginal Revenue & Profit maximisation',
      ]),
      topic('p3_c8_t2', 'Integral Calculus (Excluding Trigonometric Functions)', 'समाकलन (त्रिकोणमितीय रहित)', [
        'Integration by Substitution & Parts; Finding Total Cost/Revenue from Marginal functions & Definite Integrals',
      ]),
    ],
  },
  {
    id: 'ch_p3_09',
    paperId: 'paper3',
    chapterNumber: 9,
    section: 'Part B: Logical Reasoning',
    weightageMarks: '4–6 Marks',
    title: { en: 'Number Series, Coding and Decoding and Odd Man Out', hi: 'अध्याय 9: संख्या श्रेणी, कोडिंग-डिकोडिंग व विषम पद' },
    description: {
      en: 'Arithmetic/Geometric/Alternating Series, Letter-Number Coding & Classification',
      hi: 'संख्या श्रृंखला नियम, अक्षर-संख्या कोडिंग तथा विजातीय पद की पहचान',
    },
    topics: [
      topic('p3_c9_t1', 'Number Series, Letter Coding & Odd One Out', 'संख्या श्रृंखला, कोडिंग व वर्गीकरण', [
        'Difference/Square/Cube/Prime patterns, Forward-backward alphabet shifting',
      ]),
    ],
  },
  {
    id: 'ch_p3_10',
    paperId: 'paper3',
    chapterNumber: 10,
    section: 'Part B: Logical Reasoning',
    weightageMarks: '4–6 Marks',
    title: { en: 'Direction Sense Tests', hi: 'अध्याय 10: दिशा ज्ञान परीक्षण (Direction Sense)' },
    description: {
      en: 'Cardinal/Ordinal Directions, Angle Turns, Shadows at Sunrise/Sunset & Pythagoras Displacement',
      hi: 'दिशा व कोण मोड़, सूर्योदय-सूर्यास्त परछाई तथा न्यूनतम दूरी (पाइथागोरस)',
    },
    topics: [
      topic('p3_c10_t1', 'Turns, Shadows & Shortest Distance Calculations', 'मोड़, परछाई एवं न्यूनतम दूरी गणना', [
        'Clockwise/Anticlockwise rotations, Morning/Evening shadow direction rules',
      ]),
    ],
  },
  {
    id: 'ch_p3_11',
    paperId: 'paper3',
    chapterNumber: 11,
    section: 'Part B: Logical Reasoning',
    weightageMarks: '5–6 Marks',
    title: { en: 'Seating Arrangements', hi: 'अध्याय 11: बैठक व्यवस्था (Seating Arrangements)' },
    description: {
      en: 'Linear Single/Double Row, Circular Inward/Outward & Rectangular Puzzles',
      hi: 'रेखीय, दोहरी पंक्ति, वृत्ताकार (केंद्रोन्मुख/बहिर्मुख) बैठक पहेलियाँ',
    },
    topics: [
      topic('p3_c11_t1', 'Linear & Circular Seating Logic', 'रेखीय एवं वृत्ताकार बैठक तर्क', [
        'Left/Right relative positioning facing North/South or Centre/Outside',
      ]),
    ],
  },
  {
    id: 'ch_p3_12',
    paperId: 'paper3',
    chapterNumber: 12,
    section: 'Part B: Logical Reasoning',
    weightageMarks: '4–6 Marks',
    title: { en: 'Blood Relations', hi: 'अध्याय 12: रक्त संबंध (Blood Relations)' },
    description: {
      en: 'Family Tree Diagrams, Pointing-to-Photo Questions & Coded Relation Symbols',
      hi: 'पारिवारिक वृक्ष आरेख, तस्वीर संकेतक प्रश्न एवं प्रतीक आधारित रक्त संबंध',
    },
    topics: [
      topic('p3_c12_t1', 'Generation Tree & Coded Blood Relations', 'वंशावली आरेख व संकेतित संबंध', [
        'Generational levels (+1/-1), Maternal vs Paternal ties & Gender determination traps',
      ]),
    ],
  },
  {
    id: 'ch_p3_13',
    paperId: 'paper3',
    chapterNumber: 13,
    section: 'Part C: Statistics',
    weightageMarks: '5–7 Marks',
    title: { en: 'Unit I: Statistical Description of Data & Unit II: Sampling', hi: 'अध्याय 13: आँकड़ों का सांख्यिकीय वर्णन एवं प्रतिचयन' },
    description: {
      en: 'Primary/Secondary Data, Graphical Presentation (Histogram, Ogive, Pie) & Probability/Non-Probability Sampling',
      hi: 'प्राथमिक/द्वितीयक आँकड़े, आवृत्ति वक्र व ओजाइव तथा यादृच्छिक/स्तरीकृत प्रतिचयन',
    },
    topics: [
      topic('p3_c13_t1', 'Statistical Description & Graphical Methods', 'आँकड़ों का वर्गीकरण व ग्राफ', [
        'Histogram (Mode), Ogive (Median/Quartiles), Frequency Polygon, Inclusive vs Exclusive class boundaries',
      ]),
      topic('p3_c13_t2', 'Sampling Theory & Standard Error', 'प्रतिचयन सिद्धांत एवं मानक त्रुटि', [
        'Simple Random, Stratified, Systematic, Cluster Sampling; Sampling vs Non-Sampling errors',
      ]),
    ],
  },
  {
    id: 'ch_p3_14',
    paperId: 'paper3',
    chapterNumber: 14,
    section: 'Part C: Statistics',
    weightageMarks: '10–14 Marks',
    title: { en: 'Measures of Central Tendency and Dispersion', hi: 'अध्याय 14: केंद्रीय प्रवृत्ति एवं विक्षेपण के माप' },
    description: {
      en: 'AM, GM, HM, Median, Mode, Partition Values, Range, QD, MD, SD, Variance & Coefficient of Variation',
      hi: 'समांतर/गुणोत्तर/हरात्मक माध्य, माध्यिका, बहुलक, चतुर्थक, प्रमाप विचलन व विचरण गुणांक',
    },
    topics: [
      topic('p3_c14_t1', 'Measures of Central Tendency & Partition Values', 'केंद्रीय प्रवृत्ति व विभाजन मूल्य', [
        'AM ≥ GM ≥ HM, Mode = 3 Median - 2 Mean, Quartiles, Deciles, Percentiles',
      ]),
      topic('p3_c14_t2', 'Measures of Dispersion & Scale/Origin Properties', 'विक्षेपण माप एवं मूल/पैमाना गुणधर्म', [
        'SD invariant to origin, scaled by |b|; Variance, CV = (SD/Mean)×100, Combined SD formula',
      ]),
    ],
  },
  {
    id: 'ch_p3_15',
    paperId: 'paper3',
    chapterNumber: 15,
    section: 'Part C: Statistics',
    weightageMarks: '6–8 Marks',
    title: { en: 'Probability', hi: 'अध्याय 15: प्रायिकता (Probability)' },
    description: {
      en: 'Addition & Multiplication Theorems, Conditional Probability, Bayes Theorem, Random Variable & Expectation',
      hi: 'योग व गुणन प्रमेय, सप्रतिबंध प्रायिकता, बेयस प्रमेय एवं गणितीय प्रत्याशा',
    },
    topics: [
      topic('p3_c15_t1', 'Addition, Conditional & Bayes Theorem', 'योग, सप्रतिबंध एवं बेयस प्रमेय', [
        'Mutually Exclusive vs Independent events, P(A|B) & Posterior probabilities',
      ]),
      topic('p3_c15_t2', 'Expected Value & Variance of Random Variable', 'यादृच्छिक चर की प्रत्याशा एवं प्रसरण', [
        'E(X) = Σx·p(x), Var(X) = E(X²) - [E(X)]²',
      ]),
    ],
  },
  {
    id: 'ch_p3_16',
    paperId: 'paper3',
    chapterNumber: 16,
    section: 'Part C: Statistics',
    weightageMarks: '5–8 Marks',
    title: { en: 'Theoretical Distributions', hi: 'अध्याय 16: सैद्धांतिक बंटन (Binomial, Poisson, Normal)' },
    description: {
      en: 'Binomial Distribution, Poisson Distribution & Normal Distribution Properties',
      hi: 'द्विपद बंटन, पॉइसन बंटन एवं प्रसामान्य (Normal) बंटन के गुणधर्म',
    },
    topics: [
      topic('p3_c16_t1', 'Binomial & Poisson Distributions', 'द्विपद एवं पॉइसन बंटन', [
        'Binomial Mean=np, Var=npq (Mean > Var); Poisson Mean=Var=m, Unimodal/Bimodal criteria',
      ]),
      topic('p3_c16_t2', 'Normal Distribution & Standard Normal Variate', 'प्रसामान्य बंटन एवं मानक Z-मान', [
        'Bell-shaped symmetry (Mean=Median=Mode), Points of inflexion μ ± σ, QD = 0.6745σ, MD = 0.8σ',
      ]),
    ],
  },
  {
    id: 'ch_p3_17',
    paperId: 'paper3',
    chapterNumber: 17,
    section: 'Part C: Statistics',
    weightageMarks: '6–8 Marks',
    title: { en: 'Correlation and Regression', hi: 'अध्याय 17: सहसंबंध एवं प्रतीपगमन' },
    description: {
      en: 'Karl Pearson r, Spearman Rank Correlation, Concurrent Deviation, Regression Lines & Coeff. of Determination',
      hi: 'कार्ल पियर्सन व स्पीयरमैन सहसंबंध, प्रतीपगमन रेखाएँ एवं निश्चयन गुणांक (r²)',
    },
    topics: [
      topic('p3_c17_t1', 'Karl Pearson & Spearman Rank Correlation', 'कार्ल पियर्सन व कोटि सहसंबंध', [
        '-1 ≤ r ≤ +1, Invariance under linear shift/positive scale, Tied ranks correction',
      ]),
      topic('p3_c17_t2', 'Regression Lines & Coefficient Identities', 'प्रतीपगमन रेखाएँ एवं गुणांक संबंध', [
        'r = ±√(byx × bxy), Both regression lines intersect at (x̄, ȳ), Identical sign rule',
      ]),
    ],
  },
  {
    id: 'ch_p3_18',
    paperId: 'paper3',
    chapterNumber: 18,
    section: 'Part C: Statistics',
    weightageMarks: '4–6 Marks',
    title: { en: 'Index Numbers', hi: 'अध्याय 18: सूचकांक (Index Numbers)' },
    description: {
      en: 'Laspeyres, Paasche, Bowley, Fisher Ideal Index, Time/Factor Reversal Tests & Deflating/Splicing',
      hi: 'लैस्पेयर्स, पाशे, फिशर आदर्श सूचकांक, समय व तत्व उत्क्राम्यता परीक्षण एवं आधार परिवर्तन',
    },
    topics: [
      topic('p3_c18_t1', 'Weighted Price & Quantity Index Numbers', 'भारित मूल्य एवं मात्रा सूचकांक', [
        'Laspeyres (base qty), Paasche (current qty), Fisher = √(L × P)',
      ]),
      topic('p3_c18_t2', 'Adequacy Tests, Chain Base & Cost of Living Index', 'सूचकांक परीक्षण एवं जीवन निर्वाह सूचकांक', [
        'Time Reversal & Factor Reversal Tests (satisfied only by Fisher Ideal Index), Real Wages & Dearness Allowance',
      ]),
    ],
  },

  // =========================================================================
  // PAPER 4: BUSINESS ECONOMICS (10 CHAPTERS - ICAI NEW SCHEME JAN 2027)
  // =========================================================================
  {
    id: 'ch_p4_01',
    paperId: 'paper4',
    chapterNumber: 1,
    section: 'Paper 4: Business Economics',
    weightageMarks: '6–8 Marks',
    title: { en: 'Nature and Scope of Business Economics', hi: 'अध्याय 1: व्यावसायिक अर्थशास्त्र की प्रकृति एवं क्षेत्र' },
    description: {
      en: 'Micro vs Macro Economics, Central Economic Problems & Capitalist/Socialist/Mixed Economies',
      hi: 'व्यष्टि बनाम समष्टि अर्थशास्त्र, केंद्रीय आर्थिक समस्याएं तथा पूंजीवादी, समाजवादी व मिश्रित अर्थव्यवस्था',
    },
    topics: [
      topic('p4_c1_t1', 'Nature & Scope of Business Economics', 'व्यावसायिक अर्थशास्त्र का अर्थ व क्षेत्र', [
        'Positive vs Normative science, Interdisciplinary & Pragmatic nature',
      ]),
      topic('p4_c1_t2', 'Central Economic Problems & Economic Systems', 'केंद्रीय आर्थिक समस्याएं व प्रणालियाँ', [
        'What/How/For Whom to produce, Price Mechanism vs Central Planning vs Mixed Economy',
      ]),
    ],
  },
  {
    id: 'ch_p4_02',
    paperId: 'paper4',
    chapterNumber: 2,
    section: 'Paper 4: Business Economics',
    weightageMarks: '12–15 Marks',
    title: { en: 'Theory of Demand and Supply', hi: 'अध्याय 2: मांग एवं पूर्ति का सिद्धांत' },
    description: {
      en: 'Law of Demand, Price/Income/Cross Elasticity, Utility/Indifference Curve Analysis & Supply Elasticity',
      hi: 'मांग का नियम, कीमत/आय/तिर्यक लोच, उपयोगिता व तटस्थता वक्र तथा पूर्ति की लोच',
    },
    topics: [
      topic('p4_c2_t1', 'Determinants of Demand & Elasticities', 'मांग के निर्धारक एवं मांग की लोच', [
        'Expansion/Contraction vs Increase/Decrease, Giffen & Veblen goods',
        'Point, Arc, Total Outlay, Income & Cross Elasticity (Substitutes vs Complements)',
      ]),
      topic('p4_c2_t2', 'Consumer Behaviour: Utility & Indifference Curves', 'उपभोक्ता व्यवहार: उपयोगिता व तटस्थता वक्र', [
        'Law of Diminishing Marginal Utility, Consumer Surplus (Marshall), Budget Line & MRS',
      ]),
      topic('p4_c2_t3', 'Supply Analysis & Market Equilibrium', 'पूर्ति विश्लेषण एवं बाजार संतुलन', [
        'Law of Supply, Supply Elasticity, Simultaneous shifts in Demand & Supply',
      ]),
    ],
  },
  {
    id: 'ch_p4_03',
    paperId: 'paper4',
    chapterNumber: 3,
    section: 'Paper 4: Business Economics',
    weightageMarks: '10–12 Marks',
    title: { en: 'Theory of Production and Cost', hi: 'अध्याय 3: उत्पादन एवं लागत का सिद्धांत' },
    description: {
      en: 'Law of Variable Proportions, Returns to Scale, Isoquants & Short-Run/Long-Run Cost Curves',
      hi: 'परिवर्तनशील अनुपात नियम, पैमाने के प्रतिफल, सम-उत्पाद वक्र तथा अल्पकालीन व दीर्घकालीन लागत वक्र',
    },
    topics: [
      topic('p4_c3_t1', 'Production Function & Returns to Factor/Scale', 'उत्पादन फलन एवं प्रतिफल के नियम', [
        'TP, AP, MP stages (Stage II rational zone), Increasing/Constant/Decreasing Returns to Scale',
        'Cobb-Douglas function & Isoquants (MRTS)',
      ]),
      topic('p4_c3_t2', 'Cost Concepts & Short-Run / Long-Run Cost Curves', 'लागत अवधारणाएं एवं लागत वक्र', [
        'Explicit/Implicit/Opportunity/Sunk Cost, AFC (rectangular hyperbola), U-shaped AVC/ATC/MC, LAC Envelope Curve',
      ]),
    ],
  },
  {
    id: 'ch_p4_04',
    paperId: 'paper4',
    chapterNumber: 4,
    section: 'Paper 4: Business Economics',
    weightageMarks: '12–15 Marks',
    title: { en: 'Price Determination in Different Markets', hi: 'अध्याय 4: विभिन्न बाजारों में कीमत निर्धारण' },
    description: {
      en: 'Perfect Competition, Monopoly & Price Discrimination, Monopolistic Competition & Oligopoly (Sweezy Model)',
      hi: 'पूर्ण प्रतियोगिता, एकाधिकार व कीमत विभेद, एकाधिकारात्मक प्रतियोगिता एवं अल्पाधिकार',
    },
    topics: [
      topic('p4_c4_t1', 'Meaning, Revenue Concepts & Equilibrium', 'बाजार, आगम व संतुलन शर्तें', [
        'TR, AR, MR curves; Profit maximisation (MC = MR & MC rising), Shut-down point (AR < AVC)',
      ]),
      topic('p4_c4_t2', 'Market Structures Comparison', 'बाजार संरचनाओं की तुलना', [
        'Perfect Competition (Price taker), Monopoly (Price discrimination degrees), Monopolistic (Excess capacity), Oligopoly (Kinked Demand Curve)',
      ]),
    ],
  },
  {
    id: 'ch_p4_05',
    paperId: 'paper4',
    chapterNumber: 5,
    section: 'Paper 4: Business Economics',
    weightageMarks: '6–8 Marks',
    title: { en: 'Business Cycles', hi: 'अध्याय 5: व्यापार चक्र (Business Cycles)' },
    description: {
      en: 'Phases (Expansion, Peak, Contraction, Trough), Leading/Coincident/Lagging Indicators & Theories',
      hi: 'व्यापार चक्र की अवस्थाएं, अग्रणी/समवर्ती/पश्चगामी संकेतक एवं प्रमुख सिद्धांत',
    },
    topics: [
      topic('p4_c5_t1', 'Phases, Indicators & Causes of Business Cycles', 'व्यापार चक्र की अवस्थाएं, संकेतक व कारण', [
        'Expansion, Peak, Contraction/Recession, Trough/Depression',
        'Leading, Coincident & Lagging economic indicators; Hawtrey, Keynes, Schumpeter & Cobweb models',
      ]),
    ],
  },
  {
    id: 'ch_p4_06',
    paperId: 'paper4',
    chapterNumber: 6,
    section: 'Paper 4: Business Economics',
    weightageMarks: '12–15 Marks',
    title: { en: 'Determination of National Income', hi: 'अध्याय 6: राष्ट्रीय आय का निर्धारण' },
    description: {
      en: 'GDP/GNP Aggregates, Factor Cost vs Market Price, Three Measurement Methods & Keynesian Multiplier',
      hi: 'GDP/GNP अवधारणाएं, राष्ट्रीय आय मापन की तीन विधियाँ एवं कीन्सीयन गुणक (Multiplier)',
    },
    topics: [
      topic('p4_c6_t1', 'National Income Accounting Aggregates', 'राष्ट्रीय आय लेखांकन समुच्चय', [
        'GDP vs GNP, Market Price vs Factor Cost, NFIA, Nominal vs Real GDP, GDP Deflator',
        'Value Added (Product), Income & Expenditure Methods',
      ]),
      topic('p4_c6_t2', 'Keynesian Theory of Income Determination', 'आय निर्धारण का कीन्सीयन सिद्धांत', [
        'Consumption function (MPC + MPS = 1), Investment Multiplier k = 1/(1-MPC), 2/3/4-sector Circular Flow',
      ]),
    ],
  },
  {
    id: 'ch_p4_07',
    paperId: 'paper4',
    chapterNumber: 7,
    section: 'Paper 4: Business Economics',
    weightageMarks: '8–10 Marks',
    title: { en: 'Public Finance', hi: 'अध्याय 7: लोक वित्त (Public Finance)' },
    description: {
      en: 'Fiscal Functions (Musgrave), Market Failure & Externalities, Public Goods, Fiscal Policy & Union Budget Deficits',
      hi: 'राजकोषीय कार्य, बाजार विफलता व बाह्यताएं, सार्वजनिक वस्तुएं, राजकोषीय नीति व बजट घाटे',
    },
    topics: [
      topic('p4_c7_t1', 'Fiscal Functions, Market Failure & Government Intervention', 'राजकोषीय कार्य व बाजार विफलता', [
        'Allocation, Redistribution & Stabilisation (Musgrave); Public vs Private Goods, Merit Goods, Asymmetric Info',
      ]),
      topic('p4_c7_t2', 'Budget Process, Deficits & Fiscal Policy', 'केंद्रीय बजट, घाटे के प्रकार व राजकोषीय नीति', [
        'Revenue Deficit, Fiscal Deficit, Primary Deficit, Pump Priming & Crowding-out effect',
      ]),
    ],
  },
  {
    id: 'ch_p4_08',
    paperId: 'paper4',
    chapterNumber: 8,
    section: 'Paper 4: Business Economics',
    weightageMarks: '8–12 Marks',
    title: { en: 'Money Market', hi: 'अध्याय 8: मुद्रा बाजार (Money Market)' },
    description: {
      en: 'Concept & Demand for Money (Fisher, Cambridge, Keynes), Money Supply (M1–M4), Money Multiplier & RBI Monetary Policy',
      hi: 'मुद्रा की मांग (कीन्स व फिशर), मुद्रा पूर्ति (M1–M4), मुद्रा गुणक एवं RBI मौद्रिक नीति',
    },
    topics: [
      topic('p4_c8_t1', 'Concept & Theories of Demand for Money', 'मुद्रा की अवधारणा व मांग सिद्धांत', [
        'Quantity Theory of Money (MV = PT), Keynesian Transaction/Precautionary/Speculative motives & Liquidity Trap',
      ]),
      topic('p4_c8_t2', 'Money Supply & RBI Monetary Policy Framework', 'मुद्रा पूर्ति एवं RBI की मौद्रिक नीति', [
        'Reserve Money (M0), M1, M2, M3, M4; Money Multiplier; Repo, Reverse Repo, SDF, CRR, SLR, OMO, MPC Inflation Targeting',
      ]),
    ],
  },
  {
    id: 'ch_p4_09',
    paperId: 'paper4',
    chapterNumber: 9,
    section: 'Paper 4: Business Economics',
    weightageMarks: '8–10 Marks',
    title: { en: 'International Trade', hi: 'अध्याय 9: अंतर्राष्ट्रीय व्यापार' },
    description: {
      en: 'Trade Theories (Adam Smith, Ricardo, Heckscher-Ohlin), Tariffs/Non-Tariffs, WTO, Exchange Rates & FDI/FPI',
      hi: 'व्यापार सिद्धांत, प्रशुल्क व गैर-प्रशुल्क बाधाएं, WTO, विनिमय दर निर्धारण एवं FDI/FPI',
    },
    topics: [
      topic('p4_c9_t1', 'Theories & Instruments of Trade Policy', 'अंतर्राष्ट्रीय व्यापार सिद्धांत व नीतियाँ', [
        'Absolute vs Comparative Advantage, Opportunity Cost, New Trade Theory',
        'Tariffs (Ad Valorem/Specific/Anti-dumping), Quotas & WTO principles',
      ]),
      topic('p4_c9_t2', 'Exchange Rate & International Capital Movements', 'विनिमय दर एवं अंतर्राष्ट्रीय पूंजी प्रवाह', [
        'Fixed vs Floating Exchange Rates, Appreciation/Depreciation, FDI vs FPI, Balance of Payments',
      ]),
    ],
  },
  {
    id: 'ch_p4_10',
    paperId: 'paper4',
    chapterNumber: 10,
    section: 'Paper 4: Business Economics',
    weightageMarks: '8–10 Marks',
    title: { en: 'Indian Economy', hi: 'अध्याय 10: भारतीय अर्थव्यवस्था' },
    description: {
      en: 'Pre-1991 Era, 1991 LPG Reforms, NITI Aayog, Agriculture, Industry & Services Sector Growth Trends',
      hi: '1991 पूर्व व पश्चात आर्थिक सुधार (LPG), नीति आयोग, कृषि, उद्योग एवं सेवा क्षेत्र',
    },
    topics: [
      topic('p4_c10_t1', 'Evolution & 1991 Economic Reforms (LPG)', 'भारतीय अर्थव्यवस्था का विकास व 1991 सुधार', [
        'Mixed Economy Planning, Liberalisation, Privatisation, Globalisation & NITI Aayog role',
      ]),
      topic('p4_c10_t2', 'Sectoral Performance: Agriculture, Industry & Services', 'कृषि, उद्योग एवं सेवा क्षेत्र की स्थिति', [
        'Green Revolution, Make in India, PLI schemes, MSMEs & Services contribution to GDP/Exports',
      ]),
    ],
  },
];

export function getCanonicalChaptersByPaper(paperId: PaperId): CanonicalChapter[] {
  return CANONICAL_SYLLABUS.filter(ch => ch.paperId === paperId);
}

export function getCanonicalChapterById(chapterId: string): CanonicalChapter | undefined {
  return CANONICAL_SYLLABUS.find(ch => ch.id === chapterId);
}

export function toSubjectChapters(questionCountMap?: Record<string, number>): SubjectChapter[] {
  return CANONICAL_SYLLABUS.map(ch => ({
    id: ch.id,
    paperId: ch.paperId,
    chapterNumber: ch.chapterNumber,
    title: ch.title,
    description: ch.description,
    section: ch.section,
    weightageMarks: ch.weightageMarks,
    topics: ch.topics,
    questionCount: questionCountMap ? (questionCountMap[ch.id] ?? 0) : 0,
  }));
}
