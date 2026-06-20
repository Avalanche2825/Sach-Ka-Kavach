import React, { useState, useEffect } from 'react';
import { 
  ShieldAlert, 
  ArrowRight, 
  Sparkles, 
  Cpu, 
  Lock, 
  Fingerprint, 
  Smartphone, 
  Scan, 
  RefreshCw,
  Activity,
  CheckCircle,
  Database,
  ShieldCheck,
  AlertTriangle,
  Users,
  Coins,
  Brain,
  Info,
  Terminal,
  ArrowUpRight,
  ShieldX,
  Menu
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface LandingPageProps {
  onLaunchConsole: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onLaunchConsole }) => {
  // Test calculator states
  const [sliderAmount, setSliderAmount] = useState<number>(350000);
  const [sliderDevice, setSliderDevice] = useState<boolean>(false);
  const [sliderKeystroke, setSliderKeystroke] = useState<boolean>(false);
  const [sliderGeo, setSliderGeo] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'problem' | 'understanding' | 'solution'>('problem');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);


  // Telemetry logs state
  const [tickerLogs, setTickerLogs] = useState<string[]>([]);

  // Calculate dynamic threat score for the mock widget
  const dynamicRisk = React.useMemo(() => {
    let score = 5;
    if (sliderAmount > 150000) score += 20;
    if (sliderAmount > 800000) score += 25;
    if (sliderDevice) score += 25;
    if (sliderKeystroke) score += 15;
    if (sliderGeo) score += 20;
    return Math.min(score, 100);
  }, [sliderAmount, sliderDevice, sliderKeystroke, sliderGeo]);

  useEffect(() => {
    const events = [
      "[INFO] Aadhaar KYC relationship graph parsed: 0 duplicate links found.",
      "[WARN] Keystroke typing duration deviation: +2.4 SD on CIF100002.",
      "[ALERT] Geo-session discrepancy: IP changed from Mumbai to Delhi in 45s.",
      "[BLOCK] Unauthorized data search on CIF100000: Stopped (No OTP Ticket).",
      "[INFO] Multi-signature escrow lock engaged: ₹4,50,000 to new beneficiary.",
      "[INFO] Standard session validated: User CIF100005 typing cadence verified.",
      "[ALERT] Active session hijacking attempt suspected: Device fingerprint mismatch.",
      "[BLOCK] Bulk records download request by Trainee Associate EMP103 blocked.",
    ];

    setTickerLogs([events[0], events[1], events[2]]);

    const interval = setInterval(() => {
      setTickerLogs(prev => {
        const nextEvent = events[Math.floor(Math.random() * events.length)];
        const timestamp = new Date().toLocaleTimeString();
        return [`[${timestamp}] ${nextEvent.substring(7)}`, prev[0], prev[1]];
      });
    }, 4000);

    return () => clearInterval(interval);
  }, []);

  const teamMembers = [
    { name: "Chitra Saini (Leader)", initial: "CS" },
    { name: "Abhyuday Jain", initial: "AJ" },
    { name: "Hardik Mathur", initial: "HM" },
    { name: "Siddharth Raut", initial: "SR" }
  ];

  const modules = [
    { 
      id: 'M1', 
      title: 'Behavioral Biometrics (M1)', 
      desc: 'Performs keystroke dynamics profiling and touch-cadence analysis at execution time, blocking botnets and credential stuffers.', 
      icon: Fingerprint,
      accent: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/30'
    },
    { 
      id: 'M2', 
      title: 'Account Takeover Lock (M2)', 
      desc: 'Intercepts access from high-risk server regions, VPN nodes, and anonymous proxy centers to defend dormant balances.', 
      icon: ShieldAlert,
      accent: 'text-red-400 bg-red-500/10 border-red-500/30'
    },
    { 
      id: 'M3', 
      title: 'New Device Telemetry (M3)', 
      desc: 'Gathers multi-signal device features (emulator flags, OS integrity, geographic distances) to suspend suspicious sim-swaps.', 
      icon: Smartphone,
      accent: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/30'
    },
    { 
      id: 'M4', 
      title: 'Syndicated KYC Graph (M4)', 
      desc: 'Applies Aadhaar and PAN node relationship clustering to discover duplicate application trails and graphs syndicates.', 
      icon: Scan,
      accent: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30'
    },
    { 
      id: 'M5', 
      title: 'Recovery Threat Sandbox (M5)', 
      desc: 'Creates a delay-buffered virtual environment for critical credential resets, preventing account hijack traps.', 
      icon: RefreshCw,
      accent: 'text-amber-400 bg-amber-500/10 border-amber-500/30'
    },
    { 
      id: 'M6', 
      title: 'Privileged Overwatch (M6)', 
      desc: 'Blocks bank officers from searching records without an active customer support ticket verified via SMS OTP.', 
      icon: Lock,
      accent: 'text-violet-400 bg-violet-500/10 border-violet-500/30'
    }
  ];

  return (
    <div className="bg-[#070b13] text-slate-100 min-h-screen font-sans relative overflow-hidden antialiased selection:bg-blue-600 selection:text-white">
      
      {/* Background radial SAAS glow */}
      <div className="absolute top-[-10%] left-[-10%] w-[60vw] h-[60vw] bg-blue-600/10 rounded-full blur-[160px] pointer-events-none animate-pulse" />
      <div className="absolute bottom-[20%] right-[-10%] w-[55vw] h-[55vw] bg-indigo-650/10 rounded-full blur-[160px] pointer-events-none" />
      <div className="absolute top-[40%] left-[20%] w-[40vw] h-[40vw] bg-cyan-500/5 rounded-full blur-[140px] pointer-events-none" />

      {/* Grid Pattern overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1f293708_1px,transparent_1px),linear-gradient(to_bottom,#1f293708_1px,transparent_1px)] bg-[size:3.5rem_3.5rem] pointer-events-none" />

      {/* Header */}
      <header className="sticky top-0 z-50 backdrop-blur-md bg-[#070b13]/80 border-b border-slate-900 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/20 border border-blue-400/20">
              <ShieldCheck className="h-5.5 w-5.5 text-white" />
            </div>
            <div>
              <h1 className="text-base font-black text-white tracking-tight flex items-center gap-2 font-outfit">
                SACH Kavach
                <span className="text-[8px] bg-blue-500/20 text-blue-400 border border-blue-500/40 px-2 py-0.5 rounded-full font-mono uppercase font-bold tracking-wider">
                  Active
                </span>
              </h1>
              <span className="text-[9px] uppercase font-bold tracking-widest text-slate-400 block font-mono">Bharat Trust Grid</span>
            </div>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-6">
            <a href="#about" className="text-xs font-bold text-slate-400 hover:text-white transition">About System</a>
            <a href="#features" className="text-xs font-bold text-slate-400 hover:text-white transition">6 Layers</a>
            <a href="#team" className="text-xs font-bold text-slate-400 hover:text-white transition">Our Team</a>
            
            <button 
              onClick={onLaunchConsole}
              className="px-4 py-2 text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white rounded-xl transition duration-200 shadow-md shadow-blue-600/10 cursor-pointer border border-blue-500/25 flex items-center gap-1.5"
            >
              Authorization Portal (Console)
              <ArrowRight className="w-3.5 h-3.5 animate-pulse" />
            </button>
          </div>

          {/* Mobile Menu Button */}
          <div className="flex md:hidden items-center">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-slate-400 hover:text-white transition cursor-pointer"
              title="Toggle Menu"
            >
              {mobileMenuOpen ? <ShieldX className="w-6 h-6 text-saffron-550" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Navigation Dropdown */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden border-b border-slate-900 bg-slate-950/95 backdrop-blur-md px-6 py-4 flex flex-col gap-4 relative z-40"
          >
            <a 
              href="#about" 
              onClick={() => setMobileMenuOpen(false)}
              className="text-sm font-bold text-slate-400 hover:text-white py-1 transition"
            >
              About System
            </a>
            <a 
              href="#features" 
              onClick={() => setMobileMenuOpen(false)}
              className="text-sm font-bold text-slate-400 hover:text-white py-1 transition"
            >
              6 Layers
            </a>
            <a 
              href="#team" 
              onClick={() => setMobileMenuOpen(false)}
              className="text-sm font-bold text-slate-400 hover:text-white py-1 transition"
            >
              Our Team
            </a>
            <button 
              onClick={() => {
                setMobileMenuOpen(false);
                onLaunchConsole();
              }}
              className="w-full py-3 text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white rounded-xl transition duration-200 text-center flex items-center justify-center gap-1.5 cursor-pointer border border-blue-500/25"
            >
              Authorization Portal (Console)
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-6 pt-16 pb-20 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center relative z-10">
        
        {/* Hero Left Info */}
        <div className="lg:col-span-6 space-y-6 text-left">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-950/40 text-blue-400 border border-blue-900/40 text-xs font-bold w-fit font-mono"
          >
            <Sparkles className="h-3.5 w-3.5 text-blue-400 fill-current" />
            Empowering Bank of Baroda Security Grid
          </motion.div>
          
          <motion.h2 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-4xl lg:text-6xl font-black text-white font-outfit leading-none tracking-tight"
          >
            Securing Accounts Via <br />
            <span className="bg-gradient-to-r from-blue-400 via-cyan-400 to-indigo-400 bg-clip-text text-transparent">
              Continuous Trust
            </span> <br />
            & AI Interceptions
          </motion.h2>
          
          <motion.p 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-sm text-slate-400 leading-relaxed max-w-lg"
          >
            SACH Kavach intercepts credential compromises, syndicated duplicate Aadhaar scams, and administrative database inquiries in real time. We replace static locks with dynamic behavioral metrics.
          </motion.p>

          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="flex flex-col sm:flex-row gap-4 pt-2"
          >
            <button 
              onClick={onLaunchConsole}
              className="px-6 py-4 bg-gradient-to-r from-blue-600 to-indigo-650 text-white text-sm font-bold rounded-xl flex items-center justify-center gap-2 hover:opacity-95 transition shadow-lg shadow-blue-500/15 cursor-pointer border border-blue-500/20"
            >
              Access Authorization Dashboard
              <ArrowRight className="h-4.5 w-4.5" />
            </button>
            <a 
              href="#about"
              className="px-6 py-4 bg-slate-900/60 hover:bg-slate-900 border border-slate-800 text-slate-355 text-sm font-bold rounded-xl text-center transition shadow-sm"
            >
              Explore Presentation
            </a>
          </motion.div>
        </div>

        {/* Hero Right Widget - Interactive Live Score Sandbox */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="lg:col-span-6 flex justify-center relative"
        >
          <div className="w-full max-w-md bg-slate-950/80 border border-slate-850 rounded-2xl p-5 shadow-2xl space-y-4 backdrop-blur-sm relative">
            
            {/* Widget Title */}
            <div className="flex justify-between items-center pb-3 border-b border-slate-900 text-xs">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span className="font-mono font-bold text-slate-400">TrustGuard AI Live Stream</span>
              </div>
              <span className="text-[9px] text-blue-400 font-mono">Real-time Telemetry</span>
            </div>

            {/* Live Logs Feed */}
            <div className="bg-slate-900/60 border border-slate-900 p-3.5 rounded-lg space-y-2 font-mono text-[9px] min-h-[95px]">
              {tickerLogs.map((log, index) => {
                let color = "text-slate-405";
                if (log.includes("[WARN]")) color = "text-amber-400";
                if (log.includes("[ALERT]")) color = "text-orange-400";
                if (log.includes("[BLOCK]")) color = "text-red-500 font-bold";
                if (log.includes("[INFO]")) color = "text-blue-400";
                return (
                  <div key={index} className={`truncate transition-all duration-300 ${color}`}>
                    {log}
                  </div>
                );
              })}
            </div>

            {/* Dynamic Interactive Panel */}
            <div className="bg-slate-900/30 border border-slate-900 p-4 rounded-lg space-y-3">
              <div className="flex justify-between items-center text-xs">
                <span className="font-bold text-[9px] text-slate-400 uppercase font-mono">Adjust Risk Factors</span>
                <span className={`text-[10px] font-mono font-extrabold ${dynamicRisk > 60 ? 'text-red-500' : dynamicRisk > 30 ? 'text-amber-500' : 'text-emerald-500'}`}>
                  Calculated Risk: {dynamicRisk}%
                </span>
              </div>
              
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => setSliderDevice(!sliderDevice)}
                  className={`py-1.5 px-2 border rounded-md text-[9px] font-mono transition duration-150 ${
                    sliderDevice ? "bg-red-500/10 border-red-500/30 text-red-400 font-bold" : "bg-slate-950 border-slate-850 text-slate-500"
                  }`}
                >
                  New Device
                </button>
                <button
                  onClick={() => setSliderKeystroke(!sliderKeystroke)}
                  className={`py-1.5 px-2 border rounded-md text-[9px] font-mono transition duration-150 ${
                    sliderKeystroke ? "bg-red-500/10 border-red-500/30 text-red-400 font-bold" : "bg-slate-950 border-slate-850 text-slate-500"
                  }`}
                >
                  Cadence Shift
                </button>
                <button
                  onClick={() => setSliderGeo(!sliderGeo)}
                  className={`py-1.5 px-2 border rounded-md text-[9px] font-mono transition duration-150 ${
                    sliderGeo ? "bg-red-500/10 border-red-500/30 text-red-400 font-bold" : "bg-slate-950 border-slate-850 text-slate-500"
                  }`}
                >
                  Geo Jump
                </button>
              </div>
            </div>

            <button
              onClick={onLaunchConsole}
              className="w-full py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg text-xs transition duration-200 border border-blue-500/25 flex items-center justify-center gap-1.5 cursor-pointer shadow"
            >
              <Terminal className="w-4 h-4" />
              Launch Console Dashboard
            </button>

          </div>
        </motion.div>

      </section>

      {/* Presentation: Problem Statement, What we understand, Our Solution */}
      <section id="about" className="max-w-7xl mx-auto px-6 py-20 border-t border-slate-900">
        
        {/* Tabbed Info Interface */}
        <div className="bg-slate-950/60 border border-slate-850 rounded-2xl p-8 shadow-xl space-y-8 backdrop-blur-sm">
          
          <div className="flex flex-wrap gap-2 border-b border-slate-900 pb-4">
            <button
              onClick={() => setActiveTab('problem')}
              className={`py-2 px-6 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                activeTab === 'problem'
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-405 hover:bg-slate-900 hover:text-white'
              }`}
            >
              ⚠️ Problem Statement
            </button>
            <button
              onClick={() => setActiveTab('understanding')}
              className={`py-2 px-6 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                activeTab === 'understanding'
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-405 hover:bg-slate-900 hover:text-white'
              }`}
            >
              🧠 What We Understand By This
            </button>
            <button
              onClick={() => setActiveTab('solution')}
              className={`py-2 px-6 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                activeTab === 'solution'
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-405 hover:bg-slate-900 hover:text-white'
              }`}
            >
              🛡️ Our Detailed Solution
            </button>
          </div>

          <div className="min-h-[220px]">
            <AnimatePresence mode="wait">
              {activeTab === 'problem' && (
                <motion.div
                  key="problem"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-4 text-left"
                >
                  <div className="flex items-center gap-3 text-red-500">
                    <ShieldAlert className="w-6 h-6 shrink-0" />
                    <h3 className="text-xl font-bold font-outfit">The Challenge: Privacy-First Continuous Identity Trust</h3>
                  </div>
                  <p className="text-sm text-slate-400 leading-relaxed max-w-4xl">
                    The challenge aims to design a privacy-first, risk-based Identity Trust framework that continuously validates customer and enterprise identities across digital channels. The solution should be capable of detecting high-risk events such as anomalous behavior, new device usage, suspicious onboarding or account recovery attempts, and misuse of privileged access. It should trigger real-time verification only when risk levels are elevated.
                  </p>
                  <p className="text-sm text-slate-400 leading-relaxed max-w-4xl">
                    The expected outcomes include a reduction in account takeover incidents, KYC fraud, and insider misuse, while ensuring secure, compliant, and friction-optimized digital access. The proposed solution should be scalable across multiple banking channels as user and transaction volumes grow.
                  </p>
                  <p className="text-xs text-saffron-400 leading-relaxed font-mono uppercase tracking-wide">
                    ⚠️ We strongly believe that collaboration with your esteemed institution will bring significant academic depth, research rigor, and innovative student participation to this initiative.
                  </p>
                </motion.div>
              )}

              {activeTab === 'understanding' && (
                <motion.div
                  key="understanding"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-4 text-left"
                >
                  <div className="flex items-center gap-3 text-blue-450">
                    <Brain className="w-6 h-6 shrink-0 text-blue-400" />
                    <h3 className="text-xl font-bold font-outfit">What We Understood: Continuous Identity Ledger</h3>
                  </div>
                  <p className="text-sm text-slate-400 leading-relaxed max-w-4xl">
                    Traditional security measures operate on a binary assumption: "If static credentials are valid, the user is trusted." This creates a massive loophole once a session is established or when personnel have elevated privileges. Identity is dynamic, not static.
                  </p>
                  <p className="text-sm text-slate-400 leading-relaxed max-w-4xl">
                    We understand that trust must be computed continuously using multi-dimensional telemetry vectors like keyboard/touch cadences, geo-session leaps, new hardware fingerprints, Aadhaar relationship graphs, recovery anomalies, and ticket consent verification. Step-up challenges are engaged in real-time only when risk parameters cross severity limits.
                  </p>
                </motion.div>
              )}

              {activeTab === 'solution' && (
                <motion.div
                  key="solution"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-4 text-left"
                >
                  <div className="flex items-center gap-3 text-emerald-500">
                    <CheckCircle className="w-6 h-6 shrink-0" />
                    <h3 className="text-xl font-bold font-outfit">Our Solution: SACH Kavach Security Core</h3>
                  </div>
                  <p className="text-sm text-slate-400 leading-relaxed max-w-4xl">
                    We built **SACH Kavach: Bharat Trust Grid**, a complete three-tier continuous identity prototype integrating a React 19 visual console, an Express API gateway, and a Python Flask ML microservice.
                  </p>
                  <p className="text-sm text-slate-400 leading-relaxed max-w-4xl">
                    Our solution implements six continuous verification layers:
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-sans">
                    <div className="p-3.5 bg-slate-900/40 border border-slate-850 rounded-xl space-y-1">
                      <p className="font-bold text-slate-200">1. Behavioral Biometrics (M1)</p>
                      <p className="text-slate-450 leading-relaxed text-[11px]">Profiles keystroke interval anomalies via Isolation Forest and features a **Hacker Delay Layer** to isolate bot attacks silently in sandbox timers.</p>
                    </div>
                    <div className="p-3.5 bg-slate-900/40 border border-slate-850 rounded-xl space-y-1">
                      <p className="font-bold text-slate-200">2. Account Takeover Lock (M2)</p>
                      <p className="text-slate-450 leading-relaxed text-[11px]">Locks transfer channels when anonymous proxy centers, VPN nodes, or geo-session jumps are identified.</p>
                    </div>
                    <div className="p-3.5 bg-slate-900/40 border border-slate-850 rounded-xl space-y-1">
                      <p className="font-bold text-slate-200">3. New Device Telemetry (M3)</p>
                      <p className="text-slate-450 leading-relaxed text-[11px]">Uses Random Forest classifiers to flag hardware emulation signatures and suspect SIM swap operations.</p>
                    </div>
                    <div className="p-3.5 bg-slate-900/40 border border-slate-850 rounded-xl space-y-1">
                      <p className="font-bold text-slate-200">4. Swarm Identity Graph (M4)</p>
                      <p className="text-slate-450 leading-relaxed text-[11px]">Maps PAN/Aadhaar nodes inside a React Flow relation graph to freeze duplicate application syndicates.</p>
                    </div>
                    <div className="p-3.5 bg-slate-900/40 border border-slate-850 rounded-xl space-y-1">
                      <p className="font-bold text-slate-200">5. Secure Recovery Sandbox (M5)</p>
                      <p className="text-slate-450 leading-relaxed text-[11px]">Enforces artificial delay filters on critical recovery requests and alerts real account owners immediately.</p>
                    </div>
                    <div className="p-3.5 bg-slate-900/40 border border-slate-850 rounded-xl space-y-1">
                      <p className="font-bold text-slate-200">6. Privileged Overwatch (M6)</p>
                      <p className="text-slate-450 leading-relaxed text-[11px]">Blocks bank employees from looking up accounts unless authorized by a customer OTP support ticket.</p>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

        </div>
      </section>

      {/* The 6 Layers Detailed Grid */}
      <section id="features" className="max-w-7xl mx-auto px-6 py-20 border-t border-slate-900/60">
        <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
          <span className="text-[10px] font-mono font-bold text-blue-500 uppercase tracking-widest block font-mono">SECURITY LAYERS BREAKDOWN</span>
          <h3 className="text-3xl lg:text-4xl font-black text-white font-outfit">The 6 Security Modules</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            SACH Kavach executes six layers of real-time interception, checking device signatures, biometric keystrokes, and staff inquiry parameters.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {modules.map((m) => {
            const Icon = m.icon;
            return (
              <div 
                key={m.id} 
                className="p-6 rounded-2xl bg-slate-950/60 border border-slate-850 hover:border-slate-800 transition duration-300 shadow-sm relative overflow-hidden group hover:shadow-xl hover:shadow-blue-500/5 text-left"
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-5 border ${m.accent}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <h4 className="text-base font-extrabold text-white font-outfit">{m.title}</h4>
                <p className="text-xs text-slate-405 mt-2.5 leading-relaxed">{m.desc}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Team Details Section */}
      <section id="team" className="max-w-7xl mx-auto px-6 py-20 border-t border-slate-900/60 bg-gradient-to-b from-[#070b13] to-[#04070d]">
        <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
          <span className="text-[10px] font-mono font-bold text-blue-500 uppercase tracking-widest block font-mono">TEAM CREDENTIALS</span>
          <h3 className="text-3xl font-extrabold text-white font-outfit">Team Name: Sach Kavach</h3>
          <p className="text-xs text-slate-400">
            Bank of Baroda Hackathon 2026 Core Engineering Group
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 text-left max-w-6xl mx-auto">
          {teamMembers.map((m, idx) => (
            <motion.div
              key={idx}
              whileHover={{ y: -4 }}
              className="bg-slate-950/80 border border-slate-850 p-5 rounded-2xl relative overflow-hidden flex flex-col justify-between h-[145px] shadow"
            >
              {/* Card visual background glow */}
              <div className="absolute top-0 right-0 w-16 h-16 bg-blue-650/5 rounded-full blur-xl pointer-events-none" />

              <div className="flex justify-between items-start">
                <div className="w-10 h-10 rounded-xl bg-blue-900/20 text-blue-450 border border-blue-900/40 flex items-center justify-center font-bold text-xs font-mono uppercase">
                  {m.initial}
                </div>
                <ArrowUpRight className="w-4 h-4 text-slate-500" />
              </div>

              <div>
                <h4 className="text-sm font-black text-white font-outfit">{m.name}</h4>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Call to Action Landing Footer */}
      <section className="bg-gradient-to-r from-blue-950/30 via-indigo-950/10 to-slate-950/50 border-t border-b border-slate-850 py-20 text-center">
        <div className="max-w-2xl mx-auto px-6 space-y-6">
          <h3 className="text-3xl font-extrabold text-white font-outfit tracking-tight">
            Launch Identity Trust Console
          </h3>
          <p className="text-xs text-slate-400 leading-relaxed max-w-md mx-auto">
            Authorize and deploy SACH Kavach parameters instantly. Protect accounts, verify graph Kyc applications, and audit employee privilege limits.
          </p>
          <button 
            onClick={onLaunchConsole}
            className="px-6 py-4 bg-gradient-to-r from-blue-600 to-indigo-650 text-white text-xs font-extrabold rounded-xl inline-flex items-center gap-2 hover:opacity-95 transition-all shadow-lg shadow-blue-500/10 cursor-pointer border border-blue-500/25"
          >
            Launch Identity Console Now
            <ArrowRight className="w-4 h-4 animate-pulse" />
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="max-w-7xl mx-auto px-6 py-10 text-center text-[10px] text-slate-500 font-mono">
        <p>© 2026 SACH Kavach (Team TrustGrid Shield). Bank of Baroda Hackathon. All rights reserved.</p>
      </footer>

    </div>
  );
};

export default LandingPage;
