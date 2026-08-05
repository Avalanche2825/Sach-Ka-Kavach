import mongoose from 'mongoose';

const KYCApplicationSchema = new mongoose.Schema({
  _id: { type: String },
  timestamp: { type: String, required: true },
  name: { type: String, required: true },
  aadhaar: { type: String, required: true },
  pan: { type: String, required: true },
  deviceFingerprint: { type: String, required: true },
  ipAddress: { type: String, required: true },
  status: { type: String, enum: ['Approved', 'Flagged', 'Pending'], required: true },
  suspiciousMatches: [{ type: String }]
});

export default mongoose.models.KYCApplication || mongoose.model('KYCApplication', KYCApplicationSchema);
