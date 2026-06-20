import React, { useState, useMemo } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Activity,
  Send,
  Users,
  UserCheck,
  UserX,
  Laptop,
  FileText,
  Hourglass,
  Menu,
  X,
  LogOut,
  ShieldCheck,
  Bell,
  ShieldAlert
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { UserSession, Transaction, AuditLog } from "../../types.js";

interface NavbarProps {
  user: { username: string; role: 'admin' | 'employee'; employeeId?: string } | null;
  onLogout: () => void;
  customers: UserSession[];
  transactions: Transaction[];
  auditLogs: AuditLog[];
}

export default function Navbar({ user, onLogout, customers = [], transactions = [], auditLogs = [] }: NavbarProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const location = useLocation();

  // Metrics
  const totalProtected = useMemo(() => {
    return customers.reduce((sum, c) => sum + c.balance, 0);
  }, [customers]);

  const avgTrustIndex = useMemo(() => {
    if (customers.length === 0) return 85;
    return Math.round(customers.reduce((sum, c) => sum + c.trustScore, 0) / customers.length);
  }, [customers]);

  const escrowLocks = useMemo(() => {
    return transactions.filter(t => ["OTP_Required", "CIF_Required", "Guardian_Required"].includes(t.status)).length;
  }, [transactions]);

  const blockedExploits = useMemo(() => {
    return auditLogs.filter(l => l.decision === "REJECTED_AND_BLOCKED" || l.riskScore > 75).length;
  }, [auditLogs]);

  const recentAlerts = useMemo(() => {
    return auditLogs
      .filter(l => l.riskScore > 50)
      .slice(0, 5);
  }, [auditLogs]);

  const navLinks = [
    { path: "/dashboard", label: "Threat Analytics", icon: LayoutDashboard },
    { path: "/sessions", label: "Live Sessions Monitor", icon: Activity },
    { path: "/transactions", label: "Escrow Transfers", icon: Send },
    { path: "/guardian", label: "Guardian Protection", icon: Users },
    { path: "/kyc", label: "Identity Onboarding", icon: UserCheck },
    { path: "/recovery", label: "Recovery Sandbox", icon: UserX },
    { path: "/insider", label: "Insider Overwatch", icon: Laptop },
    { path: "/hacker-delay", label: "Hacker Delay Layer", icon: Hourglass },
    { path: "/audit", label: "Audit Ledger", icon: FileText }
  ];

  return (
    <nav className="bg-[#0a1628] text-white select-none border-b border-slate-800 relative z-50">
      {/* Row 1: Brand, Desktop KPIs, Controls */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        
        {/* Brand Logo */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-saffron-500 rounded-xl flex items-center justify-center shrink-0 shadow-lg shadow-saffron-550/20">
            <ShieldCheck className="w-5 h-5 text-white" />
          </div>
          <div className="flex flex-col">
            <span className="font-extrabold text-xs tracking-tight text-white font-mono uppercase">SACH Kavach</span>
            <span className="text-[8px] text-saffron-400 font-mono tracking-widest leading-none mt-0.5">BHARAT TRUST GRID</span>
          </div>
        </div>

        {/* Desktop KPIs */}
        <div className="hidden lg:flex items-center gap-6 xl:gap-8 text-[11px] font-semibold border-l border-slate-800 pl-6 ml-6">
          <div className="flex flex-col">
            <span className="text-[8px] font-bold text-slate-400 uppercase tracking-wider">Total Protected</span>
            <span className="text-xs font-extrabold text-white font-mono">₹{(totalProtected / 10000000).toFixed(2)}Cr</span>
          </div>
          <div className="flex flex-col border-l border-slate-800 pl-6">
            <span className="text-[8px] font-bold text-slate-400 uppercase tracking-wider">Base Trust Index</span>
            <span className="text-xs font-extrabold text-emerald-400 font-mono">{avgTrustIndex}%</span>
          </div>
          <div className="flex flex-col border-l border-slate-800 pl-6">
            <span className="text-[8px] font-bold text-slate-400 uppercase tracking-wider">Escrow Locks</span>
            <span className="text-xs font-extrabold text-amber-500 font-mono">{escrowLocks}</span>
          </div>
          <div className="flex flex-col border-l border-slate-800 pl-6">
            <span className="text-[8px] font-bold text-slate-400 uppercase tracking-wider">Blocked Exploits</span>
            <span className="text-xs font-extrabold text-red-400 font-mono">{blockedExploits}</span>
          </div>
        </div>

        {/* Right actions (Bell, User, Hamburger) */}
        <div className="flex items-center gap-4">
          
          {/* Status badge desktop */}
          <div className="hidden sm:flex items-center gap-2 bg-slate-900 border border-slate-800 px-3 py-1 rounded-xl">
            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
            <span className="text-[9px] font-bold text-slate-300 font-mono uppercase tracking-wider">SECURE GRID ACTIVE</span>
          </div>

          {/* Alerts Bell */}
          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="p-2 hover:bg-slate-850 rounded-xl text-slate-400 hover:text-white transition-colors relative cursor-pointer"
              title="Security events logs"
            >
              <Bell className="w-4.5 h-4.5" />
              {recentAlerts.length > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full ring-2 ring-[#0a1628] animate-ping"></span>
              )}
            </button>

            {/* Notification Drawer */}
            <AnimatePresence>
              {showNotifications && (
                <>
                  <div className="fixed inset-0 z-45" onClick={() => setShowNotifications(false)} />
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 mt-3 w-80 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl z-50 overflow-hidden font-sans"
                  >
                    <div className="p-3 border-b border-slate-850 bg-slate-950 text-white flex justify-between items-center">
                      <span className="text-xs font-extrabold uppercase font-mono tracking-wider">Security Alerts</span>
                      <span className="text-[9px] bg-red-500 text-white font-bold px-1.5 py-0.5 rounded font-mono">
                        {recentAlerts.length} High Risk
                      </span>
                    </div>

                    <div className="max-h-80 overflow-y-auto divide-y divide-slate-850">
                      {recentAlerts.length === 0 ? (
                        <div className="p-6 text-center text-xs text-slate-500 font-mono">
                          No critical threats logged today.
                        </div>
                      ) : (
                        recentAlerts.map(alert => (
                          <div key={alert._id} className="p-3 hover:bg-slate-850/50 transition-colors">
                            <div className="flex gap-2.5 items-start">
                              <ShieldAlert className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                              <div className="flex-1">
                                <div className="flex justify-between items-center">
                                  <span className="text-[10px] font-bold text-white line-clamp-1 flex-1">
                                    {alert.event}
                                  </span>
                                  <span className="text-[9px] font-mono font-bold px-1 bg-red-500/20 text-red-400 rounded shrink-0 ml-1.5">
                                    {alert.riskScore}
                                  </span>
                                </div>
                                <p className="text-[9px] text-slate-400 mt-1 font-mono">
                                  {new Date(alert.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })} — {alert.decision}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>

          {/* User profile details desktop */}
          <div className="hidden md:flex items-center gap-2 border-l border-slate-800 pl-4">
            <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center font-bold text-xs uppercase text-slate-300 border border-slate-700 font-mono">
              {user?.username ? user.username.substring(0, 2) : "US"}
            </div>
            <div className="flex flex-col text-left">
              <span className="text-[10px] font-bold text-white leading-none">{user?.username}</span>
              <span className="text-[8px] text-slate-400 uppercase tracking-wider font-mono mt-1 leading-none">{user?.role}</span>
            </div>
            <button
              onClick={onLogout}
              className="p-1.5 ml-2 hover:bg-red-500/10 text-slate-400 hover:text-red-400 rounded-lg transition-colors cursor-pointer"
              title="Sign out of Console"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>

          {/* Hamburger Mobile Menu Toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 hover:bg-slate-850 rounded-xl text-slate-400 hover:text-white md:hidden cursor-pointer"
            title="Toggle Menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

        </div>
      </div>

      {/* Row 2: Desktop Navigation Sub-bar */}
      <div className="hidden md:block border-t border-slate-850 bg-[#070e1b]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center overflow-x-auto scrollbar-none gap-1 py-1.5">
          {navLinks.map(link => {
            const Icon = link.icon;
            const isActive = location.pathname === link.path;

            return (
              <Link
                key={link.path}
                to={link.path}
                className={`flex items-center gap-2 py-1.5 px-3 rounded-lg text-[11px] font-bold tracking-wide transition-all whitespace-nowrap ${
                  isActive
                    ? "bg-saffron-500/10 text-saffron-550 border border-saffron-500/35"
                    : "text-slate-400 hover:text-white hover:bg-slate-800/40"
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? "text-saffron-550" : "text-slate-550"}`} />
                <span>{link.label}</span>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Mobile Drawer Overlay */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="md:hidden border-t border-slate-800 bg-[#070e1b] overflow-hidden"
          >
            {/* Mobile Nav Links */}
            <div className="px-4 py-3 space-y-1">
              {navLinks.map(link => {
                const Icon = link.icon;
                const isActive = location.pathname === link.path;

                return (
                  <Link
                    key={link.path}
                    to={link.path}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-3 py-2 px-3 rounded-xl text-xs font-bold transition-all ${
                      isActive
                        ? "bg-saffron-500/10 text-saffron-500 border-l-4 border-saffron-500"
                        : "text-slate-400 hover:text-white hover:bg-slate-800/40"
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{link.label}</span>
                  </Link>
                );
              })}
            </div>

            {/* Mobile User Profile Section */}
            <div className="border-t border-slate-850 p-4 bg-slate-950/40 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center font-bold text-xs uppercase text-slate-300 border border-slate-700 font-mono">
                  {user?.username ? user.username.substring(0, 2) : "US"}
                </div>
                <div className="flex flex-col text-left">
                  <span className="text-[10px] font-bold text-white leading-none">{user?.username}</span>
                  <span className="text-[8px] text-slate-400 uppercase tracking-wider font-mono mt-1 leading-none">{user?.role}</span>
                </div>
              </div>
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  onLogout();
                }}
                className="px-3 py-1.5 rounded-lg border border-red-500/20 bg-red-500/10 text-red-400 hover:text-white hover:bg-red-500 font-bold text-[10px] flex items-center gap-1 cursor-pointer transition-colors"
              >
                <LogOut className="w-3 h-3" />
                Sign Out
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
