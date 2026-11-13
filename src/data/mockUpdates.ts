import { ExamUpdate } from '../types';

export const MOCK_EXAM_UPDATES: ExamUpdate[] = [
  {
    id: 'upd_1',
    date: 'Jan 2027 Attempt',
    category: 'Guidance',
    isImportant: true,
    title: {
      en: 'CA Foundation January 2027 Paper Timings & Structure',
      hi: 'सीए फाउंडेशन जनवरी 2027 परीक्षा पैटर्न व समय',
    },
    summary: {
      en: 'Papers 1 & 2 run 2:00 PM–5:00 PM (3 hrs) and Papers 3 & 4 run 2:00 PM–4:00 PM (2 hrs, -0.25 negative marking). Exact verified dates appear on the dashboard once published by Admin.',
      hi: 'पेपर 1 व 2 दोपहर 2 से 5 बजे (3 घंटे) तथा पेपर 3 व 4 दोपहर 2 से 4 बजे (2 घंटे, -0.25 नकारात्मक अंकन) होते हैं। एडमिन द्वारा सत्यापित तिथि डैशबोर्ड पर प्रदर्शित होगी।',
    },
    detailedContent: {
      en: `Examination Schedule & Timings:
• Paper 1: Accounting (100 Marks, 3 Hours, 2:00 PM - 5:00 PM) - 15 mins reading time allowed.
• Paper 2: Business Laws (100 Marks, 3 Hours, 2:00 PM - 5:00 PM) - 15 mins reading time allowed.
• Paper 3: Quantitative Aptitude (100 Marks, 2 Hours, 2:00 PM - 4:00 PM, OMR based) - NO reading time. Negative marking applies (-0.25).
• Paper 4: Business Economics (100 Marks, 2 Hours, 2:00 PM - 4:00 PM, OMR based) - NO reading time. Negative marking applies (-0.25).

Admit cards are usually uploaded 14 days prior to the first examination date. Keep your registration number and password ready.`,
      hi: `परीक्षा समय सारणी एवं दिशा-निर्देश:
• पेपर 1: लेखांकन (100 अंक, 3 घंटे, दोपहर 2:00 से 5:00) - 15 मिनट प्रश्नपत्र पढ़ने का समय।
• पेपर 2: व्यापारिक कानून (100 अंक, 3 घंटे, दोपहर 2:00 से 5:00) - 15 मिनट प्रश्नपत्र पढ़ने का समय।
• पेपर 3: मात्रात्मक योग्यता (100 अंक, 2 घंटे, दोपहर 2:00 से 4:00, OMR शीट) - पढ़ने का अतिरिक्त समय नहीं। नकारात्मक अंकन (-0.25) लागू।
• पेपर 4: व्यावसायिक अर्थशास्त्र (100 अंक, 2 घंटे, दोपहर 2:00 से 4:00, OMR शीट) - पढ़ने का अतिरिक्त समय नहीं। नकारात्मक अंकन (-0.25) लागू।

प्रवेश पत्र (Admit Card) परीक्षा से लगभग 14 दिन पूर्व जारी किए जाते हैं।`,
    },
  },
  {
    id: 'upd_2',
    date: '04 Nov 2026',
    category: 'Guidance',
    isImportant: true,
    title: {
      en: 'Official Calculator Specifications & Allowed Models for Exam Hall',
      hi: 'परीक्षा भवन में मान्य कैलकुलेटर के नियम एवं स्वीकृत मॉडल',
    },
    summary: {
      en: 'Candidates are permitted to bring a battery-operated portable calculator with up to 6 functions, 12 digits, and up to two memories (e.g. Casio MJ-12D, Citizen CT-500). Scientific calculators are strictly prohibited.',
      hi: 'परीक्षार्थी 6 बुनियादी क्रियाओं, 12 अंकों और 2 मेमोरी (जैसे Casio MJ-12D / Citizen CT-500) वाला सामान्य कैलकुलेटर ले जा सकते हैं। साइंटिफिक कैलकुलेटर पूर्णतः प्रतिबंधित हैं।',
    },
    detailedContent: {
      en: `Permissible Calculator Features:
1. Addition (+), Subtraction (-), Multiplication (*), Division (/), Percentage (%), and Square Root (√).
2. Maximum 12 digits display.
3. Memory keys: M+, M-, MRC / MR / MC are allowed.
4. Scientific calculators with sin, cos, tan, log, exp functions or programmable alphanumeric memories are strictly confiscated at the exam gate.
5. Tip: Practice extensively with your exact exam calculator model to master GT (Grand Total) and memory recall shortcuts.`,
      hi: `मान्य कैलकुलेटर की विशेषताएं:
1. जोड़ (+), घटाव (-), गुणा (*), भाग (/), प्रतिशत (%), तथा वर्गमूल (√)।
2. अधिकतम 12 अंकों का डिस्प्ले।
3. मेमोरी कीज़: M+, M-, MRC मान्य हैं।
4. साइंटिफिक (त्रिकोणमितीय, लॉग) या प्रोग्रामेबल कैलकुलेटर परीक्षा केंद्र पर तुरंत जब्त कर लिए जाएंगे।
5. सलाह: परीक्षा में उसी कैलकुलेटर का उपयोग करें जिससे आप घर पर अभ्यास कर रहे हैं ताकि बटन दबाने की गति बनी रहे।`,
    },
  },
  {
    id: 'upd_3',
    date: '28 Oct 2026',
    category: 'Admit Card',
    isImportant: false,
    title: {
      en: 'Mock Test Series (MTS) Online & Physical Center Registration Open',
      hi: 'मॉक टेस्ट सीरीज़ (MTS) ऑनलाइन व ऑफलाइन पंजीकरण प्रारंभ',
    },
    summary: {
      en: 'Regional councils and branches commence Mock Test Series Series-I and Series-II. Practicing under strict 3-hour and 2-hour exam conditions builds exam stamina and time allocation precision.',
      hi: 'सीए फाउंडेशन छात्रों के लिए शाखाओं द्वारा मॉक टेस्ट सीरीज़ 1 व 2 आयोजित की जा रही है। 2 व 3 घंटे की वास्तविक परीक्षा स्थिति में अभ्यास करने से समय प्रबंधन बेहतर होता है।',
    },
    detailedContent: {
      en: `Why you must attempt Mock Tests:
• Identifies weak topics where conceptual clarity is missing.
• Trains your wrist speed for 100 marks subjective writing in Papers 1 & 2.
• Calibrates guessing instinct for negative marking in Papers 3 & 4 (never blind guess if confidence is below 50%).
• Solutions and suggested answers will be published within 48 hours of test completion.`,
      hi: `मॉक टेस्ट क्यों आवश्यक है:
• कमजोर अध्यायों की समय रहते पहचान हो जाती है।
• पेपर 1 व 2 के 100 अंकों के वर्णनात्मक पेपर को 3 घंटे में पूरा करने की गति बनती है।
• पेपर 3 व 4 में निगेटिव मार्किंग से बचने हेतु तुक्केबाजी पर नियंत्रण होता है।`,
    },
  },
];

