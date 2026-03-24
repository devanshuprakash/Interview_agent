import type { AIMessage } from "../providers/ai/IAIProvider.js";
import type { Difficulty, InterviewMode } from "../domain/models/interview.model.js";

export interface GenerateQuestionsInput {
  role: string;
  experience: string;
  mode: InterviewMode;
  projects: string[];
  skills: string[];
  resumeText: string;
}

export interface ParsedQuestion {
  question: string;
  difficulty: Difficulty;
  timeLimit: number;
}

/**
 * IInterviewStrategy — mode-specific behavior for interview generation + scoring.
 * HR and Technical subclasses differ in prompts and scoring weights.
 */
export interface IInterviewStrategy {
  readonly mode: InterviewMode;
  buildQuestionPrompt(input: GenerateQuestionsInput): AIMessage[];
  parseQuestions(raw: string): ParsedQuestion[];
  buildScoringPrompt(question: string, answer: string): AIMessage[];
  scoringWeights(): { confidence: number; communication: number; correctness: number };
}
