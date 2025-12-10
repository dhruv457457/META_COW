"use client";

import { useState } from "react";

// Define a type for your transaction objects
export interface Transaction {
  type: "swap" | "liquidity" | "reward";
  direction?: "add" | "remove";
  inputTokenSymbol?: string;
  outputTokenSymbol?: string;
  inputAmount?: string;
  outputAmount?: string;
  amountA?: string;
  amountB?: string;
  amountLP?: string;
  amount?: string;
  txHash: string;
  timestamp: number;
}

const ITEMS_PER_PAGE = 3;

export default function TransactionList({
  transactions = [],
}: {
  transactions: Transaction[];
}) {
  const [currentPage, setCurrentPage] = useState(1);

  if (transactions.length === 0) {
    return (
      <div className="text-center py-6 bg-gray-50 rounded-xl border border-dashed border-gray-200">
        <p className="text-gray-500 text-sm">No recent transactions found.</p>
      </div>
    );
  }

  const totalPages = Math.ceil(transactions.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const currentItems = transactions.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  return (
    <div className="mt-6">
      <ul className="space-y-3">
        {currentItems.map((tx, i) => (
          <li key={tx.txHash + i} className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm hover:shadow-md transition-all">
            <div className="flex justify-between items-start">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className={`text-xs font-bold px-2 py-0.5 rounded uppercase ${
                    tx.type === 'swap' ? 'bg-blue-100 text-blue-700' : 
                    tx.type === 'liquidity' ? 'bg-purple-100 text-purple-700' : 'bg-green-100 text-green-700'
                  }`}>
                    {tx.type}
                  </span>
                  <span className="text-xs text-gray-400">
                    {new Date(tx.timestamp * 1000).toLocaleString()}
                  </span>
                </div>
                
                <p className="text-sm text-gray-800 font-medium">
                  {tx.type === "swap" && `Swapped ${tx.inputAmount} ${tx.inputTokenSymbol} ➝ ${tx.outputAmount} ${tx.outputTokenSymbol}`}
                  {tx.type === "liquidity" && (tx.direction === "add" 
                    ? `Added Liquidity: ${tx.amountA} + ${tx.amountB}` 
                    : `Removed Liquidity: ${tx.amountLP}`)}
                  {tx.type === "reward" && `Claimed ${tx.amount} Rewards`}
                </p>
              </div>

              <a
                href={`https://testnet.bscscan.com/tx/${tx.txHash}`}
                target="_blank"
                rel="noreferrer"
                className="text-gray-400 hover:text-blue-600 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
              </a>
            </div>
          </li>
        ))}
      </ul>

      {/* Mini Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-4">
          <button
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="text-xs px-3 py-1 bg-gray-100 rounded hover:bg-gray-200 disabled:opacity-50"
          >
            Prev
          </button>
          <span className="text-xs text-gray-500 self-center">{currentPage} / {totalPages}</span>
          <button
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="text-xs px-3 py-1 bg-gray-100 rounded hover:bg-gray-200 disabled:opacity-50"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}