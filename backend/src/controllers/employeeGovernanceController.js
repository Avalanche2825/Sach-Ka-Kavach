import crypto from 'crypto';
import * as dbBridge from '../utils/dbBridge.js';
import EmployeeProfileModel from '../models/EmployeeProfile.js';
import EmployeeEventModel from '../models/EmployeeEvent.js';
import EmployeeDecisionModel from '../models/EmployeeDecision.js';
import PrivilegeLogModel from '../models/PrivilegeLog.js';

/**
 * POST /api/employee/action
 * Module 5 Privileged Access Governance Engine
 * Consumes Module 1 (Behavioral Typing Cadence) & Module 2 (Device Fingerprint) signals.
 */
export const evaluateEmployeeAction = async (req, res) => {
  try {
    const {
      employeeId,
      actionType,
      targetCIF,
      targetCustomerName,
      targetAccountNumber,
      targetCustomerBranch,
      managerEmployeeId,
      managerApproved = false,
      behavioralRiskScore = 10, // Signal from Module 1 (Behavioral)
      deviceRiskScore = 4        // Signal from Module 2 (Device)
    } = req.body;

    const correlationId = req.headers['x-correlation-id'] || crypto.randomUUID();

    if (!employeeId || !actionType) {
      return res.status(400).json({ error: "Missing mandatory parameters: employeeId and actionType required." });
    }

    let emp = await EmployeeProfileModel.findOne({ employeeId });
    if (!emp) {
      emp = await EmployeeProfileModel.create({
        employeeId,
        employeeName: req.body.employeeName || `Employee ${employeeId}`,
        role: req.body.role || 'TELLER',
        branchCode: req.body.branchCode || 'BOB_MUMBAI_01',
        branchName: 'Main Branch',
        workingHours: { startHour: 9, endHour: 18 }
      });
    }

    const now = new Date();
    const currentHour = now.getHours() + now.getMinutes() / 60.0;
    const startH = emp.workingHours.startHour;
    const endH = emp.workingHours.endHour;

    const isOutsideHours = currentHour < startH || currentHour >= endH;
    const isUnrelatedBranch = targetCustomerBranch && targetCustomerBranch !== emp.branchCode;

    let employeeRiskScore = 0;
    const reasons = [];
    const evidence = [];
    let decisionAction = 'ALLOWED';

    // ── RULE 1: APPROVE OWN REQUEST (CRITICAL HARD BLOCK) ────────────────────
    if (actionType === 'APPROVE_OWN_REQUEST') {
      employeeRiskScore = 10;
      decisionAction = 'BLOCK_AND_REVOKE';
      reasons.push("CRITICAL INSIDER THREAT: Employee attempted self-approval of a transaction or override. Access blocked immediately.");
      evidence.push({ key: "Self-Approval Conflict", value: "Flagged", status: "CRITICAL" });
    }
    else {
      // ── RULE 2: OUTSIDE WORKING HOURS WITH RICH TIMING EVIDENCE ─────────────
      if (isOutsideHours) {
        let diffHours = 0;
        if (currentHour < startH) diffHours = startH - currentHour;
        else diffHours = currentHour - endH;

        employeeRiskScore += 3;
        reasons.push(`OUTSIDE WORKING HOURS: Access at ${now.toLocaleTimeString()} (${diffHours.toFixed(1)}h deviation from standard ${startH}:00 - ${endH}:00 shift)`);
        evidence.push({
          key: "Shift Schedule Audit",
          expected: `${startH}:00 AM - ${endH}:00 PM`,
          actual: now.toLocaleTimeString(),
          hourDifference: `${diffHours.toFixed(1)} Hours`,
          status: "SUSPICIOUS"
        });
      }

      // ── RULE 3: BEHAVIOR ANOMALY (MODULE 1 ENRICHMENT) ──────────────────────
      if (behavioralRiskScore > 25) {
        employeeRiskScore += 4;
        reasons.push(`BEHAVIOR CADENCE ANOMALY: Employee keystroke/mouse dynamics deviate severely from registered baseline (${behavioralRiskScore}/40 behavioral risk).`);
        evidence.push({
          key: "Behavioral Typing Cadence",
          value: `Severe Anomaly (${behavioralRiskScore}/40)`,
          status: "CRITICAL"
        });
      }

      // ── RULE 4: BULK DATA EXPORT (+4 PTS) ──────────────────────────────────
      if (actionType === 'BULK_EXPORT') {
        employeeRiskScore += 4;
        reasons.push("HIGH SENSITIVITY: Bulk customer data export initiated.");
        evidence.push({ key: "Data Export Sensitivity", value: "Bulk Export Flagged", status: "SUSPICIOUS" });
      }

      // ── RULE 5: UNAPPROVED KYC / RECOVERY OVERRIDE (+4 PTS) ────────────────
      if (actionType === 'KYC_OVERRIDE' || actionType === 'RECOVERY_OVERRIDE') {
        employeeRiskScore += 4;
        reasons.push(`PRIVILEGED OVERRIDE: ${actionType} executed.`);
        evidence.push({ key: "Privileged Override", value: actionType, status: "SUSPICIOUS" });
      }

      // ── RULE 6: UNRELATED BRANCH ACCESS (+3 PTS) ───────────────────────────
      if (isUnrelatedBranch) {
        employeeRiskScore += 3;
        reasons.push(`BRANCH MISMATCH: Employee at ${emp.branchCode} accessed account registered at ${targetCustomerBranch}`);
        evidence.push({ key: "Branch Cross-Access", value: `${emp.branchCode} ➔ ${targetCustomerBranch}`, status: "SUSPICIOUS" });
      }

      // ── RULE 7: FOUR-EYES PRINCIPLE MANDATE ────────────────────────────────
      const requiresFourEyes = ['KYC_OVERRIDE', 'BULK_EXPORT', 'LOAN_APPROVAL', 'RECOVERY_OVERRIDE'].includes(actionType);
      if (requiresFourEyes && !managerApproved) {
        decisionAction = 'FOUR_EYES_REQUIRED';
        reasons.push("FOUR-EYES PRINCIPLE BREACH: Dual-authorization required. Secondary Branch Manager sign-off missing.");
        evidence.push({ key: "Four-Eyes Status", value: "Manager Sign-Off Missing", status: "CRITICAL" });
      } else if (employeeRiskScore >= 7) {
        decisionAction = 'ALERT_SOC';
      }
    }

    employeeRiskScore = Math.min(10, Math.max(0, employeeRiskScore));

    if (reasons.length === 0) {
      reasons.push("Employee action authorized within standard working shift and branch policy guidelines.");
      evidence.push({ key: "Governance Check", value: "Baseline Clear", status: "CLEAR" });
    }

    // Standardized Common Evidence Contract
    const moduleEvidenceContract = {
      module: "Employee",
      risk: employeeRiskScore,
      maxRiskBudget: 10,
      confidence: 0.95,
      reasons,
      evidence,
      recommendation: decisionAction
    };

    // Save Event Log
    await EmployeeEventModel.create({
      employeeId,
      employeeName: emp.employeeName,
      role: emp.role,
      branchCode: emp.branchCode,
      actionType,
      targetCIF: targetCIF || '',
      targetCustomerName: targetCustomerName || '',
      targetAccountNumber: targetAccountNumber || '',
      targetCustomerBranch: targetCustomerBranch || emp.branchCode,
      isOutsideHours,
      isUnrelatedBranch,
      requiresFourEyes: ['KYC_OVERRIDE', 'BULK_EXPORT', 'LOAN_APPROVAL', 'RECOVERY_OVERRIDE'].includes(actionType),
      managerApproved: !!managerApproved,
      managerEmployeeId: managerEmployeeId || '',
      timestamp: new Date()
    });

    // Save Decision with Common Evidence Contract
    await EmployeeDecisionModel.create({
      employeeId,
      employeeName: emp.employeeName,
      actionType,
      timestamp: new Date(),
      employeeRiskScore,
      decisionAction,
      reasons,
      evidence,
      correlationId
    });

    // Central Audit Bus
    await dbBridge.addAuditLog({
      timestamp: new Date().toISOString(),
      user: `Employee ${emp.employeeName} (${employeeId})`,
      event: `Privileged Governance Action (${actionType}) on Account ${targetAccountNumber || 'N/A'}: Score ${employeeRiskScore}/10`,
      riskScore: employeeRiskScore,
      riskFactors: reasons,
      decision: decisionAction
    });

    // Socket.io Emitter
    const io = req.app.locals.io;
    if (io) {
      io.emit('employee:governance', {
        employeeId,
        employeeName: emp.employeeName,
        actionType,
        evidenceContract: moduleEvidenceContract,
        timestamp: new Date().toISOString()
      });
    }

    res.json(moduleEvidenceContract);

  } catch (err) {
    console.error("[Employee Governance Error]:", err);
    res.status(500).json({ error: "Failed to evaluate employee action", message: err.message });
  }
};

export const grantTemporaryPrivilege = async (req, res) => {
  try {
    const { employeeId, privilegeName, grantedBy, reason = '' } = req.body;
    const expiresAt = new Date(Date.now() + 2 * 60 * 60 * 1000); // 2 Hours TTL

    const log = await PrivilegeLogModel.create({
      employeeId,
      privilegeName,
      grantedBy,
      reason,
      grantedAt: new Date(),
      expiresAt,
      isRevoked: false
    });

    await EmployeeProfileModel.updateOne(
      { employeeId },
      {
        $push: {
          temporaryPrivileges: { privilege: privilegeName, grantedBy, grantedAt: new Date(), expiresAt }
        }
      }
    );

    res.json({
      status: "Granted",
      employeeId,
      privilegeName,
      grantedBy,
      expiresAt,
      durationHours: 2
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getEmployeeEvents = async (req, res) => {
  try {
    let events = await EmployeeEventModel.find().sort({ timestamp: -1 }).limit(50);
    if (events.length === 0) {
      events = await EmployeeDecisionModel.find().sort({ timestamp: -1 }).limit(50);
    }
    res.json(events);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getEmployeeProfiles = async (req, res) => {
  try {
    const profiles = await EmployeeProfileModel.find();
    res.json(profiles);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
