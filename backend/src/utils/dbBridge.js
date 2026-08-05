import mongoose from 'mongoose';
import UserModel from '../models/User.js';
import GuardianModel from '../models/Guardian.js';
import TransactionModel from '../models/Transaction.js';
import KYCApplicationModel from '../models/KYCApplication.js';
import EmployeeLogModel from '../models/EmployeeLog.js';
import AuditLogModel from '../models/AuditLog.js';
import CustomerSessionModel from '../models/CustomerSession.js';
import DeviceModel from '../models/Device.js';
import LocationModel from '../models/Location.js';
import TrustScoreModel from '../models/TrustScore.js';
import BehaviorModelModel from '../models/BehaviorModel.js';
import BehaviorProfileModel from '../models/BehaviorProfile.js';
import DeviceProfileModel from '../models/DeviceProfile.js';
import DeviceEventModel from '../models/DeviceEvent.js';
import DeviceDecisionModel from '../models/DeviceDecision.js';
import DeviceModelModel from '../models/DeviceModel.js';
import { inMemoryDB } from './inMemoryDB.js';

export const getCustomers = async () => {
  if (mongoose.connection.readyState === 1) {
    try {
      const docs = await UserModel.find();
      return docs;
    } catch (e) {
      console.warn("Mongo connection failed, falling back to memory:", e);
    }
  }
  return inMemoryDB.users;
};

export const getCustomer = async (cif) => {
  if (mongoose.connection.readyState === 1) {
    try {
      const doc = await UserModel.findOne({ cif });
      if (doc) return doc;
    } catch (e) {
      console.warn("Mongo connection failed, falling back to memory:", e);
    }
  }
  return inMemoryDB.users.find(u => u.cif === cif) || null;
};

export const updateCustomer = async (cif, updateData) => {
  if (mongoose.connection.readyState === 1) {
    try {
      await UserModel.updateOne({ cif }, { $set: updateData });
      return;
    } catch (e) {
      console.warn("Mongo connection failed, falling back to memory:", e);
    }
  }
  const idx = inMemoryDB.users.findIndex(u => u.cif === cif);
  if (idx !== -1) {
    inMemoryDB.users[idx] = { ...inMemoryDB.users[idx], ...updateData };
  }
};

export const addCustomer = async (cust) => {
  if (mongoose.connection.readyState === 1) {
    try {
      const doc = new UserModel(cust);
      await doc.save();
      return doc;
    } catch (e) {
      console.warn("Mongo connection failed, falling back to memory:", e);
    }
  }
  inMemoryDB.users.push(cust);
  return cust;
};

export const getGuardians = async (cif) => {
  if (mongoose.connection.readyState === 1) {
    try {
      const query = cif ? { cif } : {};
      return await GuardianModel.find(query);
    } catch (e) {
      console.warn("Mongo connection failed, falling back to memory:", e);
    }
  }
  return cif ? inMemoryDB.guardians.filter(g => g.cif === cif) : inMemoryDB.guardians;
};

export const addGuardian = async (g) => {
  if (mongoose.connection.readyState === 1) {
    try {
      const doc = new GuardianModel(g);
      await doc.save();
      return;
    } catch (e) {
      console.warn("Mongo connection failed, falling back to memory:", e);
    }
  }
  inMemoryDB.guardians.push(g);
};

export const getTransactions = async (cif) => {
  if (mongoose.connection.readyState === 1) {
    try {
      const query = cif ? { cif } : {};
      const docs = await TransactionModel.find(query).sort({ timestamp: -1 });
      return docs;
    } catch (e) {
      console.warn("Mongo connection failed, falling back to memory:", e);
    }
  }
  const filtered = cif ? inMemoryDB.transactions.filter(t => t.cif === cif) : inMemoryDB.transactions;
  return [...filtered].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
};

export const addTransaction = async (tx) => {
  const newTx = { ...tx, _id: `tx_${Date.now()}` };
  if (mongoose.connection.readyState === 1) {
    try {
      const doc = new TransactionModel(newTx);
      await doc.save();
      return doc;
    } catch (e) {
      console.warn("Mongo connection failed, falling back to memory:", e);
    }
  }
  inMemoryDB.transactions.unshift(newTx);
  return newTx;
};

export const getKYCApplications = async () => {
  if (mongoose.connection.readyState === 1) {
    try {
      const docs = await KYCApplicationModel.find();
      if (docs && docs.length > 0) return docs;
    } catch (e) {
      console.warn("Mongo connection failed, falling back to memory:", e);
    }
  }
  return inMemoryDB.kycApplications;
};

