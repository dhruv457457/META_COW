"use client";

import { useState, useEffect } from "react";
import { useWallet } from "@/context/WalletContext";
import { toast } from "react-hot-toast";

interface Permission {
  id: string;
  traderAddress: string;
  traderUsername: string;
  inputToken: string;
  dailyLimit: string;
  spentToday: string;
  isActive: boolean;
  expiresAt: string;
  createdAt: string;
}

interface SessionData {
  session: {
    address: string;
    createdAt: string;
  } | null;
  permissions: Permission[];
  stats: {
    totalPermissions: number;
    activePermissions: number;
    totalTrades: number;
    totalVolume: string;
  };
}

const formatAddress = (addr: string) => `${addr.slice(0, 8)}...${addr.slice(-6)}`;

const formatDate = (date: string) => {
  return new Date(date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

export default function SessionMonitor() {
  const { address, isConnected } = useWallet();
  const [sessionData, setSessionData] = useState<SessionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);
  
  const loadSessionData = async () => {
    if (!address) return;
    
    setLoading(true);
    try {
      const res = await fetch(`/api/sessions/list?userWallet=${address}`);
      if (res.ok) {
        const data = await res.json();
        setSessionData(data);
      } else {
        throw new Error("Failed to fetch session data");
      }
    } catch (error) {
      console.error("Failed to load session data:", error);
      toast.error("Failed to load session account data");
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    if (isConnected && address) {
      loadSessionData();
    }
  }, [address, isConnected]);
  
  if (!isConnected) {
    return null;
  }
  
  if (loading) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/2 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
        </div>
      </div>
    );
  }
  
  if (!sessionData?.session) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center">
            <span className="text-2xl">🤖</span>
          </div>
          <div>
            <h3 className="font-bold text-gray-900">Smart Account Agent</h3>
            <p className="text-sm text-gray-500">No session account yet</p>
          </div>
        </div>
        <p className="text-sm text-gray-600 mb-4">
          Set up auto-copy trading to create your session account.
        </p>
      </div>
    );
  }
  
  const { session, permissions, stats } = sessionData;
  
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      {/* Header */}
      <div className="p-6 bg-gradient-to-br from-purple-50 to-pink-50 border-b border-purple-100">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-purple-600 flex items-center justify-center shadow-lg">
              <span className="text-2xl">🤖</span>
            </div>
            <div>
              <h3 className="font-bold text-gray-900">Smart Account Agent</h3>
              <p className="text-sm text-gray-600">Automated copy trading</p>
            </div>
          </div>
          <button
            onClick={() => setExpanded(!expanded)}
            className="p-2 hover:bg-white/50 rounded-lg transition"
          >
            <span className="text-xl">{expanded ? "▼" : "▶"}</span>
          </button>
        </div>
        
        {/* Session Address */}
        <div className="bg-white rounded-lg p-3 font-mono text-sm">
          <div className="text-xs text-gray-600 mb-1">Session Account</div>
          <div className="text-purple-700 font-bold break-all">
            {session.address}
          </div>
        </div>
      </div>
      
      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-4 p-6 bg-gray-50">
        <div>
          <div className="text-2xl font-bold text-purple-600">{stats.activePermissions}</div>
          <div className="text-xs text-gray-600">Active Permissions</div>
        </div>
        <div>
          <div className="text-2xl font-bold text-green-600">{stats.totalTrades}</div>
          <div className="text-xs text-gray-600">Total Trades</div>
        </div>
        <div className="col-span-2">
          <div className="text-2xl font-bold text-blue-600">{stats.totalVolume}</div>
          <div className="text-xs text-gray-600">Total Volume (tokens)</div>
        </div>
      </div>
      
      {/* Permissions List (Expandable) */}
      {expanded && permissions.length > 0 && (
        <div className="border-t border-gray-100">
          <div className="p-4 bg-gray-50 border-b border-gray-100">
            <h4 className="font-bold text-gray-900 text-sm">Active Permissions</h4>
          </div>
          
          <div className="divide-y divide-gray-100 max-h-96 overflow-y-auto">
            {permissions.map((permission) => {
              const spentPercent = (parseFloat(permission.spentToday) / parseFloat(permission.dailyLimit)) * 100;
              
              return (
                <div key={permission.id} className="p-4 hover:bg-gray-50 transition">
                  <div className="flex items-center justify-between mb-2">
                    <div className="font-bold text-gray-900">
                      {permission.traderUsername}
                    </div>
                    <div className={`text-xs font-bold px-2 py-1 rounded ${
                      permission.isActive 
                        ? 'bg-green-100 text-green-700' 
                        : 'bg-gray-100 text-gray-600'
                    }`}>
                      {permission.isActive ? 'Active' : 'Inactive'}
                    </div>
                  </div>
                  
                  <div className="text-xs text-gray-600 space-y-1">
                    <div>Trader: {formatAddress(permission.traderAddress)}</div>
                    <div>Created: {formatDate(permission.createdAt)}</div>
                    <div>Expires: {formatDate(permission.expiresAt)}</div>
                  </div>
                  
                  {/* Daily Limit Progress */}
                  <div className="mt-3">
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="text-gray-600">Daily Spend</span>
                      <span className="font-bold text-gray-900">
                        {permission.spentToday} / {permission.dailyLimit}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                      <div 
                        className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${Math.min(spentPercent, 100)}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
      
      {/* Footer Info */}
      <div className="p-4 bg-gray-50 border-t border-gray-100">
        <div className="flex items-start gap-2 text-xs text-gray-600">
          <span>ℹ️</span>
          <p>
            Your session account executes trades on your behalf using granted permissions. 
            You maintain full control and can revoke access anytime.
          </p>
        </div>
      </div>
    </div>
  );
}