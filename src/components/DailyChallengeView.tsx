import React, { useState, useEffect } from 'react';
import { 
  Language, 
  UserProfile, 
  MCQQuestion, 
  DailyChallengeRecord 
} from '../types';
import { PAPERS } from '../data/papersData';
import { 
  getDailyChallengeQuestions, 
  getDailyChallengeState, 
  submitDailyChallengeResult 
} from '../utils/storageDb';
import { playChimeSound } from '../utils/audio';
import { 
  Target, 
  Flame, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Award, 
  Sparkles, 
  ChevronRight, 
  RotateCcw, 
  BookOpen,
  ArrowRight,
  ShieldCheck
} from 'lucide-react';

interface DailyChallengeViewProps {
  language: Language;
  currentUser: UserProfile;
  streak: number;
  onChallengeCompleted?: (points: number) => void;
}

export const DailyChallengeView: React.FC<DailyChallengeViewProps> = ({
  language,
  currentUser,
  streak,
  onChallengeCompleted,
}) => {
  const todayStr = new Date().toISOString().split('T')[0];
  const questions: MCQQuestion[] = getDailyChallengeQuestions(todayStr);

  const [existingRecord, setExistingRecord] = useState<DailyChallengeRecord | null>(() =>
    getDailyChallengeState(todayStr, currentUser.id)
  );

  // Active quiz session state
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, number>>({});
  const [showInstantExplanation, setShowInstantExplanation] = useState(false);
  const [isCompleted, setIsCompleted] = useState(existingRecord !== null);
  const [sessionPoints, setSessionPoints] = useState(existingRecord?.pointsEarned || 0);

  const currentQ = questions[currentIdx];

  const handleSelectOption = (idx: number) => {
    if (isCompleted || selectedAnswers[currentQ.id] !== undefined) return;
    playChimeSound('click');
    setSelectedAnswers((prev) => ({
      ...prev,
      [currentQ.id]: idx,
    }));
    setShowInstantExplanation(true);
  };

  const handleNext = () => {
    setShowInstantExplanation(false);
    if (currentIdx < questions.length - 1) {
      setCurrentIdx((prev) => prev + 1);
    } else {
      // Complete challenge
      calculateAndFinish();
    }
  };

  const calculateAndFinish = () => {
    let correctCount = 0;
    questions.forEach((q) => {
      if (selectedAnswers[q.id] === q.correctIndex) {
        correctCount++;
      }
    });

    const score = correctCount;
    const accuracy = Math.round((correctCount / questions.length) * 100);
    // Base 20 points + 10 points bonus if accuracy >= 80%
    const pointsEarned = 20 + (accuracy >= 80 ? 10 : 0);

    const record: DailyChallengeRecord = {
      date: todayStr,
      paperId: currentQ.paperId,
      completed: true,
      score,
      totalQuestions: questions.length,
      pointsEarned,
      accuracy,
      completedAt: new Date().toISOString(),
      userAnswers: selectedAnswers,
    };

    submitDailyChallengeResult(record, currentUser.id);
    setExistingRecord(record);
    setIsCompleted(true);
    setSessionPoints(pointsEarned);
    playChimeSound('complete');

    if (onChallengeCompleted) {
      onChallengeCompleted(pointsEarned);
    }
  };

  const answeredCount = Object.keys(selectedAnswers).length;

  return (
    <div className="space-y-6 pb-20 lg:pb-8">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-slate-900 rounded-3xl p-5 sm:p-6 text-white shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="px-2.5 py-0.5 rounded-full bg-amber-400/20 text-amber-300 text-[11px] font-black border border-amber-300/30 flex items-center gap-1">
              <Flame className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
              <span>{streak} {language === 'en' ? 'Days Streak' : 'दिनों की स्ट्रीक'}</span>
            </span>
            <span className="text-xs text-blue-200">
              {todayStr} • {language === 'en' ? 'Official Daily ICAI Drill' : 'दैनिक आईसीएआई अभ्यास'}
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white flex items-center gap-2">
            <Target className="w-7 h-7 text-amber-300" />
            <span>{language === 'en' ? 'CA Foundation Daily 10 Challenge' : 'सीए फाउंडेशन दैनिक 10 प्रश्न चुनौती'}</span>
          </h1>
          <p className="text-xs sm:text-sm text-blue-100/90 mt-1 max-w-xl">
            {language === 'en'
              ? '10 fresh questions rotated daily across all 4 papers. Earn +20 reward points and strengthen your AIR rank.'
              : 'सभी 4 विषयों से 10 नए प्रश्न प्रतिदिन। +20 रिवॉर्ड अंक अर्जित करें और अपनी रैंकिंग मजबूत करें।'}
          </p>
        </div>

        <div className="flex items-center gap-3 self-start md:self-auto shrink-0">
          <div className="px-4 py-2.5 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 text-center">
            <span className="text-[10px] uppercase font-bold text-blue-200 block">
              {language === 'en' ? 'Reward' : 'इनाम'}
            </span>
            <span className="text-lg font-black text-amber-300 flex items-center gap-1 justify-center">
              <Sparkles className="w-4 h-4" />
              <span>+20 pts</span>
            </span>
          </div>
        </div>
      </div>

      {isCompleted && existingRecord ? (
        /* Completed Scorecard View */
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-sm text-center max-w-xl mx-auto space-y-5 animate-in fade-in">
          <div className="w-16 h-16 rounded-3xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 mx-auto flex items-center justify-center">
            <Award className="w-8 h-8" />
          </div>

          <div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
              {language === 'en' ? "Today's Challenge Completed!" : 'आज की दैनिक चुनौती पूर्ण!'}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              {language === 'en'
                ? 'Your daily streak has been maintained and points added to your profile.'
                : 'आपकी दैनिक स्ट्रीक सुरक्षित हो गई है और अंक प्रोफाइल में जुड़ गए हैं।'}
            </p>
          </div>

          <div className="grid grid-cols-3 gap-3 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
            <div>
              <span className="text-2xl font-black text-blue-600 dark:text-blue-400">
                {existingRecord.score} / {existingRecord.totalQuestions}
              </span>
              <span className="text-[10px] font-bold uppercase text-slate-400 block mt-0.5">
                {language === 'en' ? 'Score' : 'अंक'}
              </span>
            </div>
            <div>
              <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
                {existingRecord.accuracy}%
              </span>
              <span className="text-[10px] font-bold uppercase text-slate-400 block mt-0.5">
                {language === 'en' ? 'Accuracy' : 'सटीकता'}
              </span>
            </div>
            <div>
              <span className="text-2xl font-black text-amber-500">
                +{existingRecord.pointsEarned}
              </span>
              <span className="text-[10px] font-bold uppercase text-slate-400 block mt-0.5">
                {language === 'en' ? 'Points' : 'रिवॉर्ड'}
              </span>
            </div>
          </div>

          {/* Review Question List */}
          <div className="text-left space-y-3 pt-3 border-t border-slate-100 dark:border-slate-800">
            <h3 className="font-bold text-slate-900 dark:text-white text-sm">
              {language === 'en' ? 'Question Review & Solutions:' : 'प्रश्न समाधान समीक्षा:'}
            </h3>
            <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
              {questions.map((q, qIdx) => {
                const userAns = existingRecord.userAnswers[q.id];
                const isCorrect = userAns === q.correctIndex;
                return (
                  <div
                    key={q.id}
                    className={`p-3.5 rounded-2xl border text-xs space-y-1.5 ${
                      isCorrect
                        ? 'border-emerald-200 dark:border-emerald-800 bg-emerald-50/40 dark:bg-emerald-950/20'
                        : 'border-rose-200 dark:border-rose-800 bg-rose-50/40 dark:bg-rose-950/20'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-black text-slate-700 dark:text-slate-300">Q{qIdx + 1}. {q.paperId.toUpperCase()}</span>
                      <span className={`font-bold text-[10px] px-2 py-0.5 rounded-full ${isCorrect ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>
                        {isCorrect ? 'Correct ✓' : 'Incorrect ✗'}
                      </span>
                    </div>
                    <p className="font-medium text-slate-900 dark:text-white">{q.question[language]}</p>
                    <p className="text-[11px] text-slate-600 dark:text-slate-400">
                      <strong>{language === 'en' ? 'Correct Answer:' : 'सही उत्तर:'}</strong> {q.options[language][q.correctIndex]}
                    </p>
                    <p className="text-[10px] text-slate-500 italic bg-white/60 dark:bg-slate-900/60 p-2 rounded-lg">
                      💡 {q.explanation[language]}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      ) : (
        /* Active Challenge Session View */
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-7 border border-slate-200 dark:border-slate-800 shadow-sm max-w-2xl mx-auto space-y-6">
          {/* Progress bar and counter */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-500 dark:text-slate-400">
                {language === 'en' ? `Question ${currentIdx + 1} of ${questions.length}` : `प्रश्न ${currentIdx + 1} / ${questions.length}`}
              </span>
              <span className="px-2 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 text-[10px] font-bold">
                {currentQ.paperId.toUpperCase()} • {currentQ.chapterTitle[language]}
              </span>
            </div>
            <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-blue-600 to-indigo-600 transition-all duration-300"
                style={{ width: `${((currentIdx + 1) / questions.length) * 100}%` }}
              />
            </div>
          </div>

          {/* Question Text */}
          <div className="space-y-3">
            <span className="inline-block text-[10px] font-bold uppercase tracking-wider text-slate-400">
              {currentQ.sourceLabel[language]}
            </span>
            <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white leading-relaxed">
              {currentQ.question[language]}
            </h2>
          </div>

          {/* Options */}
          <div className="space-y-2.5">
            {currentQ.options[language].map((opt, optIdx) => {
              const isSelected = selectedAnswers[currentQ.id] === optIdx;
              const hasAnswered = selectedAnswers[currentQ.id] !== undefined;
              const isCorrectOpt = optIdx === currentQ.correctIndex;

              let style = 'border-slate-200 dark:border-slate-800 hover:border-blue-400 dark:hover:border-blue-600 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200';

              if (hasAnswered) {
                if (isCorrectOpt) {
                  style = 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-950 dark:text-emerald-200 font-bold';
                } else if (isSelected && !isCorrectOpt) {
                  style = 'border-rose-500 bg-rose-50 dark:bg-rose-950/40 text-rose-950 dark:text-rose-200';
                } else {
                  style = 'opacity-50 border-slate-200 dark:border-slate-800';
                }
              }

              return (
                <button
                  key={optIdx}
                  type="button"
                  onClick={() => handleSelectOption(optIdx)}
                  disabled={hasAnswered}
                  className={`w-full p-3.5 rounded-2xl border text-left text-xs sm:text-sm font-medium transition-all flex items-center justify-between cursor-pointer ${style}`}
                >
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs flex items-center justify-center shrink-0">
                      {String.fromCharCode(65 + optIdx)}
                    </span>
                    <span>{opt}</span>
                  </div>

                  {hasAnswered && isCorrectOpt && (
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                  )}
                  {hasAnswered && isSelected && !isCorrectOpt && (
                    <XCircle className="w-5 h-5 text-rose-600 shrink-0" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Explanation Box */}
          {showInstantExplanation && (
            <div className="p-4 rounded-2xl bg-blue-50/70 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/60 text-xs space-y-1.5 animate-in fade-in">
              <span className="font-bold text-blue-900 dark:text-blue-300 flex items-center gap-1">
                <BookOpen className="w-4 h-4 text-blue-600" />
                <span>{language === 'en' ? 'ICAI Official Rationale:' : 'आईसीएआई आधिकारिक व्याख्या:'}</span>
              </span>
              <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
                {currentQ.explanation[language]}
              </p>
            </div>
          )}

          {/* Action Row */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
            <span className="text-xs text-slate-500 dark:text-slate-400">
              {answeredCount} / {questions.length} {language === 'en' ? 'Answered' : 'हल किए'}
            </span>

            <button
              onClick={handleNext}
              disabled={selectedAnswers[currentQ.id] === undefined}
              className="py-2.5 px-5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md transition-all active:scale-95 disabled:opacity-50 cursor-pointer flex items-center gap-2"
            >
              <span>{currentIdx === questions.length - 1 ? (language === 'en' ? 'Finish & Claim Points' : 'पूर्ण करें एवं अंक प्राप्त करें') : (language === 'en' ? 'Next Question →' : 'अगला प्रश्न →')}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
