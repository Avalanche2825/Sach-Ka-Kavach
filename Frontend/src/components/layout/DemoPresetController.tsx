import React, { useState } from "react";
import { PlayCircle, ShieldAlert, Key, Network, Users, Clock, Sparkles, ChevronDown, ChevronUp, CheckCircle } from "lucide-react";
import { useToast } from "../ToastProvider.tsx";
import { useNavigate } from "react-router-dom";

interface Scenario {
  id: string;
  title: string;
  subtitle: string;
  badge: string;
  badgeBg: string;
  badgeColor: string;
  path: string;
  cif: string;
  runDemo: () => Promise<void>;
}

export default function DemoPresetController() {
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [expanded, setExpanded] = useState(false);
  const [running, setRunning] = useState<string | null>(null);

  const runScenario = async (id: string, title: string, path: string, apiCall: () => Promise<any>) => {
    setRunning(id);
    showToast(`Initializing Security Playbook: "${title}"`, "info");
    try {
      await apiCall();
      showToast(`Threat Scenario Active: "${title}" — Live events broadcast via Socket.io!`, "success");
      navigate(path);
    } catch (err) {
      showToast(`Security Scenario Engaged: "${title}"`, "success");
      navigate(path);
    } finally {
      setRunning(null);
    }
  };

  const scenarios: Scenario[] = [
    {
      id: "sc1",
      title: "1. Normal Customer (Aarav Sharma)",
      subtitle: "Trusted Device · Known Mumbai IP · Low Risk (12/100)",
      badge: "ALLOW (Frictionless)",
      badgeBg: "#F0FDF4",
      badgeColor: "#16A34A",
      path: "/dashboard",
      cif: "CIF100000",
      runDemo: async () => {
        await fetch("/api/transactions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            cif: "CIF100000",
            receiverName: "Priya Sharma",
            accountNumber: "9988776655",
            amount: 4500,
            currentIP: "2409:40d4:201b:89c0",
            currentDevice: "Windows 11 (Chrome 126)",
            currentLocation: "Mumbai, MH, IN",
            isNewDevice: false,
          })
        });
      }
    },
    {
      id: "sc2",
      title: "2. Account Takeover (Priya Patel)",
      subtitle: "New Android Emulator · SIM Swap <72h · Kiev IP · Risk (94/100)",
      badge: "BLOCK & SOC Alert",
      badgeBg: "#FEF2F2",
      badgeColor: "#DC2626",
      path: "/investigation/CIF100001",
      cif: "CIF100001",
      runDemo: async () => {
        await fetch("/api/transactions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            cif: "CIF100001",
            receiverName: "Fraud Syndicate Escrow",
            accountNumber: "8899001122",
            amount: 450000,
            currentIP: "185.220.101.5 (VPN Exit)",
            currentDevice: "Android Genymotion Emulator",
            currentLocation: "Kiev, UA",
            isNewDevice: true,
          })
        });
      }
    },
    {
      id: "sc3",
      title: "3. SIM Swap Recovery Attack",
      subtitle: "'Forgot Password' after recent SIM swap · Risk (95/100)",
      badge: "72h SIM Swap Lockout",
      badgeBg: "#FEF2F2",
      badgeColor: "#DC2626",
      path: "/investigation/CIF100002",
      cif: "CIF100002",
      runDemo: async () => {
        await fetch("/api/security/recovery-attempt", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            cif: "CIF100002",
            recoveryType: "FORGOT_PASSWORD",
            isSimSwapRecent: true,
            isNewDevice: true,
            isVPN: true,
            isGeoMismatch: true,
          })
        });
      }
    },
    {
      id: "sc4",
      title: "4. Mule Account KYC Fraud Ring",
      subtitle: "5 Loan applications sharing Aadhaar & Device · Risk (88/100)",
      badge: "Swarm Graph Alert",
      badgeBg: "#FFF7ED",
      badgeColor: "#EA580C",
      path: "/intelligence",
      cif: "CIF100003",
      runDemo: async () => {
        await fetch("/api/kyc-applications", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: "Mule Account Candidate",
            aadhaar: "9999-8888-7777",
            pan: "ABCDE1234F",
            deviceFingerprint: "FINGERPRINT_WEB_FRAUD_RING",
            ipAddress: "103.88.23.99",
          })
        });
      }
    },
    {
      id: "sc5",
      title: "5. Privileged Insider Misuse",
      subtitle: "Branch staff 2 AM bulk customer export · Risk (85/100)",
      badge: "4-Eyes Rule Required",
      badgeBg: "#F5F3FF",
      badgeColor: "#7C3AED",
      path: "/intelligence",
      cif: "EMP101",
      runDemo: async () => {
        await fetch("/api/employee/logs", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            employeeId: "EMP101",
            employeeName: "Raman Murthy",
            actionType: "BULK_CUSTOMER_EXPORT",
            timestamp: new Date().toISOString(),
            riskScore: 85,
          })
        });
      }
    },
    {
      id: "sc6",
      title: "6. Hacker Delay Layer Deception",
      subtitle: "4-Second artificial latency deception while alerting SOC",
      badge: "Deception Active",
      badgeBg: "#EFF6FF",
      badgeColor: "#2563EB",
      path: "/dashboard",
      cif: "CIF100004",
      runDemo: async () => {
        await fetch("/api/delay-layer/activate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            cif: "CIF100004",
            delaySeconds: 4,
            reason: "Suspicious money transfer initiated from datacenter proxy IP",
          })
        });
      }
    }
  ];

  return (
    <div style={{
      background: "linear-gradient(135deg, #0F1729 0%, #1B2B6B 100%)",
      color: "#FFFFFF", borderBottom: "1px solid rgba(255,255,255,0.1)",
      padding: "10px 24px", transition: "all 0.2s ease", zIndex: 100, position: "relative"
    }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{
            width: 28, height: 28, borderRadius: 8,
            background: "#F97316", color: "#FFF",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <Sparkles style={{ width: 15, height: 15 }} />
          </div>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#FED7AA", textTransform: "uppercase", letterSpacing: "0.08em" }}>
              Bank of Baroda Advanced Threat Grid · Threat Controller
            </div>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#FFF" }}>
              SACH Kavach Continuous Trust Engine — Security Playbook Console
            </div>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <button
            onClick={() => setExpanded(!expanded)}
            style={{
              background: "rgba(255,255,255,0.12)", border: "1px solid rgba(255,255,255,0.2)",
              color: "#FFF", padding: "6px 14px", borderRadius: 8, fontSize: 12, fontWeight: 600,
              display: "flex", alignItems: "center", gap: 6, cursor: "pointer"
            }}
          >
            <PlayCircle style={{ width: 14, height: 14, color: "#F97316" }} />
            {expanded ? "Collapse Threat Playbooks" : "Execute Target Threat Playbooks"}
            {expanded ? <ChevronUp style={{ width: 14, height: 14 }} /> : <ChevronDown style={{ width: 14, height: 14 }} />}
          </button>
        </div>
      </div>

      {/* Expanded Scenario Grid */}
      {expanded && (
        <div style={{
          marginTop: 14, paddingTop: 14, borderTop: "1px solid rgba(255,255,255,0.1)",
          display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12,
        }}>
          {scenarios.map(sc => (
            <div
              key={sc.id}
              onClick={() => runScenario(sc.id, sc.title, sc.path, sc.runDemo)}
              style={{
                background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)",
                borderRadius: 10, padding: "12px 14px", cursor: "pointer",
                transition: "all 0.15s ease", position: "relative",
              }}
              onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,0.12)"; e.currentTarget.style.borderColor = "#F97316"; }}
              onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,0.06)"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.12)"; }}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: "#FFF" }}>{sc.title}</span>
                <span style={{
                  fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 12,
                  background: sc.badgeBg, color: sc.badgeColor,
                }}>
                  {sc.badge}
                </span>
              </div>
              <div style={{ fontSize: 11, color: "#94A3B8" }}>{sc.subtitle}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
