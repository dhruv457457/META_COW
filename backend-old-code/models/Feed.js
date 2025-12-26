const mongoose = require("mongoose");

const FeedEventSchema = new mongoose.Schema({
  type: { type: String, enum: ["swap", "copyTrade", "liquidity"], required: true },
  actor: { type: String, required: true },
  tokenIn: String,
  tokenOut: String,
  amountIn: String,
  amountOut: String,
  timestamp: Number,
  txHash: String,
}, { _id: false });

const FeedSchema = new mongoose.Schema({
  owner: { type: String, required: true, lowercase: true, unique: true },
  events: [FeedEventSchema],
});

module.exports = mongoose.model("Feed", FeedSchema);
