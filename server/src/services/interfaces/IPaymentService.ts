import type { CreateOrderDto, VerifyPaymentDto, VerifyPaymentResult } from "../PaymentService.js";
import type { PaymentOrder } from "../../providers/payment/IPaymentGateway.js";

export interface IPaymentService {
  createOrder(userId: string, dto: CreateOrderDto): Promise<PaymentOrder>;
  verifyPayment(dto: VerifyPaymentDto): Promise<VerifyPaymentResult>;
}
