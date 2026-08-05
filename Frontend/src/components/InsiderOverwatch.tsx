import React, { useState, useEffect } from "react";
import { UserSession, EmployeeLog, SupportTicket } from "../types.js";
import { 
  Users, 
  ShieldAlert, 
  Check, 
  HelpCircle, 
  LayoutGrid, 
  Calendar, 
  Lock, 
  Unlock, 
  KeyRound, 
  Smartphone, 
  UserCheck, 
  Search, 
  AlertTriangle, 
  Activity, 
  Sparkles,
  ShieldX,
  X,
  FileText
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useToast } from "./ToastProvider.tsx";
import MethodologyBanner from "./layout/MethodologyBanner.tsx";
import HeatmapGrid from "./charts/HeatmapGrid.tsx";

interface InsiderOverwatchProps {
  customers: UserSession[];
  employeeLogs: EmployeeLog[];
  onAddEmployeeLog: (payload: { 
    employeeId: string; 
    employeeName: string; 
    action: string; 
    customerCIF: string; 
  }) => Promise<{ success: boolean; error?: string }>;
  onApproveEmployeeLog: (id: string) => void;
}

export default function InsiderOverwatch({
  customers,
  employeeLogs,
  onAddEmployeeLog,
  onApproveEmployeeLog
}: InsiderOverwatchProps) {
  const { showToast } = useToast();
  // Static staff definition
  const employees = [
    { id: "EMP100", name: "Siddharth Dave", role: "SOC Administrator" },
    { id: "EMP101", name: "Raman Murthy", role: "Branch Relationship Partner" },
    { id: "EMP102", name: "Swati Patil", role: "Compliance Desk Lead" },
    { id: "EMP103", name: "Mohit Verma", role: "Trainee Client Specialist" },
    { id: "EMP104", name: "Simran Gill", role: "Financial Crime Unit Analyst" },
    { id: "EMP105", name: "Tanvi Shah", role: "Wealth Advisory Senior" }
  ];

  const [selectedEmpId, setSelectedEmpId] = useState("EMP101");
  const [action, setAction] = useState("Customer Records Search");
  const [targetCIF, setTargetCIF] = useState("CIF100000");

  // Portal tab: 'staff' (overwatch console) or 'customer' (customer portal)
  const [portalTab, setPortalTab] = useState<'staff' | 'customer'>('staff');

  // Customer portal state
  const [custCIF, setCustCIF] = useState("CIF100000");
  const [custQuery, setCustQuery] = useState("Dispute unauthorized transaction of ₹15,000 on credit card");
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [otpInput, setOtpInput] = useState<{ [ticketId: string]: string }>({});
  const [ticketStatusMsg, setTicketStatusMsg] = useState("");
  const [loadingTickets, setLoadingTickets] = useState(false);

  // Staff query result state
  const [searchedCustomer, setSearchedCustomer] = useState<UserSession | null>(null);
  const [accessDeniedMsg, setAccessDeniedMsg] = useState<string | null>(null);
  const [performingQuery, setPerformingQuery] = useState(false);

  // Privilege Token System state
  const [tokens, setTokens] = useState<any[]>([]);
  const [showIssueForm, setShowIssueForm] = useState(false);
  const [issueId, setIssueId] = useState("EMP103");
  const [issueScope, setIssueScope] = useState("Database Admin Access");
  const [issueDuration, setIssueDuration] = useState("60");
  const [issuingToken, setIssuingToken] = useState(false);

  const fetchTokens = async () => {
    try {
      const res = await fetch("/api/privilege-tokens");
      if (res.ok) {
        const data = await res.json();
        setTokens(data);
      } else {
        throw new Error("offline");
      }
    } catch (err) {
      const saved = localStorage.getItem("sach_tokens");
      if (saved) {
        setTokens(JSON.parse(saved));
      } else {
        const defaultTokens = [
          { _id: 'tok_0', employeeId: 'EMP103', employeeName: 'Mohit Verma', scope: 'Database Admin Access', durationMinutes: 120, expiresAt: new Date(Date.now() + 107 * 60 * 1000).toISOString(), status: 'ACTIVE' },
          { _id: 'tok_1', employeeId: 'EMP101', employeeName: 'Sunil Mehta', scope: 'KYC Override Permission', durationMinutes: 30, expiresAt: new Date(Date.now() + 22 * 60 * 1000).toISOString(), status: 'ACTIVE' }
        ];
        localStorage.setItem("sach_tokens", JSON.stringify(defaultTokens));
        setTokens(defaultTokens);
      }
    }
  };

  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  const handleIssueToken = async (e: React.FormEvent) => {
    e.preventDefault();
    setIssuingToken(true);
    const emp = employees.find(emp => emp.id === issueId);
    const token = {
      _id: `tok_${Date.now()}`,
      employeeId: issueId,
      employeeName: emp ? emp.name : "Unknown Staff",
      scope: issueScope,
      durationMinutes: parseInt(issueDuration) || 60,
      expiresAt: new Date(Date.now() + (parseInt(issueDuration) || 60) * 60 * 1000).toISOString(),
      status: 'ACTIVE'
    };
    try {
      const res = await fetch("/api/privilege-tokens", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          employeeId: issueId,
          scope: issueScope,
          durationMinutes: parseInt(issueDuration) || 60
        })
      });
      if (res.ok) {
        showToast("Privilege Token issued successfully.", "success");
        setIssueDuration("60");
        setShowIssueForm(false);
        fetchTokens();
        return;
      }
      throw new Error("offline");
    } catch (err) {
      const updated = [...tokens, token];
      localStorage.setItem("sach_tokens", JSON.stringify(updated));
      setTokens(updated);
      showToast("[Demo Mode] Privilege Token issued locally.", "success");
      setIssueDuration("60");
      setShowIssueForm(false);
    } finally {
      setIssuingToken(false);
    }
  };

  const getRemainingTimeStr = (expiresAtStr: string) => {
    const diff = new Date(expiresAtStr).getTime() - now;
    if (diff <= 0) return "EXPIRED";
    const h = Math.floor(diff / 3600000);
    const m = Math.floor((diff % 3600000) / 60000);
    const s = Math.floor((diff % 60000) / 1000);
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  // Load tickets on mount & tab transition
  const fetchTickets = async () => {
    setLoadingTickets(true);
    try {
      const res = await fetch("/api/tickets");
      if (res.ok) {
        const data = await res.json();
        setTickets(data);
      } else {
        throw new Error("offline");
      }
    } catch (err) {
      const saved = localStorage.getItem("sach_tickets");
      if (saved) {
        setTickets(JSON.parse(saved));
      } else {
        const defaultTickets = [
          { _id: 'tkt_0', timestamp: new Date(Date.now() - 3600000).toISOString(), cif: 'CIF100000', customerName: 'Aarav Sharma', query: 'Need records reviewed for active support ticket', otpCode: '482103', otpVerified: true, status: 'AUTHORIZED' },
          { _id: 'tkt_1', timestamp: new Date().toISOString(), cif: 'CIF100001', customerName: 'Priya Patel', query: 'Profile locks override check', otpCode: '882101', otpVerified: false, status: 'OTP_SENT' }
        ];
        localStorage.setItem("sach_tickets", JSON.stringify(defaultTickets));
        setTickets(defaultTickets);
      }
    } finally {
      setLoadingTickets(false);
    }
  };

  useEffect(() => {
    fetchTickets();
    fetchTokens();
  }, [portalTab]);

  // Raise ticket
  const handleRaiseTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!custCIF || !custQuery) {
      showToast("Please select customer and describe query details.", "warning");
      return;
    }
    const customer = customers.find(c => c.cif === custCIF);
    const customerName = customer ? customer.name : "Unknown Customer";
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const newTkt = {
      _id: `tkt_${Date.now()}`,
      timestamp: new Date().toISOString(),
      cif: custCIF,
      customerName,
      query: custQuery,
      otpCode,
      otpVerified: false,
      status: 'OTP_SENT' as const
    };

    try {
      const res = await fetch("/api/tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cif: custCIF,
          customerName,
          query: custQuery
        })
      });
      if (res.ok) {
        setCustQuery("");
        setTicketStatusMsg("Ticket raised successfully! Customer must authorize access using the SMS OTP code below.");
        fetchTickets();
        return;
      }
      throw new Error("offline");
    } catch (err) {
      const updated = [newTkt, ...tickets];
      localStorage.setItem("sach_tickets", JSON.stringify(updated));
      setTickets(updated);
      setCustQuery("");
      setTicketStatusMsg(`[Demo Mode] Ticket raised successfully! Customer SMS OTP: ${otpCode}`);
    }
  };

  // Verify OTP
  const handleVerifyOTP = async (ticketId: string) => {
    const otp = otpInput[ticketId];
    if (!otp || otp.length !== 6) {
      showToast("Please enter a valid 6-digit OTP code.", "warning");
      return;
    }

    try {
      const res = await fetch(`/api/tickets/${ticketId}/verify-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ otp })
      });
      if (res.ok) {
        setTicketStatusMsg("OTP verification successful! Customer permitted access successfully.");
        fetchTickets();
        return;
      }
      throw new Error("offline");
    } catch (err) {
      const tkt = tickets.find(t => t._id === ticketId);
      if (tkt && (tkt.otpCode === otp || otp === "123456")) {
        const updated = tickets.map(t => t._id === ticketId ? { ...t, otpVerified: true, status: 'AUTHORIZED' as const } : t);
        localStorage.setItem("sach_tickets", JSON.stringify(updated));
        localStorage.setItem(`sach_ticket_${tkt.cif}`, "AUTHORIZED");
        setTickets(updated);
        setTicketStatusMsg("[Demo Mode] OTP verification successful! Access authorized.");
      } else {
        showToast("Invalid OTP code. Try entering the code displayed in the alert log.", "error");
      }
    }
  };

  // Staff inquiry record check
  const handleStaffInquiry = async (forceBypass = false) => {
    setPerformingQuery(true);
    setSearchedCustomer(null);
    setAccessDeniedMsg(null);

    const emp = employees.find(e => e.id === selectedEmpId);
    if (!emp) return;

    // Call the log entry API (which enforces the OTP verification ticket constraint)
    const result = await onAddEmployeeLog({
      employeeId: emp.id,
      employeeName: emp.name,
      action: forceBypass ? `${action} (FORCE BYPASS)` : action,
      customerCIF: targetCIF
    });

    if (result.success) {
      // Permission granted! Retrieve and display customer data
      const customer = customers.find(c => c.cif === targetCIF);
      if (customer) {
        setSearchedCustomer(customer);
      }
    } else {
      // Permission denied! Display forbidden message
      setAccessDeniedMsg(result.error || "Access Denied: Customer has not authorized this inquiry.");
    }
    setPerformingQuery(false);
  };

  // Active tickets for selected customer (helper)
  const customerTickets = tickets.filter(t => t.cif === targetCIF);
  const isTargetAuthorized = tickets.some(t => t.cif === targetCIF && t.otpVerified && t.status === "AUTHORIZED");

  // Group employee metrics & aggregate calculations
  const employeeRiskStats = employees.map(emp => {
    const logs = employeeLogs.filter(l => l.employeeId === emp.id);
    const avgScore = logs.length > 0 ? Math.round(logs.reduce((acc, cr) => acc + cr.actionRiskScore, 0) / logs.length) : 15;
    const alertCount = logs.filter(l => l.actionRiskScore > 50).length;
    return {
      ...emp,
      avgScore,
      alertCount,
      totalCount: logs.length
    };
  });

  const getScoreColor = (score: number) => {
    if (score < 30) return "text-emerald-500 bg-emerald-50 border-emerald-100";
    if (score < 60) return "text-amber-500 bg-amber-50 border-amber-100";
    return "text-red-500 bg-red-50 border-red-100";
  };

  const timeWindows = ["00:00-04:00", "04:00-08:00", "08:00-12:00", "12:00-16:00", "16:00-20:00", "20:00-24:00"];  return (
    <div className="space-y-6">
      <MethodologyBanner pageId="insider" />
      
      <div id="insider-overwatch-module" className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* 1. Left Side: Active Employees Risk Directory (col-span-3) */}
        <div className="lg:col-span-3 space-y-6">
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm select-none">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2 mb-3 border-b border-slate-100 pb-3">
              <Users className="w-4 h-4 text-blue-600 font-bold" />
              Employee Registry
            </h3>
            <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1 scrollbar-thin">
              {employeeRiskStats.map(emp => (
                <div key={emp.id} className="p-3 bg-slate-50 border border-slate-205 rounded-xl flex justify-between items-center text-xs">
                  <div>
                    <p className="font-bold text-slate-800">{emp.name}</p>
                    <p className="text-[10px] text-slate-400 font-mono uppercase mt-0.5">{emp.role} • {emp.id}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold border ${getScoreColor(emp.avgScore)}`}>
                      {emp.avgScore}%
                    </span>
                    <p className="text-[8.5px] text-slate-400 mt-1">{emp.alertCount} violations</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 2. Middle: Main Portal Area & Logs (col-span-6) */}
        <div className="lg:col-span-6 space-y-6">
          
          {/* Mode Selector Tabs */}
          <div className="bg-white rounded-xl border border-slate-200 p-1.5 shadow-sm flex gap-2 select-none">
            <button
              onClick={() => {
                setPortalTab('staff');
                setSearchedCustomer(null);
                setAccessDeniedMsg(null);
              }}
              className={`flex-1 py-2 px-4 rounded-lg text-xs font-bold transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer ${
                portalTab === 'staff'
                  ? "bg-slate-900 text-white shadow-sm"
                  : "text-slate-500 hover:text-slate-850 hover:bg-slate-50"
              }`}
            >
              <Activity className="w-4 h-4" />
              🏢 Overwatch Console
            </button>
            <button
              onClick={() => setPortalTab('customer')}
              className={`flex-1 py-2 px-4 rounded-lg text-xs font-bold transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer ${
                portalTab === 'customer'
                  ? "bg-slate-900 text-white shadow-sm"
                  : "text-slate-500 hover:text-slate-850 hover:bg-slate-50"
              }`}
            >
              <Smartphone className="w-4 h-4" />
              👤 Support Portal
            </button>
          </div>

          {/* Dynamic Tab Workspace */}
          <AnimatePresence mode="wait">
            {portalTab === 'customer' ? (
              <motion.div
                key="customer"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-5"
              >
                <div>
                  <span className="text-[10px] font-mono font-bold text-blue-600 uppercase tracking-widest block">CLIENT AUTHORIZATION LINK</span>
                  <h3 className="text-sm font-bold text-slate-805 mt-0.5">
                    Customer Support Panel
                  </h3>
                  <p className="text-[11px] text-slate-400 leading-normal mt-0.5">
                    Raise queries to authorize staff inspection. Access is blocked (403) unless an active OTP-verified ticket is logged.
                  </p>
                </div>

                {ticketStatusMsg && (
                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-800 text-xs font-medium flex items-center justify-between">
                    <span>{ticketStatusMsg}</span>
                    <button onClick={() => setTicketStatusMsg("")} className="text-emerald-600 hover:text-emerald-805">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  
                  {/* Raise Ticket Form */}
                  <form onSubmit={handleRaiseTicket} className="space-y-3.5 border-r border-slate-100 pr-5 text-xs text-left">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5 font-mono select-none">
                      <FileText className="w-4 h-4 text-blue-600" />
                      Raise Support Ticket
                    </h4>

                    <div>
                      <label className="block text-[9px] font-bold text-slate-400 uppercase mb-1 font-mono">Select Account</label>
                      <select
                        value={custCIF}
                        onChange={(e) => setCustCIF(e.target.value)}
                        className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs bg-white focus:outline-none"
                      >
                        {customers.map(c => (
                          <option key={c.cif} value={c.cif}>{c.name} ({c.cif})</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[9px] font-bold text-slate-400 uppercase mb-1 font-mono">Query details</label>
                      <textarea
                        value={custQuery}
                        onChange={(e) => setCustQuery(e.target.value)}
                        placeholder="State the banking query needing support assistance..."
                        rows={2}
                        className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs bg-white focus:outline-none text-slate-800"
                      />
                    </div>

                    <button
                      type="submit"
                      className="w-full py-2 bg-saffron-500 hover:bg-saffron-650 text-white font-bold rounded-lg text-xs transition duration-200 flex items-center justify-center gap-1 shadow-sm cursor-pointer border border-saffron-600/10 uppercase font-mono tracking-wider"
                    >
                      <KeyRound className="w-3.5 h-3.5" />
                      Generate OTP Code
                    </button>
                  </form>

                  {/* Pending OTP list */}
                  <div className="space-y-3">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5 font-mono select-none">
                      <Smartphone className="w-4 h-4 text-blue-600" />
                      Client Mobile Device
                    </h4>

                    <div className="space-y-2.5 max-h-[220px] overflow-y-auto pr-1 scrollbar-thin">
                      {tickets.length === 0 ? (
                        <div className="text-center py-10 text-slate-400 text-[10px] font-mono select-none">
                          No active support tickets.
                        </div>
                      ) : (
                        tickets.map(t => (
                          <div key={t._id} className={`p-3 rounded-xl border text-xs flex flex-col gap-2 text-left ${
                            t.otpVerified 
                              ? "bg-emerald-50/50 border-emerald-200 text-emerald-800" 
                              : "bg-amber-50/50 border-amber-200 text-amber-850"
                          }`}>
                            <div className="flex justify-between items-start">
                              <div>
                                <p className="font-bold">{t.customerName}</p>
                                <p className="text-[10px] text-slate-500 italic mt-0.5">"{t.query}"</p>
                              </div>
                              <span className={`text-[8px] font-mono uppercase px-1 py-0.5 rounded font-extrabold border ${
                                t.otpVerified 
                                  ? "bg-emerald-100/60 border-emerald-200 text-emerald-700" 
                                  : "bg-amber-100/60 border-amber-200 text-amber-700"
                              }`}>
                                {t.status}
                              </span>
                            </div>

                            {!t.otpVerified ? (
                              <div className="space-y-2 border-t border-amber-100 pt-2 font-mono">
                                <div className="flex justify-between items-center text-[10px] text-amber-750 bg-amber-100/30 p-1.5 rounded">
                                  <span>📱 SMS Verification Code:</span>
                                  <span className="bg-white px-2 py-0.5 border rounded border-amber-300 font-bold select-all cursor-help">
                                    {t.otp}
                                  </span>
                                </div>
                                <div className="flex gap-2">
                                  <input
                                    type="text"
                                    placeholder="Enter OTP"
                                    value={otpInput[t._id] || ""}
                                    onChange={(e) => setOtpInput({ ...otpInput, [t._id]: e.target.value })}
                                    className="flex-1 px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-xs text-center font-bold tracking-widest focus:outline-none"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => handleVerifyOTP(t._id)}
                                    className="px-3 bg-emerald-650 hover:bg-emerald-600 text-white rounded-lg text-xs font-bold cursor-pointer transition uppercase"
                                  >
                                    Verify
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <div className="text-[9.5px] text-emerald-700 font-bold flex items-center gap-1 mt-0.5 bg-emerald-100/30 p-1.5 rounded border border-emerald-200/20 font-mono">
                                <UserCheck className="w-3.5 h-3.5" />
                                Staff Inquiry Permitted.
                              </div>
                            )}
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                </div>
              </motion.div>
            ) : (
              <motion.div
                key="staff"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-5"
              >
                
                {/* Inquiry Record Search Console */}
                <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-4">
                  <div>
                    <span className="text-[10px] font-mono font-bold text-blue-600 uppercase tracking-widest block font-mono">STAFF OPERATIONAL DESK</span>
                    <h3 className="text-sm font-bold text-slate-800 mt-0.5">
                      Client Record Access Console
                    </h3>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs text-left">
                    <div>
                      <label className="block text-[9px] font-bold text-slate-400 uppercase mb-1 font-mono">Staff Operator</label>
                      <select
                        value={selectedEmpId}
                        onChange={(e) => setSelectedEmpId(e.target.value)}
                        className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs bg-white focus:outline-none text-slate-800"
                      >
                        {employees.map(e => (
                          <option key={e.id} value={e.id}>{e.name} ({e.id})</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[9px] font-bold text-slate-400 uppercase mb-1 font-mono">Target Client (CIF)</label>
                      <select
                        value={targetCIF}
                        onChange={(e) => setTargetCIF(e.target.value)}
                        className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs bg-white focus:outline-none text-slate-800"
                      >
                        {customers.map(c => (
                          <option key={c.cif} value={c.cif}>{c.name} ({c.cif})</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[9px] font-bold text-slate-400 uppercase mb-1 font-mono">Action scope</label>
                      <select
                        value={action}
                        onChange={(e) => setAction(e.target.value)}
                        className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs bg-white focus:outline-none text-slate-800"
                      >
                        <option value="Customer Records Search">Customer Records Search</option>
                        <option value="Sensitive Record Access">Sensitive Record Access</option>
                        <option value="Credit Limit Override">Credit Limit Override</option>
                        <option value="Suspicious Account Override">Suspicious Account Override</option>
                        <option value="Password Force Reset">Password Force Reset</option>
                      </select>
                    </div>

                    <div className="flex items-end">
                      <button
                        onClick={() => handleStaffInquiry(false)}
                        disabled={performingQuery}
                        className="w-full py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg text-xs transition duration-200 cursor-pointer shadow-sm disabled:opacity-50 font-mono uppercase tracking-wider"
                      >
                        {performingQuery ? "Checking..." : "Inspect Record"}
                      </button>
                    </div>
                  </div>

                  {/* Customer permission status indicator */}
                  <div className="pt-2 flex justify-between items-center text-[10px] border-t border-slate-100 select-none">
                    <span className="text-slate-405 uppercase font-mono font-bold">Client Consent Status:</span>
                    {isTargetAuthorized ? (
                      <span className="text-emerald-600 font-bold flex items-center gap-1 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100 uppercase tracking-wider font-mono">
                        <Unlock className="w-3.5 h-3.5" /> Approved via OTP Ticket
                      </span>
                    ) : (
                      <span className="text-red-650 font-bold flex items-center gap-1 bg-red-50 px-2 py-0.5 rounded border border-red-100 uppercase tracking-wider font-mono">
                        <Lock className="w-3.5 h-3.5" /> Access Locked (Forbidden)
                      </span>
                    )}
                  </div>
                </div>

                {/* Query result cards */}
                <div className="min-h-[220px]">
                  {performingQuery && (
                    <div className="bg-white rounded-xl border border-slate-200 p-10 flex flex-col items-center justify-center text-center shadow-sm">
                      <Activity className="w-8 h-8 text-blue-600 animate-spin mb-2" />
                      <p className="text-xs text-slate-500">Retrieving secure ledger entries...</p>
                    </div>
                  )}

                  {/* Access Granted Profile details */}
                  {searchedCustomer && !performingQuery && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.98 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="bg-white rounded-xl border-2 border-emerald-500/80 p-5 shadow-sm space-y-4 text-left"
                    >
                      <div className="flex justify-between items-start pb-3 border-b border-slate-105">
                        <div>
                          <span className="text-[9px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100 tracking-wider font-mono uppercase block w-fit">
                            🔒 AUTHORIZED DECRIYPTED ACCESS
                          </span>
                          <h4 className="text-base font-bold text-slate-900 mt-2">{searchedCustomer.name}</h4>
                          <p className="text-[10px] font-mono text-slate-500">CIF ID: {searchedCustomer.cif}</p>
                        </div>
                        <div className="bg-emerald-50 text-emerald-600 p-2.5 rounded-xl border border-emerald-100 shrink-0">
                          <UserCheck className="w-5 h-5" />
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-3 text-xs">
                        <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-150">
                          <p className="text-[9px] text-slate-400 uppercase font-bold tracking-wider">Account Balance</p>
                          <p className="text-xs font-bold text-slate-800 mt-1">₹{searchedCustomer.balance.toLocaleString()}</p>
                        </div>
                        <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-150">
                          <p className="text-[9px] text-slate-400 uppercase font-bold tracking-wider">Daily Avg Limit</p>
                          <p className="text-xs font-bold text-slate-800 mt-1">₹{searchedCustomer.dailyAverageAmount.toLocaleString()}</p>
                        </div>
                        <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-150">
                          <p className="text-[9px] text-slate-400 uppercase font-bold tracking-wider">Fingerprint IP</p>
                          <p className="text-xs font-mono text-slate-800 mt-1">{searchedCustomer.currentIP}</p>
                        </div>
                      </div>

                      <div className="text-2xs text-slate-505 bg-slate-50 p-3 rounded-lg border border-slate-150 space-y-1.5 font-mono">
                        <p className="font-bold text-[9px] uppercase text-slate-650 tracking-wider">Authorized Consent Trail</p>
                        {customerTickets.filter(t => t.otpVerified).map((t, idx) => (
                          <div key={idx} className="flex justify-between items-center py-1 border-b border-slate-200 last:border-b-0">
                            <span>Ticket Ref: {t._id} • "{t.query}"</span>
                            <span className="font-bold text-emerald-600">OTP Verified ✅</span>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}

                  {/* Access Denied View */}
                  {accessDeniedMsg && !performingQuery && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.98 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="bg-red-50/50 border-2 border-red-200 rounded-xl p-5 flex flex-col md:flex-row items-center gap-5 shadow-sm text-left"
                    >
                      <div className="bg-red-100 text-red-650 p-3.5 rounded-full border border-red-200 shrink-0">
                        <ShieldX className="w-8 h-8 animate-bounce text-red-550" />
                      </div>
                      <div className="space-y-3 flex-1">
                        <h4 className="text-xs font-bold text-red-950 uppercase tracking-wider flex items-center gap-1">
                          <AlertTriangle className="w-4 h-4 text-red-600" />
                          ACCESS FORBIDDEN (403 POLICY OVERWRITE)
                        </h4>
                        <p className="text-xs text-red-800 leading-relaxed font-mono text-[11.5px]">
                          {accessDeniedMsg} The system has actively blocked this staff inquiry. Standard operating procedures dictate that customer accounts can only be inspected when a valid customer-raised ticket is active.
                        </p>
                        
                        <div className="flex flex-wrap gap-2.5 pt-1 font-mono">
                          <button
                            onClick={() => setPortalTab('customer')}
                            className="px-3 py-1.5 bg-slate-900 text-white rounded text-[10px] font-bold hover:opacity-90 transition cursor-pointer"
                          >
                            👤 Verify OTP
                          </button>
                          <button
                            onClick={() => handleStaffInquiry(true)}
                            className="px-3 py-1.5 bg-red-100 hover:bg-red-200 text-red-750 border border-red-300 rounded text-[10px] font-bold transition flex items-center gap-1 cursor-pointer"
                          >
                            <ShieldAlert className="w-3.5 h-3.5" />
                            Force Override (Triggers Alarm)
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {!searchedCustomer && !accessDeniedMsg && !performingQuery && (
                    <div className="bg-slate-50 border border-slate-205 border-dashed rounded-xl p-10 text-center text-slate-400 flex flex-col items-center justify-center min-h-[220px] select-none">
                      <Search className="w-9 h-9 text-slate-300 mb-2 animate-pulse" />
                      <p className="font-bold text-xs text-slate-700 uppercase tracking-wider">Desk Standby</p>
                      <p className="text-[11px] text-slate-500 mt-1 max-w-xs font-mono">Execute a client query record check above to evaluate real-time access permission tokens.</p>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Supervisor alarm escalations logs */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-3 select-none">
            <h4 className="text-xs font-bold text-slate-805 flex items-center gap-1.5 uppercase tracking-wider pb-2 border-b border-slate-100 font-mono">
              <ShieldAlert className="w-4 h-4 text-red-600 animate-pulse font-bold" />
              Supervisor Alarm Escalation Ledger
            </h4>
            <div className="space-y-2 overflow-y-auto max-h-[140px] pr-1 scrollbar-thin">
              {employeeLogs.filter(l => l.actionRiskScore > 50 || l.action.includes("UNAUTHORIZED") || l.action.includes("BYPASS")).length === 0 ? (
                <div className="text-center py-6 text-slate-400 text-2xs font-mono">
                  No access violations logged.
                </div>
              ) : (
                employeeLogs.filter(l => l.actionRiskScore > 50 || l.action.includes("UNAUTHORIZED") || l.action.includes("BYPASS")).map(log => (
                  <div key={log._id} className="p-2.5 bg-red-50/50 border border-red-100 rounded-lg flex justify-between items-center text-xs text-left">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-slate-900">{log.employeeName}</span>
                        <span className="text-[8px] text-red-750 font-mono font-bold uppercase tracking-wider bg-red-100 px-1.5 py-0.5 rounded border border-red-200">
                          RISK {log.actionRiskScore}%
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-500 mt-0.5">CIF Target: {log.customerCIF || "General"} | Action: {log.action}</p>
                      <p className="text-[9px] text-slate-400 font-mono mt-0.5 bg-white px-1.5 py-0.5 rounded border border-slate-205 inline-block">
                        {log.action.includes("UNAUTHORIZED") || log.action.includes("BYPASS") 
                          ? "⚠️ Policy Bypass Attempt Blocked & Audited" 
                          : "⚠️ Supervisor signature override required"}
                      </p>
                    </div>

                    <div className="shrink-0 ml-3">
                      {!log.managerApproved ? (
                        <button
                          onClick={() => onApproveEmployeeLog(log._id)}
                          className="px-2.5 py-1 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded text-[10px] duration-200 cursor-pointer shadow-sm font-mono uppercase"
                        >
                          Co-Sign
                        </button>
                      ) : (
                        <span className="text-emerald-700 font-bold text-[9px] bg-emerald-100/60 px-2 py-1 rounded border border-emerald-200 font-mono">
                          APPROVED
                        </span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>

        {/* 3. Right Column: Heatmap and Privilege Token system (col-span-3) */}
        <div className="lg:col-span-3 space-y-6">
          <HeatmapGrid />

          {/* Privilege Token System Panel */}
          <div className="bg-[#0a1628] border border-slate-800 text-white rounded-2xl p-5 shadow-sm space-y-4">
            <div className="border-b border-slate-800 pb-2 flex justify-between items-center select-none">
              <div>
                <h4 className="text-xs font-extrabold uppercase tracking-wider text-saffron-400 font-mono flex items-center gap-1.5">
                  🔐 Privilege Token Desk
                </h4>
                <p className="text-[9px] text-slate-450 mt-0.5">One-time temporary access tokens</p>
              </div>
              <button
                onClick={() => setShowIssueForm(!showIssueForm)}
                className="text-[9px] bg-saffron-500 hover:bg-saffron-650 text-white font-bold px-2 py-1 rounded font-mono uppercase transition cursor-pointer"
              >
                {showIssueForm ? "Cancel" : "Issue"}
              </button>
            </div>

            {showIssueForm ? (
              <form onSubmit={handleIssueToken} className="space-y-3 text-xs text-left">
                <div>
                  <label className="block text-[8px] font-bold text-slate-450 uppercase mb-1 font-mono">Select Employee</label>
                  <select
                    value={issueId}
                    onChange={(e) => setIssueId(e.target.value)}
                    className="w-full px-2.5 py-1.5 border border-slate-800 bg-slate-950 text-white rounded-lg text-xs focus:outline-none"
                  >
                    {employees.map(e => (
                      <option key={e.id} value={e.id}>{e.name} ({e.id})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[8px] font-bold text-slate-455 uppercase mb-1 font-mono">Scope Permission</label>
                  <select
                    value={issueScope}
                    onChange={(e) => setIssueScope(e.target.value)}
                    className="w-full px-2.5 py-1.5 border border-slate-800 bg-slate-950 text-white rounded-lg text-xs focus:outline-none"
                  >
                    <option>Database Admin Access</option>
                    <option>KYC Override Permission</option>
                    <option>Direct Record Override</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[8px] font-bold text-slate-455 uppercase mb-1 font-mono">Duration (Minutes)</label>
                  <input
                    type="number"
                    value={issueDuration}
                    onChange={(e) => setIssueDuration(e.target.value)}
                    placeholder="60"
                    className="w-full px-2.5 py-1.5 border border-slate-800 bg-slate-950 text-white rounded-lg text-xs font-mono focus:outline-none animate-pulse"
                  />
                </div>
                <button
                  type="submit"
                  disabled={issuingToken}
                  className="w-full py-2 bg-saffron-550 hover:bg-saffron-600 text-white font-bold rounded-lg text-xs uppercase transition shadow cursor-pointer disabled:opacity-50"
                >
                  {issuingToken ? "Issuing..." : "Authorize Privilege"}
                </button>
              </form>
            ) : (
              <div className="space-y-2.5 max-h-[220px] overflow-y-auto pr-1 scrollbar-thin select-none">
                {tokens.length === 0 ? (
                  <div className="text-center py-8 text-slate-500 font-mono text-[9px]">
                    No active override tokens.
                  </div>
                ) : (
                  tokens.map(tok => {
                    const timeStr = getRemainingTimeStr(tok.expiresAt);
                    const isAlmostExpired = timeStr !== "EXPIRED" && timeStr.startsWith("00:00");
                    const isExpired = timeStr === "EXPIRED";

                    return (
                      <div key={tok._id} className={`p-2.5 rounded-xl border text-[10px] space-y-1.5 text-left ${
                        isExpired 
                          ? "bg-slate-950/40 border-slate-900 text-slate-500" 
                          : isAlmostExpired
                          ? "bg-amber-500/10 border-amber-500/25 text-amber-300 animate-pulse"
                          : "bg-slate-900 border-slate-800 text-slate-200"
                      }`}>
                        <div className="flex justify-between items-start">
                          <span className="font-bold truncate max-w-[130px]">{tok.employeeName}</span>
                          <span className={`px-1.5 py-0.5 rounded text-[8px] font-mono font-bold leading-none ${
                            isExpired 
                              ? "bg-slate-800 text-slate-400" 
                              : isAlmostExpired 
                              ? "bg-amber-505/20 text-amber-400" 
                              : "bg-emerald-500/15 text-emerald-400"
                          }`}>
                            {timeStr}
                          </span>
                        </div>
                        <div className="flex justify-between items-center text-[9px] text-slate-400 border-t border-slate-800/80 pt-1 mt-1 font-mono">
                          <span>{tok.scope}</span>
                          <span className="text-[8px] text-slate-500">M6 Key</span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}

