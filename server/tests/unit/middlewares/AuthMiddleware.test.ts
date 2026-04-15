import { describe, it, expect, vi, beforeEach } from "vitest";
import type { Request, Response, NextFunction } from "express";
import { AuthMiddleware } from "../../../src/middlewares/AuthMiddleware.js";
import type { ITokenService } from "../../../src/services/interfaces/ITokenService.js";
import { AuthError } from "../../../src/errors/index.js";

const mockTokenService = (): ITokenService => ({
  sign: vi.fn(),
  verify: vi.fn(),
});

function mockReqRes(cookies: Record<string, string> = {}) {
  const req = { cookies } as unknown as Request;
  const res = {
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
  } as unknown as Response;
  const next = vi.fn() as NextFunction;
  return { req, res, next };
}

describe("AuthMiddleware", () => {
  let tokens: ReturnType<typeof mockTokenService>;
  let sut: AuthMiddleware;

  beforeEach(() => {
    tokens = mockTokenService();
    sut = new AuthMiddleware(tokens as any);
  });

  it("returns 400 when no token cookie", () => {
    const { req, res, next } = mockReqRes({});
    sut.handle(req, res, next);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(next).not.toHaveBeenCalled();
  });

  it("returns 400 when token is invalid", () => {
    vi.mocked(tokens.verify).mockImplementation(() => { throw new AuthError(); });
    const { req, res, next } = mockReqRes({ token: "bad-token" });
    sut.handle(req, res, next);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(next).not.toHaveBeenCalled();
  });

  it("attaches req.user and calls next when token is valid", () => {
    vi.mocked(tokens.verify).mockReturnValue({ userId: "user-123" });
    const { req, res, next } = mockReqRes({ token: "valid-token" });
    sut.handle(req, res, next);
    expect((req as any).user).toEqual({ id: "user-123" });
    expect(next).toHaveBeenCalled();
  });
});
