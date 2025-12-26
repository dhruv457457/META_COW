const Swap = require("../models/Swap");
const User = require("../models/User"); // Make sure this is imported

function isAddress(str) {
  return /^0x[a-fA-F0-9]{40}$/.test(str);
}

// POST /api/swaps
exports.createSwap = async (req, res) => {
  try {
    const {
      user,
      pairAddress,
      inputToken,
      outputToken,
      inputAmount,
      outputAmount,
      txHash,
      blockNumber,
      timestamp,
    } = req.body;

    // ✅ Defensive check
    if (!user || typeof user !== "string") {
      return res.status(400).json({ error: "Missing or invalid wallet address in request body" });
    }

    if (!isAddress(inputToken) || !isAddress(outputToken)) {
      return res.status(400).json({ error: "inputToken and outputToken must be addresses" });
    }

    // Fetch user profile (optional)
    const userProfile = await User.findOne({ wallet: user.toLowerCase() });
    const username = userProfile?.username || null;
    const profileImage = userProfile?.profileImage || null;

    // Avoid duplicate txs
    const exists = await Swap.findOne({ txHash });
    if (exists) return res.status(200).json({ message: "Already saved." });

    const swap = new Swap({
      user,
      username,
      profileImage,
      pairAddress,
      inputToken,
      outputToken,
      inputAmount,
      outputAmount,
      txHash,
      blockNumber,
      timestamp,
      type: "swap",
    });

    await swap.save();
    res.status(201).json({ message: "Swap saved", swap });
  } catch (err) {
    console.error("Error saving swap:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};
// GET /api/swaps/recent
exports.getRecentSwaps = async (req, res) => {
  try {
    const { user, limit = 10 } = req.query;
    const query = user ? { user: user.toLowerCase() } : {};

    const swaps = await Swap.find(query)
      .sort({ timestamp: -1 })
      .limit(parseInt(limit));

    res.json(swaps);
  } catch (err) {
    console.error("Error fetching swaps:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};
exports.getTradeCount = async (req, res) => {
  const { user } = req.query;
  const count = await Swap.countDocuments({ user });
  res.json({ count });
};