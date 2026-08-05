export const getKYCApplications = async () => {
  const res = await fetch("/api/kyc-applications");
  if (!res.ok) throw new Error("Unable to synchronize with security services.");
  return res.json();
};

export const createKYCApplication = async (payload: any) => {
  const res = await fetch("/api/kyc-applications", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  if (!res.ok) throw new Error("Unable to synchronize with security services.");
  return res.json();
};
