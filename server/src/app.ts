import express, { type Express } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { buildApiRouter } from "./routes/index.js";
import type { ComposedApp } from "./composition-root.js";

/**
 * buildApp — pure Express app construction. Zero side effects beyond
 * middleware/route wiring. Makes integration tests trivial.
 */
export function buildApp(app: ComposedApp, clientOrigin: string): Express {
  const express_app = express();

  express_app.use(
    cors({
      origin: clientOrigin,
      credentials: true,
    }),
  );
  express_app.use(express.json());
  express_app.use(cookieParser());

  // Initiate Google OAuth redirect — browser navigates here directly
  express_app.get("/auth/connect", app.controllers.auth.googleConnect);

  express_app.use(
    "/api",
    buildApiRouter({
      controllers: app.controllers,
      middlewares: {
        auth: app.middlewares.auth,
        multer: app.middlewares.multer,
      },
    }),
  );

  // Error handler must be registered last
  express_app.use(app.middlewares.errorHandler.handle);

  return express_app;
}
