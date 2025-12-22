"use client";

import { useState } from "react";
import { tokenList, Token } from "@/utils/tokens";
import Image from "next/image";

interface TokenSelectorProps {
  selected: Token | null;
  onSelect: (token: Token) => void;
}

export default function TokenSelector({ selected, onSelect }: TokenSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleSelect = (token: Token) => {
    onSelect(token);
    setIsOpen(false);
  };

  return (
    <div className="relative min-w-[120px]">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between gap-2 bg-white border border-gray-200 hover:border-purple-400 px-3 py-2 rounded-xl shadow-sm transition-all"
      >
        {/* ✅ FIXED: Added the actual button content */}
        {selected ? (
          <>
            <div className="flex items-center gap-2">
              {selected.logoURI && (
                <Image 
                  src={selected.logoURI} 
                  alt={selected.symbol}
                  width={24}
                  height={24}
                  className="rounded-full"
                  onError={(e) => {
                    // Fallback if image fails to load
                    e.currentTarget.style.display = 'none';
                  }}
                />
              )}
              <span className="font-semibold text-gray-800">{selected.symbol}</span>
            </div>
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              fill="none" 
              viewBox="0 0 24 24" 
              strokeWidth={2} 
              stroke="currentColor" 
              className="w-4 h-4 text-gray-400"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
            </svg>
          </>
        ) : (
          <>
            <span className="text-gray-400">Select Token</span>
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              fill="none" 
              viewBox="0 0 24 24" 
              strokeWidth={2} 
              stroke="currentColor" 
              className="w-4 h-4 text-gray-400"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
            </svg>
          </>
        )}
      </button>

      {isOpen && (
        <>
          <div 
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)} 
          />
          <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-100 rounded-xl shadow-xl z-50 overflow-hidden">
            <div className="max-h-60 overflow-y-auto">
              {tokenList.map((token) => (
                <button
                  key={token.address}
                  onClick={() => handleSelect(token)}
                  className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-purple-50 transition-colors text-left ${
                    selected?.address === token.address ? "bg-purple-50 text-purple-700" : "text-gray-700"
                  }`}
                >
                  {token.logoURI && (
                    <Image 
                      src={token.logoURI} 
                      alt={token.symbol}
                      width={20}
                      height={20}
                      className="rounded-full"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                  )}
                  <div className="flex flex-col">
                    <span className="font-medium">{token.symbol}</span>
                    <span className="text-xs text-gray-400">
                      {token.address.slice(0, 6)}...{token.address.slice(-4)}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}