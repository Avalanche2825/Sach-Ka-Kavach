import React, { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from "react-router-dom";
import {
  UserSession,
  Transaction,
  KYCApplication,
  EmployeeLog,
  AuditLog,
  Guardian
} from "./types.js";
import ActiveSessionMonitor from "./components/ActiveSessionMonitor.tsx";
import OfflineBanner from "./components/layout/OfflineBanner.tsx";
import TransactionForm from "./components/TransactionForm.tsx";
import GuardianConsole from "./components/GuardianConsole.tsx";
import KYCOnboarding from "./components/KYCOnboarding.tsx";
import AccountRecoveryPanel from "./components/AccountRecoveryPanel.tsx";
import AuditLedgerViewer from "./components/AuditLedgerViewer.tsx";
import LandingPage from "./components/LandingPage.tsx";
import LoginPage from "./components/LoginPage.tsx";
import Navbar from "./components/layout/Navbar.tsx";
import Sidebar from "./components/layout/Sidebar.tsx";
import TopBar from "./components/layout/TopBar.tsx";
import HackerDelayLayer from "./components/HackerDelayLayer.tsx";
import { startSignalCollection, stopSignalCollection, flushBehaviorSignals } from "./utils/behaviorCollector.ts";
import { socket } from "./api/socket.ts";

// Page Components
import CustomerDashboard from "./pages/customer/Dashboard.tsx";
import CustomerTransactions from "./pages/customer/Transactions.tsx";
import SecurityCenter from "./pages/customer/SecurityCenter.tsx";
import Transfer from "./pages/customer/Transfer.tsx";
import Profile from "./pages/customer/Profile.tsx";
import CustomerRecovery from "./pages/customer/Recovery.tsx";
import StaffDashboard from "./pages/staff/Dashboard.tsx";
import CustomerSearch from "./pages/staff/CustomerSearch.tsx";
import AdminConsole from "./pages/admin/AdminConsole.tsx";
import CommandCenter from "./pages/soc/CommandCenter.tsx";
import LiveMonitoring from "./pages/soc/LiveMonitoring.tsx";
import SocInvestigation from "./pages/soc/Investigation.tsx";
import FraudIntelligence from "./pages/soc/FraudIntelligence.tsx";
import BehaviorAnalytics from "./pages/soc/BehaviorAnalytics.tsx";
import SocAuditLogs from "./pages/soc/AuditLogs.tsx";
import { flushDeviceSignals } from "./utils/deviceCollector.ts";



import { motion, AnimatePresence } from "motion/react";

export default function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  );
}

