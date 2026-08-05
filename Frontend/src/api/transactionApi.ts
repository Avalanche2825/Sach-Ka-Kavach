export const getTransactions = async () => {
  const res = await fetch("/api/transactions");
  if (!res.ok) throw new Error("Unable to synchronize with security services.");
  return res.json();
};
export const createTransaction = async (payload: any) => {
  const res = await fetch("/api/transactions", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || "Unable to synchronize with security services.");
  }
  return res.json();
};
export const approveTx = async (id: string, approverType: string = "guardian") => {
  const res = await fetch(`/api/transactions/${id}/approve`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ approverType })
  });
  if (!res.ok) throw new Error("Unable to synchronize with security services.");
  return res.json();
};
export const rejectTx = async (id: string, approverType: string = "guardian") => {
  const res = await fetch(`/api/transactions/${id}/reject`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ approverType })
  });
  if (!res.ok) throw new Error("Unable to synchronize with security services.");
  return res.json();
};
