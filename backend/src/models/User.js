import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
  cif: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  username: { type: String, unique: true, sparse: true },
  passwordHash: { type: String, select: false },
  role: { type: String, default: 'customer' },
  balance: { type: Number, required: true },
  trustScore: { type: Number, required: true },
  currentDevice: { type: String, required: true },
  currentIP: { type: String, required: true },
  currentLocation: { type: String, required: true },
  loginHistory: [{
    timestamp: String,
    ip: String,
    location: String,
    device: String,
    isNewDevice: Boolean
  }],
  avgTransactionAmount: { type: Number, required: true },
  dailyAverageAmount: { type: Number, required: true },
  accessFrequency: { type: Number, required: true }
  ,isSimSwapWithin72h: { type: Boolean, default: false }
  ,baseline: {
    usualLoginStartHour: Number,
    usualLoginEndHour: Number,
    knownBrowser: String,
    knownDeviceHash: String,
    knownRegion: String,
    knownIp: String
  }
});

export default mongoose.models.User || mongoose.model('User', UserSchema);
