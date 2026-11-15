import type { AIProvider } from '../../domain/ai/AIProvider';
import type { AiCacheRepository } from '../../domain/ai/repositories';
import type { AppConfig } from '../../shared/config';
import { CachingAIProvider } from './CachingAIProvider';
import { FakeAIProvider } from './FakeAIProvider';
import { FallbackAIProvider } from './FallbackAIProvider';
import { GeminiProvider } from './GeminiProvider';
import { GroqProvider } from './GroqProvider';

type ProviderName = 'gemini' | 'groq' | 'fake' | 'none';

function buildProvider(name: ProviderName, config: AppConfig): AIProvider | null {
  const { ai } = config;
  switch (name) {
    case 'gemini':
      return new GeminiProvider({
        apiKey: ai.geminiApiKey,
        model: ai.geminiModel,
        maxOutputTokens: ai.maxOutputTokens,
        timeoutMs: ai.timeoutMs,
      });
    case 'groq':
      return new GroqProvider({
        apiKey: ai.groqApiKey,
        model: ai.groqModel,
        maxOutputTokens: ai.maxOutputTokens,
        timeoutMs: ai.timeoutMs,
      });
    case 'fake':
      return new FakeAIProvider();
    case 'none':
      return null;
  }
}

export function createAIProvider(config: AppConfig, cache: AiCacheRepository): AIProvider {
  const providers = [config.ai.provider, config.ai.fallbackProvider]
    .map((name) => buildProvider(name, config))
    .filter((provider): provider is AIProvider => provider !== null);

  const chain = providers.length === 1 ? providers[0]! : new FallbackAIProvider(providers);
  return new CachingAIProvider(chain, cache);
}
