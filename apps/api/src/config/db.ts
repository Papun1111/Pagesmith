import mongoose from 'mongoose';
import dotenv from "dotenv"
dotenv.config();

export const connectDB = async () => {

  const mongoUri = process.env.MONGO_URI;

  if (!mongoUri) {
    console.error('FATAL ERROR: MONGO_URI is not defined in the environment variables.');

    return;
  }

  try {
  
    await mongoose.connect(mongoUri);
    console.log('MongoDB connection established successfully.');
  } catch (error) {

    console.error('MongoDB connection failed:', error);
    return;
  }
};
