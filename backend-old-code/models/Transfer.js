const mongoose = require("mongoose");

const transferSchema = new mongoose.Schema({
  pair: { type: String, required: true },
  token: { type: String, required: true },
  price: Number,
  volume: Number,
  timestamp: Number,
  txHash: { type: String, default: null }, // ✅ no `unique: true`
});

module.exports = mongoose.model("Transfer", transferSchema);
