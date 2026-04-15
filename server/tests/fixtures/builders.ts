import type { IUserDocument } from "../../src/domain/models/user.model.js";
import type { IInterviewDocument } from "../../src/domain/models/interview.model.js";
import mongoose from "mongoose";

export function makeUser(overrides: Partial<IUserDocument> = {}): IUserDocument {
  return {
    _id: new mongoose.Types.ObjectId(),
    name: "Test User",
    email: "test@example.com",
    credits: 200,
    save: async () => {},
    ...overrides,
  } as unknown as IUserDocument;
}

export function makeInterview(overrides: Partial<IInterviewDocument> = {}): IInterviewDocument {
  return {
    _id: new mongoose.Types.ObjectId(),
    userId: new mongoose.Types.ObjectId(),
    role: "Software Engineer",
    experience: "2 years",
    mode: "Technical",
    resumeText: "Sample resume",
    questions: [
      {
        question: "What is a closure?",
        difficulty: "medium",
        timeLimit: 90,
        answer: "",
        feedback: "",
        score: 0,
        confidence: 0,
        communication: 0,
        correctness: 0,
      },
    ],
    finalScore: 0,
    status: "Incompleted",
    createdAt: new Date(),
    updatedAt: new Date(),
    save: async () => {},
    ...overrides,
  } as unknown as IInterviewDocument;
}
