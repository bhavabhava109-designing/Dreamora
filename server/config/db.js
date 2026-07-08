import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

let isConnected = false;

export const connectDB = async () => {
  const mongoURI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/dreamora';
  console.log(`Connecting to MongoDB on: ${mongoURI}...`);
  try {
    // 3-second timeout for quick fallback activation if MongoDB is offline
    await mongoose.connect(mongoURI, {
      serverSelectionTimeoutMS: 3000,
    });
    isConnected = true;
    console.log('MongoDB connected successfully. 🚀');
    process.env.USE_JSON_DB = 'false';
  } catch (error) {
    console.warn('\n⚠️ MongoDB connection failed. Falling back to local JSON database mode.');
    console.warn(`Error details: ${error.message}`);
    console.warn('Local database files will be stored in server/data/\n');
    isConnected = false;
    process.env.USE_JSON_DB = 'true';
  }
};

export const getDbStatus = () => {
  return isConnected ? 'Connected (MongoDB)' : 'Fallback (JSON Files)';
};
export const getUseJsonDb = () => process.env.USE_JSON_DB === 'true';
