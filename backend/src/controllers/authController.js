import jwt from 'jsonwebtoken';
import UserModel from '../models/User.js';
import * as dbBridge from '../utils/dbBridge.js';
import { verifyPassword } from '../utils/password.js';

const JWT_SECRET = process.env.JWT_SECRET || 'SACH_Kavach_2026';

export const loginUser = async (req, res) => {
  try {
    const { username, cif, password } = req.body;
    const searchCif = cif || username;
    const searchUsername = username || cif;
    if (!searchCif || !password) {
      return res.status(400).json({ error: 'CIF, Username, and password are required' });
    }

    const account = await UserModel.findOne({
      $or: [
        { cif: searchCif },
        { username: searchUsername },
        { username: new RegExp(`^${searchUsername.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') }
      ]
    }).select('+passwordHash');
    if (!account || !verifyPassword(password, account.passwordHash)) {
      return res.status(401).json({ error: 'Invalid account credentials' });
    }

    const hour = Number(new Intl.DateTimeFormat('en-IN', {
      timeZone: 'Asia/Kolkata', hour: '2-digit', hourCycle: 'h23'
    }).format(new Date()));
    const baseline = account.baseline || {};
    const isUnusualTime = Number.isFinite(baseline.usualLoginStartHour)
      && (hour < baseline.usualLoginStartHour || hour >= baseline.usualLoginEndHour);
    const browser = req.headers['user-agent'] || 'Unknown browser';
    const browserMismatch = baseline.knownBrowser
      && !browser.toLowerCase().includes(baseline.knownBrowser.split(' ')[0].toLowerCase());
    const riskScore = Math.min(100, (isUnusualTime ? 25 : 0) + (browserMismatch ? 15 : 0));
    const action = riskScore <= 19 ? 'ALLOW' : riskScore <= 39 ? 'OTP_REQUIRED' : riskScore <= 59 ? 'ALERT' : riskScore <= 79 ? 'HOLD' : 'BLOCK';

    await dbBridge.addAuditLog({
      timestamp: new Date().toISOString(), user: account.cif, riskScore, decision: action,
      event: `Login evaluated for ${account.cif} at ${hour}:00 IST`,
      riskFactors: [
        ...(isUnusualTime ? [`Login outside baseline ${baseline.usualLoginStartHour}:00-${baseline.usualLoginEndHour}:00 IST`] : []),
        ...(browserMismatch ? ['Browser differs from stored baseline'] : []),
        ...(!isUnusualTime && !browserMismatch ? ['Known login baseline matched'] : []),
      ],
    });

    const token = jwt.sign(
      { username: account.username, cif: account.cif, role: account.role },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({ token, username: account.username, cif: account.cif, role: account.role, riskScore, action });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