export const addKYCApplication = async (app) => {
  const newApp = { ...app, _id: `kyc_${Date.now()}` };
  if (mongoose.connection.readyState === 1) {
    try {
      const doc = new KYCApplicationModel(newApp);
      await doc.save();
      return doc;
    } catch (e) {
      console.warn("Mongo connection failed, falling back to memory:", e);
    }
  }
  inMemoryDB.kycApplications.unshift(newApp);
  return newApp;
};

export const getEmployeeLogs = async () => {
  if (mongoose.connection.readyState === 1) {
    try {
      const docs = await EmployeeLogModel.find().sort({ timestamp: -1 });
      if (docs && docs.length > 0) return docs;
    } catch (e) {
      console.warn("Mongo connection failed, falling back to memory:", e);
    }
  }
  return [...inMemoryDB.employeeLogs].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
};

export const addEmployeeLog = async (log) => {
  const newLog = { ...log, _id: `emp_${Date.now()}` };
  if (mongoose.connection.readyState === 1) {
    try {
      const doc = new EmployeeLogModel(newLog);
      await doc.save();
      return doc;
    } catch (e) {
      console.warn("Mongo connection failed, falling back to memory:", e);
    }
  }
  inMemoryDB.employeeLogs.unshift(newLog);
  return newLog;
};

export const getAuditLogs = async () => {
  if (mongoose.connection.readyState === 1) {
    try {
      const docs = await AuditLogModel.find().sort({ timestamp: -1 });
      return docs;
    } catch (e) {
      console.warn("Mongo connection failed, falling back to memory:", e);
    }
  }
  return [...inMemoryDB.auditLogs].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
};

export const addAuditLog = async (log) => {
  const newLog = { ...log, _id: `audit_${Date.now()}` };
  if (mongoose.connection.readyState === 1) {
    try {
      const doc = new AuditLogModel(newLog);
      await doc.save();
      return doc;
    } catch (e) {
      console.warn("Mongo connection failed, falling back to memory:", e);
    }
  }
  inMemoryDB.auditLogs.unshift(newLog);
  return newLog;
};

export const getTickets = async () => {
  return inMemoryDB.tickets;
};

export const addTicket = async (ticket) => {
  const newTicket = {
    ...ticket,
    _id: `ticket_${Date.now()}`,
    status: ticket.status || 'PENDING_OTP',
    otpVerified: ticket.otpVerified || false,
    createdAt: new Date().toISOString()
  };
  inMemoryDB.tickets.unshift(newTicket);
  return newTicket;
};

export const updateTicket = async (id, updateData) => {
  const idx = inMemoryDB.tickets.findIndex(t => t._id === id);
  if (idx !== -1) {
    inMemoryDB.tickets[idx] = { ...inMemoryDB.tickets[idx], ...updateData };
    return inMemoryDB.tickets[idx];
  }
  return null;
};

export const getPrivilegeTokens = async () => {
  return inMemoryDB.privilegeTokens || [];
};

export const addPrivilegeToken = async (tok) => {
  const newTok = {
    ...tok,
    _id: `tok_${Date.now()}`,
    status: 'ACTIVE',
    expiresAt: new Date(Date.now() + tok.durationMinutes * 60 * 1000).toISOString()
  };
  inMemoryDB.privilegeTokens.unshift(newTok);
  return newTok;
};

export const getHackerDelaySessions = async () => {
  return inMemoryDB.hackerDelaySessions || [];
};

export const addHackerDelaySession = async (sess) => {
  const newSess = {
    ...sess,
    _id: `hds_${Date.now()}`,
    detectedAt: new Date().toISOString(),
    fraudTeamNotified: true,
  };
  inMemoryDB.hackerDelaySessions.unshift(newSess);
  return newSess;
};

// --- Module 1 New Helpers ---

// Sessions
export const getCustomerSessions = async (cif) => {
  if (mongoose.connection.readyState === 1) {
    try {
      return await CustomerSessionModel.find({ cif }).sort({ loginTimestamp: -1 });
    } catch (e) {
      console.warn("Mongo connection failed, falling back to memory:", e);
    }
  }
  return inMemoryDB.customerSessions.filter(s => s.cif === cif).sort((a, b) => new Date(b.loginTimestamp).getTime() - new Date(a.loginTimestamp).getTime());
};

