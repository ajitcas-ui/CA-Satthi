import React, { useState } from 'react';
import { Language, UserProfile, PaperId, DoubtQuery } from '../types';
import { PAPERS } from '../data/papersData';
import { getDoubtHistory, saveDoubtQuery } from '../utils/storageDb';
import { playChimeSound } from '../utils/audio';
import { 
  Sparkles, 
  Send, 
  UploadCloud, 
  Image as ImageIcon, 
  BookOpen, 
  CheckCircle2, 
  HelpCircle, 
  Clock, 
  AlertCircle, 
  RefreshCw, 
  X, 
  FileText,
  Lightbulb,
  GraduationCap
} from 'lucide-react';

interface AIDoubtSolverViewProps {
  language: Language;
  currentUser: UserProfile;
}

export const AIDoubtSolverView: React.FC<AIDoubtSolverViewProps> = ({
  language,
  currentUser,
}) => {
  const [selectedPaper, setSelectedPaper] = useState<PaperId>('paper1');
  const [questionText, setQuestionText] = useState('');
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [imageFileName, setImageFileName] = useState('');
  const [explanationLanguage, setExplanationLanguage] = useState<'en' | 'hi' | 'hinglish'>('en');

  // Loading & Result state
  const [isSolving, setIsSolving] = useState(false);
  const [currentSolution, setCurrentSolution] = useState<{
    explanation: string;
    conceptKey: string;
    icaiReferenceNote: string;
  } | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // History state
  const [doubtHistory, setDoubtHistory] = useState<DoubtQuery[]>(() => getDoubtHistory(currentUser.id));
  const [showHistory, setShowHistory] = useState(false);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setErrorMsg(language === 'en' ? 'Please upload a valid image file.' : 'कृपया केवल इमेज फाइल अपलोड करें।');
      return;
    }

    setImageFileName(file.name);
    const reader = new FileReader();
    reader.onload = () => {
      setUploadedImage(reader.result as string);
      setErrorMsg(null);
    };
    reader.readAsDataURL(file);
  };

  const handleSolveDoubt = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!questionText.trim() && !uploadedImage) {
      setErrorMsg(language === 'en' ? 'Please type your question or upload an image.' : 'कृपया अपना प्रश्न लिखें या फोटो अपलोड करें।');
      return;
    }

    setIsSolving(true);
    setErrorMsg(null);
    playChimeSound('click');

    try {
      const response = await fetch('/api/ai-doubt-solver', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: questionText.trim(),
          paperId: selectedPaper,
          imageBase64: uploadedImage,
          language: explanationLanguage,
        }),
      });

      const data = await response.json();

      if (!response.ok || data.error) {
        throw new Error(data.error || 'Failed to analyze doubt.');
      }

      const solution = {
        explanation: data.explanation,
        conceptKey: data.conceptKey || 'ICAI Foundation Core Concept',
        icaiReferenceNote: data.icaiReferenceNote || 'Aligned with ICAI New Scheme Study Material',
      };

      setCurrentSolution(solution);
      playChimeSound('success');

      // Save to history
      const newDoubt: DoubtQuery = {
        id: `dbt_${Date.now()}`,
        studentId: currentUser.id,
        paperId: selectedPaper,
        questionText: questionText.trim() || 'Question image uploaded',
        imageUrl: uploadedImage || undefined,
        language: explanationLanguage,
        stepByStepExplanation: solution.explanation,
        conceptKey: solution.conceptKey,
        icaiReferenceNote: solution.icaiReferenceNote,
        timestamp: new Date().toISOString(),
      };

      saveDoubtQuery(newDoubt);
      setDoubtHistory((prev) => [newDoubt, ...prev]);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Error communicating with AI Doubt Solver.');
    } finally {
      setIsSolving(false);
    }
  };

  const currentPaperInfo = PAPERS.find((p) => p.id === selectedPaper);

  return (
    <div className="space-y-6 pb-20 lg:pb-8">
      {/* View Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
            <span>{language === 'en' ? 'AI Doubt Solver & Conceptual Mentor' : 'एआई शंका समाधान एवं मेंटर'}</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            {language === 'en'
              ? 'Instant step-by-step academic solutions across Accounts, Law, Maths & Economics. Type questions or upload textbook photos.'
              : 'लेखांकन, विधि, गणित एवं अर्थशास्त्र की शंकाओं का त्वरित चरणबद्ध समाधान। प्रश्न लिखें या फोटो अपलोड करें।'}
          </p>
        </div>

        <button
          onClick={() => setShowHistory(!showHistory)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 cursor-pointer self-start sm:self-auto"
        >
          <Clock className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
          <span>{language === 'en' ? `Past Doubts (${doubtHistory.length})` : `पूर्व शंकाएं (${doubtHistory.length})`}</span>
        </button>
      </div>

      {/* Main Grid: Form on left, Solution / History on right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Ask Form */}
        <div className="lg:col-span-6 space-y-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-6 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
            
            {/* Subject Selector Tabs */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
                {language === 'en' ? '1. Select CA Foundation Subject:' : '1. सीए फाउंडेशन विषय चुनें:'}
              </label>
              <div className="grid grid-cols-2 gap-2">
                {PAPERS.map((paper) => (
                  <button
                    key={paper.id}
                    type="button"
                    onClick={() => setSelectedPaper(paper.id)}
                    className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                      selectedPaper === paper.id
                        ? 'border-indigo-600 dark:border-indigo-500 bg-indigo-50/60 dark:bg-indigo-950/40 ring-1 ring-indigo-600'
                        : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/40'
                    }`}
                  >
                    <span className="text-[10px] font-black text-indigo-700 dark:text-indigo-400 block">{paper.code}</span>
                    <span className="text-xs font-bold text-slate-900 dark:text-white truncate block">
                      {paper.name[language].split('(')[0]}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Language Selector */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                {language === 'en' ? '2. Preferred Explanation Language:' : '2. स्पष्टीकरण की भाषा:'}
              </label>
              <div className="inline-flex p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
                {(['en', 'hi', 'hinglish'] as const).map((lang) => (
                  <button
                    key={lang}
                    type="button"
                    onClick={() => setExplanationLanguage(lang)}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer capitalize ${
                      explanationLanguage === lang
                        ? 'bg-white dark:bg-slate-700 text-indigo-700 dark:text-indigo-300 shadow-xs'
                        : 'text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    {lang === 'en' ? 'English' : lang === 'hi' ? 'हिंदी' : 'Hinglish'}
                  </button>
                ))}
              </div>
            </div>

            {/* Question Text Form */}
            <form onSubmit={handleSolveDoubt} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {language === 'en' ? '3. Type Question, Case Law, or Numerical Doubt:' : '3. प्रश्न या संख्यात्मक शंका लिखें:'}
                </label>
                <textarea
                  rows={4}
                  placeholder={
                    selectedPaper === 'paper1'
                      ? 'e.g. How to pass rectification entry when credit sales of ₹8,000 were wrongly entered in Purchases Day Book?'
                      : selectedPaper === 'paper2'
                      ? 'e.g. Explain Balfour v Balfour domestic contract principle with landmark legal exceptions.'
                      : selectedPaper === 'paper3'
                      ? 'e.g. Find the effective rate of interest corresponding to nominal rate of 7% p.a. compounded quarterly.'
                      : 'e.g. Why does the demand curve have a negative slope? Explain with substitution effect.'
                  }
                  value={questionText}
                  onChange={(e) => setQuestionText(e.target.value)}
                  className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs sm:text-sm focus:outline-indigo-500 leading-relaxed"
                />
              </div>

              {/* Photo Upload Option */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {language === 'en' ? 'Or Upload Question Photo / Textbook Clip (Optional):' : 'अथवा प्रश्न की फोटो संलग्न करें (वैकल्पिक):'}
                </label>
                
                {uploadedImage ? (
                  <div className="p-3 rounded-2xl border border-indigo-200 dark:border-indigo-800 bg-indigo-50/50 dark:bg-indigo-950/30 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <img
                        src={uploadedImage}
                        alt="Question upload"
                        className="w-14 h-14 rounded-xl object-cover border border-indigo-200"
                      />
                      <div>
                        <span className="text-xs font-bold text-slate-900 dark:text-white block truncate max-w-[200px]">
                          {imageFileName || 'Question_Photo.jpg'}
                        </span>
                        <span className="text-[10px] text-indigo-700 dark:text-indigo-400 font-semibold">
                          {language === 'en' ? 'Image attached for AI analysis' : 'इमेज संलग्न'}
                        </span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setUploadedImage(null);
                        setImageFileName('');
                      }}
                      className="text-xs font-bold text-rose-600 hover:text-rose-700 p-1.5 rounded-lg hover:bg-rose-50 cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <label className="border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-indigo-500 rounded-2xl p-4 text-center flex flex-col items-center justify-center cursor-pointer transition-colors bg-slate-50 dark:bg-slate-800/40">
                    <ImageIcon className="w-6 h-6 text-indigo-500 mb-1" />
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      {language === 'en' ? 'Click to snap or upload question photo' : 'प्रश्न की फोटो अपलोड करने हेतु क्लिक करें'}
                    </span>
                    <span className="text-[10px] text-slate-400 mt-0.5">JPG, PNG (Supports handwritten doubts)</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                  </label>
                )}
              </div>

              {errorMsg && (
                <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs font-semibold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={isSolving}
                className="w-full py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm shadow-md transition-all active:scale-95 disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
              >
                {isSolving ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>{language === 'en' ? 'Analyzing ICAI Concept & Solving...' : 'विश्लेषण किया जा रहा है...'}</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-amber-300" />
                    <span>{language === 'en' ? 'Solve Step-by-Step with AI Mentor' : 'चरणबद्ध समाधान प्राप्त करें'}</span>
                  </>
                )}
              </button>
            </form>
          </div>
        </div>

        {/* Right Column: Solution Output or History Drawer */}
        <div className="lg:col-span-6 space-y-4">
          {showHistory ? (
            /* History Panel */
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <h3 className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-2">
                  <Clock className="w-4 h-4 text-indigo-600" />
                  <span>{language === 'en' ? 'Solved Doubts History' : 'पूर्व हल की गई शंकाएं'}</span>
                </h3>
                <button
                  onClick={() => setShowHistory(false)}
                  className="text-xs text-indigo-600 dark:text-indigo-400 font-bold hover:underline cursor-pointer"
                >
                  {language === 'en' ? 'Back to Solver' : 'सॉल्वर पर लौटें'}
                </button>
              </div>

              {doubtHistory.length === 0 ? (
                <p className="text-xs text-slate-500 py-6 text-center">
                  {language === 'en' ? 'No doubts solved yet.' : 'कोई पूर्व शंका नहीं मिली।'}
                </p>
              ) : (
                <div className="space-y-2.5 max-h-[500px] overflow-y-auto pr-1">
                  {doubtHistory.map((d) => (
                    <div
                      key={d.id}
                      onClick={() => {
                        setCurrentSolution({
                          explanation: d.stepByStepExplanation,
                          conceptKey: d.conceptKey,
                          icaiReferenceNote: d.icaiReferenceNote,
                        });
                        setShowHistory(false);
                      }}
                      className="p-3 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-indigo-400 bg-slate-50/50 dark:bg-slate-800/40 transition-all cursor-pointer space-y-1"
                    >
                      <div className="flex items-center justify-between text-[10px]">
                        <span className="font-bold px-1.5 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300">
                          {d.paperId.toUpperCase()}
                        </span>
                        <span className="text-slate-400">{new Date(d.timestamp).toLocaleDateString()}</span>
                      </div>
                      <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 line-clamp-2">
                        {d.questionText}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : currentSolution ? (
            /* Solution Card */
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-6 border border-indigo-200 dark:border-indigo-800 shadow-md space-y-4 animate-in fade-in">
              <div className="flex items-start justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 flex items-center justify-center font-bold">
                    <GraduationCap className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 dark:text-white text-sm">
                      {currentSolution.conceptKey}
                    </h3>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400">
                      {currentSolution.icaiReferenceNote}
                    </span>
                  </div>
                </div>

                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" />
                  <span>{language === 'en' ? 'Verified ICAI Logic' : 'सत्यापित नियम'}</span>
                </span>
              </div>

              {/* Render formatted solution */}
              <div className="text-xs sm:text-sm text-slate-800 dark:text-slate-200 leading-relaxed whitespace-pre-wrap font-sans bg-slate-50 dark:bg-slate-950/60 p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
                {currentSolution.explanation}
              </div>

              <div className="p-3 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-200/60 dark:border-indigo-800/60 text-indigo-950 dark:text-indigo-200 text-xs flex items-center gap-2">
                <Lightbulb className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
                <span>
                  {language === 'en'
                    ? 'Always verify journal balances and apply ICAI negative marking discipline.'
                    : 'जर्नल प्रविष्टियों में Narration अवश्य लिखें और -0.25 नकारात्मक अंकन का ध्यान रखें।'}
                </span>
              </div>
            </div>
          ) : (
            /* Empty State / Prompt suggestions */
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 border border-dashed border-slate-300 dark:border-slate-800 text-center space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 mx-auto flex items-center justify-center">
                <BookOpen className="w-7 h-7" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white text-base">
                  {language === 'en' ? 'CA Saathi AI Academic Guidance' : 'सीए साथी एआई शैक्षणिक मार्गदर्शन'}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto mt-1 leading-relaxed">
                  {language === 'en'
                    ? 'Trained on the ICAI New Scheme Syllabus. Solves complex adjustments, calculator sequences, and legal cases without inventing false answers.'
                    : 'आईसीएआई नवीन योजना पाठ्यक्रम पर आधारित। कठिन समायोजन, कैलकुलेटर ट्रिक्स और कानूनी केसों का सटीक समाधान।'}
                </p>
              </div>

              <div className="space-y-2 pt-2 text-left">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block text-center">
                  {language === 'en' ? 'Popular Foundation Doubts:' : 'प्रसिद्ध शंकाएं:'}
                </span>
                {[
                  'How to calculate TVM Ordinary Annuity on Casio MJ-12D?',
                  'Domestic Agreement vs Legal Intention (Balfour v Balfour)',
                  'Rectification of error when sales wrongly entered in purchases',
                  'Kinked Demand Curve under Oligopoly (Paul Sweezy)',
                ].map((q, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setQuestionText(q);
                      if (q.includes('Casio') || q.includes('TVM')) setSelectedPaper('paper3');
                      else if (q.includes('Balfour')) setSelectedPaper('paper2');
                      else if (q.includes('Rectification')) setSelectedPaper('paper1');
                      else setSelectedPaper('paper4');
                    }}
                    className="w-full text-left p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-indigo-400 hover:bg-indigo-50/40 dark:hover:bg-slate-800/60 text-xs text-slate-700 dark:text-slate-300 transition-colors flex items-center justify-between cursor-pointer"
                  >
                    <span>{q}</span>
                    <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-bold">Try →</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
