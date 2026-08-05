import mongoose from 'mongoose';

const TrustScoreSchema = new mongoose.Schema({
  sessionId: { type: String, required: true, index: true },
  cif: { type: String, required: true, index: true },
  timestamp: { type: Date, default: Date.now },
  riskScore: { type: Number, required: true },
  trustScore: { type: Number, required: true },
  factors: [{ type: String }],
  decision: { 
    type: String, 
    enum: ['ALLOW', 'OTP_REQUIRED', 'ALERT', 'HOLD', 'BLOCK'],
    required: true
  },
  correlationId: { type: String }
});

export default mongoose.models.TrustScore || mongoose.model('TrustScore', TrustScoreSchema);
