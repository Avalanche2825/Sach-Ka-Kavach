import React, { useState } from "react";
import { UserSession, Transaction } from "../../types.js";
import { Wallet, Send, ShieldCheck, History, CreditCard, Bell, ArrowUpRight, ArrowDownLeft, Clock, ShieldAlert, Building, Landmark, Percent, Briefcase } from "lucide-react";
import { formatINR, formatTimestamp, formatRelative, maskAccount } from "../../lib/format.ts";
import { useToast } from "../../components/ToastProvider.tsx";
import { createTransaction } from "../../api/transactionApi.ts";

interface DashboardProps {
  customer: UserSession | null;
  transactions: Transaction[];
  onRefresh: () => void;
}

const QUICK_ACTIONS = [
  { icon: Send,        label: "Send Money",    href: "/transfer", color: "#F97316" },
  { icon: History,     label: "View History",  href: "/transactions", color: "#1B2B6B" },
  { icon: ShieldCheck, label: "Security",      href: "/security-center", color: "#16A34A" },
  { icon: CreditCard,  label: "Cards",         href: "/dashboard",    color: "#7C3AED" },
];

function TxRow({ tx, key }: { tx: Transaction; key?: React.Key }) {
  const statusColors: Record<string, { bg: string; color: string; label: string }> = {
    Approved:          { bg: "#F0FDF4", color: "#16A34A", label: "Completed" },
    Rejected:          { bg: "#FEF2F2", color: "#DC2626", label: "Declined" },
    Pending:           { bg: "#FFFBEB", color: "#D97706", label: "Pending" },
    OTP_Required:      { bg: "#FFFBEB", color: "#D97706", label: "Verification Required" },
    CIF_Required:      { bg: "#FFFBEB", color: "#D97706", label: "Verification Required" },
    Guardian_Required: { bg: "#FFFBEB", color: "#D97706", label: "Under Security Review" },
    HOLD:              { bg: "#FFFBEB", color: "#D97706", label: "Under Security Review" },
    BLOCK:             { bg: "#FEF2F2", color: "#DC2626", label: "Declined" },
  };
  const s = statusColors[tx.status] || { bg: "#F8F9FB", color: "#64748B", label: tx.status };

  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 14,
      padding: "14px 0", borderBottom: "1px solid #F1F5F9",
    }}>
      <div style={{
        width: 38, height: 38, borderRadius: 10, flexShrink: 0,
        background: tx.status === "Approved" ? "#F0FDF4" : "#F8F9FB",
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        <Send style={{ width: 15, height: 15, color: tx.status === "Approved" ? "#16A34A" : "#94A3B8" }} />
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: "#0F172A", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {tx.receiverName || "Beneficiary Transfer"}
        </div>
        <div style={{ fontSize: 11, color: "#94A3B8", marginTop: 2 }}>
          Acc: {maskAccount(tx.accountNumber)} · {formatRelative(tx.timestamp)}
        </div>
      </div>

      <div style={{ textAlign: "right", flexShrink: 0 }}>
        <div style={{
          fontFamily: "JetBrains Mono, monospace",
          fontVariantNumeric: "tabular-nums",
          fontSize: 14, fontWeight: 700,
          color: tx.status === "Approved" ? "#0F172A" : "#94A3B8",
        }}>
          -{formatINR(tx.amount)}
        </div>
        <span style={{
          fontSize: 10, fontWeight: 600, padding: "2px 7px", borderRadius: 4,
          background: s.bg, color: s.color,
        }}>
          {s.label}
        </span>
      </div>
    </div>
  );
}

