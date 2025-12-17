"use client";

import { useState, useEffect } from "react";
import { useWallet } from "@/context/WalletContext";
import { toast } from "react-hot-toast";
import confetti from "canvas-confetti";
import { 
  parseUnits, 
  formatUnits, 
  createWalletClient, 
  custom, 
  createPublicClient, 
  http,
  type Address,
  type WalletClient,
  type PublicClient,
  type Chain
} from "viem";
import { bscTestnet } from "viem/chains";

// ✅ Type-safe import for MetaMask Smart Accounts
import { erc7715ProviderActions } from "@metamask/smart-accounts-kit/actions";

interface CopyTradeButtonProps {
  traderAddress: string;
  traderUsername: string;
  inputToken: string;
  outputToken: string;
  inputAmount: string;
}

interface TokenInfo {
  symbol: string;
  address: Address;
}

interface SessionAccount {
  address: string;
  privateKey?: string;
}

interface PermissionRequest {
  chainId: number;
  expiry: number;
  signer: {
    type: string;
    data: {
      address: string;
    };
  };
  permission: {
    type: string;
    data: {
      tokenAddress: Address;
      periodAmount: bigint;
      periodDuration: number;
      startTime: number;
      justification: string;
    };
  };
  isAdjustmentAllowed: boolean;
}

interface GrantedPermission {
  context: string;
  signerMeta: {
    delegationManager: string;
  };
}

// Token list for approvals
const TOKEN_LIST: TokenInfo[] = [
  { symbol: "TKA", address: "0xf98101078479e0BAEB77005E3426edaC5a2405C2" },
  { symbol: "TKB", address: "0x2AaF51745dbf59938fD364F08f06E6d8B34f4b49" },
  { symbol: "USD", address: "0x021D0f2212ec1869933F4D21ea76dCF9e127396B" },
  { symbol: "MOC", address: "0xE66b76f47090b76436d11d7F329e7ad0aD7eE9F0" },
];

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

const getTokenSymbol = (address: string): string => {
  const token = TOKEN_LIST.find(
    (t) => t.address.toLowerCase() === address.toLowerCase()
  );
  return token?.symbol || `${address.slice(0, 6)}...`;
};

const isValidAddress = (address: string): address is Address => {
  return /^0x[a-fA-F0-9]{40}$/.test(address);
};

