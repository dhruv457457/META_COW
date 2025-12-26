"use client";

import { useState, useEffect } from "react";
import { useWallet } from "@/context/WalletContext";
import Link from "next/link";

interface SessionData {
  session: {
    smartAccountAddress: string;
    eoaAddress: string;
    createdAt: string;
  } | null;
  permissions: Array<{
    id: string;
    traderAddress: string;
    traderUsername: string;
    inputToken: string;
    dailyLimit: string;
    spentToday: string;
    isActive: boolean;
    expiresAt?: string;
    createdAt: string;
  }>;
  stats: {
    totalPermissions: number;
    activePermissions: number;
    totalTrades: number;
    totalVolume: string;
  };
}

export default function SessionMonitor() {
  const { address } = useWallet();
  const [data, setData] = useState<SessionData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSessionData = async () => {
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
        console.error("Failed to fetch session data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchSessionData();
    const interval = setInterval(fetchSessionData, 30000);
    return () => clearInterval(interval);
  }, [address]);

  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  if (loading) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-12">
        <div className="flex flex-col items-center justify-center">
          <div className="w-12 h-12 border-3 border-gray-300 border-t-purple-600 rounded-full animate-spin mb-4"></div>
          <p className="text-gray-600">Loading session data...</p>
        </div>
      </div>
    );
  }

  if (!data?.session) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-12 text-center">
        <div className="w-20 h-20 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <span className="text-4xl">🤖</span>
        </div>
        <h3 className="text-2xl font-bold text-gray-900 mb-3">
          Smart Account Agent
        </h3>
        <p className="text-gray-600 mb-2">
          No session account yet
        </p>
        <p className="text-sm text-gray-500 mb-8 max-w-md mx-auto">
          Enable auto-copy trading to create your smart account agent.
        </p>
        <Link
          href="/copy-trade"
          className="inline-flex items-center gap-2 px-6 py-3 bg-purple-600 text-white font-semibold rounded-lg hover:bg-purple-700 transition-colors"
        >
          🚀 Create Session Account
        </Link>
      </div>
    );
  }

  const session = data.session;

  return (
    <div className="space-y-6">
      {/* Session Account Card */}
      <div className="bg-purple-600 rounded-2xl shadow-sm p-8 text-white">
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center">
              <span className="text-3xl">🤖</span>
            </div>
            <div>
              <h3 className="text-xl font-bold mb-1">
                Smart Account Agent
              </h3>
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
              <div className="text-xs font-semibold text-purple-200">
                🎯 SMART ACCOUNT
              </div>
              <button
                onClick={() => navigator.clipboard.writeText(session.smartAccountAddress)}
                className="p-1.5 hover:bg-white/10 rounded transition-colors"
                title="Copy address"
              >
                📋
              </button>
            </div>
            <code className="text-sm font-mono font-semibold">
              {formatAddress(session.smartAccountAddress)}
            </code>
          </div>

          <div className="bg-white/10 rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="text-xs font-semibold text-purple-200">
                🔑 SIGNER (EOA)
              </div>
              <button
                onClick={() => navigator.clipboard.writeText(session.eoaAddress)}
                className="p-1.5 hover:bg-white/10 rounded transition-colors"
                title="Copy address"
              >
                📋
              </button>
            </div>
            <code className="text-sm font-mono font-semibold">
              {formatAddress(session.eoaAddress)}
            </code>
          </div>
        </div>

        <div className="text-center mt-6 pt-6 border-t border-white/20">
          <p className="text-sm text-purple-200">
            Created {new Date(session.createdAt).toLocaleDateString('en-US', {
              month: 'long',
              day: 'numeric',
              year: 'numeric'
            })}
          </p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 hover:shadow-md transition-shadow">
          <div className="text-3xl font-bold text-purple-600 mb-1">
            {data.stats.activePermissions}
          </div>
          <div className="text-sm text-gray-600">Active</div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 hover:shadow-md transition-shadow">
          <div className="text-3xl font-bold text-blue-600 mb-1">
            {data.stats.totalPermissions}
          </div>
          <div className="text-sm text-gray-600">Following</div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 hover:shadow-md transition-shadow">
          <div className="text-3xl font-bold text-green-600 mb-1">
            {data.stats.totalTrades}
          </div>
          <div className="text-sm text-gray-600">Trades</div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 hover:shadow-md transition-shadow">
          <div className="text-3xl font-bold text-orange-600 mb-1">
            ${parseFloat(data.stats.totalVolume || "0").toFixed(0)}
          </div>
          <div className="text-sm text-gray-600">Volume</div>
        </div>
      </div>

      {/* Following Traders */}
      {data.permissions.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          <h4 className="font-bold text-gray-900 mb-6 flex items-center gap-2 text-lg">
            👥 Following Traders ({data.stats.activePermissions})
          </h4>
          
          <div className="space-y-3">
            {data.permissions.slice(0, 5).map((perm) => (
              <div 
                key={perm.id} 
                className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-200 hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 bg-purple-600 rounded-lg flex items-center justify-center text-white font-bold">
                    {perm.traderUsername?.[0]?.toUpperCase() || "?"}
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900">
                      {perm.traderUsername || formatAddress(perm.traderAddress)}
                    </div>
                    <div className="text-xs text-gray-500">
                      <span className="font-semibold text-gray-700">
                        {parseFloat(perm.spentToday || "0").toFixed(2)}
                      </span>
                      {" / "}
                      {perm.dailyLimit} daily limit
                    </div>
                  </div>
                </div>
                <div className={`px-3 py-1 rounded-full text-xs font-semibold ${
                  perm.isActive 
                    ? 'bg-green-100 text-green-700 border border-green-200' 
                    : 'bg-gray-200 text-gray-600 border border-gray-300'
                }`}>
                  {perm.isActive ? 'ACTIVE' : 'PAUSED'}
                </div>
              </div>
            ))}
          </div>

          {data.permissions.length > 5 && (
            <Link
              href="/copy-trade"
              className="block text-center text-sm text-purple-600 hover:text-purple-700 font-semibold mt-4 py-2 hover:bg-purple-50 rounded-lg transition-colors"
            >
              View all {data.permissions.length} traders →
            </Link>
          )}
        </div>
      )}

      {/* Manage Button */}
      <Link
        href="/copy-trade"
        className="block w-full text-center px-6 py-4 bg-purple-600 text-white font-semibold rounded-xl hover:bg-purple-700 transition-colors"
      >
        Manage Auto-Copy Trading →
      </Link>
    </div>
  );
}