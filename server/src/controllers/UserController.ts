import type { Request, Response } from "express";
import { BaseController } from "./BaseController.js";
import type { UserService } from "../services/UserService.js";
import { AuthError } from "../errors/index.js";

export class UserController extends BaseController {
  constructor(private readonly users: UserService) {
    super();
  }

  getCurrentUser = async (req: Request, res: Response): Promise<void> => {
    if (!req.user) throw new AuthError();
    const user = await this.users.getById(req.user.id);
    res.status(200).json(user);
  };
}
