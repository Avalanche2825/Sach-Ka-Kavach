class InMemoryEngine {
  constructor() {
    this.users = [];
    this.guardians = [];
    this.transactions = [];
    this.kycApplications = [];
    this.employeeLogs = [];
    this.auditLogs = [];
    this.tickets = [];
    this.privilegeTokens = [];
    this.hackerDelaySessions = [];

    // Module 1 New collections
    this.customerSessions = [];
    this.devices = [];
    this.locations = [];
    this.trustScores = [];
    this.behaviorModels = [];
    this.behaviorProfiles = [];

    this.seedAll();
  }

  seedAll() {
    console.log("Seeding algorithmically generated BOB SACH Kavach Indian Banking Profile data...");

    // Seed Privilege Tokens
    this.privilegeTokens.push(
      { _id: 'tok_0', employeeId: 'EMP103', employeeName: 'Mohit Verma', scope: 'Database Admin Access', durationMinutes: 120, expiresAt: new Date(Date.now() + 107 * 60 * 1000).toISOString(), status: 'ACTIVE' },
      { _id: 'tok_1', employeeId: 'EMP101', employeeName: 'Sunil Mehta', scope: 'KYC Override Permission', durationMinutes: 30, expiresAt: new Date(Date.now() + 22 * 60 * 1000).toISOString(), status: 'ACTIVE' }
    );

    // 1. Seed 6 Customers
    const names = ["Aarav Sharma", "Priya Patel", "Rohan Verma", "Neha Iyer", "Siddharth Rao", "Anjali Nair"];
    const locations = ["Mumbai, IN", "Delhi, IN", "Bengaluru, IN", "Ahmedabad, IN", "Pune, IN", "Chennai, IN"];
    const devices = ["iPhone 15 (iOS)", "MacBook Pro", "Samsung Galaxy S24", "Google Pixel 8", "Dell Latitude", "iPad Air"];

    for (let i = 0; i < 6; i++) {
      const cif = `CIF10000${i}`;
      const savingsBalance = 50000 + i * 250000;
      const currentBalance = 25000 + i * 300000;
      const balance = savingsBalance + currentBalance;
      const trustScore = i === 1 ? 29 : (55 + i * 8); // Make Priya Patel low trust/high risk for scenario
      const accountNumber = `910283000${10 + i}`;

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

      this.users.push({
        cif,
        name: names[i],
        balance,
        savingsBalance,
        currentBalance,
        accountNumber,
        trustScore,
        currentDevice: devices[i],
        currentIP: `103.88.24.${50 + i}`,
        currentLocation: locations[i],
        loginHistory,
        avgTransactionAmount: 2000 + i * 16600, // ₹2,000 to ₹85,000
        dailyAverageAmount: 5000 + i * 39000, // ₹5,000 to ₹2,00,000
        accessFrequency: 5 + i * 2
      });

      // Also seed active customer sessions
      this.customerSessions.push({
        cif,
        sessionId: `sess_${cif}`,
        username: names[i],
        loginTimestamp: new Date(Date.now() - i * 3600 * 1000).toISOString(),
        ipAddress: `103.88.24.${50 + i}`,
        deviceFingerprint: `DEV_FING_BOB_${100 + i}`,
        deviceDetails: devices[i],
        isActive: true,
        riskScore: 100 - trustScore
      });
    }

    // 2. Seed 2 Guardians
    this.guardians.push(
      { cif: 'CIF100000', guardianName: 'Sunil Sharma', relationship: 'Father', phone: '+91 9988776655' },
      { cif: 'CIF100001', guardianName: 'Kiran Patel', relationship: 'Mother', phone: '+91 9988776644' }
    );

    // 3. Seed 8 Transactions
    const receivers = ["Deepak Kumar", "Vijay Singh", "Rajesh Gupta", "Sunita Nair", "Vikram Mehta", "Meera Das", "Ravi Pillai", "Aisha Bose"];
    const statuses = ['Approved', 'OTP_Required', 'CIF_Required', 'Guardian_Required', 'Approved', 'OTP_Required', 'CIF_Required', 'Guardian_Required'];

    for (let i = 0; i < 8; i++) {
      const uIdx = i % 6;
      this.transactions.push({
        _id: `tx_offline_${100 + i}`,
        timestamp: new Date(Date.now() - i * 12 * 3600 * 1000).toISOString(),
        cif: this.users[uIdx].cif,
        customerName: this.users[uIdx].name,
        receiverName: receivers[i],
        accountNumber: `910283000${20 + i}`,
        amount: 5000 + i * 25000,
        riskScore: uIdx === 1 ? 71 : (10 + i * 11),
        riskFactors: i % 2 === 0 ? [] : ['Anomalous Amount Ratio', 'New Device Location Check'],
        explanation: 'Regular transfer fits profile verification parameters.',
        status: statuses[i]
      });
    }

    // 4. Seed 5 KYC Applications
    this.kycApplications.push(
      { _id: 'kyc_0', timestamp: new Date().toISOString(), name: 'Kabir Sen', aadhaar: '321098765432', pan: 'ABCDE1234F', deviceFingerprint: 'DEV_FING_991', ipAddress: '103.88.24.11', status: 'Approved', suspiciousMatches: [] },
      { _id: 'kyc_1', timestamp: new Date().toISOString(), name: 'Neha Das', aadhaar: '321098765433', pan: 'ABCDE1234G', deviceFingerprint: 'DEV_FING_992', ipAddress: '103.88.24.12', status: 'Approved', suspiciousMatches: [] },
      { _id: 'kyc_2', timestamp: new Date().toISOString(), name: 'Suresh Bose', aadhaar: '321098765434', pan: 'ABCDE1234H', deviceFingerprint: 'DEV_FING_993', ipAddress: '103.88.24.13', status: 'Approved', suspiciousMatches: [] },
      { _id: 'kyc_3', timestamp: new Date().toISOString(), name: 'Fraudster One', aadhaar: '999998765432', pan: 'FGHIJ1234K', deviceFingerprint: 'DEV_FING_SHARED', ipAddress: '103.88.24.99', status: 'Flagged', suspiciousMatches: ['Device fingerprint shared across multiple applications — fraud ring signal'] },
      { _id: 'kyc_4', timestamp: new Date().toISOString(), name: 'Fraudster Two', aadhaar: '999998765432', pan: 'FGHIJ1234L', deviceFingerprint: 'DEV_FING_SHARED', ipAddress: '103.88.24.99', status: 'Flagged', suspiciousMatches: ['Duplicate Aadhaar found linked to another application'] }
    );

    // 5. Seed 12 Employee Logs
    for (let i = 0; i < 12; i++) {
      const isCritical = i % 3 === 0;
      this.employeeLogs.push({
        _id: `emp_log_${i}`,
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

    // 6. Seed 20 Audit Logs
    const decisions = ['LOGGED', 'ESCALATED_TO_SOC', 'REJECTED_AND_BLOCKED', 'APPROVED_POST_VERIFICATION', 'GUARDIAN_ENROLLED'];
    for (let i = 0; i < 20; i++) {
      this.auditLogs.push({
        _id: `audit_log_${i}`,
        timestamp: new Date(Date.now() - i * 6 * 3600 * 1000).toISOString(),
        user: i % 2 === 0 ? 'SACH Kavach Security Grid' : 'Operations Audit Officer',
        event: `Transaction risk evaluation check processed for CIF10000${i % 6}`,
        riskScore: 10 + i * 4,
        riskFactors: i % 3 === 0 ? ['High transaction ratio'] : [],
        decision: decisions[i % decisions.length]
      });
    }
  }
}

export const inMemoryDB = new InMemoryEngine();
export default inMemoryDB;
