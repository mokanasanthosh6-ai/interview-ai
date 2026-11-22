export type ExperienceLevel = 'Fresher' | 'Experienced';

export type QuestionCategory = 'Technical' | 'HR';

export interface StudentProfile {
  studentName: string;
  jobRole: string;
  experienceLevel: ExperienceLevel;
}

export interface InterviewQuestion {
  id: number;
  category: QuestionCategory;
  topic: string;
  question: string;
}

export interface AnswerEvaluation {
  score: number;
  scoreReasoning: string;
  didWell: string[];
  missingPoints: string[];
  suggestions: string[];
  sampleImprovedAnswer: string;
}

export interface QuestionSubmission {
  question: InterviewQuestion;
  answer: string;
  evaluation: AnswerEvaluation;
}

export interface FinalInterviewReport {
  totalScore: number;
  averageScore: number;
  readinessLevel: string;
  overallSummary: string;
  overallStrengths: string[];
  areasForImprovement: string[];
  futureRecommendations: string[];
}
