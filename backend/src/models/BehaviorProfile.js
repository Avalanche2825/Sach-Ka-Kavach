import mongoose from 'mongoose';

const BehaviorProfileSchema = new mongoose.Schema({
  cif: { type: String, required: true, unique: true, index: true },
  sessionCount: { type: Number, default: 0 },
  profileConfidence: { type: Number, default: 0.0 },
  profileState: { type: String, default: "LEARNING", enum: ["LEARNING", "ADAPTING", "MATURE"] },
  modelUsed: { type: String, default: "Global" },
  averageLoginHour: { type: Number, required: true },
  loginHourStdDev: { type: Number, default: 1.0 },
  loginHourM2: { type: Number, default: 0.0 }, // Welford's running variance state
  preferredLoginWindows: [{
    start: { type: Number, required: true },
    end: { type: Number, required: true },
    weight: { type: Number, required: true }
  }],
  
  // Welford properties to enable incremental calculations without scanning history
  averageTypingSpeed: { type: Number, required: true },
  typingSpeedM2: { type: Number, default: 0.0 },
  
  averageTypingVariance: { type: Number, required: true },
  typingVarianceM2: { type: Number, default: 0.0 },
  
  averageNavigationDepth: { type: Number, required: true },
  navigationDepthM2: { type: Number, default: 0.0 },
  
  averageActionsPerMinute: { type: Number, required: true },
  actionsPerMinuteM2: { type: Number, default: 0.0 },
  
  averageTransactionAmount: { type: Number, required: true },
  averageSessionDuration: { type: Number, default: 60 },
  
  trustedDevices: [{ type: String }],
  trustedLocations: [{ type: String }],
  recentNetworks: [{ type: String }],
  featureVersion: { type: String, default: "v1.0" },
  profileVersion: { type: String, default: "v1.0" },
  lastProfileUpdate: { type: Date, default: Date.now },
  lastModelTraining: { type: Date },
  nextScheduledTraining: { type: Date }
});

export default mongoose.models.BehaviorProfile || mongoose.model('BehaviorProfile', BehaviorProfileSchema);
