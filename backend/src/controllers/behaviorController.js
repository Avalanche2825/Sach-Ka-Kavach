import crypto from 'crypto';
import http from 'http';
import fs from 'fs';
import path from 'path';
import * as dbBridge from '../utils/dbBridge.js';

const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://localhost:5001';
const ML_HOST = ML_SERVICE_URL.replace('http://', '').split(':')[0];
const ML_PORT = parseInt(ML_SERVICE_URL.split(':').pop()) || 5001;

// Load Configuration Service
export let config = {
  behavior: { bufferIntervalSeconds: 30 },
  training: { minPersonalSessions: 30, establishedProfileSessions: 100 },
  trust: { allowThreshold: 80, otpThreshold: 60, alertThreshold: 40, holdThreshold: 20 },
  features: { version: "v1.0" }
};

try {
  const pathsToTry = [
    path.resolve(process.cwd(), '../shared_config.json'),
    path.resolve(process.cwd(), 'shared_config.json'),
    path.resolve(process.cwd(), '../../shared_config.json'),
    path.resolve(path.dirname(new URL(import.meta.url).pathname), '../../../shared_config.json')
  ];

  let configFound = false;
  for (const p of pathsToTry) {
    const normalizedPath = p.replace(/^\/([A-Za-z]:)/, '$1');
    if (fs.existsSync(normalizedPath)) {
      config = JSON.parse(fs.readFileSync(normalizedPath, 'utf8'));
      console.log(`[Express Config] Loaded shared configuration from ${normalizedPath}:`, config);
      configFound = true;
      break;
    }
  }
  if (!configFound) {
    console.log("[Express Config] No shared_config.json found. Using defaults.");
  }
} catch (e) {
  console.warn("[Express Config] Error reading shared configuration file, using defaults:", e);
}

// Internal helper to post to ML service
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

// Local geo resolution simulation
function resolveIP(ip) {
  if (ip.includes('103.88.24.')) {
    return {
      city: "Mumbai",
      country: "India",
      asn: "AS9829 (BSNL)",
      isp: "Bharat Sanchar Nigam Ltd",
      confidence: 0.95
    };
  }
  return {
    city: "Jaipur",
    country: "India",
    asn: "AS4587 (Airtel)",
    isp: "Bharti Airtel",
    confidence: 0.92
  };
}

// Helper to update Welford's running statistics
function updateWelford(oldMean, oldM2, newVal, N) {
  if (N <= 1) {
    return { mean: newVal, m2: 0.0, stdDev: 1.0 };
  }
  const newMean = oldMean + (newVal - oldMean) / N;
  const newM2 = oldM2 + (newVal - oldMean) * (newVal - newMean);
  const variance = newM2 / N;
  const stdDev = Math.sqrt(variance) || 1.0;
  return { mean: newMean, m2: newM2, stdDev };
}

