"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { fetchLatestSwaps, EnvioSwapEvent } from "@/utils/envioClient";
import { ethers } from "ethers";

interface SwapFeedProps {
  limit?: number;
  refreshInterval?: number; // milliseconds
}

export default function SwapFeed({ limit = 10, refreshInterval = 15000 }: SwapFeedProps) {
  const [swaps, setSwaps] = useState<EnvioSwapEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadSwaps = async () => {
      try {
        const latestSwaps = await fetchLatestSwaps(limit);
        setSwaps(latestSwaps);
      } catch (error) {
        console.error("Error loading swaps:", error);
      } finally {
        setLoading(false);
      }
    };

    loadSwaps();
    const interval = setInterval(loadSwaps, refreshInterval);
    return () => clearInterval(interval);
  }, [limit, refreshInterval]);

  if (loading) {
    return (
      <div className="bg-white rounded-3xl p-6 shadow-xl border border-gray-100">
        <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
          <span>🔥</span>
          Recent Swaps
        </h3>
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="animate-pulse bg-gray-100 rounded-xl p-4 h-20" />
          ))}
        </div>
      </div>
    );
  }

  if (swaps.length === 0) {
    return (
      <div className="bg-white rounded-3xl p-6 shadow-xl border border-gray-100">
        <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
          <span>🔥</span>
          Recent Swaps
        </h3>
        <div className="text-center py-8 text-gray-400">
          <p>No swaps yet</p>
          <p className="text-sm">Be the first to trade!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-3xl p-6 shadow-xl border border-gray-100">
      <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
        <span>🔥</span>
        Recent Swaps
        <span className="text-xs font-normal text-gray-400 ml-auto">Live</span>
      </h3>

      <div className="space-y-3 max-h-[600px] overflow-y-auto">
        {swaps.map((swap, index) => (
          <SwapCard key={swap.id} swap={swap} index={index} />
        ))}
      </div>
    </div>
  );
}

function SwapCard({ swap, index }: { swap: EnvioSwapEvent; index: number }) {
  // Format amounts
  const inputAmount = parseFloat(ethers.formatUnits(swap.inputAmount, 18)).toFixed(4);
  const outputAmount = parseFloat(ethers.formatUnits(swap.outputAmount, 18)).toFixed(4);

  // Format addresses
  const userShort = `${swap.user.slice(0, 6)}...${swap.user.slice(-4)}`;
  const inputTokenShort = `${swap.inputToken.slice(0, 6)}...${swap.inputToken.slice(-4)}`;
  const outputTokenShort = `${swap.outputToken.slice(0, 6)}...${swap.outputToken.slice(-4)}`;

  // Time ago
  const timeAgo = getTimeAgo(swap.timestamp);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl p-4 hover:shadow-md transition-shadow border border-purple-100"
    >
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-600 to-blue-600 flex items-center justify-center text-white text-xs font-bold">
            {userShort.slice(2, 4).toUpperCase()}
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-800">
              {userShort}
            </p>
            <p className="text-xs text-gray-500">{timeAgo}</p>
          </div>
        </div>

        <a
          href={`https://testnet.bscscan.com/tx/${swap.txHash}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-purple-600 hover:text-purple-700 text-xs"
        >
          View →
        </a>
      </div>

      <div className="flex items-center gap-2 text-sm">
        <div className="flex-1 bg-white rounded-lg p-2 border border-gray-200">
          <p className="text-xs text-gray-500">Sold</p>
          <p className="font-semibold text-gray-800">{inputAmount}</p>
          <p className="text-xs text-gray-400">{inputTokenShort}</p>
        </div>

        <div className="text-purple-600">→</div>

        <div className="flex-1 bg-white rounded-lg p-2 border border-gray-200">
          <p className="text-xs text-gray-500">Bought</p>
          <p className="font-semibold text-gray-800">{outputAmount}</p>
          <p className="text-xs text-gray-400">{outputTokenShort}</p>
        </div>
      </div>
    </motion.div>
  );
}

function getTimeAgo(timestamp: number): string {
  const now = Math.floor(Date.now() / 1000);
  const diff = now - timestamp;

  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}