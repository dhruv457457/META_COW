const mongoose = require("mongoose");

const SwapSchema = new mongoose.Schema({
  user: String,
  username: String,
profileImage: String,
  pairAddress: String,
  inputToken: String,
  outputToken: String,
  inputAmount: String,
  outputAmount: String,
  txHash: { type: String, unique: true },
  blockNumber: Number,
  timestamp: Number,
  type: { type: String, default: "swap" }, // ✅ Add this field
});

module.exports = mongoose.model("Swap", SwapSchema);
