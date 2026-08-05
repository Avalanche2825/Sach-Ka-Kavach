export const loginUser = async (credentials: any) => {
  const res = await fetch("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(credentials)
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || "Authentication failed.");
  }
  return res.json();
};
