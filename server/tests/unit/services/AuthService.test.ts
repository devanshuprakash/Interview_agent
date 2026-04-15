import { describe, it, expect, vi, beforeEach } from "vitest";
import { AuthService } from "../../../src/services/AuthService.js";
import type { IUserRepository } from "../../../src/repositories/interfaces/IUserRepository.js";
import type { ITokenService } from "../../../src/services/interfaces/ITokenService.js";
import { makeUser } from "../../fixtures/builders.js";

const mockUsers = (): IUserRepository => ({
  findById: vi.fn(),
  findByEmail: vi.fn(),
  createUser: vi.fn(),
  decrementCreditsIfEnough: vi.fn(),
  incrementCredits: vi.fn(),
});

const mockTokens = (): ITokenService => ({
  sign: vi.fn().mockReturnValue("signed-token"),
  verify: vi.fn(),
});

describe("AuthService", () => {
  let users: ReturnType<typeof mockUsers>;
  let tokens: ReturnType<typeof mockTokens>;
  let sut: AuthService;

  beforeEach(() => {
    users = mockUsers();
    tokens = mockTokens();
    sut = new AuthService(users, tokens);
  });

  describe("googleAuth", () => {
    it("returns existing user + token when user already exists", async () => {
      const user = makeUser({ email: "alice@test.com" });
      vi.mocked(users.findByEmail).mockResolvedValue(user);

      const result = await sut.googleAuth({ name: "Alice", email: "alice@test.com" });

      expect(users.findByEmail).toHaveBeenCalledWith("alice@test.com");
      expect(users.createUser).not.toHaveBeenCalled();
      expect(tokens.sign).toHaveBeenCalledWith(user._id.toString());
      expect(result.token).toBe("signed-token");
      expect(result.user).toBe(user);
    });

    it("creates a new user when email not found", async () => {
      const newUser = makeUser({ email: "bob@test.com" });
      vi.mocked(users.findByEmail).mockResolvedValue(null);
      vi.mocked(users.createUser).mockResolvedValue(newUser);

      const result = await sut.googleAuth({ name: "Bob", email: "bob@test.com" });

      expect(users.createUser).toHaveBeenCalledWith({ name: "Bob", email: "bob@test.com" });
      expect(result.user).toBe(newUser);
      expect(result.token).toBe("signed-token");
    });
  });
});
