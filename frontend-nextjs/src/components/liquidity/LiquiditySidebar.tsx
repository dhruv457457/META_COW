"use client";

import { useState, useEffect } from "react";
import { getClaimableRewards, getPoolStats, claimRewards } from "@/utils/contractUtils";
import { toast } from "react-hot-toast";
import confetti from "canvas-confetti";

interface LiquiditySidebarProps {
  lpBalance: string;
  pairAddress: string;
  address: string | null;
  onClaim: () => void;
}

export default function LiquiditySidebar({ lpBalance, pairAddress, address, onClaim }: LiquiditySidebarProps) {
  const [claimable, setClaimable] = useState("0.00");
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({ tvl: "-", volume: "-", apr: "-" });

  // Fetch Data Loop
  useEffect(() => {
    let isMounted = true;
    
    const fetchData = async () => {
      if (!pairAddress || !address) return;
      try {
        const [rewards, poolStats] = await Promise.all([
          getClaimableRewards(pairAddress, address),
          getPoolStats(pairAddress)
        ]);
        
        if (isMounted) {
          setClaimable(rewards);
          setStats({
            tvl: `$${poolStats.tvl.toLocaleString(undefined, { maximumFractionDigits: 2 })}`,
            volume: `$${poolStats.volume.toLocaleString(undefined, { maximumFractionDigits: 2 })}`,
            apr: `${poolStats.apr.toFixed(2)}%`,
          });
        }
      } catch (err) {
        console.warn("Failed to fetch sidebar stats", err);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 15000); // Refresh every 15s
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [pairAddress, address]);

  const handleClaim = async () => {
    if (!pairAddress) return;
    try {
      setLoading(true);
      await claimRewards(pairAddress);
      
      toast.success("Rewards claimed!");
      confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 } });
      
      onClaim(); // Refresh parent data
    } catch (err) {
      console.error("Claim failed:", err);
      toast.error("Failed to claim rewards.");
    } finally {
      setLoading(false);
    }
  };

  const isZeroRewards = parseFloat(claimable) === 0;
  const formattedLp = parseFloat(lpBalance).toLocaleString(undefined, { maximumFractionDigits: 4 });

  return (
    <div className="space-y-6">
      
      {/* Position Card */}
      <div className="bg-white rounded-3xl shadow-lg border border-gray-100 p-6">
        <h3 className="text-lg font-bold text-gray-800 mb-2 flex items-center gap-2">
          <span>💼</span> Your Position
        </h3>
        <div className="bg-blue-50 rounded-xl p-4 text-center">
          <p className="text-3xl font-bold text-blue-900" title={lpBalance}>
            {formattedLp}
          </p>
          <p className="text-sm text-blue-600 font-medium">LP Tokens</p>
        </div>
      </div>

      {/* Rewards Card */}
      <div className="bg-white rounded-3xl shadow-lg border border-gray-100 p-6">
        <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
          <span>🎁</span> Rewards
        </h3>
        <div className="flex justify-between items-center mb-6">
          <span className="text-gray-500 font-medium">Claimable Fees</span>
          <span className="text-2xl font-bold text-green-600">{parseFloat(claimable).toFixed(6)}</span>
        </div>
        
        <button
          onClick={handleClaim}
          disabled={loading || isZeroRewards}
          className={`w-full py-3 rounded-xl font-bold transition-all shadow-md ${
            isZeroRewards
              ? "bg-gray-100 text-gray-400 cursor-not-allowed shadow-none"
              : "bg-gradient-to-r from-green-500 to-emerald-600 text-white hover:shadow-lg hover:scale-105"
          }`}
        >
          {loading ? "Claiming..." : "Claim Rewards"}
        </button>
      </div>

      {/* Stats Card */}
      <div className="bg-white rounded-3xl shadow-lg border border-gray-100 p-6">
        <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
          <span>📊</span> Pool Stats
        </h3>
        <div className="space-y-3 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-500">TVL</span>
            <span className="font-semibold text-gray-900">{stats.tvl}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">24h Volume</span>
            <span className="font-semibold text-gray-900">{stats.volume}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">APR (Est.)</span>
            <span className="font-bold text-green-600">{stats.apr}</span>
          </div>
        </div>
      </div>

    </div>
  );
}