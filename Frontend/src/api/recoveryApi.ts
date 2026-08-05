export const createRecoveryAttempt = async (payload: any) => {
  const res = await fetch("/api/security/recovery-attempt", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  if (!res.ok) throw new Error("Unable to synchronize with security services.");
  return res.json();
};
