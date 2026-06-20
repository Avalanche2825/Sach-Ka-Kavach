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
import TransactionForm from "./components/TransactionForm.tsx";
import GuardianConsole from "./components/GuardianConsole.tsx";
import KYCOnboarding from "./components/KYCOnboarding.tsx";
import AccountRecoveryPanel from "./components/AccountRecoveryPanel.tsx";
import InsiderOverwatch from "./components/InsiderOverwatch.tsx";
import AuditLedgerViewer from "./components/AuditLedgerViewer.tsx";
import IdentityAnalyticsDashboard from "./components/IdentityAnalyticsDashboard.tsx";
import LandingPage from "./components/LandingPage.tsx";
import LoginPage from "./components/LoginPage.tsx";
import Navbar from "./components/layout/Navbar.tsx";
import Sidebar from "./components/layout/Sidebar.tsx";
import TopBar from "./components/layout/TopBar.tsx";
import HackerDelayLayer from "./components/HackerDelayLayer.tsx";

import {
  getInitialCustomers,
  getInitialGuardians,
  getInitialTransactions,
  getInitialKYCApplications,
  getInitialEmployeeLogs,
  getInitialAuditLogs
} from "./utils/mockData.ts";



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
  const [user, setUser] = useState<{ username: string; role: 'admin' | 'employee'; employeeId?: string } | null>(() => {
    const saved = localStorage.getItem("sach_user");
    return saved ? JSON.parse(saved) : null;
  });

  // Domain states (Pre-seeded for robust offline demo!)
  const [customers, setCustomers] = useState<UserSession[]>(getInitialCustomers);
  const [selectedCustomer, setSelectedCustomer] = useState<UserSession | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>(() => getInitialTransactions(getInitialCustomers()));
  const [kycApps, setKycApps] = useState<KYCApplication[]>(getInitialKYCApplications);
  const [employeeLogs, setEmployeeLogs] = useState<EmployeeLog[]>(getInitialEmployeeLogs);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(getInitialAuditLogs);
  const [guardians, setGuardians] = useState<Guardian[]>(getInitialGuardians);
  const [guardian, setGuardian] = useState<Guardian | null>(null);

  const [loading, setLoading] = useState(false);

  // --- CORE DATA SYNCHRONIZER LOOP ---
  const fetchAllData = async () => {
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

      // Refresh current selected customer if present
      if (selectedCustomer) {
        const fresh = (uData || []).find((c: any) => c.cif === selectedCustomer.cif);
        if (fresh) setSelectedCustomer(fresh);
      }
    } catch (err) {
      console.warn("Express API Server offline. Operating in client-side Standalone Demo mode.", err);
      // Fallback: local states are already pre-seeded and active!
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
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

  // --- CALL INTERACTION WRAPPERS ---

  const handleSelectCustomer = (customer: UserSession) => {
    setSelectedCustomer(customer);
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
            <div className="flex h-screen bg-[#f8fafc] font-sans text-slate-900 antialiased overflow-hidden">
              {/* Collapsible Left Sidebar - Desktop only */}
              <div className="hidden md:flex h-full shrink-0">
                <Sidebar
                  user={user}
                  onLogout={() => {
                    setUser(null);
                    localStorage.removeItem("sach_user");
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
                    localStorage.removeItem("sach_user");
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
                  <Routes>
                    <Route
                      path="/dashboard"
                      element={
                        <IdentityAnalyticsDashboard
                          customers={customers}
                          transactions={transactions}
                          kycApps={kycApps}
                        />
                      }
                    />
                    <Route
                      path="/sessions"
                      element={
                        <ActiveSessionMonitor
                          customers={customers}
                          selectedCustomer={selectedCustomer}
                          onSelectCustomer={handleSelectCustomer}
                          transactions={transactions}
                          onTriggerAnalyse={async () => {}}
                        />
                      }
                    />
                    <Route
                      path="/transactions"
                      element={
                        <TransactionForm
                          selectedCustomer={selectedCustomer}
                          onRefreshHistory={fetchAllData}
                          guardian={guardian}
                        />
                      }
                    />
                    <Route
                      path="/guardian"
                      element={
                        <GuardianConsole
                          selectedCustomer={selectedCustomer}
                          guardian={guardian}
                          onRegisterGuardian={handleRegisterGuardian}
                          pendingTx={transactions.filter(
                            (t) => t.status !== "Approved" && t.status !== "Rejected"
                          )}
                          onApproveTx={handleApproveTx}
                          onRejectTx={handleRejectTx}
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
                    <Route
                      path="/insider"
                      element={
                        <InsiderOverwatch
                          customers={customers}
                          employeeLogs={employeeLogs}
                          onAddEmployeeLog={handleAddEmployeeLog}
                          onApproveEmployeeLog={handleApproveEmployeeLog}
                        />
                      }
                    />
                    <Route path="/hacker-delay" element={<HackerDelayLayer />} />
                    <Route path="/audit" element={<AuditLedgerViewer auditLogs={auditLogs} />} />
                    <Route path="*" element={<Navigate to="/dashboard" replace />} />
                  </Routes>
                </main>
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
