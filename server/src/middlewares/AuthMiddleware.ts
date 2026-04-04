import type { Request, Response, NextFunction, RequestHandler } from "express";
import type { TokenService } from "../services/TokenService.js";

/**
 * AuthMiddleware — reads JWT from the `token` cookie, attaches `req.user`.
 * Preserves the legacy error messages and status codes for parity.
 */
export class AuthMiddleware {
  constructor(private readonly tokens: TokenService) {}

  handle: RequestHandler = (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      const token = (req.cookies as Record<string, string> | undefined)?.[
        "token"
      ];
      if (!token) {
        res.status(400).json({ message: "user does not have a token" });
        return;
      }
      const decoded = this.tokens.verify(token);
      req.user = { id: decoded.userId };
      next();
    } catch {
      res.status(400).json({ message: "user does not have a valid token" });
    }
  };
}
