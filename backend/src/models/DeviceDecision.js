import mongoose from 'mongoose';

const DeviceDecisionSchema = new mongoose.Schema({
  sessionId: { type: String, required: true, index: true },
  cif: { type: String, required: true, index: true },
  accountNumber: { type: String, default: '' },
  timestamp: { type: Date, default: Date.now },
  deviceRiskScore: { type: Number, required: true }, // 0–25 budget scale
  rawProbability: { type: Number, default: 0 },
  riskCategory: { type: String, enum: ['LOW', 'MODERATE', 'ELEVATED', 'CRITICAL'], default: 'LOW' },
  budgetAllocations: {
    newDeviceRisk: { type: Number, default: 0 },       // Max 8
    ipReputationRisk: { type: Number, default: 0 },    // Max 4
    locationRisk: { type: Number, default: 0 },        // Max 4
    simSwapRisk: { type: Number, default: 0 },         // Max 5
    emulatorRisk: { type: Number, default: 0 },        // Max 2
    browserOSChangeRisk: { type: Number, default: 0 }  // Max 2
  },
  riskFactors: [{ type: String }],
  featureImportances: { type: Map, of: Number },
  decisionAction: { type: String, default: 'ALLOW' },
  correlationId: { type: String, default: '' }
}, { timestamps: true, collection: 'devicedecisions' });

export default mongoose.models.DeviceDecision || mongoose.model('DeviceDecision', DeviceDecisionSchema);
