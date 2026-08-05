import crypto from 'crypto';
import http from 'http';
import * as dbBridge from '../utils/dbBridge.js';
import { enrichIPReputation, calculateGeoDistance, checkImpossibleTravel } from '../utils/geoipService.js';
import { generateDeviceHash, detectEmulatorOrVM, evaluateDeviceProfileMatch, checkSimSwapWithin72Hours } from '../utils/fingerprintService.js';

const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://localhost:5001';
const ML_HOST = ML_SERVICE_URL.replace('http://', '').split(':')[0];
const ML_PORT = parseInt(ML_SERVICE_URL.split(':').pop()) || 5001;

// Internal helper to call Python ML Service
function mlPost(path, body, correlationId = null) {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify(body);
    const headers = {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(payload),
    };
    if (correlationId) {
      headers['X-Correlation-ID'] = correlationId;
    }
    const req = http.request(
      {
        hostname: ML_HOST,
        port: ML_PORT,
        path,
        method: 'POST',
        headers,
      },
      (res) => {
        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => {
          try {
            resolve(JSON.parse(data));
          } catch {
            reject(new Error('ML service parsing error'));
          }
        });
      }
    );
    req.on('error', reject);
    req.setTimeout(3000, () => req.destroy(new Error('ML service timeout')));
    req.write(payload);
    req.end();
  });
}

/**
 * POST /api/device/collect
 * Ingests device telemetry, enriches IP/Geo, evaluates Random Forest ML model, writes to DB, emits Sockets.
 */
