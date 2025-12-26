import { useState, useEffect } from "react";
import axios from "axios";

export default function SearchFollow({ currentUserId }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [following, setFollowing] = useState([]);

  useEffect(() => {
    if (!currentUserId) return;
    axios
      .get(`https://meta-cow.onrender.com/api/follow/following/${currentUserId}`)
      .then((res) => setFollowing(res.data.map((u) => u._id)))
      .catch((err) => console.error("Failed to fetch following list", err));
  }, [currentUserId]);

  const search = async () => {
    if (!query.trim()) return;
    const res = await axios.get(`https://meta-cow.onrender.com/api/users/search?query=${query}`);
    setResults(res.data || []);
  };

  const followUser = async (targetUserId) => {
    try {
      await axios.post(`https://meta-cow.onrender.com/api/follow/follow/${targetUserId}`, {
        followerId: currentUserId,
      });
      setFollowing((prev) => [...prev, targetUserId]);
    } catch (err) {
      console.error("Follow failed", err?.response?.data || err);
    }
  };

  const unfollowUser = async (targetUserId) => {
    try {
      await axios.delete(`https://meta-cow.onrender.com/api/follow/unfollow/${targetUserId}`, {
        data: { followerId: currentUserId },
      });
      setFollowing((prev) => prev.filter((id) => id !== targetUserId));
    } catch (err) {
      console.error("Unfollow failed", err?.response?.data || err);
    }
  };

  return (
    <div className="max-w-4xl mx-auto mb-10 px-4 py-4 bg-white/80 border border-purple-100 rounded-xl shadow-sm">
      <h3 className="text-lg font-semibold text-purple-700 mb-3">🔍 Discover & Follow Traders</h3>

      <div className="flex flex-col sm:flex-row items-center gap-2">
        <div className="relative w-full">
          <input
            type="text"
            className="w-full pl-10 pr-4 py-2 text-sm border border-purple-200 rounded-lg focus:ring-2 focus:ring-purple-400 outline-none bg-white shadow-sm"
            placeholder="Search by username"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-purple-400">
            <svg width="18" height="18" fill="none" stroke="currentColor">
              <circle cx="8" cy="8" r="6" strokeWidth="2" />
              <path d="M13 13l3 3" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </span>
        </div>
        <button
          onClick={search}
          className="px-4 py-2 text-sm font-medium bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-lg hover:from-purple-600 hover:to-blue-600"
        >
          Search
        </button>
      </div>

      {results.length > 0 ? (
        <ul className="mt-5 space-y-3">
          {results.map((user) => (
            <li
              key={user._id}
              className="flex items-center justify-between bg-white border border-purple-50 px-4 py-2 rounded-lg shadow-sm"
            >
              <div className="flex items-center gap-3">
                <img
                  src={user.profileImage || "/default-avatar.png"}
                  alt="pfp"
                  className="w-8 h-8 rounded-full border border-purple-200"
                />
                <span className="font-medium text-gray-800 text-sm">{user.username}</span>
              </div>
              {following.includes(user._id) ? (
                <button
                  onClick={() => unfollowUser(user._id)}
                  className="text-xs font-semibold bg-red-100 text-red-600 px-3 py-1.5 rounded-md hover:bg-red-200"
                >
                  Unfollow
                </button>
              ) : (
                <button
                  onClick={() => followUser(user._id)}
                  className="text-xs font-semibold bg-purple-500 text-white px-3 py-1.5 rounded-md hover:bg-purple-600"
                >
                  Follow
                </button>
              )}
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-center text-sm text-gray-400 mt-4">No users found yet.</p>
      )}
    </div>
  );
}
