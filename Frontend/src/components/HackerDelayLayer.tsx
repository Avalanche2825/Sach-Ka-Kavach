import React, { useState, useEffect } from "react";
import { 
  Hourglass, 
  MapPin, 
  Terminal, 
  Radio, 
  ShieldAlert, 
  Users, 
  CheckCircle2, 
  AlertTriangle,
  Play,
  RotateCcw,
  Sparkles,
  ArrowRight
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useToast } from "./ToastProvider.tsx";
import MethodologyBanner from "./layout/MethodologyBanner.tsx";

export default function HackerDelayLayer() {
  const { showToast } = useToast();
  
  // Simulation configuration states
  const [selectedScenario, setSelectedScenario] = useState("Account Takeover Attempt");
  const [isDelayActive, setIsDelayActive] = useState(false);
  const [progress, setProgress] = useState(0);
  const [statusStep, setStatusStep] = useState(0);
  const [timerCount, setTimerCount] = useState(120);

  // Intelligence capture variables (dynamic based on selectedScenario)
  const getScenarioDetails = () => {
    switch (selectedScenario) {
      case "Account Takeover Attempt":
        return {
          ip: "103.88.23.99",
          location: "Moscow, Russia (VPN Node)",
          coords: "55.7558° N, 37.6173° E",
          device: "Android Emulator (Genymotion)",
          actions: ["Login Bypass", "View Balances", "Overriding Beneficiary", "Wire Transfer Request"],
          rhythm: "14.2x baseline (Bot speed)",
          transferAmt: "₹4,80,000",
          fingerprintHash: "a9bf28d01e46b9a2c3d4e5f6g7h8i9j0"
        };
      case "Fraudulent Transfer":
        return {
          ip: "185.220.101.44",
          location: "Frankfurt, Germany (Tor Exit)",
          coords: "50.1109° N, 8.6821° E",
          device: "Custom Scraper Script (Python Requests)",
          actions: ["Check Escrow Lock", "Attempt Transfer Override", "Inject Payee Details"],
          rhythm: "22.5x baseline (Script cadence)",
          transferAmt: "₹8,50,000",
          fingerprintHash: "b0cf39e12f57c0b3d4e5f6g7h8i9j0k1"
        };
      case "Recovery Fraud":
        return {
          ip: "103.111.45.89",
          location: "Lagos, Nigeria (Proxy)",
          coords: "6.5244° N, 3.3792° E",
          device: "Kali Linux / Firefox Profile Spoofing",
          actions: ["Request Mobile Reset", "Submit False Aadhaar ID", "Request OTP Bypass"],
          rhythm: "0.4x baseline (Extremely sluggish)",
          transferAmt: "₹2,10,000",
          fingerprintHash: "c1df40f23f68d1c4d5e6f7g8h9i0j1l2"
        };
      default:
        return {
          ip: "103.88.24.50",
          location: "Mumbai, India (Home Network)",
          coords: "19.0760° N, 72.8777° E",
          device: "Priya's iPhone 15",
          actions: ["Check Balance", "Transfer to Family member"],
          rhythm: "1.0x (Normal typing cadence)",
          transferAmt: "₹5,000",
          fingerprintHash: "d2ef51a34f79e2d5e6f7g8h9i0j1k2m3"
        };
    }
  };

  const details = getScenarioDetails();

  // Progress animation loops
  useEffect(() => {
    let interval: any;
    if (isDelayActive) {
      interval = setInterval(() => {
        setProgress(prev => {
          // Slow down progressively and loop to never finish
          if (prev >= 98) {
            // Loop back to a processing stage
            setStatusStep(step => (step + 1) % 4);
            return 35;
          }
          const stepSize = Math.max(0.1, (100 - prev) / 80);
          return parseFloat((prev + stepSize).toFixed(2));
        });
      }
      , 150);
    } else {
      setProgress(0);
      setStatusStep(0);
    }
    return () => clearInterval(interval);
  }, [isDelayActive]);

  // Countdown timer simulation
  useEffect(() => {
    let interval: any;
    if (isDelayActive && timerCount > 0) {
      interval = setInterval(() => {
        setTimerCount(t => t - 1);
      }, 1000);
    } else if (!isDelayActive) {
      setTimerCount(120);
    }
    return () => clearInterval(interval);
  }, [isDelayActive, timerCount]);

  const handleActivate = async () => {
    if (isDelayActive) {
      setIsDelayActive(false);
      setProgress(0);
      showToast("Hacker Delay Layer terminated. Session reset.", "info");
      return;
    }

    try {
      const res = await fetch("/api/hacker-delay/activate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cif: "CIF100000",
          scenario: selectedScenario
        })
      });
      
      if (res.ok) {
        setIsDelayActive(true);
        showToast("Hacker Delay activated. Capturing forensics in sandbox.", "warning");
      } else {
        showToast("Failed to initialize security delay gateway.", "error");
      }
    } catch (err) {
      showToast("Network gateway error.", "error");
    }
  };

  const processingTexts = [
    "Verifying security handshake...",
    "Validating device registration tokens...",
    "Re-routing encryption tunnel paths...",
    "Analyzing keyboard rhythm baselines..."
  ];

  return (
    <div className="space-y-6">
      
      {/* Methodology banner link */}
      <MethodologyBanner pageId="hacker-delay" />

      {/* TOP SECTION: Explainer Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 select-none">
        
        {/* Traditional block strategy */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 rounded-lg bg-red-100 flex items-center justify-center text-red-500">
              <ShieldAlert className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-extrabold text-xs text-slate-800 uppercase tracking-tight font-mono">Traditional Firewall Systems</h3>
              <p className="text-[10px] text-slate-400">Standard binary block mechanism</p>
            </div>
          </div>
          <p className="text-xs text-slate-500 leading-relaxed">
            Standard banking apps instantly disconnect sessions when anomaly risk thresholds spike. 
            This alerts malicious actors that their VPN setup, credential list, or script is compromised, 
            allowing them to immediately modify their vector and strike again.
          </p>
          <div className="mt-3 flex items-center gap-2 text-[10px] text-red-600 bg-red-50/50 p-2 rounded-lg border border-red-100 font-semibold font-mono">
            <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
            <span>CRITICAL LIMIT: Attacker quickly adapts. Real user is targeted.</span>
          </div>
        </div>

        {/* SACH Kavach unique innovation */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 rounded-lg bg-saffron-100 flex items-center justify-center text-saffron-550">
              <Hourglass className="w-4 h-4 text-saffron-600" />
            </div>
            <div>
              <h3 className="font-extrabold text-xs text-slate-800 uppercase tracking-tight font-mono">SACH Hacker Delay Layer</h3>
              <p className="text-[10px] text-saffron-500 font-bold font-mono">Continuous Containment Matrix</p>
            </div>
          </div>
          <p className="text-xs text-slate-500 leading-relaxed">
            Instead of blocking, we isolate suspected sessions (risk 40-65) in a delayed pipeline. 
            Pages load with artificial delays. Requests appear to process but never execute. 
            Attacker is contained, while we pull telemetry, dispatch OTPs to the real customer, and alert the SOC.
          </p>
          <div className="mt-3 flex items-center gap-2 text-[10px] text-emerald-700 bg-emerald-50/50 p-2 rounded-lg border border-emerald-150 font-semibold font-mono">
            <CheckCircle2 className="w-3.5 h-3.5 shrink-0 text-emerald-500" />
            <span>ADVANTAGE: Attacker wastes time. Forensics captured. Balance protected.</span>
          </div>
        </div>
      </div>

      {/* CORE CONTROLLER WIDGET */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 flex flex-col md:flex-row items-center justify-between gap-4 shadow-sm select-none">
        <div className="flex items-center gap-4 w-full md:w-auto">
          <div className="flex flex-col">
            <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider font-mono">Select Compromise Threat Scenario</label>
            <select
              value={selectedScenario}
              onChange={(e) => {
                setSelectedScenario(e.target.value);
                setIsDelayActive(false);
              }}
              disabled={isDelayActive}
              className="mt-1 block w-56 rounded-lg border-slate-200 bg-white text-xs font-semibold py-1.5 px-3 focus:outline-none focus:ring-1 focus:ring-saffron-500 focus:border-saffron-500 cursor-pointer shadow-sm text-slate-800"
            >
              <option>Account Takeover Attempt</option>
              <option>Fraudulent Transfer</option>
              <option>Recovery Fraud</option>
              <option>Normal Activity Check</option>
            </select>
          </div>
        </div>

        <div className="flex gap-3 w-full md:w-auto justify-end">
          <button
            onClick={handleActivate}
            className={`py-2 px-5 rounded-xl font-bold font-mono text-xs tracking-wider uppercase transition-all shadow-md flex items-center gap-2 cursor-pointer ${
              isDelayActive
                ? "bg-red-500 hover:bg-red-600 text-white shadow-red-200"
                : "bg-saffron-500 hover:bg-saffron-600 text-white shadow-saffron-200"
            }`}
          >
            {isDelayActive ? (
              <>
                <RotateCcw className="w-4 h-4 animate-spin" />
                <span>Deactivate Delay</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4" />
                <span>Arm Delay Layer</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* CENTER PIECE: Split Screen Sandbox */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* LEFT: Attacker's Throttled View */}
        <div className="lg:col-span-5 bg-slate-900 border border-slate-950 rounded-2xl shadow-xl flex flex-col overflow-hidden h-[460px]">
          {/* Mock Browser Header */}
          <div className="bg-slate-950 px-4 py-3 flex items-center justify-between border-b border-slate-800/80">
            <div className="flex items-center gap-1.5 select-none">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500/80"></span>
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80"></span>
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80"></span>
            </div>
            <div className="bg-slate-900 text-[10px] text-slate-500 py-1 px-4 rounded-md font-mono select-none flex items-center gap-1">
              <span className="text-emerald-500">https://</span>
              <span>online.bankofbaroda.in/cif/transfer</span>
            </div>
            <div className="w-12"></div>
          </div>

          {/* Page contents */}
          <div className="flex-grow p-6 flex flex-col justify-between font-mono bg-slate-900 text-slate-350 relative overflow-hidden">
            {isDelayActive ? (
              <div className="absolute inset-0 bg-slate-900/90 backdrop-blur-[1px] z-20 flex flex-col items-center justify-center p-6 text-center select-none">
                {/* Slow loader */}
                <div className="relative w-16 h-16 mb-4">
                  <div className="absolute inset-0 rounded-full border-4 border-slate-800"></div>
                  <div className="absolute inset-0 rounded-full border-4 border-t-saffron-500 animate-spin"></div>
                </div>

                <h4 className="text-sm font-extrabold text-white tracking-wider">TRANSFER COMPLIANCE AUDIT</h4>
                <p className="text-[10px] text-slate-500 mt-1 max-w-[280px]">
                  Evaluating transaction credentials against regulatory parameters. Please hold connection.
                </p>

                {/* Simulated Slow Progress Bar */}
                <div className="w-56 bg-slate-800 h-1.5 rounded-full mt-6 overflow-hidden">
                  <div 
                    className="bg-gradient-to-r from-saffron-500 to-orange-400 h-full transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  ></div>
                </div>
                
                <span className="text-[10px] text-saffron-400 mt-2 font-bold tracking-widest uppercase">
                  {progress}% Complete
                </span>

                {/* Looping Status updates */}
                <motion.div 
                  key={statusStep}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-[9px] text-slate-400 mt-4 h-4"
                >
                  {processingTexts[statusStep]}
                </motion.div>
              </div>
            ) : null}

            {/* Normal input fields mockup */}
            <div className="space-y-4">
              <div className="border-b border-slate-800 pb-3 flex justify-between items-center select-none">
                <span className="text-xs font-bold text-slate-100 font-sans">Baroda Escrow Portal</span>
                <span className="text-[9px] bg-slate-850 px-1.5 py-0.5 rounded text-slate-400 border border-slate-800">Direct Gateway</span>
              </div>

              <div className="space-y-1">
                <label className="text-[9px] text-slate-500 uppercase font-bold tracking-wider">Beneficiary Account</label>
                <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800 text-xs font-bold text-slate-100">
                  910283000104
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[9px] text-slate-500 uppercase font-bold tracking-wider">Beneficiary Name</label>
                <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800 text-xs font-bold text-slate-100">
                  Deepak Kumar
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[9px] text-slate-500 uppercase font-bold tracking-wider">Transaction Amount</label>
                  <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800 text-xs font-bold text-white font-mono">
                    {details.transferAmt}
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] text-slate-500 uppercase font-bold tracking-wider">Routing Code</label>
                  <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800 text-xs font-bold text-slate-400">
                    BARB0MUMBAI
                  </div>
                </div>
              </div>
            </div>

            <button
              onClick={() => {
                if (!isDelayActive) {
                  handleActivate();
                }
              }}
              className="w-full py-3 bg-[#0a1628] border border-saffron-500/20 hover:border-saffron-500 text-saffron-400 hover:bg-saffron-500 hover:text-white rounded-xl font-bold font-sans text-xs tracking-wider uppercase transition-all shadow shadow-saffron-550/5 mt-4 cursor-pointer"
            >
              Authenticate & Initiate Transfer
            </button>
          </div>
        </div>

        {/* RIGHT: Security Control Room */}
        <div className="lg:col-span-7 bg-[#0a1628] border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col justify-between text-white h-[460px] font-mono">
          
          <div className="border-b border-slate-800 pb-3 flex justify-between items-center select-none">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 bg-saffron-500 rounded-full animate-ping"></span>
              <h3 className="font-extrabold text-xs tracking-wider uppercase">SACH Forensics Overwatch Control Panel</h3>
            </div>
            {isDelayActive && (
              <span className="px-2 py-0.5 rounded bg-red-500/10 text-red-400 border border-red-500/25 font-bold text-[9px] animate-pulse">
                Containment Active
              </span>
            )}
          </div>

          {/* Main layout inside Control Room */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-grow my-4 overflow-y-auto pr-1">
            
            {/* Telemetry log blocks */}
            <div className="space-y-3">
              <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-3">
                <span className="text-[8px] text-slate-400 font-bold uppercase tracking-wider block mb-1">Target Geolocation Trace</span>
                <div className="flex items-start gap-2 text-xs">
                  <MapPin className="w-4 h-4 text-saffron-500 shrink-0 mt-0.5" />
                  <div>
                    <div className="font-bold text-white truncate">{details.location}</div>
                    <div className="text-[9px] text-slate-400 mt-0.5">{details.coords}</div>
                  </div>
                </div>
              </div>

              <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-3">
                <span className="text-[8px] text-slate-400 font-bold uppercase tracking-wider block mb-1">Device Fingerprint Info</span>
                <div className="flex items-start gap-2 text-xs">
                  <Terminal className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <div className="font-bold text-slate-200 truncate">{details.device}</div>
                    <div className="text-[9px] text-slate-500 mt-0.5">SHA256: {isDelayActive ? "a3f8c2d9..." : "Inactive"}</div>
                  </div>
                </div>
              </div>

              <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-3">
                <span className="text-[8px] text-slate-400 font-bold uppercase tracking-wider block mb-1">Session Rhythm Speed</span>
                <div className="text-xs font-bold text-slate-200 flex justify-between">
                  <span>Input Cadence:</span>
                  <span className={isDelayActive ? "text-amber-400" : "text-slate-400"}>{isDelayActive ? details.rhythm : "Standby"}</span>
                </div>
              </div>
            </div>

            {/* Security Alerts and Countdown timers */}
            <div className="space-y-3">
              <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-3 flex flex-col justify-between h-full">
                <div>
                  <span className="text-[8px] text-slate-400 font-bold uppercase tracking-wider block mb-2">Automated Incident Workflow</span>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-400">Fraud Team Alerted</span>
                      {isDelayActive ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : <span className="w-1.5 h-1.5 bg-slate-700 rounded-full"></span>}
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-400">Branch Manager Escalation</span>
                      {isDelayActive ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : <span className="w-1.5 h-1.5 bg-slate-700 rounded-full"></span>}
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-400">Owner SMS Warning Dispatched</span>
                      {isDelayActive ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : <span className="w-1.5 h-1.5 bg-slate-700 rounded-full"></span>}
                    </div>
                  </div>
                </div>

                <div className="border-t border-slate-850 mt-3 pt-3">
                  <div className="flex justify-between items-center text-[10px] text-slate-400">
                    <span>Target Sandbox Session Countdown:</span>
                    <span className="font-mono font-bold text-saffron-400 text-sm">
                      {timerCount}s
                    </span>
                  </div>
                </div>
              </div>
            </div>

          </div>

          {/* Simulated scrolling console logs */}
          <div className="bg-slate-950 rounded-xl p-3 h-28 overflow-y-auto border border-slate-850 font-mono text-[9px] text-emerald-400/90 leading-relaxed scrollbar-thin">
            {isDelayActive ? (
              <div className="space-y-1">
                <div>[Incident Logs] {new Date().toISOString()} : Initialized session tracking for customer Priya (CIF100000)</div>
                <div>[Incident Logs] Trace route matched: 103.88.23.99 --&gt; Moscow Proxy VPN</div>
                <div>[Incident Logs] Input rhythm speed: {details.rhythm}</div>
                <div>[Incident Logs] Throttling transfer amount check ({details.transferAmt})</div>
                <div>[Incident Logs] OTP alerts queued for primary phone index (+91 998877****)</div>
                <div className="text-red-400">[Incident Logs] WARNING: Potential Account compromised. Awaiting manual override.</div>
              </div>
            ) : (
              <div className="text-slate-500 text-center py-6">
                System standing by. Arm the Security Delay Layer to capture threat traces.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* BOTTOM SECTION: Intelligence Forensic Report */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm select-none">
        <h3 className="font-bold text-xs text-slate-850 uppercase tracking-wider mb-4 border-b border-slate-100 pb-2 flex items-center gap-1.5">
          <Radio className="w-4 h-4 text-saffron-600 animate-pulse" />
          <span>Security Evidence Report Ledger</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs text-slate-600">
          <div>
            <span className="font-bold block text-slate-400 uppercase text-[9px] font-mono tracking-wider">Attempted Targets</span>
            <ul className="mt-2 space-y-1.5">
              {details.actions.map((act, i) => (
                <li key={i} className="flex items-center gap-2 font-mono text-[10px] text-slate-850">
                  <span className="w-1.5 h-1.5 bg-saffron-500 rounded-full shrink-0"></span>
                  <span>{act}</span>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <span className="font-bold block text-slate-400 uppercase text-[9px] font-mono tracking-wider">Device Signature ID</span>
            <div className="mt-2 font-mono text-[10px] bg-slate-50 border border-slate-100 p-2.5 rounded-lg flex flex-col justify-between gap-1">
              <span className="text-slate-500">Hash Code:</span>
              <span className="text-slate-800 font-bold truncate">{details.fingerprintHash}</span>
              <span className="text-slate-400 text-[8px] leading-none mt-1">Tamper Proof SHA-256 Ledger Record</span>
            </div>
          </div>

          <div>
            <span className="font-bold block text-slate-400 uppercase text-[9px] font-mono tracking-wider">Regulatory Compliance Action</span>
            <div className="mt-2 space-y-1 text-[10px] font-mono">
              <div className="flex justify-between border-b border-slate-100 pb-1.5">
                <span>Decouple Risk Level:</span>
                <span className="text-red-500 font-bold">HIGH RISK</span>
              </div>
              <div className="flex justify-between border-b border-slate-100 py-1.5">
                <span>Fraud Unit Report:</span>
                <span className="text-emerald-600 font-bold">DISPATCHED</span>
              </div>
              <div className="flex justify-between pt-1.5">
                <span>Compliance Outcome:</span>
                <span className="text-slate-800 font-bold">Containment Sandbox Lock</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
