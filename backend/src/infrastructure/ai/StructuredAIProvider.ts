import { z } from 'zod';
import type {
  AIProvider,
  StructuredRequest,
  StructuredResult,
  TokenUsage,
} from '../../domain/ai/AIProvider';
import { AIProviderUnavailableError, AIResponseInvalidError } from '../../domain/errors';
import { logger } from '../../shared/logger';

const MAX_VALIDATION_ATTEMPTS = 2;
const MAX_NETWORK_ATTEMPTS = 3;
const BACKOFF_BASE_MS = 500;
const RETRYABLE_STATUS_MIN = 500;
const RATE_LIMITED_STATUS = 429;
const MAX_ERROR_SUMMARY_LENGTH = 400;

export interface RawModelResponse {
  text: string;
  usage: TokenUsage;
  model: string;
}

export interface ModelCall {
  request: StructuredRequest<unknown>;
  jsonSchema: Record<string, unknown>;
  correction: string | null;
}

export class ProviderHttpError extends Error {
  constructor(readonly status: number) {
    super(`Provider responded with status ${status}`);
    this.name = 'ProviderHttpError';
  }
}

function isRetryable(error: unknown): boolean {
  if (error instanceof ProviderHttpError) {
    return error.status === RATE_LIMITED_STATUS || error.status >= RETRYABLE_STATUS_MIN;
  }
  return error instanceof Error && (error.name === 'TimeoutError' || error.name === 'TypeError');
}

function sleep(milliseconds: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

function stripJsonFences(text: string): string {
  return text
    .trim()
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/, '');
}

export function toJsonSchema(schema: z.ZodType): Record<string, unknown> {
  const { $schema: _ignored, ...jsonSchema } = z.toJSONSchema(schema) as Record<string, unknown>;
  return jsonSchema;
}

export abstract class StructuredAIProvider implements AIProvider {
  abstract readonly providerName: string;

  protected constructor(private readonly sleepFn: (ms: number) => Promise<void> = sleep) {}

  protected abstract callModel(call: ModelCall): Promise<RawModelResponse>;

  async generateStructured<T>(request: StructuredRequest<T>): Promise<StructuredResult<T>> {
    const startedAt = Date.now();
    const jsonSchema = toJsonSchema(request.schema);
    const usage: TokenUsage = { inputTokens: 0, outputTokens: 0 };
    let correction: string | null = null;

    for (let attempt = 0; attempt < MAX_VALIDATION_ATTEMPTS; attempt += 1) {
      const raw = await this.callWithRetry({
        request: request as StructuredRequest<unknown>,
        jsonSchema,
        correction,
      });
      usage.inputTokens += raw.usage.inputTokens;
      usage.outputTokens += raw.usage.outputTokens;

      const parsed = this.parse(raw.text, request.schema);
      if (parsed.success) {
        return {
          data: parsed.data,
          provider: this.providerName,
          model: raw.model,
          usage,
          latencyMs: Date.now() - startedAt,
          cached: false,
        };
      }
      correction = parsed.error;
      logger.warn({ provider: this.providerName, attempt }, 'AI response failed validation');
    }

    throw new AIResponseInvalidError();
  }

  private parse<T>(
    text: string,
    schema: z.ZodType<T>,
  ): { success: true; data: T } | { success: false; error: string } {
    let json: unknown;
    try {
      json = JSON.parse(stripJsonFences(text));
    } catch {
      return { success: false, error: 'The response was not valid JSON.' };
    }
    const result = schema.safeParse(json);
    if (result.success) return { success: true, data: result.data };
    return {
      success: false,
      error: z.prettifyError(result.error).slice(0, MAX_ERROR_SUMMARY_LENGTH),
    };
  }

  private async callWithRetry(call: ModelCall): Promise<RawModelResponse> {
    for (let attempt = 0; attempt < MAX_NETWORK_ATTEMPTS; attempt += 1) {
      try {
        return await this.callModel(call);
      } catch (error) {
        const isLastAttempt = attempt === MAX_NETWORK_ATTEMPTS - 1;
        logger.warn(
          {
            provider: this.providerName,
            attempt,
            status: error instanceof ProviderHttpError ? error.status : undefined,
          },
          'AI provider call failed',
        );
        if (!isRetryable(error) || isLastAttempt) throw new AIProviderUnavailableError();
        await this.sleepFn(BACKOFF_BASE_MS * 2 ** attempt);
      }
    }
    throw new AIProviderUnavailableError();
  }
}
