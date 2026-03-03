import type { Request, Response, NextFunction, RequestHandler } from "express";

/**
 * asyncHandler — wraps an async route handler so thrown errors are forwarded
 * to Express's error-handling middleware (ErrorHandlerMiddleware).
 */
export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>,
): RequestHandler {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}
