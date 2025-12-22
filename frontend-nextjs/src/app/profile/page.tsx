"use client";

import { useState, useEffect } from "react";
import { useWallet } from "@/context/WalletContext";
import { toast } from "react-hot-toast";
import Link from "next/link";
import SessionMonitor from "@/components/SessionMonitor";
import FollowButton from "@/components/FollowButton";

interface UserProfile {
  username: string;
  bio: string;
  avatar: string;
  walletAddress: string;
  followers: number;
  following: number;
  reputation: number;
  totalSwaps: number;
  createdAt: string;
}

export default function ProfilePage() {
  const { address, isConnected } = useWallet();
  
  // Profile data
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [username, setUsername] = useState("");
  const [bio, setBio] = useState("");
  const [loading, setLoading] = useState(false);
  const [isNewUser, setIsNewUser] = useState(true);

  // Load profile data
  useEffect(() => {
    const fetchProfile = async () => {
      if (!address) return;
      
      try {
        const res = await fetch(`/api/users/profile?wallet=${address}`);
        if (res.ok) {
          const data = await res.json();
          setProfile(data);
          setUsername(data.username);
          setBio(data.bio || "");
          setIsNewUser(false);
        } else {
          setIsNewUser(true);
        }
      } catch (err) {
        console.error("Failed to fetch profile:", err);
      }
    };
    
    fetchProfile();
  }, [address]);

  const handleSave = async () => {
    if (!isConnected || !address || !username) return;
    
    try {
      setLoading(true);
      const res = await fetch("/api/users/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          wallet: address,
          username,
          bio,
          avatar: profile?.avatar || `https://api.dicebear.com/7.x/identicon/svg?seed=${address}`
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save");
      
      setProfile({
        ...data.user,
        followers: data.user.followers || 0,
        following: data.user.following || 0,
        reputation: data.user.reputation || 100,
        totalSwaps: data.user.totalSwaps || 0,
      });
      setIsEditMode(false);
      setIsNewUser(false);
      toast.success(isNewUser ? "Profile Created! 🎉" : "Profile Updated! ✅");
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  if (!isConnected) {
    return (
      <div className="max-w-4xl mx-auto py-20 px-6 text-center">
        <div className="bg-white rounded-3xl shadow-xl p-12 border border-gray-100">
          <div className="text-6xl mb-6">🔐</div>
          <h2 className="text-3xl font-bold text-gray-900 mb-3">Connect Your Wallet</h2>
          <p className="text-gray-600 text-lg">Connect your wallet to view and manage your profile</p>
        </div>
      </div>
    );
  }

  // Edit mode / New user form
  if (isEditMode || isNewUser) {
    return (
      <div className="max-w-2xl mx-auto py-12 px-6">
        <div className="bg-white rounded-3xl shadow-xl p-8 border border-gray-100">
          <div className="text-center mb-8">
            <div className="w-24 h-24 bg-gradient-to-br from-purple-400 to-pink-400 rounded-full mx-auto mb-4 overflow-hidden border-4 border-white shadow-lg">
              <img 
                src={profile?.avatar || `https://api.dicebear.com/7.x/identicon/svg?seed=${address}`} 
                alt="Avatar" 
                className="w-full h-full object-cover"
              />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">
              {isNewUser ? "Create Your Identity" : "Edit Profile"}
            </h1>
            <p className="text-sm text-gray-600 font-mono mt-1">{formatAddress(address!)}</p>
          </div>

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-bold text-gray-800 mb-2">Username</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="your_trading_name"
                maxLength={20}
                className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-none transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-800 mb-2">Bio</label>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Tell others about your trading style..."
                maxLength={160}
                rows={3}
                className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-none transition-all resize-none"
              />
              <div className="mt-2 text-right text-sm text-gray-500">
                {bio.length}/160
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleSave}
                disabled={loading || !username}
                className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold py-4 rounded-xl hover:shadow-lg transition-all disabled:opacity-50"
              >
                {loading ? "Saving..." : "Save Profile"}
              </button>
              
              {!isNewUser && (
                <button
                  onClick={() => setIsEditMode(false)}
                  className="px-6 py-4 border-2 border-gray-200 text-gray-700 font-bold rounded-xl hover:bg-gray-50 transition-all"
                >
                  Cancel
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Profile view
  return (
    <div className="max-w-5xl mx-auto py-8 px-6">
      {/* Profile Header */}
      <div className="bg-white rounded-3xl shadow-lg p-8 mb-6 border border-gray-100">
        <div className="flex items-start justify-between flex-wrap gap-6">
          <div className="flex items-center gap-6">
            <div className="w-28 h-28 bg-gradient-to-br from-purple-400 to-pink-400 rounded-full overflow-hidden border-4 border-white shadow-xl flex-shrink-0">
              <img 
                src={profile?.avatar || `https://api.dicebear.com/7.x/identicon/svg?seed=${address}`}
                alt={profile?.username}
                className="w-full h-full object-cover"
              />
            </div>
            
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-1">{profile?.username}</h1>
              <p className="text-sm text-gray-600 font-mono mb-3">{formatAddress(address!)}</p>
              <p className="text-gray-700 mb-4 max-w-md">{profile?.bio || "No bio yet"}</p>
              
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">👥</span>
                  <div>
                    <div className="font-bold text-gray-900 text-lg">{profile?.followers || 0}</div>
                    <div className="text-xs text-gray-600">Followers</div>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <span className="text-2xl">➕</span>
                  <div>
                    <div className="font-bold text-gray-900 text-lg">{profile?.following || 0}</div>
                    <div className="text-xs text-gray-600">Following</div>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <span className="text-2xl">🔄</span>
                  <div>
                    <div className="font-bold text-gray-900 text-lg">{profile?.totalSwaps || 0}</div>
                    <div className="text-xs text-gray-600">Trades</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <button
            onClick={() => setIsEditMode(true)}
            className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold rounded-xl hover:shadow-lg transition-all flex items-center gap-2"
          >
            <span>✏️</span> Edit Profile
          </button>
        </div>
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Session Monitor */}
        <div>
          <SessionMonitor />
        </div>

        {/* Quick Actions */}
        <div className="space-y-6">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Quick Actions</h2>
            
            <div className="space-y-3">
              <Link 
                href="/social"
                className="flex items-center gap-3 p-4 bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl hover:shadow-md transition border border-purple-100"
              >
                <span className="text-3xl">✨</span>
                <div>
                  <div className="font-bold text-gray-900">Create a Post</div>
                  <div className="text-sm text-gray-600">Share your latest trade</div>
                </div>
              </Link>
              
              <Link 
                href="/swap"
                className="flex items-center gap-3 p-4 bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl hover:shadow-md transition border border-blue-100"
              >
                <span className="text-3xl">🔄</span>
                <div>
                  <div className="font-bold text-gray-900">Make a Trade</div>
                  <div className="text-sm text-gray-600">Swap tokens on DEX</div>
                </div>
              </Link>
              
              <Link 
                href="/liquidity"
                className="flex items-center gap-3 p-4 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl hover:shadow-md transition border border-green-100"
              >
                <span className="text-3xl">💧</span>
                <div>
                  <div className="font-bold text-gray-900">Add Liquidity</div>
                  <div className="text-sm text-gray-600">Earn trading fees</div>
                </div>
              </Link>
            </div>
          </div>
          
          {/* Stats Card */}
          <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl shadow-sm border border-purple-100 p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Your Stats</h2>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white rounded-xl p-4">
                <div className="text-2xl font-bold text-purple-600">{profile?.reputation || 100}</div>
                <div className="text-sm text-gray-600">Reputation</div>
              </div>
              
              <div className="bg-white rounded-xl p-4">
                <div className="text-2xl font-bold text-green-600">{profile?.totalSwaps || 0}</div>
                <div className="text-sm text-gray-600">Total Trades</div>
              </div>
            </div>
            
            <div className="mt-4 text-sm text-gray-600 bg-white rounded-xl p-4">
              <p>
                <strong>Member since:</strong>{" "}
                {profile?.createdAt 
                  ? new Date(profile.createdAt).toLocaleDateString('en-US', {
                      month: 'long',
                      year: 'numeric',
                    })
                  : "Recently"}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}