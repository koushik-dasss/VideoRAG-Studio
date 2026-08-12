import type { Job } from 'bullmq';
import { Worker } from 'bullmq';
import { getBullMqConnectionOptions } from '../utils/redis';
import fs from 'fs';
import type { IProcessingJob } from '../models/ProcessingJob';
import { ProcessingJob } from '../models/ProcessingJob';
import { Lecture } from '../models/Lecture';
import { Chunk } from '../models/Chunk';
import { PipelineOrchestrator } from '../pipeline';
import { SpeechProviderFactory, LLMProviderFactory, EmbeddingProviderFactory } from '../providers/factory/provider.factory';
import { SpeechRecognitionService } from '../services/speech.recognition.service';
import { TranscriptCleaningService } from '../services/transcript.cleaning.service';
import { SemanticChunkingService } from '../services/semantic.chunking.service';
import { ChapterGenerationService } from '../services/chapter.generation.service';
import { EmbeddingService } from '../services/embedding.service';
import { PromptTemplateEngine } from '../services/prompt.template.engine';
import { VideoMetadataService } from '../services/video.metadata.service';
import { EventEmitterEventBus } from '../events';
import { PIPELINE_EVENTS } from '../constants';
import { getConfig } from '../config';
import path from 'path';

const STAGE_PROGRESS_MAP: Record<string, number> = {
  'queued': 0,
  'upload': 2,
  'metadata': 5,
  'audio_extraction': 10,
  'transcription': 20,
  'transcript_cleaning': 40,
  'semantic_chunking': 50,
  'embedding_generation': 60,
  'vector_indexing': 70,
  'chapter_generation': 80,
  'summary_generation': 85,
  'keyword_extraction': 90,
  'completed': 100,
  'failed': 0,
};

const STAGE_PROGRESS_END: Record<string, number> = {
  'transcription': 40,
  'transcript_cleaning': 50,
  'semantic_chunking': 60,
  'embedding_generation': 70,
  'vector_indexing': 80,
  'chapter_generation': 85,
  'summary_generation': 90,
  'keyword_extraction': 100,
};

class JobEventBus extends EventEmitterEventBus {
  constructor(private jobId: string) {
    super();
  }
  async emitAsync<T = unknown>(eventName: string, payload: T): Promise<boolean> {
    const result = super.emit(eventName, payload);
    try {
      const job = await ProcessingJob.findById(this.jobId);
      if (!job) return result;

      switch (eventName) {
        case PIPELINE_EVENTS.STAGE_STARTED:
          job.currentStage = (payload as { stage: string }).stage;
          job.status = 'processing';
          job.progressPercentage = STAGE_PROGRESS_MAP[job.currentStage] || job.progressPercentage;
          break;
        case PIPELINE_EVENTS.PROGRESS_UPDATED: {
          const update = payload as { stage: string; percentage: number };
          job.currentStage = update.stage;
          job.status = 'processing';

          const start = STAGE_PROGRESS_MAP[update.stage] || 0;
          const end = STAGE_PROGRESS_END[update.stage] || start;

          if (end > start) {
            const incremental = (end - start) * (update.percentage / 100);
            job.progressPercentage = Math.round(start + incremental);
          }
          break;
        }
        case PIPELINE_EVENTS.PIPELINE_FAILED:
          job.status = 'failed';
          job.errorMessages.push((payload as { error: string }).error);
          break;
        case PIPELINE_EVENTS.PIPELINE_COMPLETED:
          job.status = 'completed';
          job.currentStage = 'completed';
          job.progressPercentage = 100;
          job.finishedTime = new Date();
          break;
      }
      await job.save();
    } catch (err) {
      // Allow throwing so the caller knows the DB update failed
      throw err;
    }
    return result;
  }

  emit<T = unknown>(eventName: string, payload: T): boolean {
    // We intentionally ignore the promise for synchronous `emit` compatibility,
    // but the system should use `emitAsync` for critical state.
    void this.emitAsync(eventName, payload).catch(() => {});
    return true;
  }
}

