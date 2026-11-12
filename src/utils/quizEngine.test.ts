import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateQuizScore, evaluatePassingCriteria, calculateStreak } from './quizEngine';

test('calculateQuizScore correctly handles all correct answers', () => {
  const questions = [
    { id: 'q1', correctIndex: 1 },
    { id: 'q2', correctIndex: 0 },
    { id: 'q3', correctIndex: 3 },
  ];
  const userAnswers = { q1: 1, q2: 0, q3: 3 };

  const result = calculateQuizScore(userAnswers, questions);
  assert.equal(result.totalQuestions, 3);
  assert.equal(result.attempted, 3);
  assert.equal(result.correct, 3);
  assert.equal(result.incorrect, 0);
  assert.equal(result.negativeMarks, 0);
  assert.equal(result.netScore, 3);
  assert.equal(result.accuracy, 100);
});

test('calculateQuizScore penalizes incorrect answers with 0.25 negative marks', () => {
  const questions = [
    { id: 'q1', correctIndex: 1 },
    { id: 'q2', correctIndex: 2 },
    { id: 'q3', correctIndex: 0 },
    { id: 'q4', correctIndex: 3 },
  ];
  // 2 correct, 2 incorrect -> 2 - (2 * 0.25) = 1.50
  const userAnswers = { q1: 1, q2: 0, q3: 0, q4: 1 };

  const result = calculateQuizScore(userAnswers, questions);
  assert.equal(result.attempted, 4);
  assert.equal(result.correct, 2);
  assert.equal(result.incorrect, 2);
  assert.equal(result.negativeMarks, 0.5);
  assert.equal(result.netScore, 1.5);
  assert.equal(result.accuracy, 50);
});

test('calculateQuizScore handles unattempted questions correctly without penalty', () => {
  const questions = [
    { id: 'q1', correctIndex: 1 },
    { id: 'q2', correctIndex: 2 },
    { id: 'q3', correctIndex: 0 },
  ];
  // Only q1 attempted, rest unattempted
  const userAnswers = { q1: 1 };

  const result = calculateQuizScore(userAnswers, questions);
  assert.equal(result.attempted, 1);
  assert.equal(result.unattempted, 2);
  assert.equal(result.correct, 1);
  assert.equal(result.incorrect, 0);
  assert.equal(result.netScore, 1);
});

test('evaluatePassingCriteria passes when all >=40 and aggregate >=200', () => {
  const scores = { paper1: 65, paper2: 55, paper3: 45, paper4: 70 };
  const evaluation = evaluatePassingCriteria(scores);
  assert.equal(evaluation.passed, true);
  assert.equal(evaluation.totalMarks, 235);
  assert.equal(evaluation.failedPapers.length, 0);
  assert.equal(evaluation.aggregateShortfall, 0);
});

test('evaluatePassingCriteria fails if any paper is below 40 even if total >= 200', () => {
  const scores = { paper1: 80, paper2: 80, paper3: 38, paper4: 60 }; // total = 258, but paper 3 is 38
  const evaluation = evaluatePassingCriteria(scores);
  assert.equal(evaluation.passed, false);
  assert.equal(evaluation.totalMarks, 258);
  assert.equal(evaluation.failedPapers.length, 1);
  assert.match(evaluation.failedPapers[0], /Paper 3/);
});

test('evaluatePassingCriteria fails if all >= 40 but aggregate is below 200', () => {
  const scores = { paper1: 42, paper2: 45, paper3: 40, paper4: 48 }; // total = 175 (< 200)
  const evaluation = evaluatePassingCriteria(scores);
  assert.equal(evaluation.passed, false);
  assert.equal(evaluation.totalMarks, 175);
  assert.equal(evaluation.failedPapers.length, 0);
  assert.equal(evaluation.aggregateShortfall, 25);
});

test('calculateStreak accurately computes consecutive active days', () => {
  const dates = ['2026-11-06', '2026-11-07', '2026-11-08'];
  const streak = calculateStreak(dates, '2026-11-08');
  assert.equal(streak, 3);
});
