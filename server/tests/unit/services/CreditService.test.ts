import { describe, it, expect, vi, beforeEach } from "vitest";
import { CreditService } from "../../../src/services/CreditService.js";
import type { IUserRepository } from "../../../src/repositories/interfaces/IUserRepository.js";
import { NotFoundError, InsufficientCreditsError } from "../../../src/errors/index.js";
import { makeUser } from "../../fixtures/builders.js";

const mockRepo = (): IUserRepository => ({
  findById: vi.fn(),
  findByEmail: vi.fn(),
  createUser: vi.fn(),
  decrementCreditsIfEnough: vi.fn(),
  incrementCredits: vi.fn(),
});

describe("CreditService", () => {
  let repo: ReturnType<typeof mockRepo>;
  let sut: CreditService;

  beforeEach(() => {
    repo = mockRepo();
    sut = new CreditService(repo);
  });

  describe("debit", () => {
    it("returns creditsLeft when sufficient balance", async () => {
      const user = makeUser({ credits: 150 });
      vi.mocked(repo.decrementCreditsIfEnough).mockResolvedValue(user);

      const result = await sut.debit("uid", 50);
      expect(result.creditsLeft).toBe(150);
    });

    it("throws NotFoundError when user does not exist", async () => {
      vi.mocked(repo.decrementCreditsIfEnough).mockResolvedValue(null);
      vi.mocked(repo.findById).mockResolvedValue(null);

      await expect(sut.debit("uid", 50)).rejects.toThrow(NotFoundError);
    });

    it("throws InsufficientCreditsError when balance too low", async () => {
      vi.mocked(repo.decrementCreditsIfEnough).mockResolvedValue(null);
      vi.mocked(repo.findById).mockResolvedValue(makeUser({ credits: 10 }));

      await expect(sut.debit("uid", 50)).rejects.toThrow(InsufficientCreditsError);
    });
  });

  describe("refund", () => {
    it("calls incrementCredits with correct arguments", async () => {
      vi.mocked(repo.incrementCredits).mockResolvedValue(makeUser());

      await sut.refund("uid", 50);
      expect(repo.incrementCredits).toHaveBeenCalledWith("uid", 50);
    });
  });

  describe("grant", () => {
    it("calls incrementCredits with correct arguments", async () => {
      vi.mocked(repo.incrementCredits).mockResolvedValue(makeUser());

      await sut.grant("uid", 100);
      expect(repo.incrementCredits).toHaveBeenCalledWith("uid", 100);
    });
  });
});
