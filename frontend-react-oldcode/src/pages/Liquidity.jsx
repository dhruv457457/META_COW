import { useEffect, useState } from "react";
import { ethers } from "ethers";
import { useWallet } from "../contexts/WalletContext";
import { motion } from "framer-motion";
import LiquidityForm from "../components/liquidity/LiquidityForm";
import LiquiditySidebar from "../components/liquidity/LiquiditySidebar";
import TransactionList from "../components/TransactionList";
import { getPairAddress, getLPBalance, claimRewards } from "../utils/contractUtils";
import { getUserTransactions } from "../utils/transactionLog";
import { showSuccess, showError } from "../utils/toast";
import { tokenList } from "../utils/constants";

export default function Liquidity() {
  const { walletData } = useWallet();
  const address = walletData?.address;
  const signer = walletData?.signer;
  const isConnected = !!address;

  const DEFAULT_TOKENS = {
    TKA: tokenList.find((t) => t.symbol === "TKA"),
    TKB: tokenList.find((t) => t.symbol === "TKB"),
  };

  const [tokenA, setTokenA] = useState(DEFAULT_TOKENS.TKA);
  const [tokenB, setTokenB] = useState(DEFAULT_TOKENS.TKB);
  const [amountA, setAmountA] = useState("");
  const [amountB, setAmountB] = useState("");
  const [amountLP, setAmountLP] = useState("");
  const [pairAddress, setPairAddress] = useState(null);
  const [lpBalance, setLpBalance] = useState("0.0");
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchDetails = async () => {
      if (!tokenA || !tokenB || !address) return;
      try {
        const pair = await getPairAddress(tokenA.address, tokenB.address);
        if (!pair || pair === ethers.ZeroAddress) return;
        setPairAddress(pair);

        const lp = await getLPBalance(pair, address);
        setLpBalance(lp);

        const txs = await getUserTransactions(pair, address);
        setTransactions(txs);
      } catch (err) {
        console.error("Error fetching pair details:", err);
      }
    };

    fetchDetails();
  }, [tokenA, tokenB, address]);

  const refetchTransactionsAndLP = async () => {
    if (!pairAddress || !address) return;
    const lp = await getLPBalance(pairAddress, address);
    setLpBalance(lp);

    try {
      const txs = await getUserTransactions(pairAddress, address);
      setTransactions(txs);
    } catch (err) {
      console.warn("Failed to refresh transactions:", err);
    }
  };

  const handleClaim = async () => {
    if (!pairAddress) return;
    try {
      setLoading(true);
      showSuccess("Claiming rewards...");
      await claimRewards(pairAddress);
      await refetchTransactionsAndLP();
      showSuccess("Rewards successfully claimed!");
    } catch (err) {
      console.error("Claim failed:", err);
      showError("Reward claim failed.");
    } finally {
      setLoading(false);
    }
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
          <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-8 border border-white/20">
            <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-6">
              <span className="text-2xl">💧</span>
            </div>
            <h2 className="text-2xl font-bold text-slate-800 mb-4">
              Connect Your Wallet
            </h2>
            <p className="text-slate-600 max-w-md">
              Connect your wallet to provide liquidity and earn rewards on MetaCow DEX
            </p>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-20 -left-20 w-96 h-96 bg-blue-400/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-20 -right-20 w-96 h-96 bg-purple-400/10 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-6 py-16">
        {/* Main Content Grid - RESTRUCTURED */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          
          {/* == Left Column (Main Content) == */}
          <div className="xl:col-span-2 space-y-8">
            {/* 1. Liquidity Form Card */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2, duration: 0.8 }}
            >
              <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl border border-white/20 p-8">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
                    <span className="text-white text-xl">💧</span>
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-slate-800">Add Liquidity</h2>
                    <p className="text-slate-600 text-sm">Provide tokens to earn fees</p>
                  </div>
                </div>
                <LiquidityForm
                  tokenA={tokenA}
                  setTokenA={setTokenA}
                  tokenB={tokenB}
                  setTokenB={setTokenB}
                  amountA={amountA}
                  setAmountA={setAmountA}
                  amountB={amountB}
                  setAmountB={setAmountB}
                  amountLP={amountLP}
                  setAmountLP={setAmountLP}
                  lpBalance={lpBalance}
                  pairAddress={pairAddress}
                  signer={signer}
                  address={address}
                  loading={loading}
                  setLoading={setLoading}
                  onTxUpdate={refetchTransactionsAndLP}
                />
              </div>
            </motion.div>

            {/* 2. Transactions Card */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.8 }}
            >
              <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl border border-white/20 p-8">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-12 h-12 bg-gradient-to-r from-orange-500 to-red-500 rounded-xl flex items-center justify-center">
                    <span className="text-white text-xl">📋</span>
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-slate-800">Recent Transactions</h2>
                    <p className="text-slate-600 text-sm">Your liquidity activity</p>
                  </div>
                </div>
                <TransactionList userAddress={address} transactions={transactions} />
              </div>
            </motion.div>
          </div>

          {/* == Right Column (Sidebar) == */}
          <div className="xl:col-span-1">
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3, duration: 0.8 }}
              className="sticky top-8" // Makes the sidebar stick on scroll
            >
              {/* The sidebar component now lives here directly */}
              <LiquiditySidebar
                lpBalance={lpBalance}
                pairAddress={pairAddress}
                address={address}
                onClaim={handleClaim}
              />
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}