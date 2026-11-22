import { GoogleGenAI, ThinkingLevel, Type } from '@google/genai';
import type {
  AnswerEvaluation,
  ExperienceLevel,
  FinalInterviewReport,
  InterviewQuestion,
  QuestionCategory,
  QuestionSubmission,
} from '../src/types/interview.ts';

const PRIMARY_MODEL = 'gemini-4-hydrogen';
const FALLBACK_MODEL = 'gemini-3.1-flash-lite';

let cachedClient: GoogleGenAI | null = null;
let cachedApiKey: string | undefined;

function getGeminiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY?.trim();

  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
    throw new GeminiServiceError(
      'Gemini API key is not configured. Please add GEMINI_API_KEY in Settings > Secrets and restart the server.',
      500,
    );
  }

  if (!cachedClient || cachedApiKey !== apiKey) {
    cachedClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
    cachedApiKey = apiKey;
  }

  return cachedClient;
}

export class GeminiServiceError extends Error {
  statusCode: number;

  constructor(message: string, statusCode = 500) {
    super(message);
    this.name = 'GeminiServiceError';
    this.statusCode = statusCode;
  }
}

function isUnavailableError(rawMessage: string): boolean {
  const lower = rawMessage.toLowerCase();
  return (
    lower.includes('503') ||
    lower.includes('unavailable') ||
    lower.includes('high demand') ||
    lower.includes('overloaded')
  );
}

function mapGeminiError(error: unknown): GeminiServiceError {
  if (error instanceof GeminiServiceError) {
    return error;
  }

  const rawMessage = error instanceof Error ? error.message : String(error);
  const lower = rawMessage.toLowerCase();

  if (lower.includes('api_key_invalid') || lower.includes('permission_denied') || lower.includes('403') || lower.includes('401')) {
    return new GeminiServiceError(
      'Your Gemini API key appears invalid or lacks permission. Please verify GEMINI_API_KEY in Settings > Secrets.',
      403,
    );
  }

  if (lower.includes('resource_exhausted') || lower.includes('429') || lower.includes('quota')) {
    return new GeminiServiceError(
      'Gemini API rate limit or quota exceeded. Please wait a moment and try again, or check your quota in Settings > Secrets.',
      429,
    );
  }

  if (isUnavailableError(rawMessage)) {
    return new GeminiServiceError(
      'The Gemini AI service is temporarily experiencing high demand. Please wait a few seconds and try again.',
      503,
    );
  }

  if (lower.includes('not_found') || lower.includes('404')) {
    return new GeminiServiceError(
      'The configured Gemini model could not be found. Please check model availability and try again.',
      502,
    );
  }

  return new GeminiServiceError(
    'Unable to complete the AI request right now. Please try again in a moment.',
    502,
  );
}

async function runWithModelRetry<T>(
  operation: (modelName: string) => Promise<T>,
  maxRetriesPerModel = 1,
): Promise<T> {
  const models = [PRIMARY_MODEL, FALLBACK_MODEL];
  let lastError: unknown;

  for (const modelName of models) {
    for (let attempt = 0; attempt <= maxRetriesPerModel; attempt++) {
      try {
        return await operation(modelName);
      } catch (error) {
        lastError = error;
        if (error instanceof GeminiServiceError && error.statusCode < 500 && error.statusCode !== 429) {
          throw error;
        }
        const message = error instanceof Error ? error.message : String(error);
        const lower = message.toLowerCase();
        const isAuthError =
          lower.includes('api_key_invalid') ||
          lower.includes('permission_denied') ||
          lower.includes('not_found');

        if (isAuthError) {
          throw mapGeminiError(error);
        }

        // Immediately switch to fallback model if primary returns 503 UNAVAILABLE
        if (modelName === PRIMARY_MODEL && isUnavailableError(message)) {
          break;
        }

        if (attempt < maxRetriesPerModel) {
          const delayMs = 700 * Math.pow(2, attempt);
          await new Promise((resolve) => setTimeout(resolve, delayMs));
        }
      }
    }
  }

  throw mapGeminiError(lastError);
}

function cleanJsonString(raw: string | undefined): string {
  const trimmed = (raw ?? '').trim();
  if (trimmed.startsWith('```')) {
    return trimmed.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();
  }
  return trimmed;
}

