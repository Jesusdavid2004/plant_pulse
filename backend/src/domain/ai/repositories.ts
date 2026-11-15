import type { TokenUsage } from './AIProvider';

export interface AiUsageEntry extends TokenUsage {
  userId: string;
  provider: string;
  model: string;
  promptVersion: string;
  latencyMs: number;
}

export interface AiUsageRepository {
  record(entry: AiUsageEntry): Promise<void>;
  countSince(userId: string, since: Date): Promise<number>;
}

export interface ProcessedImage {
  buffer: Buffer;
  mimeType: string;
}

export interface ImageProcessor {
  sanitize(input: Buffer): Promise<ProcessedImage>;
}

export interface ImageStorage {
  save(image: ProcessedImage): Promise<string>;
  read(storageKey: string): Promise<Buffer>;
  remove(storageKey: string): Promise<void>;
}

export interface AiCacheRepository {
  get(key: string): Promise<unknown | null>;
  set(key: string, payload: unknown): Promise<void>;
}