export const addCustomerSession = async (sess) => {
  if (mongoose.connection.readyState === 1) {
    try {
      const doc = new CustomerSessionModel(sess);
      await doc.save();
      return doc;
    } catch (e) {
      console.warn("Mongo connection failed, falling back to memory:", e);
    }
  }
  inMemoryDB.customerSessions.unshift(sess);
  return sess;
};

// Devices
export const getDevices = async (cif) => {
  if (mongoose.connection.readyState === 1) {
    try {
      return await DeviceModel.find({ cif });
    } catch (e) {
      console.warn("Mongo connection failed, falling back to memory:", e);
    }
  }
  return inMemoryDB.devices.filter(d => d.cif === cif);
};

export const getDeviceByHash = async (cif, deviceHash) => {
  if (mongoose.connection.readyState === 1) {
    try {
      return await DeviceModel.findOne({ cif, deviceHash });
    } catch (e) {
      console.warn("Mongo connection failed, falling back to memory:", e);
    }
  }
  return inMemoryDB.devices.find(d => d.cif === cif && d.deviceHash === deviceHash) || null;
};

export const addDevice = async (device) => {
  if (mongoose.connection.readyState === 1) {
    try {
      const doc = new DeviceModel(device);
      await doc.save();
      return doc;
    } catch (e) {
      console.warn("Mongo connection failed, falling back to memory:", e);
    }
  }
  inMemoryDB.devices.push(device);
  return device;
};

export const updateDevice = async (cif, deviceHash, updateData) => {
  if (mongoose.connection.readyState === 1) {
    try {
      await DeviceModel.updateOne({ cif, deviceHash }, { $set: updateData });
      return;
    } catch (e) {
      console.warn("Mongo connection failed, falling back to memory:", e);
    }
  }
  const idx = inMemoryDB.devices.findIndex(d => d.cif === cif && d.deviceHash === deviceHash);
  if (idx !== -1) {
    inMemoryDB.devices[idx] = { ...inMemoryDB.devices[idx], ...updateData };
  }
};

// Locations
export const getLocation = async (cif) => {
  if (mongoose.connection.readyState === 1) {
    try {
      return await LocationModel.findOne({ cif });
    } catch (e) {
      console.warn("Mongo connection failed, falling back to memory:", e);
    }
  }
  return inMemoryDB.locations.find(l => l.cif === cif) || null;
};

export const addLocation = async (loc) => {
  if (mongoose.connection.readyState === 1) {
    try {
      const doc = new LocationModel(loc);
      await doc.save();
      return doc;
    } catch (e) {
      console.warn("Mongo connection failed, falling back to memory:", e);
    }
  }
  inMemoryDB.locations.push(loc);
  return loc;
};

export const updateLocation = async (cif, updateData) => {
  if (mongoose.connection.readyState === 1) {
    try {
      await LocationModel.updateOne({ cif }, { $set: updateData });
      return;
    } catch (e) {
      console.warn("Mongo connection failed, falling back to memory:", e);
    }
  }
  const idx = inMemoryDB.locations.findIndex(l => l.cif === cif);
  if (idx !== -1) {
    inMemoryDB.locations[idx] = { ...inMemoryDB.locations[idx], ...updateData };
  }
};

// Trust Scores
export const getTrustScores = async (cif) => {
  if (mongoose.connection.readyState === 1) {
    try {
      return await TrustScoreModel.find({ cif }).sort({ timestamp: -1 });
    } catch (e) {
      console.warn("Mongo connection failed, falling back to memory:", e);
    }
  }
  return inMemoryDB.trustScores.filter(s => s.cif === cif).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
};

export const addTrustScore = async (score) => {
  if (mongoose.connection.readyState === 1) {
    try {
      const doc = new TrustScoreModel(score);
      await doc.save();
      return doc;
    } catch (e) {
      console.warn("Mongo connection failed, falling back to memory:", e);
    }
  }
  inMemoryDB.trustScores.unshift(score);
  return score;
};

// Behavior Models
export const getBehaviorModel = async (cif) => {
  if (mongoose.connection.readyState === 1) {
    try {
      return await BehaviorModelModel.findOne({ cif });
    } catch (e) {
      console.warn("Mongo connection failed, falling back to memory:", e);
    }
  }
  return inMemoryDB.behaviorModels.find(m => m.cif === cif) || null;
};

export const addBehaviorModel = async (model) => {
  if (mongoose.connection.readyState === 1) {
    try {
      const doc = new BehaviorModelModel(model);
      await doc.save();
      return doc;
    } catch (e) {
      console.warn("Mongo connection failed, falling back to memory:", e);
    }
  }
  inMemoryDB.behaviorModels.push(model);
  return model;
};

