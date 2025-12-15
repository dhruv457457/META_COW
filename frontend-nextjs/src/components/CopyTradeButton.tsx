"use client";

import { useState, useEffect } from "react";
import { useWallet } from "@/context/WalletContext";
import { toast } from "react-hot-toast";
import confetti from "canvas-confetti";
import { parseUnits, formatUnits } from "viem";
import { bscTestnet } from "viem/chains";
import { createClientWalletClient } from "@/lib/smartAccounts/walletClient";

interface CopyTradeButtonProps {
  traderAddress: string;
  traderUsername: string;
  inputToken: string;
  outputToken: string;
  inputAmount: string;
}

// Helper to get token symbol (you can move this to a shared utils file)
const getTokenSymbol = (address: string): string => {
  // Add your token list logic here or import from shared utils
  const knownTokens: Record<string, string> = {
    [process.env.NEXT_PUBLIC_USDC_ADDRESS?.toLowerCase() || ""]: "USDC",
    [process.env.NEXT_PUBLIC_USDT_ADDRESS?.toLowerCase() || ""]: "USDT",
    // Add more tokens as needed
  };
  
  return knownTokens[address.toLowerCase()] || `${address.slice(0, 6)}...`;
};

export default function CopyTradeButton({ 
  traderAddress, 
  traderUsername,
  inputToken,
  outputToken,
  inputAmount
}: CopyTradeButtonProps) {
  const { address, isConnected } = useWallet();
  const [showModal, setShowModal] = useState(false);
  const [dailyLimit, setDailyLimit] = useState("100");
  const [loading, setLoading] = useState(false);
  const [isEnabled, setIsEnabled] = useState(false);
  const [checkingStatus, setCheckingStatus] = useState(false);

  // Format the trade amount for display
  const formattedAmount = formatUnits(BigInt(inputAmount), 18);
  const inputSymbol = getTokenSymbol(inputToken);
  const outputSymbol = getTokenSymbol(outputToken);

  // Check if already copying this trader
  useEffect(() => {
    const checkStatus = async () => {
      if (!address || !traderAddress) return;
      
      setCheckingStatus(true);
      try {
        const res = await fetch(
          `/api/copy-trade/status?userAddress=${address}&traderAddress=${traderAddress}`
        );
        const data = await res.json();
        setIsEnabled(data.isEnabled);
      } catch (err) {
        console.error("Status check failed:", err);
      } finally {
        setCheckingStatus(false);
      }
    };

    checkStatus();
  }, [address, traderAddress]);

  const handleEnableCopyTrade = async () => {
    if (!address) {
      toast.error("Please connect your wallet");
      return;
    }

    // Check if MetaMask Flask is installed
    if (typeof window === "undefined" || !window.ethereum) {
      toast.error("MetaMask Flask is required");
      window.open("https://metamask.io/flask/", "_blank");
      return;
    }

    try {
      setLoading(true);

      // Step 1: Create session account (server-side)
      console.log("Creating session account...");
      const sessionRes = await fetch("/api/sessions/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userAddress: address }),
      });

      if (!sessionRes.ok) {
        const error = await sessionRes.json();
        throw new Error(error.error || "Failed to create session");
      }
      
      const { sessionAccount } = await sessionRes.json();
      console.log("Session account created:", sessionAccount.address);

      // Step 2: Setup wallet client with Advanced Permissions
      console.log("Setting up wallet client...");
      const walletClient = createClientWalletClient();

      // Step 3: Request REAL Advanced Permissions from MetaMask Flask
      const currentTime = Math.floor(Date.now() / 1000);
      const expiry = currentTime + 2592000; // 30 days

      console.log("Requesting Advanced Permissions from MetaMask Flask...");
      toast.loading("Requesting permission from MetaMask Flask...", { id: "permission" });
      
      const grantedPermissions = await walletClient.requestExecutionPermissions([{
        chainId: bscTestnet.id,
        expiry,
        signer: {
          type: "account",
          data: {
            address: sessionAccount.address as `0x${string}`,
          },
        },
        permission: {
          type: "erc20-token-periodic",
          data: {
            tokenAddress: process.env.NEXT_PUBLIC_USDC_ADDRESS as `0x${string}`,
            periodAmount: parseUnits(dailyLimit, 6), // USDC has 6 decimals
            periodDuration: 86400, // 24 hours in seconds
            justification: `Auto-copy trades from ${traderUsername} (max ${dailyLimit} USD/day)`,
          },
        },
        isAdjustmentAllowed: true,
      }]);

      toast.dismiss("permission");
      console.log("✅ Permissions granted!", grantedPermissions);

      // Step 4: Extract permission data
      if (!grantedPermissions[0].signerMeta?.delegationManager) {
        throw new Error("Delegation manager not found in permission response");
      }

      const permission = {
        permissionsContext: grantedPermissions[0].context,
        delegationManager: grantedPermissions[0].signerMeta.delegationManager,
        expiry: expiry,
      };

      // Step 5: Save permission to database
      console.log("Saving permission to database...");
      const saveRes = await fetch("/api/copy-trade/enable", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userAddress: address,
          traderAddress,
          traderUsername,
          permission,
          dailyLimit,
          sessionAccount: sessionAccount.address,
        }),
      });

      if (!saveRes.ok) {
        const error = await saveRes.json();
        throw new Error(error.error || "Failed to save permission");
      }

      console.log("✅ Permission saved to database!");

      toast.success(`🎉 Now auto-copying ${traderUsername}'s trades!`);
      confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 } });
      setShowModal(false);
      setIsEnabled(true);
      
    } catch (err: any) {
      console.error("❌ Copy trade error:", err);
      toast.dismiss("permission");
      
      // Better error messages
      if (err.message?.includes("User rejected") || err.message?.includes("denied")) {
        toast.error("Permission request rejected");
      } else if (err.message?.includes("Flask")) {
        toast.error("Please install MetaMask Flask browser extension");
      } else if (err.code === 4001) {
        toast.error("Permission request cancelled");
      } else {
        toast.error(err.message || "Failed to enable copy trading");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDisable = async () => {
    if (!address) return;

    try {
      setLoading(true);
      
      const res = await fetch("/api/copy-trade/disable", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userAddress: address,
          traderAddress,
        }),
      });

      if (!res.ok) throw new Error("Failed to disable");

      toast.success("Copy trading disabled");
      setIsEnabled(false);
    } catch (err: any) {
      toast.error(err.message || "Failed to disable");
    } finally {
      setLoading(false);
    }
  };

  if (checkingStatus) {
    return (
      <button
        disabled
        className="px-4 py-2 bg-gray-200 text-gray-400 rounded-xl font-bold text-sm"
      >
        Checking...
      </button>
    );
  }

  if (isEnabled) {
    return (
      <button
        onClick={handleDisable}
        disabled={loading}
        className="px-4 py-2 bg-green-100 text-green-700 rounded-xl font-bold hover:bg-green-200 transition-all shadow-sm flex items-center gap-2 text-sm"
      >
        <span>✓</span> Copying {loading && "..."}
      </button>
    );
  }

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className="px-4 py-2 bg-purple-600 text-white rounded-xl font-bold hover:bg-purple-700 transition-all shadow-lg hover:shadow-xl flex items-center gap-2 text-sm"
      >
        <span>🔁</span> Auto Copy
      </button>

      {/* Modal */}
      {showModal && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50"
          onClick={() => setShowModal(false)}
        >
          <div 
            className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-800">
                Copy {traderUsername}'s Trades
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-600 text-2xl"
              >
                ✕
              </button>
            </div>

            {/* Trader Info */}
            <div className="bg-purple-50 p-4 rounded-2xl mb-6">
              <div className="text-center">
                <div className="text-4xl mb-2">👤</div>
                <div className="font-bold text-gray-800">{traderUsername}</div>
                <div className="text-sm text-gray-500 font-mono">
                  {traderAddress.slice(0, 10)}...{traderAddress.slice(-8)}
                </div>
              </div>
            </div>

            {/* Recent Trade Preview */}
            <div className="bg-gradient-to-r from-purple-50 to-blue-50 p-4 rounded-2xl mb-6 border border-purple-200">
              <h3 className="text-xs font-bold text-purple-700 mb-2">📊 RECENT TRADE</h3>
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-gray-600">Swapped</div>
                  <div className="font-bold text-gray-800">
                    {parseFloat(formattedAmount).toFixed(4)} {inputSymbol}
                  </div>
                </div>
                <div className="text-2xl text-purple-500">→</div>
                <div>
                  <div className="text-sm text-gray-600">For</div>
                  <div className="font-bold text-gray-800">{outputSymbol}</div>
                </div>
              </div>
            </div>

            {/* Daily Limit Input */}
            <div className="mb-6">
              <label className="block text-sm font-bold text-gray-700 mb-2">
                Daily Spending Limit (USD)
              </label>
              <input
                type="number"
                value={dailyLimit}
                onChange={(e) => setDailyLimit(e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-none transition-all text-lg"
                placeholder="100"
                min="1"
              />
              <p className="text-sm text-gray-500 mt-2">
                Maximum you'll spend per day copying {traderUsername}
              </p>
            </div>

            {/* Flask Warning */}
            <div className="bg-orange-50 p-4 rounded-xl mb-6 border border-orange-200">
              <div className="text-sm text-orange-800">
                ⚠️ <strong>MetaMask Flask Required:</strong> This uses Advanced Permissions. 
                <a 
                  href="https://metamask.io/flask/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="underline ml-1 font-bold"
                >
                  Install Flask →
                </a>
              </div>
            </div>

            {/* How It Works */}
            <div className="bg-blue-50 p-4 rounded-xl mb-6 border border-blue-200">
              <h3 className="font-bold text-blue-900 mb-2">⚡ How it works:</h3>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>✅ Grant permission ONCE in MetaMask Flask</li>
                <li>✅ Trades execute automatically (no popups!)</li>
                <li>✅ Daily limit enforced on-chain</li>
                <li>✅ Revoke anytime from this button</li>
              </ul>
            </div>

            {/* Example */}
            <div className="bg-gray-50 p-4 rounded-xl mb-6">
              <h4 className="text-sm font-bold text-gray-700 mb-2">📊 Example:</h4>
              <p className="text-sm text-gray-600">
                If {traderUsername} swaps ${parseFloat(formattedAmount).toFixed(2)}, you'll copy with your ${dailyLimit} daily limit
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 px-6 py-3 border-2 border-gray-200 text-gray-700 rounded-xl font-bold hover:bg-gray-50 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleEnableCopyTrade}
                disabled={loading || !dailyLimit || parseFloat(dailyLimit) <= 0}
                className="flex-1 px-6 py-3 bg-purple-600 text-white rounded-xl font-bold hover:bg-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
              >
                {loading ? "Setting up..." : "Enable Copy Trading →"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}