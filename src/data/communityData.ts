import { CommunityGroup, CommunityPost, StudyPartner } from '../types';

export const INITIAL_GROUPS: CommunityGroup[] = [
  {
    id: 'grp_accounts',
    name: {
      en: 'Paper 1: Accounting Forum',
      hi: 'पेपर 1: लेखांकन परिचर्चा मंच',
    },
    category: 'subject',
    paperId: 'paper1',
    description: {
      en: 'Discuss BRS, Depreciation, Rectification, Partnership Accounts & ICAI Study Module questions.',
      hi: 'बैंक समाधान, मूल्यह्रास, अशुद्धि सुधार एवं आईसीएआई मॉड्यूल प्रश्नों की चर्चा।',
    },
    iconName: 'Calculator',
    memberCount: 1420,
    activeDiscussionsCount: 38,
  },
  {
    id: 'grp_law',
    name: {
      en: 'Paper 2: Business Laws Hub',
      hi: 'पेपर 2: व्यापारिक कानून विचार मंच',
    },
    category: 'subject',
    paperId: 'paper2',
    description: {
      en: 'Indian Contract Act 1872, Sale of Goods Act, Partnership & LLP Act answer writing practice & case laws.',
      hi: 'भारतीय अनुबंध अधिनियम, माल विक्रय अधिनियम व केस लॉ आधारित उत्तर लेखन अभ्यास।',
    },
    iconName: 'Scale',
    memberCount: 1650,
    activeDiscussionsCount: 44,
  },
  {
    id: 'grp_maths',
    name: {
      en: 'Paper 3: Quantitative Aptitude & LR',
      hi: 'पेपर 3: गणित, रीजनिंग एवं सांख्यिकी',
    },
    category: 'subject',
    paperId: 'paper3',
    description: {
      en: 'Time Value of Money (TVM), Probability, Blood Relations, and Calculator shortcuts for speed.',
      hi: 'मुद्रा का समय मूल्य (TVM), प्रायिकता, रक्त संबंध व कैलकुलेटर ट्रिक्स।',
    },
    iconName: 'LineChart',
    memberCount: 1890,
    activeDiscussionsCount: 52,
  },
  {
    id: 'grp_economics',
    name: {
      en: 'Paper 4: Business Economics Circle',
      hi: 'पेपर 4: व्यावसायिक अर्थशास्त्र मंडल',
    },
    category: 'subject',
    paperId: 'paper4',
    description: {
      en: 'Demand Elasticity, Production Functions, Market Structures, Macro Indicators & PYQs.',
      hi: 'मांग की लोच, उत्पादन फलन, बाजार के रूप व विगत वर्ष के वस्तुनिष्ठ प्रश्न।',
    },
    iconName: 'TrendingUp',
    memberCount: 1310,
    activeDiscussionsCount: 29,
  },
];

export const COMMUNITY_SAFETY_GUIDELINES = [
  {
    id: 'guide_1',
    title: {
      en: 'Female Student Safety & Zero Harassment Policy',
      hi: 'महिला शिक्षार्थी सुरक्षा एवं उत्पीड़न-मुक्त नीति',
    },
    rule: {
      en: 'Unsolicited direct messaging, sharing personal phone numbers, or disrespectful conduct leads to immediate, permanent account termination.',
      hi: 'अवांछित व्यक्तिगत संदेश, निजी फोन नंबर साझा करना या अभद्र व्यवहार करने पर खाता तुरंत स्थायी रूप से निलंबित कर दिया जाएगा।',
    },
  },
  {
    id: 'guide_2',
    title: {
      en: 'Strict Academic Focus Only',
      hi: 'केवल शैक्षणिक एवं परीक्षा केंद्रित परिचर्चा',
    },
    rule: {
      en: 'Discussions must be strictly confined to ICAI Foundation syllabus, study doubts, and conceptual queries.',
      hi: 'सभी बातचीत अनिवार्य रूप से सीए फाउंडेशन पाठ्यक्रम, शंका समाधान व अध्ययन सामग्री तक सीमित होनी चाहिए।',
    },
  },
  {
    id: 'guide_3',
    title: {
      en: 'Instant Report & Moderator Intervention',
      hi: 'त्वरित रिपोर्ट एवं मॉडरेटर कार्रवाई',
    },
    rule: {
      en: 'Any reported inappropriate post or user is reviewed by Super Admin within hours. Use the Report button on any suspicious activity.',
      hi: 'किसी भी अनुचित पोस्ट या उपयोगकर्ता की रिपोर्ट पर सुपर एडमिन द्वारा त्वरित समीक्षा की जाती है। संदेहास्पद गतिविधि पर रिपोर्ट बटन का प्रयोग करें।',
    },
  },
];

