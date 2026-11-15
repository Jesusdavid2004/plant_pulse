import type { ZodType } from 'zod';
import type { Locale } from '../../shared/constants';

export interface AIImageInput {
  mimeType: string;
  base64Data: string;
}

export interface StructuredRequest<T> {
  systemPrompt: string;
  userPrompt: string;
  images: AIImageInput[];
  schema: ZodType<T>;
  schemaName: string;
  promptVersion: string;
  locale: Locale;
}

export interface TokenUsage {
  inputTokens: number;
  outputTokens: number;
}

export interface StructuredResult<T> {
  data: T;
  provider: string;
  model: string;
  usage: TokenUsage;
  latencyMs: number;
  cached: boolean;
}

export interface AIProvider {
  generateStructured<T>(request: StructuredRequest<T>): Promise<StructuredResult<T>>;
}
