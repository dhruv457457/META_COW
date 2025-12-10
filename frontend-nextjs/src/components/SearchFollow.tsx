"use client";
import { useState } from "react";
import Image from "next/image";

// Placeholder data until we connect the Backend API
export default function SearchFollow() {
  const [query, setQuery] = useState("");
  
  // Mock function
  const handleSearch = () => {
    alert("Backend API is coming in Module 6! UI is ready.");
  };

  return (
    <div className="w-full max-w-md mx-auto p-6 bg-white/80 border border-purple-100 rounded-2xl shadow-lg backdrop-blur-sm">
      <h3 className="text-xl font-bold text-purple-800 mb-4 text-left">Discover & Follow Traders</h3>
      <div className="flex items-center gap-2 mb-4">
        <div className="relative w-full">
          <input
            type="text"
            className="w-full pl-4 pr-4 py-3 text-base border-2 border-purple-200 rounded-xl focus:ring-2 focus:ring-purple-400 outline-none bg-white shadow-inner text-gray-800"
            placeholder="Search by username..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <button
          onClick={handleSearch}
          className="px-5 py-3 font-semibold bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-xl hover:from-purple-600 hover:to-blue-600 transition-all duration-300 transform hover:scale-105"
        >
          Search
        </button>
      </div>
      
      <p className="text-center text-sm text-gray-500 mt-4">
        Search functionality will be connected after API migration.
      </p>
    </div>
  );
}