import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
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

  log.warn('MongoDB Atlas unreachable. Starting local in-memory MongoMemoryServer fallback...');
  try {
    const mongod = await MongoMemoryServer.create();
    const uri = mongod.getUri();
    await mongoose.connect(uri);
    log.info(`MongoDB connected to MongoMemoryServer at ${uri}`);
    await ensureDummyUser();
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    log.error(`Failed to start MongoMemoryServer: ${msg}`);
    process.exit(1);
  }
};

