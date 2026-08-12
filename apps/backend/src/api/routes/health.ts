import { Router } from 'express';
import mongoose from 'mongoose';
import { Queue } from 'bullmq';
import { getBullMqConnectionOptions } from '../../utils/redis';
import { getConfig } from '../../config/index';
import fs from 'fs';
import path from 'path';
import { sendSuccess } from '../../utils/response';

const router = Router();

router.get('/', (req, res) => {
  return sendSuccess(res, { status: 'ok', timestamp: new Date().toISOString() });
});

router.get('/database', (req, res) => {
  const state = mongoose.connection.readyState;
  const isOk = state === mongoose.ConnectionStates.connected;
  if (isOk) {
    return sendSuccess(res, {
      status: 'ok',
      readyState: state,
      timestamp: new Date().toISOString()
    });
  }
  res.status(503).json({
    success: false,
    message: 'Database not connected',
    data: null,
    errors: [{ code: 'DbError', message: 'Database disconnected' }],
    timestamp: new Date().toISOString(),
    requestId: req.headers['x-request-id'] || 'unknown'
  });
});

router.get('/ai', (req, res) => {
  const config = getConfig();
  return sendSuccess(res, {
    status: 'healthy',
    mode: process.env.NODE_ENV || 'development',
    providers: {
      llm: config.llmProvider || 'gemini',
      speech: config.speechProvider || 'faster-whisper',
      embedding: config.embeddingProvider || 'local'
    }
  });
});

router.get('/storage', async (req, res) => {
  try {
    const uploadDir = path.join(process.cwd(), 'uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    await fs.promises.access(uploadDir, fs.constants.W_OK);
    return sendSuccess(res, { status: 'ok', provider: 'local', timestamp: new Date().toISOString() });
  } catch (error) {
    res.status(503).json({
      success: false,
      message: 'Storage not accessible',
      data: null,
      errors: [{ code: 'StorageError', message: 'Storage not accessible' }],
      timestamp: new Date().toISOString(),
      requestId: req.headers['x-request-id'] || 'unknown'
    });
  }
});

router.get('/queue', async (req, res) => {
  try {
    const queue = new Queue('video-processing', getBullMqConnectionOptions(getConfig().cache.redisUrl));
    
    // Attempt to get client
    const client = await queue.client;
    
    if (!client) {throw new Error('Redis client not available');}
    
    await queue.close();
    
    return sendSuccess(res, { status: 'ok', timestamp: new Date().toISOString() });
  } catch (error) {
    res.status(503).json({
      success: false,
      message: 'Queue unavailable',
      data: null,
      errors: [{ code: 'QueueError', message: 'Queue unavailable' }],
      timestamp: new Date().toISOString(),
      requestId: req.headers['x-request-id'] || 'unknown'
    });
  }
});

export default router;
