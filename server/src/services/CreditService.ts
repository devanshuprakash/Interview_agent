import type { IUserRepository } from "../repositories/interfaces/IUserRepository.js";
import type { ICreditService } from "./interfaces/ICreditService.js";
import { NotFoundError, InsufficientCreditsError } from "../errors/index.js";

/**
 * CreditService — single-responsibility service for credit accounting.
 * Extracted from InterviewService so that atomic debit/refund/grant logic
 * lives in one place, satisfying SRP. Implements ICreditService (DIP).
 */
export class CreditService implements ICreditService {
  constructor(private readonly users: IUserRepository) {}

  /**
   * Atomically debit credits. Throws InsufficientCreditsError if balance
   * is too low, NotFoundError if user doesn't exist.
   */
  async debit(userId: string, cost: number): Promise<{ creditsLeft: number }> {
    const user = await this.users.decrementCreditsIfEnough(userId, cost);
    if (!user) {
      const exists = await this.users.findById(userId);
      if (!exists) throw new NotFoundError("User not found.");
      throw new InsufficientCreditsError(cost);
    }
    return { creditsLeft: user.credits };
  }

  /** Refund credits on AI / downstream failure. Best-effort — logs on error. */
  async refund(userId: string, cost: number): Promise<void> {
    await this.users.incrementCredits(userId, cost);
  }

  /** Grant credits after successful payment verification. */
  async grant(userId: string, amount: number): Promise<void> {
    await this.users.incrementCredits(userId, amount);
  }
}
