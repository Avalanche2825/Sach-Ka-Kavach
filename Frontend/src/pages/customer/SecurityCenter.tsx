import React, { useState } from "react";
import { Users, Laptop, ShieldCheck, AlertTriangle, Bell, Eye } from "lucide-react";
import { useToast } from "../../components/ToastProvider.tsx";
import { formatTimestamp } from "../../lib/format.ts";

interface Props {
  customer: any;
  guardian?: any;
}

function InfoRow({ label, value }: { label: string; value?: string }) {
  if (!value) return null;
  return (
    <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", padding: "10px 0", borderBottom: "1px solid #F1F5F9" }}>
      <span className="label-caps">{label}</span>
      <span style={{ fontSize: 12, fontWeight: 500, color: "#0F172A", textAlign: "right", maxWidth: 200 }}>{value}</span>
    </div>
  );
}

export default function SecurityCenter({ customer, guardian }: Props) {
  const { showToast } = useToast();
  const [reported, setReported] = useState(false);

  if (!customer) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: 400 }}>
        <div style={{ textAlign: "center", color: "#94A3B8" }}>
          <ShieldCheck style={{ width: 40, height: 40, margin: "0 auto 12px", opacity: 0.4 }} />
          <div style={{ fontSize: 14 }}>No customer profile selected.</div>
        </div>
      </div>
    );
  }

  const profile = customer.behaviorProfile || {};
  const recentLogins = customer.loginHistory?.slice(0, 5) || [];

  const handleReport = () => {
    setReported(true);
    showToast("Alert flagged. Security center has locked recent transfers pending verification.", "error");
  };

  return (
    <div
      className="page-enter"
      style={{ background: "#F8F9FB", minHeight: "100vh", padding: "28px 32px", display: "flex", flexDirection: "column", gap: 20 }}
    >
      {/* Header */}
      <div>
        <div style={{ fontSize: 12, fontWeight: 600, color: "#64748B", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 4 }}>
          Bank of Baroda · Account Security
        </div>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: "#0F172A", margin: 0 }}>Security Center</h1>
        <div style={{ fontSize: 12, color: "#94A3B8", marginTop: 4 }}>
          Monitor your account security, active devices, and guardian protection.
        </div>
      </div>

      {/* Security Status Banner */}
      <div style={{
        padding: "16px 20px",
        background: "linear-gradient(135deg, #1B2B6B, #1D4ED8)",
        borderRadius: 12,
        display: "flex",
        alignItems: "center",
        gap: 16,
        color: "#fff",
      }}>
        <div style={{ width: 44, height: 44, borderRadius: 10, background: "rgba(255,255,255,0.15)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <ShieldCheck style={{ width: 22, height: 22 }} />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 15, fontWeight: 700 }}>Your Account is Protected</div>
          <div style={{ fontSize: 12, opacity: 0.8, marginTop: 2 }}>
            Bank of Baroda Advanced Protection is active on this session
          </div>
        </div>
        <div style={{
          background: "rgba(255,255,255,0.15)",
          padding: "4px 12px", borderRadius: 20,
          fontSize: 11, fontWeight: 600,
        }}>
          ✓ Active
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>

        {/* Guardian Protection */}
        <div className="card">
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16, paddingBottom: 12, borderBottom: "1px solid #F1F5F9" }}>
            <Users style={{ width: 16, height: 16, color: "#1B2B6B" }} />
            <span style={{ fontSize: 14, fontWeight: 600, color: "#0F172A" }}>Guardian Protection</span>
          </div>

          {guardian ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{
                  width: 44, height: 44, borderRadius: 10,
                  background: "#F0FDF4", border: "1px solid #BBF7D0",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 16, fontWeight: 700, color: "#16A34A",
                }}>
                  {guardian.guardianName?.slice(0, 2).toUpperCase() || "G"}
                </div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: "#0F172A" }}>{guardian.guardianName}</div>
                  <div style={{ fontSize: 12, color: "#64748B" }}>{guardian.relationship}</div>
                </div>
                <span style={{ marginLeft: "auto", fontSize: 10, fontWeight: 700, color: "#16A34A", background: "#F0FDF4", border: "1px solid #BBF7D0", padding: "2px 8px", borderRadius: 20 }}>
                  ACTIVE
                </span>
              </div>
              <InfoRow label="Contact" value={guardian.guardianPhone || guardian.phone} />
              <div style={{ padding: "10px 14px", background: "#F0FDF4", border: "1px solid #BBF7D0", borderRadius: 8, fontSize: 12, color: "#15803D" }}>
                ✓ Your guardian can authorize emergency transfers and account recovery requests.
              </div>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div style={{ padding: "16px", background: "#FFFBEB", border: "1px solid #FDE68A", borderRadius: 8 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: "#92400E", marginBottom: 4 }}>No Guardian Linked</div>
                <div style={{ fontSize: 12, color: "#78350F" }}>
                  A guardian can authorize large transfers and account recovery requests for added security.
                </div>
              </div>
              <div style={{ padding: "12px", background: "#F8F9FB", border: "1px solid #E8ECF2", borderRadius: 8, fontSize: 12, color: "#64748B", textAlign: "center" }}>
                To link a new guardian to your account, please visit your nearest Bank of Baroda branch with your KYC credentials.
              </div>
            </div>
          )}
        </div>

        {/* Active Device */}
        <div className="card">
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16, paddingBottom: 12, borderBottom: "1px solid #F1F5F9" }}>
            <Laptop style={{ width: 16, height: 16, color: "#1B2B6B" }} />
            <span style={{ fontSize: 14, fontWeight: 600, color: "#0F172A" }}>Current Device</span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
            <InfoRow label="Device" value={customer.currentDevice || "Web Browser"} />
            <InfoRow label="IP Address" value={customer.currentIP} />
            <InfoRow label="Location" value={customer.currentLocation} />
          </div>
          <div style={{ marginTop: 12, padding: "10px 14px", background: "#EEF2FF", border: "1px solid #C7D2FE", borderRadius: 8, fontSize: 12, color: "#1B2B6B" }}>
            If you don't recognize this device or location, report it below immediately.
          </div>
        </div>

        {/* Recent Login History */}
        <div className="card">
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16, paddingBottom: 12, borderBottom: "1px solid #F1F5F9" }}>
            <Eye style={{ width: 16, height: 16, color: "#1B2B6B" }} />
            <span style={{ fontSize: 14, fontWeight: 600, color: "#0F172A" }}>Recent Login History</span>
          </div>

          {recentLogins.length === 0 ? (
            <div style={{ textAlign: "center", color: "#94A3B8", fontSize: 13, padding: "24px 0" }}>No login history available.</div>
          ) : recentLogins.map((login: any, i: number) => (
            <div
              key={i}
              style={{
                display: "flex", alignItems: "flex-start", gap: 10,
                padding: "12px 0", borderBottom: i < recentLogins.length - 1 ? "1px solid #F1F5F9" : "none",
              }}
            >
              <div style={{
                width: 32, height: 32, borderRadius: 8, flexShrink: 0,
                background: login.isNewDevice ? "#FEF2F2" : "#F0FDF4",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <Laptop style={{ width: 14, height: 14, color: login.isNewDevice ? "#DC2626" : "#16A34A" }} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: "#0F172A" }}>{login.device || "Web Browser"}</div>
                <div style={{ fontSize: 11, color: "#64748B" }}>{login.location} · {login.ip}</div>
                <div style={{ fontSize: 11, color: "#94A3B8", marginTop: 2 }}>{formatTimestamp(login.timestamp)}</div>
              </div>
              {login.isNewDevice && (
                <span style={{ fontSize: 10, fontWeight: 700, color: "#DC2626", background: "#FEF2F2", padding: "2px 6px", borderRadius: 4, flexShrink: 0 }}>
                  New
                </span>
              )}
            </div>
          ))}
        </div>

        {/* Report Suspicious Activity */}
        <div className="card">
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16, paddingBottom: 12, borderBottom: "1px solid #F1F5F9" }}>
            <AlertTriangle style={{ width: 16, height: 16, color: "#DC2626" }} />
            <span style={{ fontSize: 14, fontWeight: 600, color: "#0F172A" }}>Report Suspicious Activity</span>
          </div>

          {reported ? (
            <div style={{ padding: "20px", background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: 8, textAlign: "center" }}>
              <AlertTriangle style={{ width: 24, height: 24, color: "#DC2626", margin: "0 auto 8px" }} />
              <div style={{ fontSize: 14, fontWeight: 700, color: "#DC2626", marginBottom: 4 }}>Alert Reported</div>
              <div style={{ fontSize: 12, color: "#7F1D1D" }}>
                Our security team has been notified. Recent transfers have been flagged for review.
              </div>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div style={{ fontSize: 13, color: "#64748B", lineHeight: 1.6 }}>
                If you notice any unauthorized transactions, unfamiliar devices, or suspicious account activity — report it immediately.
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {[
                  "Unrecognized transfer or payment",
                  "Login from unknown device/location",
                  "OTP received without initiating transaction",
                  "Account balance discrepancy",
                ].map((item, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: "#64748B" }}>
                    <span style={{ width: 4, height: 4, borderRadius: "50%", background: "#94A3B8", flexShrink: 0 }} />
                    {item}
                  </div>
                ))}
              </div>
              <button
                className="btn btn-danger"
                style={{ justifyContent: "center" }}
                onClick={handleReport}
              >
                <AlertTriangle style={{ width: 14, height: 14 }} />
                Report Suspicious Activity
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
