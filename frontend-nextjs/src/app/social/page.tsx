"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { fetchLatestSwaps, type EnvioSwapEvent } from "@/utils/envioClient";
import { ethers } from "ethers";
import { tokenList } from "@/utils/tokens";
import { useWallet } from "@/context/WalletContext";
import Link from "next/link";
import { toast } from "react-hot-toast";
import CopyTradeButton from "@/components/CopyTradeButton";

// Helper to find token symbol
const getSymbol = (addr: string): string => {
  const t = tokenList.find(
    (x) => x.address.toLowerCase() === addr.toLowerCase()
  );
  return t ? t.symbol : `${addr.slice(0, 6)}...`;
};

interface UserProfile {
  username: string;
  avatar: string;
  walletAddress: string;
  bio?: string;
  reputation?: number;
  totalSwaps?: number;
}

interface CopyTradeData {
  swap: EnvioSwapEvent;
  profile?: UserProfile;
}

type FilterTab = "all" | "following" | "trending";
type TimeFilter = "1h" | "24h" | "7d" | "all";

interface Stats {
  totalVolume: number;
  activeTraders: number;
  swaps24h: number;
  topTrader: UserProfile | null;
}

export default function SocialPage() {
  const { address } = useWallet();

  // Data states
  const [allSwaps, setAllSwaps] = useState<EnvioSwapEvent[]>([]);
  const [filteredSwaps, setFilteredSwaps] = useState<EnvioSwapEvent[]>([]);
  const [profiles, setProfiles] = useState<Record<string, UserProfile>>({});
  const [loading, setLoading] = useState(true);

  // Filter states
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<FilterTab>("all");
  const [timeFilter, setTimeFilter] = useState<TimeFilter>("24h");
  const [selectedToken, setSelectedToken] = useState("all");

  // Copy trade modal
  const [copyTradeModal, setCopyTradeModal] = useState<CopyTradeData | null>(
    null
  );
  const [copyAmount, setCopyAmount] = useState("");

  // Stats
  const [stats, setStats] = useState<Stats>({
    totalVolume: 0,
    activeTraders: 0,
    swaps24h: 0,
    topTrader: null,
  });

  // Ref to track if component is mounted
  const isMountedRef = useRef(true);

  // Load feed data
  const loadFeed = useCallback(async () => {
    try {
      const swaps = await fetchLatestSwaps(100);
      
      if (!isMountedRef.current) return;
      
      setAllSwaps(swaps);

      // Extract unique users
      const uniqueUsers = [...new Set(swaps.map((s) => s.user.toLowerCase()))];

      // Fetch profiles
      const profilesMap: Record<string, UserProfile> = {};
      await Promise.all(
        uniqueUsers.map(async (userAddr) => {
          try {
            const res = await fetch(`/api/users/profile?wallet=${userAddr}`);
            if (res.ok) {
              const userData = await res.json();
              if (userData.username) {
                profilesMap[userAddr] = userData;
              }
            }
          } catch (e) {
            console.error("Profile fetch error for", userAddr, e);
          }
        })
      );

      if (!isMountedRef.current) return;

      setProfiles(profilesMap);

      // Calculate stats
      calculateStats(swaps, profilesMap);
    } catch (err) {
      console.error("Feed load failed", err);
      if (isMountedRef.current) {
        toast.error("Failed to load trading feed");
      }
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    isMountedRef.current = true;
    loadFeed();
    const interval = setInterval(loadFeed, 15000); // Refresh every 15s
    
    return () => {
      isMountedRef.current = false;
      clearInterval(interval);
    };
  }, [loadFeed]);

  // Apply filters when dependencies change
  const applyFilters = useCallback(() => {
    let filtered = [...allSwaps];
    const now = Math.floor(Date.now() / 1000);

    // Time filter
    switch (timeFilter) {
      case "1h":
        filtered = filtered.filter((s) => now - s.timestamp < 3600);
        break;
      case "24h":
        filtered = filtered.filter((s) => now - s.timestamp < 86400);
        break;
      case "7d":
        filtered = filtered.filter((s) => now - s.timestamp < 604800);
        break;
      // "all" - no filter
    }

    // Token filter
    if (selectedToken !== "all") {
      filtered = filtered.filter(
        (s) =>
          s.inputToken.toLowerCase() === selectedToken.toLowerCase() ||
          s.outputToken.toLowerCase() === selectedToken.toLowerCase()
      );
    }

    // Search filter (username or address)
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((s) => {
        const userAddr = s.user.toLowerCase();
        const profile = profiles[userAddr];
        return (
          userAddr.includes(query) ||
          profile?.username.toLowerCase().includes(query) ||
          profile?.bio?.toLowerCase().includes(query)
        );
      });
    }

    // Tab filter (all/following/trending)
    if (activeTab === "trending") {
      // Show only swaps from users with profiles and high reputation
      filtered = filtered.filter((s) => {
        const profile = profiles[s.user.toLowerCase()];
        return profile && (profile.reputation || 0) >= 100;
      });
    }
    // TODO: Implement "following" filter when follow system is added

    setFilteredSwaps(filtered);
  }, [allSwaps, searchQuery, activeTab, timeFilter, selectedToken, profiles]);

  useEffect(() => {
    applyFilters();
  }, [applyFilters]);

  const calculateStats = (
    swaps: EnvioSwapEvent[],
    profilesMap: Record<string, UserProfile>
  ) => {
    const now = Math.floor(Date.now() / 1000);
    const last24h = swaps.filter((s) => now - s.timestamp < 86400);

    const totalVolume = last24h.reduce((sum, s) => {
      try {
        const val = parseFloat(ethers.formatUnits(s.inputAmount, 18));
        return sum + (isNaN(val) ? 0 : val);
      } catch {
        return sum;
      }
    }, 0);

    const uniqueTraders = new Set(last24h.map((s) => s.user.toLowerCase()))
      .size;

    // Find top trader (most swaps in 24h)
    const traderCounts: Record<string, number> = {};
    last24h.forEach((s) => {
      const addr = s.user.toLowerCase();
      traderCounts[addr] = (traderCounts[addr] || 0) + 1;
    });

    const topTraderAddr = Object.entries(traderCounts).sort(
      ([, a], [, b]) => b - a
    )[0]?.[0];

    setStats({
      totalVolume,
      activeTraders: uniqueTraders,
      swaps24h: last24h.length,
      topTrader: topTraderAddr ? profilesMap[topTraderAddr] || null : null,
    });
  };

  const handleCopyTrade = async () => {
    if (!copyTradeModal || !address) {
      toast.error("Please connect your wallet first");
      return;
    }

    try {
      const { swap } = copyTradeModal;
      const amount = copyAmount || ethers.formatUnits(swap.inputAmount, 18);

      // Validate amount
      if (parseFloat(amount) <= 0) {
        toast.error("Please enter a valid amount");
        return;
      }

      // In a real app, you'd execute the swap here
      const tradeDetails = {
        inputToken: swap.inputToken,
        outputToken: swap.outputToken,
        amount: amount,
      };

      toast.success("Trade copied! Redirecting to swap...", {
        duration: 2000,
      });

      setTimeout(() => {
        window.location.href = `/swap?from=${tradeDetails.inputToken}&to=${tradeDetails.outputToken}&amount=${tradeDetails.amount}`;
      }, 1000);

      setCopyTradeModal(null);
      setCopyAmount("");
    } catch (err: any) {
      toast.error(err?.message || "Failed to copy trade");
    }
  };

  const formatAmount = (amount: string): string => {
    try {
      const parsed = parseFloat(ethers.formatUnits(amount, 18));
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

  const uniqueTokens = [
    ...new Set(allSwaps.flatMap((s) => [s.inputToken, s.outputToken])),
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-blue-600 mb-3">
            Social Trading Feed
          </h1>
          <p className="text-gray-600 text-lg mb-4">
            Follow the alpha. Copy winning trades with Advanced Permissions.
          </p>
          <Link
            href="/profile"
            className="inline-block px-6 py-3 bg-purple-600 text-white rounded-xl font-bold hover:bg-purple-700 transition shadow-lg hover:shadow-xl"
          >
            My Profile →
          </Link>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-2xl p-6 shadow-lg border-2 border-purple-100">
            <div className="text-3xl mb-2">📊</div>
            <div className="text-3xl font-black text-purple-600">
              ${stats.totalVolume.toFixed(0)}
            </div>
            <div className="text-sm text-gray-600 font-medium">24h Volume</div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-lg border-2 border-blue-100">
            <div className="text-3xl mb-2">👥</div>
            <div className="text-3xl font-black text-blue-600">
              {stats.activeTraders}
            </div>
            <div className="text-sm text-gray-600 font-medium">
              Active Traders
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-lg border-2 border-green-100">
            <div className="text-3xl mb-2">🔄</div>
            <div className="text-3xl font-black text-green-600">
              {stats.swaps24h}
            </div>
            <div className="text-sm text-gray-600 font-medium">Swaps 24h</div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-lg border-2 border-yellow-100">
            <div className="text-3xl mb-2">🏆</div>
            <div className="text-xl font-black text-yellow-600 truncate">
              {stats.topTrader?.username || "---"}
            </div>
            <div className="text-sm text-gray-600 font-medium">Top Trader</div>
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative mb-6">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by username or address..."
            className="w-full px-6 py-4 pl-12 rounded-2xl border-2 border-gray-200 focus:border-purple-500 focus:ring-4 focus:ring-purple-100 outline-none transition-all text-lg"
          />
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl">
            🔍
          </div>
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              aria-label="Clear search"
            >
              ✕
            </button>
          )}
        </div>

        {/* Filters */}
        <div className="bg-white rounded-2xl p-4 shadow-lg mb-6">
          <div className="flex flex-wrap items-center gap-4">
            {/* Tab Filters */}
            <div className="flex gap-2">
              {(["all", "following", "trending"] as FilterTab[]).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-4 py-2 rounded-lg font-bold text-sm transition-all ${
                    activeTab === tab
                      ? "bg-purple-600 text-white shadow-md"
                      : "text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  {tab === "all" && "🌐 All"}
                  {tab === "following" && "👥 Following"}
                  {tab === "trending" && "🔥 Trending"}
                </button>
              ))}
            </div>

            {/* Time Filter */}
            <select
              value={timeFilter}
              onChange={(e) => setTimeFilter(e.target.value as TimeFilter)}
              className="px-4 py-2 rounded-xl border-2 border-gray-200 focus:border-purple-500 outline-none font-medium bg-white"
            >
              <option value="1h">Last Hour</option>
              <option value="24h">Last 24h</option>
              <option value="7d">Last 7 Days</option>
              <option value="all">All Time</option>
            </select>

            {/* Token Filter */}
            <select
              value={selectedToken}
              onChange={(e) => setSelectedToken(e.target.value)}
              className="px-4 py-2 rounded-xl border-2 border-gray-200 focus:border-purple-500 outline-none font-medium bg-white"
            >
              <option value="all">All Tokens</option>
              {uniqueTokens.map((token) => (
                <option key={token} value={token}>
                  {getSymbol(token)}
                </option>
              ))}
            </select>

            {/* Results count */}
            <div className="ml-auto text-gray-600 font-medium">
              {filteredSwaps.length}{" "}
              {filteredSwaps.length === 1 ? "trade" : "trades"}
            </div>
          </div>
        </div>

        {/* Feed */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Feed (2/3 width) */}
          <div className="lg:col-span-2 space-y-4">
            {loading ? (
              // Loading skeletons
              [...Array(5)].map((_, i) => (
                <div
                  key={`skeleton-${i}`}
                  className="bg-white rounded-2xl p-6 shadow-lg animate-pulse"
                >
                  <div className="flex gap-4">
                    <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
                    <div className="flex-1 space-y-3">
                      <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                      <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                      <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                    </div>
                  </div>
                </div>
              ))
            ) : filteredSwaps.length === 0 ? (
              // Empty state
              <div className="bg-white rounded-2xl p-12 shadow-lg text-center">
                <div className="text-6xl mb-4">📭</div>
                <h3 className="text-2xl font-bold text-gray-800 mb-2">
                  No trades found
                </h3>
                <p className="text-gray-600 mb-6">
                  Try adjusting your filters or be the first to trade!
                </p>
                <Link
                  href="/swap"
                  className="inline-block px-6 py-3 bg-purple-600 text-white rounded-xl font-bold hover:bg-purple-700 transition"
                >
                  Start Trading →
                </Link>
              </div>
            ) : (
              // Feed items
              filteredSwaps.map((swap) => {
                const userAddr = swap.user.toLowerCase();
                const profile = profiles[userAddr];
                const inputVal = formatAmount(swap.inputAmount);
                const outputVal = formatAmount(swap.outputAmount);
                const symbolIn = getSymbol(swap.inputToken);
                const symbolOut = getSymbol(swap.outputToken);

                return (
                  <div
                    key={`${swap.txHash}-${swap.timestamp}`}
                    className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all border-2 border-transparent hover:border-purple-200"
                  >
                    <div className="flex gap-4">
                      {/* Avatar */}
                      <div className="flex-shrink-0">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-400 to-blue-400 flex items-center justify-center text-white font-bold text-lg shadow-md">
                          {profile?.username?.[0]?.toUpperCase() || "?"}
                        </div>
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        {/* User info */}
                        <div className="flex items-center gap-2 mb-2 flex-wrap">
                          {profile ? (
                            <>
                              <Link
                                href={`/profile/${userAddr}`}
                                className="font-bold text-gray-800 hover:text-purple-600 transition"
                              >
                                {profile.username}
                              </Link>
                              {(profile.reputation || 0) >= 150 && (
                                <span className="px-2 py-0.5 bg-yellow-100 text-yellow-700 rounded-full text-xs font-bold">
                                  ⭐ Pro
                                </span>
                              )}
                            </>
                          ) : (
                            <span className="font-mono text-sm text-gray-600">
                              {userAddr.slice(0, 8)}...{userAddr.slice(-6)}
                            </span>
                          )}
                          <span className="text-gray-400">•</span>
                          <span className="text-sm text-gray-500">
                            {formatTimeAgo(swap.timestamp)}
                          </span>
                        </div>

                        {/* Bio */}
                        {profile?.bio && (
                          <div className="text-sm text-gray-600 mb-3 italic">
                            {profile.bio}
                          </div>
                        )}

                        {/* Swap details */}
                        <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl p-4 mb-4">
                          <div className="flex items-center justify-between flex-wrap gap-2">
                            <div>
                              <div className="text-xs text-gray-500 mb-1">
                                Sold
                              </div>
                              <div className="font-bold text-lg text-gray-800">
                                {inputVal} {symbolIn}
                              </div>
                            </div>
                            <div className="text-2xl text-purple-500">→</div>
                            <div>
                              <div className="text-xs text-gray-500 mb-1">
                                Bought
                              </div>
                              <div className="font-bold text-lg text-gray-800">
                                {outputVal} {symbolOut}
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-2 flex-wrap">
                          {/* Auto Copy Button - Advanced Permissions */}
                          {profile &&
                            address &&
                            userAddr !== address.toLowerCase() && (
                              <CopyTradeButton
                                traderAddress={userAddr}
                                traderUsername={profile.username}
                                inputToken={swap.inputToken}
                                outputToken={swap.outputToken}
                                inputAmount={swap.inputAmount}
                              />
                            )}

                          {/* Manual Copy Button */}
                          <button
                            onClick={() =>
                              setCopyTradeModal({ swap, profile })
                            }
                            className="flex-1 px-4 py-2 bg-purple-100 text-purple-700 rounded-xl font-bold hover:bg-purple-200 transition flex items-center justify-center gap-2 text-sm"
                          >
                            📋 Manual Copy
                          </button>

                          <a
                            href={`https://testnet.bscscan.com/tx/${swap.txHash}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-4 py-2 border-2 border-gray-200 text-gray-700 rounded-xl font-medium hover:border-purple-300 hover:bg-purple-50 transition text-sm"
                          >
                            View Tx ↗
                          </a>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Sidebar (1/3 width) */}
          <div className="space-y-6">
            {/* Top Traders */}
            <div className="bg-white rounded-2xl p-6 shadow-lg">
              <h3 className="text-xl font-black text-gray-800 mb-4">
                🏆 Top Traders
              </h3>
              <div className="space-y-3">
                {Object.values(profiles)
                  .filter((p) => p.totalSwaps && p.totalSwaps > 0)
                  .sort((a, b) => (b.totalSwaps || 0) - (a.totalSwaps || 0))
                  .slice(0, 5)
                  .map((profile, idx) => (
                    <Link
                      key={profile.walletAddress}
                      href={`/profile/${profile.walletAddress}`}
                      className="flex items-center gap-3 p-3 rounded-xl hover:bg-purple-50 transition group"
                    >
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-purple-400 to-blue-400 flex items-center justify-center text-white font-bold text-sm">
                        #{idx + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-bold text-gray-800 group-hover:text-purple-600 transition truncate">
                          {profile.username}
                        </div>
                        <div className="text-xs text-gray-500">
                          {profile.totalSwaps} trades
                        </div>
                      </div>
                      {(profile.reputation || 0) >= 150 && (
                        <div className="flex-shrink-0">⭐</div>
                      )}
                    </Link>
                  ))}
              </div>
            </div>

            {/* Quick Stats */}
            <div className="bg-gradient-to-br from-purple-500 to-blue-600 rounded-2xl p-6 shadow-lg text-white">
              <h3 className="text-xl font-black mb-4">
                ⚡ Advanced Permissions
              </h3>
              <ul className="space-y-2 text-sm">
                <li>• Auto-copy trades with one permission</li>
                <li>• No manual approvals needed</li>
                <li>• Set daily spending limits</li>
                <li>• Revoke anytime instantly</li>
              </ul>
              <Link
                href="/profile"
                className="mt-4 block w-full px-4 py-3 bg-white text-purple-600 rounded-xl font-bold text-center hover:bg-gray-100 transition"
              >
                Complete Your Profile →
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Manual Copy Trade Modal */}
      {copyTradeModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b-2 border-gray-100">
              <h3 className="text-2xl font-black text-gray-800">
                Manual Copy Trade
              </h3>
              <button
                onClick={() => setCopyTradeModal(null)}
                className="text-gray-400 hover:text-gray-600 text-2xl"
                aria-label="Close modal"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Trader info */}
              <div className="flex items-center gap-3 p-4 bg-purple-50 rounded-xl">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-400 to-blue-400 flex items-center justify-center text-white font-bold text-lg">
                  {copyTradeModal.profile?.username?.[0]?.toUpperCase() || "?"}
                </div>
                <div>
                  <div className="font-bold text-gray-800">
                    {copyTradeModal.profile?.username || "Anonymous Trader"}
                  </div>
                  <div className="text-sm text-gray-500">
                    {copyTradeModal.profile?.totalSwaps || 0} trades
                  </div>
                </div>
              </div>

              {/* Trade details */}
              <div className="space-y-4">
                <div className="bg-gray-50 rounded-xl p-4">
                  <div className="text-sm text-gray-500 mb-2">You'll swap</div>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      value={copyAmount}
                      onChange={(e) => setCopyAmount(e.target.value)}
                      placeholder={formatAmount(
                        copyTradeModal.swap.inputAmount
                      )}
                      className="flex-1 text-xl font-bold text-gray-800 bg-transparent outline-none"
                      step="0.0001"
                      min="0"
                    />
                    <span className="font-bold text-gray-600">
                      {getSymbol(copyTradeModal.swap.inputToken)}
                    </span>
                  </div>
                </div>

                <div className="text-center text-2xl text-purple-500">↓</div>

                <div className="bg-gray-50 rounded-xl p-4">
                  <div className="text-sm text-gray-500 mb-2">
                    To receive
                  </div>
                  <div className="text-xl font-bold text-gray-800">
                    ~{formatAmount(copyTradeModal.swap.outputAmount)}{" "}
                    {getSymbol(copyTradeModal.swap.outputToken)}
                  </div>
                </div>
              </div>

              {/* Warning */}
              <div className="bg-yellow-50 border-2 border-yellow-200 rounded-xl p-4">
                <div className="text-sm text-yellow-800">
                  ⚠️ Note: Prices may have changed since the original trade.
                  Always review before confirming.
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <button
                  onClick={() => setCopyTradeModal(null)}
                  className="flex-1 px-6 py-3 border-2 border-gray-200 text-gray-700 rounded-xl font-bold hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCopyTrade}
                  className="flex-1 px-6 py-3 bg-purple-600 text-white rounded-xl font-bold hover:bg-purple-700 transition shadow-lg"
                >
                  Copy Trade →
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}