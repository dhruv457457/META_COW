const User = require("../models/User");
const Follow = require("../models/Follow");
const Swap = require("../models/Swap");

exports.getSocialFeed = async (req, res) => {
  try {
    const wallet = req.params.wallet?.toLowerCase();
    const user = await User.findOne({ wallet });

    if (!user) return res.status(404).json({ error: "User not found" });

    const follows = await Follow.find({ follower: user._id }).select("following");
    const followedUserIds = follows.map(f => f.following);

    const followedUsers = await User.find({ _id: { $in: followedUserIds } });
    const userMap = Object.fromEntries(followedUsers.map(u => [u.wallet.toLowerCase(), u]));

    const followedWallets = followedUsers.map(u => u.wallet.toLowerCase());

    const events = await Swap.find({ user: { $in: followedWallets } })
      .sort({ timestamp: -1 })
      .limit(30);

    const enriched = events.map(e => {
      const u = userMap[e.user.toLowerCase()];
      return {
        actor: e.user,
        username: u?.username || null,
        profileImage: u?.profileImage || null,
        type: e.type || "swap",
        tokenIn: e.inputToken,
        tokenOut: e.outputToken,
        amountIn: e.inputAmount,
        amountOut: e.outputAmount,
        txHash: e.txHash,
        timestamp: e.timestamp,
      };
    });

    res.json({ events: enriched });
  } catch (err) {
    console.error("❌ Social feed error:", err);
    res.status(500).json({ error: "Server error" });
  }
};
