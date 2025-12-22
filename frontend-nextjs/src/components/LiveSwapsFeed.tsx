"use client";

import { useState, useEffect } from "react";
import { useWallet } from "@/context/WalletContext";
import { fetchLatestSwaps, type EnvioSwapEvent } from "@/utils/envioClient";
import { formatUnits } from "viem";
import { tokenList } from "@/utils/tokens";
import CopyTradeButton from "./CopyTradeButton";

const getSymbol = (addr: string): string => {
  const t = tokenList.find(x => x.address.toLowerCase() === addr.toLowerCase());
  return t ? t.symbol : `${addr.slice(0, 6)}...`;
};

const formatAmount = (amount: string): string => {
  try {
    const parsed = parseFloat(formatUnits(BigInt(amount), 18));
    return isNaN(parsed) ? "0.00" : parsed.toFixed(4);
  } catch {
    return "0.00";
  }
};

const formatTimeAgo = (timestamp: number): string => {
  const seconds = Math.floor(Date.now() / 1000 - timestamp);
  if (seconds < 60) return `${seconds}s ago`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
};

const formatAddress = (addr: string) => {
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
};

export default function LiveSwapsFeed() {
  const { address } = useWallet();
  const [swaps, setSwaps] = useState<EnvioSwapEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [profiles, setProfiles] = useState<Record<string, { username: string; avatar: string }>>({});
  
  const loadSwaps = async () => {
    try {
      const latestSwaps = await fetchLatestSwaps(15);
      setSwaps(latestSwaps);
      
      // Fetch profiles for users
      const uniqueUsers = [...new Set(latestSwaps.map(s => s.user.toLowerCase()))];
      const profilesMap: Record<string, { username: string; avatar: string }> = {};
      
      await Promise.all(
        uniqueUsers.map(async (userAddr) => {
          try {
            const res = await fetch(`/api/users/profile?wallet=${userAddr}`);
            if (res.ok) {
              const userData = await res.json();
              if (userData.username) {
                profilesMap[userAddr] = {
                  username: userData.username,
                  avatar: userData.avatar || `https://api.dicebear.com/7.x/identicon/svg?seed=${userAddr}`,
                };
              }
            }
          } catch (e) {
            console.error("Profile fetch error:", e);
          }
        })
      );
      
      setProfiles(profilesMap);
    } catch (error) {
      console.error("Failed to load swaps:", error);
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    loadSwaps();
    
    // Refresh every 10 seconds
    const interval = setInterval(loadSwaps, 10000);
    return () => clearInterval(interval);
  }, []);
  
  if (loading) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-gray-900">🔴 Live Swaps</h2>
          <div className="animate-pulse flex space-x-1">
            <div className="w-2 h-2 bg-red-500 rounded-full"></div>
            <div className="w-2 h-2 bg-red-500 rounded-full"></div>
            <div className="w-2 h-2 bg-red-500 rounded-full"></div>
          </div>
        </div>
        <div className="text-center py-8 text-gray-500">Loading swaps...</div>
      </div>
    );
  }
  
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      {/* Header */}
      <div className="p-4 bg-gradient-to-r from-red-50 to-pink-50 border-b border-red-100 flex items-center justify-between">
        <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
          </span>
          Live Swaps
        </h2>
        <div className="text-xs font-medium text-gray-600 bg-white px-3 py-1 rounded-full">
          {swaps.length} trades
        </div>
      </div>
      
      {/* Swaps List */}
      <div className="max-h-[600px] overflow-y-auto">
        {swaps.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-4xl mb-3">💤</div>
            <p className="text-gray-500 font-medium">No recent swaps</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {swaps.map((swap) => {
              const userAddr = swap.user.toLowerCase();
              const profile = profiles[userAddr];
              const inputSymbol = getSymbol(swap.inputToken);
              const outputSymbol = getSymbol(swap.outputToken);
              const inputAmount = formatAmount(swap.inputAmount);
              const outputAmount = formatAmount(swap.outputAmount);
              const isOwnTrade = address && userAddr === address.toLowerCase();
              
              return (
                <div key={swap.id} className="p-4 hover:bg-gray-50 transition">
                  {/* User Info */}
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 overflow-hidden flex-shrink-0">
                      <img 
                        src={profile?.avatar || `https://api.dicebear.com/7.x/identicon/svg?seed=${userAddr}`}
                        alt="User"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-sm text-gray-900 truncate">
                        {profile?.username || formatAddress(userAddr)}
                      </div>
                      <div className="text-xs text-gray-500">
                        {formatTimeAgo(swap.timestamp)}
                      </div>
                    </div>
                  </div>
                  
                  {/* Trade Info */}
                  <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg p-3 mb-3">
                    <div className="flex items-center justify-between text-sm">
                      <div className="font-bold text-gray-900">
                        {inputAmount} <span className="text-purple-700">{inputSymbol}</span>
                      </div>
                      <div className="text-gray-500">→</div>
                      <div className="font-bold text-gray-900">
                        {outputAmount} <span className="text-green-700">{outputSymbol}</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Actions */}
                  {!isOwnTrade && address && profile && (
                    <div className="flex gap-2">
                      <button className="flex-1 px-3 py-2 bg-gray-100 text-gray-900 rounded-lg font-bold text-xs hover:bg-gray-200 transition">
                        📋 Manual
                      </button>
                      <div className="flex-1">
                        <CopyTradeButton
                          traderAddress={swap.user}
                          traderUsername={profile.username}
                          inputToken={swap.inputToken}
                          outputToken={swap.outputToken}
                          inputAmount={swap.inputAmount}
                        />
                      </div>
                    </div>
                  )}
                  
                  {/* View TX Link */}
                  <a 
                    href={`https://testnet.bscscan.com/tx/${swap.txHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-2 text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
                  >
                    View TX ↗
                  </a>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}