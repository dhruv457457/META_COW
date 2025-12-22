"use client";

import { motion } from "framer-motion";

interface PairsListProps {
  pairs: string[];
  loading: boolean;
}

export default function PairsList({ pairs, loading }: PairsListProps) {
  if (loading) {
    return (
      <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-6">
        <h3 className="text-lg font-bold text-gray-800 mb-4">📦 Deployed Pairs</h3>
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="animate-pulse bg-gray-100 rounded-xl p-4 h-16" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="bg-white rounded-3xl shadow-xl border border-gray-100 p-6"
    >
      <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center justify-between">
        <span className="flex items-center gap-2">
          <span>📦</span> Deployed Pairs
        </span>
        <span className="text-sm font-normal text-gray-400">{pairs.length} total</span>
      </h3>

      {pairs.length === 0 ? (
        <div className="text-center py-8 text-gray-400">
          <div className="text-4xl mb-2">🚀</div>
          <p className="text-sm">No pairs deployed yet</p>
          <p className="text-xs mt-1">Create your first one!</p>
        </div>
      ) : (
        <div className="space-y-3 max-h-[500px] overflow-y-auto">
          {pairs.map((pair, index) => (
            <motion.div
              key={pair}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="flex items-center justify-between p-3 bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl border border-purple-100 hover:shadow-md transition-shadow"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-xs shadow-md">
                  #{index + 1}
                </div>
                <div className="text-xs font-mono text-gray-600 truncate max-w-[120px]">
                  {pair}
                </div>
              </div>
              
               <a href={`https://testnet.bscscan.com/address/${pair}`}
                target="_blank"
                rel="noreferrer"
                className="text-purple-600 hover:text-purple-700 text-xs font-medium"
              >
                View →
              </a>
            </motion.div>
          ))}
        </div>
      )}
    </motion.div>
  );
}