const express = require('express');
const router = express.Router();
const { ethers } = require('ethers');
const factoryABI = require('../abi/Factory.json').abi;
require('dotenv').config();

const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
const factory = new ethers.Contract(process.env.FACTORY_ADDRESS, factoryABI, provider);

// GET /api/reputation/:wallet
router.get('/:wallet', async (req, res) => {
  try {
    const wallet = req.params.wallet.toLowerCase();
    const score = await factory.reputationScores(wallet);
    res.json({ wallet, score: score.toString() });
  } catch (err) {
    console.error("❌ Error reading on-chain rep:", err);
    res.status(500).json({ error: "Failed to fetch on-chain reputation" });
  }
});

module.exports = router;
