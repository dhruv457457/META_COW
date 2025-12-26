import { useState } from "react";
import { formatDistanceToNow } from "date-fns";

const ITEMS_PER_PAGE = 3;

export default function TransactionList({
  userAddress,
  transactions = [],
  typeFilter = "all",
}) {
  const [currentPage, setCurrentPage] = useState(1);

  const filtered =
    typeFilter === "all"
      ? transactions
      : transactions.filter((tx) => tx.type === typeFilter);

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const currentItems = filtered.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  if (!userAddress) {
    return (
      <p className="text-gray-500 text-sm">
        Connect your wallet to see transactions.
      </p>
    );
  }

  if (filtered.length === 0) {
    return (
      <p className="text-gray-500 text-sm">No recent transactions found.</p>
    );
  }

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  return (
    <div className="mt-6">
    

      <ul className="space-y-3">
        {currentItems.map((tx, i) => (
          <li
            key={i}
            className={`px-4 py-3 rounded-lg  border border-gray-100 ${
              i % 2 === 0 ? "bg-white" : "bg-gray-50"
            }`}
          >
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs text-gray-400 mb-1">
                  #{startIndex + i + 1}
                </p>
                <p className="text-sm text-gray-800 font-medium">
                  {(() => {
                    if (tx.type === "swap") {
                      return `SWAP: ${tx.inputAmount} ${tx.inputTokenSymbol} → ${tx.outputAmount} ${tx.outputTokenSymbol}`;
                    }
                    if (tx.type === "liquidity") {
                      return tx.direction === "add"
                        ? `ADD LIQUIDITY: ${tx.amountA} + ${tx.amountB}`
                        : `REMOVE LIQUIDITY: ${tx.amountLP}`;
                    }
                    if (tx.type === "reward") {
                      return `REWARD CLAIMED: ${tx.amount}`;
                    }
                    return "UNKNOWN TRANSACTION";
                  })()}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {formatDistanceToNow(new Date(tx.timestamp * 1000))} ago
                </p>
              </div>

              <a
                href={`https://sepolia.etherscan.io/tx/${tx.txHash}`}
                target="_blank"
                rel="noreferrer"
                className="text-blue-600 text-xs underline hover:text-blue-800"
              >
                View ↗
              </a>
            </div>
          </li>
        ))}
      </ul>

      {/* Pagination controls */}
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
    </div>
  );
}
