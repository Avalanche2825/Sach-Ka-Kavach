import React from "react";
import { WifiOff, RotateCw, BookOpen } from "lucide-react";

interface OfflineBannerProps {
  onRetry: () => void;
  onViewCached: () => void;
}

export default function OfflineBanner({ onRetry, onViewCached }: OfflineBannerProps) {
  return (
    <div className="bg-red-500/10 border border-red-500/25 rounded-xl p-4 text-white flex flex-col sm:flex-row items-center justify-between gap-4 select-none font-mono">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-red-950 rounded-lg text-red-400">
          <WifiOff className="w-5 h-5 animate-pulse" />
        </div>
        <div>
          <h4 className="text-xs font-bold text-red-400 uppercase tracking-widest">Synchronization Interrupted</h4>
          <p className="text-[10px] text-slate-400 mt-0.5">Unable to synchronize with security services.</p>
        </div>
      </div>
      
      <div className="flex items-center gap-2 shrink-0">
        <button
          onClick={onRetry}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 border border-slate-800 hover:bg-slate-850 text-xs font-bold rounded-lg cursor-pointer transition-colors text-slate-200"
        >
          <RotateCw className="w-3 h-3" />
          <span>Retry Sync</span>
        </button>
        
        <button
          onClick={onViewCached}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-red-900 hover:bg-red-800 border border-red-500/20 text-xs font-bold rounded-lg cursor-pointer transition-colors text-white"
        >
          <BookOpen className="w-3 h-3" />
          <span>View Cached Data</span>
        </button>
      </div>
    </div>
  );
}
