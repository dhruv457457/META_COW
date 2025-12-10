"use client";

import { useState, useEffect } from "react";
import { useWallet } from "@/context/WalletContext";
import { tokenList, Token } from "@/utils/tokens";
import { getPairAddress, getLPBalance } from "@/utils/contractUtils";
import LiquidityForm from "@/components/liquidity/LiquidityForm";
import LiquiditySidebar from "@/components/liquidity/LiquiditySidebar";
import TransactionList, { Transaction } from "@/components/TransactionList";
import { ethers } from "ethers";
import { motion } from "framer-motion";

export default function LiquidityPage() {
  const { address, isConnected } = useWallet();
  
  // State
  const [tokenA, setTokenA] = useState<Token | null>(tokenList[0]);
  const [tokenB, setTokenB] = useState<Token | null>(tokenList[1]);
  const [pairAddress, setPairAddress] = useState<string>("");
  const [lpBalance, setLpBalance] = useState("0");
  const [transactions, setTransactions] = useState<Transaction[]>([]); // Local history for now

  // Fetch Pair & LP Balance
  const fetchPairDetails = async () => {
    if (!tokenA || !tokenB || !address) return;
    try {
      const pair = await getPairAddress(tokenA.address, tokenB.address);
      if (pair === ethers.ZeroAddress) {
        setPairAddress("");
        return;
      }
      setPairAddress(pair);
      
      const balance = await getLPBalance(pair, address);
      setLpBalance(balance);
    } catch (error) {
      console.error("Error fetching pair details", error);
    }
  };

  useEffect(() => {
    fetchPairDetails();
  }, [tokenA, tokenB, address]);

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      <div className="text-center mb-10">
        <h1 className="text-4xl font-black bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-3">
          Liquidity Pools
        </h1>
        <p className="text-gray-600 text-lg">
          Provide liquidity to earn 0.3% trading fees.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        
        {/* LEFT: Form & History */}
        <div className="lg:col-span-2 space-y-8">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <LiquidityForm 
              tokenA={tokenA} 
              setTokenA={setTokenA}
              tokenB={tokenB} 
              setTokenB={setTokenB}
              lpBalance={lpBalance}
              pairAddress={pairAddress}
              onTxUpdate={fetchPairDetails}
            />
          </motion.div>

          <div className="bg-white rounded-3xl p-6 shadow-lg border border-gray-100">
            <h3 className="text-lg font-bold text-gray-800 mb-4">Your Recent Activity</h3>
            <TransactionList transactions={transactions} />
          </div>
        </div>

        {/* RIGHT: Sidebar Stats */}
        <motion.div 
          initial={{ opacity: 0, x: 20 }} 
          animate={{ opacity: 1, x: 0 }}
          className="lg:sticky lg:top-24"
        >
          {pairAddress ? (
            <LiquiditySidebar 
              lpBalance={lpBalance} 
              pairAddress={pairAddress} 
              address={address} 
              onClaim={fetchPairDetails} 
            />
          ) : (
            <div className="bg-white rounded-3xl p-8 border border-gray-100 text-center shadow-lg">
              <div className="text-4xl mb-4">💧</div>
              <h3 className="text-lg font-bold text-gray-800 mb-2">No Pool Selected</h3>
              <p className="text-gray-500 text-sm">
                Select a valid token pair to view your position and rewards.
              </p>
            </div>
          )}
        </motion.div>

      </div>
    </div>
  );
}