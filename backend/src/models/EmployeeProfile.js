import mongoose from 'mongoose';

const EmployeeProfileSchema = new mongoose.Schema({
  employeeId: { type: String, required: true, unique: true, index: true },
  employeeName: { type: String, required: true },
  role: { type: String, enum: ['TELLER', 'BRANCH_MANAGER', 'AUDITOR', 'SOC_ANALYST', 'ADMIN'], default: 'TELLER' },
  department: { type: String, default: 'Retail Banking' },
  branchCode: { type: String, required: true, index: true },
  branchName: { type: String, default: 'Main Branch' },
  managerEmployeeId: { type: String, default: '' },
  workingHours: {
    startHour: { type: Number, default: 9 }, // 9 AM
    endHour: { type: Number, default: 18 }   // 6 PM
  },
  permissions: [{ type: String }],
  temporaryPrivileges: [{
    privilege: { type: String },
    grantedBy: { type: String },
    grantedAt: { type: Date, default: Date.now },
    expiresAt: { type: Date }
  }],
  status: { type: String, enum: ['ACTIVE', 'SUSPENDED', 'FLAGGED'], default: 'ACTIVE' }
}, { timestamps: true, collection: 'employee_profiles' });

export default mongoose.models.EmployeeProfile || mongoose.model('EmployeeProfile', EmployeeProfileSchema);
