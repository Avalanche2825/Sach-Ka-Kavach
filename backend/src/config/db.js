import mongoose from 'mongoose';

export const connectDB = async () => {
  if (!process.env.MONGODB_URI) {
    console.log("No MONGODB_URI found. Utilizing active continuous Identity Memory Engine.");
    return false;
  }
  
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("✓ MongoDB Atlas connected");
    return true;
  } catch (err) {
    console.warn("Failed to connect MongoDB Atlas, using in-memory identity ledger:", err.message);
    return false;
  }
};
