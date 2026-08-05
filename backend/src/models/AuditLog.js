import mongoose from 'mongoose';

const AuditLogSchema = new mongoose.Schema({
  _id: { type: String },
  timestamp: { type: String, required: true },
  user: { type: String, required: true },
  event: { type: String, required: true },
  riskScore: { type: Number, required: true },
  riskFactors: [{ type: String }],
  decision: { type: String, required: true }
});

export default mongoose.models.AuditLog || mongoose.model('AuditLog', AuditLogSchema);
