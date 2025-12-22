"use client";

import { useState, useEffect } from "react";
import { useWallet } from "@/context/WalletContext";
import { motion } from "framer-motion";
import CreatePairSection from "@/components/admin/CreatePairSection";
import FaucetSection from "@/components/admin/FaucetSection";
import PairsList from "@/components/admin/PairsList";
import { getFactoryContract } from "@/utils/contractUtils";

export default function AdminPage() {
  const { isConnected, address } = useWallet();
  const [activeTab, setActiveTab] = useState<"pairs" | "faucet">("pairs");
  const [existingPairs, setExistingPairs] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch existing pairs
  const fetchExistingPairs = async () => {
    try {
      setLoading(true);
      const factory = await getFactoryContract();
      const count = await factory.allPairsLength();
      
      const pairs = [];
      for (let i = 0; i < Number(count); i++) {
        const pairAddr = await factory.allPairs(i);
        pairs.push(pairAddr);
      }
      setExistingPairs(pairs.reverse()); // Newest first
    } catch (err) {
      console.error("Failed to fetch pairs", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isConnected) {
      fetchExistingPairs();
    }
  }, [isConnected]);

  // Not connected view
  if (!isConnected) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md w-full bg-white rounded-3xl shadow-xl border border-gray-100 p-10 text-center"
        >
          <div className="w-20 h-20 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
            <span className="text-4xl">🔐</span>
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Admin Access Required</h2>
          <p className="text-gray-600 mb-6">
            Please connect your wallet to access the admin panel and manage trading pairs.
          </p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      {/* Header */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-10"
      >
        <h1 className="text-4xl md:text-5xl font-black bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent mb-3">
          Admin Panel
        </h1>
        <p className="text-gray-600 text-lg">
          Manage trading pairs and faucet deposits
        </p>
      </motion.div>

      {/* Tab Navigation */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex justify-center gap-4 mb-8"
      >
        <button
          onClick={() => setActiveTab("pairs")}
          className={`px-6 py-3 rounded-2xl font-semibold transition-all ${
            activeTab === "pairs"
              ? "bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg"
              : "bg-white text-gray-600 border border-gray-200 hover:border-purple-300"
          }`}
        >
          ⚡ Trading Pairs
        </button>
        <button
          onClick={() => setActiveTab("faucet")}
          className={`px-6 py-3 rounded-2xl font-semibold transition-all ${
            activeTab === "faucet"
              ? "bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg"
              : "bg-white text-gray-600 border border-gray-200 hover:border-purple-300"
          }`}
        >
          💧 Faucet
        </button>
      </motion.div>

      {/* Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Main Content Area */}
        <div className="lg:col-span-2">
          {activeTab === "pairs" ? (
            <CreatePairSection onPairCreated={fetchExistingPairs} />
          ) : (
            <FaucetSection />
          )}
        </div>

        {/* Sidebar */}
        <div className="lg:sticky lg:top-24 space-y-6">
          {activeTab === "pairs" && (
            <PairsList pairs={existingPairs} loading={loading} />
          )}
          
          {/* Admin Info */}
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-white rounded-3xl shadow-xl border border-gray-100 p-6"
          >
            <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
              <span>💡</span> Admin Guide
            </h3>
            <ul className="space-y-3 text-sm text-gray-600">
              <li className="flex gap-3">
                <span className="text-purple-500 font-bold">•</span>
                <span><strong>Trading Pairs:</strong> Deploy new liquidity pools for any token pair</span>
              </li>
              <li className="flex gap-3">
                <span className="text-purple-500 font-bold">•</span>
                <span><strong>Faucet:</strong> Deposit tokens for users to claim during testing</span>
              </li>
              <li className="flex gap-3">
                <span className="text-purple-500 font-bold">•</span>
                <span><strong>Gas Costs:</strong> All operations require BNB for transaction fees</span>
              </li>
            </ul>
          </motion.div>
        </div>
      </div>
    </div>
  );
}