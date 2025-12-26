import { useEffect, useState } from "react";
import { getTransfersForAddress } from "../../utils/alchemyTransfers";

export default function RecentTransactions({ address, onRefresh, loading }) {
  const [transactions, setTransactions] = useState([]);

  useEffect(() => {
    async function fetchAlchemyTxs() {
      if (!address) return;
      const txs = await getTransfersForAddress(address);
      setTransactions(
        txs.map((tx) => ({
          type: "transfer",
          amount: tx.value,
          tokenSymbol: tx.asset,
         timestamp: tx.metadata?.blockTimestamp
  ? Math.floor(new Date(tx.metadata.blockTimestamp).getTime() / 1000)
  : Math.floor(Date.now() / 1000), // fallback if missing

          txHash: tx.hash,
          blockNumber: tx.blockNum ? parseInt(tx.blockNum) : null,
        }))
      );
    }
    fetchAlchemyTxs();
  }, [address]);

  return (
    <div className="mt-8 bg-white rounded-3xl shadow-xl border border-gray-100 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-800">Recent Transactions</h3>
        <div className="flex items-center gap-2">
          {loading && (
            <div className="w-5 h-5 border-2 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
          )}
          <button
            onClick={onRefresh}
            disabled={loading || !address}
            className="p-2 text-gray-600 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            title="Refresh transactions"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
          </button>
        </div>
      </div>

      {transactions.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">📊</span>
          </div>
          <p>
            {loading
              ? "Loading your recent transfers..."
              : "Your recent transfers will appear here"}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {transactions.map((tx, index) => (
            <div
              key={`${tx.txHash}-${index}`}
              className="flex items-center justify-between p-4 bg-gradient-to-r from-purple-50 to-blue-50 rounded-2xl border border-purple-100 hover:shadow-md transition-shadow"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm">🔁</span>
                </div>
                <div>
                  <div className="font-semibold text-gray-800">
                    {parseFloat(tx.amount).toFixed(4)} {tx.tokenSymbol}
                  </div>
                  <div className="text-sm text-gray-500">
                    {new Date(tx.timestamp * 1000).toLocaleString()}
                  </div>
                </div>
              </div>
              <div className="text-right">
                <a
                  href={`https://testnet.bscscan.com/tx/${tx.txHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-purple-600 hover:text-purple-800 text-sm font-medium"
                >
                  View →
                </a>
                <div className="text-xs text-gray-400">
                  Block #{tx.blockNumber || "?"}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
