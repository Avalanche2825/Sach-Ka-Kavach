import mongoose from 'mongoose';

const RecoveryEventSchema = new mongoose.Schema({
  cif: { type: String, required: true, index: true },
  customerName: { type: String, default: '' },
  accountNumber: { type: String, default: '' },
  recoveryType: { 
    type: String, 
    enum: ['FORGOT_PASSWORD', 'FORGOT_MPIN', 'FORGOT_PIN', 'CHANGE_MOBILE', 'CHANGE_EMAIL'], 
    required: true 
  },
  deviceHash: { type: String, default: '' },
  ipAddress: { type: String, default: '' },
  isNewDevice: { type: Boolean, default: false },
  isVPN: { type: Boolean, default: false },
  isGeoMismatch: { type: Boolean, default: false },
  isSimSwapRecent: { type: Boolean, default: false },
  guardianRequired: { type: Boolean, default: false },
  guardianStatus: { type: String, enum: ['NONE', 'PENDING', 'APPROVED', 'REJECTED'], default: 'NONE' },
  employeeOverride: { type: Boolean, default: false },
  employeeId: { type: String, default: '' },
  timestamp: { type: Date, default: Date.now }
}, { timestamps: true, collection: 'recovery_events' });

export default mongoose.models.RecoveryEvent || mongoose.model('RecoveryEvent', RecoveryEventSchema);
