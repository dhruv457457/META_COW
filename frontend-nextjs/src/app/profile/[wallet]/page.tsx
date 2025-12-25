"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { useWallet } from "@/context/WalletContext";
import { fetchUserSwaps, type EnvioSwapEvent } from "@/utils/envioClient";
import { formatUnits } from "viem";
import { tokenList } from "@/utils/tokens";
import Link from "next/link";
import { motion } from "framer-motion";
import FollowButton from "@/components/FollowButton";
import CopyTradeButton from "@/components/CopyTradeButton";

interface UserProfile {
  username: string;
  bio: string;
  avatar: string;
  walletAddress: string;
  followers: number;
  following: number;
  reputation: number;
  totalSwaps: number;
  totalVolume: string;
  createdAt: string;
  lastActive: string;
}

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

export default function UserProfilePage() {
  const params = useParams();
  const wallet = params?.wallet as string;
  const { address: currentUserAddress } = useWallet();
  
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [swaps, setSwaps] = useState<EnvioSwapEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"swaps" | "stats">("swaps");

  const isOwnProfile = currentUserAddress && wallet.toLowerCase() === currentUserAddress.toLowerCase();

  useEffect(() => {
    const loadProfile = async () => {
      if (!wallet) return;
      
      setLoading(true);
      try {
        // Fetch profile
        const res = await fetch(`/api/users/profile?wallet=${wallet}`);
        if (res.ok) {
          const data = await res.json();
          setProfile(data);
        }

        // Fetch user's swaps
        const userSwaps = await fetchUserSwaps(wallet, 20);
        setSwaps(userSwaps);
        
      } catch (error) {
        console.error("Failed to load profile:", error);
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [wallet]);

  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(0, 4)}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-8">
          <div className="text-6xl mb-4">👤</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">User Not Found</h2>
          <p className="text-gray-600 mb-6">This user hasn't created a profile yet.</p>
          <Link
            href="/social"
            className="inline-block px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl font-bold hover:shadow-lg transition"
          >
            ← Back to Social Feed
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Profile Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-white rounded-3xl shadow-lg p-8 mb-6 border border-gray-100"
        >
          <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
            {/* Avatar */}
            <div className="relative">
              <div className="w-32 h-32 bg-gradient-to-br from-purple-400 to-pink-400 rounded-full overflow-hidden border-4 border-white shadow-xl">
                <img 
                  src={profile.avatar} 
                  alt={profile.username}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-green-500 border-4 border-white rounded-full flex items-center justify-center">
                <span className="text-white text-xs font-bold">✓</span>
              </div>
            </div>

            {/* Info */}
            <div className="flex-1">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-3">
                <div>
                  <h1 className="text-3xl font-black text-gray-900 mb-1">{profile.username}</h1>
                  <p className="text-sm text-gray-600 font-mono mb-2">{formatAddress(wallet)}</p>
                  
                    <a href={`https://testnet.bscscan.com/address/${wallet}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-blue-600 hover:text-blue-700 font-medium inline-flex items-center gap-1"
                  >
                    View on BscScan ↗
                  </a>
                </div>

                {!isOwnProfile && (
                  <div className="flex gap-3">
                    <FollowButton
                      targetWallet={wallet}
                      targetUsername={profile.username}
                    />
                  </div>
                )}
              </div>

              {profile.bio && (
                <p className="text-gray-700 mb-4 max-w-2xl">{profile.bio}</p>
              )}

              {/* Stats */}
              <div className="flex flex-wrap gap-6">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">👥</span>
                  <div>
                    <div className="font-bold text-gray-900 text-lg">{profile.followers}</div>
                    <div className="text-xs text-gray-600">Followers</div>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <span className="text-2xl">➕</span>
                  <div>
                    <div className="font-bold text-gray-900 text-lg">{profile.following}</div>
                    <div className="text-xs text-gray-600">Following</div>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <span className="text-2xl">🔄</span>
                  <div>
                    <div className="font-bold text-gray-900 text-lg">{profile.totalSwaps}</div>
                    <div className="text-xs text-gray-600">Trades</div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-2xl">⭐</span>
                  <div>
                    <div className="font-bold text-gray-900 text-lg">{profile.reputation}</div>
                    <div className="text-xs text-gray-600">Reputation</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Tabs */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-2 flex gap-2 mb-6">
          <button
            onClick={() => setActiveTab("swaps")}
            className={`flex-1 px-6 py-3 rounded-lg font-bold transition ${
              activeTab === "swaps"
                ? "bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-md"
                : "text-gray-600 hover:bg-gray-50"
            }`}
          >
            🔄 Recent Trades ({swaps.length})
          </button>
          <button
            onClick={() => setActiveTab("stats")}
            className={`flex-1 px-6 py-3 rounded-lg font-bold transition ${
              activeTab === "stats"
                ? "bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-md"
                : "text-gray-600 hover:bg-gray-50"
            }`}
          >
            📊 Statistics
          </button>
        </div>

        {/* Content */}
        {activeTab === "swaps" ? (
          <div className="space-y-4">
            {swaps.length === 0 ? (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
                <div className="text-5xl mb-4">💤</div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">No Trades Yet</h3>
                <p className="text-sm text-gray-600">
                  {isOwnProfile ? "Make your first trade to see it here!" : `${profile.username} hasn't made any trades yet.`}
                </p>
              </div>
            ) : (
              swaps.map((swap, index) => {
                const inputSymbol = getSymbol(swap.inputToken);
                const outputSymbol = getSymbol(swap.outputToken);
                const inputAmount = formatAmount(swap.inputAmount);
                const outputAmount = formatAmount(swap.outputAmount);

                return (
                  <motion.div
                    key={swap.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05, duration: 0.3 }}
                    className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-lg transition"
                  >
                    <div className="flex items-start justify-between gap-4 mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-gradient-to-br from-purple-400 to-pink-400 rounded-full flex items-center justify-center text-white font-bold text-lg">
                          🔄
                        </div>
                        <div>
                          <div className="font-bold text-gray-900">Swap Transaction</div>
                          <div className="text-xs text-gray-500">
                            {formatTimeAgo(swap.timestamp)}
                          </div>
                        </div>
                      </div>

                      {!isOwnProfile && (
                        <CopyTradeButton
                          traderAddress={wallet}
                          traderUsername={profile.username}
                          inputToken={swap.inputToken}
                          outputToken={swap.outputToken}
                          inputAmount={swap.inputAmount}
                        />
                      )}
                    </div>

                    {/* Trade Details */}
                    <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-4">
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

                    {/* View TX */}
                    
                    <a  href={`https://testnet.bscscan.com/tx/${swap.txHash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-3 text-xs text-blue-600 hover:text-blue-700 font-medium inline-flex items-center gap-1"
                    >
                      View Transaction ↗
                    </a>
                  </motion.div>
                );
              })
            )}
          </div>
        ) : (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
            className="grid grid-cols-1 md:grid-cols-2 gap-6"
          >
            {/* Trading Stats */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">📈 Trading Stats</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Total Trades</span>
                  <span className="font-bold text-gray-900 text-lg">{profile.totalSwaps}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Total Volume</span>
                  <span className="font-bold text-gray-900 text-lg">
                    ${parseFloat(profile.totalVolume || "0").toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Reputation Score</span>
                  <span className="font-bold text-purple-600 text-lg">{profile.reputation}</span>
                </div>
              </div>
            </div>

            {/* Activity Stats */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">⏰ Activity</h3>
              <div className="space-y-4">
                <div>
                  <span className="text-gray-600 block mb-1">Member Since</span>
                  <span className="font-bold text-gray-900">
                    {new Date(profile.createdAt).toLocaleDateString('en-US', {
                      month: 'long',
                      year: 'numeric'
                    })}
                  </span>
                </div>
                <div>
                  <span className="text-gray-600 block mb-1">Last Active</span>
                  <span className="font-bold text-gray-900">
                    {new Date(profile.lastActive).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric'
                    })}
                  </span>
                </div>
              </div>
            </div>

            {/* Social Stats */}
            <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl shadow-sm border border-purple-200 p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">👥 Social</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Followers</span>
                  <span className="font-bold text-purple-600 text-lg">{profile.followers}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Following</span>
                  <span className="font-bold text-blue-600 text-lg">{profile.following}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Engagement Rate</span>
                  <span className="font-bold text-green-600 text-lg">
                    {profile.totalSwaps > 0 
                      ? Math.round((profile.followers / Math.max(profile.totalSwaps, 1)) * 100)
                      : 0}%
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl shadow-sm border border-blue-200 p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">⚡ Quick Actions</h3>
              <div className="space-y-3">
                {!isOwnProfile && (
                  <>
                    <Link
                      href={`/social`}
                      className="block w-full px-4 py-3 bg-white border border-gray-200 text-gray-900 rounded-xl font-bold text-sm hover:bg-gray-50 transition text-center"
                    >
                      View in Feed
                    </Link>
                    <button className="w-full px-4 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl font-bold text-sm hover:shadow-lg transition">
                      Enable Auto-Copy
                    </button>
                  </>
                )}
                {isOwnProfile && (
                  <Link
                    href="/profile"
                    className="block w-full px-4 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl font-bold text-sm hover:shadow-lg transition text-center"
                  >
                    Edit Profile
                  </Link>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}