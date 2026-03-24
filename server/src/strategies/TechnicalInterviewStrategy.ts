import { BaseInterviewStrategy } from "./BaseInterviewStrategy.js";
import type { InterviewMode } from "../domain/models/interview.model.js";

/**
 * TechnicalInterviewStrategy — correctness-focused interviews.
 * For parity, uses the same verbatim system prompt as HR (the original
 * controller did not branch on mode for prompts). Prompt divergence is
 * a follow-up task after parity is green.
 */
export class TechnicalInterviewStrategy extends BaseInterviewStrategy {
  readonly mode: InterviewMode = "Technical";

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

  // Technical weights favor correctness
  override scoringWeights() {
    return { confidence: 0.2, communication: 0.2, correctness: 0.6 };
  }
}
