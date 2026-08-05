import express from 'express';
import { loginUser } from '../controllers/authController.js';
import {
  getAllCustomers,
  getCustomerByCIF,
  getGuardianByCIF,
  enrollGuardian,
  registerCustomer,
  updateCustomerLocation,
} from '../controllers/customerController.js';
import {
  getTransactionsList,
  createTransaction,
  approveTx,
  rejectTx,
} from '../controllers/transactionController.js';
import {
  getKYCApplications,
  createKYCApplication,
} from '../controllers/kycController.js';
// Removed obsolete controller imports
import { getAuditLogsList } from '../controllers/auditController.js';
import {
  getTicketsList,
  createTicketEntry,
  verifyTicketOTP,
} from '../controllers/ticketController.js';
import {
  scoreBehavioral,
  scoreDevice,
  scoreInsider,
  scoreTextRisk,
  analyzeKYC,
  scoreUnified,
  mlHealth,
} from '../controllers/mlController.js';
import { collectBehaviorSignals, config } from '../controllers/behaviorController.js';
import { generateRiskNarrative } from '../utils/llmService.js';
import { getAnalyticsOverview } from '../controllers/analyticsController.js';
import { activateDelaySession, getDelayIntelligence } from '../controllers/hackerDelayController.js';
import { getPrivilegeTokensList, createPrivilegeToken } from '../controllers/tokenController.js';
import {
  getSocSummary,
  getSocLiveSessions,
  getSocIncidents,
  getSocSystemHealth,
  getSocModelHealth,
  getSocCustomerTelemetry,
  getSocTimeline,
  getSystemVersion,
  getDecisionEngineState,
  takeSocAction
} from '../controllers/socController.js';
import {
  collectDeviceSignals,
  scoreDeviceSignals,
  getDeviceProfileByAccount,
  getDeviceHistoryByAccount,
  getKnownDevicesByAccount,
  getGlobalDeviceEvents
} from '../controllers/deviceController.js';
import {
  evaluateIdentitySignals,
  getIdentitySwarmGraph,
  getIdentityDecisions
} from '../controllers/identityController.js';
import {
  evaluateRecoveryRequest,
  getRecoveryQueue,
  getRecoveryProfileByAccount
} from '../controllers/recoveryController.js';
import {
  evaluateEmployeeAction,
  grantTemporaryPrivilege,
  getEmployeeEvents,
  getEmployeeProfiles
} from '../controllers/employeeGovernanceController.js';

const router = express.Router();

// ── SOC Operations APIs ─────────────────────────────────────────────────────
router.get('/soc/summary', getSocSummary);
router.get('/soc/live-sessions', getSocLiveSessions);
router.get('/soc/incidents', getSocIncidents);
router.get('/soc/system-health', getSocSystemHealth);
router.get('/soc/model-health', getSocModelHealth);
router.get('/soc/customer/:cif', getSocCustomerTelemetry);
router.get('/soc/timeline/:sessionId', getSocTimeline);
router.get('/system/version', getSystemVersion);
router.get('/decision-engine/current/:sessionId', getDecisionEngineState);
router.post('/soc/action', takeSocAction);

// ── Shared Configuration Service ──────────────────────────────────────────────
router.get('/config', (req, res) => res.json(config));

// ── Behavioral Identity signals Ingestion (Module 1) ─────────────────────────
router.post('/behavior/collect', collectBehaviorSignals);

// ── Device & Access Intelligence (Module 2) ─────────────────────────────────
router.post('/device/collect', collectDeviceSignals);
router.post('/device/score', scoreDeviceSignals);
router.get('/device/profile/:accountNumber', getDeviceProfileByAccount);
router.get('/device/history/:accountNumber', getDeviceHistoryByAccount);
router.get('/device/known-devices/:accountNumber', getKnownDevicesByAccount);
router.get('/device/events', getGlobalDeviceEvents);

// ── Swarm Identity & Onboarding Intelligence (Module 3) ──────────────────────
router.post('/identity/evaluate', evaluateIdentitySignals);
router.get('/identity/swarm-graph/:cif', getIdentitySwarmGraph);
router.get('/identity/decisions', getIdentityDecisions);

// ── Secure Recovery Shield (Module 4) ───────────────────────────────────────
router.post('/recovery/evaluate', evaluateRecoveryRequest);
router.get('/recovery/queue', getRecoveryQueue);
router.get('/recovery/profile/:accountNumber', getRecoveryProfileByAccount);

// ── Privileged Access Governance (Module 5) ──────────────────────────────────
router.post('/employee/action', evaluateEmployeeAction);
router.post('/employee/grant-privilege', grantTemporaryPrivilege);
router.get('/employee/events', getEmployeeEvents);
router.get('/employee/profiles', getEmployeeProfiles);

// ── Analytics ───────────────────────────────────────────────────────────────
router.get('/analytics/overview', getAnalyticsOverview);

// ── Hacker Delay Layer ───────────────────────────────────────────────────────
router.post('/hacker-delay/activate', activateDelaySession);
router.get('/hacker-delay/intelligence', getDelayIntelligence);

// ── Privilege Tokens ─────────────────────────────────────────────────────────
router.get('/privilege-tokens', getPrivilegeTokensList);
router.post('/privilege-tokens', createPrivilegeToken);


// ── Auth ────────────────────────────────────────────────────────────────────
router.post('/auth/login', loginUser);

// ── Customers ────────────────────────────────────────────────────────────────
router.get('/customers', getAllCustomers);
router.post('/customers/register', registerCustomer);
router.post('/customers/:cif/location', updateCustomerLocation);
router.get('/customers/:cif', getCustomerByCIF);
router.get('/customers/:cif/guardian', getGuardianByCIF);
router.post('/customers/:cif/guardian', enrollGuardian);

// ── Transactions & Customer Transfer ───────────────────────────────────────
router.get('/transactions', getTransactionsList);
router.post('/transactions', createTransaction);
router.post('/customer/transfer/evaluate', createTransaction);
router.post('/transactions/:id/approve', approveTx);
router.post('/transactions/:id/reject', rejectTx);

// ── KYC Onboarding ───────────────────────────────────────────────────────────
router.get('/kyc-applications', getKYCApplications);
router.post('/kyc-applications', createKYCApplication);

// ── Account Recovery ─────────────────────────────────────────────────────────
router.post('/security/recovery-attempt', evaluateRecoveryRequest);

// ── Employee Logs ─────────────────────────────────────────────────────────────
router.get('/employee/logs', getEmployeeEvents);
router.post('/employee/logs', evaluateEmployeeAction);
router.post('/employee/logs/:id/approve', (req, res) => res.json({ status: "Approved" }));

// ── Support Tickets ──────────────────────────────────────────────────────────
router.get('/tickets', getTicketsList);
router.post('/tickets', createTicketEntry);
router.post('/tickets/:id/verify-otp', verifyTicketOTP);

// ── Audit Logs ────────────────────────────────────────────────────────────────
router.get('/audit-logs', getAuditLogsList);

// ── ML Scoring Endpoints (proxy to Python ML service) ────────────────────────
router.get('/ml/health', mlHealth);
router.post('/ml/score/behavioral', scoreBehavioral);
router.post('/ml/score/device', scoreDevice);
router.post('/ml/score/insider', scoreInsider);
router.post('/ml/score/text-risk', scoreTextRisk);
router.post('/ml/kyc/analyze', analyzeKYC);
router.post('/ml/score/unified', scoreUnified);

// ── LLM Narrative ─────────────────────────────────────────────────────────────
router.post('/risk/narrative', async (req, res) => {
  try {
    const result = await generateRiskNarrative(req.body);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
