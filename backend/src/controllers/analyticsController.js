import * as dbBridge from '../utils/dbBridge.js';

export const getAnalyticsOverview = async (req, res) => {
  try {
    const customers = await dbBridge.getCustomers();
    const auditLogs = await dbBridge.getAuditLogs();

    // 1. Calculate Average Customer Trust Score
    const avgTrust = customers.length > 0
      ? Math.round(customers.reduce((acc, c) => acc + c.trustScore, 0) / customers.length)
      : 80;

    // 2. Mock 7-day trend values around the current customer trust base
    const trustTrend = [
      { date: "Mon", customerTrust: Math.min(100, avgTrust - 2), deviceRisk: 28, recoveryRisk: 14 },
      { date: "Tue", customerTrust: Math.min(100, avgTrust - 1), deviceRisk: 31, recoveryRisk: 18 },
      { date: "Wed", customerTrust: Math.min(100, avgTrust - 3), deviceRisk: 29, recoveryRisk: 25 },
      { date: "Thu", customerTrust: Math.min(100, avgTrust + 1), deviceRisk: 34, recoveryRisk: 21 },
      { date: "Fri", customerTrust: Math.min(100, avgTrust - 2), deviceRisk: 38, recoveryRisk: 19 },
      { date: "Sat", customerTrust: Math.min(100, avgTrust + 2), deviceRisk: 30, recoveryRisk: 15 },
      { date: "Sun", customerTrust: avgTrust, deviceRisk: 32, recoveryRisk: 17 }
    ];

    // 3. Count audit log patterns for the breakdown chart
    let behavioralCount = 0;
    let deviceCount = 0;
    let onboardingCount = 0;
    let recoveryCount = 0;
    let insiderCount = 0;

    auditLogs.forEach(log => {
      const msg = (log.event || '').toLowerCase();
      const factorsStr = (log.riskFactors || []).join(' ').toLowerCase();
      if (msg.includes('behavioral') || factorsStr.includes('typing') || factorsStr.includes('cadence')) {
        behavioralCount++;
      } else if (msg.includes('device') || msg.includes('emulator') || factorsStr.includes('device') || factorsStr.includes('ip')) {
        deviceCount++;
      } else if (msg.includes('kyc') || msg.includes('onboarding') || msg.includes('aadhaar')) {
        onboardingCount++;
      } else if (msg.includes('recovery') || msg.includes('password') || msg.includes('sim swap')) {
        recoveryCount++;
      } else if (msg.includes('insider') || msg.includes('employee') || msg.includes('override') || msg.includes('ticket')) {
        insiderCount++;
      } else {
        // distribute remaining
        const code = log._id.charCodeAt(log._id.length - 1) % 5;
        if (code === 0) behavioralCount++;
        else if (code === 1) deviceCount++;
        else if (code === 2) onboardingCount++;
        else if (code === 3) recoveryCount++;
        else insiderCount++;
      }
    });

    const threatBreakdown = [
      { type: "Behavioral Anomaly", count: behavioralCount || 12 },
      { type: "Device Risk", count: deviceCount || 19 },
      { type: "Onboarding Fraud", count: onboardingCount || 8 },
      { type: "Recovery Attempt", count: recoveryCount || 5 },
      { type: "Insider Misuse", count: insiderCount || 6 }
    ];

    // 4. Seeding dynamic risk heatmap grid for 6 staff/time bands
    const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const hours = ["00-04", "04-08", "08-12", "12-16", "16-20", "20-24"];
    const riskHeatmap = [];

    days.forEach(day => {
      hours.forEach(hour => {
        let count = Math.floor(Math.random() * 4);
        let avgRisk = Math.floor(Math.random() * 30);
        // Create an anomaly slot
        if (day === "Tue" && hour === "20-24") {
          count = 8;
          avgRisk = 78;
        } else if (day === "Thu" && hour === "00-04") {
          count = 5;
          avgRisk = 84;
        }
        riskHeatmap.push({ day, hour, count, avgRisk });
      });
    });

    const moduleStatus = [
      { module: "Behavioral Engine", status: "ACTIVE", eventsToday: behavioralCount },
      { module: "Device Trust", status: "ACTIVE", eventsToday: deviceCount },
      { module: "Swarm KYC", status: "ALERT", eventsToday: onboardingCount },
      { module: "Insider Governance", status: "ACTIVE", eventsToday: insiderCount }
    ];

    res.json({
      trustTrend,
      threatBreakdown,
      riskHeatmap,
      moduleStatus
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
