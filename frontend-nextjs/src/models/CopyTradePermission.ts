// src/models/CopyTradePermission.ts
import mongoose, { Schema, Document } from "mongoose";

export interface ICopyTradePermission extends Document {
  userWallet: string;
  traderAddress: string;
  traderUsername: string;
  sessionAccount: string;
  permissionsContext: string;
  delegationManager: string;
  dailyLimit: string;
  spentToday: string;
  lastResetAt: Date;
  expiresAt: Date;
  isActive: boolean;
  createdAt: Date;
}

const CopyTradePermissionSchema = new Schema<ICopyTradePermission>({
  userWallet: {
    type: String,
    required: true,
    lowercase: true,
  },
  traderAddress: {
    type: String,
    required: true,
    lowercase: true,
  },
  traderUsername: {
    type: String,
    required: true,
  },
  sessionAccount: {
    type: String,
    required: true,
    lowercase: true,
  },
  permissionsContext: {
    type: String,
    required: true,
  },
  delegationManager: {
    type: String,
    required: true,
    lowercase: true,
  },
  dailyLimit: {
    type: String,
    required: true,
  },
  spentToday: {
    type: String,
    default: "0",
  },
  lastResetAt: {
    type: Date,
    default: Date.now,
  },
  expiresAt: {
    type: Date,
    required: true,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Compound indexes for efficient queries
CopyTradePermissionSchema.index({ userWallet: 1, traderAddress: 1 });
CopyTradePermissionSchema.index({ traderAddress: 1, isActive: 1 });
CopyTradePermissionSchema.index({ isActive: 1 });

export default mongoose.models.CopyTradePermission || 
  mongoose.model<ICopyTradePermission>("CopyTradePermission", CopyTradePermissionSchema);