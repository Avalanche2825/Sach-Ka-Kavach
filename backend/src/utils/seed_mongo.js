import mongoose from 'mongoose';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

// Load models
import UserModel from '../models/User.js';
import CustomerSessionModel from '../models/CustomerSession.js';
import LocationModel from '../models/Location.js';
import DeviceModel from '../models/Device.js';
import GuardianModel from '../models/Guardian.js';
import TransactionModel from '../models/Transaction.js';
import BehaviorProfileModel from '../models/BehaviorProfile.js';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error("Error: MONGODB_URI is not defined in your backend .env file!");
  process.exit(1);
}

const seedMongo = async () => {
  try {
    console.log("Connecting to MongoDB Atlas...");
    await mongoose.connect(MONGODB_URI);
    console.log("Connected successfully!");

    // 1. Seed 6 Customers
    console.log("\nSeeding Customers...");
    await UserModel.deleteMany({}); // clear previous
    const names = ["Aarav Sharma", "Priya Patel", "Rohan Verma", "Neha Iyer", "Siddharth Rao", "Anjali Nair"];
    const locations = ["Mumbai, IN", "Delhi, IN", "Bengaluru, IN", "Ahmedabad, IN", "Pune, IN", "Chennai, IN"];
    const devices = ["iPhone 15 (iOS)", "MacBook Pro", "Samsung Galaxy S24", "Google Pixel 8", "Dell Latitude", "iPad Air"];
    
    const customersData = [];
    for (let i = 0; i < 6; i++) {
      const cif = `CIF10000${i}`;
      customersData.push({
        cif,
        name: names[i],
        balance: 50000 + i * 550000,
        trustScore: 85 + i * 2, // 85 to 95 baseline
        currentDevice: devices[i],
        currentIP: `103.88.24.${50 + i}`,
        currentLocation: locations[i],
        avgTransactionAmount: 2000 + i * 16600,
        dailyAverageAmount: 5000 + i * 39000,
        accessFrequency: 5 + i * 2
      });
    }
    await UserModel.insertMany(customersData);
    console.log(`Successfully seeded ${customersData.length} customers.`);

    // 2. Seed Locations
    console.log("\nSeeding Locations history...");
    await LocationModel.deleteMany({});
    for (let i = 0; i < 6; i++) {
      const cif = `CIF10000${i}`;
      await LocationModel.create({
        cif,
        recentIPHistory: [`103.88.24.${50 + i}`, `103.88.24.${49 + i}`],
        knownCity: locations[i].split(",")[0],
        knownCountry: "India",
        knownASN: "AS9829 (BSNL)",
        knownISP: "Bharat Sanchar Nigam Ltd",
        geoConfidence: 0.95
      });
    }
    console.log("Successfully seeded location baselines.");

    // 3. Seed Guardians
    console.log("\nSeeding Guardians...");
    await GuardianModel.deleteMany({});
    await GuardianModel.insertMany([
      { cif: 'CIF100000', guardianName: 'Sunil Sharma', relationship: 'Father', phone: '+91 9988776655' },
      { cif: 'CIF100001', guardianName: 'Kiran Patel', relationship: 'Mother', phone: '+91 9988776644' }
    ]);
    console.log("Successfully seeded guardians.");

    // 4. Seed Behavioral Sessions (600 sessions from seed_sessions.json)
    console.log("\nSeeding Behavioral Sessions (Module 1)...");
    const sessionsPath = path.resolve('../ml_service/models/seed_sessions.json');
    if (fs.existsSync(sessionsPath)) {
      const rawSessions = JSON.parse(fs.readFileSync(sessionsPath, 'utf8'));
      await CustomerSessionModel.deleteMany({});
      
      const sessionDocs = rawSessions.map(s => ({
        sessionId: s.sessionId,
        cif: s.cif,
        loginTimestamp: new Date(s.loginTimestamp),
        typingVariance: s.typingVariance,
        typingSpeedAvg: s.typingSpeedAvg,
        navigationDepth: s.navigationDepth,
        actionsPerMinute: s.actionsPerMinute,
        idlePeriods: s.idlePeriods,
        copyPasteDetected: s.copyPasteDetected,
        correlationId: "seed-session-setup"
      }));
      
      await CustomerSessionModel.insertMany(sessionDocs);
      console.log(`Successfully seeded ${sessionDocs.length} historical behavioral sessions.`);

      // 5. Pre-compile Behavior Profiles
      console.log("\nPre-compiling Behavior Profiles (Module 1)...");
      await BehaviorProfileModel.deleteMany({});
      
      const cifs = ["CIF100000", "CIF100001", "CIF100002", "CIF100003", "CIF100004", "CIF100005"];
      
      for (const cif of cifs) {
        const userSessions = sessionDocs.filter(s => s.cif === cif);
        const count = userSessions.length;
        
        if (count === 0) continue;

        const hours = userSessions.map(s => s.loginTimestamp.getHours());
        const avgHour = hours.reduce((a, b) => a + b, 0) / count;
        const varianceHour = hours.map(h => Math.pow(h - avgHour, 2)).reduce((a, b) => a + b, 0) / count;
        const stdHour = Math.sqrt(varianceHour) || 1.0;
        
        // Welford squared deviations sum
        const loginHourM2 = hours.map(h => Math.pow(h - avgHour, 2)).reduce((a, b) => a + b, 0);
        
        // Multi-window login hour clustering bins
        const bins = Array(6).fill(0);
        hours.forEach(h => {
          const binIdx = Math.floor(h / 4);
          bins[binIdx]++;
        });
        
        const preferredLoginWindows = [];
        bins.forEach((freq, idx) => {
          const weight = freq / count;
          if (weight >= 0.1) {
            preferredLoginWindows.push({
              start: idx * 4,
              end: (idx * 4 + 4) % 24,
              weight: parseFloat(weight.toFixed(2))
            });
          }
        });
        
        const speeds = userSessions.map(s => s.typingSpeedAvg);
        const variances = userSessions.map(s => s.typingVariance);
        const depths = userSessions.map(s => s.navigationDepth);
        const actions = userSessions.map(s => s.actionsPerMinute);
        
        const avgSpeed = speeds.reduce((a, b) => a + b, 0) / count;
        const avgVariance = variances.reduce((a, b) => a + b, 0) / count;
        const avgDepth = depths.reduce((a, b) => a + b, 0) / count;
        const avgActions = actions.reduce((a, b) => a + b, 0) / count;

        const typingSpeedM2 = speeds.map(s => Math.pow(s - avgSpeed, 2)).reduce((a, b) => a + b, 0);
        const typingVarianceM2 = variances.map(v => Math.pow(v - avgVariance, 2)).reduce((a, b) => a + b, 0);
        const navigationDepthM2 = depths.map(d => Math.pow(d - avgDepth, 2)).reduce((a, b) => a + b, 0);
        const actionsPerMinuteM2 = actions.map(a => Math.pow(a - avgActions, 2)).reduce((a, b) => a + b, 0);
        
        const matchingCust = customersData.find(c => c.cif === cif);
        
        const profile = {
          cif,
          sessionCount: count,
          profileConfidence: 1.0, // Pre-seeded with 100 sessions
          averageLoginHour: parseFloat(avgHour.toFixed(2)),
          loginHourStdDev: parseFloat(stdHour.toFixed(2)),
          loginHourM2: parseFloat(loginHourM2.toFixed(2)),
          preferredLoginWindows,
          averageTypingSpeed: parseFloat(avgSpeed.toFixed(2)),
          typingSpeedM2: parseFloat(typingSpeedM2.toFixed(2)),
          averageTypingVariance: parseFloat(avgVariance.toFixed(2)),
          typingVarianceM2: parseFloat(typingVarianceM2.toFixed(2)),
          averageNavigationDepth: parseFloat(avgDepth.toFixed(2)),
          navigationDepthM2: parseFloat(navigationDepthM2.toFixed(2)),
          averageActionsPerMinute: parseFloat(avgActions.toFixed(2)),
          actionsPerMinuteM2: parseFloat(actionsPerMinuteM2.toFixed(2)),
          averageTransactionAmount: matchingCust ? matchingCust.avgTransactionAmount : 5000.0,
          averageSessionDuration: 60,
          trustedDevices: [matchingCust ? matchingCust.currentDevice : "Web Browser"],
          trustedLocations: [matchingCust ? matchingCust.currentLocation.split(",")[0] : "Mumbai"],
          recentNetworks: [matchingCust ? matchingCust.currentIP : "127.0.0.1"],
          featureVersion: "v1.0",
          profileVersion: "v1.0",
          profileState: "MATURE",
          modelUsed: "Personal",
          lastProfileUpdate: new Date(),
          lastModelTraining: new Date(),
          nextScheduledTraining: new Date(new Date().getTime() + 30 * 24 * 3600 * 1000)
        };
        await BehaviorProfileModel.create(profile);
      }
      console.log("Successfully compiled and seeded 6 Behavior Profiles.");

    } else {
      console.warn("Warning: seed_sessions.json not found. Run python seed_behavior_data.py inside ml_service first.");
    }

    console.log("\nDatabase Seeding Completed Successfully! 🚀");
    process.exit(0);

  } catch (err) {
    console.error("Error seeding MongoDB:", err);
    process.exit(1);
  }
};

seedMongo();
