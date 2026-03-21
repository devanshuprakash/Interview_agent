import { z } from "zod";

export const createOrderSchema = z.object({
  planId: z.string(),
  amount: z.number(),
  credits: z.number(),
});

export type CreateOrderDto = z.infer<typeof createOrderSchema>;

export const verifyPaymentSchema = z.object({
  razorpay_order_id: z.string().min(1),
  razorpay_payment_id: z.string().min(1),
  razorpay_signature: z.string().min(1),
});

export type VerifyPaymentDto = z.infer<typeof verifyPaymentSchema>;
