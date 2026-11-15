import { randomUUID } from 'node:crypto';
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import type { ImageStorage, ProcessedImage } from '../../domain/ai/repositories';

const EXTENSION_BY_MIME_TYPE: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
};
const SAFE_KEY_PATTERN = /^[a-f0-9-]{36}\.(jpg|png|webp)$/;

export class LocalImageStorage implements ImageStorage {
  constructor(private readonly directory: string) {}

  async save(image: ProcessedImage): Promise<string> {
    await mkdir(this.directory, { recursive: true });
    const key = `${randomUUID()}${EXTENSION_BY_MIME_TYPE[image.mimeType] ?? '.jpg'}`;
    await writeFile(this.resolve(key), image.buffer);
    return key;
  }

  read(storageKey: string): Promise<Buffer> {
    return readFile(this.resolve(storageKey));
  }

  async remove(storageKey: string): Promise<void> {
    await rm(this.resolve(storageKey), { force: true });
  }

  private resolve(storageKey: string): string {
    if (!SAFE_KEY_PATTERN.test(storageKey)) throw new Error('Invalid storage key');
    return path.join(this.directory, storageKey);
  }
}