export const collectDeviceSignals = async (req, res) => {
  try {
    const { cif, accountNumber, sessionId, rawSignals, behaviorRiskScore = 12 } = req.body;
    const correlationId = req.headers['x-correlation-id'] || crypto.randomUUID();

    if (!cif || !rawSignals) {
      return res.status(400).json({ error: "Missing required parameters: cif and rawSignals are mandatory." });
    }

    const clientIP = req.ip || req.headers['x-forwarded-for'] || '127.0.0.1';
    const geo = enrichIPReputation(clientIP);

    const deviceHash = generateDeviceHash(rawSignals);
    const emulatorInfo = detectEmulatorOrVM(rawSignals, rawSignals.userAgent);

    // Fetch customer and device profile
    const customer = await dbBridge.getCustomer(cif);
    let profile = await dbBridge.getDeviceProfile(cif);

    if (!profile) {
      profile = await dbBridge.addDeviceProfile({
        cif,
        accountNumber: accountNumber || customer?.accountNumber || `ACC_${cif}`,
        trustedDeviceHashes: [deviceHash],
        knownBrowsers: [rawSignals.browser || 'Chrome'],
        knownOS: [rawSignals.os || 'Windows'],
        knownCities: [geo.city],
        knownIPRanges: [`${geo.ip.split('.').slice(0, 3).join('.')}.0/24`],
        knownISPs: [geo.isp],
        knownASNs: [geo.asn],
        simSwapHistory: [],
        totalLogins: 1,
        highRiskAttemptsCount: 0
      });
    }

    const matches = evaluateDeviceProfileMatch(profile, {
      deviceHash,
      browser: rawSignals.browser,
      os: rawSignals.os,
      ipAddress: geo.ip,
      isp: geo.isp,
      asn: geo.asn,
      city: geo.city
    });

    const simSwap = checkSimSwapWithin72Hours(profile);

    // Retrieve last event for impossible travel
    const lastEvent = await dbBridge.getLastDeviceEvent(cif);
    let timeDiffMin = 60;
    if (lastEvent) {
      timeDiffMin = (Date.now() - new Date(lastEvent.timestamp).getTime()) / (1000 * 60);
    }
    const travelCheck = checkImpossibleTravel(lastEvent?.geo, geo, timeDiffMin);

    // Count access velocity (logins in last 15 mins)
    const velocity = await dbBridge.getDeviceAccessVelocity(cif, 15);

    // Call Python ML Engine for Device Score
    const mlPayload = {
      is_new_device: matches.isNewDevice,
      is_new_browser: matches.isNewBrowser,
      is_new_os: matches.isNewOS,
      is_new_network: matches.isNewNetwork,
      is_new_isp: matches.isNewISP,
      is_new_asn: matches.isNewASN,
      geo_distance_km: travelCheck.distanceKm,
      impossible_travel: travelCheck.impossible,
      vpn_detected: geo.isVPN,
      proxy_or_datacenter: geo.isProxy || geo.isHosting,
      is_emulator_or_vm: emulatorInfo.isEmulator,
      sim_swap_recent_72h: simSwap.isSimSwapRecent,
      access_velocity: velocity,
      behavior_trust_score: behaviorRiskScore,
      current_ip: geo.ip
    };

    let mlResult;
    try {
      mlResult = await mlPost('/score/device', mlPayload, correlationId);
    } catch (err) {
      console.warn(`[Express Device Gateway] Python ML scoring offline (${err.message}). Using local heuristic rule engine.`);
      
      let heuristicRisk = 0;
      const hFactors = [];
      if (matches.isNewDevice) { heuristicRisk += 8; hFactors.push("Hardware fingerprint not in trusted registry"); }
      if (geo.isVPN || geo.isProxy) { heuristicRisk += 4; hFactors.push("Routing through VPN or proxy provider"); }
      if (travelCheck.impossible) { heuristicRisk += 4; hFactors.push("Impossible travel speed vector detected"); }
      if (simSwap.isSimSwapRecent) { heuristicRisk += 5; hFactors.push("SIM swap registered in last 72 hours"); }
      if (emulatorInfo.isEmulator) { heuristicRisk += 2; hFactors.push(`Virtualized environment: ${emulatorInfo.emulatorType}`); }
      if (matches.isNewBrowser || matches.isNewOS) { heuristicRisk += 2; hFactors.push("Browser or Operating System change"); }

      mlResult = {
        deviceRiskScore: Math.min(25, heuristicRisk),
        rawProbability: parseFloat((heuristicRisk / 25).toFixed(2)),
        riskCategory: heuristicRisk > 18 ? 'CRITICAL' : heuristicRisk > 12 ? 'ELEVATED' : heuristicRisk > 6 ? 'MODERATE' : 'LOW',
        budgetAllocations: {
          newDeviceRisk: matches.isNewDevice ? 8 : 0,
          ipReputationRisk: geo.isVPN ? 4 : 0,
          locationRisk: travelCheck.impossible ? 4 : 0,
          simSwapRisk: simSwap.isSimSwapRecent ? 5 : 0,
          emulatorRisk: emulatorInfo.isEmulator ? 2 : 0,
          browserOSChangeRisk: matches.isNewBrowser ? 2 : 0
        },
        riskFactors: hFactors,
        featureImportances: { is_new_device: 0.35, sim_swap_recent_72h: 0.25, vpn_detected: 0.20 }
      };
    }

    const deviceRiskScore = Math.min(25, mlResult.deviceRiskScore ?? mlResult.device_risk_score ?? 4);

    // Save Device Event
    const eventDoc = await dbBridge.addDeviceEvent({
      sessionId: sessionId || `sess_${cif}_${Date.now()}`,
      cif,
      accountNumber: accountNumber || profile.accountNumber,
      timestamp: new Date(),
      deviceHash,
      ipAddress: geo.ip,
      geo,
      accessVelocity: velocity,
      geoDistanceKmFromLast: travelCheck.distanceKm,
      impossibleTravelDetected: travelCheck.impossible,
      isEmulator: emulatorInfo.isEmulator,
      isSimSwapWithin72h: simSwap.isSimSwapRecent,
      behaviorRiskScore,
      correlationId
    });

    // Save Device Decision
    await dbBridge.addDeviceDecision({
      sessionId: eventDoc.sessionId,
      cif,
      accountNumber: profile.accountNumber,
      timestamp: new Date(),
      deviceRiskScore,
      rawProbability: mlResult.rawProbability || 0.1,
      riskCategory: mlResult.riskCategory || 'LOW',
      budgetAllocations: mlResult.budgetAllocations || {},
      riskFactors: mlResult.riskFactors || [],
      featureImportances: mlResult.featureImportances || {},
      decisionAction: simSwap.isSimSwapRecent ? 'BLOCK' : (deviceRiskScore > 18 ? 'HOLD' : (deviceRiskScore > 12 ? 'OTP' : 'ALLOW')),
      correlationId
    });

    // Register / Update Device Hardware Record
    await dbBridge.addOrUpdateDeviceRecord({
      cif,
      deviceHash,
      visitorId: rawSignals.visitorId || '',
      platform: rawSignals.platform || 'Win32',
      browser: rawSignals.browser || 'Chrome',
      os: rawSignals.os || 'Windows',
      screenResolution: rawSignals.screenResolution || '',
      timezone: rawSignals.timezone || 'Asia/Kolkata',
      canvasHash: rawSignals.canvasHash || '',
      webglVendor: rawSignals.webglVendor || '',
      webglRenderer: rawSignals.webglRenderer || '',
      hardwareConcurrency: rawSignals.hardwareConcurrency || 4,
      deviceMemoryGB: rawSignals.deviceMemory || 8,
      touchSupport: !!rawSignals.touchSupport,
      isEmulator: emulatorInfo.isEmulator,
      isHeadless: emulatorInfo.isHeadless,
      confidenceScore: matches.isNewDevice ? 60 : 100,
      lastSeen: new Date(),
      riskLevel: simSwap.isSimSwapRecent ? 'BLOCKED' : (deviceRiskScore > 12 ? 'SUSPICIOUS' : 'TRUSTED')
    });

    // Update Device Profile
    await dbBridge.updateDeviceProfile(cif, {
      knownBrowsers: [...new Set([...(profile.knownBrowsers || []), rawSignals.browser])].filter(Boolean),
      knownOS: [...new Set([...(profile.knownOS || []), rawSignals.os])].filter(Boolean),
      knownCities: [...new Set([...(profile.knownCities || []), geo.city])].filter(Boolean),
      knownISPs: [...new Set([...(profile.knownISPs || []), geo.isp])].filter(Boolean),
      knownASNs: [...new Set([...(profile.knownASNs || []), geo.asn])].filter(Boolean),
      totalLogins: (profile.totalLogins || 0) + 1,
      highRiskAttemptsCount: deviceRiskScore > 12 ? (profile.highRiskAttemptsCount || 0) + 1 : (profile.highRiskAttemptsCount || 0)
    });

    // Real-Time Socket.io Events
    const io = req.app.locals.io;
    if (io) {
      const socketPayload = {
        cif,
        accountNumber: profile.accountNumber,
        deviceHash,
        deviceRiskScore,
        maxRiskBudget: 25,
        riskCategory: mlResult.riskCategory,
        riskFactors: mlResult.riskFactors,
        geo,
        browser: rawSignals.browser,
        os: rawSignals.os,
        timestamp: new Date().toISOString()
      };

      io.emit('device:new', socketPayload);
      if (deviceRiskScore > 12) io.emit('device:risk', socketPayload);
      if (simSwap.isSimSwapRecent || deviceRiskScore > 18) io.emit('device:block', socketPayload);
      else if (deviceRiskScore > 12) io.emit('device:otp', socketPayload);
      else io.emit('device:trusted', socketPayload);
    }

    res.json({
      status: "Ingested",
      cif,
      deviceHash,
      deviceRiskScore,
      maxRiskBudget: 25,
      riskCategory: mlResult.riskCategory || 'LOW',
      isTrustedDevice: !matches.isNewDevice,
      factors: mlResult.riskFactors || [],
      correlationId
    });

  } catch (err) {
    console.error("[Device Gateway Error]:", err);
    res.status(500).json({ error: "Failed to evaluate device intelligence", message: err.message });
  }
};

