import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { useWallet } from "../contexts/WalletContext";
import { showSuccess, showError, showWarning } from "../utils/toast";
import {
  getPairAddress,
  getReserves,
  swap,
} from "../utils/contractUtils";
import {
  saveSwapToBackend,
  getAllSwapsAcrossPairs,
} from "../utils/transactionLog";
import { motion, AnimatePresence } from "framer-motion";
import SwapForm from "../components/swap/SwapForm";
import SwapChart from "../components/swap/SwapChart";
import TransactionList from "../components/TransactionList";
import { ethers } from "ethers";
import { tokenList } from "../utils/constants";

// ✅ Default tokens (TKA & TKB)
const DEFAULT_TOKENS = {
  TKA: tokenList.find((t) => t.symbol === "TKA"),
  TKB: tokenList.find((t) => t.symbol === "TKB"),
};

export default function Swap() {
  const [tokenA, setTokenA] = useState(DEFAULT_TOKENS.TKA);
  const [tokenB, setTokenB] = useState(DEFAULT_TOKENS.TKB);
  const [amountIn, setAmountIn] = useState("");
  const [amountOut, setAmountOut] = useState("");
  const [pairAddress, setPairAddress] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [priceHistory, setPriceHistory] = useState([]);
  const { walletData } = useWallet();
  const address = walletData?.address;
  const isConnected = !!address;
  const [loading, setLoading] = useState(false);
  const [loadingTransactions, setLoadingTransactions] = useState(false);
  const location = useLocation();

  const unsupportedToken = tokenA?.symbol === "Unknown" || tokenB?.symbol === "Unknown";

  useEffect(() => {
    if (location.state) {
      const { tokenA: tokenAAddr, tokenB: tokenBAddr, amountIn } = location.state;
      console.log(tokenAAddr, tokenBAddr, amountIn);
      if (tokenAAddr && tokenBAddr) {
        const tokenAObj = tokenList.find(t => t.address.toLowerCase() === tokenAAddr.toLowerCase());
        const tokenBObj = tokenList.find(t => t.address.toLowerCase() === tokenBAddr.toLowerCase());
        setTokenA(tokenAObj || { address: tokenAAddr, symbol: "Unknown" });
        setTokenB(tokenBObj || { address: tokenBAddr, symbol: "Unknown" });
        setTimeout(() => {
          if (amountIn) setAmountIn(amountIn);
        }, 0);
      } else if (amountIn) {
        setAmountIn(amountIn);
      }
    }
  }, [location.state]);

  useEffect(() => {
    const fetchEstimate = async () => {
      if (unsupportedToken) {
        setAmountOut("");
        return;
      }
      if (tokenA && tokenB && amountIn) {
        try {
          const pair = await getPairAddress(tokenA.address, tokenB.address);
          if (!pair || pair === ethers.ZeroAddress) {
            setAmountOut("0.0");
            setPairAddress(null);
            return;
          }

          setPairAddress(pair);
          const { reserveA, reserveB } = await getReserves(pair);
          const [inputReserve, outputReserve] =
            tokenA.address.toLowerCase() < tokenB.address.toLowerCase()
              ? [reserveA, reserveB]
              : [reserveB, reserveA];

          const input = parseFloat(amountIn);
          const inputWithFee = input * 997;
          const output =
            (inputWithFee * outputReserve) / (inputReserve * 1000 + inputWithFee);
          setAmountOut(output.toFixed(6));
        } catch {
          setAmountOut("0.0");
        }
      } else {
        setAmountOut("");
      }
    };

    fetchEstimate();
  }, [tokenA, tokenB, amountIn, unsupportedToken]);

  const fetchTransactions = async () => {
    setLoadingTransactions(true);
    try {
      const allTxs = await getAllSwapsAcrossPairs(200);
      setTransactions(allTxs.slice(0, 10));

      const filteredTxs = allTxs.filter(
        (tx) =>
          (tx.inputTokenSymbol === tokenA?.symbol &&
            tx.outputTokenSymbol === tokenB?.symbol) ||
          (tx.inputTokenSymbol === tokenB?.symbol &&
            tx.outputTokenSymbol === tokenA?.symbol)
      );

      const processed = filteredTxs.map((tx) => {
        const price =
          tx.inputTokenSymbol === tokenA?.symbol
            ? parseFloat(tx.outputAmount) / parseFloat(tx.inputAmount)
            : parseFloat(tx.inputAmount) / parseFloat(tx.outputAmount);

        return {
          timestamp: tx.timestamp,
          price,
          volume: parseFloat(tx.inputAmount),
        };
      });

      setPriceHistory(processed.sort((a, b) => a.timestamp - b.timestamp));
    } catch (err) {
      console.error("Error fetching txs:", err);
    } finally {
      setLoadingTransactions(false);
    }
  };

  useEffect(() => {
    if (tokenA && tokenB) fetchTransactions();
  }, [address, tokenA, tokenB]);

  const handleSwap = async () => {
    if (unsupportedToken) {
      showWarning("One or both tokens are not supported for swap.");
      return;
    }
    if (!tokenA || !tokenB || !amountIn || !pairAddress) {
      showWarning("Please fill all fields.");
      return;
    }

    try {
      setLoading(true);
      const parsedIn = ethers.parseUnits(amountIn, 18);
      const receipt = await swap(pairAddress, parsedIn, tokenA.address);
      const provider = new ethers.BrowserProvider(window.ethereum);
      const block = await provider.getBlock(receipt.blockNumber);

      await saveSwapToBackend({
        user: address,
        pairAddress: pairAddress.toLowerCase(),
        inputToken: tokenA.address,
        outputToken: tokenB.address,
        inputAmount: amountIn,
        outputAmount: amountOut,
        txHash: receipt.hash,
        blockNumber: receipt.blockNumber,
        timestamp: block.timestamp,
      });

      showSuccess("Swap successful and saved!");
      fetchTransactions();
    } catch (err) {
      console.error("Swap failed:", err);
      showError("Swap failed.");
    } finally {
      setLoading(false);
    }
  };

  const handleSwitch = () => {
    setTokenA(tokenB);
    setTokenB(tokenA);
    setAmountIn(amountOut);
    setAmountOut("");
  };

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center"
        >
          <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-8 shadow-xl border border-white/20">
            <div className="w-16 h-16 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-6">
              <span className="text-2xl">🔗</span>
            </div>
            <h2 className="text-2xl font-bold text-slate-800 mb-4">
              Connect Your Wallet
            </h2>
            <p className="text-slate-600 max-w-md">
              Please connect your wallet to start trading on MetaCow DEX
            </p>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Header Section */}
      <section className="relative overflow-hidden">
        {/* Background Elements */}
        <div className="absolute inset-0">
          <div className="absolute top-20 left-20 w-72 h-72 bg-gradient-to-r from-purple-400/10 to-blue-400/10 rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-gradient-to-r from-blue-400/10 to-indigo-400/10 rounded-full blur-3xl" />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-6 py-16">
          {/* Show warning if unsupported token */}
          {unsupportedToken && (
            <div className="bg-red-100 text-red-700 p-4 rounded-xl mb-6 text-center font-semibold">
              One or both tokens are not supported for swap estimation. Please select a supported token.
            </div>
          )}

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 mb-12">
            {/* Left - Swap Form */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2, duration: 0.8 }}
            >
              <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl border border-white/20 p-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl flex items-center justify-center">
                    <span className="text-white text-lg">🔄</span>
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-slate-800">Swap Tokens</h2>
                    <p className="text-slate-600 text-sm">Exchange tokens instantly</p>
                  </div>
                </div>
                
                <SwapForm
                  tokenA={tokenA}
                  tokenB={tokenB}
                  amountIn={amountIn}
                  amountOut={amountOut}
                  onAmountInChange={setAmountIn}
                  onTokenAChange={setTokenA}
                  onTokenBChange={setTokenB}
                  onSwitch={handleSwitch}
                  onSwap={handleSwap}
                  loading={loading}
                />
              </div>
            </motion.div>

            {/* Right - Chart */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4, duration: 0.8 }}
            >
              <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl border border-white/20 p-8 h-full">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-gradient-to-r from-green-600 to-emerald-600 rounded-xl flex items-center justify-center">
                    <span className="text-white text-lg">📊</span>
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-slate-800">Price Chart</h2>
                    <p className="text-slate-600 text-sm">Real-time trading data</p>
                  </div>
                </div>

                <SwapChart
                  tokenA={tokenA}
                  tokenB={tokenB}
                  chartData={priceHistory}
                  onRefresh={fetchTransactions}
                  onClearLive={() => setPriceHistory([])}
                  loading={loadingTransactions}
                />
              </div>
            </motion.div>
          </div>

          {/* Transactions Section */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.8 }}
            className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl border border-white/20 p-8"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-gradient-to-r from-orange-600 to-red-600 rounded-xl flex items-center justify-center">
                <span className="text-white text-lg">📋</span>
              </div>
              <div>
                <h2 className="text-2xl font-bold text-slate-800">Recent Transactions</h2>
                <p className="text-slate-600 text-sm">Live trading activity</p>
              </div>
            </div>

            <TransactionList userAddress={address} transactions={transactions} />
          </motion.div>
        </div>
      </section>
    </div>
  );
}