import type {
  IPaymentDocument,
  IPayment,
} from "../../domain/models/payment.model.js";

export interface IPaymentRepository {
  findById(id: string): Promise<IPaymentDocument | null>;
  createPayment(data: Partial<IPayment>): Promise<IPaymentDocument>;
  findByOrderId(orderId: string): Promise<IPaymentDocument | null>;
}