/**
 * POST /api/device/score
 * Internal scoring handler
 */
export const scoreDeviceSignals = async (req, res) => {
  try {
    const mlResult = await mlPost('/score/device', req.body);
    res.json(mlResult);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/**
 * GET /api/device/profile/:accountNumber
 */
export const getDeviceProfileByAccount = async (req, res) => {
  try {
    const { accountNumber } = req.params;
    const profile = await dbBridge.getDeviceProfileByAccountOrCIF(accountNumber);
    if (!profile) return res.status(404).json({ error: "Device profile not found for specified account" });
    res.json(profile);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/**
 * GET /api/device/history/:accountNumber
 */
export const getDeviceHistoryByAccount = async (req, res) => {
  try {
    const { accountNumber } = req.params;
    const events = await dbBridge.getDeviceEventsByAccountOrCIF(accountNumber);
    res.json(events);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/**
 * GET /api/device/known-devices/:accountNumber
 */
export const getKnownDevicesByAccount = async (req, res) => {
  try {
    const { accountNumber } = req.params;
    const devices = await dbBridge.getDevicesByAccountOrCIF(accountNumber);
    res.json(devices);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/**
 * GET /api/device/events
 */
export const getGlobalDeviceEvents = async (req, res) => {
  try {
    const events = await dbBridge.getGlobalDeviceEvents();
    res.json(events);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
