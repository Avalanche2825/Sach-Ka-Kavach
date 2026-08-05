import mongoose from 'mongoose';

const DeviceProfileSchema = new mongoose.Schema({
  cif: { type: String, required: true, unique: true, index: true },
  accountNumber: { type: String, default: '' },
  trustedDeviceHashes: [{ type: String }],
  knownBrowsers: [{ type: String }],
  knownOS: [{ type: String }],
  knownCities: [{ type: String }],
  knownIPRanges: [{ type: String }],
  knownISPs: [{ type: String }],
  knownASNs: [{ type: String }],
  simSwapHistory: [{
    simSwappedAt: { type: Date },
    carrier: { type: String, default: '' },
    verifiedAtBranch: { type: Boolean, default: false }
  }],
  lastSimSwapCheck: { type: Date, default: Date.now },
  totalLogins: { type: Number, default: 0 },
  highRiskAttemptsCount: { type: Number, default: 0 },
  lastUpdated: { type: Date, default: Date.now }
}, { timestamps: true, collection: 'deviceprofiles' });

export default mongoose.models.DeviceProfile || mongoose.model('DeviceProfile', DeviceProfileSchema);
