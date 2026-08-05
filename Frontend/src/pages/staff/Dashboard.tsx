import React, { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { UserSession, Transaction, KYCApplication } from "../../types.js";
import { Users, FileText, CheckSquare, AlertOctagon, Search, ChevronRight } from "lucide-react";
import { formatINR, formatRelative } from "../../lib/format.ts";
import RiskScoreBadge from "../../components/shared/RiskScoreBadge.tsx";

interface StaffDashboardProps {
  customers: UserSession[];
  transactions: Transaction[];
  kycApps: KYCApplication[];
  user?: { username: string; role: string } | null;
}

function KpiCard({ label, value, sub, color, icon: Icon }: {
  label: string; value: number | string; sub: string; color: string; icon: any;
}) {
  return (
    <div className="kpi-card" style={{ borderLeftColor: color }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 10 }}>
        <div className="label-caps">{label}</div>
        <div style={{ width: 32, height: 32, borderRadius: 8, background: `${color}15`, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Icon style={{ width: 15, height: 15, color }} />
        </div>
      </div>
      <div style={{ fontFamily: "JetBrains Mono, monospace", fontVariantNumeric: "tabular-nums", fontSize: 28, fontWeight: 700, color: "#0F172A", lineHeight: 1, marginBottom: 6 }}>
        {value}
      </div>
      <div style={{ fontSize: 12, color: "#64748B" }}>{sub}</div>
    </div>
  );
}

export default function StaffDashboard({ customers = [], transactions = [], kycApps = [], user }: StaffDashboardProps) {
  const navigate = useNavigate();

  const pendingKYC = kycApps.filter(k => k.status === "Pending").length;
  const pendingApprovals = transactions.filter(t =>
    ["OTP_Required", "CIF_Required", "Guardian_Required", "Pending"].includes(t.status)
  ).length;
  const fraudAlerts = transactions.filter(t => t.status === "Rejected").length;

  const recentTx = useMemo(() =>
    [...transactions]
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 8),
    [transactions]
  );

  return (
    <div
      className="page-enter"
      style={{ background: "#F8F9FB", minHeight: "100vh", padding: "28px 32px", display: "flex", flexDirection: "column", gap: 24 }}
    >
      {/* Header */}
      <div>
        <div style={{ fontSize: 12, fontWeight: 600, color: "#64748B", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 4 }}>
          Bank of Baroda · Branch Operations
        </div>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: "#0F172A", margin: 0 }}>
          Staff Dashboard
        </h1>
        <div style={{ fontSize: 12, color: "#94A3B8", marginTop: 4 }}>
          Welcome back, {user?.username || "Officer"}
        </div>
      </div>

      {/* KPI Row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16 }}>
        <KpiCard label="Registered Clients"    value={customers.length}  sub="Active accounts"              color="#1B2B6B" icon={Users} />
        <KpiCard label="Pending KYC"           value={pendingKYC}        sub="Awaiting document review"     color="#D97706" icon={FileText} />
        <KpiCard label="Escrow Holds"          value={pendingApprovals}  sub="Transfers locked for review"  color="#7C3AED" icon={CheckSquare} />
        <KpiCard label="Fraud Alerts"          value={fraudAlerts}       sub="Rejected transactions"        color="#DC2626" icon={AlertOctagon} />
      </div>

      {/* Quick Actions */}
      <div>
        <div className="label-caps" style={{ marginBottom: 12 }}>Quick Tasks</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
          {[
            { label: "Search Customer", sub: "Look up CIF or name", icon: Search, route: "/customers", color: "#2563EB" },
            { label: "KYC Verification", sub: `${pendingKYC} pending`, icon: FileText, route: "/kyc", color: "#D97706" },
            { label: "Approve Holds", sub: `${pendingApprovals} pending`, icon: CheckSquare, route: "/approvals", color: "#7C3AED" },
          ].map((a, i) => {
            const Icon = a.icon;
            return (
              <div
                key={i}
                className="card card-hover"
                style={{ cursor: "pointer", padding: "16px 18px", display: "flex", alignItems: "center", gap: 14 }}
                onClick={() => navigate(a.route)}
              >
                <div style={{ width: 40, height: 40, borderRadius: 10, background: `${a.color}12`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <Icon style={{ width: 18, height: 18, color: a.color }} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "#0F172A" }}>{a.label}</div>
                  <div style={{ fontSize: 11, color: "#64748B" }}>{a.sub}</div>
                </div>
                <ChevronRight style={{ width: 15, height: 15, color: "#94A3B8" }} />
              </div>
            );
          })}
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="card" style={{ padding: 0, overflow: "hidden" }}>
        <div style={{ padding: "16px 20px", borderBottom: "1px solid #F1F5F9", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ fontSize: 15, fontWeight: 600, color: "#0F172A" }}>Recent Transactions</div>
          <span style={{ fontSize: 11, color: "#64748B" }}>{transactions.length} total</span>
        </div>
        {recentTx.length === 0 ? (
          <div style={{ padding: "40px 0", textAlign: "center", color: "#94A3B8", fontSize: 13 }}>No transactions yet.</div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Customer</th>
                <th>Recipient</th>
                <th>Amount</th>
                <th>Risk</th>
                <th>Status</th>
                <th>Time</th>
              </tr>
            </thead>
            <tbody>
              {recentTx.map((tx, i) => (
                <tr key={tx._id || i}>
                  <td style={{ fontSize: 12, fontWeight: 600, color: "#0F172A" }}>{tx.cif}</td>
                  <td style={{ fontSize: 12, color: "#0F172A" }}>{tx.receiverName}</td>
                  <td style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 13, fontWeight: 700, color: "#0F172A", fontVariantNumeric: "tabular-nums" }}>
                    {formatINR(tx.amount)}
                  </td>
                  <td><RiskScoreBadge score={tx.riskScore || 0} size="sm" /></td>
                  <td>
                    <span style={{
                      fontSize: 11, fontWeight: 600, padding: "2px 7px", borderRadius: 4,
                      background: tx.status === "Approved" ? "#F0FDF4" : tx.status === "Rejected" ? "#FEF2F2" : "#FFFBEB",
                      color: tx.status === "Approved" ? "#16A34A" : tx.status === "Rejected" ? "#DC2626" : "#D97706",
                    }}>
                      {tx.status}
                    </span>
                  </td>
                  <td style={{ fontSize: 11, color: "#94A3B8" }}>{formatRelative(tx.timestamp)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
