import type { IInterviewRepository } from "../repositories/interfaces/IInterviewRepository.js";
import type { IAIProvider } from "../providers/ai/IAIProvider.js";
import type { InterviewStrategyFactory } from "../strategies/InterviewStrategyFactory.js";
import type { ICreditService } from "./interfaces/ICreditService.js";
import type { IAnswerEvaluationService, EvaluateAnswerDto } from "./interfaces/IAnswerEvaluationService.js";
import type { IInterviewService } from "./interfaces/IInterviewService.js";
import type {
  IInterviewDocument,
  IQuestion,
  InterviewMode,
} from "../domain/models/interview.model.js";
import { InterviewAggregate } from "../domain/entities/InterviewAggregate.js";
import {
  ExternalServiceError,
  NotFoundError,
} from "../errors/index.js";

export interface GenerateQuestionsDto {
  role: string;
  experience: string;
  mode: InterviewMode;
  resumeText?: string | undefined;
  projects?: string[] | undefined;
  skills?: string[] | undefined;
}

export interface SubmitAnswerDto {
  interviewId: string;
  questionIndex: number;
  answer: string;
  timeTaken: number;
}

export interface CreateInterviewResult {
  interviewId: string;
  creditsLeft: number;
  userName: string;
  questions: IQuestion[];
}

export interface FinishInterviewResult {
  finalScore: number;
  confidence: number;
  communication: number;
  correctness: number;
  questionWiseScore: Array<{
    question: string;
    score: number;
    feedback: string;
    confidence: number;
    communication: number;
    correctness: number;
  }>;
}

export interface InterviewReportResult {
  finalScore: number;
  confidence: number;
  communication: number;
  correctness: number;
  questionWiseScore: IQuestion[];
}

/**
 * InterviewService — SRP: interview lifecycle only (create/list/finish/report).
 * AI scoring → AnswerEvaluationService. Credit accounting → CreditService.
 * Orchestrates via those injected collaborators. Implements IInterviewService (DIP).
 */
export class InterviewService implements IInterviewService {
  constructor(
    private readonly interviews: IInterviewRepository,
    private readonly ai: IAIProvider,
    private readonly strategyFactory: InterviewStrategyFactory,
    private readonly credits: ICreditService,
    private readonly evaluator: IAnswerEvaluationService,
    private readonly costPerInterview: number = 50,
  ) {}

  async createInterview(
    userId: string,
    dto: GenerateQuestionsDto,
  ): Promise<CreateInterviewResult> {
    // Delegate atomic credit debit to CreditService
    const { creditsLeft } = await this.credits.debit(userId, this.costPerInterview);

    const strategy = this.strategyFactory.for(dto.mode);
    const messages = strategy.buildQuestionPrompt({
      role: dto.role,
      experience: dto.experience,
      mode: dto.mode,
      projects: dto.projects ?? [],
      skills: dto.skills ?? [],
      resumeText: dto.resumeText ?? "",
    });

    let raw: string;
    try {
      raw = await this.ai.complete(messages);
    } catch (err) {
      await this.credits.refund(userId, this.costPerInterview);
      throw err;
    }

    if (!raw || !raw.trim()) {
      await this.credits.refund(userId, this.costPerInterview);
      throw new ExternalServiceError("AI returned empty response.");
    }

    const questions = strategy.parseQuestions(raw);
    if (questions.length === 0) {
      await this.credits.refund(userId, this.costPerInterview);
      throw new ExternalServiceError("AI failed to generate questions.");
    }

    // We need the user name for the response — fetch it separately after debit
    // (CreditService doesn't expose the user object; keep services focused)
    const interview = await this.interviews.createInterview({
      userId: userId as unknown as import("mongoose").Types.ObjectId,
      role: dto.role,
      experience: dto.experience,
      mode: dto.mode,
      resumeText: dto.resumeText?.trim() || "None",
      questions: questions.map((q) => ({
        question: q.question,
        difficulty: q.difficulty,
        timeLimit: q.timeLimit,
        answer: "",
        feedback: "",
        score: 0,
        confidence: 0,
        communication: 0,
        correctness: 0,
      })),
    });

    return {
      interviewId: interview._id.toString(),
      creditsLeft,
      userName: "",         // populated by controller from req.user if needed
      questions: interview.questions,
    };
  }

  /** Delegates to AnswerEvaluationService — SRP boundary. */
  async submitAnswer(dto: SubmitAnswerDto): Promise<{ feedback: string }> {
    return this.evaluator.evaluate(dto as EvaluateAnswerDto);
  }

  async finishInterview(interviewId: string): Promise<FinishInterviewResult> {
    const interview = await this.interviews.findById(interviewId);
    if (!interview) throw new NotFoundError("failed to find Interview");

    const aggregate = new InterviewAggregate(interview.questions);
    const averages = aggregate.averageScores();
    const rounded = aggregate.roundedAverages();

    interview.finalScore = averages.finalScore;
    interview.status = "completed";
    await interview.save();

    return {
      finalScore: rounded.finalScore,
      confidence: rounded.confidence,
      communication: rounded.communication,
      correctness: rounded.correctness,
      questionWiseScore: interview.questions.map((q) => ({
        question: q.question,
        score: q.score || 0,
        feedback: q.feedback || "",
        confidence: q.confidence || 0,
        communication: q.communication || 0,
        correctness: q.correctness || 0,
      })),
    };
  }

  async listMine(userId: string): Promise<IInterviewDocument[]> {
    return this.interviews.listByUserSorted(userId);
  }

  async getReport(interviewId: string): Promise<InterviewReportResult> {
    const interview = await this.interviews.findById(interviewId);
    if (!interview) throw new NotFoundError("Interview not found");

    const aggregate = new InterviewAggregate(interview.questions);
    const rounded = aggregate.roundedAverages();

    return {
      finalScore: interview.finalScore,
      confidence: rounded.confidence,
      communication: rounded.communication,
      correctness: rounded.correctness,
      questionWiseScore: interview.questions,
    };
  }
}
