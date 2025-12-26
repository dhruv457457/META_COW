const Post = require("../models/Post");
const User = require("../models/User");
const Swap = require("../models/Swap");

// CREATE a new post (manual or custom input)
exports.createPost = async (req, res) => {
  try {
    const {
      wallet,
      content,
      txHash,
      pairAddress,
      tokenIn,
      tokenOut,
      amountIn,
      amountOut,
    } = req.body;

    if (!wallet || !content) {
      return res.status(400).json({ error: "Wallet and content are required." });
    }

    const newPost = new Post({
      wallet,
      content: postContent,
      txHash,
      pairAddress: swap.pairAddress || "",
      tokenIn: swap.inputToken,   // <-- should be address!
      tokenOut: swap.outputToken, // <-- should be address!
      amountIn: swap.inputAmount,
      amountOut: swap.outputAmount,
    });

    await newPost.save();
    res.status(201).json(newPost);
  } catch (err) {
    console.error("Error creating post:", err);
    res.status(500).json({ error: "Internal server error." });
  }
};

// GET all posts (latest first)
exports.getAllPosts = async (req, res) => {
  try {
    const posts = await Post.find().sort({ createdAt: -1 });
    const enrichedPosts = await Promise.all(
      posts.map(async (post) => {
        const user = await User.findOne({ wallet: post.wallet.toLowerCase() });
        return {
          ...post.toObject(),
          username: user?.username || "",
          profileImage: user?.profileImage || "",
        };
      })
    );
    res.json(enrichedPosts);
  } catch (err) {
    console.error("Error fetching posts:", err);
    res.status(500).json({ error: "Failed to fetch posts." });
  }
};

// LIKE a post
exports.likePost = async (req, res) => {
  try {
    const { wallet } = req.body;
    const { id } = req.params;

    const post = await Post.findById(id);
    if (!post) return res.status(404).json({ error: "Post not found." });

    post.dislikes = post.dislikes.filter((w) => w !== wallet);

    if (post.likes.includes(wallet)) {
      post.likes = post.likes.filter((w) => w !== wallet);
    } else {
      post.likes.push(wallet);
    }

    await post.save();
    res.json(post);
  } catch (err) {
    console.error("Error liking post:", err);
    res.status(500).json({ error: "Failed to like post." });
  }
};

// DISLIKE a post
exports.dislikePost = async (req, res) => {
  try {
    const { wallet } = req.body;
    const { id } = req.params;

    const post = await Post.findById(id);
    if (!post) return res.status(404).json({ error: "Post not found." });

    post.likes = post.likes.filter((w) => w !== wallet);

    if (post.dislikes.includes(wallet)) {
      post.dislikes = post.dislikes.filter((w) => w !== wallet);
    } else {
      post.dislikes.push(wallet);
    }

    await post.save();
    res.json(post);
  } catch (err) {
    console.error("Error disliking post:", err);
    res.status(500).json({ error: "Failed to dislike post." });
  }
};

// CREATE post from recent swap using txHash
exports.createPostFromSwap = async (req, res) => {
  try {
    const { wallet, content, txHash } = req.body;

    if (!wallet || !txHash) {
      return res.status(400).json({ error: "Wallet and txHash are required." });
    }

    const swap = await Swap.findOne({ txHash });
    if (!swap) return res.status(404).json({ error: "Swap not found." });

    const postContent =
      content || `Swapped ${swap.inputAmount} ${swap.inputToken} for ${swap.outputAmount} ${swap.outputToken}`;

    const newPost = new Post({
      wallet,
      content: postContent,
      txHash,
      pairAddress: swap.pairAddress || "",
      tokenIn: swap.inputToken,
      tokenOut: swap.outputToken,
      amountIn: swap.inputAmount,
      amountOut: swap.outputAmount,
    });

    await newPost.save();
    res.status(201).json(newPost);
  } catch (err) {
    console.error("Error creating post from swap:", err);
    res.status(500).json({ error: "Internal server error." });
  }
};