export interface ExamFAQ {
  id: string;
  question: { en: string; hi: string };
  answer: { en: string; hi: string };
}

export const EXAM_FAQS: ExamFAQ[] = [
  {
    id: 'faq_1',
    question: {
      en: 'What is the exact passing criteria for CA Foundation?',
      hi: 'सीए फाउंडेशन पास करने का सटीक नियम क्या है?',
    },
    answer: {
      en: 'A candidate must obtain at least 40% marks in each paper (minimum 40 marks out of 100 in Paper 1, 2, 3, and 4) AND an aggregate of 50% marks in all four papers combined (minimum 200 marks out of 400). If you score 39 in one paper and 250 in aggregate, you will still fail.',
      hi: 'प्रत्येक पेपर में न्यूनतम 40 अंक (100 में से) प्राप्त करना अनिवार्य है तथा चारों पेपर्स का कुल योग न्यूनतम 50% (400 में से 200 अंक) होना चाहिए। यदि किसी एक विषय में 39 अंक रह जाएं और कुल योग 250 भी हो, तब भी परिणाम अनुत्तीर्ण होगा।',
    },
  },
  {
    id: 'faq_2',
    question: {
      en: 'Is there negative marking in all 4 papers?',
      hi: 'क्या सभी चारों पेपर्स में निगेटिव मार्किंग होती है?',
    },
    answer: {
      en: 'No! Negative marking exists ONLY in Paper 3 (Quantitative Aptitude) and Paper 4 (Business Economics), which are objective MCQ tests. 0.25 marks are deducted for every wrong answer. In Paper 1 (Accounting) and Paper 2 (Business Laws), there is NO negative marking as they are subjective descriptive papers.',
      hi: 'नहीं! निगेटिव मार्किंग केवल पेपर 3 (गणित/सांख्यिकी) और पेपर 4 (अर्थशास्त्र) में होती है, जो OMR वस्तुनिष्ठ हैं। प्रत्येक गलत उत्तर पर 0.25 अंक काटे जाते हैं। पेपर 1 और 2 वर्णनात्मक (सब्जेक्टिव) हैं, जिनमें निगेटिव मार्किंग नहीं होती।',
    },
  },
  {
    id: 'faq_3',
    question: {
      en: 'Can I write the exam in Hindi medium?',
      hi: 'क्या मैं परीक्षा हिंदी माध्यम में दे सकता/सकती हूं?',
    },
    answer: {
      en: 'Yes! CA Foundation allows students to opt for Hindi medium while filling the exam form. Question papers are bilingual (printed in both Hindi and English). Students can answer Papers 1 & 2 in Hindi.',
      hi: 'हाँ! परीक्षा फॉर्म भरते समय आप हिंदी माध्यम चुन सकते हैं। प्रश्नपत्र द्विभाषी (हिंदी व अंग्रेजी दोनों) में मुद्रित होते हैं। आप पेपर 1 और 2 के उत्तर हिंदी में लिख सकते हैं।',
    },
  },
];
