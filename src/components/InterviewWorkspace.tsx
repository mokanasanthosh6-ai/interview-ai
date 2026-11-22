import { useState } from 'react';
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Check,
  Loader2,
  Send,
  Sparkles,
} from 'lucide-react';
import type {
  AnswerEvaluation,
  InterviewQuestion,
  StudentProfile,
} from '../types/interview';
import { EvaluationPanel } from './EvaluationPanel';

interface InterviewWorkspaceProps {
  profile: StudentProfile;
  questions: InterviewQuestion[];
  currentIndex: number;
  answers: string[];
  evaluations: (AnswerEvaluation | null)[];
  isEvaluating: boolean;
  isGeneratingReport: boolean;
  apiError: string | null;
  onSelectQuestion: (index: number) => void;
  onAnswerChange: (index: number, value: string) => void;
  onSubmitAnswer: (index: number) => void;
  onNextQuestion: () => void;
  onCompleteInterview: () => void;
}

export function InterviewWorkspace({
  profile,
  questions,
  currentIndex,
  answers,
  evaluations,
  isEvaluating,
  isGeneratingReport,
  apiError,
  onSelectQuestion,
  onAnswerChange,
  onSubmitAnswer,
  onNextQuestion,
  onCompleteInterview,
}: InterviewWorkspaceProps) {
  const [validationError, setValidationError] = useState<string | null>(null);

  const currentQuestion = questions[currentIndex];
  const currentAnswer = answers[currentIndex] ?? '';
  const currentEvaluation = evaluations[currentIndex] ?? null;

  const answeredCount = evaluations.filter(Boolean).length;
  const isLastQuestion = currentIndex === questions.length - 1;
  const allCompleted = answeredCount === questions.length;
  const isBusy = isEvaluating || isGeneratingReport;

  const trimmedLength = currentAnswer.trim().length;
  const wordCount = currentAnswer.trim()
    ? currentAnswer.trim().split(/\s+/).length
    : 0;

  const handleAnswerInput = (value: string) => {
    if (validationError) {
      setValidationError(null);
    }
    onAnswerChange(currentIndex, value);
  };

  const handleSubmit = () => {
    if (currentAnswer.trim().length < 3) {
      setValidationError('Please write your answer before submitting for evaluation.');
      return;
    }
    setValidationError(null);
    onSubmitAnswer(currentIndex);
  };

  // Highest question index the student has reached so they can navigate back to completed questions
  const firstUnansweredIndex = evaluations.findIndex((item) => item === null);
  const maxAccessibleIndex =
    firstUnansweredIndex === -1 ? questions.length - 1 : firstUnansweredIndex;

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
      {/* Progress Header */}
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400">
            <span className="font-medium text-slate-200">{profile.studentName}</span>
            <span aria-hidden="true">·</span>
            <span>{profile.jobRole}</span>
            <span aria-hidden="true">·</span>
            <span>{profile.experienceLevel}</span>
          </div>
          <h1 className="mt-1 text-xl font-bold text-white sm:text-2xl">
            Mock Interview Session
          </h1>
        </div>

        <div className="flex items-center gap-3 text-sm">
          <span className="font-mono text-xs text-slate-400 tabular-nums">
            Completed {answeredCount} of {questions.length}
          </span>
        </div>
      </div>

      {/* 5-Step Progress Selector */}
      <nav aria-label="Interview questions progress" className="mb-8">
        <ol className="grid grid-cols-5 gap-2 sm:gap-3">
          {questions.map((q, idx) => {
            const isCompleted = evaluations[idx] !== null;
            const isCurrent = idx === currentIndex;
            const canNavigate = idx <= maxAccessibleIndex && !isBusy;

            return (
              <li key={q.id}>
                <button
                  type="button"
                  disabled={!canNavigate}
                  onClick={() => {
                    setValidationError(null);
                    onSelectQuestion(idx);
                  }}
                  className={`flex w-full items-center justify-between rounded-xl border px-3 py-2.5 text-left transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 ${
                    isCurrent
                      ? 'border-cyan-400/70 bg-blue-600/20 text-white'
                      : isCompleted
                        ? 'border-emerald-500/30 bg-[#0B1328]/80 text-slate-200 hover:border-emerald-400/50'
                        : 'border-white/8 bg-[#0B1328]/40 text-slate-500'
                  } disabled:cursor-not-allowed`}
                >
                  <div className="min-w-0">
                    <span className="block font-mono text-xs font-semibold tabular-nums">
                      Q{idx + 1}
                    </span>
                    <span className="hidden truncate text-[11px] text-slate-400 sm:block">
                      {q.category}
                    </span>
                  </div>
                  {isCompleted ? (
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400">
                      <Check className="h-3 w-3" />
                    </span>
                  ) : (
                    <span
                      className={`font-mono text-[11px] tabular-nums ${
                        isCurrent ? 'text-cyan-300' : 'text-slate-600'
                      }`}
                    >
                      {isCurrent ? 'Active' : '—'}
                    </span>
                  )}
                </button>
              </li>
            );
          })}
        </ol>
      </nav>

      {/* Main Question & Answer Workspace */}
      <div className="space-y-6">
        <article className="rounded-2xl border border-white/12 bg-[#0B1328]/85 p-6 shadow-2xl shadow-blue-950/20 backdrop-blur-md sm:p-8">
          {/* Unboxed Question Metadata Kicker */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-4">
            <div className="flex flex-wrap items-center gap-2 text-xs font-medium">
              <span className="font-mono text-cyan-400 tabular-nums">
                Question {currentIndex + 1} of {questions.length}
              </span>
              <span className="text-slate-600" aria-hidden="true">
                ·
              </span>
              <span
                className={
                  currentQuestion.category === 'Technical'
                    ? 'text-blue-300'
                    : 'text-violet-300'
                }
              >
                {currentQuestion.category}
              </span>
              <span className="text-slate-600" aria-hidden="true">
                ·
              </span>
              <span className="text-slate-400">{currentQuestion.topic}</span>
            </div>

            {currentEvaluation && (
              <span className="font-mono text-xs font-semibold text-emerald-400 tabular-nums">
                Evaluated · {currentEvaluation.score} / 10
              </span>
            )}
          </div>

          {/* Question Prompt */}
          <h2 className="mt-5 text-xl font-semibold leading-snug text-white [text-wrap:balance] sm:text-2xl">
            {currentQuestion.question}
          </h2>

          {/* Answer Area */}
          <div className="mt-6">
            <div className="flex items-center justify-between">
              <label
                htmlFor={`answer-input-${currentQuestion.id}`}
                className="text-sm font-medium text-slate-300"
              >
                Your Answer
              </label>
              <span className="font-mono text-xs text-slate-400 tabular-nums">
                {wordCount} {wordCount === 1 ? 'word' : 'words'} · {trimmedLength} chars
              </span>
            </div>

            <textarea
              id={`answer-input-${currentQuestion.id}`}
              rows={6}
              value={currentAnswer}
              onChange={(e) => handleAnswerInput(e.target.value)}
              readOnly={Boolean(currentEvaluation)}
              disabled={isBusy}
              placeholder={
                currentQuestion.category === 'Technical'
                  ? 'Explain the core concept clearly, mention edge cases or trade-offs, and include a brief example where helpful...'
                  : 'Structure your response clearly (situation, action, outcome) and keep it honest and specific...'
              }
              className={`mt-2 w-full rounded-xl border bg-[#060B18]/90 px-4 py-3.5 text-sm leading-relaxed text-slate-100 placeholder-slate-500 transition-colors focus:outline-none ${
                currentEvaluation
                  ? 'border-white/8 text-slate-300'
                  : 'border-white/12 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20'
              } disabled:opacity-60`}
            />

            {validationError && (
              <p className="mt-2 flex items-center gap-1.5 text-xs text-rose-400" role="alert">
                <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                <span>{validationError}</span>
              </p>
            )}
          </div>

          {/* API Error Banner */}
          {apiError && (
            <div
              role="alert"
              className="mt-5 flex items-start gap-3 rounded-xl border border-rose-500/40 bg-rose-950/40 p-4 text-sm text-rose-200"
            >
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-rose-400" />
              <div>
                <p className="font-semibold text-rose-100">AI request encountered an error</p>
                <p className="mt-1 text-xs leading-relaxed text-rose-200/90">{apiError}</p>
              </div>
            </div>
          )}

          {/* Action Controls */}
          <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-5">
            <div>
              {currentIndex > 0 && (
                <button
                  type="button"
                  disabled={isBusy}
                  onClick={() => {
                    setValidationError(null);
                    onSelectQuestion(currentIndex - 1);
                  }}
                  className="inline-flex min-h-[42px] items-center gap-2 rounded-xl border border-white/12 bg-white/5 px-4 py-2 text-sm font-medium text-slate-200 transition-colors hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 disabled:opacity-50 whitespace-nowrap"
                >
                  <ArrowLeft className="h-4 w-4" />
                  <span>Previous</span>
                </button>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {!currentEvaluation && (
                <button
                  type="button"
                  disabled={isBusy}
                  onClick={handleSubmit}
                  className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 px-6 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-600/25 transition-all hover:from-blue-500 hover:via-indigo-500 hover:to-violet-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 disabled:cursor-not-allowed disabled:opacity-70 whitespace-nowrap"
                >
                  {isEvaluating ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Evaluating answer...</span>
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4" />
                      <span>Submit Answer</span>
                    </>
                  )}
                </button>
              )}

              {currentEvaluation && !isLastQuestion && (
                <button
                  type="button"
                  disabled={isBusy}
                  onClick={() => {
                    setValidationError(null);
                    onNextQuestion();
                  }}
                  className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 px-6 py-2.5 text-sm font-semibold text-white shadow-lg shadow-cyan-900/25 transition-all hover:from-blue-500 hover:to-cyan-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 disabled:opacity-70 whitespace-nowrap"
                >
                  <span>Next Question</span>
                  <ArrowRight className="h-4 w-4" />
                </button>
              )}

              {currentEvaluation && (isLastQuestion || allCompleted) && (
                <button
                  type="button"
                  disabled={!allCompleted || isBusy}
                  onClick={onCompleteInterview}
                  className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 px-6 py-2.5 text-sm font-semibold text-white shadow-lg shadow-violet-900/30 transition-all hover:from-blue-500 hover:via-indigo-500 hover:to-violet-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 disabled:cursor-not-allowed disabled:opacity-70 whitespace-nowrap"
                >
                  {isGeneratingReport ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Compiling final report...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4" />
                      <span>View Final Report</span>
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </article>

        {/* Loading Skeleton while Gemini evaluates */}
        {isEvaluating && !currentEvaluation && (
          <div
            aria-live="polite"
            className="rounded-2xl border border-cyan-500/25 bg-[#0B1328]/70 p-6 backdrop-blur-md sm:p-8"
          >
            <div className="flex items-center gap-3 text-sm font-medium text-cyan-300">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Gemini AI is evaluating your response for accuracy, clarity, and depth...</span>
            </div>
            <div className="mt-5 space-y-3">
              <div className="h-3 w-3/4 animate-pulse rounded bg-slate-800" />
              <div className="h-3 w-1/2 animate-pulse rounded bg-slate-800" />
            </div>
          </div>
        )}

        {/* Immediate AI Evaluation Panel */}
        {currentEvaluation && <EvaluationPanel evaluation={currentEvaluation} />}
      </div>
    </div>
  );
}
