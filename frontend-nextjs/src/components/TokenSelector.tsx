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
        {/* ... (Button content stays same) ... */}
      </button>

      {isOpen && (
        <>
          <div 
            className="fixed inset-0 z-40" // Increased from 10
            onClick={() => setIsOpen(false)} 
          />
          <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-100 rounded-xl shadow-xl z-50 overflow-hidden"> 
            {/* Increased z-20 to z-50 above */}
            <div className="max-h-60 overflow-y-auto">
              {tokenList.map((token) => (
                <button
                  key={token.address}
                  onClick={() => handleSelect(token)}
                  className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-purple-50 transition-colors text-left ${
                    selected?.address === token.address ? "bg-purple-50 text-purple-700" : "text-gray-700"
                  }`}
                >
                  <span className="font-medium">{token.symbol}</span>
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}