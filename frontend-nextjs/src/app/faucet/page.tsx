"use client";

import { useState, useEffect } from "react";
import { ethers, BrowserProvider, Contract } from "ethers";
import { useWallet } from "@/context/WalletContext";
import { tokenList, Token } from "@/utils/tokens";
import { toast } from "react-hot-toast";
import { ERC20_ABI } from "@/utils/constants"; // ✅ Import ERC20_ABI

// Faucet Contract Address on BSC Testnet
const FAUCET_ADDRESS = "0x0120A0cE53F9119a997F72657611A4d4AEEA3cB4";

const FAUCET_ABI = [
  "function claim(address token) external",
  "function timeUntilNextClaim(address user, address token) external view returns (uint256)",
];

export default function FaucetPage() {
  const { address, isConnected } = useWallet();
  const [selectedToken, setSelectedToken] = useState<Token>(tokenList[0]);
  const [cooldown, setCooldown] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  // Check cooldown status
  const fetchCooldown = async () => {
    if (!address || !window.ethereum) return;
    try {
      const provider = new BrowserProvider(window.ethereum);
      const contract = new Contract(FAUCET_ADDRESS, FAUCET_ABI, provider);
      // Only check cooldown if the token is supported by faucet, otherwise ignore
      try {
        const remaining = await contract.timeUntilNextClaim(address, selectedToken.address);
        setCooldown(Number(remaining));
      } catch (e) {
        setCooldown(0); // If faucet lookup fails, assume no cooldown (we'll try direct mint)
      }
    } catch (err) {
      console.error("Cooldown fetch failed:", err);
    }
  };

  useEffect(() => {
    if (isConnected) fetchCooldown();
  }, [selectedToken, address, isConnected]);

  const handleClaim = async () => {
    if (!window.ethereum || !address) return;
    setLoading(true);
    const provider = new BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();

    try {
      // 1. Try Faucet Contract First
      try {
        const faucetContract = new Contract(FAUCET_ADDRESS, FAUCET_ABI, signer);
        // Estimate gas to check if it will fail
        await faucetContract.claim.estimateGas(selectedToken.address);
        
        // If estimate passes, send tx
        const tx = await faucetContract.claim(selectedToken.address);
        toast.loading("Claiming via Faucet...");
        await tx.wait();
        toast.dismiss();
        toast.success(`🎉 Received 10 ${selectedToken.symbol}!`);
      } catch (faucetError: any) {
        
        // 2. If Faucet fails ("Token not supported"), Try Direct Mint
        console.warn("Faucet failed, trying direct mint...", faucetError.message);
        
        if (faucetError.message.includes("Token not supported") || faucetError.message.includes("execution reverted")) {
           const tokenContract = new Contract(selectedToken.address, ERC20_ABI, signer);
           const amountToMint = ethers.parseUnits("100", 18); // Mint 100 tokens
           
           const tx = await tokenContract.mint(address, amountToMint);
           toast.loading(`Minting ${selectedToken.symbol} directly...`);
           await tx.wait();
           toast.dismiss();
           toast.success(`🎉 Minted 100 ${selectedToken.symbol}!`);
        } else {
           throw faucetError;
        }
      }
      
      fetchCooldown();
    } catch (err: any) {
      console.error(err);
      toast.dismiss();
      if (err.reason?.includes("cooldown")) {
        toast.error("Cooldown active. Please wait.");
      } else {
        toast.error("Claim failed. Token might not allow minting.");
      }
    } finally {
      setLoading(false);
    }
  };

  const addTokenToMetaMask = async () => {
    if (!window.ethereum) return;
    try {
      await window.ethereum.request({
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
    } catch (error) {
      console.error(error);
    }
  };

  if (!isConnected) {
    return (
      <div className="max-w-xl mx-auto mt-20 text-center p-10 bg-white rounded-3xl shadow-xl border border-gray-100">
        <div className="text-6xl mb-4">🚰</div>
        <h2 className="text-2xl font-bold mb-4">Connect Wallet</h2>
        <p className="text-gray-500">Connect your wallet to claim free test tokens.</p>
      </div>
    );
  }

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    return `${h}h ${m}m`;
  };

  return (
    <div className="max-w-2xl mx-auto px-6 py-12">
      <div className="text-center mb-10">
        <h1 className="text-4xl font-black text-gray-800 mb-2">Token Faucet</h1>
        <p className="text-gray-600">Get free TKA, TKB, and USD for testing.</p>
      </div>

      <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-8">
        {/* Token Selection */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div>
            <label className="block text-sm font-bold text-gray-500 mb-2 uppercase">Select Token</label>
            <div className="space-y-2">
              {tokenList.map((token) => (
                <button
                  key={token.symbol}
                  onClick={() => setSelectedToken(token)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border transition-all ${
                    selectedToken.symbol === token.symbol
                      ? "border-purple-500 bg-purple-50 text-purple-700"
                      : "border-gray-200 hover:border-purple-200"
                  }`}
                >
                  <span className="font-bold">{token.symbol}</span>
                  <span className="text-xs text-gray-400 font-mono ml-auto">{token.address.slice(0,6)}...</span>
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col justify-center items-center bg-gray-50 rounded-2xl p-6 border border-gray-100">
            <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-sm mb-4 text-2xl">
              🎁
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-gray-800 mb-1">
                 {/* Update text dynamically */}
                 {loading ? "..." : "100"} {selectedToken.symbol}
              </div>
              <div className="text-sm text-gray-500">Per Claim</div>
            </div>
          </div>
        </div>

        {/* Status & Action */}
        <div className="space-y-4">
          {cooldown !== null && cooldown > 0 ? (
            <div className="bg-orange-50 text-orange-700 p-4 rounded-xl flex items-center justify-center gap-2 font-medium">
              <span>⏳ Cooldown active:</span>
              <span className="font-bold">{formatTime(cooldown)}</span>
            </div>
          ) : (
            <button
              onClick={handleClaim}
              disabled={loading}
              className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-bold py-4 rounded-2xl text-lg shadow-lg transition-all disabled:opacity-50"
            >
              {loading ? "Processing..." : `Claim ${selectedToken.symbol}`}
            </button>
          )}

          <button
            onClick={addTokenToMetaMask}
            className="w-full text-sm text-gray-500 hover:text-purple-600 font-medium py-2 flex items-center justify-center gap-2"
          >
            <span>🦊 Add {selectedToken.symbol} to MetaMask</span>
          </button>
        </div>
      </div>
    </div>
  );
}