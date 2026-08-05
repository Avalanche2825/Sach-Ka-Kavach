import mongoose from 'mongoose';
import dotenv from 'dotenv';
import * as dbBridge from './utils/dbBridge.js';
import { hashPassword } from './utils/password.js';
import UserModel from './models/User.js';
import DeviceModel from './models/Device.js';
import DeviceProfileModel from './models/DeviceProfile.js';
import DeviceEventModel from './models/DeviceEvent.js';
import DeviceDecisionModel from './models/DeviceDecision.js';
import IdentityProfileModel from './models/IdentityProfile.js';
import IdentityEventModel from './models/IdentityEvent.js';
import IdentityDecisionModel from './models/IdentityDecision.js';
import RecoveryProfileModel from './models/RecoveryProfile.js';
import RecoveryEventModel from './models/RecoveryEvent.js';
import RecoveryDecisionModel from './models/RecoveryDecision.js';
import EmployeeProfileModel from './models/EmployeeProfile.js';
import EmployeeEventModel from './models/EmployeeEvent.js';
import EmployeeDecisionModel from './models/EmployeeDecision.js';
import PrivilegeLogModel from './models/PrivilegeLog.js';
import AuditLogModel from './models/AuditLog.js';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://hardikmathur11:Mongowithhardik@cluster0.0stebd8.mongodb.net/SACHKASAVACH';

