// SocialPage.js
import { useEffect, useState, useCallback } from "react";
import axios from "axios";
import { useWallet } from "../contexts/WalletContext";
import PostCard from "../components/PostCard"; // Keep this import
import SocialFeed from "../components/profile/SocialFeed"; // Keep this import
import PostComposer from "../components/PostComposer"; // Keep this import
import { motion } from "framer-motion"; // Add motion for transitions
import RenderLoadingNotice from "../components/RenderLoadingNotice";

// --- Re-using your SVG Icons from Home for consistency ---
const SearchIcon = (props) => <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>;
const UsersIcon = (props) => <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>;

export default function SocialPage() {
  // ... (all your existing state and useCallback functions) ...
  const { walletData } = useWallet();
  const wallet = walletData?.address;

  const [user, setUser] = useState(null);
  const [posts, setPosts] = useState([]);
  const [content, setContent] = useState(""); // Still used for internal logic, even if PostComposer handles its own content
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [recentSwaps, setRecentSwaps] = useState([]); // This state can be removed from SocialPage if PostComposer fetches its own swaps. For now, keeping for consistency.

  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [following, setFollowing] = useState([]);

  // ... (all your existing fetchUser, fetchPosts, fetchRecentSwaps, createPost, createPostFromSwap, search, followUser, unfollowUser functions) ...
  const fetchUser = useCallback(async () => {
    try {
      const res = await axios.get(`https://meta-cow.onrender.com/api/users/wallet/${wallet}`);
      setUser(res.data);
      const followRes = await axios.get(`https://meta-cow.onrender.com/api/follow/following/${res.data._id}`);
      setFollowing(followRes.data.map((u) => u._id));
    } catch (err) {
      console.error("Failed to fetch user", err);
    }
  }, [wallet]);

  const fetchPosts = useCallback(async () => {
    try {
      setFetching(true);
      const res = await axios.get("https://meta-cow.onrender.com/api/posts");
      const data = Array.isArray(res.data) ? res.data : res.data?.posts || [];
      setPosts(data);
    } catch (err) {
      console.error("Failed to fetch posts", err);
    } finally {
      setFetching(false);
    }
  }, []);

  const fetchRecentSwaps = useCallback(async () => {
    if (!wallet) return;
    try {
      const res = await axios.get(`https://meta-cow.onrender.com/api/swaps/recent?user=${wallet}`);
      setRecentSwaps(res.data || []);
    } catch (err) {
      console.error("Failed to fetch recent swaps", err);
    }
  }, [wallet]);

  const createPost = async () => {
    if (!wallet || !content.trim()) return;
    try {
      setLoading(true);
      await axios.post("https://meta-cow.onrender.com/api/posts", {
        wallet,
        content,
      });
      setContent("");
      await fetchPosts();
    } catch (err) {
      console.error("Post creation failed", err);
    } finally {
      setLoading(false);
    }
  };

  const createPostFromSwap = async (txHash, content = "") => {
    try {
      setLoading(true);
      await axios.post("https://meta-cow.onrender.com/api/posts/from-swap", {
        wallet,
        content,
        txHash,
      });
      await fetchPosts();
    } catch (err) {
      console.error("Post from swap failed", err);
    } finally {
      setLoading(false);
    }
  };

  const search = async () => {
    if (!query.trim()) {
        setResults([]); // Clear results if query is empty
        return;
    }
    try {
      const res = await axios.get(`https://meta-cow.onrender.com/api/users/search?query=${query}`);
      setResults(res.data || []);
    } catch (err) {
      console.error("Search failed", err);
    }
  };

  const followUser = async (targetUserId) => {
    try {
      await axios.post(`https://meta-cow.onrender.com/api/follow/follow/${targetUserId}`, {
        followerId: user._id,
      });
      setFollowing((prev) => [...prev, targetUserId]);
    } catch (err) {
      console.error("Follow failed", err?.response?.data || err);
    }
  };

  const unfollowUser = async (targetUserId) => {
    try {
      await axios.delete(`https://meta-cow.onrender.com/api/follow/unfollow/${targetUserId}`, {
        data: { followerId: user._id },
      });
      setFollowing((prev) => prev.filter((id) => id !== targetUserId));
    } catch (err) {
      console.error("Unfollow failed", err?.response?.data || err);
    }
  };

  useEffect(() => {
    if (wallet) {
      fetchUser();
      fetchPosts();
      fetchRecentSwaps();
    }
  }, [wallet, fetchUser, fetchPosts, fetchRecentSwaps]);

  const truncate = (addr) => `${addr.slice(0, 6)}...${addr.slice(-4)}`;


  return (
    <div className="bg-slate-50 text-gray-800 font-sans min-h-screen pt-10">
      <div className="max-w-7xl mx-auto py-10 px-4 md:px-6 lg:px-8">
     

        <div className="flex flex-col-reverse lg:grid lg:grid-cols-3 gap-8">
          {/* Left (main feed) */}
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="lg:col-span-2 space-y-6"
          >
            {wallet && user && (
              <PostComposer
                wallet={wallet}
                user={user}
                refreshPosts={fetchPosts}
                // createPostFromSwap is now handled internally by PostComposer
              />
            )}

            {fetching ? (
              <RenderLoadingNotice show={fetching} />
            ) : posts.length > 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3, duration: 0.8 }}
                className="space-y-6"
              >
                {posts.map((post) => (
                  <PostCard
                    key={post._id}
                    post={post}
                    refresh={fetchPosts}
                    userWallet={wallet}
                  />
                ))}
              </motion.div>
            ) : (
              <div className="text-center py-10 text-gray-400 text-lg">
                No insights yet. Be the first to share your alpha!
                <p className="mt-2 text-sm">Connect your wallet and drop some knowledge.</p>
              </div>
            )}
          </motion.div>

          {/* Right (Discover & Social Feed) */}
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="space-y-6 lg:sticky lg:top-4"
          >
            {/* Discover & Follow Section */}
            <div className="bg-white/90 rounded-2xl shadow-xl border border-purple-100 p-6 backdrop-blur-sm">
              <h3 className="text-xl font-bold text-purple-800 mb-4 flex items-center gap-3">
                <SearchIcon className="w-6 h-6 text-blue-500" /> Discover & Follow Traders
              </h3>
              <div className="flex items-center gap-3 mb-4">
                <input
                  type="text"
                  className="flex-1 px-4 py-2.5 text-base border-2 border-purple-200 rounded-xl focus:ring-2 focus:ring-purple-400 outline-none bg-white shadow-inner placeholder:text-gray-400 transition-all duration-200"
                  placeholder="Search by username..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyPress={(e) => { // Added for convenience
                    if (e.key === 'Enter') search();
                  }}
                />
                <button
                  onClick={search}
                  className="px-5 py-2.5 text-base font-semibold text-white bg-gradient-to-r from-purple-500 to-blue-500 rounded-xl hover:from-purple-600 hover:to-blue-600 transition-all duration-300 transform hover:scale-105"
                >
                  Search
                </button>
              </div>

              {results.length > 0 ? (
                <ul className="mt-4 space-y-3 max-h-72 overflow-y-auto pr-2 custom-scrollbar">
                  {results.map((u) => (
                    <motion.li
                      key={u._id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3 }}
                      className="flex items-center justify-between bg-purple-50 border border-purple-100 px-4 py-3 rounded-lg shadow-sm hover:shadow-md transition-all duration-200"
                    >
                      <div className="flex items-center gap-3">
                        <img
                          src={u.profileImage || `https://api.dicebear.com/7.x/identicon/svg?seed=${u.walletAddress}`}
                          alt="pfp"
                          className="w-9 h-9 rounded-full border-2 border-purple-200 object-cover"
                        />
                        <span className="font-semibold text-gray-800 text-base">{u.username || truncate(u.wallet)}</span>
                      </div>
                      {wallet && user && u._id !== user._id && ( // Ensure user can't follow themselves
                        following.includes(u._id) ? (
                          <button
                            onClick={() => unfollowUser(u._id)}
                            className="text-sm font-medium bg-slate-200 text-slate-600 px-4 py-2 rounded-lg hover:bg-slate-300 transition-all duration-200"
                          >
                            Unfollow
                          </button>
                        ) : (
                          <button
                            onClick={() => followUser(u._id)}
                            className="text-sm font-medium bg-purple-500 text-white px-4 py-2 rounded-lg hover:bg-purple-600 transition-all duration-200"
                          >
                            Follow
                          </button>
                        )
                      )}
                    </motion.li>
                  ))}
                </ul>
              ) : (
                <p className="text-center text-sm text-gray-500 mt-4 py-2">
                  {query.trim() ? "No users found matching your search." : "Enter a username to search and discover new traders."}
                </p>
              )}
            </div>

            {/* Social Feed (from "../components/profile/SocialFeed") */}
            <SocialFeed wallet={wallet} />
          </motion.div>
        </div>
      </div>
    </div>
  );
}