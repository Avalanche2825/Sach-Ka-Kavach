export const getEmployeeLogs = async () => {
  const res = await fetch("/api/employee/logs");
  if (!res.ok) throw new Error("Unable to synchronize with security services.");
  return res.json();
};

export const createEmployeeLog = async (payload: any) => {
  const res = await fetch("/api/employee/logs", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || "Action blocked by security policies.");
  }
  return res.json();
};

export const approveEmployeeLog = async (id: string) => {
  const res = await fetch(`/api/employee/logs/${id}/approve`, {
    method: "POST"
  });
  if (!res.ok) throw new Error("Unable to synchronize with security services.");
  return res.json();
};