function normalizeStringArray(value: unknown, fallbackMessage: string): string[] {
  if (!Array.isArray(value)) {
    return [fallbackMessage];
  }
  const cleaned = value
    .map((item) => (typeof item === 'string' ? item.trim() : ''))
    .filter((item) => item.length > 0);
  return cleaned.length > 0 ? cleaned : [fallbackMessage];
}

export async function generateInterviewQuestions(
  studentName: string,
  jobRole: string,
  experienceLevel: ExperienceLevel,
): Promise<InterviewQuestion[]> {
  const ai = getGeminiClient();

  const difficultyGuidance =
    experienceLevel === 'Fresher'
      ? 'Target entry-level/college graduate difficulty: focus on core fundamentals, foundational problem-solving, academic or personal projects, teamwork, adaptability, and learning mindset. Avoid assuming senior architecture ownership.'
      : 'Target experienced professional difficulty: focus on production-grade system design, performance trade-offs, debugging complex issues, scalability, ownership, stakeholder communication, and leadership scenarios.';

  const prompt = `Generate exactly 5 unique, realistic mock interview questions for a candidate named "${studentName}" applying for the role of "${jobRole}" at the "${experienceLevel}" experience level.

Requirements:
1. Return exactly 5 questions total.
2. Include 3 "Technical" questions and 2 "HR" questions (order: Technical, Technical, HR, Technical, HR).
3. Every question must be directly relevant to "${jobRole}".
4. ${difficultyGuidance}
5. Ensure all 5 questions cover distinct topics with zero duplicates or repetitive phrasing.
6. Write clear, conversational interviewer questions suitable for a written mock interview response.`;

  return runWithModelRetry(async (modelName) => {
    const response = await ai.models.generateContent({
      model: modelName,
      contents: prompt,
      config: {
        systemInstruction:
          'You are a senior technical interviewer and career coach. Generate structured, realistic, unambiguous mock interview questions strictly adhering to the requested JSON schema.',
        thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            questions: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: {
                    type: Type.INTEGER,
                    description: 'Sequential question number from 1 to 5.',
                  },
                  category: {
                    type: Type.STRING,
                    description: 'Must be either "Technical" or "HR".',
                  },
                  topic: {
                    type: Type.STRING,
                    description: 'Short 2-4 word topic label such as "Data Structures" or "Conflict Resolution".',
                  },
                  question: {
                    type: Type.STRING,
                    description: 'The complete interview question prompt.',
                  },
                },
                required: ['id', 'category', 'topic', 'question'],
              },
            },
          },
          required: ['questions'],
        },
      },
    });

    const jsonText = cleanJsonString(response.text);
    let parsed: { questions?: unknown };

    try {
      parsed = JSON.parse(jsonText) as { questions?: unknown };
    } catch {
      throw new GeminiServiceError('AI returned an invalid JSON format for interview questions. Please try again.', 502);
    }

    if (!Array.isArray(parsed.questions) || parsed.questions.length !== 5) {
      throw new GeminiServiceError('AI did not return exactly 5 interview questions. Please try again.', 502);
    }

    const seenQuestions = new Set<string>();
    const validated: InterviewQuestion[] = parsed.questions.map((rawItem, index) => {
      const item = rawItem as Record<string, unknown>;
      const rawCategory = typeof item.category === 'string' ? item.category.trim() : '';
      const category: QuestionCategory = rawCategory.toLowerCase() === 'hr' ? 'HR' : 'Technical';
      const topic = typeof item.topic === 'string' && item.topic.trim() ? item.topic.trim() : `${category} Competency`;
      const questionText = typeof item.question === 'string' ? item.question.trim() : '';

      if (!questionText) {
        throw new GeminiServiceError('Received an empty interview question from AI. Please try again.', 502);
      }

      const normalizedKey = questionText.toLowerCase();
      if (seenQuestions.has(normalizedKey)) {
        throw new GeminiServiceError('AI generated duplicate questions. Please retry to get 5 distinct questions.', 502);
      }
      seenQuestions.add(normalizedKey);

      return {
        id: index + 1,
        category,
        topic,
        question: questionText,
      };
    });

    return validated;
  });
}

