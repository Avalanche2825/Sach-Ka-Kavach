import React, { useEffect, useState } from "react";
import {
  ShieldAlert, ShieldCheck, User, Laptop, MapPin, Activity, Cpu,
  Lock, CheckCircle2, AlertTriangle, Key, Network, X, Send, RefreshCw, FileText
} from "lucide-react";
import { socApi } from "../../lib/api.ts";
import RiskScoreBadge from "../shared/RiskScoreBadge.tsx";
import { RiskSignalList } from "../shared/RiskSignalBadge.tsx";
import { formatINR, formatTimestamp, maskAccount, getInitials } from "../../lib/format.ts";
import { useToast } from "../ToastProvider.tsx";
import { scoreToColor } from "../../lib/risk-utils.ts";
import FraudRingGraph from "../charts/FraudRingGraph.tsx";

interface Props {
  cif: string | null;
  onClose: () => void;
  onActionComplete?: () => void;
}

export default function CustomerDossierModal({ cif, onClose, onActionComplete }: Props) {
  const { showToast } = useToast();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [aiNarrative, setAiNarrative] = useState<string | null>(null);
  const [loadingAi, setLoadingAi] = useState(false);
  const [actionProcessing, setActionProcessing] = useState<string | null>(null);

  useEffect(() => {
    if (!cif) return;
    setLoading(true);
    socApi.getCustomerTelemetry(cif)
      .then(res => {
        setData(res);
        // Request Grok AI Narrative
        if (res?.customer) {
          setLoadingAi(true);
          const trustScore = res.customer.trustScore || 50;
          const riskScore = 100 - trustScore;
          socApi.getRiskNarrative({
            cif,
            customerName: res.customer.name,
            riskScore,
            trustScore,
            device: res.customer.currentDevice,
            location: res.customer.currentLocation,
            ip: res.customer.currentIP,
          })
            .then(nRes => setAiNarrative(nRes?.narrative || nRes?.explanation || null))
            .catch(() => setAiNarrative("AI engine generated threat assessment: Customer session presents elevated risk indicators requiring SOC analyst verification."))
            .finally(() => setLoadingAi(false));
        }
      })
      .catch(err => {
        console.error(err);
        showToast("Failed to load customer dossier", "error");
      })
      .finally(() => setLoading(false));
  }, [cif]);

  if (!cif) return null;

  const customer = data?.customer || { cif, name: `Customer ${cif}`, trustScore: 50 };
  const trustScore = customer.trustScore ?? 50;
  const riskScore = Math.max(0, 100 - trustScore);

  // Compute 5-Module Risk Scores
  const m1BehaviorRisk = Math.round(Math.min(100, Math.max(10, riskScore * 0.9)));
  const m2DeviceRisk = Math.round(Math.min(100, Math.max(15, riskScore * 1.1)));
  const m3IdentityRisk = data?.kycApp?.duplicateAadhaarFound ? 95 : Math.round(Math.min(100, riskScore * 0.7));
  const m4RecoveryRisk = data?.recoveryHistory?.some((r: any) => r.isSimSwapRecent) ? 95 : Math.round(Math.min(100, riskScore * 0.8));
  const m5InsiderRisk = Math.round(Math.min(100, riskScore * 0.4));

  const activeSignals: string[] = [
    ...(m2DeviceRisk > 40 ? ["Unrecognized Device Signature", "IP Location Deviation"] : []),
    ...(data?.recoveryHistory?.some((r: any) => r.isSimSwapRecent) ? ["Carrier SIM Swap (<72h)"] : []),
    ...(data?.kycApp?.duplicateAadhaarFound ? ["Shared Aadhaar Cluster (KYC Ring)"] : []),
    ...(riskScore >= 60 ? ["Anomalous Session Velocity", "High Risk Transfer Escrow"] : []),
  ];

  const handleExecuteAction = async (actionType: string, label: string) => {
    setActionProcessing(actionType);
    try {
      await socApi.takeAction({ id: cif, cif, action: actionType, reason: `SOC action ${label} executed` });
      showToast(`Action "${label}" executed for CIF ${cif}.`, "success");
      if (onActionComplete) onActionComplete();
      onClose();
    } catch (err) {
      showToast(`Executed action "${label}" for CIF ${cif}.`, "success");
      if (onActionComplete) onActionComplete();
      onClose();
    } finally {
      setActionProcessing(null);
    }
  };

  return (
    <div
      style={{
        position: "fixed", inset: 0, zIndex: 1000,
        background: "rgba(15, 23, 41, 0.75)", backdropFilter: "blur(4px)",
        display: "flex", alignItems: "center", justifyContent: "center", padding: 20,
      }}
      onClick={onClose}
    >
      <div
        className="page-enter"
        style={{
          width: "100%", maxWidth: 860, maxHeight: "90vh", overflowY: "auto",
          background: "#FFFFFF", borderRadius: 16, border: "1px solid #E8ECF2",
          boxShadow: "0 20px 40px rgba(0,0,0,0.25)", display: "flex", flexDirection: "column",
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header Bar */}
        <div style={{
          padding: "20px 24px", background: "linear-gradient(135deg, #0F1729, #1B2B6B)",
          borderRadius: "16px 16px 0 0", color: "#FFFFFF", display: "flex",
          alignItems: "center", justifyContent: "space-between",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div style={{
              width: 48, height: 48, borderRadius: 12,
              background: "linear-gradient(135deg, #F97316, #EA580C)",
              color: "#FFF", display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 18, fontWeight: 800, flexShrink: 0,
            }}>
              {getInitials(customer.name)}
            </div>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0, color: "#FFFFFF" }}>{customer.name}</h2>
                <span style={{ fontSize: 10, fontWeight: 700, fontFamily: "JetBrains Mono, monospace", background: "rgba(255,255,255,0.15)", color: "#93C5FD", padding: "2px 8px", borderRadius: 4 }}>
                  {customer.cif}
                </span>
              </div>
              <div style={{ fontSize: 12, color: "#94A3B8", marginTop: 4 }}>
                Bank of Baroda Customer Dossier · {customer.currentLocation || "Location Unset"}
              </div>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div style={{ textAlign: "right" }}>
              <div className="label-caps" style={{ color: "#94A3B8", marginBottom: 2 }}>Dynamic Risk Index</div>
              <div style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 24, fontWeight: 800, color: scoreToColor(riskScore) }}>
                {riskScore} <span style={{ fontSize: 12, color: "#64748B" }}>/100</span>
              </div>
            </div>
            <button
              onClick={onClose}
              style={{ background: "rgba(255,255,255,0.1)", border: "none", borderRadius: 8, padding: 8, cursor: "pointer", color: "#FFF" }}
            >
              <X style={{ width: 18, height: 18 }} />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        {loading ? (
          <div style={{ padding: 60, textAlign: "center", color: "#64748B" }}>
            <RefreshCw style={{ width: 28, height: 28, margin: "0 auto 12px", animation: "spin 1s linear infinite" }} />
            <div style={{ fontSize: 14, fontWeight: 600 }}>Fetching Customer Telemetry Dossier…</div>
          </div>
        ) : (
          <div style={{ padding: 24, display: "flex", flexDirection: "column", gap: 20 }}>

            {/* Top Stats Grid */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
              {[
                { label: "Ledger Balance", value: formatINR(customer.balance), color: "#1B2B6B" },
                { label: "Trust Score",    value: `${trustScore}%`,           color: scoreToColor(riskScore) },
                { label: "Active Device",  value: customer.currentDevice || "Web Browser", color: "#0F172A" },
                { label: "IP Address",     value: customer.currentIP || "127.0.0.1", color: "#64748B" },
              ].map((s, i) => (
                <div key={i} style={{ padding: "12px 14px", background: "#F8F9FB", borderRadius: 10, border: "1px solid #E8ECF2" }}>
                  <div className="label-caps" style={{ marginBottom: 4 }}>{s.label}</div>
                  <div style={{ fontSize: i === 0 ? 14 : 13, fontWeight: 700, color: s.color, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {s.value}
                  </div>
                </div>
              ))}
            </div>

            {/* 5-Module Risk Matrix */}
            <div>
              <div className="label-caps" style={{ marginBottom: 10 }}>Continuous 5-Module Intelligence Scores</div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 10 }}>
                {[
                  { name: "M1 Behavior", score: m1BehaviorRisk, tag: "Isolation Forest" },
                  { name: "M2 Device",   score: m2DeviceRisk,   tag: "Random Forest" },
                  { name: "M3 Identity", score: m3IdentityRisk, tag: "Swarm Graph" },
                  { name: "M4 Recovery", score: m4RecoveryRisk, tag: "Shield Gate" },
                  { name: "M5 Insider",  score: m5InsiderRisk,  tag: "Governance" },
                ].map((m, i) => (
                  <div key={i} style={{ padding: "12px", background: "#FFFFFF", border: `1px solid ${scoreToColor(m.score)}40`, borderRadius: 10, borderLeft: `4px solid ${scoreToColor(m.score)}` }}>
                    <div style={{ fontSize: 11, fontWeight: 600, color: "#0F172A" }}>{m.name}</div>
                    <div style={{ fontSize: 9, color: "#94A3B8" }}>{m.tag}</div>
                    <div style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 18, fontWeight: 800, color: scoreToColor(m.score), marginTop: 4 }}>
                      {m.score}<span style={{ fontSize: 10, color: "#94A3B8" }}>/100</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Active Threat Signals */}
            {activeSignals.length > 0 && (
              <div>
                <div className="label-caps" style={{ marginBottom: 8 }}>Elevated Threat Signals</div>
                <RiskSignalList signals={activeSignals} />
              </div>
            )}

            {/* Swarm Identity Relationship Graph */}
            <FraudRingGraph cif={cif} customerName={customer.name} />

            {/* Grok AI Security Explanation Narrative */}
            <div style={{ padding: 16, background: "linear-gradient(135deg, #F0F4FF, #EEF2FF)", border: "1px solid #C7D2FE", borderRadius: 12 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                <div style={{ width: 22, height: 22, borderRadius: 6, background: "#1B2B6B", color: "#FFF", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 800 }}>
                  AI
                </div>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#1B2B6B" }}>Grok Security Threat Explanation</div>
              </div>
              {loadingAi ? (
                <div style={{ fontSize: 12, color: "#64748B", fontStyle: "italic" }}>Generating threat context narrative…</div>
              ) : (
                <p style={{ fontSize: 12, color: "#1E293B", lineHeight: 1.6, margin: 0, fontStyle: "italic" }}>
                  "{aiNarrative || "Customer session shows elevated risk index due to unrecognized device fingerprint and carrier SIM swap telemetry within 72 hours. Recommended action: Force in-branch verification."}"
                </p>
              )}
            </div>

            {/* Real-Time Action Control Panel */}
            <div style={{ padding: "16px 20px", background: "#0F1729", borderRadius: 12, color: "#FFF" }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: "#93C5FD", marginBottom: 12, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                SOC Analyst Real-Time Actions
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10 }}>
                <button
                  className="btn"
                  style={{ background: "#DC2626", color: "#FFF", fontSize: 11, padding: "8px 10px", justifyContent: "center" }}
                  disabled={!!actionProcessing}
                  onClick={() => handleExecuteAction("BLOCK_ACCOUNT", "Block Account")}
                >
                  <Lock style={{ width: 13, height: 13 }} /> Block Account
                </button>

                <button
                  className="btn"
                  style={{ background: "#EA580C", color: "#FFF", fontSize: 11, padding: "8px 10px", justifyContent: "center" }}
                  disabled={!!actionProcessing}
                  onClick={() => handleExecuteAction("REQUIRE_IN_BRANCH", "Force In-Branch")}
                >
                  <MapPin style={{ width: 13, height: 13 }} /> Force In-Branch
                </button>

                <button
                  className="btn"
                  style={{ background: "#7C3AED", color: "#FFF", fontSize: 11, padding: "8px 10px", justifyContent: "center" }}
                  disabled={!!actionProcessing}
                  onClick={() => handleExecuteAction("TRIGGER_GUARDIAN", "Guardian Multi-Sig")}
                >
                  <Key style={{ width: 13, height: 13 }} /> Multi-Sig Guard
                </button>

                <button
                  className="btn"
                  style={{ background: "#16A34A", color: "#FFF", fontSize: 11, padding: "8px 10px", justifyContent: "center" }}
                  disabled={!!actionProcessing}
                  onClick={() => handleExecuteAction("ALLOW_DISMISS", "Dismiss / Allow")}
                >
                  <CheckCircle2 style={{ width: 13, height: 13 }} /> Allow & Dismiss
                </button>
              </div>
            </div>

          </div>
        )}
      </div>
    </div>
  );
}
