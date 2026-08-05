export const getAnalyticsOverview = async () => {
  const res = await fetch("/api/analytics/overview");
  if (!res.ok) throw new Error("Unable to synchronize with security services.");
  return res.json();
};
