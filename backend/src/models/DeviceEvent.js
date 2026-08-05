import mongoose from 'mongoose';

const DeviceEventSchema = new mongoose.Schema({
  sessionId: { type: String, required: true, index: true },
  cif: { type: String, required: true, index: true },
  accountNumber: { type: String, default: '' },
  timestamp: { type: Date, default: Date.now },
  deviceHash: { type: String, required: true },
  ipAddress: { type: String, default: '' },
  geo: {
    city: { type: String, default: 'Unknown' },
    state: { type: String, default: 'Unknown' },
    country: { type: String, default: 'India' },
    latitude: { type: Number, default: 0 },
    longitude: { type: Number, default: 0 },
    isp: { type: String, default: 'Unknown' },
    asn: { type: String, default: 'Unknown' },
    networkType: { type: String, default: 'Residential' },
    isVPN: { type: Boolean, default: false },
    isProxy: { type: Boolean, default: false },
    isHosting: { type: Boolean, default: false }
  },
  accessVelocity: { type: Number, default: 1 },
  geoDistanceKmFromLast: { type: Number, default: 0 },
  impossibleTravelDetected: { type: Boolean, default: false },
  isEmulator: { type: Boolean, default: false },
  isSimSwapWithin72h: { type: Boolean, default: false },
  behaviorRiskScore: { type: Number, default: 0 },
  correlationId: { type: String, default: '' }
}, { timestamps: true, collection: 'deviceevents' });

export default mongoose.models.DeviceEvent || mongoose.model('DeviceEvent', DeviceEventSchema);
