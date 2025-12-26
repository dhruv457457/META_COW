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

// Professional Icons
const UsersIcon = (props: any) => (
  <svg {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
  </svg>
);

const UserPlusIcon = (props: any) => (
  <svg {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
  </svg>
);

const RefreshIcon = (props: any) => (
  <svg {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
  </svg>
);

const StarIcon = (props: any) => (
  <svg {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
  </svg>
);

const SparklesIcon = (props: any) => (
  <svg {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
  </svg>
);

const ArrowsRightLeftIcon = (props: any) => (
  <svg {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" />
  </svg>
);

const BeakerIcon = (props: any) => (
  <svg {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c.251.023.501.05.75.082m-.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0112 15a9.065 9.065 0 00-6.23-.693L5 14.5m14.8.8l1.402 1.402c1.232 1.232.65 3.318-1.067 3.611A48.309 48.309 0 0112 21c-2.773 0-5.491-.235-8.135-.687-1.718-.293-2.3-2.379-1.067-3.61L5 14.5" />
  </svg>
);

const PencilIcon = (props: any) => (
  <svg {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
  </svg>
);

const LockClosedIcon = (props: any) => (
  <svg {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
  </svg>
);

const BoltIcon = (props: any) => (
  <svg {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
  </svg>
);

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
            <LockClosedIcon className="w-8 h-8 text-purple-600" />
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
              <div className="relative flex-shrink-0">
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
              
              <div className="min-w-0">
                <h1 className="text-3xl font-bold text-gray-900 mb-2 break-words">{profile?.username}</h1>
                <p className="text-sm text-gray-500 font-mono mb-4 break-all">{formatAddress(address!)}</p>
                {profile?.bio && (
                  <p className="text-gray-700 mb-4 max-w-xl break-words">{profile.bio}</p>
                )}
                
                <div className="flex items-center gap-6 flex-wrap">
                  <div className="flex items-center gap-2">
                    <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <UsersIcon className="w-5 h-5 text-purple-600" />
                    </div>
                    <div>
                      <div className="font-bold text-gray-900">{profile?.followers || 0}</div>
                      <div className="text-xs text-gray-600">Followers</div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <UserPlusIcon className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <div className="font-bold text-gray-900">{profile?.following || 0}</div>
                      <div className="text-xs text-gray-600">Following</div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <RefreshIcon className="w-5 h-5 text-green-600" />
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
              className="px-6 py-3 bg-purple-600 text-white font-semibold rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-2 whitespace-nowrap flex-shrink-0"
            >
              <PencilIcon className="w-5 h-5" />
              Edit Profile
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
                <StarIcon className="w-5 h-5 text-gray-900" />
                Your Stats
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
                <BoltIcon className="w-5 h-5 text-gray-900" />
                Quick Actions
              </h2>
              
              <div className="space-y-3">
                <Link 
                  href="/social"
                  className="flex items-center gap-3 p-4 bg-purple-50 rounded-xl border border-purple-100 hover:bg-purple-100 transition-colors"
                >
                  <div className="w-10 h-10 bg-purple-600 rounded-lg flex items-center justify-center flex-shrink-0">
                    <SparklesIcon className="w-5 h-5 text-white" />
                  </div>
                  <div className="min-w-0">
                    <div className="font-semibold text-gray-900">Social Feed</div>
                    <div className="text-xs text-gray-600">View live trades</div>
                  </div>
                </Link>
                
                <Link 
                  href="/swap"
                  className="flex items-center gap-3 p-4 bg-blue-50 rounded-xl border border-blue-100 hover:bg-blue-100 transition-colors"
                >
                  <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
                    <ArrowsRightLeftIcon className="w-5 h-5 text-white" />
                  </div>
                  <div className="min-w-0">
                    <div className="font-semibold text-gray-900">Swap Tokens</div>
                    <div className="text-xs text-gray-600">Trade on DEX</div>
                  </div>
                </Link>
                
                <Link 
                  href="/liquidity"
                  className="flex items-center gap-3 p-4 bg-green-50 rounded-xl border border-green-100 hover:bg-green-100 transition-colors"
                >
                  <div className="w-10 h-10 bg-green-600 rounded-lg flex items-center justify-center flex-shrink-0">
                    <BeakerIcon className="w-5 h-5 text-white" />
                  </div>
                  <div className="min-w-0">
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