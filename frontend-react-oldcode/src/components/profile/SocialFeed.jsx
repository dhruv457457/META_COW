// SocialFeed.js
import { useEffect, useState } from "react";
import axios from "axios";
import { getTokenSymbol } from "../../utils/transactionLog"; // Make sure this path is correct
import { useNavigate } from "react-router-dom";
import { UsersIcon, Repeat2 } from "lucide-react"; // Using lucide-react for icons
import { motion } from "framer-motion"; // For subtle animations
import { tokenList } from "../../utils/constants";
import RenderLoadingNotice from "../RenderLoadingNotice";

const ITEMS_PER_PAGE = 6;

export default function SocialFeed({ wallet }) {
  const [feed, setFeed] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchFeed = async () => {
      try {
        const res = await axios.get(`https://meta-cow.onrender.com/api/feed/${wallet}`);
        setFeed(res.data?.events || []);
      } catch (err) {
        console.error("❌ Failed to fetch feed:", err);
      } finally {
        setLoading(false);
      }
    };

    if (wallet) fetchFeed();
  }, [wallet]);

  const handleCopyTrade = (event) => {
    navigate("/swap", {
      state: {
        tokenA: event.tokenIn,
        tokenB: event.tokenOut,
        amountIn: event.amountIn,
      },
    });
  };

  const getSymbolOrAddress = (address) => {
    const token = tokenList.find(t => t.address.toLowerCase() === address?.toLowerCase());
    return token ? token.symbol : (address ? address.slice(0, 6) + "..." + address.slice(-4) : "Unknown");
  };

  const totalPages = Math.ceil(feed.length / ITEMS_PER_PAGE);
  const startIdx = (currentPage - 1) * ITEMS_PER_PAGE;
  const currentItems = feed.slice(startIdx, startIdx + ITEMS_PER_PAGE);

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  if (loading) {
    return <RenderLoadingNotice show={loading} />;
  }

  if (!feed.length) {
    return (
      <div className="bg-white/90 rounded-2xl shadow-xl border border-gray-100 p-6 text-center text-gray-500 backdrop-blur-sm">
        <UsersIcon size={30} className="mx-auto mb-3 text-gray-400" />
        <p className="text-lg font-semibold mb-2">No Social Activity Yet</p>
        <p className="text-sm">Follow users to see their latest trades and activities appear here!</p>
      </div>
    );
  }

  return (
    <div className="bg-white/90 rounded-2xl shadow-xl p-6 border border-gray-100 backdrop-blur-sm">
      <h3 className="text-xl font-bold text-gray-800 flex items-center gap-3 mb-5">
        <UsersIcon className="w-6 h-6 text-purple-600" /> Live Social Feed
      </h3>

      <ul className="space-y-4">
        {currentItems.map((event, i) => (
          <motion.li
            key={event.txHash + i} // Using txHash + index as key for uniqueness if txHash might repeat for different events
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, delay: i * 0.05 }}
            className="bg-gray-50 px-4 py-3 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-all duration-200"
          >
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2">
              <div className="flex-1">
                <p className="text-sm font-semibold text-gray-800 flex items-center gap-2 mb-1">
                  {event.profileImage ? (
                    <img
                      src={event.profileImage}
                      alt="avatar"
                      className="w-7 h-7 rounded-full border border-gray-200 object-cover"
                    />
                  ) : (
                    <div className="w-7 h-7 rounded-full bg-gray-300 flex items-center justify-center text-white text-xs font-bold">
                      {event.username ? event.username[0].toUpperCase() : 'U'}
                    </div>
                  )}
                  {event.username || `${event.actor.slice(0, 6)}...${event.actor.slice(-4)}`}
                  <span className="text-gray-400 ml-1 text-xs font-normal">
                    {new Date(event.timestamp * 1000).toLocaleTimeString()}
                  </span>
                </p>

                <p className="text-sm text-gray-700 leading-tight">
                  <span className="font-medium text-blue-600">{parseFloat(event.amountIn).toFixed(4)} {getSymbolOrAddress(event.tokenIn)}</span>
                  {' '}swapped for{' '}
                  <span className="font-medium text-green-600">{parseFloat(event.amountOut).toFixed(4)} {getSymbolOrAddress(event.tokenOut)}</span>
                </p>
                <p className="text-xs text-gray-500 font-mono mt-1">
                  Tx: {event.txHash.slice(0, 10)}...{event.txHash.slice(-4)}
                </p>
              </div>

              <button
                onClick={() => handleCopyTrade(event)}
                className="inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-purple-100 text-purple-600 rounded-lg text-sm font-medium hover:bg-purple-200 transition-all duration-200 whitespace-nowrap self-start sm:self-center"
              >
                <Repeat2 size={16} /> Copy Trade
              </button>
            </div>
          </motion.li>
        ))}
      </ul>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-2 mt-6">
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="px-4 py-2 text-sm border border-gray-300 rounded-lg bg-white hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            ◀ Prev
          </button>

          {[...Array(totalPages)].map((_, idx) => (
            <button
              key={idx}
              onClick={() => handlePageChange(idx + 1)}
              className={`px-4 py-2 text-sm border rounded-lg transition ${
                currentPage === idx + 1 ? "bg-purple-600 text-white font-bold border-purple-600 shadow-md" : "bg-white text-gray-700 border-gray-300 hover:bg-gray-100"
              }`}
            >
              {idx + 1}
            </button>
          ))}

          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="px-4 py-2 text-sm border border-gray-300 rounded-lg bg-white hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            Next ▶
          </button>
        </div>
      )}
    </div>
  );
}