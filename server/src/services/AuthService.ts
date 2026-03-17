import type { IUserRepository } from "../repositories/interfaces/IUserRepository.js";
import type { ITokenService } from "./interfaces/ITokenService.js";
import type { IUserDocument } from "../domain/models/user.model.js";
import type { IAuthService } from "./interfaces/IAuthService.js";

export interface GoogleAuthInput {
  name: string;
  email: string;
}

export interface GoogleAuthResult {
  user: IUserDocument;
  token: string;
}

/**
 * AuthService — owns sign-in orchestration.
 * Finds or creates the user, then mints a JWT via TokenService.
 * Implements IAuthService (DIP).
 */
export class AuthService implements IAuthService {
  constructor(
    private readonly users: IUserRepository,
    private readonly tokens: ITokenService,
  ) {}

  async googleAuth(input: GoogleAuthInput): Promise<GoogleAuthResult> {
    let user = await this.users.findByEmail(input.email);
    if (!user) {
      user = await this.users.createUser({
        name: input.name,
        email: input.email,
      });
    }
    const token = this.tokens.sign(user._id.toString());
    return { user, token };
  }
}
