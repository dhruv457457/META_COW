const { getSwapLikeTransfers } = require("../utils/alchemyFetcher");
const Pair = require("../models/Pair");
const Transfer = require("../models/Transfer");

exports.fetchAndCacheAlchemyTransfers = async (req, res) => {
  try {
    const pairAddress = req.params.pair.toLowerCase();
    const pair = await Pair.findOne({ pairAddress });

    if (!pair) {
      return res.status(404).json({ message: "❌ Pair not found" });
    }

    console.log(`🔍 Fetching Alchemy transfers for ${pairAddress}...`);

    const transfers = await getSwapLikeTransfers(pair.tokenA, pair.tokenB, pair.pairAddress);

    console.log("📦 Transfers from Alchemy:", transfers);

    let savedCount = 0;

    for (const tx of transfers) {
    const exists = await Transfer.findOne({
  pair: pairAddress,
  timestamp: tx.timestamp,
  token: tx.token,
});

      if (exists) continue;

    await Transfer.create({
  txHash: tx.hash || "alchemy",
  token: tx.token || pair.tokenA,     // ✅ Correct key here
  pair: pairAddress,
  volume: tx.volume,
  price: tx.price,
  timestamp: tx.timestamp,
});

      savedCount++;
    }

    return res.json({ message: `✅ Saved ${savedCount} Alchemy transfers.` });
  } catch (err) {
    console.error("❌ Alchemy cache error:", err);
    res.status(500).json({ error: err.message });
  }
};
exports.getCachedTransfers = async (req, res) => {
  try {
    const pairAddress = req.params.pair.toLowerCase();
    const transfers = await Transfer.find({ pair: pairAddress }).sort({ timestamp: -1 });

    res.json({ count: transfers.length, transfers });
  } catch (err) {
    console.error("❌ Failed to fetch cached transfers:", err);
    res.status(500).json({ error: "Server error" });
  }
};