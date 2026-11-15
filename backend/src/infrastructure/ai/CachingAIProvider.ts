import { createHash } from 'node:crypto';
import type { AIProvider, StructuredRequest, StructuredResult } from '../../domain/ai/AIProvider';
import type { AiCacheRepository } from '../../domain/ai/repositories';

const CACHE_PROVIDER_NAME = 'cache';

export function buildCacheKey(request: StructuredRequest<unknown>): string {
  const hash = createHash('sha256');
  hash.update(`${request.promptVersion}|${request.schemaName}|${request.locale}`);
  for (const image of request.images) hash.update(`|${image.mimeType}|${image.base64Data}`);
  return hash.digest('hex');
}

export class CachingAIProvider implements AIProvider {
  constructor(
    private readonly inner: AIProvider,
    private readonly cache: AiCacheRepository,
  ) {}

  async generateStructured<T>(request: StructuredRequest<T>): Promise<StructuredResult<T>> {
    const key = buildCacheKey(request as StructuredRequest<unknown>);
    const startedAt = Date.now();

    const cachedPayload = await this.cache.get(key);
    if (cachedPayload !== null) {
      const parsed = request.schema.safeParse(cachedPayload);
      if (parsed.success) {
        return {
          data: parsed.data,
          provider: CACHE_PROVIDER_NAME,
          model: CACHE_PROVIDER_NAME,
          usage: { inputTokens: 0, outputTokens: 0 },
          latencyMs: Date.now() - startedAt,
          cached: true,
        };
      }
    }

    const result = await this.inner.generateStructured(request);
    await this.cache.set(key, result.data);
    return result;
  }
}
