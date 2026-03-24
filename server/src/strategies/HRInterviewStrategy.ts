import { BaseInterviewStrategy } from "./BaseInterviewStrategy.js";
import type { InterviewMode } from "../domain/models/interview.model.js";

/**
 * HRInterviewStrategy — behavioral / communication-focused interviews.
 * Uses the verbatim prompt from the original controller for parity;
 * prompt tuning is a separate task.
 */
export class HRInterviewStrategy extends BaseInterviewStrategy {
  readonly mode: InterviewMode = "HR";

  protected systemPromptForQuestions(): string {
    return `
You are a real human interviewer conducting a professional interview.

Speak in simple, natural English as if you are directly talking to the candidate.

Generate exactly 5 interview questions.

Strict Rules:
- Each question must contain between 15 and 25 words.
- Each question must be a single complete sentence.
- Do NOT number them.
- Do NOT add explanations.
- Do NOT add extra text before or after.
- One question per line only.
- Keep language simple and conversational.
- Questions must feel practical and realistic.

Difficulty progression:
Question 1 → easy
Question 2 → easy
Question 3 → medium
Question 4 → medium
Question 5 → hard

Make questions based on the candidate’s role, experience,interviewMode, projects, skills, and resume details.
`;
  }

  // HR weights slightly favor communication + confidence
  override scoringWeights() {
    return { confidence: 0.4, communication: 0.4, correctness: 0.2 };
  }
}
