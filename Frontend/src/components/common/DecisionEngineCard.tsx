import React, { useEffect, useState } from "react";
import { getDecisionEngineState } from "../../api/decisionApi.ts";
import StatusBadge from "./StatusBadge.tsx";

interface DecisionState {
  behavior: { risk: number; status: string };
  transaction: { status: string };
  kyc: { status: string };
  recovery: { status: string };
  insider: { status: string };
  decision: string;
}

interface DecisionEngineCardProps {
  sessionId: string;
}

export default function DecisionEngineCard({ sessionId }: DecisionEngineCardProps) {
  const [data, setData] = useState<DecisionState | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!sessionId) return;
    setLoading(true);
    getDecisionEngineState(sessionId)
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [sessionId]);

  if (loading) {
    return (
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm animate-pulse space-y-3">
        <div className="h-4 bg-slate-200 rounded w-1/3"></div>
        <div className="h-8 bg-slate-200 rounded w-1/2"></div>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4 text-slate-800 font-mono select-none">
      <div className="border-b border-slate-200 pb-3 flex justify-between items-center">
        <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest">Decision Engine</h4>
        <StatusBadge status={data.decision} />
      </div>

      <div className="space-y-3 text-[11px]">
        {/* Module 1: Behavioral */}
        <div className="flex justify-between items-center bg-slate-50 p-2.5 rounded-lg border border-slate-200">
          <div>
            <p className="font-bold text-slate-800">Behavioral Intelligence</p>
            <p className="text-[9px] text-emerald-600 mt-0.5">✓ Active</p>
          </div>
          <div className="text-right">
            <span className="text-xs font-extrabold text-slate-900">{data.behavior.risk}</span>
            <span className="text-slate-400 text-[10px]"> / 40 Risk</span>
          </div>
        </div>

        {/* Module 2: Transaction */}
        <div className="flex justify-between items-center bg-slate-50/50 p-2.5 rounded-lg border border-slate-100 opacity-60">
          <div>
            <p className="font-bold text-slate-500">Transaction Intelligence</p>
            <p className="text-[9px] text-slate-400 mt-0.5">○ Not Yet Activated</p>
          </div>
          <span className="text-[10px] text-slate-400">Module 2</span>
        </div>

        {/* Module 3: KYC */}
        <div className="flex justify-between items-center bg-slate-50/50 p-2.5 rounded-lg border border-slate-100 opacity-60">
          <div>
            <p className="font-bold text-slate-500">KYC Intelligence</p>
            <p className="text-[9px] text-slate-400 mt-0.5">○ Not Yet Activated</p>
          </div>
          <span className="text-[10px] text-slate-400">Module 3</span>
        </div>

        {/* Module 4: Recovery */}
        <div className="flex justify-between items-center bg-slate-50/50 p-2.5 rounded-lg border border-slate-100 opacity-60">
          <div>
            <p className="font-bold text-slate-500">Recovery Intelligence</p>
            <p className="text-[9px] text-slate-400 mt-0.5">○ Not Yet Activated</p>
          </div>
          <span className="text-[10px] text-slate-400">Module 4</span>
        </div>

        {/* Module 5: Insider */}
        <div className="flex justify-between items-center bg-slate-50/50 p-2.5 rounded-lg border border-slate-100 opacity-60">
          <div>
            <p className="font-bold text-slate-500">Insider Threat</p>
            <p className="text-[9px] text-slate-400 mt-0.5">○ Not Yet Activated</p>
          </div>
          <span className="text-[10px] text-slate-400">Module 5</span>
        </div>
      </div>
    </div>
  );
}
