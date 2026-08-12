import { GeminiLLMProvider } from '../providers/llm/gemini.llm.provider';
import { getConfig } from '../config';
import { createLogger } from '../utils/logger';
import { AppError } from '../errors';
import { HTTP_STATUS } from '../constants';

const log = createLogger('AssistantService');

export interface ChatHistoryItem {
  role: 'user' | 'assistant';
  text: string;
}

const SYSTEM_PROMPT = `You are the AI Help Assistant for an AI Video Processing Platform.

Your job is to help users understand and operate the platform.

The platform provides:
- Video upload
- AI video processing
- Speech transcription (Faster-Whisper)
- Transcript generation & timeline navigation
- Semantic chunking
- Vector embeddings (Ollama nomic-embed-text)
- MongoDB Atlas Vector Search
- AI-generated chapters (Gemini 3.5 Flash)
- AI-generated summaries
- Keyword extraction
- Video library management
- Studio page with video player & interactive transcript/chapters
- Semantic search (natural language query to video timestamp)
- Processing status monitoring
- Dashboard analytics

Give clear, practical, step-by-step guidance.
If the user asks how to use a feature, explain the exact UI steps when known.
If the user reports an error, help diagnose it.
Never claim that an operation succeeded unless the application actually reports that it succeeded.
Never fabricate database records, processing results, or system status.
If you don't know something about the current application, say so clearly.
Do not expose API keys, passwords, credentials, internal secrets, or private configuration.
Keep answers concise, friendly, and structured using clean markdown bullet points or bold text.`;

export class AssistantService {
  async chat(message: string, history: ChatHistoryItem[] = []): Promise<string> {
    if (!message || typeof message !== 'string' || !message.trim()) {
      throw new AppError('Message text is required', HTTP_STATUS.BAD_REQUEST);
    }

    const config = getConfig();
    const llmProvider = new GeminiLLMProvider(config);

    let fullPrompt = '';

    // Include recent history for context (up to last 8 turns)
    if (Array.isArray(history) && history.length > 0) {
      const recentHistory = history
        .slice(-8)
        .filter((item) => item && typeof item.text === 'string' && item.text.trim())
        .map((item) => `${item.role === 'user' ? 'User' : 'Assistant'}: ${item.text.trim()}`)
        .join('\n');

      if (recentHistory) {
        fullPrompt += `Previous conversation history:\n${recentHistory}\n\n`;
      }
    }

    fullPrompt += `User Question: ${message.trim()}`;

    log.info('Generating AI help response using Gemini LLM provider', {
      historyLength: history.length,
      promptLength: fullPrompt.length,
    });

    try {
      const response = await llmProvider.complete({
        prompt: fullPrompt,
        systemPrompt: SYSTEM_PROMPT,
        temperature: 0.4,
        maxTokens: 1024,
      });

      if (!response || !response.content || !response.content.trim()) {
        throw new AppError('Gemini returned an empty response', HTTP_STATUS.INTERNAL_SERVER_ERROR);
      }

      return response.content.trim();
    } catch (err: any) {
      log.error('Assistant chat completion failed', { error: err.message });
      throw err;
    }
  }
}
