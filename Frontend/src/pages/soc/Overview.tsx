import React, { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  BarChart, Bar, Cell, XAxis, YAxis, Tooltip, ResponsiveContainer
} from "recharts";
import { UserSession, Transaction } from "../../types.js";
import { getSocSummary, getSocSystemHealth, getSocIncidents } from "../../api/socApi.ts";
import { socket } from "../../api/socket.ts";
import { ShieldCheck, RefreshCw, ArrowRight } from "lucide-react";

interface OverviewProps {
  customers: UserSession[];
  transactions: Transaction[];
}

export default function Overview({ customers = [], transactions = [] }: OverviewProps) {
  const navigate = useNavigate();
  const [summary, setSummary] = useState<any>(null);
  const [systemHealth, setSystemHealth] = useState<any>(null);
  const [liveIncidents, setLiveIncidents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = () => {
    setLoading(true);
    Promise.all([getSocSummary(), getSocSystemHealth(), getSocIncidents()])
      .then(([s, h, i]) => {
        setSummary(s);
        setSystemHealth(h);
        setLiveIncidents(i || []);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchData();
    socket.on("trust_update", fetchData);
    socket.on("soc:new_incident", fetchData);
    return () => {
      socket.off("trust_update");
      socket.off("soc:new_incident");
    };
  }, []);

  const totalMonitored = customers.length || summary?.sessionsMonitored || 6;
  const threats = liveIncidents.filter(i => i.status !== 'Approved').length;
  const avgTrust = customers.length
    ? Math.round(customers.reduce((s, c) => s + (c.trustScore || 85), 0) / customers.length)
    : summary?.averageTrust || 85;

  const trustDist = useMemo(() => [
    { range: "0–19 (Block)", count: customers.filter(c => (c.trustScore || 100) < 20).length || 1, fill: "#DC2626" },
    { range: "20–39 (Hold)", count: customers.filter(c => (c.trustScore || 100) >= 20 && (c.trustScore || 100) < 40).length || 1, fill: "#EA580C" },
    { range: "40–59 (Alert)", count: customers.filter(c => (c.trustScore || 100) >= 40 && (c.trustScore || 100) < 60).length || 1, fill: "#D97706" },
    { range: "60–79 (OTP)", count: customers.filter(c => (c.trustScore || 100) >= 60 && (c.trustScore || 100) < 80).length || 1, fill: "#2563EB" },
    { range: "80–100 (Allow)", count: customers.filter(c => (c.trustScore || 100) >= 80).length || 2, fill: "#16A34A" },
  ], [customers]);

  return (
    <div className="min-h-screen bg-[#F8F9FB] text-slate-800 p-6 space-y-6 select-none font-sans">
      
      {/* Top Banner */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-blue-50 text-blue-700 rounded-xl border border-blue-200">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">SOC Executive Overview</h1>
            <p className="text-xs text-slate-500 font-mono mt-0.5">
              Bank of Baroda Bharat Trust Grid · Real-Time System Intelligence
            </p>
          </div>
        </div>

        <button
          onClick={fetchData}
          className="px-3.5 py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-700 flex items-center gap-1.5 transition cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh Feed
        </button>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 border-l-4 border-l-blue-600 rounded-2xl p-4 shadow-sm">
          <span className="text-[10px] font-mono font-bold uppercase text-slate-400">Total Monitored Accounts</span>
          <div className="text-2xl font-black font-mono text-slate-900 mt-1">{totalMonitored}</div>
        </div>
        <div className="bg-white border border-slate-200 border-l-4 border-l-amber-500 rounded-2xl p-4 shadow-sm">
          <span className="text-[10px] font-mono font-bold uppercase text-slate-400">Pending Review Incidents</span>
          <div className="text-2xl font-black font-mono text-amber-600 mt-1">{threats}</div>
        </div>
        <div className="bg-white border border-slate-200 border-l-4 border-l-emerald-600 rounded-2xl p-4 shadow-sm">
          <span className="text-[10px] font-mono font-bold uppercase text-slate-400">Average Trust Score</span>
          <div className="text-2xl font-black font-mono text-emerald-700 mt-1">{avgTrust}%</div>
        </div>
        <div className="bg-white border border-slate-200 border-l-4 border-l-purple-600 rounded-2xl p-4 shadow-sm">
          <span className="text-[10px] font-mono font-bold uppercase text-slate-400">Active Security Modules</span>
          <div className="text-2xl font-black font-mono text-purple-700 mt-1">5 / 5</div>
        </div>
      </div>

      {/* Main Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left 2 Cols: Trust Distribution Bar Chart */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
          <span className="text-xs font-mono font-bold uppercase text-slate-700 border-b border-slate-100 pb-2 block">
            CUSTOMER TRUST SCORE DISTRIBUTION MATRIX
          </span>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={trustDist}>
                <XAxis dataKey="range" stroke="#64748B" fontSize={11} />
                <YAxis stroke="#64748B" fontSize={11} />
                <Tooltip contentStyle={{ backgroundColor: "#FFFFFF", borderColor: "#CBD5E1", borderRadius: "12px", color: "#0F172A" }} />
                <Bar dataKey="count" radius={[8, 8, 0, 0]}>
                  {trustDist.map((entry, index) => (
                    <Cell key={index} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Right Col: Live Incident Stream */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
          <span className="text-xs font-mono font-bold uppercase text-slate-700 border-b border-slate-100 pb-2 block">
            LIVE REAL-TIME FEED (SOCKET.IO)
          </span>
          <div className="space-y-2 max-h-[260px] overflow-y-auto pr-1">
            {liveIncidents.slice(0, 5).map((inc, i) => (
              <div
                key={inc._id || i}
                onClick={() => navigate(`/investigation/${inc.cif || inc.sessionId}`)}
                className="bg-slate-50 hover:bg-slate-100 border border-slate-200 p-3 rounded-xl flex items-center justify-between transition cursor-pointer text-xs"
              >
                <div>
                  <div className="font-bold text-slate-900">{inc.customerName || "Customer"}</div>
                  <div className="text-2xs font-mono text-slate-500">₹{inc.amount?.toLocaleString()} · {inc.status || "HOLD"}</div>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400" />
              </div>
            ))}
          </div>
        </div>

      </div>

    </div>
  );
}
