import jwt from "jsonwebtoken";
import { AuthError } from "../errors/index.js";
import type { ITokenService } from "./interfaces/ITokenService.js";

export interface TokenPayload {
  userId: string;
}

/**
 * TokenService — JWT sign/verify with the app's shared secret.
 * 7-day TTL matches the legacy behavior.
 * Implements ITokenService (DIP).
 */
type ExpiresIn = NonNullable<jwt.SignOptions["expiresIn"]>;

export class TokenService implements ITokenService {
  private readonly expiresIn: ExpiresIn;

  constructor(secret: string, expiresIn: ExpiresIn = "7d") {
    this.secret = secret;
    this.expiresIn = expiresIn;
  }

  private readonly secret: string;

  sign(userId: string): string {
    const options: jwt.SignOptions = { expiresIn: this.expiresIn };
    return jwt.sign({ userId }, this.secret, options);
  }

  verify(token: string): TokenPayload {
    try {
      const decoded = jwt.verify(token, this.secret) as TokenPayload;
      if (!decoded || !decoded.userId) {
        throw new AuthError("Invalid token payload");
      }
      return decoded;
    } catch {
      throw new AuthError("user does not have a valid token");
    }
  }
}
