export interface UserSession {
  cif: string;
  name: string;
  balance: number;
  trustScore: number;
  currentDevice: string;
  currentIP: string;
  currentLocation: string;
  loginHistory: LoginEntry[];
  avgTransactionAmount: number;
  dailyAverageAmount: number;
  accessFrequency: number; // logins per week
  accountNumber?: string;
  savingsBalance?: number;
  currentBalance?: number;
  isSimSwapWithin72h?: boolean;
  behaviorProfile?: any;
}

export interface LoginEntry {
  timestamp: string;
  ip: string;
  location: string;
  device: string;
  isNewDevice: boolean;
}

export interface Guardian {
  cif: string;
  guardianName: string;
  relationship: string;
  phone: string;
}

export interface Transaction {
  _id: string;
  timestamp: string;
  cif: string;
  customerName: string;
  receiverName: string;
  accountNumber: string;
  amount: number;
  riskScore: number;
  riskFactors: string[];
  explanation: string;
  status: 'Pending' | 'Approved' | 'Rejected' | 'OTP_Required' | 'CIF_Required' | 'Guardian_Required';
}

export interface Device {
  ipAddress: string;
  browser: string;
  operatingSystem: string;
  deviceFingerprint: string;
  isEmulator: boolean;
  detectedAt: string;
  trustScore: number;
}

export interface KYCApplication {
  _id: string;
  cif?: string;
  timestamp: string;
  name: string;
  aadhaar: string;
  pan: string;
  deviceFingerprint: string;
  ipAddress: string;
  status: 'Approved' | 'Flagged' | 'Pending';
  suspiciousMatches: string[];
}

export interface EmployeeLog {
  _id: string;
  timestamp: string;
  employeeId: string;
  employeeName: string;
  action: string;
  customerCIF?: string;
  outsideHours: boolean;
  actionRiskScore: number;
  managerApproved: boolean;
  requiresManagerApproval: boolean;
}

export interface AuditLog {
  _id: string;
  timestamp: string;
  user: string;
  event: string;
  riskScore: number;
  riskFactors: string[];
  decision: string;
}

export interface FraudScenario {
  id: string;
  name: string;
  description: string;
}

export interface SupportTicket {
  _id: string;
  cif: string;
  customerName: string;
  query: string;
  otp: string;
  otpVerified: boolean;
  status: 'PENDING_OTP' | 'AUTHORIZED' | 'EXPIRED' | 'RESOLVED';
  createdAt: string;
}
