export const getCustomers = async () => {
  const res = await fetch("/api/customers");
  if (!res.ok) throw new Error("Unable to synchronize with security services.");
  return res.json();
};
export const getCustomerByCIF = async (cif: string) => {
  const res = await fetch(`/api/customers/${cif}`);
  if (!res.ok) throw new Error("Unable to synchronize with security services.");
  return res.json();
};
export const registerCustomer = async (payload: any) => {
  const res = await fetch("/api/customers/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  if (!res.ok) throw new Error("Unable to synchronize with security services.");
  return res.json();
};
export const getGuardianByCIF = async (cif: string) => {
  const res = await fetch(`/api/customers/${cif}/guardian`);
  if (!res.ok) throw new Error("Unable to synchronize with security services.");
  return res.json();
};
export const enrollGuardian = async (cif: string, payload: any) => {
  const res = await fetch(`/api/customers/${cif}/guardian`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  if (!res.ok) throw new Error("Unable to synchronize with security services.");
  return res.json();
};
