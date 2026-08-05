import React, { useState } from "react";
import { UserSession, Transaction } from "../types.js";
import {
  ShieldCheck, ShieldAlert, Cpu, MapPin, Activity, Laptop,
  Search, ChevronRight, Zap, CheckCircle
} from "lucide-react";
import TrustGauge from "./charts/TrustGauge.tsx";
import { formatINR, formatTimestamp, getInitials } from "../lib/format.ts";
import { scoreToColor } from "../lib/risk-utils.ts";
import RiskScoreBadge from "./shared/RiskScoreBadge.tsx";
import { RiskSignalList } from "./shared/RiskSignalBadge.tsx";

interface Props {
  customers: UserSession[];
  selectedCustomer: UserSession | null;
  onSelectCustomer: (c: UserSession) => void;
  transactions: Transaction[];
  onTriggerAnalyse: (amount: number) => void;
}

// ── Profile state badge ───────────────────────────────────────────────────────
function ProfileStateBadge({ state }: { state: string }) {
  const map: Record<string, { bg: string; color: string; dot: string }> = {
    LEARNING: { bg: "#FFFBEB", color: "#D97706",   dot: "#D97706" },
    ADAPTING: { bg: "#FFF7ED", color: "#EA580C",   dot: "#EA580C" },
    MATURE:   { bg: "#F0FDF4", color: "#16A34A",   dot: "#16A34A" },
  };
  const s = map[state] || { bg: "#F8F9FB", color: "#64748B", dot: "#64748B" };
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 6,
      background: s.bg, color: s.color,
      border: `1px solid ${s.dot}30`,
      padding: "3px 10px", borderRadius: 20,
      fontSize: 11, fontWeight: 700,
    }}>
      <span style={{ width: 6, height: 6, borderRadius: "50%", background: s.dot }} />
      {state}
    </span>
  );
}

