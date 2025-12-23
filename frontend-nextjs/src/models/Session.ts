import mongoose, { Schema, Document } from "mongoose";

export interface ISession extends Document {
  userAddress: string;          // User's wallet (EOA)
  eoaAddress: string;           // Session signer EOA
  smartAccountAddress: string;  // MetaMask Smart Account address
  address: string;              // ✅ Added: Duplicate of smartAccountAddress to satisfy DB index
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
    // ✅ Added this field to match your DB's expectations and fix the TS error
    address: {
      type: String,
      required: true,
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

// Indexes
SessionSchema.index({ userAddress: 1 });
SessionSchema.index({ smartAccountAddress: 1 });
SessionSchema.index({ address: 1 }); // Ensure index exists for this too

// Force delete old model to prevent overwrite errors during hot-reload
if (mongoose.models.Session) {
  delete mongoose.models.Session;
}

export default mongoose.model<ISession>("Session", SessionSchema);