export const collectBehaviorSignals = async (req, res) => {
  try {
    const { cif, sessionId, deviceInfo, behaviorSignals } = req.body;

    const correlationId = req.headers['x-correlation-id'] || req.headers['x-correlation-id'.toLowerCase()] || crypto.randomUUID();
    console.log(`[Express Gateway][Correlation ID: ${correlationId}] Processing behavioral collect request for CIF: ${cif}`);

    res.setHeader('X-Correlation-ID', correlationId);

    // ── Data Validation Layer ────────────────────────────────────────────────
    if (!cif || !sessionId || !deviceInfo || !behaviorSignals) {
      return res.status(400).json({ error: "Missing mandatory behavior signals payload parameters" });
    }

    const { visitorId, userAgent, platform, language, screenResolution, timezone } = deviceInfo;
    const { typingVariance, typingSpeedAvg, navigationDepth, actionsPerMinute, idlePeriods, copyPasteDetected } = behaviorSignals;

    if (!visitorId || typingVariance === undefined || typingSpeedAvg === undefined) {
      return res.status(400).json({ error: "Missing required DeviceInfo or typing cadence fields" });
    }

    if (typingVariance < 0 || typingSpeedAvg < 0 || actionsPerMinute < 0) {
      return res.status(400).json({ error: "Behavioral metric values cannot be negative" });
    }

    const customer = await dbBridge.getCustomer(cif);
    if (!customer) {
      return res.status(404).json({ error: "Customer not found" });
    }

    // ── Signal Enrichment Layer ──────────────────────────────────────────────
    const clientIP = req.ip || req.headers['x-forwarded-for'] || '127.0.0.1';
    const geo = resolveIP(clientIP);

    const deviceString = `${visitorId}${userAgent || ''}${platform || ''}${language || ''}${screenResolution || ''}${timezone || ''}`;
    const deviceHash = crypto.createHash('sha256').update(deviceString).digest('hex');

    // Retrieve behavior profile
    let profile = await dbBridge.getBehaviorProfile(cif);
    if (!profile) {
      profile = {
        averageLoginHour: 14.0,
        loginHourStdDev: 1.0,
        preferredLoginWindows: [{ start: 12.0, end: 16.0, weight: 1.0 }],
        averageTypingSpeed: 280.0,
        averageTypingVariance: 40.0,
        averageNavigationDepth: 4.0,
        averageActionsPerMinute: 10.0,
        averageTransactionAmount: 5000.0,
        trustedDevices: [],
        trustedLocations: [],
        recentNetworks: [],
        sessionCount: 0,
        profileConfidence: 0.0
      };
    }

    // ── Feature Engineering Layer ─────────────────────────────────────────────
    const timestamp = new Date();
    const loginHour = timestamp.getHours();

    const loginTimeDeviation = Math.abs(loginHour - profile.averageLoginHour);
    const typingDeviation = Math.abs(typingSpeedAvg - profile.averageTypingSpeed);
    const navigationDeviation = Math.abs(navigationDepth - profile.averageNavigationDepth);
    const actionsPerMinuteDeviation = Math.abs(actionsPerMinute - profile.averageActionsPerMinute);

    // Multiple login window check
    let loginWithinPreferredWindow = false;
    if (profile.preferredLoginWindows && profile.preferredLoginWindows.length > 0) {
      for (const window of profile.preferredLoginWindows) {
        const { start, end } = window;
        if (start <= end) {
          if (loginHour >= start && loginHour <= end) {
            loginWithinPreferredWindow = true;
            break;
          }
        } else {
          if (loginHour >= start || loginHour <= end) {
            loginWithinPreferredWindow = true;
            break;
          }
        }
      }
    } else {
      loginWithinPreferredWindow = (loginHour >= 12 && loginHour <= 16);
    }

    // Login hour Zscore
    const loginHourZscore = profile.loginHourStdDev > 0 
      ? (loginHour - profile.averageLoginHour) / profile.loginHourStdDev 
      : 0.0;

    const isNewDevice = !profile.trustedDevices.includes(deviceHash);
    const isNewIP = !profile.recentNetworks.includes(clientIP);
    const isNewLocation = !profile.trustedLocations.includes(geo.city);

    // Keep amount ratio to 1.0 for standard logins
    const amountRatio = 1.0;

    const mlFeatures = {
      login_hour: loginHour,
      login_time_deviation: parseFloat(loginTimeDeviation.toFixed(2)),
      amount_ratio: amountRatio,
      is_new_device: isNewDevice,
      is_new_ip: isNewIP,
      is_new_location: isNewLocation,
      typing_variance: parseFloat(typingVariance.toFixed(2)),
      typing_deviation: parseFloat(typingDeviation.toFixed(2)),
      navigation_depth: navigationDepth,
      navigation_deviation: parseFloat(navigationDeviation.toFixed(2)),
      actions_per_minute: parseFloat(actionsPerMinute.toFixed(2)),
      idle_periods: idlePeriods,
      copy_paste_detected: !!copyPasteDetected,
      
      // Extended Enterprise attributes
      login_within_preferred_window: loginWithinPreferredWindow,
      login_hour_zscore: parseFloat(loginHourZscore.toFixed(2)),
      actions_per_minute_deviation: parseFloat(actionsPerMinuteDeviation.toFixed(2))
    };

    // ── Call Python ML Service ───────────────────────────────────────────────
    let mlResult;
    try {
      mlResult = await mlPost('/score/behavioral', { 
        cif, 
        features: mlFeatures,
        profile_confidence: profile.profileConfidence
      }, correlationId);
    } catch (err) {
      console.warn(`[Express][Correlation ID: ${correlationId}] ML scoring failed: ${err.message}. Using baseline rules.`);
      let fallbackRisk = 0;
      const factors = ["FALLBACK: ML Engine Offline - using local heuristic rules"];
      if (isNewDevice) { fallbackRisk += 15; factors.push("New device signature detected"); }
      if (isNewIP) { fallbackRisk += 8; factors.push("New network IP access route"); }
      if (typingDeviation > 60) { fallbackRisk += 10; factors.push("Typing cadence speed deviation"); }
      if (!loginWithinPreferredWindow) { fallbackRisk += 5; factors.push("Access outside preferred login windows"); }
      
      // Norm risk capped strictly to 40
      mlResult = {
        risk_score: Math.min(40, fallbackRisk),
        factors,
        model_used: "fallback_rules",
        cold_start: profile.sessionCount < (config.training?.minPersonalSessions || 30)
      };
    }

    // ── Trust & Decision Engine ──────────────────────────────────────────────
    // Load config parameters
    const coldStartSessions = config.behavior?.coldStartSessions || 30;
    const coldStartBehaviorRiskCap = config.behavior?.coldStartBehaviorRiskCap || 12;
    const maxBehaviorRisk = config.behavior?.maxBehaviorRisk || 40;

    // Detect critical bypass signals
    const isHeadless = userAgent.toLowerCase().includes("headless") || platform === "unknown";
    const isBot = typingSpeedAvg > 1000 || actionsPerMinute > 300;
    const isImpossibleTiming = typingVariance < 1.0;
    const isExtremeAnomaly = mlResult.risk_score > 30;
    const criticalSignalTriggered = isHeadless || isBot || isImpossibleTiming || isExtremeAnomaly;

    let unifiedRisk = mlResult.risk_score;
    if (profile.sessionCount < coldStartSessions) {
      if (!criticalSignalTriggered) {
        unifiedRisk = Math.min(coldStartBehaviorRiskCap, unifiedRisk);
        console.log(`[Express Gateway] Cold start cap enforced. Risk capped at ${unifiedRisk} for CIF: ${cif}`);
      } else {
        console.log(`[Express Gateway] Cold start cap bypassed due to critical signals for CIF: ${cif}`);
        if (isHeadless) mlResult.factors.push("Bypass Cap: Headless browser signature detected");
        if (isBot) mlResult.factors.push("Bypass Cap: Automation bot-like speed detected");
        if (isImpossibleTiming) mlResult.factors.push("Bypass Cap: Impossible mechanical interaction timing");
        if (isExtremeAnomaly) mlResult.factors.push("Bypass Cap: Extreme behavioral anomaly deviation score");
      }
    }

    const riskScore = unifiedRisk;
    // Scale risk score (max 40) into 100-point trust budget: low risk 15 maps to 81 trust (ALLOW)
    const trustScore = Math.max(0, 100 - Math.round(riskScore * 1.25));

    const allowThreshold = config.trust?.allowThreshold || 80;
    const otpThreshold = config.trust?.otpThreshold || 60;
    const alertThreshold = config.trust?.alertThreshold || 40;
    const holdThreshold = config.trust?.holdThreshold || 20;

    let decision = "ALLOW";
    if (trustScore < holdThreshold) decision = "BLOCK";
    else if (trustScore < alertThreshold) decision = "HOLD";
    else if (trustScore < otpThreshold) decision = "ALERT";
    else if (trustScore < allowThreshold) decision = "OTP_REQUIRED";

    // ── Audit Event Bus ──────────────────────────────────────────────────────
    const event = {
      eventType: "TRUST_SCORE_UPDATED",
      cif,
      sessionId,
      riskScore,
      trustScore,
      decision,
      factors: mlResult.factors || [],
      correlationId,
      timestamp: new Date().toISOString()
    };

    const prevTrustScore = customer.trustScore;

    // Update customer score
    await dbBridge.updateCustomer(cif, { trustScore });

    // If trust score changed, log to Audit Trail
    if (prevTrustScore !== undefined && prevTrustScore !== trustScore) {
      await dbBridge.addAuditLog({
        timestamp: new Date().toISOString(),
        user: 'Behavioral Trust Engine',
        event: `Trust Score updated for ${customer.name || cif}: ${prevTrustScore} → ${trustScore}`,
        riskScore,
        trustScore,
        riskFactors: mlResult.factors || [],
        decision,
      });
    }

    // Persist trust score
    await dbBridge.addTrustScore(event);

    // Save Device log if new
    if (isNewDevice) {
      await dbBridge.addDevice({
        cif,
        deviceHash,
        confidenceScore: 100,
        lastSeen: timestamp,
        riskLevel: 'TRUSTED'
      });
    }

    // Update Location log
    if (profile.recentNetworks.length > 0) {
      const locationRecord = await dbBridge.getLocation(cif);
      if (locationRecord) {
        const updatedIPs = [...new Set([...locationRecord.recentIPHistory, clientIP])].slice(-5);
        await dbBridge.updateLocation(cif, {
          recentIPHistory: updatedIPs,
          knownCity: geo.city,
          knownCountry: geo.country,
          knownASN: geo.asn,
          knownISP: geo.isp,
          geoConfidence: geo.confidence,
          lastAccessed: timestamp
        });
      }
    } else {
      await dbBridge.addLocation({
        cif,
        recentIPHistory: [clientIP],
        knownCity: geo.city,
        knownCountry: geo.country,
        knownASN: geo.asn,
        knownISP: geo.isp,
        geoConfidence: geo.confidence,
        lastAccessed: timestamp
      });
    }

    // Write to Audit logs
    await dbBridge.addAuditLog({
      timestamp: timestamp.toISOString(),
      user: "SACH Kavach AI Engine",
      event: `Behavioral Trust evaluation completed for ${cif} [Correlation ID: ${correlationId}]`,
      riskScore: unifiedRisk,
      riskFactors: mlResult.factors || [],
      decision: decision === 'BLOCK' ? 'REJECTED_AND_BLOCKED' : (decision === 'ALLOW' ? 'APPROVED_POST_VERIFICATION' : 'LOGGED')
    });

    const io = req.app.locals.io;
    if (io) {
      io.emit('trust_update', event);
      io.emit('soc:sessions', event);
      if (decision === 'BLOCK' || decision === 'HOLD' || riskScore > 24) {
        io.emit('risk_alert', event);
        io.emit('soc:alerts', event);
        io.emit('soc:notifications', {
          timestamp: new Date().toISOString(),
          message: `CRITICAL: High risk session detected for customer ${cif} (Risk: ${riskScore}/40)`
        });
      } else {
        io.emit('soc:notifications', {
          timestamp: new Date().toISOString(),
          message: `Active session telemetry synchronized for customer ${cif}`
        });
      }
    }

    // Send immediate response to client
    res.json({
      status: "Ingested",
      sessionId,
      riskScore,
      trustScore,
      decision
    });

    // ── Asynchronous Background Profile Update (NON-BLOCKING) ────────────────
    setImmediate(async () => {
      try {
        // Save session log in history
        await dbBridge.addCustomerSession({
          sessionId,
          cif,
          loginTimestamp: timestamp,
          typingVariance,
          typingSpeedAvg,
          navigationDepth,
          actionsPerMinute,
          idlePeriods,
          copyPasteDetected,
          correlationId
        });

        // Trigger behavior profile incremental calculations & retrain checks
        await updateProfileIncrementally(cif, {
          loginHour,
          typingSpeedAvg,
          typingVariance,
          navigationDepth,
          actionsPerMinute,
          deviceHash,
          clientIP,
          city: geo.city,
          asn: geo.asn,
          isp: geo.isp
        }, req.app.locals.io);
      } catch (asyncErr) {
        console.error(`[Express Async Error] Session write/profile update failed:`, asyncErr.message);
      }
    });

  } catch (err) {
    console.error("[Express] Behavior Signals Collection Error:", err);
    res.status(500).json({ error: "Failed to process behavioral evaluation", message: err.message });
  }
};

