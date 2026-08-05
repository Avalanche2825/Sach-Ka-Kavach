import mongoose from 'mongoose';

const GuardianSchema = new mongoose.Schema({
  cif: { type: String, required: true },
  guardianName: { type: String, required: true },
  relationship: { type: String, required: true },
  phone: { type: String, required: true }
});

export default mongoose.models.Guardian || mongoose.model('Guardian', GuardianSchema);
