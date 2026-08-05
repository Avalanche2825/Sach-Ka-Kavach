import mongoose from 'mongoose';

const EmployeeEventSchema = new mongoose.Schema({
  employeeId: { type: String, required: true, index: true },
  employeeName: { type: String, default: '' },
  role: { type: String, default: '' },
  branchCode: { type: String, default: '' },
  actionType: { 
    type: String, 
    enum: [
      'CUSTOMER_SEARCH', 'KYC_OVERRIDE', 'BULK_EXPORT', 'TRANSACTION_APPROVAL', 
      'LOAN_APPROVAL', 'RECOVERY_OVERRIDE', 'PASSWORD_RESET', 'PRIVILEGE_CHANGE', 
      'FAILED_LOGIN', 'APPROVE_OWN_REQUEST'
    ], 
    required: true 
  },
  targetCIF: { type: String, default: '' },
  targetCustomerName: { type: String, default: '' },
  targetAccountNumber: { type: String, default: '' },
  targetCustomerBranch: { type: String, default: '' },
  isOutsideWorkingHours: { type: Boolean, default: false },
  isUnrelatedBranch: { type: Boolean, default: false },
  requiresFourEyes: { type: Boolean, default: false },
  managerApproved: { type: Boolean, default: false },
  managerEmployeeId: { type: String, default: '' },
  timestamp: { type: Date, default: Date.now }
}, { timestamps: true, collection: 'employee_events' });

export default mongoose.models.EmployeeEvent || mongoose.model('EmployeeEvent', EmployeeEventSchema);
