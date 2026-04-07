import type { Request, Response } from "express";
import { BaseController } from "./BaseController.js";
import type { PaymentService } from "../services/PaymentService.js";
import { createOrderSchema, verifyPaymentSchema } from "../dto/payment.dto.js";
import { AuthError } from "../errors/index.js";

export class PaymentController extends BaseController {
  constructor(private readonly payments: PaymentService) {
    super();
  }

  createOrder = async (req: Request, res: Response): Promise<void> => {
    if (!req.user) throw new AuthError();
    const dto = createOrderSchema.parse(req.body);
    const order = await this.payments.createOrder(req.user.id, dto);
    res.json(order);
  };

  verifyPayment = async (req: Request, res: Response): Promise<void> => {
    const dto = verifyPaymentSchema.parse(req.body);
    const result = await this.payments.verifyPayment(dto);
    if (result.user === null) {
      // Already processed — parity with old `{ message: "Already processed" }`
      res.json({ message: result.message });
      return;
    }
    res.json(result);
  };
}
