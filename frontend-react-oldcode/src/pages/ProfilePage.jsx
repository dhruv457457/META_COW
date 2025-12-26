import { useEffect, useState } from "react";
import { ethers } from "ethers";
import axios from "axios";
import { useWallet } from "../contexts/WalletContext";

import ProfileHeader from "../components/profile/ProfileHeader";
import ProfileEdit from "../components/profile/ProfileEdit";
import RecentActivity from "../components/profile/RecentActivity";
import SocialFeed from "../components/profile/SocialFeed";
import RegisterProfile from "../components/profile/RegisterProfile";
import RenderLoadingNotice from "../components/RenderLoadingNotice";

import { FACTORY_ADDRESS, FACTORY_ABI, PAIR_ABI } from "../utils/constants";
import { Interface } from "ethers";

export default function ProfilePage() {
  const [user, setUser] = useState(null);
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [reputation, setReputation] = useState(null);
const [followStats, setFollowStats] = useState({ followersCount: 0, followingCount: 0 });

  const { walletData } = useWallet();
  const address = walletData?.address;
  const isConnected = !!address;

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await axios.get(`https://meta-cow.onrender.com/api/users/wallet/${address}`);
        setUser(res.data);
      } catch (err) {
        console.error("User fetch error:", err);
      } finally {
        setLoading(false);
      }
    };


    if (isConnected) fetchUser();
  }, [address]);
useEffect(() => {
  const fetchFollowStats = async () => {
    if (!user?._id) return;
    try {
const res = await axios.get(`https://meta-cow.onrender.com/api/follow/stats/wallet/${address}`);
      setFollowStats(res.data);
    } catch (err) {
      console.error("Follow stats fetch error:", err);
    }
  };
  fetchFollowStats();
}, [user]);
  useEffect(() => {
    const fetchReputation = async () => {
      try {
        const provider = new ethers.BrowserProvider(window.ethereum);
        const factory = new ethers.Contract(FACTORY_ADDRESS, FACTORY_ABI, provider);
        const iface = new Interface(PAIR_ABI);
        const pairCount = await factory.allPairsLength();
    let totalScore = 0;

        for (let i = 0; i < pairCount; i++) {
          const pairAddr = await factory.allPairs(i);
          const pair = new ethers.Contract(pairAddr, PAIR_ABI, provider);

          const supportsReputation = iface.fragments.some((f) => f.name === "getReputationScore");
          if (!supportsReputation) continue;

          try {
            const score = await pair.getReputationScore(address);
            totalScore += Number(score);
          } catch (err) {
            console.warn(`Failed to fetch reputation from ${pairAddr}:`, err.message);
          }
        }

        setReputation(totalScore);
      } catch (err) {
        console.error("On-chain reputation fetch error:", err);
      }
    };

    if (isConnected) fetchReputation();
  }, [address]);
useEffect(() => {
  const fetchTradeCount = async () => {
    try {
      const res = await axios.get(`https://meta-cow.onrender.com/api/swaps/count?user=${address}`);
      setUser((prev) => ({ ...prev, totalTrades: res.data?.count || 0 }));
    } catch (err) {
      console.error("Trade count fetch error:", err);
    }
  };

  if (isConnected) fetchTradeCount();
}, [address]);

  if (!isConnected) {
    return <div className="text-center py-20 text-gray-500">🔌 Connect your wallet to view your profile.</div>;
  }

  if (loading) {
    return <RenderLoadingNotice show={loading} />;
  }
if (!user || !user.username || user.username === "unknown") {
  return <RegisterProfile wallet={address} onRegister={setUser} />;
}


  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8">
<ProfileHeader
  user={user}
  reputation={reputation}
  onEdit={() => setEditing(true)}
  followStats={followStats} // ✅ ADD THIS
/>

      {editing && (
        <ProfileEdit
          user={user}
          onClose={() => setEditing(false)}
          onSave={(updatedUser) => {
            setUser(updatedUser);
            setEditing(false);
          }}
        />
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="overflow-hidden bg-white rounded-2xl shadow border p-4">
          <RecentActivity wallet={address} />
        </div>

        <div className="overflow-hidden bg-white rounded-2xl shadow border p-4">
          <SocialFeed wallet={address} />
        </div>
      </div>
    </div>
  );
}
