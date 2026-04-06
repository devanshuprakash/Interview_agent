import { Router } from "express";
import type { PaymentController } from "../controllers/PaymentController.js";
import type { AuthMiddleware } from "../middlewares/AuthMiddleware.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export function buildPaymentRoutes(
  controller: PaymentController,
  authMw: AuthMiddleware,
): Router {
  const router = Router();
  router.post("/order", authMw.handle, asyncHandler(controller.createOrder));
  router.post("/verify", authMw.handle, asyncHandler(controller.verifyPayment));
  return router;
}
