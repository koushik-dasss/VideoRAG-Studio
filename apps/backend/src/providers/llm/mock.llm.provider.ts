/**
 * Mock LLM Provider — fully functional implementation that returns
 * deterministic responses. Used in tests and local development when
 * no real API keys are configured.
 */

import type { AppConfig } from '../../config/index';
import type {
  ILLMProvider,
  LLMCompletionRequest,
  LLMCompletionResponse,
} from '../../interfaces/index';
import { BaseProvider } from '../base.provider';

export class MockLLMProvider extends BaseProvider implements ILLMProvider {
  public readonly name = 'mock-llm';

  constructor(config: AppConfig) {
    super(config);
  }

  isAvailable(): Promise<boolean> {
    return Promise.resolve(true);
  }

  complete(request: LLMCompletionRequest): Promise<LLMCompletionResponse> {
    const isJson = request.responseFormat === 'json';
    const chaptersJson = JSON.stringify({
      chapters: [
        {
          index: 0,
          title: 'Introduction',
          summary: 'Opening section of the content',
          startTime: 0,
          endTime: 120,
          keywords: ['introduction', 'overview'],
        },
        {
          index: 1,
          title: 'Main Content',
          summary: 'Core discussion and key points',
          startTime: 120,
          endTime: 480,
          keywords: ['main', 'content', 'discussion'],
        },
        {
          index: 2,
          title: 'Conclusion',
          summary: 'Summary and closing remarks',
          startTime: 480,
          endTime: 600,
          keywords: ['conclusion', 'summary'],
        },
      ],
    });

    const content = isJson
      ? chaptersJson
      : 'This is a mock LLM response for testing purposes.';

    const promptTokens = Math.ceil(request.prompt.length / 4);
    const completionTokens = Math.ceil(content.length / 4);

    return Promise.resolve({
      content,
      model: this.name,
      tokensUsed: {
        prompt: promptTokens,
        completion: completionTokens,
        total: promptTokens + completionTokens,
      },
      finishReason: 'stop',
    });
  }
}
