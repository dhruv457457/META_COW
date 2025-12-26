// PostComposer.js
import { useState, useEffect } from "react";
import axios from "axios";
import { motion } from "framer-motion"; // For subtle animations

const SWAPS_PER_PAGE = 3; // Reduced for a more compact dropdown

export default function PostComposer({ wallet, user, refreshPosts }) {
  const [content, setContent] = useState("");
  const [recentSwaps, setRecentSwaps] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedSwap, setSelectedSwap] = useState(null);

  const truncate = (addr) => `${addr.slice(0, 6)}...${addr.slice(-4)}`;

  useEffect(() => {
    const fetchRecentSwaps = async () => {
      if (!wallet) return;
      try {
        const res = await axios.get(`https://meta-cow.onrender.com/api/swaps/recent?user=${wallet}`);
        setRecentSwaps(res.data || []);
      } catch (err) {
        console.error("Failed to fetch recent swaps", err);
      }
    };
    fetchRecentSwaps();
  }, [wallet]);

  const handlePost = async () => {
    if (!wallet || !content.trim()) return;
    try {
      setLoading(true);
      if (selectedSwap) {
        await axios.post("https://meta-cow.onrender.com/api/posts/from-swap", {
          wallet,
          content,
          txHash: selectedSwap.txHash,
        });
      } else {
        await axios.post("https://meta-cow.onrender.com/api/posts", {
          wallet,
          content,
        });
      }
      setContent("");
      setSelectedSwap(null);
      refreshPosts?.();
    } catch (err) {
      console.error("Post creation failed", err);
    } finally {
      setLoading(false);
    }
  };

  const totalPages = Math.ceil(recentSwaps.length / SWAPS_PER_PAGE);
  const startIdx = (currentPage - 1) * SWAPS_PER_PAGE;
  const currentSwaps = recentSwaps.slice(startIdx, startIdx + SWAPS_PER_PAGE);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="bg-white/95 border border-purple-100 shadow-2xl rounded-3xl p-6 transition-all hover:shadow-purple-200/50 backdrop-blur-sm"
    >
      <div className="flex items-start gap-4">
        <img
          src={user?.profileImage || "/assets/default-avatar.png"}
          alt="profile"
          className="w-12 h-12 rounded-full border-2 border-purple-300 shadow-md object-cover"
        />
        <div className="flex-1">
          <p className="text-base font-semibold text-gray-700 mb-2">
            What's on your mind, <span className="text-purple-600">{user?.username || truncate(wallet)}</span>?
          </p>

          <textarea
            className="w-full border-2 border-purple-200 p-4 rounded-xl text-base resize-none focus:outline-none focus:ring-3 focus:ring-purple-400 bg-white/90 placeholder:text-gray-400 transition-all duration-200"
            rows={4}
            placeholder="Drop your alpha, trade strategy, or insights here..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
          />

          {recentSwaps.length > 0 && (
            <div className="mt-5 bg-purple-50 border border-purple-100 rounded-xl p-4">
              <label className="text-sm font-bold text-purple-700 mb-2 block">
                💱 Attach a Recent Swap (optional)
              </label>
              <select
                className="w-full border border-purple-300 rounded-lg text-sm px-4 py-2.5 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-400 transition-all duration-200"
                value={selectedSwap?.txHash || ""}
                onChange={(e) =>
                  setSelectedSwap(
                    recentSwaps.find((s) => s.txHash === e.target.value) || null
                  )
                }
              >
                <option value="">-- Select a Swap to Attach --</option>
                {currentSwaps.map((swap) => (
                  <option key={swap.txHash} value={swap.txHash}>
                    {`Swapped ${parseFloat(swap.inputAmount).toFixed(4)} ${swap.inputToken} for ${parseFloat(swap.outputAmount).toFixed(4)} ${swap.outputToken}`}
                  </option>
                ))}
              </select>

              <div className="flex justify-between items-center mt-3 text-gray-600 text-xs">
                {totalPages > 1 && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                      disabled={currentPage === 1}
                      className="px-3 py-1 border border-purple-200 rounded-md bg-purple-100 hover:bg-purple-200 transition disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      ◀ Prev
                    </button>
                    <span className="self-center">Page {currentPage} of {totalPages}</span>
                    <button
                      onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                      disabled={currentPage === totalPages}
                      className="px-3 py-1 border border-purple-200 rounded-md bg-purple-100 hover:bg-purple-200 transition disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Next ▶
                    </button>
                  </div>
                )}
                {selectedSwap && (
                    <span className="text-blue-600 font-medium">Attached: {truncate(selectedSwap.txHash)}</span>
                )}
              </div>
            </div>
          )}

          <div className="flex justify-end mt-5">
            <button
              onClick={handlePost}
              disabled={loading || !content.trim()}
              className="px-6 py-3 text-lg font-semibold rounded-xl text-white bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-purple-300/50"
            >
              {loading ? "Posting..." : "🚀 Share Alpha"}
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}