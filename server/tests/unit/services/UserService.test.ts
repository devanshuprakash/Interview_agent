import { describe, it, expect, vi, beforeEach } from "vitest";
import { UserService } from "../../../src/services/UserService.js";
import type { IUserRepository } from "../../../src/repositories/interfaces/IUserRepository.js";
import { NotFoundError } from "../../../src/errors/index.js";
import { makeUser } from "../../fixtures/builders.js";

const mockRepo = (): IUserRepository => ({
  findById: vi.fn(),
  findByEmail: vi.fn(),
  createUser: vi.fn(),
  decrementCreditsIfEnough: vi.fn(),
  incrementCredits: vi.fn(),
});

describe("UserService", () => {
  let repo: ReturnType<typeof mockRepo>;
  let sut: UserService;

  beforeEach(() => {
    repo = mockRepo();
    sut = new UserService(repo);
  });

  it("returns the user when found", async () => {
    const user = makeUser();
    vi.mocked(repo.findById).mockResolvedValue(user);

    await expect(sut.getById(user._id.toString())).resolves.toBe(user);
  });

  it("throws NotFoundError when user does not exist", async () => {
    vi.mocked(repo.findById).mockResolvedValue(null);

    await expect(sut.getById("nonexistent")).rejects.toThrow(NotFoundError);
  });
});
