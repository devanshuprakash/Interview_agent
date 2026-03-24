import type { ICommand } from "./ICommand.js";
import type { IAnswerEvaluationService, EvaluateAnswerDto } from "../services/interfaces/IAnswerEvaluationService.js";

/**
 * SubmitAnswerCommand — encapsulates a single answer-submission as a Command.
 * Lets the operation be logged, retried, or queued without touching the service.
 * Pattern: Command.
 */
export class SubmitAnswerCommand implements ICommand<{ feedback: string }> {
  constructor(
    private readonly evaluator: IAnswerEvaluationService,
    private readonly dto: EvaluateAnswerDto,
  ) {}

  async execute(): Promise<{ feedback: string }> {
    return this.evaluator.evaluate(this.dto);
  }
}
