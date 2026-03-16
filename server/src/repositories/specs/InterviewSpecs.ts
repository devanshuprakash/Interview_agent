import { Specification } from "./Specification.js";
import type { IInterviewDocument } from "../../domain/models/interview.model.js";

/** Matches interviews belonging to a specific user. */
export class ByUserIdSpec extends Specification<IInterviewDocument> {
  constructor(private readonly userId: string) {
    super();
  }

  toQuery(): Record<string, unknown> {
    return { userId: this.userId };
  }
}

/** Matches interviews with status = "completed". */
export class FinishedSpec extends Specification<IInterviewDocument> {
  toQuery(): Record<string, unknown> {
    return { status: "completed" };
  }
}

/** Matches interviews with a final score above a threshold. */
export class ScoreAboveSpec extends Specification<IInterviewDocument> {
  constructor(private readonly minScore: number) {
    super();
  }

  toQuery(): Record<string, unknown> {
    return { finalScore: { $gte: this.minScore } };
  }
}
