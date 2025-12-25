"use client";

import { useState, useEffect } from "react";
import { useWallet } from "@/context/WalletContext";
import { fetchLatestSwaps, type EnvioSwapEvent } from "@/utils/envioClient";
import { formatUnits } from "viem";
import { tokenList } from "@/utils/tokens";
import { Activity, ArrowRight, ExternalLink } from "lucide-react";
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
      
      // ✅ BATCH FETCH - Get unique users
      const uniqueUsers = [...new Set(latestSwaps.map(s => s.user.toLowerCase()))];
      
      if (uniqueUsers.length > 0) {
        // ✅ ONE API CALL for all users instead of N calls!
        const res = await fetch('/api/users/batch', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ wallets: uniqueUsers })
        });
        
        if (res.ok) {
          const { users } = await res.json();
          
          // Map to simplified profile format
          const profilesMap: Record<string, { username: string; avatar: string }> = {};
          Object.entries(users).forEach(([wallet, userData]: [string, any]) => {
            if (userData?.username) {
              profilesMap[wallet] = {
                username: userData.username,
                avatar: userData.avatar || `https://api.dicebear.com/7.x/identicon/svg?seed=${wallet}`,
              };
            }
          });
          
          setProfiles(profilesMap);
        }
      }
      
    } catch (error) {
      console.error("Failed to load swaps:", error);
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    loadSwaps();
    const interval = setInterval(loadSwaps, 10000);
    return () => clearInterval(interval);
  }, []);
  
  if (loading) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Activity className="w-5 h-5 text-red-500" />
            Live Swaps
          </h2>
          <div className="flex gap-1">
            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse delay-75"></div>
            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse delay-150"></div>
          </div>
        </div>
        <div className="text-center py-8 text-slate-500 text-sm">Loading trades...</div>
      </div>
    );
  }
  
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
      {/* Header */}
      <div className="p-5 bg-gradient-to-r from-red-50 to-pink-50 border-b border-red-100 flex items-center justify-between">
        <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
          </span>
          Live Trades
        </h2>
        <div className="text-xs font-semibold text-slate-600 bg-white px-3 py-1.5 rounded-full">
          {swaps.length}
        </div>
      </div>
      
      {/* Swaps List */}
      <div className="max-h-[600px] overflow-y-auto">
        {swaps.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-slate-100 to-purple-100 flex items-center justify-center mx-auto mb-3">
              <Activity className="w-8 h-8 text-slate-400" />
            </div>
            <p className="text-slate-500 font-medium text-sm">No recent swaps</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {swaps.map((swap) => {
              const userAddr = swap.user.toLowerCase();
              const profile = profiles[userAddr];
              const inputSymbol = getSymbol(swap.inputToken);
              const outputSymbol = getSymbol(swap.outputToken);
              const inputAmount = formatAmount(swap.inputAmount);
              const outputAmount = formatAmount(swap.outputAmount);
              const isOwnTrade = address && userAddr === address.toLowerCase();
              
              return (
                <div key={swap.id} className="p-4 hover:bg-slate-50 transition-colors">
                  {/* User Info */}
                  <div className="flex items-center gap-2.5 mb-3">
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 p-0.5 flex-shrink-0">
                      <img 
                        src={profile?.avatar || `https://api.dicebear.com/7.x/identicon/svg?seed=${userAddr}`}
                        alt="User"
                        className="w-full h-full rounded-full object-cover bg-white"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-sm text-slate-900 truncate">
                        {profile?.username || formatAddress(userAddr)}
                      </div>
                      <div className="text-xs text-slate-500">
                        {formatTimeAgo(swap.timestamp)}
                      </div>
                    </div>
                  </div>
                  
                  {/* Trade Info */}
                  <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-3.5 mb-3 border border-purple-100">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex-1">
                        <div className="font-bold text-slate-900">{inputAmount}</div>
                        <div className="text-xs font-semibold text-purple-600 mt-0.5">{inputSymbol}</div>
                      </div>
                      <div className="px-2">
                        <ArrowRight className="w-4 h-4 text-slate-400" />
                      </div>
                      <div className="flex-1 text-right">
                        <div className="font-bold text-slate-900">{outputAmount}</div>
                        <div className="text-xs font-semibold text-green-600 mt-0.5">{outputSymbol}</div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Actions */}
                  {!isOwnTrade && address && profile && (
                    <div className="flex gap-2 mb-3">
                      <button className="flex-1 px-3 py-2 bg-slate-50 text-slate-900 rounded-lg font-semibold text-xs hover:bg-slate-100 transition-colors">
                        Manual
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
                    className="text-xs text-purple-600 hover:text-purple-700 font-semibold flex items-center gap-1"
                  >
                    <ExternalLink className="w-3 h-3" />
                    View TX
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