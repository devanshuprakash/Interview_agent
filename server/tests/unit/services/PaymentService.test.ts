import { describe, it, expect, vi, beforeEach } from "vitest";
import { PaymentService } from "../../../src/services/PaymentService.js";
import type { IPaymentRepository } from "../../../src/repositories/interfaces/IPaymentRepository.js";
import type { IUserRepository } from "../../../src/repositories/interfaces/IUserRepository.js";
import type { IPaymentGateway } from "../../../src/providers/payment/IPaymentGateway.js";
import { NotFoundError, PaymentError, ValidationError } from "../../../src/errors/index.js";
import { makeUser } from "../../fixtures/builders.js";
import mongoose from "mongoose";

const mockPaymentRepo = (): IPaymentRepository => ({
  findById: vi.fn(),
  createPayment: vi.fn(),
  findByOrderId: vi.fn(),
});
const mockUserRepo = (): IUserRepository => ({
  findById: vi.fn(),
  findByEmail: vi.fn(),
  createUser: vi.fn(),
  decrementCreditsIfEnough: vi.fn(),
  incrementCredits: vi.fn(),
});
const mockGateway = (): IPaymentGateway => ({
  createOrder: vi.fn().mockResolvedValue({ id: "order_123" }),
  verifySignature: vi.fn(),
});

function makePaymentDoc(overrides: Record<string, unknown> = {}) {
  return {
    _id: new mongoose.Types.ObjectId(),
    userId: new mongoose.Types.ObjectId(),
    planId: "plan_a",
    amount: 499,
    credits: 100,
    razorpayOrderId: "order_123",
    razorpayPaymentId: "",
    status: "created",
    save: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  };
}

describe("PaymentService", () => {
  let payments: ReturnType<typeof mockPaymentRepo>;
  let users: ReturnType<typeof mockUserRepo>;
  let gateway: ReturnType<typeof mockGateway>;
  let sut: PaymentService;

  beforeEach(() => {
    payments = mockPaymentRepo();
    users = mockUserRepo();
    gateway = mockGateway();
    sut = new PaymentService(payments, users, gateway);
  });

  describe("createOrder", () => {
    it("throws ValidationError when amount or credits missing", async () => {
      await expect(sut.createOrder("uid", { planId: "p", amount: 0, credits: 100 }))
        .rejects.toThrow(ValidationError);
      await expect(sut.createOrder("uid", { planId: "p", amount: 499, credits: 0 }))
        .rejects.toThrow(ValidationError);
    });

    it("creates gateway order and persists payment record", async () => {
      vi.mocked(payments.createPayment).mockResolvedValue(makePaymentDoc() as any);

      const result = await sut.createOrder("uid", { planId: "plan_a", amount: 499, credits: 100 });

      expect(gateway.createOrder).toHaveBeenCalledWith(expect.objectContaining({ amountPaise: 49900, currency: "INR" }));
      expect(payments.createPayment).toHaveBeenCalled();
      expect(result.id).toBe("order_123");
    });
  });

  describe("verifyPayment", () => {
    it("throws PaymentError on invalid signature", async () => {
      vi.mocked(gateway.verifySignature).mockReturnValue(false);

      await expect(sut.verifyPayment({
        razorpay_order_id: "order_123",
        razorpay_payment_id: "pay_abc",
        razorpay_signature: "bad_sig",
      })).rejects.toThrow(PaymentError);
    });

    it("throws NotFoundError when payment record missing", async () => {
      vi.mocked(gateway.verifySignature).mockReturnValue(true);
      vi.mocked(payments.findByOrderId).mockResolvedValue(null);

      await expect(sut.verifyPayment({
        razorpay_order_id: "order_123",
        razorpay_payment_id: "pay_abc",
        razorpay_signature: "sig",
      })).rejects.toThrow(NotFoundError);
    });

    it("returns already-processed when payment status is paid", async () => {
      vi.mocked(gateway.verifySignature).mockReturnValue(true);
      vi.mocked(payments.findByOrderId).mockResolvedValue(makePaymentDoc({ status: "paid" }) as any);

      const result = await sut.verifyPayment({
        razorpay_order_id: "order_123",
        razorpay_payment_id: "pay_abc",
        razorpay_signature: "sig",
      });
      expect(result.message).toBe("Already processed");
    });

    it("marks payment paid and increments user credits", async () => {
      const payment = makePaymentDoc();
      vi.mocked(gateway.verifySignature).mockReturnValue(true);
      vi.mocked(payments.findByOrderId).mockResolvedValue(payment as any);
      vi.mocked(users.incrementCredits).mockResolvedValue(makeUser({ credits: 300 }));

      const result = await sut.verifyPayment({
        razorpay_order_id: "order_123",
        razorpay_payment_id: "pay_abc",
        razorpay_signature: "sig",
      });

      expect(payment.status).toBe("paid");
      expect(users.incrementCredits).toHaveBeenCalledWith(payment.userId.toString(), payment.credits);
      expect(result.success).toBe(true);
    });
  });
});
