import type { Model } from "mongoose";
import { BaseRepository } from "./BaseRepository.js";
import type { IUserDocument } from "../domain/models/user.model.js";
import type { IUserRepository } from "./interfaces/IUserRepository.js";

export class UserRepository
  extends BaseRepository<IUserDocument>
  implements IUserRepository
{
  constructor(model: Model<IUserDocument>) {
    super(model);
  }

  async findByEmail(email: string): Promise<IUserDocument | null> {
    return this.model.findOne({ email }).exec();
  }

  async createUser(data: { name: string; email: string }): Promise<IUserDocument> {
    return this.model.create(data);
  }

  /**
   * Atomic credit deduction — fixes the TOCTOU race in the old controller.
   * Returns the updated user if credits were sufficient, null otherwise.
   */
  async decrementCreditsIfEnough(
    id: string,
    cost: number,
  ): Promise<IUserDocument | null> {
    return this.model
      .findOneAndUpdate(
        { _id: id, credits: { $gte: cost } },
        { $inc: { credits: -cost } },
        { new: true },
      )
      .exec();
  }

  async incrementCredits(
    id: string,
    amount: number,
  ): Promise<IUserDocument | null> {
    return this.model
      .findByIdAndUpdate(id, { $inc: { credits: amount } }, { new: true })
      .exec();
  }
}
