import mongoose from 'mongoose';

const DeviceSchema = new mongoose.Schema({
  cif: { type: String, required: true, index: true },
  deviceHash: { type: String, required: true, index: true },
  visitorId: { type: String, default: '' },
  platform: { type: String, default: 'unknown' },
  browser: { type: String, default: 'unknown' },
  os: { type: String, default: 'unknown' },
  screenResolution: { type: String, default: '' },
  timezone: { type: String, default: 'UTC' },
  canvasHash: { type: String, default: '' },
  webglVendor: { type: String, default: '' },
  webglRenderer: { type: String, default: '' },
  hardwareConcurrency: { type: Number, default: 4 },
  deviceMemoryGB: { type: Number, default: 8 },
  touchSupport: { type: Boolean, default: false },
  isEmulator: { type: Boolean, default: false },
  isHeadless: { type: Boolean, default: false },
  confidenceScore: { type: Number, default: 100 },
  firstSeen: { type: Date, default: Date.now },
  lastSeen: { type: Date, default: Date.now },
  riskLevel: { 
    type: String, 
    enum: ['TRUSTED', 'SUSPICIOUS', 'BLOCKED'], 
    default: 'TRUSTED' 
  },
  associatedCIFs: [{ type: String }]
}, { timestamps: true, collection: 'devices' });

export default mongoose.models.Device || mongoose.model('Device', DeviceSchema);
