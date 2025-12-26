const express = require("express");
const router = express.Router();
const {
  registerUser,
  updateProfile,
  getUserByWallet,searchUsers
} = require("../controllers/userController");

const upload = require("../utils/upload"); // make sure this is correct

router.post("/register", registerUser);
router.put("/:id/profile", updateProfile);
router.get("/wallet/:wallet", getUserByWallet);
router.get("/search", searchUsers);

// 👇 New route for avatar upload
router.post("/upload-avatar", upload.single("avatar"), (req, res) => {
  if (!req.file?.path) {
    return res.status(400).json({ error: "Upload failed" });
  }
  res.status(200).json({ url: req.file.path });
});

module.exports = router;
