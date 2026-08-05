import mongoose from 'mongoose';

const CustomerSessionSchema = new mongoose.Schema({
  sessionId: { type: String, required: true, unique: true },
  cif: { type: String, required: true, index: true },
  loginTimestamp: { type: Date, required: true },
  typingVariance: { type: Number, required: true },
  typingSpeedAvg: { type: Number, required: true },
  navigationDepth: { type: Number, default: 0 },
  actionsPerMinute: { type: Number, default: 0 },
  idlePeriods: { type: Number, default: 0 },
  copyPasteDetected: { type: Boolean, default: false },
  correlationId: { type: String }
});

export default mongoose.models.CustomerSession || mongoose.model('CustomerSession', CustomerSessionSchema);
