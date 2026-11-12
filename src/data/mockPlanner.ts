import { StudyTask } from '../types';

export const INITIAL_STUDY_TASKS: StudyTask[] = [
  {
    id: 'task_1',
    title: {
      en: 'Solve 20 MCQs on Time Value of Money & Annuities',
      hi: 'मुद्रा का समय मूल्य (TVM) के 20 MCQ हल करें',
    },
    paperId: 'paper3',
    chapter: {
      en: 'Time Value of Money',
      hi: 'मुद्रा का समय मूल्य',
    },
    durationMinutes: 45,
    completed: true,
    date: '2026-11-08',
    priority: 'high',
  },
  {
    id: 'task_2',
    title: {
      en: 'Revise Indian Contract Act Section 10 & Landmark Cases',
      hi: 'भारतीय अनुबंध अधिनियम धारा 10 व प्रमुख केस लॉ दोहराएं',
    },
    paperId: 'paper2',
    chapter: {
      en: 'Essentials of Contract',
      hi: 'अनुबंध के आवश्यक तत्व',
    },
    durationMinutes: 40,
    completed: false,
    date: '2026-11-08',
    priority: 'high',
  },
  {
    id: 'task_3',
    title: {
      en: 'Practice Bank Reconciliation Adjusting Cash Book questions',
      hi: 'बैंक समाधान विवरण - संशोधित रोकड़ बही के प्रश्न अभ्यास',
    },
    paperId: 'paper1',
    chapter: {
      en: 'Bank Reconciliation Statement',
      hi: 'बैंक समाधान विवरण',
    },
    durationMinutes: 50,
    completed: false,
    date: '2026-11-08',
    priority: 'medium',
  },
  {
    id: 'task_4',
    title: {
      en: 'Review Elasticity of Demand graphs & Total Outlay table',
      hi: 'मांग की लोच के ग्राफ व कुल व्यय विधि तालिका की समीक्षा',
    },
    paperId: 'paper4',
    chapter: {
      en: 'Theory of Demand',
      hi: 'मांग का सिद्धांत',
    },
    durationMinutes: 30,
    completed: false,
    date: '2026-11-09',
    priority: 'medium',
  },
  {
    id: 'task_5',
    title: {
      en: 'Take Mini Mock Test: Paper 3 Quantitative Aptitude (30 MCQs)',
      hi: 'मिनी मॉक टेस्ट दें: पेपर 3 गणित एवं सांख्यिकी (30 MCQ)',
    },
    paperId: 'paper3',
    chapter: {
      en: 'Full Paper 3 Speed Test',
      hi: 'संपूर्ण पेपर 3 गति परीक्षा',
    },
    durationMinutes: 60,
    completed: false,
    date: '2026-11-09',
    priority: 'high',
  },
];

export interface StudyPlanTemplate {
  id: string;
  name: { en: string; hi: string };
  durationDays: number;
  description: { en: string; hi: string };
  hoursPerDay: number;
  strategy: { en: string[]; hi: string[] };
}

export const STUDY_PLAN_TEMPLATES: StudyPlanTemplate[] = [
  {
    id: 'plan_60',
    name: {
      en: '60-Day Comprehensive Foundation Master Plan',
      hi: '60-दिवसीय संपूर्ण फाउंडेशन मास्टर प्लान',
    },
    durationDays: 60,
    hoursPerDay: 5,
    description: {
      en: 'Balanced approach covering 2 subjects daily with weekend mock tests and revision slots.',
      hi: 'प्रतिदिन 2 विषयों का संतुलित अध्ययन, सप्ताहांत में मॉक टेस्ट और रिवीजन स्लॉट।',
    },
    strategy: {
      en: [
        'Days 1-35: In-depth chapter reading & concept notes building.',
        'Days 36-50: Chapter-wise MCQ drill & subjective answer writing practice.',
        'Days 51-60: Full 2-hour mock test series & formula revision.',
      ],
      hi: [
        'दिन 1-35: गहन अध्याय अध्ययन व अवधारणात्मक नोट्स तैयार करना।',
        'दिन 36-50: अध्यायवार MCQ अभ्यास और लिखित उत्तर लेखन।',
        'दिन 51-60: पूरे 2 घंटे के मॉक टेस्ट और त्वरित सूत्र रिवीजन।',
      ],
    },
  },
  {
    id: 'plan_30',
    name: {
      en: '30-Day High Yield Crash & Revision Timetable',
      hi: '30-दिवसीय क्रैश एवं त्वरित रिवीजन टाइमटेबल',
    },
    durationDays: 30,
    hoursPerDay: 7,
    description: {
      en: 'High-intensity timetable targeting 80/20 chapters (TVM, Stats, Contract Act, Accounts basics).',
      hi: '80/20 नियम आधारित उच्च-अंक वाले अध्यायों पर केंद्रित गहन टाइमटेबल।',
    },
    strategy: {
      en: [
        'Morning Slot (3 hrs): Paper 1 (Accounts) & Paper 2 (Law) writing.',
        'Afternoon Slot (2.5 hrs): Paper 3 (Maths/Stats) calculator tricks & formulas.',
        'Evening Slot (1.5 hrs): Paper 4 (Economics) MCQs & mistake notebook.',
      ],
      hi: [
        'प्रातःकाल (3 घंटे): लेखांकन और व्यापारिक कानून उत्तर अभ्यास।',
        'दोपहर (2.5 घंटे): गणित व सांख्यिकी के शॉर्टकट व प्रश्न हल।',
        'सायंकाल (1.5 घंटे): अर्थशास्त्र के MCQ व त्रुटि समीक्षा डायरी।',
      ],
    },
  },
];
