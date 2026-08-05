import React from "react";
import { AlertTriangle, ShieldCheck, HelpCircle, ArrowUpRight, Cpu, Eye } from "lucide-react";

interface Props {
  factors?: string[];
  amount?: number;
  receiverName?: string;
  location?: string;
  device?: string;
  confidence?: number;
}

export default function SignalCards({
  factors = [],
  amount = 0,
  receiverName = "Unknown",
  location = "Jaipur, IN",
  device = "Web Browser",
  confidence = 92
}: Props) {
  // Generate signal cards based on factors
  const signals = [];

  if (factors.some(f => f.toLowerCase().includes("new device") || f.toLowerCase().includes("unrecognized"))) {
    signals.push({
      type: "high",
      title: "New Device Registered",
      desc: `First session ever detected from ${device || "this device"}.`
    });
  } else {
    signals.push({
      type: "low",
      title: "Device baseline matched",
      desc: "Device fingerprint aligns with trusted history profile."
    });
  }

  if (factors.some(f => f.toLowerCase().includes("location") || f.toLowerCase().includes("geo") || f.toLowerCase().includes("mismatch"))) {
    signals.push({
      type: "high",
      title: "Geo-Location Mismatch",
      desc: `Current access in Mumbai conflicts with customer baseline in ${location}.`
    });
  }

  if (factors.some(f => f.toLowerCase().includes("vpn") || f.toLowerCase().includes("proxy") || f.toLowerCase().includes("network"))) {
    signals.push({
      type: "high",
      title: "Proxy/VPN Network",
      desc: "IP routing indicates an active anonymous hosting provider or VPN tunnel."
    });
  }

  if (amount > 50000 || factors.some(f => f.toLowerCase().includes("ratio") || f.toLowerCase().includes("amount") || f.toLowerCase().includes("above average"))) {
    signals.push({
      type: "high",
      title: "High Value Transfer",
      desc: `Transaction of ${amount ? `₹${amount.toLocaleString()}` : "large amount"} exceeds daily historical threshold.`
    });
  }

  if (factors.some(f => f.toLowerCase().includes("typing") || f.toLowerCase().includes("cadence") || f.toLowerCase().includes("speed"))) {
    signals.push({
      type: "medium",
      title: "Typing Cadence Shift",
      desc: "Keystroke rhythm variance shows an abnormal deviation from baseline."
    });
  }

  if (signals.length === 0) {
    signals.push({
      type: "low",
      title: "Access baseline verified",
      desc: "All dynamic biometrics and parameters match historical baseline check."
    });
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* Risk Signals Grid */}
      <div>
        <div className="label-caps" style={{ marginBottom: 12 }}>Risk Threat Signals</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 12 }}>
          {signals.map((s, i) => {
            const isHigh = s.type === "high";
            const isMed = s.type === "medium";
            return (
              <div
                key={i}
                style={{
                  padding: "14px 16px",
                  background: "#FFFFFF",
                  border: `1px solid ${isHigh ? "#FECACA" : isMed ? "#FDE68A" : "#BBF7D0"}`,
                  borderRadius: 10,
                  boxShadow: "0 2px 6px rgba(0,0,0,0.02)"
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                  <span style={{
                    width: 8, height: 8, borderRadius: "50%",
                    background: isHigh ? "#DC2626" : isMed ? "#D97706" : "#16A34A"
                  }} />
                  <span style={{ fontSize: 13, fontWeight: 700, color: "#0F172A" }}>{s.title}</span>
                </div>
                <div style={{ fontSize: 11, color: "#64748B", lineHeight: 1.4 }}>{s.desc}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Recommended Action Card */}
      <div style={{
        padding: "18px 20px",
        background: "linear-gradient(135deg, #F0F4FF, #EEF2FF)",
        border: "1px solid #C7D2FE",
        borderRadius: 12,
        boxShadow: "0 4px 12px rgba(27,43,107,0.03)"
      }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Cpu style={{ width: 18, height: 18, color: "#1B2B6B" }} />
            <span style={{ fontSize: 13, fontWeight: 700, color: "#1B2B6B" }}>Explainable Security Recommendation</span>
          </div>
          <span style={{
            fontSize: 11, fontWeight: 700, color: "#1B2B6B",
            background: "rgba(27,43,107,0.08)", padding: "2px 8px", borderRadius: 20
          }}>
            Confidence: {confidence}%
          </span>
        </div>

        <div style={{ fontSize: 13, fontWeight: 700, color: "#0F172A", marginBottom: 6 }}>
          Trigger Out-of-Band Step-Up Verification (OTP Challenge)
        </div>
        <p style={{ fontSize: 12, color: "#334155", lineHeight: 1.5, margin: 0 }}>
          Session initiated from an unrecognized device using a VPN routing network. Current geographical check indicates Mumbai, which diverges from customer's home region of {location}. Recommend initiating a verification challenge before approving high-value transfer.
        </p>
      </div>
    </div>
  );
}
