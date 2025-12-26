const express = require("express");
const router = express.Router();

const swapController = require("../controllers/swapController");

router.post("/", swapController.createSwap);
router.get("/recent", swapController.getRecentSwaps);
router.get("/count", swapController.getTradeCount); // ✅ FIXED

module.exports = router;
