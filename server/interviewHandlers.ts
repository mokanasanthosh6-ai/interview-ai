import type { IncomingMessage, ServerResponse } from 'node:http';
import {
  evaluateStudentAnswer,
  GeminiServiceError,
  generateFinalReport,
  generateInterviewQuestions,
} from './gemini.ts';
import type {
  ExperienceLevel,
  QuestionCategory,
  QuestionSubmission,
} from '../src/types/interview.ts';

export interface HandlerResult {
  status: number;
  payload: unknown;
}

function isValidExperienceLevel(value: unknown): value is ExperienceLevel {
  return value === 'Fresher' || value === 'Experienced';
}

function isValidCategory(value: unknown): value is QuestionCategory {
  return value === 'Technical' || value === 'HR';
}

export async function handleQuestionsRequest(
  body: Record<string, unknown>,
): Promise<HandlerResult> {
  try {
    const studentName = typeof body.studentName === 'string' ? body.studentName.trim() : '';
    const jobRole = typeof body.jobRole === 'string' ? body.jobRole.trim() : '';
    const experienceLevel = body.experienceLevel;

    if (studentName.length < 2 || studentName.length > 80) {
      return {
        status: 400,
        payload: { error: 'Please enter a valid student name (2–80 characters).' },
      };
    }

    if (jobRole.length < 2 || jobRole.length > 80) {
      return {
        status: 400,
        payload: { error: 'Please select or enter a valid job role.' },
      };
    }

    if (!isValidExperienceLevel(experienceLevel)) {
      return {
        status: 400,
        payload: { error: 'Experience level must be either Fresher or Experienced.' },
      };
    }

    const questions = await generateInterviewQuestions(studentName, jobRole, experienceLevel);
    return { status: 200, payload: { questions } };
  } catch (error) {
    if (error instanceof GeminiServiceError) {
      return { status: error.statusCode, payload: { error: error.message } };
    }
    const message =
      error instanceof Error ? error.message : 'Failed to generate interview questions.';
    return { status: 500, payload: { error: message } };
  }
}

export async function handleEvaluateRequest(
  body: Record<string, unknown>,
): Promise<HandlerResult> {
  try {
    const studentName = typeof body.studentName === 'string' ? body.studentName.trim() : '';
    const jobRole = typeof body.jobRole === 'string' ? body.jobRole.trim() : '';
    const experienceLevel = body.experienceLevel;
    const question = typeof body.question === 'string' ? body.question.trim() : '';
    const category = body.category;
    const answer = typeof body.answer === 'string' ? body.answer.trim() : '';

    if (!studentName || !jobRole || !isValidExperienceLevel(experienceLevel)) {
      return { status: 400, payload: { error: 'Missing candidate profile information.' } };
    }

    if (!question || !isValidCategory(category)) {
      return { status: 400, payload: { error: 'Missing valid interview question metadata.' } };
    }

    if (answer.length < 3) {
      return {
        status: 400,
        payload: { error: 'Please write an answer before submitting for evaluation.' },
      };
    }

    if (answer.length > 8000) {
      return {
        status: 400,
        payload: { error: 'Answer exceeds maximum length of 8,000 characters.' },
      };
    }

    const evaluation = await evaluateStudentAnswer({
      studentName,
      jobRole,
      experienceLevel,
      question,
      category,
      answer,
    });

    return { status: 200, payload: { evaluation } };
  } catch (error) {
    if (error instanceof GeminiServiceError) {
      return { status: error.statusCode, payload: { error: error.message } };
    }
    const message = error instanceof Error ? error.message : 'Failed to evaluate answer.';
    return { status: 500, payload: { error: message } };
  }
}

export async function handleReportRequest(
  body: Record<string, unknown>,
): Promise<HandlerResult> {
  try {
    const studentName = typeof body.studentName === 'string' ? body.studentName.trim() : '';
    const jobRole = typeof body.jobRole === 'string' ? body.jobRole.trim() : '';
    const experienceLevel = body.experienceLevel;
    const submissions = body.submissions;

    if (!studentName || !jobRole || !isValidExperienceLevel(experienceLevel)) {
      return { status: 400, payload: { error: 'Missing candidate profile information.' } };
    }

    if (!Array.isArray(submissions) || submissions.length !== 5) {
      return {
        status: 400,
        payload: { error: 'All 5 evaluated questions are required to generate the final report.' },
      };
    }

    const typedSubmissions = submissions as QuestionSubmission[];
    for (const item of typedSubmissions) {
      if (
        !item?.question?.question ||
        typeof item?.answer !== 'string' ||
        typeof item?.evaluation?.score !== 'number'
      ) {
        return {
          status: 400,
          payload: { error: 'Invalid submission payload for final report.' },
        };
      }
    }

    const report = await generateFinalReport({
      studentName,
      jobRole,
      experienceLevel,
      submissions: typedSubmissions,
    });

    return { status: 200, payload: { report } };
  } catch (error) {
    if (error instanceof GeminiServiceError) {
      return { status: error.statusCode, payload: { error: error.message } };
    }
    const message = error instanceof Error ? error.message : 'Failed to generate final report.';
    return { status: 500, payload: { error: message } };
  }
}

export async function readJsonBody(
  req: IncomingMessage & { body?: unknown },
): Promise<Record<string, unknown>> {
  if (req.body && typeof req.body === 'object') {
    return req.body as Record<string, unknown>;
  }
  if (typeof req.body === 'string' && req.body.trim()) {
    return JSON.parse(req.body) as Record<string, unknown>;
  }

  const chunks: Buffer[] = [];
  for await (const chunk of req) {
    chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : (chunk as Buffer));
  }
  const raw = Buffer.concat(chunks).toString('utf8').trim();
  if (!raw) {
    return {};
  }
  return JSON.parse(raw) as Record<string, unknown>;
}

export function sendJson(res: ServerResponse, status: number, payload: unknown): void {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.end(JSON.stringify(payload));
}