// Incremental Update Algorithm & Multi-window Clustering
export const updateProfileIncrementally = async (cif, sessionMetrics, io) => {
  try {
    const existing = await dbBridge.getBehaviorProfile(cif);
    const { loginHour, typingSpeedAvg, typingVariance, navigationDepth, actionsPerMinute, deviceHash, clientIP, city, asn, isp } = sessionMetrics;

    let updatedProfile;

    if (!existing) {
      // 1. Initial Profile Seeding
      updatedProfile = {
        cif,
        sessionCount: 1,
        profileConfidence: 0.01,
        profileState: "LEARNING",
        modelUsed: "Global",
        averageLoginHour: loginHour,
        loginHourStdDev: 1.0,
        loginHourM2: 0.0,
        
        // Setup initial 4-hour hour bin
        preferredLoginWindows: [{
          start: Math.floor(loginHour / 4) * 4,
          end: (Math.floor(loginHour / 4) * 4 + 4) % 24,
          weight: 1.0
        }],
        
        averageTypingSpeed: typingSpeedAvg,
        typingSpeedM2: 0.0,
        
        averageTypingVariance: typingVariance,
        typingVarianceM2: 0.0,
        
        averageNavigationDepth: navigationDepth,
        navigationDepthM2: 0.0,
        
        averageActionsPerMinute: actionsPerMinute,
        actionsPerMinuteM2: 0.0,
        
        averageTransactionAmount: 5000.0,
        averageSessionDuration: 60,
        trustedDevices: [deviceHash],
        trustedLocations: [city],
        recentNetworks: [clientIP],
        featureVersion: "v1.0",
        profileVersion: "v1.0",
        lastProfileUpdate: new Date()
      };
      
      await dbBridge.addBehaviorProfile(updatedProfile);
      console.log(`[Express Profile Service] Created initial behavior profile for CIF: ${cif}`);
      return;
    }

    // 2. Incremental Statistics Updates via Welford's Algorithm
    const newCount = existing.sessionCount + 1;
    const newConfidence = Math.min(1.0, newCount / 100);

    const hourStats = updateWelford(existing.averageLoginHour, existing.loginHourM2, loginHour, newCount);
    const speedStats = updateWelford(existing.averageTypingSpeed, existing.typingSpeedM2, typingSpeedAvg, newCount);
    const varStats = updateWelford(existing.averageTypingVariance, existing.typingVarianceM2, typingVariance, newCount);
    const depthStats = updateWelford(existing.averageNavigationDepth, existing.navigationDepthM2, navigationDepth, newCount);
    const actionStats = updateWelford(existing.averageActionsPerMinute, existing.actionsPerMinuteM2, actionsPerMinute, newCount);

    // Unique Trusted device, IP, and Geolocation checks
    const trustedDevices = [...new Set([...existing.trustedDevices, deviceHash])];
    const recentNetworks = [...new Set([...existing.recentNetworks, clientIP])].slice(-5);
    const trustedLocations = [...new Set([...existing.trustedLocations, city])];

    // Rebuild preferred login windows using hourly bins from recent sessions
    const sessions = await dbBridge.getCustomerSessions(cif);
    const bins = Array(6).fill(0); // 6 bins of 4 hours
    sessions.forEach(s => {
      const h = new Date(s.loginTimestamp).getHours();
      const binIdx = Math.floor(h / 4);
      bins[binIdx]++;
    });
    
    const preferredLoginWindows = [];
    bins.forEach((freq, idx) => {
      const weight = freq / sessions.length;
      if (weight >= 0.1) {
        preferredLoginWindows.push({
          start: idx * 4,
          end: (idx * 4 + 4) % 24,
          weight: parseFloat(weight.toFixed(2))
        });
      }
    });

    let profileState = "LEARNING";
    let modelUsed = "Global";
    if (newCount >= 100) {
      profileState = "MATURE";
      modelUsed = "Personal";
    } else if (newCount >= 30) {
      profileState = "ADAPTING";
      modelUsed = "Ensemble";
    }

    let nextScheduledTraining = null;
    if (newCount >= 100 && existing.lastModelTraining) {
      nextScheduledTraining = new Date(existing.lastModelTraining);
      nextScheduledTraining.setDate(nextScheduledTraining.getDate() + 30);
    }

    updatedProfile = {
      sessionCount: newCount,
      profileConfidence: parseFloat(newConfidence.toFixed(2)),
      profileState,
      modelUsed,
      averageLoginHour: parseFloat(hourStats.mean.toFixed(2)),
      loginHourStdDev: parseFloat(hourStats.stdDev.toFixed(2)),
      loginHourM2: parseFloat(hourStats.m2.toFixed(2)),
      preferredLoginWindows,
      averageTypingSpeed: parseFloat(speedStats.mean.toFixed(2)),
      typingSpeedM2: parseFloat(speedStats.m2.toFixed(2)),
      averageTypingVariance: parseFloat(varStats.mean.toFixed(2)),
      typingVarianceM2: parseFloat(varStats.m2.toFixed(2)),
      averageNavigationDepth: parseFloat(depthStats.mean.toFixed(2)),
      navigationDepthM2: parseFloat(depthStats.m2.toFixed(2)),
      averageActionsPerMinute: parseFloat(actionStats.mean.toFixed(2)),
      actionsPerMinuteM2: parseFloat(actionStats.m2.toFixed(2)),
      trustedDevices,
      trustedLocations,
      recentNetworks,
      lastProfileUpdate: new Date(),
      nextScheduledTraining
    };

    await dbBridge.updateBehaviorProfile(cif, updatedProfile);
    console.log(`[Express Profile Service] Profile updated incrementally for ${cif}. Sessions tracked: ${newCount}. Confidence: ${newConfidence}`);

    // 3. Sliding Window Retraining (latest 200 sessions only)
    const MIN_PERSONAL = config.training?.minPersonalSessions || 30;
    let isRetrainNeeded = false;
    
    if (newCount === MIN_PERSONAL) {
      isRetrainNeeded = true;
    } else if (newCount > MIN_PERSONAL && newCount <= 100) {
      isRetrainNeeded = (newCount - MIN_PERSONAL) % 20 === 0;
    } else if (newCount > 100) {
      const timeDiff = existing.lastModelTraining 
        ? (new Date().getTime() - new Date(existing.lastModelTraining).getTime()) / (1000 * 3600 * 24)
        : 999;
      isRetrainNeeded = ((newCount - 100) % 50 === 0) || (timeDiff >= 30);
    }

    if (isRetrainNeeded) {
      console.log(`[Express Profile Service] Retrain threshold hit for ${cif}. Querying latest 200 sessions...`);
      
      // Pull only the sliding window of latest 200 sessions
      const trainingSessions = sessions.slice(0, 200);

      const trainPayload = trainingSessions.map(s => {
        const sHour = new Date(s.loginTimestamp).getHours();
        return {
          login_hour: sHour,
          login_time_deviation: Math.abs(sHour - hourStats.mean),
          amount_ratio: 1.0,
          is_new_device: false,
          is_new_ip: false,
          is_new_location: false,
          typing_variance: s.typingVariance,
          typing_deviation: Math.abs(s.typingSpeedAvg - speedStats.mean),
          navigation_depth: s.navigationDepth,
          navigation_deviation: Math.abs(s.navigationDepth - depthStats.mean),
          actions_per_minute: s.actionsPerMinute,
          idle_periods: s.idlePeriods,
          copy_paste_detected: s.copyPasteDetected
        };
      });

      mlPost('/train/behavioral', { cif, historical_features: trainPayload })
        .then(res => {
          console.log(`[Express] Personal model retrained successfully for ${cif}:`, res);
          dbBridge.updateBehaviorProfile(cif, { lastModelTraining: new Date() }).catch(() => {});
          
          dbBridge.getBehaviorModel(cif).then(modelExists => {
            const meta = {
              cif,
              modelVersion: "1.0.0",
              featureVersion: "v1.0",
              trainedAt: new Date(),
              lastRetrained: new Date(),
              trainingSessionCount: newCount,
              modelType: "IsolationForest",
              status: "ACTIVE",
              coldStart: false
            };
            if (modelExists) {
              dbBridge.updateBehaviorModel(cif, meta);
            } else {
              dbBridge.addBehaviorModel(meta);
            }

            if (io) {
              io.emit('soc:model-health', meta);
              io.emit('soc:notifications', {
                timestamp: new Date().toISOString(),
                message: `Personal model retrained successfully for customer ${cif}`
              });
            }
          });
        })
        .catch(err => console.error(`[Express] Personal model training failed for ${cif}:`, err.message));
    }

  } catch (err) {
    console.error(`[Express Profile Service] Error updating profile incrementally for ${cif}:`, err);
  }
};
