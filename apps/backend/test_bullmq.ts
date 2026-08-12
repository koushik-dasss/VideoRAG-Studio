import IORedis from 'ioredis';
import { Queue, Worker } from 'bullmq';
import mongoose from 'mongoose';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';
const MONGODB_URI = process.env.MONGODB_URI || '';

const results = {
  Redis: 'FAIL',
  BullMQ: 'FAIL',
  Queue: 'FAIL',
  Worker: 'FAIL',
  TestJob: 'FAIL',
  JobCompletion: 'FAIL',
  ProcessingStatus: 'FAIL'
};

async function runTest() {
  let connection: IORedis | null = null;
  let queue: Queue | null = null;
  let worker: Worker | null = null;

  try {
    // 1. Connect MongoDB for Status Tracking
    await mongoose.connect(MONGODB_URI);
    
    // Create Dummy schemas if they don't exist in scope, but we can just use the project's models
    const { ProcessingJob } = require('./src/models/ProcessingJob');
    const { Lecture } = require('./src/models/Lecture');

    // 1. Redis Connection
    connection = new IORedis(REDIS_URL, { maxRetriesPerRequest: null });
    await new Promise<void>((resolve, reject) => {
      connection!.on('ready', () => { results.Redis = 'PASS'; resolve(); });
      connection!.on('error', (err) => reject(err));
    });

    results.BullMQ = 'PASS'; // If we got here, BullMQ can use this connection

    // 2. Queue Initialization
    const queueName = 'test-queue-' + Date.now();
    queue = new Queue(queueName, { connection });
    results.Queue = 'PASS';

    // 3. Worker Initialization
    worker = new Worker(queueName, async (job) => {
      const dbJob = await ProcessingJob.findById(job.data.jobId);
      if (dbJob) {
        dbJob.status = 'processing';
        await dbJob.save();
      }
      
      // Simulate work
      await new Promise(r => setTimeout(r, 500));
      
      if (dbJob) {
        dbJob.status = 'completed';
        dbJob.progressPercentage = 100;
        await dbJob.save();
      }
      return { success: true };
    }, { connection });
    results.Worker = 'PASS';

    // 4. Create dummy job in DB
    const dummyLecture = await Lecture.create({
      title: 'Test Lecture',
      status: 'uploading',
      uploadPath: '/dummy/path',
      fileName: 'dummy.mp4',
      originalName: 'dummy.mp4',
      fileType: 'video',
      userId: new mongoose.Types.ObjectId()
    });

    const dummyJob = await ProcessingJob.create({
      jobId: 'job-' + Date.now(),
      lectureId: dummyLecture._id,
      status: 'queued'
    });

    // 5. Enqueue Test Job
    const job = await queue.add('test-job', { jobId: dummyJob._id });
    if (job.id) {
      results.TestJob = 'PASS';
    }

    // 6 & 7. Process & Verify Completion
    await new Promise<void>((resolve, reject) => {
      worker!.on('completed', () => {
        results.JobCompletion = 'PASS';
        resolve();
      });
      worker!.on('failed', (j, err) => reject(err));
    });

    // 8. Verify ProcessingJob Status
    const completedDbJob = await ProcessingJob.findById(dummyJob._id);
    if (completedDbJob && completedDbJob.status === 'completed' && completedDbJob.progressPercentage === 100) {
      results.ProcessingStatus = 'PASS';
    }

    // Cleanup
    await Lecture.findByIdAndDelete(dummyLecture._id);
    await ProcessingJob.findByIdAndDelete(dummyJob._id);

  } catch (err: any) {
    console.error("Test failed:", err.message);
  } finally {
    if (worker) await worker.close();
    if (queue) await queue.close();
    if (connection) connection.quit();
    await mongoose.disconnect();

    console.log(`\nRedis: ${results.Redis}`);
    console.log(`BullMQ: ${results.BullMQ}`);
    console.log(`Queue: ${results.Queue}`);
    console.log(`Worker: ${results.Worker}`);
    console.log(`Test Job: ${results.TestJob}`);
    console.log(`Job Completion: ${results.JobCompletion}`);
    console.log(`Processing Status: ${results.ProcessingStatus}`);

    const allPassed = Object.values(results).every(v => v === 'PASS');
    if (allPassed) {
      console.log('\nREDIS/BULLMQ PIPELINE READY');
    }
  }
}

runTest();
