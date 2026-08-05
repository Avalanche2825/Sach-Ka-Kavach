import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard, Users, FileText, Laptop, Activity,
  Network, Key, ShieldCheck, AlertTriangle, User,
  ChevronLeft, ChevronRight, LogOut, Send, Lock
} from "lucide-react";

interface SidebarProps {
  user: { username: string; role: string; cif?: string } | null;
  onLogout: () => void;
}

const CUSTOMER_NAV = [
  { path: "/dashboard",        label: "Dashboard",       icon: LayoutDashboard },
  { path: "/transfer",         label: "Fund Transfer",   icon: Send },
  { path: "/transactions",     label: "History",         icon: FileText },
  { path: "/security-center",  label: "Security",       icon: Lock },
  { path: "/recovery",         label: "Account Recovery",icon: Key },
  { path: "/profile",          label: "My Profile",      icon: User },
];

const SOC_NAV = [
  { path: "/dashboard",        label: "SOC Dashboard",       icon: LayoutDashboard },
  { path: "/customers",        label: "Customers",           icon: Users },
  { path: "/transactions",     label: "Transactions",        icon: FileText },
  { path: "/device-intel",     label: "Device Intelligence", icon: Laptop },
  { path: "/behavior-analytics", label: "Behavior Analytics", icon: Activity },
  { path: "/intelligence",     label: "KYC / Identity Graph",icon: Network },
  { path: "/recovery",         label: "Account Recovery",    icon: Key },
  { path: "/employee-security",label: "Employee Security",   icon: ShieldCheck },
  { path: "/threat-center",    label: "Threat Center",       icon: AlertTriangle },
  { path: "/profile",          label: "Profile",             icon: User },
];

export default function Sidebar({ user, onLogout }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const isCustomer = user?.role === "customer";
  const navLinks = isCustomer ? CUSTOMER_NAV : SOC_NAV;

  const isActive = (path: string) => {
    if (path === "/intelligence" && (location.pathname.includes("intelligence") || location.pathname.includes("kyc"))) return true;
    if (path === "/customers" && location.pathname.includes("customer")) return true;
    return location.pathname === path;
  };

  return (
    <aside
      className={`h-full bg-white border-r border-slate-200 flex flex-col justify-between transition-all duration-200 select-none z-30 ${
        collapsed ? 'w-16' : 'w-60'
      }`}
    >
      <div className="flex flex-col h-full">
        {/* Sidebar Header */}
        <div className="h-16 px-4 border-b border-slate-200 flex items-center justify-between">
          {!collapsed && (
            <div className="flex items-center gap-2">
              <div className={`p-1.5 rounded-lg text-white font-bold text-xs ${isCustomer ? 'bg-[#F26522]' : 'bg-[#1E293B]'}`}>
                {isCustomer ? 'BOB' : 'SOC'}
              </div>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-700 font-mono">
                {isCustomer ? 'Net Banking' : 'SECURITY OPERATIONS'}
              </span>
            </div>
          )}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        {/* Nav Links */}
        <div className="flex-1 overflow-y-auto p-3 space-y-1 scrollbar-thin">
          {navLinks.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);

            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                  active
                    ? (isCustomer
                        ? 'bg-orange-500 text-white shadow-md shadow-orange-500/20'
                        : 'bg-[#1E3A8A] text-white shadow-md shadow-blue-900/20 font-bold')
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <Icon className={`w-4 h-4 flex-shrink-0 ${active ? 'text-white' : 'text-slate-400'}`} />
                {!collapsed && <span>{item.label}</span>}
              </Link>
            );
          })}
        </div>

        {/* Footer System Badge */}
        {!collapsed && (
          <div className="p-3 border-t border-slate-200 bg-slate-50/50">
            {isCustomer ? (
              <div className="text-[10px] text-slate-500 font-medium">
                <span className="font-bold text-[#F26522]">Bank of Baroda</span> · Secure 256-bit Net Banking
              </div>
            ) : (
              <div className="bg-blue-50/80 border border-blue-200/80 rounded-xl p-2.5 space-y-1">
                <div className="flex items-center gap-1.5 text-[11px] font-bold text-blue-900">
                  <div className="w-2 h-2 rounded-full bg-blue-600 animate-ping" />
                  SACH KA KAVACH v2.4
                </div>
                <p className="text-[9px] text-slate-500 leading-tight">
                  Powered by Bank of Baroda Security Grid & AI Isolation Forest
                </p>
              </div>
            )}
          </div>
        )}

        {/* Logout Row */}
        <div className="p-3 border-t border-slate-200">
          <button
            onClick={onLogout}
            className="w-full flex items-center gap-3 px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 rounded-xl transition"
          >
            <LogOut className="w-4 h-4" />
            {!collapsed && <span>Logout</span>}
          </button>
        </div>
      </div>
    </aside>
  );
}
