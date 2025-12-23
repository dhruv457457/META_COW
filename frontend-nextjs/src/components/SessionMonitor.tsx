// src/components/SessionMonitor.tsx
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
    
    // Refresh every 30 seconds
    const interval = setInterval(fetchSessionData, 30000);
    return () => clearInterval(interval);
  }, [address]);

  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  if (loading) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
        </div>
      </div>
    );
  }

  if (!data?.session) {
    return (
      <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl shadow-sm border border-purple-100 p-8">
        <div className="text-center">
          <div className="text-6xl mb-4">🤖</div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">
            Smart Account Agent
          </h3>
          <p className="text-gray-600 mb-6">
            No session account yet
          </p>
          <p className="text-sm text-gray-500 mb-6">
            Set up auto-copy trading to create your session account.
          </p>
          <Link
            href="/copy-trade"
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold rounded-xl hover:shadow-lg transition-all"
          >
            <span>🚀</span> Create Session Account
          </Link>
        </div>
      </div>
    );
  }

  // ✅ FIX: Extract session into a constant to narrow the type
  const session = data.session;

  return (
    <div className="space-y-4">
      {/* Session Account Card */}
      <div className="bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 rounded-2xl shadow-sm border border-purple-100 p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center shadow-lg">
              <span className="text-2xl">🤖</span>
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">
                Smart Account Agent
              </h3>
              <p className="text-sm text-gray-600">Active & Trading</p>
            </div>
          </div>
          <div className="px-3 py-1 bg-green-100 text-green-700 text-xs font-bold rounded-full">
            ● ACTIVE
          </div>
        </div>

        <div className="space-y-3">
          {/* Smart Account Address */}
          <div className="bg-white rounded-xl p-4">
            <div className="text-xs text-gray-500 mb-1 font-semibold">SMART ACCOUNT</div>
            <div className="flex items-center justify-between">
              <code className="text-sm font-mono text-purple-700">
                {formatAddress(session.smartAccountAddress)}
              </code>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(session.smartAccountAddress);
                }}
                className="text-gray-400 hover:text-purple-600 transition"
                title="Copy address"
              >
                📋
              </button>
            </div>
          </div>

          {/* EOA Address */}
          <div className="bg-white rounded-xl p-4">
            <div className="text-xs text-gray-500 mb-1 font-semibold">SIGNER (EOA)</div>
            <div className="flex items-center justify-between">
              <code className="text-sm font-mono text-blue-700">
                {formatAddress(session.eoaAddress)}
              </code>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(session.eoaAddress);
                }}
                className="text-gray-400 hover:text-blue-600 transition"
                title="Copy address"
              >
                📋
              </button>
            </div>
          </div>

          {/* Created Date */}
          <div className="text-center pt-2">
            <p className="text-xs text-gray-500">
              Created {new Date(session.createdAt).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric'
              })}
            </p>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <div className="text-2xl font-bold text-purple-600">
            {data.stats.activePermissions}
          </div>
          <div className="text-sm text-gray-600">Active Traders</div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <div className="text-2xl font-bold text-green-600">
            {data.stats.totalTrades}
          </div>
          <div className="text-sm text-gray-600">Copy Trades</div>
        </div>
      </div>

      {/* Active Permissions */}
      {data.permissions.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <h4 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
            <span>👥</span> Following ({data.stats.activePermissions})
          </h4>
          
          <div className="space-y-2">
            {data.permissions.slice(0, 3).map((perm) => (
              <div 
                key={perm.id} 
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              >
                <div>
                  <div className="font-semibold text-sm text-gray-900">
                    {perm.traderUsername || formatAddress(perm.traderAddress)}
                  </div>
                  <div className="text-xs text-gray-500">
                    {parseFloat(perm.spentToday || "0").toFixed(2)} / {perm.dailyLimit} daily
                  </div>
                </div>
                <div className={`px-2 py-1 rounded-full text-xs font-bold ${
                  perm.isActive 
                    ? 'bg-green-100 text-green-700' 
                    : 'bg-gray-100 text-gray-500'
                }`}>
                  {perm.isActive ? '● ON' : '○ OFF'}
                </div>
              </div>
            ))}
          </div>

          {data.permissions.length > 3 && (
            <Link
              href="/copy-trade"
              className="block text-center text-sm text-purple-600 hover:text-purple-700 font-semibold mt-3"
            >
              View all {data.permissions.length} →
            </Link>
          )}
        </div>
      )}

      {/* Action Button */}
      <Link
        href="/copy-trade"
        className="block w-full text-center px-4 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold rounded-xl hover:shadow-lg transition-all"
      >
        Manage Auto-Copy Trading →
      </Link>
    </div>
  );
}