export const startWorker = (): Worker => {
  const { connection } = getBullMqConnectionOptions(getConfig().cache.redisUrl);

  const worker = new Worker('video-processing', async (job: Job) => {
    const { lectureId, jobId, fileUrl } = job.data as { lectureId: string; jobId: string; fileUrl: string };
    
    const dbJob = await ProcessingJob.findById(jobId);
    if (dbJob) {
      dbJob.status = 'processing';
      dbJob.startedTime = new Date();
      await dbJob.save();
    }

    try {
      const config = getConfig();
      const speechFactory = new SpeechProviderFactory(config);
      const speechProvider = speechFactory.create(config.speechProvider || 'faster-whisper');
        
      const embeddingFactory = new EmbeddingProviderFactory(config);
      const embeddingProvider = embeddingFactory.create(config.embeddingProvider || 'local');
        
      const llmFactory = new LLMProviderFactory(config);
      const llmProvider = llmFactory.create(config.llmProvider || 'gemini');

      const speechService = new SpeechRecognitionService(config, speechFactory);
      const cleaningService = new TranscriptCleaningService();
      const chunkingService = new SemanticChunkingService();
      const templateEngine = new PromptTemplateEngine();
      const chapterService = new ChapterGenerationService(llmProvider, templateEngine);
      const embeddingService = new EmbeddingService(embeddingProvider);
      const metadataService = new VideoMetadataService();

      const eventBus = new JobEventBus(jobId);

      const orchestrator = new PipelineOrchestrator({
        speechRecognitionService: speechService,
        transcriptCleaningService: cleaningService,
        semanticChunkingService: chunkingService,
        chapterGenerationService: chapterService,
        embeddingService,
        eventBus
      });

      let videoPath = path.join(process.cwd(), fileUrl);
      if (!fs.existsSync(videoPath)) {
        const altPath = path.join(process.cwd(), 'apps/backend', fileUrl);
        if (fs.existsSync(altPath)) {
          videoPath = altPath;
        }
      }
      const { EventService } = require('../services/EventService');
      const eventService = new EventService();
      await eventService.emit('VIDEO_PROCESSING_STARTED', '64a1b2c3d4e5f6a7b8c9d0e1', lectureId, jobId, 'info');
      
      // 1. Extract Metadata
      await eventBus.emitAsync(PIPELINE_EVENTS.STAGE_STARTED, { stage: 'metadata' });
      const metadata = await metadataService.extractMetadata(videoPath);
      await eventBus.emitAsync(PIPELINE_EVENTS.STAGE_COMPLETED, { stage: 'metadata' });
      const uploadsDir = path.dirname(videoPath);
      const thumbFilename = await metadataService.generateThumbnail(videoPath, uploadsDir);
      const thumbUrl = `/uploads/videos/${thumbFilename}`;
      
      // 2. Extract Audio
      await eventBus.emitAsync(PIPELINE_EVENTS.STAGE_STARTED, { stage: 'audio_extraction' });
      const audioFilename = `audio-${path.basename(videoPath, path.extname(videoPath))}.wav`;
      const audioPath = path.join(uploadsDir, audioFilename);
      await metadataService.extractAudio(videoPath, audioPath);

      await eventBus.emitAsync(PIPELINE_EVENTS.STAGE_COMPLETED, { stage: 'audio_extraction' });

      // Execute NLP Pipeline
      const output = await orchestrator.execute({
        audioPath,
        language: 'en'
      });

      const chunksToSave = output.chunkedSegments.map((segmentGroup, index) => {
        const text = segmentGroup.map(s => s.text).join(' ');
        const startTime = segmentGroup[0].startTime;
        const endTime = segmentGroup[segmentGroup.length - 1].endTime;
        return {
          lectureId,
          text,
          startTime,
          endTime,
          embedding: output.embeddings[index]?.vector || [],
          metadata: { index }
        };
      });

      if (chunksToSave.length > 0) {
        await eventBus.emitAsync(PIPELINE_EVENTS.STAGE_STARTED, { stage: 'vector_indexing' });
        await Chunk.insertMany(chunksToSave);
        await eventBus.emitAsync(PIPELINE_EVENTS.STAGE_COMPLETED, { stage: 'vector_indexing' });
      }

      const lecture = await Lecture.findById(lectureId);
      if (lecture) {
        lecture.status = 'done';
        
        // Metadata
        lecture.duration = metadata.duration || output.transcription.durationSeconds || 0;
        lecture.width = metadata.width;
        lecture.height = metadata.height;
        lecture.resolution = metadata.resolution;
        lecture.videoCodec = metadata.videoCodec;
        lecture.audioCodec = metadata.audioCodec;
        lecture.fps = metadata.fps;
        lecture.bitrate = metadata.bitrate;
        lecture.sampleRate = metadata.sampleRate;
        lecture.channels = metadata.channels;
        lecture.container = metadata.container;
        lecture.sizeBytes = metadata.sizeBytes;
        lecture.thumbnailUrl = thumbUrl;
        
        lecture.rawTranscript = output.transcription.fullText;
        lecture.timeline = output.cleanedSegments.map(s => ({
          start: s.startTime,
          end: s.endTime,
          text: s.text
        }));
        lecture.chapters = output.chapters.map(c => ({
          title: c.title,
          summary: c.summary,
          startTime: c.startTime,
          endTime: c.endTime
        }));
        await lecture.save();
        await eventService.emit('VIDEO_COMPLETED', '64a1b2c3d4e5f6a7b8c9d0e1', lectureId, jobId, 'success', { durationMs: Date.now() - (dbJob?.startedTime?.getTime() || Date.now()) });
      }

    } catch (error: unknown) {
      // console.error(error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      const dbJobError = await ProcessingJob.findById(jobId);
      if (dbJobError) {
        dbJobError.status = 'failed';
        dbJobError.errorMessages.push(errorMessage);
        await dbJobError.save();
      }
      
      const lectureError = await Lecture.findById(lectureId);
      if (lectureError) {
        lectureError.status = 'failed';
        await lectureError.save();
      }
      const { EventService } = require('../services/EventService');
      const eventService = new EventService();
      await eventService.emit('VIDEO_FAILED', '64a1b2c3d4e5f6a7b8c9d0e1', lectureId, jobId, 'error', { error: errorMessage });
      throw error;
    }
  }, { connection, lockDuration: 600000 });

  worker.on('failed', (_job, _err) => {
    // console.error(`Job ${_job?.id} failed with error ${_err.message}`);
  });
  
  worker.on('completed', (_job) => {
    // console.log(`Job ${_job.id} completed successfully`);
  });

  return worker;
};
