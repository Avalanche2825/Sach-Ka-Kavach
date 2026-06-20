import React, { useState } from "react";
import { UserSession } from "../types.js";
import { ShieldAlert, HelpCircle, UserX, UserCheck, RefreshCw, Key, Mail, Phone, Compass, AlertCircle } from "lucide-react";
import { motion } from "motion/react";
import { useToast } from "./ToastProvider.tsx";
import MethodologyBanner from "./layout/MethodologyBanner.tsx";

interface AccountRecoveryPanelProps {
  customers: UserSession[];
  onRecoveryTriggered: () => void;
}

export default function AccountRecoveryPanel({ customers, onRecoveryTriggered }: AccountRecoveryPanelProps) {
  const { showToast } = useToast();
  const [selectedCif, setSelectedCif] = useState("");
  const [recoveryType, setRecoveryType] = useState("password_reset");
  const [newValue, setNewValue] = useState("");

  // Contextual anomaly parameters
  const [spoofLocation, setSpoofLocation] = useState("Lagos, NG");
  const [spoofIP, setSpoofIP] = useState("103.88.23.99");
  const [isEmulator, setIsEmulator] = useState(true);

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any | null>(null);

  const handleTriggerRecovery = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCif || !newValue) {
      showToast("Please select a target account and provide the new attribute value.", "warning");
      return;
    }

    setLoading(true);
    setResult(null);

    const matchCust = customers.find(u => u.cif === selectedCif);

    try {
      const response = await fetch("/api/security/recovery-attempt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cif: selectedCif,
          recoveryType,
          newValue,
          mockIP: spoofIP,
          mockDevice: isEmulator ? "Android Genymotion Emulator" : "iOS Client Core",
          mockLocation: spoofLocation
        })
      });
      const data = await response.json();
      if (response.ok) {
        setResult(data);
        onRecoveryTriggered();
      } else {
        showToast(data.error || "Override request exception.", "error");
      }
    } catch (err) {
      showToast("Error contacting security authentication controller.", "error");
    } finally {
      setLoading(false);
    }
  };

  const getLabelAndPlaceholder = () => {
    switch (recoveryType) {
      case "password_reset":
        return { label: "New Protected Password", placeholder: "e.g. h92f-asV9-2026x" };
      case "mobile_change":
        return { label: "New Authorized Mobile Number", placeholder: "e.g. +91 99000 12345" };
      default:
        return { label: "New Primary Verification Email", placeholder: "e.g. secure.pook@gmail.com" };
    }
  };

  return (
    <div className="space-y-6">
      <MethodologyBanner pageId="recovery" />

      <div id="account-recovery-module" className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* 1. Recovery Entry Controls */}
        <div className="lg:col-span-5 bg-white rounded-xl border border-slate-200 p-6 shadow-sm flex flex-col justify-between min-h-[480px]">
          <div>
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2 mb-4 border-b border-slate-100 pb-3">
              <UserX className="w-4 h-4 text-red-600 animate-pulse" />
              Account Recovery Threat Audit
            </h3>

            <form onSubmit={handleTriggerRecovery} className="space-y-4 text-xs">

              {/* Target account selector */}
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Target Banking Account</label>
                <select
                  value={selectedCif}
                  onChange={(e) => setSelectedCif(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none bg-white"
                >
                  <option value="">-- Choose Account (CIF) --</option>
                  {customers.map(c => (
                    <option key={c.cif} value={c.cif}>{c.name} ({c.cif})</option>
                  ))}
                </select>
              </div>

              {/* Recovery Attribute Select */}
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Restructuring Attribute</label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setRecoveryType("password_reset")}
                    className={`py-2 text-center border rounded-lg flex flex-col items-center gap-1 text-[10px] cursor-pointer ${recoveryType === "password_reset" ? "bg-blue-50/50 border-blue-400 text-blue-750 font-bold" : "border-slate-200 hover:bg-slate-50"
                      }`}
                  >
                    <Key className="w-3.5 h-3.5" /> Pass Reset
                  </button>
                  <button
                    type="button"
                    onClick={() => setRecoveryType("mobile_change")}
                    className={`py-2 text-center border rounded-lg flex flex-col items-center gap-1 text-[10px] cursor-pointer ${recoveryType === "mobile_change" ? "bg-blue-50/50 border-blue-400 text-blue-750 font-bold" : "border-slate-200 hover:bg-slate-50"
                      }`}
                  >
                    <Phone className="w-3.5 h-3.5" /> Mob Change
                  </button>
                  <button
                    type="button"
                    onClick={() => setRecoveryType("email_change")}
                    className={`py-2 text-center border rounded-lg flex flex-col items-center gap-1 text-[10px] cursor-pointer ${recoveryType === "email_change" ? "bg-blue-50/50 border-blue-400 text-blue-750 font-bold" : "border-slate-200 hover:bg-slate-50"
                      }`}
                  >
                    <Mail className="w-3.5 h-3.5" /> Email Change
                  </button>
                </div>
              </div>

              {/* Input target value */}
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">{getLabelAndPlaceholder().label}</label>
                <input
                  type="text"
                  placeholder={getLabelAndPlaceholder().placeholder}
                  value={newValue}
                  onChange={(e) => setNewValue(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              {/* Setup situations */}
              <div className="bg-slate-50 p-4 rounded-lg space-y-3 border border-slate-200/65">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1 font-mono">
                  <Compass className="w-3.5 h-3.5 text-slate-500" /> Anomalous Context Matrix
                </span>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[9px] text-slate-400 uppercase font-bold tracking-wider mb-0.5">Spoof IP Coordinates</label>
                    <input
                      type="text"
                      value={spoofIP}
                      onChange={(e) => setSpoofIP(e.target.value)}
                      className="w-full p-2 border border-slate-200 rounded-md bg-white text-3xs font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] text-slate-400 uppercase font-bold tracking-wider mb-0.5">Spoof Geolocation</label>
                    <select
                      value={spoofLocation}
                      onChange={(e) => setSpoofLocation(e.target.value)}
                      className="w-full p-2 border border-slate-200 bg-white rounded-md text-3xs"
                    >
                      <option value="Lagos, NG">Lagos, NG</option>
                      <option value="Kiev, UA">Kiev, UA</option>
                      <option value="Moscow, RU">Moscow, RU</option>
                      <option value="Toronto, CA">Toronto, CA</option>
                      <option value="Same Location">Match Customer Original</option>
                    </select>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 pt-1 text-slate-600 select-none">
                  <input
                    type="checkbox"
                    id="chk-emulator"
                    checked={isEmulator}
                    onChange={(e) => setIsEmulator(e.target.checked)}
                    className="accent-blue-600 cursor-pointer scale-90"
                  />
                  <label htmlFor="chk-emulator" className="text-3xs font-bold uppercase tracking-wider text-slate-500 cursor-pointer">Test Android Genymotion Emulator</label>
                </div>
              </div>

            </form>
          </div>

          <button
            onClick={handleTriggerRecovery}
            disabled={loading || !selectedCif}
            className="w-full py-2.5 mt-4 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-sm disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            {loading ? "Running checks..." : "Execute Attribute Override"}
          </button>
        </div>

        {/* 2. Response Audit result Panel */}
        <div className="lg:col-span-7 bg-white rounded-xl border border-slate-200 p-6 shadow-sm min-h-[480px] flex flex-col justify-between">
          {!result ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-6 text-slate-400 select-none">
              <HelpCircle className="w-12 h-12 text-slate-300 mb-2 animate-pulse" />
              <p className="font-bold text-slate-700 text-sm uppercase tracking-wider">Awaiting Action</p>
              <p className="text-xs mt-1 text-slate-500 max-w-xs">
                Trigger an account attribute change to view immediate response metrics, trust score changes, and logged SOC threats.
              </p>
            </div>
          ) : (
            <div className="flex-1 flex flex-col justify-between h-full">
              <div>
                <div className="flex justify-between items-start mb-4 pb-4 border-b border-slate-200">
                  <div>
                    <span className="text-[10px] font-bold text-red-500 uppercase tracking-widest font-mono">THREAT DETECTED REPORT</span>
                    <h4 className="text-sm font-bold text-slate-900 mt-0.5">Acc Bypass Interception Analysis</h4>
                  </div>
                  <span className={`px-2.5 py-1 rounded text-[10px] font-bold font-mono tracking-wider ${result.alertType === "CRITICAL_THREAT_DETECTION"
                      ? "bg-red-50 text-red-800 border border-red-200"
                      : "bg-amber-50 text-amber-800 border border-amber-200"
                    }`}>
                    {result.alertType === "CRITICAL_THREAT_DETECTION" ? "🚨 CRITICAL THREAT FLAG" : "⚠️ MONITORED PASS"}
                  </span>
                </div>

                {/* Score breakdown logs */}
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="border border-slate-200/80 bg-slate-50 p-3 rounded-lg text-center">
                    <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Aggregated Threat Score</p>
                    <p className="text-xl font-extrabold text-red-650 mt-1 font-mono">{result.riskScore}%</p>
                  </div>
                  <div className="border border-slate-200/80 bg-slate-50 p-3 rounded-lg text-center">
                    <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Demoted Customer Trust</p>
                    <p className="text-xl font-extrabold text-amber-600 mt-1 font-mono">{result.newTrustScore}%</p>
                  </div>
                </div>

                {/* Discovered infractions */}
                <div className="space-y-2 mb-4">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Intercepted Security Exceptions</p>
                  {result.riskFactors.length === 0 ? (
                    <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-500 text-xs text-center pr-1">
                      No contextual mismatches. Routine configuration modification initiated.
                    </div>
                  ) : (
                    result.riskFactors.map((rf: string, idx: number) => (
                      <div key={idx} className="flex items-center gap-2 text-xs bg-red-50 border border-red-100/50 p-2.5 rounded-lg text-red-800 font-semibold select-none">
                        <AlertCircle className="w-3.5 h-3.5 text-red-600 shrink-0" />
                        <span>{rf}</span>
                      </div>
                    ))
                  )}
                </div>

                {/* Warning SOC Banner */}
                {result.alertType === "CRITICAL_THREAT_DETECTION" && (
                  <div className="p-4 bg-slate-900 text-white rounded-lg border border-red-800/80">
                    <h5 className="font-bold text-[10px] flex items-center gap-1 text-red-400 uppercase font-mono tracking-wider">
                      <ShieldAlert className="w-4 h-4 text-red-400" /> Triggering Automated SOC Escapes
                    </h5>
                    <p className="text-[10px] text-slate-300 mt-1 leading-relaxed">
                      Continuous identity sensors identified an unauthorized credentials modification velocity within abnormal parameters. Security keys locked, and automated SMS reports triggered to SEC administrators.
                    </p>
                  </div>
                )}
              </div>

              <div className="pt-3 border-t border-slate-200 text-3xs text-slate-400 flex justify-between items-center bg-slate-50 -mx-6 -mb-6 p-4 rounded-b-xl shrink-0 select-none">
                <span className="font-mono">Ledger Code: SEC_RECOVERY_ENG_v4.1</span>
                <span className="font-bold text-red-650 tracking-wide font-mono uppercase">SECURE DISCHARGE RECORDED</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
