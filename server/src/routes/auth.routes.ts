import { Router } from "express";
import type { AuthController } from "../controllers/AuthController.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export function buildAuthRoutes(controller: AuthController): Router {
  const router = Router();
  router.post("/google", asyncHandler(controller.googleAuth));
  router.get("/google/callback", asyncHandler(controller.googleCallback));
  router.get("/logout", asyncHandler(controller.logOut));
  return router;
}
