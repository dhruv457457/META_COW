const mongoose = require("mongoose");

const PostSchema = new mongoose.Schema(
  {
    wallet: {
      type: String,
      required: true,
      lowercase: true,
      index: true,
    },
    content: {
      type: String,
      required: true,
      trim: true,
    },
    txHash: {
      type: String,
      default: "",
    },
    pairAddress: {
      type: String,
      default: "",
    },
    tokenIn: {
      type: String,
      default: "",
    },
    tokenOut: {
      type: String,
      default: "",
    },
    amountIn: {
      type: String,
      default: "",
    },
    amountOut: {
      type: String,
      default: "",
    },
    likes: [
      {
        type: String,
        lowercase: true,
      },
    ],
    dislikes: [
      {
        type: String,
        lowercase: true,
      },
    ],
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Post", PostSchema);
