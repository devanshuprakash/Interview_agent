import type { Request, Response } from "express";
import { BaseController } from "./BaseController.js";
import type { InterviewService } from "../services/InterviewService.js";
import type { ResumeAnalyzerService } from "../services/ResumeAnalyzerService.js";
import {
  generateQuestionsSchema,
  submitAnswerSchema,
  finishInterviewSchema,
} from "../dto/interview.dto.js";
import { AuthError } from "../errors/index.js";

export class InterviewController extends BaseController {
  constructor(
    private readonly interviews: InterviewService,
    private readonly resume: ResumeAnalyzerService,
  ) {
    super();
  }

  analyzeResume = async (req: Request, res: Response): Promise<void> => {
    const result = await this.resume.analyze(req.file?.path);
    res.json(result);
  };

  generateQuestions = async (req: Request, res: Response): Promise<void> => {
    if (!req.user) throw new AuthError();
    const dto = generateQuestionsSchema.parse(req.body);
    const result = await this.interviews.createInterview(req.user.id, dto);
    res.json(result);
  };

  submitAnswer = async (req: Request, res: Response): Promise<void> => {
    const dto = submitAnswerSchema.parse(req.body);
    const result = await this.interviews.submitAnswer(dto);
    res.status(200).json(result);
  };

  finish = async (req: Request, res: Response): Promise<void> => {
    const dto = finishInterviewSchema.parse(req.body);
    const result = await this.interviews.finishInterview(dto.interviewId);
    res.status(200).json(result);
  };

  listMine = async (req: Request, res: Response): Promise<void> => {
    if (!req.user) throw new AuthError();
    const interviews = await this.interviews.listMine(req.user.id);
    res.status(200).json(interviews);
  };

  report = async (req: Request, res: Response): Promise<void> => {
    const rawId = req.params["id"];
    const id = typeof rawId === "string" ? rawId : undefined;
    if (!id) {
      res.status(400).json({ message: "id required" });
      return;
    }
    const result = await this.interviews.getReport(id);
    res.json(result);
  };
}
