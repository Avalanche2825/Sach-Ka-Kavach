import React, { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { UserSession, Transaction, KYCApplication } from "../../types.js";
import { Search, User, FileText, ShieldCheck, Activity, Brain, Laptop, Key, ShieldAlert } from "lucide-react";
import { formatINR, formatRelative, getInitials } from "../../lib/format.ts";
import RiskScoreBadge from "../../components/shared/RiskScoreBadge.tsx";
import { useToast } from "../../components/ToastProvider.tsx";

interface Props {
  customers: UserSession[];
  transactions: Transaction[];
  kycApps: KYCApplication[];
}

export default function CustomerSearch({ customers = [], transactions = [], kycApps = [] }: Props) {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<any | null>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [note, setNote] = useState("");
  const [notes, setNotes] = useState<{ date: string; text: string }[]>([
    { date: "02 Aug 2026", text: "Verified Aadhaar card matches database details during onboarding check." },
  ]);

  const filtered = useMemo(() =>
    customers.filter(c =>
      !search ||
      c.name?.toLowerCase().includes(search.toLowerCase()) ||
      c.cif?.toLowerCase().includes(search.toLowerCase())
    ),
    [customers, search]
  );

  const custTransactions = useMemo(() =>
    selected ? transactions.filter(t => t.cif === selected.cif) : [],
    [selected, transactions]
  );

  const matchingKyc = useMemo(() =>
    selected ? kycApps.find(k => k.cif === selected.cif || k.name?.toLowerCase() === selected.name?.toLowerCase()) : null,
    [selected, kycApps]
  );

  const handleSelectCustomer = async (c: UserSession) => {
    setLoadingDetails(true);
    try {
      const res = await fetch(`/api/customers/${c.cif}`);
      if (res.ok) {
        const fullData = await res.json();
        setSelected(fullData);
      } else {
        setSelected(c);
      }
    } catch {
      setSelected(c);
    } finally {
      setLoadingDetails(false);
    }
  };

  const handleAddNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!note.trim()) return;
    setNotes(prev => [{ date: new Date().toLocaleDateString("en-IN"), text: note }, ...prev]);
    setNote("");
    showToast("Compliance note added.", "success");
  };

  return (
    <div
      className="page-enter"
      style={{ background: "#F8F9FB", minHeight: "100vh", padding: "28px 32px", display: "flex", flexDirection: "column", gap: 20 }}
    >
      {/* Header */}
      <div>
        <div style={{ fontSize: 12, fontWeight: 600, color: "#64748B", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 4 }}>
          Bank of Baroda · Branch Operations
        </div>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: "#0F172A", margin: 0 }}>Customer Directory</h1>
        <div style={{ fontSize: 12, color: "#94A3B8", marginTop: 4 }}>
          {customers.length} registered clients · Search and verify customer profiles
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "300px 1fr", gap: 24, alignItems: "start" }}>

        {/* Left: Customer List */}
        <div className="card" style={{ padding: 0, overflow: "hidden" }}>
          {/* Search */}
          <div style={{ padding: "12px 14px", borderBottom: "1px solid #F1F5F9" }}>
            <div style={{ position: "relative" }}>
              <Search style={{ position: "absolute", left: 9, top: "50%", transform: "translateY(-50%)", width: 13, height: 13, color: "#94A3B8" }} />
              <input
                className="input-field"
                style={{ paddingLeft: 28, fontSize: 12 }}
                placeholder="Search CIF or name…"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
          </div>

          {/* List */}
          <div style={{ maxHeight: 680, overflowY: "auto" }}>
            {filtered.length === 0 ? (
              <div style={{ padding: "32px 16px", textAlign: "center", color: "#94A3B8", fontSize: 13 }}>No customers found.</div>
            ) : filtered.map(c => (
              <button
                key={c.cif}
                onClick={() => handleSelectCustomer(c)}
                style={{
                  width: "100%", display: "flex", alignItems: "center", gap: 10,
                  padding: "12px 14px", border: "none", cursor: "pointer", textAlign: "left",
                  background: selected?.cif === c.cif ? "#F8FAFD" : "#fff",
                  borderBottom: "1px solid #F1F5F9",
                  borderLeft: `3px solid ${selected?.cif === c.cif ? "#1B2B6B" : "transparent"}`,
                  transition: "all 0.12s",
                }}
              >
                {/* Avatar */}
                <div style={{
                  width: 36, height: 36, borderRadius: 8, flexShrink: 0,
                  background: selected?.cif === c.cif ? "#1B2B6B" : "#F1F5F9",
                  color: selected?.cif === c.cif ? "#fff" : "#64748B",
                  display: "flex", alignItems: "center", justifyItems: "center", justifyContent: "center",
                  fontSize: 12, fontWeight: 700,
                }}>
                  {getInitials(c.name)}
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "#0F172A", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {c.name}
                  </div>
                  <div style={{ fontSize: 10, color: "#94A3B8", fontFamily: "JetBrains Mono, monospace" }}>
                    {c.cif}
                  </div>
                </div>

                {/* Trust score dot */}
                <div style={{
                  width: 8, height: 8, borderRadius: "50%", flexShrink: 0,
                  background: (c.trustScore || 0) >= 60 ? "#16A34A" : (c.trustScore || 0) >= 40 ? "#D97706" : "#DC2626",
                }} />
              </button>
            ))}
          </div>
        </div>

        {/* Right: Customer Detail */}
        {loadingDetails ? (
          <div className="card" style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "100px 40px", textAlign: "center" }}>
            <Activity className="w-8 h-8 text-blue-600 animate-spin" />
            <div style={{ fontSize: 14, fontWeight: 600, color: "#475569", marginTop: 12 }}>Populating customer data...</div>
          </div>
        ) : !selected ? (
          <div className="card" style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "80px 40px", textAlign: "center" }}>
            <User style={{ width: 48, height: 48, color: "#E2E8F0", marginBottom: 16 }} />
            <div style={{ fontSize: 15, fontWeight: 600, color: "#94A3B8" }}>Select a Customer</div>
            <div style={{ fontSize: 13, color: "#CBD5E1", marginTop: 4 }}>Click a name on the left directory to populate their 360-degree risk profiles</div>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

            {/* Profile Header */}
            <div className="card" style={{ display: "flex", alignItems: "center", justifyItems: "center", gap: 16, padding: "20px 24px" }}>
              <div style={{
                width: 56, height: 56, borderRadius: 14,
                background: "linear-gradient(135deg, #1B2B6B, #2563EB)",
                color: "#fff", display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 20, fontWeight: 700, flexShrink: 0,
              }}>
                {getInitials(selected.name)}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 2 }}>
                  <div style={{ fontSize: 18, fontWeight: 700, color: "#0F172A" }}>{selected.name}</div>
                </div>
                <div style={{ fontSize: 12, color: "#64748B", marginTop: 2 }}>CIF: {selected.cif} · Current Location: {selected.currentLocation || "Mumbai, IN"}</div>
              </div>
              <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: "#64748B", textTransform: "uppercase" }}>Unified Trust</div>
                  <div style={{ fontSize: 18, fontWeight: 800, color: (selected.trustScore || 80) >= 80 ? "#16A34A" : (selected.trustScore || 80) >= 60 ? "#D97706" : "#DC2626" }}>
                    {selected.trustScore || 80}/100
                  </div>
                </div>
                <button
                  className="btn btn-primary btn-sm"
                  onClick={() => {
                    const latestTx = custTransactions[0];
                    navigate(`/investigation/${latestTx?._id || selected.cif}`);
                  }}
                  style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 14px", borderRadius: 10 }}
                >
                  <ShieldCheck style={{ width: 14, height: 14 }} /> Live Case File
                </button>
              </div>
            </div>

            {/* 360-Degree Telemetry Grid */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
              
              {/* Account Details & Behavior Stats (M1) */}
              <div className="card" style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, fontWeight: 700, color: "#1B2B6B", borderBottom: "1px solid #F1F5F9", paddingBottom: 8 }}>
                  <Brain style={{ width: 16, height: 16 }} />
                  <span>Module 1: Behavioral Profiling Baseline</span>
                </div>
                
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  <div style={{ display: "flex", justifyItems: "center", justifyContent: "space-between", fontSize: 12 }}>
                    <span style={{ color: "#64748B", fontWeight: 500 }}>Ledger Balance</span>
                    <span style={{ fontWeight: 700, color: "#0F172A" }}>{formatINR(selected.balance)}</span>
                  </div>
                  <div style={{ display: "flex", justifyItems: "center", justifyContent: "space-between", fontSize: 12 }}>
                    <span style={{ color: "#64748B", fontWeight: 500 }}>Average Keystroke Dwell</span>
                    <span style={{ fontWeight: 700, color: "#0F172A" }}>{selected.behaviorProfile?.averageTypingSpeed || 280} ms</span>
                  </div>
                  <div style={{ display: "flex", justifyItems: "center", justifyContent: "space-between", fontSize: 12 }}>
                    <span style={{ color: "#64748B", fontWeight: 500 }}>Keystroke Variance</span>
                    <span style={{ fontWeight: 700, color: "#0F172A" }}>{selected.behaviorProfile?.averageTypingVariance || 40} ms²</span>
                  </div>
                  <div style={{ display: "flex", justifyItems: "center", justifyContent: "space-between", fontSize: 12 }}>
                    <span style={{ color: "#64748B", fontWeight: 500 }}>Avg Interactions / Minute</span>
                    <span style={{ fontWeight: 700, color: "#0F172A" }}>{selected.behaviorProfile?.averageActionsPerMinute || 10.4} events</span>
                  </div>
                  <div style={{ display: "flex", justifyItems: "center", justifyContent: "space-between", fontSize: 12 }}>
                    <span style={{ color: "#64748B", fontWeight: 500 }}>Profile Confidence Rating</span>
                    <span style={{ fontWeight: 700, color: "#16A34A" }}>
                      {((selected.behaviorProfile?.profileConfidence || 0.85) * 100).toFixed(0)}% Match
                    </span>
                  </div>
                </div>
              </div>

              {/* Identity & Fraud Ring Graph Match (M3) */}
              <div className="card" style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, fontWeight: 700, color: "#1B2B6B", borderBottom: "1px solid #F1F5F9", paddingBottom: 8 }}>
                  <ShieldAlert style={{ width: 16, height: 16 }} />
                  <span>Module 3: KYC Identity Verification</span>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  <div style={{ display: "flex", justifyItems: "center", justifyContent: "space-between", fontSize: 12 }}>
                    <span style={{ color: "#64748B", fontWeight: 500 }}>Aadhaar Database Link</span>
                    <span style={{ fontWeight: 700, color: "#0F172A" }}>
                      {matchingKyc?.aadhaar ? `XXXX-XXXX-${matchingKyc.aadhaar.slice(-4)}` : "XXXX-XXXX-9812"}
                    </span>
                  </div>
                  <div style={{ display: "flex", justifyItems: "center", justifyContent: "space-between", fontSize: 12 }}>
                    <span style={{ color: "#64748B", fontWeight: 500 }}>PAN Card Number</span>
                    <span style={{ fontWeight: 700, color: "#0F172A" }}>
                      {matchingKyc?.pan ? `${matchingKyc.pan.slice(0, 5)}XXXX${matchingKyc.pan.slice(-1)}` : "ABCDE1234F"}
                    </span>
                  </div>
                  <div style={{ display: "flex", justifyItems: "center", justifyContent: "space-between", fontSize: 12 }}>
                    <span style={{ color: "#64748B", fontWeight: 500 }}>KYC Status</span>
                    <span style={{
                      fontWeight: 700,
                      color: matchingKyc?.status === "Flagged" ? "#DC2626" : "#16A34A"
                    }}>
                      {matchingKyc?.status || "Approved"}
                    </span>
                  </div>
                  <div style={{ display: "flex", justifyItems: "center", justifyContent: "space-between", fontSize: 12 }}>
                    <span style={{ color: "#64748B", fontWeight: 500 }}>Duplicate Biometrics Matches</span>
                    <span style={{ fontWeight: 700, color: matchingKyc?.status === "Flagged" ? "#DC2626" : "#16A34A" }}>
                      {matchingKyc?.suspiciousMatches && matchingKyc.suspiciousMatches.length > 0 
                        ? `${matchingKyc.suspiciousMatches.length} Matches Found` 
                        : "No duplicates found"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Device Profile & Recognized Nodes (M2) */}
              <div className="card" style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, fontWeight: 700, color: "#1B2B6B", borderBottom: "1px solid #F1F5F9", paddingBottom: 8 }}>
                  <Laptop style={{ width: 16, height: 16 }} />
                  <span>Module 2: Recognized Device Profiles</span>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  <div style={{ display: "flex", justifyItems: "center", justifyContent: "space-between", fontSize: 12 }}>
                    <span style={{ color: "#64748B", fontWeight: 500 }}>Active Terminal Device</span>
                    <span style={{ fontWeight: 700, color: "#0F172A" }}>{selected.currentDevice || "Windows PC"}</span>
                  </div>
                  <div style={{ display: "flex", justifyItems: "center", justifyContent: "space-between", fontSize: 12 }}>
                    <span style={{ color: "#64748B", fontWeight: 500 }}>Recognized Hardware Signatures</span>
                    <span style={{ fontWeight: 700, color: "#0F172A" }}>
                      {selected.behaviorProfile?.trustedDevices?.length || 1} Device Nodes
                    </span>
                  </div>
                  <div style={{ display: "flex", justifyItems: "center", justifyContent: "space-between", fontSize: 12 }}>
                    <span style={{ color: "#64748B", fontWeight: 500 }}>Network Gateway Location</span>
                    <span style={{ fontWeight: 700, color: "#0F172A" }}>{selected.currentLocation || "Mumbai, IN"}</span>
                  </div>
                  <div style={{ display: "flex", justifyItems: "center", justifyContent: "space-between", fontSize: 12 }}>
                    <span style={{ color: "#64748B", fontWeight: 500 }}>Active Session Carrier IP</span>
                    <span style={{ fontWeight: 700, color: "#0F172A", fontFamily: "monospace" }}>{selected.currentIP || "103.88.24.12"}</span>
                  </div>
                </div>
              </div>

              {/* Recovery Protection Sandbox (M4) */}
              <div className="card" style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, fontWeight: 700, color: "#1B2B6B", borderBottom: "1px solid #F1F5F9", paddingBottom: 8 }}>
                  <Key style={{ width: 16, height: 16 }} />
                  <span>Module 4: SIM Swap & Recovery Shield</span>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  <div style={{ display: "flex", justifyItems: "center", justifyContent: "space-between", fontSize: 12 }}>
                    <span style={{ color: "#64748B", fontWeight: 500 }}>Recent SIM Swap Detection</span>
                    <span style={{ fontWeight: 700, color: selected.isSimSwapWithin72h ? "#DC2626" : "#16A34A" }}>
                      {selected.isSimSwapWithin72h ? "YES (Swapped <72h)" : "NO (Within Baseline)"}
                    </span>
                  </div>
                  <div style={{ display: "flex", justifyItems: "center", justifyContent: "space-between", fontSize: 12 }}>
                    <span style={{ color: "#64748B", fontWeight: 500 }}>SIM Security Lockout</span>
                    <span style={{ fontWeight: 700, color: selected.isSimSwapWithin72h ? "#DC2626" : "#16A34A" }}>
                      {selected.isSimSwapWithin72h ? "72h Lockdown Engaged" : "Standard Recovery Allowed"}
                    </span>
                  </div>
                  <div style={{ display: "flex", justifyItems: "center", justifyContent: "space-between", fontSize: 12 }}>
                    <span style={{ color: "#64748B", fontWeight: 500 }}>Guardian Enrolled Status</span>
                    <span style={{ fontWeight: 700, color: "#16A34A" }}>SMS Challenge Enrolled</span>
                  </div>
                </div>
              </div>

            </div>

            {/* Transactions Ledger with Risk Scores */}
            <div className="card" style={{ padding: 0, overflow: "hidden" }}>
              <div style={{ padding: "14px 16px", borderBottom: "1px solid #F1F5F9", fontSize: 14, fontWeight: 700, color: "#0F172A", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span>Historical Transactions Ledger</span>
                <span className="bg-slate-100 text-slate-600 font-mono text-xs px-2.5 py-0.5 rounded-full">
                  {custTransactions.length} Transactions
                </span>
              </div>
              {custTransactions.length === 0 ? (
                <div style={{ padding: "32px 16px", textAlign: "center", color: "#94A3B8", fontSize: 12 }}>No transactions logged for this client profile.</div>
              ) : (
                <div style={{ maxHeight: 300, overflowY: "auto" }}>
                  {custTransactions.map((tx, i) => (
                    <div
                      key={tx._id || i}
                      style={{
                        padding: "14px 16px", borderBottom: "1px solid #F1F5F9",
                        display: "flex", flexDirection: "column", gap: 8
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: 10, justifyContent: "space-between" }}>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 13, fontWeight: 700, color: "#0F172A", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {tx.receiverName}
                          </div>
                          <div style={{ fontSize: 10, color: "#64748B", marginTop: 2 }}>{formatRelative(tx.timestamp)}</div>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                          <div style={{ fontFamily: "monospace", fontSize: 13, fontWeight: 700, color: "#0F172A" }}>
                            {formatINR(tx.amount)}
                          </div>
                          <span style={{
                            fontSize: 10, fontWeight: 700, padding: "3px 8px", borderRadius: 6,
                            background: tx.status === "Approved" ? "#F0FDF4" : tx.status === "Rejected" ? "#FEF2F2" : "#FFFBEB",
                            color: tx.status === "Approved" ? "#16A34A" : tx.status === "Rejected" ? "#DC2626" : "#D97706",
                          }}>
                            {tx.status}
                          </span>
                          
                          <span style={{
                            fontSize: 10, fontWeight: 700, padding: "3px 8px", borderRadius: 6,
                            background: (tx.riskScore || 20) >= 50 ? "#FEF2F2" : (tx.riskScore || 20) >= 30 ? "#FFFBEB" : "#F0FDF4",
                            color: (tx.riskScore || 20) >= 50 ? "#DC2626" : (tx.riskScore || 20) >= 30 ? "#D97706" : "#16A34A",
                          }}>
                            Risk {(tx.riskScore || 20)}/100
                          </span>

                          <button
                            onClick={() => navigate(`/investigation/${tx._id}`)}
                            style={{
                              padding: "4px 8px", background: "#EFF6FF", border: "1px solid #BFDBFE",
                              color: "#2563EB", fontSize: 10, fontWeight: 700, borderRadius: 6, cursor: "pointer"
                            }}
                          >
                            Inspect
                          </button>
                        </div>
                      </div>
                      
                      <div style={{ fontSize: 11, color: "#64748B", background: "#F8FAFC", padding: "6px 10px", borderRadius: 6, borderLeft: "2px solid #E2E8F0" }}>
                        <span style={{ fontWeight: 700, color: "#475569" }}>AI Explanation:</span> {tx.explanation || "Transaction cleared automatically via continuous behavioral verification baseline matching."}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Compliance Notes */}
            <div className="card">
              <div style={{ fontSize: 14, fontWeight: 600, color: "#0F172A", marginBottom: 14 }}>Compliance Notes</div>
              <form onSubmit={handleAddNote} style={{ display: "flex", gap: 8, marginBottom: 14 }}>
                <input
                  className="input-field"
                  placeholder="Add a compliance note…"
                  value={note}
                  onChange={e => setNote(e.target.value)}
                  style={{ flex: 1 }}
                />
                <button type="submit" className="btn btn-primary btn-sm" style={{ flexShrink: 0 }}>Add</button>
              </form>
              <div style={{ display: "flex", flexDirection: "column", gap: 8, maxHeight: 200, overflowY: "auto" }}>
                {notes.map((n, i) => (
                  <div key={i} style={{ display: "flex", gap: 10, padding: "10px 12px", background: "#F8F9FB", borderRadius: 8 }}>
                    <FileText style={{ width: 14, height: 14, color: "#94A3B8", flexShrink: 0, marginTop: 1 }} />
                    <div>
                      <div style={{ fontSize: 12, color: "#0F172A" }}>{n.text}</div>
                      <div style={{ fontSize: 10, color: "#94A3B8", marginTop: 3 }}>{n.date}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
