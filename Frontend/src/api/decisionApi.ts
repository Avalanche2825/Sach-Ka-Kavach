export const getDecisionEngineState = async (sessionId: string) => {
  try {
    const res = await fetch(`/api/decision-engine/current/${sessionId}`);
    if (!res.ok) return null;
    const contentType = res.headers.get("content-type");
    if (contentType && contentType.includes("application/json")) {
      return await res.json();
    }
    return null;
  } catch (err) {
    console.warn("[decisionApi] Failed to fetch decision engine state:", err);
    return null;
  }
};
