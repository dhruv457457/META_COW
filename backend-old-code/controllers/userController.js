const User = require("../models/User");

// Register or login user (wallet connect + username)
exports.registerUser = async (req, res) => {
  const { wallet, username } = req.body;

  // 🔒 Basic validation
  if (!wallet) return res.status(400).json({ error: "Wallet address required" });
  if (!username) return res.status(400).json({ error: "Username is required" });

  try {
    // Check if user already exists
    let user = await User.findOne({ wallet: wallet.toLowerCase() });

    if (!user) {
      try {
        // Create new user
        user = await User.create({
          wallet: wallet.toLowerCase(),
          username,
        });
      } catch (err) {
        if (err.code === 11000) {
          return res.status(409).json({ error: "Username or wallet already exists" });
        }
        throw err;
      }
    }

    res.status(200).json(user);
  } catch (err) {
    console.error("❌ Registration error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Update profile
exports.updateProfile = async (req, res) => {
  const { id } = req.params;
  const { username, profileImage, bio } = req.body;

  try {
    const updated = await User.findByIdAndUpdate(
      id,
      { username, profileImage, bio },
      { new: true }
    );
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get user by wallet address
exports.getUserByWallet = async (req, res) => {
  const { wallet } = req.params;
  try {
    const user = await User.findOne({ wallet: wallet.toLowerCase() });
    if (!user) return res.status(404).json({ message: "Not found" });
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
exports.searchUsers = async (req, res) => {
  const { query } = req.query;
  if (!query) return res.json([]);

  const users = await User.find({
    username: { $regex: query, $options: "i" },
  }).select("username profileImage bio _id wallet");

  res.json(users);
};
