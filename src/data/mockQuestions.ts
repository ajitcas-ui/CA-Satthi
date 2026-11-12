import { MCQQuestion } from '../types';

export const MOCK_QUESTIONS: MCQQuestion[] = [
  // =========================================================================
  // SECTION 1: PAPER 1 - ACCOUNTING
  // =========================================================================

  // --- ICAI Module Questions ---
  {
    id: 'icai_mod_p1_01',
    paperId: 'paper1',
    chapterId: 'ch_p1_01',
    chapterTitle: {
      en: 'Chapter 1: Theoretical Framework of Accounting',
      hi: 'अध्याय 1: लेखांकन का सैद्धांतिक ढांचा',
    },
    difficulty: 'medium',
    question: {
      en: 'Freight charges paid on the purchase of a new machinery to bring it to the factory site should be classified as:',
      hi: 'नई मशीनरी को फैक्ट्री तक लाने के लिए चुकाया गया भाड़ा (Freight) किस प्रकार का व्यय माना जाएगा?',
    },
    options: {
      en: [
        'Revenue Expenditure (Charged to P&L)',
        'Capital Expenditure (Added to Machinery cost)',
        'Deferred Revenue Expenditure',
        'Direct Selling Expense',
      ],
      hi: [
        'राजस्व व्यय (लाभ-हानि खाते में नामे)',
        'पूंजीगत व्यय (मशीनरी की लागत में जोड़ा जाएगा)',
        'आस्थगित राजस्व व्यय',
        'प्रत्यक्ष विक्रय व्यय',
      ],
    },
    correctIndex: 1,
    explanation: {
      en: 'According to ICAI Study Material (Unit 4 - Capital and Revenue Expenditures), all expenditures incurred up to the point the asset is installed and put to its intended use (including carriage inwards, transit insurance, and installation) are capital expenditures and added to the cost of the asset.',
      hi: 'आईसीएआई अध्ययन सामग्री (इकाई 4 - पूंजीगत एवं राजस्व व्यय) के अनुसार किसी संपत्ति को स्थापित करने तथा प्रयोग में लाने तक किए गए समस्त अनिवार्य व्यय (आवक भाड़ा, बीमा, स्थापना शुल्क) पूंजीगत व्यय होते हैं और संपत्ति की लागत में जोड़े जाते हैं।',
    },
    keyRule: {
      en: 'ICAI Accounting Concept: Capital Expenditure increases earning capacity or readies an asset for operation.',
      hi: 'आईसीएआई लेखांकन सिद्धांत: पूंजीगत व्यय संपत्ति को कार्यशील बनाने हेतु अनिवार्य लागत है।',
    },
    sourceType: 'ICAI_MODULE',
    sourceLabel: {
      en: 'ICAI Study Material (New Scheme) - Paper 1, Chapter 1 Unit 4, Test Your Knowledge Q2',
      hi: 'आईसीएआई अध्ययन सामग्री (नवीन योजना) - पेपर 1, अध्याय 1 इकाई 4, टेस्ट योर नॉलेज प्रश्न 2',
    },
    examAttempt: 'Module Edition 2024-25',
    examYear: 2024,
    officialQuestionRef: 'ICAI-MOD-P1-CH1-U4-TYK2',
    officialSourceLink: 'https://www.icai.org/post/foundation-course-study-material-new-scheme',
  },
  {
    id: 'icai_mod_p1_02',
    paperId: 'paper1',
    chapterId: 'ch_p1_03',
    chapterTitle: {
      en: 'Chapter 3: Bank Reconciliation Statement (BRS)',
      hi: 'अध्याय 3: बैंक समाधान विवरण (BRS)',
    },
    difficulty: 'medium',
    question: {
      en: 'While preparing a Bank Reconciliation Statement starting with Cash Book favorable balance (debit balance), cheques issued by the business but not yet presented for payment at the bank should be:',
      hi: 'रोकड़ बही (Cash Book) के अनुकूल नामे शेष (Debit Balance) से बैंक समाधान विवरण बनाते समय, जारी किए गए किंतु बैंक में भुगतान हेतु प्रस्तुत न हुए चेक का क्या करेंगे?',
    },
    options: {
      en: [
        'Deducted from Cash Book balance',
        'Added to Cash Book balance',
        'Ignored completely in BRS',
        'Debited to Profit & Loss Account',
      ],
      hi: [
        'रोकड़ बही शेष में से घटाया जाएगा',
        'रोकड़ बही शेष में जोड़ा जाएगा',
        'BRS में पूरी तरह अनदेखा किया जाएगा',
        'लाभ-हानि खाते में नामे लिखा जाएगा',
      ],
    },
    correctIndex: 1,
    explanation: {
      en: 'As per ICAI Study Material (Chapter 3 - BRS), when cheques are issued, the bank column of the Cash Book is immediately credited (reduced). Since they have not yet been presented to the bank, the Pass Book balance remains higher. To reconcile Cash Book balance to Pass Book balance, the amount is ADDED back.',
      hi: 'आईसीएआई मॉड्यूल (अध्याय 3 - BRS) के अनुसार चेक जारी होते ही रोकड़ बही का बैंक कॉलम जमा (कम) हो जाता है। बैंक में प्रस्तुत न होने से पासबुक का शेष अधिक दिखता है। रोकड़ बही को पासबुक के बराबर लाने के लिए इसे पुनः जोड़ा (Add) जाता है।',
    },
    keyRule: {
      en: 'ICAI BRS Protocol: Starting with Cash Book Dr. -> Add cheques issued but not presented.',
      hi: 'आईसीएआई BRS नियम: रोकड़ बही नामे शेष से प्रारंभ -> जारी चेक जो बैंक नहीं पहुंचे, जोड़े जाते हैं।',
    },
    sourceType: 'ICAI_MODULE',
    sourceLabel: {
      en: 'ICAI Study Material - Paper 1, Chapter 3 (Bank Reconciliation Statement), Test Your Knowledge Q5',
      hi: 'आईसीएआई अध्ययन सामग्री - पेपर 1, अध्याय 3 (बैंक समाधान विवरण), टेस्ट योर नॉलेज प्रश्न 5',
    },
    examAttempt: 'Module Edition 2024-25',
    examYear: 2024,
    officialQuestionRef: 'ICAI-MOD-P1-CH3-TYK5',
    officialSourceLink: 'https://www.icai.org/post/foundation-course-study-material-new-scheme',
  },
  {
    id: 'icai_mod_p1_03',
    paperId: 'paper1',
    chapterId: 'ch_p1_04',
    chapterTitle: {
      en: 'Chapter 4: Inventories Valuation (AS 2)',
      hi: 'अध्याय 4: स्टॉक मूल्यांकन (AS 2)',
    },
    difficulty: 'hard',
    question: {
      en: 'Under Accounting Standard (AS) 2 (Revised), inventories must be valued at the lower of:',
      hi: 'लेखांकन मानक (AS) 2 (संशोधित) के अनुसार स्टॉक का मूल्यांकन किस आधार पर निम्नतम मूल्य पर किया जाना चाहिए?',
    },
    options: {
      en: [
        'Historical Cost and Replacement Cost',
        'Historical Cost and Net Realizable Value (NRV)',
        'Net Realizable Value and Fair Market Value',
        'Standard Cost and Wholesale Market Price',
      ],
      hi: [
        'ऐतिहासिक लागत और प्रतिस्थापन लागत',
        'ऐतिहासिक लागत और शुद्ध वसूली योग्य मूल्य (NRV)',
        'शुद्ध वसूली योग्य मूल्य और उचित बाजार मूल्य',
        'मानक लागत और थोक बाजार मूल्य',
      ],
    },
    correctIndex: 1,
    explanation: {
      en: 'ICAI AS 2 Paragraph 5 mandates: "Inventories shall be valued at the lower of cost and net realizable value." Net realizable value is the estimated selling price in the ordinary course of business less estimated costs of completion and selling expenses.',
      hi: 'आईसीएआई AS 2 के पैरा 5 के अनुसार स्टॉक का मूल्यांकन लागत (Cost) अथवा शुद्ध वसूली योग्य मूल्य (NRV), दोनों में से जो कम हो, पर किया जाता है। यह रूढ़िवादिता (Prudence) के सिद्धांत पर आधारित है।',
    },
    keyRule: {
      en: 'AS 2 Golden Rule: Inventory Valuation = Lower of Cost and Net Realizable Value (NRV).',
      hi: 'AS 2 का स्वर्णिम नियम: स्टॉक मूल्यांकन = लागत अथवा NRV, जो भी कम हो।',
    },
    sourceType: 'ICAI_MODULE',
    sourceLabel: {
      en: 'ICAI Study Material - Paper 1, Chapter 4 (Inventories), Test Your Knowledge Q3',
      hi: 'आईसीएआई अध्ययन सामग्री - पेपर 1, अध्याय 4 (स्टॉक), टेस्ट योर नॉलेज प्रश्न 3',
    },
    examAttempt: 'Module Edition 2024-25',
    examYear: 2024,
    officialQuestionRef: 'ICAI-MOD-P1-CH4-TYK3',
    officialSourceLink: 'https://www.icai.org/post/foundation-course-study-material-new-scheme',
  },
  {
    id: 'icai_mod_p1_04',
    paperId: 'paper1',
    chapterId: 'ch_p1_05',
    chapterTitle: {
      en: 'Chapter 5: Depreciation and Amortisation',
      hi: 'अध्याय 5: मूल्यह्रास एवं परिशोधन',
    },
    difficulty: 'easy',
    question: {
      en: 'Under the Written Down Value (WDV) method of depreciation, the annual depreciation amount:',
      hi: 'घटती शेष पद्धति (WDV Method) के अंतर्गत प्रतिवर्ष मूल्यह्रास की राशि:',
    },
    options: {
      en: [
        'Remains constant every year',
        'Decreases continuously year after year',
        'Increases continuously year after year',
        'Becomes zero after the second year',
      ],
      hi: [
        'प्रत्येक वर्ष स्थिर रहती है',
        'प्रतिवर्ष निरंतर घटती जाती है',
        'प्रतिवर्ष निरंतर बढ़ती जाती है',
        'दूसरे वर्ष के बाद शून्य हो जाती है',
      ],
    },
    correctIndex: 1,
    explanation: {
      en: 'Under WDV (Reducing Balance Method), depreciation is calculated as a fixed percentage on the opening book value of the asset. As the book value diminishes each year, the resulting depreciation amount progressively decreases.',
      hi: 'घटती शेष पद्धति में मूल्यह्रास संपत्ति के प्रारंभिक घटते शेष (Book Value) पर निकाला जाता है। चूंकि पुस्तक मूल्य हर साल घटता है, इसलिए मूल्यह्रास की राशि भी हर साल कम होती जाती है।',
    },
    keyRule: {
      en: 'WDV Property: Annual depreciation decreases over the useful life of the asset.',
      hi: 'WDV नियम: संपत्ति के उपयोगी जीवनकाल में वार्षिक मूल्यह्रास राशि क्रमशः घटती है।',
    },
    sourceType: 'ICAI_MODULE',
    sourceLabel: {
      en: 'ICAI Study Material - Paper 1, Chapter 5 (Depreciation), Test Your Knowledge Q6',
      hi: 'आईसीएआई अध्ययन सामग्री - पेपर 1, अध्याय 5 (मूल्यह्रास), टेस्ट योर नॉलेज प्रश्न 6',
    },
    examAttempt: 'Module Edition 2024-25',
    examYear: 2024,
    officialQuestionRef: 'ICAI-MOD-P1-CH5-TYK6',
    officialSourceLink: 'https://www.icai.org/post/foundation-course-study-material-new-scheme',
  },

  // --- Paper 1 PYQs ---
  {
    id: 'icai_pyq_p1_june2024_01',
    paperId: 'paper1',
    chapterId: 'ch_p1_03',
    chapterTitle: {
      en: 'Bank Reconciliation Statement (BRS)',
      hi: 'बैंक समाधान विवरण (BRS)',
    },
    difficulty: 'medium',
    question: {
      en: 'When starting with Bank Overdraft balance as per Bank Pass Book (Debit balance), direct bank charges debited by the bank but not recorded in the Cash Book should be:',
      hi: 'पासबुक के बैंक अधिविकर्ष (Bank Overdraft) शेष से बैंक समाधान विवरण बनाते समय, बैंक द्वारा काटे गए व्यय जो रोकड़ बही में दर्ज नहीं हुए, उन्हें क्या करेंगे?',
    },
    options: {
      en: [
        'Added to Overdraft as per Pass Book',
        'Deducted from Overdraft as per Pass Book',
        'Transferred to Suspense Account',
        'Ignored since Pass Book balance is already overdraft',
      ],
      hi: [
        'पासबुक अधिविकर्ष में जोड़ा जाएगा',
        'पासबुक अधिविकर्ष से घटाया जाएगा (Deducted)',
        'उचंत (Suspense) खाते में हस्तांतरित किया जाएगा',
        'अनदेखा किया जाएगा क्योंकि पासबुक पहले से अधिविकर्ष है',
      ],
    },
    correctIndex: 1,
    explanation: {
      en: 'CA Foundation June 2024 Official Paper: When starting from Pass Book Overdraft (Dr.) to reach Cash Book Overdraft, bank charges increased the Pass Book overdraft. To bring Pass Book overdraft back in line with Cash Book (which does not have these charges yet), we DEDUCT the bank charges.',
      hi: 'सीए फाउंडेशन जून 2024 आधिकारिक परीक्षा: पासबुक ओवरड्राफ्ट से प्रारंभ करने पर, बैंक व्ययों ने पासबुक के ओवरड्राफ्ट को बढ़ा दिया था। रोकड़ बही के अनुसार ओवरड्राफ्ट तक पहुँचने के लिए इसे घटाया (Deduct) जाएगा।',
    },
    keyRule: {
      en: 'BRS Overdraft Logic: Reverse the normal addition/deduction adjustments when starting from Pass Book Overdraft.',
      hi: 'BRS नियम: पासबुक ओवरड्राफ्ट से शुरू करने पर बैंक शुल्क घटाया जाता है।',
    },
    sourceType: 'PYQ',
    sourceLabel: {
      en: 'CA Foundation Official Exam Question Paper - June 2024, Paper 1 (Accounting), Q2(a)',
      hi: 'सीए फाउंडेशन आधिकारिक परीक्षा प्रश्नपत्र - जून 2024, पेपर 1 (लेखांकन), प्रश्न 2(a)',
    },
    examAttempt: 'June 2024',
    examYear: 2024,
    officialQuestionRef: 'ICAI-PYQ-2024JUNE-P1-Q2A',
    officialSourceLink: 'https://www.icai.org/post/question-papers-foundation-course',
  },
  {
    id: 'icai_pyq_p1_dec2023_01',
    paperId: 'paper1',
    chapterId: 'ch_p1_06',
    chapterTitle: {
      en: 'Bills of Exchange & Promissory Notes',
      hi: 'विनिमय विपत्र एवं प्रतिज्ञा पत्र',
    },
    difficulty: 'medium',
    question: {
      en: 'At the time of dishonour of a bill of exchange, noting charges paid by the holder to the Notary Public are ultimately borne by:',
      hi: 'विनिमय विपत्र के अनादर (Dishonour) पर विपत्र धारक द्वारा नोटरी पब्लिक को चुकाया गया नोटिंग व्यय अंततः किसके द्वारा वहन किया जाता है?',
    },
    options: {
      en: [
        'The Holder of the Bill',
        'The Drawee (Acceptor) of the Bill',
        'The Drawer only',
        'The Endorser unconditionally',
      ],
      hi: [
        'विपत्र धारक (Holder)',
        'विपत्र का स्वीकर्ता / देनदार (Drawee/Acceptor)',
        'केवल विपत्र का लेखक (Drawer)',
        'पृष्ठांकनकर्ता (Endorser)',
      ],
    },
    correctIndex: 1,
    explanation: {
      en: 'CA Foundation Dec 2023 Official Paper: Noting charges are initially disbursed by whoever holds the bill at the time of dishonour. However, because the default was caused by the Drawee (acceptor) who failed to pay on due date, noting charges are ultimately debited to and recoverable from the Drawee.',
      hi: 'सीए फाउंडेशन दिसंबर 2023 आधिकारिक परीक्षा: नोटिंग व्यय तत्कालीन धारक द्वारा दिया जाता है किंतु चूंकि अनादर स्वीकर्ता (Drawee) की चूक के कारण हुआ है, अतः अंततः यह देनदार/स्वीकर्ता द्वारा ही वहन किया जाता है।',
    },
    keyRule: {
      en: 'Bills of Exchange Principle: Drawee is the principal debtor liable for dishonour noting charges.',
      hi: 'विपत्र सिद्धांत: देनदार (स्वीकर्ता) ही अनादर के नोटिंग शुल्क के लिए मुख्य उत्तरदायी होता है।',
    },
    sourceType: 'PYQ',
    sourceLabel: {
      en: 'CA Foundation Official Exam Question Paper - December 2023, Paper 1 (Accounting), Q4(b)',
      hi: 'सीए फाउंडेशन आधिकारिक परीक्षा प्रश्नपत्र - दिसंबर 2023, पेपर 1 (लेखांकन), प्रश्न 4(b)',
    },
    examAttempt: 'Dec 2023',
    examYear: 2023,
    officialQuestionRef: 'ICAI-PYQ-2023DEC-P1-Q4B',
    officialSourceLink: 'https://www.icai.org/post/question-papers-foundation-course',
  },
  {
    id: 'icai_pyq_p1_june2023_01',
    paperId: 'paper1',
    chapterId: 'ch_p1_10',
    chapterTitle: {
      en: 'Partnership Accounts - Admission of Partner',
      hi: 'साझेदारी खाते - नए साझेदार का प्रवेश',
    },
    difficulty: 'hard',
    question: {
      en: 'On admission of a new partner, any existing General Reserve appearing on the liabilities side of the old Balance Sheet is transferred to:',
      hi: 'नए साझेदार के प्रवेश पर पुरानी बैलेंस शीट के दायित्व पक्ष में दर्शाया गया सामान्य संचय (General Reserve) कहाँ हस्तांतरित किया जाता है?',
    },
    options: {
      en: [
        'All Partners’ Capital Accounts in New Profit Sharing Ratio',
        'Old Partners’ Capital Accounts in Old Profit Sharing Ratio',
        'Revaluation Account Credit side',
        'Sacrificing Partners’ Capital Accounts in Sacrificing Ratio',
      ],
      hi: [
        'सभी साझेदारों के पूंजी खाते में नए लाभ विभाजन अनुपात में',
        'पुराने साझेदारों के पूंजी खाते में पुराने लाभ विभाजन अनुपात में',
        'पुनर्मूल्यांकन खाते के जमा पक्ष में',
        'त्याग करने वाले साझेदारों के पूंजी खाते में त्याग अनुपात में',
      ],
    },
    correctIndex: 1,
    explanation: {
      en: 'CA Foundation June 2023 Official Paper: General Reserve represents undistributed past profits accumulated by the old partners prior to the admission of the newcomer. Therefore, it belongs strictly to old partners and must be credited to their capital accounts in the Old Profit Sharing Ratio.',
      hi: 'सीए फाउंडेशन जून 2023 आधिकारिक परीक्षा: सामान्य संचय भूतकाल में पुराने साझेदारों की मेहनत से अर्जित अवितरित लाभ है। नए साझेदार का इसमें कोई अधिकार नहीं होता, अतः यह पुराने साझेदारों के पूंजी खाते में पुराने अनुपात में जमा होता है।',
    },
    keyRule: {
      en: 'Partnership Rule: Accumulated reserves and P&L balances belong to old partners in their old PSR.',
      hi: 'साझेदारी नियम: संचित संचय एवं अवितरित लाभ केवल पुराने साझेदारों में पुराने अनुपात में बांटे जाते हैं।',
    },
    sourceType: 'PYQ',
    sourceLabel: {
      en: 'CA Foundation Official Exam Question Paper - June 2023, Paper 1 (Accounting), Q3(a)',
      hi: 'सीए फाउंडेशन आधिकारिक परीक्षा प्रश्नपत्र - जून 2023, पेपर 1 (लेखांकन), प्रश्न 3(a)',
    },
    examAttempt: 'June 2023',
    examYear: 2023,
    officialQuestionRef: 'ICAI-PYQ-2023JUNE-P1-Q3A',
    officialSourceLink: 'https://www.icai.org/post/question-papers-foundation-course',
  },
  {
    id: 'icai_pyq_p1_dec2022_01',
    paperId: 'paper1',
    chapterId: 'ch_p1_01',
    chapterTitle: {
      en: 'Accounting Principles & Concepts',
      hi: 'लेखांकन सिद्धांत एवं अवधारणाएं',
    },
    difficulty: 'easy',
    question: {
      en: 'Under which accounting concept is the owner treated as a separate distinct creditor of the business for the capital invested?',
      hi: 'किस लेखांकन अवधारणा के अनुसार व्यवसाय के स्वामी को उसके द्वारा लगाई गई पूंजी के लिए व्यवसाय से पृथक लेनदार माना जाता है?',
    },
    options: {
      en: [
        'Business Entity Concept (Separate Legal Entity)',
        'Going Concern Concept',
        'Money Measurement Concept',
        'Matching Principle',
      ],
      hi: [
        'व्यावसायिक इकाई अवधारणा (Business Entity Concept)',
        'चालू व्यवसाय की अवधारणा (Going Concern)',
        'मुद्रा मापन अवधारणा',
        'मिलान की अवधारणा (Matching Principle)',
      ],
    },
    correctIndex: 0,
    explanation: {
      en: 'CA Foundation Dec 2022 Official Paper: The Business Entity Concept dictates that the enterprise is separate and distinct from the person who owns or supplies capital to it. Hence, capital provided by the proprietor is shown as an internal liability in the Balance Sheet.',
      hi: 'सीए फाउंडेशन दिसंबर 2022 आधिकारिक परीक्षा: व्यावसायिक इकाई सिद्धांत के अनुसार व्यापार और उसका स्वामी दो अलग-अलग अस्तित्व रखते हैं। इसी कारण स्वामी द्वारा लाई गई पूंजी को दायित्व (Liability) माना जाता है।',
    },
    keyRule: {
      en: 'ICAI Core Concept: Business is distinct from owners -> Capital is a liability of the business.',
      hi: 'व्यावसायिक इकाई नियम: स्वामी व्यापार से अलग है, अतः पूंजी व्यापार का दायित्व है।',
    },
    sourceType: 'PYQ',
    sourceLabel: {
      en: 'CA Foundation Official Exam Question Paper - December 2022, Paper 1 (Accounting), Q1(a)',
      hi: 'सीए फाउंडेशन आधिकारिक परीक्षा प्रश्नपत्र - दिसंबर 2022, पेपर 1 (लेखांकन), प्रश्न 1(a)',
    },
    examAttempt: 'Dec 2022',
    examYear: 2022,
    officialQuestionRef: 'ICAI-PYQ-2022DEC-P1-Q1A',
    officialSourceLink: 'https://www.icai.org/post/question-papers-foundation-course',
  },

  // =========================================================================
  // SECTION 2: PAPER 2 - BUSINESS LAWS
  // =========================================================================

  // --- ICAI Module Questions ---
  {
    id: 'icai_mod_p2_01',
    paperId: 'paper2',
    chapterId: 'ch_p2_02',
    chapterTitle: {
      en: 'Chapter 2: The Indian Contract Act, 1872',
      hi: 'अध्याय 2: भारतीय अनुबंध अधिनियम, 1872',
    },
    difficulty: 'easy',
    question: {
      en: 'According to Section 2(h) of the Indian Contract Act, 1872, which of the following is the official statutory definition of a "Contract"?',
      hi: 'भारतीय अनुबंध अधिनियम, 1872 की धारा 2(h) के अनुसार "अनुबंध" (Contract) की वैधानिक परिभाषा कौन सी है?',
    },
    options: {
      en: [
        'An agreement enforceable by law',
        'A promise accepted by another person',
        'An agreement entered into by mutual understanding without consideration',
        'A moral agreement between family members',
      ],
      hi: [
        'विधि द्वारा प्रवर्तनीय ठहराव (An agreement enforceable by law)',
        'किसी अन्य व्यक्ति द्वारा स्वीकृत वादा',
        'बिना प्रतिफल के आपसी समझ से किया गया समझौता',
        'पारिवारिक सदस्यों के बीच का नैतिक ठहराव',
      ],
    },
    correctIndex: 0,
    explanation: {
      en: 'Section 2(h) of the Indian Contract Act, 1872 verbatim states: "An agreement enforceable by law is a contract." For an agreement to become a contract, it must fulfill all essential elements of Section 10.',
      hi: 'भारतीय अनुबंध अधिनियम, 1872 की धारा 2(h) के स्पष्ट शब्द हैं: "विधि द्वारा प्रवर्तनीय ठहराव ही अनुबंध है।" जब ठहराव में कानूनी बाध्यता जुड़ती है तभी वह अनुबंध बनता है।',
    },
    keyRule: {
      en: 'Section 2(h): Contract = Agreement + Legal Enforceability.',
      hi: 'धारा 2(h): अनुबंध = ठहराव + विधि द्वारा प्रवर्तनीयता।',
    },
    sourceType: 'ICAI_MODULE',
    sourceLabel: {
      en: 'ICAI Study Material - Paper 2 Business Laws, Chapter 2 Unit 1, Test Your Knowledge Q1',
      hi: 'आईसीएआई अध्ययन सामग्री - पेपर 2 व्यापारिक कानून, अध्याय 2 इकाई 1, टेस्ट योर नॉलेज प्रश्न 1',
    },
    examAttempt: 'Module Edition 2024-25',
    examYear: 2024,
    officialQuestionRef: 'ICAI-MOD-P2-CH2-U1-TYK1',
    officialSourceLink: 'https://www.icai.org/post/foundation-course-study-material-new-scheme',
  },
  {
    id: 'icai_mod_p2_02',
    paperId: 'paper2',
    chapterId: 'ch_p2_03',
    chapterTitle: {
      en: 'Chapter 3: The Sale of Goods Act, 1930',
      hi: 'अध्याय 3: माल विक्रय अधिनियम, 1930',
    },
    difficulty: 'hard',
    question: {
      en: 'Under Section 12(2) of the Sale of Goods Act, 1930, a "Condition" is defined as a stipulation:',
      hi: 'माल विक्रय अधिनियम, 1930 की धारा 12(2) के अंतर्गत "शर्त" (Condition) की क्या परिभाषा दी गई है?',
    },
    options: {
      en: [
        'Collateral to the main purpose of the contract, breach of which gives right to claim damages only',
        'Essential to the main purpose of the contract, breach of which gives right to repudiate the contract and claim damages',
        'Optional for both buyer and seller to fulfill',
        'Stipulated solely by the carrier transporting the goods',
      ],
      hi: [
        'अनुबंध के मुख्य उद्देश्य के लिए संपार्श्विक (Collateral), जिसके उल्लंघन पर केवल हर्जाना मिलता है',
        'अनुबंध के मुख्य उद्देश्य के लिए अनिवार्य (Essential), जिसके उल्लंघन पर अनुबंध रद्द करने व हर्जाना दोनों का अधिकार मिलता है',
        'क्रेता और विक्रेता दोनों के लिए वैकल्पिक',
        'केवल माल परिवहन करने वाले वाहक द्वारा निर्धारित',
      ],
    },
    correctIndex: 1,
    explanation: {
      en: 'Section 12(2) defines a Condition as a stipulation essential to the main purpose of the contract, the breach of which gives rise to a right to treat the contract as repudiated. In contrast, Section 12(3) defines a Warranty as collateral, breach of which only allows claiming damages.',
      hi: 'धारा 12(2) के अनुसार शर्त अनुबंध के मुख्य उद्देश्य के लिए अत्यंत अनिवार्य होती है। इसके टूटने पर पीड़ित पक्षकार अनुबंध समाप्त (निरस्त) कर सकता है और हर्जाने का भी दावा कर सकता है।',
    },
    keyRule: {
      en: 'Sale of Goods Act: Section 12(2) Condition = Essential; Section 12(3) Warranty = Collateral.',
      hi: 'माल विक्रय अधिनियम: धारा 12(2) शर्त = मुख्य उद्देश्य हेतु अनिवार्य; धारा 12(3) आश्वासन = संपार्श्विक।',
    },
    sourceType: 'ICAI_MODULE',
    sourceLabel: {
      en: 'ICAI Study Material - Paper 2, Chapter 3 Unit 2 (Conditions & Warranties), Test Your Knowledge Q3',
      hi: 'आईसीएआई अध्ययन सामग्री - पेपर 2, अध्याय 3 इकाई 2, टेस्ट योर नॉलेज प्रश्न 3',
    },
    examAttempt: 'Module Edition 2024-25',
    examYear: 2024,
    officialQuestionRef: 'ICAI-MOD-P2-CH3-U2-TYK3',
    officialSourceLink: 'https://www.icai.org/post/foundation-course-study-material-new-scheme',
  },
  {
    id: 'icai_mod_p2_03',
    paperId: 'paper2',
    chapterId: 'ch_p2_04',
    chapterTitle: {
      en: 'Chapter 4: The Indian Partnership Act, 1932',
      hi: 'अध्याय 4: भारतीय साझेदारी अधिनियम, 1932',
    },
    difficulty: 'medium',
    question: {
      en: 'Under Section 6 of the Indian Partnership Act, 1932, which of the following is the true, conclusive test of a partnership?',
      hi: 'भारतीय साझेदारी अधिनियम, 1932 की धारा 6 के अनुसार साझेदारी के अस्तित्व की वास्तविक और निर्णायक कसौटी क्या है?',
    },
    options: {
      en: [
        'Sharing of gross receipts',
        'Sharing of net profits',
        'Mutual Agency (Business carried on by all or any of them acting for all)',
        'Joint ownership of property',
      ],
      hi: [
        'सकल प्राप्तियों का बंटवारा',
        'शुद्ध लाभों का बंटवारा',
        'पारस्परिक एजेंसी (Mutual Agency - सभी या किसी एक द्वारा सबके लिए व्यापार संचालन)',
        'संपत्ति का संयुक्त स्वामित्व',
      ],
    },
    correctIndex: 2,
    explanation: {
      en: 'ICAI Study Material (Chapter 4): Section 6 clarifies that sharing of profits is merely prima facie evidence, not conclusive evidence. The true conclusive test established in Cox v. Hickman is Mutual Agency: every partner is both a principal and an agent for all other partners.',
      hi: 'धारा 6 तथा कॉक्स बनाम हिकमैन के ऐतिहासिक मामले के अनुसार केवल लाभ बांटना साझेदारी का निर्णायक प्रमाण नहीं है। वास्तविक कसौटी पारस्परिक एजेंसी (Mutual Agency) है, जहाँ प्रत्येक साझेदार दूसरों का प्रतिनिधि और प्रधान दोनों होता है।',
    },
    keyRule: {
      en: 'Section 6 True Test: Mutual Agency is the cardinal conclusive test of partnership.',
      hi: 'धारा 6 निर्णायक कसौटी: पारस्परिक एजेंसी ही साझेदारी का मुख्य प्रमाण है।',
    },
    sourceType: 'ICAI_MODULE',
    sourceLabel: {
      en: 'ICAI Study Material - Paper 2, Chapter 4 Unit 1, Test Your Knowledge Q5',
      hi: 'आईसीएआई अध्ययन सामग्री - पेपर 2, अध्याय 4 इकाई 1, टेस्ट योर नॉलेज प्रश्न 5',
    },
    examAttempt: 'Module Edition 2024-25',
    examYear: 2024,
    officialQuestionRef: 'ICAI-MOD-P2-CH4-TYK5',
    officialSourceLink: 'https://www.icai.org/post/foundation-course-study-material-new-scheme',
  },
  {
    id: 'icai_mod_p2_04',
    paperId: 'paper2',
    chapterId: 'ch_p2_06',
    chapterTitle: {
      en: 'Chapter 6: The Companies Act, 2013',
      hi: 'अध्याय 6: कंपनी अधिनियम, 2013',
    },
    difficulty: 'hard',
    question: {
      en: 'The "Doctrine of Indoor Management" (Turquand Rule) provides protection to:',
      hi: '"आंतरिक प्रबंधन का सिद्धांत" (Doctrine of Indoor Management या Turquand Rule) किसे सुरक्षा प्रदान करता है?',
    },
    options: {
      en: [
        'The Company against internal frauds by employees',
        'Third parties dealing with the company in good faith against internal irregularities',
        'Directors against shareholder lawsuits',
        'The Registrar of Companies (ROC)',
      ],
      hi: [
        'कर्मचारियों की धोखाधड़ी के विरुद्ध कंपनी को',
        'कंपनी के साथ सद्भावपूर्वक व्यवहार करने वाले बाहरी तीसरे पक्ष को आंतरिक अनियमितताओं से',
        'अंशधारकों के मुकदमों के विरुद्ध निदेशकों को',
        'कंपनी रजिस्ट्रार (ROC) को',
      ],
    },
    correctIndex: 1,
    explanation: {
      en: 'ICAI Study Material: Established in Royal British Bank v. Turquand, outsiders are presumed to know the public documents (MOA & AOA) under Constructive Notice, but they are NOT bound to inquire into whether the company’s internal procedural formalities have been duly complied with.',
      hi: 'रॉयल ब्रिटिश बैंक बनाम टरकंड मामले में स्थापित यह सिद्धांत बाहरी पक्षकारों को सुरक्षा देता है। बाहरी व्यक्ति सार्वजनिक दस्तावेजों की जानकारी रखते हैं, किंतु उन्हें कंपनी के आंतरिक नियमों के अनुपालन की जांच करने की आवश्यकता नहीं होती।',
    },
    keyRule: {
      en: 'Turquand Rule: Protects innocent outsiders against internal irregularities of company management.',
      hi: 'टरकंड नियम: बाहरी पक्षकारों को कंपनी की आंतरिक कमियों से संरक्षण देता है।',
    },
    sourceType: 'ICAI_MODULE',
    sourceLabel: {
      en: 'ICAI Study Material - Paper 2, Chapter 6 (Companies Act), Test Your Knowledge Q8',
      hi: 'आईसीएआई अध्ययन सामग्री - पेपर 2, अध्याय 6 (कंपनी कानून), टेस्ट योर नॉलेज प्रश्न 8',
    },
    examAttempt: 'Module Edition 2024-25',
    examYear: 2024,
    officialQuestionRef: 'ICAI-MOD-P2-CH6-TYK8',
    officialSourceLink: 'https://www.icai.org/post/foundation-course-study-material-new-scheme',
  },

  // --- Paper 2 PYQs ---
  {
    id: 'icai_pyq_p2_june2024_01',
    paperId: 'paper2',
    chapterId: 'ch_p2_02',
    chapterTitle: {
      en: 'The Indian Contract Act - Capacity to Contract',
      hi: 'भारतीय अनुबंध अधिनियम - अनुबंध करने की क्षमता',
    },
    difficulty: 'medium',
    question: {
      en: 'In the landmark case of Mohori Bibee v. Dharmodas Ghose (1903), the Privy Council established that an agreement entered into by a minor is:',
      hi: 'मोहोरी बीबी बनाम धर्मोदास घोष (1903) के ऐतिहासिक मामले में प्रिवी काउंसिल ने निर्णय दिया कि अवयस्क (Minor) द्वारा किया गया ठहराव होता है:',
    },
    options: {
      en: [
        'Voidable at the option of the minor upon attaining majority',
        'Void ab initio (Void from the very beginning)',
        'Valid if confirmed by the minor’s legal guardian',
        'Enforceable if consideration was paid in cash',
      ],
      hi: [
        'वयस्क होने पर अवयस्क के विकल्प पर व्यर्थनीय (Voidable)',
        'प्रारंभ से ही पूर्णतः व्यर्थ (Void ab initio)',
        'वैध यदि अभिभावक द्वारा स्वीकृत किया जाए',
        'प्रवर्तनीय यदि प्रतिफल नकद दिया गया हो',
      ],
    },
    correctIndex: 1,
    explanation: {
      en: 'CA Foundation June 2024 Official Paper: Under Section 11 of the Contract Act, a minor is incompetent to contract. In Mohori Bibee v. Dharmodas Ghose, it was held that any agreement with a minor is void ab initio and no restitution can be demanded under ordinary principles.',
      hi: 'सीए फाउंडेशन जून 2024 आधिकारिक परीक्षा: धारा 11 के अनुसार अवयस्क अनुबंध हेतु अयोग्य है। मोहोरी बीबी बनाम धर्मोदास घोष के मामले में स्पष्ट किया गया कि अवयस्क का ठहराव प्रारंभ से ही शून्य (Void ab initio) होता है।',
    },
    keyRule: {
      en: 'Mohori Bibee Precedent: A minor agreement is void ab initio; no ratification allowed upon attaining majority.',
      hi: 'मोहोरी बीबी नियम: अवयस्क से ठहराव प्रारंभ से व्यर्थ होता है; वयस्क होने पर भी इसका पुष्टिकरण संभव नहीं।',
    },
    sourceType: 'PYQ',
    sourceLabel: {
      en: 'CA Foundation Official Exam Question Paper - June 2024, Paper 2 (Business Laws), Q1(a)',
      hi: 'सीए फाउंडेशन आधिकारिक परीक्षा प्रश्नपत्र - जून 2024, पेपर 2 (व्यापारिक कानून), प्रश्न 1(a)',
    },
    examAttempt: 'June 2024',
    examYear: 2024,
    officialQuestionRef: 'ICAI-PYQ-2024JUNE-P2-Q1A',
    officialSourceLink: 'https://www.icai.org/post/question-papers-foundation-course',
  },
  {
    id: 'icai_pyq_p2_dec2023_01',
    paperId: 'paper2',
    chapterId: 'ch_p2_03',
    chapterTitle: {
      en: 'The Sale of Goods Act - Transfer of Title',
      hi: 'माल विक्रय अधिनियम - स्वामित्व का हस्तांतरण',
    },
    difficulty: 'hard',
    question: {
      en: 'The legal maxim "Nemo dat quod non habet" under Section 27 of the Sale of Goods Act, 1930 fundamentally means:',
      hi: 'माल विक्रय अधिनियम, 1930 की धारा 27 के अंतर्गत कानूनी सूत्र "Nemo dat quod non habet" का मूल अर्थ क्या है?',
    },
    options: {
      en: [
        'Let the buyer beware before purchasing',
        'No one can give or transfer what he does not himself possess (Better title)',
        'An agreement without consideration is void',
        'Conditions and warranties are interchangeable at will',
      ],
      hi: [
        'क्रेता को स्वयं सावधान रहना चाहिए (Caveat Emptor)',
        'कोई भी व्यक्ति उससे बेहतर स्वामित्व नहीं दे सकता जो उसके पास स्वयं नहीं है',
        'बिना प्रतिफल का ठहराव व्यर्थ होता है',
        'शर्तें और आश्वासन आपस में बदले जा सकते हैं',
      ],
    },
    correctIndex: 1,
    explanation: {
      en: 'CA Foundation Dec 2023 Official Paper: Section 27 incorporates the rule "Nemo dat quod non habet": a seller cannot convey a better title to the goods than he himself possesses, subject to recognized exceptions like sale by mercantile agent, estoppel, or joint owners.',
      hi: 'सीए फाउंडेशन दिसंबर 2023 आधिकारिक परीक्षा: धारा 27 का यह सूत्र बताता है कि यदि विक्रेता के पास वैध स्वामित्व नहीं है, तो वह क्रेता को भी वैध स्वामित्व नहीं दे सकता, जब तक कि वह वैधानिक अपवादों में न आता हो।',
    },
    keyRule: {
      en: 'Section 27: Nemo dat quod non habet protects true owners; non-owners cannot convey good title.',
      hi: 'धारा 27: वास्तविक स्वामी का संरक्षण; गैर-स्वामी अच्छा स्वत्व हस्तांतरित नहीं कर सकता।',
    },
    sourceType: 'PYQ',
    sourceLabel: {
      en: 'CA Foundation Official Exam Question Paper - December 2023, Paper 2 (Business Laws), Q2(b)',
      hi: 'सीए फाउंडेशन आधिकारिक परीक्षा प्रश्नपत्र - दिसंबर 2023, पेपर 2 (व्यापारिक कानून), प्रश्न 2(b)',
    },
    examAttempt: 'Dec 2023',
    examYear: 2023,
    officialQuestionRef: 'ICAI-PYQ-2023DEC-P2-Q2B',
    officialSourceLink: 'https://www.icai.org/post/question-papers-foundation-course',
  },
  {
    id: 'icai_pyq_p2_june2023_01',
    paperId: 'paper2',
    chapterId: 'ch_p2_05',
    chapterTitle: {
      en: 'The Limited Liability Partnership Act, 2008',
      hi: 'सीमित दायित्व साझेदारी अधिनियम, 2008',
    },
    difficulty: 'easy',
    question: {
      en: 'Under Section 7 of the Limited Liability Partnership (LLP) Act, 2008, every LLP must have at least how many "Designated Partners", and how many must be resident in India?',
      hi: 'सीमित दायित्व साझेदारी (LLP) अधिनियम, 2008 की धारा 7 के अनुसार प्रत्येक LLP में कम से कम कितने "नामित साझेदार" (Designated Partners) होने चाहिए, और उनमें से कितने भारत के निवासी होने चाहिए?',
    },
    options: {
      en: [
        'At least 2 designated partners, and at least 1 must be resident in India',
        'At least 3 designated partners, and all 3 must be resident in India',
        'At least 1 designated partner only',
        'At least 5 designated partners with no residency restriction',
      ],
      hi: [
        'कम से कम 2 नामित साझेदार, जिनमें से कम से कम 1 भारत का निवासी हो',
        'कम से कम 3 नामित साझेदार, और तीनों भारत के निवासी हों',
        'केवल 1 नामित साझेदार',
        'कम से कम 5 नामित साझेदार बिना किसी निवास प्रतिबंध के',
      ],
    },
    correctIndex: 0,
    explanation: {
      en: 'CA Foundation June 2023 Official Paper: Section 7(1) of the LLP Act states that every LLP shall have at least two designated partners who are individuals, and at least one of them shall be a resident in India (resided in India for not less than 120 days during the financial year).',
      hi: 'सीए फाउंडेशन जून 2023 आधिकारिक परीक्षा: धारा 7(1) के अनुसार प्रत्येक LLP में न्यूनतम 2 नामित साझेदार होने चाहिए और कम से कम एक व्यक्ति भारत का निवासी (वित्तीय वर्ष में कम से कम 120 दिन भारत में रहा हो) होना अनिवार्य है।',
    },
    keyRule: {
      en: 'LLP Act Section 7: Minimum 2 Designated Partners; at least 1 Indian resident.',
      hi: 'LLP धारा 7: न्यूनतम 2 नामित साझेदार; कम से कम 1 भारत में निवासी।',
    },
    sourceType: 'PYQ',
    sourceLabel: {
      en: 'CA Foundation Official Exam Question Paper - June 2023, Paper 2 (Business Laws), Q4(a)',
      hi: 'सीए फाउंडेशन आधिकारिक परीक्षा प्रश्नपत्र - जून 2023, पेपर 2 (व्यापारिक कानून), प्रश्न 4(a)',
    },
    examAttempt: 'June 2023',
    examYear: 2023,
    officialQuestionRef: 'ICAI-PYQ-2023JUNE-P2-Q4A',
    officialSourceLink: 'https://www.icai.org/post/question-papers-foundation-course',
  },
  {
    id: 'icai_pyq_p2_dec2022_01',
    paperId: 'paper2',
    chapterId: 'ch_p2_06',
    chapterTitle: {
      en: 'The Companies Act - Corporate Personality',
      hi: 'कंपनी अधिनियम - निगमित व्यक्तित्व',
    },
    difficulty: 'medium',
    question: {
      en: 'The principle of separate legal existence of a corporate entity was famously laid down in which landmark English case?',
      hi: 'कंपनी के पृथक वैधानिक अस्तित्व (Separate Legal Entity) का ऐतिहासिक सिद्धांत किस प्रसिद्ध वाद में प्रतिपादित किया गया था?',
    },
    options: {
      en: [
        'Salomon v. Salomon & Co. Ltd. (1897)',
        'Carlill v. Carbolic Smoke Ball Co.',
        'Balfour v. Balfour',
        'Hadley v. Baxendale',
      ],
      hi: [
        'सैलोमन बनाम सैलोमन एंड कंपनी लिमिटेड (1897)',
        'कार्लिल बनाम कार्बोलिक स्मोक बॉल कंपनी',
        'बाल्फोर बनाम बाल्फोर',
        'हैडली बनाम बैक्सेंडेल',
      ],
    },
    correctIndex: 0,
    explanation: {
      en: 'CA Foundation Dec 2022 Official Paper: In Salomon v. Salomon & Co. Ltd., the House of Lords firmly established that upon incorporation, a company becomes an independent legal person in the eyes of law, entirely separate from its shareholders, subscribers, and promoters.',
      hi: 'सीए फाउंडेशन दिसंबर 2022 आधिकारिक परीक्षा: सैलोमन बनाम सैलोमन के मामले में हाउस ऑफ लॉर्ड्स ने स्थापित किया कि समामेलन के पश्चात कंपनी अपने सदस्यों, अंशधारकों और प्रवर्तकों से बिल्कुल भिन्न एक स्वतंत्र वैधानिक व्यक्ति बन जाती है।',
    },
    keyRule: {
      en: 'Salomon Principle: An incorporated company is a separate legal person distinct from its members.',
      hi: 'सैलोमन सिद्धांत: समामेलित कंपनी अपने सदस्यों से पूर्णतः पृथक वैधानिक अस्तित्व रखती है।',
    },
    sourceType: 'PYQ',
    sourceLabel: {
      en: 'CA Foundation Official Exam Question Paper - December 2022, Paper 2 (Business Laws), Q5(a)',
      hi: 'सीए फाउंडेशन आधिकारिक परीक्षा प्रश्नपत्र - दिसंबर 2022, पेपर 2 (व्यापारिक कानून), प्रश्न 5(a)',
    },
    examAttempt: 'Dec 2022',
    examYear: 2022,
    officialQuestionRef: 'ICAI-PYQ-2022DEC-P2-Q5A',
    officialSourceLink: 'https://www.icai.org/post/question-papers-foundation-course',
  },

  // =========================================================================
  // SECTION 3: PAPER 3 - QUANTITATIVE APTITUDE
  // =========================================================================

  // --- ICAI Module Questions ---
  {
    id: 'icai_mod_p3_01',
    paperId: 'paper3',
    chapterId: 'ch_p3_04',
    chapterTitle: {
      en: 'Chapter 4: Time Value of Money (TVM)',
      hi: 'अध्याय 4: मुद्रा का समय मूल्य (TVM)',
    },
    difficulty: 'medium',
    question: {
      en: 'The effective rate of interest corresponding to a nominal rate 7% per annum convertible quarterly is:',
      hi: '7% वार्षिक नाममात्र ब्याज दर की त्रैमासिक (Quarterly) चक्रवृद्धि होने पर प्रभावी वार्षिक ब्याज दर (Effective Rate) क्या होगी?',
    },
    options: {
      en: ['7.00%', '7.19%', '7.24%', '7.50%'],
      hi: ['7.00%', '7.19%', '7.24%', '7.50%'],
    },
    correctIndex: 1,
    explanation: {
      en: 'Formula from ICAI Module: Effective Rate E = (1 + i/m)^m - 1. Here i = 0.07, m = 4 (quarterly compounding). E = (1 + 0.07/4)^4 - 1 = (1 + 0.0175)^4 - 1 = (1.0175)^4 - 1 = 1.071859 - 1 ≈ 0.0719 = 7.19%.',
      hi: 'आईसीएआई मॉड्यूल सूत्र: E = (1 + i/4)^4 - 1। i = 0.07, m = 4। E = (1 + 0.0175)^4 - 1 = 1.07186 - 1 ≈ 0.0719 = 7.19%।',
    },
    keyRule: {
      en: 'ICAI TVM Core: E = (1 + r/m)^m - 1 where m is compounding frequency per year.',
      hi: 'प्रभावी ब्याज दर सूत्र: E = (1 + r/m)^m - 1 जहाँ m प्रति वर्ष चक्रवृद्धि की आवृत्ति है।',
    },
    sourceType: 'ICAI_MODULE',
    sourceLabel: {
      en: 'ICAI Study Material - Paper 3 Quantitative Aptitude, Chapter 4 Unit 2 (Compound Interest), Exercise 4(B) Q5',
      hi: 'आईसीएआई अध्ययन सामग्री - पेपर 3 गणित, अध्याय 4 इकाई 2, अभ्यास 4(B) प्रश्न 5',
    },
    examAttempt: 'Module Edition 2024-25',
    examYear: 2024,
    officialQuestionRef: 'ICAI-MOD-P3-CH4-EX4B-Q5',
    officialSourceLink: 'https://www.icai.org/post/foundation-course-study-material-new-scheme',
  },
  {
    id: 'icai_mod_p3_02',
    paperId: 'paper3',
    chapterId: 'ch_p3_10',
    chapterTitle: {
      en: 'Chapter 10: Measures of Central Tendency & Dispersion',
      hi: 'अध्याय 10: केंद्रीय प्रवृत्ति एवं विक्षेपण के माप',
    },
    difficulty: 'medium',
    question: {
      en: 'If each observation in a given dataset is increased by 5, what will be the effect on the Standard Deviation (SD)?',
      hi: 'यदि किसी दिए गए समंक श्रेणी के प्रत्येक मान में 5 की वृद्धि कर दी जाए, तो प्रमाप विचलन (Standard Deviation) पर क्या प्रभाव पड़ेगा?',
    },
    options: {
      en: [
        'SD will increase by 5',
        'SD will remain completely unchanged',
        'SD will increase by 25',
        'SD will become 5 times the original SD',
      ],
      hi: [
        'प्रमाप विचलन में 5 की वृद्धि होगी',
        'प्रमाप विचलन पूरी तरह अपरिवर्तित रहेगा',
        'प्रमाप विचलन में 25 की वृद्धि होगी',
        'प्रमाप विचलन मूल मान का 5 गुना हो जाएगा',
      ],
    },
    correctIndex: 1,
    explanation: {
      en: 'As proven in ICAI Study Material (Chapter 14 Unit 2 - Dispersion), Standard Deviation is independent of the change of origin. Adding or subtracting a constant value to all observations shifts the mean by the same constant, so deviations (x - mean) remain identical and SD is unchanged.',
      hi: 'आईसीएआई अध्ययन सामग्री (अध्याय 14 इकाई 2) के अनुसार प्रमाप विचलन मूल बिंदु (Origin) में परिवर्तन से स्वतंत्र होता है। सभी मानों में स्थिर संख्या जोड़ने या घटाने पर भी SD अपरिवर्तित रहता है।',
    },
    keyRule: {
      en: 'ICAI Property: Measures of Dispersion are unaffected by change of origin, but affected by change of scale.',
      hi: 'प्रमाप विचलन मूल बिंदु के परिवर्तन से प्रभावित नहीं होता, किंतु पैमाने (Scale) के परिवर्तन से प्रभावित होता है।',
    },
    sourceType: 'ICAI_MODULE',
    sourceLabel: {
      en: 'ICAI Study Material - Paper 3 Statistics, Chapter 10 Unit 2, Test Your Knowledge Q8',
      hi: 'आईसीएआई अध्ययन सामग्री - पेपर 3 सांख्यिकी, अध्याय 10 इकाई 2, टेस्ट योर नॉलेज प्रश्न 8',
    },
    examAttempt: 'Module Edition 2024-25',
    examYear: 2024,
    officialQuestionRef: 'ICAI-MOD-P3-CH10-U2-TYK8',
    officialSourceLink: 'https://www.icai.org/post/foundation-course-study-material-new-scheme',
  },
  {
    id: 'icai_mod_p3_03',
    paperId: 'paper3',
    chapterId: 'ch_p3_12',
    chapterTitle: {
      en: 'Chapter 12: Correlation and Regression',
      hi: 'अध्याय 12: सहसंबंध एवं प्रतीपगमन',
    },
    difficulty: 'hard',
    question: {
      en: 'If the two regression coefficients are byx = -0.8 and bxy = -0.45, what is the value of the correlation coefficient (r)?',
      hi: 'यदि दो प्रतीपगमन गुणांक byx = -0.8 और bxy = -0.45 हैं, तो सहसंबंध गुणांक (r) का मान क्या होगा?',
    },
    options: {
      en: ['+0.60', '-0.60', '-0.36', '+0.36'],
      hi: ['+0.60', '-0.60', '-0.36', '+0.36'],
    },
    correctIndex: 1,
    explanation: {
      en: 'ICAI Module Formula: r = ±√(byx × bxy). The sign of r is always the same as the signs of byx and bxy. Since both regression coefficients are negative, r must also be negative. r = -√(0.8 × 0.45) = -√(0.36) = -0.60.',
      hi: 'आईसीएआई सूत्र: r = ±√(byx × bxy)। r का चिह्न हमेशा byx और bxy के चिह्न के समान होता है। चूंकि दोनों ऋणात्मक हैं, r भी ऋणात्मक होगा: r = -√(0.8 × 0.45) = -√(0.36) = -0.60।',
    },
    keyRule: {
      en: 'ICAI Regression Sign Property: byx, bxy, and r must always carry identical algebraic signs.',
      hi: 'प्रतीपगमन नियम: byx, bxy और r तीनों का बीजगणितीय चिह्न हमेशा एक समान होता है।',
    },
    sourceType: 'ICAI_MODULE',
    sourceLabel: {
      en: 'ICAI Study Material - Paper 3 Statistics, Chapter 12 (Correlation & Regression), Test Your Knowledge Q12',
      hi: 'आईसीएआई अध्ययन सामग्री - पेपर 3 सांख्यिकी, अध्याय 12, टेस्ट योर नॉलेज प्रश्न 12',
    },
    examAttempt: 'Module Edition 2024-25',
    examYear: 2024,
    officialQuestionRef: 'ICAI-MOD-P3-CH12-TYK12',
    officialSourceLink: 'https://www.icai.org/post/foundation-course-study-material-new-scheme',
  },

  // --- Paper 3 PYQs ---
  {
    id: 'icai_pyq_p3_june2024_01',
    paperId: 'paper3',
    chapterId: 'ch_p3_04',
    chapterTitle: {
      en: 'Time Value of Money (TVM)',
      hi: 'मुद्रा का समय मूल्य (TVM)',
    },
    difficulty: 'medium',
    question: {
      en: 'What is the effective annual rate of interest equivalent to a nominal rate of 12% per annum compounded semi-annually?',
      hi: '12% वार्षिक नाममात्र ब्याज दर की अर्धवार्षिक (semi-annually) चक्रवृद्धि होने पर प्रभावी वार्षिक ब्याज दर (Effective Rate) क्या होगी?',
    },
    options: {
      en: ['12.00%', '12.36%', '12.55%', '13.00%'],
      hi: ['12.00%', '12.36%', '12.55%', '13.00%'],
    },
    correctIndex: 1,
    explanation: {
      en: 'Official CA Foundation Exam Question: Effective Rate E = (1 + i/m)^m - 1. For 12% compounded semi-annually, i = 0.12, m = 2. E = (1 + 0.12/2)^2 - 1 = (1 + 0.06)^2 - 1 = (1.06)^2 - 1 = 1.1236 - 1 = 0.1236 = 12.36%.',
      hi: 'आधिकारिक सीए फाउंडेशन परीक्षा प्रश्न: E = (1 + 0.12/2)^2 - 1 = (1.06)^2 - 1 = 1.1236 - 1 = 0.1236 = 12.36%। अर्धवार्षिक चक्रवृद्धि से प्रभावी ब्याज दर नाममात्र दर से अधिक हो जाती है।',
    },
    keyRule: {
      en: 'ICAI PYQ Key: Effective rate always exceeds nominal rate when compounded more than once a year.',
      hi: 'आईसीएआई PYQ नियम: अर्धवार्षिक या त्रैमासिक चक्रवृद्धि होने पर प्रभावी दर नाममात्र दर से अधिक होती है।',
    },
    sourceType: 'PYQ',
    sourceLabel: {
      en: 'CA Foundation Official Exam Question Paper - June 2024, Paper 3 (Quantitative Aptitude), Q14',
      hi: 'सीए फाउंडेशन आधिकारिक परीक्षा प्रश्नपत्र - जून 2024, पेपर 3 (मात्रात्मक योग्यता), प्रश्न 14',
    },
    examAttempt: 'June 2024',
    examYear: 2024,
    officialQuestionRef: 'ICAI-PYQ-2024JUNE-P3-Q14',
    officialSourceLink: 'https://www.icai.org/post/question-papers-foundation-course',
  },
  {
    id: 'icai_pyq_p3_dec2023_01',
    paperId: 'paper3',
    chapterId: 'ch_p3_10',
    chapterTitle: {
      en: 'Statistics - Measures of Central Tendency',
      hi: 'सांख्यिकी - केंद्रीय प्रवृत्ति के माप',
    },
    difficulty: 'medium',
    question: {
      en: 'For a moderately skewed frequency distribution, the empirical relationship between Mean, Median, and Mode established by Karl Pearson is:',
      hi: 'एक मध्यम विषम आवृत्ति बंटन के लिए कार्ल पियर्सन द्वारा स्थापित माध्य (Mean), माध्यिका (Median) और बहुलक (Mode) के बीच का अनुभवजन्य संबंध क्या है?',
    },
    options: {
      en: [
        'Mode = 3 Median - 2 Mean',
        'Mode = 2 Median - 3 Mean',
        'Mean = 3 Mode - 2 Median',
        'Median = 3 Mode - 2 Mean',
      ],
      hi: [
        'बहुलक = 3 माध्यिका - 2 माध्य (Mode = 3 Median - 2 Mean)',
        'बहुलक = 2 माध्यिका - 3 माध्य',
        'माध्य = 3 बहुलक - 2 माध्यिका',
        'माध्यिका = 3 बहुलक - 2 माध्य',
      ],
    },
    correctIndex: 0,
    explanation: {
      en: 'Official CA Foundation Question: Karl Pearson’s empirical relationship for moderately skewed data is Mode = 3 Median - 2 Mean. This can also be rearranged as: (Mean - Mode) = 3(Mean - Median).',
      hi: 'आधिकारिक सीए फाउंडेशन प्रश्न: कार्ल पियर्सन का सूत्र है: बहुलक (Mode) = 3 × माध्यिका (Median) - 2 × माध्य (Mean)। अथवा (माध्य - बहुलक) = 3(माध्य - माध्यिका)।',
    },
    keyRule: {
      en: 'Standard Formula: Mode = 3(Median) - 2(Mean).',
      hi: 'मानक सूत्र: बहुलक = 3 माध्यिका - 2 माध्य।',
    },
    sourceType: 'PYQ',
    sourceLabel: {
      en: 'CA Foundation Official Exam Question Paper - December 2023, Paper 3 (Statistics), Q72',
      hi: 'सीए फाउंडेशन आधिकारिक परीक्षा प्रश्नपत्र - दिसंबर 2023, पेपर 3 (सांख्यिकी), प्रश्न 72',
    },
    examAttempt: 'Dec 2023',
    examYear: 2023,
    officialQuestionRef: 'ICAI-PYQ-2023DEC-P3-Q72',
    officialSourceLink: 'https://www.icai.org/post/question-papers-foundation-course',
  },
  {
    id: 'icai_pyq_p3_june2023_01',
    paperId: 'paper3',
    chapterId: 'ch_p3_08',
    chapterTitle: {
      en: 'Logical Reasoning - Blood Relations',
      hi: 'तार्किक तर्क - रक्त संबंध',
    },
    difficulty: 'easy',
    question: {
      en: 'Pointing to a photograph, Rohan said, "She is the only daughter of my grandfather\'s only son." How is the woman in the photograph related to Rohan?',
      hi: 'एक तस्वीर की ओर इशारा करते हुए रोहन ने कहा, "वह मेरे दादाजी के इकलौते पुत्र की इकलौती बेटी है।" वह महिला रोहन से किस प्रकार संबंधित है?',
    },
    options: {
      en: ['Mother', 'Aunt', 'Sister', 'Daughter'],
      hi: ['माता', 'चाची / बुआ', 'बहन (Sister)', 'बेटी'],
    },
    correctIndex: 2,
    explanation: {
      en: 'Official Reasoning Question: Rohan\'s grandfather\'s only son is Rohan\'s father. The only daughter of Rohan\'s father is Rohan\'s sister.',
      hi: 'आधिकारिक तार्किक प्रश्न: रोहन के दादाजी का इकलौता पुत्र = रोहन के पिता। रोहन के पिता की इकलौती बेटी = रोहन की बहन (Sister)।',
    },
    keyRule: {
      en: 'Logical deduction: Grandfather\'s only son = Father; Father\'s daughter = Sister.',
      hi: 'दादाजी का इकलौता पुत्र = पिता; पिता की बेटी = बहन।',
    },
    sourceType: 'PYQ',
    sourceLabel: {
      en: 'CA Foundation Official Exam Question Paper - June 2023, Paper 3 (Logical Reasoning), Q46',
      hi: 'सीए फाउंडेशन आधिकारिक परीक्षा प्रश्नपत्र - जून 2023, पेपर 3 (रीजनिंग), प्रश्न 46',
    },
    examAttempt: 'June 2023',
    examYear: 2023,
    officialQuestionRef: 'ICAI-PYQ-2023JUNE-P3-Q46',
    officialSourceLink: 'https://www.icai.org/post/question-papers-foundation-course',
  },

  // =========================================================================
  // SECTION 4: PAPER 4 - BUSINESS ECONOMICS
  // =========================================================================

  // --- ICAI Module Questions ---
  {
    id: 'icai_mod_p4_01',
    paperId: 'paper4',
    chapterId: 'ch_p4_02',
    chapterTitle: {
      en: 'Chapter 2: Theory of Demand and Supply',
      hi: 'अध्याय 2: मांग एवं पूर्ति का सिद्धांत',
    },
    difficulty: 'easy',
    question: {
      en: 'According to the ICAI Business Economics module, when the price elasticity of demand is greater than one (|Ep| > 1), a decrease in the price of the commodity causes the Total Revenue (Total Outlay) to:',
      hi: 'आईसीएआई व्यावसायिक अर्थशास्त्र मॉड्यूल के अनुसार जब मांग की कीमत लोच इकाई से अधिक (|Ep| > 1) हो, तो वस्तु की कीमत में कमी आने पर कुल आगम (Total Revenue) पर क्या प्रभाव पड़ेगा?',
    },
    options: {
      en: [
        'Decrease',
        'Increase',
        'Remain unchanged',
        'Drop to zero',
      ],
      hi: [
        'घटेगा',
        'बढ़ेगा (Increase)',
        'अपरिवर्तित रहेगा',
        'शून्य हो जाएगा',
      ],
    },
    correctIndex: 1,
    explanation: {
      en: 'As per the Total Outlay Method in the ICAI Module, when demand is elastic (|Ep| > 1), percentage increase in quantity demanded is greater than the percentage fall in price. Hence, Total Revenue (Price × Quantity) increases when price falls.',
      hi: 'आईसीएआई मॉड्यूल में कुल व्यय विधि के अनुसार जब मांग लोचदार (|Ep| > 1) होती है, तो कीमत घटने पर मांग में प्रतिशत वृद्धि कीमत में कमी से अधिक होती है, जिससे कुल आगम में वृद्धि होती है।',
    },
    keyRule: {
      en: 'Elastic demand (|Ep| > 1): Price and Total Revenue move in OPPOSITE directions.',
      hi: 'लोचदार मांग (|Ep| > 1): कीमत और कुल आगम विपरीत दिशा में चलते हैं।',
    },
    sourceType: 'ICAI_MODULE',
    sourceLabel: {
      en: 'ICAI Study Material - Paper 4 Business Economics, Chapter 2 Unit 1, Test Your Knowledge Q14',
      hi: 'आईसीएआई अध्ययन सामग्री - पेपर 4 अर्थशास्त्र, अध्याय 2 इकाई 1, टेस्ट योर नॉलेज प्रश्न 14',
    },
    examAttempt: 'Module Edition 2024-25',
    examYear: 2024,
    officialQuestionRef: 'ICAI-MOD-P4-CH2-U1-TYK14',
    officialSourceLink: 'https://www.icai.org/post/foundation-course-study-material-new-scheme',
  },
  {
    id: 'icai_mod_p4_02',
    paperId: 'paper4',
    chapterId: 'ch_p4_04',
    chapterTitle: {
      en: 'Chapter 4: Price Determination in Different Markets',
      hi: 'अध्याय 4: विभिन्न बाजारों में कीमत निर्धारण',
    },
    difficulty: 'medium',
    question: {
      en: 'In a Monopoly market, when the Marginal Revenue (MR) is equal to zero (MR = 0), the Price Elasticity of Demand (Ep) on the demand curve is equal to:',
      hi: 'एकाधिकार बाजार में जब सीमांत आगम शून्य (MR = 0) हो, तो मांग वक्र पर मांग की कीमत लोच (Ep) किसके बराबर होती है?',
    },
    options: {
      en: [
        'Zero (0)',
        'One (1.0 - Unitary Elastic)',
        'Infinity (∞)',
        'Greater than 1',
      ],
      hi: [
        'शून्य (0)',
        'एक (1.0 - इकाई लोचदार)',
        'अनंत (∞)',
        'एक से अधिक',
      ],
    },
    correctIndex: 1,
    explanation: {
      en: 'ICAI Economics Module formula: MR = AR × [1 - (1/e)]. If MR = 0, then 1 - (1/e) = 0 => 1/e = 1 => e = 1. Therefore, when MR is zero, elasticity of demand is exactly unitary (1).',
      hi: 'आईसीएआई अर्थशास्त्र मॉड्यूल सूत्र: MR = AR × [1 - (1/e)]। यदि MR = 0 हो, तो 1 - 1/e = 0 => e = 1। अतः जब MR शून्य होता है तब मांग की लोच इकाई (1) होती है।',
    },
    keyRule: {
      en: 'Relationship: MR = AR(1 - 1/e). When MR = 0, e = 1. When MR > 0, e > 1. When MR < 0, e < 1.',
      hi: 'संबंध सूत्र: MR = AR(1 - 1/e)। जब MR = 0 हो तो e = 1 होता है।',
    },
    sourceType: 'ICAI_MODULE',
    sourceLabel: {
      en: 'ICAI Study Material - Paper 4 Business Economics, Chapter 4 Unit 2 (Monopoly), Test Your Knowledge Q9',
      hi: 'आईसीएआई अध्ययन सामग्री - पेपर 4 अर्थशास्त्र, अध्याय 4 इकाई 2 (एकाधिकार), टेस्ट योर नॉलेज प्रश्न 9',
    },
    examAttempt: 'Module Edition 2024-25',
    examYear: 2024,
    officialQuestionRef: 'ICAI-MOD-P4-CH4-U2-TYK9',
    officialSourceLink: 'https://www.icai.org/post/foundation-course-study-material-new-scheme',
  },
  {
    id: 'icai_mod_p4_03',
    paperId: 'paper4',
    chapterId: 'ch_p4_05',
    chapterTitle: {
      en: 'Chapter 5: Determination of National Income',
      hi: 'अध्याय 5: राष्ट्रीय आय का निर्धारण',
    },
    difficulty: 'hard',
    question: {
      en: 'The "GDP Deflator" is calculated as which of the following ratios?',
      hi: '"सकल घरेलू उत्पाद अवस्फीतिकारक" (GDP Deflator) की गणना किस अनुपात के रूप में की जाती है?',
    },
    options: {
      en: [
        '(Real GDP / Nominal GDP) × 100',
        '(Nominal GDP / Real GDP) × 100',
        '(Gross National Product / Net Domestic Product) × 100',
        '(Consumer Price Index / Wholesale Price Index) × 100',
      ],
      hi: [
        '(वास्तविक जीडीपी / नाममात्र जीडीपी) × 100',
        '(नाममात्र जीडीपी / वास्तविक जीडीपी) × 100',
        '(सकल राष्ट्रीय उत्पाद / शुद्ध घरेलू उत्पाद) × 100',
        '(उपभोक्ता मूल्य सूचकांक / थोक मूल्य सूचकांक) × 100',
      ],
    },
    correctIndex: 1,
    explanation: {
      en: 'ICAI Study Material (Chapter 5): GDP Deflator is a comprehensive measure of inflation calculated as: GDP Deflator = (Nominal GDP / Real GDP) × 100. It measures the change in prices for all the goods and services produced domestically.',
      hi: 'आईसीएआई राष्ट्रीय आय मॉड्यूल: जीडीपी डिफ्लेटर का सूत्र है: (नाममात्र जीडीपी / वास्तविक जीडीपी) × 100। यह अर्थव्यवस्था में उत्पादित सभी वस्तुओं व सेवाओं के मूल्य स्तर में परिवर्तन को मापता है।',
    },
    keyRule: {
      en: 'ICAI Macro Formula: GDP Deflator = (Nominal GDP / Real GDP) * 100.',
      hi: 'जीडीपी डिफ्लेटर सूत्र = (नाममात्र जीडीपी / वास्तविक जीडीपी) × 100।',
    },
    sourceType: 'ICAI_MODULE',
    sourceLabel: {
      en: 'ICAI Study Material - Paper 4, Chapter 5 (National Income), Test Your Knowledge Q4',
      hi: 'आईसीएआई अध्ययन सामग्री - पेपर 4, अध्याय 5 (राष्ट्रीय आय), टेस्ट योर नॉलेज प्रश्न 4',
    },
    examAttempt: 'Module Edition 2024-25',
    examYear: 2024,
    officialQuestionRef: 'ICAI-MOD-P4-CH5-TYK4',
    officialSourceLink: 'https://www.icai.org/post/foundation-course-study-material-new-scheme',
  },

  // --- Paper 4 PYQs ---
  {
    id: 'icai_pyq_p4_june2024_01',
    paperId: 'paper4',
    chapterId: 'ch_p4_02',
    chapterTitle: {
      en: 'Theory of Demand & Elasticity',
      hi: 'मांग का सिद्धांत एवं लोच',
    },
    difficulty: 'easy',
    question: {
      en: 'If the cross elasticity of demand between two goods X and Y is negative (Ec < 0), the two goods are classified as:',
      hi: 'यदि दो वस्तुओं X और Y के बीच मांग की तिरछी लोच ऋणात्मक (Cross Elasticity < 0) है, तो वे दोनों वस्तुएं क्या कहलाती हैं?',
    },
    options: {
      en: [
        'Substitute goods (e.g. Tea and Coffee)',
        'Complementary goods (e.g. Car and Petrol)',
        'Unrelated goods',
        'Giffen goods',
      ],
      hi: [
        'स्थानापन्न वस्तुएं (जैसे चाय और कॉफी)',
        'पूरक वस्तुएं (Complementary - जैसे कार और पेट्रोल)',
        'असंबंधित वस्तुएं',
        'गिफिन वस्तुएं',
      ],
    },
    correctIndex: 1,
    explanation: {
      en: 'Official CA Foundation June 2024 Exam Question: When price of good Y rises, demand for complementary good X decreases, resulting in a negative cross elasticity. Substitute goods have positive cross elasticity, and unrelated goods have zero cross elasticity.',
      hi: 'सीए फाउंडेशन जून 2024 परीक्षा प्रश्न: पूरक वस्तुओं में एक की कीमत बढ़ने पर दूसरी की मांग घट जाती है, अतः तिरछी लोच ऋणात्मक (Negative) होती है। स्थानापन्न वस्तुओं में यह धनात्मक होती है।',
    },
    keyRule: {
      en: 'ICAI Rule: Ec > 0 for Substitutes; Ec < 0 for Complements; Ec = 0 for Unrelated.',
      hi: 'तिरछी लोच: स्थानापन्न हेतु Ec > 0; पूरक वस्तुओं हेतु Ec < 0; असंबंधित हेतु Ec = 0।',
    },
    sourceType: 'PYQ',
    sourceLabel: {
      en: 'CA Foundation Official Exam Question Paper - June 2024, Paper 4 (Business Economics), Q28',
      hi: 'सीए फाउंडेशन आधिकारिक परीक्षा प्रश्नपत्र - जून 2024, पेपर 4 (व्यावसायिक अर्थशास्त्र), प्रश्न 28',
    },
    examAttempt: 'June 2024',
    examYear: 2024,
    officialQuestionRef: 'ICAI-PYQ-2024JUNE-P4-Q28',
    officialSourceLink: 'https://www.icai.org/post/question-papers-foundation-course',
  },
  {
    id: 'icai_pyq_p4_dec2023_01',
    paperId: 'paper4',
    chapterId: 'ch_p4_04',
    chapterTitle: {
      en: 'Market Forms - Oligopoly',
      hi: 'बाजार के रूप - अल्पाधिकार (Oligopoly)',
    },
    difficulty: 'medium',
    question: {
      en: 'The "Kinked Demand Curve" hypothesis in an Oligopolistic market structure was introduced by which economist to explain price rigidity?',
      hi: 'अल्पाधिकार (Oligopoly) बाजार में कीमत दृढ़ता (Price Rigidity) को समझाने हेतु "विकुंचित मांग वक्र" (Kinked Demand Curve) का प्रतिपादन किस अर्थशास्त्री ने किया?',
    },
    options: {
      en: [
        'Alfred Marshall',
        'Paul M. Sweezy',
        'J.M. Keynes',
        'Joseph Schumpeter',
      ],
      hi: [
        'अल्फ्रेड मार्शल',
        'पॉल एम. स्वीजी (Paul M. Sweezy)',
        'जे.एम. कीन्स',
        'जोसेफ शुम्पीटर',
      ],
    },
    correctIndex: 1,
    explanation: {
      en: 'Official CA Foundation Exam Question: The Kinked Demand Curve model was developed by Paul M. Sweezy in 1939 to explain why prices in oligopolistic markets remain sticky or rigid even when costs fluctuate.',
      hi: 'आधिकारिक परीक्षा प्रश्न: पॉल एम. स्वीजी ने 1939 में विकुंचित मांग वक्र सिद्धांत प्रस्तुत किया, जो यह स्पष्ट करता है कि अल्पाधिकार में फर्में कीमत को स्थिर क्यों रखती हैं।',
    },
    keyRule: {
      en: 'ICAI Foundation Favorite: Paul Sweezy = Kinked Demand Curve & Price Rigidity in Oligopoly.',
      hi: 'आईसीएआई मुख्य तथ्य: पॉल स्वीजी = विकुंचित मांग वक्र एवं अल्पाधिकार में कीमत जड़ता।',
    },
    sourceType: 'PYQ',
    sourceLabel: {
      en: 'CA Foundation Official Exam Question Paper - December 2023, Paper 4 (Business Economics), Q65',
      hi: 'सीए फाउंडेशन आधिकारिक परीक्षा प्रश्नपत्र - दिसंबर 2023, पेपर 4 (व्यावसायिक अर्थशास्त्र), प्रश्न 65',
    },
    examAttempt: 'Dec 2023',
    examYear: 2023,
    officialQuestionRef: 'ICAI-PYQ-2023DEC-P4-Q65',
    officialSourceLink: 'https://www.icai.org/post/question-papers-foundation-course',
  },
  {
    id: 'icai_pyq_p4_dec2022_01',
    paperId: 'paper4',
    chapterId: 'ch_p4_09',
    chapterTitle: {
      en: 'Business Cycles & Macro Indicators',
      hi: 'व्यापार चक्र एवं समष्टि संकेतक',
    },
    difficulty: 'medium',
    question: {
      en: 'Which of the following economic indicators moves in the same direction as aggregate economic activity but only after a significant time delay (lag)?',
      hi: 'निम्नलिखित में से कौन सा आर्थिक संकेतक समग्र आर्थिक गतिविधि की दिशा में ही चलता है किंतु एक निश्चित समय अंतराल (देरी) के पश्चात?',
    },
    options: {
      en: [
        'Leading Indicator',
        'Coincident Indicator',
        'Lagging Indicator',
        'Exogenous Indicator',
      ],
      hi: [
        'अग्रणी संकेतक (Leading Indicator)',
        'समवर्ती संकेतक (Coincident Indicator)',
        'पश्चगामी संकेतक (Lagging Indicator)',
        'बहिर्जात संकेतक',
      ],
    },
    correctIndex: 2,
    explanation: {
      en: 'Official CA Foundation Question: Lagging indicators (e.g. unemployment rate, commercial bank lending rates) change direction only after the broader economy has already shifted into expansion or contraction.',
      hi: 'आधिकारिक परीक्षा प्रश्न: पश्चगामी संकेतक (जैसे बेरोजगारी दर, बैंक ऋण दरें) अर्थव्यवस्था में परिवर्तन आने के कुछ समय पश्चात प्रतिक्रिया देते हैं।',
    },
    keyRule: {
      en: 'ICAI Indicators: Leading = Anticipates. Coincident = Current state. Lagging = Confirms past trend.',
      hi: 'Leading = अग्रिम सूचना; Coincident = वर्तमान स्थिति; Lagging = पुष्टि करता है।',
    },
    sourceType: 'PYQ',
    sourceLabel: {
      en: 'CA Foundation Official Exam Question Paper - December 2022, Paper 4 (Business Economics), Q84',
      hi: 'सीए फाउंडेशन आधिकारिक परीक्षा प्रश्नपत्र - दिसंबर 2022, पेपर 4 (व्यावसायिक अर्थशास्त्र), प्रश्न 84',
    },
    examAttempt: 'Dec 2022',
    examYear: 2022,
    officialQuestionRef: 'ICAI-PYQ-2022DEC-P4-Q84',
    officialSourceLink: 'https://www.icai.org/post/question-papers-foundation-course',
  },
];
