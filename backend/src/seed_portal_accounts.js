import dotenv from 'dotenv';
import mongoose from 'mongoose';
import UserModel from './models/User.js';
import { hashPassword } from './utils/password.js';

dotenv.config();
if (!process.env.MONGODB_URI) throw new Error('MONGODB_URI is required.');

await mongoose.connect(process.env.MONGODB_URI);
const users = [
  { cif: 'EMP101', name: 'Raman Murthy', username: 'Raman Murthy', password: 'Staff@123', role: 'staff' },
  { cif: 'EMP102', name: 'Fraud Ops Analyst', username: 'Fraud Ops Analyst', password: 'Soc@123', role: 'soc' },
  { cif: 'CIF000', name: 'System Administrator', username: 'admin', password: 'Admin@123', role: 'admin' },
];

for (const user of users) {
  await UserModel.updateOne({ cif: user.cif }, {
    $set: {
      name: user.name, username: user.username, passwordHash: hashPassword(user.password), role: user.role,
      balance: 0, trustScore: 100, currentDevice: 'Bank managed workstation', currentIP: '10.10.0.10',
      currentLocation: 'Bank of Baroda Operations Centre', avgTransactionAmount: 0, dailyAverageAmount: 0, accessFrequency: 0,
      loginHistory: [], baseline: { usualLoginStartHour: 9, usualLoginEndHour: 18, knownBrowser: 'Chrome', knownDeviceHash: `device_${user.cif}`, knownRegion: 'Operations Centre', knownIp: '10.10.0.10' },
    },
  }, { upsert: true });
}
console.log(`Upserted ${users.length} portal accounts in ${mongoose.connection.name}.`);
await mongoose.disconnect();
