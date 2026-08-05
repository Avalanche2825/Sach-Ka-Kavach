import mongoose from 'mongoose';

const PrivilegeLogSchema = new mongoose.Schema({
  employeeId: { type: String, required: true, index: true },
  employeeName: { type: String, default: '' },
  privilegeName: { type: String, required: true },
  grantedBy: { type: String, required: true },
  reason: { type: String, default: '' },
  grantedAt: { type: Date, default: Date.now },
  expiresAt: { type: Date, required: true },
  isRevoked: { type: Boolean, default: false },
  revokedAt: { type: Date }
}, { timestamps: true, collection: 'privilege_logs' });

export default mongoose.models.PrivilegeLog || mongoose.model('PrivilegeLog', PrivilegeLogSchema);
