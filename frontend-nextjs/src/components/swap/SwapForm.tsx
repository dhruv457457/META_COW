"use client";

import { motion } from "framer-motion";
import TokenSelector from "@/components/TokenSelector";
import { Token } from "@/utils/tokens";

interface SwapFormProps {
  tokenA: Token | null;
  tokenB: Token | null;
  amountIn: string;
  amountOut: string;
  balanceA: string;
  onAmountInChange: (val: string) => void;
  onTokenAChange: (t: Token) => void;
  onTokenBChange: (t: Token) => void;
  onSwitch: () => void;
  onSwap: () => void;
  loading: boolean;
}

export default function SwapForm({
  tokenA,
  tokenB,
  amountIn,
  amountOut,
  balanceA,
  onAmountInChange,
  onTokenAChange,
  onTokenBChange,
  onSwitch,
  onSwap,
  loading,
}: SwapFormProps) {
  
  const isInsufficientBalance = amountIn && parseFloat(amountIn) > parseFloat(balanceA);
  const isSwapReady = tokenA && tokenB && amountIn && parseFloat(amountIn) > 0 && !isInsufficientBalance;
  const isNoPool = amountOut === "No Pool";
  const isNoLiquidity = amountOut === "No Liquidity";
  const isError = amountOut === "Error";

  // Quick balance shortcuts
  const setMaxBalance = () => {
    const bal = parseFloat(balanceA);
    if (bal > 0) {
      // Leave a tiny bit for gas if it's the native token
      onAmountInChange(Math.max(0, bal - 0.001).toString());
    }
  };

  const setHalfBalance = () => {
    const bal = parseFloat(balanceA);
    if (bal > 0) {
      onAmountInChange((bal / 2).toString());
    }
  };

  return (
    <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-xl border border-white/20 p-6 md:p-8">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
          <span className="text-white text-lg">🔄</span>
        </div>
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Swap Tokens</h2>
          <p className="text-gray-500 text-sm">Instant on-chain exchange</p>
        </div>
      </div>

      <div className="space-y-4">
        {/* INPUT: FROM */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">From</label>
            {tokenA && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-400">
                  Balance: {parseFloat(balanceA).toFixed(4)} {tokenA.symbol}
                </span>
                <button
                  onClick={setHalfBalance}
                  className="text-xs text-purple-600 hover:text-purple-700 font-medium"
                >
                  HALF
                </button>
                <button
                  onClick={setMaxBalance}
                  className="text-xs text-purple-600 hover:text-purple-700 font-medium"
                >
                  MAX
                </button>
              </div>
            )}
          </div>
          <div className={`bg-gray-50 rounded-2xl p-4 border transition-colors focus-within:border-purple-400 focus-within:ring-2 focus-within:ring-purple-100 ${
            isInsufficientBalance ? 'border-red-300 bg-red-50' : 'border-gray-100 hover:border-purple-200'
          }`}>
            <div className="flex items-center gap-4">
              <input
                type="number"
                placeholder="0.0"
                value={amountIn}
                onChange={(e) => onAmountInChange(e.target.value)}
                className={`w-full bg-transparent text-3xl font-bold placeholder-gray-300 focus:outline-none ${
                  isInsufficientBalance ? 'text-red-600' : 'text-gray-800'
                }`}
              />
              <TokenSelector selected={tokenA} onSelect={onTokenAChange} />
            </div>
          </div>
          {isInsufficientBalance && (
            <p className="text-xs text-red-600 ml-1">Insufficient balance</p>
          )}
        </div>

        {/* SWITCH BUTTON */}
        <div className="flex justify-center -my-3 z-10 relative">
          <button 
            onClick={onSwitch}
            className="bg-white border border-gray-200 p-2 rounded-xl shadow-md hover:scale-110 hover:shadow-lg transition-all text-purple-600"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 7.5L7.5 3m0 0L12 7.5M7.5 3v13.5m13.5 0L16.5 21m0 0L12 16.5m4.5 4.5V7.5" />
            </svg>
          </button>
        </div>

        {/* INPUT: TO */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">To (Estimated)</label>
          <div className={`bg-gray-50 rounded-2xl p-4 border ${
            isNoPool || isNoLiquidity || isError ? 'border-orange-300 bg-orange-50' : 'border-gray-100'
          }`}>
            <div className="flex items-center gap-4">
              <input
                type="text"
                placeholder="0.0"
                value={amountOut}
                readOnly
                className={`w-full bg-transparent text-3xl font-bold placeholder-gray-300 focus:outline-none cursor-default ${
                  isNoPool || isNoLiquidity || isError ? 'text-orange-600' : 'text-gray-600'
                }`}
              />
              <TokenSelector selected={tokenB} onSelect={onTokenBChange} />
            </div>
          </div>
          {isNoPool && (
            <p className="text-xs text-orange-600 ml-1">⚠️ Trading pair doesn't exist. Create it first!</p>
          )}
          {isNoLiquidity && (
            <p className="text-xs text-orange-600 ml-1">⚠️ Pool has no liquidity. Add liquidity first!</p>
          )}
        </div>

        {/* Price Impact / Rate Display */}
        {amountOut && !isNoPool && !isNoLiquidity && !isError && parseFloat(amountOut) > 0 && (
          <div className="bg-purple-50 rounded-xl p-3 text-sm">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Rate</span>
              <span className="font-semibold text-gray-800">
                1 {tokenA?.symbol} ≈ {(parseFloat(amountOut) / parseFloat(amountIn)).toFixed(6)} {tokenB?.symbol}
              </span>
            </div>
          </div>
        )}

        {/* SWAP BUTTON */}
        <motion.button
          whileHover={isSwapReady ? { scale: 1.02 } : {}}
          whileTap={isSwapReady ? { scale: 0.98 } : {}}
          onClick={onSwap}
          disabled={loading || !isSwapReady || isNoPool || isNoLiquidity}
          className={`w-full py-4 rounded-2xl font-bold text-lg shadow-lg transition-all mt-4 ${
            isSwapReady && !isNoPool && !isNoLiquidity
              ? "bg-gradient-to-r from-purple-600 to-blue-600 text-white hover:shadow-purple-500/30" 
              : "bg-gray-200 text-gray-400 cursor-not-allowed shadow-none"
          }`}
        >
          {loading ? (
            <div className="flex items-center justify-center gap-2">
              <div className="w-5 h-5 border-2 border-white/50 border-t-white rounded-full animate-spin" />
              <span>Swapping...</span>
            </div>
          ) : !amountIn ? (
            "Enter Amount"
          ) : isInsufficientBalance ? (
            "Insufficient Balance"
          ) : isNoPool ? (
            "Pool Doesn't Exist"
          ) : isNoLiquidity ? (
            "No Liquidity"
          ) : (
            "Swap Now"
          )}
        </motion.button>
      </div>
    </div>
  );
}