import React from "react";

interface StatCardProps {
  title: string;
  value: string | number;
  subtext?: string;
  icon?: React.ReactNode;
  variant?: "default" | "warning" | "danger" | "success";
}

export default function StatCard({ title, value, subtext, icon, variant = "default" }: StatCardProps) {
  const getBorderColor = () => {
    switch (variant) {
      case "warning": return "border-l-4 border-l-amber-500";
      case "danger": return "border-l-4 border-l-red-500";
      case "success": return "border-l-4 border-l-emerald-500";
      default: return "border-l-4 border-l-blue-500";
    }
  };

  return (
    <div className={`bg-white border border-slate-200 rounded-2xl p-5 shadow-sm ${getBorderColor()} transition duration-200 hover:-translate-y-0.5 hover:shadow-lg`}>
      <div className="flex justify-between items-start">
        <div className="space-y-1.5">
          <p className="text-[11px] uppercase font-bold tracking-wide text-slate-500">{title}</p>
          <h4 className="text-2xl font-extrabold text-slate-900 leading-none">{value}</h4>
          {subtext && <p className="text-[11px] text-slate-500 font-medium leading-normal pt-0.5">{subtext}</p>}
        </div>
        {icon && <div className="p-2.5 bg-blue-50 rounded-xl border border-blue-100 shrink-0 text-blue-700">{icon}</div>}
      </div>
    </div>
  );
}
