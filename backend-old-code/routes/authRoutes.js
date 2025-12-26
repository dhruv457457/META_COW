const express = require("express");
const router = express.Router();

const { getNonce, verifySignature } = require("../controllers/authController");
const { verifyJWT } = require("../middleware/authMiddleware");
const User = require("../models/User"); // ✅ Make sure to import User model

// Generate a nonce for a wallet address
router.post("/nonce", getNonce);

// Verify the signed message and return a JWT
router.post("/verify", verifySignature);

// Protected route to get current user profile
router.get("/me", verifyJWT, async (req, res) => {
  try {
    const user = await User.findOne({ wallet: req.user.address });
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json(user);
  } catch (err) {
    console.error("/me error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
