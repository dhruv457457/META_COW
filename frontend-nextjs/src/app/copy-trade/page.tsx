"use client";

import { useState, useEffect } from "react";
import { useWallet } from "@/context/WalletContext";
import { toast } from "react-hot-toast";
import Link from "next/link";

interface CopyPermission {
  id: string;
  traderAddress: string;
  traderUsername: string;
  inputToken: string;
  dailyLimit: string;
  spentToday: string;
  isActive: boolean;
  expiresAt?: string;
  createdAt: string;
}

interface SessionData {
  session: {
    smartAccountAddress: string;
    eoaAddress: string;
    createdAt: string;
  } | null;
  permissions: CopyPermission[];
  stats: {
    totalPermissions: number;
    activePermissions: number;
    totalTrades: number;
    totalVolume: string;
  };
}

// Professional Icons
const CpuChipIcon = (props: any) => (
  <svg {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 3v1.5M4.5 8.25H3m18 0h-1.5M4.5 12H3m18 0h-1.5m-15 3.75H3m18 0h-1.5M8.25 19.5V21M12 3v1.5m0 15V21m3.75-18v1.5m0 15V21m-9-1.5h10.5a2.25 2.25 0 002.25-2.25V6.75a2.25 2.25 0 00-2.25-2.25H6.75A2.25 2.25 0 004.5 6.75v10.5a2.25 2.25 0 002.25 2.25zm.75-12h9v9h-9v-9z" />
  </svg>
);

const UsersIcon = (props: any) => (
  <svg {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
  </svg>
);

const DocumentDuplicateIcon = (props: any) => (
  <svg {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 01-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 011.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.876a9.06 9.06 0 00-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125v3.5m7.5 10.375H9.375a1.125 1.125 0 01-1.125-1.125v-9.25m12 6.625v-1.875a3.375 3.375 0 00-3.375-3.375h-1.5a1.125 1.125 0 01-1.125-1.125v-1.5a3.375 3.375 0 00-3.375-3.375H9.75" />
  </svg>
);

const PauseIcon = (props: any) => (
  <svg {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25v13.5m-7.5-13.5v13.5" />
  </svg>
);

const PlayIcon = (props: any) => (
  <svg {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.348a1.125 1.125 0 010 1.971l-11.54 6.347a1.125 1.125 0 01-1.667-.985V5.653z" />
  </svg>
);

const TrashIcon = (props: any) => (
  <svg {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
  </svg>
);

const ArrowPathIcon = (props: any) => (
  <svg {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
  </svg>
);

const SparklesIcon = (props: any) => (
  <svg {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" />
  </svg>
);

export default function CopyTradePage() {
  const { address, isConnected } = useWallet();
  const [data, setData] = useState<SessionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Format large numbers with K, M, B, T suffixes
  const formatVolume = (value: string | number): string => {
    const num = typeof value === 'string' ? parseFloat(value) : value;
    
    if (isNaN(num) || num === 0) return "$0";
    
    const absNum = Math.abs(num);
    
    if (absNum >= 1_000_000_000_000) {
      return `$${(num / 1_000_000_000_000).toFixed(2)}T`;
    } else if (absNum >= 1_000_000_000) {
      return `$${(num / 1_000_000_000).toFixed(2)}B`;
    } else if (absNum >= 1_000_000) {
      return `$${(num / 1_000_000).toFixed(2)}M`;
    } else if (absNum >= 1_000) {
      return `$${(num / 1_000).toFixed(2)}K`;
    } else {
      return `$${num.toFixed(2)}`;
    }
  };

  const fetchData = async () => {
    if (!address) {
      setLoading(false);
      return;
    }

    try {
      const res = await fetch(`/api/sessions/list?userWallet=${address}`);
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch (err) {
      console.error("Failed to fetch data:", err);
      toast.error("Failed to load copy trading data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [address]);

  const handleToggle = async (permissionId: string, currentState: boolean) => {
    try {
      setActionLoading(permissionId);
      const res = await fetch("/api/copy-trade/toggle", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          permissionId,
          isActive: !currentState 
        }),
      });

      if (!res.ok) throw new Error("Failed to toggle");
      
      toast.success(currentState ? "Paused copy trading" : "Resumed copy trading");
      await fetchData();
    } catch (err) {
      console.error("Toggle error:", err);
      toast.error("Failed to update status");
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async (permissionId: string, traderUsername: string) => {
    if (!confirm(`Stop copying ${traderUsername}?`)) return;

    try {
      setActionLoading(permissionId);
      const res = await fetch("/api/copy-trade/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ permissionId }),
      });

      if (!res.ok) throw new Error("Failed to delete");
      
      toast.success(`Stopped copying ${traderUsername}`);
      await fetchData();
    } catch (err) {
      console.error("Delete error:", err);
      toast.error("Failed to remove permission");
    } finally {
      setActionLoading(null);
    }
  };

  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-3 border-gray-300 border-t-purple-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading copy trading dashboard...</p>
        </div>
      </div>
    );
  }

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-sm p-12 text-center border border-gray-200">
          <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CpuChipIcon className="w-8 h-8 text-purple-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-3">Connect Wallet</h2>
          <p className="text-gray-600">Connect your wallet to manage copy trading</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center gap-3">
            <CpuChipIcon className="w-8 h-8 text-purple-600" />
            Auto Copy Trading Dashboard
          </h1>
          <p className="text-gray-600">Manage your automated copy trading permissions</p>
        </div>

        {/* Session Account Card */}
        {data?.session && (
          <div className="bg-purple-600 rounded-2xl shadow-sm p-8 text-white mb-6">
            <div className="flex items-start justify-between mb-6 flex-wrap gap-4">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0">
                  <CpuChipIcon className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="text-xl font-bold mb-1">Smart Account Agent</h3>
                  <p className="text-sm text-purple-100">Automated Trading Active</p>
                </div>
              </div>
              <div className="px-3 py-1.5 bg-green-400/20 text-green-100 text-sm font-semibold rounded-full border border-green-300/30 flex items-center gap-1.5">
                <span className="w-2 h-2 bg-green-300 rounded-full animate-pulse"></span>
                ONLINE
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white/10 rounded-xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-xs font-semibold text-purple-200">SMART ACCOUNT</div>
                  <button
                    onClick={() => navigator.clipboard.writeText(data.session!.smartAccountAddress)}
                    className="p-1.5 hover:bg-white/10 rounded transition-colors"
                  >
                    <DocumentDuplicateIcon className="w-4 h-4" />
                  </button>
                </div>
                <code className="text-sm font-mono font-semibold break-all">
                  {formatAddress(data.session.smartAccountAddress)}
                </code>
              </div>

              <div className="bg-white/10 rounded-xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-xs font-semibold text-purple-200">SIGNER (EOA)</div>
                  <button
                    onClick={() => navigator.clipboard.writeText(data.session!.eoaAddress)}
                    className="p-1.5 hover:bg-white/10 rounded transition-colors"
                  >
                    <DocumentDuplicateIcon className="w-4 h-4" />
                  </button>
                </div>
                <code className="text-sm font-mono font-semibold break-all">
                  {formatAddress(data.session.eoaAddress)}
                </code>
              </div>
            </div>
          </div>
        )}

        {/* Stats */}
        {data?.stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
              <div className="text-3xl font-bold text-purple-600 mb-1">
                {data.stats.activePermissions}
              </div>
              <div className="text-sm text-gray-600">Active</div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
              <div className="text-3xl font-bold text-blue-600 mb-1">
                {data.stats.totalPermissions}
              </div>
              <div className="text-sm text-gray-600">Following</div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
              <div className="text-3xl font-bold text-green-600 mb-1">
                {data.stats.totalTrades}
              </div>
              <div className="text-sm text-gray-600">Trades</div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
              <div className="text-3xl font-bold text-orange-600 mb-1">
                {formatVolume(data.stats.totalVolume || "0")}
              </div>
              <div className="text-sm text-gray-600">Volume</div>
            </div>
          </div>
        )}

        {/* Permissions List */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <UsersIcon className="w-6 h-6" />
              Following Traders ({data?.permissions.length || 0})
            </h2>
            <button
              onClick={fetchData}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              title="Refresh"
            >
              <ArrowPathIcon className="w-5 h-5 text-gray-600" />
            </button>
          </div>

          {!data?.permissions || data.permissions.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <SparklesIcon className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">No Active Copy Trading</h3>
              <p className="text-gray-600 mb-6">Start following traders to automate your trading</p>
              <Link
                href="/social"
                className="inline-flex items-center gap-2 px-6 py-3 bg-purple-600 text-white font-semibold rounded-lg hover:bg-purple-700 transition-colors"
              >
                Browse Traders
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {data.permissions.map((perm) => (
                <div
                  key={perm.id}
                  className="border border-gray-200 rounded-xl p-5 hover:border-purple-200 hover:bg-purple-50/30 transition-all"
                >
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="w-12 h-12 bg-purple-600 rounded-lg flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
                        {perm.traderUsername?.[0]?.toUpperCase() || "?"}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="font-bold text-gray-900 text-lg truncate">
                          {perm.traderUsername || formatAddress(perm.traderAddress)}
                        </div>
                        <div className="text-sm text-gray-500 font-mono truncate">
                          {formatAddress(perm.traderAddress)}
                        </div>
                      </div>
                    </div>
                    <div className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap flex-shrink-0 ${
                      perm.isActive 
                        ? 'bg-green-100 text-green-700 border border-green-200' 
                        : 'bg-gray-200 text-gray-600 border border-gray-300'
                    }`}>
                      {perm.isActive ? 'ACTIVE' : 'PAUSED'}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <div className="bg-gray-50 rounded-lg p-3">
                      <div className="text-xs text-gray-600 mb-1">Daily Limit</div>
                      <div className="font-semibold text-gray-900">{perm.dailyLimit}</div>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-3">
                      <div className="text-xs text-gray-600 mb-1">Spent Today</div>
                      <div className="font-semibold text-gray-900">
                        {parseFloat(perm.spentToday || "0").toFixed(2)}
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => handleToggle(perm.id, perm.isActive)}
                      disabled={actionLoading === perm.id}
                      className={`flex-1 px-4 py-2 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2 ${
                        perm.isActive
                          ? 'bg-orange-100 text-orange-700 hover:bg-orange-200 border border-orange-200'
                          : 'bg-green-100 text-green-700 hover:bg-green-200 border border-green-200'
                      } disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                      {perm.isActive ? (
                        <>
                          <PauseIcon className="w-4 h-4" />
                          Pause
                        </>
                      ) : (
                        <>
                          <PlayIcon className="w-4 h-4" />
                          Resume
                        </>
                      )}
                    </button>
                    <button
                      onClick={() => handleDelete(perm.id, perm.traderUsername)}
                      disabled={actionLoading === perm.id}
                      className="px-4 py-2 bg-red-100 text-red-700 rounded-lg font-semibold hover:bg-red-200 transition-colors flex items-center gap-2 border border-red-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <TrashIcon className="w-4 h-4" />
                      Remove
                    </button>
                  </div>

                  {perm.expiresAt && (
                    <div className="text-xs text-gray-500 mt-3 text-center">
                      Expires: {new Date(perm.expiresAt).toLocaleDateString()}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick Links */}
        <div className="mt-6 flex gap-4 flex-wrap">
          <Link
            href="/social"
            className="flex-1 min-w-[200px] px-6 py-3 bg-white border border-gray-200 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 transition-colors text-center"
          >
            Browse Traders
          </Link>
          <Link
            href="/profile"
            className="flex-1 min-w-[200px] px-6 py-3 bg-purple-600 text-white font-semibold rounded-xl hover:bg-purple-700 transition-colors text-center"
          >
            View Profile
          </Link>
        </div>
      </div>
    </div>
  );
}