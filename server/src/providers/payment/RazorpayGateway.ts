import Razorpay from "razorpay";
import crypto from "crypto";
import type {
  CreateOrderInput,
  IPaymentGateway,
  PaymentOrder,
  SignatureVerificationInput,
} from "./IPaymentGateway.js";

/**
 * RazorpayGateway — IPaymentGateway adapter over the Razorpay Node SDK.
 * HMAC verification is preserved byte-identical to the old controller.
 */
export class RazorpayGateway implements IPaymentGateway {
  private readonly client: Razorpay;

  constructor(
    keyId: string,
    private readonly keySecret: string,
  ) {
    this.client = new Razorpay({
      key_id: keyId,
      key_secret: keySecret,
    });
  }

  async createOrder(input: CreateOrderInput): Promise<PaymentOrder> {
    const order = await this.client.orders.create({
      amount: input.amountPaise,
      currency: input.currency,
      receipt: input.receipt,
    });
    return order as unknown as PaymentOrder;
  }

  verifySignature(input: SignatureVerificationInput): boolean {
    const body = `${input.orderId}|${input.paymentId}`;
    const expected = crypto
      .createHmac("sha256", this.keySecret)
      .update(body)
      .digest("hex");
    return expected === input.signature;
  }
}
