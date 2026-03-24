import type { ICommand } from "./ICommand.js";
import type { IInterviewService } from "../services/interfaces/IInterviewService.js";
import type { FinishInterviewResult } from "../services/InterviewService.js";

/**
 * FinishInterviewCommand — encapsulates finishing an interview as a Command.
 * Pattern: Command.
 */
export class FinishInterviewCommand implements ICommand<FinishInterviewResult> {
  constructor(
    private readonly interviewService: IInterviewService,
    private readonly interviewId: string,
  ) {}

  async execute(): Promise<FinishInterviewResult> {
    return this.interviewService.finishInterview(this.interviewId);
  }
}
