import { Router } from "express";
import type { UserController } from "../controllers/UserController.js";
import type { AuthMiddleware } from "../middlewares/AuthMiddleware.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export function buildUserRoutes(
  controller: UserController,
  authMw: AuthMiddleware,
): Router {
  const router = Router();
  router.get(
    "/current-user",
    authMw.handle,
    asyncHandler(controller.getCurrentUser),
  );
  return router;
}
