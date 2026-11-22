import type {
  AnswerEvaluation,
  ExperienceLevel,
  FinalInterviewReport,
  InterviewQuestion,
  QuestionCategory,
  QuestionSubmission,
} from '../types/interview';

async function parseApiResponse<T>(response: Response): Promise<T> {
  let payload: unknown;
  try {
    payload = await response.json();
  } catch {
    if (response.status === 504) {
      throw new Error(
        'The AI request timed out on the server (HTTP 504). Please try again in a moment.',
      );
    }
    throw new Error(`Server returned an unexpected response (HTTP ${response.status}).`);
  }

  if (!response.ok) {
    const errorMessage =
      typeof payload === 'object' &&
      payload !== null &&
      'error' in payload &&
      typeof (payload as { error: unknown }).error === 'string'
        ? (payload as { error: string }).error
        : `Request failed with status ${response.status}.`;
    throw new Error(errorMessage);
  }

  return payload as T;
}

export async function fetchInterviewQuestions(params: {
  studentName: string;
  jobRole: string;
  experienceLevel: ExperienceLevel;
}): Promise<InterviewQuestion[]> {
  const response = await fetch('/api/interview/questions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });

  const data = await parseApiResponse<{ questions: InterviewQuestion[] }>(response);
  if (!Array.isArray(data.questions) || data.questions.length !== 5) {
    throw new Error('Expected 5 interview questions from the AI service.');
  }
  return data.questions;
}

export async function submitAnswerForEvaluation(params: {
  studentName: string;
  jobRole: string;
  experienceLevel: ExperienceLevel;
  question: string;
  category: QuestionCategory;
  answer: string;
}): Promise<AnswerEvaluation> {
  const response = await fetch('/api/interview/evaluate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });

  const data = await parseApiResponse<{ evaluation: AnswerEvaluation }>(response);
  if (!data.evaluation || typeof data.evaluation.score !== 'number') {
    throw new Error('Received an incomplete evaluation from the AI service.');
  }
  return data.evaluation;
}

export async function fetchFinalInterviewReport(params: {
  studentName: string;
  jobRole: string;
  experienceLevel: ExperienceLevel;
  submissions: QuestionSubmission[];
}): Promise<FinalInterviewReport> {
  const response = await fetch('/api/interview/report', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });

  const data = await parseApiResponse<{ report: FinalInterviewReport }>(response);
  if (!data.report || typeof data.report.totalScore !== 'number') {
    throw new Error('Received an incomplete final report from the AI service.');
  }
  return data.report;
}
