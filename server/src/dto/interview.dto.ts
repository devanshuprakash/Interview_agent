import { z } from "zod";

export const generateQuestionsSchema = z.object({
  role: z.string().trim().min(1, "Role, Experience and Mode are required."),
  experience: z
    .string()
    .trim()
    .min(1, "Role, Experience and Mode are required."),
  mode: z.enum(["HR", "Technical"]),
  resumeText: z.string().optional(),
  projects: z.array(z.string()).optional(),
  skills: z.array(z.string()).optional(),
});

export type GenerateQuestionsDto = z.infer<typeof generateQuestionsSchema>;

export const submitAnswerSchema = z.object({
  interviewId: z.string().min(1),
  questionIndex: z.number().int().min(0),
  answer: z.string(),
  timeTaken: z.number().min(0),
});

export type SubmitAnswerDto = z.infer<typeof submitAnswerSchema>;

export const finishInterviewSchema = z.object({
  interviewId: z.string().min(1),
});

export type FinishInterviewDto = z.infer<typeof finishInterviewSchema>;
