import React, { useState } from "react";
import { UserSession, Transaction, Guardian, AuditLog } from "../types.js";
import { ShieldCheck, ShieldAlert, KeyRound, Smartphone, Search, AlertCircle, Sparkles, Send, CheckCircle, XCircle } from "lucide-react";
import { motion } from "motion/react";
import { useToast } from "./ToastProvider.tsx";
import MethodologyBanner from "./layout/MethodologyBanner.tsx";
import { clientCalculateRisk } from "../utils/mockData.ts";



interface TransactionFormProps {
  selectedCustomer: UserSession | null;
  onRefreshHistory: () => void;
  guardian: Guardian | null;
}

export default function TransactionForm({
  selectedCustomer,
  onRefreshHistory,
  guardian
}: TransactionFormProps) {
  const { showToast } = useToast();
  // Form fields
  const [receiverName, setReceiverName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [amount, setAmount] = useState("");
  
  // Verification states
  const [createdTx, setCreatedTx] = useState<Transaction | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // Step challenges
  const [challengeOTP, setChallengeOTP] = useState("");
  const [challengeCIF, setChallengeCIF] = useState("");
  const [otpSent, setOtpSent] = useState<string | null>(null);
  const [challengeStatus, setChallengeStatus] = useState<"Initial" | "Verifying" | "Success" | "Rejected">("Initial");
  
  // Generated random OTP
  const triggerOtp = () => {
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    setOtpSent(code);
    showToast(`[SMS Gateway] Authentication OTP code sent to customer: ${code}`, "success");
  };

  const handleCreateTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomer) {
      setErrorMsg("Please select an active customer's profile before conducting a transfer.");
      return;
    }
    if (!receiverName || !accountNumber || !amount) {
      setErrorMsg("Please fill in receiver details and transfer volume.");
      return;
    }

    setSubmitting(true);
    setErrorMsg("");
    setCreatedTx(null);
    setChallengeStatus("Initial");
    setChallengeOTP("");
    setChallengeCIF("");
    setOtpSent(null);

    try {
      const response = await fetch("/api/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cif: selectedCustomer.cif,
          receiverName,
          accountNumber,
          amount: parseFloat(amount),
          currentIP: selectedCustomer.currentIP,
          currentDevice: selectedCustomer.currentDevice,
          currentLocation: selectedCustomer.currentLocation,
          isNewDevice: false
        })
      });
      const data = await response.json();
      if (response.ok) {
        setCreatedTx(data);
        if (data.status === "Approved") {
          setChallengeStatus("Success");
          onRefreshHistory();
        } else {
          // Trigger OTP immediately if required
          triggerOtp();
        }
      } else {
        setErrorMsg(data.error || "Failed to process evaluation.");
      }
    } catch (err) {
      // Standalone client-side mock evaluation fallback
      const risk = clientCalculateRisk(
        parseFloat(amount),
        selectedCustomer.avgTransactionAmount,
        false,
        false,
        receiverName
      );

      const mockTx: Transaction = {
        _id: `tx_mock_${Date.now()}`,
        timestamp: new Date().toISOString(),
        cif: selectedCustomer.cif,
        customerName: selectedCustomer.name,
        receiverName,
        accountNumber,
        amount: parseFloat(amount),
        riskScore: risk.riskScore,
        riskFactors: risk.factors,
        explanation: risk.explanation,
        status: risk.status
      };

      setCreatedTx(mockTx);
      
      const localTxsSaved = localStorage.getItem("sach_local_txs") || "[]";
      const localTxs = JSON.parse(localTxsSaved);
      localTxs.unshift(mockTx);
      localStorage.setItem("sach_local_txs", JSON.stringify(localTxs));

      const newAudit: AuditLog = {
        _id: `audit_mock_${Date.now()}`,
        timestamp: new Date().toISOString(),
        user: "SACH Kavach AI Engine",
        event: `Transaction check processed for ${selectedCustomer.cif}`,
        riskScore: risk.riskScore,
        riskFactors: risk.factors,
        decision: risk.status === "Approved" ? "LOGGED" as const : "ESCALATED_TO_SOC" as const
      };
      const localAuditsSaved = localStorage.getItem("sach_local_audits") || "[]";
      const localAudits = JSON.parse(localAuditsSaved);
      localAudits.unshift(newAudit);
      localStorage.setItem("sach_local_audits", JSON.stringify(localAudits));

      if (risk.status === "Approved") {
        setChallengeStatus("Success");
        onRefreshHistory();
      } else {
        triggerOtp();
      }
    } finally {
      setSubmitting(false);
    }
  };

  // Challenge approval handler
  const handleVerifyOverride = async () => {
    if (!createdTx) return;
    
    // Low check values
    const score = createdTx.riskScore;

    // 1. Medium check - OTP
    if (score > 30) {
      if (!otpSent || challengeOTP !== otpSent) {
        showToast("Verification failed: OTP code mismatch!", "error");
        return;
      }
    }

    // 2. High check - OTP + CIF
    if (score > 60) {
      if (challengeCIF.trim().toUpperCase() !== selectedCustomer?.cif.trim().toUpperCase()) {
        showToast("Verification failed: Customer CIF signature mismatch!", "error");
        return;
      }
    }

    // 3. Critical check - OTP + CIF + Guardian
    if (score > 80) {
      if (!guardian) {
        showToast("Verification aborted: This critical transaction requires a pre-registered guardian's approval footprint. Register a guardian first on the Guardian tab!", "error");
        return;
      }
      // Requesting Guardian acceptance
      showToast(`[Guardian Overwatch Link] Sentinel alert sent safely to guardian ${guardian.guardianName}. Requesting secure remote authorization...`, "info");
    }

    setSubmitting(true);
    try {
      const response = await fetch(`/api/transactions/${createdTx._id}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          approverType: score > 80 ? "guardian" : "customer"
        })
      });
      if (response.ok) {
        setChallengeStatus("Success");
        onRefreshHistory();
      } else {
        showToast("Challenge authorization endpoint returned error credentials.", "error");
      }
    } catch (err) {
      // Offline fallback
      // Update local storage transaction to Approved
      const localTxsSaved = localStorage.getItem("sach_local_txs") || "[]";
      let localTxs: Transaction[] = JSON.parse(localTxsSaved);
      localTxs = localTxs.map(tx => tx._id === createdTx._id ? { ...tx, status: 'Approved' } : tx);
      localStorage.setItem("sach_local_txs", JSON.stringify(localTxs));

      // Append override check audit log
      const newAudit: AuditLog = {
        _id: `audit_mock_${Date.now()}`,
        timestamp: new Date().toISOString(),
        user: score > 80 ? "Guardian Mobile Signature" : "Customer Device Signature",
        event: `Step-up authentication verify check passed for ${selectedCustomer?.name}`,
        riskScore: score,
        riskFactors: [],
        decision: "APPROVED_POST_VERIFICATION" as const
      };
      const localAuditsSaved = localStorage.getItem("sach_local_audits") || "[]";
      const localAudits = JSON.parse(localAuditsSaved);
      localAudits.unshift(newAudit);
      localStorage.setItem("sach_local_audits", JSON.stringify(localAudits));

      setChallengeStatus("Success");
      onRefreshHistory();
    } finally {
      setSubmitting(false);
    }
  };

  // Custom reject / abort handler
  const handleAbort = async () => {
    if (!createdTx) return;
    setSubmitting(true);
    try {
      const response = await fetch(`/api/transactions/${createdTx._id}/reject`, {
        method: "POST",
        headers: { "Content-Type": "application/json" }
      });
      if (response.ok) {
        setChallengeStatus("Rejected");
        onRefreshHistory();
      }
    } catch (err) {
      // Offline fallback
      const localTxsSaved = localStorage.getItem("sach_local_txs") || "[]";
      let localTxs: Transaction[] = JSON.parse(localTxsSaved);
      localTxs = localTxs.map(tx => tx._id === createdTx._id ? { ...tx, status: 'Rejected' } : tx);
      localStorage.setItem("sach_local_txs", JSON.stringify(localTxs));

      const newAudit: AuditLog = {
        _id: `audit_mock_${Date.now()}`,
        timestamp: new Date().toISOString(),
        user: "Customer Device Signature",
        event: `Transaction challenge aborted by customer for ₹${createdTx.amount.toLocaleString()} to ${createdTx.receiverName}`,
        riskScore: createdTx.riskScore,
        riskFactors: ["Customer validation cancellation"],
        decision: "REJECTED_AND_BLOCKED" as const
      };
      const localAuditsSaved = localStorage.getItem("sach_local_audits") || "[]";
      const localAudits = JSON.parse(localAuditsSaved);
      localAudits.unshift(newAudit);
      localStorage.setItem("sach_local_audits", JSON.stringify(localAudits));

      setChallengeStatus("Rejected");
      onRefreshHistory();
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setReceiverName("");
    setAccountNumber("");
    setAmount("");
    setCreatedTx(null);
    setChallengeStatus("Initial");
  };

  return (
    <div className="space-y-6">
      <MethodologyBanner pageId="transactions" />
      
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6" id="transaction-module">
        {/* Selection Warning */}
        {!selectedCustomer && (
        <div className="md:col-span-12 p-4 bg-amber-50 border border-amber-200 text-amber-800 rounded-lg flex items-center gap-2 text-xs select-none">
          <AlertCircle className="w-4 h-4 text-amber-600" />
          <span>Please select an active customer profile using the <strong>Live Session Monitor</strong> index tab first.</span>
        </div>
      )}

      {/* Transaction Entry Form */}
      <div className="md:col-span-5 bg-white rounded-xl border border-slate-200 p-6 shadow-sm flex flex-col justify-between h-[520px]">
        <div>
          <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2 mb-4 border-b border-slate-100 pb-3">
            <Send className="w-4 h-4 text-blue-600" />
            New Escrow Transfer
          </h3>

          <form onSubmit={handleCreateTransaction} className="space-y-4">
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Target Receiver Full Name</label>
              <input
                type="text"
                placeholder="e.g. Priya Sharma"
                value={receiverName}
                onChange={(e) => setReceiverName(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={!!createdTx || !selectedCustomer}
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Target Account Number</label>
              <input
                type="text"
                placeholder="e.g. 50100293414"
                value={accountNumber}
                onChange={(e) => setAccountNumber(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={!!createdTx || !selectedCustomer}
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Transfer Volume (INR)</label>
              <div className="relative">
                <span className="absolute left-3 top-2 text-xs font-bold text-slate-400">₹</span>
                <input
                  type="number"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full pl-8 pr-3 py-2 border border-slate-200 rounded-lg text-xs font-bold focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={!!createdTx || !selectedCustomer}
                />
              </div>
            </div>

            {errorMsg && (
              <p className="text-xs text-red-650 font-medium bg-red-50 p-2.5 border border-red-100 rounded-lg">
                ⚠️ {errorMsg}
              </p>
            )}
          </form>
        </div>

        {selectedCustomer && (
          <div className="pt-4 border-t border-slate-100">
            {!createdTx ? (
              <button
                onClick={handleCreateTransaction}
                disabled={submitting}
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 duration-250 text-white font-bold rounded-lg text-xs flex items-center justify-center gap-2 cursor-pointer shadow-sm disabled:opacity-50"
              >
                {submitting ? "Evaluating Session Threat..." : "Trigger AI Policy Assessment"}
              </button>
            ) : (
              <button
                onClick={resetForm}
                className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg text-xs flex items-center justify-center gap-2 cursor-pointer transition-all"
              >
                Initiate Another Evaluation
              </button>
            )}
          </div>
        )}
      </div>

      {/* Trust Decision Overlays Panel */}
      <div className="md:col-span-7 bg-white rounded-xl border border-slate-200 p-6 shadow-sm min-h-[520px] flex flex-col justify-between">
        {!createdTx ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-6 text-slate-400 select-none">
            <ShieldCheck className="w-12 h-12 text-slate-300 mb-3 animate-pulse" />
            <p className="font-bold text-slate-700 text-sm uppercase tracking-wider">Escrow Pipeline Idle</p>
            <p className="text-xs mt-1 text-slate-500 max-w-sm">
              Please finalize a receiver and transfer volume on the left. The identity engine will instantly intercept potential compromise risks using zero-knowledge ML and LLM heuristics.
            </p>
          </div>
        ) : (
          <div className="flex-1 flex flex-col justify-between h-full">
            
            {/* Top Analysis Header */}
            <div>
              <div className="flex justify-between items-start mb-4 pb-4 border-b border-slate-200">
                <div>
                  <span className="text-[10px] font-bold text-blue-600 uppercase tracking-widest font-mono">EVALUATION SUMMARY</span>
                  <h4 className="text-base font-bold text-slate-900 mt-1">
                    Threat Analysis: <span className="font-mono text-xs block text-slate-500 font-semibold mt-0.5">Risk Score {createdTx.riskScore}/100</span>
                  </h4>
                </div>
                <div className={`px-2.5 py-1 rounded border text-[10px] font-bold font-mono tracking-wider ${
                  createdTx.riskScore > 80 
                    ? "bg-red-50 text-red-700 border-red-200" 
                    : createdTx.riskScore > 60 
                    ? "bg-orange-50 text-orange-700 border-orange-200" 
                    : createdTx.riskScore > 30 
                    ? "bg-amber-50 text-amber-700 border-amber-200" 
                    : "bg-emerald-50 text-emerald-700 border-emerald-200"
                }`}>
                  {createdTx.riskScore > 80 ? "CRITICAL RISK" : createdTx.riskScore > 60 ? "HIGH RISK" : createdTx.riskScore > 30 ? "MEDIUM RISK" : "LOW RISK"}
                </div>
              </div>

              {/* Bullet analysis justifications */}
              <div className="space-y-2 mb-4">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Identified Risk Indicators</p>
                {createdTx.riskFactors.map((rf, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs bg-slate-50 text-slate-700 border border-slate-200/60 p-2.5 rounded-lg font-medium">
                    <AlertCircle className="w-4 h-4 text-amber-500 shrink-0" />
                    <span>{rf}</span>
                  </div>
                ))}
              </div>

              {/* AI Context Reason */}
              <div className="bg-slate-50 p-4 rounded-lg mb-4 border border-slate-200/60">
                <p className="text-[10px] font-bold text-blue-500 uppercase tracking-widest flex items-center gap-1.5 mb-2 font-mono">
                  <Sparkles className="w-3.5 h-3.5 fill-current" />
                  AI Risk Justification
                </p>
                <p className="text-slate-650 text-xs italic">
                  "{createdTx.explanation || 'Verification pipeline ready.'}"
                </p>
              </div>
            </div>

            {/* Dynamic Step Challenge Area */}
            <div className="flex-1 flex flex-col justify-end">
              {challengeStatus === "Initial" && (
                <div className="mt-4 p-4 rounded-lg border border-slate-200 bg-slate-50/50">
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-3 flex items-center gap-1.5 border-b border-slate-105 pb-2">
                    <KeyRound className="w-4 h-4 text-blue-600" />
                    Required Multi-Tier Security Verification
                  </h4>

                  {/* 1. Medium: OTP verification */}
                  {createdTx.riskScore > 30 && (
                    <div className="space-y-3">
                      <div>
                        <div className="flex justify-between items-center mb-1">
                          <label className="text-[10px] font-bold text-slate-500 uppercase flex items-center gap-1">
                            <Smartphone className="w-3.5 h-3.5 text-blue-500" /> Enter 6 Digit Mobile OTP
                          </label>
                          <button
                            type="button"
                            onClick={triggerOtp}
                            className="text-[10px] text-blue-600 font-bold hover:underline cursor-pointer"
                          >
                            Resend Code
                          </button>
                        </div>
                        <input
                          type="text"
                          placeholder="Enter 6-digit OTP"
                          value={challengeOTP}
                          onChange={(e) => setChallengeOTP(e.target.value)}
                          className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-mono tracking-widest focus:ring-1 focus:ring-blue-500 focus:outline-none"
                        />
                      </div>
                    </div>
                  )}

                  {/* 2. High: + CIF Verification */}
                  {createdTx.riskScore > 60 && (
                    <div className="mt-3">
                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1 flex items-center gap-1">
                        <Search className="w-3.5 h-3.5 text-blue-500" /> Verify Customer CIF Identification Key
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. CIF100042"
                        value={challengeCIF}
                        onChange={(e) => setChallengeCIF(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-mono uppercase focus:ring-1 focus:ring-blue-500 focus:outline-none"
                      />
                    </div>
                  )}

                  {/* 3. Critical: + Guardian system alert warning */}
                  {createdTx.riskScore > 80 && (
                    <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-800 text-xs">
                      <p className="font-bold flex items-center gap-1 uppercase tracking-wider text-[10px]">
                        🚨 Critical Multi-Signature Bypass
                      </p>
                      <p className="text-2xs text-red-700 mt-1 leading-relaxed">
                        This operation is categorized as Critical Security Severity. It will raise a live sentinel trigger to the registered Guardian dashboard of {guardian ? `${guardian.guardianName} (${guardian.relationship})` : "UNREGISTERED"}. The transaction will remain locked in escrow until the Guardian dashboard executes an authorized clearance footprint.
                      </p>
                    </div>
                  )}

                  {/* Action buttons */}
                  <div className="flex gap-3 mt-4">
                    <button
                      onClick={handleVerifyOverride}
                      disabled={submitting}
                      className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-500 active:scale-95 duration-200 text-white font-bold rounded-lg text-xs flex items-center justify-center cursor-pointer disabled:opacity-50"
                    >
                      {submitting ? "Verifying..." : "Verify Identity Verification"}
                    </button>
                    <button
                      onClick={handleAbort}
                      disabled={submitting}
                      className="py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold rounded-lg text-xs flex items-center justify-center cursor-pointer transition-all"
                    >
                      Abort Transfer
                    </button>
                  </div>
                </div>
              )}

              {challengeStatus === "Success" && (
                <div className="mt-4 p-6 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg flex flex-col items-center justify-center text-center">
                  <CheckCircle className="w-10 h-10 text-emerald-600 mb-2" />
                  <p className="font-extrabold text-sm uppercase tracking-wider">Bypass Authorized</p>
                  <p className="text-xs text-emerald-700 mt-1">
                    Identity validation matches baseline signatures. Funds of <strong>₹{parseFloat(amount).toLocaleString()}</strong> transferred successfully to {receiverName}.
                  </p>
                </div>
              )}

              {challengeStatus === "Rejected" && (
                <div className="mt-4 p-6 bg-red-50 border border-red-200 text-red-800 rounded-lg flex flex-col items-center justify-center text-center">
                  <XCircle className="w-10 h-10 text-red-600 mb-2" />
                  <p className="font-extrabold text-sm uppercase tracking-wider">Transaction Terminated</p>
                  <p className="text-xs text-red-700 mt-1">
                    Escrow suspended immediately by security admin. Threat event cataloged in security database.
                  </p>
                </div>
              )}

            </div>

          </div>
        )}
      </div>
      </div>
    </div>
  );
}
