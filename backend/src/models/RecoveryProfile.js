import mongoose from 'mongoose';

const RecoveryProfileSchema = new mongoose.Schema({
  cif: { type: String, required: true, unique: true, index: true },
  customerName: { type: String, default: '' },
  accountNumber: { type: String, default: '' },
  totalRecoveryAttempts: { type: Number, default: 0 },
  failedAttemptsCount: { type: Number, default: 0 },
  lastRecoveryDate: { type: Date },
  recoveryChannelHistory: [{ type: String }],
  guardianAvailable: { type: Boolean, default: false },
  guardianName: { type: String, default: '' },
  isOnlineRecoveryBlocked: { type: Boolean, default: false },
  lastStatus: { type: String, default: 'CLEAR' }
}, { timestamps: true, collection: 'recovery_profiles' });

export default mongoose.models.RecoveryProfile || mongoose.model('RecoveryProfile', RecoveryProfileSchema);
