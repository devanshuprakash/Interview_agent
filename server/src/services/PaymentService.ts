import type { IPaymentRepository } from "../repositories/interfaces/IPaymentRepository.js";
import type { IUserRepository } from "../repositories/interfaces/IUserRepository.js";
import type { IPaymentGateway } from "../providers/payment/IPaymentGateway.js";
import type { IUserDocument } from "../domain/models/user.model.js";
import type { PaymentOrder } from "../providers/payment/IPaymentGateway.js";
import type { IPaymentService } from "./interfaces/IPaymentService.js";
import {
  NotFoundError,
  PaymentError,
  ValidationError,
} from "../errors/index.js";

export interface CreateOrderDto {
  planId: string;
  amount: number;
  credits: number;
}

export interface VerifyPaymentDto {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

export interface VerifyPaymentResult {
  success: boolean;
  message: string;
  user: IUserDocument | null;
}

/**
 * PaymentService — owns order creation and verification.
 * Signature math lives in the gateway; credit top-up after verification
 * lives here. Implements IPaymentService (DIP).
 */
export class PaymentService implements IPaymentService {
  constructor(
    private readonly payments: IPaymentRepository,
    private readonly users: IUserRepository,
    private readonly gateway: IPaymentGateway,
  ) {}

  async createOrder(userId: string, dto: CreateOrderDto): Promise<PaymentOrder> {
    if (!dto.amount || !dto.credits) {
      throw new ValidationError("Invalid plan data");
    }

    const order = await this.gateway.createOrder({
      amountPaise: dto.amount * 100,
      currency: "INR",
      receipt: `receipt_${Date.now()}`,
    });

    await this.payments.createPayment({
      userId: userId as unknown as IPaymentDocumentUserId,
      planId: dto.planId,
      amount: dto.amount,
      credits: dto.credits,
      razorpayOrderId: order.id,
      status: "created",
    });

    return order;
  }

  async verifyPayment(dto: VerifyPaymentDto): Promise<VerifyPaymentResult> {
    const valid = this.gateway.verifySignature({
      orderId: dto.razorpay_order_id,
      paymentId: dto.razorpay_payment_id,
      signature: dto.razorpay_signature,
    });

    if (!valid) {
      throw new PaymentError("Invalid payment signature");
    }

    const payment = await this.payments.findByOrderId(dto.razorpay_order_id);
    if (!payment) {
      throw new NotFoundError("Payment not found");
    }

    if (payment.status === "paid") {
      return { success: true, message: "Already processed", user: null };
    }

    payment.status = "paid";
    payment.razorpayPaymentId = dto.razorpay_payment_id;
    await payment.save();

    const updatedUser = await this.users.incrementCredits(
      payment.userId.toString(),
      payment.credits,
    );

    return {
      success: true,
      message: "Payment verified and credits added",
      user: updatedUser,
    };
  }
}

// Narrow helper type alias — PaymentRepository typing accepts the ObjectId
// shape directly, we keep this named here for readability.
type IPaymentDocumentUserId = import("mongoose").Types.ObjectId;
