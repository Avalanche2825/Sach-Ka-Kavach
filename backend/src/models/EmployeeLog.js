import mongoose from 'mongoose';

const EmployeeLogSchema = new mongoose.Schema({
  _id: { type: String },
  timestamp: { type: String, required: true },
  employeeId: { type: String, required: true },
  employeeName: { type: String, required: true },
  action: { type: String, required: true },
  customerCIF: String,
  outsideHours: { type: Boolean, required: true },
  actionRiskScore: { type: Number, required: true },
  managerApproved: { type: Boolean, required: true },
  requiresManagerApproval: { type: Boolean, required: true }
});

export default mongoose.models.EmployeeLog || mongoose.model('EmployeeLog', EmployeeLogSchema);
