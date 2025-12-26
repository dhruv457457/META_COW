require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

// 🌐 Route imports
const swapRoutes = require("./routes/swapRoutes");
const pairRoutes = require("./routes/pairRoutes");
const alchemyRoutes = require("./routes/alchemyRoutes");
const userRoutes = require("./routes/userRoutes");
const statsRoutes = require("./routes/statsRoutes");
const feedRoutes = require("./routes/feedRoutes");
const followRoutes = require("./routes/followRoutes"); // ✅ NEW
const reputationRoutes = require('./routes/reputationRoutes');
const authRoutes = require("./routes/authRoutes");
// ✅ Route usage
const postRoutes = require("./routes/postRoutes");
app.use("/api/posts", postRoutes);

app.use("/api/users", userRoutes);
app.use("/api/swaps", swapRoutes);
app.use("/api/pairs", pairRoutes);
app.use("/api/alchemy", alchemyRoutes);
app.use("/api/stats", statsRoutes);
app.use("/api/feed", feedRoutes);
app.use("/api", followRoutes); // ✅ Mount all follow-related routes here
app.use('/api/reputation', reputationRoutes);
app.use("/api/auth", authRoutes); // ✅ Add this line
app.use("/api/follow", followRoutes); // ✅ NEW: Mount follow routes
// Health check
app.get("/ping", (req, res) => res.status(200).send("pong"));
app.get("/", (req, res) => res.send("✅ MetaCow backend is live"));

// MongoDB connection and server start
const PORT = process.env.PORT || 5000;

mongoose
  .connect(process.env.MONGO_URI, {

  })
  .then(() => {
    console.log("✅ MongoDB connected");
    app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
  })
  .catch((err) => {
    console.error("❌ MongoDB connection error:", err);
  });
