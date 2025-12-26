const { ethers } = require("ethers");
require("dotenv").config();
const mongoose = require("mongoose");
const factoryABI = require("../abi/Factory.json");
const pairABI = require("../abi/Pair.json");
const Pair = require("../models/Pair");

// ✅ Setup provider
const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
const FACTORY_ADDRESS = process.env.FACTORY_ADDRESS;
const factory = new ethers.Contract(FACTORY_ADDRESS, factoryABI, provider);

// ✅ Connect to MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB connected"))
  .catch((err) => console.error("❌ MongoDB error:", err));

async function fetchAllPairs() {
  const length = await factory.allPairsLength();
  console.log(`📦 Total Pairs in Factory: ${length}`);

  for (let i = 0; i < Number(length); i++) {
    const pairAddress = await factory.allPairs(i);
    const lower = pairAddress.toLowerCase();

    const exists = await Pair.findOne({ pairAddress: lower });
    if (exists) continue;

    try {
      const pairContract = new ethers.Contract(pairAddress, pairABI, provider);
      const tokenA = await pairContract.tokenA();
      const tokenB = await pairContract.tokenB();
      const block = await provider.getBlock("latest");

      const newPair = new Pair({
        pairAddress: lower,
        tokenA: tokenA.toLowerCase(),
        tokenB: tokenB.toLowerCase(),
        createdBy: FACTORY_ADDRESS.toLowerCase(),
        createdAtBlock: block.number,
        createdAtTimestamp: block.timestamp
      });

      await newPair.save();
      console.log("✅ Saved pair:", lower);
    } catch (e) {
      console.error("⚠️ Failed to fetch one pair:", pairAddress, e.message);
    }
  }

  mongoose.disconnect();
}

fetchAllPairs();
