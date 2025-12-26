const express = require("express");
const router = express.Router();
const {
  followUser,
  unfollowUser,
  getFollowers,
  getFollowing,
  getFollowStatsByWallet,
} = require("../controllers/followController");

router.post("/follow/:userId", followUser);
router.delete("/unfollow/:userId", unfollowUser);
router.get("/followers/:userId", getFollowers);
router.get("/following/:userId", getFollowing);
router.get("/stats/wallet/:wallet", getFollowStatsByWallet); // 👈 new route

module.exports = router;
