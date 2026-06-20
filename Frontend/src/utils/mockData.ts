import { UserSession, Transaction, KYCApplication, EmployeeLog, AuditLog, Guardian } from "../types.js";

// --- Seed Data Generators ---
const locations = ["Mumbai, IN", "Delhi, IN", "Bengaluru, IN", "Ahmedabad, IN", "Pune, IN", "Chennai, IN"];
const devices = ["iPhone 15 (iOS)", "MacBook Pro", "Samsung Galaxy S24", "Google Pixel 8", "Dell Latitude", "iPad Air"];
const names = ["Aarav Sharma", "Priya Patel", "Rohan Verma", "Neha Iyer", "Siddharth Rao", "Anjali Nair"];

export const getInitialCustomers = (): UserSession[] => {
  const list: UserSession[] = [];
  for (let i = 0; i < 6; i++) {
    const cif = `CIF10000${i}`;
    const balance = 50000 + i * 550000;
    const trustScore = 55 + i * 8;
    
    const loginHistory = [];
    for (let j = 0; j < 4; j++) {
      loginHistory.push({
        timestamp: new Date(Date.now() - j * 24 * 3600 * 1000).toISOString(),
        ip: `103.88.24.${50 + i - j}`,
        location: locations[i],
        device: devices[i],
        isNewDevice: false
      });
    }

    list.push({
      cif,
      name: names[i],
      balance,
      trustScore,
      currentDevice: devices[i],
      currentIP: `103.88.24.${50 + i}`,
      currentLocation: locations[i],
      loginHistory,
      avgTransactionAmount: 2000 + i * 16600,
      dailyAverageAmount: 5000 + i * 39000,
      accessFrequency: 5 + i * 2
    });
  }
  return list;
};

export const getInitialGuardians = (): Guardian[] => [
  { cif: 'CIF100000', guardianName: 'Sunil Sharma', relationship: 'Father', phone: '+91 9988776655' },
  { cif: 'CIF100001', guardianName: 'Kiran Patel', relationship: 'Mother', phone: '+91 9988776644' }
];

export const getInitialTransactions = (customers: UserSession[]): Transaction[] => {
  const receivers = ["Deepak Kumar", "Vijay Singh", "Rajesh Gupta", "Sunita Nair", "Vikram Mehta", "Meera Das", "Ravi Pillai", "Aisha Bose"];
  const statuses: ("Approved" | "OTP_Required" | "CIF_Required" | "Guardian_Required" | "Rejected")[] = [
    'Approved', 'OTP_Required', 'CIF_Required', 'Guardian_Required', 
    'Approved', 'OTP_Required', 'CIF_Required', 'Guardian_Required'
  ];
  const list: Transaction[] = [];

  for (let i = 0; i < 8; i++) {
    const uIdx = i % 6;
    const cust = customers[uIdx] || customers[0];
    list.push({
      _id: `tx_mock_${100 + i}`,
      timestamp: new Date(Date.now() - i * 12 * 3600 * 1000).toISOString(),
      cif: cust.cif,
      customerName: cust.name,
      receiverName: receivers[i],
      accountNumber: `910283000${10 + i}`,
      amount: 5000 + i * 25000,
      riskScore: 10 + i * 11,
      riskFactors: i % 2 === 0 ? [] : ['Anomalous Amount Ratio', 'New Device Location Check'],
      explanation: 'Regular transfer fits profile verification parameters.',
      status: statuses[i]
    });
  }
  return list;
};

export const getInitialKYCApplications = (): KYCApplication[] => [
  { _id: 'kyc_0', timestamp: new Date().toISOString(), name: 'Kabir Sen', aadhaar: '321098765432', pan: 'ABCDE1234F', deviceFingerprint: 'DEV_FING_991', ipAddress: '103.88.24.11', status: 'Approved', suspiciousMatches: [] },
  { _id: 'kyc_1', timestamp: new Date().toISOString(), name: 'Neha Das', aadhaar: '321098765433', pan: 'ABCDE1234G', deviceFingerprint: 'DEV_FING_992', ipAddress: '103.88.24.12', status: 'Approved', suspiciousMatches: [] },
  { _id: 'kyc_2', timestamp: new Date().toISOString(), name: 'Suresh Bose', aadhaar: '321098765434', pan: 'ABCDE1234H', deviceFingerprint: 'DEV_FING_993', ipAddress: '103.88.24.13', status: 'Approved', suspiciousMatches: [] },
  { _id: 'kyc_3', timestamp: new Date().toISOString(), name: 'Fraudster One', aadhaar: '999998765432', pan: 'FGHIJ1234K', deviceFingerprint: 'DEV_FING_SHARED', ipAddress: '103.88.24.99', status: 'Flagged', suspiciousMatches: ['Device fingerprint shared across 2 applications — fraud ring signal'] },
  { _id: 'kyc_4', timestamp: new Date().toISOString(), name: 'Fraudster Two', aadhaar: '999998765433', pan: 'FGHIJ1234L', deviceFingerprint: 'DEV_FING_SHARED', ipAddress: '103.88.24.99', status: 'Flagged', suspiciousMatches: ['Device fingerprint shared across 2 applications — fraud ring signal'] }
];

