"use client";

import { useState, useEffect } from "react";
import { useWallet } from "@/context/WalletContext";
import { toast } from "react-hot-toast";

interface FollowButtonProps {
  targetWallet: string;
  targetUsername: string;
  initialFollowing?: boolean;
  onFollowChange?: (isFollowing: boolean) => void;
}

export default function FollowButton({ 
  targetWallet, 
  targetUsername,
  initialFollowing = false,
  onFollowChange 
}: FollowButtonProps) {
  const { address, isConnected } = useWallet();
  const [isFollowing, setIsFollowing] = useState(initialFollowing);
  const [loading, setLoading] = useState(false);
  const [checkingStatus, setCheckingStatus] = useState(true);
  
  // Don't show button for own profile
  const isOwnProfile = address && targetWallet.toLowerCase() === address.toLowerCase();
  
  // Check if already following
  useEffect(() => {
    const checkFollowStatus = async () => {
      if (!address || isOwnProfile) {
        setCheckingStatus(false);
        return;
      }
      
      try {
        const res = await fetch(`/api/users/profile?wallet=${address}`);
        if (res.ok) {
          const userData = await res.json();
          const following = userData.following || [];
          setIsFollowing(following.includes(targetWallet.toLowerCase()));
        }
      } catch (error) {
        console.error("Failed to check follow status:", error);
      } finally {
        setCheckingStatus(false);
      }
    };
    
    checkFollowStatus();
  }, [address, targetWallet, isOwnProfile]);
  
  const handleFollow = async () => {
    if (!isConnected || !address) {
      toast.error("Please connect your wallet");
      return;
    }
    
    setLoading(true);
    try {
      if (isFollowing) {
        // Unfollow
        const res = await fetch(
          `/api/users/follow?followerWallet=${address}&targetWallet=${targetWallet}`,
          { method: "DELETE" }
        );
        
        if (!res.ok) {
          const error = await res.json();
          throw new Error(error.error || "Failed to unfollow");
        }
        
        setIsFollowing(false);
        toast.success(`Unfollowed ${targetUsername}`);
        onFollowChange?.(false);
        
      } else {
        // Follow
        const res = await fetch("/api/users/follow", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            followerWallet: address,
            targetWallet,
          }),
        });
        
        if (!res.ok) {
          const error = await res.json();
          throw new Error(error.error || "Failed to follow");
        }
        
        setIsFollowing(true);
        toast.success(`Now following ${targetUsername} ✨`);
        onFollowChange?.(true);
      }
      
    } catch (error: any) {
      console.error("Follow error:", error);
      toast.error(error.message || "Action failed");
    } finally {
      setLoading(false);
    }
  };
  
  // Don't render for own profile
  if (isOwnProfile) {
    return null;
  }
  
  if (checkingStatus) {
    return (
      <button 
        disabled
        className="px-6 py-2.5 bg-gray-100 text-gray-400 rounded-xl font-bold text-sm cursor-not-allowed"
      >
        ...
      </button>
    );
  }
  
  if (isFollowing) {
    return (
      <button
        onClick={handleFollow}
        disabled={loading}
        className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg font-bold hover:bg-gray-200 transition-all shadow-sm flex items-center gap-1.5 text-xs disabled:opacity-50"
      >
        <span>✓</span> Following
      </button>
    );
  }
  
  return (
    <button
      onClick={handleFollow}
      disabled={loading || !isConnected}
      className="px-3 py-1.5 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg font-bold hover:shadow-md transition-all shadow-sm flex items-center gap-1.5 text-xs disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
    >
      <span>+</span> {loading ? "..." : "Follow"}
    </button>
  );
}