import React from "react";
import { ShieldAlert, CheckCircle, Smartphone, HelpCircle, UserX } from "lucide-react";

interface IncidentRecommendationCardProps {
  deviations: string[];
  currentDecision: string;
  onSelectAction?: (action: string) => void;
}

export default function IncidentRecommendationCard({ deviations, currentDecision, onSelectAction }: IncidentRecommendationCardProps) {
  const actions = [
    { name: "Allow Session", value: "ALLOW", icon: CheckCircle, style: "hover:bg-emerald-50 hover:text-emerald-600 hover:border-emerald-200" },
    { name: "Trigger Step-Up OTP", value: "OTP_REQUIRED", icon: Smartphone, style: "hover:bg-amber-50 hover:text-amber-600 hover:border-amber-200" },
    { name: "Hold Transaction", value: "HOLD", icon: HelpCircle, style: "hover:bg-orange-50 hover:text-orange-600 hover:border-orange-200" },
    { name: "Escalate to Fraud Team", value: "ESCALATED", icon: ShieldAlert, style: "hover:bg-red-50 hover:text-red-650 hover:border-red-200" },
    { name: "Block Session", value: "BLOCK", icon: UserX, style: "hover:bg-red-100 hover:text-red-700 hover:border-red-200" }
  ];

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4 text-slate-800 font-mono select-none">
      <div className="border-b border-slate-200 pb-3 flex items-center gap-2">
        <ShieldAlert className="w-4 h-4 text-orange-500 animate-pulse" />
        <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest">AI Decision Recommendation</h4>
      </div>

      <div className="space-y-2">
        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Deviation Triggers Detected:</p>
        {deviations && deviations.length > 0 ? (
          <ul className="list-disc list-inside space-y-1 bg-slate-50 rounded-lg p-3 border border-slate-200">
            {deviations.map((dev, idx) => (
              <li key={idx} className="text-[10px] text-red-600 leading-relaxed font-mono">{dev}</li>
            ))}
          </ul>
        ) : (
          <p className="text-[10px] text-emerald-600 italic bg-slate-50 rounded-lg p-3 border border-slate-200">
            No behavioral deviation markers detected.
          </p>
        )}
      </div>

      <div className="space-y-2 pt-1.5">
        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Suggested Analyst Actions:</p>
        <div className="grid grid-cols-1 gap-2">
          {actions.map((act) => {
            const Icon = act.icon;
            const isMatch = currentDecision === act.value;

            return (
              <button
                key={act.value}
                onClick={() => onSelectAction && onSelectAction(act.value)}
                className={`w-full flex items-center gap-2.5 px-3 py-2 text-[10px] font-bold text-left rounded-lg border transition-all cursor-pointer ${
                  isMatch 
                    ? "bg-orange-50 text-orange-600 border-orange-200 shadow-sm"
                    : "bg-slate-50 text-slate-600 border-slate-200 " + act.style
                }`}
              >
                <Icon className="w-3.5 h-3.5 shrink-0" />
                <span>{act.name}</span>
                {isMatch && <span className="ml-auto text-[8px] bg-orange-500 text-white px-1.5 py-0.5 rounded uppercase font-extrabold tracking-widest font-mono">REC</span>}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
