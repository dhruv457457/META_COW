"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { tokenList, Token } from "@/utils/tokens";
import { ethers } from "ethers";
import { toast } from "react-hot-toast";
import { ERC20_ABI } from "@/utils/constants";

const FAUCET_ADDRESS = "0x0120A0cE53F9119a997F72657611A4d4AEEA3cB4";

const FAUCET_ABI = [
  "function deposit(address token, uint256 amount) public",
  "function getBalance(address token) view returns (uint256)"
];

export default function FaucetSection() {
  const [selectedToken, setSelectedToken] = useState<Token>(tokenList[0]);
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);

  const handleDeposit = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      toast.error("Enter a valid amount");
      return;
    }

    try {
      if (!window.ethereum) throw new Error("MetaMask not detected");
      
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();

      const tokenContract = new ethers.Contract(selectedToken.address, ERC20_ABI, signer);
      const faucetContract = new ethers.Contract(FAUCET_ADDRESS, FAUCET_ABI, signer);

      const amountWei = ethers.parseUnits(amount, 18);

      setLoading(true);
      toast.loading("Approving tokens...");

      // Approve
      const approveTx = await tokenContract.approve(FAUCET_ADDRESS, amountWei);
      await approveTx.wait();

      toast.dismiss();
      toast.loading("Depositing to faucet...");

      // Deposit
      const depositTx = await faucetContract.deposit(selectedToken.address, amountWei);
      await depositTx.wait();

      toast.dismiss();
      toast.success(`✅ ${amount} ${selectedToken.symbol} deposited!`);
      setAmount("");
    } catch (err: any) {
      console.error(err);
      toast.dismiss();
      toast.error("❌ Deposit failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-3xl shadow-xl border border-gray-100 p-8"
    >
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-gradient-to-r from-green-600 to-teal-600 rounded-xl flex items-center justify-center shadow-lg">
          <span className="text-white text-lg">💧</span>
        </div>
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Faucet Deposit</h2>
          <p className="text-gray-500 text-sm">Fund the faucet for users</p>
        </div>
      </div>

      <div className="space-y-6">
        {/* Token Selector */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">
            Select Token
          </label>
          <select
            value={selectedToken.symbol}
            onChange={(e) => setSelectedToken(tokenList.find((t) => t.symbol === e.target.value)!)}
            className="w-full p-4 rounded-2xl border border-gray-200 bg-gray-50 hover:border-green-300 transition-colors font-semibold text-gray-800 focus:outline-none focus:ring-2 focus:ring-green-200"
          >
            {tokenList.map((token) => (
              <option key={token.address} value={token.symbol}>
                {token.symbol} - {token.address.slice(0, 6)}...{token.address.slice(-4)}
              </option>
            ))}
          </select>
        </div>

        {/* Amount Input */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">
            Amount to Deposit
          </label>
          <input
            type="number"
            placeholder="e.g. 1000"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-full p-4 rounded-2xl border border-gray-200 bg-gray-50 hover:border-green-300 transition-colors text-2xl font-bold placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-green-200"
          />
          <div className="flex gap-2 mt-2">
            {['100', '500', '1000', '5000'].map((preset) => (
              <button
                key={preset}
                onClick={() => setAmount(preset)}
                className="px-3 py-1 bg-gray-100 hover:bg-green-100 text-gray-600 hover:text-green-700 rounded-lg text-sm font-medium transition-colors"
              >
                {preset}
              </button>
            ))}
          </div>
        </div>

        {/* Deposit Button */}
        <motion.button
          whileHover={amount && !loading ? { scale: 1.02 } : {}}
          whileTap={amount && !loading ? { scale: 0.98 } : {}}
          onClick={handleDeposit}
          disabled={loading || !amount}
          className={`w-full py-4 rounded-2xl font-bold text-lg shadow-lg transition-all ${
            amount && !loading
              ? "bg-gradient-to-r from-green-600 to-teal-600 text-white hover:shadow-green-500/30"
              : "bg-gray-200 text-gray-400 cursor-not-allowed shadow-none"
          }`}
        >
          {loading ? (
            <div className="flex items-center justify-center gap-2">
              <div className="w-5 h-5 border-2 border-white/50 border-t-white rounded-full animate-spin" />
              <span>Processing...</span>
            </div>
          ) : (
            `Deposit ${amount || "0"} ${selectedToken.symbol}`
          )}
        </motion.button>
      </div>
    </motion.div>
  );
}