import { Router } from "express";
import type { InterviewController } from "../controllers/InterviewController.js";
import type { AuthMiddleware } from "../middlewares/AuthMiddleware.js";
import type { MulterMiddleware } from "../middlewares/MulterMiddleware.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export function buildInterviewRoutes(
  controller: InterviewController,
  authMw: AuthMiddleware,
  multerMw: MulterMiddleware,
): Router {
  const router = Router();

  router.post(
    "/resume",
    authMw.handle,
    multerMw.upload.single("resume"),
    asyncHandler(controller.analyzeResume),
  );
  router.post(
    "/generate-questions",
    authMw.handle,
    asyncHandler(controller.generateQuestions),
  );
  router.post(
    "/submit-answer",
    authMw.handle,
    asyncHandler(controller.submitAnswer),
  );
  router.post("/finish", authMw.handle, asyncHandler(controller.finish));

  router.get(
    "/get-interview",
    authMw.handle,
    asyncHandler(controller.listMine),
  );
  router.get("/report/:id", authMw.handle, asyncHandler(controller.report));

  return router;
}
