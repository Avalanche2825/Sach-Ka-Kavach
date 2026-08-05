import React, { useState, useEffect } from "react";
import { AlertCircle, ShieldAlert, UserX, FileText, ChevronRight, CheckCircle2, RefreshCw } from "lucide-react";
import FraudRingGraph from "../../components/charts/FraudRingGraph.tsx";
import { useToast } from "../../components/ToastProvider.tsx";
import { KYC_DEMO_LOGS, type KycDemoLog } from "../../data/kycDemoLogs.ts";

export default function FraudIntelligence() {
  const { showToast } = useToast();
  const [frozen, setFrozen] = useState(false);
  const [kycApps, setKycApps] = useState<KycDemoLog[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedApp, setSelectedApp] = useState<KycDemoLog | null>(null);

  const fetchKYCApps = () => {
    setLoading(true);
    setKycApps(KYC_DEMO_LOGS);
    setSelectedApp((current) => current || KYC_DEMO_LOGS[0]);
    setLoading(false);
  };

  useEffect(() => {
    fetchKYCApps();
  }, []);

  const handleFreeze = () => {
    setFrozen(true);
    showToast("Syndicate cluster accounts frozen! Notifications dispatched to Fraud Ops.", "error");
  };

  return (
    <div className="min-h-screen bg-[#F8F9FB] text-slate-800 p-6 space-y-6 select-none font-sans">
      
      {/* Header Bar */}
      <div className="flex justify-between items-start border-b border-slate-200 pb-4">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-50 text-blue-700 rounded-xl border border-blue-200">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-xl font-bold text-slate-900 tracking-tight">Swarm Identity & KYC Applications Log</h1>
                <span className="bg-purple-50 border border-purple-200 text-purple-700 text-[10px] font-bold px-2.5 py-0.5 rounded-full font-mono uppercase tracking-wider">
                  PRIVACY FIRST SHA 256 HASHING
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium">
                Multi-Account Syndicate Detection via Graph Topological Clustering
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={fetchKYCApps}
          className="px-3.5 py-1.5 bg-[#FFFFFF] hover:bg-slate-100 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-700 flex items-center gap-1.5 transition cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh Log
        </button>
      </div>

      {/* STAGE 1: KYC APPLICATIONS LOG & ALERT FEED TABLE */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-3">
        <div className="flex justify-between items-center border-b border-slate-100 pb-2">
          <span className="text-xs font-mono font-bold uppercase text-slate-700">
            STAGE 1: REGISTERED KYC APPLICATIONS & ALERT LOG FEED
          </span>
          <span className="text-2xs font-mono text-slate-500">
            Select an application to inspect swarm linkages & graph
          </span>
        </div>

        {kycApps.length === 0 ? (
          <div className="text-center py-8 text-xs text-slate-400 font-mono">
            Loading real backend KYC application logs...
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-sans">
              <thead>
                <tr className="border-b border-slate-200 text-slate-400 text-2xs font-mono uppercase">
                  <th className="py-2.5 px-3">Applicant Name</th>
                  <th className="py-2.5 px-3">Aadhaar Hash</th>
                  <th className="py-2.5 px-3">PAN Hash</th>
                  <th className="py-2.5 px-3">Device Fingerprint</th>
                  <th className="py-2.5 px-3">IP Address</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3 text-right">Inspect</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {kycApps.map((app, idx) => {
                  const isSelected = selectedApp?._id === app._id || selectedApp?.name === app.name;
                  const isFlagged = app.status === 'Flagged';
                  return (
                    <tr
                      key={app._id || idx}
                      onClick={() => setSelectedApp(app)}
                      className={`transition cursor-pointer ${
                        isSelected ? 'bg-blue-50/80 font-semibold' : 'hover:bg-slate-50'
                      }`}
                    >
                      <td className="py-3 px-3 font-bold text-slate-900">{app.name}</td>
                      <td className="py-3 px-3 font-mono text-2xs text-slate-600">{app.aadhaar || "XXXX-8888-7777"}</td>
                      <td className="py-3 px-3 font-mono text-2xs text-slate-600">{app.pan || "•••••99127"}</td>
                      <td className="py-3 px-3 font-mono text-2xs text-slate-600 truncate max-w-[120px]">{app.deviceFingerprint || "Android_Fingerprint_a6b9"}</td>
                      <td className="py-3 px-3 font-mono text-2xs text-slate-600">{app.ipAddress || "105.221.44.12"}</td>
                      <td className="py-3 px-3">
                        <span className={`px-2 py-0.5 rounded-full text-2xs font-mono font-bold ${
                          isFlagged ? 'bg-red-100 text-red-700 border border-red-200' : 'bg-emerald-100 text-emerald-800'
                        }`}>
                          {app.status || 'Flagged'}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right">
                        <ChevronRight className="w-4 h-4 text-slate-400 inline" />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* STAGE 2: APPLICATION DETAILS & FRAUD PATTERN DESCRIPTION */}
      {selectedApp && (
        <div className="bg-gradient-to-r from-purple-50 via-indigo-50 to-slate-50 border border-purple-200 rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex justify-between items-start">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-red-100 text-red-700 rounded-2xl border border-red-200 shrink-0">
                <AlertCircle className="w-7 h-7" />
              </div>
              <div>
                <span className="text-2xs font-mono font-bold text-slate-500 uppercase block">
                  STAGE 2: SYNDICATE PATTERN & DESCRIPTION DISCOVERY
                </span>
                <h2 className="text-lg font-extrabold text-slate-900 mt-0.5">
                  Mule Account Syndicate 702 (Target: {selectedApp.name})
                </h2>
                <p className="text-xs text-slate-600 mt-0.5">
                  Cross-referenced PAN & Aadhaar Hash linkages detected across accounts opening in different cities within 48 hours
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4 bg-white border border-slate-200 px-4 py-2.5 rounded-xl shrink-0 shadow-xs">
              <div className="text-right">
                <span className="block text-[9px] font-mono uppercase text-slate-400">SYNDICATE RISK</span>
                <span className="text-xl font-black text-red-600 font-mono">92%</span>
              </div>
              <div className="h-7 w-px bg-slate-200" />
              <div className="text-left">
                <span className="block text-[9px] font-mono uppercase text-slate-400">CLUSTER STATUS</span>
                <span className="text-2xs font-bold text-amber-800 bg-amber-100 border border-amber-300 px-2 py-0.5 rounded uppercase">
                  {frozen ? 'FROZEN' : 'SUSPICIOUS'}
                </span>
              </div>
            </div>
          </div>

          {/* Action Row & Matching Factor Badges */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-purple-200/60 text-xs">
            <div className="flex flex-wrap gap-2">
              <span className="bg-red-100 border border-red-200 text-red-800 font-mono font-bold text-2xs px-2.5 py-1 rounded-lg">
                ⚠️ Shared PAN Hash •••••99127 (Cust A & Cust B)
              </span>
              <span className="bg-amber-100 border border-amber-200 text-amber-900 font-mono font-bold text-2xs px-2.5 py-1 rounded-lg">
                ⚠️ Shared Android Fingerprint (Hash: a6b9c8d7)
              </span>
              <span className="bg-blue-100 border border-blue-200 text-blue-800 font-mono font-bold text-2xs px-2.5 py-1 rounded-lg">
                Subnet 105.221.XX (Datacenter ISP)
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleFreeze}
                disabled={frozen}
                className={`px-3.5 py-1.5 text-2xs font-bold rounded-xl flex items-center gap-1.5 transition-all shadow-xs cursor-pointer ${
                  frozen
                    ? 'bg-slate-100 text-slate-400 border border-slate-200'
                    : 'bg-red-600 hover:bg-red-700 text-white'
                }`}
              >
                <UserX className="w-3.5 h-3.5" />
                {frozen ? 'SYNDICATE FROZEN' : 'FREEZE SYNDICATE'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* STAGE 3: INTERACTIVE TOPOLOGY GRAPH VISUALIZER */}
      <div className="space-y-2">
        <span className="text-2xs font-mono font-bold uppercase text-slate-500 block">
          STAGE 3: INTERACTIVE CLUSTER TOPOLOGY GRAPH VISUALIZER
        </span>
        <FraudRingGraph selectedApp={selectedApp} />
      </div>

    </div>
  );
}
