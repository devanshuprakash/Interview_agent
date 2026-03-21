export interface PaymentOrder {
  id: string;
  amount: number;
  currency: string;
  receipt: string;
  status: string;
  [key: string]: unknown;
}

export interface CreateOrderInput {
  amountPaise: number;
  currency: string;
  receipt: string;
}

export interface SignatureVerificationInput {
  orderId: string;
  paymentId: string;
  signature: string;
}

/**
 * IPaymentGateway — adapter interface for payment providers.
 * Only two operations: create an order, verify a webhook/callback signature.
 */
export interface IPaymentGateway {
  createOrder(input: CreateOrderInput): Promise<PaymentOrder>;
  verifySignature(input: SignatureVerificationInput): boolean;
}