export default function CopyTradeButton({ 
  traderAddress, 
  traderUsername,
  inputToken,
  outputToken,
  inputAmount
}: CopyTradeButtonProps) {
  const { address } = useWallet();
  const [showModal, setShowModal] = useState(false);
  const [dailyLimit, setDailyLimit] = useState("10");
  const [loading, setLoading] = useState(false);
  const [isEnabled, setIsEnabled] = useState(false);
  const [checkingStatus, setCheckingStatus] = useState(false);

  const formattedAmount = formatUnits(BigInt(inputAmount), 18);
  const inputSymbol = getTokenSymbol(inputToken);
  const outputSymbol = getTokenSymbol(outputToken);

  // 1. Check if already copying
  useEffect(() => {
    const checkStatus = async () => {
      if (!address || !traderAddress) return;
      setCheckingStatus(true);
      try {
        const res = await fetch(
          `/api/copy-trade/status?userAddress=${address}&traderAddress=${traderAddress}&inputToken=${inputToken}`
        );
        const data = await res.json();
        setIsEnabled(data.isEnabled || false);
      } catch (err) {
        console.error("Status check failed:", err);
      } finally {
        setCheckingStatus(false);
      }
    };
    checkStatus();
  }, [address, traderAddress, inputToken]);

  // 2. Main Setup Logic
  const handleEnableCopyTrade = async () => {
    if (!address) {
      toast.error("Please connect your wallet");
      return;
    }

    if (!isValidAddress(address)) {
      toast.error("Invalid wallet address");
      return;
    }

    if (!isValidAddress(inputToken)) {
      toast.error("Invalid input token address");
      return;
    }

    if (typeof window === "undefined" || !window.ethereum) {
      toast.error("MetaMask Flask is required");
      window.open("https://metamask.io/flask/", "_blank");
      return;
    }

    try {
      setLoading(true);

      // --- STEP A: Create Session Account (Server-Side) ---
      console.log("=== STEP 1: Creating session account ===");
      const sessionRes = await fetch("/api/sessions/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userAddress: address }),
      });

      if (!sessionRes.ok) {
        const errorData = await sessionRes.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to create session");
      }

      const { sessionAccount }: { sessionAccount: SessionAccount } = await sessionRes.json();
      
      if (!sessionAccount?.address || !isValidAddress(sessionAccount.address)) {
        throw new Error("Invalid session account address received");
      }

      console.log("✅ Session account:", sessionAccount.address);

      // --- STEP B: Approve Tokens (Standard ERC-20) ---
      console.log("\n=== STEP 2: Approving tokens ===");
      toast.loading("Approving tokens...", { id: "approval" });

      // Create wallet client with proper typing
      const baseWalletClient = createWalletClient({
        chain: bscTestnet,
        transport: custom(window.ethereum),
        account: address,
      });

      // Extend with ERC-7715 actions
      const walletClient = baseWalletClient.extend(erc7715ProviderActions());

      const publicClient: PublicClient = createPublicClient({
        chain: bscTestnet,
        transport: http("https://data-seed-prebsc-1-s1.binance.org:8545/"),
      });

      // Approve the input token
      try {
        const approveTx = await baseWalletClient.writeContract({
          address: inputToken,
          abi: ERC20_ABI,
          functionName: "approve",
          args: [sessionAccount.address as Address, parseUnits("1000000", 18)],
        });
        
        console.log("Approval transaction:", approveTx);
        await publicClient.waitForTransactionReceipt({ hash: approveTx });
        console.log("✅ Input token approved");
      } catch (e) {
        console.error("Approval error:", e);
        toast.error("Token approval failed");
        throw e;
      }
      
      toast.dismiss("approval");

      // --- STEP C: Request Advanced Permissions (ERC-7715) ---
      console.log("\n=== STEP 3: Requesting Advanced Permissions ===");
      toast.loading("Please sign the permission in MetaMask Flask...", { id: "permission" });

      const currentTime = Math.floor(Date.now() / 1000);
      const expiry = currentTime + 2592000; // 30 days

      const permissionRequest: PermissionRequest = {
        chainId: bscTestnet.id,
        expiry,
        signer: {
          type: "account",
          data: {
            address: sessionAccount.address,
          },
        },
        permission: {
          type: "erc20-token-periodic",
          data: {
            tokenAddress: inputToken,
            periodAmount: parseUnits(dailyLimit, 18),
            periodDuration: 86400, // 1 Day
            startTime: currentTime,
            justification: `Allow CopyBot to spend up to ${dailyLimit} ${inputSymbol}/day to copy ${traderUsername}`,
          },
        },
        isAdjustmentAllowed: true,
      };

      // Call the Kit Action - type assertion for the extended client
      const grantedPermissions = await (walletClient as any).requestExecutionPermissions([
        permissionRequest,
      ]);

      console.log("✅ Permissions Granted:", grantedPermissions);

      if (!grantedPermissions || grantedPermissions.length === 0) {
        throw new Error("Permission request denied or failed");
      }

      // --- STEP D: Save to Database ---
      const permissionData: GrantedPermission = grantedPermissions[0];
      
      const permissionToSave = {
        permissionsContext: permissionData.context,
        delegationManager: permissionData.signerMeta?.delegationManager || "",
        expiry: expiry,
      };

      const saveRes = await fetch("/api/copy-trade/enable", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userAddress: address,
          traderAddress,
          traderUsername,
          inputToken, // ✅ NEW: Pass the token address
          permission: permissionToSave,
          dailyLimit,
          sessionAccount: sessionAccount.address,
        }),
      });

      if (!saveRes.ok) {
        const errorData = await saveRes.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to save permission");
      }

      toast.success(`🎉 Now auto-copying ${traderUsername}!`);
      confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 } });
      setShowModal(false);
      setIsEnabled(true);

    } catch (err: any) {
      console.error("Error:", err);
      if (err.message?.includes("User rejected") || err.message?.includes("denied")) {
        toast.error("You rejected the permission request");
      } else {
        toast.error(err.message || "Setup failed");
      }
    } finally {
      setLoading(false);
      toast.dismiss("permission");
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
          inputToken // ✅ NEW: Pass token to disable specific permission
        }),
      });
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to disable");
      }
      toast.success("Copy trading disabled");
      setIsEnabled(false);
    } catch (err: any) {
      console.error("Disable error:", err);
      toast.error(err.message || "Failed to disable");
    } finally {
      setLoading(false);
    }
  };

  if (checkingStatus) {
    return (
      <button 
        disabled 
        className="px-4 py-2 bg-gray-200 text-gray-400 rounded-xl font-bold text-sm cursor-not-allowed"
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
        className="px-4 py-2 bg-green-100 text-green-700 rounded-xl font-bold hover:bg-green-200 transition-all shadow-sm flex items-center gap-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
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
                Copy {traderUsername}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-600 text-2xl"
                aria-label="Close modal"
              >
                ✕
              </button>
            </div>

            {/* Info Card */}
            <div className="bg-purple-50 p-4 rounded-2xl mb-6">
              <div className="text-center">
                <div className="text-4xl mb-2">👤</div>
                <div className="font-bold text-gray-800">{traderUsername}</div>
                <div className="text-sm text-gray-500 font-mono">
                  {traderAddress.slice(0, 6)}...{traderAddress.slice(-4)}
                </div>
              </div>
            </div>

            {/* Daily Limit Input */}
            <div className="mb-6">
              <label className="block text-sm font-bold text-gray-700 mb-2">
                Daily Spending Limit ({inputSymbol})
              </label>
              <input
                type="number"
                value={dailyLimit}
                onChange={(e) => setDailyLimit(e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-none transition-all text-lg"
                placeholder="10"
                min="0.1"
                step="0.1"
              />
              <p className="text-sm text-gray-500 mt-2">
                The bot will stop copying if this limit is reached in 24h.
              </p>
            </div>

            {/* Info Box */}
            <div className="bg-blue-50 p-4 rounded-xl mb-6 border border-blue-200">
              <h3 className="font-bold text-blue-900 mb-2">🚀 Powered by MetaMask Flask</h3>
              <ul className="text-sm text-blue-800 space-y-1 list-disc pl-4">
                <li>Non-custodial: You keep your funds.</li>
                <li>Secure: You sign a specific permission.</li>
                <li>Automated: Bot trades for you instantly.</li>
              </ul>
            </div>

            {/* Buttons */}
            <div className="flex gap-3">
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 px-6 py-3 border-2 border-gray-200 text-gray-700 rounded-xl font-bold hover:bg-gray-50 transition-all"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                onClick={handleEnableCopyTrade}
                disabled={loading || !dailyLimit || parseFloat(dailyLimit) <= 0}
                className="flex-1 px-6 py-3 bg-purple-600 text-white rounded-xl font-bold hover:bg-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
              >
                {loading ? "Check Wallet..." : "Confirm & Sign"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}