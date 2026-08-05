import mongoose from 'mongoose';

const EmployeeDecisionSchema = new mongoose.Schema({
  employeeId: { type: String, required: true, index: true },
  employeeName: { type: String, default: '' },
  actionType: { type: String, default: '' },
  timestamp: { type: Date, default: Date.now },
  employeeRiskScore: { type: Number, required: true }, // 0–10 scale
  decisionAction: { 
    type: String, 
    enum: ['ALLOWED', 'ALERT_SOC', 'FOUR_EYES_REQUIRED', 'BLOCK_AND_REVOKE'], 
    default: 'ALLOWED' 
  },
  reasons: [{ type: String }],
  correlationId: { type: String, default: '' }
}, { timestamps: true, collection: 'employee_decisions' });

export default mongoose.models.EmployeeDecision || mongoose.model('EmployeeDecision', EmployeeDecisionSchema);
