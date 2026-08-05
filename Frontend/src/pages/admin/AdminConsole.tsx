import React, { useState, useEffect } from "react";
import { Laptop, Users, FileText, CheckCircle, Save } from "lucide-react";
import { useToast } from "../../components/ToastProvider.tsx";

export default function AdminConsole() {
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState<"users" | "config" | "logs">("config");
  
  // Configuration states
  const [allowThreshold, setAllowThreshold] = useState("80");
  const [otpThreshold, setOtpThreshold] = useState("60");
  const [alertThreshold, setAlertThreshold] = useState("40");
  const [holdThreshold, setHoldThreshold] = useState("20");

  const [systemLogs, setSystemLogs] = useState<string[]>([
    "[SYSTEM][INIT] Database bridges mounted successfully.",
    "[COMPLIANCE] Registered default supervisor accounts.",
    "[FASTAPI] Connecting backend socket io client gate...",
    "[ML ENGINE] Global isolation forest checkpoint validated."
  ]);

  const handleSaveConfig = (e: React.FormEvent) => {
    e.preventDefault();
    showToast("System thresholds saved. Applying parameter adjustments.", "success");
    setSystemLogs(prev => [`[CONFIG] Threshold values updated: Allow(${allowThreshold}), OTP(${otpThreshold}), Hold(${holdThreshold})`, ...prev]);
  };

  return (
    <div className="space-y-6 font-sans text-slate-800 p-6 select-none">
      <div>
        <span className="text-[10px] font-bold text-blue-600 tracking-widest uppercase">System Control Console</span>
        <h2 className="text-2xl font-bold text-slate-900 mt-1">Administrator Control Panel</h2>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 gap-6 text-xs font-bold">
        <button
          onClick={() => setActiveTab("config")}
          className={`pb-3 flex items-center gap-1.5 cursor-pointer ${
            activeTab === "config" ? "text-blue-650 border-b-2 border-blue-650" : "text-slate-500 hover:text-slate-800"
          }`}
        >
          <Laptop className="w-4 h-4" />
          <span>System Configurations</span>
        </button>
        <button
          onClick={() => setActiveTab("users")}
          className={`pb-3 flex items-center gap-1.5 cursor-pointer ${
            activeTab === "users" ? "text-blue-650 border-b-2 border-blue-650" : "text-slate-500 hover:text-slate-800"
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Users & Roles Access</span>
        </button>
        <button
          onClick={() => setActiveTab("logs")}
          className={`pb-3 flex items-center gap-1.5 cursor-pointer ${
            activeTab === "logs" ? "text-blue-650 border-b-2 border-blue-650" : "text-slate-500 hover:text-slate-800"
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Console Traces logs</span>
        </button>
      </div>

      <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm">
        {activeTab === "config" && (
          <form onSubmit={handleSaveConfig} className="space-y-6 max-w-xl">
            <h3 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-2.5">
              Decision engine alert boundaries (Dynamic Trust Scores)
            </h3>
            
            <div className="grid grid-cols-2 gap-6 text-xs">
              <div className="space-y-1.5">
                <label className="block font-bold text-slate-500">Allow Frictionless Access Threshold</label>
                <input
                  type="number"
                  value={allowThreshold}
                  onChange={(e) => setAllowThreshold(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block font-bold text-slate-500">OTP Step-Up Challenge Threshold</label>
                <input
                  type="number"
                  value={otpThreshold}
                  onChange={(e) => setOtpThreshold(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block font-bold text-slate-500">CIF Soft Challenge Threshold</label>
                <input
                  type="number"
                  value={alertThreshold}
                  onChange={(e) => setAlertThreshold(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block font-bold text-slate-500">Guardian Escrow HOLD Threshold</label>
                <input
                  type="number"
                  value={holdThreshold}
                  onChange={(e) => setHoldThreshold(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs"
                />
              </div>
            </div>

            <button
              type="submit"
              className="flex items-center gap-1.5 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold cursor-pointer transition-colors"
            >
              <Save className="w-4 h-4" />
              <span>Apply Changes</span>
            </button>
          </form>
        )}

        {activeTab === "users" && (
          <div className="space-y-4">
            <h3 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-2.5">
              Access permissions settings matrix
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 font-bold text-slate-400 text-2xs uppercase">
                    <th className="py-2.5 px-4">Role Code</th>
                    <th className="py-2.5 px-4">Retail Banking View</th>
                    <th className="py-2.5 px-4">Operational Overrides</th>
                    <th className="py-2.5 px-4">ML Telemetry Charts</th>
                    <th className="py-2.5 px-4">Admin Config</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-650">
                  <tr>
                    <td className="py-3 px-4 font-bold text-slate-800">customer</td>
                    <td className="py-3 px-4 text-emerald-600">✓ Granted</td>
                    <td className="py-3 px-4 text-slate-400">○ Revoked</td>
                    <td className="py-3 px-4 text-slate-400">○ Revoked</td>
                    <td className="py-3 px-4 text-slate-400">○ Revoked</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-4 font-bold text-slate-800">staff</td>
                    <td className="py-3 px-4 text-slate-400">○ Revoked</td>
                    <td className="py-3 px-4 text-emerald-600">✓ Granted</td>
                    <td className="py-3 px-4 text-slate-400">○ Revoked</td>
                    <td className="py-3 px-4 text-slate-400">○ Revoked</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-4 font-bold text-slate-800">soc</td>
                    <td className="py-3 px-4 text-slate-400">○ Revoked</td>
                    <td className="py-3 px-4 text-emerald-600">✓ Granted</td>
                    <td className="py-3 px-4 text-emerald-600">✓ Granted</td>
                    <td className="py-3 px-4 text-slate-400">○ Revoked</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-4 font-bold text-slate-800">admin</td>
                    <td className="py-3 px-4 text-slate-400">○ Revoked</td>
                    <td className="py-3 px-4 text-emerald-600">✓ Granted</td>
                    <td className="py-3 px-4 text-emerald-600">✓ Granted</td>
                    <td className="py-3 px-4 text-emerald-600">✓ Granted</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === "logs" && (
          <div className="space-y-4 font-mono text-xs">
            <h3 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-2.5">
              Live Console Output Stream
            </h3>
            <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl max-h-[300px] overflow-y-auto space-y-1.5 text-slate-650">
              {systemLogs.map((log, index) => (
                <div key={index} className="flex gap-2">
                  <span className="text-slate-400">[{new Date().toLocaleTimeString()}]</span>
                  <span>{log}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