export const updateBehaviorModel = async (cif, updateData) => {
  if (mongoose.connection.readyState === 1) {
    try {
      await BehaviorModelModel.updateOne({ cif }, { $set: updateData });
      return;
    } catch (e) {
      console.warn("Mongo connection failed, falling back to memory:", e);
    }
  }
  const idx = inMemoryDB.behaviorModels.findIndex(m => m.cif === cif);
  if (idx !== -1) {
    inMemoryDB.behaviorModels[idx] = { ...inMemoryDB.behaviorModels[idx], ...updateData };
  }
};

// Behavior Profiles
export const getBehaviorProfile = async (cif) => {
  if (mongoose.connection.readyState === 1) {
    try {
      return await BehaviorProfileModel.findOne({ cif });
    } catch (e) {
      console.warn("Mongo connection failed, falling back to memory:", e);
    }
  }
  return inMemoryDB.behaviorProfiles.find(p => p.cif === cif) || null;
};

export const addBehaviorProfile = async (profile) => {
  if (mongoose.connection.readyState === 1) {
    try {
      const doc = new BehaviorProfileModel(profile);
      await doc.save();
      return doc;
    } catch (e) {
      console.warn("Mongo connection failed, falling back to memory:", e);
    }
  }
  inMemoryDB.behaviorProfiles.push(profile);
  return profile;
};

export const updateBehaviorProfile = async (cif, updateData) => {
  if (mongoose.connection.readyState === 1) {
    try {
      await BehaviorProfileModel.updateOne({ cif }, { $set: updateData });
      return;
    } catch (e) {
      console.warn("Mongo connection failed, falling back to memory:", e);
    }
  }
  const idx = inMemoryDB.behaviorProfiles.findIndex(p => p.cif === cif);
  if (idx !== -1) {
    inMemoryDB.behaviorProfiles[idx] = { ...inMemoryDB.behaviorProfiles[idx], ...updateData };
  }
};

// ── Module 2: Device & Access Intelligence Bridge Methods ───────────────────

export const getDeviceProfile = async (cif) => {
  if (mongoose.connection.readyState === 1) {
    try {
      return await DeviceProfileModel.findOne({ cif });
    } catch (e) {
      console.warn("Mongo query failed, falling back to memory:", e.message);
    }
  }
  if (!inMemoryDB.deviceProfiles) inMemoryDB.deviceProfiles = [];
  return inMemoryDB.deviceProfiles.find(p => p.cif === cif) || null;
};

export const getDeviceProfileByAccountOrCIF = async (identifier) => {
  if (mongoose.connection.readyState === 1) {
    try {
      const doc = await DeviceProfileModel.findOne({
        $or: [{ cif: identifier }, { accountNumber: identifier }]
      });
      if (doc) return doc;
    } catch (e) {
      console.warn("Mongo query failed, falling back to memory:", e.message);
    }
  }
  if (!inMemoryDB.deviceProfiles) inMemoryDB.deviceProfiles = [];
  return inMemoryDB.deviceProfiles.find(p => p.cif === identifier || p.accountNumber === identifier) || null;
};

export const addDeviceProfile = async (profile) => {
  if (mongoose.connection.readyState === 1) {
    try {
      const doc = new DeviceProfileModel(profile);
      await doc.save();
      return doc;
    } catch (e) {
      console.warn("Mongo write failed, falling back to memory:", e.message);
    }
  }
  if (!inMemoryDB.deviceProfiles) inMemoryDB.deviceProfiles = [];
  inMemoryDB.deviceProfiles.push(profile);
  return profile;
};

export const updateDeviceProfile = async (cif, updateData) => {
  if (mongoose.connection.readyState === 1) {
    try {
      await DeviceProfileModel.updateOne({ cif }, { $set: updateData });
      return;
    } catch (e) {
      console.warn("Mongo update failed, falling back to memory:", e.message);
    }
  }
  if (!inMemoryDB.deviceProfiles) inMemoryDB.deviceProfiles = [];
  const idx = inMemoryDB.deviceProfiles.findIndex(p => p.cif === cif);
  if (idx !== -1) {
    inMemoryDB.deviceProfiles[idx] = { ...inMemoryDB.deviceProfiles[idx], ...updateData };
  }
};

