import crypto from 'crypto';
import * as dbBridge from '../utils/dbBridge.js';
import IdentityProfileModel from '../models/IdentityProfile.js';
import IdentityEventModel from '../models/IdentityEvent.js';
import IdentityDecisionModel from '../models/IdentityDecision.js';
import UserModel from '../models/User.js';

const createNode = (id, type, label, subtitle = '') => ({
  id,
  type,
  data: { label, subtitle }
});

const createEdge = (id, source, target, label) => ({
  id,
  source,
  target,
  label
});

export function generateIdentityGraph(customer, matches) {
  const nodes = [];
  const edges = [];
  const addedNodes = new Set();

  const addNode = (id, type, label, subtitle = '') => {
    if (!addedNodes.has(id)) {
      addedNodes.add(id);
      nodes.push(createNode(id, type, label, subtitle));
    }
  };

  const custNodeId = `cust_${customer.cif}`;
  addNode(custNodeId, 'customer', customer.name || customer.username || customer.cif, `Acc: ${customer.accountNumber || '89341029384'}`);

  if (customer.aadhaarNumber) {
    const aadhaarId = `aadhaar_${customer.aadhaarNumber.slice(-4)}`;
    addNode(aadhaarId, 'aadhaar', `Aadhaar: •••• ${customer.aadhaarNumber.slice(-4)}`);
    edges.push(createEdge(`e_${custNodeId}_${aadhaarId}`, custNodeId, aadhaarId, 'USES'));
  }

  if (customer.panNumber) {
    const panId = `pan_${customer.panNumber}`;
    addNode(panId, 'pan', `PAN: ${customer.panNumber}`);
    edges.push(createEdge(`e_${custNodeId}_${panId}`, custNodeId, panId, 'REGISTERED_WITH'));
  }

  if (customer.currentDevice || customer.deviceHash) {
    const devId = `dev_${(customer.deviceHash || 'fp_default').slice(0, 8)}`;
    addNode(devId, 'device', `Device: ${(customer.currentDevice || customer.deviceHash || 'PC').slice(0, 16)}`);
    edges.push(createEdge(`e_${custNodeId}_${devId}`, custNodeId, devId, 'SHARES'));
  }

  if (customer.currentIP) {
    const ipId = `ip_${customer.currentIP.replace(/\./g, '_')}`;
    addNode(ipId, 'ip', `IP: ${customer.currentIP}`);
    edges.push(createEdge(`e_${custNodeId}_${ipId}`, custNodeId, ipId, 'REGISTERED_FROM'));
  }

  if (matches && matches.length > 0) {
    matches.forEach((m, idx) => {
      const otherCustId = `cust_${m.cif}`;
      addNode(otherCustId, 'customer', m.name || m.cif, `Acc: ${m.accountNumber || 'Cluster Match'}`);
      edges.push(createEdge(`e_cluster_${idx}`, custNodeId, otherCustId, m.matchReason || 'LINKED_TO'));
    });
  }

  return { nodes, edges };
}

/**
 * POST /api/identity/evaluate
 * Module 3 Swarm Identity Engine — Inter-Module Signal Enrichment
 * Consumes Module 1 (Behavioral) & Module 2 (Device) signals to contextualize fraud clusters.
 */
