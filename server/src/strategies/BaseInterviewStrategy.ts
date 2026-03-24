import type {
  IInterviewStrategy,
  GenerateQuestionsInput,
  ParsedQuestion,
} from "./IInterviewStrategy.js";
import type { AIMessage } from "../providers/ai/IAIProvider.js";
import type {
  Difficulty,
  InterviewMode,
} from "../domain/models/interview.model.js";

/**
 * BaseInterviewStrategy — template method base class.
 * Owns the shared skeleton (parse lines, fixed difficulty/timeLimit progression,
 * scoring prompt shape). Subclasses override the system prompt for question
 * generation and the scoring weights.
 */
export abstract class BaseInterviewStrategy implements IInterviewStrategy {
  abstract readonly mode: InterviewMode;

  private static readonly DIFFICULTY_PROGRESSION: Difficulty[] = [
    "easy",
    "easy",
    "medium",
    "medium",
    "hard",
  ];

  private static readonly TIME_LIMITS: number[] = [60, 60, 90, 90, 120];

  protected abstract systemPromptForQuestions(): string;

  abstract scoringWeights(): {
    confidence: number;
    communication: number;
    correctness: number;
  };

  buildQuestionPrompt(input: GenerateQuestionsInput): AIMessage[] {
    const projectText =
      Array.isArray(input.projects) && input.projects.length
        ? input.projects.join(", ")
        : "None";
    const skillsText =
      Array.isArray(input.skills) && input.skills.length
        ? input.skills.join(", ")
        : "None";
    const safeResume = input.resumeText?.trim() || "None";

    const userPrompt = `
    Role:${input.role}
    Experience:${input.experience}
    InterviewMode:${input.mode}
    Projects:${projectText}
    Skills:${skillsText},
    Resume:${safeResume}
    `;

    return [
      { role: "system", content: this.systemPromptForQuestions() },
      { role: "user", content: userPrompt },
    ];
  }

  parseQuestions(raw: string): ParsedQuestion[] {
    const lines = raw
      .split("\n")
      .map((q) => q.trim())
      .filter((q) => q.length > 0)
      .slice(0, 5);

    return lines.map((question, index) => ({
      question,
      difficulty:
        BaseInterviewStrategy.DIFFICULTY_PROGRESSION[index] ?? "medium",
      timeLimit: BaseInterviewStrategy.TIME_LIMITS[index] ?? 90,
    }));
  }

  buildScoringPrompt(question: string, answer: string): AIMessage[] {
    return [
      {
        role: "system",
        content: `
You are a professional human interviewer evaluating a candidate's answer in a real interview.

Evaluate naturally and fairly, like a real person would.

Score the answer in these areas (0 to 10):

1. Confidence – Does the answer sound clear, confident, and well-presented?
2. Communication – Is the language simple, clear, and easy to understand?
3. Correctness – Is the answer accurate, relevant, and complete?

Rules:
- Be realistic and unbiased.
- Do not give random high scores.
- If the answer is weak, score low.
- If the answer is strong and detailed, score high.
- Consider clarity, structure, and relevance.

Calculate:
finalScore = average of confidence, communication, and correctness (rounded to nearest whole number).

Feedback Rules:
- Write natural human feedback.
- 10 to 15 words only.
- Sound like real interview feedback.
- Can suggest improvement if needed.
- Do NOT repeat the question.
- Do NOT explain scoring.
- Keep tone professional and honest.

Return ONLY valid JSON in this format:

{
  "confidence": number,
  "communication": number,
  "correctness": number,
  "finalScore": number,
  "feedback": "short human feedback"
}
`,
      },
      {
        role: "user",
        content: `
Question: ${question}
Answer: ${answer}
`,
      },
    ];
  }
}