export default function ActiveSessionMonitor({
  customers,
  selectedCustomer,
  onSelectCustomer,
  transactions,
}: Props) {
  const [search, setSearch] = useState("");
  const [testAmount, setTestAmount] = useState("45000");
  const [aiReport, setAiReport] = useState<{ score: number; factors: string[]; explanation: string } | null>(null);
  const [loadingAi, setLoadingAi] = useState(false);

  const filtered = customers.filter(c =>
    !search ||
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.cif.toLowerCase().includes(search.toLowerCase())
  );

  const activeTx = selectedCustomer
    ? transactions.filter(t => t.cif === selectedCustomer.cif)
    : [];

  const handleSimulate = async () => {
    if (!selectedCustomer) return;
    setLoadingAi(true);
    setAiReport(null);
    try {
      const res = await fetch("/api/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cif: selectedCustomer.cif,
          receiverName: "Test Evaluation",
          accountNumber: "9988776655",
          amount: parseFloat(testAmount),
          currentIP: selectedCustomer.currentIP,
          currentDevice: selectedCustomer.currentDevice,
          currentLocation: selectedCustomer.currentLocation,
          isNewDevice: false,
        }),
      });
      const data = await res.json();
      setAiReport({ score: data.riskScore, factors: data.riskFactors || [], explanation: data.explanation || "" });
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingAi(false);
    }
  };

  const riskScore = selectedCustomer ? (100 - (selectedCustomer.trustScore || 0)) : 0;

  return (
    <div style={{ display: "grid", gridTemplateColumns: "280px 1fr", gap: 20, alignItems: "start" }}>

      {/* ── LEFT: Customer List ─────────────────────────────────────────── */}
      <div className="card" style={{ padding: 0, overflow: "hidden" }}>
        <div style={{ padding: "12px 14px", borderBottom: "1px solid #F1F5F9" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10 }}>
            <Activity style={{ width: 14, height: 14, color: "#1B2B6B" }} />
            <span style={{ fontSize: 13, fontWeight: 600, color: "#0F172A" }}>Session Directory</span>
          </div>
          <div style={{ position: "relative" }}>
            <Search style={{ position: "absolute", left: 9, top: "50%", transform: "translateY(-50%)", width: 12, height: 12, color: "#94A3B8" }} />
            <input
              className="input-field"
              style={{ paddingLeft: 28, fontSize: 12 }}
              placeholder="Search CIF or name…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
        </div>

        <div style={{ maxHeight: 520, overflowY: "auto" }}>
          {filtered.slice(0, 20).map((c, i) => {
            const risk = 100 - (c.trustScore || 0);
            const isSelected = selectedCustomer?.cif === c.cif;
            return (
              <button
                key={c.cif}
                onClick={() => { onSelectCustomer(c); setAiReport(null); }}
                style={{
                  width: "100%", display: "flex", alignItems: "center", gap: 10,
                  padding: "11px 14px", border: "none", cursor: "pointer", textAlign: "left",
                  background: isSelected ? "#F8FAFD" : "#fff",
                  borderBottom: "1px solid #F1F5F9",
                  borderLeft: `3px solid ${isSelected ? "#1B2B6B" : "transparent"}`,
                  transition: "all 0.12s",
                }}
              >
                <div style={{
                  width: 34, height: 34, borderRadius: 8, flexShrink: 0,
                  background: isSelected ? "#1B2B6B" : "#F1F5F9",
                  color: isSelected ? "#fff" : "#64748B",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 11, fontWeight: 700,
                }}>
                  {getInitials(c.name)}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: "#0F172A", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {c.name}
                  </div>
                  <div style={{ fontSize: 9, color: "#94A3B8", fontFamily: "JetBrains Mono, monospace" }}>
                    {c.cif}
                  </div>
                </div>
                <div style={{
                  width: 7, height: 7, borderRadius: "50%", flexShrink: 0,
                  background: risk >= 40 ? scoreToColor(risk) : "#16A34A",
                }} />
              </button>
            );
          })}
        </div>
      </div>

      {/* ── RIGHT: Session Detail ────────────────────────────────────────── */}
      {!selectedCustomer ? (
        <div className="card" style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "80px 40px", textAlign: "center" }}>
          <ShieldCheck style={{ width: 48, height: 48, color: "#E2E8F0", marginBottom: 16 }} />
          <div style={{ fontSize: 15, fontWeight: 600, color: "#94A3B8" }}>Select a session</div>
          <div style={{ fontSize: 13, color: "#CBD5E1", marginTop: 4 }}>Choose a customer from the left panel to view session analytics</div>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

          {/* Profile Header */}
          <div className="card" style={{ display: "flex", alignItems: "center", gap: 16, padding: "18px 22px" }}>
            <div style={{
              width: 52, height: 52, borderRadius: 12, flexShrink: 0,
              background: riskScore >= 40
                ? `linear-gradient(135deg, ${scoreToColor(riskScore)}, ${scoreToColor(riskScore)}99)`
                : "linear-gradient(135deg, #16A34A, #15803D)",
              color: "#fff", display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 18, fontWeight: 800,
            }}>
              {getInitials(selectedCustomer.name)}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 17, fontWeight: 700, color: "#0F172A" }}>{selectedCustomer.name}</div>
              <div style={{ fontSize: 12, color: "#64748B", marginTop: 2 }}>
                CIF: {selectedCustomer.cif} · {selectedCustomer.currentLocation}
              </div>
            </div>
            <RiskScoreBadge score={riskScore} size="lg" />
          </div>

          {/* 2-col: Account Info + Trust Gauge */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>

            {/* Account details */}
            <div className="card">
              <div style={{ fontSize: 13, fontWeight: 600, color: "#0F172A", marginBottom: 14 }}>Session Profile</div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 14 }}>
                {[
                  { label: "Balance",     value: formatINR(selectedCustomer.balance) },
                  { label: "Avg Transfer",value: formatINR(selectedCustomer.avgTransactionAmount) },
                ].map((f, i) => (
                  <div key={i} style={{ padding: "10px 12px", background: "#F8F9FB", borderRadius: 8 }}>
                    <div className="label-caps" style={{ marginBottom: 4 }}>{f.label}</div>
                    <div style={{ fontFamily: "JetBrains Mono, monospace", fontVariantNumeric: "tabular-nums", fontSize: 14, fontWeight: 700, color: "#0F172A" }}>
                      {f.value}
                    </div>
                  </div>
                ))}
              </div>

              {[
                { icon: Laptop,  label: "Device",   value: selectedCustomer.currentDevice || "—" },
                { icon: Cpu,     label: "IP",        value: selectedCustomer.currentIP || "—" },
                { icon: MapPin,  label: "Location",  value: selectedCustomer.currentLocation || "—" },
              ].map((f, i) => {
                const Icon = f.icon;
                return (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0", borderBottom: i < 2 ? "1px solid #F1F5F9" : "none" }}>
                    <Icon style={{ width: 13, height: 13, color: "#1B2B6B", flexShrink: 0 }} />
                    <span className="label-caps" style={{ flexShrink: 0 }}>{f.label}</span>
                    <span style={{ fontSize: 12, fontWeight: 500, color: "#0F172A", marginLeft: "auto", textAlign: "right", maxWidth: 140, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {f.value}
                    </span>
                  </div>
                );
              })}

              {/* Risk warning */}
              {selectedCustomer.trustScore < 60 && (
                <div style={{ marginTop: 12, padding: "10px 14px", background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: 8, display: "flex", gap: 8 }}>
                  <ShieldAlert style={{ width: 14, height: 14, color: "#DC2626", flexShrink: 0, marginTop: 1 }} />
                  <div style={{ fontSize: 12, color: "#991B1B" }}>
                    <strong>Degraded guard state</strong> — Multi-factor challenge active.
                  </div>
                </div>
              )}
            </div>

            {/* Trust Gauge + AI Evaluator */}
            <div style={{ background: "#0F1729", borderRadius: 12, padding: "20px 20px 16px", display: "flex", flexDirection: "column", gap: 14 }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: "#93C5FD", textTransform: "uppercase", letterSpacing: "0.1em" }}>
                Continuous Threat Overwatch
              </div>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                <TrustGauge score={selectedCustomer.trustScore} size={140} />
                <div style={{ fontSize: 10, color: "#64748B", marginTop: 8, textAlign: "center" }}>
                  Score: <span style={{ color: "#F1F5F9", fontWeight: 700 }}>{selectedCustomer.trustScore}</span>{" "}
                  · Cohort avg: <span style={{ color: "#94A3B8", fontWeight: 700 }}>81</span>
                </div>
              </div>

              {/* AI Evaluator */}
              <div style={{ background: "rgba(255,255,255,0.05)", borderRadius: 8, padding: "12px 14px" }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: "#93C5FD", marginBottom: 8 }}>
                  AI Transfer Evaluation
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <div style={{ position: "relative", flex: 1 }}>
                    <span style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "#64748B", fontSize: 13 }}>₹</span>
                    <input
                      style={{
                        width: "100%", paddingLeft: 24, paddingRight: 8, paddingTop: 7, paddingBottom: 7,
                        background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.1)",
                        borderRadius: 7, color: "#F1F5F9", fontSize: 12,
                        fontFamily: "JetBrains Mono, monospace", outline: "none",
                      }}
                      type="number"
                      value={testAmount}
                      onChange={e => setTestAmount(e.target.value)}
                    />
                  </div>
                  <button
                    onClick={handleSimulate}
                    disabled={loadingAi}
                    style={{
                      padding: "7px 14px", background: "#1B2B6B", color: "#fff",
                      border: "none", borderRadius: 7, cursor: "pointer",
                      fontSize: 12, fontWeight: 600, whiteSpace: "nowrap",
                      opacity: loadingAi ? 0.6 : 1,
                    }}
                  >
                    <Zap style={{ width: 12, height: 12, display: "inline", marginRight: 4 }} />
                    {loadingAi ? "…" : "Evaluate"}
                  </button>
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: 8, borderTop: "1px solid rgba(255,255,255,0.08)" }}>
                <span style={{ fontSize: 10, color: "#64748B" }}>Identity Pulse</span>
                <span style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, color: "#34D399", fontWeight: 600 }}>
                  <span className="live-dot" style={{ background: "#34D399" }} />
                  Monitoring
                </span>
              </div>
            </div>
          </div>

          {/* AI Report */}
          {aiReport && (
            <div className="card" style={{ borderLeft: `4px solid ${scoreToColor(aiReport.score)}` }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                <div style={{ width: 32, height: 32, borderRadius: 8, background: "#1B2B6B", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 800 }}>
                  AI
                </div>
                <div style={{ flex: 1, fontSize: 14, fontWeight: 600, color: "#0F172A" }}>AI Security Report</div>
                <RiskScoreBadge score={aiReport.score} size="sm" />
              </div>
              {aiReport.factors.length > 0 && (
                <div style={{ marginBottom: 10 }}>
                  <RiskSignalList signals={aiReport.factors} />
                </div>
              )}
              {aiReport.explanation && (
                <p style={{ fontSize: 13, color: "#64748B", fontStyle: "italic", lineHeight: 1.6 }}>
                  "{aiReport.explanation}"
                </p>
              )}
            </div>
          )}

          {/* Behavioral Profile */}
          {selectedCustomer.behaviorProfile && (
            <div className="card">
              <div style={{ fontSize: 13, fontWeight: 600, color: "#0F172A", marginBottom: 14, display: "flex", alignItems: "center", gap: 8 }}>
                <ShieldCheck style={{ width: 14, height: 14, color: "#1B2B6B" }} />
                Behavioral Profile Calibration
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
                {/* Profile state */}
                <div style={{ padding: "12px 14px", background: "#F8F9FB", borderRadius: 8 }}>
                  <div className="label-caps" style={{ marginBottom: 8 }}>Profile State</div>
                  <ProfileStateBadge state={selectedCustomer.behaviorProfile.profileState} />
                  <div style={{ fontSize: 11, color: "#64748B", marginTop: 8, lineHeight: 1.5 }}>
                    {selectedCustomer.behaviorProfile.profileState === "LEARNING" && "Silent learning. Low risk threshold enforced."}
                    {selectedCustomer.behaviorProfile.profileState === "ADAPTING" && "Building personalized boundaries."}
                    {selectedCustomer.behaviorProfile.profileState === "MATURE" && "High-fidelity baseline active."}
                  </div>
                </div>

                {/* Metrics */}
                <div style={{ padding: "12px 14px", background: "#F8F9FB", borderRadius: 8, display: "flex", flexDirection: "column", gap: 8 }}>
                  <div className="label-caps" style={{ marginBottom: 4 }}>Telemetry</div>
                  {[
                    { label: "Sessions",    value: selectedCustomer.behaviorProfile.sessionCount },
                    { label: "Confidence",  value: `${(selectedCustomer.behaviorProfile.profileConfidence * 100).toFixed(0)}%` },
                    { label: "Model",       value: selectedCustomer.behaviorProfile.modelUsed || "Global" },
                  ].map((f, i) => (
                    <div key={i} style={{ display: "flex", justifyContent: "space-between", fontSize: 12 }}>
                      <span style={{ color: "#64748B" }}>{f.label}</span>
                      <span style={{ fontFamily: "JetBrains Mono, monospace", fontWeight: 700, color: "#0F172A" }}>{f.value}</span>
                    </div>
                  ))}
                </div>

                {/* Progress bar */}
                <div style={{ padding: "12px 14px", background: "#F8F9FB", borderRadius: 8 }}>
                  <div className="label-caps" style={{ marginBottom: 8 }}>Training Progress</div>
                  <div style={{ height: 6, background: "#E2E8F0", borderRadius: 99, overflow: "hidden", marginBottom: 6 }}>
                    <div style={{
                      height: "100%",
                      width: `${Math.min(100, (selectedCustomer.behaviorProfile.sessionCount / 30) * 100)}%`,
                      background: "#1B2B6B", borderRadius: 99,
                    }} />
                  </div>
                  <div style={{ fontSize: 11, color: "#64748B" }}>
                    {selectedCustomer.behaviorProfile.sessionCount} / 30 sessions
                  </div>
                  <div style={{ fontSize: 11, color: "#94A3B8", marginTop: 4 }}>
                    Next retrain: {selectedCustomer.behaviorProfile.nextScheduledTraining
                      ? new Date(selectedCustomer.behaviorProfile.nextScheduledTraining).toLocaleDateString("en-IN")
                      : `Session ${Math.max(30, selectedCustomer.behaviorProfile.sessionCount + 5)}`}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Login History */}
          {selectedCustomer.loginHistory?.length > 0 && (
            <div className="card" style={{ padding: 0, overflow: "hidden" }}>
              <div style={{ padding: "14px 18px", borderBottom: "1px solid #F1F5F9", fontSize: 13, fontWeight: 600, color: "#0F172A" }}>
                Login History
              </div>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Timestamp</th>
                    <th>Device</th>
                    <th>IP Address</th>
                    <th>Location</th>
                    <th>Flag</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedCustomer.loginHistory.map((lh: any, i: number) => (
                    <tr key={i}>
                      <td style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 11, color: "#64748B", whiteSpace: "nowrap" }}>
                        {formatTimestamp(lh.timestamp)}
                      </td>
                      <td style={{ fontSize: 12, fontWeight: 500, color: "#0F172A" }}>{lh.device}</td>
                      <td style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 11, color: "#64748B" }}>{lh.ip}</td>
                      <td style={{ fontSize: 12, color: "#64748B" }}>{lh.location}</td>
                      <td>
                        <span style={{
                          fontSize: 10, fontWeight: 700, padding: "2px 7px", borderRadius: 4,
                          background: lh.isNewDevice ? "#FEF2F2" : "#F0FDF4",
                          color: lh.isNewDevice ? "#DC2626" : "#16A34A",
                        }}>
                          {lh.isNewDevice ? "NEW DEVICE" : "STANDARD"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