export const evaluateIdentitySignals = async (req, res) => {
  try {
    const {
      cif,
      customerName,
      accountNumber,
      aadhaarNumber,
      panNumber,
      mobileNumber,
      email,
      address,
      deviceHash,
      ipAddress,
      documentHash,
      nomineeName,
      guardianName,
      behavioralRiskScore = 10, // Signal from Module 1
      deviceRiskScore = 4        // Signal from Module 2
    } = req.body;

    const correlationId = req.headers['x-correlation-id'] || crypto.randomUUID();

    if (!cif) {
      return res.status(400).json({ error: "Missing mandatory parameter: cif" });
    }

    let riskScore = 0;
    const reasons = [];
    const evidence = [];
    const matchedCustomers = [];

    // Search MongoDB for existing customers & profiles
    const allUsers = await UserModel.find({ cif: { $ne: cif } });
    const allProfiles = await IdentityProfileModel.find({ cif: { $ne: cif } });

    const isBehaviorNormal = behavioralRiskScore < 20;
    const isDeviceTrusted = deviceRiskScore < 8;

    // Rule 1: Duplicate Aadhaar Contextualization
    if (aadhaarNumber) {
      const dupAadhaar = allUsers.find(u => u.aadhaarNumber === aadhaarNumber) ||
                         allProfiles.find(p => p.aadhaarHash === aadhaarNumber);
      if (dupAadhaar) {
        // INTER-MODULE INTELLIGENCE: Same Device + Normal Behavior = Likely Family/Joint Account
        if (isDeviceTrusted && isBehaviorNormal) {
          riskScore += 7; // Reduced risk
          reasons.push(`Duplicate Aadhaar (•••• ${aadhaarNumber.slice(-4)}) detected on a trusted device & normal behavioral pattern — likely family/joint account relationship.`);
          evidence.push({
            key: "Duplicate Aadhaar",
            value: `•••• ${aadhaarNumber.slice(-4)}`,
            matchedCustomer: dupAadhaar.name || dupAadhaar.cif,
            matchedAccount: dupAadhaar.accountNumber || "89341029384",
            matchedBranch: dupAadhaar.branchCode || "BOB_MUMBAI_01",
            context: "FAMILY_JOINT_ACCOUNT_LIKELY",
            status: "SUSPICIOUS"
          });
        } else {
          riskScore += 15; // Critical Fraud
          reasons.push(`CRITICAL FRAUD: Duplicate Aadhaar (•••• ${aadhaarNumber.slice(-4)}) detected with abnormal behavior/unrecognized device across distinct customer profiles.`);
          evidence.push({
            key: "Duplicate Aadhaar",
            value: `•••• ${aadhaarNumber.slice(-4)}`,
            matchedCustomer: dupAadhaar.name || dupAadhaar.cif,
            matchedAccount: dupAadhaar.accountNumber || "89341029384",
            matchedBranch: dupAadhaar.branchCode || "BOB_DELHI_02",
            context: "COORDINATED_IDENTITY_FRAUD",
            status: "CRITICAL"
          });
        }
        matchedCustomers.push({ cif: dupAadhaar.cif, name: dupAadhaar.name || dupAadhaar.cif, matchReason: 'SAME_AADHAAR' });
      }
    }

    // Rule 2: Duplicate PAN Contextualization
    if (panNumber) {
      const dupPAN = allUsers.find(u => u.panNumber === panNumber) ||
                     allProfiles.find(p => p.panNumber === panNumber);
      if (dupPAN) {
        riskScore += 15;
        reasons.push(`CRITICAL: Duplicate PAN (${panNumber}) linked to customer ${dupPAN.name || dupPAN.cif} (Account: ${dupPAN.accountNumber || '89341029384'})`);
        evidence.push({
          key: "Duplicate PAN",
          value: panNumber,
          matchedCustomer: dupPAN.name || dupPAN.cif,
          matchedAccount: dupPAN.accountNumber || "89341029384",
          matchedBranch: "BOB_JAIPUR_01",
          status: "CRITICAL"
        });
        matchedCustomers.push({ cif: dupPAN.cif, name: dupPAN.name || dupPAN.cif, matchReason: 'SAME_PAN' });
      }
    }

    // Rule 3: Duplicate Document Hash
    if (documentHash) {
      const dupDoc = allProfiles.find(p => p.documentHashes?.includes(documentHash));
      if (dupDoc) {
        riskScore += 15;
        reasons.push("CRITICAL: Identical KYC document binary uploaded across distinct customer applications.");
        evidence.push({
          key: "KYC Document Binary",
          value: documentHash.substring(0, 16) + "...",
          matchedCustomer: dupDoc.customerName || dupDoc.cif,
          matchedAccount: dupDoc.accountNumber || "89341029384",
          status: "CRITICAL"
        });
        matchedCustomers.push({ cif: dupDoc.cif, name: dupDoc.customerName || dupDoc.cif, matchReason: 'SAME_DOC_HASH' });
      }
    }

    // Rule 4: Shared Device / IP Subnet
    if (deviceHash) {
      const dupDev = allProfiles.find(p => p.deviceHashes?.includes(deviceHash));
      if (dupDev) {
        riskScore += 8;
        reasons.push(`Shared hardware device fingerprint detected with ${dupDev.customerName || dupDev.cif}`);
        evidence.push({
          key: "Shared Device Fingerprint",
          value: deviceHash.substring(0, 16) + "...",
          matchedCustomer: dupDev.customerName || dupDev.cif,
          matchedAccount: dupDoc?.accountNumber || "89341029384",
          status: "SUSPICIOUS"
        });
        matchedCustomers.push({ cif: dupDev.cif, name: dupDev.customerName || dupDev.cif, matchReason: 'SHARED_DEVICE' });
      }
    }

    const identityRiskScore = Math.min(15, Math.max(0, riskScore));
    const category = identityRiskScore >= 12 ? 'CRITICAL' : identityRiskScore >= 8 ? 'HIGH' : identityRiskScore >= 4 ? 'MEDIUM' : 'LOW';
    const recommendation = identityRiskScore >= 12 ? 'BLOCK' : identityRiskScore >= 7 ? 'MANUAL_REVIEW' : 'ALLOW';

    if (reasons.length === 0) {
      reasons.push("Onboarding identity signals clear — no duplicate Aadhaar, PAN, or device cluster matches found.");
      evidence.push({ key: "Identity Baseline", value: "Verified Unique", status: "CLEAR" });
    }

    // Standardized Common Evidence Contract
    const moduleEvidenceContract = {
      module: "Identity",
      risk: identityRiskScore,
      maxRiskBudget: 15,
      confidence: 0.95,
      reasons,
      evidence,
      recommendation
    };

    const currentCustomerObj = {
      cif,
      name: customerName || `Customer ${cif}`,
      accountNumber: accountNumber || `89341029384`,
      aadhaarNumber: aadhaarNumber || '987654321111',
      panNumber: panNumber || 'ABCDE1234F',
      currentDevice: deviceHash || 'Windows PC',
      currentIP: ipAddress || '103.88.24.12'
    };

    const graphData = generateIdentityGraph(currentCustomerObj, matchedCustomers);

    // Upsert Identity Profile
    await IdentityProfileModel.updateOne(
      { cif },
      {
        $set: {
          customerName: customerName || `Customer ${cif}`,
          accountNumber: accountNumber || `89341029384`,
          aadhaarHash: aadhaarNumber || '',
          panNumber: panNumber || '',
          mobileNumber: mobileNumber || '',
          email: email || '',
          address: address || '',
          nomineeName: nomineeName || '',
          guardianName: guardianName || ''
        },
        $addToSet: {
          deviceHashes: deviceHash,
          ipAddresses: ipAddress,
          documentHashes: documentHash,
          linkedCIFs: { $each: matchedCustomers.map(m => m.cif) }
        }
      },
      { upsert: true }
    );

    // Save Decision with Common Evidence Contract
    await IdentityDecisionModel.create({
      cif,
      customerName: customerName || `Customer ${cif}`,
      accountNumber: accountNumber || `89341029384`,
      timestamp: new Date(),
      identityRiskScore,
      riskCategory: category,
      duplicateAadhaarFound: riskScore >= 15,
      duplicatePANFound: riskScore >= 15,
      duplicateDocumentFound: riskScore >= 15,
      sharedDeviceCount: matchedCustomers.filter(m => m.matchReason === 'SHARED_DEVICE').length,
      sharedIPCount: matchedCustomers.filter(m => m.matchReason === 'SHARED_IP').length,
      connectedCIFs: matchedCustomers.map(m => m.cif),
      reasons,
      evidence,
      graphData,
      correlationId
    });

    // Central Audit Bus
    await dbBridge.addAuditLog({
      timestamp: new Date().toISOString(),
      user: 'Module 3 Swarm Identity Engine',
      event: `Identity & Onboarding Risk Evaluated (${customerName || cif}): Score ${identityRiskScore}/15`,
      riskScore: identityRiskScore,
      riskFactors: reasons,
      decision: recommendation
    });

    // Socket.io Emitter
    const io = req.app.locals.io;
    if (io) {
      io.emit('identity:swarm', {
        cif,
        customerName: customerName || cif,
        accountNumber: accountNumber || `89341029384`,
        identityRiskScore,
        maxRiskBudget: 15,
        riskCategory: category,
        evidenceContract: moduleEvidenceContract,
        reasons,
        graphData,
        timestamp: new Date().toISOString()
      });
    }

    res.json(moduleEvidenceContract);

  } catch (err) {
    console.error("[Identity Engine Error]:", err);
    res.status(500).json({ error: "Failed to evaluate identity intelligence", message: err.message });
  }
};

export const getIdentitySwarmGraph = async (req, res) => {
  try {
    const { cif } = req.params;
    const decision = await IdentityDecisionModel.findOne({ cif }).sort({ timestamp: -1 });
    const profile = await IdentityProfileModel.findOne({ cif });
    
    if (!decision && !profile) {
      const baselineCust = { cif, name: `Customer ${cif}`, accountNumber: '89341029384' };
      return res.json(generateIdentityGraph(baselineCust, []));
    }

    res.json(decision?.graphData || generateIdentityGraph({ cif, name: profile?.customerName || cif, accountNumber: profile?.accountNumber || '89341029384' }, []));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getIdentityDecisions = async (req, res) => {
  try {
    const decisions = await IdentityDecisionModel.find().sort({ timestamp: -1 }).limit(50);
    res.json(decisions);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
