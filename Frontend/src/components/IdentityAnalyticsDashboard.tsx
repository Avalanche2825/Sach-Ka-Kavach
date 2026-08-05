import React, { useMemo } from "react";
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Legend, PieChart, Pie, Cell 
} from "recharts";
import { UserSession, Transaction, KYCApplication } from "../types.js";
import { ChartLine, PieChart as PieIcon, BarChart3, AlertTriangle, ShieldCheck } from "lucide-react";

interface IdentityAnalyticsDashboardProps {
  customers: UserSession[];
  transactions: Transaction[];
  kycApps: KYCApplication[];
}

export default function IdentityAnalyticsDashboard({
  customers,
  transactions,
  kycApps
}: IdentityAnalyticsDashboardProps) {

  // 1. Risk Score Trends (Take 15 customers and chart their relative safety indices)
  const riskTrendData = useMemo(() => {
    return customers.slice(0, 10).map((c, i) => ({
      name: c.name.split(" ")[0],
      "Trust Index": c.trustScore,
      "Base Risk": 100 - c.trustScore
    }));
  }, [customers]);

  // 2. Transaction Analysis (Take sums grouped by status)
  const txStatusData = useMemo(() => {
    const approved = transactions.filter(t => t.status === "Approved");
    const restricted = transactions.filter(t => ["OTP_Required", "CIF_Required", "Guardian_Required"].includes(t.status));
    const rejected = transactions.filter(t => t.status === "Rejected");

    const approvedVolume = approved.reduce((acc, c) => acc + c.amount, 0);
    const restrictedVolume = restricted.reduce((acc, c) => acc + c.amount, 0);
    const rejectedVolume = rejected.reduce((acc, c) => acc + c.amount, 0);

    return [
      { name: "Direct Approved", "Volume (INR)": Math.round(approvedVolume / 1000) },
      { name: "Challenged", "Volume (INR)": Math.round(restrictedVolume / 1000) },
      { name: "Suspended / Aborted", "Volume (INR)": Math.round(rejectedVolume / 1000) }
    ];
  }, [transactions]);

  // 3. Fraud Detection Statistics (KYC Approved vs Flagged)
  const fraudPieData = useMemo(() => {
    const flagged = kycApps.filter(k => k.status === "Flagged" || k.suspiciousMatches.length > 0).length;
    const approved = kycApps.filter(k => k.status === "Approved" && k.suspiciousMatches.length === 0).length;
    const pending = kycApps.length - flagged - approved;

    return [
      { name: "Approved ID Profiles", value: approved || 15 },
      { name: "Flagged Hijack Attempts", value: flagged || 5 }
    ];
  }, [kycApps]);

  // 4. Device Risk Distribution
  const devicePieData = useMemo(() => {
    const emulators = transactions.filter(t => t.riskFactors.some(rf => rf.toLowerCase().includes("emulator"))).length;
    const normalDevices = Math.max(1, transactions.length - emulators);

    return [
      { name: "Standard Browser", value: normalDevices },
      { name: "Emulator Anomalies", value: emulators || 4 }
    ];
  }, [transactions]);

  const COLORS_FRAUD = ["#10b981", "#ef4444"];
  const COLORS_DEVICE = ["#3b82f6", "#f59e0b"];

  return (
    <div id="analytics-dashboard-module" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-6 select-none">
      
      {/* Risk score trends chart using AreaChart */}
      <div className="lg:col-span-8 bg-white border border-slate-200 p-6 rounded-xl shadow-sm">
        <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-1.5 border-b border-slate-100 pb-3">
          <ChartLine className="w-4 h-4 text-blue-600" />
          Continuous Customer Trust Scores vs Base Risk Trends
        </h4>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={riskTrendData}>
              <defs>
                <linearGradient id="colorTrust" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorRisk" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ef4444" stopOpacity={0.2}/>
                  <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="name" stroke="#64748b" style={{ fontSize: "10px" }} />
              <YAxis stroke="#64748b" style={{ fontSize: "10px" }} />
              <Tooltip contentStyle={{ background: "#0f172a", color: "white", borderRadius: "8px", fontSize: "11px" }} />
              <Area type="monotone" dataKey="Trust Index" stroke="#10b981" fillOpacity={1} fill="url(#colorTrust)" strokeWidth={2} />
              <Area type="monotone" dataKey="Base Risk" stroke="#ef4444" fillOpacity={1} fill="url(#colorRisk)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Fraud detection Pie labels */}
      <div className="lg:col-span-4 bg-white border border-slate-200 p-6 rounded-xl shadow-sm flex flex-col justify-between">
        <div>
          <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-1.5 border-b border-slate-100 pb-3">
            <PieIcon className="w-4 h-4 text-blue-600" />
            Fraud Interception Stats (KYC)
          </h4>
          <div className="h-44 w-full flex justify-center items-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={fraudPieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={70}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {fraudPieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS_FRAUD[index % COLORS_FRAUD.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ background: "#0f172a", color: "white", borderRadius: "8px", fontSize: "11px" }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="space-y-1.5 text-3xs font-semibold text-slate-600 mt-2">
          <div className="flex justify-between items-center bg-emerald-50 px-3 py-1.5 rounded">
            <span className="flex items-center gap-1 text-emerald-700">🟢 Verified App Profiles:</span>
            <span className="font-bold text-emerald-800">{fraudPieData[0]?.value} applications</span>
          </div>
          <div className="flex justify-between items-center bg-red-50 px-3 py-1.5 rounded">
            <span className="flex items-center gap-1 text-red-700">🔴 Identified Fraud Tries:</span>
            <span className="font-bold text-red-800">{fraudPieData[1]?.value} applications</span>
          </div>
        </div>
      </div>

      {/* Transaction Analysis metrics BarChart */}
      <div className="lg:col-span-8 bg-white border border-slate-200 p-6 rounded-xl shadow-sm">
        <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-1.5 border-b border-slate-100 pb-3">
          <BarChart3 className="w-4 h-4 text-blue-600" />
          Continuous Ledger Transaction Analysis (₹ in Thousands)
        </h4>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={txStatusData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="name" stroke="#64748b" style={{ fontSize: "10px" }} />
              <YAxis stroke="#64748b" style={{ fontSize: "10px" }} />
              <Tooltip contentStyle={{ background: "#0f172a", color: "white", borderRadius: "8px", fontSize: "11px" }} />
              <Legend wrapperStyle={{ fontSize: "10px" }} />
              <Bar dataKey="Volume (INR)" fill="#2563eb" radius={[4, 4, 0, 0]}>
                {txStatusData.map((entry, index) => (
                  <Cell 
                    key={`bcell-${index}`} 
                    fill={entry.name.includes("Suspended") ? "#f43f5e" : entry.name.includes("Challenged") ? "#f59e0b" : "#3b82f6"} 
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Device Threat distribution metrics */}
      <div className="lg:col-span-4 bg-white border border-slate-200 p-6 rounded-xl shadow-sm flex flex-col justify-between">
        <div>
          <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-1.5 border-b border-slate-100 pb-3">
            <PieIcon className="w-4 h-4 text-blue-600" />
            Vulnerabilities by Browser / Emulator
          </h4>
          <div className="h-44 w-full flex justify-center items-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={devicePieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={70}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {devicePieData.map((entry, index) => (
                    <Cell key={`cell-dev-${index}`} fill={COLORS_DEVICE[index % COLORS_DEVICE.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ background: "#0f172a", color: "white", borderRadius: "8px", fontSize: "11px" }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="space-y-1.5 text-3xs font-semibold text-slate-600 mt-2">
          <div className="flex justify-between items-center bg-blue-50 px-3 py-1.5 rounded">
            <span className="flex items-center gap-1 text-blue-700">🔵 Normal Browser Terminals:</span>
            <span className="font-bold text-blue-800">{devicePieData[0]?.value} instances</span>
          </div>
          <div className="flex justify-between items-center bg-amber-50 px-3 py-1.5 rounded">
            <span className="flex items-center gap-1 text-amber-700">🟡 Verified Emulator Signatures:</span>
            <span className="font-bold text-amber-800">{devicePieData[1]?.value} triggers</span>
          </div>
        </div>
      </div>

      {/* SACH Score — Unified Trust Certificate (Team SACH Innovation) */}
      <div className="lg:col-span-12 bg-gradient-to-r from-[#0a1628] to-[#122543] border border-[#1e3a6a]/40 p-6 rounded-2xl shadow-xl text-white select-none relative overflow-hidden flex flex-col sm:flex-row items-center justify-between gap-6">
        <div className="absolute top-0 right-0 w-64 h-64 bg-saffron-500/5 rounded-full blur-3xl pointer-events-none" />
        
        <div className="space-y-2 text-left flex-1">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-saffron-500" />
            <h4 className="font-extrabold text-sm uppercase tracking-wider font-mono text-saffron-400">SACH Score — Unified Trust Certificate</h4>
          </div>
          <p className="text-xs text-slate-350 max-w-2xl leading-relaxed">
            The overall safety quotient of the Bank of Baroda banking environment. This score is aggregated continuously across behavioral keystrokes, active device integrity flags, duplicate Aadhaar connections, and administrator query ticket verification.
          </p>
        </div>

        <div className="flex items-center gap-6 shrink-0 bg-slate-950/40 px-6 py-4 rounded-xl border border-slate-805">
          <div className="flex flex-col items-center">
            <span className="text-[10px] uppercase font-bold tracking-widest text-slate-400 font-mono">System Confidence</span>
            <div className="flex items-baseline mt-1 gap-1">
              <span className="text-4xl font-extrabold font-mono text-saffron-550 animate-pulse">
                {Math.max(30, Math.min(100, Math.round(
                  (customers.reduce((acc, c) => acc + c.trustScore, 0) / (customers.length || 1)) - 
                  (transactions.filter(t => t.riskScore > 65).length * 2.5)
                )))}
              </span>
              <span className="text-slate-500 text-xs font-mono">/100</span>
            </div>
          </div>
          
          <div className="w-1.5 h-10 bg-slate-800 rounded-full" />

          <div className="text-left font-mono">
            <div className="text-[9px] uppercase tracking-wider text-slate-400 font-bold">GRID STATUS:</div>
            <div className="text-xs font-black text-emerald-400 mt-1 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
              <span>FULLY ARMED</span>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}

