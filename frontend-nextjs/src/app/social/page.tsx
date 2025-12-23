"use client";

import { useState, useEffect, useCallback } from "react";
import { useWallet } from "@/context/WalletContext";
import { fetchUserSwaps, type EnvioSwapEvent } from "@/utils/envioClient";
import { toast } from "react-hot-toast";
import Link from "next/link";
import PostCard from "@/components/PostCard";
import CreatePostModal from "@/components/CreatePostModal";
import LiveSwapsFeed from "@/components/LiveSwapsFeed";
import FollowButton from "@/components/FollowButton";

interface Post {
  _id: string;
  userWallet: string;
  username: string;
  avatar: string;
  caption: string;
  swapData: {
    inputToken: string;
    outputToken: string;
    inputAmount: string;
    outputAmount: string;
    pairAddress: string;
    txHash: string;
    timestamp: number;
  };
  likes: string[];
  comments: any[];
  visibility: string;
  createdAt: Date;
}

interface UserProfile {
  username: string;
  avatar: string;
  bio: string;
  walletAddress: string;
  followers: number;
  following: number;
}

interface SearchedUser {
  username: string;
  avatar: string;
  walletAddress: string;
  followers: number;
  totalSwaps: number;
}

type FilterTab = "all" | "following";
type TimeFilter = "1h" | "24h" | "7d" | "all";

