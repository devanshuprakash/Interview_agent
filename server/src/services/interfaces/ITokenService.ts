import type { TokenPayload } from "../TokenService.js";

export interface ITokenService {
  sign(userId: string): string;
  verify(token: string): TokenPayload;
}
