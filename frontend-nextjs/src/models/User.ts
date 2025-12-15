import mongoose, { Schema, Document, Model } from "mongoose";

export interface IUser extends Document {
  walletAddress: string;
  username: string;
  bio?: string;
  avatar?: string;
  followers: string[]; // Array of wallet addresses
  following: string[]; // Array of wallet addresses
  reputation: number;
  totalSwaps: number;
  totalVolume: string; // In wei
  createdAt: Date;
  lastActive: Date;
}

const UserSchema: Schema = new Schema({
  walletAddress: { 
    type: String, 
    required: true, 
    unique: true, 
    lowercase: true,
    index: true,
  },
  username: { 
    type: String, 
    required: true, 
    unique: true, 
    trim: true,
    maxlength: 20,
    index: true,
  },
  bio: { 
    type: String, 
    maxlength: 160,
    default: "",
  },
  avatar: { 
    type: String,
    default: "",
  },
  followers: {
    type: [String],
    default: [],
  },
  following: {
    type: [String],
    default: [],
  },
  reputation: {
    type: Number,
    default: 100,
    min: 0,
    max: 1000,
  },
  totalSwaps: {
    type: Number,
    default: 0,
  },
  totalVolume: {
    type: String,
    default: "0",
  },
  createdAt: { 
    type: Date, 
    default: Date.now,
    index: true,
  },
  lastActive: {
    type: Date,
    default: Date.now,
  },
});

// Index for finding followers/following
UserSchema.index({ followers: 1 });
UserSchema.index({ following: 1 });

// Prevent model overwrite during hot reload in Next.js
const User: Model<IUser> = mongoose.models.User || mongoose.model<IUser>("User", UserSchema);

export default User;