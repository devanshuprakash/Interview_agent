import type {
  Request,
  Response,
  NextFunction,
  ErrorRequestHandler,
} from "express";
import { AppError } from "../errors/index.js";
import { ZodError } from "zod";

/**
 * ErrorHandlerMiddleware — single translator from thrown errors to HTTP.
 * - AppError subclasses map to their `status` + `message`
 * - ZodError maps to 400 with the first issue's message
 * - Anything else is 500
 */
export class ErrorHandlerMiddleware {
  handle: ErrorRequestHandler = (
    err: unknown,
    _req: Request,
    res: Response,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _next: NextFunction,
  ) => {
    if (err instanceof AppError) {
      res.status(err.status).json({ message: err.message });
      return;
    }
    if (err instanceof ZodError) {
      const first = err.issues[0]?.message ?? "Invalid request";
      res.status(400).json({ message: first });
      return;
    }
    console.error("Unhandled error:", err);
    const message =
      err instanceof Error ? err.message : "Internal Server Error";
    res.status(500).json({ message });
  };
}
