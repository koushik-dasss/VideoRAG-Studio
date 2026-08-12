import { Router } from 'express';
import { z } from 'zod';
import { EmbeddingService } from '../../services/embedding.service';
import { getConfig } from '../../config/index';
import { EmbeddingProviderFactory } from '../../providers/factory/provider.factory';
import { ChunkRepository } from '../../repositories/ChunkRepository';
import { sendSuccess } from '../../utils/response';

const config = getConfig();
const embeddingFactory = new EmbeddingProviderFactory(config);
const embeddingService = new EmbeddingService(embeddingFactory.create(config.embeddingProvider || 'local'));
const chunkRepository = new ChunkRepository();

const router = Router();

const searchSchema = z.object({
  query: z.string().min(1),
  lectureId: z.string().optional(),
  limit: z.number().min(1).max(50).default(5),
});

router.post('/', async (req, res, next) => {
  try {
    const { query, lectureId, limit } = searchSchema.parse(req.body);

    // 1. Generate query embedding
    const queryEmbeddings = await embeddingService.embedBatch([query]);
    const queryVector = queryEmbeddings[0]?.vector;

    if (!queryVector || queryVector.length === 0) {
      return next(new Error('Failed to generate embedding for query'));
    }

    // 2. Perform MongoDB Atlas Vector Search
    const results = await chunkRepository.searchChunks(queryVector, lectureId, limit);

    return sendSuccess(res, { results });
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ success: false, message: 'Validation Error', errors: error.errors });
    }
    next(error);
  }
});

export default router;
