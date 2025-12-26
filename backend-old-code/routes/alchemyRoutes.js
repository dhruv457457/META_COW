// routes/alchemyRoutes.js

const express = require("express");
const router = express.Router();
const {
  fetchAndCacheAlchemyTransfers,
  getCachedTransfers,
} = require("../controllers/alchemyController");

// POST: Manually fetch and cache
router.post("/fetch/:pair", fetchAndCacheAlchemyTransfers);

// ✅ GET: Retrieve cached Alchemy transfer data for a pair
router.get("/cached/:pair", getCachedTransfers);

module.exports = router;
