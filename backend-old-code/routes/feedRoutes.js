const express = require("express");
const router = express.Router();
const { getSocialFeed } = require("../controllers/feedController");

router.get("/:wallet", getSocialFeed);

module.exports = router;
