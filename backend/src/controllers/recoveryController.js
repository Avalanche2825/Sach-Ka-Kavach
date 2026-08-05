import crypto from 'crypto';
import * as dbBridge from '../utils/dbBridge.js';
import RecoveryProfileModel from '../models/RecoveryProfile.js';
import RecoveryEventModel from '../models/RecoveryEvent.js';
import RecoveryDecisionModel from '../models/RecoveryDecision.js';

/**
 * POST /api/recovery/evaluate
 * Module 4 Secure Recovery Shield — Policy Consumer Architecture
 * Consumes Module 1 (Behavioral), Module 2 (Device), and Module 3 (Identity) signals.
 * Asks: "Considering everything we know across all modules, what recovery method is safest?"
 */
export const evaluateRecoveryRequest = async (req, res) => {
  try {
    const {
      cif,
      customerName,
      accountNumber,
      recoveryType, // 'FORGOT_PASSWORD', 'FORGOT_MPIN', 'FORGOT_PIN', 'CHANGE_MOBILE', 'CHANGE_EMAIL'
      deviceHash,
      ipAddress,
      isNewDevice = false,
      isVPN = false,
      isGeoMismatch = false,
      isSimSwapRecent = false,
      behavioralRiskScore = 10, // From Module 1 (0-40)
      deviceRiskScore = 4,       // From Module 2 (0-25)
      identityRiskScore = 0,     // From Module 3 (0-15)
      employeeOverride = false,
      employeeId = ''
    } = req.body;

    const correlationId = req.headers['x-correlation-id'] || crypto.randomUUID();

    if (!cif || !recoveryType) {
      return res.status(400).json({ error: "Missing required parameters: cif and recoveryType are mandatory." });
    }

    let profile = await RecoveryProfileModel.findOne({ cif });
    if (!profile) {
      profile = await RecoveryProfileModel.create({
        cif,
        customerName: customerName || `Customer ${cif}`,
        accountNumber: accountNumber || `89341029384`,
        totalRecoveryAttempts: 0,
        failedAttemptsCount: 0,
        guardianAvailable: true,
        guardianName: 'Guardian Multi-Sig'
      });
    }

    let recoveryRiskScore = 0;
    const reasons = [];
    const evidence = [];
    let action = 'ALLOW';
    let customerFacingMessage = 'Recovery request accepted';

    // ── CUMULATIVE CONTEXT ANALYSIS ACROSS MODULES 1, 2, 3 ────────────────────
    const cumulativePriorRisk = (behavioralRiskScore * 2.5) + (deviceRiskScore * 4) + (identityRiskScore * 6.6);
    const isHighPriorRisk = cumulativePriorRisk >= 50;

    // ── POLICY RULE 1: CRITICAL SIM SWAP RULE (<72 HOURS) ──────────────────────
    if (isSimSwapRecent) {
      recoveryRiskScore = 95;
      action = 'BRANCH_VERIFICATION_REQUIRED';
      customerFacingMessage = 'Online Recovery Disabled — Visit Nearest Branch';
      reasons.push("CRITICAL: Carrier SIM swap registered within 72 hours. Online self-service recovery disabled for account protection (RBI Fraud Guidelines). Physical branch verification required.");
      evidence.push({ key: "Carrier SIM Swap", value: "Flagged (<72h)", status: "CRITICAL" });
    }
    // ── POLICY RULE 2: HIGH PRIOR RISK (MODULES 1+2+3) + MOBILE/EMAIL CHANGE ────
    else if ((recoveryType === 'CHANGE_MOBILE' || recoveryType === 'CHANGE_EMAIL') && (deviceRiskScore > 12 || isHighPriorRisk)) {
      recoveryRiskScore = 90;
      action = 'BLOCK';
      customerFacingMessage = 'Recovery Request Blocked';
      reasons.push(`CRITICAL: ${recoveryType} request blocked due to elevated multi-module risk index (${Math.round(cumulativePriorRisk)}/100 pts prior risk).`);
      evidence.push({ key: "Multi-Module Prior Risk", value: `${Math.round(cumulativePriorRisk)} Points`, status: "CRITICAL" });
    }
    // ── POLICY RULE 3: NEW DEVICE + COMMERCIAL VPN (MODULE 2) ───────────────────
    else if (isNewDevice && isVPN) {
      recoveryRiskScore = 78;
      action = 'HOLD';
      customerFacingMessage = 'Manual Review Required';
      reasons.push("ELEVATED: Recovery initiated from an unrecognized device routed through a commercial VPN/Proxy network.");
      evidence.push({ key: "Device & Network Context", value: "Unrecognized Device + VPN", status: "SUSPICIOUS" });
    }
    // ── POLICY RULE 4: BEHAVIOR ANOMALY (MODULE 1) + NEW DEVICE ────────────────
    else if (behavioralRiskScore > 20 && isNewDevice) {
      recoveryRiskScore = 68;
      action = 'GUARDIAN_APPROVAL_REQUIRED';
      customerFacingMessage = 'Guardian Approval Required';
      reasons.push("MODERATE: Behavioral anomaly combined with a new device requires Guardian multi-signature sign-off.");
      evidence.push({ key: "Behavior & Device Context", value: `Behavior Anomaly + New Device`, status: "SUSPICIOUS" });
    }
    // ── POLICY RULE 5: NEW DEVICE + GEOGRAPHIC MISMATCH ────────────────────────
    else if (isNewDevice && isGeoMismatch) {
      recoveryRiskScore = 65;
      action = 'MANUAL_REVIEW';
      customerFacingMessage = 'Manual Review Required';
      reasons.push("ELEVATED: Unrecognized device signature and geographic origin deviation detected.");
      evidence.push({ key: "Geographic Context", value: "Geo Mismatch", status: "SUSPICIOUS" });
    }
    // ── POLICY RULE 6: RECENT FAILED RECOVERIES ────────────────────────────────
    else if (profile.failedAttemptsCount >= 3) {
      recoveryRiskScore = 72;
      action = 'MANUAL_REVIEW';
      customerFacingMessage = 'Manual Review Required';
      reasons.push("ELEVATED: Multiple failed recovery attempts logged in recent history.");
      evidence.push({ key: "Recovery History", value: `${profile.failedAttemptsCount} Failed Attempts`, status: "SUSPICIOUS" });
    }
    // ── POLICY RULE 7: KNOWN DEVICE + KNOWN LOCATION + LOW BEHAVIOR RISK ──────
    else {
      recoveryRiskScore = 15;
      action = 'ALLOW';
      customerFacingMessage = 'Recovery request accepted on a trusted baseline';
      reasons.push("Trusted device and baseline context matched. No additional OTP challenge is required.");
      evidence.push({ key: "Recovery Evaluation", value: "Baseline Clear", status: "CLEAR" });
    }

    if (employeeOverride) {
      reasons.push(`EXECUTIVE OVERRIDE: Approved by bank staff ${employeeId}`);
      evidence.push({ key: "Staff Override", value: employeeId, status: "CLEAR" });
    }

    // Standardized Common Evidence Contract
    const moduleEvidenceContract = {
      module: "Recovery",
      risk: recoveryRiskScore,
      maxRiskBudget: 10,
      confidence: 0.96,
      reasons,
      evidence,
      recommendation: action,
      customerFacingMessage
    };

    // Save Decision with Common Evidence Contract
    await RecoveryDecisionModel.create({
      cif,
      customerName: customerName || profile.customerName,
      accountNumber: accountNumber || profile.accountNumber,
      recoveryType,
      timestamp: new Date(),
      recoveryRiskScore,
      decisionAction: action,
      customerFacingMessage,
      reasons,
      evidence,
      moduleOutputsConsumed: {
        behavioralRisk: behavioralRiskScore,
        deviceRisk: deviceRiskScore,
        identityRisk: identityRiskScore,
        simSwapRecent: isSimSwapRecent
      },
      correlationId
    });

    // Central Audit Bus
    await dbBridge.addAuditLog({
      timestamp: new Date().toISOString(),
      user: 'Module 4 Secure Recovery Shield',
      event: `Account Recovery (${recoveryType}) Evaluated for ${customerName || cif}: Action ${action}`,
      riskScore: recoveryRiskScore,
      riskFactors: reasons,
      decision: action
    });

    // Socket.io Emitter
    const io = req.app.locals.io;
    if (io) {
      const payload = {
        cif,
        customerName: customerName || cif,
        accountNumber: accountNumber || profile.accountNumber,
        recoveryType,
        evidenceContract: moduleEvidenceContract,
        riskScore: recoveryRiskScore,
        decisionAction: action,
        reasons,
        timestamp: new Date().toISOString()
      };
      io.emit('recovery:alert', payload);
      if (recoveryRiskScore >= 40) {
        io.emit('soc:alert', payload);
      }
    }

    // Customer-Facing Clean Response (NO ML/Risk Scores)
    res.json({
      status: action === 'BLOCK' ? 'REJECTED' : 'SUBMITTED',
      message: customerFacingMessage,
      cif,
      accountNumber: accountNumber || profile.accountNumber,
      recoveryType,
      actionRequired: action,
      correlationId
    });

  } catch (err) {
    console.error("[Recovery Shield Error]:", err);
    res.status(500).json({ error: "Failed to evaluate recovery request", message: err.message });
  }
};

export const getRecoveryQueue = async (req, res) => {
  try {
    const decisions = await RecoveryDecisionModel.find().sort({ timestamp: -1 }).limit(50);
    res.json(decisions);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getRecoveryProfileByAccount = async (req, res) => {
  try {
    const { accountNumber } = req.params;
    const profile = await RecoveryProfileModel.findOne({
      $or: [{ cif: accountNumber }, { accountNumber }]
    });
    if (!profile) return res.status(404).json({ error: "Recovery profile not found" });
    res.json(profile);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
