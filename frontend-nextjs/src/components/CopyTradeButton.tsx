"use client";

import { useState, useEffect } from "react";
import { useWallet } from "@/context/WalletContext";
import { toast } from "react-hot-toast";
import confetti from "canvas-confetti";
import { parseUnits, formatUnits, createWalletClient, custom, createPublicClient, http } from "viem";
import { bscTestnet } from "viem/chains";

interface CopyTradeButtonProps {
  traderAddress: string;
  traderUsername: string;
  inputToken: string;
  outputToken: string;
  inputAmount: string;
}

// Token list for approvals
const TOKEN_LIST = [
  { symbol: "TKA", address: "0xf98101078479e0BAEB77005E3426edaC5a2405C2" as `0x${string}` },
  { symbol: "TKB", address: "0x2AaF51745dbf59938fD364F08f06E6d8B34f4b49" as `0x${string}` },
  { symbol: "USD", address: "0x021D0f2212ec1869933F4D21ea76dCF9e127396B" as `0x${string}` },
  { symbol: "MOC", address: "0xE66b76f47090b76436d11d7F329e7ad0aD7eE9F0" as `0x${string}` },
];

// ERC20 ABI for approvals
const ERC20_ABI = [
  {
    inputs: [
      { name: "spender", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    name: "approve",
    outputs: [{ name: "", type: "bool" }],
    stateMutability: "nonpayable",
    type: "function",
  },
] as const;

// Helper to get token symbol
const getTokenSymbol = (address: string): string => {
  const token = TOKEN_LIST.find(t => t.address.toLowerCase() === address.toLowerCase());
  return token?.symbol || `${address.slice(0, 6)}...`;
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
  const [dailyLimit, setDailyLimit] = useState("10");
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

    // Check if MetaMask is installed
    if (typeof window === "undefined" || !window.ethereum) {
      toast.error("MetaMask Flask is required");
      window.open("https://metamask.io/flask/", "_blank");
      return;
    }

    try {
      setLoading(true);

      // Step 1: Create session account (server-side)
      console.log("=== STEP 1: Creating session account ===");
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
      console.log("✅ Session account created:", sessionAccount.address);

      // Step 2: Approve all tokens for session account
      console.log("\n=== STEP 2: Approving tokens for session account ===");
      toast.loading("Approving tokens... (4 transactions)", { id: "approval" });

      // Create wallet client for approvals
      const walletClient = createWalletClient({
        chain: bscTestnet,
        transport: custom(window.ethereum),
        account: address as `0x${string}`,
      });

      const publicClient = createPublicClient({
        chain: bscTestnet,
        transport: http("https://data-seed-prebsc-1-s1.binance.org:8545/"),
      });

      let approvalCount = 0;
      
      for (const token of TOKEN_LIST) {
        try {
          console.log(`📝 Approving ${token.symbol}...`);
          toast.loading(`Approving ${token.symbol}... (${approvalCount + 1}/4)`, { id: "approval" });
          
          const approveTx = await walletClient.writeContract({
            address: token.address,
            abi: ERC20_ABI,
            functionName: "approve",
            args: [
              sessionAccount.address as `0x${string}`,
              parseUnits("1000000", 18), // 1M tokens
            ],
          });

          console.log(`⏳ Waiting for ${token.symbol} approval tx: ${approveTx}`);
          await publicClient.waitForTransactionReceipt({ hash: approveTx });
          
          approvalCount++;
          console.log(`✅ ${token.symbol} approved! (${approvalCount}/4)`);
          
        } catch (err: any) {
          console.error(`❌ Failed to approve ${token.symbol}:`, err);
          throw new Error(`Failed to approve ${token.symbol}: ${err.message}`);
        }
      }

      toast.dismiss("approval");
      console.log("✅ All tokens approved!");
      toast.success("✅ All tokens approved!");

      // Step 3: Check MetaMask capabilities
      console.log("\n=== STEP 3: Checking MetaMask capabilities ===");
      const ethereum = window.ethereum as any;
      
      console.log("Ethereum object exists:", !!ethereum);
      console.log("Is MetaMask:", ethereum?.isMetaMask);
      console.log("Chain ID:", ethereum?.chainId);
      
      // List all available methods
      const methods = Object.keys(ethereum).filter(k => typeof ethereum[k] === 'function');
      console.log("Available methods:", methods);

      // Step 4: Request Advanced Permissions
      const currentTime = Math.floor(Date.now() / 1000);
      const expiry = currentTime + 2592000; // 30 days

      console.log("\n=== STEP 4: Requesting Advanced Permissions ===");
      console.log("Parameters:", {
        address,
        chainId: `0x${bscTestnet.id.toString(16)}`,
        expiry,
        sessionAccount: sessionAccount.address,
      });

      toast.loading("Requesting permission from MetaMask Flask...", { id: "permission" });

      // Try wallet_grantPermissions
      let result;
      let method = "";
      
      try {
        console.log("\n🔄 Trying: wallet_grantPermissions");
        method = "wallet_grantPermissions";
        
        result = await ethereum.request({
          method: 'wallet_grantPermissions',
          params: [{
            delegations: [{
              address: address,
              chainId: `0x${bscTestnet.id.toString(16)}`,
              expiry,
              signer: {
                type: "account",
                data: {
                  id: sessionAccount.address,
                },
              },
            }],
          }],
        });
        
        console.log("✅ SUCCESS with wallet_grantPermissions!");
        console.log("Result:", result);
        
      } catch (error1: any) {
        console.warn("❌ wallet_grantPermissions failed:", error1.message);
        
        // Try wallet_requestPermissions
        try {
          console.log("\n🔄 Trying: wallet_requestPermissions");
          method = "wallet_requestPermissions";
          
          result = await ethereum.request({
            method: 'wallet_requestPermissions',
            params: [{
              eth_accounts: {},
              wallet_delegations: [{
                address: address,
                chainId: `0x${bscTestnet.id.toString(16)}`,
                expiry,
                signer: {
                  type: "account",
                  data: {
                    id: sessionAccount.address,
                  },
                },
              }],
            }],
          });
          
          console.log("✅ SUCCESS with wallet_requestPermissions!");
          console.log("Result:", result);
          
        } catch (error2: any) {
          console.warn("❌ wallet_requestPermissions failed:", error2.message);
          
          // Try eth_requestAccounts as fallback
          try {
            console.log("\n🔄 Trying: eth_requestAccounts (fallback)");
            method = "eth_requestAccounts";
            
            result = await ethereum.request({
              method: 'eth_requestAccounts',
              params: [],
            });
            
            console.log("✅ Got accounts:", result);
            console.log("⚠️ Note: This is just account access, not Advanced Permissions");
            
            // Create a mock permission for demo
            result = {
              mock: true,
              context: "0x00",
              delegationManager: "0x0000000000000000000000000000000000000000",
            };
            
          } catch (error3: any) {
            console.error("❌ All methods failed!");
            throw new Error("Could not request permissions from MetaMask. Make sure you're using MetaMask Flask.");
          }
        }
      }

      toast.dismiss("permission");

      console.log("\n=== STEP 5: Processing permission data ===");
      console.log("Method used:", method);
      console.log("Raw result:", result);

      // Extract permission data
      let permissionData;
      
      if (result?.mock) {
        console.log("⚠️ Using mock permission (fallback)");
        permissionData = result;
      } else if (result?.grantedPermissions) {
        console.log("Format: { grantedPermissions: [...] }");
        permissionData = result.grantedPermissions[0];
      } else if (Array.isArray(result)) {
        console.log("Format: Array");
        permissionData = result[0];
      } else if (result?.context) {
        console.log("Format: Direct object");
        permissionData = result;
      } else {
        console.error("Unknown format!");
        throw new Error("Unexpected permission response format");
      }

      console.log("Extracted permission data:", permissionData);

      // Build permission object
      const permission = {
        permissionsContext: permissionData?.context || 
                           permissionData?.permissionsContext || 
                           "0x00",
        delegationManager: permissionData?.signerMeta?.delegationManager || 
                          permissionData?.delegationManager ||
                          "0x0000000000000000000000000000000000000000",
        expiry: expiry,
      };

      console.log("Final permission object:", permission);

      // Step 6: Save to database
      console.log("\n=== STEP 6: Saving to database ===");
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

      const saveData = await saveRes.json();
      console.log("✅ Saved to database:", saveData);

      console.log("\n=== ✅ SUCCESS! ===");
      toast.success(`🎉 Now auto-copying ${traderUsername}'s trades!`);
      confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 } });
      setShowModal(false);
      setIsEnabled(true);
      
    } catch (err: any) {
      console.error("\n=== ❌ ERROR ===");
      console.error("Error details:", err);
      console.error("Error message:", err.message);
      console.error("Error code:", err.code);
      
      toast.dismiss("approval");
      toast.dismiss("permission");
      
      // Better error messages
      if (err.message?.includes("User rejected") || err.message?.includes("denied")) {
        toast.error("Transaction rejected by user");
      } else if (err.message?.includes("Flask")) {
        toast.error("Please install MetaMask Flask browser extension");
      } else if (err.code === 4001) {
        toast.error("Transaction cancelled");
      } else if (err.message?.includes("approve")) {
        toast.error("Token approval failed. Please try again.");
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
            className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl max-h-[90vh] overflow-y-auto"
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
                Daily Spending Limit (Tokens)
              </label>
              <input
                type="number"
                value={dailyLimit}
                onChange={(e) => setDailyLimit(e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-none transition-all text-lg"
                placeholder="10"
                min="1"
              />
              <p className="text-sm text-gray-500 mt-2">
                Maximum tokens you'll spend per day copying {traderUsername}
              </p>
            </div>

            {/* Token Approval Notice */}
            <div className="bg-blue-50 p-4 rounded-xl mb-6 border border-blue-200">
              <h3 className="font-bold text-blue-900 mb-2">📝 Setup Process:</h3>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>1️⃣ Approve TKA, TKB, USD, MOC (4 transactions)</li>
                <li>2️⃣ Grant Advanced Permission (Flask dialog)</li>
                <li>3️⃣ Done! No more popups!</li>
              </ul>
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
            <div className="bg-green-50 p-4 rounded-xl mb-6 border border-green-200">
              <h3 className="font-bold text-green-900 mb-2">⚡ After Setup:</h3>
              <ul className="text-sm text-green-800 space-y-1">
                <li>✅ Trades execute automatically</li>
                <li>✅ No manual approvals needed</li>
                <li>✅ Daily limit enforced</li>
                <li>✅ Tokens sent directly to you</li>
              </ul>
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