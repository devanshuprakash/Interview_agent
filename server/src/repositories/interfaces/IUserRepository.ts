import type { IUserDocument } from "../../domain/models/user.model.js";

export interface IUserRepository {
  findById(id: string): Promise<IUserDocument | null>;
  findByEmail(email: string): Promise<IUserDocument | null>;
  createUser(data: { name: string; email: string }): Promise<IUserDocument>;
  decrementCreditsIfEnough(id: string, cost: number): Promise<IUserDocument | null>;
  incrementCredits(id: string, amount: number): Promise<IUserDocument | null>;
}
