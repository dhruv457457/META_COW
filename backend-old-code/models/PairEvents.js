// models/PairEvent.js
const mongoose = require("mongoose");

const PairEventSchema = new mongoose.Schema({
  pairAddress: { type: String, required: true },
  user: { type: String, required: true },
  tokenA: { type: String, required: true },
  tokenB: { type: String, required: true },
  amountA: { type: String, required: true },
  amountB: { type: String, required: true },
  eventType: { type: String, enum: ["ADD", "REMOVE"], required: true },
  timestamp: { type: Number, required: true }
});

// ✅ Proper CommonJS export
module.exports = mongoose.model("PairEvent", PairEventSchema);
