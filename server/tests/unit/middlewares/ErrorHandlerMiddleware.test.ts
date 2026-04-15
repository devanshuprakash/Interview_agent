import { describe, it, expect, vi } from "vitest";
import type { Request, Response, NextFunction } from "express";
import { ErrorHandlerMiddleware } from "../../../src/middlewares/ErrorHandlerMiddleware.js";
import {
  AppError,
  AuthError,
  NotFoundError,
  ValidationError,
  InsufficientCreditsError,
  PaymentError,
  ExternalServiceError,
} from "../../../src/errors/index.js";
import { ZodError } from "zod";

function mockRes() {
  const res = {
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
  } as unknown as Response;
  return res;
}

const req = {} as Request;
const next = vi.fn() as NextFunction;

describe("ErrorHandlerMiddleware", () => {
  const sut = new ErrorHandlerMiddleware();

  it("maps AuthError → 401", () => {
    const res = mockRes();
    sut.handle(new AuthError("Unauthorized"), req, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
  });

  it("maps NotFoundError → 404", () => {
    const res = mockRes();
    sut.handle(new NotFoundError("not found"), req, res, next);
    expect(res.status).toHaveBeenCalledWith(404);
  });

  it("maps ValidationError → 400", () => {
    const res = mockRes();
    sut.handle(new ValidationError("bad input"), req, res, next);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it("maps InsufficientCreditsError → 400", () => {
    const res = mockRes();
    sut.handle(new InsufficientCreditsError(50), req, res, next);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it("maps PaymentError → 400", () => {
    const res = mockRes();
    sut.handle(new PaymentError("bad sig"), req, res, next);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it("maps ExternalServiceError → 502", () => {
    const res = mockRes();
    sut.handle(new ExternalServiceError("AI down"), req, res, next);
    expect(res.status).toHaveBeenCalledWith(502);
  });

  it("maps ZodError → 400", () => {
    const res = mockRes();
    const zodErr = new ZodError([{ code: "custom", message: "Required", path: [] }]);
    sut.handle(zodErr, req, res, next);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: "Required" }));
  });

  it("maps unknown Error → 500", () => {
    const res = mockRes();
    sut.handle(new Error("boom"), req, res, next);
    expect(res.status).toHaveBeenCalledWith(500);
  });
});
