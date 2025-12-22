"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import TokenSelector from "@/components/TokenSelector";
import { Token } from "@/utils/tokens";
import { createPair } from "@/utils/contractUtils";
import { toast } from "react-hot-toast";

interface CreatePairSectionProps {
  onPairCreated: () => void;
}

export default function CreatePairSection({ onPairCreated }: CreatePairSectionProps) {
  const [tokenA, setTokenA] = useState<Token | null>(null);
  const [tokenB, setTokenB] = useState<Token | null>(null);
  const [loading, setLoading] = useState(false);
  const [pairAddress, setPairAddress] = useState("");

  const handleCreatePair = async () => {
    if (!tokenA || !tokenB) {
      toast.error("Please select both tokens");
      return;
    }
    if (tokenA.address === tokenB.address) {
      toast.error("Tokens must be different");
      return;
    }

    try {
      setLoading(true);
      toast.loading("Creating trading pair...");
      
      const pair = await createPair(tokenA.address, tokenB.address);
      
      setPairAddress(pair);
      toast.dismiss();
      toast.success("✅ Pair created successfully!");
      
      // Refresh pairs list
      onPairCreated();
    } catch (err: any) {
      console.error("Create pair failed", err);
      toast.dismiss();
      
      if (err.reason?.includes("Pair already exists") || err.message?.includes("Pair already exists")) {
        toast.error("⚠️ This pair already exists");
      } else {
        toast.error("❌ Failed to create pair");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-3xl shadow-xl border border-gray-100 p-8"
    >
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
          <span className="text-white text-lg">⚡</span>
        </div>
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Create Trading Pair</h2>
          <p className="text-gray-500 text-sm">Deploy a new liquidity pool</p>
        </div>
      </div>

      <div className="space-y-6">
        {/* Token Selectors */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">
              Token A
            </label>
            <div className="p-4 bg-gray-50 rounded-2xl border border-gray-200 hover:border-purple-300 transition-colors">
              <TokenSelector selected={tokenA} onSelect={setTokenA} />
              {tokenA && (
                <div className="mt-3 text-xs font-mono text-gray-400 bg-white px-3 py-2 rounded-xl border border-gray-200 truncate">
                  {tokenA.address}
                </div>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">
              Token B
            </label>
            <div className="p-4 bg-gray-50 rounded-2xl border border-gray-200 hover:border-purple-300 transition-colors">
              <TokenSelector selected={tokenB} onSelect={setTokenB} />
              {tokenB && (
                <div className="mt-3 text-xs font-mono text-gray-400 bg-white px-3 py-2 rounded-xl border border-gray-200 truncate">
                  {tokenB.address}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Preview */}
        {tokenA && tokenB && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-2xl p-6 border border-purple-100"
          >
            <div className="flex items-center justify-center gap-6">
              <div className="text-center">
                <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mb-2 shadow-md border-2 border-purple-200">
                  <span className="text-2xl font-bold text-gray-800">{tokenA.symbol.charAt(0)}</span>
                </div>
                <div className="text-lg font-bold text-gray-800">{tokenA.symbol}</div>
              </div>
              
              <div className="text-3xl text-purple-600">⚡</div>
              
              <div className="text-center">
                <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mb-2 shadow-md border-2 border-blue-200">
                  <span className="text-2xl font-bold text-gray-800">{tokenB.symbol.charAt(0)}</span>
                </div>
                <div className="text-lg font-bold text-gray-800">{tokenB.symbol}</div>
              </div>
            </div>
            <div className="text-center mt-4 text-sm text-purple-700 font-medium">
              New Pool: {tokenA.symbol}/{tokenB.symbol}
            </div>
          </motion.div>
        )}

        {/* Create Button */}
        <motion.button
          whileHover={tokenA && tokenB && !loading ? { scale: 1.02 } : {}}
          whileTap={tokenA && tokenB && !loading ? { scale: 0.98 } : {}}
          onClick={handleCreatePair}
          disabled={loading || !tokenA || !tokenB}
          className={`w-full py-4 rounded-2xl font-bold text-lg shadow-lg transition-all ${
            tokenA && tokenB && !loading
              ? "bg-gradient-to-r from-purple-600 to-blue-600 text-white hover:shadow-purple-500/30"
              : "bg-gray-200 text-gray-400 cursor-not-allowed shadow-none"
          }`}
        >
          {loading ? (
            <div className="flex items-center justify-center gap-2">
              <div className="w-5 h-5 border-2 border-white/50 border-t-white rounded-full animate-spin" />
              <span>Deploying Contract...</span>
            </div>
          ) : !tokenA || !tokenB ? (
            "Select Both Tokens"
          ) : (
            "Create Trading Pair"
          )}
        </motion.button>

        {/* Success Message */}
        {pairAddress && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-green-50 border border-green-200 rounded-2xl p-4"
          >
            <div className="flex items-start gap-3">
              <span className="text-2xl">✅</span>
              <div className="flex-1">
                <div className="font-semibold text-green-800 mb-2">Pair Created Successfully!</div>
                <div className="text-xs font-mono text-green-700 bg-white px-3 py-2 rounded-xl break-all">
                  {pairAddress}
                </div>
                
                  <a href={`https://testnet.bscscan.com/address/${pairAddress}`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-sm text-green-600 hover:underline mt-2 inline-block"
                >
                  View on BscScan →
                </a>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}