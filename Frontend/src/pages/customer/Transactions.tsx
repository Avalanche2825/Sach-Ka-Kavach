import React, { useMemo, useState } from "react";
import { Transaction } from "../../types.js";
import { History, Search, ArrowUpRight, ArrowDownLeft, Filter } from "lucide-react";
import { formatINR, formatTimestamp, formatRelative, maskAccount } from "../../lib/format.ts";
import EmptyState from "../../components/shared/EmptyState.tsx";

interface Props {
  customer: any;
  transactions: Transaction[];
}

const STATUS_MAP: Record<string, { label: string; bg: string; color: string }> = {
  Approved:          { label: "Completed",            bg: "#F0FDF4", color: "#16A34A" },
  Rejected:          { label: "Declined",             bg: "#FEF2F2", color: "#DC2626" },
  Pending:           { label: "Pending",              bg: "#FFFBEB", color: "#D97706" },
  OTP_Required:      { label: "Verification Required", bg: "#FFFBEB", color: "#D97706" },
  CIF_Required:      { label: "Verification Required", bg: "#FFFBEB", color: "#D97706" },
  Guardian_Required: { label: "Under Security Review",bg: "#FFFBEB", color: "#D97706" },
  HOLD:              { label: "Under Security Review",bg: "#FFFBEB", color: "#D97706" },
  BLOCK:             { label: "Declined",             bg: "#FEF2F2", color: "#DC2626" },
};

export default function Transactions({ customer, transactions }: Props) {
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("All");

  if (!customer) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: 400 }}>
        <div style={{ textAlign: "center", color: "#94A3B8", fontSize: 14 }}>No customer profile active.</div>
      </div>
    );
  }

  const personalTx = useMemo(() =>
    transactions.filter(t => t.cif === customer.cif),
    [transactions, customer.cif]
  );

  const filtered = useMemo(() =>
    personalTx.filter(t => {
      const q = search.toLowerCase();
      const matchSearch = !q || t.receiverName?.toLowerCase().includes(q) || t.accountNumber?.toLowerCase().includes(q);
      const matchStatus = filterStatus === "All" || t.status === filterStatus;
      return matchSearch && matchStatus;
    }),
    [personalTx, search, filterStatus]
  );

  const totalSent = personalTx.filter(t => t.status === "Approved").reduce((s, t) => s + t.amount, 0);
  const pendingCount = personalTx.filter(t => !["Approved","Rejected"].includes(t.status)).length;

  return (
    <div
      className="page-enter"
      style={{ background: "#F8F9FB", minHeight: "100vh", padding: "28px 32px", display: "flex", flexDirection: "column", gap: 20 }}
    >
      {/* Header */}
      <div>
        <div style={{ fontSize: 12, fontWeight: 600, color: "#64748B", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 4 }}>
          Bank of Baroda · Transaction History
        </div>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: "#0F172A", margin: 0 }}>My Transactions</h1>
        <div style={{ fontSize: 12, color: "#94A3B8", marginTop: 4 }}>
          {personalTx.length} total transfers for CIF {customer.cif}
        </div>
      </div>

      {/* Summary Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>
        {[
          { label: "Total Transactions", value: personalTx.length.toString(), color: "#1B2B6B" },
          { label: "Total Sent",         value: formatINR(totalSent),         color: "#16A34A" },
          { label: "Pending",            value: pendingCount.toString(),       color: "#D97706" },
        ].map((k, i) => (
          <div key={i} className="kpi-card" style={{ borderLeftColor: k.color }}>
            <div className="label-caps" style={{ marginBottom: 8 }}>{k.label}</div>
            <div style={{ fontFamily: "JetBrains Mono, monospace", fontVariantNumeric: "tabular-nums", fontSize: i === 1 ? 22 : 28, fontWeight: 700, color: "#0F172A" }}>
              {k.value}
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <div style={{ position: "relative", flex: 1, maxWidth: 320 }}>
          <Search style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", width: 13, height: 13, color: "#94A3B8" }} />
          <input
            className="input-field"
            style={{ paddingLeft: 30 }}
            placeholder="Search by recipient or account…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <select
          className="input-field"
          style={{ width: 180 }}
          value={filterStatus}
          onChange={e => setFilterStatus(e.target.value)}
        >
          <option value="All">All Statuses</option>
          {Object.keys(STATUS_MAP).map(s => (
            <option key={s} value={s}>{STATUS_MAP[s].label}</option>
          ))}
        </select>
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <EmptyState title="No transactions found" description="Try adjusting your filters." />
      ) : (
        <div className="card" style={{ padding: 0, overflow: "hidden" }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Date & Time</th>
                <th>Recipient</th>
                <th>Account</th>
                <th>Amount</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((t, i) => {
                const sm = STATUS_MAP[t.status] || { label: t.status, bg: "#F8F9FB", color: "#64748B" };
                return (
                  <tr key={t._id || i}>
                    <td>
                      <div style={{ fontSize: 12, color: "#0F172A" }}>{formatTimestamp(t.timestamp).split("IST")[0].trim()}</div>
                      <div style={{ fontSize: 10, color: "#94A3B8" }}>{formatRelative(t.timestamp)}</div>
                    </td>
                    <td style={{ fontSize: 13, fontWeight: 600, color: "#0F172A" }}>{t.receiverName || "—"}</td>
                    <td>
                      <span style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 11, color: "#64748B" }}>
                        {maskAccount(t.accountNumber)}
                      </span>
                    </td>
                    <td>
                      <div style={{
                        fontFamily: "JetBrains Mono, monospace", fontVariantNumeric: "tabular-nums",
                        fontSize: 14, fontWeight: 700, color: t.status === "Rejected" ? "#94A3B8" : "#0F172A",
                        display: "flex", alignItems: "center", gap: 5,
                      }}>
                        <ArrowUpRight style={{ width: 13, height: 13, color: "#94A3B8" }} />
                        {formatINR(t.amount)}
                      </div>
                    </td>
                    <td>
                      <span style={{ fontSize: 11, fontWeight: 600, padding: "3px 8px", borderRadius: 4, background: sm.bg, color: sm.color }}>
                        {sm.label}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