export const INITIAL_POSTS: CommunityPost[] = [
  {
    id: 'post_1',
    groupId: 'grp_maths',
    authorId: 'usr_priya',
    authorName: 'Priya Sharma',
    authorRole: 'student',
    authorAvatar: '👩‍🎓',
    createdAt: '2 hours ago',
    title: 'How do you quickly solve Annuity Immediate vs Annuity Due on Casio MJ-12D?',
    content: 'In Paper 3 Time Value of Money, I frequently mix up whether the deposit is at the beginning or end of period. Is there an infallible memory trick or calculator sequence for ordinary annuity vs due?',
    paperId: 'paper3',
    chapterName: 'Time Value of Money',
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
        content: 'Golden rule for CA Foundation: "Due = Beginning = Multiply by (1+i)". Calculate Ordinary Annuity normally using the GT (Grand Total) key on your Casio, then simply multiply the final answer by (1+i). Never use complicated memory keys for due.',
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
    groupId: 'grp_law',
    authorId: 'usr_rohan',
    authorName: 'Rohan Verma',
    authorRole: 'student',
    authorAvatar: '👨‍🎓',
    createdAt: '4 hours ago',
    title: 'Case Law Citation in Paper 2: Is writing Balfour v Balfour mandatory?',
    content: 'When writing descriptive answers for Domestic Agreements vs Legal Intention, will marks be deducted if we explain the facts accurately but forget the exact spellings of Balfour v Balfour?',
    paperId: 'paper2',
    chapterName: 'Essentials of Contract',
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
        content: 'ICAI suggested answers reward legal reasoning first. If you state "In a leading landmark English case, it was held that social and domestic agreements lack legal enforceability", you still get full marks. But writing the name gives a great impression!',
        likes: 9,
        likedBy: [],
      },
    ],
  },
  {
    id: 'post_3',
    groupId: 'grp_accounts',
    authorId: 'usr_aman',
    authorName: 'Aman Gupta',
    authorRole: 'student',
    authorAvatar: '🧑‍🎓',
    createdAt: '6 hours ago',
    title: 'Rectification of Errors: Suspense Account closing balance',
    content: 'If after rectifying all one-sided errors the suspense account still has a debit balance of ₹2,400, on which side of the Balance Sheet will it appear?',
    paperId: 'paper1',
    chapterName: 'Rectification of Errors',
    tags: ['Accounts', 'Suspense Account'],
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
    strongSubject: 'paper1', // Accounts
    weakSubject: 'paper3',   // Maths
    studyHoursPerDay: 5,
    preferredTime: 'Morning (सुबह)',
    bio: 'Strong in Accounting journal entries & BRS. Looking for a partner to solve Time Value of Money & Stats together daily.',
    city: 'Ahmedabad',
    connected: false,
  },
  {
    id: 'sp_2',
    studentName: 'Simran Kaur',
    targetAttempt: 'January 2027',
    strongSubject: 'paper4', // Economics
    weakSubject: 'paper2',   // Law
    studyHoursPerDay: 6,
    preferredTime: 'Night (रात)',
    bio: 'Scoring 80+ in Economics MCQs. Looking for partner for Indian Contract Act answer writing & daily 1-hour discussion.',
    city: 'Delhi',
    connected: true,
  },
  {
    id: 'sp_3',
    studentName: 'Manish Iyer',
    targetAttempt: 'Dec 2026',
    strongSubject: 'paper3', // Maths
    weakSubject: 'paper1',   // Accounts
    studyHoursPerDay: 7,
    preferredTime: 'Afternoon (दोपहर)',
    bio: 'Engineering background, QA/LR is my strength. Need guidance in Partnership accounts and depreciation schedules.',
    city: 'Chennai',
    connected: false,
  },
];
