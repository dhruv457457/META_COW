import { useEffect, useState } from "react";
import axios from "axios";
import { useWallet } from "../contexts/WalletContext";
import ProfileHeader from "../components/profile/ProfileHeader";
import ProfileEdit from "../components/profile/ProfileEdit";
import RecentActivity from "../components/profile/RecentActivity";
import RegisterProfile from "../components/profile/RegisterProfile";

export default function ProfilePage() {
  const { walletAddress, isConnected } = useWallet();
  const [user, setUser] = useState(null);
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(true);

  // ✅ Fetch user on mount
  useEffect(() => {
    if (!walletAddress) return;
    console.log("🔍 Fetching profile for:", walletAddress);
console.log("🧠 Render state - user:", user, "loading:", loading, "walletAddress:", walletAddress);

    const fetchUser = async () => {
      try {
        const res = await axios.get(`https://meta-cow.onrender.com/api/users/wallet/${walletAddress}`);
        console.log("✅ Got user:", res.data);
        setUser(res.data); // Will be null if not found
      } catch (err) {
        console.error("❌ Fetch user failed:", err);
        console.log("🧠 Render state - user:", user, "loading:", loading, "walletAddress:", walletAddress);

      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [walletAddress]);

  if (!isConnected) {
    return <div className="text-center py-20 text-gray-500">🔌 Connect your wallet to view profile</div>;
  }

  if (loading) {
    return <div className="text-center mt-12 text-gray-500">⏳ Loading profile...</div>;
  }

  // ✅ If user is not registered
  if (!user) {
    return <RegisterProfile wallet={walletAddress} onRegister={setUser} />;
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      <ProfileHeader user={user} onEdit={() => setEditing(true)} />

      {editing && (
        <ProfileEdit
          user={user}
          onClose={() => setEditing(false)}
          onSave={(updated) => {
            setUser(updated);
            setEditing(false);
          }}
        />
      )}

      <RecentActivity wallet={walletAddress} />
    </div>
  );
}
