import { describe, it, expect, beforeAll, afterAll } from "vitest";
import request from "supertest";
import { buildTestApp, teardownTestApp } from "./testApp.js";
import type { IAIProvider } from "../../src/providers/ai/IAIProvider.js";
import type { IPaymentGateway } from "../../src/providers/payment/IPaymentGateway.js";
import type { TestApp } from "./testApp.js";

const stubAI: IAIProvider = { complete: async () => "" };
const stubGateway: IPaymentGateway = {
  createOrder: async () => ({ id: "order_xyz", amount: 19900, currency: "INR", receipt: "r1", status: "created" }),
  verifySignature: () => false,
};

let testApp: TestApp;

beforeAll(async () => {
  testApp = await buildTestApp(stubAI, stubGateway);
});

afterAll(async () => {
  await teardownTestApp(testApp.mongod);
});

describe("Error Contract (integration)", () => {
  it("401 / 400 shape: missing cookie → { message: string }", async () => {
    const res = await request(testApp.app).get("/api/user/current-user");
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty("message");
    expect(typeof res.body.message).toBe("string");
  });

  it("404 shape: unknown route → express default (or our 404)", async () => {
    const res = await request(testApp.app).get("/api/does-not-exist");
    expect([404, 400]).toContain(res.status);
  });

  it("400 shape: tampered payment signature → { message: string }", async () => {
    const res = await request(testApp.app)
      .post("/api/payment/verify")
      .send({
        razorpay_order_id: "order_xyz",
        razorpay_payment_id: "pay_bad",
        razorpay_signature: "tampered",
      });
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty("message");
  });

  it("400 shape: Zod validation failure → { message: string }", async () => {
    const res = await request(testApp.app)
      .post("/api/auth/google")
      .send({ missingFields: true });
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty("message");
  });
});
