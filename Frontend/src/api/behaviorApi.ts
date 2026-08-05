export const collectBehaviorSignals = async (payload: any) => {
  const res = await fetch("/api/behavior/collect", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  if (!res.ok) throw new Error("Unable to synchronize with security services.");
  return res.json();
};
export const getSharedConfig = async () => {
  const res = await fetch("/api/config");
  if (!res.ok) throw new Error("Unable to synchronize with security services.");
  return res.json();
};
