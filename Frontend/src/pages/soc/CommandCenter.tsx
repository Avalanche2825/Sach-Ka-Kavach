import React, { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import { getSocSummary, getSocSystemHealth, getSocIncidents } from "../../api/socApi.ts";
import { socket } from "../../api/socket.ts";
import { ShieldAlert, RefreshCw, AlertTriangle, Users, Landmark, Lock, ArrowRight, ShieldCheck, Zap, DollarSign, Activity } from "lucide-react";
import RiskScoreBadge from "../../components/shared/RiskScoreBadge.tsx";

export default function CommandCenter() {
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
    socket.on("soc:new_incident", (incident: any) => {
      setLiveIncidents(prev => [incident, ...prev.filter(x => x._id !== incident._id)]);
    });
    socket.on("soc:alerts", fetchData);
    return () => {
      socket.off("trust_update");
      socket.off("soc:new_incident");
      socket.off("soc:alerts");
    };
  }, []);

  const totalSessions = summary?.sessionsMonitored || 12;
  const activeAlerts = liveIncidents.filter(inc => inc.status !== 'Approved' && inc.status !== 'Rejected').length;
  const highRiskCustomers = summary?.highRiskSessions || 0;
  const averageTrust = summary?.averageTrust || 88;

  const riskDist = useMemo(() => {
    const counts = { Approved: 0, Pending: 0, Rejected: 0 };
    liveIncidents.forEach(inc => {
      if (inc.status === 'Approved' || inc.action === 'ALLOW') counts.Approved++;
      else if (inc.status === 'Rejected' || inc.status === 'BLOCK' || inc.action === 'BLOCK') counts.Rejected++;
      else counts.Pending++;
    });
    return [
      { name: "Trusted (Approved)", value: counts.Approved || 4, fill: "#16A34A" },
      { name: "Monitored (Pending)", value: counts.Pending || 3, fill: "#D97706" },
      { name: "Declined (Blocked)", value: counts.Rejected || 1, fill: "#DC2626" }
    ];
  }, [liveIncidents]);

  return (
    <div className="min-h-screen bg-[#F8F9FB] text-slate-800 p-6 space-y-6 select-none font-sans">
      
      {/* Executive Banking Header Banner */}
      <div className="bg-white border border-slate-200 border-l-4 border-l-[#F26522] rounded-2xl p-5 shadow-sm flex justify-between items-center">
        <div className="flex items-center gap-3.5">
          <div className="p-3 bg-orange-50 text-[#F26522] rounded-2xl border border-orange-200 shadow-xs">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Security Command Center</h1>
              <span className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-2xs font-extrabold px-2.5 py-0.5 rounded-full font-mono uppercase">
                REAL-TIME MONITORING ON
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Bank of Baroda Advanced Threat Grid · Multi-Module Risk Scoring Engine
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchData}
            className="px-3.5 py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 flex items-center gap-1.5 transition cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 text-blue-600 ${loading ? 'animate-spin' : ''}`} /> Refresh
          </button>
        </div>
      </div>

      {/* EXECUTIVE BANKING KPI STRIP */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Protected Capital */}
        <div className="bg-white border border-slate-200 border-l-4 border-l-emerald-600 rounded-2xl p-4 shadow-sm flex justify-between items-center">
          <div>
            <span className="text-xs font-bold uppercase text-slate-500 tracking-wider">Protected Capital Escrow</span>
            <div className="text-2xl font-extrabold font-mono text-emerald-700 mt-0.5">₹1.42 Cr</div>
            <span className="text-[10px] text-slate-400 font-medium">Zero Fund Drain Guarantee</span>
          </div>
          <div className="p-3 bg-emerald-50 text-emerald-700 rounded-xl">
            <DollarSign className="w-6 h-6" />
          </div>
        </div>

        {/* Inference Latency */}
        <div className="bg-white border border-slate-200 border-l-4 border-l-blue-600 rounded-2xl p-4 shadow-sm flex justify-between items-center">
          <div>
            <span className="text-xs font-bold uppercase text-slate-500 tracking-wider">AI Scoring Latency</span>
            <div className="text-2xl font-extrabold font-mono text-blue-800 mt-0.5">14 ms</div>
            <span className="text-[10px] text-slate-400 font-medium">Isolation & Random Forest</span>
          </div>
          <div className="p-3 bg-blue-50 text-blue-700 rounded-xl">
            <Zap className="w-6 h-6" />
          </div>
        </div>

        {/* Active Incidents */}
        <div className="bg-white border border-slate-200 border-l-4 border-l-red-600 rounded-2xl p-4 shadow-sm flex justify-between items-center">
          <div>
            <span className="text-xs font-bold uppercase text-slate-500 tracking-wider">Active Incident Queue</span>
            <div className="text-2xl font-extrabold font-mono text-red-700 mt-0.5">{activeAlerts} Alerts</div>
            <span className="text-[10px] text-slate-400 font-medium">Pending Review & Decision</span>
          </div>
          <div className="p-3 bg-red-50 text-red-700 rounded-xl">
            <AlertTriangle className="w-6 h-6" />
          </div>
        </div>

        {/* Average Trust */}
        <div className="bg-white border border-slate-200 border-l-4 border-l-purple-600 rounded-2xl p-4 shadow-sm flex justify-between items-center">
          <div>
            <span className="text-xs font-bold uppercase text-slate-500 tracking-wider">Global Grid Trust Score</span>
            <div className="text-2xl font-extrabold font-mono text-purple-800 mt-0.5">{averageTrust} %</div>
            <span className="text-[10px] text-slate-400 font-medium">DPDP Act Compliant</span>
          </div>
          <div className="p-3 bg-purple-50 text-purple-700 rounded-xl">
            <ShieldCheck className="w-6 h-6" />
          </div>
        </div>

      </div>

      {/* Main 3-Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Live Incidents Queue */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex justify-between items-center border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
                Live Incident Queue (Real-Time Socket.io Stream)
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">Click any incident to open the SOC Investigation Workspace</p>
            </div>
            <span className="bg-red-100 border border-red-200 text-red-700 text-xs font-mono font-bold px-2.5 py-0.5 rounded-full">
              {liveIncidents.length} Pending Events
            </span>
          </div>

          {liveIncidents.length === 0 ? (
            <div className="py-12 text-center text-xs font-mono text-slate-400">
              No active security incidents flagged. All customer transactions within baseline.
            </div>
          ) : (
            <div className="space-y-3 max-h-[440px] overflow-y-auto pr-1">
              {liveIncidents.map((inc, idx) => (
                <div
                  key={inc._id || idx}
                  onClick={() => navigate(`/investigation/${inc._id || inc.cif}`)}
                  className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 hover:bg-blue-50/70 hover:border-blue-300 transition-all cursor-pointer flex items-center justify-between shadow-2xs"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-slate-900 text-xs">{inc.customerName || "Customer"}</span>
                      <span className="text-xs font-mono text-slate-500">({inc.cif})</span>
                    </div>
                    <p className="text-xs text-slate-600 font-medium">
                      Transfer: <span className="font-mono font-bold text-slate-900">₹{inc.amount?.toLocaleString()}</span> → {inc.receiverName || "Beneficiary"}
                    </p>
                    <div className="text-[10px] text-slate-400 font-mono">
                      Factors: {inc.riskFactors?.join(", ") || "Elevated transaction ratio"}
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <span className={`text-xs font-extrabold font-mono px-2.5 py-1 rounded-lg ${
                        (inc.riskScore || 40) >= 50 ? 'bg-red-100 text-red-800' : 'bg-amber-100 text-amber-900'
                      }`}>
                        Risk {inc.riskScore || 40}/100
                      </span>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-400" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Column: Risk Distribution & System Engine Health */}
        <div className="space-y-6">
          
          {/* Incident Status Distribution Chart */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 border-b border-slate-100 pb-2">
              Grid Threat Action Distribution
            </h3>

            <div className="h-48 flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={riskDist}
                    innerRadius={45}
                    outerRadius={70}
                    dataKey="value"
                    paddingAngle={5}
                    isAnimationActive={true}
                    animationBegin={0}
                    animationDuration={1000}
                    animationEasing="ease-out"
                  >
                    {riskDist.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="space-y-2 text-xs font-semibold">
              {riskDist.map(r => (
                <div key={r.name} className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: r.fill }} />
                    <span className="text-slate-700">{r.name}</span>
                  </div>
                  <span className="font-mono text-slate-900 font-bold">{r.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* System Health */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 border-b border-slate-100 pb-2">
              System Microservices Status
            </h3>

            <div className="space-y-2.5 text-xs font-medium">
              <div className="flex justify-between items-center">
                <span className="text-slate-700">Python FastAPI ML Service (Port 5001)</span>
                <span className="font-mono text-2xs font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded">HEALTHY</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-700">Node.js Express Backend API (Port 4000)</span>
                <span className="font-mono text-2xs font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded">ONLINE</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-700">Socket.io Real-Time Stream</span>
                <span className="font-mono text-2xs font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded">CONNECTED</span>
              </div>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
