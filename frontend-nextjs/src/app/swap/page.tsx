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

export default function SwapPage() {
  const { address, isConnected } = useWallet();
  
  // State
  const [tokenA, setTokenA] = useState<Token | null>(tokenList[0]);
  const [tokenB, setTokenB] = useState<Token | null>(tokenList[1]);
  const [amountIn, setAmountIn] = useState("");
  const [amountOut, setAmountOut] = useState("");
  const [loading, setLoading] = useState(false);
  const [balanceA, setBalanceA] = useState("0");
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [chartData, setChartData] = useState<any[]>([]);

  // Fetch balance for input token
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
    const interval = setInterval(fetchBalance, 10000); // Update every 10s
    return () => clearInterval(interval);
  }, [address, tokenA]);

  // 1. Calculate Estimated Output
  useEffect(() => {
    const calculateOut = async () => {
      if (!tokenA || !tokenB || !amountIn || parseFloat(amountIn) <= 0) {
        setAmountOut("");
        return;
      }

      try {
        const pairAddress = await getPairAddress(tokenA.address, tokenB.address);
        
        // Check if pair exists
        if (pairAddress === ethers.ZeroAddress) {
          setAmountOut("No Pool");
          return;
        }

        const { reserve0, reserve1 } = await getReserves(pairAddress);
        
        // Determine which reserve is which based on token sorting
        const isTokenALower = tokenA.address.toLowerCase() < tokenB.address.toLowerCase();
        const reserveIn = isTokenALower ? reserve0 : reserve1;
        const reserveOut = isTokenALower ? reserve1 : reserve0;

        // Check if reserves are sufficient
        if (reserveIn === 0n || reserveOut === 0n) {
          setAmountOut("No Liquidity");
          return;
        }

        // AMM Formula: dy = (dx * 997 * y) / (x * 1000 + dx * 997)
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

    const timer = setTimeout(calculateOut, 500); // Debounce
    return () => clearTimeout(timer);
  }, [amountIn, tokenA, tokenB]);

  // 2. Handle Swap Execution
  const handleSwap = async () => {
    if (!isConnected || !address) {
      toast.error("Please connect wallet first");
      return;
    }
    if (!tokenA || !tokenB) {
      toast.error("Please select tokens");
      return;
    }

    // Validate balance
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
      
      toast.success("Swap Successful!");
      
      // Add to local transaction history
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
      
      // Reset form
      setAmountIn("");
      setAmountOut("");

    } catch (error: any) {
      console.error("Swap error:", error);
      
      // Better error messages
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

  // 3. Switch Tokens
  const handleSwitch = () => {
    setTokenA(tokenB);
    setTokenB(tokenA);
    setAmountIn("");
    setAmountOut("");
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-12 md:px-8">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        
        {/* Left Side: Swap Interface */}
        <motion.div 
          initial={{ opacity: 0, x: -20 }} 
          animate={{ opacity: 1, x: 0 }}
          className="space-y-8"
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

          <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-6 shadow-lg border border-white/20">
            <h3 className="text-lg font-bold text-gray-800 mb-4">Your Recent Swaps</h3>
            <TransactionList transactions={transactions} />
          </div>
        </motion.div>

        {/* Right Side: Chart */}
        <motion.div 
          initial={{ opacity: 0, x: 20 }} 
          animate={{ opacity: 1, x: 0 }}
          className="h-[500px] hidden lg:block"
        >
          <SwapChart 
            tokenA={tokenA} 
            tokenB={tokenB} 
            data={chartData}
            loading={false}
          />
        </motion.div>

      </div>
    </div>
  );
}