import type { IUserDocument } from "../../domain/models/user.model.js";

export interface IUserService {
  getById(id: string): Promise<IUserDocument>;
}
