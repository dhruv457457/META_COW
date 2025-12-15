import mongoose, { Schema, Document } from "mongoose";

export interface ICopyTrade extends Document {
  permissionId: string;
  userOpHash: string;
  userId: string;
  traderAddress: string;
  inputToken: string;
  outputToken: string;
  amount: string;
  originalTxHash: string;
  executedAt: Date;
}

const CopyTradeSchema = new Schema<ICopyTrade>({
  permissionId: {
    type: String,
    required: true,
  },
  userOpHash: {
    type: String,
    required: true,
    unique: true,
  },
  userId: {
    type: String,
    required: true,
    lowercase: true,
  },
  traderAddress: {
    type: String,
    required: true,
    lowercase: true,
  },
  inputToken: {
    type: String,
    required: true,
    lowercase: true,
  },
  outputToken: {
    type: String,
    required: true,
    lowercase: true,
  },
  amount: {
    type: String,
    required: true,
  },
  originalTxHash: {
    type: String,
    required: true,
  },
  executedAt: {
    type: Date,
    default: Date.now,
  },
});

// Indexes for efficient queries
CopyTradeSchema.index({ permissionId: 1 });
CopyTradeSchema.index({ userId: 1 });
CopyTradeSchema.index({ originalTxHash: 1 });
CopyTradeSchema.index({ executedAt: -1 });

// Unique compound index to prevent duplicate copies
CopyTradeSchema.index({ permissionId: 1, originalTxHash: 1 }, { unique: true });

export default mongoose.models.CopyTrade || 
  mongoose.model<ICopyTrade>("CopyTrade", CopyTradeSchema);