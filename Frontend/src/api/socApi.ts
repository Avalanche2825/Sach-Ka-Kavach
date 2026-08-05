async function safeFetchJson(url: string, options?: RequestInit) {
  try {
    const res = await fetch(url, options);
    if (!res.ok) return null;
    const contentType = res.headers.get("content-type");
    if (contentType && contentType.includes("application/json")) {
      return await res.json();
    }
    return null;
  } catch (err) {
    console.warn(`[socApi] safeFetchJson failed for ${url}:`, err);
    return null;
  }
}

export const getSocSummary = async () => {
  return (await safeFetchJson("/api/soc/summary")) || {
    sessionsMonitored: 0,
    learningProfiles: 0,
    adaptingProfiles: 0,
    matureProfiles: 0,
    averageTrust: 85,
    highRiskSessions: 0,
    criticalIncidents: 0
  };
};

export const getSocLiveSessions = async () => {
  return (await safeFetchJson("/api/soc/live-sessions")) || [];
};

export const getSocIncidents = async () => {
  return (await safeFetchJson("/api/soc/incidents")) || [];
};

export const getSocSystemHealth = async () => {
  return (await safeFetchJson("/api/soc/system-health")) || {
    fastapi: "Healthy",
    mongodb: "Healthy",
    socketio: "Healthy"
  };
};

export const getSocModelHealth = async () => {
  return (await safeFetchJson("/api/soc/model-health")) || {
    behaviorModel: { version: "v1.0", personalModels: 6 },
    fastapi: "Healthy"
  };
};

export const getSocCustomerTelemetry = async (cif: string) => {
  return await safeFetchJson(`/api/soc/customer/${cif}`);
};

export const getSocTimeline = async (sessionId: string) => {
  return (await safeFetchJson(`/api/soc/timeline/${sessionId}`)) || [];
};

export const getSystemVersion = async () => {
  return (await safeFetchJson("/api/system/version")) || { version: "2.1.0" };
};

export const holdTransaction = async (txId: string) => {
  const res = await safeFetchJson(`/api/transactions/${txId}/reject`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ approverType: "soc", action: "HOLD" })
  });
  if (!res) throw new Error("Failed to hold transaction.");
  return res;
};

export const blockTransaction = async (txId: string) => {
  const res = await safeFetchJson(`/api/transactions/${txId}/reject`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ approverType: "soc", action: "BLOCK" })
  });
  if (!res) throw new Error("Failed to block transaction.");
  return res;
};

export const approveTransaction = async (txId: string) => {
  const res = await safeFetchJson(`/api/transactions/${txId}/approve`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ approverType: "soc" })
  });
  if (!res) throw new Error("Failed to approve transaction.");
  return res;
};
