// src/models/Session.ts
import mongoose, { Schema, Document } from "mongoose";

export interface ISession extends Document {
  userAddress: string;
  address: string;
  createdAt: Date;
}

const SessionSchema = new Schema<ISession>({
  userAddress: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
  },
  address: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Create index for faster lookups
SessionSchema.index({ userAddress: 1 });

export default mongoose.models.Session || mongoose.model<ISession>("Session", SessionSchema);