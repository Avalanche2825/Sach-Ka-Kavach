import mongoose from 'mongoose';

const IdentityProfileSchema = new mongoose.Schema({
  cif: { type: String, required: true, unique: true, index: true },
  customerName: { type: String, default: '' },
  accountNumber: { type: String, default: '' },
  aadhaarHash: { type: String, default: '', index: true },
  panNumber: { type: String, default: '', index: true },
  mobileNumber: { type: String, default: '', index: true },
  email: { type: String, default: '', index: true },
  address: { type: String, default: '' },
  deviceHashes: [{ type: String }],
  ipAddresses: [{ type: String }],
  nomineeName: { type: String, default: '' },
  guardianName: { type: String, default: '' },
  documentHashes: [{ type: String }],
  linkedCIFs: [{ type: String }],
  clusterId: { type: String, default: '' },
  onboardingTimestamp: { type: Date, default: Date.now }
}, { timestamps: true, collection: 'identity_profiles' });

export default mongoose.models.IdentityProfile || mongoose.model('IdentityProfile', IdentityProfileSchema);