export async function evaluateStudentAnswer(params: {
  studentName: string;
  jobRole: string;
  experienceLevel: ExperienceLevel;
  question: string;
  category: QuestionCategory;
  answer: string;
}): Promise<AnswerEvaluation> {
  const ai = getGeminiClient();

  const prompt = `Evaluate the following mock interview answer fairly and rigorously.

Candidate Name: ${params.studentName}
Target Job Role: ${params.jobRole}
Experience Level: ${params.experienceLevel}
Question Category: ${params.category}
Interview Question: "${params.question}"

Candidate's Submitted Answer:
"""
${params.answer}
"""

Scoring & Evaluation Rubric:
- Evaluate ONLY what the candidate actually wrote.
- 0–2 / 10: Irrelevant, off-topic, gibberish, joke/non-answer, or completely incorrect.
- 3–4 / 10: Extremely brief, vague, or contains major technical/conceptual inaccuracies.
- 5–6 / 10: Partially addresses the question with basic ideas, but lacks depth, examples, or key details.
- 7–8 / 10: Accurate, clear, well-structured, and appropriate for a ${params.experienceLevel} ${params.jobRole}.
- 9–10 / 10: Comprehensive, insightful, well-communicated, and hits all core technical or behavioral expectations.
- In "scoreReasoning", explicitly explain why this exact numerical score was assigned based on technical accuracy, relevance, clarity, and completeness.
- In "sampleImprovedAnswer", write a realistic, well-structured improved answer suitable for a ${params.experienceLevel} candidate. CRITICAL: Do NOT invent fake past companies, fake years of experience, or fabricated achievements; use natural phrasing or placeholders like "[a recent project]" if referencing personal experience.`;

  return runWithModelRetry(async (modelName) => {
    const response = await ai.models.generateContent({
      model: modelName,
      contents: prompt,
      config: {
        systemInstruction:
          'You are an objective, fair, and encouraging technical & HR interview evaluator. Never inflate scores for off-topic, vague, or low-effort answers. Never fabricate candidate achievements in sample answers. Output strictly valid JSON matching the schema.',
        thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            score: {
              type: Type.INTEGER,
              description: 'Integer score from 0 to 10.',
            },
            scoreReasoning: {
              type: Type.STRING,
              description: 'Clear 2-3 sentence explanation of why this score was awarded.',
            },
            didWell: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: 'Specific things the student did well in their answer. If none, state honestly what was attempted.',
            },
            missingPoints: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: 'Important concepts, details, or structure elements that were missing from the answer.',
            },
            suggestions: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: 'Actionable suggestions to improve this answer.',
            },
            sampleImprovedAnswer: {
              type: Type.STRING,
              description: 'A realistic improved answer tailored to the role and experience level without inventing fake achievements.',
            },
          },
          required: [
            'score',
            'scoreReasoning',
            'didWell',
            'missingPoints',
            'suggestions',
            'sampleImprovedAnswer',
          ],
        },
      },
    });

    const jsonText = cleanJsonString(response.text);
    let parsed: Record<string, unknown>;

    try {
      parsed = JSON.parse(jsonText) as Record<string, unknown>;
    } catch {
      throw new GeminiServiceError('AI returned an invalid JSON format while evaluating your answer. Please retry.', 502);
    }

    const numericScore = typeof parsed.score === 'number' ? Math.round(parsed.score) : Number(parsed.score);
    if (!Number.isFinite(numericScore)) {
      throw new GeminiServiceError('AI evaluation did not include a valid numerical score. Please retry.', 502);
    }

    const clampedScore = Math.max(0, Math.min(10, numericScore));
    const scoreReasoning =
      typeof parsed.scoreReasoning === 'string' && parsed.scoreReasoning.trim()
        ? parsed.scoreReasoning.trim()
        : 'Score assigned based on technical accuracy, relevance, clarity, and completeness.';
    const sampleImprovedAnswer =
      typeof parsed.sampleImprovedAnswer === 'string' && parsed.sampleImprovedAnswer.trim()
        ? parsed.sampleImprovedAnswer.trim()
        : 'A complete response should directly address the prompt with clear definitions, practical reasoning, and a concise example.';

    return {
      score: clampedScore,
      scoreReasoning,
      didWell: normalizeStringArray(parsed.didWell, 'Attempted to respond to the interview prompt.'),
      missingPoints: normalizeStringArray(parsed.missingPoints, 'Could include deeper role-specific details and concrete examples.'),
      suggestions: normalizeStringArray(parsed.suggestions, 'Structure your explanation clearly with core concepts followed by a practical example.'),
      sampleImprovedAnswer,
    };
  });
}

