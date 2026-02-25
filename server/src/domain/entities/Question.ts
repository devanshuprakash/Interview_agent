import type { IQuestion } from "../models/interview.model.js";

/**
 * Question — value object with behavior co-located with data.
 * Wraps a Mongoose subdocument and exposes domain operations.
 */
export class Question {
  constructor(private readonly doc: IQuestion) {}

  get raw(): IQuestion {
    return this.doc;
  }

  get text(): string {
    return this.doc.question;
  }

  get timeLimit(): number {
    return this.doc.timeLimit;
  }

  isAnswered(): boolean {
    return !!this.doc.answer && this.doc.answer.trim().length > 0;
  }

  isExpired(timeTaken: number): boolean {
    return timeTaken > this.doc.timeLimit;
  }

  applyScore(s: {
    confidence: number;
    communication: number;
    correctness: number;
    finalScore: number;
    feedback: string;
    answer: string;
  }): void {
    this.doc.answer = s.answer;
    this.doc.confidence = s.confidence;
    this.doc.communication = s.communication;
    this.doc.correctness = s.correctness;
    this.doc.score = s.finalScore;
    this.doc.feedback = s.feedback;
  }

  markZero(reason: string, answer = ""): void {
    this.doc.answer = answer;
    this.doc.score = 0;
    this.doc.feedback = reason;
  }
}
