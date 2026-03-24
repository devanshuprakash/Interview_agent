import type { InterviewMode } from "../domain/models/interview.model.js";
import type { IInterviewStrategy } from "./IInterviewStrategy.js";
import { HRInterviewStrategy } from "./HRInterviewStrategy.js";
import { TechnicalInterviewStrategy } from "./TechnicalInterviewStrategy.js";
import { BehavioralInterviewStrategy } from "./BehavioralInterviewStrategy.js";
import { ValidationError } from "../errors/index.js";

/**
 * InterviewStrategyFactory — maps mode string to the correct strategy instance.
 * Keeps InterviewService free of `if (mode === ...)` ladders.
 * OCP demonstrated: adding BehavioralInterviewStrategy required zero changes
 * to any service — only this factory registration was updated.
 */
export class InterviewStrategyFactory {
  constructor(
    private readonly hr: HRInterviewStrategy,
    private readonly technical: TechnicalInterviewStrategy,
    private readonly behavioral: BehavioralInterviewStrategy,
  ) {}

  for(mode: InterviewMode): IInterviewStrategy {
    switch (mode) {
      case "HR":
        return this.hr;
      case "Technical":
        return this.technical;
      case "Behavioral":
        return this.behavioral;
      default:
        throw new ValidationError(`Unknown interview mode: ${mode as string}`);
    }
  }
}
