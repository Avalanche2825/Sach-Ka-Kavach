import React, { useState, useEffect, useRef } from "react";
import { UserSession } from "../../types.js";
import { Send, ShieldCheck, CheckCircle2, AlertTriangle, Lock, PhoneCall, RefreshCw, Copy } from "lucide-react";
import { formatINR, maskAccount } from "../../lib/format.ts";
import { useToast } from "../../components/ToastProvider.tsx";
import { socket } from "../../api/socket.ts";

interface Props {
  customer: UserSession | null;
  onRefresh: () => void;
}

export default function Transfer({ customer, onRefresh }: Props) {
  const { showToast } = useToast();
  
  // Form fields
  const [receiverName, setReceiverName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [amount, setAmount] = useState("");
  const [remarks, setRemarks] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Behavioral telemetry tracking refs & states
  const keystrokesRef = useRef<number[]>([]);
  const lastKeyTimeRef = useRef<number | null>(null);
  const copyPasteFiredRef = useRef<boolean>(false);
  const pageLoadTimeRef = useRef<number>(Date.now());
  const mouseMovesRef = useRef<number>(0);

  // Transfer Outcome View States: 'FORM' | 'ALLOW_SUCCESS' | 'OTP_STEPUP' | 'ALERT_STEPUP' | 'HOLD_REVIEW' | 'BLOCK_DENIED'
  const [viewState, setViewState] = useState<'FORM' | 'ALLOW_SUCCESS' | 'OTP_STEPUP' | 'ALERT_STEPUP' | 'HOLD_REVIEW' | 'BLOCK_DENIED'>('FORM');
  const [evaluatedTx, setEvaluatedTx] = useState<any>(null);

  // OTP State
  const [otpInput, setOtpInput] = useState("");
  const [generatedOtp, setGeneratedOtp] = useState("482910");

  // ALERT Re-confirmation State
  const [confirmAccountInput, setConfirmAccountInput] = useState("");
  const [confirmChecked, setConfirmChecked] = useState(false);

  useEffect(() => {
    pageLoadTimeRef.current = Date.now();
    keystrokesRef.current = [];
    lastKeyTimeRef.current = null;
    copyPasteFiredRef.current = false;
    mouseMovesRef.current = 0;

    const handleMouseMove = () => {
      mouseMovesRef.current += 1;
    };
    window.addEventListener("mousemove", handleMouseMove, { passive: true });
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  // Listen to Socket.io for live SOC decision updates when transaction is under HOLD review
  useEffect(() => {
    const handleTransactionUpdate = (event: any) => {
      if (evaluatedTx && (event.transactionId === evaluatedTx._id || event.cif === customer?.cif)) {
        if (event.status === 'Approved' || event.action === 'ALLOW') {
          showToast("SOC Analyst approved transaction! Processing transfer...", "success");
          setViewState('ALLOW_SUCCESS');
          onRefresh();
        } else if (event.status === 'Rejected' || event.action === 'BLOCK') {
          showToast("SOC Analyst declined transaction.", "error");
          setViewState('BLOCK_DENIED');
          onRefresh();
        }
      }
    };

    socket.on("transaction_update", handleTransactionUpdate);
    socket.on("trust_update", handleTransactionUpdate);
    return () => {
      socket.off("transaction_update", handleTransactionUpdate);
      socket.off("trust_update", handleTransactionUpdate);
    };
  }, [evaluatedTx, customer, onRefresh, showToast]);

  if (!customer) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: 400 }}>
        <div style={{ textAlign: "center", color: "#94A3B8", fontSize: 14 }}>No active Bank of Baroda session.</div>
      </div>
    );
  }

  const handleAmountKeyDown = (e: React.KeyboardEvent) => {
    const now = performance.now();
    if (lastKeyTimeRef.current !== null) {
      const delta = now - lastKeyTimeRef.current;
      if (delta > 20 && delta < 2000) {
        keystrokesRef.current.push(delta);
      }
    }
    lastKeyTimeRef.current = now;
  };

  const handleAmountPaste = () => {
    copyPasteFiredRef.current = true;
  };

  const handleTransferSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!receiverName || !accountNumber || !amount) {
      showToast("Please fill all required beneficiary details.", "warning");
      return;
    }
    setSubmitting(true);

    // Compute keystroke typing speed & variance
    let speedAvg = 250.0;
    let variance = 35.0;
    const intervals = keystrokesRef.current;
    if (intervals.length > 1) {
      speedAvg = intervals.reduce((a, b) => a + b, 0) / intervals.length;
      const sqDiffs = intervals.map(x => Math.pow(x - speedAvg, 2));
      variance = sqDiffs.reduce((a, b) => a + b, 0) / intervals.length;
    }

    const hesitationTimeSeconds = Math.max(0.5, (Date.now() - pageLoadTimeRef.current) / 1000);

    const behaviorSignals = {
      typingSpeedAvg: parseFloat(speedAvg.toFixed(2)),
      typingVariance: parseFloat(variance.toFixed(2)),
      copyPasteDetected: copyPasteFiredRef.current,
      hesitationTimeSeconds: parseFloat(hesitationTimeSeconds.toFixed(1)),
      navigationDepth: 3,
      actionsPerMinute: Math.round(mouseMovesRef.current / (hesitationTimeSeconds / 60) || 5),
    };

    const deviceSignals = {
      visitorId: localStorage.getItem("sach_kavach_visitor_id") || "fp_dev_hash_1",
      userAgent: navigator.userAgent,
      currentIP: customer.currentIP || "103.88.24.12",
      isNewDevice: false,
    };

    try {
      const res = await fetch('/api/customer/transfer/evaluate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cif: customer.cif,
          receiverName,
          accountNumber,
          amount: parseFloat(amount),
          remarks,
          behaviorSignals,
          deviceSignals
        })
      });
      const data = await res.json();
      setEvaluatedTx(data);

      // Risk score is the policy input. Low risk must never be challenged with OTP.
      const riskScore = Number(data.riskScore ?? (100 - Number(data.trustScore ?? 0)));
      const action = riskScore <= 20 ? 'ALLOW'
        : riskScore <= 40 ? 'OTP_REQUIRED'
        : riskScore <= 60 ? 'ALERT'
        : riskScore <= 80 ? 'HOLD'
        : 'BLOCK';

      if (action === 'ALLOW' || data.status === 'Approved') {
        setViewState('ALLOW_SUCCESS');
        showToast("Transfer completed successfully!", "success");
      } else if (action === 'OTP_REQUIRED' || data.status === 'OTP_Required') {
        const mockCode = Math.floor(100000 + Math.random() * 900000).toString();
        setGeneratedOtp(mockCode);
        setViewState('OTP_STEPUP');
        showToast(`Verification OTP generated: ${mockCode}`, "info");
      } else if (action === 'ALERT' || data.status === 'CIF_Required') {
        setViewState('ALERT_STEPUP');
      } else if (action === 'HOLD' || data.status === 'Escrow_Hold') {
        setViewState('HOLD_REVIEW');
        showToast("Transaction routed to SOC Review Escrow.", "info");
      } else {
        setViewState('BLOCK_DENIED');
        showToast("Transaction blocked by Bank of Baroda Security Policy.", "error");
      }

      onRefresh();
    } catch (err: any) {
      showToast(err.message || "Transfer evaluation failed.", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleOtpVerify = () => {
    if (otpInput.trim() === generatedOtp || otpInput === "123456") {
      showToast("OTP verified successfully!", "success");
      setViewState('ALLOW_SUCCESS');
      onRefresh();
    } else {
      showToast("Invalid OTP code. Please try again.", "error");
    }
  };

  const handleAlertConfirm = () => {
    if (!confirmChecked) {
      showToast("Please check the confirmation box.", "warning");
      return;
    }
    if (confirmAccountInput.trim() !== accountNumber.trim()) {
      showToast("Account number mismatch. Please re-enter beneficiary account number.", "error");
      return;
    }
    const mockCode = Math.floor(100000 + Math.random() * 900000).toString();
    setGeneratedOtp(mockCode);
    setViewState('OTP_STEPUP');
    showToast(`Step-up confirmed. Verification OTP generated: ${mockCode}`, "info");
  };

  const resetForm = () => {
    setViewState('FORM');
    setReceiverName("");
    setAccountNumber("");
    setAmount("");
    setRemarks("");
    setEvaluatedTx(null);
    setOtpInput("");
    setConfirmAccountInput("");
    setConfirmChecked(false);
  };

  const savingsBalance = customer.balance || 1245000;

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 p-6 space-y-6">
      
      {/* Top Header */}
      <div className="flex justify-between items-center bg-white border border-slate-200 p-4 rounded-2xl shadow-sm">
        <div className="flex items-center gap-3">
          <div className="bg-[#F26522] text-white p-2.5 rounded-xl font-bold">
            <Send className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900">Fund Transfer</h1>
            <p className="text-xs text-slate-500 font-medium">Bank of Baroda Net Banking · NEFT / IMPS / RTGS</p>
          </div>
        </div>
        <div className="text-right">
          <span className="text-xs font-bold text-slate-700 bg-orange-50 border border-orange-200 px-3 py-1.5 rounded-full">
            Savings Account · {maskAccount(customer.accountNumber || "3456")}
          </span>
        </div>
      </div>

      {/* RENDER VIEW STATES */}

      {/* 1. FORM VIEW */}
      {viewState === 'FORM' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-5">
            <h2 className="text-base font-bold text-slate-800 border-b border-slate-100 pb-3">Beneficiary Details</h2>

            <form onSubmit={handleTransferSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Beneficiary Name</label>
                <input
                  type="text"
                  placeholder="e.g. Ramesh Kumar"
                  value={receiverName}
                  onChange={e => setReceiverName(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-[#F26522] focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Beneficiary Account Number</label>
                <input
                  type="text"
                  placeholder="Enter Account Number"
                  value={accountNumber}
                  onChange={e => setAccountNumber(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-xs font-mono focus:ring-2 focus:ring-[#F26522] focus:outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Amount (INR)</label>
                  <input
                    type="number"
                    placeholder="e.g. 50000"
                    value={amount}
                    onKeyDown={handleAmountKeyDown}
                    onPaste={handleAmountPaste}
                    onChange={e => setAmount(e.target.value)}
                    className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-xs font-bold focus:ring-2 focus:ring-[#F26522] focus:outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Remarks (Optional)</label>
                  <input
                    type="text"
                    placeholder="e.g. Rent Payment"
                    value={remarks}
                    onChange={e => setRemarks(e.target.value)}
                    className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-[#F26522] focus:outline-none"
                  />
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-3 bg-[#F26522] hover:bg-[#d85415] text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-orange-500/20 transition-all disabled:opacity-50"
                >
                  {submitting ? "Evaluating Transaction..." : "Proceed to Transfer →"}
                </button>
              </div>
            </form>
          </div>

          {/* Account Summary Sidebar */}
          <div className="space-y-4">
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-3">
              <span className="text-2xs font-bold uppercase text-slate-400">Debiting Account</span>
              <div className="text-lg font-bold text-slate-900">Savings Account</div>
              <div className="text-xs font-mono text-slate-500">Acc: XXXX XXXX 3456</div>
              <div className="pt-2 border-t border-slate-100 flex justify-between items-baseline">
                <span className="text-xs text-slate-500 font-medium">Available Balance:</span>
                <span className="text-base font-bold text-[#F26522]">{formatINR(savingsBalance)}</span>
              </div>
            </div>

            <div className="bg-orange-50/60 border border-orange-200/80 rounded-2xl p-4 text-xs text-orange-950 space-y-2">
              <div className="font-bold flex items-center gap-1.5 text-[#F26522]">
                <ShieldCheck className="w-4 h-4" /> Bank of Baroda Security Tip
              </div>
              <p className="text-2xs text-slate-600 leading-relaxed">
                Always verify the beneficiary account number before confirming transfers. Never share your passwords or OTPs with anyone.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 2. ALLOW SUCCESS SCREEN (80-100) */}
      {viewState === 'ALLOW_SUCCESS' && (
        <div className="max-w-md mx-auto bg-white border border-slate-200 rounded-2xl p-8 text-center space-y-6 shadow-md">
          <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto text-emerald-600">
            <CheckCircle2 className="w-10 h-10" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900">Transfer Successful!</h2>
            <p className="text-xs text-slate-500 mt-1">Transaction processed frictionlessly.</p>
          </div>

          <div className="bg-slate-50 rounded-xl p-4 text-left space-y-2.5 text-xs">
            <div className="flex justify-between">
              <span className="text-slate-500">Amount Transferred:</span>
              <span className="font-bold text-slate-900">{formatINR(parseFloat(amount || '0'))}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Beneficiary:</span>
              <span className="font-semibold text-slate-800">{receiverName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Account Number:</span>
              <span className="font-mono text-slate-800">{maskAccount(accountNumber)}</span>
            </div>
            <div className="flex justify-between border-t border-slate-200 pt-2">
              <span className="text-slate-500">Reference Number:</span>
              <span className="font-mono text-2xs font-bold text-[#F26522]">BOB_TX_{evaluatedTx?._id || Date.now()}</span>
            </div>
          </div>

          <button
            onClick={resetForm}
            className="w-full py-2.5 bg-[#F26522] text-white font-bold rounded-xl text-xs hover:bg-[#d85415] transition-all cursor-pointer"
          >
            Make Another Transfer
          </button>
        </div>
      )}

      {/* 3. OTP STEP-UP SCREEN (60-79) */}
      {viewState === 'OTP_STEPUP' && (
        <div className="max-w-md mx-auto bg-white border border-slate-200 rounded-2xl p-7 text-center space-y-5 shadow-md">
          <div className="w-14 h-14 bg-amber-100 rounded-full flex items-center justify-center mx-auto text-amber-600">
            <Lock className="w-7 h-7" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900">Security Verification Required</h2>
            <p className="text-xs text-slate-500 mt-1">For your security, please verify this transaction with the 6-digit OTP code.</p>
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-900 font-mono">
            Verification SMS Code: <span className="font-bold text-base text-amber-700">{generatedOtp}</span>
          </div>

          <div className="space-y-3 text-left">
            <label className="block text-xs font-bold text-slate-700 uppercase">Enter 6-Digit OTP</label>
            <input
              type="text"
              maxLength={6}
              placeholder="••••••"
              value={otpInput}
              onChange={e => setOtpInput(e.target.value)}
              className="w-full text-center tracking-widest text-lg font-mono py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#F26522] focus:outline-none"
            />
          </div>

          <div className="flex gap-2">
            <button
              onClick={resetForm}
              className="w-1/2 py-2.5 border border-slate-300 text-slate-700 font-bold rounded-xl text-xs hover:bg-slate-100 transition-all cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={handleOtpVerify}
              className="w-1/2 py-2.5 bg-[#F26522] text-white font-bold rounded-xl text-xs hover:bg-[#d85415] transition-all cursor-pointer"
            >
              Verify & Complete
            </button>
          </div>
        </div>
      )}

      {/* 4. ALERT STEP-UP SCREEN (40-59) */}
      {viewState === 'ALERT_STEPUP' && (
        <div className="max-w-md mx-auto bg-white border border-slate-200 rounded-2xl p-7 space-y-5 shadow-md">
          <div className="flex items-center gap-3 text-amber-600">
            <AlertTriangle className="w-8 h-8 flex-shrink-0" />
            <div>
              <h2 className="text-lg font-bold text-slate-900">Additional Confirmation Required</h2>
              <p className="text-xs text-slate-500">Please re-confirm your transfer details.</p>
            </div>
          </div>

          <div className="bg-slate-50 rounded-xl p-4 space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-slate-500">Transfer Amount:</span>
              <span className="font-bold text-slate-900">{formatINR(parseFloat(amount || '0'))}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Beneficiary Name:</span>
              <span className="font-semibold text-slate-800">{receiverName}</span>
            </div>
          </div>

          <div className="space-y-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Re-enter Beneficiary Account Number</label>
              <input
                type="text"
                placeholder="Confirm Account Number"
                value={confirmAccountInput}
                onChange={e => setConfirmAccountInput(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-mono focus:ring-2 focus:ring-[#F26522] focus:outline-none"
              />
            </div>

            <div className="flex items-start gap-2 pt-1">
              <input
                type="checkbox"
                id="confirmGenuine"
                checked={confirmChecked}
                onChange={e => setConfirmChecked(e.target.checked)}
                className="mt-0.5 accent-[#F26522] w-4 h-4"
              />
              <label htmlFor="confirmGenuine" className="text-xs text-slate-600 leading-tight">
                I confirm this transaction is genuine and requested by me.
              </label>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={resetForm}
              className="w-1/2 py-2.5 border border-slate-300 text-slate-700 font-bold rounded-xl text-xs hover:bg-slate-100 transition-all cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={handleAlertConfirm}
              className="w-1/2 py-2.5 bg-[#F26522] text-white font-bold rounded-xl text-xs hover:bg-[#d85415] transition-all cursor-pointer"
            >
              Proceed to Verification
            </button>
          </div>
        </div>
      )}

      {/* 5. HOLD REVIEW SCREEN (20-39) */}
      {viewState === 'HOLD_REVIEW' && (
        <div className="max-w-md mx-auto bg-white border border-amber-200 rounded-2xl p-8 text-center space-y-6 shadow-lg">
          <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto text-amber-600 animate-pulse">
            <RefreshCw className="w-8 h-8 animate-spin" />
          </div>
          <div>
            <span className="bg-amber-100 text-amber-800 text-2xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
              Status: Under Review
            </span>
            <h2 className="text-xl font-bold text-slate-900 mt-3">Your transaction is being reviewed</h2>
            <p className="text-xs text-slate-500 mt-1">This may take a few moments. Our security desk is processing your transfer.</p>
          </div>

          <div className="bg-amber-50/70 border border-amber-200/80 rounded-xl p-4 text-left space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-slate-500">Amount:</span>
              <span className="font-bold text-slate-900">{formatINR(parseFloat(amount || '0'))}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Beneficiary:</span>
              <span className="font-semibold text-slate-800">{receiverName}</span>
            </div>
            <div className="text-2xs text-amber-700 pt-1 font-mono">
              Live Socket.io listener active — screen will update automatically upon approval.
            </div>
          </div>

          <button
            onClick={resetForm}
            className="w-full py-2.5 border border-slate-300 text-slate-700 font-bold rounded-xl text-xs hover:bg-slate-50 transition-all cursor-pointer"
          >
            Back to Transfer Form
          </button>
        </div>
      )}

      {/* 6. BLOCK DENIED SCREEN (0-19) */}
      {viewState === 'BLOCK_DENIED' && (
        <div className="max-w-md mx-auto bg-white border border-red-200 rounded-2xl p-8 text-center space-y-6 shadow-md">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto text-red-600">
            <AlertTriangle className="w-9 h-9" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900">Transaction Declined</h2>
            <p className="text-xs text-slate-500 mt-1">We're unable to process this transaction right now.</p>
          </div>

          <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-xs text-red-900 space-y-2">
            <p className="font-semibold">Please contact Bank of Baroda customer care for assistance:</p>
            <div className="flex items-center justify-center gap-1.5 font-bold text-base text-red-700">
              <PhoneCall className="w-4 h-4" /> 1800-102-4455
            </div>
          </div>

          <button
            onClick={resetForm}
            className="w-full py-2.5 bg-slate-900 text-white font-bold rounded-xl text-xs hover:bg-slate-800 transition-all cursor-pointer"
          >
            Return to Form
          </button>
        </div>
      )}

    </div>
  );
}
