import { Router } from "express";
import { buildAuthRoutes } from "./auth.routes.js";
import { buildUserRoutes } from "./user.routes.js";
import { buildInterviewRoutes } from "./interview.routes.js";
import { buildPaymentRoutes } from "./payment.routes.js";
import type { AuthController } from "../controllers/AuthController.js";
import type { UserController } from "../controllers/UserController.js";
import type { InterviewController } from "../controllers/InterviewController.js";
import type { PaymentController } from "../controllers/PaymentController.js";
import type { AuthMiddleware } from "../middlewares/AuthMiddleware.js";
import type { MulterMiddleware } from "../middlewares/MulterMiddleware.js";

export interface RouterDeps {
  controllers: {
    auth: AuthController;
    user: UserController;
    interview: InterviewController;
    payment: PaymentController;
  };
  middlewares: {
    auth: AuthMiddleware;
    multer: MulterMiddleware;
  };
}

/**
 * buildApiRouter — mounts all feature routers under /api/*.
 */
export function buildApiRouter(deps: RouterDeps): Router {
  const root = Router();
  root.use("/auth", buildAuthRoutes(deps.controllers.auth));
  root.use("/user", buildUserRoutes(deps.controllers.user, deps.middlewares.auth));
  root.use(
    "/interview",
    buildInterviewRoutes(
      deps.controllers.interview,
      deps.middlewares.auth,
      deps.middlewares.multer,
    ),
  );
  root.use(
    "/payment",
    buildPaymentRoutes(deps.controllers.payment, deps.middlewares.auth),
  );
  return root;
}
