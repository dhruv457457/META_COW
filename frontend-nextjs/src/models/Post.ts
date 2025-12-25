// src/models/Post.ts
import mongoose, { Schema, Document } from "mongoose";

export interface IPost extends Document {
  userWallet: string;
  username: string;
  avatar: string;
  caption: string;
  swapData: {
    inputToken: string;
    outputToken: string;
    inputAmount: string;
    outputAmount: string;
    pairAddress: string;
    txHash: string;
    timestamp: number;
  };
  likes: string[];
  comments: Array<{
    userWallet: string;
    username: string;
    avatar: string;
    text: string;
    createdAt: Date;
  }>;
  visibility: "public" | "followers";
  createdAt: Date;
}

const PostSchema = new Schema<IPost>({
  userWallet: {
    type: String,
    required: true,
    lowercase: true,
    index: true,
  },
  username: {
    type: String,
    required: true,
  },
  avatar: {
    type: String,
    required: true,
  },
  caption: {
    type: String,
    required: true,
    maxlength: 500,
  },
  swapData: {
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
    inputAmount: {
      type: String,
      required: true,
    },
    outputAmount: {
      type: String,
      required: true,
    },
    pairAddress: {
      type: String,
      required: true,
      lowercase: true,
    },
    txHash: {
      type: String,
      required: true,
      // ✅ REMOVED: unique: true (let the schema.index() handle it)
    },
    timestamp: {
      type: Number,
      required: true,
    },
  },
  likes: {
    type: [String],
    default: [],
  },
  comments: [
    {
      userWallet: {
        type: String,
        required: true,
        lowercase: true,
      },
      username: {
        type: String,
        required: true,
      },
      avatar: {
        type: String,
        required: true,
      },
      text: {
        type: String,
        required: true,
        maxlength: 200,
      },
      createdAt: {
        type: Date,
        default: Date.now,
      },
    },
  ],
  visibility: {
    type: String,
    enum: ["public", "followers"],
    default: "public",
  },
  createdAt: {
    type: Date,
    default: Date.now,
    index: true,
  },
});

// ✅ OPTIMIZED: Indexes defined only once
PostSchema.index({ createdAt: -1 }); // Sort by newest first
PostSchema.index({ userWallet: 1, createdAt: -1 }); // User's posts
PostSchema.index({ "swapData.txHash": 1 }, { unique: true }); // ✅ Only here!

// ✅ Clear old model on hot reload
if (mongoose.models.Post) {
  delete mongoose.models.Post;
}

export default mongoose.model<IPost>("Post", PostSchema);