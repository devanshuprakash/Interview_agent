import type { Env } from "./config/env.js";

import { UserModel } from "./domain/models/user.model.js";
import { InterviewModel } from "./domain/models/interview.model.js";
import { PaymentModel } from "./domain/models/payment.model.js";

import { UserRepository } from "./repositories/UserRepository.js";
import { InterviewRepository } from "./repositories/InterviewRepository.js";
import { PaymentRepository } from "./repositories/PaymentRepository.js";

import { OpenRouterProvider } from "./providers/ai/OpenRouterProvider.js";
import { RazorpayGateway } from "./providers/payment/RazorpayGateway.js";

import { HRInterviewStrategy } from "./strategies/HRInterviewStrategy.js";
import { TechnicalInterviewStrategy } from "./strategies/TechnicalInterviewStrategy.js";
import { BehavioralInterviewStrategy } from "./strategies/BehavioralInterviewStrategy.js";
import { InterviewStrategyFactory } from "./strategies/InterviewStrategyFactory.js";

import { TokenService } from "./services/TokenService.js";
import { AuthService } from "./services/AuthService.js";
import { UserService } from "./services/UserService.js";
import { ResumeAnalyzerService } from "./services/ResumeAnalyzerService.js";
import { CreditService } from "./services/CreditService.js";
import { AnswerEvaluationService } from "./services/AnswerEvaluationService.js";
import { InterviewService } from "./services/InterviewService.js";
import { PaymentService } from "./services/PaymentService.js";

import { AuthController } from "./controllers/AuthController.js";
import { UserController } from "./controllers/UserController.js";
import { InterviewController } from "./controllers/InterviewController.js";
import { PaymentController } from "./controllers/PaymentController.js";

import { AuthMiddleware } from "./middlewares/AuthMiddleware.js";
import { ErrorHandlerMiddleware } from "./middlewares/ErrorHandlerMiddleware.js";
import { MulterMiddleware } from "./middlewares/MulterMiddleware.js";

import { EventBus } from "./events/EventBus.js";

/**
 * compose — manual dependency-injection graph.
 * The whole object graph is built here and nowhere else.
 * Every type dependency is expressed as an interface (DIP).
 * Grepping this file shows the full wiring at a glance.
 */
export function compose(env: Env) {
  // ── Infrastructure / adapters ──────────────────────────────────────────────
  const ai = new OpenRouterProvider(env.OPENROUTER_API_KEY);
  const paymentGateway = new RazorpayGateway(
    env.RAZORPAY_KEY_ID,
    env.RAZORPAY_KEY_SECRET,
  );

  // ── Repositories (typed as interfaces at callsites) ────────────────────────
  const userRepo = new UserRepository(UserModel);
  const interviewRepo = new InterviewRepository(InterviewModel);
  const paymentRepo = new PaymentRepository(PaymentModel);

  // ── Strategies + factory (OCP — Behavioral added here only) ───────────────
  const strategies = new InterviewStrategyFactory(
    new HRInterviewStrategy(),
    new TechnicalInterviewStrategy(),
    new BehavioralInterviewStrategy(),
  );

  // ── Domain Event Bus (Observer) ────────────────────────────────────────────
  const bus = new EventBus();

  // ── Services (depend on interfaces, not concrete types) ───────────────────
  const tokens = new TokenService(env.JWT_SECRET);
  const authService = new AuthService(userRepo, tokens);
  const userService = new UserService(userRepo);
  const resumeService = new ResumeAnalyzerService(ai);

  // CreditService — SRP: credit accounting in one place
  const creditService = new CreditService(userRepo);

  // AnswerEvaluationService — SRP: AI scoring in one place
  const evaluationService = new AnswerEvaluationService(
    interviewRepo,
    ai,
    strategies,
  );

  // InterviewService — lifecycle only; delegates to CreditService + AnswerEvaluationService
  const interviewService = new InterviewService(
    interviewRepo,
    ai,
    strategies,
    creditService,
    evaluationService,
  );

  const paymentService = new PaymentService(paymentRepo, userRepo, paymentGateway);

  // ── Wire domain events (Observer — decouple side effects) ─────────────────
  bus.on<{ userId: string; credits: number }>("payment.verified", async (e) => {
    await creditService.grant(e.userId, e.credits);
  });

  // ── Middlewares ────────────────────────────────────────────────────────────
  const middlewares = {
    auth: new AuthMiddleware(tokens),
    errorHandler: new ErrorHandlerMiddleware(),
    multer: new MulterMiddleware(),
  };

  // ── Controllers ────────────────────────────────────────────────────────────
  const controllers = {
    auth: new AuthController(authService, {
      clientId: env.GOOGLE_CLIENT_ID,
      clientSecret: env.GOOGLE_CLIENT_SECRET,
      callbackUrl: env.GOOGLE_CALLBACK_URL,
      clientOrigin: env.CLIENT_ORIGIN,
    }),
    user: new UserController(userService),
    interview: new InterviewController(interviewService, resumeService),
    payment: new PaymentController(paymentService),
  };

  return { controllers, middlewares, bus };
}

export type ComposedApp = ReturnType<typeof compose>;
