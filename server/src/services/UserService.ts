import type { IUserRepository } from "../repositories/interfaces/IUserRepository.js";
import type { IUserDocument } from "../domain/models/user.model.js";
import type { IUserService } from "./interfaces/IUserService.js";
import { NotFoundError } from "../errors/index.js";

export class UserService implements IUserService {
  constructor(private readonly users: IUserRepository) {}

  async getById(id: string): Promise<IUserDocument> {
    const user = await this.users.findById(id);
    if (!user) throw new NotFoundError("user does not found");
    return user;
  }
}
