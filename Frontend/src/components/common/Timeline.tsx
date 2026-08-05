import React from "react";
import StatusBadge from "./StatusBadge.tsx";

interface TimelineEvent {
  _id?: string;
  timestamp: string;
  user: string;
  event: string;
  riskScore?: number;
  riskFactors?: string[];
  decision?: string;
}

interface TimelineProps {
  events: TimelineEvent[];
}

export default function Timeline({ events }: TimelineProps) {
  if (!events || events.length === 0) {
    return <p className="text-xs text-slate-500 italic p-4 text-center">No logs recorded on this workflow timeline.</p>;
  }

  return (
    <div className="relative border-l border-slate-200 ml-3 space-y-6 py-2 select-none">
      {events.map((ev, idx) => {
        const risk = ev.riskScore ?? 0;
        const isHigh = risk > 24;
        const isModerate = risk > 12 && risk <= 24;
        const isLowOrZero = risk <= 12;

        return (
          <div key={ev._id || idx} className="relative pl-6">
            {/* Node dot icon */}
            <div className={`absolute -left-[5px] top-1.5 w-2.5 h-2.5 rounded-full border border-white shadow-xs ${
              isHigh ? "bg-red-500" : isModerate ? "bg-amber-500" : "bg-emerald-500"
            }`}></div>
            
            <div className="space-y-1 font-mono">
              <div className="flex justify-between items-center flex-wrap gap-2">
                <span className="text-[10px] text-slate-400 font-bold">
                  {new Date(ev.timestamp).toLocaleString()}
                </span>
                {ev.decision && <StatusBadge status={ev.decision} />}
              </div>
              
              <p className="text-xs font-bold text-slate-900 font-sans">{ev.event}</p>
              <p className="text-[10px] text-slate-500">Initiator: {ev.user}</p>
              
              {ev.riskScore !== undefined && (
                <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                  <span className="text-[9px] text-slate-400 font-bold uppercase">Behavioral Risk:</span>
                  <span className={`text-[10px] font-bold font-mono px-1.5 py-0.5 rounded leading-none ${
                    isHigh 
                      ? "bg-red-50 text-red-700 border border-red-200" 
                      : isModerate
                      ? "bg-amber-50 text-amber-700 border border-amber-200"
                      : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                  }`}>
                    {ev.riskScore} / 40
                  </span>
                </div>
              )}

              {ev.riskFactors && ev.riskFactors.length > 0 && (
                <div className={`mt-1.5 rounded-lg p-2.5 border ${
                  isHigh ? "bg-red-50/50 border-red-200" : isModerate ? "bg-amber-50/50 border-amber-200" : "bg-slate-50 border-slate-200"
                }`}>
                  <p className={`text-[9px] font-extrabold uppercase tracking-wide mb-1 ${
                    isHigh ? "text-red-700" : isModerate ? "text-amber-700" : "text-slate-500"
                  }`}>
                    {isHigh ? "ESCALATED RISK FACTORS:" : isModerate ? "MODERATE RISK FACTORS:" : "LOGGED EVENT DETAILS:"}
                  </p>
                  <ul className="list-disc list-inside space-y-0.5">
                    {ev.riskFactors.map((f, fidx) => (
                      <li key={fidx} className={`text-[10px] font-bold ${
                        isHigh ? "text-red-600" : isModerate ? "text-amber-700" : "text-emerald-700"
                      }`}>
                        {f}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