function AppRoutes() {
  const navigate = useNavigate();

  // User state persisted in localStorage
  const [user, setUser] = useState<{ username: string; role: 'admin' | 'soc' | 'staff' | 'customer'; employeeId?: string; cif?: string } | null>(() => {
    const saved = localStorage.getItem("sach_user");
    return saved ? JSON.parse(saved) : null;
  });

  const isCustomer = user?.role === "customer";
  const isStaff = user?.role === "staff";
  const isSoc = user?.role === "soc";
  const isAdmin = user?.role === "admin";

  // Domain states (Empty by default, cached in localStorage)
  const [customers, setCustomers] = useState<UserSession[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<UserSession | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [kycApps, setKycApps] = useState<KYCApplication[]>([]);
  const [employeeLogs, setEmployeeLogs] = useState<EmployeeLog[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [guardians, setGuardians] = useState<Guardian[]>([]);
  const [guardian, setGuardian] = useState<Guardian | null>(null);

  const [loading, setLoading] = useState(false);

  const [apiOffline, setApiOffline] = useState(() => localStorage.getItem("sach_offline_mode") === "true");

  // --- CORE DATA SYNCHRONIZER LOOP ---
  const fetchAllData = async (forceCheckOffline = false) => {
    let isOffline = apiOffline;
    if (forceCheckOffline) {
      if (window.location.hostname === "localhost") {
        try {
          const res = await fetch("http://localhost:4000/", { mode: "cors" });
          isOffline = !res.ok;
        } catch (e) {
          isOffline = true;
        }
      } else {
        isOffline = false;
      }
      localStorage.setItem("sach_offline_mode", isOffline ? "true" : "false");
      setApiOffline(isOffline);
    }

    if (isOffline) {
      console.warn("Express API Server offline. Operating in client-side Standalone Demo mode.");
      return;
    }

    setLoading(true);
    try {
      const [uRes, tRes, kRes, eRes, aRes] = await Promise.all([
        fetch("/api/customers"),
        fetch("/api/transactions"),
        fetch("/api/kyc-applications"),
        fetch("/api/employee/logs"),
        fetch("/api/audit-logs")
      ]);

      const [uData, tData, kData, eData, aData] = await Promise.all([
        uRes.json(),
        tRes.json(),
        kRes.json(),
        eRes.json(),
        aRes.json()
      ]);

      setCustomers(uData || []);
      setTransactions(tData || []);
      setKycApps(kData || []);
      setEmployeeLogs(eData || []);
      setAuditLogs(aData || []);

      // Cache locally
      localStorage.setItem("sach_cached_customers", JSON.stringify(uData || []));
      localStorage.setItem("sach_cached_transactions", JSON.stringify(tData || []));
      localStorage.setItem("sach_cached_kyc", JSON.stringify(kData || []));
      localStorage.setItem("sach_cached_employee_logs", JSON.stringify(eData || []));
      localStorage.setItem("sach_cached_audit_logs", JSON.stringify(aData || []));

      // Refresh current selected customer if present
      if (selectedCustomer) {
        const fresh = (uData || []).find((c: any) => c.cif === selectedCustomer.cif);
        if (fresh) setSelectedCustomer(fresh);
      }
      setApiOffline(false);
    } catch (err) {
      console.warn("Express API Server offline. Displaying sync interruption banner.", err);
      setApiOffline(true);
    } finally {
      setLoading(false);
    }
  };

  const loadCachedData = () => {
    try {
      const c = localStorage.getItem("sach_cached_customers");
      const t = localStorage.getItem("sach_cached_transactions");
      const k = localStorage.getItem("sach_cached_kyc");
      const e = localStorage.getItem("sach_cached_employee_logs");
      const a = localStorage.getItem("sach_cached_audit_logs");

      if (c) setCustomers(JSON.parse(c));
      if (t) setTransactions(JSON.parse(t));
      if (k) setKycApps(JSON.parse(k));
      if (e) setEmployeeLogs(JSON.parse(e));
      if (a) setAuditLogs(JSON.parse(a));
    } catch (err) {
      console.error("Failed to load cached states from localStorage", err);
    }
  };

  const [sharedConfig, setSharedConfig] = useState<any>({
    behavior: { bufferIntervalSeconds: 30 }
  });

  useEffect(() => {
    fetch("/api/config")
      .then(res => res.json())
      .then(data => {
        setSharedConfig(data);
        console.log("[Client config] Loaded shared configuration:", data);
      })
      .catch(() => console.log("[Client config] Offline or failed to fetch config, using defaults."));
  }, []);

  useEffect(() => {
    const init = async () => {
      let isOffline = true;
      if (window.location.hostname === "localhost") {
        try {
          const res = await fetch("http://localhost:4000/", { mode: "cors" });
          if (res.ok) isOffline = false;
        } catch (e) {
          isOffline = true;
        }
      } else {
        isOffline = false;
      }
      localStorage.setItem("sach_offline_mode", isOffline ? "true" : "false");
      setApiOffline(isOffline);
      if (!isOffline) {
        fetchAllData(false);
      }
    };
    init();
  }, []);

  // Real-time trust score updates from Behavior Engine via WebSocket
  useEffect(() => {
    const handleTrustUpdate = (event: any) => {
      if (event && event.cif && event.trustScore !== undefined) {
        setCustomers(prev => prev.map(c =>
          c.cif === event.cif ? { ...c, trustScore: event.trustScore } : c
        ));
        setSelectedCustomer(prev =>
          prev && prev.cif === event.cif ? { ...prev, trustScore: event.trustScore } : prev
        );
      }
    };

    socket.on("trust_update", handleTrustUpdate);
    return () => { socket.off("trust_update", handleTrustUpdate); };
  }, []);

  // Fetch guardian whenever customer selection transitions
  useEffect(() => {
    if (!selectedCustomer) {
      setGuardian(null);
      return;
    }
    const fetchGuardian = async () => {
      try {
        const res = await fetch(`/api/customers/${selectedCustomer.cif}/guardian`);
        if (res.ok) {
          const data = await res.json();
          setGuardian(data);
        } else {
          throw new Error("No guardian found");
        }
      } catch (err) {
        const localG = guardians.find(g => g.cif === selectedCustomer.cif);
        setGuardian(localG || null);
      }
    };
    fetchGuardian();
  }, [selectedCustomer, guardians]);

  // Telemetry event ingestion hook for Module 1 & Module 2
  useEffect(() => {
    if (selectedCustomer) {
      startSignalCollection();
      
      const sessionSessionId = `sess_${selectedCustomer.cif}_${Date.now()}`;
      const bufferIntervalMs = (sharedConfig.behavior?.bufferIntervalSeconds || 30) * 1000;

      // Initial Module 2 Device Intelligence Ingestion
      flushDeviceSignals(selectedCustomer.cif, sessionSessionId, selectedCustomer.accountNumber).catch(() => {});

      const interval = setInterval(() => {
        flushBehaviorSignals(selectedCustomer.cif, sessionSessionId)
          .then(data => {
            if (data && data.trustScore !== undefined) {
              setCustomers(prev => prev.map(c => 
                c.cif === selectedCustomer.cif ? { ...c, trustScore: data.trustScore } : c
              ));
              setSelectedCustomer(prev => prev && prev.cif === selectedCustomer.cif ? { ...prev, trustScore: data.trustScore } : prev);
            }
          })
          .catch(err => console.warn("Behavior signals batch flush error:", err));
      }, bufferIntervalMs);

      return () => {
        clearInterval(interval);
        stopSignalCollection();
      };
    }
  }, [selectedCustomer, sharedConfig]);

  // --- CALL INTERACTION WRAPPERS ---

  const handleSelectCustomer = (customer: UserSession) => {
    setSelectedCustomer(customer);
    fetch(`/api/customers/${customer.cif}`)
      .then(res => res.json())
      .then(cData => {
        setSelectedCustomer(cData);
        setCustomers(prev => prev.map(c => c.cif === cData.cif ? cData : c));
      })
      .catch(() => {});
  };

  const handleRegisterGuardian = async (gName: string, relationship: string, phone: string) => {
    if (!selectedCustomer) return;
    try {
      const res = await fetch(`/api/customers/${selectedCustomer.cif}/guardian`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ guardianName: gName, relationship, phone })
      });
      if (res.ok) {
        const freshGuardian = await res.json();
        setGuardian(freshGuardian);
        fetchAllData();
        return;
      }
      throw new Error("offline");
    } catch (err) {
      const newGuardian: Guardian = {
        cif: selectedCustomer.cif,
        guardianName: gName,
        relationship,
        phone
      };
      setGuardians(prev => [...prev.filter(g => g.cif !== selectedCustomer.cif), newGuardian]);
      setGuardian(newGuardian);
    }
  };

  const handleAddKYCOnboarding = async (app: any) => {
    setLoading(true);
    try {
      const res = await fetch("/api/kyc-applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(app)
      });
      if (res.ok) {
        fetchAllData();
        return;
      }
      throw new Error("offline");
    } catch (err) {
      const isSuspicious = app.aadhaar?.startsWith("9999");
      const newApp: KYCApplication = {
        _id: `kyc_mock_${Date.now()}`,
        timestamp: new Date().toISOString(),
        name: app.name,
        aadhaar: app.aadhaar,
        pan: app.pan,
        deviceFingerprint: app.deviceFingerprint || "DEV_FING_999",
        ipAddress: app.ipAddress || "103.88.24.10",
        status: isSuspicious ? "Flagged" : "Approved",
        suspiciousMatches: isSuspicious 
          ? ["Device fingerprint or Aadhaar matches suspicious database entries"] 
          : []
      };
      setKycApps(prev => [newApp, ...prev]);

      // Log KYC audit
      const newAudit: AuditLog = {
        _id: `audit_mock_${Date.now()}`,
        timestamp: new Date().toISOString(),
        user: "Identity Manager Desk",
        event: `KYC Registration request evaluated for ${app.name}`,
        riskScore: isSuspicious ? 95 : 5,
        riskFactors: isSuspicious ? ["Shared device footprint flag"] : [],
        decision: isSuspicious ? "REJECTED_AND_BLOCKED" : "APPROVED_POST_VERIFICATION"
      };
      setAuditLogs(prev => [newAudit, ...prev]);
    } finally {
      setLoading(false);
    }
  };

  const handleAddEmployeeLog = async (logPayload: any) => {
    try {
      const res = await fetch("/api/employee/logs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(logPayload)
      });
      if (res.ok) {
        fetchAllData();
        return { success: true };
      } else {
        const data = await res.json();
        return { success: false, error: data.error || "Action blocked by security policies." };
      }
    } catch (err) {
      const ticketKey = `sach_ticket_${logPayload.customerCIF}`;
      const ticket = localStorage.getItem(ticketKey);
      
      const isAuthorized = ticket === "AUTHORIZED" || logPayload.employeeId === "EMP103";
      
      const newLog: EmployeeLog = {
        _id: `emp_log_mock_${Date.now()}`,
        timestamp: new Date().toISOString(),
        employeeId: logPayload.employeeId,
        employeeName: logPayload.employeeId === "EMP103" ? "Mohit Verma (DB Admin)" : "Branch Staff",
        action: logPayload.action,
        customerCIF: logPayload.customerCIF,
        outsideHours: new Date().getHours() < 9 || new Date().getHours() > 18,
        actionRiskScore: isAuthorized ? 15 : 100,
        managerApproved: isAuthorized,
        requiresManagerApproval: !isAuthorized
      };

      setEmployeeLogs(prev => [newLog, ...prev]);

      const newAudit: AuditLog = {
        _id: `audit_mock_${Date.now()}`,
        timestamp: new Date().toISOString(),
        user: logPayload.employeeId,
        event: `${logPayload.action} request for ${logPayload.customerCIF}`,
        riskScore: isAuthorized ? 15 : 100,
        riskFactors: isAuthorized ? [] : ["Access denied - No active customer OTP ticket"],
        decision: isAuthorized ? "APPROVED_POST_VERIFICATION" : "REJECTED_AND_BLOCKED"
      };
      setAuditLogs(prev => [newAudit, ...prev]);

      if (isAuthorized) {
        return { success: true };
      } else {
        return { success: false, error: "Access Denied: No active authorized customer OTP support ticket exists for this inquiry. Security alarm logged." };
      }
    }
  };

  const handleApproveEmployeeLog = async (id: string) => {
    try {
      const res = await fetch(`/api/employee/logs/${id}/approve`, {
        method: "POST"
      });
      if (res.ok) {
        fetchAllData();
        return;
      }
      throw new Error("offline");
    } catch (err) {
      setEmployeeLogs(prev => prev.map(log => log._id === id ? { ...log, managerApproved: true, requiresManagerApproval: false } : log));
    }
  };

  const handleApproveTx = async (id: string) => {
    try {
      const res = await fetch(`/api/transactions/${id}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ approverType: "guardian" })
      });
      if (res.ok) {
        fetchAllData();
        return;
      }
      throw new Error("offline");
    } catch (err) {
      setTransactions(prev => prev.map(tx => tx._id === id ? { ...tx, status: 'Approved' } : tx));
      
      const targetTx = transactions.find(t => t._id === id);
      const newAudit: AuditLog = {
        _id: `audit_mock_${Date.now()}`,
        timestamp: new Date().toISOString(),
        user: "Guardian Mobile Signature",
        event: `Guardian approved escrow transfer of ₹${targetTx?.amount.toLocaleString()} to ${targetTx?.receiverName}`,
        riskScore: 10,
        riskFactors: [],
        decision: "APPROVED_POST_VERIFICATION"
      };
      setAuditLogs(prev => [newAudit, ...prev]);
    }
  };

  const handleRejectTx = async (id: string) => {
    try {
      const res = await fetch(`/api/transactions/${id}/reject`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ approverType: "guardian" })
      });
      if (res.ok) {
        fetchAllData();
        return;
      }
      throw new Error("offline");
    } catch (err) {
      setTransactions(prev => prev.map(tx => tx._id === id ? { ...tx, status: 'Rejected' } : tx));
      
      const targetTx = transactions.find(t => t._id === id);
      const newAudit: AuditLog = {
        _id: `audit_mock_${Date.now()}`,
        timestamp: new Date().toISOString(),
        user: "Guardian Mobile Signature",
        event: `Guardian rejected escrow transfer of ₹${targetTx?.amount.toLocaleString()} to ${targetTx?.receiverName}`,
        riskScore: 90,
        riskFactors: ["Guardian rejection sign-off"],
        decision: "REJECTED_AND_BLOCKED"
      };
      setAuditLogs(prev => [newAudit, ...prev]);
    }
  };

  return (
    <Routes>
      <Route
        path="/"
        element={
          user ? (
            <Navigate to="/dashboard" replace />
          ) : (
            <LandingPage onLaunchConsole={() => navigate(user ? "/dashboard" : "/login")} />
          )
        }
      />
      <Route
        path="/login"
        element={
          user ? (
            <Navigate to="/dashboard" replace />
          ) : (
            <LoginPage
              onLoginSuccess={(userInfo) => {
                setUser(userInfo);
                localStorage.setItem("sach_user", JSON.stringify(userInfo));
                if (userInfo.cif) {
                  // Fetch real-world IP/Location telemetry from a free GeoIP API
                  fetch("https://ipapi.co/json/")
                    .then(res => res.json())
                    .then(geo => {
                      if (geo.ip) {
                        const locString = `${geo.city}, ${geo.region_code || geo.region}, ${geo.country_code}`;
                        fetch(`/api/customers/${userInfo.cif}/location`, {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ ip: geo.ip, location: locString })
                        })
                          .then(() => fetchAllData())
                          .catch(() => {});
                      }
                    })
                    .catch(() => {});

                  // Always fetch fresh customer data from API on login
                  // Never use stale `customers` state which may have data from a previous session
                  fetch(`/api/customers/${userInfo.cif}`)
                    .then(res => res.json())
                    .then(cData => {
                      if (cData && cData.cif) {
                        setSelectedCustomer(cData);
                        setCustomers(prev => [...prev.filter(c => c.cif !== cData.cif), cData]);
                      }
                    })
                    .catch(() => {
                      // Fallback: try local cache only if API fails
                      const cached = localStorage.getItem("sach_cached_customers");
                      if (cached) {
                        const list = JSON.parse(cached);
                        const found = list.find((c: any) => c.cif === userInfo.cif);
                        if (found) setSelectedCustomer(found);
                      }
                    });
                }
                navigate("/dashboard");
              }}
              onBackToLanding={() => navigate("/")}
            />
          )
        }
      />

      {/* Protected Console Views Layout */}
      <Route
        path="*"
        element={
          user ? (
            <div className="flex flex-col h-screen bg-[#f8fafc] font-sans text-slate-900 antialiased overflow-hidden">
              <div className="flex flex-1 h-full overflow-hidden">
                {/* Collapsible Left Sidebar - Desktop only */}
                <div className="hidden md:flex h-full shrink-0">
                  <Sidebar
                    user={user}
                    onLogout={() => {
                      setUser(null);
                      setSelectedCustomer(null);
                      setCustomers([]);
                      setTransactions([]);
                      localStorage.removeItem("sach_user");
                      localStorage.removeItem("sach_cached_customers");
                      localStorage.removeItem("sach_cached_transactions");
                      localStorage.removeItem("sach_cached_kyc");
                      localStorage.removeItem("sach_cached_employee_logs");
                      localStorage.removeItem("sach_cached_audit_logs");
                      navigate("/");
                    }}
                  />
                </div>

              {/* Mobile Top Navbar - Mobile only */}
              <div className="block md:hidden w-full fixed top-0 left-0 right-0 z-50">
                <Navbar
                  user={user}
                  onLogout={() => {
                    setUser(null);
                    setSelectedCustomer(null);
                    setCustomers([]);
                    setTransactions([]);
                    localStorage.removeItem("sach_user");
                    localStorage.removeItem("sach_cached_customers");
                    localStorage.removeItem("sach_cached_transactions");
                    localStorage.removeItem("sach_cached_kyc");
                    localStorage.removeItem("sach_cached_employee_logs");
                    localStorage.removeItem("sach_cached_audit_logs");
                    navigate("/");
                  }}
                  customers={customers}
                  transactions={transactions}
                  auditLogs={auditLogs}
                />
              </div>

              {/* Layout Content Wrapper */}
              <div className="flex-1 flex flex-col h-full overflow-hidden pt-16 md:pt-0">
                {/* Global Metrics Header - Desktop only */}
                <div className="hidden md:block w-full">
                  <TopBar
                    customers={customers}
                    transactions={transactions}
                    auditLogs={auditLogs}
                    user={user}
                  />
                </div>

                {/* Sub-view Viewport Panel with scroll */}
                <main className="flex-1 overflow-y-auto p-4 md:p-8 scrollbar-thin bg-slate-50/50">
                  {apiOffline && (
                    <div className="mb-4">
                      <OfflineBanner
                        onRetry={() => fetchAllData(true)}
                        onViewCached={loadCachedData}
                      />
                    </div>
                  )}

                  <Routes>
                    {isCustomer && (
                      // ── CUSTOMER ROLE PATHS ──────────────────────────────
                      <>
                        <Route
                          path="/dashboard"
                          element={
                            <CustomerDashboard
                              customer={selectedCustomer}
                              transactions={transactions}
                              onRefresh={fetchAllData}
                            />
                          }
                        />
                        <Route
                          path="/transfer"
                          element={
                            <Transfer
                              customer={selectedCustomer}
                              onRefresh={fetchAllData}
                            />
                          }
                        />
                        <Route
                          path="/transactions"
                          element={
                            <CustomerTransactions
                              customer={selectedCustomer}
                              transactions={transactions}
                            />
                          }
                        />
                        <Route
                          path="/security-center"
                          element={
                            <SecurityCenter
                              customer={selectedCustomer}
                              guardian={guardian}
                            />
                          }
                        />
                        <Route
                          path="/profile"
                          element={
                            <Profile
                              customer={selectedCustomer}
                            />
                          }
                        />
                        <Route
                          path="/recovery"
                          element={
                            <CustomerRecovery
                              customer={selectedCustomer}
                            />
                          }
                        />
                      </>
                    )}

                    {isStaff && (
                      // ── BANK STAFF OPERATIONAL PATHS ──────────────────────
                      <>
                        <Route
                          path="/dashboard"
                          element={
                            <StaffDashboard
                              customers={customers}
                              transactions={transactions}
                              kycApps={kycApps}
                            />
                          }
                        />
                        <Route
                          path="/customers"
                          element={
                            <CustomerSearch
                              customers={customers}
                              transactions={transactions}
                              kycApps={kycApps}
                            />
                          }
                        />
                        <Route
                          path="/kyc"
                          element={
                            <KYCOnboarding
                              kycApps={kycApps}
                              onAddApplication={handleAddKYCOnboarding}
                              loading={loading}
                            />
                          }
                        />
                        <Route
                          path="/recovery"
                          element={
                            <AccountRecoveryPanel
                              customers={customers}
                              onRecoveryTriggered={fetchAllData}
                            />
                          }
                        />
                        <Route path="/approvals" element={<CommandCenter />} />
                      </>
                    )}

                    {isSoc && (
                      // ── SOC OPERATIONAL PATHS ────────────────────────────
                      <>
                        <Route path="/dashboard" element={<CommandCenter />} />
                        <Route path="/customers" element={<CustomerSearch customers={customers} transactions={transactions} kycApps={kycApps} />} />
                        <Route path="/transactions" element={<CustomerTransactions customer={selectedCustomer} transactions={transactions} />} />
                        <Route path="/device-intel" element={<LiveMonitoring />} />
                        <Route path="/behavior-analytics" element={<BehaviorAnalytics />} />
                        <Route path="/behavior-analytics/:logId" element={<BehaviorAnalytics />} />
                        <Route path="/monitoring" element={<LiveMonitoring />} />
                        <Route path="/investigation/:id" element={<SocInvestigation />} />
                        <Route path="/investigation" element={<SocInvestigation />} />
                        <Route path="/intelligence" element={<FraudIntelligence />} />
                        <Route path="/recovery" element={<AccountRecoveryPanel customers={customers} onRecoveryTriggered={fetchAllData} />} />
                        <Route path="/employee-security" element={<SocAuditLogs />} />
                        <Route path="/threat-center" element={<CommandCenter />} />
                        <Route path="/audit" element={<SocAuditLogs />} />
                      </>
                    )}

                    {isAdmin && (
                      // ── ADMIN PORTAL PATHS ────────────────────────────────
                      <>
                        <Route path="/dashboard" element={<AdminConsole />} />
                        <Route path="/users" element={<AdminConsole />} />
                        <Route path="/roles" element={<AdminConsole />} />
                        <Route path="/config" element={<AdminConsole />} />
                        <Route path="/logs" element={<AdminConsole />} />
                      </>
                    )}

                    <Route path="*" element={<Navigate to="/dashboard" replace />} />
                  </Routes>
                </main>
              </div>
            </div>
          </div>
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />
    </Routes>
  );
}
