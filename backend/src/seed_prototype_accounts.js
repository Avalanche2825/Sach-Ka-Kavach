import dotenv from 'dotenv';
import mongoose from 'mongoose';
import UserModel from './models/User.js';
import AuditLogModel from './models/AuditLog.js';
import CustomerSessionModel from './models/CustomerSession.js';
import BehaviorProfileModel from './models/BehaviorProfile.js';
import { hashPassword } from './utils/password.js';

dotenv.config();

const accounts = [
  ['Aarav Sharma', 'CIF100000', 'Aarav@2026', 12, 18, 'Chrome on Windows', 'Mumbai, Maharashtra', '103.88.24.12', 88, 5000],
  ['Chitra Saini', 'CIF100001', 'Chitra@2026', 9, 17, 'Safari on macOS', 'Gandhinagar, Gujarat', '14.139.122.1', 91, 4200],
  ['Nisha Rao', 'CIF100002', 'Nisha@2026', 18, 22, 'Chrome on Android', 'Bengaluru, Karnataka', '49.36.118.2', 86, 6200],
  ['Dev Malhotra', 'CIF100003', 'Dev@2026', 7, 11, 'Edge on Windows', 'Delhi, NCR', '103.19.71.6', 84, 7800],
  ['Priya Patel', 'CIF100004', 'Priya@2026', 10, 16, 'Chrome on Android', 'Ahmedabad, Gujarat', '103.88.24.44', 70, 18000],
  ['Rohan Verma', 'CIF100005', 'Rohan@2026', 13, 19, 'Firefox on Windows', 'Pune, Maharashtra', '49.36.12.89', 65, 22000],
  ['Isha Kapoor', 'CIF100006', 'Isha@2026', 11, 17, 'Safari on iOS', 'Jaipur, Rajasthan', '117.218.3.11', 62, 15000],
  ['Vikram Mehta', 'CIF100007', 'Vikram@2026', 12, 18, 'Chrome on Android', 'Delhi, NCR', '45.12.89.2', 35, 12000],
  ['Satish Kumar', 'CIF100008', 'Satish@2026', 8, 14, 'Chrome on Windows', 'Lucknow, Uttar Pradesh', '106.51.88.17', 30, 9500],
  ['Meera Joshi', 'CIF100009', 'Meera@2026', 14, 20, 'Samsung Internet on Android', 'Chennai, Tamil Nadu', '117.194.66.24', 22, 11000],
];

const uri = process.env.MONGODB_URI;
if (!uri) throw new Error('MONGODB_URI is required.');
if (process.env.CONFIRM_PROTOTYPE_RESET !== 'true') {
  throw new Error('Set CONFIRM_PROTOTYPE_RESET=true to reset the prototype database.');
}

await mongoose.connect(uri);
const expectedDatabase = process.env.PROTOTYPE_DATABASE_NAME || 'sach_kavach_prototype';
if (mongoose.connection.name !== expectedDatabase) {
  throw new Error(`Refusing reset: database must be ${expectedDatabase} (received ${mongoose.connection.name}).`);
}

// This database is dedicated to the prototype and is guarded by both the
// confirmation flag and exact database-name check above.
await mongoose.connection.db.dropDatabase();
const now = new Date().toISOString();
const users = accounts.map(([name, cif, password, start, end, browser, region, ip, trustScore, average], index) => ({
  cif, name, username: name, passwordHash: hashPassword(password), role: 'customer',
  balance: 125000 + index * 85000, trustScore, currentDevice: browser, currentIP: ip,
  currentLocation: region, avgTransactionAmount: average, dailyAverageAmount: average * 4,
  accessFrequency: 8 + index, isSimSwapWithin72h: cif === 'CIF100007', loginHistory: [{ timestamp: now, ip, location: region, device: browser, isNewDevice: false }],
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
await UserModel.insertMany([...users, ...portalUsers]);
const baselineSessions = users.flatMap((user, userIndex) => Array.from({ length: 72 }, (_, sessionIndex) => {
  const start = user.baseline.usualLoginStartHour;
  const end = user.baseline.usualLoginEndHour;
  const span = Math.max(1, end - start);
  const hour = start + (sessionIndex % span);
  const timestamp = new Date(Date.UTC(2026, 4, 20 + Math.floor(sessionIndex / 2), hour, (sessionIndex * 7) % 60));
  return {
    sessionId: `baseline_${user.cif}_${sessionIndex}`, cif: user.cif, loginTimestamp: timestamp,
    typingVariance: 18 + userIndex * 2 + (sessionIndex % 4), typingSpeedAvg: 190 + userIndex * 11 + (sessionIndex % 5) * 3,
    navigationDepth: 3 + (sessionIndex % 3), actionsPerMinute: 8 + userIndex + (sessionIndex % 4),
    idlePeriods: sessionIndex % 2, copyPasteDetected: false, correlationId: `seed-${user.cif}`,
  };
}));
await CustomerSessionModel.insertMany(baselineSessions);
await BehaviorProfileModel.insertMany(users.map((user, userIndex) => ({
  cif: user.cif, sessionCount: 72, profileConfidence: 0.9, profileState: 'MATURE', modelUsed: 'Personal + Global',
  averageLoginHour: (user.baseline.usualLoginStartHour + user.baseline.usualLoginEndHour) / 2,
  preferredLoginWindows: [{ start: user.baseline.usualLoginStartHour, end: user.baseline.usualLoginEndHour, weight: 1 }],
  averageTypingSpeed: 190 + userIndex * 11 + 6, averageTypingVariance: 19.5 + userIndex * 2,
  averageNavigationDepth: 4, averageActionsPerMinute: 9.5 + userIndex,
  averageTransactionAmount: user.avgTransactionAmount, trustedDevices: [user.baseline.knownDeviceHash],
  trustedLocations: [user.baseline.knownRegion], recentNetworks: [user.baseline.knownIp], lastModelTraining: new Date(),
})));
await AuditLogModel.insertMany(users.map((user) => ({
  _id: `audit_seed_${user.cif}`, timestamp: now, user: 'Prototype Seed Engine', riskScore: 100 - user.trustScore,
  event: `Baseline profile registered for ${user.cif}: ${user.baseline.usualLoginStartHour}:00-${user.baseline.usualLoginEndHour}:00, ${user.baseline.knownRegion}`,
  riskFactors: ['Synthetic prototype baseline'], decision: 'BASELINE_REGISTERED',
})));
console.log(`Seeded ${users.length} prototype accounts in ${mongoose.connection.name}.`);
await mongoose.disconnect();
