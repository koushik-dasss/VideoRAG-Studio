import { Job } from 'bullmq';
import { Worker as ThreadWorker } from 'worker_threads';
import path from 'path';
import { createLogger } from '../utils/logger';

const log = createLogger('TranscriptionProcessor');

export default async function (job: Job) {
  const { audioPath, language } = job.data;
  log.info(`Starting worker thread for job ${job.id}`);

  return new Promise((resolve, reject) => {
    const workerPath = path.join(__dirname, 'transcriptionThreadWrapper.js');
    const worker = new ThreadWorker(workerPath, {
      workerData: { audioPath, language }
    });

    worker.on('message', (msg) => {
      if (msg.success) resolve(msg.result);
      else reject(new Error(msg.error));
    });
    
    worker.on('error', reject);
    
    worker.on('exit', (code) => {
      if (code !== 0) reject(new Error(`Worker stopped with exit code ${code}`));
    });
  });
}
