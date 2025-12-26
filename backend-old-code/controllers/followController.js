const Follow = require("../models/Follow");
const User = require("../models/User");

exports.followUser = async (req, res) => {
  try {
    const { followerId } = req.body;
    const followingUser = await User.findById(req.params.userId);

    if (!followingUser) return res.status(404).json({ error: "User not found" });

    const exists = await Follow.findOne({ follower: followerId, following: followingUser._id });
    if (exists) return res.status(400).json({ error: "Already following" });

    await Follow.create({ follower: followerId, following: followingUser._id });
    res.json({ message: "Followed successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.unfollowUser = async (req, res) => {
  try {
    const { followerId } = req.body;
    const followingUser = await User.findById(req.params.userId);

    await Follow.findOneAndDelete({ follower: followerId, following: followingUser._id });
    res.json({ message: "Unfollowed successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getFollowers = async (req, res) => {
  const userId = req.params.userId;
  const followers = await Follow.find({ following: userId }).populate("follower", "username profileImage wallet");
  res.json(followers.map(f => f.follower));
};

exports.getFollowing = async (req, res) => {
  const userId = req.params.userId;
  const following = await Follow.find({ follower: userId }).populate("following", "username profileImage wallet");
  res.json(following.map(f => f.following));
};
exports.getFollowStatsByWallet = async (req, res) => {
  try {
    const { wallet } = req.params;
    const user = await User.findOne({ wallet: wallet.toLowerCase() });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const followersCount = await Follow.countDocuments({ following: user._id });
    const followingCount = await Follow.countDocuments({ follower: user._id });

    res.json({ followersCount, followingCount });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
