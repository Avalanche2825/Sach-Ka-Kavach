import React from "react";

interface EmptyStateProps {
  title: string;
  message: string;
  icon?: React.ReactNode;
}

export default function EmptyState({ title, message, icon }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-10 px-4 text-center bg-[#0d1527] border border-slate-800 rounded-xl max-w-md mx-auto select-none">
      {icon && <div className="p-3 bg-slate-900 rounded-full border border-slate-800 text-slate-400 mb-3">{icon}</div>}
      <h4 className="text-sm font-bold text-slate-200 font-mono mb-1">{title}</h4>
      <p className="text-xs text-slate-500 font-sans max-w-xs leading-relaxed">{message}</p>
    </div>
  );
}
