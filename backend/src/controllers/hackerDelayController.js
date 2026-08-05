import * as dbBridge from '../utils/dbBridge.js';

export const activateDelaySession = async (req, res) => {
  try {
    const { cif, scenario } = req.body;
    if (!cif) {
      return res.status(400).json({ error: 'Missing Customer CIF for activation' });
    }

    const customer = await dbBridge.getCustomer(cif);
    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    // 1. Set coordinates based on customer location/mismatch
    let lat = 19.076;
    let lng = 72.877;
    let city = "Mumbai";
    let isp = "Jio Broadband";

    if (scenario === 'Geolocation Mismatch' || scenario === 'Account Takeover Attempt') {
      lat = 55.7558;
      lng = 37.6173;
      city = "Moscow, RU";
      isp = "Rostelecom VPN";
    }

    const sessionData = {
      cif,
      customerName: customer.name,
      scenario: scenario || 'General Threat Response',
      sessionId: `HDS-2026-${Math.floor(1000 + Math.random() * 9000)}`,
      geoCapture: { lat, lng, city, isp },
      attemptedActions: ["Login Portal Access", "Retrieve Account Balance", "Update Beneficiary details", "Initiate High-value Transfer"],
      fingerprintHash: `a3f8c2d9${Math.random().toString(16).slice(2, 10)}`,
      delayDuration: Math.floor(60 + Math.random() * 120)
    };

    // 2. Add delay session
    const savedSess = await dbBridge.addHackerDelaySession(sessionData);

    // 3. Log to audit ledger
    await dbBridge.addAuditLog({
      timestamp: new Date().toISOString(),
      user: 'SACH Kavach AI Engine',
      event: `Hacker Delay Layer Triggered: Session throttled for CIF ${cif} due to ${scenario}`,
      riskScore: 72,
      riskFactors: [`Suspicious session patterns: ${scenario}`, 'Throttling page load times to capture forensics'],
      decision: 'FLAGGED_MANUAL_REVIEW'
    });

    // 4. Update customer trust score slightly down
    const updatedTrust = Math.max(0, customer.trustScore - 15);
    await dbBridge.updateCustomer(cif, { trustScore: updatedTrust });

    res.status(201).json(savedSess);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getDelayIntelligence = async (req, res) => {
  try {
    const list = await dbBridge.getHackerDelaySessions();
    if (list.length > 0) {
      res.json(list[0]);
    } else {
      // Return default template data
      res.json({
        sessionId: "HDS-2026-4421",
        detectedAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
        geoCapture: { lat: 19.076, lng: 72.877, city: "Mumbai", isp: "Jio Broadband" },
        attemptedActions: ["Login Portal Access", "View Balance", "Add Beneficiary", "Transfer ₹4,80,000"],
        fingerprintHash: "a3f8c2d9e03f1b4a",
        fraudTeamNotified: true,
        delayDuration: 127
      });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
