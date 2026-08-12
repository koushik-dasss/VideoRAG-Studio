import mongoose from 'mongoose';
import { createLogger } from '../utils/logger';
import { getConfig } from './index';

const log = createLogger('MongoDB');

async function ensureDummyUser(): Promise<void> {
  const { User } = require('../models/User');
  const dummyId = '64a1b2c3d4e5f6a7b8c9d0e1';
  const existingUser = await User.findById(dummyId);
  if (!existingUser) {
    await User.create({
      _id: new mongoose.Types.ObjectId(dummyId),
      name: 'Demo User',
      email: 'demo@example.com'
    });
    log.info(`Created dummy user ${dummyId}`);
  }
}

export const connectDB = async (maxRetries = 2): Promise<void> => {
  let attempts = 0;
  const mongoUri = getConfig().mongodb.uri;

  while (attempts < maxRetries) {
    attempts++;
    try {
      log.info(`Connecting to MongoDB Atlas (Attempt ${attempts}/${maxRetries})...`);
      await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 4000 });
      log.info(`MongoDB connected to Atlas: ${mongoUri.replace(/:[^:@]+@/, ':****@')}`);
      await ensureDummyUser();
      return;
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : String(error);
      log.warn(`MongoDB Atlas attempt ${attempts}/${maxRetries} failed: ${msg}`);
    }
  }

  log.error('Fatal: Failed to connect to MongoDB Atlas. Ensure MONGODB_URI is correct and IP address is whitelisted.');
  process.exit(1);
};