export const getInitialEmployeeLogs = (): EmployeeLog[] => {
  const list: EmployeeLog[] = [];
  for (let i = 0; i < 12; i++) {
    const isCritical = i % 3 === 0;
    list.push({
      _id: `emp_log_mock_${i}`,
      timestamp: new Date(Date.now() - i * 4 * 3600 * 1000).toISOString(),
      employeeId: `EMP10${i % 6}`,
      employeeName: `Agent ${String.fromCharCode(65 + (i % 6))}`,
      action: isCritical ? 'Suspicious Account Override' : 'Routine Balance Lookup',
      customerCIF: `CIF10000${i % 6}`,
      outsideHours: i % 2 === 0,
      actionRiskScore: isCritical ? 75 : 15,
      managerApproved: !isCritical,
      requiresManagerApproval: isCritical
    });
  }
  return list;
};

export const getInitialAuditLogs = (): AuditLog[] => {
  const decisions = ['LOGGED', 'ESCALATED_TO_SOC', 'REJECTED_AND_BLOCKED', 'APPROVED_POST_VERIFICATION', 'GUARDIAN_ENROLLED'];
  const list: AuditLog[] = [];
  for (let i = 0; i < 20; i++) {
    list.push({
      _id: `audit_log_mock_${i}`,
      timestamp: new Date(Date.now() - i * 6 * 3600 * 1000).toISOString(),
      user: i % 2 === 0 ? 'SACH Kavach AI Engine' : 'Operations Audit Officer',
      event: `Transaction risk evaluation check processed for CIF10000${i % 6}`,
      riskScore: 10 + i * 4,
      riskFactors: i % 3 === 0 ? ['High transaction ratio'] : [],
      decision: decisions[i % decisions.length]
    });
  }
  return list;
};

// --- Real-time Simulator Core ---

export function clientCalculateRisk(amount: number, avgAmount: number, isNewDevice: boolean, isNewLocation: boolean, receiverName: string) {
  let score = 10;
  const factors: string[] = [];
  const ratio = avgAmount > 0 ? amount / avgAmount : 1;

  if (ratio > 8) { 
    score += 50; 
    factors.push(`Transaction ${ratio.toFixed(1)}x above customer average — critical amount spike`); 
  } else if (ratio > 5) { 
    score += 35; 
    factors.push(`Transaction ${ratio.toFixed(1)}x above customer average`); 
  } else if (ratio > 2) { 
    score += 15; 
    factors.push(`Transaction ${ratio.toFixed(1)}x above customer average`); 
  }

  const hour = new Date().getHours();
  if (hour < 6 || hour > 22) { 
    score += 20; 
    factors.push(`Login at ${String(hour).padStart(2, '0')}:00 outside normal operating hours`); 
  }
  if (isNewDevice) { 
    score += 25; 
    factors.push('Unrecognized device signature flag'); 
  }
  if (isNewLocation) { 
    score += 20; 
    factors.push('Geographical origin inconsistent with profile history'); 
  }

  // Keyword receiver name checking simulation
  const fraudKeywords = ['lottery', 'prize', 'subsidy', 'customs', 'kbc', 'winner', 'crypto', 'penalty', 'refund', 'police'];
  const text_lower = receiverName.toLowerCase();
  const matched = fraudKeywords.filter(kw => text_lower.includes(kw));
  if (matched.length > 0) {
    score += (matched.length * 15);
    factors.push(`Receiver matches suspicious profile narrative: [${matched[0]}]`);
  }

  const finalScore = Math.min(100, score);
  let status: "Approved" | "OTP_Required" | "CIF_Required" | "Guardian_Required" | "Rejected" = 'Approved';
  
  if (finalScore >= 80) status = 'Rejected';
  else if (finalScore >= 60) status = 'OTP_Required';
  else if (finalScore >= 40) status = 'CIF_Required';
  else if (finalScore >= 20) status = 'Guardian_Required';

  let explanation = "";
  if (finalScore >= 80) {
    explanation = `SACH Kavach has flagged a high-risk transaction of ₹${amount.toLocaleString()} with a risk score of ${finalScore}/100. Primary signal: ${factors[0] || 'critical amount spike'}. Recommendation: Block this transaction immediately.`;
  } else if (finalScore >= 60) {
    explanation = `Medium-high risk signals have been detected. Risk score: ${finalScore}/100. Key concern: ${factors[0] || 'anomalous attributes'}. Recommendation: Require OTP step-up authentication.`;
  } else {
    explanation = `Transaction falls within normal behavioral parameters. Risk score: ${finalScore}/100. Recommendation: Approve transaction and log.`;
  }

  return { riskScore: finalScore, factors, status, explanation };
}