export default function Dashboard({ customer, transactions, onRefresh }: DashboardProps) {
  const { showToast } = useToast();
  const [receiverName, setReceiverName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [amount, setAmount] = useState("");
  const [submitting, setSubmitting] = useState(false);

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

  const personalTx = transactions.filter(t => t.cif === customer.cif);

  const handleTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!receiverName || !accountNumber || !amount) {
      showToast("Please fill all fields.", "warning");
      return;
    }
    setSubmitting(true);
    try {
      const payload = {
        cif: customer.cif,
        receiverName,
        accountNumber,
        amount: parseFloat(amount),
        currentIP: customer.currentIP || "127.0.0.1",
        currentDevice: customer.currentDevice || "Web Browser",
        currentLocation: customer.currentLocation || "Mumbai, IN",
        isNewDevice: false,
      };
      const res = await createTransaction(payload);
      
      if (res.status === "Approved") {
        showToast("Fund transfer completed successfully!", "success");
      } else if (res.status === "OTP_Required" || res.status === "CIF_Required") {
        showToast("Additional verification required. Please verify your details.", "warning");
      } else if (res.status === "BLOCK" || res.status === "Rejected") {
        showToast("Transaction declined for security purposes.", "error");
      } else {
        showToast("Transaction submitted and under security review.", "info");
      }
      
      setReceiverName(""); setAccountNumber(""); setAmount("");
      onRefresh();
    } catch (err: any) {
      showToast(err.message || "Transfer failed.", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const savings = customer.savingsBalance || (customer.balance ? Math.round(customer.balance * 0.6) : 90000);
  const current = customer.currentBalance || (customer.balance ? Math.round(customer.balance * 0.4) : 60000);

  return (
    <div
      className="page-enter"
      style={{ background: "#F8F9FB", minHeight: "100vh", padding: "28px 32px", display: "flex", flexDirection: "column", gap: 24 }}
    >
      {/* Bank of Baroda NetBanking Header Banner */}
      <div style={{
        padding: "20px 24px",
        background: "linear-gradient(135deg, #1B2B6B 0%, #1D4ED8 60%, #F97316 100%)",
        borderRadius: 14, color: "#FFF",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        boxShadow: "0 4px 16px rgba(27,43,107,0.12)",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{
            width: 44, height: 44, borderRadius: 10,
            background: "#F97316", color: "#FFF",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontWeight: 900, fontSize: 18,
          }}>
            BOB
          </div>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#FED7AA", textTransform: "uppercase", letterSpacing: "0.08em" }}>
              Bank of Baroda · NetBanking (bob World)
            </div>
            <h1 style={{ fontSize: 20, fontWeight: 700, color: "#FFF", margin: 0 }}>
              Welcome, {customer.name}
            </h1>
            <div style={{ fontSize: 12, color: "#CBD5E1", marginTop: 2, fontFamily: "JetBrains Mono, monospace" }}>
              User ID: {customer.cif} · Primary Acc: {maskAccount(customer.accountNumber || "91028300010")}
            </div>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{
            fontSize: 11, fontWeight: 700, color: "#34D399",
            background: "rgba(52,211,153,0.15)", border: "1px solid rgba(52,211,153,0.3)",
            padding: "4px 12px", borderRadius: 20, display: "flex", alignItems: "center", gap: 6,
          }}>
            <ShieldCheck style={{ width: 14, height: 14 }} /> Secure Encryption Grid Active
          </span>
        </div>
      </div>

      {/* Account Balance Summary + Virtual Card */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
        
        {/* Balances Card */}
        <div className="card" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <div className="label-caps" style={{ color: "#64748B" }}>Total Ledger Balance</div>
              <div style={{
                fontFamily: "JetBrains Mono, monospace",
                fontSize: 28, fontWeight: 700, color: "#0F172A", marginTop: 4
              }}>
                {formatINR(customer.balance || (savings + current))}
              </div>
            </div>
            <Landmark style={{ width: 22, height: 22, color: "#F97316" }} />
          </div>

          <div style={{ width: "100%", height: 1, background: "#E8ECF2" }} />

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <div>
              <div style={{ fontSize: 11, color: "#64748B", textTransform: "uppercase", fontWeight: 600 }}>Savings Account</div>
              <div style={{ fontSize: 16, fontWeight: 700, color: "#1B2B6B", marginTop: 2 }}>{formatINR(savings)}</div>
            </div>
            <div>
              <div style={{ fontSize: 11, color: "#64748B", textTransform: "uppercase", fontWeight: 600 }}>Current Account</div>
              <div style={{ fontSize: 16, fontWeight: 700, color: "#0F172A", marginTop: 2 }}>{formatINR(current)}</div>
            </div>
          </div>
        </div>

        {/* Baroda Debit Card */}
        <div style={{
          borderRadius: 14, padding: "24px 28px",
          background: "linear-gradient(135deg, #1B2B6B 0%, #1D4ED8 60%, #F97316 100%)",
          color: "#fff",
          display: "flex", flexDirection: "column", justifyContent: "space-between",
          minHeight: 160,
          boxShadow: "0 8px 24px rgba(27,43,107,0.25)",
        }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ fontSize: 13, fontWeight: 800, letterSpacing: "0.08em" }}>BANK OF BARODA</div>
            <CreditCard style={{ width: 22, height: 22, opacity: 0.9 }} />
          </div>

          <div>
            <div style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 14, letterSpacing: "0.12em", marginBottom: 8, opacity: 0.9 }}>
              {maskAccount(customer.accountNumber ? customer.accountNumber + "99" : "9102830001099")}
            </div>
            <div style={{ display: "flex", alignItems: "center", justifyItems: "center", justifyContent: "space-between" }}>
              <div>
                <div style={{ fontSize: 9, opacity: 0.7, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 2 }}>Card Holder</div>
                <div style={{ fontSize: 13, fontWeight: 600 }}>{customer.name}</div>
              </div>
              <div style={{
                background: "rgba(255,255,255,0.2)", backdropFilter: "blur(4px)",
                padding: "4px 10px", borderRadius: 6, fontSize: 11, fontWeight: 700,
              }}>
                VISA DEBIT
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div>
        <div className="label-caps" style={{ marginBottom: 12 }}>Banking Actions</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
          {QUICK_ACTIONS.map((a, i) => {
            const Icon = a.icon;
            return (
              <a
                key={i}
                href={a.href}
                style={{
                  display: "flex", flexDirection: "column", alignItems: "center", gap: 8,
                  padding: "16px 12px", background: "#fff",
                  border: "1px solid #E8ECF2", borderRadius: 12,
                  textDecoration: "none", cursor: "pointer",
                  transition: "all 0.15s ease",
                }}
              >
                <div style={{
                  width: 40, height: 40, borderRadius: 10,
                  background: `${a.color}12`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  <Icon style={{ width: 18, height: 18, color: a.color }} />
                </div>
                <span style={{ fontSize: 12, fontWeight: 600, color: "#0F172A" }}>{a.label}</span>
              </a>
            );
          })}
        </div>
      </div>

      {/* Main Grid: Transactions + Send Money Form */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 360px", gap: 20, alignItems: "start" }}>

        {/* Transactions */}
        <div className="card">
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
            <div style={{ fontSize: 15, fontWeight: 600, color: "#0F172A" }}>Recent Transfers</div>
            <span style={{ fontSize: 11, color: "#64748B" }}>{personalTx.length} total</span>
          </div>

          {personalTx.length === 0 ? (
            <div style={{ textAlign: "center", padding: "32px 0", color: "#94A3B8", fontSize: 13 }}>
              No transfers logged yet.
            </div>
          ) : (
            personalTx.slice(0, 8).map((tx, i) => <TxRow key={tx._id || i} tx={tx} />)
          )}
        </div>

        {/* Real-time Transfer Form */}
        <div className="card">
          <div style={{ fontSize: 15, fontWeight: 700, color: "#0F172A", marginBottom: 4 }}>
            Quick Transfer
          </div>
          <div style={{ fontSize: 12, color: "#64748B", marginBottom: 20 }}>
            Verified instantly by Bank Security Grid
          </div>

          <form onSubmit={handleTransfer} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div>
              <label className="label-caps" style={{ display: "block", marginBottom: 6 }}>Recipient Name</label>
              <input
                className="input-field"
                placeholder="Full Beneficiary Name"
                value={receiverName}
                onChange={e => setReceiverName(e.target.value)}
              />
            </div>
            <div>
              <label className="label-caps" style={{ display: "block", marginBottom: 6 }}>Account Number</label>
              <input
                className="input-field"
                placeholder="BoB / Other Bank Account"
                value={accountNumber}
                onChange={e => setAccountNumber(e.target.value)}
              />
            </div>
            <div>
              <label className="label-caps" style={{ display: "block", marginBottom: 6 }}>Amount (₹)</label>
              <input
                className="input-field"
                type="number"
                placeholder="0.00"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                min="1"
              />
            </div>

            <div style={{
              padding: "10px 14px", background: "#F0FDF4",
              border: "1px solid #BBF7D0", borderRadius: 8,
              display: "flex", gap: 8, alignItems: "flex-start",
            }}>
              <ShieldCheck style={{ width: 14, height: 14, color: "#16A34A", flexShrink: 0, marginTop: 1 }} />
              <div style={{ fontSize: 11, color: "#15803D" }}>
                Your connection is fully encrypted. Fraud protection layers actively safeguard this transaction.
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              style={{ marginTop: 4, justifyContent: "center", background: "#F97316" }}
              disabled={submitting}
            >
              {submitting ? "Processing Transaction…" : "Execute Transfer →"}
            </button>
          </form>
        </div>
      </div>
      
      {/* Fixed Deposit & Loans Widgets (wow details) */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
        <div className="card" style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{ width: 44, height: 44, borderRadius: 10, background: "rgba(22,163,74,0.1)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Percent style={{ width: 20, height: 20, color: "#16A34A" }} />
          </div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: "#0F172A" }}>Active Fixed Deposits</div>
            <div style={{ fontSize: 12, color: "#64748B", marginTop: 2 }}>₹5,00,000 invested @ 7.1% p.a.</div>
          </div>
        </div>

        <div className="card" style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{ width: 44, height: 44, borderRadius: 10, background: "rgba(37,99,235,0.1)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Briefcase style={{ width: 20, height: 20, color: "#2563EB" }} />
          </div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: "#0F172A" }}>Active Personal Loans</div>
            <div style={{ fontSize: 12, color: "#64748B", marginTop: 2 }}>No active outstanding loans.</div>
          </div>
        </div>
      </div>
    </div>
  );
}
