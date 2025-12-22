import mongoose, { Schema, Document, Model } from "mongoose";

export interface IUser extends Document {
  walletAddress: string;
  username: string;
  bio?: string;
  avatar?: string;
  followers: string[];
  following: string[];
  reputation: number;
  totalSwaps: number;
  totalVolume: string;
  createdAt: Date;
  lastActive: Date;
  followUser(targetWallet: string): Promise<void>;
  unfollowUser(targetWallet: string): Promise<void>;
}

const UserSchema = new Schema<IUser>({
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

// Indexes for finding followers/following
UserSchema.index({ followers: 1 });
UserSchema.index({ following: 1 });

// Instance methods - MUST be defined before creating the model
UserSchema.method('followUser', async function(this: IUser, targetWallet: string): Promise<void> {
  const targetWalletLower = targetWallet.toLowerCase();
  
  // Prevent following yourself
  if (this.walletAddress === targetWalletLower) {
    throw new Error("Cannot follow yourself");
  }
  
  // Check if already following
  if (this.following && this.following.includes(targetWalletLower)) {
    throw new Error("Already following this user");
  }
  
  // Add to following list
  if (!this.following) {
    this.following = [];
  }
  this.following.push(targetWalletLower);
  await this.save();
  
  // Get User model
  const User = mongoose.models.User as Model<IUser>;
  
  // Add to target's followers list
  await User.findOneAndUpdate(
    { walletAddress: targetWalletLower },
    { $addToSet: { followers: this.walletAddress } }
  );
});

UserSchema.method('unfollowUser', async function(this: IUser, targetWallet: string): Promise<void> {
  const targetWalletLower = targetWallet.toLowerCase();
  
  // Remove from following list
  if (this.following) {
    this.following = this.following.filter((w: string) => w !== targetWalletLower);
  }
  await this.save();
  
  // Get User model
  const User = mongoose.models.User as Model<IUser>;
  
  // Remove from target's followers list
  await User.findOneAndUpdate(
    { walletAddress: targetWalletLower },
    { $pull: { followers: this.walletAddress } }
  );
});

// Create or retrieve model
let User: Model<IUser>;

if (mongoose.models.User) {
  User = mongoose.models.User as Model<IUser>;
} else {
  User = mongoose.model<IUser>("User", UserSchema);
}

export default User;