"use client";
import { useState, useCallback, useEffect } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import FollowButton from "@/components/FollowButton";

const SearchIcon = (props: any) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
  </svg>
);

const TrendingIcon = (props: any) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
  </svg>
);

interface SearchedUser {
  username: string;
  avatar: string;
  walletAddress: string;
  followers: number;
  totalSwaps: number;
}

export default function SearchFollow() {
  const [query, setQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchedUser[]>([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Search users with debounce
  const searchUsers = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      setShowSearchResults(false);
      setError(null);
      return;
    }
    
    setSearchLoading(true);
    setError(null);
    
    try {
      const res = await fetch(`/api/users?search=${encodeURIComponent(searchQuery)}&limit=10`);
      
      if (!res.ok) {
        throw new Error("Failed to search users");
      }
      
      const data = await res.json();
      setSearchResults(data.users || []);
      setShowSearchResults(true);
      
    } catch (error: any) {
      console.error("Failed to search users:", error);
      setError("Failed to search. Please try again.");
      setSearchResults([]);
    } finally {
      setSearchLoading(false);
    }
  }, []);
  
  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      searchUsers(query);
    }, 300);
    
    return () => clearTimeout(timer);
  }, [query, searchUsers]);

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && query.trim()) {
      searchUsers(query);
    }
  };

  const handleClearSearch = () => {
    setQuery("");
    setShowSearchResults(false);
    setSearchResults([]);
    setError(null);
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="bg-gradient-to-br from-white to-purple-50/30 border-2 border-purple-200/50 rounded-3xl shadow-xl backdrop-blur-sm overflow-hidden"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-blue-600 p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
              <SearchIcon className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-2xl font-black text-white">Discover Top Traders</h3>
          </div>
          <p className="text-white/80 text-sm">Follow successful traders and copy their strategies</p>
        </div>

        <div className="p-6">
          {/* Search Bar */}
          <div className="relative mb-6">
            <div className="relative">
              <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none z-10" />
              <input
                type="text"
                className="w-full pl-12 pr-12 py-4 text-base border-2 border-purple-200 rounded-2xl focus:ring-2 focus:ring-purple-400 focus:border-purple-400 outline-none bg-white shadow-sm text-gray-800 placeholder:text-gray-400 transition-all"
                placeholder="Search by username or wallet..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyPress={handleKeyPress}
                onFocus={() => query && setShowSearchResults(true)}
              />
              {query && (
                <button
                  onClick={handleClearSearch}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xl transition-colors z-10"
                  aria-label="Clear search"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Search Results Dropdown */}
            {showSearchResults && !searchLoading && !error && searchResults.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="absolute top-full mt-2 w-full bg-white rounded-2xl shadow-2xl border-2 border-purple-200 max-h-96 overflow-y-auto z-50"
              >
                {searchResults.map((user, index) => (
                  <motion.div
                    key={user.walletAddress}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="p-4 hover:bg-purple-50 transition border-b border-gray-100 last:border-0"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <Link
                        href={`/profile/${user.walletAddress}`}
                        className="flex items-center gap-3 flex-1 min-w-0 group"
                        onClick={() => setShowSearchResults(false)}
                      >
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 overflow-hidden flex-shrink-0 group-hover:scale-110 transition-transform">
                          <img src={user.avatar} alt={user.username} className="w-full h-full object-cover" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-bold text-gray-900 truncate group-hover:text-purple-600 transition-colors">
                            {user.username}
                          </div>
                          <div className="text-xs text-gray-500">
                            <span className="font-semibold">{user.followers}</span> followers · {" "}
                            <span className="font-semibold">{user.totalSwaps}</span> trades
                          </div>
                        </div>
                      </Link>
                      
                      <FollowButton
                        targetWallet={user.walletAddress}
                        targetUsername={user.username}
                      />
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            )}

            {/* Loading State */}
            {showSearchResults && searchLoading && (
              <div className="absolute top-full mt-2 w-full bg-white rounded-2xl shadow-2xl border-2 border-purple-200 p-6 text-center z-50">
                <div className="flex items-center justify-center gap-3">
                  <div className="w-5 h-5 border-2 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
                  <span className="text-sm text-gray-600 font-medium">Searching traders...</span>
                </div>
              </div>
            )}

            {/* Error State */}
            {showSearchResults && error && (
              <div className="absolute top-full mt-2 w-full bg-white rounded-2xl shadow-2xl border-2 border-red-200 p-6 text-center z-50">
                <div className="text-red-600 text-sm font-medium mb-2">⚠️ {error}</div>
                <button
                  onClick={() => searchUsers(query)}
                  className="text-xs text-purple-600 hover:text-purple-700 font-bold"
                >
                  Try Again
                </button>
              </div>
            )}

            {/* No Results State */}
            {showSearchResults && !searchLoading && !error && searchResults.length === 0 && query && (
              <div className="absolute top-full mt-2 w-full bg-white rounded-2xl shadow-2xl border-2 border-gray-200 p-8 text-center z-50">
                <div className="text-4xl mb-3">🔍</div>
                <div className="text-sm font-bold text-gray-900 mb-2">No users found</div>
                <p className="text-xs text-gray-500">
                  Try searching with a different username or wallet address
                </p>
              </div>
            )}
          </div>

          {/* Info Banner */}
          <div className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-2xl">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center flex-shrink-0">
                <TrendingIcon className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-sm text-gray-700 font-medium mb-1">
                  Real-time trader data powered by <span className="font-bold text-blue-600">Envio</span>
                </p>
                <p className="text-xs text-gray-600">
                  Search for traders by username or wallet address to start following and copying their trades
                </p>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}