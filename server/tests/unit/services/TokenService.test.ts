import { describe, it, expect } from "vitest";
import { TokenService } from "../../../src/services/TokenService.js";
import { AuthError } from "../../../src/errors/index.js";

const SECRET = "test-secret";

describe("TokenService", () => {
  const sut = new TokenService(SECRET, "7d");

  it("sign + verify round-trip returns correct userId", () => {
    const token = sut.sign("user-123");
    const payload = sut.verify(token);
    expect(payload.userId).toBe("user-123");
  });

  it("throws AuthError on malformed token", () => {
    expect(() => sut.verify("not.a.token")).toThrow(AuthError);
  });

  it("throws AuthError on expired token", () => {
    const expiredService = new TokenService(SECRET, "0s");
    const token = expiredService.sign("user-456");
    // Wait 1ms to ensure expiry
    expect(() => sut.verify(token)).toThrow(AuthError);
  });

  it("throws AuthError on wrong secret", () => {
    const otherService = new TokenService("other-secret", "7d");
    const token = otherService.sign("user-789");
    expect(() => sut.verify(token)).toThrow(AuthError);
  });
});
