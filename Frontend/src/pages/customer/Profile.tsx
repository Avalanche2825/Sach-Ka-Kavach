import React from "react";
import { UserSession } from "../../types.js";
import { User, Mail, Phone, MapPin, Landmark, ShieldCheck } from "lucide-react";
import { formatINR, maskAccount } from "../../lib/format.ts";

interface Props {
  customer: UserSession | null;
}

export default function Profile({ customer }: Props) {
  if (!customer) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: 400 }}>
        <div style={{ textAlign: "center", color: "#94A3B8", fontSize: 14 }}>No customer profile active.</div>
      </div>
    );
  }

  return (
    <div
      className="page-enter"
      style={{ background: "#F8F9FB", minHeight: "100vh", padding: "28px 32px", display: "flex", flexDirection: "column", gap: 20 }}
    >
      <div>
        <div style={{ fontSize: 12, fontWeight: 600, color: "#64748B", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 4 }}>
          Bank of Baroda · My Account Profile
        </div>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: "#0F172A", margin: 0 }}>My Profile</h1>
        <div style={{ fontSize: 12, color: "#94A3B8", marginTop: 4 }}>
          View your personal details, linked accounts, and secure credentials.
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
        
        {/* Profile Card */}
        <div className="card" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14, paddingBottom: 16, borderBottom: "1px solid #F1F5F9" }}>
            <div style={{
              width: 48, height: 48, borderRadius: 24,
              background: "linear-gradient(135deg, #1B2B6B, #2563EB)",
              color: "#FFF", display: "flex", alignItems: "center", justifyContent: "center",
              fontWeight: 700, fontSize: 16
            }}>
              {customer.name?.slice(0, 2).toUpperCase() || "US"}
            </div>
            <div>
              <div style={{ fontSize: 16, fontWeight: 700, color: "#0F172A" }}>{customer.name}</div>
              <div style={{ fontSize: 12, color: "#64748B" }}>Customer ID: {customer.cif}</div>
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 13, color: "#475569" }}>
              <Phone style={{ width: 15, height: 15, color: "#94A3B8" }} />
              <span>+91 99887 76655</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 13, color: "#475569" }}>
              <Mail style={{ width: 15, height: 15, color: "#94A3B8" }} />
              <span>{customer.name?.toLowerCase().replace(" ", ".")}@barodamail.in</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 13, color: "#475569" }}>
              <MapPin style={{ width: 15, height: 15, color: "#94A3B8" }} />
              <span>{customer.currentLocation || "Mumbai, India"}</span>
            </div>
          </div>
        </div>

        {/* Account Details Card */}
        <div className="card" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, paddingBottom: 12, borderBottom: "1px solid #F1F5F9" }}>
            <Landmark style={{ width: 16, height: 16, color: "#1B2B6B" }} />
            <span style={{ fontSize: 14, fontWeight: 600, color: "#0F172A" }}>Linked Bank Accounts</span>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0" }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: "#0F172A" }}>Savings Account</div>
                <div style={{ fontSize: 11, color: "#94A3B8" }}>{maskAccount(customer.accountNumber || "91028300010")}</div>
              </div>
              <span style={{ fontSize: 14, fontWeight: 700, color: "#1B2B6B" }}>
                {formatINR(customer.savingsBalance || (customer.balance ? Math.round(customer.balance * 0.6) : 90000))}
              </span>
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderTop: "1px solid #F1F5F9" }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: "#0F172A" }}>Current Account</div>
                <div style={{ fontSize: 11, color: "#94A3B8" }}>{maskAccount(customer.accountNumber ? customer.accountNumber + "1" : "910283000101")}</div>
              </div>
              <span style={{ fontSize: 14, fontWeight: 700, color: "#0F172A" }}>
                {formatINR(customer.currentBalance || (customer.balance ? Math.round(customer.balance * 0.4) : 60000))}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
