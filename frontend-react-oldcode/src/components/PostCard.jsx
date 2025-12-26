// PostCard.js
import axios from "axios";
import { useWallet } from "../contexts/WalletContext";
import { useState, useEffect } from "react";
import { ThumbsUp, ThumbsDown, ExternalLink } from "lucide-react"; // Using lucide-react for icons
import { motion } from "framer-motion"; // For subtle animations
import { ethers } from "ethers";
import { FACTORY_ADDRESS, FACTORY_ABI, PAIR_ABI } from "../utils/constants";
import { Interface } from "ethers";
import { useNavigate } from "react-router-dom";

export default function PostCard({ post, refresh, userWallet }) {
  const { walletData } = useWallet();
  const currentUserWallet = userWallet || walletData?.address; // Use prop or context
  const [liking, setLiking] = useState(false);
  const [reputation, setReputation] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchReputation = async () => {
      if (!post.wallet) return;
      try {
        // Assuming window.ethereum is available or using a public provider
        const provider = new ethers.BrowserProvider(window.ethereum);
        const factory = new ethers.Contract(FACTORY_ADDRESS, FACTORY_ABI, provider);
        const iface = new Interface(PAIR_ABI);
        const pairCount = await factory.allPairsLength();
        let totalScore = 0;

        for (let i = 0; i < pairCount; i++) {
          const pairAddr = await factory.allPairs(i);
          const pair = new ethers.Contract(pairAddr, PAIR_ABI, provider);

          // Check if the getReputationScore function exists in the ABI for this pair
          const supportsReputation = iface.fragments.some((f) => f.name === "getReputationScore");
          if (!supportsReputation) continue;

          try {
            const score = await pair.getReputationScore(post.wallet);
            totalScore += Number(score);
          } catch (err) {
            // Ignore errors for pairs that don't support the function or on specific calls
            // console.warn(`Failed to get reputation from pair ${pairAddr}:`, err.message);
          }
        }
        setReputation(totalScore);
      } catch (err) {
        console.error("Failed to fetch reputation score overall:", err);
        setReputation(null);
      }
    };

    fetchReputation();
  }, [post.wallet]);

  const handleLike = async () => {
    if (!currentUserWallet) return;
    try {
      setLiking(true);
      await axios.post(`https://meta-cow.onrender.com/api/posts/${post._id}/like`, { wallet: currentUserWallet });
      refresh(); // Refresh parent's posts state
    } catch (err) {
      console.error("Like failed", err);
    } finally {
      setLiking(false);
    }
  };

  const handleDislike = async () => {
    if (!currentUserWallet) return;
    try {
      setLiking(true);
      await axios.post(`https://meta-cow.onrender.com/api/posts/${post._id}/dislike`, { wallet: currentUserWallet });
      refresh(); // Refresh parent's posts state
    } catch (err) {
      console.error("Dislike failed", err);
    } finally {
      setLiking(false);
    }
  };

  const hasLiked = post.likes?.includes(currentUserWallet);
  const hasDisliked = post.dislikes?.includes(currentUserWallet);

  const truncate = (addr) => `${addr.slice(0, 6)}...${addr.slice(-4)}`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="bg-white border border-gray-200 rounded-3xl p-6 shadow-xl hover:shadow-2xl transition-all duration-300"
    >
      {/* Header: Profile */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-4">
          <img
            src={post.profileImage || `https://api.dicebear.com/7.x/identicon/svg?seed=${post.wallet}`}
            alt="User"
            className="w-12 h-12 rounded-full object-cover border-2 border-purple-200 shadow-sm"
          />
          <div>
            <div className="flex items-center gap-2">
              <p className="text-lg font-bold text-purple-700">
                {post.username || truncate(post.wallet)}
              </p>
              {reputation !== null && (
                <span className="text-sm text-blue-600 font-semibold px-2 py-0.5 bg-blue-100 rounded-full flex items-center gap-1">
                  ⭐ {reputation}
                </span>
              )}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {new Date(post.createdAt).toLocaleString()}
            </p>
          </div>
        </div>
      </div>

      {/* Content */}
      <p className="text-gray-800 text-base whitespace-pre-wrap leading-relaxed mb-5">
        {post.content}
      </p>

      {/* Swap Info (if exists) */}
      {(post.tokenIn && post.tokenOut) && (
        <div className="bg-purple-50 text-sm text-purple-800 p-4 rounded-xl mb-5 border border-purple-200 shadow-inner">
          <p className="font-bold flex items-center gap-2 mb-2">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} className="w-5 h-5 text-purple-600"><path strokeLinecap="round" strokeLinejoin="round" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" /></svg>
            Trade Details
          </p>
          <p className="font-medium text-gray-700">
            <span className="text-blue-600 font-mono">{parseFloat(post.amountIn).toFixed(4)} {post.tokenInSymbol || truncate(post.tokenIn)}</span>
            {' '}→{' '}
            <span className="text-green-600 font-mono">{parseFloat(post.amountOut).toFixed(4)} {post.tokenOutSymbol || truncate(post.tokenOut)}</span>
          </p>
          <div className="flex gap-3 mt-3">
            {post.txHash && (
              <a
                href={`https://testnet.bscscan.com/tx/${post.txHash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center text-xs text-blue-600 hover:underline font-medium transition-colors"
              >
                <ExternalLink size={16} className="mr-1" />
                View Transaction on BSCScan
              </a>
            )}
            <button
              onClick={() =>
                navigate("/swap", {
                  state: {
                    tokenA: post.tokenIn,
                    tokenB: post.tokenOut,
                    amountIn: post.amountIn,
                  },
                })
              }
              className="inline-flex items-center text-xs font-semibold bg-gradient-to-r from-green-400 to-blue-400 text-white px-3 py-1.5 rounded-lg shadow hover:from-green-500 hover:to-blue-500 transition-all"
            >
              Copy Trade
            </button>
          </div>
        </div>
      )}

      {/* Like / Dislike Buttons */}
      <div className="flex justify-between items-center text-sm mt-4 pt-4 border-t border-gray-100">
        <div className="flex gap-6">
          <button
            onClick={handleLike}
            disabled={liking || !currentUserWallet || hasLiked} // Disable if already liked or no wallet
            className={`flex items-center gap-2 px-3 py-1.5 rounded-full transition-all duration-200 ${
              hasLiked
                ? "bg-purple-200 text-purple-800 cursor-not-allowed"
                : "text-purple-600 hover:bg-purple-50 hover:text-purple-800"
            } disabled:opacity-60`}
          >
            <ThumbsUp size={18} /> <span className="font-semibold">{post.likes?.length || 0}</span>
          </button>
          <button
            onClick={handleDislike}
            disabled={liking || !currentUserWallet || hasDisliked} // Disable if already disliked or no wallet
            className={`flex items-center gap-2 px-3 py-1.5 rounded-full transition-all duration-200 ${
              hasDisliked
                ? "bg-red-200 text-red-800 cursor-not-allowed"
                : "text-red-500 hover:bg-red-50 hover:text-red-700"
            } disabled:opacity-60`}
          >
            <ThumbsDown size={18} /> <span className="font-semibold">{post.dislikes?.length || 0}</span>
          </button>
        </div>
      </div>
    </motion.div>
  );
}