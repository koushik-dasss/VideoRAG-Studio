/**
 * Input validation schemas using Joi.
 *
 * Each schema validates the corresponding DTO before it reaches any
 * service layer. The validate() helper throws a typed ValidationError
 * on failure so the error middleware can return structured field errors.
 */

import Joi from 'joi';

import { AI_PROVIDERS } from '../constants/index';
import { ValidationError } from '../errors/index';
import type {
  CreateVideoRequestDto,
  StartPipelineRequestDto,
  SearchRequestDto,
} from '../dto/index';

// ──────────────────────────────────────────────────────────────────────────────
// Generic validator
// ──────────────────────────────────────────────────────────────────────────────

export function validate<T>(schema: Joi.ObjectSchema<T>, data: unknown): T {
  const result = schema.validate(data, {
    abortEarly: false,
    stripUnknown: true,
  });

  if (result.error) {
    const fields: Record<string, string[]> = {};
    for (const detail of result.error.details) {
      const key = detail.path.join('.');
      if (!fields[key]) {
        fields[key] = [];
      }
      fields[key].push(detail.message);
    }
    throw new ValidationError('Validation failed', fields);
  }

  return result.value;
}

// ──────────────────────────────────────────────────────────────────────────────
// Video validation
// ──────────────────────────────────────────────────────────────────────────────

export const createVideoSchema = Joi.object<CreateVideoRequestDto>({
  filePath: Joi.string().trim().min(1).max(1024).required().messages({
    'string.empty': 'File path is required',
    'string.max': 'File path must not exceed 1024 characters',
  }),
  title: Joi.string().trim().min(1).max(256).required().messages({
    'string.empty': 'Title is required',
    'string.max': 'Title must not exceed 256 characters',
  }),
  description: Joi.string().trim().max(2048).optional(),
  language: Joi.string()
    .trim()
    .pattern(/^[a-z]{2}(-[A-Z]{2})?$/)
    .optional()
    .messages({
      'string.pattern.base': 'Language must be an ISO 639-1 code (e.g., en, en-US)',
    }),
  tags: Joi.array().items(Joi.string().trim().min(1).max(64)).max(20).optional(),
}).required();

export function validateCreateVideo(data: unknown): CreateVideoRequestDto {
  return validate(createVideoSchema, data);
}

// ──────────────────────────────────────────────────────────────────────────────
// Pipeline validation
// ──────────────────────────────────────────────────────────────────────────────

const aiProviderValues = Object.values(AI_PROVIDERS);

export const startPipelineSchema = Joi.object<StartPipelineRequestDto>({
  videoId: Joi.string().trim().uuid({ version: 'uuidv4' }).required().messages({
    'string.guid': 'Video ID must be a valid UUID v4',
    'string.empty': 'Video ID is required',
  }),
  provider: Joi.string()
    .valid(...aiProviderValues)
    .default(AI_PROVIDERS.GEMINI)
    .messages({
      'any.only': `Provider must be one of: ${aiProviderValues.join(', ')}`,
    }),
  options: Joi.object({
    language: Joi.string().trim().optional(),
    maxChapters: Joi.number().integer().min(1).max(100).optional(),
    minChapterDurationSeconds: Joi.number().integer().min(10).max(600).optional(),
    generateEmbeddings: Joi.boolean().optional().default(true),
    skipStages: Joi.array().items(Joi.string()).optional(),
  }).optional(),
}).required();

export function validateStartPipeline(data: unknown): StartPipelineRequestDto {
  return validate(startPipelineSchema, data);
}

// ──────────────────────────────────────────────────────────────────────────────
// Search validation
// ──────────────────────────────────────────────────────────────────────────────

export const searchRequestSchema = Joi.object<SearchRequestDto>({
  query: Joi.string().trim().min(1).max(512).required().messages({
    'string.empty': 'Search query is required',
    'string.max': 'Search query must not exceed 512 characters',
  }),
  videoId: Joi.string().trim().uuid({ version: 'uuidv4' }).optional(),
  limit: Joi.number().integer().min(1).max(100).optional().default(10),
  threshold: Joi.number().min(0).max(1).optional().default(0.5),
}).required();

export function validateSearchRequest(data: unknown): SearchRequestDto {
  return validate(searchRequestSchema, data);
}

// ──────────────────────────────────────────────────────────────────────────────
// ID validation (reusable)
// ──────────────────────────────────────────────────────────────────────────────

export const uuidSchema = Joi.string().trim().uuid({ version: 'uuidv4' }).required();

export function validateId(id: unknown): string {
  const result = uuidSchema.validate(id);
  if (result.error) {
    throw new ValidationError('Invalid ID format', {
      id: [result.error.details[0]?.message ?? 'Must be a valid UUID v4'],
    });
  }
  return result.value;
}
