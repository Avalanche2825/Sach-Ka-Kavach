import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Laptop, ShieldAlert, Brain, User, AlertTriangle, CheckCircle2, ChevronRight } from "lucide-react";

interface DeviceAnomaly {
  id: string;
  cif: string;
  customerName: string;
  timestamp: string;
  riskScore: number; // out of 25
  severity: "CRITICAL" | "HIGH" | "MEDIUM";
  deviceModel: string;
  deviations: {
    parameter: string;
    current: string;
    baseline: string;
    delta: string;
    status: "CRITICAL" | "ELEVATED" | "NORMAL";
  }[];
  reasoning: string;
  aiExplanation: string;
  suggestion: string;
}

export default function LiveMonitoring() {
  const navigate = useNavigate();

  const anomalies: DeviceAnomaly[] = [
    {
      id: "dev_001",
      cif: "CIF100000",
      customerName: "Aarav Sharma",
      timestamp: "Today, 10:45 AM",
      riskScore: 22,
      severity: "HIGH",
      deviceModel: "Samsung Galaxy S24",
      deviations: [
        { parameter: "Trusted Hardware ID", current: "Mismatched (Sig: dev_s24_bob_982b)", baseline: "Sig: dev_oneplus11_bob_110a", delta: "New Hardware Signature", status: "CRITICAL" },
        { parameter: "Device OS Bootloader", current: "Rooted / Unlocked", baseline: "Locked Production", delta: "OS Integrity Compromise", status: "CRITICAL" },
        { parameter: "Carrier Network IP", current: "192.168.43.11 (Hotspot/Unknown)", baseline: "103.88.24.12 (Jio Fiber)", delta: "Unknown ISP Node", status: "ELEVATED" },
        { parameter: "Screen Scale Factor", current: "360x780 (Scale: 3.0)", baseline: "360x780 (Scale: 3.0)", delta: "Match", status: "NORMAL" }
      ],
      reasoning: "A hardware signature mismatch indicates this customer account is being accessed on a newly registered device profile. Additionally, the device bootloader is flagged as rooted/unlocked, creating high exposure to memory-read malware.",
      aiExplanation: "Module 2 (Device) flagged a fingerprint validation failure. The active device profile has modified boot parameters and does not match the historical hardware keychain baseline for Aarav Sharma.",
      suggestion: "Trigger device authorization challenge; enforce secondary OTP step-up before any transfer."
    },
    {
      id: "dev_002",
      cif: "CIF100001",
      customerName: "Priya Patel",
      timestamp: "Today, 02:14 AM",
      riskScore: 25,
      severity: "CRITICAL",
      deviceModel: "Windows 11 PC",
      deviations: [
        { parameter: "VPN / Proxy Status", current: "ACTIVE (ExpressVPN Gateway)", baseline: "CLEAR (Residential ISP)", delta: "Commercial Proxy Active", status: "CRITICAL" },
        { parameter: "Geographic Velocity", current: "3,400 km/h (Delta Hop)", baseline: "Stationary (<15 km/h)", delta: "Impossible Hops Detected", status: "CRITICAL" },
        { parameter: "DNS Server Mismatch", current: "8.8.8.8 (Google Public)", baseline: "125.22.44.1 (Jio Local)", delta: "Bypassed local ISP DNS", status: "ELEVATED" }
      ],
      reasoning: "Routing parameters indicate active VPN masking via known commercial datacenter egress points. The geographical velocity delta (+3,400 km/h since last access) represents physical impossibility.",
      aiExplanation: "High-risk datacenter node route active. Coordinates changed impossibly in under 12 minutes, suggesting active location spoofing or account sharing.",
      suggestion: "Block current session instantly; require residential IP verification."
    },
    {
      id: "dev_003",
      cif: "CIF100003",
      customerName: "Hardik Mathur",
      timestamp: "Today, 11:32 AM",
      riskScore: 24,
      severity: "CRITICAL",
      deviceModel: "Xiaomi Redmi Note 12",
      deviations: [
        { parameter: "Remote Access Service", current: "AnyDesk Active in BG", baseline: "None", delta: "Screen Mirroring Protocol", status: "CRITICAL" },
        { parameter: "HDMI/Cast Interface", current: "Mirror Cast CastOn=True", baseline: "Mirror Cast CastOn=False", delta: "Screen Sharing Flagged", status: "CRITICAL" },
        { parameter: "Touch Resolution Scale", current: "Custom Viewport Mode", baseline: "Native Mobile Viewport", delta: "Suspected Emulated Touch", status: "ELEVATED" }
      ],
      reasoning: "Active remote desktop stream running in the background during active banking session. The presence of AnyDesk screen mirroring indicates high susceptibility to phone-scam coaching.",
      aiExplanation: "Remote mirroring active. The browser API flagged active media casting in the background, matching a vishing takeover profile.",
      suggestion: "Hard-block transaction immediately to prevent remote wallet drain."
    },
    {
      id: "dev_004",
      cif: "CIF100004",
      customerName: "Siddharth Rao",
      timestamp: "Yesterday, 08:22 PM",
      riskScore: 18,
      severity: "MEDIUM",
      deviceModel: "Apple iPhone 15 Pro",
      deviations: [
        { parameter: "Browser UserAgent", current: "Safari Mobile (Emulated)", baseline: "Apple Safari Native", delta: "Desktop emulation mode", status: "ELEVATED" },
        { parameter: "Pointer Input Type", current: "Mouse Pointer (Emulated touch)", baseline: "Capacitive Multi-touch", delta: "DevTools Simulation", status: "ELEVATED" }
      ],
      reasoning: "Chrome DevTools emulator signatures flagged. Viewport pointer inputs deviate from Apple Safari native touch telemetry, suggesting automation test vectors.",
      aiExplanation: "Emulated touch profile detected. Pointer event listeners captured absolute coordinate clicks with zero pressure variance.",
      suggestion: "Enforce OTP challenge verification to confirm human input."
    }
  ];

  const [selected, setSelected] = useState<DeviceAnomaly>(anomalies[0]);

  return (
    <div className="min-h-screen bg-[#F8F9FB] text-slate-800 p-6 space-y-6 select-none font-sans">
      
      {/* Header */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-blue-50 text-blue-700 rounded-xl border border-blue-200">
            <Laptop className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Device Intelligence Logs (Module 2)</h1>
            <p className="text-xs text-slate-500 font-mono mt-0.5">
              Device Fingerprint & Hardware Signature Deviations · Network Tunneling Alerts
            </p>
          </div>
        </div>

        <span className="bg-red-50 border border-red-200 text-red-700 text-xs font-mono font-bold px-3 py-1.5 rounded-full">
          {anomalies.length} Flagged Events
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Flagged Anomaly Feed */}
        <div className="space-y-4">
          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
            <span className="text-xs font-mono font-bold uppercase text-slate-700 block mb-3 pb-2 border-b border-slate-100">
              Hardware & IP Logs Feed
            </span>

            <div className="space-y-3">
              {anomalies.map((anom) => {
                const isSelected = selected.id === anom.id;
                return (
                  <div
                    key={anom.id}
                    onClick={() => setSelected(anom)}
                    className={`p-4 rounded-xl border transition cursor-pointer flex flex-col gap-2.5 ${
                      isSelected
                        ? "bg-blue-50/80 border-blue-300 ring-2 ring-blue-400/20"
                        : "bg-slate-50 border-slate-200 hover:bg-slate-100"
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="font-extrabold text-slate-900 text-xs">{anom.customerName}</div>
                        <div className="text-3xs text-slate-500 font-mono mt-0.5">Model: {anom.deviceModel}</div>
                      </div>
                      <span style={{
                        fontSize: 9, fontWeight: 700, padding: "2px 6px", borderRadius: 4,
                        background: anom.severity === "CRITICAL" ? "#FEF2F2" : anom.severity === "HIGH" ? "#FFF7ED" : "#EFF6FF",
                        color: anom.severity === "CRITICAL" ? "#DC2626" : anom.severity === "HIGH" ? "#EA580C" : "#2563EB",
                      }}>
                        {anom.severity}
                      </span>
                    </div>

                    <div className="flex justify-between items-center text-xs pt-1 border-t border-slate-200/50">
                      <span className="text-slate-500 font-medium font-mono text-3xs">{anom.timestamp}</span>
                      <span className="font-bold text-red-600 font-mono text-2xs">Risk Score: {anom.riskScore}/25</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right 2 Columns: Detailed Anomaly Inspector */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-6">
            
            {/* Header block */}
            <div className="flex justify-between items-start border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-blue-50 border border-blue-200 rounded-xl flex items-center justify-center text-blue-700">
                  <Laptop className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-base">{selected.customerName} ({selected.deviceModel})</h3>
                  <p className="text-xs text-slate-500 font-mono">CIF ID: {selected.cif} · Incident: {selected.id}</p>
                </div>
              </div>

              <div className="text-right">
                <span className="text-3xs font-mono uppercase text-slate-400 block mb-1">M2 Device Risk</span>
                <span className="text-xl font-black text-red-600 font-mono">{selected.riskScore} <span className="text-xs text-slate-400 font-normal">/ 25 pts</span></span>
              </div>
            </div>

            {/* Deviations comparison table */}
            <div className="space-y-3">
              <span className="text-xs font-mono font-bold uppercase text-slate-700 block">
                Hardware Signature Deviation Matrix
              </span>
              
              <div className="border border-slate-200 rounded-xl overflow-hidden text-xs">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-mono text-3xs uppercase">
                      <th className="py-2.5 px-4">Device Parameter</th>
                      <th className="py-2.5 px-4">Current Session</th>
                      <th className="py-2.5 px-4">Registered Baseline</th>
                      <th className="py-2.5 px-4">Status Delta</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-sans">
                    {selected.deviations.map((dev, i) => (
                      <tr key={i} className="hover:bg-slate-50/50">
                        <td className="py-3 px-4 font-bold text-slate-800">{dev.parameter}</td>
                        <td className={`py-3 px-4 font-mono font-bold ${
                          dev.status === "CRITICAL" ? "text-red-600" : dev.status === "ELEVATED" ? "text-amber-600" : "text-slate-800"
                        }`}>{dev.current}</td>
                        <td className="py-3 px-4 font-mono text-slate-600">{dev.baseline}</td>
                        <td className={`py-3 px-4 font-mono font-extrabold ${
                          dev.status === "CRITICAL" ? "text-red-600" : dev.status === "ELEVATED" ? "text-amber-600" : "text-slate-500"
                        }`}>{dev.delta}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Technical reasoning explanation */}
            <div className="space-y-2 bg-slate-50 border border-slate-200 p-4.5 rounded-xl">
              <div className="flex items-center gap-2 text-slate-900 font-bold text-xs uppercase tracking-wider">
                <AlertTriangle className="w-4 h-4 text-amber-500" />
                <span>SOC Technical Diagnostic Reasoning</span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed font-medium">
                {selected.reasoning}
              </p>
            </div>

            {/* AI Explanation bubble */}
            <div className="space-y-3 bg-blue-50/80 border border-blue-200 p-5 rounded-xl">
              <div className="flex items-center gap-2.5 text-blue-950 font-bold text-xs uppercase tracking-wider">
                <Brain className="w-4.5 h-4.5 text-blue-600 animate-pulse" />
                <span>xAI Grok Risk Explanation</span>
              </div>
              <p className="text-xs text-blue-900 font-semibold leading-relaxed">
                "{selected.aiExplanation}"
              </p>
            </div>

            {/* Action suggestion recommendation */}
            <div className="space-y-3 bg-emerald-50 border border-emerald-200 p-4.5 rounded-xl">
              <div className="flex items-center gap-2 text-emerald-950 font-bold text-xs uppercase tracking-wider">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Recommended Defensive Action</span>
              </div>
              <p className="text-xs text-emerald-900 font-bold leading-relaxed">
                {selected.suggestion}
              </p>
            </div>

            {/* Navigation buttons to full case file */}
            <div className="pt-2 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => navigate(`/investigation/${selected.cif}`)}
                className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl cursor-pointer shadow-xs transition"
              >
                Open Customer Case File →
              </button>
            </div>

          </div>
        </div>

      </div>

    </div>
  );
}
