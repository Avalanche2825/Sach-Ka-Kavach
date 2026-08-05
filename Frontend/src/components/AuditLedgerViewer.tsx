import React, { useState } from "react";
import { AuditLog } from "../types.js";
import { FileText, Search, Shield, Filter, CircleAlert } from "lucide-react";
import { motion } from "motion/react";
import MethodologyBanner from "./layout/MethodologyBanner.tsx";


interface AuditLedgerViewerProps {
  auditLogs: AuditLog[];
}

export default function AuditLedgerViewer({ auditLogs }: AuditLedgerViewerProps) {
  const [search, setSearch] = useState("");
  const [minRisk, setMinRisk] = useState(0);
  const [filterDecision, setFilterDecision] = useState("");

  const filteredLogs = auditLogs.filter(log => {
    const matchesSearch = log.event.toLowerCase().includes(search.toLowerCase()) ||
                          log.user.toLowerCase().includes(search.toLowerCase()) ||
                          log.decision.toLowerCase().includes(search.toLowerCase());
    const matchesRisk = log.riskScore >= minRisk;
    const matchesDecision = filterDecision === "" || log.decision === filterDecision;

    return matchesSearch && matchesRisk && matchesDecision;
  });

  const getRiskBadgeColor = (score: number) => {
    if (score <= 30) return "bg-emerald-50 text-emerald-700 border-emerald-150";
    if (score <= 60) return "bg-amber-50 text-amber-700 border-amber-150";
    if (score <= 80) return "bg-orange-50 text-orange-700 border-orange-150";
    return "bg-red-50 text-red-700 border-red-150";
  };

  return (
    <div className="space-y-6">
      <MethodologyBanner pageId="audit" />
      <div id="audit-logs-module" className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-4">

      
      {/* Filters HUD Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-4 border-b border-slate-100 shrink-0 select-none">
        <div>
          <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5 animate-pulse">
            <FileText className="w-4 h-4 text-blue-600 font-bold" />
            Continuous Audit Security Ledger
          </h3>
          <p className="text-xs text-slate-500 mt-1">Tamper-proof financial state ledger logging transactional evaluations, recovers, and threat blocks.</p>
        </div>
        
        {/* Statistics Badge */}
        <div className="flex items-center gap-1 bg-slate-100 border border-slate-200 px-3 py-1 rounded text-2xs font-bold text-slate-650 uppercase tracking-wider">
          <Shield className="w-3.5 h-3.5 text-blue-600" />
          <span>{filteredLogs.length} Records Loaded</span>
        </div>
      </div>

      {/* Interactive Controls Bar */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 text-xs font-medium">
        
        {/* Keyword Search */}
        <div className="md:col-span-4 relative">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search keywords, events, decisions..."
            className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 text-xs bg-white"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* Min Risk Slider */}
        <div className="md:col-span-4 flex items-center gap-2">
          <span className="text-[10px] text-slate-400 shrink-0 font-bold uppercase tracking-wider font-mono">Min Risk ({minRisk}%)</span>
          <input
            type="range"
            min="0"
            max="100"
            step="5"
            value={minRisk}
            onChange={(e) => setMinRisk(parseInt(e.target.value))}
            className="w-full accent-blue-600 cursor-pointer"
          />
        </div>

        {/* Threat Decision Filter */}
        <div className="md:col-span-4 flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400 shrink-0" />
          <select
            value={filterDecision}
            onChange={(e) => setFilterDecision(e.target.value)}
            className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-white focus:outline-none text-xs"
          >
            <option value="">-- Clear Decisions Filter --</option>
            <option value="DIRECT_APPROVAL">DIRECT_APPROVAL</option>
            <option value="VERIFICATION_RESTRICTION">VERIFICATION_RESTRICTION</option>
            <option value="FLAGGED_FOR_HUMAN_SECURITY_REVIEW">FLAGGED_FOR_ONBOARDING_REVIEW</option>
            <option value="HIGH_ALERT">HIGH_ALERT_THREATS</option>
            <option value="PENDING_MANAGER_OVERWATCH">PENDING_SUPERVISOR</option>
            <option value="APPROVED_POST_VERIFICATION">APPROVED_POST_VERIFICATION</option>
          </select>
        </div>

      </div>

      {/* Main Ledger Table */}
      <div className="overflow-x-auto border border-slate-200 rounded-lg">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="border-b border-slate-200 text-slate-400 font-bold uppercase tracking-wider bg-slate-50 font-mono">
              <th className="py-2.5 px-3">Date & Timestamp</th>
              <th className="py-2.5 px-3">Cyber Sentinel Agent</th>
              <th className="py-2.5 px-3">Threat Action Vector Logging details</th>
              <th className="py-2.5 px-3 text-center">Threat Score</th>
              <th className="py-2.5 px-3 text-right">Escrow Action / Clearance</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredLogs.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-12 text-center text-slate-400 select-none">
                  <CircleAlert className="w-8 h-8 text-slate-200 mx-auto mb-1 animate-ping" />
                  No matching log entities found for specified filtered parameters.
                </td>
              </tr>
            ) : (
              filteredLogs.map(log => (
                <tr key={log._id} className="hover:bg-slate-50/50 text-slate-600">
                  <td className="py-2.5 px-3 font-mono text-slate-550 shrink-0">{new Date(log.timestamp).toLocaleString()}</td>
                  <td className="py-2.5 px-3 font-bold text-slate-900">{log.user}</td>
                  <td className="py-2.5 px-3 font-medium">
                    <p className="font-semibold text-slate-850">{log.event}</p>
                    {log.riskFactors.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {log.riskFactors.map((rf, i) => (
                          <span key={i} className="text-[9px] bg-red-50 text-red-650 px-1.5 py-0.5 rounded border border-red-100 font-mono font-medium">
                            ⚠️ {rf}
                          </span>
                        ))}
                      </div>
                    )}
                  </td>
                  <td className="py-2.5 px-3 text-center">
                    <span className={`px-2 py-0.5 rounded text-3xs font-extrabold border ${getRiskBadgeColor(log.riskScore)}`}>
                      {log.riskScore}%
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono font-extrabold text-blue-600">{log.decision}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      </div>
    </div>
  );
}
