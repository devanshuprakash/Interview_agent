import mongoose, { Schema, Document, Model } from "mongoose";

export type InterviewMode = "HR" | "Technical" | "Behavioral";
export type InterviewStatus = "Incompleted" | "completed";
export type Difficulty = "easy" | "medium" | "hard";

export interface IQuestion {
  question: string;
  difficulty: Difficulty;
  timeLimit: number;
  answer: string;
  feedback: string;
  score: number;
  confidence: number;
  communication: number;
  correctness: number;
}

export interface IInterview {
  userId: mongoose.Types.ObjectId;
  role: string;
  experience: string;
  mode: InterviewMode;
  resumeText: string;
  questions: IQuestion[];
  finalScore: number;
  status: InterviewStatus;
}

export interface IInterviewDocument extends IInterview, Document {
  _id: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const questionSchema = new Schema<IQuestion>(
  {
    question: String,
    difficulty: String,
    timeLimit: Number,
    answer: String,
    feedback: String,
    score: { type: Number, default: 0 },
    confidence: { type: Number, default: 0 },
    communication: { type: Number, default: 0 },
    correctness: { type: Number, default: 0 },
  },
  { _id: true },
);

const interviewSchema = new Schema<IInterviewDocument>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    role: { type: String, required: true },
    experience: { type: String, required: true },
    mode: {
      type: String,
      enum: ["HR", "Technical", "Behavioral"],
      required: true,
    },
    resumeText: { type: String },
    questions: [questionSchema],
    finalScore: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ["Incompleted", "completed"],
      default: "Incompleted",
    },
  },
  { timestamps: true },
);

export const InterviewModel: Model<IInterviewDocument> =
  mongoose.model<IInterviewDocument>("Interview", interviewSchema);
