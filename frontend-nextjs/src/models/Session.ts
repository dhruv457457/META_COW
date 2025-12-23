// src/models/Session.ts
import mongoose, { Schema, Document } from "mongoose";

export interface ISession extends Document {
  userAddress: string;           // User's wallet (EOA)
  eoaAddress: string;            // Session signer EOA
  smartAccountAddress: string;   // MetaMask Smart Account address
  privateKey: string;
  createdAt: Date;
}

const SessionSchema = new Schema<ISession>(
  {
    userAddress: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
    },
    eoaAddress: {
      type: String,
      required: true,
      lowercase: true,
    },
    smartAccountAddress: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
    },
    privateKey: {
      type: String,
      required: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    collection: "sessions",
  }
);

// Remove the duplicate index warnings
SessionSchema.index({ userAddress: 1 });
SessionSchema.index({ smartAccountAddress: 1 });

// Force delete old model
if (mongoose.models.Session) {
  delete mongoose.models.Session;
}

export default mongoose.model<ISession>("Session", SessionSchema);