export default function SocialPage() {
  const { address, isConnected } = useWallet();
  
  // User state
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [userSwaps, setUserSwaps] = useState<EnvioSwapEvent[]>([]);
  
  // Posts state
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  // Search state
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchedUser[]>([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  
  // Filter states
  const [activeTab, setActiveTab] = useState<FilterTab>("all");
  const [timeFilter, setTimeFilter] = useState<TimeFilter>("7d");
  
  // Modal states
  const [createPostModal, setCreatePostModal] = useState<EnvioSwapEvent | null>(null);
  const [showMySwaps, setShowMySwaps] = useState(false);
  
  // Load user profile
  useEffect(() => {
    const fetchProfile = async () => {
      if (!address) return;
      
      try {
        const res = await fetch(`/api/users/profile?wallet=${address}`);
        if (res.ok) {
          const data = await res.json();
          setUserProfile(data);
        }
      } catch (err) {
        console.error("Failed to fetch profile:", err);
      }
    };
    
    fetchProfile();
  }, [address]);
  
  // Load user's swaps (for creating posts)
  useEffect(() => {
    const loadUserSwaps = async () => {
      if (!address) return;
      
      try {
        const swaps = await fetchUserSwaps(address, 20);
        setUserSwaps(swaps);
      } catch (err) {
        console.error("Failed to fetch user swaps:", err);
      }
    };
    
    loadUserSwaps();
  }, [address]);
  
  // Search users
  const searchUsers = useCallback(async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      setShowSearchResults(false);
      return;
    }
    
    setSearchLoading(true);
    try {
      const res = await fetch(`/api/users?search=${encodeURIComponent(query)}&limit=10`);
      if (res.ok) {
        const data = await res.json();
        setSearchResults(data.users || []);
        setShowSearchResults(true);
      }
    } catch (error) {
      console.error("Failed to search users:", error);
    } finally {
      setSearchLoading(false);
    }
  }, []);
  
  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      searchUsers(searchQuery);
    }, 300);
    
    return () => clearTimeout(timer);
  }, [searchQuery, searchUsers]);
  
  // Load posts
  const loadPosts = useCallback(async () => {
    setLoading(true);
    try {
      let url = `/api/posts?limit=50&timeFilter=${timeFilter}`;
      
      // Add following filter if selected
      if (activeTab === "following" && address) {
        url += `&following=${address}`;
      }
      
      const res = await fetch(url);
      if (!res.ok) {
        throw new Error("Failed to fetch posts");
      }
      
      const data = await res.json();
      setPosts(data.posts || []);
    } catch (error: any) {
      console.error("Failed to load posts:", error);
      toast.error("Failed to load posts");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [activeTab, timeFilter, address]);
  
  useEffect(() => {
    loadPosts();
  }, [loadPosts]);
  
  const handleRefresh = () => {
    setRefreshing(true);
    loadPosts();
  };
  
  const handleDeletePost = (postId: string) => {
    setPosts(posts.filter(p => p._id !== postId));
  };
  
  const handleLikePost = () => {
    loadPosts();
  };
  
  const handlePostCreated = () => {
    setCreatePostModal(null);
    setShowMySwaps(false);
    handleRefresh();
  };
  
  return (
    <div className="min-h-screen bg-gray-50">
   
      
      <div className="max-w-6xl mx-auto px-4 py-6">
        <div className="grid grid-cols-12 gap-6">
          
          {/* Left Sidebar - Compact */}
          <div className="col-span-12 lg:col-span-3 space-y-4">
            {isConnected && userProfile ? (
              <>
                {/* User Card - Compact */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
                  <Link href="/profile" className="flex items-center gap-3 hover:opacity-80 transition mb-3">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 overflow-hidden flex-shrink-0">
                      <img src={userProfile.avatar} alt={userProfile.username} className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-gray-900 truncate">{userProfile.username}</div>
                      <div className="text-xs text-gray-500">{userProfile.followers} followers</div>
                    </div>
                  </Link>
                  
                  <button
                    onClick={() => setShowMySwaps(true)}
                    className="w-full px-4 py-2.5 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg font-bold hover:shadow-lg transition text-sm"
                  >
                    ✨ Create Post
                  </button>
                </div>
                
                {/* Quick Nav - Minimal */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-3">
                  <Link href="/swap" className="block px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition">
                    🔄 Trade
                  </Link>
                  <Link href="/liquidity" className="block px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition">
                    💧 Liquidity
                  </Link>
                </div>
              </>
            ) : (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 text-center">
                <div className="text-4xl mb-3">👋</div>
                <p className="text-sm text-gray-600 mb-3">Connect to start</p>
                <Link href="/profile" className="text-sm font-bold text-purple-600 hover:text-purple-700">
                  Connect Wallet →
                </Link>
              </div>
            )}
          </div>
          
          {/* Center - Feed */}
          <div className="col-span-12 lg:col-span-6 space-y-4">
            
            {/* Tabs - Clean */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-2 flex gap-2">
              {(["all", "following"] as FilterTab[]).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`flex-1 px-4 py-2 rounded-lg font-bold text-sm transition ${
                    activeTab === tab
                      ? "bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-sm"
                      : "text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  {tab === "all" ? "🌍 All" : "👥 Following"}
                </button>
              ))}
            </div>
            
            {/* Search */}
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => searchQuery && setShowSearchResults(true)}
                placeholder="Search users..."
                className="w-full px-4 py-3 pl-11 rounded-xl border border-gray-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-100 outline-none transition text-gray-900 bg-white"
              />
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
              
              {searchQuery && (
                <button
                  onClick={() => {
                    setSearchQuery("");
                    setShowSearchResults(false);
                  }}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              )}
              
              {/* Search Results Dropdown */}
              {showSearchResults && searchResults.length > 0 && (
                <div className="absolute top-full mt-2 w-full bg-white rounded-xl shadow-lg border border-gray-200 max-h-96 overflow-y-auto z-50">
                  {searchResults.map((user) => (
                    <div
                      key={user.walletAddress}
                      className="p-3 hover:bg-gray-50 transition border-b border-gray-100 last:border-0"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <Link
                          href={`/profile/${user.walletAddress}`}
                          className="flex items-center gap-3 flex-1 min-w-0"
                          onClick={() => setShowSearchResults(false)}
                        >
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 overflow-hidden flex-shrink-0">
                            <img src={user.avatar} alt={user.username} className="w-full h-full object-cover" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-bold text-gray-900 truncate">{user.username}</div>
                            <div className="text-xs text-gray-500">
                              {user.followers} followers · {user.totalSwaps} trades
                            </div>
                          </div>
                        </Link>
                        
                        <FollowButton
                          targetWallet={user.walletAddress}
                          targetUsername={user.username}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
              
              {showSearchResults && searchLoading && (
                <div className="absolute top-full mt-2 w-full bg-white rounded-xl shadow-lg border border-gray-200 p-4 text-center text-sm text-gray-500">
                  Searching...
                </div>
              )}
              
              {showSearchResults && !searchLoading && searchResults.length === 0 && searchQuery && (
                <div className="absolute top-full mt-2 w-full bg-white rounded-xl shadow-lg border border-gray-200 p-4 text-center text-sm text-gray-500">
                  No users found
                </div>
              )}
            </div>
            
            {/* Time Filter - Inline */}
            <div className="flex items-center justify-between">
              <select
                value={timeFilter}
                onChange={(e) => setTimeFilter(e.target.value as TimeFilter)}
                className="px-4 py-2 rounded-lg border border-gray-200 focus:border-purple-500 outline-none text-sm font-medium bg-white text-gray-900"
              >
                <option value="1h">Last Hour</option>
                <option value="24h">Last 24h</option>
                <option value="7d">Last 7 Days</option>
                <option value="all">All Time</option>
              </select>
              
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 transition disabled:opacity-50"
              >
                {refreshing ? "⏳" : "🔄"} Refresh
              </button>
            </div>
            
            {/* Posts */}
            {loading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 animate-pulse">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
                      <div className="flex-1">
                        <div className="h-4 bg-gray-200 rounded w-1/3 mb-2"></div>
                        <div className="h-3 bg-gray-200 rounded w-1/4"></div>
                      </div>
                    </div>
                    <div className="h-16 bg-gray-200 rounded-lg"></div>
                  </div>
                ))}
              </div>
            ) : posts.length === 0 ? (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
                <div className="text-5xl mb-4">📭</div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">No Posts</h3>
                <p className="text-sm text-gray-600 mb-4">
                  {activeTab === "following" ? "Follow traders to see their posts" : "Be the first to post!"}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {posts.map((post) => (
                  <PostCard
                    key={post._id}
                    post={post}
                    onDelete={handleDeletePost}
                    onLike={handleLikePost}
                  />
                ))}
              </div>
            )}
          </div>
          
          {/* Right Sidebar - Live Feed */}
          <div className="col-span-12 lg:col-span-3">
            <div className="lg:sticky lg:top-24">
              <LiveSwapsFeed />
            </div>
          </div>
          
        </div>
      </div>
      
      {/* My Swaps Modal */}
      {showMySwaps && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50"
          onClick={() => setShowMySwaps(false)}
        >
          <div 
            className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-white border-b border-gray-200 p-4 flex items-center justify-between rounded-t-2xl">
              <h2 className="text-xl font-bold text-gray-900">Select a Trade</h2>
              <button onClick={() => setShowMySwaps(false)} className="text-gray-400 hover:text-gray-600 text-2xl">
                ✕
              </button>
            </div>
            
            <div className="p-4">
              {userSwaps.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-4xl mb-3">🤷</div>
                  <p className="text-gray-600 mb-4">No trades yet</p>
                  <Link 
                    href="/swap"
                    className="inline-block px-6 py-3 bg-purple-600 text-white rounded-xl font-bold hover:bg-purple-700 transition"
                  >
                    Make Your First Trade
                  </Link>
                </div>
              ) : (
                <div className="space-y-2">
                  {userSwaps.map((swap) => (
                    <button
                      key={swap.id}
                      onClick={() => {
                        setCreatePostModal(swap);
                        setShowMySwaps(false);
                      }}
                      className="w-full p-4 bg-gray-50 rounded-xl hover:bg-purple-50 hover:border-purple-300 border-2 border-transparent transition text-left"
                    >
                      <div className="flex items-center justify-between">
                        <div className="text-sm text-gray-600">
                          {new Date(swap.timestamp * 1000).toLocaleDateString()}
                        </div>
                        <div className="text-xs text-gray-500 font-mono">
                          {swap.txHash.slice(0, 10)}...
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      
      {/* Create Post Modal */}
      {createPostModal && userProfile && (
        <CreatePostModal
          swap={createPostModal}
          userProfile={userProfile}
          onClose={() => setCreatePostModal(null)}
          onSuccess={handlePostCreated}
        />
      )}
    </div>
  );
}