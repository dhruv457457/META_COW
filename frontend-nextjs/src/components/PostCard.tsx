"use client";

import { useState } from "react";
import { useWallet } from "@/context/WalletContext";
import { toast } from "react-hot-toast";
import { formatUnits } from "viem";
import { tokenList } from "@/utils/tokens";
import CopyTradeButton from "./CopyTradeButton";
import FollowButton from "./FollowButton";
import Link from "next/link";

interface SwapData {
  inputToken: string;
  outputToken: string;
  inputAmount: string;
  outputAmount: string;
  pairAddress: string;
  txHash: string;
  timestamp: number;
}

interface Post {
  _id: string;
  userWallet: string;
  username: string;
  avatar: string;
  caption: string;
  swapData: SwapData;
  likes: string[];
  comments: Array<{
    userWallet: string;
    username: string;
    avatar: string;
    text: string;
    createdAt: Date;
  }>;
  visibility: string;
  createdAt: Date;
}

interface PostCardProps {
  post: Post;
  onDelete?: (postId: string) => void;
  onLike?: (postId: string) => void;
}

const getSymbol = (addr: string): string => {
  const t = tokenList.find(x => x.address.toLowerCase() === addr.toLowerCase());
  return t ? t.symbol : `${addr.slice(0, 6)}...`;
};

const formatAmount = (amount: string): string => {
  try {
    const parsed = parseFloat(formatUnits(BigInt(amount), 18));
    return isNaN(parsed) ? "0.00" : parsed.toFixed(4);
  } catch {
    return "0.00";
  }
};

const formatTimeAgo = (timestamp: number): string => {
  const seconds = Math.floor(Date.now() / 1000 - timestamp);
  if (seconds < 60) return `${seconds}s ago`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
};

export default function PostCard({ post, onDelete, onLike }: PostCardProps) {
  const { address } = useWallet();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isLiking, setIsLiking] = useState(false);
  
  const isOwner = address && post.userWallet.toLowerCase() === address.toLowerCase();
  const isLiked = address && post.likes.includes(address.toLowerCase());
  
  const inputSymbol = getSymbol(post.swapData.inputToken);
  const outputSymbol = getSymbol(post.swapData.outputToken);
  const inputAmount = formatAmount(post.swapData.inputAmount);
  const outputAmount = formatAmount(post.swapData.outputAmount);
  
  const handleLike = async () => {
    if (!address) {
      toast.error("Please connect your wallet");
      return;
    }
    
    setIsLiking(true);
    try {
      const response = await fetch("/api/posts/like", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          postId: post._id,
          userWallet: address,
          action: isLiked ? "unlike" : "like",
        }),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to like post");
      }
      
      onLike?.(post._id);
      
    } catch (error: any) {
      console.error("Like error:", error);
      toast.error(error.message || "Failed to like post");
    } finally {
      setIsLiking(false);
    }
  };
  
  const handleDelete = async () => {
    if (!address) return;
    
    setIsDeleting(true);
    try {
      const response = await fetch(`/api/posts?postId=${post._id}&userWallet=${address}`, {
        method: "DELETE",
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to delete post");
      }
      
      toast.success("Post deleted");
      onDelete?.(post._id);
      
    } catch (error: any) {
      console.error("Delete error:", error);
      toast.error(error.message || "Failed to delete post");
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };
  
  return (
    <div className="bg-white rounded-2xl shadow-sm hover:shadow-md transition-all duration-200 border border-gray-100 overflow-hidden">
      {/* Header */}
      <div className="p-4 flex items-center justify-between border-b border-gray-50">
        <Link 
          href={`/profile/${post.userWallet}`}
          className="flex items-center gap-3 hover:opacity-80 transition flex-1 min-w-0"
        >
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 overflow-hidden flex-shrink-0">
            <img 
              src={post.avatar}
              alt={post.username}
              className="w-full h-full object-cover"
            />
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-bold text-gray-800 truncate">{post.username}</div>
            <div className="text-sm text-gray-500">
              {formatTimeAgo(post.swapData.timestamp)}
            </div>
          </div>
        </Link>
        
        <div className="flex items-center gap-2">
          {/* Follow Button - Visible for non-owners */}
          {!isOwner && address && (
            <FollowButton
              targetWallet={post.userWallet}
              targetUsername={post.username}
            />
          )}
          
          {/* Delete Button - Only for owners */}
          {isOwner && (
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="p-2 text-gray-400 hover:text-red-500 transition rounded-lg hover:bg-red-50"
              title="Delete post"
            >
              🗑️
            </button>
          )}
        </div>
      </div>
      
      {/* Caption */}
      <div className="px-4 py-3">
        <p className="text-gray-700 text-base leading-relaxed">{post.caption}</p>
      </div>
      
      {/* Swap Data Card */}
      <div className="mx-4 mb-4 bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-4 border border-purple-100">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <div className="text-sm text-gray-600 mb-1">Sold</div>
            <div className="font-bold text-lg text-gray-900">
              {inputAmount} <span className="text-purple-600">{inputSymbol}</span>
            </div>
          </div>
          
          <div className="px-3">
            <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-sm">
              <span className="text-xl">→</span>
            </div>
          </div>
          
          <div className="flex-1 text-right">
            <div className="text-sm text-gray-600 mb-1">Bought</div>
            <div className="font-bold text-lg text-gray-900">
              {outputAmount} <span className="text-green-600">{outputSymbol}</span>
            </div>
          </div>
        </div>
        
        <a 
          href={`https://testnet.bscscan.com/tx/${post.swapData.txHash}`}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-3 text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
        >
          View Transaction ↗
        </a>
      </div>
      
      {/* Actions */}
      <div className="px-4 pb-4 flex items-center gap-3 border-t border-gray-50 pt-3">
        <button
          onClick={handleLike}
          disabled={isLiking || !address}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition ${
            isLiked
              ? "bg-red-50 text-red-600 hover:bg-red-100"
              : "bg-gray-50 text-gray-700 hover:bg-gray-100"
          } disabled:opacity-50`}
        >
          <span className="text-lg">{isLiked ? "❤️" : "🤍"}</span>
          <span className="text-sm font-bold">{post.likes.length}</span>
        </button>
        
        {!isOwner && address && (
          <>
            <button className="flex-1 px-4 py-2 bg-gray-50 text-gray-700 rounded-lg font-medium hover:bg-gray-100 transition text-sm">
              📋 Manual Copy
            </button>
            
            <CopyTradeButton
              traderAddress={post.userWallet}
              traderUsername={post.username}
              inputToken={post.swapData.inputToken}
              outputToken={post.swapData.outputToken}
              inputAmount={post.swapData.inputAmount}
            />
          </>
        )}
      </div>
      
      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl">
            <h3 className="text-xl font-bold text-gray-800 mb-2">Delete Post?</h3>
            <p className="text-gray-600 mb-6">This action cannot be undone.</p>
            
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 px-4 py-3 border-2 border-gray-200 text-gray-700 rounded-xl font-bold hover:bg-gray-50 transition"
                disabled={isDeleting}
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="flex-1 px-4 py-3 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 transition disabled:opacity-50"
              >
                {isDeleting ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}