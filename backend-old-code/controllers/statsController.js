const Swap = require("../models/Swap");

// 🔥 GET /api/stats/trending-pairs
exports.getTrendingPairs = async (req, res) => {
  try {
    const oneDayAgo = Math.floor(Date.now() / 1000) - 86400;

    const trending = await Swap.aggregate([
      { $match: { timestamp: { $gte: oneDayAgo } } },
      {
        $group: {
          _id: "$pairAddress",
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
      { $limit: 3 },
    ]);

    res.json(trending);
  } catch (err) {
    console.error("Error in getTrendingPairs:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

// 💪 GET /api/stats/most-active
exports.getMostActiveUsers = async (req, res) => {
  try {
    const oneWeekAgo = Math.floor(Date.now() / 1000) - 7 * 86400;

    const users = await Swap.aggregate([
      { $match: { timestamp: { $gte: oneWeekAgo } } },
      {
        $group: {
          _id: "$user",
          count: { $sum: 1 },
          username: { $first: "$username" },
          profileImage: { $first: "$profileImage" },
        },
      },
      { $sort: { count: -1 } },
      { $limit: 5 },
    ]);

    res.json(users);
  } catch (err) {
    console.error("Error in getMostActiveUsers:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};
