import type { IInterviewRepository } from "../repositories/interfaces/IInterviewRepository.js";
import type { IAIProvider } from "../providers/ai/IAIProvider.js";
import type { InterviewStrategyFactory } from "../strategies/InterviewStrategyFactory.js";
import type {
  IAnswerEvaluationService,
  EvaluateAnswerDto,
} from "./interfaces/IAnswerEvaluationService.js";
import { Question } from "../domain/entities/Question.js";
import { ExternalServiceError, NotFoundError } from "../errors/index.js";

/**
 * AnswerEvaluationService — SRP: owns only answer → score → persist logic.
 * Extracted from InterviewService so that AI scoring concerns are isolated.
 * Implements IAnswerEvaluationService (DIP).
 */
export class AnswerEvaluationService implements IAnswerEvaluationService {
  constructor(
    private readonly interviews: IInterviewRepository,
    private readonly ai: IAIProvider,
    private readonly strategyFactory: InterviewStrategyFactory,
  ) {}

  async evaluate(dto: EvaluateAnswerDto): Promise<{ feedback: string }> {
    const interview = await this.interviews.findById(dto.interviewId);
    if (!interview) throw new NotFoundError("Interview not found");

    const rawQuestion = interview.questions[dto.questionIndex];
    if (!rawQuestion) throw new NotFoundError("Question not found");

    const question = new Question(rawQuestion);

    // No answer submitted
    if (!dto.answer) {
      question.markZero("You did not submit an answer.", "");
      await interview.save();
      return { feedback: "You did not submit an answer." };
    }

    // Time exceeded
    if (question.isExpired(dto.timeTaken)) {
      question.markZero(
        "Time limit exceeded. Answer not evaluated.",
        dto.answer,
      );
      await interview.save();
      return { feedback: "Time limit exceeded. Answer not evaluated." };
    }

    const strategy = this.strategyFactory.for(interview.mode);
    const aiResponse = await this.ai.complete(
      strategy.buildScoringPrompt(question.text, dto.answer),
    );

    let parsed: {
      confidence: number;
      communication: number;
      correctness: number;
      finalScore: number;
      feedback: string;
    };
    try {
      parsed = JSON.parse(aiResponse);
    } catch {
      throw new ExternalServiceError("AI returned malformed scoring JSON");
    }

    question.applyScore({
      confidence: parsed.confidence,
      communication: parsed.communication,
      correctness: parsed.correctness,
      finalScore: parsed.finalScore,
      feedback: parsed.feedback,
      answer: dto.answer,
    });
    await interview.save();

    return { feedback: parsed.feedback };
  }
}
