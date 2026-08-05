import React, { useEffect, useState, useMemo } from "react";
import { auditApi } from "../../lib/api.ts";
import { formatTimestamp, formatRelative } from "../../lib/format.ts";
import { scoreToColor, scoreToLabel, scoreToBadgeClass } from "../../lib/risk-utils.ts";
import RiskScoreBadge from "../../components/shared/RiskScoreBadge.tsx";
import { RiskSignalList } from "../../components/shared/RiskSignalBadge.tsx";
import { TableSkeleton } from "../../components/shared/LoadingState.tsx";
import EmptyState from "../../components/shared/EmptyState.tsx";
import { FileText, Search, X, ChevronRight, BarChart2 } from "lucide-react";
import {
  BarChart, Bar, Cell, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid
} from "recharts";

const DECISIONS = ["All", "ALLOW", "OTP_Required", "BLOCK", "HOLD", "ALERT"];
const RISK_LEVELS = ["All", "Critical (80+)", "High (60-79)", "Medium (40-59)", "Low (0-39)"];

export default function AuditLogs() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterDecision, setFilterDecision] = useState("All");
  const [filterRisk, setFilterRisk] = useState("All");
  const [selected, setSelected] = useState<any | null>(null);

  useEffect(() => {
    auditApi.list()
      .then(data => setLogs(Array.isArray(data) ? data : []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    return logs.filter(l => {
      const q = search.toLowerCase();
      const matchSearch = !q || l.event?.toLowerCase().includes(q) || l.user?.toLowerCase().includes(q) || l.decision?.toLowerCase().includes(q);
      const matchDecision = filterDecision === "All" || l.decision === filterDecision;
      const score = l.riskScore || 0;
      const matchRisk = filterRisk === "All"
        || (filterRisk.startsWith("Critical") && score >= 80)
        || (filterRisk.startsWith("High") && score >= 60 && score < 80)
        || (filterRisk.startsWith("Medium") && score >= 40 && score < 60)
        || (filterRisk.startsWith("Low") && score < 40);
      return matchSearch && matchDecision && matchRisk;
    });
  }, [logs, search, filterDecision, filterRisk]);

  // Distribution data for bar chart
  const distData = useMemo(() => {
    const counts: Record<string, number> = { "Critical": 0, "High": 0, "Medium": 0, "Low": 0 };
    logs.forEach(l => {
      const s = l.riskScore || 0;
      if (s >= 80) counts["Critical"]++;
      else if (s >= 60) counts["High"]++;
      else if (s >= 40) counts["Medium"]++;
      else counts["Low"]++;
    });
    return [
      { name: "Critical", value: counts.Critical, fill: "#DC2626" },
      { name: "High",     value: counts.High,     fill: "#EA580C" },
      { name: "Medium",   value: counts.Medium,   fill: "#D97706" },
      { name: "Low",      value: counts.Low,      fill: "#16A34A" },
    ];
  }, [logs]);

  return (
    <div
      className="page-enter"
      style={{ background: "#F8F9FB", minHeight: "100vh", padding: "28px 32px", display: "flex", flexDirection: "column", gap: 20 }}
    >
      {/* Header */}
      <div className="card" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "18px 24px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <FileText style={{ width: 20, height: 20, color: "#1B2B6B" }} />
          <div>
            <h1 style={{ fontSize: 17, fontWeight: 700, color: "#0F172A", margin: 0 }}>Audit Ledger</h1>
            <div style={{ fontSize: 12, color: "#64748B" }}>{logs.length} events · Immutable Blockchain Record</div>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: "#16A34A", fontWeight: 600 }}>
          <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#16A34A", display: "inline-block" }} />
          Live
        </div>
      </div>

      {/* Filters */}
      <div className="card" style={{ padding: "14px 20px", display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
        {/* Search */}
        <div style={{ position: "relative", flex: 1, minWidth: 200 }}>
          <Search style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", width: 13, height: 13, color: "#94A3B8" }} />
          <input
            className="input-field"
            style={{ paddingLeft: 30 }}
            placeholder="Search events, users, decisions…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        {/* Decision filter */}
        <select
          className="input-field"
          style={{ width: 170 }}
          value={filterDecision}
          onChange={e => setFilterDecision(e.target.value)}
        >
          {DECISIONS.map(d => <option key={d} value={d}>{d === "All" ? "All Decisions" : d}</option>)}
        </select>

        {/* Risk filter */}
        <select
          className="input-field"
          style={{ width: 180 }}
          value={filterRisk}
          onChange={e => setFilterRisk(e.target.value)}
        >
          {RISK_LEVELS.map(r => <option key={r} value={r}>{r === "All" ? "All Risk Levels" : r}</option>)}
        </select>

        {(search || filterDecision !== "All" || filterRisk !== "All") && (
          <button
            className="btn btn-ghost btn-sm"
            onClick={() => { setSearch(""); setFilterDecision("All"); setFilterRisk("All"); }}
          >
            <X style={{ width: 12, height: 12 }} /> Clear
          </button>
        )}
      </div>

      {/* Main content */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 300px", gap: 20, flex: 1 }}>

        {/* Table */}
        <div className="card" style={{ padding: 0, overflow: "hidden" }}>
          {loading ? (
            <div style={{ padding: 20 }}><TableSkeleton rows={8} cols={5} /></div>
          ) : filtered.length === 0 ? (
            <EmptyState title="No audit logs found" description="Try adjusting your filters." />
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Timestamp</th>
                    <th>User / System</th>
                    <th>Event</th>
                    <th>Risk Score</th>
                    <th>Decision</th>
                    <th style={{ width: 40 }} />
                  </tr>
                </thead>
                <tbody>
                  {filtered.slice(0, 100).map((log, i) => (
                    <tr
                      key={log._id || i}
                      style={{ cursor: "pointer" }}
                      onClick={() => setSelected(log)}
                    >
                      <td style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 11, color: "#64748B", whiteSpace: "nowrap" }}>
                        {formatTimestamp(log.timestamp)}
                      </td>
                      <td style={{ fontSize: 12, fontWeight: 500, color: "#0F172A" }}>{log.user}</td>
                      <td style={{ fontSize: 12, color: "#0F172A", maxWidth: 280 }}>
                        <div style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{log.event}</div>
                      </td>
                      <td>
                        <RiskScoreBadge score={log.riskScore || 0} size="sm" />
                      </td>
                      <td>
                        {log.decision ? (
                          <span style={{
                            fontSize: 11,
                            fontWeight: 600,
                            padding: "2px 8px",
                            borderRadius: 4,
                            background: log.decision.includes("BLOCK") ? "#FEF2F2"
                              : log.decision === "ALLOW" ? "#F0FDF4"
                              : "#FFFBEB",
                            color: log.decision.includes("BLOCK") ? "#DC2626"
                              : log.decision === "ALLOW" ? "#16A34A"
                              : "#D97706",
                          }}>
                            {log.decision}
                          </span>
                        ) : <span style={{ color: "#94A3B8", fontSize: 12 }}>—</span>}
                      </td>
                      <td>
                        <ChevronRight style={{ width: 14, height: 14, color: "#94A3B8" }} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Right Panel: Distribution + Detail */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {/* Distribution Chart */}
          <div className="card">
            <div style={{ fontSize: 13, fontWeight: 600, color: "#0F172A", marginBottom: 12 }}>Risk Distribution</div>
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={distData} barSize={28}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: "#64748B" }} />
                <YAxis tick={{ fontSize: 10, fill: "#64748B" }} />
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #E8ECF2" }} />
                <Bar dataKey="value" radius={[3, 3, 0, 0]}>
                  {distData.map((d, i) => <Cell key={i} fill={d.fill} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Summary Stats */}
          <div className="card">
            <div style={{ fontSize: 13, fontWeight: 600, color: "#0F172A", marginBottom: 12 }}>Summary</div>
            {[
              { label: "Total Events", value: logs.length, color: "#1B2B6B" },
              { label: "Showing",      value: filtered.length, color: "#2563EB" },
              { label: "Critical",     value: logs.filter(l => (l.riskScore||0) >= 80).length, color: "#DC2626" },
              { label: "Blocked",      value: logs.filter(l => l.decision?.includes("BLOCK")).length, color: "#DC2626" },
            ].map((s, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 0", borderBottom: i < 3 ? "1px solid #F1F5F9" : "none" }}>
                <span style={{ fontSize: 12, color: "#64748B" }}>{s.label}</span>
                <span style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 14, fontWeight: 700, color: s.color }}>
                  {s.value}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Slide-Over Detail Panel */}
      {selected && (
        <>
          <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.3)", zIndex: 50 }} onClick={() => setSelected(null)} />
          <div style={{
            position: "fixed", right: 0, top: 0, bottom: 0, width: 420,
            background: "#fff", zIndex: 51, overflowY: "auto",
            boxShadow: "-8px 0 32px rgba(0,0,0,0.12)",
            display: "flex", flexDirection: "column",
          }}>
            {/* Panel Header */}
            <div style={{
              padding: "20px 24px", borderBottom: "1px solid #E8ECF2",
              background: "#0F1729", display: "flex", alignItems: "center", justifyContent: "space-between",
            }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: "#F1F5F9" }}>Audit Event Detail</div>
              <button
                onClick={() => setSelected(null)}
                style={{ background: "none", border: "none", cursor: "pointer", color: "#94A3B8" }}
              >
                <X style={{ width: 16, height: 16 }} />
              </button>
            </div>

            <div style={{ padding: 24, display: "flex", flexDirection: "column", gap: 20 }}>
              {/* Risk Score */}
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <RiskScoreBadge score={selected.riskScore || 0} size="lg" />
                {selected.decision && (
                  <span style={{
                    fontSize: 12, fontWeight: 600, padding: "4px 10px", borderRadius: 6,
                    background: selected.decision.includes("BLOCK") ? "#FEF2F2" : "#F0FDF4",
                    color: selected.decision.includes("BLOCK") ? "#DC2626" : "#16A34A",
                    border: `1px solid ${selected.decision.includes("BLOCK") ? "#FECACA" : "#BBF7D0"}`,
                  }}>
                    {selected.decision}
                  </span>
                )}
              </div>

              {/* Fields */}
              {[
                { label: "Timestamp",    value: formatTimestamp(selected.timestamp) },
                { label: "User / System", value: selected.user },
                { label: "Event",         value: selected.event },
              ].map((f, i) => (
                <div key={i}>
                  <div className="label-caps" style={{ marginBottom: 4 }}>{f.label}</div>
                  <div style={{ fontSize: 13, color: "#0F172A", fontWeight: 500 }}>{f.value || "—"}</div>
                </div>
              ))}

              {/* Risk Signals */}
              {selected.riskFactors?.length > 0 && (
                <div>
                  <div className="label-caps" style={{ marginBottom: 8 }}>Risk Signals</div>
                  <RiskSignalList signals={selected.riskFactors} />
                </div>
              )}

              {/* Hash */}
              {selected._id && (
                <div>
                  <div className="label-caps" style={{ marginBottom: 4 }}>Record ID</div>
                  <div style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 11, color: "#64748B", wordBreak: "break-all" }}>
                    {selected._id}
                  </div>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
