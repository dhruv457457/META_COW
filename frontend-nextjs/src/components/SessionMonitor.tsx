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
      <div className="bg-white rounded-3xl shadow-xl border border-purple-100 p-12">
        <div className="flex flex-col items-center justify-center">
          <div className="w-16 h-16 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin mb-4"></div>
          <p className="text-slate-600 font-medium">Loading session data...</p>
        </div>
      </div>
    );
  }

  if (!data?.session) {
    return (
      <div className="bg-gradient-to-br from-purple-500 to-blue-500 rounded-3xl shadow-xl p-12 text-center text-white">
        <div className="w-24 h-24 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center mx-auto mb-6 border-4 border-white/30">
          <span className="text-5xl">🤖</span>
        </div>
        <h3 className="text-3xl font-black mb-3">
          Smart Account Agent
        </h3>
        <p className="text-lg mb-2 opacity-90">
          No session account yet
        </p>
        <p className="text-sm opacity-75 mb-8 max-w-md mx-auto">
          Enable auto-copy trading to create your smart account agent and start following top traders automatically.
        </p>
        <Link
          href="/copy-trade"
          className="inline-flex items-center gap-2 px-8 py-4 bg-white text-purple-600 font-bold rounded-xl hover:shadow-2xl hover:scale-105 transition-all"
        >
          <span>🚀</span> Create Session Account
        </Link>
      </div>
    );
  }

  const session = data.session;

  return (
    <div className="space-y-6">
      {/* Session Account Card */}
      <div className="bg-gradient-to-br from-purple-500 via-blue-500 to-cyan-500 rounded-3xl shadow-xl p-8 text-white">
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center shadow-lg border-2 border-white/30">
              <span className="text-4xl">🤖</span>
            </div>
            <div>
              <h3 className="text-2xl font-black mb-1">
                Smart Account Agent
              </h3>
              <p className="text-sm opacity-90">Automated Trading Active</p>
            </div>
          </div>
          <div className="px-4 py-2 bg-green-400/30 backdrop-blur-sm text-green-100 text-sm font-bold rounded-full border border-green-300/50 flex items-center gap-2">
            <span className="w-2 h-2 bg-green-300 rounded-full animate-pulse"></span>
            ONLINE
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Smart Account */}
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-5 border border-white/20">
            <div className="flex items-center justify-between mb-2">
              <div className="text-xs font-bold opacity-75 flex items-center gap-2">
                <span>🎯</span> SMART ACCOUNT
              </div>
              <button
                onClick={() => navigator.clipboard.writeText(session.smartAccountAddress)}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                title="Copy address"
              >
                📋
              </button>
            </div>
            <code className="text-sm font-mono font-bold">
              {formatAddress(session.smartAccountAddress)}
            </code>
          </div>

          {/* Signer */}
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-5 border border-white/20">
            <div className="flex items-center justify-between mb-2">
              <div className="text-xs font-bold opacity-75 flex items-center gap-2">
                <span>🔑</span> SIGNER (EOA)
              </div>
              <button
                onClick={() => navigator.clipboard.writeText(session.eoaAddress)}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                title="Copy address"
              >
                📋
              </button>
            </div>
            <code className="text-sm font-mono font-bold">
              {formatAddress(session.eoaAddress)}
            </code>
          </div>
        </div>

        <div className="text-center mt-6 pt-6 border-t border-white/20">
          <p className="text-sm opacity-75">
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
        <div className="bg-white rounded-2xl shadow-lg border border-purple-100 p-6 hover:shadow-xl hover:scale-105 transition-all">
          <div className="text-4xl font-black bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent mb-2">
            {data.stats.activePermissions}
          </div>
          <div className="text-sm text-slate-600 font-medium">Active</div>
        </div>

        <div className="bg-white rounded-2xl shadow-lg border border-blue-100 p-6 hover:shadow-xl hover:scale-105 transition-all">
          <div className="text-4xl font-black bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent mb-2">
            {data.stats.totalPermissions}
          </div>
          <div className="text-sm text-slate-600 font-medium">Following</div>
        </div>

        <div className="bg-white rounded-2xl shadow-lg border border-green-100 p-6 hover:shadow-xl hover:scale-105 transition-all">
          <div className="text-4xl font-black bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent mb-2">
            {data.stats.totalTrades}
          </div>
          <div className="text-sm text-slate-600 font-medium">Trades</div>
        </div>

        <div className="bg-white rounded-2xl shadow-lg border border-yellow-100 p-6 hover:shadow-xl hover:scale-105 transition-all">
          <div className="text-4xl font-black bg-gradient-to-r from-yellow-600 to-orange-600 bg-clip-text text-transparent mb-2">
            ${parseFloat(data.stats.totalVolume || "0").toFixed(0)}
          </div>
          <div className="text-sm text-slate-600 font-medium">Volume</div>
        </div>
      </div>

      {/* Active Permissions */}
      {data.permissions.length > 0 && (
        <div className="bg-white rounded-3xl shadow-xl border border-purple-100 p-6">
          <h4 className="font-black text-slate-800 mb-6 flex items-center gap-2 text-xl">
            <span>👥</span> Following Traders ({data.stats.activePermissions})
          </h4>
          
          <div className="space-y-3">
            {data.permissions.slice(0, 5).map((perm) => (
              <div 
                key={perm.id} 
                className="group flex items-center justify-between p-4 bg-gradient-to-br from-slate-50 to-purple-50/30 rounded-2xl border border-slate-200 hover:shadow-lg hover:scale-[1.02] transition-all"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-blue-500 rounded-xl flex items-center justify-center text-white font-bold">
                    {perm.traderUsername?.[0]?.toUpperCase() || "?"}
                  </div>
                  <div>
                    <div className="font-bold text-slate-800">
                      {perm.traderUsername || formatAddress(perm.traderAddress)}
                    </div>
                    <div className="text-xs text-slate-500">
                      <span className="font-semibold text-slate-700">
                        {parseFloat(perm.spentToday || "0").toFixed(2)}
                      </span>
                      {" / "}
                      {perm.dailyLimit} daily limit
                    </div>
                  </div>
                </div>
                <div className={`px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 ${
                  perm.isActive 
                    ? 'bg-green-100 text-green-700 border border-green-200' 
                    : 'bg-slate-100 text-slate-500 border border-slate-200'
                }`}>
                  <span className={`w-2 h-2 rounded-full ${perm.isActive ? 'bg-green-500' : 'bg-slate-400'}`}></span>
                  {perm.isActive ? 'ACTIVE' : 'PAUSED'}
                </div>
              </div>
            ))}
          </div>

          {data.permissions.length > 5 && (
            <Link
              href="/copy-trade"
              className="block text-center text-sm text-purple-600 hover:text-purple-700 font-bold mt-4 py-2 hover:bg-purple-50 rounded-xl transition-all"
            >
              View all {data.permissions.length} traders →
            </Link>
          )}
        </div>
      )}

      {/* Manage Button */}
      <Link
        href="/copy-trade"
        className="block w-full text-center px-6 py-4 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-bold rounded-2xl hover:shadow-xl hover:scale-[1.02] transition-all"
      >
        Manage Auto-Copy Trading →
      </Link>
    </div>
  );
}