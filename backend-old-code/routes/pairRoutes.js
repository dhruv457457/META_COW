// routes/pairRoutes.js
const express = require("express");
const router = express.Router();

const {
  saveLiquidityEvent,
  getPairHistory
} = require("../controllers/pairController");


// POST /api/pairs/liquidity → save ADD/REMOVE liquidity event
router.post("/liquidity", saveLiquidityEvent);


// GET /api/pairs/history?pairAddress=...&user=...
router.get("/history", getPairHistory);

module.exports = router;
