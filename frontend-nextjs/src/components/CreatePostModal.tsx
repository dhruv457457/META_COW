"use client";

import { useState } from "react";
import { useWallet } from "@/context/WalletContext";
import { toast } from "react-hot-toast";
import { formatUnits } from "viem";
import { tokenList } from "@/utils/tokens";
import type { EnvioSwapEvent } from "@/utils/envioClient";

interface CreatePostModalProps {
  swap: EnvioSwapEvent | null;
  userProfile: {
    username: string;
    avatar: string;
  } | null;
  onClose: () => void;
  onSuccess: () => void;
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

export default function CreatePostModal({ 
  swap, 
  userProfile, 
  onClose, 
  onSuccess 
}: CreatePostModalProps) {
  const { address } = useWallet();
  const [caption, setCaption] = useState("");
  const [visibility, setVisibility] = useState<"public" | "followers">("public");
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  if (!swap || !userProfile) return null;
  
  const inputSymbol = getSymbol(swap.inputToken);
  const outputSymbol = getSymbol(swap.outputToken);
  const inputAmount = formatAmount(swap.inputAmount);
  const outputAmount = formatAmount(swap.outputAmount);
  
  const handleSubmit = async () => {
    if (!address) {
      toast.error("Please connect your wallet");
      return;
    }
    
    if (!caption.trim()) {
      toast.error("Please write a caption");
      return;
    }
    
    setIsSubmitting(true);
    try {
      const response = await fetch("/api/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userWallet: address,
          username: userProfile.username,
          avatar: userProfile.avatar,
          caption: caption.trim(),
          swapData: {
            inputToken: swap.inputToken,
            outputToken: swap.outputToken,
            inputAmount: swap.inputAmount,
            outputAmount: swap.outputAmount,
            pairAddress: swap.pairAddress,
            txHash: swap.txHash,
            timestamp: swap.timestamp,
          },
          visibility,
        }),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to create post");
      }
      
      toast.success("Post created! 🎉");
      onSuccess();
      onClose();
      
    } catch (error: any) {
      console.error("Create post error:", error);
      toast.error(error.message || "Failed to create post");
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <div 
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-3xl max-w-lg w-full shadow-2xl max-h-[90vh] overflow-y-auto animate-in slide-in-from-bottom duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-100 p-6 flex items-center justify-between rounded-t-3xl">
          <h2 className="text-2xl font-bold text-gray-800">Share Your Trade</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl transition"
          >
            ✕
          </button>
        </div>
        
        {/* Content */}
        <div className="p-6 space-y-6">
          {/* User Info */}
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 overflow-hidden">
              <img 
                src={userProfile.avatar}
                alt={userProfile.username}
                className="w-full h-full object-cover"
              />
            </div>
            <div>
              <div className="font-bold text-gray-800">{userProfile.username}</div>
              <select
                value={visibility}
                onChange={(e) => setVisibility(e.target.value as "public" | "followers")}
                className="text-sm text-gray-600 bg-transparent border-none outline-none cursor-pointer"
              >
                <option value="public">🌍 Public</option>
                <option value="followers">👥 Followers only</option>
              </select>
            </div>
          </div>
          
          {/* Caption Input */}
          <div>
            <textarea
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="Share your trading strategy, thoughts, or insights..."
              maxLength={500}
              rows={4}
              className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-none transition-all resize-none text-base"
              autoFocus
            />
            <div className="mt-2 text-right text-sm text-gray-500">
              {caption.length}/500
            </div>
          </div>
          
          {/* Swap Preview */}
          <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-4 border border-purple-100">
            <div className="text-sm font-medium text-gray-600 mb-3">Trade Details</div>
            
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="text-xs text-gray-600 mb-1">Sold</div>
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
                <div className="text-xs text-gray-600 mb-1">Bought</div>
                <div className="font-bold text-lg text-gray-900">
                  {outputAmount} <span className="text-green-600">{outputSymbol}</span>
                </div>
              </div>
            </div>
          </div>
          
          {/* Tips */}
          <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
            <div className="text-sm font-medium text-blue-900 mb-2">💡 Tips for a great post:</div>
            <ul className="text-sm text-blue-800 space-y-1 list-disc pl-5">
              <li>Share your reasoning behind the trade</li>
              <li>Mention any technical analysis you used</li>
              <li>Be helpful to followers who might copy</li>
            </ul>
          </div>
        </div>
        
        {/* Footer */}
        <div className="sticky bottom-0 bg-white border-t border-gray-100 p-6 rounded-b-3xl">
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-6 py-3 border-2 border-gray-200 text-gray-700 rounded-xl font-bold hover:bg-gray-50 transition"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={isSubmitting || !caption.trim()}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-bold hover:shadow-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? "Posting..." : "Share Trade"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}