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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-3 border-gray-300 border-t-purple-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-sm p-12 text-center border border-gray-200">
          <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <span className="text-3xl">🔐</span>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-3">Connect Wallet</h2>
          <p className="text-gray-600">Connect your wallet to view your profile</p>
        </div>
      </div>
    );
  }

  if (isEditMode || isNewUser) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-6">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-2xl shadow-sm p-8 border border-gray-200">
            <div className="text-center mb-8">
              <div className="w-24 h-24 bg-purple-600 rounded-full mx-auto mb-4 overflow-hidden border-4 border-white shadow-lg">
                <img 
                  src={profile?.avatar || `https://api.dicebear.com/7.x/identicon/svg?seed=${address}`} 
                  alt="Avatar" 
                  className="w-full h-full object-cover"
                />
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                {isNewUser ? "Create Your Profile" : "Edit Profile"}
              </h1>
              <p className="text-sm text-gray-500 font-mono">{formatAddress(address!)}</p>
            </div>

            <div className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Username
                </label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Choose your username"
                  maxLength={20}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-purple-500 focus:ring-2 focus:ring-purple-100 outline-none transition-all text-gray-900"
                />
                <p className="text-xs text-gray-500 mt-1">Max 20 characters</p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Bio
                </label>
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Tell traders about your strategy..."
                  maxLength={160}
                  rows={4}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-purple-500 focus:ring-2 focus:ring-purple-100 outline-none transition-all resize-none text-gray-900"
                />
                <div className="flex justify-between items-center mt-1">
                  <p className="text-xs text-gray-500">Optional</p>
                  <p className="text-xs text-gray-500">{bio.length}/160</p>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={handleSave}
                  disabled={saving || !username.trim()}
                  className="flex-1 bg-purple-600 text-white font-semibold py-3 rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
                    className="px-6 py-3 border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
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

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-6">
      <div className="max-w-6xl mx-auto">
        {/* Profile Header */}
        <div className="bg-white rounded-2xl shadow-sm p-8 mb-6 border border-gray-200">
          <div className="flex flex-col lg:flex-row items-start justify-between gap-8">
            <div className="flex items-center gap-6">
              <div className="relative">
                <div className="w-28 h-28 bg-purple-600 rounded-full overflow-hidden border-4 border-white shadow-lg">
                  <img 
                    src={profile?.avatar || `https://api.dicebear.com/7.x/identicon/svg?seed=${address}`}
                    alt={profile?.username}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-green-500 rounded-full border-4 border-white flex items-center justify-center">
                  <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                  </svg>
                </div>
              </div>
              
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">{profile?.username}</h1>
                <p className="text-sm text-gray-500 font-mono mb-4">{formatAddress(address!)}</p>
                {profile?.bio && (
                  <p className="text-gray-700 mb-4 max-w-xl">{profile.bio}</p>
                )}
                
                <div className="flex items-center gap-6 flex-wrap">
                  <div className="flex items-center gap-2">
                    <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                      <span className="text-xl">👥</span>
                    </div>
                    <div>
                      <div className="font-bold text-gray-900">{profile?.followers || 0}</div>
                      <div className="text-xs text-gray-600">Followers</div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      <span className="text-xl">➕</span>
                    </div>
                    <div>
                      <div className="font-bold text-gray-900">{profile?.following || 0}</div>
                      <div className="text-xs text-gray-600">Following</div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                      <span className="text-xl">🔄</span>
                    </div>
                    <div>
                      <div className="font-bold text-gray-900">{profile?.totalSwaps || 0}</div>
                      <div className="text-xs text-gray-600">Trades</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <button
              onClick={() => setIsEditMode(true)}
              className="px-6 py-3 bg-purple-600 text-white font-semibold rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-2 whitespace-nowrap"
            >
              ✏️ Edit Profile
            </button>
          </div>
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Session Monitor */}
          <div className="lg:col-span-2">
            <SessionMonitor />
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Stats */}
            <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-200">
              <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                ⭐ Your Stats
              </h2>
              
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="bg-purple-50 rounded-xl p-4 border border-purple-100">
                  <div className="text-2xl font-bold text-purple-600 mb-1">{profile?.reputation || 100}</div>
                  <div className="text-xs text-gray-600">Reputation</div>
                </div>
                
                <div className="bg-green-50 rounded-xl p-4 border border-green-100">
                  <div className="text-2xl font-bold text-green-600 mb-1">{profile?.totalSwaps || 0}</div>
                  <div className="text-xs text-gray-600">Total Trades</div>
                </div>
              </div>
              
              <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                <p className="text-sm text-gray-600">
                  <strong className="text-gray-900">Member since:</strong>{" "}
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
            <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-200">
              <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                ⚡ Quick Actions
              </h2>
              
              <div className="space-y-3">
                <Link 
                  href="/social"
                  className="flex items-center gap-3 p-4 bg-purple-50 rounded-xl border border-purple-100 hover:bg-purple-100 transition-colors"
                >
                  <div className="w-10 h-10 bg-purple-600 rounded-lg flex items-center justify-center text-white">
                    ✨
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900">Social Feed</div>
                    <div className="text-xs text-gray-600">View live trades</div>
                  </div>
                </Link>
                
                <Link 
                  href="/swap"
                  className="flex items-center gap-3 p-4 bg-blue-50 rounded-xl border border-blue-100 hover:bg-blue-100 transition-colors"
                >
                  <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center text-white">
                    🔄
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900">Swap Tokens</div>
                    <div className="text-xs text-gray-600">Trade on DEX</div>
                  </div>
                </Link>
                
                <Link 
                  href="/liquidity"
                  className="flex items-center gap-3 p-4 bg-green-50 rounded-xl border border-green-100 hover:bg-green-100 transition-colors"
                >
                  <div className="w-10 h-10 bg-green-600 rounded-lg flex items-center justify-center text-white">
                    💧
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900">Add Liquidity</div>
                    <div className="text-xs text-gray-600">Earn 0.3% fees</div>
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