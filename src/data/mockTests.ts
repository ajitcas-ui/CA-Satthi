import { MockTest } from '../types';
import { MOCK_QUESTIONS } from './mockQuestions';

export const MOCK_TESTS: MockTest[] = [
  {
    id: 'mock_paper3_speed',
    title: {
      en: 'Paper 3: Quantitative Aptitude Speed Test',
      hi: 'पेपर 3: मात्रात्मक योग्यता गति परीक्षा (Speed Test)',
    },
    paperId: 'paper3',
    durationMinutes: 15,
    isPremium: false,
    questions: MOCK_QUESTIONS.filter(q => q.paperId === 'paper3' || q.paperId === 'paper4'),
    instructions: {
      en: 'Standard ICAI MCQ rules: +1 Mark for Correct, -0.25 Mark deduction for Wrong answer. 0 for unattempted. You can review and flag questions at any time.',
      hi: 'मानक आईसीएआई नियम: सही उत्तर पर +1 अंक, गलत उत्तर पर 0.25 अंक की कटौती। बिना प्रयास किए प्रश्न पर 0। आप किसी भी समय प्रश्न को समीक्षा हेतु चिह्नित कर सकते हैं।',
    },
  },
  {
    id: 'mock_paper4_eco',
    title: {
      en: 'Paper 4: Business Economics Concept Booster',
      hi: 'पेपर 4: व्यावसायिक अर्थशास्त्र अवधारणा बूस्टर',
    },
    paperId: 'paper4',
    durationMinutes: 20,
    isPremium: true,
    questions: MOCK_QUESTIONS.filter(q => q.paperId === 'paper4' || q.paperId === 'paper1'),
    instructions: {
      en: 'Focus on elasticity calculations, market equilibria, and macroeconomic indicator identification.',
      hi: 'मांग की लोच, बाजार संतुलन तथा समष्टि आर्थिक संकेतकों पर केंद्रित परीक्षा।',
    },
  },
  {
    id: 'mock_grand_foundation',
    title: {
      en: 'CA Foundation All-Paper Grand Diagnostic Quiz',
      hi: 'सीए फाउंडेशन सर्व-विषय भव्य नैदानिक क्विज (Grand Quiz)',
    },
    paperId: 'paper3',
    durationMinutes: 30,
    isPremium: true,
    questions: MOCK_QUESTIONS,
    instructions: {
      en: 'Comprehensive test covering conceptual questions across all 4 Foundation papers (Accounting, Law, Math/Stats, Economics).',
      hi: 'चारों फाउंडेशन पेपर्स (लेखांकन, कानून, गणित/सांख्यिकी, अर्थशास्त्र) से प्रश्नों का समग्र परीक्षण।',
    },
  },
];
