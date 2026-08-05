import mongoose from 'mongoose';

const BehaviorModelSchema = new mongoose.Schema({
  cif: { type: String, required: true, unique: true },
  modelVersion: { type: String, required: true },
  featureVersion: { type: String, default: "v1.0" },
  trainedAt: { type: Date, default: Date.now },
  lastRetrained: { type: Date, default: Date.now },
  trainingSessionCount: { type: Number, required: true },
  modelType: { type: String, default: "IsolationForest" },
  status: { 
    type: String, 
    enum: ['ACTIVE', 'TRAINING', 'DEPRECATED'], 
    default: 'ACTIVE' 
  },
  coldStart: { type: Boolean, default: true }
});

export default mongoose.models.BehaviorModel || mongoose.model('BehaviorModel', BehaviorModelSchema);
