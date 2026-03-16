import type {
  IInterviewDocument,
  IInterview,
} from "../../domain/models/interview.model.js";

export interface IInterviewRepository {
  findById(id: string): Promise<IInterviewDocument | null>;
  createInterview(data: Partial<IInterview>): Promise<IInterviewDocument>;
  listByUserSorted(userId: string): Promise<IInterviewDocument[]>;
}
