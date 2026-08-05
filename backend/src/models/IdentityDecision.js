import mongoose from 'mongoose';

const IdentityDecisionSchema = new mongoose.Schema({
  cif: { type: String, required: true, index: true },
  customerName: { type: String, default: '' },
  accountNumber: { type: String, default: '' },
  timestamp: { type: Date, default: Date.now },
  identityRiskScore: { type: Number, required: true }, // 0–15 scale
  riskCategory: { type: String, enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'], default: 'LOW' },
  duplicateAadhaarFound: { type: Boolean, default: false },
  duplicatePANFound: { type: Boolean, default: false },
  duplicateDocumentFound: { type: Boolean, default: false },
  sharedDeviceCount: { type: Number, default: 0 },
  sharedIPCount: { type: Number, default: 0 },
  connectedCIFs: [{ type: String }],
  reasons: [{ type: String }],
  evidence: [{ type: mongoose.Schema.Types.Mixed }],
  graphData: { type: mongoose.Schema.Types.Mixed, default: {} },
  correlationId: { type: String, default: '' }
}, { timestamps: true, collection: 'identity_decisions' });

export default mongoose.models.IdentityDecision || mongoose.model('IdentityDecision', IdentityDecisionSchema);
