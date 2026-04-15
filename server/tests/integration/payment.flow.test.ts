import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import request from "supertest";
import mongoose from "mongoose";
import crypto from "crypto";
import { buildTestApp, teardownTestApp } from "./testApp.js";
import type { IAIProvider } from "../../src/providers/ai/IAIProvider.js";
import type { IPaymentGateway } from "../../src/providers/payment/IPaymentGateway.js";
import type { TestApp } from "./testApp.js";

const stubAI: IAIProvider = { complete: async () => "" };

// Real HMAC signature computation for valid-signature test
const KEY_SECRET = "test_razorpay_secret";

function makeHMACSignature(orderId: string, paymentId: string): string {
  return crypto
    .createHmac("sha256", KEY_SECRET)
    .update(`${orderId}|${paymentId}`)
    .digest("hex");
}

// Gateway stub that does real HMAC verification on KEY_SECRET
const stubGateway: IPaymentGateway = {
  createOrder: async () => ({ id: "order_test_001", amount: 19900, currency: "INR", receipt: "r1", status: "created" }),
  verifySignature: ({ orderId, paymentId, signature }) => {
    const expected = crypto
      .createHmac("sha256", KEY_SECRET)
      .update(`${orderId}|${paymentId}`)
      .digest("hex");
    return signature === expected;
  },
};

let testApp: TestApp;
let authCookie: string;

beforeAll(async () => {
  testApp = await buildTestApp(stubAI, stubGateway);

  const authRes = await request(testApp.app)
    .post("/api/auth/google")
    .send({ name: "Dave", email: "dave@example.com" });

  authCookie = authRes.headers["set-cookie"];
});

afterAll(async () => {
  await teardownTestApp(testApp.mongod);
});

beforeEach(async () => {
  await mongoose.connection.collection("payments").deleteMany({});
});

describe("Payment Flow (integration)", () => {
  it("POST /api/payment/order → creates and returns order", async () => {
    const res = await request(testApp.app)
      .post("/api/payment/order")
      .set("Cookie", authCookie)
      .send({ planId: "plan_basic", amount: 199, credits: 50 });

    expect(res.status).toBe(200);
    expect(res.body.id).toBe("order_test_001");
  });

  it("POST /api/payment/verify → grants credits on valid HMAC", async () => {
    // Create the order here (after beforeEach clears payments collection)
    await request(testApp.app)
      .post("/api/payment/order")
      .set("Cookie", authCookie)
      .send({ planId: "plan_basic", amount: 199, credits: 50 });

    const sig = makeHMACSignature("order_test_001", "pay_valid_001");

    const res = await request(testApp.app)
      .post("/api/payment/verify")
      .send({
        razorpay_order_id: "order_test_001",
        razorpay_payment_id: "pay_valid_001",
        razorpay_signature: sig,
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it("POST /api/payment/verify → 400 on tampered signature", async () => {
    await request(testApp.app)
      .post("/api/payment/order")
      .set("Cookie", authCookie)
      .send({ planId: "plan_basic", amount: 199, credits: 50 });

    const res = await request(testApp.app)
      .post("/api/payment/verify")
      .send({
        razorpay_order_id: "order_test_001",
        razorpay_payment_id: "pay_tampered",
        razorpay_signature: "tampered_signature",
      });

    expect(res.status).toBe(400);
  });
});
