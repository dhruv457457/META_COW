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

const RocketLaunchIcon = (props: any) => (
  <svg {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.59 14.37a6 6 0 01-5.84 7.38v-4.8m5.84-2.58a14.98 14.98 0 006.16-12.12A14.98 14.98 0 009.631 8.41m5.96 5.96a14.926 14.926 0 01-5.841 2.58m-.119-8.54a6 6 0 00-7.381 5.84h4.8m2.581-5.84a14.927 14.927 0 00-2.58 5.84m2.699 2.7c-.103.021-.207.041-.311.06a15.09 15.09 0 01-2.448-2.448 14.9 14.9 0 01.06-.312m-2.24 2.39a4.493 4.493 0 00-1.757 4.306 4.493 4.493 0 004.306-1.758M16.5 9a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" />
  </svg>
);

const ArrowRightIcon = (props: any) => (
  <svg {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
  </svg>
);

export default function SessionMonitor() {
  const { address } = useWallet();
  const [data, setData] = useState<SessionData | null>(null);
  const [loading, setLoading] = useState(true);

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
          <CpuChipIcon className="w-10 h-10 text-purple-600" />
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
          <RocketLaunchIcon className="w-5 h-5" />
          Create Session Account
        </Link>
      </div>
    );
  }

  const session = data.session;

  return (
    <div className="space-y-6">
      {/* Session Account Card */}
      <div className="bg-purple-600 rounded-2xl shadow-sm p-8 text-white overflow-hidden">
        <div className="flex items-start justify-between mb-6 flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0">
              <CpuChipIcon className="w-8 h-8" />
            </div>
            <div className="min-w-0">
              <h3 className="text-xl font-bold mb-1">
                Smart Account Agent
              </h3>
              <p className="text-sm text-purple-100">Automated Trading Active</p>
            </div>
          </div>
          <div className="px-3 py-1.5 bg-green-400/20 text-green-100 text-sm font-semibold rounded-full border border-green-300/30 flex items-center gap-1.5 flex-shrink-0">
            <span className="w-2 h-2 bg-green-300 rounded-full animate-pulse"></span>
            ONLINE
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white/10 rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="text-xs font-semibold text-purple-200 flex items-center gap-1">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                SMART ACCOUNT
              </div>
              <button
                onClick={() => navigator.clipboard.writeText(session.smartAccountAddress)}
                className="p-1.5 hover:bg-white/10 rounded transition-colors"
                title="Copy address"
              >
                <DocumentDuplicateIcon className="w-4 h-4" />
              </button>
            </div>
            <code className="text-sm font-mono font-semibold break-all">
              {formatAddress(session.smartAccountAddress)}
            </code>
          </div>

          <div className="bg-white/10 rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="text-xs font-semibold text-purple-200 flex items-center gap-1">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 8a6 6 0 01-7.743 5.743L10 14l-1 1-1 1H6v2H2v-4l4.257-4.257A6 6 0 1118 8zm-6-4a1 1 0 100 2 2 2 0 012 2 1 1 0 102 0 4 4 0 00-4-4z" clipRule="evenodd" />
                </svg>
                SIGNER (EOA)
              </div>
              <button
                onClick={() => navigator.clipboard.writeText(session.eoaAddress)}
                className="p-1.5 hover:bg-white/10 rounded transition-colors"
                title="Copy address"
              >
                <DocumentDuplicateIcon className="w-4 h-4" />
              </button>
            </div>
            <code className="text-sm font-mono font-semibold break-all">
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
          <div className="text-3xl font-bold text-purple-600 mb-1 break-words">
            {data.stats.activePermissions}
          </div>
          <div className="text-sm text-gray-600">Active</div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 hover:shadow-md transition-shadow">
          <div className="text-3xl font-bold text-blue-600 mb-1 break-words">
            {data.stats.totalPermissions}
          </div>
          <div className="text-sm text-gray-600">Following</div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 hover:shadow-md transition-shadow">
          <div className="text-3xl font-bold text-green-600 mb-1 break-words">
            {data.stats.totalTrades}
          </div>
          <div className="text-sm text-gray-600">Trades</div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 hover:shadow-md transition-shadow">
          <div className="text-3xl font-bold text-orange-600 mb-1 break-words">
            {formatVolume(data.stats.totalVolume || "0")}
          </div>
          <div className="text-sm text-gray-600">Volume</div>
        </div>
      </div>

      {/* Following Traders */}
      {data.permissions.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          <h4 className="font-bold text-gray-900 mb-6 flex items-center gap-2 text-lg">
            <UsersIcon className="w-5 h-5" />
            Following Traders ({data.stats.activePermissions})
          </h4>
          
          <div className="space-y-3">
            {data.permissions.slice(0, 5).map((perm) => (
              <div 
                key={perm.id} 
                className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-200 hover:bg-gray-100 transition-colors gap-4"
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className="w-11 h-11 bg-purple-600 rounded-lg flex items-center justify-center text-white font-bold flex-shrink-0">
                    {perm.traderUsername?.[0]?.toUpperCase() || "?"}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="font-semibold text-gray-900 truncate">
                      {perm.traderUsername || formatAddress(perm.traderAddress)}
                    </div>
                    <div className="text-xs text-gray-500">
                      <span className="font-semibold text-gray-700">
                        {parseFloat(perm.spentToday || "0").toFixed(2)}
                      </span>
                      {" / "}
                      {perm.dailyLimit} daily
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
        className="flex items-center justify-center gap-2 w-full px-6 py-4 bg-purple-600 text-white font-semibold rounded-xl hover:bg-purple-700 transition-colors"
      >
        Manage Auto-Copy Trading
        <ArrowRightIcon className="w-5 h-5" />
      </Link>
    </div>
  );
}