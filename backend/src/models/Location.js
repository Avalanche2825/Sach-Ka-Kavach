import mongoose from 'mongoose';

const LocationSchema = new mongoose.Schema({
  cif: { type: String, required: true, index: true },
  recentIPHistory: [{ type: String }],
  knownCity: { type: String },
  knownCountry: { type: String },
  knownASN: { type: String },
  knownISP: { type: String },
  geoConfidence: { type: Number, default: 1.0 },
  lastAccessed: { type: Date, default: Date.now }
});

export default mongoose.models.Location || mongoose.model('Location', LocationSchema);
