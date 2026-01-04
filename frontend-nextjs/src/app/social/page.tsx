"use client";

import { useState, useEffect, useCallback } from "react";
import { useWallet } from "@/context/WalletContext";
import { fetchUserSwaps, type EnvioSwapEvent } from "@/utils/envioClient";
import { toast } from "react-hot-toast";
import Link from "next/link";
import { 
  Search, 
  Sparkles, 
  TrendingUp, 
  Users, 
  Clock,
  RefreshCw,
  Globe,
  UserPlus
} from "lucide-react";
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
  const [timeFilter, setTimeFilter] = useState<TimeFilter>("all");
  
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
  
  // Load user's swaps
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
// REPLACE the loadPosts function in your social/page.tsx with this optimized version:

const loadPosts = useCallback(async () => {
  setLoading(true);
  try {
    let url = `/api/posts?limit=50&timeFilter=${timeFilter}`;
    
    if (activeTab === "following" && address) {
      url += `&following=${address}`;
    }
    
    const res = await fetch(url);
    if (!res.ok) {
      throw new Error("Failed to fetch posts");
    }
    
    const data = await res.json();
    const posts = data.posts || [];
    
    // ✅ BATCH FETCH USER PROFILES
    if (posts.length > 0) {
      // Extract unique wallet addresses from posts
      const uniqueWallets = [...new Set(posts.map((p: any) => p.userWallet))];
      
      try {
        // ✅ ONE API CALL for all users instead of 50+ individual calls!
        const usersRes = await fetch('/api/users/batch', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ wallets: uniqueWallets })
        });
        
        if (usersRes.ok) {
          const { users } = await usersRes.json();
          
          // Attach user profiles to posts
          const enrichedPosts = posts.map((post: any) => ({
            ...post,
            userProfile: users[post.userWallet.toLowerCase()] || null
          }));
          
          setPosts(enrichedPosts);
        } else {
          // If batch fetch fails, just show posts without profiles
          setPosts(posts);
        }
      } catch (batchError) {
        console.error("Batch fetch failed, showing posts without profiles:", batchError);
        setPosts(posts);
      }
    } else {
      setPosts([]);
    }
    
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-purple-50/30">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-12 gap-6">
          
          {/* Left Sidebar */}
          <div className="col-span-12 lg:col-span-3 space-y-4">
            {isConnected && userProfile ? (
              <>
                {/* User Profile Card */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 hover:shadow-md transition-shadow">
                  <Link href="/profile" className="block group">
                    <div className="flex flex-col items-center text-center mb-4">
                      <div className="w-20 h-20 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 p-0.5 mb-3 group-hover:scale-105 transition-transform">
                        <img 
                          src={userProfile.avatar} 
                          alt={userProfile.username} 
                          className="w-full h-full rounded-full object-cover bg-white"
                        />
                      </div>
                      <h3 className="font-bold text-slate-900 text-lg mb-1">{userProfile.username}</h3>
                      <div className="flex items-center gap-4 text-sm text-slate-600">
                        <div>
                          <span className="font-semibold text-slate-900">{userProfile.followers}</span> followers
                        </div>
                        <div>
                          <span className="font-semibold text-slate-900">{userProfile.following}</span> following
                        </div>
                      </div>
                    </div>
                  </Link>
                  
                  <button
                    onClick={() => setShowMySwaps(true)}
                    className="w-full px-4 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-semibold hover:shadow-lg hover:scale-[1.02] transition-all flex items-center justify-center gap-2"
                  >
                    <Sparkles className="w-4 h-4" />
                    Create Post
                  </button>
                </div>
                
                {/* Quick Navigation */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4">
                  <h4 className="font-semibold text-slate-900 mb-3 text-sm">Quick Links</h4>
                  <div className="space-y-1">
                    <Link 
                      href="/swap" 
                      className="flex items-center gap-3 px-3 py-2.5 text-slate-700 hover:bg-slate-50 rounded-lg transition-colors group"
                    >
                      <TrendingUp className="w-4 h-4 text-slate-400 group-hover:text-purple-600" />
                      <span className="text-sm font-medium">Trade</span>
                    </Link>
                    <Link 
                      href="/liquidity" 
                      className="flex items-center gap-3 px-3 py-2.5 text-slate-700 hover:bg-slate-50 rounded-lg transition-colors group"
                    >
                      <Users className="w-4 h-4 text-slate-400 group-hover:text-purple-600" />
                      <span className="text-sm font-medium">Liquidity</span>
                    </Link>
                  </div>
                </div>
              </>
            ) : (
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 text-center">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-100 to-pink-100 flex items-center justify-center mx-auto mb-4">
                  <UserPlus className="w-8 h-8 text-purple-600" />
                </div>
                <h3 className="font-bold text-slate-900 mb-2">Join the Community</h3>
                <p className="text-sm text-slate-600 mb-4">Connect your wallet to start trading and sharing</p>
                <Link 
                  href="/profile" 
                  className="inline-flex items-center gap-2 text-sm font-semibold text-purple-600 hover:text-purple-700"
                >
                  Connect Wallet
                  <span>→</span>
                </Link>
              </div>
            )}
          </div>
          
          {/* Center - Main Feed */}
          <div className="col-span-12 lg:col-span-6 space-y-4">
            
            {/* Filter Tabs */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-2">
              <div className="grid grid-cols-2 gap-2">
                {(["all", "following"] as FilterTab[]).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`px-4 py-2.5 rounded-xl font-semibold text-sm transition-all ${
                      activeTab === tab
                        ? "bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-md"
                        : "text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    {tab === "all" ? (
                      <span className="flex items-center justify-center gap-2">
                        <Globe className="w-4 h-4" />
                        All Posts
                      </span>
                    ) : (
                      <span className="flex items-center justify-center gap-2">
                        <Users className="w-4 h-4" />
                        Following
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>
            
            {/* Search Bar */}
            <div className="relative">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => searchQuery && setShowSearchResults(true)}
                  placeholder="Search traders..."
                  className="w-full pl-12 pr-12 py-3.5 rounded-xl border-2 border-slate-200 focus:border-purple-500 focus:ring-4 focus:ring-purple-100 outline-none transition-all text-slate-900 bg-white placeholder:text-slate-400"
                />
                {searchQuery && (
                  <button
                    onClick={() => {
                      setSearchQuery("");
                      setShowSearchResults(false);
                    }}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition"
                  >
                    <span className="text-xl">×</span>
                  </button>
                )}
              </div>
              
              {/* Search Results Dropdown */}
              {showSearchResults && searchResults.length > 0 && (
                <div className="absolute top-full mt-2 w-full bg-white rounded-2xl shadow-xl border border-slate-200 max-h-96 overflow-y-auto z-50">
                  {searchResults.map((user) => (
                    <div
                      key={user.walletAddress}
                      className="p-4 hover:bg-slate-50 transition border-b border-slate-100 last:border-0"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <Link
                          href={`/profile/${user.walletAddress}`}
                          className="flex items-center gap-3 flex-1 min-w-0"
                          onClick={() => setShowSearchResults(false)}
                        >
                          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 p-0.5 flex-shrink-0">
                            <img 
                              src={user.avatar} 
                              alt={user.username} 
                              className="w-full h-full rounded-full object-cover bg-white"
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-semibold text-slate-900 truncate">{user.username}</div>
                            <div className="text-sm text-slate-500">
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
                <div className="absolute top-full mt-2 w-full bg-white rounded-2xl shadow-xl border border-slate-200 p-6 text-center text-sm text-slate-500">
                  Searching...
                </div>
              )}
              
              {showSearchResults && !searchLoading && searchResults.length === 0 && searchQuery && (
                <div className="absolute top-full mt-2 w-full bg-white rounded-2xl shadow-xl border border-slate-200 p-6 text-center text-sm text-slate-500">
                  No users found
                </div>
              )}
            </div>
            
            {/* Time Filter & Refresh */}
            <div className="flex items-center justify-between gap-3">
              <div className="relative flex-1">
                <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                <select
                  value={timeFilter}
                  onChange={(e) => setTimeFilter(e.target.value as TimeFilter)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border-2 border-slate-200 focus:border-purple-500 outline-none text-sm font-medium bg-white text-slate-900 cursor-pointer appearance-none"
                >
                  <option value="1h">Last Hour</option>
                  <option value="24h">Last 24 Hours</option>
                  <option value="7d">Last 7 Days</option>
                  <option value="all">All Time</option>
                </select>
              </div>
              
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="px-4 py-2.5 rounded-xl border-2 border-slate-200 hover:border-slate-300 transition-colors disabled:opacity-50 bg-white"
              >
                <RefreshCw className={`w-4 h-4 text-slate-600 ${refreshing ? 'animate-spin' : ''}`} />
              </button>
            </div>
            
            {/* Posts Feed */}
            {loading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 animate-pulse">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-12 h-12 bg-slate-200 rounded-full"></div>
                      <div className="flex-1">
                        <div className="h-4 bg-slate-200 rounded w-1/3 mb-2"></div>
                        <div className="h-3 bg-slate-200 rounded w-1/4"></div>
                      </div>
                    </div>
                    <div className="h-20 bg-slate-200 rounded-xl"></div>
                  </div>
                ))}
              </div>
            ) : posts.length === 0 ? (
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-16 text-center">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-purple-100 to-pink-100 flex items-center justify-center mx-auto mb-4">
                  <Sparkles className="w-10 h-10 text-purple-600" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">No Posts Yet</h3>
                <p className="text-slate-600 mb-6">
                  {activeTab === "following" 
                    ? "Follow some traders to see their posts here" 
                    : "Be the first to share your trading insights!"}
                </p>
                {activeTab === "all" && isConnected && (
                  <button
                    onClick={() => setShowMySwaps(true)}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all"
                  >
                    <Sparkles className="w-4 h-4" />
                    Create Your First Post
                  </button>
                )}
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
      
      {/* My Swaps Selection Modal */}
      {showMySwaps && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200"
          onClick={() => setShowMySwaps(false)}
        >
          <div 
            className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl max-h-[90vh] overflow-hidden animate-in slide-in-from-bottom duration-300"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-white border-b border-slate-200 p-6 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-slate-900">Select a Trade to Share</h2>
              <button 
                onClick={() => setShowMySwaps(false)} 
                className="text-slate-400 hover:text-slate-600 transition"
              >
                <span className="text-3xl">×</span>
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-100px)]">
              {userSwaps.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-20 h-20 rounded-full bg-gradient-to-br from-purple-100 to-pink-100 flex items-center justify-center mx-auto mb-4">
                    <TrendingUp className="w-10 h-10 text-purple-600" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 mb-2">No Trades Yet</h3>
                  <p className="text-slate-600 mb-6">Make your first trade to start sharing</p>
                  <Link 
                    href="/swap"
                    className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all"
                  >
                    <TrendingUp className="w-4 h-4" />
                    Start Trading
                  </Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {userSwaps.map((swap) => (
                    <button
                      key={swap.id}
                      onClick={() => {
                        setCreatePostModal(swap);
                        setShowMySwaps(false);
                      }}
                      className="w-full p-4 bg-gradient-to-br from-slate-50 to-purple-50/30 rounded-xl hover:from-purple-50 hover:to-pink-50 border-2 border-transparent hover:border-purple-300 transition-all text-left group"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="text-sm font-medium text-slate-600">
                          {new Date(swap.timestamp * 1000).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric'
                          })}
                        </div>
                        <div className="text-xs text-slate-500 font-mono bg-white px-2 py-1 rounded">
                          {swap.txHash.slice(0, 10)}...
                        </div>
                      </div>
                      <div className="text-base font-semibold text-slate-900 group-hover:text-purple-600 transition-colors">
                        View Trade Details →
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