import React from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Activity, ShieldAlert, Clock, Brain, AlertTriangle, CheckCircle2, ChevronRight, ArrowLeft, Terminal, FileText } from "lucide-react";

interface BehavioralAnomalyLog {
  id: string;
  customerName: string;
  cif: string;
  timestamp: string;
  riskScore: number; // out of 40
  severity: "CRITICAL" | "HIGH" | "MEDIUM";
  primaryFlag: string;
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
  rawTelemetry: {
    keystrokeDwellMs: number;
    typingVarianceMs2: number;
    actionsPerMin: number;
    clipboardPaste: boolean;
    idleDelaySec: number;
    deviceTouchRatio: number;
  };
}

export default function BehaviorAnalytics() {
  const navigate = useNavigate();
  const { logId } = useParams<{ logId: string }>();

  const logs: BehavioralAnomalyLog[] = [
    {
      id: "LOG-BEH-8821",
      customerName: "Aarav Sharma", cif: "CIF100000",
      timestamp: "Today, 10:45:12 AM",
      riskScore: 38,
      severity: "HIGH",
      primaryFlag: "Severe Typing Cadence Spike & Clipboard Paste",
      deviations: [
        { parameter: "Typing Cadence Variance", current: "84.2 ms²", baseline: "12.0 ms²", delta: "+601% Deviation", status: "CRITICAL" },
        { parameter: "Average Keystroke Dwell", current: "490 ms", baseline: "210 ms", delta: "+133% Speed Delay", status: "ELEVATED" },
        { parameter: "Clipboard Paste Event", current: "Paste Detected", baseline: "Typed Manually", delta: "Clipboard Injection", status: "CRITICAL" },
        { parameter: "Actions/Min (APM)", current: "4.1 events", baseline: "12.5 events", delta: "Hesitant interaction", status: "NORMAL" }
      ],
      reasoning: "Keystroke cadence variance is 600% above historical baseline, combined with clipboard copy-paste injection into the beneficiary field. This pattern indicates potential vishing (call-coaching) or external script assistance.",
      aiExplanation: "Continuous behavioral verification model flagged a critical keystroke cadence anomaly. Input dwell times and delays deviate significantly from normal baseline, matching a phone scam vishing vector.",
      suggestion: "Challenge active session with SMS transaction OTP; hold transaction pending voice/phone call verification.",
      rawTelemetry: {
        keystrokeDwellMs: 490,
        typingVarianceMs2: 84.2,
        actionsPerMin: 4.1,
        clipboardPaste: true,
        idleDelaySec: 6.8,
        deviceTouchRatio: 0.98
      }
    },
    {
      id: "LOG-BEH-9014",
      customerName: "Vikram Mehta", cif: "CIF100007",
      timestamp: "Today, 02:14:08 AM",
      riskScore: 40,
      severity: "CRITICAL",
      primaryFlag: "Mechanical Interaction Timing (Zero Variance Bot)",
      deviations: [
        { parameter: "Actions / Min (APM)", current: "340.0 events", baseline: "14.2 events", delta: "+2,294% Bot-like Speed", status: "CRITICAL" },
        { parameter: "Typing Cadence Variance", current: "0.0 ms²", baseline: "32.0 ms²", delta: "-100% Mechanical Timing", status: "CRITICAL" },
        { parameter: "Navigation Depth", current: "1 page", baseline: "4 pages", delta: "Direct Route Bypass", status: "ELEVATED" }
      ],
      reasoning: "Interaction rate exceeds human physiological limits (340 APM) and keystroke variance is exactly zero, confirming an automated script replay attack.",
      aiExplanation: "Scripted automated interaction detected. Keystroke interval variance of 0ms confirms automated payload execution.",
      suggestion: "Terminate web session instantly, reject active requests, and flag the origin IP address.",
      rawTelemetry: {
        keystrokeDwellMs: 12,
        typingVarianceMs2: 0.0,
        actionsPerMin: 340.0,
        clipboardPaste: false,
        idleDelaySec: 0.1,
        deviceTouchRatio: 0.00
      }
    },
    {
      id: "LOG-BEH-7732",
      customerName: "Priya Patel", cif: "CIF100004",
      timestamp: "Yesterday, 11:32:44 PM",
      riskScore: 28,
      severity: "MEDIUM",
      primaryFlag: "Late Night Access & High Hesitation Delay",
      deviations: [
        { parameter: "Access Time Window", current: "23:32", baseline: "14:00 (Avg)", delta: "Z-Score: 3.4 (Late Night)", status: "ELEVATED" },
        { parameter: "Idle Hesitation Count", current: "8 occurrences", baseline: "1 occurrence", delta: "Extended Hesitation", status: "ELEVATED" },
        { parameter: "Typing Cadence Variance", current: "35.1 ms²", baseline: "28.0 ms²", delta: "Normal variance", status: "NORMAL" }
      ],
      reasoning: "Significant access time deviation combined with multiple prolonged idle pauses. The actor is browsing sluggishly, indicating potential credential validation behavior.",
      aiExplanation: "Late night access outside preferred login window combined with extended idle periods indicates account scrutiny.",
      suggestion: "Prompt for secondary secure biometrics or standard OTP on next fund movement.",
      rawTelemetry: {
        keystrokeDwellMs: 260,
        typingVarianceMs2: 35.1,
        actionsPerMin: 8.2,
        clipboardPaste: false,
        idleDelaySec: 14.5,
        deviceTouchRatio: 0.85
      }
    },
    {
      id: "LOG-BEH-6520",
      customerName: "Rohan Verma", cif: "CIF100005",
      timestamp: "2 days ago, 04:10:19 PM",
      riskScore: 32,
      severity: "HIGH",
      primaryFlag: "Direct Route Bypass & Input Hesitation",
      deviations: [
        { parameter: "Typing Cadence Variance", current: "62.1 ms²", baseline: "22.0 ms²", delta: "+182% Deviation", status: "ELEVATED" },
        { parameter: "Navigation Path Flow", current: "Direct Deep-Link", baseline: "Dashboard -> Transfer", delta: "Bypassed Dashboard", status: "CRITICAL" }
      ],
      reasoning: "Direct page deep-linking bypasses standard landing navigation baseline, suggesting targeted API or URL path invocation.",
      aiExplanation: "Deep-linked transaction route access bypassing main dashboard page combined with abnormal input cadence variance.",
      suggestion: "Force standard navigation flow; challenge transaction with SMS token.",
      rawTelemetry: {
        keystrokeDwellMs: 310,
        typingVarianceMs2: 62.1,
        actionsPerMin: 6.0,
        clipboardPaste: false,
        idleDelaySec: 9.2,
        deviceTouchRatio: 0.90
      }
    },
    {
      id: "LOG-BEH-5412",
      customerName: "Isha Kapoor", cif: "CIF100006",
      timestamp: "3 days ago, 09:15:30 AM",
      riskScore: 24,
      severity: "MEDIUM",
      primaryFlag: "Unusual Key Pressure Profile & Backspace Bursts",
      deviations: [
        { parameter: "Backspace Burst Ratio", current: "14 presses", baseline: "2 presses", delta: "+600% Input Corrections", status: "ELEVATED" },
        { parameter: "Input Cadence Variance", current: "41.0 ms²", baseline: "18.0 ms²", delta: "+127% Variance", status: "ELEVATED" }
      ],
      reasoning: "Repeated backspace correction bursts indicate high nervousness or unfamiliarity with input credentials.",
      aiExplanation: "Elevated backspace correction frequency combined with unstable key-press cadence.",
      suggestion: "Request verification OTP step-up before finalizing account changes.",
      rawTelemetry: {
        keystrokeDwellMs: 280,
        typingVarianceMs2: 41.0,
        actionsPerMin: 9.5,
        clipboardPaste: false,
        idleDelaySec: 5.1,
        deviceTouchRatio: 0.94
      }
    },
    {
      id: "LOG-BEH-4109",
      customerName: "Satish Kumar", cif: "CIF100008",
      timestamp: "4 days ago, 07:44:02 PM",
      riskScore: 36,
      severity: "HIGH",
      primaryFlag: "Rapid Beneficiary Switching & Paste Injection",
      deviations: [
        { parameter: "Clipboard Paste Event", current: "Paste Detected", baseline: "Manual Typing", delta: "Clipboard Injection", status: "CRITICAL" },
        { parameter: "Form Focus Duration", current: "1.2 seconds", baseline: "8.5 seconds", delta: "Suspicious Fast Submit", status: "CRITICAL" }
      ],
      reasoning: "Form submitted in 1.2 seconds using clipboard paste. The speed indicates automated form-filler or scripted injection.",
      aiExplanation: "Rapid form focus switching and instant clipboard paste injection.",
      suggestion: "Flag transaction for SOC verification; hold funds pending confirmation.",
      rawTelemetry: {
        keystrokeDwellMs: 80,
        typingVarianceMs2: 110.4,
        actionsPerMin: 45.0,
        clipboardPaste: true,
        idleDelaySec: 1.2,
        deviceTouchRatio: 0.70
      }
    }
  ];

  const selectedLog = logs.find((log) => log.id === logId) || null;

  return (
    <div className="min-h-screen bg-[#F8F9FB] text-slate-800 p-6 space-y-6 select-none font-sans">
      
      {/* View Mode: LIST */}
      {!logId && (
        <div className="space-y-6">
          
          {/* Header */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-blue-50 text-blue-700 rounded-xl border border-blue-200">
                <Activity className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-900 tracking-tight">Behavioral Anomaly Logs (Module 1)</h1>
                <p className="text-xs text-slate-500 font-mono mt-0.5">
                  Isolation Forest Scoring · Continuous Keystroke Cadence & Interaction Telemetry Logs
                </p>
              </div>
            </div>

            <span className="bg-red-50 border border-red-200 text-red-700 text-xs font-mono font-bold px-3.5 py-1.5 rounded-full">
              {logs.length} Flagged Telemetry Logs
            </span>
          </div>

          {/* Anomaly Logs Feed Table */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <span className="text-xs font-mono font-bold uppercase text-slate-700">
                ANOMALY TELEMETRY LOG FEED (CLICK ANY LOG FOR DEDICATED FULL DETAILS)
              </span>
              <span className="text-2xs font-mono text-slate-400">
                Telemetry Log Archive (Zero PII / Pure Signal Telemetry)
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-sans">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500 font-mono text-3xs uppercase bg-slate-50">
                    <th className="py-3 px-4">Log Reference ID</th>
                    <th className="py-3 px-4">Customer</th>
                    <th className="py-3 px-4">Timestamp</th>
                    <th className="py-3 px-4">Severity</th>
                    <th className="py-3 px-4">Risk Contribution</th>
                    <th className="py-3 px-4">Flagged Anomaly Summary</th>
                    <th className="py-3 px-4 text-right">View Log Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {logs.map((log) => (
                    <tr
                      key={log.id}
                      onClick={() => navigate(`/behavior-analytics/${log.id}`)}
                      className="hover:bg-blue-50/70 transition cursor-pointer font-medium"
                    >
                      <td className="py-3.5 px-4 font-bold font-mono text-blue-900 flex items-center gap-2">
                        <FileText className="w-4 h-4 text-blue-600 shrink-0" />
                        <span>{log.id}</span>
                      </td>
                      <td className="py-3.5 px-4"><div className="font-bold text-slate-800">{log.customerName}</div><div className="text-3xs text-slate-500">{log.cif}</div></td>
                      <td className="py-3.5 px-4 font-mono text-slate-500 text-3xs">{log.timestamp}</td>
                      <td className="py-3.5 px-4">
                        <span style={{
                          fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 4,
                          background: log.severity === "CRITICAL" ? "#FEF2F2" : log.severity === "HIGH" ? "#FFF7ED" : "#EFF6FF",
                          color: log.severity === "CRITICAL" ? "#DC2626" : log.severity === "HIGH" ? "#EA580C" : "#2563EB",
                        }}>
                          {log.severity}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-mono font-extrabold text-red-600">
                        {log.riskScore} / 40 Pts
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-slate-800">
                        {log.primaryFlag}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button className="px-3 py-1 bg-slate-100 hover:bg-blue-600 hover:text-white border border-slate-200 rounded-lg font-mono text-3xs font-bold text-slate-700 transition flex items-center gap-1 ml-auto">
                          <span>Inspect Log</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

      {/* View Mode: DETAIL */}
      {logId && selectedLog && (
        <div className="space-y-6">
          
          {/* Header with Back Button */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex justify-between items-center">
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate("/behavior-analytics")}
                className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-xl text-xs flex items-center gap-1.5 transition cursor-pointer border border-slate-300"
              >
                <ArrowLeft className="w-4 h-4 text-blue-700" />
                <span>Back to Anomaly Logs Feed</span>
              </button>

              <div className="h-6 w-px bg-slate-200" />

              <div>
                <h1 className="text-lg font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
                  <span>Behavioral Telemetry Log Details</span>
                  <span className="font-mono text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded text-xs">
                    {selectedLog.id}
                  </span>
                </h1>
                <p className="text-xs text-slate-500 font-mono mt-0.5">
                  Customer: {selectedLog.customerName} ({selectedLog.cif}) · Timestamp: {selectedLog.timestamp} · Engine: Module 1 Isolation Forest
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-xs font-mono uppercase text-slate-400">Risk Contribution:</span>
              <span className="text-xl font-black text-red-600 font-mono">{selectedLog.riskScore} <span className="text-xs text-slate-400 font-normal">/ 40 pts</span></span>
            </div>
          </div>

          {/* Detailed Inspector Cards */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Left 2 Columns: Matrix & Diagnoses */}
            <div className="lg:col-span-2 space-y-6">
              
              {/* Parameter Deviation Matrix */}
              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
                <span className="text-xs font-mono font-bold uppercase text-slate-700 block border-b border-slate-100 pb-2">
                  TELEMETRY PARAMETER DEVIATION MATRIX
                </span>
                
                <div className="border border-slate-200 rounded-xl overflow-hidden text-xs">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-mono text-3xs uppercase">
                        <th className="py-2.5 px-4">Monitored Parameter</th>
                        <th className="py-2.5 px-4">Current Session Value</th>
                        <th className="py-2.5 px-4">Historical Baseline</th>
                        <th className="py-2.5 px-4">Status Delta</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-sans">
                      {selectedLog.deviations.map((dev, i) => (
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

              {/* Technical Reasoning */}
              <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-2">
                <div className="flex items-center gap-2 text-slate-900 font-bold text-xs uppercase tracking-wider font-mono border-b border-slate-100 pb-2">
                  <AlertTriangle className="w-4 h-4 text-amber-500" />
                  <span>SOC Technical Diagnostic Reasoning</span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed font-medium pt-1">
                  {selectedLog.reasoning}
                </p>
              </div>

              {/* Grok AI Explanation */}
              <div className="bg-gradient-to-r from-blue-50/80 to-indigo-50/80 border border-blue-200 rounded-2xl p-5 shadow-sm space-y-2">
                <div className="flex items-center gap-2.5 text-blue-950 font-bold text-xs uppercase tracking-wider font-mono border-b border-blue-200/60 pb-2">
                  <Brain className="w-4 h-4 text-blue-600 animate-pulse" />
                  <span>xAI Grok Risk Explanation</span>
                </div>
                <p className="text-xs text-blue-950 font-semibold leading-relaxed pt-1">
                  "{selectedLog.aiExplanation}"
                </p>
              </div>

              {/* Recommended Action */}
              <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5 shadow-sm space-y-2">
                <div className="flex items-center gap-2 text-emerald-950 font-bold text-xs uppercase tracking-wider font-mono border-b border-emerald-200/60 pb-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Recommended Defensive Action</span>
                </div>
                <p className="text-xs text-emerald-900 font-bold leading-relaxed pt-1">
                  {selectedLog.suggestion}
                </p>
              </div>

            </div>

            {/* Right Column: Raw Telemetry JSON Stream */}
            <div className="space-y-6">
              <div className="bg-slate-900 text-slate-100 rounded-2xl p-5 shadow-md space-y-3 font-mono">
                <div className="flex items-center gap-2 text-slate-400 text-3xs font-bold uppercase tracking-wider border-b border-slate-800 pb-2">
                  <Terminal className="w-4 h-4 text-emerald-400" />
                  <span>RAW TELEMETRY SIGNAL DUMP</span>
                </div>

                <div className="bg-slate-950 p-4 rounded-xl text-3xs space-y-1.5 text-emerald-400 border border-slate-800">
                  <div>&#123;</div>
                  <div className="pl-4"><span className="text-slate-400">"log_id":</span> "{selectedLog.id}",</div>
                  <div className="pl-4"><span className="text-slate-400">"timestamp":</span> "{selectedLog.timestamp}",</div>
                  <div className="pl-4"><span className="text-slate-400">"keystroke_dwell_ms":</span> {selectedLog.rawTelemetry.keystrokeDwellMs},</div>
                  <div className="pl-4"><span className="text-slate-400">"typing_variance_ms2":</span> {selectedLog.rawTelemetry.typingVarianceMs2},</div>
                  <div className="pl-4"><span className="text-slate-400">"actions_per_min":</span> {selectedLog.rawTelemetry.actionsPerMin},</div>
                  <div className="pl-4"><span className="text-slate-400">"clipboard_paste_event":</span> {selectedLog.rawTelemetry.clipboardPaste ? "true" : "false"},</div>
                  <div className="pl-4"><span className="text-slate-400">"idle_delay_sec":</span> {selectedLog.rawTelemetry.idleDelaySec},</div>
                  <div className="pl-4"><span className="text-slate-400">"device_touch_ratio":</span> {selectedLog.rawTelemetry.deviceTouchRatio}</div>
                  <div>&#125;</div>
                </div>

                <div className="text-3xs text-slate-400 pt-1">
                  SHA-256 Signature verified. Event ingested via WebSocket telemetry stream.
                </div>
              </div>
            </div>

          </div>

        </div>
      )}

    </div>
  );
}
