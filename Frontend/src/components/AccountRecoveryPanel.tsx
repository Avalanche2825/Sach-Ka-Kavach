import React, { useState, useEffect } from "react";
import { UserSession } from "../types.js";
import {
  ShieldAlert, Key, Mail, Phone, RefreshCw,
  Lock, Building, CheckCircle2, ChevronRight, AlertCircle, AlertTriangle, Brain, User, Laptop
} from "lucide-react";
import { useToast } from "./ToastProvider.tsx";

interface Props {
  customers: UserSession[];
  onRecoveryTriggered: () => void;
}

export default function AccountRecoveryPanel({ customers, onRecoveryTriggered }: Props) {
  const { showToast } = useToast();
  const [selectedCif, setSelectedCif] = useState(customers[0]?.cif || "CIF100002");
  const [recoveryType, setRecoveryType] = useState("FORGOT_PASSWORD");

  // Risk parameters
  const [isSimSwapRecent, setIsSimSwapRecent] = useState(true);
  const [isNewDevice, setIsNewDevice] = useState(true);
  const [isVPN, setIsVPN] = useState(true);

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any | null>(null);

  // Real backend queue
  const [recoveryQueue, setRecoveryQueue] = useState<any[]>([]);
  const [selectedItem, setSelectedItem] = useState<any | null>(null);

  // Grok AI narrative for selected recovery item
  const [grokNarrative, setGrokNarrative] = useState<string>("");
  const [grokLoading, setGrokLoading] = useState<boolean>(false);

  const fetchQueue = () => {
    fetch("/api/recovery/queue")
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setRecoveryQueue(data);
          if (data.length > 0 && !selectedItem) {
            setSelectedItem(data[0]);
            fetchGrokForRecovery(data[0]);
          }
        }
      })
      .catch(console.error);
  };

  useEffect(() => {
    fetchQueue();
  }, []);

  const fetchGrokForRecovery = async (item: any) => {
    if (!item) return;
    setGrokLoading(true);
    try {
      const res = await fetch("/api/risk/narrative", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          riskScore: item.recoveryRiskScore || 90,
          factors: item.reasons || ["Carrier SIM swap registered within 72 hours"],
          customerName: item.customerName || item.cif,
          receiverName: `Recovery (${item.recoveryType || 'PASSWORD'})`,
          amount: 0
        })
      });
      const data = await res.json();
      if (data.narrative) setGrokNarrative(data.narrative);
    } catch (e) {
      console.warn("Grok AI narrative error:", e);
    } finally {
      setGrokLoading(false);
    }
  };

  const handleSelectQueueItem = (item: any) => {
    setSelectedItem(item);
    fetchGrokForRecovery(item);
  };

  const handleTriggerRecovery = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);

    const matchCust = customers.find(u => u.cif === selectedCif);

    try {
      const response = await fetch("/api/recovery/evaluate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cif: selectedCif,
          customerName: matchCust?.name || "Vikram Mehta",
          accountNumber: matchCust?.cif || "89341029384",
          recoveryType,
          deviceHash: isNewDevice ? "HASH_UNRECOGNIZED_DEVICE_99" : "HASH_KNOWN_DEVICE_01",
          ipAddress: isVPN ? "185.220.101.5 (VPN Exit)" : "103.88.24.12",
          isNewDevice,
          isVPN,
          isSimSwapRecent,
          behavioralRiskScore: isNewDevice ? 25 : 5,
          deviceRiskScore: isVPN ? 18 : 2,
          identityRiskScore: isSimSwapRecent ? 15 : 0,
        })
      });

      const data = await response.json();
      setResult(data);
      onRecoveryTriggered();
      fetchQueue();

      if (data.actionRequired === "BRANCH_VERIFICATION_REQUIRED" || data.status === "REJECTED") {
        showToast("Recovery blocked due to 72h SIM Swap flag. Physical branch verification required.", "error");
      } else {
        showToast(`Recovery request submitted: ${data.message}`, "info");
      }
    } catch (err) {
      showToast("Error contacting recovery shield service.", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F9FB] text-slate-800 p-6 space-y-6 select-none font-sans">
      
      {/* Header */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-orange-50 text-[#F26522] rounded-xl border border-orange-200">
            <Key className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Secure Recovery Shield & Log Feed (Module 4)</h1>
            <p className="text-xs text-slate-500 font-mono mt-0.5">
              Account Recovery Risk Scoring · 72-Hour SIM Swap Hard Gate Policy
            </p>
          </div>
        </div>

        <button onClick={fetchQueue} className="px-3.5 py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-700 flex items-center gap-1.5 transition cursor-pointer">
          <RefreshCw className="w-3.5 h-3.5" /> Refresh Queue
        </button>
      </div>

      {/* STAGE 1: REAL RECOVERY ATTEMPTS LOG TABLE */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-3">
        <div className="flex justify-between items-center border-b border-slate-100 pb-2">
          <span className="text-xs font-mono font-bold uppercase text-slate-700">
            STAGE 1: RECOVERY REQUEST LOGS & ATTEMPT FEED (GET /api/recovery/queue)
          </span>
          <span className="text-2xs font-mono text-slate-500">
            Click any row to inspect deep parameters & Grok AI diagnosis
          </span>
        </div>

        {recoveryQueue.length === 0 ? (
          <div className="text-center py-8 text-xs text-slate-400 font-mono">
            No recovery attempts logged in backend database yet. Trigger an attempt below.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-sans">
              <thead>
                <tr className="border-b border-slate-200 text-slate-400 text-2xs font-mono uppercase">
                  <th className="py-2.5 px-3">Customer</th>
                  <th className="py-2.5 px-3">CIF</th>
                  <th className="py-2.5 px-3">Recovery Type</th>
                  <th className="py-2.5 px-3">Risk Score</th>
                  <th className="py-2.5 px-3">Decision Action</th>
                  <th className="py-2.5 px-3">Timestamp</th>
                  <th className="py-2.5 px-3 text-right">Inspect</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recoveryQueue.map((item, idx) => {
                  const isSelected = selectedItem?._id === item._id || selectedItem?.cif === item.cif;
                  const isBlocked = item.decisionAction === "BRANCH_VERIFICATION_REQUIRED" || item.decisionAction === "BLOCK";
                  return (
                    <tr
                      key={item._id || idx}
                      onClick={() => handleSelectQueueItem(item)}
                      className={`transition cursor-pointer ${
                        isSelected ? 'bg-blue-50/80 font-semibold' : 'hover:bg-slate-50'
                      }`}
                    >
                      <td className="py-3 px-3 font-bold text-slate-900">{item.customerName || item.cif}</td>
                      <td className="py-3 px-3 font-mono text-2xs text-slate-600">{item.cif}</td>
                      <td className="py-3 px-3 font-mono text-2xs text-slate-600">{item.recoveryType || "FORGOT_PASSWORD"}</td>
                      <td className="py-3 px-3">
                        <span className={`px-2 py-0.5 rounded font-mono text-2xs font-bold ${
                          (item.recoveryRiskScore || 50) >= 80 ? 'bg-red-600 text-white' : 'bg-emerald-600 text-white'
                        }`}>
                          {item.recoveryRiskScore || 50}/100
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        <span className={`px-2 py-0.5 rounded-full text-2xs font-mono font-bold ${
                          isBlocked ? 'bg-red-100 text-red-700 border border-red-200' : 'bg-amber-100 text-amber-800 border border-amber-200'
                        }`}>
                          {item.decisionAction || 'OTP_REQUIRED'}
                        </span>
                      </td>
                      <td className="py-3 px-3 font-mono text-2xs text-slate-500">
                        {new Date(item.timestamp || Date.now()).toLocaleTimeString()}
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

      {/* STAGE 2 & STAGE 3: SELECTED RECOVERY EVENT INSPECTOR & GROK AI NARRATIVE */}
      {selectedItem && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Left 2 Cols: Deep Parameter Schema & Grok AI Breakdown */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Hard Block Banner if SIM Swap present */}
            {selectedItem.decisionAction === "BRANCH_VERIFICATION_REQUIRED" && (
              <div className="bg-red-50 border-2 border-red-300 rounded-2xl p-5 shadow-sm space-y-2">
                <div className="flex items-center gap-3 text-red-700">
                  <ShieldAlert className="w-6 h-6 shrink-0 animate-pulse" />
                  <div>
                    <h3 className="font-extrabold text-sm">SECURITY LOCKOUT: 72-Hour SIM Swap Hard Gate Active</h3>
                    <p className="text-xs text-red-700 mt-0.5">
                      Carrier SIM swap detected within 72 hours. Online self-service recovery is hard-blocked per RBI Fraud Risk Guidelines.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Parameter deviations comparison table */}
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
              <span className="text-xs font-mono font-bold uppercase text-slate-700 block border-b border-slate-100 pb-2">
                Recovery Signature Deviation Matrix (CIF: {selectedItem.cif})
              </span>
              
              <div className="border border-slate-200 rounded-xl overflow-hidden text-xs">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-mono text-3xs uppercase">
                      <th className="py-2.5 px-4">Recovery Vector</th>
                      <th className="py-2.5 px-4">Current Request</th>
                      <th className="py-2.5 px-4">Customer Baseline</th>
                      <th className="py-2.5 px-4">Risk Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-sans">
                    <tr className="hover:bg-slate-50/50">
                      <td className="py-3 px-4 font-bold text-slate-800">Carrier SIM Swap (&lt;72h)</td>
                      <td className="py-3 px-4 font-mono font-bold text-red-600">FLAGGED (14h ago)</td>
                      <td className="py-3 px-4 font-mono text-slate-600">No Swap Baseline</td>
                      <td className="py-3 px-4 font-mono font-extrabold text-red-600">CRITICAL</td>
                    </tr>
                    <tr className="hover:bg-slate-50/50">
                      <td className="py-3 px-4 font-bold text-slate-800">Device Fingerprint</td>
                      <td className="py-3 px-4 font-mono font-bold text-red-600">Unrecognized Hash</td>
                      <td className="py-3 px-4 font-mono text-slate-600">HASH_KNOWN_DEVICE_01</td>
                      <td className="py-3 px-4 font-mono font-extrabold text-red-600">CRITICAL</td>
                    </tr>
                    <tr className="hover:bg-slate-50/50">
                      <td className="py-3 px-4 font-bold text-slate-800">ISP Network Context</td>
                      <td className="py-3 px-4 font-mono font-bold text-amber-600">VPN Exit Active</td>
                      <td className="py-3 px-4 font-mono text-slate-600">Residential ISP</td>
                      <td className="py-3 px-4 font-mono font-extrabold text-amber-600">ELEVATED</td>
                    </tr>
                    <tr className="hover:bg-slate-50/50">
                      <td className="py-3 px-4 font-bold text-slate-800">Cumulative Risk Score</td>
                      <td className="py-3 px-4 font-mono font-bold text-red-600">{selectedItem.recoveryRiskScore || 90} / 100 Pts</td>
                      <td className="py-3 px-4 font-mono text-slate-600">&lt; 20 Pts Threshold</td>
                      <td className="py-3 px-4 font-mono font-extrabold text-red-600">CRITICAL</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* GROK AI RECOVERY EXPLANATION CARD */}
            <div className="bg-gradient-to-r from-blue-50/80 to-indigo-50/80 border border-blue-200 rounded-2xl p-5 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-blue-900 font-bold text-xs uppercase tracking-wider font-mono">
                  <Brain className="w-4 h-4 text-blue-600 animate-pulse" /> Grok AI Recovery Risk Analysis
                </div>
                <span className="text-[10px] font-mono bg-blue-100 border border-blue-300 text-blue-800 px-2 py-0.5 rounded">
                  MODULE 4 RECOVERY DIAGNOSIS
                </span>
              </div>

              {grokLoading ? (
                <div className="flex items-center gap-2 text-xs text-slate-500 font-mono py-4">
                  <RefreshCw className="w-4 h-4 animate-spin text-blue-600" /> Querying Grok AI for recovery policy evaluation...
                </div>
              ) : (
                <div className="bg-white border border-blue-200 rounded-xl p-4 text-xs leading-relaxed text-slate-800 font-sans space-y-2 shadow-xs">
                  <p className="font-semibold text-blue-950">"{grokNarrative || `Grok AI evaluated recovery attempt for ${selectedItem.customerName || selectedItem.cif}: Recent carrier SIM swap combined with unrecognized hardware fingerprint elevated recovery risk score to ${selectedItem.recoveryRiskScore || 90}/100.`}"</p>
                </div>
              )}
            </div>

            {/* Technical reasoning explanation */}
            <div className="space-y-2 bg-slate-50 border border-slate-200 p-4.5 rounded-xl text-xs">
              <div className="flex items-center gap-2 text-slate-900 font-bold uppercase tracking-wider text-[10px] font-mono">
                <AlertTriangle className="w-4 h-4 text-amber-500" />
                <span>SOC Technical Diagnostic Reasoning</span>
              </div>
              <p className="text-slate-600 leading-relaxed font-medium">
                Bypass/SIM Hijack warning: The password recovery request was submitted immediately after a cellular SIM porting event from an unrecognized hardware device hash and a commercial VPN exit address. Self-service recovery is hard-locked to protect client capital.
              </p>
            </div>

            {/* Action suggestion recommendation */}
            <div className="space-y-3 bg-emerald-50 border border-emerald-200 p-4.5 rounded-xl text-xs">
              <div className="flex items-center gap-2 text-emerald-950 font-bold uppercase tracking-wider text-[10px] font-mono">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Recommended Defensive Action</span>
              </div>
              <p className="text-emerald-900 font-bold leading-relaxed">
                Deny online self-service reset. Direct target customer to local physical branch verification with original identity credentials (Aadhaar & PAN cards).
              </p>
            </div>

          </div>

          {/* Right Column: Trigger Test Evaluator */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
            <span className="text-xs font-mono font-bold uppercase text-slate-700 border-b border-slate-100 pb-2 block">
              TRIGGER NEW RECOVERY EVALUATION TEST
            </span>

            <form onSubmit={handleTriggerRecovery} className="space-y-4">
              <div>
                <label className="block text-2xs font-mono font-bold uppercase text-slate-500 mb-1">Target Customer CIF</label>
                <select
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 font-mono"
                  value={selectedCif}
                  onChange={e => setSelectedCif(e.target.value)}
                >
                  {customers.map(c => (
                    <option key={c.cif} value={c.cif}>{c.name} ({c.cif}) {c.isSimSwapWithin72h ? "⚠️ SIM Swap" : ""}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-2xs font-mono font-bold uppercase text-slate-500 mb-1">Recovery Type</label>
                <select
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 font-sans"
                  value={recoveryType}
                  onChange={e => setRecoveryType(e.target.value)}
                >
                  <option value="FORGOT_PASSWORD">Reset Password</option>
                  <option value="FORGOT_MPIN">Reset MPIN</option>
                  <option value="CHANGE_MOBILE">Change Mobile #</option>
                  <option value="CHANGE_EMAIL">Change Email</option>
                </select>
              </div>

              <div className="bg-slate-50 border border-slate-200 p-3 rounded-xl space-y-2">
                <span className="text-2xs font-mono font-bold uppercase text-slate-500 block">Context Modifiers</span>
                <label className="flex items-center gap-2 text-xs text-slate-800 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isSimSwapRecent}
                    onChange={e => setIsSimSwapRecent(e.target.checked)}
                    className="accent-red-600"
                  />
                  <span className="font-semibold text-red-700">Carrier SIM Swap (&lt;72h)</span>
                </label>
                <label className="flex items-center gap-2 text-xs text-slate-800 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isNewDevice}
                    onChange={e => setIsNewDevice(e.target.checked)}
                    className="accent-amber-600"
                  />
                  <span>Unrecognized New Device</span>
                </label>
                <label className="flex items-center gap-2 text-xs text-slate-800 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isVPN}
                    onChange={e => setIsVPN(e.target.checked)}
                    className="accent-amber-600"
                  />
                  <span>Commercial VPN IP</span>
                </label>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 bg-blue-700 hover:bg-blue-800 text-white font-bold text-xs rounded-xl shadow-sm transition flex items-center justify-center gap-2 cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                Evaluate Recovery Request
              </button>
            </form>
          </div>

        </div>
      )}

    </div>
  );
}
