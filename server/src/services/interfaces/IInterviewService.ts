import type {
  GenerateQuestionsDto,
  SubmitAnswerDto,
  CreateInterviewResult,
  FinishInterviewResult,
  InterviewReportResult,
} from "../InterviewService.js";
import type { IInterviewDocument } from "../../domain/models/interview.model.js";

export interface IInterviewService {
  createInterview(userId: string, dto: GenerateQuestionsDto): Promise<CreateInterviewResult>;
  submitAnswer(dto: SubmitAnswerDto): Promise<{ feedback: string }>;
  finishInterview(interviewId: string): Promise<FinishInterviewResult>;
  listMine(userId: string): Promise<IInterviewDocument[]>;
  getReport(interviewId: string): Promise<InterviewReportResult>;
}
