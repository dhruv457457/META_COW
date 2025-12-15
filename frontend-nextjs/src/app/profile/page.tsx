"use client";

import { useState, useEffect } from "react";
import { useWallet } from "@/context/WalletContext";
import { toast } from "react-hot-toast";
import { fetchUserSwaps, fetchLatestSwaps, type EnvioSwapEvent } from "@/utils/envioClient";
import Link from "next/link";

interface UserProfile {
  username: string;
  bio: string;
  avatar: string;
  walletAddress: string;
  followers?: number;
  following?: number;
  reputation?: number;
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
  
  // Swap data
  const [userSwaps, setUserSwaps] = useState<EnvioSwapEvent[]>([]);
  const [socialFeed, setSocialFeed] = useState<EnvioSwapEvent[]>([]);
  const [swapsLoading, setSwapsLoading] = useState(true);

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

  // Load swap history
  useEffect(() => {
    const loadSwaps = async () => {
      if (!address) return;
      
      setSwapsLoading(true);
      try {
        // Fetch user's swaps from Envio
        const swaps = await fetchUserSwaps(address, 20);
        setUserSwaps(swaps);
        
        // Fetch social feed (latest swaps from all users)
        const feed = await fetchLatestSwaps(10);
        setSocialFeed(feed);
      } catch (err) {
        console.error("Failed to fetch swaps:", err);
      } finally {
        setSwapsLoading(false);
      }
    };
    
    loadSwaps();
    
    // Auto-refresh every 15 seconds
    const interval = setInterval(loadSwaps, 15000);
    return () => clearInterval(interval);
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
      
      setProfile({ ...data.user, followers: 0, following: 0, reputation: 100 });
      setIsEditMode(false);
      setIsNewUser(false);
      toast.success(isNewUser ? "Profile Created! 🎉" : "Profile Updated! ✅");
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const formatAmount = (amount: string) => {
    return (parseFloat(amount) / 1e18).toFixed(4);
  };

  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  const getTimeAgo = (timestamp: number) => {
    const seconds = Math.floor(Date.now() / 1000 - timestamp);
    if (seconds < 60) return `${seconds}s ago`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
  };

  if (!isConnected) {
    return (
      <div className="text-center py-20">
        <div className="text-6xl mb-4">🔐</div>
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Connect Your Wallet</h2>
        <p className="text-gray-500">Connect your wallet to view your profile</p>
      </div>
    );
  }

  // Edit mode / New user form
  if (isEditMode || isNewUser) {
    return (
      <div className="max-w-2xl mx-auto py-12 px-6">
        <div className="bg-white rounded-3xl shadow-xl p-8 border border-gray-100">
          <div className="text-center mb-8">
            <div className="w-24 h-24 bg-purple-100 rounded-full mx-auto mb-4 overflow-hidden border-4 border-white shadow-md">
              <img 
                src={profile?.avatar || `https://api.dicebear.com/7.x/identicon/svg?seed=${address}`} 
                alt="Avatar" 
                className="w-full h-full object-cover"
              />
            </div>
            <h1 className="text-2xl font-bold text-gray-800">
              {isNewUser ? "Create Your Identity" : "Edit Profile"}
            </h1>
            <p className="text-sm text-gray-500 font-mono mt-1">{formatAddress(address!)}</p>
          </div>

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Username</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="metaboss.cow"
                maxLength={20}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-none transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Bio</label>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="i am winner"
                maxLength={160}
                rows={3}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-none transition-all resize-none"
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleSave}
                disabled={loading || !username}
                className="flex-1 bg-purple-600 text-white font-bold py-4 rounded-xl hover:bg-purple-700 transition-all disabled:opacity-50"
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
    <div className="max-w-7xl mx-auto py-8 px-6">
      {/* Profile Header */}
      <div className="bg-white rounded-3xl shadow-lg p-8 mb-6 border border-gray-100">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-6">
            <div className="w-28 h-28 bg-purple-100 rounded-full overflow-hidden border-4 border-white shadow-lg">
              <img 
                src={profile?.avatar || `https://api.dicebear.com/7.x/identicon/svg?seed=${address}`}
                alt={profile?.username}
                className="w-full h-full object-cover"
              />
            </div>
            
            <div>
              <h1 className="text-3xl font-bold text-gray-800 mb-1">{profile?.username}</h1>
              <p className="text-sm text-gray-500 font-mono mb-3">{formatAddress(address!)}</p>
              <p className="text-gray-700 mb-4">{profile?.bio || "No bio yet"}</p>
              
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">👥</span>
                  <div>
                    <div className="font-bold text-gray-800">{profile?.followers || 0}</div>
                    <div className="text-xs text-gray-500">Followers</div>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <span className="text-2xl">➕</span>
                  <div>
                    <div className="font-bold text-gray-800">{profile?.following || 0}</div>
                    <div className="text-xs text-gray-500">Following</div>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <span className="text-2xl">🔄</span>
                  <div>
                    <div className="font-bold text-gray-800">{userSwaps.length}</div>
                    <div className="text-xs text-gray-500">Trades</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <button
            onClick={() => setIsEditMode(true)}
            className="px-6 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-all flex items-center gap-2"
          >
            <span>✏️</span> Edit
          </button>
        </div>
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Swaps */}
        <div className="bg-white rounded-3xl shadow-lg p-6 border border-gray-100">
          <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
            📊 Recent Swaps
          </h2>
          
          {swapsLoading ? (
            <div className="text-center py-8 text-gray-500">Loading swaps...</div>
          ) : userSwaps.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-4xl mb-2">🤷</div>
              <p className="text-gray-500">No swaps yet</p>
              <Link href="/swap" className="text-purple-600 hover:underline text-sm">
                Make your first swap →
              </Link>
            </div>
          ) : (
            <div className="space-y-3 max-h-[500px] overflow-y-auto">
              {userSwaps.map((swap, idx) => (
                <div key={swap.id} className="p-4 bg-gray-50 rounded-xl border border-gray-200 hover:border-purple-300 transition-all">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-gray-500">#{idx + 1}</span>
                    <span className="text-xs text-gray-500">{getTimeAgo(swap.timestamp)}</span>
                  </div>
                  
                  <div className="flex items-center gap-2 text-sm">
                    <span className="font-mono text-purple-600">{formatAmount(swap.inputAmount)}</span>
                    <span className="font-bold">{formatAddress(swap.inputToken)}</span>
                    <span className="text-gray-400">→</span>
                    <span className="font-mono text-green-600">{formatAmount(swap.outputAmount)}</span>
                    <span className="font-bold">{formatAddress(swap.outputToken)}</span>
                  </div>
                  
                  <a 
                    href={`https://testnet.bscscan.com/tx/${swap.txHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-blue-600 hover:underline mt-2 block"
                  >
                    Tx: {formatAddress(swap.txHash)}
                  </a>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Live Social Feed */}
        <div className="bg-white rounded-3xl shadow-lg p-6 border border-gray-100">
          <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
            👥 Live Social Feed
          </h2>
          
          {socialFeed.length === 0 ? (
            <div className="text-center py-8 text-gray-500">No activity yet</div>
          ) : (
            <div className="space-y-4 max-h-[500px] overflow-y-auto">
              {socialFeed.map((swap) => (
                <div key={swap.id} className="p-4 bg-purple-50 rounded-xl border border-purple-200">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 bg-purple-200 rounded-full overflow-hidden">
                      <img 
                        src={`https://api.dicebear.com/7.x/identicon/svg?seed=${swap.user}`}
                        alt="User"
                        className="w-full h-full"
                      />
                    </div>
                    <div className="flex-1">
                      <div className="font-bold text-gray-800 text-sm">{formatAddress(swap.user)}</div>
                      <div className="text-xs text-gray-500">{getTimeAgo(swap.timestamp)}</div>
                    </div>
                  </div>
                  
                  <div className="text-sm">
                    <span className="font-mono text-purple-600">{formatAmount(swap.inputAmount)}</span>
                    <span className="mx-2 text-gray-600">swapped for</span>
                    <span className="font-mono text-green-600">{formatAmount(swap.outputAmount)}</span>
                  </div>
                  
                  <div className="mt-2 text-xs text-gray-500">
                    Tx: {formatAddress(swap.txHash)}
                  </div>
                  
                  <button className="mt-3 text-xs text-purple-600 hover:text-purple-700 font-bold">
                    🔁 Copy Trade
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}