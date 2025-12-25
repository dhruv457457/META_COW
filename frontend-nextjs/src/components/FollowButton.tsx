"use client";

import { useState, useEffect } from "react";
import { useWallet } from "@/context/WalletContext";
import { toast } from "react-hot-toast";
import { UserPlus, UserCheck, X } from "lucide-react";

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
  
  const isOwnProfile = address && targetWallet.toLowerCase() === address.toLowerCase();
  
  useEffect(() => {
    const checkFollowStatus = async () => {
      if (!address || isOwnProfile) {
        setCheckingStatus(false);
        return;
      }
      
      try {
        // Force a fresh fetch without cache
        const res = await fetch(`/api/users/profile?wallet=${address}&t=${Date.now()}`, {
          cache: 'no-store',
          headers: {
            'Cache-Control': 'no-cache',
          }
        });
        
        if (res.ok) {
          const userData = await res.json();
          // Check both followingList (new) and following (old) for backward compatibility
          const following = Array.isArray(userData.followingList) 
            ? userData.followingList 
            : Array.isArray(userData.following) 
            ? userData.following 
            : [];
          
          // Check if currently following this target
          const isCurrentlyFollowing = following.some(
            (addr: string) => addr.toLowerCase() === targetWallet.toLowerCase()
          );
          setIsFollowing(isCurrentlyFollowing);
        } else if (res.status === 404) {
          // User doesn't exist yet, so not following
          setIsFollowing(false);
        }
      } catch (error) {
        console.error("Failed to check follow status:", error);
        setIsFollowing(false);
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
        
        const data = await res.json();
        setIsFollowing(true);
        onFollowChange?.(true);
        
        if (data.alreadyFollowing) {
          toast.success(`Already following ${targetUsername}`);
        } else {
          toast.success(`Now following ${targetUsername} ✨`);
        }
      }
      
      // Refetch status to ensure UI is in sync
      setTimeout(async () => {
        try {
          const res = await fetch(`/api/users/profile?wallet=${address}&t=${Date.now()}`, {
            cache: 'no-store',
          });
          if (res.ok) {
            const userData = await res.json();
            // Check both followingList (new) and following (old) for backward compatibility
            const following = Array.isArray(userData.followingList) 
              ? userData.followingList 
              : Array.isArray(userData.following) 
              ? userData.following 
              : [];
            const isCurrentlyFollowing = following.some(
              (addr: string) => addr.toLowerCase() === targetWallet.toLowerCase()
            );
            setIsFollowing(isCurrentlyFollowing);
          } else if (res.status === 404) {
            // User doesn't exist yet, so not following
            setIsFollowing(false);
          }
        } catch (err) {
          console.error("Failed to refetch follow status:", err);
        }
      }, 500);
      
    } catch (error: any) {
      console.error("Follow error:", error);
      toast.error(error.message || "Action failed");
    } finally {
      setLoading(false);
    }
  };
  
  if (isOwnProfile) {
    return null;
  }
  
  if (checkingStatus) {
    return (
      <button 
        disabled
        className="px-4 py-2 bg-slate-100 text-slate-400 rounded-lg font-semibold text-sm cursor-not-allowed"
      >
        <span className="inline-block w-12">...</span>
      </button>
    );
  }
  
  if (isFollowing) {
    return (
      <button
        onClick={handleFollow}
        disabled={loading}
        className="group px-4 py-2 bg-slate-100 text-slate-700 rounded-lg font-semibold hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-all shadow-sm flex items-center gap-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed border border-slate-200"
      >
        <UserCheck className="w-4 h-4 group-hover:hidden" />
        <X className="w-4 h-4 hidden group-hover:block" />
        <span className="group-hover:hidden">Following</span>
        <span className="hidden group-hover:block">Unfollow</span>
      </button>
    );
  }
  
  return (
    <button
      onClick={handleFollow}
      disabled={loading || !isConnected}
      className="px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg font-semibold hover:shadow-md hover:scale-[1.02] transition-all flex items-center gap-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 whitespace-nowrap"
    >
      <UserPlus className="w-4 h-4" />
      {loading ? "..." : "Follow"}
    </button>
  );
}