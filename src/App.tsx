import { useState } from 'react';
import { RotateCcw } from 'lucide-react';
import { BrandLogo } from './components/BrandLogo';
import { InterviewWorkspace } from './components/InterviewWorkspace';
import { ResultsDashboard } from './components/ResultsDashboard';
import { WelcomeSetup } from './components/WelcomeSetup';
import {
  fetchFinalInterviewReport,
  fetchInterviewQuestions,
  submitAnswerForEvaluation,
} from './services/interviewApi';
import type {
  AnswerEvaluation,
  FinalInterviewReport,
  InterviewQuestion,
  QuestionSubmission,
  StudentProfile,
} from './types/interview';

type AppStage = 'setup' | 'interview' | 'report';

const DEFAULT_PROFILE: StudentProfile = {
  studentName: '',
  jobRole: 'Python Developer',
  experienceLevel: 'Fresher',
};

export default function App() {
  const [stage, setStage] = useState<AppStage>('setup');
  const [profile, setProfile] = useState<StudentProfile>(DEFAULT_PROFILE);

  const [questions, setQuestions] = useState<InterviewQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [answers, setAnswers] = useState<string[]>(['', '', '', '', '']);
  const [evaluations, setEvaluations] = useState<(AnswerEvaluation | null)[]>([
    null,
    null,
    null,
    null,
    null,
  ]);
  const [finalReport, setFinalReport] = useState<FinalInterviewReport | null>(null);

  const [isGeneratingQuestions, setIsGeneratingQuestions] = useState(false);
  const [isEvaluatingAnswer, setIsEvaluatingAnswer] = useState(false);
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  const handleStartInterview = async (nextProfile: StudentProfile) => {
    setApiError(null);
    setIsGeneratingQuestions(true);
    setProfile(nextProfile);

    try {
      const generatedQuestions = await fetchInterviewQuestions(nextProfile);
      setQuestions(generatedQuestions);
      setCurrentIndex(0);
      setAnswers(new Array(generatedQuestions.length).fill(''));
      setEvaluations(new Array(generatedQuestions.length).fill(null));
      setFinalReport(null);
      setStage('interview');
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Unable to generate interview questions. Please try again.';
      setApiError(message);
    } finally {
      setIsGeneratingQuestions(false);
    }
  };

  const handleAnswerChange = (index: number, value: string) => {
    setAnswers((prev) => {
      const updated = [...prev];
      updated[index] = value;
      return updated;
    });
  };

  const handleSubmitAnswer = async (index: number) => {
    const question = questions[index];
    const answer = answers[index]?.trim() ?? '';
    if (!question || !answer) return;

    setApiError(null);
    setIsEvaluatingAnswer(true);

    try {
      const evaluation = await submitAnswerForEvaluation({
        studentName: profile.studentName,
        jobRole: profile.jobRole,
        experienceLevel: profile.experienceLevel,
        question: question.question,
        category: question.category,
        answer,
      });

      setEvaluations((prev) => {
        const updated = [...prev];
        updated[index] = evaluation;
        return updated;
      });
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Unable to evaluate your answer. Please retry.';
      setApiError(message);
    } finally {
      setIsEvaluatingAnswer(false);
    }
  };

  const handleNextQuestion = () => {
    setApiError(null);
    if (currentIndex < questions.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    }
  };

  const handleCompleteInterview = async () => {
    if (evaluations.some((item) => item === null)) {
      setApiError('Please submit an answer for all 5 questions before viewing the report.');
      return;
    }

    const submissions: QuestionSubmission[] = questions.map((question, idx) => ({
      question,
      answer: answers[idx],
      evaluation: evaluations[idx] as AnswerEvaluation,
    }));

    setApiError(null);
    setIsGeneratingReport(true);

    try {
      const report = await fetchFinalInterviewReport({
        studentName: profile.studentName,
        jobRole: profile.jobRole,
        experienceLevel: profile.experienceLevel,
        submissions,
      });
      setFinalReport(report);
      setStage('report');
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Failed to generate final report. Please try again.';
      setApiError(message);
    } finally {
      setIsGeneratingReport(false);
    }
  };

  const handleRestartInterview = () => {
    setApiError(null);
    setQuestions([]);
    setCurrentIndex(0);
    setAnswers(['', '', '', '', '']);
    setEvaluations([null, null, null, null, null]);
    setFinalReport(null);
    setStage('setup');
  };

  const completedSubmissions: QuestionSubmission[] =
    stage === 'report'
      ? questions.map((question, idx) => ({
          question,
          answer: answers[idx],
          evaluation: evaluations[idx] as AnswerEvaluation,
        }))
      : [];

  return (
    <div className="relative min-h-screen bg-[#060B18] text-slate-100">
      {/* Subtle Navy / Electric Blue / Purple Ambient Gradients */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 overflow-hidden"
      >
        <div className="absolute -top-40 left-1/4 h-[420px] w-[420px] rounded-full bg-blue-600/12 blur-[120px]" />
        <div className="absolute top-20 right-1/5 h-[360px] w-[360px] rounded-full bg-violet-600/10 blur-[120px]" />
      </div>

      {/* Top Navigation Bar */}
      <header className="relative z-10 border-b border-white/10 bg-[#060B18]/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-8 px-4 py-4 sm:px-6 lg:px-8">
          <BrandLogo />

          <nav aria-label="Interview stages" className="hidden items-center gap-6 text-xs font-medium text-slate-400 md:flex">
            <span className={`whitespace-nowrap shrink-0 ${stage === 'setup' ? 'text-cyan-400' : ''}`}>
              1. Candidate Setup
            </span>
            <span className={`whitespace-nowrap shrink-0 ${stage === 'interview' ? 'text-cyan-400' : ''}`}>
              2. AI Interview
            </span>
            <span className={`whitespace-nowrap shrink-0 ${stage === 'report' ? 'text-cyan-400' : ''}`}>
              3. Final Report
            </span>
          </nav>

          <div className="flex items-center shrink-0">
            {stage !== 'setup' ? (
              <button
                type="button"
                onClick={handleRestartInterview}
                className="inline-flex min-h-[40px] items-center gap-2 rounded-lg border border-white/12 bg-white/5 px-3.5 py-2 text-xs font-medium text-slate-200 transition-colors hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 whitespace-nowrap shrink-0"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                <span>New Session</span>
              </button>
            ) : (
              <span className="text-xs font-medium text-slate-400 whitespace-nowrap shrink-0">
                Gemini AI Coach
              </span>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 pb-16">
        {stage === 'setup' && (
          <WelcomeSetup
            initialProfile={profile}
            isLoading={isGeneratingQuestions}
            apiError={apiError}
            onStartInterview={handleStartInterview}
          />
        )}

        {stage === 'interview' && questions.length === 5 && (
          <InterviewWorkspace
            profile={profile}
            questions={questions}
            currentIndex={currentIndex}
            answers={answers}
            evaluations={evaluations}
            isEvaluating={isEvaluatingAnswer}
            isGeneratingReport={isGeneratingReport}
            apiError={apiError}
            onSelectQuestion={(idx) => {
              setApiError(null);
              setCurrentIndex(idx);
            }}
            onAnswerChange={handleAnswerChange}
            onSubmitAnswer={handleSubmitAnswer}
            onNextQuestion={handleNextQuestion}
            onCompleteInterview={handleCompleteInterview}
          />
        )}

        {stage === 'report' && finalReport && (
          <ResultsDashboard
            profile={profile}
            submissions={completedSubmissions}
            report={finalReport}
            onRestartInterview={handleRestartInterview}
          />
        )}
      </main>
    </div>
  );
}
