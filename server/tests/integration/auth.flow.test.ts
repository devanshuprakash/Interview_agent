import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import request from "supertest";
import mongoose from "mongoose";
import { buildTestApp, teardownTestApp } from "./testApp.js";
import type { IAIProvider } from "../../src/providers/ai/IAIProvider.js";
import type { IPaymentGateway } from "../../src/providers/payment/IPaymentGateway.js";
import type { TestApp } from "./testApp.js";

const stubAI: IAIProvider = { complete: async () => "" };
const stubGateway: IPaymentGateway = {
  createOrder: async () => ({ id: "order_xyz", amount: 19900, currency: "INR", receipt: "r1", status: "created" }),
  verifySignature: () => true,
};

let testApp: TestApp;

beforeAll(async () => {
  testApp = await buildTestApp(stubAI, stubGateway);
});

afterAll(async () => {
  await teardownTestApp(testApp.mongod);
});

beforeEach(async () => {
  const collections = mongoose.connection.collections;
  for (const col of Object.values(collections)) {
    await col.deleteMany({});
  }
});

describe("Auth Flow (integration)", () => {
  it("POST /api/auth/google → sets cookie and returns user", async () => {
    const res = await request(testApp.app)
      .post("/api/auth/google")
      .send({ name: "Alice", email: "alice@example.com" });

    expect(res.status).toBe(200);
    expect(res.headers["set-cookie"]).toBeDefined();
    expect(res.body.email).toBe("alice@example.com");
  });

  it("GET /api/user/current-user → returns 400 without cookie", async () => {
    const res = await request(testApp.app).get("/api/user/current-user");
    expect(res.status).toBe(400);
  });

  it("GET /api/user/current-user → returns user with valid cookie", async () => {
    // Create user first
    const authRes = await request(testApp.app)
      .post("/api/auth/google")
      .send({ name: "Bob", email: "bob@example.com" });

    const cookie = authRes.headers["set-cookie"];

    const meRes = await request(testApp.app)
      .get("/api/user/current-user")
      .set("Cookie", cookie);

    expect(meRes.status).toBe(200);
    expect(meRes.body.email).toBe("bob@example.com");
  });

  it("GET /api/auth/logout → clears cookie", async () => {
    const res = await request(testApp.app).get("/api/auth/logout");
    expect(res.status).toBe(200);
    expect(res.body.message).toContain("LogOut");
  });
});
