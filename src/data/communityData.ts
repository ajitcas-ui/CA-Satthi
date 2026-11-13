import { CommunityGroup, CommunityPost, StudyPartner } from '../types';

export const COMMON_GROUP_ID = 'grp_ca_saathi_common';

export const INITIAL_GROUPS: CommunityGroup[] = [
  {
    id: COMMON_GROUP_ID,
    name: {
      en: 'CA Saathi Jan 2027 Aspirants Community',
      hi: 'सीए साथी जनवरी 2027 विद्यार्थी समुदाय',
    },
    category: 'general',
    attemptLabel: 'January 2027',
    description: {
      en: 'One unified common study & doubt-solving space for all 4 CA Foundation January 2027 papers (Accounting, Business Laws, Quantitative Aptitude & Business Economics).',
      hi: 'सीए फाउंडेशन जनवरी 2027 के चारों विषयों (लेखांकन, कानून, गणित/सांख्यिकी व अर्थशास्त्र) की संयुक्त शंका समाधान एवं अध्ययन चर्चा।',
    },
    iconName: 'Users',
    memberCount: 1,
    activeDiscussionsCount: 3,
  },
];

export const COMMUNITY_SAFETY_GUIDELINES = [
  {
    id: 'guide_1',
    title: {
      en: 'Student Safety & Zero Harassment Policy',
      hi: 'विद्यार्थी सुरक्षा एवं उत्पीड़न-मुक्त नीति',
    },
    rule: {
      en: 'Unsolicited direct messaging, sharing personal phone numbers or emails, or disrespectful conduct leads to immediate, permanent account suspension.',
      hi: 'निजी फोन नंबर, ईमेल साझा करना या अभद्र व्यवहार करने पर खाता तुरंत स्थायी रूप से निलंबित कर दिया जाएगा।',
    },
  },
  {
    id: 'guide_2',
    title: {
      en: 'Strict Academic Focus Only',
      hi: 'केवल शैक्षणिक एवं परीक्षा केंद्रित परिचर्चा',
    },
    rule: {
      en: 'Discussions must remain confined to the CA Foundation January 2027 ICAI syllabus, conceptual doubts, and exam strategy.',
      hi: 'सभी बातचीत अनिवार्य रूप से सीए फाउंडेशन जनवरी 2027 पाठ्यक्रम, शंका समाधान व अध्ययन रणनीति तक सीमित होनी चाहिए।',
    },
  },
  {
    id: 'guide_3',
    title: {
      en: 'Instant Report & Moderator Intervention',
      hi: 'त्वरित रिपोर्ट एवं मॉडरेटर कार्रवाई',
    },
    rule: {
      en: 'Use the Report button on any inappropriate post. Reports go directly to Super Admin for review.',
      hi: 'किसी भी अनुचित पोस्ट पर रिपोर्ट बटन का प्रयोग करें। रिपोर्ट सीधे सुपर एडमिन के पास जाती है।',
    },
  },
];

