import { useEffect, useState } from "react";
import axios from "axios";
import { getTokenSymbol } from "../../utils/transactionLog";
import RenderLoadingNotice from "../RenderLoadingNotice";

const ITEMS_PER_PAGE = 8;

export default function RecentActivity({ wallet }) {
  const [swaps, setSwaps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    const fetchSwaps = async () => {
      try {
        const res = await axios.get(`https://meta-cow.onrender.com/api/swaps/recent?user=${wallet}`);
        setSwaps(res.data || []);
      } catch (err) {
        console.error("Failed to fetch swaps:", err);
      } finally {
        setLoading(false);
      }
    };

    if (wallet) fetchSwaps();
  }, [wallet]);

  const totalPages = Math.ceil(swaps.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const currentSwaps = swaps.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  if (loading) return <RenderLoadingNotice show={loading} />;

  return (
     <div className="bg-white rounded-3xl p-6 border border-gray-100">
      <h3 className="text-lg font-bold text-gray-800 mb-4">📜 Recent Swaps</h3>

      {swaps.length === 0 ? (
        <div className="text-center text-gray-500 py-6">No swap history found.</div>
      ) : (
        <>
          <div className="space-y-4">
            {currentSwaps.map((swap, idx) => (
              <div key={swap.txHash} className="p-3 border border-gray-200 rounded-lg">
                <p className="text-xs text-gray-400 mb-1">#{startIndex + idx + 1}</p>
                <div className="text-sm text-gray-800">
                  💱 Swapped <strong>{swap.inputAmount}</strong> {getTokenSymbol(swap.inputToken)} for{" "}
                  <strong>{swap.outputAmount}</strong> {getTokenSymbol(swap.outputToken)}
                </div>
                <div className="text-xs text-gray-500 font-mono">
                  Tx: {swap.txHash.slice(0, 10)}... |{" "}
                  {new Date(swap.timestamp * 1000).toLocaleString()}
                </div>
              </div>
            ))}
          </div>

          {/* Pagination Controls */}
          <div className="flex justify-center items-center gap-2 mt-6">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="px-3 py-1 text-sm border rounded disabled:opacity-50"
            >
              ◀ Prev
            </button>

            {[...Array(totalPages)].map((_, idx) => (
              <button
                key={idx}
                onClick={() => handlePageChange(idx + 1)}
                className={`px-3 py-1 text-sm border rounded ${
                  currentPage === idx + 1
                    ? "bg-purple-100 text-purple-800 font-bold"
                    : ""
                }`}
              >
                {idx + 1}
              </button>
            ))}

            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="px-3 py-1 text-sm border rounded disabled:opacity-50"
            >
              Next ▶
            </button>
          </div>
        </>
      )}
    </div>
  );
}
