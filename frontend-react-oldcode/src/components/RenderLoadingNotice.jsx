import { useEffect, useState } from "react";

export default function RenderLoadingNotice({ show, delay = 8000 }) {
  const [showRenderMsg, setShowRenderMsg] = useState(false);

  useEffect(() => {
    let timer;
    if (show) {
      timer = setTimeout(() => setShowRenderMsg(true), delay);
    } else {
      setShowRenderMsg(false);
    }
    return () => clearTimeout(timer);
  }, [show, delay]);

  if (!show) return null;

  return (
    <div className="flex flex-col items-center justify-center gap-3 py-8">
      <div className="w-8 h-8 border-4 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
      <div className="text-base font-semibold text-gray-700">Loading, please wait...</div>
      {showRenderMsg && (
        <div className="mt-2 px-4 py-2 bg-yellow-100 text-yellow-800 rounded text-center text-sm max-w-xs">
          Our backend is hosted on Render's free tier and may take up to 50 seconds to start. <br />Please be patient!
        </div>
      )}
    </div>
  );
} 