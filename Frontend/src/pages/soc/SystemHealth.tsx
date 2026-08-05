import React, { useEffect, useState } from "react";
import { getSocSystemHealth } from "../../api/socApi.ts";
import { Activity, Database, Cpu, Server, CheckCircle, AlertTriangle, XCircle, RefreshCw } from "lucide-react";
import { KpiSkeleton } from "../../components/shared/LoadingState.tsx";

function StatusDot({ status }: { status: string }) {
  const s = (status || "").toLowerCase();
  if (s === "ok" || s === "healthy" || s === "online" || s === "operational") {
    return <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#16A34A", display: "inline-block" }} />;
  }
  if (s === "degraded" || s === "slow" || s === "warning") {
    return <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#D97706", display: "inline-block" }} />;
  }
  return <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#DC2626", display: "inline-block" }} />;
}

function ServiceCard({ name, status, latency, icon: Icon }: {
  key?: React.Key; name: string; status: string; latency?: string | number; icon: any
}) {
  const s = (status || "").toLowerCase();
  const isOk = s === "ok" || s === "healthy" || s === "online" || s === "operational";
  const isDeg = s === "degraded" || s === "slow" || s === "warning";

  const bg = isOk ? "#F0FDF4" : isDeg ? "#FFFBEB" : "#FEF2F2";
  const border = isOk ? "#BBF7D0" : isDeg ? "#FDE68A" : "#FECACA";
  const color = isOk ? "#15803D" : isDeg ? "#92400E" : "#991B1B";
  const label = isOk ? "Operational" : isDeg ? "Degraded" : "Offline";

  return (
    <div className="card" style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{
          width: 40, height: 40, borderRadius: 10,
          background: isOk ? "#F0FDF4" : isDeg ? "#FFFBEB" : "#FEF2F2",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <Icon style={{ width: 18, height: 18, color: isOk ? "#16A34A" : isDeg ? "#D97706" : "#DC2626" }} />
        </div>
        <div>
          <div style={{ fontSize: 13, fontWeight: 600, color: "#0F172A" }}>{name}</div>
          <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
            <StatusDot status={status} />
            <span style={{
              fontSize: 11, fontWeight: 600, color, background: bg, border: `1px solid ${border}`,
              padding: "1px 7px", borderRadius: 20,
            }}>
              {label}
            </span>
          </div>
        </div>
      </div>

      {latency !== undefined && (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 0", borderTop: "1px solid #F1F5F9" }}>
          <span style={{ fontSize: 12, color: "#64748B" }}>Response</span>
          <span style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 12, fontWeight: 600, color: "#0F172A" }}>
            {latency}ms
          </span>
        </div>
      )}
    </div>
  );
}

export default function SystemHealth() {
  const [health, setHealth] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(new Date());

  const load = () => {
    setLoading(true);
    getSocSystemHealth()
      .then(data => { setHealth(data); setLastUpdated(new Date()); })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const services = [
    { name: "API Gateway",        status: health?.api?.status || "ok",      latency: health?.api?.latency || 12,   icon: Server },
    { name: "MongoDB Atlas",      status: health?.database?.status || "ok", latency: health?.database?.latency,   icon: Database },
    { name: "ML Service",         status: health?.mlService?.status || "ok", latency: health?.mlService?.latency, icon: Cpu },
    { name: "Socket.io Engine",   status: health?.socket?.status || "ok",   latency: health?.socket?.latency,     icon: Activity },
  ];

  const mlModels = health?.models || [];

  return (
    <div
      className="page-enter"
      style={{ background: "#F8F9FB", minHeight: "100vh", padding: "28px 32px", display: "flex", flexDirection: "column", gap: 20 }}
    >
      {/* Header */}
      <div className="card" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "18px 24px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <Server style={{ width: 20, height: 20, color: "#1B2B6B" }} />
          <div>
            <h1 style={{ fontSize: 17, fontWeight: 700, color: "#0F172A", margin: 0 }}>System Diagnostics</h1>
            <div style={{ fontSize: 12, color: "#64748B" }}>
              Last updated: {lastUpdated.toLocaleTimeString("en-IN")} IST
            </div>
          </div>
        </div>
        <button className="btn btn-ghost btn-sm" onClick={load}>
          <RefreshCw style={{ width: 13, height: 13 }} /> Refresh
        </button>
      </div>

      {loading ? <KpiSkeleton count={4} /> : (
        <>
          {/* Core Services */}
          <div>
            <div style={{ fontSize: 14, fontWeight: 600, color: "#0F172A", marginBottom: 14 }}>Core Services</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16 }}>
              {services.map((s, i) => <ServiceCard key={i} name={s.name} status={s.status} latency={s.latency} icon={s.icon} />)}
            </div>
          </div>

          {/* ML Models */}
          {mlModels.length > 0 && (
            <div>
              <div style={{ fontSize: 14, fontWeight: 600, color: "#0F172A", marginBottom: 14 }}>
                ML Model Registry
              </div>
              <div className="card" style={{ padding: 0, overflow: "hidden" }}>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Model Name</th>
                      <th>Status</th>
                      <th>Accuracy</th>
                      <th>Last Trained</th>
                    </tr>
                  </thead>
                  <tbody>
                    {mlModels.map((m: any, i: number) => (
                      <tr key={i}>
                        <td style={{ fontSize: 13, fontWeight: 600, color: "#0F172A" }}>{m.name}</td>
                        <td>
                          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                            <StatusDot status={m.status} />
                            <span style={{ fontSize: 12, color: "#64748B" }}>{m.status}</span>
                          </div>
                        </td>
                        <td>
                          <span style={{
                            fontFamily: "JetBrains Mono, monospace", fontSize: 13, fontWeight: 700,
                            color: (m.accuracy || 0) > 0.9 ? "#16A34A" : "#D97706",
                          }}>
                            {m.accuracy ? `${(m.accuracy * 100).toFixed(1)}%` : "—"}
                          </span>
                        </td>
                        <td style={{ fontSize: 12, color: "#64748B" }}>
                          {m.lastTrained ? new Date(m.lastTrained).toLocaleDateString("en-IN") : "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Raw health data */}
          {health && !mlModels.length && (
            <div className="card">
              <div style={{ fontSize: 13, fontWeight: 600, color: "#0F172A", marginBottom: 12 }}>Raw Health Data</div>
              <pre style={{
                fontFamily: "JetBrains Mono, monospace", fontSize: 11, color: "#0F172A",
                background: "#F8F9FB", padding: 16, borderRadius: 8, overflowX: "auto",
                border: "1px solid #E8ECF2",
              }}>
                {JSON.stringify(health, null, 2)}
              </pre>
            </div>
          )}
        </>
      )}
    </div>
  );
}
