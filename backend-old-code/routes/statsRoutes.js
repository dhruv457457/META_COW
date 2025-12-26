const express = require("express");
const router = express.Router();
const {
  getTrendingPairs,
  getMostActiveUsers,
} = require("../controllers/statsController");

router.get("/trending-pairs", getTrendingPairs);
router.get("/most-active", getMostActiveUsers);

module.exports = router;
