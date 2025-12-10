"use client";

import { useEffect, useState } from "react";
import { useWallet } from "@/context/WalletContext";
import TokenSelector from "@/components/TokenSelector";
import { createPair, getFactoryContract } from "@/utils/contractUtils";
import { Token } from "@/utils/tokens";
import { ethers } from "ethers";
import { toast } from "react-hot-toast";

export default function CreatePair() {
  const { isConnected, address } = useWallet();
  
  const [tokenA, setTokenA] = useState<Token | null>(null);
  const [tokenB, setTokenB] = useState<Token | null>(null);
  const [pairAddress, setPairAddress] = useState("");
  const [status, setStatus] = useState("");
  const [existingPairs, setExistingPairs] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  // Load existing pairs on mount
  useEffect(() => {
    if (isConnected) {
      fetchExistingPairs();
    }
  }, [isConnected]);

  const fetchExistingPairs = async () => {
    try {
      const factory = await getFactoryContract();
      const count = await factory.allPairsLength();
      // Only fetch the last 5 pairs to save RPC calls
      const startIndex = count > 5n ? Number(count) - 5 : 0;
      
      const pairs = [];
      for (let i = startIndex; i < Number(count); i++) {
        const pairAddr = await factory.allPairs(i);
        pairs.push(pairAddr);
      }
      setExistingPairs(pairs.reverse()); // Show newest first
    } catch (err) {
      console.error("Failed to fetch pairs", err);
    }
  };

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
      setStatus("⏳ Creating pair on blockchain...");
      
      // Call the utils function
      const pair = await createPair(tokenA.address, tokenB.address);
      
      setPairAddress(pair);
      setStatus("✅ Pair created successfully!");
      toast.success("Pair Created!");
      
      // Refresh list
      fetchExistingPairs();
    } catch (err: any) {
      console.error("Create pair failed", err);
      // Handle "Pair already exists" error gracefully
      if (err.reason?.includes("PAIR_EXISTS") || err.message?.includes("PAIR_EXISTS")) {
        setStatus("⚠️ Pair already exists.");
        toast.error("Pair already exists!");
      } else {
        setStatus("❌ Creation failed. Check console.");
        toast.error("Transaction failed");
      }
    } finally {
      setLoading(false);
    }
  };

  if (!isConnected) {
    return (
      <div className="max-w-2xl mx-auto mt-20 text-center px-4">
        <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-10">
          <div className="w-20 h-20 bg-gradient-to-r from-green-500 to-teal-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
            <span className="text-3xl">➕</span>
          </div>
          <h3 className="text-2xl font-bold text-gray-800 mb-4">Connect Your Wallet</h3>
          <p className="text-gray-600 mb-8 max-w-md mx-auto">
            You need to connect your wallet to deploy new trading pairs to the BNB Testnet.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-12">
      <div className="text-center mb-10">
        <h1 className="text-4xl font-black bg-gradient-to-r from-green-600 to-teal-600 bg-clip-text text-transparent mb-3">
          Create Trading Pair
        </h1>
        <p className="text-gray-600 text-lg">
          Launch a new liquidity pool for any two tokens.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* LEFT: Creation Form */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-8">
            <div className="space-y-8">
              
              {/* Token Inputs */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <label className="text-sm font-bold text-gray-500 uppercase tracking-wider ml-1">Token A</label>
                  <div className="p-4 bg-gray-50 rounded-2xl border border-gray-200 hover:border-green-300 transition-colors">
                    <TokenSelector selected={tokenA} onSelect={setTokenA} />
                    {tokenA && (
                      <div className="mt-2 text-xs font-mono text-gray-400 truncate bg-white px-2 py-1 rounded border">
                        {tokenA.address}
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="text-sm font-bold text-gray-500 uppercase tracking-wider ml-1">Token B</label>
                  <div className="p-4 bg-gray-50 rounded-2xl border border-gray-200 hover:border-green-300 transition-colors">
                    <TokenSelector selected={tokenB} onSelect={setTokenB} />
                    {tokenB && (
                      <div className="mt-2 text-xs font-mono text-gray-400 truncate bg-white px-2 py-1 rounded border">
                        {tokenB.address}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Preview Box */}
              {tokenA && tokenB && (
                <div className="bg-gradient-to-r from-green-50 to-teal-50 rounded-2xl p-6 border border-green-100">
                  <div className="flex items-center justify-center gap-6">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-gray-800">{tokenA.symbol}</div>
                    </div>
                    <div className="text-gray-400">⚡</div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-gray-800">{tokenB.symbol}</div>
                    </div>
                  </div>
                  <div className="text-center mt-3 text-sm text-green-700 font-medium">
                    New Pool: {tokenA.symbol}/{tokenB.symbol}
                  </div>
                </div>
              )}

              {/* Action Button */}
              <button
                onClick={handleCreatePair}
                disabled={loading || !tokenA || !tokenB}
                className="w-full bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700 text-white font-bold py-4 rounded-2xl text-lg shadow-lg hover:shadow-green-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
              >
                {loading ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-5 h-5 border-2 border-white/50 border-t-white rounded-full animate-spin" />
                    <span>Deploying Contract...</span>
                  </div>
                ) : !tokenA || !tokenB ? (
                  "Select Tokens"
                ) : (
                  "Create Pair"
                )}
              </button>

              {/* Status Message */}
              {status && (
                <div className={`p-4 rounded-xl text-center font-medium ${
                  status.includes("✅") ? "bg-green-100 text-green-800" : 
                  status.includes("⚠️") ? "bg-yellow-100 text-yellow-800" :
                  status.includes("⏳") ? "bg-blue-100 text-blue-800" : "bg-red-100 text-red-800"
                }`}>
                  {status}
                  {pairAddress && (
                    <div className="mt-2 text-xs font-mono break-all bg-white/50 p-2 rounded">
                      Address: {pairAddress}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* RIGHT: Info & History */}
        <div className="space-y-6">
          <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-6">
            <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
              <span>💡</span> How it Works
            </h3>
            <ul className="space-y-3 text-sm text-gray-600">
              <li className="flex gap-3">
                <span className="text-green-500 font-bold">1.</span>
                <span>Select two tokens to initialize a new Liquidity Pool.</span>
              </li>
              <li className="flex gap-3">
                <span className="text-green-500 font-bold">2.</span>
                <span>Deploy the smart contract to the blockchain (costs gas).</span>
              </li>
              <li className="flex gap-3">
                <span className="text-green-500 font-bold">3.</span>
                <span>Once created, go to the <strong>Liquidity Page</strong> to add the first funds.</span>
              </li>
            </ul>
          </div>

          <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-6">
            <h3 className="text-lg font-bold text-gray-800 mb-4">Latest Pairs</h3>
            {existingPairs.length === 0 ? (
              <p className="text-gray-400 text-sm text-center py-4">No pairs found yet.</p>
            ) : (
              <div className="space-y-3">
                {existingPairs.map((pair, i) => (
                  <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-200">
                    <div className="text-xs font-medium text-gray-500">Pair #{i + 1}</div>
                    <a 
                      href={`https://testnet.bscscan.com/address/${pair}`} 
                      target="_blank" 
                      rel="noreferrer"
                      className="text-xs text-blue-600 hover:underline font-mono truncate max-w-[150px]"
                    >
                      {pair}
                    </a>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}