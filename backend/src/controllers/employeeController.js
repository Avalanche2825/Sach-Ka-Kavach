import * as dbBridge from '../utils/dbBridge.js';
import { GoogleGenAI, Type } from '@google/genai';

let ai = null;
if (process.env.GEMINI_API_KEY) {
  try {
    ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  } catch (err) {
    console.warn("Failed to initialize GoogleGenAI. Using heuristic fallback.", err);
  }
}

const clamp = (val, min, max) => Math.min(max, Math.max(min, val));

export const getEmployeeLogsList = async (req, res) => {
  try {
    const list = await dbBridge.getEmployeeLogs();
    res.json(list);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const createEmployeeLogEntry = async (req, res) => {
  try {
    const { employeeId, employeeName, action, customerCIF } = req.body;
    if (!employeeId || !employeeName || !action) {
      return res.status(400).json({ error: "Missing required employee log fields" });
    }

    // Enforce OTP-verified query ticket constraint if customer CIF is specified
    if (customerCIF) {
      const tickets = await dbBridge.getTickets();
      const isAuthorized = tickets.some(t => t.cif === customerCIF && t.otpVerified === true && t.status === 'AUTHORIZED');
      
      if (!isAuthorized) {
        // Log unauthorized attempt in Audit Trail and return 403
        await dbBridge.addEmployeeLog({
          timestamp: new Date().toISOString(),
          employeeId,
          employeeName,
          action: `UNAUTHORIZED ENQUIRY: ${action}`,
          customerCIF,
          outsideHours: new Date().getHours() < 9 || new Date().getHours() >= 18,
          actionRiskScore: 100,
          requiresManagerApproval: true,
          managerApproved: false
        });

        await dbBridge.addAuditLog({
          timestamp: new Date().toISOString(),
          user: 'Insider Threat Sentinel',
          event: `Staff ${employeeName} [${employeeId}] BLOCKED attempting record check [${action}] on CIF ${customerCIF} without verified OTP ticket`,
          riskScore: 100,
          riskFactors: ['Unauthorized customer record inquiry', 'Missing OTP authorization query ticket'],
          decision: 'REJECTED_AND_BLOCKED'
        });

        return res.status(403).json({
          error: "Access Denied: Customer has not authorized this inquiry. Active OTP-verified query ticket required."
        });
      }
    }

    const currentHour = new Date().getHours();
    const outsideHours = currentHour < 9 || currentHour >= 18;

    const criticalActions = [
      'Suspicious Account Override',
      'Sensitive Record Access', 
      'Credit Limit Override',
      'Account Closure',
      'Bulk Data Export',
      'Password Force Reset'
    ];
    const isCriticalAction = criticalActions.includes(action);

    let actionRiskScore = 15; // base risk
    if (outsideHours) actionRiskScore += 30;
    if (isCriticalAction) actionRiskScore += 40;
    if (outsideHours && isCriticalAction) actionRiskScore += 20; // compounding penalty

    const requiresManagerApproval = outsideHours || isCriticalAction;
    actionRiskScore = clamp(actionRiskScore, 0, 100);

    const riskFactors = [];
    if (outsideHours) riskFactors.push("Action executed outside banking operational hours");
    if (isCriticalAction) riskFactors.push("Critical admin database manipulation query executed");

    // Call Gemini for insider threat summary
    if (ai && requiresManagerApproval) {
      try {
        const prompt = `
          Analyze this insider action log for insider threat potential.
          Employee Name: ${employeeName} | ID: ${employeeId}
          Action: ${action} | Time: ${new Date().toLocaleTimeString()} | Customer CIF: ${customerCIF}
          Calculated Risk: ${actionRiskScore}/100
          Provide a 1-sentence insiderThreatSummary.
        `;
        const response = await ai.models.generateContent({
          model: 'gemini-2.0-flash',
          contents: prompt,
          config: {
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                insiderThreatSummary: { type: Type.STRING }
              },
              required: ['insiderThreatSummary']
            }
          }
        });
        
        if (response.text) {
          const parsed = JSON.parse(response.text.trim());
          riskFactors.push(parsed.insiderThreatSummary);
        }
      } catch (e) {
        console.warn("Gemini insider analysis skipped.", e);
      }
    }

    const savedLog = await dbBridge.addEmployeeLog({
      timestamp: new Date().toISOString(),
      employeeId,
      employeeName,
      action,
      customerCIF,
      outsideHours,
      actionRiskScore,
      requiresManagerApproval,
      managerApproved: !requiresManagerApproval
    });

    if (requiresManagerApproval) {
      await dbBridge.addAuditLog({
        timestamp: new Date().toISOString(),
        user: 'Insider Threat Sentinel',
        event: `Staff ${employeeName} [${employeeId}] triggered supervised action: [${action}]`,
        riskScore: actionRiskScore,
        riskFactors,
        decision: 'PENDING_MANAGER_OVERWATCH'
      });
    }

    res.status(201).json(savedLog);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const approveEmployeeLogEntry = async (req, res) => {
  try {
    const { id } = req.params;
    const logs = await dbBridge.getEmployeeLogs();
    const entry = logs.find(l => l._id === id);
    if (!entry) return res.status(404).json({ error: "Log entry not found" });

    entry.managerApproved = true;

    await dbBridge.addAuditLog({
      timestamp: new Date().toISOString(),
      user: 'SOC Supervisor Override',
      event: `Insider activity log approved: ID (${id})`,
      riskScore: entry.actionRiskScore,
      riskFactors: ['Supervisor co-approval validated'],
      decision: 'RESOLVED'
    });

    res.json({ success: true, message: "Authorized successfully", entry });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