export const addDeviceEvent = async (event) => {
  if (mongoose.connection.readyState === 1) {
    try {
      const doc = new DeviceEventModel(event);
      await doc.save();
      return doc;
    } catch (e) {
      console.warn("Mongo write failed, falling back to memory:", e.message);
    }
  }
  if (!inMemoryDB.deviceEvents) inMemoryDB.deviceEvents = [];
  inMemoryDB.deviceEvents.push(event);
  return event;
};

export const getLastDeviceEvent = async (cif) => {
  if (mongoose.connection.readyState === 1) {
    try {
      return await DeviceEventModel.findOne({ cif }).sort({ timestamp: -1 });
    } catch (e) {
      console.warn("Mongo query failed, falling back to memory:", e.message);
    }
  }
  if (!inMemoryDB.deviceEvents) inMemoryDB.deviceEvents = [];
  const userEvents = inMemoryDB.deviceEvents.filter(e => e.cif === cif);
  return userEvents.length > 0 ? userEvents[userEvents.length - 1] : null;
};

export const getDeviceAccessVelocity = async (cif, windowMinutes = 15) => {
  const since = new Date(Date.now() - windowMinutes * 60 * 1000);
  if (mongoose.connection.readyState === 1) {
    try {
      return await DeviceEventModel.countDocuments({ cif, timestamp: { $gte: since } });
    } catch (e) {
      console.warn("Mongo count failed, falling back to memory:", e.message);
    }
  }
  if (!inMemoryDB.deviceEvents) inMemoryDB.deviceEvents = [];
  return inMemoryDB.deviceEvents.filter(e => e.cif === cif && new Date(e.timestamp) >= since).length;
};

export const getDeviceEventsByAccountOrCIF = async (identifier) => {
  if (mongoose.connection.readyState === 1) {
    try {
      return await DeviceEventModel.find({
        $or: [{ cif: identifier }, { accountNumber: identifier }]
      }).sort({ timestamp: -1 }).limit(30);
    } catch (e) {
      console.warn("Mongo query failed, falling back to memory:", e.message);
    }
  }
  if (!inMemoryDB.deviceEvents) inMemoryDB.deviceEvents = [];
  return inMemoryDB.deviceEvents
    .filter(e => e.cif === identifier || e.accountNumber === identifier)
    .reverse()
    .slice(0, 30);
};

export const getGlobalDeviceEvents = async () => {
  if (mongoose.connection.readyState === 1) {
    try {
      return await DeviceEventModel.find().sort({ timestamp: -1 }).limit(50);
    } catch (e) {
      console.warn("Mongo query failed, falling back to memory:", e.message);
    }
  }
  if (!inMemoryDB.deviceEvents) inMemoryDB.deviceEvents = [];
  return [...inMemoryDB.deviceEvents].reverse().slice(0, 50);
};

export const addDeviceDecision = async (decision) => {
  if (mongoose.connection.readyState === 1) {
    try {
      const doc = new DeviceDecisionModel(decision);
      await doc.save();
      return doc;
    } catch (e) {
      console.warn("Mongo write failed, falling back to memory:", e.message);
    }
  }
  if (!inMemoryDB.deviceDecisions) inMemoryDB.deviceDecisions = [];
  inMemoryDB.deviceDecisions.push(decision);
  return decision;
};

export const addOrUpdateDeviceRecord = async (deviceRecord) => {
  const { cif, deviceHash } = deviceRecord;
  if (mongoose.connection.readyState === 1) {
    try {
      await DeviceModel.updateOne(
        { cif, deviceHash },
        { $set: deviceRecord },
        { upsert: true }
      );
      return;
    } catch (e) {
      console.warn("Mongo upsert failed, falling back to memory:", e.message);
    }
  }
  if (!inMemoryDB.devices) inMemoryDB.devices = [];
  const idx = inMemoryDB.devices.findIndex(d => d.cif === cif && d.deviceHash === deviceHash);
  if (idx !== -1) {
    inMemoryDB.devices[idx] = { ...inMemoryDB.devices[idx], ...deviceRecord };
  } else {
    inMemoryDB.devices.push(deviceRecord);
  }
};

export const getDevicesByAccountOrCIF = async (identifier) => {
  if (mongoose.connection.readyState === 1) {
    try {
      return await DeviceModel.find({
        $or: [{ cif: identifier }, { associatedCIFs: identifier }]
      }).sort({ lastSeen: -1 });
    } catch (e) {
      console.warn("Mongo query failed, falling back to memory:", e.message);
    }
  }
  if (!inMemoryDB.devices) inMemoryDB.devices = [];
  return inMemoryDB.devices.filter(d => d.cif === identifier);
};




