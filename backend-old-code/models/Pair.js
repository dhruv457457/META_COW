const mongoose = require("mongoose");

const PairSchema = new mongoose.Schema({
  pairAddress: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
  },
  tokenA: {
    type: String,
    required: true,
    lowercase: true,
  },
  tokenB: {
    type: String,
    required: true,
    lowercase: true,
  },
  createdBy: {
    type: String, // deployer's wallet address
    required: true,
    lowercase: true,
  },
  createdAtBlock: {
    type: Number,
    required: true,
  },
  createdAtTimestamp: {
    type: Number,
    required: true,
  },
}, {
  timestamps: true,
});

module.exports = mongoose.model("Pair", PairSchema);
