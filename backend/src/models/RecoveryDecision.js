import mongoose from 'mongoose';

const RecoveryDecisionSchema = new mongoose.Schema({
  cif: { type: String, required: true, index: true },
  customerName: { type: String, default: '' },
  accountNumber: { type: String, default: '' },
  recoveryType: { type: String, default: '' },
  timestamp: { type: Date, default: Date.now },
  recoveryRiskScore: { type: Number, required: true }, // 0–10 scale
  decisionAction: { 
    type: String, 
    enum: ['APPROVED', 'OTP_REQUIRED', 'GUARDIAN_APPROVAL_REQUIRED', 'MANUAL_REVIEW', 'BRANCH_VERIFICATION_REQUIRED', 'BLOCK'], 
    default: 'OTP_REQUIRED' 
  },
  customerFacingMessage: { type: String, default: 'Verification Required' },
  reasons: [{ type: String }],
  moduleOutputsConsumed: {
    behavioralRisk: { type: Number, default: 0 },
    deviceRisk: { type: Number, default: 0 },
    simSwapRecent: { type: Boolean, default: false }
  },
  correlationId: { type: String, default: '' }
}, { timestamps: true, collection: 'recovery_decisions' });

export default mongoose.models.RecoveryDecision || mongoose.model('RecoveryDecision', RecoveryDecisionSchema);