function deriveReadinessLevel(totalScore: number): string {
  if (totalScore >= 42) return 'Strong Candidate';
  if (totalScore >= 33) return 'Interview Ready';
  if (totalScore >= 22) return 'Developing Readiness';
  return 'Needs Foundational Practice';
}

export async function generateFinalReport(params: {
  studentName: string;
  jobRole: string;
  experienceLevel: ExperienceLevel;
  submissions: QuestionSubmission[];
}): Promise<FinalInterviewReport> {
  const ai = getGeminiClient();

  const totalScore = params.submissions.reduce((sum, item) => sum + item.evaluation.score, 0);
  const averageScore = Number((totalScore / params.submissions.length).toFixed(1));
  const readinessLevel = deriveReadinessLevel(totalScore);

  const transcriptSummary = params.submissions
    .map(
      (sub) =>
        `Question ${sub.question.id} (${sub.question.category} - ${sub.question.topic}): ${sub.question.question}\n` +
        `Student Answer: ${sub.answer}\n` +
        `Score: ${sub.evaluation.score}/10\n` +
        `Did Well: ${sub.evaluation.didWell.join('; ')}\n` +
        `Missing Points: ${sub.evaluation.missingPoints.join('; ')}`,
    )
    .join('\n\n---\n\n');

  const prompt = `Synthesize a personalized final mock interview performance report for "${params.studentName}" interviewing for "${params.jobRole}" (${params.experienceLevel}).

Verified Quantitative Results:
- Total Score: ${totalScore} / 50
- Average Score: ${averageScore} / 10
- Calibrated Readiness Tier: ${readinessLevel}

Full 5-Question Performance Transcript:
${transcriptSummary}

Generate:
1. overallSummary: 2-3 clear sentences summarizing ${params.studentName}'s overall performance across technical and HR questions, referencing real patterns from their answers.
2. overallStrengths: 3-4 concise, specific strengths actually demonstrated across the interview.
3. areasForImprovement: 3-4 specific technical or communication gaps observed in their answers.
4. futureRecommendations: 4-5 actionable, practical next steps for preparing for upcoming ${params.jobRole} (${params.experienceLevel}) interviews.`;

  return runWithModelRetry(async (modelName) => {
    const response = await ai.models.generateContent({
      model: modelName,
      contents: prompt,
      config: {
        systemInstruction:
          'You are a constructive career coach writing a personalized final mock interview report based strictly on the verified question-and-answer transcript. Be honest, specific, and supportive. Output strictly valid JSON matching the schema.',
        thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            overallSummary: {
              type: Type.STRING,
              description: '2-3 sentence personalized performance overview.',
            },
            overallStrengths: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: '3-4 observed strengths.',
            },
            areasForImprovement: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: '3-4 areas needing improvement.',
            },
            futureRecommendations: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: '4-5 tailored recommendations for future interviews.',
            },
          },
          required: [
            'overallSummary',
            'overallStrengths',
            'areasForImprovement',
            'futureRecommendations',
          ],
        },
      },
    });

    const jsonText = cleanJsonString(response.text);
    let parsed: Record<string, unknown>;

    try {
      parsed = JSON.parse(jsonText) as Record<string, unknown>;
    } catch {
      throw new GeminiServiceError('AI returned an invalid JSON format while compiling the final report. Please retry.', 502);
    }

    const overallSummary =
      typeof parsed.overallSummary === 'string' && parsed.overallSummary.trim()
        ? parsed.overallSummary.trim()
        : `${params.studentName} completed all 5 mock interview questions for the ${params.jobRole} (${params.experienceLevel}) track with a total score of ${totalScore} out of 50.`;

    return {
      totalScore,
      averageScore,
      readinessLevel,
      overallSummary,
      overallStrengths: normalizeStringArray(
        parsed.overallStrengths,
        'Completed the full 5-question interview across both technical and behavioral prompts.',
      ),
      areasForImprovement: normalizeStringArray(
        parsed.areasForImprovement,
        'Strengthen technical depth and structured behavioral storytelling with concrete examples.',
      ),
      futureRecommendations: normalizeStringArray(
        parsed.futureRecommendations,
        `Review core ${params.jobRole} fundamentals and practice answering questions aloud using the STAR method.`,
      ),
    };
  });
}
