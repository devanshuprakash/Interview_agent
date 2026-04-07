import type { Response } from "express";

/**
 * BaseController — shared response helpers so child controllers don't
 * sprinkle status codes across the codebase.
 */
export abstract class BaseController {
  protected ok<T>(res: Response, body: T): Response {
    return res.status(200).json(body);
  }

  protected created<T>(res: Response, body: T): Response {
    return res.status(201).json(body);
  }
}
