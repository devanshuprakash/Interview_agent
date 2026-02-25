import mongoose, { Schema, Document, Model } from "mongoose";

export interface IUser {
  name: string;
  email: string;
  credits: number;
}

export interface IUserDocument extends IUser, Document {
  _id: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUserDocument>(
  {
    name: { type: String, required: true },
    email: { type: String, unique: true, required: true },
    credits: { type: Number, default: 100 },
  },
  { timestamps: true },
);

export const UserModel: Model<IUserDocument> = mongoose.model<IUserDocument>(
  "User",
  userSchema,
);
