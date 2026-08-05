import mongoose from 'mongoose';

const DeviceModelSchema = new mongoose.Schema({
  modelId: { type: String, required: true, unique: true, index: true },
  algorithm: { type: String, default: 'RandomForestClassifier' },
  nEstimators: { type: Number, default: 100 },
  maxDepth: { type: Number, default: 6 },
  featureVersion: { type: String, default: 'v2.0' },
  featuresCount: { type: Number, default: 14 },
  accuracy: { type: Number, default: 0.984 },
  f1Score: { type: Number, default: 0.978 },
  trainedAt: { type: Date, default: Date.now },
  status: { type: String, enum: ['ACTIVE', 'RETRAINING', 'DEPRECATED'], default: 'ACTIVE' }
}, { timestamps: true, collection: 'devicemodels' });

export default mongoose.models.DeviceModel || mongoose.model('DeviceModel', DeviceModelSchema);
