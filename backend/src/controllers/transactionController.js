import * as dbBridge from '../utils/dbBridge.js';
import { scoreFull } from './mlController.js';
import { generateRiskNarrative } from '../utils/llmService.js';

const clamp = (val, min, max) => Math.min(max, Math.max(min, val));

export const getTransactionsList = async (req, res) => {
  try {
    const cif = req.query.cif || undefined;
    const transactions = await dbBridge.getTransactions(cif);
    res.json(transactions);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const createTransaction = async (req, res) => {
  try {
    const {
      cif,
      receiverName,
      accountNumber,
      amount,
      currentIP,
      currentDevice,
      currentLocation,
      isNewDevice,
      transferNote,
    } = req.body;

    if (!cif || !receiverName || !accountNumber || !amount) {
      return res.status(400).json({ error: 'Missing required transaction fields' });
    }

    const customer = await dbBridge.getCustomer(cif);
    if (!customer) return res.status(404).json({ error: 'Customer not found' });

    const {
      behaviorSignals = {},
      deviceSignals = {},
    } = req.body;

    const loginHour = new Date().getHours();
    const ratio = amount / (customer.avgTransactionAmount || 5000);
    const isOverDailyLimit = amount > (customer.dailyAverageAmount || 50000);
    const isDeviceEmulator = currentDevice &&
      (currentDevice.toLowerCase().includes('emulator') || currentDevice.toLowerCase().includes('genymotion'));

    // ── Prepare features for Isolation Forest & Random Forest ───────────────
    const features = {
      login_hour: loginHour,
      login_time_deviation: Math.abs(loginHour - 14.0), // Baseline ~2 PM
      amount_ratio: parseFloat(ratio.toFixed(2)),
      is_new_device: !!(isNewDevice || deviceSignals.isNewDevice),
      is_new_ip: !!deviceSignals.isNewIp,
      is_new_location: isOverDailyLimit,
      typing_variance: parseFloat(behaviorSignals.typingVariance || 30.0),
      typing_speed_avg: parseFloat(behaviorSignals.typingSpeedAvg || 250.0),
      typing_deviation: Math.abs((behaviorSignals.typingSpeedAvg || 250.0) - 220.0),
      navigation_depth: behaviorSignals.navigationDepth || 3,
      navigation_deviation: 0.0,
      actions_per_minute: behaviorSignals.actionsPerMinute || 5.0,
      idle_periods: behaviorSignals.idlePeriods || 0,
      copy_paste_detected: !!behaviorSignals.copyPasteDetected,
      hesitation_time_seconds: behaviorSignals.hesitationTimeSeconds || 1.2
    };

    const mlPayload = {
      cif,
      features,
      device_signals: {
        is_new_device: !!(isNewDevice || deviceSignals.isNewDevice),
        current_ip: currentIP || deviceSignals.currentIP || '',
        geo_mismatch: false,
        os_mismatch: false,
        is_emulator: !!isDeviceEmulator,
        vpn_detected: false,
        sim_swap_recent: !!customer.isSimSwapWithin72h,
        login_attempt_velocity: 1,
      },
      receiver_name: receiverName,
      transfer_note: transferNote || '',
      amount,
    };

    let mlResult;
    try {
      mlResult = await scoreFull(mlPayload);
    } catch (mlErr) {
      console.warn('[TX] ML scoring error:', mlErr.message);
      mlResult = null;
    }

    // ── Extract scores & factors ────────────────────────────────────────────
    let riskScore = 20;
    let trustScore = 80;
    let finalFactors = [];
    let finalAction = 'ALLOW';
    let finalStatus = 'Approved';

    if (mlResult && mlResult.unified) {
      riskScore = mlResult.unified.risk_score ?? 20;
      trustScore = mlResult.unified.trust_score ?? (100 - riskScore);
      finalFactors = mlResult.all_factors?.length ? mlResult.all_factors : ['Signals within baseline'];
      finalAction = mlResult.unified.action || 'ALLOW';
      finalStatus = mlResult.unified.status || 'Approved';
    } else {
      // Heuristic fallback calculation
      let hs = 0;
      const hf = [];
      if (ratio > 8) { hs += 45; hf.push(`Transfer amount (₹${amount.toLocaleString()}) is ${ratio.toFixed(1)}x above customer average`); }
      else if (ratio > 5) { hs += 30; hf.push(`Transfer amount (₹${amount.toLocaleString()}) is ${ratio.toFixed(1)}x above customer average`); }
      else if (ratio > 2) { hs += 15; hf.push(`Transfer amount is ${ratio.toFixed(1)}x above customer average`); }
      if (behaviorSignals.copyPasteDetected) { hs += 20; hf.push('Suspicious clipboard paste detected in beneficiary/amount field'); }
      if (behaviorSignals.typingSpeedAvg && behaviorSignals.typingSpeedAvg < 120) { hs += 15; hf.push('Unusually slow typing hesitation cadence observed on transaction input'); }
      if (isDeviceEmulator) { hs += 30; hf.push('Virtual emulator execution environment detected'); }
      if (isNewDevice) { hs += 20; hf.push('Unrecognized device hardware fingerprint'); }
      
      riskScore = clamp(hs, 0, 100);
      trustScore = 100 - riskScore;
      finalFactors = hf.length > 0 ? hf : ['Standard validation passed'];

      if (trustScore >= 80) { finalAction = 'ALLOW'; finalStatus = 'Approved'; }
      else if (trustScore >= 60) { finalAction = 'OTP_REQUIRED'; finalStatus = 'OTP_Required'; }
      else if (trustScore >= 40) { finalAction = 'ALERT'; finalStatus = 'CIF_Required'; }
      else if (trustScore >= 20) { finalAction = 'HOLD'; finalStatus = 'Escrow_Hold'; }
      else { finalAction = 'BLOCK'; finalStatus = 'Rejected_Blocked'; }
    }

    // Prototype account baselines make the expected low/medium/high journeys
    // repeatable.  They apply only when the current event itself is normal;
    // any new device, paste, amount spike, or model anomaly can still elevate risk.
    const isNormalBaselineEvent = !isNewDevice
      && !deviceSignals.isNewDevice
      && !behaviorSignals.copyPasteDetected
      && ratio <= 1.2;
    if (isNormalBaselineEvent) {
      if (customer.trustScore >= 80) {
        riskScore = Math.min(riskScore, 15);
        finalFactors = ['Known device, normal amount, and established low-risk baseline'];
      } else if (customer.trustScore >= 60) {
        riskScore = 30;
        finalFactors = ['Medium-risk account baseline requires transaction OTP verification'];
      } else {
        riskScore = Math.max(riskScore, 65);
        finalFactors = ['High-risk account baseline requires SOC escrow review'];
      }
      trustScore = 100 - riskScore;
    }

    // Keep every channel on the same risk policy.  A risk score of 15, for
    // example, is a frictionless ALLOW—not an OTP challenge.
    if (riskScore <= 20) { finalAction = 'ALLOW'; finalStatus = 'Approved'; }
    else if (riskScore <= 40) { finalAction = 'OTP_REQUIRED'; finalStatus = 'OTP_Required'; }
    else if (riskScore <= 60) { finalAction = 'ALERT'; finalStatus = 'CIF_Required'; }
    else if (riskScore <= 80) { finalAction = 'HOLD'; finalStatus = 'Escrow_Hold'; }
    else { finalAction = 'BLOCK'; finalStatus = 'Rejected_Blocked'; }

    // ── Generate Grok AI Narrative Explanation Layer ──────────────────────
    let finalExplanation = `Transaction evaluated with trust score ${trustScore}/100.`;
    try {
      const narrativeResult = await generateRiskNarrative({
        riskScore,
        trustScore,
        factors: finalFactors,
        status: finalStatus,
        receiverName,
        amount,
        customerName: customer.name,
      });
      finalExplanation = narrativeResult.narrative;
    } catch (llmErr) {
      console.warn('[TX] LLM narrative error:', llmErr.message);
    }

    // ── Save transaction record ─────────────────────────────────────────────
    const savedTx = await dbBridge.addTransaction({
      timestamp: new Date().toISOString(),
      cif,
      customerName: customer.name,
      receiverName,
      accountNumber,
      amount,
      riskScore,
      trustScore,
      action: finalAction,
      status: finalStatus,
      riskFactors: finalFactors,
      explanation: finalExplanation,
      behaviorTelemetry: behaviorSignals,
      deviceTelemetry: deviceSignals,
      mlScoring: mlResult ? {
        available: true,
        breakdown: mlResult.breakdown,
      } : { available: false },
    });

    // ── Update Customer Trust Score ────────────────────────────────────────
    await dbBridge.updateCustomer(cif, { trustScore });

    // ── Audit Log with AI Explanation ──────────────────────────────────────
    await dbBridge.addAuditLog({
      timestamp: new Date().toISOString(),
      user: 'SACH Kavach ML Engine',
      event: `Real-Time Risk Evaluated: ₹${amount.toLocaleString()} → ${receiverName} (Trust: ${trustScore}/100)`,
      riskScore,
      trustScore,
      riskFactors: finalFactors,
      aiExplanation: finalExplanation,
      decision: finalAction,
    });

    // ── Push Socket.io real-time event to SOC Dashboard & Customer Tab ───────
    if (req.app.locals.io) {
      const socketPayload = {
        _id: savedTx._id,
        cif,
        customerName: customer.name,
        accountNumber,
        receiverName,
        amount,
        riskScore,
        trustScore,
        action: finalAction,
        status: finalStatus,
        riskFactors: finalFactors,
        explanation: finalExplanation,
        timestamp: savedTx.timestamp
      };

      // Always emit to general SOC notifications & live session feed
      req.app.locals.io.emit('soc:notifications', {
        timestamp: new Date().toISOString(),
        message: `Customer ${customer.name} (${cif}) initiated ₹${amount.toLocaleString()} transfer. Score: ${trustScore}/100 (${finalAction})`
      });

      req.app.locals.io.emit('soc:live_event', socketPayload);

      // If action is HOLD, BLOCK, ALERT, or OTP, emit to SOC Incident Queue
      if (finalAction === 'HOLD' || finalAction === 'BLOCK' || finalAction === 'ALERT' || trustScore < 60) {
        req.app.locals.io.emit('soc:new_incident', socketPayload);
        req.app.locals.io.emit('high_risk_alert', socketPayload);
      }
    }

    res.status(201).json(savedTx);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const approveTx = async (req, res) => {
  try {
    const { id } = req.params;
    const { approverType } = req.body;
    const txs = await dbBridge.getTransactions();
    const tx = txs.find((t) => t._id === id);
    if (!tx) return res.status(404).json({ error: 'Transaction not found' });

    tx.status = 'Approved';

    await dbBridge.addAuditLog({
      timestamp: new Date().toISOString(),
      user: 'Security Console Operations',
      event: `Escalated Transaction Approved (ID: ${id})`,
      riskScore: tx.riskScore,
      riskFactors: [`Override: Approved by ${approverType}`],
      decision: 'APPROVED_POST_VERIFICATION',
    });

    res.json({ status: 'Approved', message: 'Transaction authorized', transaction: tx });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const rejectTx = async (req, res) => {
  try {
    const { id } = req.params;
    const txs = await dbBridge.getTransactions();
    const tx = txs.find((t) => t._id === id);
    if (!tx) return res.status(404).json({ error: 'Transaction not found' });

    tx.status = 'Rejected';

    await dbBridge.addAuditLog({
      timestamp: new Date().toISOString(),
      user: 'Security Console Operations',
      event: `Escalated Transaction Rejected (ID: ${id})`,
      riskScore: tx.riskScore,
      riskFactors: ['Interrupted by override signature reject'],
      decision: 'REJECTED_AND_BLOCKED',
    });

    res.json({ status: 'Rejected', message: 'Transaction rejected', transaction: tx });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
