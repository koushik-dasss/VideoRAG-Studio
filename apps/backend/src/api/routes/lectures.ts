import { Router } from 'express';
import mongoose from 'mongoose';
import { Lecture } from '../../models/Lecture';
import { ProcessingJob } from '../../models/ProcessingJob';
import multer from 'multer';
import { LocalStorageService } from '../../services/storage/LocalStorageService';
import { MulterStorageEngine } from '../../services/storage/StorageEngine';
import { Queue } from 'bullmq';
import { v4 as uuidv4 } from 'uuid';
import { z } from 'zod';
import { AppError } from '../../errors';
import { HTTP_STATUS } from '../../constants';
import { getBullMqConnectionOptions } from '../../utils/redis';
import { getConfig } from '../../config/index';
import { sendSuccess } from '../../utils/response';

const router = Router();

const storageService = new LocalStorageService();

const upload = multer({
  storage: new MulterStorageEngine(storageService),
  limits: { fileSize: 500 * 1024 * 1024 }, // 500MB
  fileFilter: (req, file, cb) => {
    const allowedMimeTypes = ['video/mp4', 'video/webm', 'audio/mpeg', 'audio/wav'];
    if (allowedMimeTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type'));
    }
  }
});

const videoQueue = new Queue('video-processing', getBullMqConnectionOptions(getConfig().cache.redisUrl));

router.get('/user/:userId', async (req, res, next) => {
  try {
    const userId = req.params.userId;
    const query = mongoose.Types.ObjectId.isValid(userId)
      ? { $or: [{ userId }, { userId: new mongoose.Types.ObjectId(userId) }] }
      : { userId };

    const lectures = await Lecture.find(query)
      .select('title subject status duration keyTopics fileType thumbnailUrl createdAt')
      .sort({ createdAt: -1 });
    return sendSuccess(res, lectures);
  } catch (error: unknown) {
    next(error);
  }
});

router.get('/jobs/:userId', async (req, res, next) => {
  try {
    const userId = req.params.userId;
    const query = mongoose.Types.ObjectId.isValid(userId)
      ? { $or: [{ userId }, { userId: new mongoose.Types.ObjectId(userId) }] }
      : { userId };

    const lectures = await Lecture.find(query).select('_id title');
    const lectureMap = new Map(lectures.map(l => [l._id.toString(), l.title]));
    
    if (lectures.length === 0) {
      return sendSuccess(res, []);
    }

    const lectureIds = lectures.map(l => l._id);
    const jobs = await ProcessingJob.find({ lectureId: { $in: lectureIds } }).sort({ createdAt: -1 });

    const result = jobs.map(job => ({
      id: job.jobId,
      name: lectureMap.get(job.lectureId.toString()) || 'Unknown Video',
      status: job.status === 'completed' ? 'Completed' : (job.status === 'failed' ? 'Failed' : 'Processing'),
      progress: job.progressPercentage,
    }));

    return sendSuccess(res, result);
  } catch (error: unknown) {
    next(error);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const lecture = await Lecture.findById(req.params.id);
    if (!lecture) {
      return next(new AppError('Lecture not found', HTTP_STATUS.NOT_FOUND));
    }
    return sendSuccess(res, lecture);
  } catch (error: unknown) {
    next(error);
  }
});

router.get('/:id/status', async (req, res, next) => {
  try {
    const job = await ProcessingJob.findOne({ lectureId: req.params.id }).sort({ createdAt: -1 });
    if (!job) {
      return next(new AppError('Job not found', HTTP_STATUS.NOT_FOUND));
    }
    return sendSuccess(res, job);
  } catch (error: unknown) {
    next(error);
  }
});

const uploadSchema = z.object({
  userId: z.string().min(1),
  title: z.string().min(1),
  subject: z.string().optional(),
  fileType: z.enum(['video', 'audio', 'pdf', 'pptx', 'youtube']).optional(),
  youtubeUrl: z.string().url().optional(),
  language: z.string().optional(),
});

router.post('/', upload.single('file'), async (req, res, next) => {
  try {
    console.log('--- UPLOAD REQUEST ---');
    console.log('Headers Content-Type:', req.headers['content-type']);
    console.log('req.body:', req.body);
    console.log('req.file:', req.file);
    console.log('----------------------');

    const validatedData = uploadSchema.parse(req.body);
    const { userId, title, subject, youtubeUrl, language } = validatedData;
    
    let fileUrl = '';
    
    if (req.file) {
      fileUrl = req.file.path;
    } else if (youtubeUrl) {
      fileUrl = youtubeUrl;
    } else {
      return next(new AppError('File or youtubeUrl is required', HTTP_STATUS.BAD_REQUEST));
    }

    const lecture = new Lecture({
      userId,
      title,
      subject,
      fileType: req.file ? (req.file.mimetype.startsWith('video') ? 'video' : 'audio') : 'youtube',
      fileUrl,
      youtubeUrl,
      language: language ?? 'English',
      status: 'uploading',
    });
    await lecture.save();

    const jobId = uuidv4();
    const job = new ProcessingJob({
      jobId,
      lectureId: lecture._id,
      status: 'queued',
      currentStage: 'queued',
    });
    await job.save();

    await videoQueue.add('process-video', {
      lectureId: lecture._id,
      jobId: job._id,
      fileUrl
    });

    lecture.status = 'processing';
    await lecture.save();

    return sendSuccess(res, {
      lectureId: lecture._id,
      jobId: job.jobId,
    }, 'Lecture initialized and queued for processing', 201);
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      return next(new AppError('Validation Error', HTTP_STATUS.BAD_REQUEST));
    }
    next(error);
  }
});

export default router;
