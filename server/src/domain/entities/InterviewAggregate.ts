import type { IQuestion } from "../models/interview.model.js";

export interface InterviewAverages {
  finalScore: number;
  confidence: number;
  communication: number;
  correctness: number;
}

/**
 * InterviewAggregate — computes derived metrics across an interview's questions.
 * Pure TS: no persistence concerns.
 */
export class InterviewAggregate {
  constructor(private readonly questions: IQuestion[]) {}

  get total(): number {
    return this.questions.length;
  }

  averageScores(): InterviewAverages {
    const total = this.total;
    if (total === 0) {
      return { finalScore: 0, confidence: 0, communication: 0, correctness: 0 };
    }

    let totalScore = 0;
    let totalConfidence = 0;
    let totalCommunication = 0;
    let totalCorrectness = 0;

    for (const q of this.questions) {
      totalScore += q.score || 0;
      totalConfidence += q.confidence || 0;
      totalCommunication += q.communication || 0;
      totalCorrectness += q.correctness || 0;
    }

    return {
      finalScore: totalScore / total,
      confidence: totalConfidence / total,
      communication: totalCommunication / total,
      correctness: totalCorrectness / total,
    };
  }

  roundedAverages(): InterviewAverages {
    const a = this.averageScores();
    return {
      finalScore: Number(a.finalScore.toFixed(1)),
      confidence: Number(a.confidence.toFixed(1)),
      communication: Number(a.communication.toFixed(1)),
      correctness: Number(a.correctness.toFixed(1)),
    };
  }
}
