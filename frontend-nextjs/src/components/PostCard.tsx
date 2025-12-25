"use client";

import { useState } from "react";
import { useWallet } from "@/context/WalletContext";
import { toast } from "react-hot-toast";
import { formatUnits } from "viem";
import { tokenList } from "@/utils/tokens";
import { Heart, MessageCircle, Trash2, ExternalLink, ArrowRight } from "lucide-react";
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
    <div className="bg-white rounded-2xl shadow-sm hover:shadow-md transition-all duration-200 border border-slate-200 overflow-hidden">
      {/* Header */}
      <div className="p-5 flex items-center justify-between border-b border-slate-100">
        <Link 
          href={`/profile/${post.userWallet}`}
          className="flex items-center gap-3 hover:opacity-80 transition flex-1 min-w-0"
        >
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 p-0.5 flex-shrink-0">
            <img 
              src={post.avatar}
              alt={post.username}
              className="w-full h-full rounded-full object-cover bg-white"
            />
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-semibold text-slate-900 truncate text-base">{post.username}</div>
            <div className="text-sm text-slate-500">
              {formatTimeAgo(post.swapData.timestamp)}
            </div>
          </div>
        </Link>
        
        <div className="flex items-center gap-2">
          {!isOwner && address && (
            <FollowButton
              targetWallet={post.userWallet}
              targetUsername={post.username}
            />
          )}
          
          {isOwner && (
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="p-2.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
              title="Delete post"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
      
      {/* Caption */}
      <div className="px-5 py-4">
        <p className="text-slate-900 text-base leading-relaxed">{post.caption}</p>
      </div>
      
      {/* Swap Data Card */}
      <div className="mx-5 mb-5 bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-5 border-2 border-purple-100">
        <div className="flex items-center justify-between mb-4">
          <div className="flex-1">
            <div className="text-xs text-slate-600 mb-1 font-medium">Sold</div>
            <div className="font-bold text-lg text-slate-900">{inputAmount}</div>
            <div className="text-sm font-semibold text-purple-600 mt-0.5">{inputSymbol}</div>
          </div>
          
          <div className="px-3">
            <div className="w-11 h-11 rounded-full bg-white flex items-center justify-center shadow-sm">
              <ArrowRight className="w-5 h-5 text-purple-600" />
            </div>
          </div>
          
          <div className="flex-1 text-right">
            <div className="text-xs text-slate-600 mb-1 font-medium">Bought</div>
            <div className="font-bold text-lg text-slate-900">{outputAmount}</div>
            <div className="text-sm font-semibold text-green-600 mt-0.5">{outputSymbol}</div>
          </div>
        </div>
        
        <a 
          href={`https://testnet.bscscan.com/tx/${post.swapData.txHash}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-1.5 text-xs text-purple-600 hover:text-purple-700 font-semibold transition-colors"
        >
          <ExternalLink className="w-3.5 h-3.5" />
          View Transaction
        </a>
      </div>
      
      {/* Actions */}
      <div className="px-5 pb-5 flex items-center gap-3 border-t border-slate-100 pt-4">
        <button
          onClick={handleLike}
          disabled={isLiking || !address}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold transition-all ${
            isLiked
              ? "bg-red-50 text-red-600 hover:bg-red-100"
              : "bg-slate-50 text-slate-700 hover:bg-slate-100"
          } disabled:opacity-50`}
        >
          <Heart className={`w-4 h-4 ${isLiked ? 'fill-current' : ''}`} />
          <span className="text-sm">{post.likes.length}</span>
        </button>
        
        {!isOwner && address && (
          <>
            <Link
              href={`/swap?from=${post.swapData.inputToken}&to=${post.swapData.outputToken}`}
              className="flex-1 px-4 py-2.5 bg-slate-50 text-slate-700 rounded-xl font-semibold hover:bg-slate-100 transition-all text-sm text-center"
            >
              Manual Copy
            </Link>
            
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
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl animate-in slide-in-from-bottom duration-300">
            <h3 className="text-2xl font-bold text-slate-900 mb-2">Delete Post?</h3>
            <p className="text-slate-600 mb-6">This action cannot be undone.</p>
            
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 px-4 py-3 border-2 border-slate-200 text-slate-700 rounded-xl font-semibold hover:bg-slate-50 transition-all"
                disabled={isDeleting}
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="flex-1 px-4 py-3 bg-red-600 text-white rounded-xl font-semibold hover:bg-red-700 transition-all disabled:opacity-50"
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