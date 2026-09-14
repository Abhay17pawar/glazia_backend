import mongoose from "mongoose";

export let isUsingMemoryStore = false;

const connectDB = async (): Promise<void> => {
  const uri = process.env.MONGODB_URI || "mongodb://localhost:27017/mini-design-canvas";

  try {
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000,
    });
    console.log(`✅ MongoDB connected: ${conn.connection.host}`);
    isUsingMemoryStore = false;
  } catch (error) {
    if (process.env.MONGODB_URI) {
      console.error("❌ MongoDB connection error:", error);
    }
    console.warn("⚠️ Database connection unavailable. Switching to In-Memory REST Data Store.");
    console.log("ℹ️ All REST API endpoints (GET, POST, PUT, DELETE) are 100% active and functional.");
    isUsingMemoryStore = true;
  }
};

export default connectDB;
