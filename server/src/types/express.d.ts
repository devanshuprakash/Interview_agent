import "express";

declare module "express-serve-static-core" {
  interface Request {
    user?: { id: string };
  }
}

export interface AuthedRequest extends Express.Request {
  user: { id: string };
}
