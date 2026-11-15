import { describe, expect, it, vi } from 'vitest';
import { z } from 'zod';
import type { AIProvider, StructuredRequest } from '../../src/domain/ai/AIProvider';
import type { AiCacheRepository } from '../../src/domain/ai/repositories';
import { AIProviderUnavailableError, AIResponseInvalidError } from '../../src/domain/errors';
import { CachingAIProvider } from '../../src/infrastructure/ai/CachingAIProvider';
import { FallbackAIProvider } from '../../src/infrastructure/ai/FallbackAIProvider';
import { GeminiProvider } from '../../src/infrastructure/ai/GeminiProvider';
import { GroqProvider } from '../../src/infrastructure/ai/GroqProvider';

const schema = z.object({ answer: z.string() });

function buildRequest(overrides: Partial<StructuredRequest<{ answer: string }>> = {}) {
  return {
    systemPrompt: 'system',
    userPrompt: 'user',
    images: [{ mimeType: 'image/jpeg', base64Data: 'AAAA' }],
    schema,
    schemaName: 'test',
    promptVersion: 'v1',
    locale: 'en' as const,
    ...overrides,
  };
}

function geminiBody(text: string) {
  return {
    candidates: [{ content: { parts: [{ text }] } }],
    usageMetadata: { promptTokenCount: 10, candidatesTokenCount: 5 },
    modelVersion: 'gemini-test',
  };
}

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status });
}

function buildGemini(fetchFn: typeof fetch) {
  return new GeminiProvider({
    apiKey: 'test-key',
    model: 'gemini-test',
    maxOutputTokens: 100,
    timeoutMs: 1000,
    fetchFn,
    sleepFn: async () => undefined,
  });
}

describe('GeminiProvider', () => {
  it('returns validated data and reports token usage', async () => {
    const fetchFn = vi.fn().mockResolvedValue(jsonResponse(geminiBody('{"answer":"ok"}')));

    const result = await buildGemini(fetchFn).generateStructured(buildRequest());

    expect(result.data).toEqual({ answer: 'ok' });
    expect(result.usage).toEqual({ inputTokens: 10, outputTokens: 5 });
    expect(result.provider).toBe('gemini');
    expect(result.cached).toBe(false);
  });

  it('sends the key in a header, the image inline and a JSON schema', async () => {
    const fetchFn = vi.fn().mockResolvedValue(jsonResponse(geminiBody('{"answer":"ok"}')));

    await buildGemini(fetchFn).generateStructured(buildRequest());

    const [url, init] = fetchFn.mock.calls[0] as [string, RequestInit];
    const body = JSON.parse(init.body as string);
    expect(url).not.toContain('test-key');
    expect((init.headers as Record<string, string>)['x-goog-api-key']).toBe('test-key');
    expect(body.contents[0].parts[1].inlineData).toEqual({ mimeType: 'image/jpeg', data: 'AAAA' });
    expect(body.generationConfig.responseMimeType).toBe('application/json');
    expect(body.generationConfig.responseJsonSchema.properties.answer).toBeDefined();
  });

  it('retries once with the validation error appended when the first answer is invalid', async () => {
    const fetchFn = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse(geminiBody('{"wrong":1}')))
      .mockResolvedValueOnce(jsonResponse(geminiBody('{"answer":"fixed"}')));

    const result = await buildGemini(fetchFn).generateStructured(buildRequest());

    expect(result.data.answer).toBe('fixed');
    expect(result.usage.inputTokens).toBe(20);
    const secondBody = JSON.parse(
      (fetchFn.mock.calls[1] as [string, RequestInit])[1].body as string,
    );
    expect(secondBody.contents[0].parts[0].text).toContain('Your previous answer was invalid');
  });

  it('accepts JSON wrapped in a markdown code fence', async () => {
    const fetchFn = vi
      .fn()
      .mockResolvedValue(jsonResponse(geminiBody('```json\n{"answer":"fenced"}\n```')));

    const result = await buildGemini(fetchFn).generateStructured(buildRequest());

    expect(result.data.answer).toBe('fenced');
  });

  it('fails with a typed error after two invalid answers', async () => {
    const fetchFn = vi
      .fn()
      .mockImplementation(async () => jsonResponse(geminiBody('not json at all')));

    await expect(buildGemini(fetchFn).generateStructured(buildRequest())).rejects.toBeInstanceOf(
      AIResponseInvalidError,
    );
    expect(fetchFn).toHaveBeenCalledTimes(2);
  });

  it('retries temporary server errors and then succeeds', async () => {
    const fetchFn = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse({}, 503))
      .mockResolvedValueOnce(jsonResponse({}, 429))
      .mockResolvedValueOnce(jsonResponse(geminiBody('{"answer":"ok"}')));

    const result = await buildGemini(fetchFn).generateStructured(buildRequest());

    expect(result.data.answer).toBe('ok');
    expect(fetchFn).toHaveBeenCalledTimes(3);
  });

  it('does not retry client errors and hides provider details', async () => {
    const fetchFn = vi
      .fn()
      .mockImplementation(async () =>
        jsonResponse({ error: 'API key invalid: secret details' }, 400),
      );

    const failure = buildGemini(fetchFn).generateStructured(buildRequest());

    await expect(failure).rejects.toBeInstanceOf(AIProviderUnavailableError);
    await expect(failure).rejects.not.toThrow(/secret details/);
    expect(fetchFn).toHaveBeenCalledTimes(1);
  });
});

