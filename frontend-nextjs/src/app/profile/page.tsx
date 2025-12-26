"use client";

import { useState, useEffect } from "react";
import { useWallet } from "@/context/WalletContext";
import { toast } from "react-hot-toast";
import Link from "next/link";
import SessionMonitor from "@/components/SessionMonitor";

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
  
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [username, setUsername] = useState("");
  const [bio, setBio] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isNewUser, setIsNewUser] = useState(false);

  // Load profile data
  useEffect(() => {
    const fetchProfile = async () => {
      if (!address) {
        setLoading(false);
        return;
      }
      
      setLoading(true);
      try {
        const res = await fetch(`/api/users/profile?wallet=${address}`);
        if (res.ok) {
          const data = await res.json();
          setProfile(data);
          setUsername(data.username);
          setBio(data.bio || "");
          setIsNewUser(false);
        } else {
          // New user - no profile yet
          setIsNewUser(true);
          setProfile(null);
        }
      } catch (err) {
        console.error("Failed to fetch profile:", err);
        setIsNewUser(true);
      } finally {
        setLoading(false);
      }
    };
    
    fetchProfile();
  }, [address]);

  const handleSave = async () => {
    if (!isConnected || !address || !username.trim()) {
      toast.error("Username is required");
      return;
    }
    
    try {
      setSaving(true);
      const res = await fetch("/api/users/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          wallet: address,
          username: username.trim(),
          bio: bio.trim(),
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
      setSaving(false);
    }
  };

  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50/30 to-blue-50/30 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600 font-medium">Loading profile...</p>
        </div>
      </div>
    );
  }

  // Not connected
  if (!isConnected) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50/30 to-blue-50/30 flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white rounded-3xl shadow-2xl p-12 text-center border border-purple-100">
          <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-6">
            <span className="text-4xl">🔐</span>
          </div>
          <h2 className="text-3xl font-black text-slate-800 mb-3">Connect Wallet</h2>
          <p className="text-slate-600 mb-6">Connect your wallet to view and manage your profile</p>
        </div>
      </div>
    );
  }

  // Edit mode or New user
  if (isEditMode || isNewUser) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50/30 to-blue-50/30 py-12 px-6">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-3xl shadow-2xl p-8 border border-purple-100">
            <div className="text-center mb-8">
              <div className="w-28 h-28 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full mx-auto mb-4 overflow-hidden border-4 border-white shadow-xl">
                <img 
                  src={profile?.avatar || `https://api.dicebear.com/7.x/identicon/svg?seed=${address}`} 
                  alt="Avatar" 
                  className="w-full h-full object-cover"
                />
              </div>
              <h1 className="text-3xl font-black text-slate-800 mb-2">
                {isNewUser ? "🎉 Welcome to MetaCow!" : "✏️ Edit Your Profile"}
              </h1>
              <p className="text-sm text-slate-500 font-mono">{formatAddress(address!)}</p>
            </div>

            <div className="space-y-6">
              {/* Username */}
              <div>
                <label className="block text-sm font-bold text-slate-800 mb-2 flex items-center gap-2">
                  <span>👤</span> Username
                </label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Choose your trading name"
                  maxLength={20}
                  className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 focus:border-purple-500 focus:ring-4 focus:ring-purple-100 outline-none transition-all text-slate-800 font-medium"
                />
                <p className="text-xs text-slate-500 mt-1">Max 20 characters</p>
              </div>

              {/* Bio */}
              <div>
                <label className="block text-sm font-bold text-slate-800 mb-2 flex items-center gap-2">
                  <span>📝</span> Bio
                </label>
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Tell traders about your strategy..."
                  maxLength={160}
                  rows={4}
                  className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 focus:border-purple-500 focus:ring-4 focus:ring-purple-100 outline-none transition-all resize-none text-slate-800"
                />
                <div className="flex justify-between items-center mt-1">
                  <p className="text-xs text-slate-500">Optional</p>
                  <p className="text-xs text-slate-500">{bio.length}/160</p>
                </div>
              </div>

              {/* Buttons */}
              <div className="flex gap-3 pt-4">
                <button
                  onClick={handleSave}
                  disabled={saving || !username.trim()}
                  className="flex-1 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-bold py-4 rounded-xl hover:shadow-xl hover:scale-[1.02] transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                >
                  {saving ? "Saving..." : isNewUser ? "Create Profile" : "Save Changes"}
                </button>
                
                {!isNewUser && (
                  <button
                    onClick={() => {
                      setIsEditMode(false);
                      setUsername(profile?.username || "");
                      setBio(profile?.bio || "");
                    }}
                    disabled={saving}
                    className="px-6 py-4 border-2 border-slate-200 text-slate-700 font-bold rounded-xl hover:bg-slate-50 transition-all disabled:opacity-50"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Profile view
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50/30 to-blue-50/30 py-8 px-6">
      <div className="max-w-6xl mx-auto">
        {/* Profile Header */}
        <div className="bg-white rounded-3xl shadow-xl p-8 mb-6 border border-purple-100">
          <div className="flex flex-col lg:flex-row items-start justify-between gap-8">
            <div className="flex items-center gap-6">
              <div className="relative">
                <div className="w-32 h-32 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full overflow-hidden border-4 border-white shadow-2xl">
                  <img 
                    src={profile?.avatar || `https://api.dicebear.com/7.x/identicon/svg?seed=${address}`}
                    alt={profile?.username}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-green-500 rounded-full border-4 border-white flex items-center justify-center">
                  <span className="text-white text-lg">✓</span>
                </div>
              </div>
              
              <div>
                <h1 className="text-4xl font-black text-slate-800 mb-2">{profile?.username}</h1>
                <p className="text-sm text-slate-500 font-mono mb-4">{formatAddress(address!)}</p>
                {profile?.bio && (
                  <p className="text-slate-600 mb-4 max-w-xl leading-relaxed">{profile.bio}</p>
                )}
                
                <div className="flex items-center gap-6 flex-wrap">
                  <div className="flex items-center gap-2 bg-gradient-to-r from-purple-50 to-blue-50 px-4 py-2 rounded-xl border border-purple-200">
                    <span className="text-2xl">👥</span>
                    <div>
                      <div className="font-black text-slate-800 text-lg">{profile?.followers || 0}</div>
                      <div className="text-xs text-slate-600">Followers</div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 bg-gradient-to-r from-blue-50 to-cyan-50 px-4 py-2 rounded-xl border border-blue-200">
                    <span className="text-2xl">➕</span>
                    <div>
                      <div className="font-black text-slate-800 text-lg">{profile?.following || 0}</div>
                      <div className="text-xs text-slate-600">Following</div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 bg-gradient-to-r from-green-50 to-emerald-50 px-4 py-2 rounded-xl border border-green-200">
                    <span className="text-2xl">🔄</span>
                    <div>
                      <div className="font-black text-slate-800 text-lg">{profile?.totalSwaps || 0}</div>
                      <div className="text-xs text-slate-600">Trades</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <button
              onClick={() => setIsEditMode(true)}
              className="px-8 py-4 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-bold rounded-xl hover:shadow-xl hover:scale-[1.02] transition-all flex items-center gap-2 whitespace-nowrap"
            >
              <span>✏️</span> Edit Profile
            </button>
          </div>
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Session Monitor - Takes 2 columns */}
          <div className="lg:col-span-2">
            <SessionMonitor />
          </div>

          {/* Right Sidebar */}
          <div className="space-y-6">
            {/* Stats Card */}
            <div className="bg-gradient-to-br from-purple-500 to-blue-500 rounded-3xl shadow-xl p-6 text-white">
              <h2 className="text-xl font-black mb-4 flex items-center gap-2">
                <span>⭐</span> Your Stats
              </h2>
              
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-4 border border-white/30">
                  <div className="text-3xl font-black mb-1">{profile?.reputation || 100}</div>
                  <div className="text-xs opacity-90">Reputation</div>
                </div>
                
                <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-4 border border-white/30">
                  <div className="text-3xl font-black mb-1">{profile?.totalSwaps || 0}</div>
                  <div className="text-xs opacity-90">Total Trades</div>
                </div>
              </div>
              
              <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-4 border border-white/30">
                <p className="text-sm opacity-90">
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

            {/* Quick Actions */}
            <div className="bg-white rounded-3xl shadow-xl p-6 border border-purple-100">
              <h2 className="text-xl font-black text-slate-800 mb-4 flex items-center gap-2">
                <span>⚡</span> Quick Actions
              </h2>
              
              <div className="space-y-3">
                <Link 
                  href="/social"
                  className="group flex items-center gap-3 p-4 bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl hover:shadow-lg hover:scale-[1.02] transition-all border border-purple-200"
                >
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
                    ✨
                  </div>
                  <div>
                    <div className="font-bold text-slate-800">Social Feed</div>
                    <div className="text-sm text-slate-600">View live trades</div>
                  </div>
                </Link>
                
                <Link 
                  href="/swap"
                  className="group flex items-center gap-3 p-4 bg-gradient-to-br from-blue-50 to-cyan-50 rounded-2xl hover:shadow-lg hover:scale-[1.02] transition-all border border-blue-200"
                >
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
                    🔄
                  </div>
                  <div>
                    <div className="font-bold text-slate-800">Swap Tokens</div>
                    <div className="text-sm text-slate-600">Trade on DEX</div>
                  </div>
                </Link>
                
                <Link 
                  href="/liquidity"
                  className="group flex items-center gap-3 p-4 bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl hover:shadow-lg hover:scale-[1.02] transition-all border border-green-200"
                >
                  <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
                    💧
                  </div>
                  <div>
                    <div className="font-bold text-slate-800">Add Liquidity</div>
                    <div className="text-sm text-slate-600">Earn 0.3% fees</div>
                  </div>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}