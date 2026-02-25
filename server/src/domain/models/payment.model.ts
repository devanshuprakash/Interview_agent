import mongoose, { Schema, Document, Model } from "mongoose";

export type PaymentStatus = "created" | "paid" | "failed";

export interface IPayment {
  userId: mongoose.Types.ObjectId;
  planId: string;
  amount: number;
  credits: number;
  razorpayOrderId: string;
  razorpayPaymentId?: string;
  status: PaymentStatus;
}

export interface IPaymentDocument extends IPayment, Document {
  _id: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const paymentSchema = new Schema<IPaymentDocument>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    planId: String,
    amount: Number,
    credits: Number,
    razorpayOrderId: String,
    razorpayPaymentId: String,
    status: {
      type: String,
      enum: ["created", "paid", "failed"],
      default: "created",
    },
  },
  { timestamps: true },
);

export const PaymentModel: Model<IPaymentDocument> =
  mongoose.model<IPaymentDocument>("Payment", paymentSchema);
