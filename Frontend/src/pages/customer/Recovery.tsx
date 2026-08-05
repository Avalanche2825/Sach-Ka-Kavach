import React, { useState } from "react";
import { Key, ShieldAlert, AlertTriangle, Building2, CheckCircle2, RefreshCw } from "lucide-react";
import { socApi } from "../../lib/api.ts";
import { useToast } from "../../components/ToastProvider.tsx";

interface Props {
  customer: any;
}

export default function CustomerRecovery({ customer }: Props) {
  const { showToast } = useToast();
  const [recoveryType, setRecoveryType] = useState<string>("FORGOT_PASSWORD");
  const [accountNumber, setAccountNumber] = useState<string>(customer?.accountNumber || customer?.cif || "CIF100002");
  const [loading, setLoading] = useState<boolean>(false);
  const [result, setResult] = useState<any>(null);

  const isSimSwapped = Boolean(customer?.isSimSwapWithin72h);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);

    try {
      const res = await fetch("/api/recovery/evaluate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cif: customer?.cif || "CIF100002",
          customerName: customer?.name || "Vikram Mehta",
          accountNumber,
          recoveryType,
          isSimSwapRecent: isSimSwapped,
          deviceHash: customer?.currentDevice || "DeviceHash_9981",
          ipAddress: customer?.currentIP || "103.88.24.12",
          isNewDevice: false,
          isVPN: false
        })
      });

      const data = await res.json();
      setResult(data);

      if (data.actionRequired === "BRANCH_VERIFICATION_REQUIRED") {
        showToast("Online recovery hard-blocked due to 72h SIM swap flag.", "error");
      } else if (data.status === "SUBMITTED") {
        showToast("Recovery request submitted for processing.", "success");
      }
    } catch (err: any) {
      showToast("Failed to process recovery evaluation.", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F9FB] text-slate-800 p-6 space-y-6 select-none font-sans">
      
      {/* Header */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-orange-50 text-[#F26522] rounded-xl border border-orange-200">
            <Key className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Account Self-Service Recovery</h1>
            <p className="text-xs text-slate-500 font-mono mt-0.5">
              Bank of Baroda Net Banking · Secure Channel Verification
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto space-y-6">
        
        {/* Active SIM Swap Alert Box if user has recent sim swap */}
        {isSimSwapped && (
          <div className="bg-red-50 border-2 border-red-300 rounded-2xl p-5 shadow-sm space-y-3">
            <div className="flex items-center gap-3 text-red-700">
              <ShieldAlert className="w-6 h-6 shrink-0 animate-pulse" />
              <div>
                <h3 className="font-extrabold text-sm">SECURITY ALERT: Carrier SIM Swap Detected (&lt;72 Hours)</h3>
                <p className="text-xs text-red-600 mt-0.5 font-medium">
                  A SIM swap event was registered on your mobile number within the last 72 hours.
                </p>
              </div>
            </div>
            <p className="text-xs text-slate-700 leading-relaxed bg-white border border-red-200 p-3 rounded-xl">
              Pursuant to <strong>Bank of Baroda Cyber Security Rules & RBI Fraud Prevention Directives</strong>, online self-service recovery is hard-blocked when a recent SIM swap is present to prevent account takeover attacks.
            </p>
          </div>
        )}

        {/* Recovery Form */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-5">
          <span className="text-xs font-mono font-bold uppercase text-slate-400 block border-b border-slate-100 pb-2">
            ACCOUNT RECOVERY REQUEST FORM
          </span>

          <form onSubmit={handleSubmit} className="space-y-4">
            
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Customer Identification (CIF / Account Number)</label>
              <input
                type="text"
                value={accountNumber}
                onChange={e => setAccountNumber(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-800 font-mono focus:outline-none focus:ring-1 focus:ring-orange-500"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Select Recovery Action</label>
              <select
                value={recoveryType}
                onChange={e => setRecoveryType(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-800 font-sans focus:outline-none focus:ring-1 focus:ring-orange-500"
              >
                <option value="FORGOT_PASSWORD">Reset Net Banking Password</option>
                <option value="FORGOT_MPIN">Reset Mobile Banking MPIN</option>
                <option value="CHANGE_MOBILE">Update Registered Mobile Number (High Security)</option>
                <option value="CHANGE_EMAIL">Update Registered Email Address (High Security)</option>
              </select>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-[#F26522] hover:bg-orange-600 text-white font-bold text-xs rounded-xl shadow-md transition flex items-center justify-center gap-2 cursor-pointer"
            >
              {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Key className="w-4 h-4" />}
              Evaluate & Initiate Recovery
            </button>

          </form>
        </div>

        {/* Evaluation Result Screen */}
        {result && (
          <div className="space-y-4">
            {result.actionRequired === "BRANCH_VERIFICATION_REQUIRED" ? (
              <div className="bg-red-50 border-2 border-red-400 rounded-2xl p-6 shadow-md text-center space-y-4">
                <div className="w-12 h-12 bg-red-600 text-white rounded-full flex items-center justify-center mx-auto shadow-md">
                  <Building2 className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-red-900">Physical Branch Verification Required</h3>
                  <span className="text-xs font-mono text-red-700 font-bold bg-red-100 px-3 py-1 rounded-full inline-block mt-1">
                    STATUS: HARD-BLOCKED (SIM SWAP RULE)
                  </span>
                </div>
                <p className="text-xs text-slate-700 leading-relaxed max-w-md mx-auto">
                  Your online recovery request was rejected by the Bank of Baroda Security Engine because a Carrier SIM swap occurred within 72 hours.
                </p>
                <div className="bg-white border border-red-200 rounded-xl p-4 text-left text-xs text-slate-700 space-y-2">
                  <span className="font-bold text-red-800 block">Required Next Steps:</span>
                  <ul className="list-disc pl-4 space-y-1">
                    <li>Visit your nearest Bank of Baroda physical branch.</li>
                    <li>Present original government-issued photo ID (Aadhaar or PAN Card).</li>
                    <li>Complete bio-verification with branch staff for account unlock.</li>
                  </ul>
                </div>
              </div>
            ) : (
              <div className="bg-emerald-50 border border-emerald-300 rounded-2xl p-6 shadow-sm text-center space-y-3">
                <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto" />
                <h3 className="text-sm font-extrabold text-emerald-900">{result.message || "Recovery Request Approved"}</h3>
                <p className="text-xs text-slate-600 font-mono">
                  {result.actionRequired === 'OTP_REQUIRED'
                    ? 'Verification OTP dispatched to registered mobile number.'
                    : 'Trusted baseline matched. No additional OTP is required.'}
                </p>
              </div>
            )}
          </div>
        )}

      </div>

    </div>
  );
}
