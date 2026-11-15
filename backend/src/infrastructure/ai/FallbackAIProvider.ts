import type { AIProvider, StructuredRequest, StructuredResult } from '../../domain/ai/AIProvider';
import { AIProviderUnavailableError } from '../../domain/errors';
import { logger } from '../../shared/logger';

export class FallbackAIProvider implements AIProvider {
  constructor(private readonly providers: readonly AIProvider[]) {}

  async generateStructured<T>(request: StructuredRequest<T>): Promise<StructuredResult<T>> {
    for (const [index, provider] of this.providers.entries()) {
      try {
        return await provider.generateStructured(request);
      } catch (error) {
        const isLast = index === this.providers.length - 1;
        logger.warn({ providerIndex: index }, 'AI provider failed, trying the next one');
        if (isLast) throw error;
      }
    }
    throw new AIProviderUnavailableError();
  }
}
