import { PaperInfo } from '../types';

export const PAPERS: PaperInfo[] = [
  {
    id: 'paper1',
    paperNumber: 1,
    name: {
      en: 'Accounting',
      hi: 'लेखांकन (Accounting)',
    },
    code: 'PAPER-1',
    totalMarks: 100,
    passingMarks: 40,
    type: {
      en: 'Subjective (Descriptive)',
      hi: 'वर्णनात्मक (Subjective)',
    },
    color: 'from-blue-600 to-indigo-700',
    iconName: 'Calculator',
    chaptersCount: 11,
    progressPercent: 0,
  },
  {
    id: 'paper2',
    paperNumber: 2,
    name: {
      en: 'Business Laws',
      hi: 'व्यापारिक कानून (Business Laws)',
    },
    code: 'PAPER-2',
    totalMarks: 100,
    passingMarks: 40,
    type: {
      en: 'Subjective (Descriptive)',
      hi: 'वर्णनात्मक (Subjective)',
    },
    color: 'from-indigo-600 to-sky-700',
    iconName: 'Scale',
    chaptersCount: 7,
    progressPercent: 0,
  },
  {
    id: 'paper3',
    paperNumber: 3,
    name: {
      en: 'Quantitative Aptitude (Maths, LR, Stats)',
      hi: 'मात्रात्मक योग्यता (गणित, रीजनिंग, सांख्यिकी)',
    },
    code: 'PAPER-3',
    totalMarks: 100,
    passingMarks: 40,
    type: {
      en: 'Objective (MCQ with Negative Marking)',
      hi: 'वस्तुनिष्ठ (MCQ - निगेटिव मार्किंग)',
    },
    color: 'from-sky-600 to-cyan-700',
    iconName: 'LineChart',
    chaptersCount: 18,
    progressPercent: 0,
  },
  {
    id: 'paper4',
    paperNumber: 4,
    name: {
      en: 'Business Economics',
      hi: 'व्यावसायिक अर्थशास्त्र (Business Economics)',
    },
    code: 'PAPER-4',
    totalMarks: 100,
    passingMarks: 40,
    type: {
      en: 'Objective (MCQ with Negative Marking)',
      hi: 'वस्तुनिष्ठ (MCQ - निगेटिव मार्किंग)',
    },
    color: 'from-blue-700 to-teal-700',
    iconName: 'TrendingUp',
    chaptersCount: 10,
    progressPercent: 0,
  },
];
