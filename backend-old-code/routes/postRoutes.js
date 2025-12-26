const express = require("express");
const router = express.Router();
const postController = require("../controllers/postController");

// Important: Define static route *before* dynamic routes
router.post("/from-swap", postController.createPostFromSwap);

router.post("/", postController.createPost);
router.get("/", postController.getAllPosts);
router.post("/:id/like", postController.likePost);
router.post("/:id/dislike", postController.dislikePost);

module.exports = router;
