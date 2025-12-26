import { Pencil } from "lucide-react";

export default function ProfileHeader({ user, onEdit, reputation, followStats }) {
  const truncate = (addr) => {
    if (!addr || typeof addr !== "string") return "unknown";
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  return (
    <div className="max-w-6xl mx-auto bg-white shadow-lg rounded-3xl p-2 flex flex-col md:flex-row md:items-center gap-6 border border-gray-200">
      <img
        src={user?.profileImage || "/assets/default-avatar.png"}
        alt="Profile"
        className="w-24 h-24 rounded-full object-cover border-2 border-blue-500"
      />

      <div className="flex-1">
        <h2 className="text-3xl font-extrabold text-gray-900">
          {user?.username || truncate(user?.wallet)}
        </h2>
        <p className="text-sm text-gray-400 font-mono my-1">
          {truncate(user?.wallet)}
        </p>

        {user?.bio && (
          <p className="mt-3 text-gray-700 text-base max-w-xl">
            {user.bio}
          </p>
        )}

        {reputation !== null && (
          <p className="mt-4 inline-block bg-blue-50 text-blue-700 font-semibold rounded-full px-3 py-1 select-none">
            ⭐ On-Chain Reputation: <span className="text-blue-900">{reputation}</span>
          </p>
        )}

        <div className="mt-6 flex space-x-8 text-sm text-gray-600">
          <div className="flex items-center gap-2">
            <span className="text-lg">👥</span>
            <span>
              <strong className="font-semibold text-gray-900">
                {followStats?.followersCount || 0}
              </strong> Followers
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-lg">➡️</span>
            <span>
              <strong className="font-semibold text-gray-900">
                {followStats?.followingCount || 0}
              </strong> Following
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-lg">💱</span>
            <span>
              <strong className="font-semibold text-gray-900">
                {user?.totalTrades || 0}
              </strong> Trades
            </span>
          </div>
        </div>
      </div>

      <button
        onClick={onEdit}
        className="mt-4 md:mt-0 bg-blue-600 text-white px-5 py-3 rounded-full flex items-center gap-2 hover:bg-blue-700 transition duration-200 shadow-md hover:shadow-lg"
        aria-label="Edit profile"
      >
        <Pencil size={18} />
        Edit
      </button>
    </div>
  );
}
