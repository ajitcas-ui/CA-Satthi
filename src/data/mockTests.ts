import { MockTest } from '../types';
import { MOCK_QUESTIONS } from './mockQuestions';

export const MOCK_TESTS: MockTest[] = [
  {
    id: 'mock_paper1_acc',
    title: {
      en: 'Paper 1: Accounting Full Syllabus Concept Test (Jan 2027)',
      hi: 'पेपर 1: लेखांकन संपूर्ण पाठ्यक्रम अवधारणा परीक्षा (जनवरी 2027)',
    },
    paperId: 'paper1',
    durationMinutes: 25,
    isPremium: true,
    applicableAttempts: ['January 2027'],
    questions: MOCK_QUESTIONS.filter(q => q.paperId === 'paper1'),
    instructions: {
      en: 'Covers all 11 official ICAI Paper 1 chapters including BRS, AS 2 Inventories, Depreciation, Final Accounts, NPO, Single Entry, Partnership & Company Accounts.',
      hi: 'पेपर 1 के सभी 11 आधिकारिक अध्यायों (BRS, AS 2, मूल्यह्रास, अंतिम खाते, NPO, अपूर्ण अभिलेख, साझेदारी व कंपनी खाते) पर आधारित परीक्षा।',
    },
  },
  {
    id: 'mock_paper2_law',
    title: {
      en: 'Paper 2: Business Laws Case-Law & Act Test (Jan 2027)',
      hi: 'पेपर 2: व्यापारिक कानून एवं अधिनियम परीक्षा (जनवरी 2027)',
    },
    paperId: 'paper2',
    durationMinutes: 20,
    isPremium: true,
    applicableAttempts: ['January 2027'],
    questions: MOCK_QUESTIONS.filter(q => q.paperId === 'paper2'),
    instructions: {
      en: 'Covers all 7 New Scheme Acts: Indian Regulatory Framework, Contract Act 1872, Sale of Goods 1930, Partnership 1932, LLP 2008, Companies Act 2013 & NI Act 1881.',
      hi: 'सभी 7 अधिनियमों (नियामक ढांचा, अनुबंध 1872, माल विक्रय 1930, साझेदारी, LLP, कंपनी अधिनियम व परक्राम्य लिखत) पर केंद्रित परीक्षा।',
    },
  },
  {
    id: 'mock_paper3_speed',
    title: {
      en: 'Paper 3: Quantitative Aptitude Full 18-Chapter Speed Test (Jan 2027)',
      hi: 'पेपर 3: मात्रात्मक योग्यता 18-अध्याय गति परीक्षा (जनवरी 2027)',
    },
    paperId: 'paper3',
    durationMinutes: 30,
    isPremium: true,
    applicableAttempts: ['January 2027'],
    questions: MOCK_QUESTIONS.filter(q => q.paperId === 'paper3'),
    instructions: {
      en: 'Standard ICAI MCQ rules: +1 Mark for Correct, -0.25 Mark deduction for Wrong answer. Covers Business Mathematics, Logical Reasoning & Statistics.',
      hi: 'मानक आईसीएआई नियम: सही उत्तर +1 अंक, गलत उत्तर -0.25 अंक। गणित, तार्किक तर्क और सांख्यिकी के सभी 18 अध्याय शामिल।',
    },
  },
  {
    id: 'mock_paper4_eco',
    title: {
      en: 'Paper 4: Business Economics 10-Chapter Mock Test (Jan 2027)',
      hi: 'पेपर 4: व्यावसायिक अर्थशास्त्र 10-अध्याय मॉक टेस्ट (जनवरी 2027)',
    },
    paperId: 'paper4',
    durationMinutes: 20,
    isPremium: true,
    applicableAttempts: ['January 2027'],
    questions: MOCK_QUESTIONS.filter(q => q.paperId === 'paper4'),
    instructions: {
      en: 'Covers Demand/Supply, Cost, Markets, Business Cycles, National Income, Public Finance, Money Market, International Trade & Indian Economy (-0.25 negative marking).',
      hi: 'मांग/पूर्ति, लागत, बाजार, व्यापार चक्र, राष्ट्रीय आय, लोक वित्त, मुद्रा बाजार, अंतर्राष्ट्रीय व्यापार व भारतीय अर्थव्यवस्था (-0.25 निगेटिव मार्किंग)।',
    },
  },
  {
    id: 'mock_grand_foundation',
    title: {
      en: 'CA Foundation January 2027 All-Paper Grand Mock',
      hi: 'सीए फाउंडेशन जनवरी 2027 सर्व-विषय भव्य मॉक टेस्ट',
    },
    paperId: 'paper3',
    durationMinutes: 45,
    isPremium: true,
    applicableAttempts: ['January 2027'],
    questions: MOCK_QUESTIONS,
    instructions: {
      en: 'Comprehensive diagnostic mock drawing conceptual & numerical questions from every chapter across all 4 CA Foundation January 2027 papers.',
      hi: 'जनवरी 2027 के चारों पेपर्स के प्रत्येक अध्याय से चुनिंदा प्रश्नों का समग्र अभ्यास परीक्षण।',
    },
  },
  // MAY 2027 ATTEMPT MOCK SERIES
  {
    id: 'mock_may27_paper1_acc',
    title: {
      en: 'Paper 1: Accounting Foundation & Standards Mock (May 2027)',
      hi: 'पेपर 1: लेखांकन मूल सिद्धांत एवं मानक मॉक टेस्ट (मई 2027)',
    },
    paperId: 'paper1',
    durationMinutes: 25,
    isPremium: true,
    applicableAttempts: ['May 2027'],
    questions: MOCK_QUESTIONS.filter(q => q.paperId === 'paper1'),
    instructions: {
      en: 'Structured for May 2027 aspirants: builds precision in Journal Entries, BRS, Inventories, Depreciation, Partnership & Company Accounts across all 11 chapters.',
      hi: 'मई 2027 परीक्षार्थियों हेतु विशेष: जर्नल प्रविष्टियाँ, BRS, मूल्यह्रास, साझेदारी व कंपनी खातों के सभी 11 अध्यायों का सटीक अभ्यास।',
    },
  },
  {
    id: 'mock_may27_paper2_law',
    title: {
      en: 'Paper 2: Business Laws Statutory Mastery Mock (May 2027)',
      hi: 'पेपर 2: व्यापारिक कानून वैधानिक दक्षता परीक्षा (मई 2027)',
    },
    paperId: 'paper2',
    durationMinutes: 20,
    isPremium: true,
    applicableAttempts: ['May 2027'],
    questions: MOCK_QUESTIONS.filter(q => q.paperId === 'paper2'),
    instructions: {
      en: 'May 2027 attempt focus covering Regulatory Framework, Contract Act, Sale of Goods, Partnership, LLP, Companies Act & Negotiable Instruments.',
      hi: 'मई 2027 परीक्षा लक्ष्य हेतु सभी 7 व्यापारिक अधिनियमों व प्रमुख केस स्टडी प्रश्नों का अभ्यास परीक्षण।',
    },
  },
  {
    id: 'mock_may27_paper3_qa',
    title: {
      en: 'Paper 3: Quantitative Aptitude Calculator & Logic Mock (May 2027)',
      hi: 'पेपर 3: मात्रात्मक योग्यता कैलकुलेटर व तर्क परीक्षा (मई 2027)',
    },
    paperId: 'paper3',
    durationMinutes: 30,
    isPremium: true,
    applicableAttempts: ['May 2027'],
    questions: MOCK_QUESTIONS.filter(q => q.paperId === 'paper3'),
    instructions: {
      en: 'May 2027 OMR Speed Drill (+1 / -0.25 negative marking) across TVM, Permutations, Calculus, Logical Reasoning & Statistical Distributions.',
      hi: 'मई 2027 OMR अभ्यास (+1 / -0.25 निगेटिव मार्किंग): वित्त गणित, क्रमचय, कलन, तर्कशक्ति व सांख्यिकी के 18 अध्याय।',
    },
  },
  {
    id: 'mock_may27_paper4_eco',
    title: {
      en: 'Paper 4: Business Economics Micro & Macro Mock (May 2027)',
      hi: 'पेपर 4: व्यावसायिक अर्थशास्त्र समग्र मॉक टेस्ट (मई 2027)',
    },
    paperId: 'paper4',
    durationMinutes: 20,
    isPremium: true,
    applicableAttempts: ['May 2027'],
    questions: MOCK_QUESTIONS.filter(q => q.paperId === 'paper4'),
    instructions: {
      en: 'May 2027 attempt assessment covering Theory of Demand, Cost & Market Forms, National Income, Money Market & Indian Economy (-0.25 marking).',
      hi: 'मई 2027 परीक्षा हेतु मांग सिद्धांत, बाजार, राष्ट्रीय आय, मुद्रा बाजार व भारतीय अर्थव्यवस्था के 10 अध्यायों का परीक्षण।',
    },
  },
  {
    id: 'mock_may27_grand_foundation',
    title: {
      en: 'CA Foundation May 2027 All-Paper Diagnostic Grand Mock',
      hi: 'सीए फाउंडेशन मई 2027 सर्व-विषय डायग्नोस्टिक मॉक टेस्ट',
    },
    paperId: 'paper3',
    durationMinutes: 45,
    isPremium: true,
    applicableAttempts: ['May 2027'],
    questions: MOCK_QUESTIONS,
    instructions: {
      en: 'Complete baseline diagnostic test for CA Foundation May 2027 covering all 4 papers and 46 official ICAI chapters.',
      hi: 'मई 2027 परीक्षा हेतु चारों पेपर्स व सभी 46 आईसीएआई अध्यायों की तैयारी का समग्र मूल्यांकन परीक्षण।',
    },
  },
];
