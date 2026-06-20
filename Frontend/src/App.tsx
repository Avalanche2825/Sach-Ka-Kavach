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
import HackerDelayLayer from "./components/HackerDelayLayer.tsx";


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

  // Domain states
  const [customers, setCustomers] = useState<UserSession[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<UserSession | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [kycApps, setKycApps] = useState<KYCApplication[]>([]);
  const [employeeLogs, setEmployeeLogs] = useState<EmployeeLog[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
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
      console.error("Error loading server-side datasets:", err);
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
          setGuardian(null);
        }
      } catch (err) {
        setGuardian(null);
      }
    };
    fetchGuardian();
  }, [selectedCustomer]);

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
      }
    } catch (err) {
      console.error(err);
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
      }
    } catch (err) {
      console.error(err);
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
      console.error(err);
      return { success: false, error: "Network error contacting security gateway." };
    }
  };

  const handleApproveEmployeeLog = async (id: string) => {
    try {
      const res = await fetch(`/api/employee/logs/${id}/approve`, {
        method: "POST"
      });
      if (res.ok) {
        fetchAllData();
      }
    } catch (err) {
      console.error(err);
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
      }
    } catch (err) {
      console.error(err);
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
      }
    } catch (err) {
      console.error(err);
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
            <div className="flex flex-col h-screen bg-[#f8fafc] font-sans text-slate-900 antialiased overflow-hidden">
              {/* Global Top Navbar */}
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
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
    </Routes>
  );
}
