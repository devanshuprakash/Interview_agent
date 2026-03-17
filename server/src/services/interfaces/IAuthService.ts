import type { GoogleAuthInput, GoogleAuthResult } from "../AuthService.js";

export interface IAuthService {
  googleAuth(input: GoogleAuthInput): Promise<GoogleAuthResult>;
}
