import React, { useState } from "react";
import { UserSession, Guardian, Transaction } from "../types.js";
import {
  Users, Shield, ShieldCheck, Phone, Check, X, Heart,
  UserCheck, AlertTriangle, Key
} from "lucide-react";
import { useToast } from "./ToastProvider.tsx";
import { formatINR, maskMobile } from "../lib/format.ts";
import RiskScoreBadge from "./shared/RiskScoreBadge.tsx";

interface Props {
  selectedCustomer: UserSession | null;
  guardian: Guardian | null;
  onRegisterGuardian: (name: string, rel: string, phone: string) => void;
  pendingTx: Transaction[];
  onApproveTx: (id: string) => void;
  onRejectTx: (id: string) => void;
}

const RELATIONSHIPS = ["Spouse", "Parent", "Sibling", "Son", "Daughter", "Financial Advisor"];

export default function GuardianConsole({
  selectedCustomer,
  guardian,
  onRegisterGuardian,
  pendingTx,
  onApproveTx,
  onRejectTx,
}: Props) {
  const { showToast } = useToast();
  const [gName, setGName] = useState("");
  const [relationship, setRelationship] = useState("Spouse");
  const [phone, setPhone] = useState("");
  const [processing, setProcessing] = useState<string | null>(null);

  const criticalTxs = pendingTx.filter(t =>
    t.status === "Guardian_Required" || (t.riskScore || 0) > 80
  );

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    if (!gName || !phone) {
      showToast("Guardian name and phone number are required.", "warning");
      return;
    }
    onRegisterGuardian(gName, relationship, phone);
    showToast(`Guardian "${gName}" enrolled successfully.`, "success");
    setGName("");
    setPhone("");
  };

  const handleApprove = (id: string) => {
    setProcessing(id);
    onApproveTx(id);
    showToast("Transfer approved by guardian.", "success");
    setTimeout(() => setProcessing(null), 1500);
  };

  const handleReject = (id: string) => {
    setProcessing(id);
    onRejectTx(id);
    showToast("Transfer blocked and flagged.", "error");
    setTimeout(() => setProcessing(null), 1500);
  };

  return (
    <div
      className="page-enter"
      style={{ background: "#F8F9FB", minHeight: "100vh", padding: "28px 32px", display: "flex", flexDirection: "column", gap: 20 }}
    >
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <div style={{ fontSize: 12, fontWeight: 600, color: "#64748B", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 4 }}>
            Bank of Baroda · Guardian Multi-Sig Portal
          </div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: "#0F172A", margin: 0 }}>Guardian Protection</h1>
          <div style={{ fontSize: 12, color: "#94A3B8", marginTop: 4 }}>
            Sentinel Multi-Sig Agent · Family Wealth Protection
          </div>
        </div>
        {criticalTxs.length > 0 && (
          <span style={{
            display: "flex", alignItems: "center", gap: 6,
            background: "#FEF2F2", border: "1px solid #FECACA",
            color: "#DC2626", fontSize: 12, fontWeight: 700,
            padding: "6px 14px", borderRadius: 20,
          }}>
            <AlertTriangle style={{ width: 13, height: 13 }} />
            {criticalTxs.length} Pending Approval{criticalTxs.length > 1 ? "s" : ""}
          </span>
        )}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "340px 1fr", gap: 20, alignItems: "start" }}>

        {/* ── LEFT: Register / Status Panel ─────────────────────────────── */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

          {/* Guardian Status */}
          <div className="card">
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16, paddingBottom: 12, borderBottom: "1px solid #F1F5F9" }}>
              <Users style={{ width: 15, height: 15, color: "#1B2B6B" }} />
              <span style={{ fontSize: 14, fontWeight: 600, color: "#0F172A" }}>Guardian Status</span>
            </div>

            {!selectedCustomer ? (
              <div style={{ padding: "14px", background: "#FFFBEB", border: "1px solid #FDE68A", borderRadius: 8, fontSize: 13, color: "#92400E" }}>
                Please select a customer session to enroll a guardian.
              </div>
            ) : guardian ? (
              /* Active Guardian */
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{
                    width: 48, height: 48, borderRadius: 12,
                    background: "linear-gradient(135deg, #16A34A, #15803D)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    color: "#fff", fontSize: 16, fontWeight: 700, flexShrink: 0,
                  }}>
                    {guardian.guardianName?.slice(0, 2).toUpperCase() || "G"}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 15, fontWeight: 700, color: "#0F172A" }}>{guardian.guardianName}</div>
                    <div style={{ fontSize: 12, color: "#64748B" }}>{guardian.relationship}</div>
                  </div>
                  <span style={{
                    fontSize: 10, fontWeight: 700,
                    background: "#F0FDF4", color: "#16A34A",
                    border: "1px solid #BBF7D0", padding: "2px 8px", borderRadius: 20,
                  }}>ACTIVE</span>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: "#64748B", padding: "10px 12px", background: "#F8F9FB", borderRadius: 8 }}>
                  <Phone style={{ width: 13, height: 13 }} />
                  {maskMobile(guardian.phone)}
                </div>

                <div style={{ padding: "12px 14px", background: "#EEF2FF", border: "1px solid #C7D2FE", borderRadius: 8, fontSize: 12, color: "#1B2B6B" }}>
                  <strong>Sentinel Guard Active:</strong> Transfers with risk score &gt; 80 will require this guardian's authorization via SMS multi-sig.
                </div>
              </div>
            ) : (
              /* Registration Form */
              <form onSubmit={handleRegister} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <div>
                  <label className="label-caps" style={{ display: "block", marginBottom: 6 }}>Guardian Full Name</label>
                  <input
                    className="input-field"
                    placeholder="e.g. Ramesh Sen"
                    value={gName}
                    onChange={e => setGName(e.target.value)}
                  />
                </div>
                <div>
                  <label className="label-caps" style={{ display: "block", marginBottom: 6 }}>Relationship</label>
                  <select
                    className="input-field"
                    value={relationship}
                    onChange={e => setRelationship(e.target.value)}
                  >
                    {RELATIONSHIPS.map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label-caps" style={{ display: "block", marginBottom: 6 }}>Guardian Mobile</label>
                  <input
                    className="input-field"
                    placeholder="+91 99000 88812"
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                  />
                </div>
                <button type="submit" className="btn btn-primary" style={{ justifyContent: "center" }}>
                  <UserCheck style={{ width: 14, height: 14 }} />
                  Enroll Guardian
                </button>
              </form>
            )}
          </div>

          {/* Account Context */}
          {selectedCustomer && (
            <div className="card">
              <div style={{ fontSize: 14, fontWeight: 600, color: "#0F172A", marginBottom: 12 }}>Protecting Account</div>
              {[
                { label: "Customer", value: selectedCustomer.name },
                { label: "CIF",      value: selectedCustomer.cif },
                { label: "Balance",  value: formatINR(selectedCustomer.balance) },
              ].map((f, i) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: i < 2 ? "1px solid #F1F5F9" : "none" }}>
                  <span className="label-caps">{f.label}</span>
                  <span style={{ fontSize: 12, fontWeight: 500, color: "#0F172A" }}>{f.value}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── RIGHT: Pending Authorizations ─────────────────────────────── */}
        <div className="card" style={{ padding: 0, overflow: "hidden" }}>
          {/* Panel Header */}
          <div style={{
            padding: "18px 24px",
            background: "linear-gradient(135deg, #0F1729, #1B2B6B)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}>
            <div>
              <div style={{ fontSize: 10, fontWeight: 700, color: "#93C5FD", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 2 }}>
                Sentinel Multi-Sig Agent Portal
              </div>
              <div style={{ fontSize: 16, fontWeight: 700, color: "#F1F5F9" }}>
                Guardian Escrow Queue
              </div>
            </div>
            <div style={{
              display: "flex", alignItems: "center", gap: 6,
              background: "rgba(255,255,255,0.1)", padding: "4px 12px", borderRadius: 20,
              fontSize: 12, fontWeight: 600, color: "#F1F5F9",
            }}>
              <Shield style={{ width: 13, height: 13 }} />
              {criticalTxs.length} Blocked Escrow{criticalTxs.length !== 1 ? "s" : ""}
            </div>
          </div>

          {/* Queue items */}
          <div style={{ padding: 20, display: "flex", flexDirection: "column", gap: 14, minHeight: 320 }}>
            {criticalTxs.length === 0 ? (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", flex: 1, padding: "60px 20px", textAlign: "center" }}>
                <Heart style={{ width: 40, height: 40, color: "#E2E8F0", marginBottom: 12 }} />
                <div style={{ fontSize: 15, fontWeight: 600, color: "#94A3B8" }}>No Pending Authorizations</div>
                <div style={{ fontSize: 13, color: "#CBD5E1", marginTop: 4, maxWidth: 300 }}>
                  All critical transactions are clear. No escrow holds require guardian review right now.
                </div>
              </div>
            ) : (
              criticalTxs.map(tx => (
                <div
                  key={tx._id}
                  style={{
                    border: "1px solid #FECACA",
                    borderRadius: 12,
                    overflow: "hidden",
                    background: "#fff",
                  }}
                >
                  {/* Top: risk bar */}
                  <div style={{ height: 3, background: `linear-gradient(90deg, #DC2626 ${tx.riskScore || 0}%, #F1F5F9 ${tx.riskScore || 0}%)` }} />

                  <div style={{ padding: "16px 18px" }}>
                    {/* Transaction info */}
                    <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 12 }}>
                      <div>
                        <div style={{ fontSize: 18, fontWeight: 800, color: "#DC2626", fontFamily: "JetBrains Mono, monospace", fontVariantNumeric: "tabular-nums", marginBottom: 2 }}>
                          {formatINR(tx.amount)}
                        </div>
                        <div style={{ fontSize: 13, color: "#0F172A", fontWeight: 600 }}>
                          → {tx.receiverName}
                        </div>
                        <div style={{ fontSize: 11, color: "#94A3B8", marginTop: 2 }}>
                          Acc: {tx.accountNumber}
                        </div>
                      </div>
                      <RiskScoreBadge score={tx.riskScore || 0} size="md" />
                    </div>

                    {/* Explanation */}
                    {tx.explanation && (
                      <div style={{ display: "flex", gap: 8, marginBottom: 14, padding: "8px 12px", background: "#FEF2F2", borderRadius: 8 }}>
                        <AlertTriangle style={{ width: 13, height: 13, color: "#DC2626", flexShrink: 0, marginTop: 1 }} />
                        <div style={{ fontSize: 12, color: "#991B1B" }}>{tx.explanation}</div>
                      </div>
                    )}

                    {/* Beneficiary */}
                    <div style={{ fontSize: 12, color: "#64748B", marginBottom: 14 }}>
                      Requested by: <strong style={{ color: "#0F172A" }}>{tx.customerName || tx.cif}</strong>
                    </div>

                    {/* Actions */}
                    <div style={{ display: "flex", gap: 8 }}>
                      <button
                        className="btn btn-success"
                        style={{ flex: 1, justifyContent: "center" }}
                        disabled={processing === tx._id}
                        onClick={() => handleApprove(tx._id)}
                      >
                        <Check style={{ width: 14, height: 14 }} />
                        {processing === tx._id ? "Processing…" : "Approve Transfer"}
                      </button>
                      <button
                        className="btn btn-danger"
                        style={{ flex: 1, justifyContent: "center" }}
                        disabled={processing === tx._id}
                        onClick={() => handleReject(tx._id)}
                      >
                        <X style={{ width: 14, height: 14 }} />
                        Block Funds
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          <div style={{
            padding: "12px 20px",
            background: "#F8F9FB",
            borderTop: "1px solid #F1F5F9",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            fontSize: 11,
          }}>
            <span style={{ color: "#64748B" }}>Protecting family wealth against social engineering exploits.</span>
            <span style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 10, color: "#1B2B6B", fontWeight: 700 }}>
              SENTINEL v4.1 ● CONNECTED
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
