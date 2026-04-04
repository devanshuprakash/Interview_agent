import type { Request, Response, NextFunction, RequestHandler } from "express";
import type { ZodTypeAny } from "zod";

/**
 * ValidationMiddleware — validates `req.body` against a zod schema.
 * On failure, throws; ErrorHandlerMiddleware translates to 400.
 * On success, replaces `req.body` with the parsed (trimmed/coerced) value.
 */
export class ValidationMiddleware {
  static body(schema: ZodTypeAny): RequestHandler {
    return (req: Request, _res: Response, next: NextFunction) => {
      const result = schema.safeParse(req.body);
      if (!result.success) {
        next(result.error);
        return;
      }
      req.body = result.data;
      next();
    };
  }
}
