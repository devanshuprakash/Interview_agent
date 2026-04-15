import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from "vitest";
import request from "supertest";
import mongoose from "mongoose";
import { buildTestApp, teardownTestApp } from "./testApp.js";
import type { IAIProvider } from "../../src/providers/ai/IAIProvider.js";
import type { IPaymentGateway } from "../../src/providers/payment/IPaymentGateway.js";
import type { TestApp } from "./testApp.js";

const aiComplete = vi.fn();
const stubAI: IAIProvider = { complete: aiComplete };
const stubGateway: IPaymentGateway = {
  createOrder: async () => ({ id: "order_xyz", amount: 19900, currency: "INR", receipt: "r1", status: "created" }),
  verifySignature: () => true,
};

let testApp: TestApp;
let authCookie: string;

const QUESTIONS_AI_RESPONSE = [
  "What is a closure in JavaScript?",
  "Explain event loop.",
  "What is the difference between let and var?",
  "Explain promises.",
  "What is async/await?",
].join("\n");

const SCORE_AI_RESPONSE = JSON.stringify({
  confidence: 8, communication: 7, correctness: 9,
  finalScore: 8, feedback: "Well structured answer.",
});

beforeAll(async () => {
  testApp = await buildTestApp(stubAI, stubGateway);

  // Create an auth user with enough credits
  const authRes = await request(testApp.app)
    .post("/api/auth/google")
    .send({ name: "Charlie", email: "charlie@example.com" });

  authCookie = authRes.headers["set-cookie"];

  // Manually set credits to 300 for the test user
  await mongoose.connection.collection("users").updateOne(
    { email: "charlie@example.com" },
    { $set: { credits: 300 } },
  );
});

afterAll(async () => {
  await teardownTestApp(testApp.mongod);
});

beforeEach(() => {
  vi.clearAllMocks();
});

describe("Interview Flow (integration)", () => {
  let interviewId: string;

  it("POST /api/interview/generate-questions → creates interview with questions", async () => {
    aiComplete.mockResolvedValue(QUESTIONS_AI_RESPONSE);

    const res = await request(testApp.app)
      .post("/api/interview/generate-questions")
      .set("Cookie", authCookie)
      .send({ role: "Engineer", experience: "2 years", mode: "Technical" });

    expect(res.status).toBe(200);
    expect(res.body.interviewId).toBeDefined();
    expect(res.body.questions.length).toBeGreaterThan(0);
    interviewId = res.body.interviewId;
  });

  it("POST /api/interview/submit-answer → returns feedback", async () => {
    // Need to create interview first if not set
    if (!interviewId) {
      aiComplete.mockResolvedValue(QUESTIONS_AI_RESPONSE);
      const genRes = await request(testApp.app)
        .post("/api/interview/generate-questions")
        .set("Cookie", authCookie)
        .send({ role: "Engineer", experience: "2 years", mode: "Technical" });
      interviewId = genRes.body.interviewId;
    }

    aiComplete.mockResolvedValue(SCORE_AI_RESPONSE);

    const res = await request(testApp.app)
      .post("/api/interview/submit-answer")
      .set("Cookie", authCookie)
      .send({ interviewId, questionIndex: 0, answer: "Closures capture enclosing scope.", timeTaken: 45 });

    expect(res.status).toBe(200);
    expect(res.body.feedback).toBeDefined();
  });

  it("POST /api/interview/finish → returns final score", async () => {
    if (!interviewId) return;

    const res = await request(testApp.app)
      .post("/api/interview/finish")
      .set("Cookie", authCookie)
      .send({ interviewId });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("finalScore");
  });

  it("GET /api/interview/report/:id → returns report", async () => {
    if (!interviewId) return;

    const res = await request(testApp.app)
      .get(`/api/interview/report/${interviewId}`)
      .set("Cookie", authCookie);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("finalScore");
  });
});
