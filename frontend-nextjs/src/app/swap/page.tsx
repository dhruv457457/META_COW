"use client";

import { useState, useEffect } from "react";
import { useWallet } from "@/context/WalletContext";
import { tokenList, Token } from "@/utils/tokens";
import { getPairAddress, getReserves, swap } from "@/utils/contractUtils";
import { ethers, BrowserProvider, Contract } from "ethers";
import { ERC20_ABI } from "@/utils/constants";
import { toast } from "react-hot-toast";
import SwapForm from "@/components/swap/SwapForm";
import SwapChart from "@/components/swap/SwapChart";
import TransactionList, { Transaction } from "@/components/TransactionList";
import { motion } from "framer-motion";
import { fetchSwapsByTokens, getPairInfo } from "@/utils/envioClient";
import { transformSwapsToChartData, aggregateChartData, ChartDataPoint } from "@/utils/chartUtils";

export default function SwapPage() {
  const { address, isConnected } = useWallet();
  
  const [tokenA, setTokenA] = useState<Token | null>(tokenList[0]);
  const [tokenB, setTokenB] = useState<Token | null>(tokenList[1]);
  const [amountIn, setAmountIn] = useState("");
  const [amountOut, setAmountOut] = useState("");
  const [loading, setLoading] = useState(false);
  const [balanceA, setBalanceA] = useState("0");
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);
  const [chartLoading, setChartLoading] = useState(false);

  useEffect(() => {
    const fetchBalance = async () => {
      if (!address || !tokenA) return;
      try {
        const provider = new BrowserProvider(window.ethereum);
        const token = new Contract(tokenA.address, ERC20_ABI, provider);
        const bal = await token.balanceOf(address);
        setBalanceA(ethers.formatUnits(bal, 18));
      } catch (err) {
        console.error("Balance fetch error:", err);
        setBalanceA("0");
      }
    };

    fetchBalance();
    const interval = setInterval(fetchBalance, 10000);
    return () => clearInterval(interval);
  }, [address, tokenA]);

  useEffect(() => {
    const fetchChartData = async () => {
      if (!tokenA || !tokenB) {
        setChartData([]);
        return;
      }

      setChartLoading(true);
      try {
        const pairInfo = await getPairInfo(tokenA.address, tokenB.address);
        
        if (!pairInfo) {
          setChartData([]);
          return;
        }

        const swaps = await fetchSwapsByTokens(tokenA.address, tokenB.address, 100);
        
        if (swaps.length === 0) {
          setChartData([]);
          return;
        }

        const rawData = transformSwapsToChartData(swaps, tokenA, tokenB);
        const aggregated = aggregateChartData(rawData, 300);
        
        setChartData(aggregated);
        
      } catch (error) {
        console.error("Error fetching chart data:", error);
        setChartData([]);
      } finally {
        setChartLoading(false);
      }
    };

    fetchChartData();
    const interval = setInterval(fetchChartData, 30000);
    return () => clearInterval(interval);
  }, [tokenA, tokenB]);

  useEffect(() => {
    const calculateOut = async () => {
      if (!tokenA || !tokenB || !amountIn || parseFloat(amountIn) <= 0) {
        setAmountOut("");
        return;
      }

      try {
        const pairAddress = await getPairAddress(tokenA.address, tokenB.address);
        
        if (pairAddress === ethers.ZeroAddress) {
          setAmountOut("No Pool");
          return;
        }

        const { reserve0, reserve1 } = await getReserves(pairAddress);
        const isTokenALower = tokenA.address.toLowerCase() < tokenB.address.toLowerCase();
        const reserveIn = isTokenALower ? reserve0 : reserve1;
        const reserveOut = isTokenALower ? reserve1 : reserve0;

        if (reserveIn === 0n || reserveOut === 0n) {
          setAmountOut("No Liquidity");
          return;
        }

        const inputAmountBN = ethers.parseUnits(amountIn, 18);
        const inputWithFee = inputAmountBN * 997n;
        const numerator = inputWithFee * reserveOut;
        const denominator = (reserveIn * 1000n) + inputWithFee;
        const outputAmount = numerator / denominator;

        setAmountOut(ethers.formatUnits(outputAmount, 18));
      } catch (error: any) {
        console.error("Estimation error:", error.message || error);
        setAmountOut("Error");
      }
    };

    const timer = setTimeout(calculateOut, 500);
    return () => clearTimeout(timer);
  }, [amountIn, tokenA, tokenB]);

  const handleSwap = async () => {
    if (!isConnected || !address) {
      toast.error("Please connect wallet first");
      return;
    }
    if (!tokenA || !tokenB) {
      toast.error("Please select tokens");
      return;
    }

    const amountWei = ethers.parseUnits(amountIn, 18);
    const balanceWei = ethers.parseUnits(balanceA, 18);
    
    if (amountWei > balanceWei) {
      toast.error(`Insufficient ${tokenA.symbol} balance`);
      return;
    }

    try {
      setLoading(true);
      const pairAddress = await getPairAddress(tokenA.address, tokenB.address);
      
      if (pairAddress === ethers.ZeroAddress) {
        toast.error("Trading pair doesn't exist");
        return;
      }
      
      const receipt = await swap(pairAddress, amountIn, tokenA.address);
      
      toast.success("Swap Successful! Chart will update shortly...");
      
      const newTx: Transaction = {
        type: "swap",
        inputTokenSymbol: tokenA.symbol,
        outputTokenSymbol: tokenB.symbol,
        inputAmount: amountIn,
        outputAmount: amountOut,
        txHash: receipt.hash || receipt.transactionHash || "0x...",
        timestamp: Math.floor(Date.now() / 1000),
      };
      setTransactions(prev => [newTx, ...prev]);
      
      setAmountIn("");
      setAmountOut("");

      setTimeout(async () => {
        if (tokenA && tokenB) {
          const swaps = await fetchSwapsByTokens(tokenA.address, tokenB.address, 100);
          const rawData = transformSwapsToChartData(swaps, tokenA, tokenB);
          const aggregated = aggregateChartData(rawData, 300);
          setChartData(aggregated);
        }
      }, 5000);

    } catch (error: any) {
      console.error("Swap error:", error);
      
      let errorMsg = "Swap failed";
      if (error.message?.includes("insufficient")) {
        errorMsg = "Insufficient liquidity or balance";
      } else if (error.message?.includes("slippage")) {
        errorMsg = "Price changed too much. Try again.";
      } else if (error.message?.includes("user rejected")) {
        errorMsg = "Transaction cancelled";
      } else if (error.reason) {
        errorMsg = error.reason;
      } else if (error.message) {
        errorMsg = error.message;
      }
      
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleSwitch = () => {
    setTokenA(tokenB);
    setTokenB(tokenA);
    setAmountIn("");
    setAmountOut("");
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-12 md:px-8">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        
        {/* Left Side: Swap Form */}
        <motion.div 
          initial={{ opacity: 0, x: -20 }} 
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
        >
          <SwapForm 
            tokenA={tokenA}
            tokenB={tokenB}
            amountIn={amountIn}
            amountOut={amountOut}
            balanceA={balanceA}
            onAmountInChange={setAmountIn}
            onTokenAChange={setTokenA}
            onTokenBChange={setTokenB}
            onSwitch={handleSwitch}
            onSwap={handleSwap}
            loading={loading}
          />
        </motion.div>

        {/* Right Side: Chart + Transactions */}
        <motion.div 
          initial={{ opacity: 0, x: 20 }} 
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="space-y-6"
        >
          {/* Price Chart */}
          <div className="h-[400px]">
            <SwapChart 
              tokenA={tokenA} 
              tokenB={tokenB} 
              data={chartData}
              loading={chartLoading}
            />
          </div>

          {/* Transaction List */}
          <div className="bg-white/90 backdrop-blur-sm rounded-3xl p-6 shadow-xl border border-white/20">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-2xl">📜</span>
              <h3 className="text-lg font-bold text-gray-800">Your Recent Swaps</h3>
            </div>
            <TransactionList transactions={transactions} />
          </div>
        </motion.div>

      </div>
    </div>
  );
}