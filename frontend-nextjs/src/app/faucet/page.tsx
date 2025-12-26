"use client";

import { useState, useEffect } from "react";
import { ethers, BrowserProvider, Contract } from "ethers";
import { useWallet } from "@/context/WalletContext";
import { tokenList, Token } from "@/utils/tokens";
import { toast } from "react-hot-toast";
import { ERC20_ABI } from "@/utils/constants";

// Faucet Contract Address on BSC Testnet
const FAUCET_ADDRESS = "0x0120A0cE53F9119a997F72657611A4d4AEEA3cB4";

const FAUCET_ABI = [
  "function claim(address token) external",
  "function timeUntilNextClaim(address user, address token) external view returns (uint256)",
];

// Professional Icons
const ClockIcon = (props: any) => (
  <svg {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const WalletIcon = (props: any) => (
  <svg {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a2.25 2.25 0 00-2.25-2.25H15a3 3 0 11-6 0H5.25A2.25 2.25 0 003 12m18 0v6a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 18v-6m18 0V9M3 12V9m18 0a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 9m18 0V6a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 6v3" />
  </svg>
);

const BeakerIcon = (props: any) => (
  <svg {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c.251.023.501.05.75.082m-.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0112 15a9.065 9.065 0 00-6.23-.693L5 14.5m14.8.8l1.402 1.402c1.232 1.232.65 3.318-1.067 3.611A48.309 48.309 0 0112 21c-2.773 0-5.491-.235-8.135-.687-1.718-.293-2.3-2.379-1.067-3.61L5 14.5" />
  </svg>
);

const CheckCircleIcon = (props: any) => (
  <svg {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const PlusCircleIcon = (props: any) => (
  <svg {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v6m3-3H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const SparklesIcon = (props: any) => (
  <svg {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" />
  </svg>
);

const InformationCircleIcon = (props: any) => (
  <svg {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
  </svg>
);

export default function FaucetPage() {
  const { address, isConnected } = useWallet();
  const [selectedToken, setSelectedToken] = useState<Token>(tokenList[0]);
  const [cooldown, setCooldown] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [userBalance, setUserBalance] = useState<string>("0");
  const [faucetBalance, setFaucetBalance] = useState<string>("0");
  const [loadingBalances, setLoadingBalances] = useState(false);

  // Fetch user balance and faucet balance
  const fetchBalances = async () => {
    if (!address || !window.ethereum) return;
    setLoadingBalances(true);
    try {
      const provider = new BrowserProvider(window.ethereum);
      const tokenContract = new Contract(selectedToken.address, ERC20_ABI, provider);
      
      // Get user balance
      const balance = await tokenContract.balanceOf(address);
      setUserBalance(ethers.formatUnits(balance, selectedToken.decimals));
      
      // Get faucet balance
      const faucetBal = await tokenContract.balanceOf(FAUCET_ADDRESS);
      setFaucetBalance(ethers.formatUnits(faucetBal, selectedToken.decimals));
    } catch (err) {
      console.error("Failed to fetch balances:", err);
    } finally {
      setLoadingBalances(false);
    }
  };

  // Check cooldown status
  const fetchCooldown = async () => {
    if (!address || !window.ethereum) return;
    try {
      const provider = new BrowserProvider(window.ethereum);
      const contract = new Contract(FAUCET_ADDRESS, FAUCET_ABI, provider);
      try {
        const remaining = await contract.timeUntilNextClaim(address, selectedToken.address);
        setCooldown(Number(remaining));
      } catch (e) {
        setCooldown(0);
      }
    } catch (err) {
      console.error("Cooldown fetch failed:", err);
    }
  };

  useEffect(() => {
    if (isConnected) {
      fetchCooldown();
      fetchBalances();
    }
  }, [selectedToken, address, isConnected]);

  const handleClaim = async () => {
    if (!window.ethereum || !address) return;
    setLoading(true);
    const provider = new BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();

    try {
      // Try Faucet Contract First
      try {
        const faucetContract = new Contract(FAUCET_ADDRESS, FAUCET_ABI, signer);
        await faucetContract.claim.estimateGas(selectedToken.address);
        
        const tx = await faucetContract.claim(selectedToken.address);
        toast.loading("Claiming tokens...", { id: "claim" });
        await tx.wait();
        toast.success(`🎉 Received 100 ${selectedToken.symbol}!`, { id: "claim" });
      } catch (faucetError: any) {
        console.warn("Faucet failed, trying direct mint...", faucetError.message);
        
        if (faucetError.message.includes("Token not supported") || faucetError.message.includes("execution reverted")) {
          const tokenContract = new Contract(selectedToken.address, ERC20_ABI, signer);
          const amountToMint = ethers.parseUnits("100", 18);
           
          const tx = await tokenContract.mint(address, amountToMint);
          toast.loading(`Minting ${selectedToken.symbol}...`, { id: "claim" });
          await tx.wait();
          toast.success(`🎉 Minted 100 ${selectedToken.symbol}!`, { id: "claim" });
        } else {
          throw faucetError;
        }
      }
      
      fetchCooldown();
      fetchBalances();
    } catch (err: any) {
      console.error(err);
      if (err.reason?.includes("cooldown")) {
        toast.error("Cooldown active. Please wait.", { id: "claim" });
      } else {
        toast.error("Claim failed. Try again later.", { id: "claim" });
      }
    } finally {
      setLoading(false);
    }
  };

  const addTokenToMetaMask = async () => {
    if (!window.ethereum) return;
    try {
      const wasAdded = await window.ethereum.request({
        method: "wallet_watchAsset",
        params: {
          type: "ERC20",
          options: {
            address: selectedToken.address,
            symbol: selectedToken.symbol,
            decimals: selectedToken.decimals,
            image: window.location.origin + selectedToken.logoURI,
          },
        },
      });
      
      if (wasAdded) {
        toast.success(`${selectedToken.symbol} added to MetaMask!`);
      }
    } catch (error) {
      console.error(error);
      toast.error("Failed to add token to MetaMask");
    }
  };

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-sm p-12 text-center border border-gray-200">
          <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <BeakerIcon className="w-10 h-10 text-blue-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-3">Connect Wallet</h2>
          <p className="text-gray-600">Connect your wallet to claim free test tokens</p>
        </div>
      </div>
    );
  }

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    if (h > 0) return `${h}h ${m}m`;
    if (m > 0) return `${m}m ${s}s`;
    return `${s}s`;
  };

  const formatBalance = (balance: string) => {
    const num = parseFloat(balance);
    if (num >= 1000000) return `${(num / 1000000).toFixed(2)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(2)}K`;
    return num.toFixed(2);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
            <BeakerIcon className="w-8 h-8 text-blue-600" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-3">Token Faucet</h1>
          <p className="text-gray-600 text-lg">Get free test tokens for MetaCow DEX</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Token Selection */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
                <SparklesIcon className="w-4 h-4" />
                Select Token
              </h3>
              <div className="space-y-2">
                {tokenList.map((token) => (
                  <button
                    key={token.symbol}
                    onClick={() => setSelectedToken(token)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border transition-all ${
                      selectedToken.symbol === token.symbol
                        ? "border-purple-500 bg-purple-50"
                        : "border-gray-200 hover:border-purple-300 hover:bg-gray-50"
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                      selectedToken.symbol === token.symbol
                        ? "bg-purple-600 text-white"
                        : "bg-gray-200 text-gray-700"
                    }`}>
                      {token.symbol[0]}
                    </div>
                    <div className="flex-1 text-left">
                      <div className="font-bold text-gray-900">{token.symbol}</div>
                      <div className="text-xs text-gray-500 font-mono">
                        {token.address.slice(0, 6)}...{token.address.slice(-4)}
                      </div>
                    </div>
                    {selectedToken.symbol === token.symbol && (
                      <CheckCircleIcon className="w-5 h-5 text-purple-600 flex-shrink-0" />
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Balances */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Your Balance */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                    <WalletIcon className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-gray-600">Your Balance</div>
                  </div>
                </div>
                <div className="text-3xl font-bold text-gray-900">
                  {loadingBalances ? (
                    <div className="h-8 w-24 bg-gray-200 animate-pulse rounded"></div>
                  ) : (
                    <>{formatBalance(userBalance)} <span className="text-lg text-gray-500">{selectedToken.symbol}</span></>
                  )}
                </div>
              </div>

              {/* Faucet Pool */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <BeakerIcon className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-gray-600">Faucet Pool</div>
                  </div>
                </div>
                <div className="text-3xl font-bold text-gray-900">
                  {loadingBalances ? (
                    <div className="h-8 w-24 bg-gray-200 animate-pulse rounded"></div>
                  ) : (
                    <>{formatBalance(faucetBalance)} <span className="text-lg text-gray-500">{selectedToken.symbol}</span></>
                  )}
                </div>
              </div>
            </div>

            {/* Claim Card */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
              <div className="text-center mb-6">
                <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-purple-100 to-blue-100 rounded-full mb-4">
                  <div className="text-4xl">🎁</div>
                </div>
                <div className="text-4xl font-bold text-gray-900 mb-2">
                  100 {selectedToken.symbol}
                </div>
                <div className="text-sm text-gray-600">Per Claim (24h cooldown)</div>
              </div>

              {/* Status & Action */}
              <div className="space-y-4">
                {cooldown !== null && cooldown > 0 ? (
                  <div className="bg-orange-50 border border-orange-200 text-orange-700 p-4 rounded-xl flex items-center justify-center gap-3 font-medium">
                    <ClockIcon className="w-5 h-5" />
                    <span>Cooldown active: <strong>{formatTime(cooldown)}</strong></span>
                  </div>
                ) : (
                  <button
                    onClick={handleClaim}
                    disabled={loading}
                    className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-4 rounded-xl text-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Processing...
                      </>
                    ) : (
                      <>
                        <SparklesIcon className="w-6 h-6" />
                        Claim {selectedToken.symbol}
                      </>
                    )}
                  </button>
                )}

                {/* Add to MetaMask Button */}
                <button
                  onClick={addTokenToMetaMask}
                  className="w-full bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-700 font-semibold py-3 rounded-xl transition-colors flex items-center justify-center gap-2"
                >
                  <PlusCircleIcon className="w-5 h-5" />
                  Add {selectedToken.symbol} to MetaMask
                </button>
              </div>
            </div>

            {/* Info Box */}
            <div className="bg-blue-50 border border-blue-200 rounded-2xl p-6">
              <div className="flex items-start gap-3">
                <InformationCircleIcon className="w-6 h-6 text-blue-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-blue-900">
                  <p className="font-semibold mb-2">How it works:</p>
                  <ul className="space-y-1 text-blue-800">
                    <li>• Claim 100 tokens every 24 hours</li>
                    <li>• Tokens are sent directly to your wallet</li>
                    <li>• Add tokens to MetaMask to see them in your wallet</li>
                    <li>• Use these tokens to test trading on MetaCow DEX</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}