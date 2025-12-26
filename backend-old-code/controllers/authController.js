const User = require("../models/User");
const jwt = require("jsonwebtoken");
const { ethers } = require("ethers");

const NONCE_EXPIRY_MINUTES = 10;
const JWT_SECRET = process.env.JWT_SECRET || "secret";

exports.getNonce = async (req, res) => {
  try {
    const { address } = req.body;
    if (!address) return res.status(400).json({ error: "Address is required" });

    const nonce = Math.floor(Math.random() * 1000000).toString();

    const user = await User.findOneAndUpdate(
      { wallet: address.toLowerCase() },
      { $set: { nonce, nonceIssuedAt: new Date() } },
      { upsert: true, new: true }
    );

    res.json({ nonce });
  } catch (err) {
    console.error("getNonce error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

exports.verifySignature = async (req, res) => {
  try {
    const { address, signature } = req.body;
    if (!address || !signature) {
      return res.status(400).json({ error: "Address and signature required" });
    }

    const user = await User.findOne({ wallet: address.toLowerCase() });
    if (!user || !user.nonce) {
      return res.status(400).json({ error: "Nonce not found" });
    }

    const message = `MetaCow Login\n\nWallet: ${address}\nNonce: ${user.nonce}`;
    const recovered = ethers.verifyMessage(message, signature);

    if (recovered.toLowerCase() !== address.toLowerCase()) {
      return res.status(401).json({ error: "Invalid signature" });
    }

    // Expiry check (optional)
    const age = Date.now() - new Date(user.nonceIssuedAt).getTime();
    if (age > NONCE_EXPIRY_MINUTES * 60 * 1000) {
      return res.status(403).json({ error: "Nonce expired" });
    }

    const token = jwt.sign({ address }, JWT_SECRET, { expiresIn: "2d" });

    user.nonce = null;
    user.nonceIssuedAt = null;
    await user.save();

    res.json({ token });
  } catch (err) {
    console.error("verifySignature error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};
