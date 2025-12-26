import React from "react";
import { motion } from "framer-motion";
import TokenSelector from "../TokenSelector";

export default function SwapForm({
  tokenA,
  tokenB,
  amountIn,
  amountOut,
  onAmountInChange,
  onTokenAChange,
  onTokenBChange,
  onSwitch,
  onSwap,
  loading,
}) {
  const isSwapReady = tokenA && tokenB && amountIn && parseFloat(amountIn) > 0;

  return (
    <div className="space-y-6">
      {/* From Token */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="space-y-3"
      >
        <label className="text-slate-700 font-semibold text-sm uppercase tracking-wide">
          From
        </label>
        <div className="bg-gradient-to-r from-slate-50 to-blue-50 rounded-2xl p-6 border-2 border-slate-200/50 focus-within:border-purple-300 focus-within:shadow-lg transition-all duration-300">
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <input
                type="number"
                placeholder="0.0"
                value={amountIn}
                onChange={(e) => onAmountInChange(e.target.value)}
                className="w-full bg-transparent text-3xl font-bold text-slate-800 placeholder-slate-400 focus:outline-none"
              />
              <div className="text-sm text-slate-500 mt-2 font-medium">
                {amountIn && tokenA
                  ? `≈ $${(parseFloat(amountIn) * 2000).toFixed(2)} USD`
                  : "Enter amount"}
              </div>
            </div>
            <TokenSelector selected={tokenA} onSelect={onTokenAChange} />
          </div>
        </div>
      </motion.div>

      {/* Switch Button */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.2, duration: 0.5 }}
        className="flex justify-center"
      >
        <motion.button
          whileHover={{ scale: 1.1, rotate: 180 }}
          whileTap={{ scale: 0.95 }}
          onClick={onSwitch}
          className="bg-white border-2 border-slate-200 hover:border-purple-300 text-slate-600 hover:text-purple-600 p-4 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 group"
        >
          <svg
            className="w-6 h-6 transition-transform duration-300"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4"
            />
          </svg>
        </motion.button>
      </motion.div>

      {/* To Token */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.5 }}
        className="space-y-3"
      >
        <label className="text-slate-700 font-semibold text-sm uppercase tracking-wide">
          To
        </label>
        <div className="bg-gradient-to-r from-slate-50 to-emerald-50 rounded-2xl p-6 border-2 border-slate-200/50">
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <input
                type="text"
                placeholder="0.0"
                value={amountOut}
                disabled
                className="w-full bg-transparent text-3xl font-bold text-slate-600 placeholder-slate-400 focus:outline-none"
              />
              <div className="text-sm text-slate-500 mt-2 font-medium">
                {amountOut && tokenB
                  ? `≈ $${(parseFloat(amountOut) * 2000).toFixed(2)} USD`
                  : "Estimated amount"}
              </div>
            </div>
            <TokenSelector selected={tokenB} onSelect={onTokenBChange} />
          </div>
        </div>
      </motion.div>

      {/* Swap Details */}
      {isSwapReady && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          transition={{ duration: 0.4 }}
          className="bg-gradient-to-r from-purple-50 via-blue-50 to-indigo-50 rounded-2xl p-6 space-y-4 border border-purple-200/50"
        >
          <div className="flex items-center gap-2 mb-4">
            <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
            <span className="text-sm font-semibold text-slate-700">Swap Details</span>
          </div>
          
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-slate-600 text-sm font-medium">Exchange Rate</span>
              <span className="font-bold text-slate-800">
                1 {tokenA.symbol} = {(parseFloat(amountOut) / parseFloat(amountIn)).toFixed(6)} {tokenB.symbol}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-600 text-sm font-medium">Price Impact</span>
              <span className="font-bold text-green-600">{"<"} 0.01%</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-600 text-sm font-medium">Network Fee</span>
              <span className="font-bold text-slate-800">~$2.50</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-600 text-sm font-medium">Slippage</span>
              <span className="font-bold text-slate-800">0.5%</span>
            </div>
          </div>
        </motion.div>
      )}

      {/* Swap Button */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.5 }}
      >
        <motion.button
          whileHover={isSwapReady ? { scale: 1.02 } : {}}
          whileTap={isSwapReady ? { scale: 0.98 } : {}}
          onClick={onSwap}
          disabled={loading || !isSwapReady}
          className={`w-full font-bold py-4 rounded-2xl transition-all duration-300 shadow-lg hover:shadow-xl disabled:cursor-not-allowed disabled:shadow-none text-lg ${
            isSwapReady
              ? "bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-600 hover:from-purple-700 hover:via-blue-700 hover:to-indigo-700 text-white hover:shadow-xl"
              : "bg-gradient-to-r from-slate-100 via-blue-100 to-indigo-100 hover:from-slate-200 hover:via-blue-200 hover:to-indigo-200 text-slate-600 border-2 border-slate-200 hover:border-slate-300"
          }`}
        >
          {loading ? (
            <div className="flex items-center justify-center gap-3">
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              <span>Swapping...</span>
            </div>
          ) : !tokenA || !tokenB ? (
            <div className="flex items-center justify-center gap-2">
              <span>🔗</span>
              <span>Select Tokens</span>
            </div>
          ) : !amountIn ? (
            <div className="flex items-center justify-center gap-2">
              <span>💰</span>
              <span>Enter Amount</span>
            </div>
          ) : (
            <div className="flex items-center justify-center gap-2">
              <span>🔄</span>
              <span>Swap {tokenA.symbol} for {tokenB.symbol}</span>
            </div>
          )}
        </motion.button>
      </motion.div>

      {/* Security Notice */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6, duration: 0.5 }}
        className="text-center"
      >
        <div className="flex items-center justify-center gap-2 text-xs text-slate-500">
          <span className="w-2 h-2 bg-green-500 rounded-full"></span>
          <span>Secure • Audited • Gas Optimized</span>
        </div>
      </motion.div>
    </div>
  );
}