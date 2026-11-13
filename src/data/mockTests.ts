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
    questions: MOCK_QUESTIONS,
    instructions: {
      en: 'Comprehensive diagnostic mock drawing conceptual & numerical questions from every chapter across all 4 CA Foundation January 2027 papers.',
      hi: 'जनवरी 2027 के चारों पेपर्स के प्रत्येक अध्याय से चुनिंदा प्रश्नों का समग्र अभ्यास परीक्षण।',
    },
  },
];
