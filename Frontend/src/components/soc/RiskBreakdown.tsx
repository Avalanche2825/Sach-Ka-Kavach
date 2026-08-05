import React from "react";
import { ShieldCheck, ShieldAlert, Award } from "lucide-react";

interface Props {
  riskScore: number;
  behaviorScore?: number;
  deviceScore?: number;
  identityScore?: number;
  recoveryScore?: number;
  employeeScore?: number;
}

export default function RiskBreakdown({
  riskScore,
  behaviorScore = 14,
  deviceScore = 10,
  identityScore = 5,
  recoveryScore = 0,
  employeeScore = 0
}: Props) {
  const trustScore = Math.max(0, Math.min(100, 100 - riskScore));

  const bMax = 40;
  const dMax = 25;
  const idMax = 15;
  const recMax = 10;
  const empMax = 10;

  const modules = [
    { name: "Behavioral Isolation Forest (M1)", value: behaviorScore, max: bMax, weight: "40%", color: "#2563EB" },
    { name: "Device Fingerprint Random Forest (M2)", value: deviceScore, max: dMax, weight: "25%", color: "#D97706" },
    { name: "Swarm Identity Graph (M3)", value: identityScore, max: idMax, weight: "15%", color: "#7C3AED" },
    { name: "Account Recovery Shield (M4)", value: recoveryScore, max: recMax, weight: "10%", color: "#DC2626" },
    { name: "Employee Privileged Access (M5)", value: employeeScore, max: empMax, weight: "10%", color: "#16A34A" }
  ];

  const getStatusBadge = () => {
    if (trustScore >= 80) return { label: "ALLOW", color: "bg-emerald-100 text-emerald-800 border-emerald-300" };
    if (trustScore >= 60) return { label: "OTP_STEPUP", color: "bg-amber-100 text-amber-900 border-amber-300" };
    if (trustScore >= 40) return { label: "ALERT", color: "bg-orange-100 text-orange-900 border-orange-300" };
    if (trustScore >= 20) return { label: "HOLD", color: "bg-red-100 text-red-900 border-red-300" };
    return { label: "BLOCK", color: "bg-red-600 text-white border-red-700" };
  };

  const status = getStatusBadge();

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm text-slate-800 space-y-5 font-sans">
      
      {/* Top Score Banner */}
      <div className="flex justify-between items-center border-b border-slate-100 pb-4">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 block">
            Dynamic Unified Trust Score
          </span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-4xl font-extrabold text-slate-900 tracking-tight">{trustScore}</span>
            <span className="text-sm font-semibold text-slate-400">/ 100</span>
          </div>
        </div>

        <span className={`px-3.5 py-1.5 rounded-xl text-xs font-extrabold uppercase tracking-wider border shadow-xs ${status.color}`}>
          {status.label}
        </span>
      </div>

      {/* 5 Module Breakdown Bars */}
      <div className="space-y-3.5">
        <span className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
          5-Module Risk Index Breakdown
        </span>

        {modules.map((m, idx) => {
          const pct = Math.min(100, Math.round((m.value / m.max) * 100));
          return (
            <div key={idx} className="space-y-1.5">
              <div className="flex justify-between text-xs font-semibold text-slate-700">
                <span className="text-slate-800">{m.name}</span>
                <span className="font-mono text-slate-500 font-bold">{m.value} / {m.max} pts ({m.weight})</span>
              </div>
              <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
                <div
                  style={{ width: `${pct}%`, backgroundColor: m.color }}
                  className="h-full transition-all duration-300 rounded-full"
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Unified Weight Formula Callout */}
      <div className="bg-blue-50/60 border border-blue-200 p-4 rounded-xl space-y-1.5 text-xs text-slate-700">
        <div className="flex items-center gap-1.5 text-blue-900 font-bold uppercase tracking-wide text-2xs">
          <Award className="w-3.5 h-3.5 text-blue-600" /> Unified Weight Formula Calculation
        </div>
        <div className="font-mono text-slate-800 font-medium leading-relaxed">
          Risk = ({behaviorScore}×0.40) + ({deviceScore}×0.25) + ({identityScore}×0.15) + ({recoveryScore}×0.10) + ({employeeScore}×0.10) = <span className="font-bold text-slate-900">{riskScore} pts</span>
        </div>
        <div className="font-mono text-emerald-700 font-extrabold text-xs">
          Dynamic Trust = 100 - {riskScore} = {trustScore} / 100
        </div>
      </div>

    </div>
  );
}