export const INITIAL_POSTS: CommunityPost[] = [
  {
    id: 'post_1',
    groupId: COMMON_GROUP_ID,
    authorId: 'usr_priya',
    authorName: 'Priya Sharma',
    authorRole: 'student',
    authorAvatar: '👩‍🎓',
    createdAt: '2 hours ago',
    title: 'How do you quickly solve Annuity Immediate vs Annuity Due on Casio MJ-12D?',
    content: 'In Paper 3 Time Value of Money, I frequently mix up whether the deposit is at the beginning or end of period. Is there an infallible memory trick or calculator sequence for ordinary annuity vs due?',
    paperId: 'paper3',
    chapterName: 'Mathematics of Finance (TVM)',
    tags: ['TVM', 'Calculator Trick', 'Paper 3'],
    likes: 18,
    likedBy: [],
    isPinned: true,
    isResolved: true,
    replies: [
      {
        id: 'rep_1',
        postId: 'post_1',
        authorId: 'usr_mentor',
        authorName: 'CA Ajit Singh (Mentor)',
        authorRole: 'admin',
        authorAvatar: '👨‍🏫',
        createdAt: '1 hour ago',
        content: 'Golden rule for CA Foundation: "Due = Beginning = Multiply by (1+i)". Calculate Ordinary Annuity normally using the GT (Grand Total) key on your Casio, then simply multiply the final answer by (1+i).',
        likes: 24,
        likedBy: [],
        isAcceptedSolution: true,
      },
      {
        id: 'rep_2',
        postId: 'post_1',
        authorId: 'usr_rohan',
        authorName: 'Rohan Verma',
        authorRole: 'student',
        authorAvatar: '👨‍🎓',
        createdAt: '45 mins ago',
        content: 'Thank you Sir! This saved me 2 minutes on every sinking fund question in the mock test.',
        likes: 6,
        likedBy: [],
      },
    ],
  },
  {
    id: 'post_2',
    groupId: COMMON_GROUP_ID,
    authorId: 'usr_rohan',
    authorName: 'Rohan Verma',
    authorRole: 'student',
    authorAvatar: '👨‍🎓',
    createdAt: '4 hours ago',
    title: 'Case Law Citation in Paper 2: Is writing Balfour v Balfour mandatory?',
    content: 'When writing descriptive answers for Domestic Agreements vs Legal Intention, will marks be deducted if we explain the facts accurately but forget the exact spellings of Balfour v Balfour?',
    paperId: 'paper2',
    chapterName: 'The Indian Contract Act, 1872',
    tags: ['Law Writing', 'Case Law', 'Paper 2'],
    likes: 12,
    likedBy: [],
    replies: [
      {
        id: 'rep_3',
        postId: 'post_2',
        authorId: 'usr_priya',
        authorName: 'Priya Sharma',
        authorRole: 'student',
        authorAvatar: '👩‍🎓',
        createdAt: '3 hours ago',
        content: 'ICAI suggested answers reward legal reasoning first. Explaining the exact statutory provision and legal principle cleanly fetches full marks even if you state "in a leading judicial precedent".',
        likes: 9,
        likedBy: [],
      },
    ],
  },
  {
    id: 'post_3',
    groupId: COMMON_GROUP_ID,
    authorId: 'usr_aman',
    authorName: 'Aman Gupta',
    authorRole: 'student',
    authorAvatar: '🧑‍🎓',
    createdAt: '6 hours ago',
    title: 'Rectification of Errors: Suspense Account closing balance',
    content: 'If after rectifying all one-sided errors the suspense account still has a debit balance of ₹2,400, on which side of the Balance Sheet will it appear?',
    paperId: 'paper1',
    chapterName: 'Accounting Process',
    tags: ['Accounts', 'Suspense Account', 'Paper 1'],
    likes: 7,
    likedBy: [],
    replies: [],
  },
];

export const INITIAL_STUDY_PARTNERS: StudyPartner[] = [
  {
    id: 'sp_1',
    studentName: 'Aarav Patel',
    targetAttempt: 'January 2027',
    strongSubject: 'paper1',
    weakSubject: 'paper3',
    studyHoursPerDay: 5,
    preferredTime: 'Morning (सुबह)',
    bio: 'Strong in Accounting journal entries & BRS. Practicing Time Value of Money & Stats daily for Jan 2027.',
    city: 'Ahmedabad',
    connected: false,
  },
  {
    id: 'sp_2',
    studentName: 'Simran Kaur',
    targetAttempt: 'January 2027',
    strongSubject: 'paper4',
    weakSubject: 'paper2',
    studyHoursPerDay: 6,
    preferredTime: 'Night (रात)',
    bio: 'Practicing Business Economics MCQs and Indian Contract Act answer writing.',
    city: 'Delhi',
    connected: true,
  },
];
