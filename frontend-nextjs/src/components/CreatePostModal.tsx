"use client";

import { useState } from "react";
import { useWallet } from "@/context/WalletContext";
import { toast } from "react-hot-toast";
import { formatUnits } from "viem";
import { tokenList } from "@/utils/tokens";
import { Globe, Users, ArrowRight, Lightbulb, X } from "lucide-react";
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
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-3xl max-w-lg w-full shadow-2xl max-h-[90vh] overflow-hidden animate-in slide-in-from-bottom duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-slate-200 p-6 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-slate-900">Share Your Trade</h2>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        {/* Content */}
        <div className="p-6 space-y-6 overflow-y-auto max-h-[calc(90vh-160px)]">
          {/* User Info */}
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 p-0.5 flex-shrink-0">
              <img 
                src={userProfile.avatar}
                alt={userProfile.username}
                className="w-full h-full rounded-full object-cover bg-white"
              />
            </div>
            <div className="flex-1">
              <div className="font-bold text-slate-900 text-lg">{userProfile.username}</div>
              <div className="relative">
                <select
                  value={visibility}
                  onChange={(e) => setVisibility(e.target.value as "public" | "followers")}
                  className="text-sm text-slate-600 bg-transparent border-none outline-none cursor-pointer pr-6 appearance-none font-medium"
                >
                  <option value="public">🌍 Public</option>
                  <option value="followers">👥 Followers only</option>
                </select>
              </div>
            </div>
          </div>
          
          {/* Caption Input */}
          <div>
            <label className="block text-sm font-semibold text-slate-900 mb-2">
              Caption
            </label>
            <textarea
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="Share your trading strategy, thoughts, or insights..."
              maxLength={500}
              rows={4}
              className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 focus:border-purple-500 focus:ring-4 focus:ring-purple-100 outline-none transition-all resize-none text-base text-slate-900 placeholder:text-slate-400"
              autoFocus
            />
            <div className="mt-2 text-right text-sm text-slate-500">
              {caption.length}/500
            </div>
          </div>
          
          {/* Swap Preview */}
          <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-5 border-2 border-purple-100">
            <div className="text-sm font-semibold text-slate-700 mb-4">Trade Details</div>
            
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="text-xs text-slate-600 mb-1 font-medium">Sold</div>
                <div className="font-bold text-xl text-slate-900">
                  {inputAmount}
                </div>
                <div className="text-sm font-semibold text-purple-600 mt-1">
                  {inputSymbol}
                </div>
              </div>
              
              <div className="px-4">
                <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center shadow-sm">
                  <ArrowRight className="w-6 h-6 text-purple-600" />
                </div>
              </div>
              
              <div className="flex-1 text-right">
                <div className="text-xs text-slate-600 mb-1 font-medium">Bought</div>
                <div className="font-bold text-xl text-slate-900">
                  {outputAmount}
                </div>
                <div className="text-sm font-semibold text-green-600 mt-1">
                  {outputSymbol}
                </div>
              </div>
            </div>
            
            <a 
              href={`https://testnet.bscscan.com/tx/${swap.txHash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 text-xs text-purple-600 hover:text-purple-700 font-semibold flex items-center gap-1 justify-center"
            >
              View Transaction
              <span>↗</span>
            </a>
          </div>
          
          {/* Tips */}
          <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
            <div className="flex items-start gap-3">
              <div className="mt-0.5">
                <Lightbulb className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <div className="text-sm font-semibold text-blue-900 mb-2">Tips for a great post:</div>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• Share your reasoning behind the trade</li>
                  <li>• Mention any technical analysis you used</li>
                  <li>• Be helpful to followers who might copy</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
        
        {/* Footer */}
        <div className="sticky bottom-0 bg-white border-t border-slate-200 p-6">
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-6 py-3 border-2 border-slate-200 text-slate-700 rounded-xl font-semibold hover:bg-slate-50 transition-all"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={isSubmitting || !caption.trim()}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-semibold hover:shadow-lg hover:scale-[1.02] transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
            >
              {isSubmitting ? "Posting..." : "Share Trade"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}