describe('GroqProvider', () => {
  it('sends an OpenAI compatible vision request in JSON mode', async () => {
    const fetchFn = vi.fn().mockResolvedValue(
      jsonResponse({
        model: 'groq-test',
        choices: [{ message: { content: '{"answer":"groq"}' } }],
        usage: { prompt_tokens: 7, completion_tokens: 3 },
      }),
    );
    const provider = new GroqProvider({
      apiKey: 'groq-key',
      model: 'groq-test',
      maxOutputTokens: 100,
      timeoutMs: 1000,
      fetchFn,
      sleepFn: async () => undefined,
    });

    const result = await provider.generateStructured(buildRequest());

    const [, init] = fetchFn.mock.calls[0] as [string, RequestInit];
    const body = JSON.parse(init.body as string);
    expect((init.headers as Record<string, string>).Authorization).toBe('Bearer groq-key');
    expect(body.response_format).toEqual({ type: 'json_object' });
    expect(body.messages[1].content[1].image_url.url).toBe('data:image/jpeg;base64,AAAA');
    expect(result.data.answer).toBe('groq');
    expect(result.usage).toEqual({ inputTokens: 7, outputTokens: 3 });
  });
});

describe('FallbackAIProvider', () => {
  function stubProvider(behavior: () => Promise<never> | Promise<unknown>): AIProvider {
    return { generateStructured: vi.fn(behavior) } as unknown as AIProvider;
  }

  it('uses the next provider when the first one is unavailable', async () => {
    const primary = stubProvider(() => Promise.reject(new AIProviderUnavailableError()));
    const backup = stubProvider(() => Promise.resolve({ data: { answer: 'backup' } }));

    const result = await new FallbackAIProvider([primary, backup]).generateStructured(
      buildRequest(),
    );

    expect(result.data.answer).toBe('backup');
  });

  it('raises the last error when every provider fails', async () => {
    const failing = () => stubProvider(() => Promise.reject(new AIProviderUnavailableError()));

    await expect(
      new FallbackAIProvider([failing(), failing()]).generateStructured(buildRequest()),
    ).rejects.toBeInstanceOf(AIProviderUnavailableError);
  });
});

describe('CachingAIProvider', () => {
  function inMemoryCache(): AiCacheRepository & { store: Map<string, unknown> } {
    const store = new Map<string, unknown>();
    return {
      store,
      get: async (key) => store.get(key) ?? null,
      set: async (key, payload) => {
        store.set(key, payload);
      },
    };
  }

  it('answers an identical request from the cache without calling the provider again', async () => {
    const inner = {
      generateStructured: vi.fn().mockResolvedValue({
        data: { answer: 'fresh' },
        provider: 'p',
        model: 'm',
        usage: { inputTokens: 1, outputTokens: 1 },
        latencyMs: 1,
        cached: false,
      }),
    } as unknown as AIProvider;
    const provider = new CachingAIProvider(inner, inMemoryCache());

    const first = await provider.generateStructured(buildRequest());
    const second = await provider.generateStructured(buildRequest());

    expect(first.cached).toBe(false);
    expect(second.cached).toBe(true);
    expect(second.data.answer).toBe('fresh');
    expect(inner.generateStructured).toHaveBeenCalledTimes(1);
  });

  it('does not share cache entries across languages or prompt versions', async () => {
    const inner = {
      generateStructured: vi.fn().mockResolvedValue({
        data: { answer: 'x' },
        provider: 'p',
        model: 'm',
        usage: { inputTokens: 0, outputTokens: 0 },
        latencyMs: 1,
        cached: false,
      }),
    } as unknown as AIProvider;
    const provider = new CachingAIProvider(inner, inMemoryCache());

    await provider.generateStructured(buildRequest());
    await provider.generateStructured(buildRequest({ locale: 'es' }));
    await provider.generateStructured(buildRequest({ promptVersion: 'v2' }));

    expect(inner.generateStructured).toHaveBeenCalledTimes(3);
  });
});