async function seed() {
  console.log('=== SACH Kavach Master Database Seeder ===');
  await mongoose.connect(MONGODB_URI);
  console.log('Connected to MongoDB Atlas');

  // 1. Seed Customers & Portal Users
  const rawAccounts = [
    ['Aarav Sharma', 'CIF100000', 'Aarav@2026', 12, 18, 'Windows 11 (Chrome 126)', 'Mumbai, MH, IN', '103.88.24.12', 88, 5000],
    ['Chitra Saini', 'CIF100001', 'Chitra@2026', 9, 17, 'Ubuntu Linux (Firefox)', 'Gandhinagar, GJ, IN', '14.139.122.1', 92, 4200],
    ['Nisha Rao', 'CIF100002', 'Nisha@2026', 18, 22, 'Chrome on Android', 'Bengaluru, KA, IN', '49.36.118.2', 86, 6200],
    ['Dev Malhotra', 'CIF100003', 'Dev@2026', 7, 11, 'Edge on Windows', 'Delhi, NCR, IN', '103.19.71.6', 84, 7800],
    ['Priya Patel', 'CIF100004', 'Priya@2026', 10, 16, 'MacBook Pro (Safari)', 'Amsterdam, NL', '185.220.101.5', 35, 18500],
    ['Rohan Verma', 'CIF100005', 'Rohan@2026', 13, 19, 'Firefox on Windows', 'Pune, MH, IN', '49.36.12.89', 65, 22000],
    ['Isha Kapoor', 'CIF100006', 'Isha@2026', 11, 17, 'Safari on iOS', 'Jaipur, RJ, IN', '117.218.3.11', 62, 15000],
    ['Vikram Mehta', 'CIF100007', 'Vikram@2026', 12, 18, 'Android Emulator (BlueStacks)', 'Delhi, DL, IN', '45.12.89.2', 18, 12000],
    ['Satish Kumar', 'CIF100008', 'Satish@2026', 8, 14, 'Chrome on Windows', 'Lucknow, UP, IN', '106.51.88.17', 30, 9500],
    ['Meera Joshi', 'CIF100009', 'Meera@2026', 14, 20, 'Samsung Internet on Android', 'Chennai, TN, IN', '117.194.66.24', 22, 11000],
    ['Hardik Mathur', 'CIF100010', 'Hardik@2026', 9, 18, 'Windows 11 Pro', 'Jodhpur, RJ, IN', '49.36.12.89', 95, 6500],
    ['Siddharth Raut', 'CIF100011', 'Siddharth@2026', 10, 19, 'iPhone 15 Pro', 'Mumbai, MH, IN', '103.88.24.99', 48, 8900],
  ];

  const now = new Date().toISOString();
  const users = rawAccounts.map(([name, cif, password, start, end, browser, region, ip, trustScore, average], index) => ({
    cif,
    name,
    username: name,
    email: `${cif.toLowerCase()}@bob.in`,
    mobileNumber: `+91 98${10000000 + index}`,
    aadhaarNumber: `9876543${10000 + index}`,
    panNumber: `ABCDE${1000 + index}F`,
    passwordHash: hashPassword(password),
    role: 'customer',
    balance: 125000 + index * 85000,
    trustScore,
    currentDevice: browser,
    currentIP: ip,
    currentLocation: region,
    avgTransactionAmount: average,
    dailyAverageAmount: average * 4,
    accessFrequency: 8 + index,
    isSimSwapWithin72h: cif === 'CIF100007',
    loginHistory: [{ timestamp: now, ip, location: region, device: browser, isNewDevice: false }],
    baseline: { usualLoginStartHour: start, usualLoginEndHour: end, knownBrowser: browser, knownDeviceHash: `device_${cif}`, knownRegion: region, knownIp: ip },
  }));

  const portalUsers = [
    { cif: 'EMP101', name: 'Raman Murthy', username: 'Raman Murthy', passwordHash: hashPassword('Staff@123'), role: 'staff' },
    { cif: 'EMP102', name: 'Fraud Ops Analyst', username: 'Fraud Ops Analyst', passwordHash: hashPassword('Soc@123'), role: 'soc' },
    { cif: 'CIF000', name: 'System Administrator', username: 'admin', passwordHash: hashPassword('Admin@123'), role: 'admin' },
  ].map((user) => ({
    ...user, balance: 0, trustScore: 100, currentDevice: 'Bank managed workstation', currentIP: '10.10.0.10',
    currentLocation: 'Bank of Baroda Operations Centre', avgTransactionAmount: 0, dailyAverageAmount: 0, accessFrequency: 0,
    loginHistory: [], baseline: { usualLoginStartHour: 9, usualLoginEndHour: 18, knownBrowser: 'Chrome', knownDeviceHash: `device_${user.cif}`, knownRegion: 'Operations Centre', knownIp: '10.10.0.10' },
  }));

  for (const u of [...users, ...portalUsers]) {
    await UserModel.updateOne({ cif: u.cif }, { $set: u }, { upsert: true });
  }
  console.log(`✅ Seeded ${users.length + portalUsers.length} Accounts with Valid Passwords`);

  // 2. Module 2: Seed Devices & Device Events
  const deviceEvents = [
    {
      sessionId: 'sess_cif100000_1785',
      cif: 'CIF100000',
      accountNumber: '89341029384',
      timestamp: new Date(),
      deviceHash: 'a6b9c8d7e6f543210fedcba987654321',
      ipAddress: '103.88.24.12',
      geo: { city: 'Mumbai', state: 'Maharashtra', country: 'India', isp: 'BSNL', asn: 'AS9829', networkType: 'Residential', isVPN: false },
      accessVelocity: 1,
      deviceRiskScore: 4,
      isSimSwapWithin72h: false
    },
    {
      sessionId: 'sess_cif100001_992',
      cif: 'CIF100001',
      accountNumber: '77221098431',
      timestamp: new Date(),
      deviceHash: 'b7c0d1e2f3a4567890abcde123456789',
      ipAddress: '185.220.101.5',
      geo: { city: 'Amsterdam', state: 'North Holland', country: 'Netherlands', isp: 'NordVPN', asn: 'AS62005', networkType: 'VPN', isVPN: true },
      accessVelocity: 6,
      deviceRiskScore: 18,
      isSimSwapWithin72h: false
    },
    {
      sessionId: 'sess_cif100002_441',
      cif: 'CIF100002',
      accountNumber: '55441029388',
      timestamp: new Date(),
      deviceHash: 'c8d1e2f3a4b567890abcdef123456780',
      ipAddress: '45.12.89.2',
      geo: { city: 'Delhi', state: 'Delhi', country: 'India', isp: 'Hosting Provider', asn: 'AS16509', networkType: 'Datacenter', isProxy: true },
      accessVelocity: 12,
      deviceRiskScore: 25,
      isEmulator: true,
      isSimSwapWithin72h: true
    }
  ];

  for (const de of deviceEvents) {
    await DeviceEventModel.updateOne({ sessionId: de.sessionId }, { $set: de }, { upsert: true });
    await DeviceDecisionModel.create({
      sessionId: de.sessionId,
      cif: de.cif,
      accountNumber: de.accountNumber,
      timestamp: new Date(),
      deviceRiskScore: de.deviceRiskScore,
      riskCategory: de.deviceRiskScore > 18 ? 'CRITICAL' : 'MODERATE',
      reasons: [de.geo?.isVPN ? 'Commercial VPN Exit Node detected' : 'Standard Hardware Fingerprint'],
      decisionAction: de.deviceRiskScore > 18 ? 'BLOCK' : 'ALLOW'
    });
  }
  console.log(`✅ Seeded Module 2 Device Events & Decisions`);

  // 3. Module 3: Seed Identity Decisions
  const identityDecisions = [
    {
      cif: 'CIF100002',
      customerName: 'Vikram Mehta',
      accountNumber: '55441029388',
      timestamp: new Date(),
      identityRiskScore: 15,
      riskCategory: 'CRITICAL',
      duplicateAadhaarFound: true,
      duplicatePANFound: true,
      duplicateDocumentFound: true,
      connectedCIFs: ['CIF100000'],
      reasons: [
        'CRITICAL: Duplicate Aadhaar (•••• 1111) linked to customer Aarav Sharma (CIF100000)',
        'CRITICAL: Duplicate PAN (ABCDE1234F) cross-linked across distinct customer registrations'
      ],
      graphData: {
        nodes: [
          { id: 'cust_CIF100002', type: 'customer', data: { label: 'Vikram Mehta', subtitle: 'Acc: 55441029388' } },
          { id: 'aadhaar_1111', type: 'aadhaar', data: { label: 'Aadhaar: •••• 1111' } },
          { id: 'cust_CIF100000', type: 'customer', data: { label: 'Aarav Sharma', subtitle: 'Acc: 89341029384' } },
          { id: 'pan_ABCDE1234F', type: 'pan', data: { label: 'PAN: ABCDE1234F' } }
        ],
        edges: [
          { id: 'e1', source: 'cust_CIF100002', target: 'aadhaar_1111', label: 'USES' },
          { id: 'e2', source: 'cust_CIF100000', target: 'aadhaar_1111', label: 'SHARES' },
          { id: 'e3', source: 'cust_CIF100002', target: 'pan_ABCDE1234F', label: 'LINKED_TO' }
        ]
      }
    },
    {
      cif: 'CIF100000',
      customerName: 'Aarav Sharma',
      accountNumber: '89341029384',
      timestamp: new Date(),
      identityRiskScore: 4,
      riskCategory: 'LOW',
      duplicateAadhaarFound: true,
      connectedCIFs: ['CIF100002'],
      reasons: ['Duplicate Aadhaar (•••• 1111) detected on trusted device — family/joint account match.'],
      graphData: {
        nodes: [
          { id: 'cust_CIF100000', type: 'customer', data: { label: 'Aarav Sharma', subtitle: 'Acc: 89341029384' } },
          { id: 'aadhaar_1111', type: 'aadhaar', data: { label: 'Aadhaar: •••• 1111' } }
        ],
        edges: [{ id: 'e1', source: 'cust_CIF100000', target: 'aadhaar_1111', label: 'USES' }]
      }
    }
  ];

  for (const idDec of identityDecisions) {
    await IdentityDecisionModel.create(idDec);
  }
  console.log(`✅ Seeded Module 3 Identity Swarm Decisions`);

  // 4. Module 4: Seed Recovery Decisions
  const recoveryDecisions = [
    {
      cif: 'CIF100002',
      customerName: 'Vikram Mehta',
      accountNumber: '55441029388',
      recoveryType: 'FORGOT_MPIN',
      timestamp: new Date(),
      recoveryRiskScore: 10,
      decisionAction: 'BRANCH_VERIFICATION_REQUIRED',
      customerFacingMessage: 'Visit Branch',
      reasons: ['CRITICAL: Carrier SIM swap registered within 72 hours. Online self-service recovery disabled. Physical branch verification required.']
    },
    {
      cif: 'CIF100001',
      customerName: 'Priya Patel',
      accountNumber: '77221098431',
      recoveryType: 'CHANGE_MOBILE',
      timestamp: new Date(),
      recoveryRiskScore: 8,
      decisionAction: 'GUARDIAN_APPROVAL_REQUIRED',
      customerFacingMessage: 'Guardian Approval Required',
      reasons: ['MODERATE: Mobile number change request originated from new device routed via VPN network.']
    }
  ];

  for (const rd of recoveryDecisions) {
    await RecoveryDecisionModel.create(rd);
  }
  console.log(`✅ Seeded Module 4 Recovery Shield Decisions`);

  // 5. Module 5: Seed Employee Profiles & Governance Decisions
  const employeeProfiles = [
    {
      employeeId: 'EMP_101',
      employeeName: 'Rohan Sharma',
      role: 'TELLER',
      branchCode: 'BOB_MUMBAI_01',
      branchName: 'Main Branch Mumbai',
      workingHours: { startHour: 9, endHour: 18 }
    },
    {
      employeeId: 'MGR_001',
      employeeName: 'Ananya Verma',
      role: 'BRANCH_MANAGER',
      branchCode: 'BOB_MUMBAI_01',
      branchName: 'Main Branch Mumbai',
      workingHours: { startHour: 8, endHour: 19 }
    }
  ];

  for (const ep of employeeProfiles) {
    await EmployeeProfileModel.updateOne({ employeeId: ep.employeeId }, { $set: ep }, { upsert: true });
  }

  const employeeDecisions = [
    {
      employeeId: 'EMP_101',
      employeeName: 'Rohan Sharma',
      actionType: 'APPROVE_OWN_REQUEST',
      timestamp: new Date(),
      employeeRiskScore: 10,
      decisionAction: 'BLOCK_AND_REVOKE',
      reasons: ['CRITICAL INSIDER THREAT: Employee attempted self-approval of a transaction override. Access blocked immediately.']
    },
    {
      employeeId: 'EMP_101',
      employeeName: 'Rohan Sharma',
      actionType: 'BULK_EXPORT',
      timestamp: new Date(Date.now() - 3600000),
      employeeRiskScore: 7,
      decisionAction: 'FOUR_EYES_REQUIRED',
      reasons: ['FOUR-EYES PRINCIPLE BREACH: Bulk customer export requires secondary Manager sign-off.']
    }
  ];

  for (const ed of employeeDecisions) {
    await EmployeeDecisionModel.create(ed);
    await EmployeeEventModel.create({
      employeeId: ed.employeeId,
      employeeName: ed.employeeName,
      role: 'TELLER',
      branchCode: 'BOB_MUMBAI_01',
      actionType: ed.actionType,
      targetCIF: 'CIF100002',
      targetCustomerName: 'Vikram Mehta',
      targetAccountNumber: '55441029388',
      targetCustomerBranch: 'BOB_MUMBAI_01',
      timestamp: ed.timestamp
    });
  }
  console.log(`✅ Seeded Module 5 Privileged Access Decisions`);

  // 6. Seed Initial Transactions for All Users (including Dev Malhotra)
  const initialTransactions = [
    {
      cif: 'CIF100000',
      customerName: 'Aarav Sharma',
      receiverName: 'Deepak Kumar',
      accountNumber: '89341029384',
      amount: 5000,
      riskScore: 12,
      trustScore: 88,
      action: 'ALLOW',
      status: 'Approved',
      riskFactors: ['Signals within baseline'],
      explanation: 'Regular transfer fits profile verification parameters.'
    },
    {
      cif: 'CIF100001',
      customerName: 'Priya Patel',
      receiverName: 'Nordic Escrow Ltd',
      accountNumber: '77221098431',
      amount: 18500,
      riskScore: 65,
      trustScore: 35,
      action: 'ALERT',
      status: 'CIF_Required',
      riskFactors: ['VPN Exit Node detected', 'High transaction amount ratio'],
      explanation: 'Alert flagged due to VPN routing and unusual location.'
    },
    {
      cif: 'CIF100002',
      customerName: 'Vikram Mehta',
      receiverName: 'Crypto Exchange Escrow',
      accountNumber: '55441029388',
      amount: 25000,
      riskScore: 82,
      trustScore: 18,
      action: 'BLOCK',
      status: 'Rejected_Blocked',
      riskFactors: ['Emulator execution environment', 'SIM Swap within 72h'],
      explanation: 'Transaction blocked due to high-risk emulator environment.'
    },
    {
      cif: 'CIF100003',
      customerName: 'Chitra Saini',
      receiverName: 'IIT Gandhinagar Mess',
      accountNumber: '91028300013',
      amount: 4200,
      riskScore: 8,
      trustScore: 92,
      action: 'ALLOW',
      status: 'Approved',
      riskFactors: ['Standard validation passed'],
      explanation: 'Verified student vendor payment.'
    },
    {
      cif: 'CIF100004',
      customerName: 'Hardik Mathur',
      receiverName: 'Software Services Ltd',
      accountNumber: '91028300014',
      amount: 6500,
      riskScore: 5,
      trustScore: 95,
      action: 'ALLOW',
      status: 'Approved',
      riskFactors: ['Known device and region'],
      explanation: 'Verified corporate payroll transfer.'
    },
    {
      cif: 'CIF100005',
      customerName: 'Siddharth Raut',
      receiverName: 'Gadget Store Online',
      accountNumber: '91028300015',
      amount: 15000,
      riskScore: 52,
      trustScore: 48,
      action: 'ALERT',
      status: 'CIF_Required',
      riskFactors: ['Unusual time window'],
      explanation: 'Secondary verification requested for late-night payment.'
    },
    {
      cif: 'CIF100006',
      customerName: 'Dev Malhotra',
      receiverName: 'Delhi Trading Co',
      accountNumber: '91028300016',
      amount: 7800,
      riskScore: 16,
      trustScore: 84,
      action: 'ALLOW',
      status: 'Approved',
      riskFactors: ['Established low-risk baseline'],
      explanation: 'Standard vendor transaction within customer average.'
    }
  ];

  for (const tx of initialTransactions) {
    const timestamp = new Date().toISOString();
    await dbBridge.addTransaction({ ...tx, timestamp });
    await dbBridge.addAuditLog({
      timestamp,
      user: tx.customerName,
      event: `Transaction evaluated: ₹${tx.amount.toLocaleString()} → ${tx.receiverName} (${tx.status})`,
      riskScore: tx.riskScore,
      trustScore: tx.trustScore,
      riskFactors: tx.riskFactors,
      aiExplanation: tx.explanation,
      decision: tx.action
    });
  }
  console.log(`✅ Seeded Initial Transactions and Audit Logs for All Users`);

  // 7. System Audit Log
  await dbBridge.addAuditLog({
    timestamp: new Date().toISOString(),
    user: 'SACH Kavach Master Seed Service',
    event: 'Bharat Trust Grid Database Seeding Complete',
    riskScore: 0,
    riskFactors: ['System initialized — Baseline operational and clear'],
    decision: 'SYSTEM_READY'
  });

  console.log('=== Database Seeding Finished Successfully ===');
  process.exit(0);
}

seed().catch(err => {
  console.error('Seeding error:', err);
  process.exit(1);
});
