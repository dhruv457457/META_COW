// controllers/pairController.js
const PairEvent = require("../models/PairEvents");

// Save a new liquidity event
const saveLiquidityEvent = async (req, res) => {
  try {
    const {
      pairAddress,
      user,
      tokenA,
      tokenB,
      amountA,
      amountB,
      eventType,
      timestamp
    } = req.body;

    const newEvent = new PairEvent({
      pairAddress,
      user,
      tokenA,
      tokenB,
      amountA,
      amountB,
      eventType,
      timestamp
    });

    await newEvent.save();
    res.status(201).json({ message: "Liquidity event saved", data: newEvent });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Fetch all events for a pair (or user)
const getPairHistory = async (req, res) => {
  try {
    const { pairAddress, user } = req.query;

    const filter = {};
    if (pairAddress) filter.pairAddress = pairAddress;
    if (user) filter.user = user;

    const events = await PairEvent.find(filter).sort({ timestamp: -1 });
    res.status(200).json(events);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = {
  saveLiquidityEvent,
  getPairHistory
};
