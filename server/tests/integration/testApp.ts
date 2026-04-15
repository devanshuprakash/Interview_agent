/**
 * testCompose — a test-only composition root that stubs out IAIProvider
 * and IPaymentGateway at the DI boundary so integration tests never
 * call real external services, while the full Express + Mongoose graph
 * is otherwise real (using mongodb-memory-server).
 */
import { MongoMemoryServer } from "mongodb-memory-server";
import mongoose from "mongoose";
import type { Express } from "express";
import { buildApp } from "../../src/app.js";

import { UserModel } from "../../src/domain/models/user.model.js";
import { InterviewModel } from "../../src/domain/models/interview.model.js";
import { PaymentModel } from "../../src/domain/models/payment.model.js";
import { UserRepository } from "../../src/repositories/UserRepository.js";
import { InterviewRepository } from "../../src/repositories/InterviewRepository.js";
import { PaymentRepository } from "../../src/repositories/PaymentRepository.js";
import { TokenService } from "../../src/services/TokenService.js";
import { AuthService } from "../../src/services/AuthService.js";
import { UserService } from "../../src/services/UserService.js";
import { ResumeAnalyzerService } from "../../src/services/ResumeAnalyzerService.js";
import { CreditService } from "../../src/services/CreditService.js";
import { AnswerEvaluationService } from "../../src/services/AnswerEvaluationService.js";
import { InterviewService } from "../../src/services/InterviewService.js";
import { PaymentService } from "../../src/services/PaymentService.js";
import { HRInterviewStrategy } from "../../src/strategies/HRInterviewStrategy.js";
import { TechnicalInterviewStrategy } from "../../src/strategies/TechnicalInterviewStrategy.js";
import { BehavioralInterviewStrategy } from "../../src/strategies/BehavioralInterviewStrategy.js";
import { InterviewStrategyFactory } from "../../src/strategies/InterviewStrategyFactory.js";
import { AuthController } from "../../src/controllers/AuthController.js";
import { UserController } from "../../src/controllers/UserController.js";
import { InterviewController } from "../../src/controllers/InterviewController.js";
import { PaymentController } from "../../src/controllers/PaymentController.js";
import { AuthMiddleware } from "../../src/middlewares/AuthMiddleware.js";
import { ErrorHandlerMiddleware } from "../../src/middlewares/ErrorHandlerMiddleware.js";
import { MulterMiddleware } from "../../src/middlewares/MulterMiddleware.js";
import type { IAIProvider } from "../../src/providers/ai/IAIProvider.js";
import type { IPaymentGateway } from "../../src/providers/payment/IPaymentGateway.js";

const TEST_SECRET = "test-jwt-secret";

export interface TestApp {
  app: Express;
  mongod: MongoMemoryServer;
  tokens: TokenService;
  stubAI: IAIProvider;
  stubGateway: IPaymentGateway;
}

export async function buildTestApp(
  stubAI: IAIProvider,
  stubGateway: IPaymentGateway,
): Promise<TestApp> {
  const mongod = await MongoMemoryServer.create();
  await mongoose.connect(mongod.getUri());

  const userRepo = new UserRepository(UserModel);
  const interviewRepo = new InterviewRepository(InterviewModel);
  const paymentRepo = new PaymentRepository(PaymentModel);

  const strategies = new InterviewStrategyFactory(
    new HRInterviewStrategy(),
    new TechnicalInterviewStrategy(),
    new BehavioralInterviewStrategy(),
  );

  const tokens = new TokenService(TEST_SECRET);
  const authService = new AuthService(userRepo, tokens);
  const userService = new UserService(userRepo);
  const resumeService = new ResumeAnalyzerService(stubAI);
  const creditService = new CreditService(userRepo);
  const evaluationService = new AnswerEvaluationService(interviewRepo, stubAI, strategies);
  const interviewService = new InterviewService(
    interviewRepo, stubAI, strategies, creditService, evaluationService,
  );
  const paymentService = new PaymentService(paymentRepo, userRepo, stubGateway);

  const middlewares = {
    auth: new AuthMiddleware(tokens),
    errorHandler: new ErrorHandlerMiddleware(),
    multer: new MulterMiddleware(),
  };

  const controllers = {
    auth: new AuthController(authService),
    user: new UserController(userService),
    interview: new InterviewController(interviewService, resumeService),
    payment: new PaymentController(paymentService),
  };

  const app = buildApp({ controllers, middlewares, bus: {} as any }, "http://localhost:3000");

  return { app, mongod, tokens, stubAI, stubGateway };
}

export async function teardownTestApp(mongod: MongoMemoryServer) {
  await mongoose.disconnect();
  await mongod.stop();
}
