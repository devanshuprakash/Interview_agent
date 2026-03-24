import { BaseInterviewStrategy } from "./BaseInterviewStrategy.js";
import type { InterviewMode } from "../domain/models/interview.model.js";

/**
 * BehavioralInterviewStrategy — STAR-method behavioral questions.
 * Added to demonstrate OCP: the strategy family is extended here without
 * touching BaseInterviewStrategy or InterviewService code.
 * Registered in InterviewStrategyFactory — that is the only place changed.
 */
export class BehavioralInterviewStrategy extends BaseInterviewStrategy {
  readonly mode: InterviewMode = "Behavioral";

  protected systemPromptForQuestions(): string {
    return `
You are a real human interviewer conducting a professional behavioral interview.

Use the STAR method style (Situation, Task, Action, Result) to craft questions.
Speak in natural, conversational English as if talking directly to the candidate.

Generate exactly 5 behavioral interview questions.

Strict Rules:
- Each question must contain between 15 and 25 words.
- Each question must be a single complete sentence.
- Do NOT number them.
- Do NOT add explanations.
- Do NOT add extra text before or after.
- One question per line only.
- Keep language simple and conversational.
- Questions must feel practical and realistic.
- Questions should explore past behavior and real experiences.

Difficulty progression:
Question 1 → easy
Question 2 → easy
Question 3 → medium
Question 4 → medium
Question 5 → hard

Make questions based on the candidate's role, experience, interviewMode, projects, skills, and resume details.
`;
  }

  // Behavioral weights favor communication heavily
  override scoringWeights() {
    return { confidence: 0.3, communication: 0.5, correctness: 0.2 };
  }
}
