import React from "react";

export default function SkeletonCard() {
  return (
    <div className="bg-[#0d1527] border border-slate-800 rounded-xl p-5 shadow-lg space-y-4 animate-pulse">
      <div className="flex justify-between items-center">
        <div className="h-2.5 bg-slate-800 rounded w-1/3"></div>
        <div className="h-6 w-6 bg-slate-800 rounded-lg"></div>
      </div>
      <div className="h-6 bg-slate-800 rounded w-1/2"></div>
      <div className="space-y-1.5 pt-1">
        <div className="h-2 bg-slate-800 rounded w-5/6"></div>
        <div className="h-2 bg-slate-800 rounded w-4/5"></div>
      </div>
    </div>
  );
}
