import { useEffect, useState } from "react";
import { useWallet } from "../contexts/WalletContext";
import TokenSelector from "../components/TokenSelector";
import { createPair, getFactoryContract } from "../utils/contractUtils";
import { ethers } from "ethers";

export default function CreatePair() {
const { walletData } = useWallet();
const address = walletData?.address;
const isConnected = !!address;  const [tokenA, setTokenA] = useState(null);
  const [tokenB, setTokenB] = useState(null);
  const [pairAddress, setPairAddress] = useState("");
  const [status, setStatus] = useState("");
  const [existingPairs, setExistingPairs] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleCreatePair = async () => {
    try {
      if (
        !tokenA ||
        !tokenB ||
        !ethers.isAddress(tokenA.address) ||
        !ethers.isAddress(tokenB.address)
      ) {
        return setStatus("❌ Please select valid token addresses.");
      }

      setLoading(true);
      setStatus("⏳ Creating pair...");
      const pair = await createPair(tokenA.address, tokenB.address);
      setPairAddress(pair);
      setStatus(`✅ Pair created successfully!`);
      fetchExistingPairs();
    } catch (err) {
      console.error("Create pair failed", err);
      setStatus("❌ Failed to create pair. Check console.");
    } finally {
      setLoading(false);
    }
  };

  const fetchExistingPairs = async () => {
    try {
      const factory = await getFactoryContract();
      const count = await factory.allPairsLength();
      const pairs = [];
      for (let i = 0; i < count; i++) {
        const pairAddr = await factory.allPairs(i);
        pairs.push(pairAddr);
      }
      setExistingPairs(pairs);
    } catch (err) {
      console.error("Failed to fetch pairs", err);
    }
  };

  useEffect(() => {
    if (isConnected) {
      fetchExistingPairs();
    }
  }, [isConnected]);

  if (!isConnected) {
    return (
      <div className="max-w-2xl mx-auto mt-12">
        <div className="bg-white rounded-3xl shadow-2xl border border-gray-100 p-8 text-center">
          <div className="w-20 h-20 bg-gradient-to-r from-green-500 to-teal-500 rounded-full flex items-center justify-center mx-auto mb-6">
            <span className="text-3xl">➕</span>
          </div>
          <h3 className="text-2xl font-bold text-gray-800 mb-4">
            Connect Your Wallet
          </h3>
          <p className="text-gray-600 mb-6">
            Connect your wallet to create new trading pairs on MetaCow DEX
          </p>
          <div className="bg-gradient-to-r from-green-50 to-teal-50 rounded-2xl p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div className="flex items-center gap-2">
                <span className="text-green-500">✓</span>
                <span>Create New Markets</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-green-500">✓</span>
                <span>Enable Trading</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-green-500">✓</span>
                <span>Earn First LP Rewards</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto mt-8">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-green-600 to-teal-600 bg-clip-text text-transparent mb-2">
          Create Trading Pair
        </h1>
        <p className="text-gray-600">
          Launch new markets and enable token trading
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Creation Panel */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-3xl shadow-2xl border border-gray-100 p-8">
            <div className="space-y-6">
              {/* Token Selection */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <label className="text-gray-700 font-semibold">
                    First Token
                  </label>
                  <div className="bg-gray-50 rounded-2xl p-4 border-2 border-transparent focus-within:border-green-200 transition-colors">
                    <TokenSelector selected={tokenA} onSelect={setTokenA} />
                    {tokenA && (
                      <div className="mt-3 text-sm text-gray-600">
                        <div className="font-mono text-xs bg-gray-100 px-2 py-1 rounded">
                          {tokenA.address}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="text-gray-700 font-semibold">
                    Second Token
                  </label>
                  <div className="bg-gray-50 rounded-2xl p-4 border-2 border-transparent focus-within:border-green-200 transition-colors">
                    <TokenSelector selected={tokenB} onSelect={setTokenB} />
                    {tokenB && (
                      <div className="mt-3 text-sm text-gray-600">
                        <div className="font-mono text-xs bg-gray-100 px-2 py-1 rounded">
                          {tokenB.address}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Pair Preview */}
              {tokenA && tokenB && (
                <div className="bg-gradient-to-r from-green-50 to-teal-50 rounded-2xl p-6">
                  <h3 className="font-semibold text-gray-800 mb-4">
                    Pair Preview
                  </h3>
                  <div className="flex items-center justify-center gap-4">
                    <div className="text-center">
                      <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mb-2 shadow-md">
                        <span className="font-bold text-gray-700">
                          {tokenA.symbol.charAt(0)}
                        </span>
                      </div>
                      <div className="font-semibold">{tokenA.symbol}</div>
                    </div>
                    <div className="text-2xl text-gray-400">⚡</div>
                    <div className="text-center">
                      <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mb-2 shadow-md">
                        <span className="font-bold text-gray-700">
                          {tokenB.symbol.charAt(0)}
                        </span>
                      </div>
                      <div className="font-semibold">{tokenB.symbol}</div>
                    </div>
                  </div>
                  <div className="text-center mt-4">
                    <div className="text-lg font-semibold text-gray-800">
                      {tokenA.symbol}/{tokenB.symbol} Trading Pair
                    </div>
                    <div className="text-sm text-gray-600">
                      This will create a new liquidity pool for these tokens
                    </div>
                  </div>
                </div>
              )}

              {/* Create Button */}
              <button
                onClick={handleCreatePair}
                disabled={loading || !tokenA || !tokenB}
                className="w-full bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700 disabled:from-gray-300 disabled:to-gray-400 text-white font-semibold py-4 rounded-2xl transition-all duration-200 shadow-lg hover:shadow-xl disabled:cursor-not-allowed disabled:shadow-none"
              >
                {loading ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Creating Pair...
                  </div>
                ) : !tokenA || !tokenB ? (
                  "Select Both Tokens"
                ) : (
                  `Create ${tokenA.symbol}/${tokenB.symbol} Pair`
                )}
              </button>

              {/* Status Message */}
              {status && (
                <div
                  className={`p-4 rounded-2xl ${
                    status.startsWith("✅")
                      ? "bg-green-50 text-green-700 border border-green-200"
                      : status.startsWith("⏳")
                      ? "bg-blue-50 text-blue-700 border border-blue-200"
                      : "bg-red-50 text-red-700 border border-red-200"
                  }`}
                >
                  <div className="font-medium">{status}</div>
                  {pairAddress && (
                    <div className="mt-2 text-sm">
                      <div className="font-medium">Pair Address:</div>
                      <div className="font-mono text-xs bg-white px-2 py-1 rounded mt-1 break-all">
                        {pairAddress}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Instructions */}
          <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              How It Works
            </h3>
            <div className="space-y-3 text-sm text-gray-600">
              <div className="flex gap-3">
                <span className="text-green-500 font-bold">1.</span>
                <span>Select two tokens to create a trading pair</span>
              </div>
              <div className="flex gap-3">
                <span className="text-green-500 font-bold">2.</span>
                <span>Deploy the pair contract to the blockchain</span>
              </div>
              <div className="flex gap-3">
                <span className="text-green-500 font-bold">3.</span>
                <span>Add initial liquidity to enable trading</span>
              </div>
              <div className="flex gap-3">
                <span className="text-green-500 font-bold">4.</span>
                <span>Earn fees from all trades in your pair</span>
              </div>
            </div>
          </div>

          {/* Requirements */}
          <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              Requirements
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <span className={tokenA ? "text-green-500" : "text-gray-400"}>
                  {tokenA ? "✓" : "○"}
                </span>
                <span>Valid first token selected</span>
              </div>
              <div className="flex items-center gap-2">
                <span className={tokenB ? "text-green-500" : "text-gray-400"}>
                  {tokenB ? "✓" : "○"}
                </span>
                <span>Valid second token selected</span>
              </div>
              <div className="flex items-center gap-2">
                <span
                  className={isConnected ? "text-green-500" : "text-gray-400"}
                >
                  {isConnected ? "✓" : "○"}
                </span>
                <span>Wallet connected</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-gray-400">○</span>
                <span>Sufficient gas for deployment</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Existing Pairs */}
      <div className="mt-8 bg-white rounded-3xl shadow-xl border border-gray-100 p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">
          Existing Trading Pairs
        </h3>
        {existingPairs.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">📦</span>
            </div>
            <p>No trading pairs created yet. Be the first!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {existingPairs.map((pair, i) => (
              <div
                key={i}
                className="bg-gray-50 rounded-2xl p-4 border border-gray-200"
              >
                <div className="text-sm font-semibold text-gray-800 mb-2">
                  Pair #{i + 1}
                </div>
                <div className="font-mono text-xs text-gray-600 break-all">
                  {pair}
                </div>
                <div className="mt-3 flex gap-2">
                  <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">
                    Active
                  </span>
                  <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">
                    Tradeable
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
