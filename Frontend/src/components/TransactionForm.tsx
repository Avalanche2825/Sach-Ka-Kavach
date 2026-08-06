import React, { useState } from "react";
import { UserSession, Transaction, Guardian } from "../types.js";
import { ShieldCheck, KeyRound, Smartphone, Search, AlertCircle, Send, CheckCircle, XCircle } from "lucide-react";
import { useToast } from "./ToastProvider.tsx";
import { clientCalculateRisk } from "../utils/mockData.ts";
import { flushBehaviorSignals } from "../utils/behaviorCollector.ts";

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
  
  const triggerOtp = () => {
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    setOtpSent(code);
    showToast(`[SMS Gateway] Authentication OTP code sent: ${code}`, "success");
  };

  const handleCreateTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomer) {
      setErrorMsg("Please select an active customer profile before conducting a transfer.");
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

    const targetSessionId = `sess_${selectedCustomer.cif}_${Date.now()}`;

    try {
      // Flush latest behavioral signals immediately in background
      await flushBehaviorSignals(selectedCustomer.cif, targetSessionId);

      const behaviorSignals = {
        typingSpeedAvg: 230.0,
        typingVariance: 25.0,
        copyPasteDetected: false,
        hesitationTimeSeconds: 1.1,
        navigationDepth: 4,
        actionsPerMinute: 8,
      };

      const deviceSignals = {
        visitorId: localStorage.getItem("sach_kavach_visitor_id") || "fp_dev_hash_1",
        userAgent: navigator.userAgent,
        currentIP: selectedCustomer.currentIP || "103.88.24.12",
        isNewDevice: false,
      };

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
          isNewDevice: false,
          sessionId: targetSessionId,
          behaviorSignals,
          deviceSignals
        })
      });
      const data = await response.json();
      if (response.ok) {
        setCreatedTx(data);
        if (data.status === "Approved") {
          setChallengeStatus("Success");
          onRefreshHistory();
        } else {
          triggerOtp();
        }
      } else {
        setErrorMsg(data.error || "Failed to process transfer request.");
      }
    } catch (err) {
      // Standalone client-side fallback
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

  const handleVerifyOverride = async () => {
    if (!createdTx || !selectedCustomer) return;
    
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
      if (challengeCIF.trim().toUpperCase() !== selectedCustomer.cif.trim().toUpperCase()) {
        showToast("Verification failed: Customer CIF signature mismatch!", "error");
        return;
      }
    }

    // 3. Critical check - OTP + CIF + Guardian
    if (score > 80) {
      if (!guardian) {
        showToast("Verification aborted: This critical transaction requires a pre-registered guardian's approval. Please register a guardian in the Security Center first.", "error");
        return;
      }
      showToast(`[Security Alert] Request sent to guardian ${guardian.guardianName} for secure remote authorization...`, "info");
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
        showToast("Authorization endpoint returned error.", "error");
      }
    } catch (err) {
      setChallengeStatus("Success");
      onRefreshHistory();
    } finally {
      setSubmitting(false);
    }
  };

  const handleAbort = async () => {
    if (!createdTx) return;
    setSubmitting(true);
    try {
      await fetch(`/api/transactions/${createdTx._id}/reject`, {
        method: "POST",
        headers: { "Content-Type": "application/json" }
      });
      setChallengeStatus("Rejected");
      onRefreshHistory();
    } catch (err) {
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
    setChallengeOTP("");
    setChallengeCIF("");
    setOtpSent(null);
  };

  return (
    <div className="space-y-6 font-sans text-slate-800 p-2">
      <div>
        <span className="text-[10px] font-bold text-blue-600 tracking-widest uppercase">Safe Escrow Transfers</span>
        <h2 className="text-2xl font-bold text-slate-900 mt-1">Send Money (Escrow Transfer)</h2>
        <p className="text-xs text-slate-400">All outgoing transfers are protected under secure escrow hold safeguards.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Form panel */}
        <div className="md:col-span-5 bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col justify-between min-h-[460px]">
          <div>
            <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-3 uppercase tracking-wider mb-4 flex items-center gap-2">
              <Send className="w-4 h-4 text-blue-600" />
              Transfer Parameters
            </h3>

            <form onSubmit={handleCreateTransaction} className="space-y-4">
              <div>
                <label className="block text-2xs font-bold text-slate-400 uppercase mb-1">Target Receiver Full Name</label>
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
                <label className="block text-2xs font-bold text-slate-400 uppercase mb-1">Target Account Number</label>
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
                <label className="block text-2xs font-bold text-slate-400 uppercase mb-1">Transfer Volume (INR)</label>
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
                <p className="text-xs text-red-600 font-medium bg-red-50 p-2.5 border border-red-100 rounded-lg">
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
                  className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg text-xs flex items-center justify-center gap-2 cursor-pointer shadow-sm disabled:opacity-50 transition-all font-sans"
                >
                  {submitting ? "Processing secure transfer..." : "Verify & Transfer Funds"}
                </button>
              ) : (
                <button
                  onClick={resetForm}
                  className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg text-xs flex items-center justify-center gap-2 cursor-pointer transition-all"
                >
                  Initiate Another Transfer
                </button>
              )}
            </div>
          )}
        </div>

        {/* Verification Status panel */}
        <div className="md:col-span-7 bg-white rounded-2xl border border-slate-200 p-6 shadow-sm min-h-[460px] flex flex-col justify-between">
          {!createdTx ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-6 text-slate-450 select-none">
              <ShieldCheck className="w-12 h-12 text-slate-200 mb-3 animate-pulse" />
              <p className="font-bold text-slate-800 text-sm uppercase tracking-wider">Transaction Safeguards Active</p>
              <p className="text-xs mt-1 text-slate-500 max-w-sm font-sans">
                Please complete a receiver name and amount on the left. The transfer is evaluated under Baroda Grid account protection protocols.
              </p>
            </div>
          ) : (
            <div className="flex-1 flex flex-col justify-between h-full">
              
              <div>
                <div className="flex justify-between items-start mb-4 pb-4 border-b border-slate-200">
                  <div>
                    <span className="text-2xs font-bold text-blue-600 uppercase tracking-widest font-mono">Verification Status</span>
                    <h4 className="text-sm font-bold text-slate-900 mt-1">
                      Hold Status: <span className="font-mono text-xs block text-slate-500 font-semibold mt-0.5">Processing</span>
                    </h4>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs">
                    <p className="font-bold text-slate-800">Escrow Account Lock</p>
                    <p className="text-slate-500 leading-relaxed mt-1">
                      Additional security validations are active to verify this transfer. Follow the prompt instructions below to complete the verification path.
                    </p>
                  </div>
                </div>
              </div>

              {/* Step Challenge Area */}
              <div className="flex-1 flex flex-col justify-end mt-4">
                {challengeStatus === "Initial" && (
                  <div className="p-4 rounded-xl border border-slate-200 bg-slate-50">
                    <h4 className="text-2xs font-bold text-slate-800 uppercase tracking-wider mb-3 flex items-center gap-1.5 border-b border-slate-100 pb-2">
                      <KeyRound className="w-4 h-4 text-blue-600" />
                      Required Security Verification
                    </h4>

                    {/* OTP verification */}
                    {createdTx.riskScore > 30 && (
                      <div className="space-y-3">
                        <div>
                          <div className="flex justify-between items-center mb-1">
                            <label className="text-[10px] font-bold text-slate-500 uppercase flex items-center gap-1">
                              <Smartphone className="w-3.5 h-3.5 text-blue-500" /> Enter 6 Digit Mobile OTP
                            </label>
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

                    {/* CIF Identification Verification */}
                    {createdTx.riskScore > 60 && (
                      <div className="mt-3">
                        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1 flex items-center gap-1">
                          <Search className="w-3.5 h-3.5 text-blue-500" /> Verify Customer Identification CIF
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. CIF100000"
                          value={challengeCIF}
                          onChange={(e) => setChallengeCIF(e.target.value)}
                          className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-mono uppercase focus:ring-1 focus:ring-blue-500 focus:outline-none"
                        />
                      </div>
                    )}

                    {/* Guardian Bypass Alert */}
                    {createdTx.riskScore > 80 && (
                      <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-800 text-xs">
                        <p className="font-bold flex items-center gap-1 uppercase tracking-wider text-[10px]">
                          🚨 Guardian Verification Required
                        </p>
                        <p className="text-2xs text-red-700 mt-1 leading-relaxed">
                          This transaction requires a remote override approval footprint from your registered Guardian {guardian ? `${guardian.guardianName}` : ""}.
                        </p>
                      </div>
                    )}

                    {/* Action buttons */}
                    <div className="flex gap-3 mt-4">
                      <button
                        onClick={handleVerifyOverride}
                        disabled={submitting}
                        className="flex-1 py-2 bg-[#2563EB] hover:bg-blue-500 text-white font-bold rounded-lg text-xs flex items-center justify-center cursor-pointer disabled:opacity-50 transition-all font-sans"
                      >
                        {submitting ? "Verifying..." : "Complete Security Verification"}
                      </button>
                      <button
                        onClick={handleAbort}
                        disabled={submitting}
                        className="py-2 px-4 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold rounded-lg text-xs flex items-center justify-center cursor-pointer transition-all"
                      >
                        Abort Transfer
                      </button>
                    </div>
                  </div>
                )}

                {challengeStatus === "Success" && (
                  <div className="p-6 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl flex flex-col items-center justify-center text-center">
                    <CheckCircle className="w-10 h-10 text-emerald-600 mb-2" />
                    <p className="font-extrabold text-sm uppercase tracking-wider">Transfer Complete</p>
                    <p className="text-xs text-emerald-700 mt-1 font-sans">
                      Funds of <strong>₹{parseFloat(amount).toLocaleString()}</strong> transferred successfully to {receiverName}.
                    </p>
                  </div>
                )}

                {challengeStatus === "Rejected" && (
                  <div className="p-6 bg-red-50 border border-red-200 text-red-800 rounded-xl flex flex-col items-center justify-center text-center">
                    <XCircle className="w-10 h-10 text-red-650 mb-2" />
                    <p className="font-extrabold text-sm uppercase tracking-wider">Transaction Cancelled</p>
                    <p className="text-xs text-red-700 mt-1 font-sans">
                      Transaction aborted. Funds returned to your checking balance.
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
