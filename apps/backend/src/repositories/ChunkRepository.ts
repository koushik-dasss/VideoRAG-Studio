import type { IChunk } from '../models/Chunk';
import { Chunk } from '../models/Chunk';
import type { PipelineStage } from 'mongoose';
import { getConfig } from '../config';

export class ChunkRepository {
  async searchChunks(queryVector: number[], lectureId?: string, limit: number = 5): Promise<IChunk[]> {
    const config = getConfig();
    const indexName = config.mongodb.vectorSearchIndexName;

    const searchPipeline: Record<string, unknown>[] = [
      {
        $vectorSearch: {
          index: indexName,
          path: "embedding",
          queryVector: queryVector,
          numCandidates: limit * 10,
          limit: limit,
        }
      }
    ];

    if (lectureId) {
      (searchPipeline[0] as { $vectorSearch: Record<string, unknown> }).$vectorSearch.filter = { lectureId: { $eq: lectureId } };
    }

    searchPipeline.push({
      $project: {
        _id: 1,
        lectureId: 1,
        text: 1,
        startTime: 1,
        endTime: 1,
        score: { $meta: "vectorSearchScore" }
      }
    });

    try {
      return await Chunk.aggregate(searchPipeline as unknown as PipelineStage[]);
    } catch (err: unknown) {
      // Local MongoDB doesn't support $vectorSearch. Fallback to basic find for local testing.
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes('only allowed on MongoDB Atlas') || msg.includes('vectorSearch')) {
        const query: Record<string, unknown> = {};
        if (lectureId) {
          query.lectureId = lectureId;
        }
        return await Chunk.find(query).limit(limit).lean() as unknown as IChunk[];
      }
      throw new Error(`Vector search failed on index '${indexName}': ${msg}`);
    }
  }
}
