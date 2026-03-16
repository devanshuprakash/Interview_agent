import type { Model } from "mongoose";
import { BaseRepository } from "./BaseRepository.js";
import type {
  IPaymentDocument,
  IPayment,
} from "../domain/models/payment.model.js";
import type { IPaymentRepository } from "./interfaces/IPaymentRepository.js";

export class PaymentRepository
  extends BaseRepository<IPaymentDocument>
  implements IPaymentRepository
{
  constructor(model: Model<IPaymentDocument>) {
    super(model);
  }

  async createPayment(data: Partial<IPayment>): Promise<IPaymentDocument> {
    return this.model.create(data);
  }

  async findByOrderId(orderId: string): Promise<IPaymentDocument | null> {
    return this.model.findOne({ razorpayOrderId: orderId }).exec();
  }
}
