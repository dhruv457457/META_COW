import { useState, useEffect } from "react";
import { getClaimableRewards, getPoolStats } from "../../utils/contractUtils";
import { showSuccess, showError } from "../../utils/toast";
import confetti from "canvas-confetti";

export default function LiquiditySidebar({ lpBalance, pairAddress, onClaim, address }) {
  const [claimable, setClaimable] = useState("0.00");
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({ tvl: "-", volume: "-", apr: "-" });

  // --- Component logic remains the same ---
  const fetchRewards = async () => {
    if (!pairAddress || !address) return;
    try {
      const rewards = await getClaimableRewards(pairAddress, address);
      setClaimable(rewards);
    } catch (err) {
      console.warn("Failed to fetch rewards:", err);
    }
  };

  const fetchStats = async () => {
    if (!pairAddress) return;
    try {
      const { tvl, volume, apr } = await getPoolStats(pairAddress);
      setStats({
        tvl: `$${tvl.toLocaleString(undefined, { maximumFractionDigits: 2 })}`,
        volume: `$${volume.toLocaleString(undefined, { maximumFractionDigits: 2 })}`,
        apr: `${apr.toFixed(2)}%`,
      });
    } catch (err) {
      console.warn("Failed to fetch pool stats:", err);
    }
  };

  useEffect(() => {
    fetchRewards();
    fetchStats();
    const interval = setInterval(() => {
        fetchRewards();
        fetchStats();
    }, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, [pairAddress, address]);

  const handleClaim = async () => {
    if (!pairAddress) return;
    try {
      setLoading(true);
      await onClaim?.();
      await fetchRewards();
      showSuccess("Rewards claimed!");
      confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 } });
    } catch (err) {
      console.error("Claim failed:", err);
      showError("Failed to claim rewards.");
    } finally {
      setLoading(false);
    }
  };

  const isZero = parseFloat(claimable) === 0;

  // Format the balance for display
  const formattedLpBalance = parseFloat(lpBalance)
    ? parseFloat(lpBalance).toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 4, // Display up to 4 decimal places
      })
    : "0.00";

  return (
    <div className="w-full max-w-sm mx-auto font-sans">
      <div className="space-y-5">
        
        {/* Your Position Card -- MODIFIED SECTION */}
        <div className="bg-white rounded-xl shadow-md hover:shadow-lg transition-all duration-300 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="bg-blue-100 p-2 rounded-lg">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9V3m0 18a9 9 0 009-9M3 12a9 9 0 019-9m-9 9h18" />
                </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900">
              Your Position
            </h3>
          </div>
          <div className="text-center py-4 bg-gray-50 rounded-lg">
            {/* The number is now formatted and has a tooltip */}
            <p
              className="text-3xl font-bold text-gray-800"
              title={lpBalance}
            >
              {formattedLpBalance}
            </p>
            <p className="text-sm text-gray-500">LP Tokens Held</p>
          </div>
        </div>

        {/* Rewards Card */}
        <div className="bg-white rounded-xl shadow-md hover:shadow-lg transition-all duration-300 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="bg-green-100 p-2 rounded-lg">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v.01" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 14a2 2 0 00-2-2m2 2a2 2 0 01-2-2m2 2a2 2 0 002-2m-2 2a2 2 0 012-2m0 0a2 2 0 012 2m-2-2a2 2 0 00-2 2m-2 2a2 2 0 01-2-2" />
                </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900">
              Claimable Rewards
            </h3>
          </div>
          <div className="flex justify-between items-center bg-gray-50 p-4 rounded-lg mb-5">
            <span className="text-gray-600">Total Rewards</span>
            <span className="font-bold text-2xl text-green-500">{claimable}</span>
          </div>
          <button
            onClick={handleClaim}
            disabled={loading || isZero}
            className={`w-full flex items-center justify-center font-semibold py-3 px-4 rounded-xl transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-offset-2 focus:ring-offset-white
              ${isZero
                ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                : "bg-gradient-to-r from-green-500 to-emerald-500 text-white hover:from-green-600 hover:to-emerald-600 shadow-sm hover:shadow-md disabled:opacity-75 disabled:cursor-wait focus:ring-green-500/50"
              }`}
          >
            {loading && (
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            )}
            {loading ? "Claiming..." : isZero ? "Nothing to Claim" : "Claim All Rewards"}
          </button>
        </div>

        {/* Pool Stats Card */}
        <div className="bg-white rounded-xl shadow-md hover:shadow-lg transition-all duration-300 p-6">
          <div className="flex items-center gap-3 mb-4">
             <div className="bg-indigo-100 p-2 rounded-lg">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900">
              Pool Statistics
            </h3>
          </div>
          <div className="space-y-4 text-sm">
            <div className="flex items-center justify-between" title="Total Value Locked: The total value of assets in the pool.">
              <span className="text-gray-600">Total Value Locked (TVL)</span>
              <span className="font-semibold text-gray-800">{stats.tvl}</span>
            </div>
            <hr className="border-gray-100"/>
            <div className="flex items-center justify-between" title="24h Volume: The value of trades in the last 24 hours.">
              <span className="text-gray-600">24h Trading Volume</span>
              <span className="font-semibold text-gray-800">{stats.volume}</span>
            </div>
             <hr className="border-gray-100"/>
            <div className="flex items-center justify-between" title="Annual Percentage Rate: Estimated annual return from fees.">
              <span className="text-gray-600">Fee APR (est.)</span>
              <span className="font-semibold text-xl text-green-500">{stats.apr}</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}