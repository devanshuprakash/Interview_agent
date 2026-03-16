import type { Model } from "mongoose";
import { BaseRepository } from "./BaseRepository.js";
import type {
  IInterviewDocument,
  IInterview,
} from "../domain/models/interview.model.js";
import type { IInterviewRepository } from "./interfaces/IInterviewRepository.js";

export class InterviewRepository
  extends BaseRepository<IInterviewDocument>
  implements IInterviewRepository
{
  constructor(model: Model<IInterviewDocument>) {
    super(model);
  }

  async createInterview(data: Partial<IInterview>): Promise<IInterviewDocument> {
    return this.model.create(data);
  }

  async listByUserSorted(userId: string): Promise<IInterviewDocument[]> {
    return this.model
      .find({ userId })
      .sort({ createdAt: -1 })
      .select("role experience mode finalScore status createdAt")
      .exec();
  }
}
