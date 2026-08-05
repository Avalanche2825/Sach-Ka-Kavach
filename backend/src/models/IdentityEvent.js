import mongoose from 'mongoose';

const IdentityEventSchema = new mongoose.Schema({
  sessionId: { type: String, default: '', index: true },
  cif: { type: String, required: true, index: true },
  customerName: { type: String, default: '' },
  accountNumber: { type: String, default: '' },
  eventType: { type: String, enum: ['REGISTRATION', 'KYC_SUBMITTED', 'ACCOUNT_OPENED'], default: 'KYC_SUBMITTED' },
  aadhaarNumber: { type: String, default: '' },
  panNumber: { type: String, default: '' },
  mobileNumber: { type: String, default: '' },
  email: { type: String, default: '' },
  deviceHash: { type: String, default: '' },
  ipAddress: { type: String, default: '' },
  documentHash: { type: String, default: '' },
  nomineeName: { type: String, default: '' },
  guardianName: { type: String, default: '' },
  timestamp: { type: Date, default: Date.now }
}, { timestamps: true, collection: 'identity_events' });

export default mongoose.models.IdentityEvent || mongoose.model('IdentityEvent', IdentityEventSchema);
