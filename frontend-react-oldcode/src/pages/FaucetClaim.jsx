import { useState, useEffect } from "react";
import { ethers } from "ethers";
import { useWallet } from "../contexts/WalletContext";
import { toast } from "react-hot-toast";
import { motion } from "framer-motion";
import { tokenList } from "../utils/constants";

const FAUCET_ADDRESS = "0xD1504b93610AaA68C1F93165120b7b2B906ae9A8";

const FAUCET_ABI = [
  "function claim(address token) external",
  "function timeUntilNextClaim(address user, address token) external view returns (uint256)",
];

const addTokenToWallet = async (token) => {
  if (!window.ethereum) return;

  try {
    const wasAdded = await window.ethereum.request({
      method: "wallet_watchAsset",
      params: {
        type: "ERC20",
        options: {
          address: token.address,
          symbol: token.symbol,
          decimals: token.decimals || 18,
          image: token.logoURI || "",
        },
      },
    });

    if (wasAdded) toast.success(`${token.symbol} added to wallet ✅`);
    else toast.error("Token addition rejected.");
  } catch (err) {
    console.error("MetaMask watchAsset error:", err);
    toast.error("Failed to add token to wallet.");
  }
};

export default function FaucetClaim() {
  const { walletData } = useWallet();
  const address = walletData?.address;
  const [selectedToken, setSelectedToken] = useState(tokenList[0]);
  const [cooldown, setCooldown] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchCooldown = async () => {
    if (!window.ethereum || !address) return;
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const contract = new ethers.Contract(FAUCET_ADDRESS, FAUCET_ABI, provider);
      const remaining = await contract.timeUntilNextClaim(address, selectedToken.address);
      setCooldown(Number(remaining));
    } catch (err) {
      console.error("Cooldown fetch failed:", err);
    }
  };

  useEffect(() => {
    fetchCooldown();
  }, [selectedToken, address]);

  const handleClaim = async () => {
    if (!window.ethereum || !address) return;
    try {
      setLoading(true);
      toast.loading("Claiming tokens...");
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(FAUCET_ADDRESS, FAUCET_ABI, signer);
      const tx = await contract.claim(selectedToken.address);
      await tx.wait();
      toast.dismiss();
      toast.success(`🎉 Claimed 10 ${selectedToken.symbol}`);
      fetchCooldown();
    } catch (err) {
      toast.dismiss();
      toast.error("❌ Claim failed or already claimed");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (seconds) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const sec = seconds % 60;
    return `${hrs}h ${mins}m ${sec}s`;
  };

  if (!address) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center"
        >
          <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-8 border border-white/20">
            <div className="w-16 h-16 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-6">
              <span className="text-2xl">🔗</span>
            </div>
            <h2 className="text-2xl font-bold text-slate-800 mb-4">
              Connect Your Wallet
            </h2>
            <p className="text-slate-600 max-w-md">
              Connect your wallet to claim free tokens from the MetaCow Faucet
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

        <div className="relative z-10 max-w-4xl mx-auto px-6 ">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-12"
          >
            <h1 className="text-5xl md:text-6xl font-black mb-6">
              <span className="bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-600 bg-clip-text text-transparent">
                MetaCow
              </span>
              <span className="text-slate-800"> Faucet</span>
            </h1>
         
          </motion.div>

          {/* Main Faucet Card */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.8 }}
            className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl border border-white/20 p-8"
          >
            <div className="flex items-center gap-3 mb-8">
              <div className="w-12 h-12 bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl flex items-center justify-center">
                <span className="text-white text-xl">🐄</span>
              </div>
              <div>
                <h2 className="text-3xl font-bold text-slate-800">Token Faucet</h2>
                <p className="text-slate-600">Get free tokens for testing</p>
              </div>
            </div>

            {/* Token Selection and Status */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3, duration: 0.6 }}
                className="space-y-3"
              >
                <label className="text-slate-700 font-semibold text-sm uppercase tracking-wide">
                  Select Token
                </label>
                <div className="relative">
                  <select
                    className="w-full p-4 rounded-2xl border-2 border-slate-200 focus:border-purple-300 focus:ring-2 focus:ring-purple-200 bg-white/50 backdrop-blur-sm transition-all duration-300 font-medium"
                    value={selectedToken.symbol}
                    onChange={(e) =>
                      setSelectedToken(tokenList.find((t) => t.symbol === e.target.value))
                    }
                  >
                    {tokenList.map((token) => (
                      <option key={token.symbol} value={token.symbol}>
                        {token.symbol}
                      </option>
                    ))}
                  </select>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4, duration: 0.6 }}
                className="space-y-3"
              >
                <label className="text-slate-700 font-semibold text-sm uppercase tracking-wide">
                  Status
                </label>
                <div className="p-4 rounded-2xl border-2 border-slate-200 bg-white/50 backdrop-blur-sm">
                  {cooldown === null ? (
                    <div className="flex items-center gap-2 text-slate-600">
                      <div className="w-4 h-4 border-2 border-slate-400 border-t-transparent rounded-full animate-spin"></div>
                      <span>Checking cooldown...</span>
                    </div>
                  ) : cooldown === 0 ? (
                    <div className="flex items-center gap-2 text-green-600 font-semibold">
                      <span className="w-3 h-3 bg-green-500 rounded-full"></span>
                      <span>Ready to claim 10 {selectedToken.symbol}!</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-orange-600 font-medium">
                      <span className="w-3 h-3 bg-orange-500 rounded-full animate-pulse"></span>
                      <span>Cooldown: {formatTime(cooldown)}</span>
                    </div>
                  )}
                </div>
              </motion.div>
            </div>

            {/* Claim Button */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.6 }}
              className="mb-8"
            >
              <motion.button
                whileHover={cooldown === 0 && !loading ? { scale: 1.02, y: -2 } : {}}
                whileTap={cooldown === 0 && !loading ? { scale: 0.98 } : {}}
                onClick={handleClaim}
                disabled={cooldown > 0 || loading}
                className={`w-full py-4 rounded-2xl font-bold text-lg transition-all duration-300 shadow-lg ${
                  cooldown > 0 || loading
                    ? "bg-gradient-to-r from-slate-200 via-slate-300 to-slate-400 text-slate-500 cursor-not-allowed"
                    : "bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-600 hover:from-purple-700 hover:via-blue-700 hover:to-indigo-700 text-white hover:shadow-xl"
                }`}
              >
                {loading ? (
                  <div className="flex items-center justify-center gap-3">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Claiming tokens...</span>
                  </div>
                ) : (
                  <div className="flex items-center justify-center gap-2">
                    <span className="text-xl">🎁</span>
                    <span>Claim 10 {selectedToken.symbol}</span>
                  </div>
                )}
              </motion.button>
            </motion.div>

            {/* Divider */}
            <div className="border-t border-slate-200 mb-8"></div>

            {/* Add to Wallet Section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.6 }}
              className="text-center"
            >
              <div className="bg-gradient-to-r from-slate-50 to-blue-50 rounded-2xl p-6 border border-slate-200/50">
                <h3 className="text-lg font-semibold text-slate-800 mb-2">
                  Add to MetaMask
                </h3>
                <p className="text-slate-600 mb-4 text-sm">
                  Want to see {selectedToken.symbol} in your wallet?
                </p>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => addTokenToWallet(selectedToken)}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 transition-all duration-300 shadow-lg hover:shadow-xl"
                >
                  <span>🦊</span>
                  <span>Add {selectedToken.symbol} to MetaMask</span>
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
{/* Testnet BNB Faucet */}
<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ delay: 0.7, duration: 0.6 }}
  className="text-center mt-12"
>
  <div className="bg-gradient-to-r from-yellow-50 via-white to-yellow-100 rounded-2xl p-6 border border-yellow-200 shadow-inner">
    <h3 className="text-lg font-semibold text-yellow-800 mb-2">
      Need Testnet BNB for Gas?
    </h3>
    <p className="text-yellow-700 mb-4 text-sm">
      Claim free BNB for gas fees on Binance Smart Chain Testnet.
    </p>
    <motion.a
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      target="_blank"
      rel="noopener noreferrer"
      href="https://testnet.bnbchain.org/faucet-smart"
      className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-yellow-400 via-yellow-500 to-yellow-600 hover:via-yellow-600 hover:to-yellow-700 transition-all duration-300 shadow-lg hover:shadow-xl"
    >
      <span>🔶</span>
      <span>Claim Testnet BNB</span>
    </motion.a>
  </div>
</motion.div>

         
        </div>
      </section>
    </div>
  );
}